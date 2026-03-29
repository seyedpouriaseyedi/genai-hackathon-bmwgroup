from __future__ import annotations

from copy import deepcopy
from typing import Any

import pandas as pd


# ----------------------------
# Scenario definitions
# ----------------------------

SCENARIO_CONFIG: dict[str, dict[str, Any]] = {
    "Supply Chain Disruption": {
        "description": (
            "Evaluate candidates for resilience and response quality during supply chain "
            "disruption events."
        ),
        "business_goal": (
            "Maximize disruption response and operational continuity while reducing ramp-up time."
        ),
        "focus_competencies": [
            "competency_disruption_management",
            "competency_operational_continuity",
            "competency_leadership",
            "competency_bmw_context_fit",
        ],
        "target_components": [
            {
                "column": "disruption_response_score",
                "weight": 0.40,
                "mode": "higher_better",
            },
            {
                "column": "operational_continuity_score",
                "weight": 0.30,
                "mode": "higher_better",
            },
            {
                "column": "time_to_productivity_months",
                "weight": 0.20,
                "mode": "lower_better",
            },
            {
                "column": "retention_12m",
                "weight": 0.10,
                "mode": "binary",
            },
        ],
    },
    "Digital Transformation": {
        "description": (
            "Evaluate candidates for leading operational change, digital adoption, and "
            "transformation execution."
        ),
        "business_goal": (
            "Maximize transformation success while maintaining retention and reducing time to productivity."
        ),
        "focus_competencies": [
            "competency_digital_transformation",
            "competency_leadership",
            "competency_bmw_context_fit",
            "competency_operational_continuity",
        ],
        "target_components": [
            {
                "column": "transformation_success_score",
                "weight": 0.45,
                "mode": "higher_better",
            },
            {
                "column": "time_to_productivity_months",
                "weight": 0.20,
                "mode": "lower_better",
            },
            {
                "column": "retention_12m",
                "weight": 0.20,
                "mode": "binary",
            },
            {
                "column": "operational_continuity_score",
                "weight": 0.15,
                "mode": "higher_better",
            },
        ],
    },
    "Operational Continuity": {
        "description": (
            "Evaluate candidates for maintaining stable operations, execution quality, and "
            "business continuity."
        ),
        "business_goal": (
            "Maximize operational continuity and retention while reducing time to productivity."
        ),
        "focus_competencies": [
            "competency_operational_continuity",
            "competency_leadership",
            "competency_bmw_context_fit",
            "competency_disruption_management",
        ],
        "target_components": [
            {
                "column": "operational_continuity_score",
                "weight": 0.45,
                "mode": "higher_better",
            },
            {
                "column": "time_to_productivity_months",
                "weight": 0.20,
                "mode": "lower_better",
            },
            {
                "column": "retention_12m",
                "weight": 0.20,
                "mode": "binary",
            },
            {
                "column": "disruption_response_score",
                "weight": 0.15,
                "mode": "higher_better",
            },
        ],
    },
}


SCENARIO_ALIASES: dict[str, str] = {
    "supply chain disruption": "Supply Chain Disruption",
    "disruption": "Supply Chain Disruption",
    "digital transformation": "Digital Transformation",
    "transformation": "Digital Transformation",
    "operational continuity": "Operational Continuity",
    "continuity": "Operational Continuity",
}


_TRUE_VALUES = {"1", "true", "yes", "y", "retained", "stay", "stayed"}
_FALSE_VALUES = {"0", "false", "no", "n", "not_retained", "left", "churned"}


# ----------------------------
# Config validation
# ----------------------------

def _validate_scenario_config() -> None:
    """Validate scenario configuration once at import time."""
    if not SCENARIO_CONFIG:
        raise ValueError("SCENARIO_CONFIG is empty.")

    for scenario_name, cfg in SCENARIO_CONFIG.items():
        if "description" not in cfg or not cfg["description"]:
            raise ValueError(f"Scenario '{scenario_name}' is missing a description.")
        if "business_goal" not in cfg or not cfg["business_goal"]:
            raise ValueError(f"Scenario '{scenario_name}' is missing a business_goal.")
        if "focus_competencies" not in cfg or not cfg["focus_competencies"]:
            raise ValueError(f"Scenario '{scenario_name}' is missing focus_competencies.")
        if "target_components" not in cfg or not cfg["target_components"]:
            raise ValueError(f"Scenario '{scenario_name}' is missing target_components.")

        total_weight = sum(component["weight"] for component in cfg["target_components"])
        if abs(total_weight - 1.0) > 1e-9:
            raise ValueError(
                f"Scenario '{scenario_name}' target component weights must sum to 1.0, "
                f"but got {total_weight:.6f}."
            )

        for component in cfg["target_components"]:
            mode = component.get("mode")
            if mode not in {"higher_better", "lower_better", "binary"}:
                raise ValueError(
                    f"Scenario '{scenario_name}' has invalid mode '{mode}' "
                    f"for column '{component.get('column')}'."
                )
            if "column" not in component or not component["column"]:
                raise ValueError(
                    f"Scenario '{scenario_name}' contains a target component without a column."
                )
            if "weight" not in component:
                raise ValueError(
                    f"Scenario '{scenario_name}' contains a target component without a weight."
                )


_validate_scenario_config()


# ----------------------------
# Public scenario API
# ----------------------------

def list_supported_scenarios() -> list[str]:
    """Return the list of valid scenario names."""
    return list(SCENARIO_CONFIG.keys())


def validate_scenario_name(scenario_name: str) -> str:
    """
    Validate and canonicalize a scenario name.

    Returns:
        Canonical scenario name as defined in SCENARIO_CONFIG.

    Raises:
        ValueError: If scenario_name is invalid.
    """
    if not isinstance(scenario_name, str) or not scenario_name.strip():
        raise ValueError(
            f"scenario_name must be a non-empty string. Supported scenarios: {list_supported_scenarios()}"
        )

    cleaned = scenario_name.strip()

    if cleaned in SCENARIO_CONFIG:
        return cleaned

    lowered = cleaned.lower()
    if lowered in SCENARIO_ALIASES:
        return SCENARIO_ALIASES[lowered]

    raise ValueError(
        f"Unsupported scenario '{scenario_name}'. Supported scenarios: {list_supported_scenarios()}"
    )


def get_scenario_config(scenario_name: str) -> dict[str, Any]:
    """
    Return a deep copy of the scenario config for safe downstream use.
    """
    canonical_name = validate_scenario_name(scenario_name)
    cfg = deepcopy(SCENARIO_CONFIG[canonical_name])
    cfg["scenario_name"] = canonical_name
    return cfg


def get_required_outcome_columns(scenario_name: str) -> list[str]:
    """
    Return the historical outcome columns required to build the target outcome
    for the selected scenario.
    """
    cfg = get_scenario_config(scenario_name)
    return [component["column"] for component in cfg["target_components"]]


def validate_required_outcome_columns(df: pd.DataFrame, scenario_name: str) -> None:
    """
    Validate that all required outcome columns for the scenario exist in the dataframe.

    Raises:
        ValueError: If any required column is missing.
    """
    if not isinstance(df, pd.DataFrame):
        raise TypeError("df must be a pandas DataFrame.")

    required_cols = get_required_outcome_columns(scenario_name)
    missing = [col for col in required_cols if col not in df.columns]

    if missing:
        raise ValueError(
            f"Missing required outcome columns for scenario '{validate_scenario_name(scenario_name)}': {missing}"
        )


def filter_historical_rows_for_scenario(
    df: pd.DataFrame,
    scenario_name: str,
    scenario_column: str = "scenario_type",
) -> pd.DataFrame:
    """
    Return only the rows matching the selected scenario.

    Useful later in ranking.py when you want to train or compare using
    historical examples from the selected scenario only.
    """
    if not isinstance(df, pd.DataFrame):
        raise TypeError("df must be a pandas DataFrame.")
    if scenario_column not in df.columns:
        raise ValueError(f"Column '{scenario_column}' not found in dataframe.")

    canonical_name = validate_scenario_name(scenario_name)
    scenario_series = df[scenario_column].astype(str).str.strip().str.lower()

    valid_forms = {
        key for key, value in SCENARIO_ALIASES.items() if value == canonical_name
    }
    valid_forms.add(canonical_name.lower())

    return df.loc[scenario_series.isin(valid_forms)].copy()


# ----------------------------
# Normalization helpers
# ----------------------------

def _coerce_numeric(series: pd.Series) -> pd.Series:
    """
    Convert a series to numeric and fill missing values with the median.
    If the full series is missing/non-numeric, return 0.5 for all rows.
    """
    numeric = pd.to_numeric(series, errors="coerce")

    if numeric.notna().sum() == 0:
        return pd.Series(0.5, index=series.index, dtype=float)

    median_value = float(numeric.median(skipna=True))
    return numeric.fillna(median_value).astype(float)


def _min_max_normalize(series: pd.Series, constant_value: float = 0.5) -> pd.Series:
    """
    Min-max normalize a numeric series to [0, 1].
    If the series is constant, return constant_value for all rows.
    """
    numeric = _coerce_numeric(series)
    min_val = float(numeric.min())
    max_val = float(numeric.max())

    if max_val == min_val:
        return pd.Series(constant_value, index=series.index, dtype=float)

    normalized = (numeric - min_val) / (max_val - min_val)
    return normalized.clip(0.0, 1.0).astype(float)


def _min_max_inverse_normalize(series: pd.Series, constant_value: float = 0.5) -> pd.Series:
    """
    Inverse min-max normalize a numeric series to [0, 1],
    where lower raw values become better (closer to 1).
    """
    normalized = _min_max_normalize(series, constant_value=constant_value)
    return (1.0 - normalized).clip(0.0, 1.0).astype(float)


def _normalize_binary(series: pd.Series) -> pd.Series:
    """
    Normalize a binary-like series to [0, 1].

    Supports:
    - bool
    - 0/1 numeric
    - common text values such as yes/no, true/false, retained/left
    """
    if pd.api.types.is_bool_dtype(series):
        return series.astype(float)

    numeric = pd.to_numeric(series, errors="coerce")
    if numeric.notna().sum() > 0:
        fill_value = float(numeric.mode().iloc[0]) if not numeric.mode().empty else 0.0
        numeric = numeric.fillna(fill_value).astype(float).clip(0.0, 1.0)
        return numeric

    lowered = series.astype(str).str.strip().str.lower()

    mapped = lowered.map(
        lambda x: 1.0 if x in _TRUE_VALUES else 0.0 if x in _FALSE_VALUES else pd.NA
    )

    if mapped.notna().sum() == 0:
        return pd.Series(0.5, index=series.index, dtype=float)

    fill_value = float(mapped.mode(dropna=True).iloc[0])
    return mapped.fillna(fill_value).astype(float).clip(0.0, 1.0)


def _normalize_component(series: pd.Series, mode: str) -> pd.Series:
    """
    Normalize a target component based on the configured mode.
    """
    if mode == "higher_better":
        return _min_max_normalize(series)
    if mode == "lower_better":
        return _min_max_inverse_normalize(series)
    if mode == "binary":
        return _normalize_binary(series)

    raise ValueError(f"Unsupported normalization mode: {mode}")


# ----------------------------
# Target outcome builder
# ----------------------------

def build_target_component_frame(
    df: pd.DataFrame,
    scenario_name: str,
    target_col: str = "target_scenario_score",
) -> pd.DataFrame:
    """
    Build a dataframe containing normalized target components and the final
    composite target score for the selected scenario.

    Returns:
        DataFrame with columns like:
        - norm__disruption_response_score
        - norm__operational_continuity_score
        - ...
        - target_scenario_score
        - target_scenario_score_100
    """
    if not isinstance(df, pd.DataFrame):
        raise TypeError("df must be a pandas DataFrame.")

    canonical_name = validate_scenario_name(scenario_name)
    validate_required_outcome_columns(df, canonical_name)
    cfg = get_scenario_config(canonical_name)

    result = pd.DataFrame(index=df.index)
    weighted_sum = pd.Series(0.0, index=df.index, dtype=float)

    for component in cfg["target_components"]:
        raw_col = component["column"]
        weight = float(component["weight"])
        mode = component["mode"]

        normalized = _normalize_component(df[raw_col], mode=mode)
        result[f"norm__{raw_col}"] = normalized
        weighted_sum += weight * normalized

    result[target_col] = weighted_sum.clip(0.0, 1.0)
    result[f"{target_col}_100"] = (result[target_col] * 100.0).round(2)

    return result


def build_target_outcome(
    df: pd.DataFrame,
    scenario_name: str,
    target_col: str = "target_scenario_score",
    scale_100: bool = True,
) -> pd.Series:
    """
    Build the composite target outcome series for the selected scenario.

    Args:
        df: Historical dataframe with outcome columns.
        scenario_name: Selected scenario.
        target_col: Name assigned to the returned series.
        scale_100: If True, return a 0-100 score. Otherwise return 0-1.

    Returns:
        pandas Series of composite target scores.
    """
    component_frame = build_target_component_frame(
        df=df,
        scenario_name=scenario_name,
        target_col=target_col,
    )

    if scale_100:
        series = component_frame[f"{target_col}_100"].copy()
    else:
        series = component_frame[target_col].copy()

    series.name = target_col
    return series


def attach_target_outcome(
    df: pd.DataFrame,
    scenario_name: str,
    target_col: str = "target_scenario_score",
    scale_100: bool = True,
) -> pd.DataFrame:
    """
    Return a copy of the dataframe with the target outcome column attached.
    """
    if not isinstance(df, pd.DataFrame):
        raise TypeError("df must be a pandas DataFrame.")

    result = df.copy()
    result[target_col] = build_target_outcome(
        df=result,
        scenario_name=scenario_name,
        target_col=target_col,
        scale_100=scale_100,
    )
    return result

def prepare_historical_data_for_scenario(
    df: pd.DataFrame,
    scenario_name: str,
    scenario_column: str = "scenario_type",
    target_col: str = "target_scenario_score",
) -> pd.DataFrame:
    """
    Filter historical data to the selected scenario and attach the
    scenario-specific composite target outcome.

    This is the safest helper for downstream ranking, because it avoids
    attaching a scenario target to rows belonging to other scenarios.
    """
    filtered = filter_historical_rows_for_scenario(
        df,
        scenario_name,
        scenario_column=scenario_column,
    )
    return attach_target_outcome(
        filtered,
        scenario_name,
        target_col=target_col,
        scale_100=True,
    )

# ----------------------------
# Optional quick smoke test
# ----------------------------

if __name__ == "__main__":
    print("Supported scenarios:")
    for scenario in list_supported_scenarios():
        print("-", scenario)