from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import networkx as nx
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

try:
    from dowhy import gcm
except ImportError as exc:  # pragma: no cover
    raise ImportError(
        "The ranking agent requires DoWhy with GCM support. "
        "Install it with: pip install dowhy"
    ) from exc

from agents.candidate_agent import score_candidates
from agents.scenario_agent import (
    prepare_historical_data_for_scenario,
    validate_scenario_name,
)


TARGET_NODE = "target_scenario_score"


@dataclass
class FittedRankingAgent:
    scenario_name: str
    causal_graph: nx.DiGraph
    causal_model: Any
    target_model: Pipeline
    feature_columns: list[str]
    feature_weights: dict[str, float]
    primary_feature: str
    target_min: float
    target_max: float
    training_data: pd.DataFrame


# ============================================================
# Scenario-specific manual DAGs
# ============================================================

def build_scenario_graph(scenario_name: str) -> nx.DiGraph:
    """
    Return the manual DAG for the selected scenario.
    """
    scenario_name = validate_scenario_name(scenario_name)
    graph = nx.DiGraph()

    if scenario_name == "Supply Chain Disruption":
        graph.add_edges_from(
            [
                ("competency_leadership", "competency_disruption_management"),
                ("competency_bmw_context_fit", "competency_disruption_management"),
                ("competency_leadership", "competency_operational_continuity"),
                ("competency_bmw_context_fit", "competency_operational_continuity"),
                ("competency_disruption_management", TARGET_NODE),
                ("competency_operational_continuity", TARGET_NODE),
            ]
        )

    elif scenario_name == "Digital Transformation":
        graph.add_edges_from(
            [
                ("competency_leadership", "competency_digital_transformation"),
                ("competency_bmw_context_fit", "competency_digital_transformation"),
                ("competency_leadership", "competency_operational_continuity"),
                ("competency_bmw_context_fit", "competency_operational_continuity"),
                ("competency_digital_transformation", "competency_operational_continuity"),
                ("competency_digital_transformation", TARGET_NODE),
                ("competency_operational_continuity", TARGET_NODE),
            ]
        )

    elif scenario_name == "Operational Continuity":
        graph.add_edges_from(
            [
                ("competency_leadership", "competency_disruption_management"),
                ("competency_bmw_context_fit", "competency_disruption_management"),
                ("competency_leadership", "competency_operational_continuity"),
                ("competency_bmw_context_fit", "competency_operational_continuity"),
                ("competency_disruption_management", "competency_operational_continuity"),
                ("competency_operational_continuity", TARGET_NODE),
            ]
        )

    else:
        raise ValueError(f"Unsupported scenario: {scenario_name}")

    if not nx.is_directed_acyclic_graph(graph):
        raise ValueError(f"Scenario graph for '{scenario_name}' is not a DAG.")

    return graph


def get_graph_nodes(graph: nx.DiGraph) -> list[str]:
    return sorted(list(graph.nodes))


# ============================================================
# Scenario-specific ranking configuration
# ============================================================

def get_scenario_feature_weights(scenario_name: str) -> dict[str, float]:
    """
    Strong scenario-specific weights. These are intentionally sharp so the
    ranking changes across scenarios instead of always choosing the same
    generalist candidate.
    """
    scenario_name = validate_scenario_name(scenario_name)

    if scenario_name == "Supply Chain Disruption":
        return {
            "competency_disruption_management": 0.55,
            "competency_operational_continuity": 0.25,
            "competency_leadership": 0.10,
            "competency_bmw_context_fit": 0.10,
        }

    if scenario_name == "Digital Transformation":
        return {
            "competency_digital_transformation": 0.60,
            "competency_operational_continuity": 0.15,
            "competency_leadership": 0.15,
            "competency_bmw_context_fit": 0.10,
        }

    if scenario_name == "Operational Continuity":
        return {
            "competency_operational_continuity": 0.70,
            "competency_disruption_management": 0.10,
            "competency_bmw_context_fit": 0.10,
            "competency_leadership": 0.10,
        }

    raise ValueError(f"Unsupported scenario: {scenario_name}")


def get_primary_feature_for_scenario(scenario_name: str) -> str:
    weights = get_scenario_feature_weights(scenario_name)
    return max(weights.items(), key=lambda x: x[1])[0]


def get_feature_columns_for_scenario(scenario_name: str) -> list[str]:
    return list(get_scenario_feature_weights(scenario_name).keys())


# ============================================================
# Data preparation
# ============================================================

def prepare_historical_training_data(
    historical_df: pd.DataFrame,
    scenario_name: str,
) -> pd.DataFrame:
    """
    Filter historical data to the selected scenario, attach target score,
    and compute candidate competencies.
    """
    prepared = prepare_historical_data_for_scenario(historical_df, scenario_name)
    scored = score_candidates(prepared)
    return scored


def prepare_current_scored_data(current_df: pd.DataFrame) -> pd.DataFrame:
    """
    Score current applicants with the Candidate Intelligence Agent.
    """
    return score_candidates(current_df)


# ============================================================
# GCM fitting (kept as explicit causal layer)
# ============================================================

def fit_gcm_for_scenario(
    training_df: pd.DataFrame,
    scenario_name: str,
    auto_assign_mechanisms: bool = False,
) -> tuple[Any, nx.DiGraph]:
    """
    Fit a DoWhy GCM on the scenario-specific training data.

    The final ranking uses a stable scenario-specific model. The GCM is kept
    as the explicit causal layer and for future graph-based analyses.
    """
    graph = build_scenario_graph(scenario_name)
    required_cols = get_graph_nodes(graph)

    missing = [col for col in required_cols if col not in training_df.columns]
    if missing:
        raise ValueError(
            f"Training data is missing required DAG columns for '{scenario_name}': {missing}"
        )

    gcm_df = training_df[required_cols].copy()
    model = gcm.StructuralCausalModel(graph)

    if auto_assign_mechanisms:
        gcm.auto.assign_causal_mechanisms(model, gcm_df)
    else:
        for node in graph.nodes:
            parents = list(graph.predecessors(node))
            if not parents:
                model.set_causal_mechanism(node, gcm.EmpiricalDistribution())
            else:
                model.set_causal_mechanism(
                    node,
                    gcm.AdditiveNoiseModel(gcm.ml.create_linear_regressor()),
                )

    gcm.fit(model, gcm_df)
    return model, graph


# ============================================================
# Stable scenario target model
# ============================================================

def fit_target_model(
    training_df: pd.DataFrame,
    feature_columns: list[str],
) -> Pipeline:
    """
    Fit a positive linear model so scenario-relevant competencies have a
    monotonic positive relationship with the learned target prediction.
    """
    required = feature_columns + [TARGET_NODE]
    missing = [col for col in required if col not in training_df.columns]
    if missing:
        raise ValueError(f"Training data missing columns for target model: {missing}")

    X_train = training_df[feature_columns].copy()
    y_train = pd.to_numeric(training_df[TARGET_NODE], errors="coerce")

    model = Pipeline(
        steps=[
            ("scaler", StandardScaler()),
            ("linear", LinearRegression(positive=True)),
        ]
    )
    model.fit(X_train, y_train)
    return model


def compute_alignment_score(
    df: pd.DataFrame,
    feature_weights: dict[str, float],
    primary_feature: str,
) -> pd.Series:
    """
    Strong deterministic scenario alignment score on a 0-100 scale.

    The primary feature gets an extra boost so scenario differences matter.
    """
    missing = [col for col in feature_weights if col not in df.columns]
    if missing:
        raise ValueError(f"Missing columns for alignment score: {missing}")

    weighted_sum = pd.Series(0.0, index=df.index, dtype=float)
    for col, weight in feature_weights.items():
        weighted_sum += float(weight) * pd.to_numeric(df[col], errors="coerce").fillna(0.0)

    primary_series = pd.to_numeric(df[primary_feature], errors="coerce").fillna(0.0)
    avg_feature = pd.Series(0.0, index=df.index, dtype=float)
    for col in feature_weights:
        avg_feature += pd.to_numeric(df[col], errors="coerce").fillna(0.0)
    avg_feature = avg_feature / float(len(feature_weights))

    primary_advantage = (primary_series - avg_feature).clip(lower=0.0)
    primary_boost = 0.20 * primary_advantage

    alignment = weighted_sum + primary_boost
    return alignment.clip(0.0, 100.0)


def calibrate_predictions(
    predictions: np.ndarray,
    target_min: float,
    target_max: float,
) -> np.ndarray:
    clipped = np.clip(predictions.astype(float), target_min, target_max)
    clipped = np.clip(clipped, 0.0, 100.0)
    return clipped


def blend_model_and_alignment(
    model_pred: pd.Series,
    alignment_score: pd.Series,
    model_weight: float = 0.30,
    alignment_weight: float = 0.70,
) -> pd.Series:
    """
    Strongly favor scenario alignment so scenario-specific competencies dominate.
    """
    if abs((model_weight + alignment_weight) - 1.0) > 1e-9:
        raise ValueError("model_weight and alignment_weight must sum to 1.0.")

    blended = (model_weight * model_pred) + (alignment_weight * alignment_score)
    return blended.clip(0.0, 100.0)


def fit_ranking_agent(
    historical_df: pd.DataFrame,
    scenario_name: str,
    auto_assign_mechanisms: bool = False,
) -> FittedRankingAgent:
    """
    End-to-end fit of the ranking agent.
    """
    scenario_name = validate_scenario_name(scenario_name)
    historical_scored = prepare_historical_training_data(historical_df, scenario_name)

    causal_model, graph = fit_gcm_for_scenario(
        training_df=historical_scored,
        scenario_name=scenario_name,
        auto_assign_mechanisms=auto_assign_mechanisms,
    )

    feature_weights = get_scenario_feature_weights(scenario_name)
    feature_columns = list(feature_weights.keys())
    primary_feature = get_primary_feature_for_scenario(scenario_name)
    target_model = fit_target_model(historical_scored, feature_columns)

    target_min = float(pd.to_numeric(historical_scored[TARGET_NODE], errors="coerce").min())
    target_max = float(pd.to_numeric(historical_scored[TARGET_NODE], errors="coerce").max())

    return FittedRankingAgent(
        scenario_name=scenario_name,
        causal_graph=graph,
        causal_model=causal_model,
        target_model=target_model,
        feature_columns=feature_columns,
        feature_weights=feature_weights,
        primary_feature=primary_feature,
        target_min=target_min,
        target_max=target_max,
        training_data=historical_scored.copy(),
    )


# ============================================================
# Prediction / ranking
# ============================================================

def _predict_from_feature_frame(
    fitted_agent: FittedRankingAgent,
    feature_df: pd.DataFrame,
) -> tuple[pd.Series, pd.Series, pd.Series]:
    raw_pred = fitted_agent.target_model.predict(feature_df[fitted_agent.feature_columns].copy())
    calibrated_pred = calibrate_predictions(
        predictions=raw_pred,
        target_min=fitted_agent.target_min,
        target_max=fitted_agent.target_max,
    )
    model_pred = pd.Series(calibrated_pred, index=feature_df.index, dtype=float)

    alignment_score = compute_alignment_score(
        df=feature_df,
        feature_weights=fitted_agent.feature_weights,
        primary_feature=fitted_agent.primary_feature,
    )

    final_pred = blend_model_and_alignment(
        model_pred=model_pred,
        alignment_score=alignment_score,
        model_weight=0.30,
        alignment_weight=0.70,
    )
    return model_pred.round(2), alignment_score.round(2), final_pred.round(2)


def estimate_candidate_outcomes(
    fitted_agent: FittedRankingAgent,
    current_df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Score current applicants and estimate expected scenario outcome.
    """
    current_scored = prepare_current_scored_data(current_df)

    missing = [col for col in fitted_agent.feature_columns if col not in current_scored.columns]
    if missing:
        raise ValueError(f"Current applicant data missing ranking columns: {missing}")

    result = current_scored.copy()
    model_pred, alignment_score, final_pred = _predict_from_feature_frame(
        fitted_agent=fitted_agent,
        feature_df=result,
    )

    result["model_predicted_outcome"] = model_pred
    result["scenario_alignment_score"] = alignment_score
    result["predicted_scenario_outcome"] = final_pred

    result = result.sort_values(
        by=[
            "predicted_scenario_outcome",
            "scenario_alignment_score",
            fitted_agent.primary_feature,
            "competency_overall",
        ],
        ascending=[False, False, False, False],
    ).reset_index(drop=True)

    result["rank"] = np.arange(1, len(result) + 1)
    return result


def build_recommendation_summary(
    ranked_df: pd.DataFrame,
    scenario_name: str,
) -> dict[str, Any]:
    if ranked_df.empty:
        raise ValueError("ranked_df is empty.")

    top = ranked_df.iloc[0]
    feature_weights = get_scenario_feature_weights(scenario_name)

    weighted_strengths: list[dict[str, Any]] = []
    for feature, weight in feature_weights.items():
        if feature in ranked_df.columns:
            score = float(top[feature])
            contribution = score * float(weight)
            weighted_strengths.append(
                {
                    "feature": feature,
                    "score": round(score, 2),
                    "weight": float(weight),
                    "weighted_contribution": round(contribution, 2),
                }
            )

    weighted_strengths = sorted(
        weighted_strengths,
        key=lambda x: x["weighted_contribution"],
        reverse=True,
    )

    return {
        "scenario_name": scenario_name,
        "recommended_candidate_id": top["candidate_id"],
        "recommended_candidate_name": top["name"],
        "predicted_scenario_outcome": float(top["predicted_scenario_outcome"]),
        "scenario_alignment_score": float(top["scenario_alignment_score"]),
        "primary_feature": max(feature_weights.items(), key=lambda x: x[1])[0],
        "top_strengths": weighted_strengths[:3],
    }


def rank_candidates_for_scenario(
    historical_df: pd.DataFrame,
    current_df: pd.DataFrame,
    scenario_name: str,
    auto_assign_mechanisms: bool = False,
) -> tuple[pd.DataFrame, dict[str, Any], dict[str, Any]]:
    """
    Full scenario-specific ranking flow.
    """
    fitted_agent = fit_ranking_agent(
        historical_df=historical_df,
        scenario_name=scenario_name,
        auto_assign_mechanisms=auto_assign_mechanisms,
    )

    ranked_df = estimate_candidate_outcomes(
        fitted_agent=fitted_agent,
        current_df=current_df,
    )

    summary = build_recommendation_summary(
        ranked_df=ranked_df,
        scenario_name=fitted_agent.scenario_name,
    )

    artifacts = {
        "scenario_name": fitted_agent.scenario_name,
        "graph_edges": list(fitted_agent.causal_graph.edges()),
        "feature_columns": fitted_agent.feature_columns,
        "feature_weights": fitted_agent.feature_weights,
        "primary_feature": fitted_agent.primary_feature,
        "n_training_rows": int(len(fitted_agent.training_data)),
        "target_range": [round(fitted_agent.target_min, 2), round(fitted_agent.target_max, 2)],
    }

    return ranked_df, summary, artifacts


# ============================================================
# Deterministic intervention / what-if analysis
# ============================================================

def _make_counterfactual_row(
    fitted_agent: FittedRankingAgent,
    candidate_row: pd.Series,
    interventions: dict[str, float],
) -> pd.DataFrame:
    """
    Create a one-row counterfactual candidate feature frame and apply
    deterministic feature interventions.
    """
    row = candidate_row.copy()

    for node, delta in interventions.items():
        if node not in row.index:
            raise ValueError(f"Intervention node '{node}' not found in candidate row.")

        new_value = float(row[node]) + float(delta)
        row[node] = max(0.0, min(100.0, new_value))

    return pd.DataFrame([row.to_dict()])


def simulate_intervention_for_candidate(
    fitted_agent: FittedRankingAgent,
    candidate_row: pd.Series,
    interventions: dict[str, float],
) -> dict[str, Any]:
    """
    Deterministic what-if analysis based on the stable ranking model.
    """
    baseline_target = float(candidate_row["predicted_scenario_outcome"])
    baseline_alignment = float(candidate_row["scenario_alignment_score"])

    counterfactual_df = _make_counterfactual_row(
        fitted_agent=fitted_agent,
        candidate_row=candidate_row,
        interventions=interventions,
    )

    _, simulated_alignment, simulated_target = _predict_from_feature_frame(
        fitted_agent=fitted_agent,
        feature_df=counterfactual_df,
    )

    simulated_target_value = float(simulated_target.iloc[0])
    simulated_alignment_value = float(simulated_alignment.iloc[0])

    return {
        "candidate_id": candidate_row["candidate_id"],
        "candidate_name": candidate_row["name"],
        "baseline_target": round(baseline_target, 2),
        "simulated_target": round(simulated_target_value, 2),
        "delta_vs_baseline": round(simulated_target_value - baseline_target, 2),
        "baseline_alignment": round(baseline_alignment, 2),
        "simulated_alignment": round(simulated_alignment_value, 2),
        "interventions": interventions,
    }


def run_standard_intervention_analysis(
    fitted_agent: FittedRankingAgent,
    ranked_df: pd.DataFrame,
    top_n: int = 3,
    uplift: float = 10.0,
    nodes: list[str] | None = None,
) -> pd.DataFrame:
    """
    For the top-N candidates, increase each scenario-relevant feature by a fixed
    amount and measure the impact on predicted_scenario_outcome.
    """
    if ranked_df.empty:
        return pd.DataFrame()

    intervention_nodes = nodes if nodes is not None else fitted_agent.feature_columns
    results: list[dict[str, Any]] = []

    for _, row in ranked_df.head(top_n).iterrows():
        for node in intervention_nodes:
            result = simulate_intervention_for_candidate(
                fitted_agent=fitted_agent,
                candidate_row=row,
                interventions={node: uplift},
            )
            result["intervention"] = f"{node} +{uplift}"
            results.append(result)

    return pd.DataFrame(results)


# ============================================================
# Small helpers
# ============================================================

def get_graph_edges_for_scenario(scenario_name: str) -> list[tuple[str, str]]:
    return list(build_scenario_graph(scenario_name).edges())


def get_graph_nodes_for_scenario(scenario_name: str) -> list[str]:
    return list(build_scenario_graph(scenario_name).nodes())


if __name__ == "__main__":
    print("Ranking Agent ready.")
    for scenario in [
        "Supply Chain Disruption",
        "Digital Transformation",
        "Operational Continuity",
    ]:
        print(f"\nScenario: {scenario}")
        print("Edges:")
        for edge in get_graph_edges_for_scenario(scenario):
            print(" ", edge)

