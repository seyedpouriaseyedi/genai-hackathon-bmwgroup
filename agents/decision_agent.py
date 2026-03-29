from __future__ import annotations

from typing import Any

import pandas as pd

from agents.scenario_agent import get_scenario_config, validate_scenario_name


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        if pd.isna(value):
            return default
        return float(value)
    except Exception:
        return default


def _pretty_feature_name(feature_name: str) -> str:
    text = feature_name.replace("competency_", "").replace("_", " ").strip()
    return text.title()


def _get_top_candidate_row(ranked_df: pd.DataFrame) -> pd.Series:
    if ranked_df.empty:
        raise ValueError("ranked_df is empty.")
    return ranked_df.iloc[0]


def _get_runner_up_row(ranked_df: pd.DataFrame) -> pd.Series | None:
    if len(ranked_df) < 2:
        return None
    return ranked_df.iloc[1]


def _get_feature_weights(
    scenario_name: str,
    artifacts: dict[str, Any] | None = None,
) -> dict[str, float]:
    if artifacts is not None and "feature_weights" in artifacts:
        return {
            str(k): _to_float(v)
            for k, v in dict(artifacts["feature_weights"]).items()
        }

    scenario_cfg = get_scenario_config(scenario_name)
    focus = scenario_cfg["focus_competencies"]
    n = len(focus)
    if n == 0:
        return {}
    equal_weight = 1.0 / n
    return {feature: equal_weight for feature in focus}


def _build_top_strengths(
    candidate_row: pd.Series,
    feature_weights: dict[str, float],
    top_k: int = 3,
) -> list[dict[str, Any]]:
    strengths: list[dict[str, Any]] = []

    for feature, weight in feature_weights.items():
        if feature not in candidate_row.index:
            continue
        raw_score = _to_float(candidate_row[feature])
        weighted_contribution = raw_score * weight
        strengths.append(
            {
                "feature": feature,
                "label": _pretty_feature_name(feature),
                "score": round(raw_score, 2),
                "weight": round(weight, 4),
                "weighted_contribution": round(weighted_contribution, 2),
            }
        )

    strengths.sort(key=lambda x: x["weighted_contribution"], reverse=True)
    return strengths[:top_k]


def _build_tradeoffs(
    top_candidate_row: pd.Series,
    runner_up_row: pd.Series | None,
    feature_weights: dict[str, float],
    top_k: int = 2,
) -> list[dict[str, Any]]:
    tradeoffs: list[dict[str, Any]] = []

    if runner_up_row is None:
        return tradeoffs

    comparisons: list[dict[str, Any]] = []
    for feature, weight in feature_weights.items():
        if feature not in top_candidate_row.index or feature not in runner_up_row.index:
            continue

        top_value = _to_float(top_candidate_row[feature])
        runner_value = _to_float(runner_up_row[feature])
        delta = round(top_value - runner_value, 2)

        comparisons.append(
            {
                "feature": feature,
                "label": _pretty_feature_name(feature),
                "top_candidate_score": round(top_value, 2),
                "runner_up_score": round(runner_value, 2),
                "delta": delta,
                "weight": round(weight, 4),
                "weighted_delta": round(delta * weight, 2),
            }
        )

    # Tradeoffs are the scenario-relevant features where the winner is weaker than runner-up
    weaker = [row for row in comparisons if row["delta"] < 0]
    weaker.sort(key=lambda x: abs(x["weighted_delta"]), reverse=True)

    for row in weaker[:top_k]:
        tradeoffs.append(
            {
                "feature": row["feature"],
                "label": row["label"],
                "detail": (
                    f"The top candidate scores {abs(row['delta']):.2f} points lower than "
                    f"the runner-up on {row['label']}."
                ),
                "top_candidate_score": row["top_candidate_score"],
                "runner_up_score": row["runner_up_score"],
                "delta": row["delta"],
            }
        )

    return tradeoffs


def _build_strength_comparison(
    top_candidate_row: pd.Series,
    runner_up_row: pd.Series | None,
    feature_weights: dict[str, float],
    top_k: int = 3,
) -> list[dict[str, Any]]:
    advantages: list[dict[str, Any]] = []

    if runner_up_row is None:
        return advantages

    for feature, weight in feature_weights.items():
        if feature not in top_candidate_row.index or feature not in runner_up_row.index:
            continue

        top_value = _to_float(top_candidate_row[feature])
        runner_value = _to_float(runner_up_row[feature])
        delta = round(top_value - runner_value, 2)

        if delta <= 0:
            continue

        advantages.append(
            {
                "feature": feature,
                "label": _pretty_feature_name(feature),
                "top_candidate_score": round(top_value, 2),
                "runner_up_score": round(runner_value, 2),
                "delta": delta,
                "weight": round(weight, 4),
                "weighted_delta": round(delta * weight, 2),
            }
        )

    advantages.sort(key=lambda x: x["weighted_delta"], reverse=True)
    return advantages[:top_k]


def _build_what_if_insight(
    what_if_df: pd.DataFrame | None,
    candidate_id: Any,
) -> dict[str, Any] | None:
    if what_if_df is None or what_if_df.empty:
        return None

    candidate_what_if = what_if_df.loc[what_if_df["candidate_id"] == candidate_id].copy()
    if candidate_what_if.empty:
        return None

    if "delta_vs_baseline" not in candidate_what_if.columns:
        return None

    candidate_what_if["delta_vs_baseline"] = pd.to_numeric(
        candidate_what_if["delta_vs_baseline"],
        errors="coerce",
    )
    candidate_what_if = candidate_what_if.dropna(subset=["delta_vs_baseline"])
    if candidate_what_if.empty:
        return None

    best_row = candidate_what_if.sort_values("delta_vs_baseline", ascending=False).iloc[0]

    intervention_label = (
        best_row["intervention"]
        if "intervention" in candidate_what_if.columns
        else str(best_row.get("interventions", "Intervention"))
    )

    return {
        "best_intervention": intervention_label,
        "delta_vs_baseline": round(_to_float(best_row["delta_vs_baseline"]), 2),
        "baseline_target": round(_to_float(best_row.get("baseline_target")), 2),
        "simulated_target": round(
            _to_float(
                best_row.get("simulated_target", best_row.get("simulated_target_mean"))
            ),
            2,
        ),
        "text": (
            f"The strongest what-if improvement for the recommended candidate is "
            f"{intervention_label}, which changes the predicted scenario outcome by "
            f"{_to_float(best_row['delta_vs_baseline']):.2f} points."
        ),
    }


def _build_summary_text(
    scenario_name: str,
    candidate_name: str,
    predicted_outcome: float,
    alignment_score: float | None,
    top_strengths: list[dict[str, Any]],
) -> str:
    if not top_strengths:
        return (
            f"{candidate_name} ranks first for {scenario_name} with a predicted "
            f"scenario outcome of {predicted_outcome:.2f}."
        )

    strength_labels = [item["label"] for item in top_strengths[:3]]
    if len(strength_labels) == 1:
        strengths_text = strength_labels[0]
    elif len(strength_labels) == 2:
        strengths_text = f"{strength_labels[0]} and {strength_labels[1]}"
    else:
        strengths_text = (
            f"{strength_labels[0]}, {strength_labels[1]}, and {strength_labels[2]}"
        )

    if alignment_score is None:
        return (
            f"{candidate_name} ranks first for {scenario_name} with a predicted "
            f"scenario outcome of {predicted_outcome:.2f}. The strongest scenario-relevant "
            f"drivers are {strengths_text}."
        )

    return (
        f"{candidate_name} ranks first for {scenario_name} with a predicted scenario "
        f"outcome of {predicted_outcome:.2f} and a scenario alignment score of "
        f"{alignment_score:.2f}. The strongest scenario-relevant drivers are {strengths_text}."
    )


def build_decision_explanation(
    ranked_df: pd.DataFrame,
    scenario_name: str,
    artifacts: dict[str, Any] | None = None,
    what_if_df: pd.DataFrame | None = None,
) -> dict[str, Any]:
    """
    Build a structured explanation for the recommended candidate.

    Inputs:
        ranked_df: output of ranking_agent.rank_candidates_for_scenario(...)
        scenario_name: selected scenario
        artifacts: optional artifacts dict from ranking_agent
        what_if_df: optional what-if dataframe from ranking_agent

    Returns:
        Structured explanation payload for the dashboard.
    """
    scenario_name = validate_scenario_name(scenario_name)
    scenario_cfg = get_scenario_config(scenario_name)

    top_candidate = _get_top_candidate_row(ranked_df)
    runner_up = _get_runner_up_row(ranked_df)

    feature_weights = _get_feature_weights(scenario_name, artifacts)
    top_strengths = _build_top_strengths(top_candidate, feature_weights, top_k=3)
    tradeoffs = _build_tradeoffs(top_candidate, runner_up, feature_weights, top_k=2)
    advantages = _build_strength_comparison(top_candidate, runner_up, feature_weights, top_k=3)

    predicted_outcome = _to_float(top_candidate.get("predicted_scenario_outcome"))
    alignment_score = (
        _to_float(top_candidate.get("scenario_alignment_score"))
        if "scenario_alignment_score" in top_candidate.index
        else None
    )

    what_if_insight = _build_what_if_insight(
        what_if_df=what_if_df,
        candidate_id=top_candidate.get("candidate_id"),
    )

    summary_text = _build_summary_text(
        scenario_name=scenario_name,
        candidate_name=str(top_candidate.get("name")),
        predicted_outcome=predicted_outcome,
        alignment_score=alignment_score,
        top_strengths=top_strengths,
    )

    explanation: dict[str, Any] = {
        "scenario_name": scenario_name,
        "business_goal": scenario_cfg["business_goal"],
        "recommended_candidate_id": top_candidate.get("candidate_id"),
        "recommended_candidate_name": top_candidate.get("name"),
        "predicted_scenario_outcome": round(predicted_outcome, 2),
        "scenario_alignment_score": round(alignment_score, 2) if alignment_score is not None else None,
        "headline": (
            f"{top_candidate.get('name')} is the recommended candidate for {scenario_name}."
        ),
        "summary_text": summary_text,
        "top_strengths": top_strengths,
        "advantages_vs_runner_up": advantages,
        "tradeoffs": tradeoffs,
        "what_if_insight": what_if_insight,
        "explanation_ready": {
            "scenario_fit_reason": (
                f"The recommendation is based on scenario-weighted competencies aligned to "
                f"{scenario_name}, rather than a generic overall applicant score."
            ),
            "primary_feature": (
                artifacts.get("primary_feature")
                if artifacts is not None and "primary_feature" in artifacts
                else None
            ),
        },
    }

    return explanation


def build_candidate_comparison_table(
    ranked_df: pd.DataFrame,
    scenario_name: str,
    top_n: int = 5,
    artifacts: dict[str, Any] | None = None,
) -> pd.DataFrame:
    """
    Build a clean comparison table for the top-N candidates with scenario-relevant columns.
    """
    scenario_name = validate_scenario_name(scenario_name)
    feature_weights = _get_feature_weights(scenario_name, artifacts)

    base_cols = [
        "rank",
        "candidate_id",
        "name",
        "predicted_scenario_outcome",
    ]

    if "scenario_alignment_score" in ranked_df.columns:
        base_cols.append("scenario_alignment_score")

    feature_cols = [col for col in feature_weights if col in ranked_df.columns]
    selected_cols = base_cols + feature_cols

    available_cols = [col for col in selected_cols if col in ranked_df.columns]
    return ranked_df[available_cols].head(top_n).copy()


if __name__ == "__main__":
    print("Decision Agent ready.")