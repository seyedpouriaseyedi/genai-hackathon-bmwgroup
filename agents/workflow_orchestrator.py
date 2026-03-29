from __future__ import annotations

import os
from typing import Any

import pandas as pd

from agents.decision_agent import (
    build_candidate_comparison_table,
    build_decision_explanation,
)
from agents.ranking_agent import (
    fit_ranking_agent,
    rank_candidates_for_scenario,
    run_standard_intervention_analysis,
)
from agents.scenario_agent import validate_scenario_name


DEFAULT_HISTORICAL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "data",
    "generated",
    "historical_outcomes_raw.csv",
)


def load_historical_data(historical_path: str | None = None) -> pd.DataFrame:
    """
    Load the built-in historical dataset used by the decision system.
    """
    path = historical_path or DEFAULT_HISTORICAL_PATH

    if not os.path.exists(path):
        raise FileNotFoundError(f"Historical dataset not found: {path}")

    return pd.read_csv(path)


def load_current_applicants_from_csv(csv_path: str) -> pd.DataFrame:
    """
    Load current applicants from a CSV file path.
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Current applicant CSV not found: {csv_path}")

    return pd.read_csv(csv_path)


def _serialize_ranking_table(
    ranked_df: pd.DataFrame,
    max_rows: int = 10,
) -> list[dict[str, Any]]:
    """
    Convert the ranked dataframe into a JSON-friendly top-N list.
    """
    preview = ranked_df.head(max_rows).copy()
    return preview.to_dict(orient="records")


def _serialize_dataframe(df: pd.DataFrame | None) -> list[dict[str, Any]]:
    if df is None or df.empty:
        return []
    return df.to_dict(orient="records")


def run_decision_pipeline(
    scenario_name: str,
    current_applicants_df: pd.DataFrame,
    historical_df: pd.DataFrame | None = None,
    historical_path: str | None = None,
    top_n_table: int = 10,
    top_n_comparison: int = 5,
    top_n_what_if: int = 3,
    what_if_uplift: float = 10.0,
    auto_assign_mechanisms: bool = False,
) -> dict[str, Any]:
    """
    Run the full multi-agent decision pipeline.

    Flow:
    1. Validate scenario
    2. Load historical data (if not provided)
    3. Run ranking agent
    4. Run what-if analysis
    5. Run decision explanation agent
    6. Return one unified payload for the UI
    """
    scenario_name = validate_scenario_name(scenario_name)

    if not isinstance(current_applicants_df, pd.DataFrame):
        raise TypeError("current_applicants_df must be a pandas DataFrame.")

    if historical_df is None:
        historical_df = load_historical_data(historical_path=historical_path)

    ranked_df, summary, artifacts = rank_candidates_for_scenario(
        historical_df=historical_df,
        current_df=current_applicants_df,
        scenario_name=scenario_name,
        auto_assign_mechanisms=auto_assign_mechanisms,
    )

    fitted_agent = fit_ranking_agent(
        historical_df=historical_df,
        scenario_name=scenario_name,
        auto_assign_mechanisms=auto_assign_mechanisms,
    )

    what_if_df = run_standard_intervention_analysis(
        fitted_agent=fitted_agent,
        ranked_df=ranked_df,
        top_n=top_n_what_if,
        uplift=what_if_uplift,
    )

    explanation = build_decision_explanation(
        ranked_df=ranked_df,
        scenario_name=scenario_name,
        artifacts=artifacts,
        what_if_df=what_if_df,
    )

    comparison_df = build_candidate_comparison_table(
        ranked_df=ranked_df,
        scenario_name=scenario_name,
        top_n=top_n_comparison,
        artifacts=artifacts,
    )

    payload = {
        "scenario_name": scenario_name,
        "summary": summary,
        "artifacts": artifacts,
        "explanation": explanation,
        "ranking_preview": _serialize_ranking_table(
            ranked_df=ranked_df,
            max_rows=top_n_table,
        ),
        "comparison_table": _serialize_dataframe(comparison_df),
        "what_if_analysis": _serialize_dataframe(what_if_df),
        "row_counts": {
            "historical_rows": int(len(historical_df)),
            "current_rows": int(len(current_applicants_df)),
            "ranked_rows": int(len(ranked_df)),
        },
    }

    return payload


def run_decision_pipeline_from_csv(
    scenario_name: str,
    current_applicants_csv_path: str,
    historical_path: str | None = None,
    top_n_table: int = 10,
    top_n_comparison: int = 5,
    top_n_what_if: int = 3,
    what_if_uplift: float = 10.0,
    auto_assign_mechanisms: bool = False,
) -> dict[str, Any]:
    """
    Convenience wrapper for file-based usage.
    """
    current_df = load_current_applicants_from_csv(current_applicants_csv_path)

    return run_decision_pipeline(
        scenario_name=scenario_name,
        current_applicants_df=current_df,
        historical_df=None,
        historical_path=historical_path,
        top_n_table=top_n_table,
        top_n_comparison=top_n_comparison,
        top_n_what_if=top_n_what_if,
        what_if_uplift=what_if_uplift,
        auto_assign_mechanisms=auto_assign_mechanisms,
    )


if __name__ == "__main__":
    print("Orchestrator ready.")