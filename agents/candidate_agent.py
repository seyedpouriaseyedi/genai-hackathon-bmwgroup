from __future__ import annotations

from typing import Any

import pandas as pd


# ============================================================
# Required raw columns
# ============================================================

REQUIRED_CANDIDATE_COLUMNS: list[str] = [
    "candidate_id",
    "name",
    "candidate_source",
    "latest_roles",
    "expertise",
    "years_experience",
    "leadership_years",
    "education_level",
    "industry_experience",
    "supply_chain_experience_years",
    "internal_company_knowledge",
    "cross_functional_scope",
]


# ============================================================
# Keyword dictionaries
# ============================================================

SUPPLY_CHAIN_KEYWORDS = {
    "supply chain",
    "scm",
    "logistics",
    "procurement",
    "planning",
    "planner",
    "inventory",
    "sourcing",
    "fulfillment",
    "demand planning",
    "supply planning",
    "operations planning",
    "distribution",
    "warehouse",
    "supplier",
    "vendor",
    "material planning",
    "production planning",
}

DISRUPTION_KEYWORDS = {
    "disruption",
    "crisis",
    "resilience",
    "risk",
    "mitigation",
    "recovery",
    "contingency",
    "incident",
    "business continuity",
    "continuity planning",
    "response",
    "escalation",
    "stabilization",
    "risk management",
}

TRANSFORMATION_KEYWORDS = {
    "digital",
    "digitalization",
    "digitization",
    "transformation",
    "erp",
    "sap",
    "automation",
    "process improvement",
    "process transformation",
    "systems implementation",
    "implementation",
    "analytics",
    "dashboard",
    "data",
    "continuous improvement",
    "change management",
    "optimization",
}

OPERATIONS_KEYWORDS = {
    "operations",
    "operational",
    "manufacturing",
    "plant",
    "execution",
    "operational excellence",
    "continuity",
    "service continuity",
    "production",
    "shopfloor",
    "delivery",
    "fulfillment",
    "run",
    "stability",
    "process execution",
}

LEADERSHIP_KEYWORDS = {
    "lead",
    "leader",
    "leading",
    "head",
    "manager",
    "management",
    "director",
    "senior manager",
    "program lead",
    "team lead",
    "department lead",
    "supervisor",
    "owner",
    "principal",
}

CROSS_FUNCTIONAL_KEYWORDS = {
    "cross-functional",
    "cross functional",
    "stakeholder",
    "stakeholders",
    "coordination",
    "collaboration",
    "program",
    "program management",
    "alignment",
    "interface",
    "multi-team",
    "matrix",
}

AUTOMOTIVE_KEYWORDS = {
    "automotive",
    "oem",
    "manufacturing",
    "mobility",
    "vehicle",
    "supplier",
    "industrial",
}


# ============================================================
# Ordinal mappings
# ============================================================

INTERNAL_KNOWLEDGE_MAP: dict[str, float] = {
    "none": 0.00,
    "low": 0.20,
    "basic": 0.30,
    "medium": 0.60,
    "moderate": 0.60,
    "high": 1.00,
    "strong": 1.00,
    "deep": 1.00,
}

CROSS_FUNCTIONAL_SCOPE_MAP: dict[str, float] = {
    "none": 0.00,
    "narrow": 0.20,
    "limited": 0.25,
    "medium": 0.60,
    "moderate": 0.60,
    "broad": 1.00,
    "enterprise": 1.00,
    "global": 1.00,
}

EDUCATION_LEVEL_MAP: dict[str, float] = {
    "high school": 0.20,
    "associate": 0.35,
    "bachelor": 0.55,
    "bachelors": 0.55,
    "master": 0.80,
    "masters": 0.80,
    "mba": 0.90,
    "phd": 1.00,
    "doctorate": 1.00,
}

INDUSTRY_EXPERIENCE_MAP: dict[str, float] = {
    "none": 0.00,
    "general": 0.30,
    "industrial": 0.65,
    "manufacturing": 0.80,
    "automotive": 1.00,
    "supply chain": 0.85,
    "logistics": 0.75,
}


# ============================================================
# Utility helpers
# ============================================================

def validate_required_candidate_columns(df: pd.DataFrame) -> None:
    if not isinstance(df, pd.DataFrame):
        raise TypeError("df must be a pandas DataFrame.")

    missing = [col for col in REQUIRED_CANDIDATE_COLUMNS if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required candidate columns: {missing}")


def normalize_text(text: object) -> str:
    if pd.isna(text):
        return ""
    text = str(text).strip().lower()
    for sep in [";", "|", "/", "\\"]:
        text = text.replace(sep, ",")
    return " ".join(text.split())


def tokenize_multivalue_field(text: object) -> list[str]:
    normalized = normalize_text(text)
    if not normalized:
        return []

    parts = [part.strip() for part in normalized.split(",") if part.strip()]
    tokens: list[str] = []
    for part in parts:
        tokens.append(part)
        # also add smaller fragments for flexible matching
        for sub in part.split():
            if sub and sub not in tokens:
                tokens.append(sub)
    return tokens


def safe_float(value: object, default: float = 0.0) -> float:
    try:
        if pd.isna(value):
            return default
        return float(value)
    except Exception:
        return default


def normalize_bounded(value: object, cap: float) -> float:
    raw = max(0.0, safe_float(value, 0.0))
    if cap <= 0:
        return 0.0
    return min(raw / cap, 1.0)


def clip_0_100(value: float) -> float:
    return round(max(0.0, min(100.0, float(value))), 2)


def map_ordinal_value(
    value: object,
    mapping: dict[str, float],
    default: float = 0.30,
) -> float:
    text = normalize_text(value)
    if not text:
        return default

    if text in mapping:
        return mapping[text]

    for key, mapped in mapping.items():
        if key in text:
            return mapped

    return default


def score_automotive_industry(value: object) -> float:
    text = normalize_text(value)
    if not text:
        return 0.30

    if text in INDUSTRY_EXPERIENCE_MAP:
        return INDUSTRY_EXPERIENCE_MAP[text]

    for key, mapped in INDUSTRY_EXPERIENCE_MAP.items():
        if key in text:
            return mapped

    if any(keyword in text for keyword in AUTOMOTIVE_KEYWORDS):
        return 0.90

    return 0.40


def keyword_fraction(tokens: list[str], keywords: set[str]) -> float:
    if not tokens:
        return 0.0

    joined = " | ".join(tokens)
    matched = 0
    for keyword in keywords:
        if keyword in joined:
            matched += 1

    # Saturate after a few meaningful matches
    return min(matched / 4.0, 1.0)


def blended_keyword_score(
    role_tokens: list[str],
    expertise_tokens: list[str],
    keywords: set[str],
    role_weight: float = 0.60,
    expertise_weight: float = 0.40,
) -> float:
    role_score = keyword_fraction(role_tokens, keywords)
    expertise_score = keyword_fraction(expertise_tokens, keywords)
    return (role_weight * role_score) + (expertise_weight * expertise_score)


def has_any_keyword(tokens: list[str], keywords: set[str]) -> bool:
    if not tokens:
        return False
    joined = " | ".join(tokens)
    return any(keyword in joined for keyword in keywords)


# ============================================================
# Row preprocessing
# ============================================================

def extract_row_features(row: pd.Series) -> dict[str, Any]:
    role_tokens = tokenize_multivalue_field(row.get("latest_roles"))
    expertise_tokens = tokenize_multivalue_field(row.get("expertise"))

    years_experience = normalize_bounded(row.get("years_experience"), cap=15.0)
    leadership_years = normalize_bounded(row.get("leadership_years"), cap=10.0)
    supply_chain_years = normalize_bounded(row.get("supply_chain_experience_years"), cap=15.0)

    internal_knowledge = map_ordinal_value(
        row.get("internal_company_knowledge"),
        INTERNAL_KNOWLEDGE_MAP,
        default=0.30,
    )
    cross_scope = map_ordinal_value(
        row.get("cross_functional_scope"),
        CROSS_FUNCTIONAL_SCOPE_MAP,
        default=0.30,
    )
    education_strength = map_ordinal_value(
        row.get("education_level"),
        EDUCATION_LEVEL_MAP,
        default=0.50,
    )
    industry_strength = score_automotive_industry(row.get("industry_experience"))

    leadership_keyword_score = blended_keyword_score(
        role_tokens, expertise_tokens, LEADERSHIP_KEYWORDS
    )
    supply_chain_keyword_score = blended_keyword_score(
        role_tokens, expertise_tokens, SUPPLY_CHAIN_KEYWORDS
    )
    disruption_keyword_score = blended_keyword_score(
        role_tokens, expertise_tokens, DISRUPTION_KEYWORDS
    )
    transformation_keyword_score = blended_keyword_score(
        role_tokens, expertise_tokens, TRANSFORMATION_KEYWORDS
    )
    operations_keyword_score = blended_keyword_score(
        role_tokens, expertise_tokens, OPERATIONS_KEYWORDS
    )
    cross_keyword_score = blended_keyword_score(
        role_tokens, expertise_tokens, CROSS_FUNCTIONAL_KEYWORDS
    )

    return {
        "role_tokens": role_tokens,
        "expertise_tokens": expertise_tokens,
        "years_experience_norm": years_experience,
        "leadership_years_norm": leadership_years,
        "supply_chain_years_norm": supply_chain_years,
        "internal_knowledge_norm": internal_knowledge,
        "cross_scope_norm": cross_scope,
        "education_strength_norm": education_strength,
        "industry_strength_norm": industry_strength,
        "leadership_keyword_score": leadership_keyword_score,
        "supply_chain_keyword_score": supply_chain_keyword_score,
        "disruption_keyword_score": disruption_keyword_score,
        "transformation_keyword_score": transformation_keyword_score,
        "operations_keyword_score": operations_keyword_score,
        "cross_keyword_score": cross_keyword_score,
    }


# ============================================================
# Intermediate signal scoring
# ============================================================

def score_supply_chain_depth(features: dict[str, Any]) -> float:
    score = (
        0.45 * features["supply_chain_keyword_score"]
        + 0.35 * features["supply_chain_years_norm"]
        + 0.20 * features["years_experience_norm"]
    )
    return clip_0_100(score * 100.0)


def score_leadership_signal(features: dict[str, Any]) -> float:
    score = (
        0.45 * features["leadership_years_norm"]
        + 0.35 * features["leadership_keyword_score"]
        + 0.20 * features["cross_scope_norm"]
    )
    return clip_0_100(score * 100.0)


def score_internal_navigation(features: dict[str, Any]) -> float:
    score = (
        0.70 * features["internal_knowledge_norm"]
        + 0.30 * features["industry_strength_norm"]
    )
    return clip_0_100(score * 100.0)


def score_cross_functional_coordination(features: dict[str, Any]) -> float:
    score = (
        0.50 * features["cross_scope_norm"]
        + 0.30 * features["cross_keyword_score"]
        + 0.20 * features["leadership_keyword_score"]
    )
    return clip_0_100(score * 100.0)


def score_disruption_exposure(features: dict[str, Any]) -> float:
    score = (
        0.50 * features["disruption_keyword_score"]
        + 0.30 * features["supply_chain_keyword_score"]
        + 0.20 * features["leadership_years_norm"]
    )
    return clip_0_100(score * 100.0)


def score_transformation_exposure(features: dict[str, Any]) -> float:
    score = (
        0.55 * features["transformation_keyword_score"]
        + 0.20 * features["leadership_keyword_score"]
        + 0.15 * features["education_strength_norm"]
        + 0.10 * features["cross_scope_norm"]
    )
    return clip_0_100(score * 100.0)


def score_operational_execution(features: dict[str, Any]) -> float:
    score = (
        0.45 * features["operations_keyword_score"]
        + 0.25 * features["supply_chain_keyword_score"]
        + 0.20 * features["years_experience_norm"]
        + 0.10 * features["internal_knowledge_norm"]
    )
    return clip_0_100(score * 100.0)


# ============================================================
# Final competency scoring
# ============================================================

def compute_final_competencies(signal_values: dict[str, float], features: dict[str, Any]) -> dict[str, float]:
    disruption_management = clip_0_100(
        0.35 * signal_values["signal_disruption_exposure"]
        + 0.20 * signal_values["signal_supply_chain_depth"]
        + 0.20 * signal_values["signal_leadership"]
        + 0.15 * signal_values["signal_cross_functional_coordination"]
        + 0.10 * signal_values["signal_internal_navigation"]
    )

    digital_transformation = clip_0_100(
        0.40 * signal_values["signal_transformation_exposure"]
        + 0.20 * signal_values["signal_leadership"]
        + 0.20 * signal_values["signal_cross_functional_coordination"]
        + 0.10 * signal_values["signal_internal_navigation"]
        + 0.10 * (features["education_strength_norm"] * 100.0)
    )

    operational_continuity = clip_0_100(
        0.35 * signal_values["signal_operational_execution"]
        + 0.25 * signal_values["signal_supply_chain_depth"]
        + 0.15 * signal_values["signal_internal_navigation"]
        + 0.15 * signal_values["signal_leadership"]
        + 0.10 * signal_values["signal_cross_functional_coordination"]
    )

    leadership = clip_0_100(
        0.60 * signal_values["signal_leadership"]
        + 0.25 * signal_values["signal_cross_functional_coordination"]
        + 0.15 * (features["leadership_years_norm"] * 100.0)
    )

    bmw_context_fit = clip_0_100(
        0.40 * signal_values["signal_internal_navigation"]
        + 0.25 * (features["industry_strength_norm"] * 100.0)
        + 0.20 * signal_values["signal_supply_chain_depth"]
        + 0.15 * (features["cross_scope_norm"] * 100.0)
    )

    overall = clip_0_100(
        (
            disruption_management
            + digital_transformation
            + operational_continuity
            + leadership
            + bmw_context_fit
        ) / 5.0
    )

    return {
        "competency_disruption_management": disruption_management,
        "competency_digital_transformation": digital_transformation,
        "competency_operational_continuity": operational_continuity,
        "competency_leadership": leadership,
        "competency_bmw_context_fit": bmw_context_fit,
        "competency_overall": overall,
    }


# ============================================================
# Public API
# ============================================================

def score_candidates(df: pd.DataFrame) -> pd.DataFrame:
    """
    Score raw candidate profiles into intermediate signals and final competencies.

    This function is designed to work on both:
    - historical_outcomes_raw.csv
    - current_applicants_raw.csv
    """
    validate_required_candidate_columns(df)

    result = df.copy()

    signal_rows: list[dict[str, float]] = []
    competency_rows: list[dict[str, float]] = []

    for _, row in result.iterrows():
        features = extract_row_features(row)

        signals = {
            "signal_supply_chain_depth": score_supply_chain_depth(features),
            "signal_leadership": score_leadership_signal(features),
            "signal_internal_navigation": score_internal_navigation(features),
            "signal_cross_functional_coordination": score_cross_functional_coordination(features),
            "signal_disruption_exposure": score_disruption_exposure(features),
            "signal_transformation_exposure": score_transformation_exposure(features),
            "signal_operational_execution": score_operational_execution(features),
        }

        competencies = compute_final_competencies(signals, features)

        signal_rows.append(signals)
        competency_rows.append(competencies)

    signal_df = pd.DataFrame(signal_rows, index=result.index)
    competency_df = pd.DataFrame(competency_rows, index=result.index)

    return pd.concat([result, signal_df, competency_df], axis=1)


def get_signal_columns() -> list[str]:
    return [
        "signal_supply_chain_depth",
        "signal_leadership",
        "signal_internal_navigation",
        "signal_cross_functional_coordination",
        "signal_disruption_exposure",
        "signal_transformation_exposure",
        "signal_operational_execution",
    ]


def get_competency_columns() -> list[str]:
    return [
        "competency_disruption_management",
        "competency_digital_transformation",
        "competency_operational_continuity",
        "competency_leadership",
        "competency_bmw_context_fit",
        "competency_overall",
    ]

def prepare_scored_candidates(df: pd.DataFrame) -> pd.DataFrame:
    """
    Validate and score raw candidate data for downstream ranking.
    """
    return score_candidates(df)

if __name__ == "__main__":
    print("Candidate Agent ready.")
    print("Required columns:", REQUIRED_CANDIDATE_COLUMNS)