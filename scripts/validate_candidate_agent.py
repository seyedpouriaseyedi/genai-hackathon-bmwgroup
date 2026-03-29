from __future__ import annotations

import os
import sys
from typing import Any, TypedDict

import pandas as pd


PROJECT_ROOT: str = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from agents.candidate_agent import score_candidates  # noqa: E402


RAW_HIST_PATH: str = os.path.join(PROJECT_ROOT, "data/generated/historical_outcomes_raw.csv")
RAW_CURR_PATH: str = os.path.join(PROJECT_ROOT, "data/generated/current_applicants_raw.csv")
DEBUG_HIST_PATH: str = os.path.join(PROJECT_ROOT, "data/generated/historical_outcomes_internal_debug.csv")
DEBUG_CURR_PATH: str = os.path.join(PROJECT_ROOT, "data/generated/current_applicants_internal_debug.csv")


class ProxyDebugTargetConfig(TypedDict):
    proxy_name: str
    components: dict[str, float]


PROXY_DEBUG_TARGETS: dict[str, ProxyDebugTargetConfig] = {
    "competency_disruption_management": {
        "proxy_name": "proxy_disruption_management_latent",
        "components": {
            "crisis_management_latent": 0.30,
            "decision_under_pressure_latent": 0.25,
            "disruption_readiness_latent": 0.30,
            "adaptability_latent": 0.15,
        },
    },
    "competency_digital_transformation": {
        "proxy_name": "proxy_digital_transformation_latent",
        "components": {
            "digital_transformation_experience_latent": 0.50,
            "transformation_capacity_latent": 0.35,
            "adaptability_latent": 0.15,
        },
    },
    "competency_operational_continuity": {
        "proxy_name": "proxy_operational_continuity_latent",
        "components": {
            "continuity_focus_latent": 0.35,
            "continuity_strength_latent": 0.35,
            "supplier_management_latent": 0.15,
            "operations_leadership_latent": 0.15,
        },
    },
    "competency_leadership": {
        "proxy_name": "proxy_leadership_latent",
        "components": {
            "operations_leadership_latent": 0.45,
            "stakeholder_management_latent": 0.35,
            "decision_under_pressure_latent": 0.20,
        },
    },
    "competency_bmw_context_fit": {
        "proxy_name": "proxy_bmw_context_fit_latent",
        "components": {
            "supplier_management_latent": 0.40,
            "stakeholder_management_latent": 0.35,
            "continuity_focus_latent": 0.25,
        },
    },
}


def min_max_scale_100(series: pd.Series) -> pd.Series:
    numeric: pd.Series = pd.to_numeric(series, errors="coerce")

    if int(numeric.notna().sum()) == 0:
        return pd.Series(50.0, index=series.index, dtype=float)

    numeric = numeric.fillna(float(numeric.median()))
    min_val: float = float(numeric.min())
    max_val: float = float(numeric.max())

    if max_val == min_val:
        return pd.Series(50.0, index=series.index, dtype=float)

    scaled: pd.Series = (numeric - min_val) / (max_val - min_val)
    return (scaled * 100.0).astype(float)


def top_k_overlap(
    generated: pd.Series,
    hidden: pd.Series,
    candidate_ids: pd.Series,
    k: int = 5,
) -> int:
    temp: pd.DataFrame = pd.DataFrame(
        {
            "candidate_id": candidate_ids,
            "generated": generated,
            "hidden": hidden,
        }
    ).dropna()

    if temp.empty:
        return 0

    gen_top: set[Any] = set(temp.nlargest(k, "generated")["candidate_id"].tolist())
    hid_top: set[Any] = set(temp.nlargest(k, "hidden")["candidate_id"].tolist())
    return len(gen_top.intersection(hid_top))


def merge_scored_with_debug(raw_path: str, debug_path: str) -> pd.DataFrame:
    raw_df: pd.DataFrame = pd.read_csv(raw_path)
    debug_df: pd.DataFrame = pd.read_csv(debug_path)
    scored_df: pd.DataFrame = score_candidates(raw_df)

    if "candidate_id" not in scored_df.columns or "candidate_id" not in debug_df.columns:
        raise ValueError("Both scored data and debug data must contain 'candidate_id'.")

    merged: pd.DataFrame = scored_df.merge(
        debug_df,
        on="candidate_id",
        how="inner",
        suffixes=("", "__debug"),
    )
    return merged


def build_proxy_debug_targets(
    merged_df: pd.DataFrame,
    proxy_config: dict[str, ProxyDebugTargetConfig],
) -> pd.DataFrame:
    result: pd.DataFrame = merged_df.copy()

    for generated_col, cfg in proxy_config.items():
        proxy_name: str = cfg["proxy_name"]
        components: dict[str, float] = cfg["components"]

        missing: list[str] = [col for col in components if col not in result.columns]
        if missing:
            raise ValueError(
                f"Cannot build proxy target '{proxy_name}' for '{generated_col}'. "
                f"Missing debug columns: {missing}"
            )

        proxy_series: pd.Series = pd.Series(0.0, index=result.index, dtype=float)
        for col, weight in components.items():
            component_series: pd.Series = pd.to_numeric(result[col], errors="coerce").fillna(0.0)
            proxy_series = proxy_series + (float(weight) * component_series)

        result[proxy_name] = proxy_series

    return result


def evaluate_proxy_mapping(
    merged_df: pd.DataFrame,
    proxy_config: dict[str, ProxyDebugTargetConfig],
    dataset_name: str,
) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []

    for generated_col, cfg in proxy_config.items():
        proxy_name: str = cfg["proxy_name"]

        if generated_col not in merged_df.columns:
            rows.append(
                {
                    "dataset": dataset_name,
                    "generated_col": generated_col,
                    "debug_col": proxy_name,
                    "status": "missing generated column",
                }
            )
            continue

        if proxy_name not in merged_df.columns:
            rows.append(
                {
                    "dataset": dataset_name,
                    "generated_col": generated_col,
                    "debug_col": proxy_name,
                    "status": "missing proxy debug column",
                }
            )
            continue

        gen_scaled: pd.Series = min_max_scale_100(merged_df[generated_col])
        dbg_scaled: pd.Series = min_max_scale_100(merged_df[proxy_name])

        pair_df: pd.DataFrame = pd.DataFrame(
            {
                "candidate_id": merged_df["candidate_id"],
                "generated": gen_scaled,
                "hidden": dbg_scaled,
            }
        ).dropna()

        if pair_df.empty:
            rows.append(
                {
                    "dataset": dataset_name,
                    "generated_col": generated_col,
                    "debug_col": proxy_name,
                    "status": "no comparable rows",
                }
            )
            continue

        pearson_corr = pair_df["generated"].corr(pair_df["hidden"], method="pearson")
        spearman_corr = pair_df["generated"].corr(pair_df["hidden"], method="spearman")
        mae: float = float((pair_df["generated"] - pair_df["hidden"]).abs().mean())
        overlap_5: int = top_k_overlap(
            generated=pair_df["generated"],
            hidden=pair_df["hidden"],
            candidate_ids=pair_df["candidate_id"],
            k=5,
        )

        rows.append(
            {
                "dataset": dataset_name,
                "generated_col": generated_col,
                "debug_col": proxy_name,
                "status": "ok",
                "n_rows": int(len(pair_df)),
                "pearson_corr": round(float(pearson_corr), 4) if pd.notna(pearson_corr) else None,
                "spearman_corr": round(float(spearman_corr), 4) if pd.notna(spearman_corr) else None,
                "mae_0_100": round(mae, 2),
                "top5_overlap": overlap_5,
            }
        )

    return pd.DataFrame(rows)


def print_available_debug_columns() -> None:
    hist_debug: pd.DataFrame = pd.read_csv(DEBUG_HIST_PATH)
    curr_debug: pd.DataFrame = pd.read_csv(DEBUG_CURR_PATH)

    print("\nHistorical debug columns:")
    print(hist_debug.columns.tolist())

    print("\nCurrent debug columns:")
    print(curr_debug.columns.tolist())


def main() -> None:
    print("=== Candidate Agent Validation ===")
    print_available_debug_columns()

    hist_merged: pd.DataFrame = merge_scored_with_debug(RAW_HIST_PATH, DEBUG_HIST_PATH)
    curr_merged: pd.DataFrame = merge_scored_with_debug(RAW_CURR_PATH, DEBUG_CURR_PATH)

    hist_merged = build_proxy_debug_targets(hist_merged, PROXY_DEBUG_TARGETS)
    curr_merged = build_proxy_debug_targets(curr_merged, PROXY_DEBUG_TARGETS)

    hist_results: pd.DataFrame = evaluate_proxy_mapping(
        merged_df=hist_merged,
        proxy_config=PROXY_DEBUG_TARGETS,
        dataset_name="historical",
    )
    curr_results: pd.DataFrame = evaluate_proxy_mapping(
        merged_df=curr_merged,
        proxy_config=PROXY_DEBUG_TARGETS,
        dataset_name="current",
    )

    results: pd.DataFrame = pd.concat([hist_results, curr_results], ignore_index=True)

    print("\n=== Validation Summary ===")
    print(results)

    out_path: str = os.path.join(PROJECT_ROOT, "data/generated/candidate_agent_validation_summary.csv")
    results.to_csv(out_path, index=False)
    print(f"\nSaved validation summary to: {out_path}")


if __name__ == "__main__":
    main()