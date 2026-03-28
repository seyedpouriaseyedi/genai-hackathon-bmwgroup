from __future__ import annotations

import random
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd


# =========================================================
# CONFIG
# =========================================================
SEED = 42
N_HISTORICAL = 250
N_CURRENT = 30
OUTPUT_DIR = Path("data/generated")

random.seed(SEED)
np.random.seed(SEED)


# =========================================================
# HELPERS
# =========================================================
def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def noisy_score(base: float, noise: float = 0.45, low: int = 1, high: int = 5) -> int:
    return int(round(clamp(np.random.normal(base, noise), low, high)))


def weighted_pick(options: List[Tuple[str, float]]) -> str:
    labels, weights = zip(*options)
    return random.choices(labels, weights=weights, k=1)[0]


def unique_sample(items: List[str], k: int) -> List[str]:
    k = min(k, len(items))
    return random.sample(items, k)


def score_0_100(x: float, noise: float = 3.0) -> int:
    return int(round(clamp(x + np.random.normal(0, noise), 0, 100)))


def months_from_anchor(anchor: float, bias: float = 0.0) -> int:
    months = 10 - 1.2 * anchor + bias + np.random.normal(0, 0.8)
    return int(round(clamp(months, 1, 12)))


def bernoulli(prob: float) -> int:
    return int(random.random() < prob)


# =========================================================
# STATIC OPTIONS
# =========================================================
EDUCATION_OPTIONS = [
    ("Bachelor", 0.38),
    ("Master", 0.42),
    ("MBA", 0.14),
    ("PhD", 0.06),
]

INDUSTRY_OPTIONS = [
    ("automotive", 0.36),
    ("manufacturing", 0.24),
    ("logistics", 0.18),
    ("industrial goods", 0.08),
    ("retail", 0.08),
    ("electronics", 0.06),
]

SCENARIO_OPTIONS = [
    ("Supply Chain Disruption", 0.36),
    ("Digital Transformation", 0.29),
    ("Operational Continuity", 0.35),
]

FIRST_NAMES = [
    "Anna", "Lukas", "Sofia", "Jonas", "Mila", "Noah", "Emilia", "David", "Lea", "Leon",
    "Maya", "Felix", "Nina", "Paul", "Sara", "Ben", "Julia", "Tom", "Laura", "Elias",
    "Clara", "Finn", "Marta", "Jan", "Helena", "Erik", "Eva", "Daniel", "Mina", "Samuel",
]

LAST_NAMES = [
    "Keller", "Wagner", "Hoffmann", "Becker", "Schmidt", "Krause", "Neumann", "Fischer",
    "Weber", "Hartmann", "Bauer", "Wolf", "Richter", "Schäfer", "König", "Otto",
    "Meyer", "Schulz", "Krüger", "Vogel", "Franke", "Lange", "Werner", "Schuster",
]

BASE_ROLE_LIBRARY = {
    "crisis_operator": [
        "Regional Operations Manager",
        "Supply Chain Incident Lead",
        "Logistics Escalation Manager",
        "Supplier Recovery Lead",
        "Distribution Operations Manager",
        "Plant Logistics Manager",
        "Global Supply Response Manager",
    ],
    "transformation_leader": [
        "Supply Chain Transformation Manager",
        "Operations Excellence Lead",
        "Digital Supply Chain Manager",
        "Process Improvement Manager",
        "ERP Rollout Lead",
        "Logistics Transformation Lead",
        "Change Program Manager",
    ],
    "continuity_insider": [
        "Internal Operations Manager",
        "Plant Operations Lead",
        "Site Logistics Manager",
        "Regional Fulfillment Manager",
        "Business Continuity Manager",
        "Internal Supply Chain Lead",
        "Manufacturing Operations Manager",
    ],
    "balanced_senior": [
        "Senior Supply Chain Manager",
        "Head of Operations",
        "Regional Supply Chain Lead",
        "Operations Program Manager",
        "Supply Chain Strategy Lead",
        "Logistics Performance Manager",
        "Manufacturing Operations Lead",
    ],
    "high_potential": [
        "Supply Chain Project Manager",
        "Operations Manager",
        "Logistics Program Lead",
        "Continuous Improvement Manager",
        "Demand Planning Manager",
        "Supplier Performance Manager",
        "Operations Analytics Manager",
    ],
}

BASE_EXPERTISE_LIBRARY = {
    "crisis_operator": [
        "supplier escalation",
        "inventory recovery",
        "risk mitigation",
        "capacity reallocation",
        "incident response",
        "stakeholder coordination",
        "root cause analysis",
        "S&OP",
        "SAP",
        "cross-site coordination",
    ],
    "transformation_leader": [
        "digital transformation",
        "change management",
        "process optimization",
        "ERP implementation",
        "KPI design",
        "automation enablement",
        "cross-functional leadership",
        "data-driven decision making",
        "continuous improvement",
        "Power BI",
    ],
    "continuity_insider": [
        "operational continuity",
        "process governance",
        "resource planning",
        "site operations",
        "SOP execution",
        "workforce planning",
        "compliance management",
        "inventory control",
        "stakeholder coordination",
        "SAP",
    ],
    "balanced_senior": [
        "supply chain strategy",
        "supplier management",
        "KPI management",
        "inventory planning",
        "capacity planning",
        "cross-functional leadership",
        "continuous improvement",
        "operations planning",
        "risk mitigation",
        "stakeholder coordination",
    ],
    "high_potential": [
        "adaptability",
        "project management",
        "process improvement",
        "cross-functional collaboration",
        "analytics",
        "continuous improvement",
        "workflow optimization",
        "operations planning",
        "data analysis",
        "stakeholder coordination",
    ],
}


# =========================================================
# ARCHETYPES
# =========================================================
@dataclass
class Archetype:
    name: str
    probability: float
    candidate_source_probs: Dict[str, float]
    years_exp_range: Tuple[int, int]
    leadership_years_range: Tuple[int, int]
    supply_chain_exp_range: Tuple[int, int]
    internal_knowledge_base: float
    cross_functional_scope_base: float
    crisis_management_base: float
    stakeholder_management_base: float
    adaptability_base: float
    digital_transformation_base: float
    decision_under_pressure_base: float
    operations_leadership_base: float
    supplier_management_base: float
    continuity_focus_base: float
    role_key: str
    expertise_key: str


ARCHETYPES = [
    Archetype(
        name="crisis_operator",
        probability=0.23,
        candidate_source_probs={"internal": 0.35, "external": 0.65},
        years_exp_range=(10, 20),
        leadership_years_range=(5, 12),
        supply_chain_exp_range=(7, 18),
        internal_knowledge_base=2.8,
        cross_functional_scope_base=4.0,
        crisis_management_base=4.8,
        stakeholder_management_base=4.2,
        adaptability_base=3.2,
        digital_transformation_base=2.7,
        decision_under_pressure_base=4.8,
        operations_leadership_base=4.3,
        supplier_management_base=4.4,
        continuity_focus_base=3.8,
        role_key="crisis_operator",
        expertise_key="crisis_operator",
    ),
    Archetype(
        name="transformation_leader",
        probability=0.21,
        candidate_source_probs={"internal": 0.25, "external": 0.75},
        years_exp_range=(7, 18),
        leadership_years_range=(3, 10),
        supply_chain_exp_range=(4, 13),
        internal_knowledge_base=2.5,
        cross_functional_scope_base=4.5,
        crisis_management_base=3.0,
        stakeholder_management_base=4.0,
        adaptability_base=4.8,
        digital_transformation_base=4.8,
        decision_under_pressure_base=3.6,
        operations_leadership_base=3.8,
        supplier_management_base=3.2,
        continuity_focus_base=3.1,
        role_key="transformation_leader",
        expertise_key="transformation_leader",
    ),
    Archetype(
        name="continuity_insider",
        probability=0.18,
        candidate_source_probs={"internal": 0.85, "external": 0.15},
        years_exp_range=(9, 20),
        leadership_years_range=(4, 11),
        supply_chain_exp_range=(6, 17),
        internal_knowledge_base=4.8,
        cross_functional_scope_base=4.0,
        crisis_management_base=3.8,
        stakeholder_management_base=4.2,
        adaptability_base=3.1,
        digital_transformation_base=2.8,
        decision_under_pressure_base=4.1,
        operations_leadership_base=4.3,
        supplier_management_base=3.9,
        continuity_focus_base=4.8,
        role_key="continuity_insider",
        expertise_key="continuity_insider",
    ),
    Archetype(
        name="balanced_senior",
        probability=0.24,
        candidate_source_probs={"internal": 0.45, "external": 0.55},
        years_exp_range=(10, 22),
        leadership_years_range=(5, 13),
        supply_chain_exp_range=(7, 18),
        internal_knowledge_base=3.6,
        cross_functional_scope_base=4.2,
        crisis_management_base=4.1,
        stakeholder_management_base=4.1,
        adaptability_base=3.9,
        digital_transformation_base=3.7,
        decision_under_pressure_base=4.1,
        operations_leadership_base=4.4,
        supplier_management_base=4.0,
        continuity_focus_base=4.0,
        role_key="balanced_senior",
        expertise_key="balanced_senior",
    ),
    Archetype(
        name="high_potential",
        probability=0.14,
        candidate_source_probs={"internal": 0.30, "external": 0.70},
        years_exp_range=(4, 10),
        leadership_years_range=(1, 5),
        supply_chain_exp_range=(3, 8),
        internal_knowledge_base=2.4,
        cross_functional_scope_base=4.2,
        crisis_management_base=3.0,
        stakeholder_management_base=3.6,
        adaptability_base=4.6,
        digital_transformation_base=4.1,
        decision_under_pressure_base=3.4,
        operations_leadership_base=3.1,
        supplier_management_base=3.4,
        continuity_focus_base=3.0,
        role_key="high_potential",
        expertise_key="high_potential",
    ),
]


# =========================================================
# PROFILE GENERATION
# =========================================================
def choose_archetype() -> Archetype:
    return random.choices(
        ARCHETYPES,
        weights=[a.probability for a in ARCHETYPES],
        k=1,
    )[0]


def generate_name(used_names: set[str]) -> str:
    while True:
        name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
        if name not in used_names:
            used_names.add(name)
            return name


def build_profile(archetype: Archetype, candidate_source: str) -> Dict[str, object]:
    years_experience = random.randint(*archetype.years_exp_range)
    leadership_years = min(years_experience, random.randint(*archetype.leadership_years_range))
    supply_chain_experience_years = min(years_experience, random.randint(*archetype.supply_chain_exp_range))

    internal_bonus = 1.1 if candidate_source == "internal" else -0.2

    return {
        "years_experience": years_experience,
        "leadership_years": leadership_years,
        "supply_chain_experience_years": supply_chain_experience_years,
        "internal_company_knowledge": noisy_score(archetype.internal_knowledge_base + internal_bonus, 0.35),
        "cross_functional_scope": noisy_score(archetype.cross_functional_scope_base, 0.45),
        "crisis_management_latent": noisy_score(archetype.crisis_management_base, 0.45),
        "stakeholder_management_latent": noisy_score(archetype.stakeholder_management_base, 0.45),
        "adaptability_latent": noisy_score(archetype.adaptability_base, 0.45),
        "digital_transformation_experience_latent": noisy_score(archetype.digital_transformation_base, 0.45),
        "decision_under_pressure_latent": noisy_score(archetype.decision_under_pressure_base, 0.45),
        "operations_leadership_latent": noisy_score(archetype.operations_leadership_base, 0.40),
        "supplier_management_latent": noisy_score(archetype.supplier_management_base, 0.45),
        "continuity_focus_latent": noisy_score(archetype.continuity_focus_base, 0.40),
        "education_level": weighted_pick(EDUCATION_OPTIONS),
        "industry_experience": weighted_pick(INDUSTRY_OPTIONS),
    }


def build_text_fields(archetype: Archetype, profile: Dict[str, object]) -> Tuple[str, str]:
    role_pool = BASE_ROLE_LIBRARY[archetype.role_key][:]
    expertise_pool = BASE_EXPERTISE_LIBRARY[archetype.expertise_key][:]

    extra_roles = []
    if profile["digital_transformation_experience_latent"] >= 4:
        extra_roles += ["Transformation Program Lead", "ERP Change Lead"]
    if profile["crisis_management_latent"] >= 4:
        extra_roles += ["Emergency Operations Coordinator", "Supplier Recovery Lead"]
    if profile["internal_company_knowledge"] >= 4:
        extra_roles += ["Internal Operations Manager", "Site Continuity Lead"]
    if profile["operations_leadership_latent"] >= 4:
        extra_roles += ["Head of Operations", "Regional Operations Director"]

    role_pool = list(dict.fromkeys(role_pool + extra_roles))
    latest_roles = "; ".join(unique_sample(role_pool, random.randint(2, 4)))

    extra_expertise = []
    if profile["crisis_management_latent"] >= 4:
        extra_expertise += ["crisis management", "incident response", "supplier escalation"]
    if profile["stakeholder_management_latent"] >= 4:
        extra_expertise += ["stakeholder coordination", "cross-functional leadership", "executive communication"]
    if profile["adaptability_latent"] >= 4:
        extra_expertise += ["adaptability", "change leadership", "process redesign"]
    if profile["digital_transformation_experience_latent"] >= 4:
        extra_expertise += ["digital transformation", "ERP implementation", "automation enablement"]
    if profile["decision_under_pressure_latent"] >= 4:
        extra_expertise += ["rapid decision making", "escalation handling", "high-pressure operations"]
    if profile["operations_leadership_latent"] >= 4:
        extra_expertise += ["operations leadership", "team leadership", "performance management"]
    if profile["supplier_management_latent"] >= 4:
        extra_expertise += ["supplier management", "vendor performance", "supplier negotiation"]
    if profile["continuity_focus_latent"] >= 4:
        extra_expertise += ["operational continuity", "business continuity", "process governance"]

    expertise_pool = list(dict.fromkeys(expertise_pool + extra_expertise))
    expertise = "; ".join(unique_sample(expertise_pool, random.randint(6, 9)))

    return latest_roles, expertise


# =========================================================
# OUTCOME GENERATION
# =========================================================
def scenario_success_components(profile: Dict[str, object]) -> Dict[str, float]:
    disruption_readiness = (
        0.30 * profile["crisis_management_latent"] +
        0.22 * profile["stakeholder_management_latent"] +
        0.18 * profile["decision_under_pressure_latent"] +
        0.16 * profile["supplier_management_latent"] +
        0.14 * min(profile["supply_chain_experience_years"] / 3.0, 5.0)
    )

    transformation_capacity = (
        0.32 * profile["adaptability_latent"] +
        0.28 * profile["digital_transformation_experience_latent"] +
        0.20 * profile["cross_functional_scope"] +
        0.20 * min(profile["leadership_years"] / 2.5, 5.0)
    )

    continuity_strength = (
        0.28 * profile["internal_company_knowledge"] +
        0.22 * profile["continuity_focus_latent"] +
        0.18 * profile["stakeholder_management_latent"] +
        0.16 * profile["operations_leadership_latent"] +
        0.16 * min(profile["years_experience"] / 4.0, 5.0)
    )

    return {
        "disruption_readiness": disruption_readiness,
        "transformation_capacity": transformation_capacity,
        "continuity_strength": continuity_strength,
    }


def generate_historical_outcomes(profile: Dict[str, object], scenario_type: str) -> Tuple[Dict[str, int], Dict[str, float]]:
    components = scenario_success_components(profile)

    base_continuity = 52 + components["continuity_strength"] * 8.5
    base_disruption = 50 + components["disruption_readiness"] * 9.0
    base_transformation = 48 + components["transformation_capacity"] * 9.2

    scenario_bonus = {
        "Supply Chain Disruption": {"disruption": 8, "continuity": 3, "transformation": -2},
        "Digital Transformation": {"disruption": -2, "continuity": 1, "transformation": 8},
        "Operational Continuity": {"disruption": 1, "continuity": 8, "transformation": -1},
    }[scenario_type]

    disruption_response_score = score_0_100(base_disruption + scenario_bonus["disruption"])
    operational_continuity_score = score_0_100(base_continuity + scenario_bonus["continuity"])
    transformation_success_score = score_0_100(base_transformation + scenario_bonus["transformation"])

    productivity_anchor = (
        0.40 * profile["internal_company_knowledge"] +
        0.25 * profile["operations_leadership_latent"] +
        0.20 * min(profile["years_experience"] / 4.0, 5.0) +
        0.15 * profile["stakeholder_management_latent"]
    )
    time_to_productivity_months = months_from_anchor(productivity_anchor)

    retention_prob = clamp(
        0.35
        + 0.08 * (profile["internal_company_knowledge"] / 5.0)
        + 0.07 * (profile["operations_leadership_latent"] / 5.0)
        + 0.05 * (profile["continuity_focus_latent"] / 5.0),
        0.15,
        0.92,
    )
    retention_12m = bernoulli(retention_prob)

    outcomes = {
        "time_to_productivity_months": time_to_productivity_months,
        "operational_continuity_score": operational_continuity_score,
        "disruption_response_score": disruption_response_score,
        "transformation_success_score": transformation_success_score,
        "retention_12m": retention_12m,
    }

    return outcomes, components


# =========================================================
# RECORD BUILDERS
# =========================================================
def make_historical_record(idx: int, used_names: set[str]) -> Tuple[Dict[str, object], Dict[str, object]]:
    archetype = choose_archetype()
    candidate_source = weighted_pick(list(archetype.candidate_source_probs.items()))
    profile = build_profile(archetype, candidate_source)
    latest_roles, expertise = build_text_fields(archetype, profile)
    scenario_type = weighted_pick(SCENARIO_OPTIONS)
    outcomes, components = generate_historical_outcomes(profile, scenario_type)
    name = generate_name(used_names)

    raw_record = {
        "candidate_id": f"H{idx:04d}",
        "name": name,
        "candidate_source": candidate_source,
        "latest_roles": latest_roles,
        "expertise": expertise,
        "years_experience": profile["years_experience"],
        "leadership_years": profile["leadership_years"],
        "education_level": profile["education_level"],
        "industry_experience": profile["industry_experience"],
        "supply_chain_experience_years": profile["supply_chain_experience_years"],
        "internal_company_knowledge": profile["internal_company_knowledge"],
        "cross_functional_scope": profile["cross_functional_scope"],
        "scenario_type": scenario_type,
        "hiring_decision": "appointed",
        **outcomes,
    }

    debug_record = {
        **raw_record,
        "archetype": archetype.name,
        "crisis_management_latent": profile["crisis_management_latent"],
        "stakeholder_management_latent": profile["stakeholder_management_latent"],
        "adaptability_latent": profile["adaptability_latent"],
        "digital_transformation_experience_latent": profile["digital_transformation_experience_latent"],
        "decision_under_pressure_latent": profile["decision_under_pressure_latent"],
        "operations_leadership_latent": profile["operations_leadership_latent"],
        "supplier_management_latent": profile["supplier_management_latent"],
        "continuity_focus_latent": profile["continuity_focus_latent"],
        "disruption_readiness_latent": round(components["disruption_readiness"], 3),
        "transformation_capacity_latent": round(components["transformation_capacity"], 3),
        "continuity_strength_latent": round(components["continuity_strength"], 3),
    }

    return raw_record, debug_record


def make_current_applicant(idx: int, used_names: set[str]) -> Tuple[Dict[str, object], Dict[str, object]]:
    archetype = choose_archetype()
    candidate_source = weighted_pick(list(archetype.candidate_source_probs.items()))
    profile = build_profile(archetype, candidate_source)
    latest_roles, expertise = build_text_fields(archetype, profile)
    name = generate_name(used_names)
    components = scenario_success_components(profile)

    raw_record = {
        "candidate_id": f"C{idx:04d}",
        "name": name,
        "candidate_source": candidate_source,
        "latest_roles": latest_roles,
        "expertise": expertise,
        "years_experience": profile["years_experience"],
        "leadership_years": profile["leadership_years"],
        "education_level": profile["education_level"],
        "industry_experience": profile["industry_experience"],
        "supply_chain_experience_years": profile["supply_chain_experience_years"],
        "internal_company_knowledge": profile["internal_company_knowledge"],
        "cross_functional_scope": profile["cross_functional_scope"],
    }

    debug_record = {
        **raw_record,
        "archetype": archetype.name,
        "crisis_management_latent": profile["crisis_management_latent"],
        "stakeholder_management_latent": profile["stakeholder_management_latent"],
        "adaptability_latent": profile["adaptability_latent"],
        "digital_transformation_experience_latent": profile["digital_transformation_experience_latent"],
        "decision_under_pressure_latent": profile["decision_under_pressure_latent"],
        "operations_leadership_latent": profile["operations_leadership_latent"],
        "supplier_management_latent": profile["supplier_management_latent"],
        "continuity_focus_latent": profile["continuity_focus_latent"],
        "disruption_readiness_latent": round(components["disruption_readiness"], 3),
        "transformation_capacity_latent": round(components["transformation_capacity"], 3),
        "continuity_strength_latent": round(components["continuity_strength"], 3),
    }

    return raw_record, debug_record


# =========================================================
# MAIN
# =========================================================
def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    used_names: set[str] = set()

    historical_raw_rows = []
    historical_debug_rows = []
    for i in range(1, N_HISTORICAL + 1):
        raw_row, debug_row = make_historical_record(i, used_names)
        historical_raw_rows.append(raw_row)
        historical_debug_rows.append(debug_row)

    current_raw_rows = []
    current_debug_rows = []
    for i in range(1, N_CURRENT + 1):
        raw_row, debug_row = make_current_applicant(i, used_names)
        current_raw_rows.append(raw_row)
        current_debug_rows.append(debug_row)

    historical_raw_df = pd.DataFrame(historical_raw_rows)
    historical_debug_df = pd.DataFrame(historical_debug_rows)
    current_raw_df = pd.DataFrame(current_raw_rows)
    current_debug_df = pd.DataFrame(current_debug_rows)

    historical_raw_path = OUTPUT_DIR / "historical_outcomes_raw.csv"
    historical_debug_path = OUTPUT_DIR / "historical_outcomes_internal_debug.csv"
    current_raw_path = OUTPUT_DIR / "current_applicants_raw.csv"
    current_debug_path = OUTPUT_DIR / "current_applicants_internal_debug.csv"

    historical_raw_df.to_csv(historical_raw_path, index=False)
    historical_debug_df.to_csv(historical_debug_path, index=False)
    current_raw_df.to_csv(current_raw_path, index=False)
    current_debug_df.to_csv(current_debug_path, index=False)

    print("Done.")
    print(f"Saved: {historical_raw_path}")
    print(f"Saved: {historical_debug_path}")
    print(f"Saved: {current_raw_path}")
    print(f"Saved: {current_debug_path}")

    print("\nHistorical raw preview:")
    print(historical_raw_df.head(3).to_string(index=False))

    print("\nCurrent applicants raw preview:")
    print(current_raw_df.head(3).to_string(index=False))


if __name__ == "__main__":
    main()