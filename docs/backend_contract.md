# Backend Contract

## Purpose

This document defines the stable backend contract for the hackathon prototype:

**Scenario-Based Ranking for Supply Chain Operations Lead**

The frontend should treat this contract as the single source of truth for backend integration.

The UI must call only the orchestrator entrypoint and must not depend directly on internal backend agents.

---

## Backend entrypoint

```python
run_decision_pipeline(
    scenario_name: str,
    current_applicants_df: pd.DataFrame,
    historical_df: pd.DataFrame | None = None,
    historical_path: str | None = None,
    top_n_table: int = 10,
    top_n_comparison: int = 5,
    top_n_what_if: int = 3,
    what_if_uplift: float = 10.0,
    auto_assign_mechanisms: bool = False,
) -> dict[str, Any]
```

---

## What the frontend sends

The UI should provide only:

1. `scenario_name`
2. uploaded applicant CSV converted into a dataframe

The uploaded applicant file must remain raw and must not contain precomputed competency scores.

---

## Supported scenarios

The backend currently supports exactly these scenario values:

- `Supply Chain Disruption`
- `Digital Transformation`
- `Operational Continuity`

These values should be used exactly as written in the UI.

---

## Expected applicant upload format

The uploaded applicant dataframe should contain these raw columns:

- `candidate_id`
- `name`
- `candidate_source`
- `latest_roles`
- `expertise`
- `years_experience`
- `leadership_years`
- `education_level`
- `industry_experience`
- `supply_chain_experience_years`
- `internal_company_knowledge`
- `cross_functional_scope`

The frontend should not modify or enrich these columns before sending them to the backend.

---

## What the backend does internally

The UI does not need to call these components directly, but this is the internal workflow:

1. validate selected scenario
2. load historical raw data
3. score current applicants using the Candidate Intelligence Agent
4. prepare historical scenario-specific data
5. rank candidates using the Ranking Agent
6. generate explanation using the Decision Explanation Agent
7. assemble one unified payload in the Orchestrator Agent

---

## Response payload shape

The backend returns one dictionary with this stable top-level structure:

```json
{
  "scenario_name": "Supply Chain Disruption",
  "summary": {},
  "artifacts": {},
  "explanation": {},
  "ranking_preview": [],
  "comparison_table": [],
  "what_if_analysis": [],
  "row_counts": {}
}
```

The frontend should assume these top-level keys always exist.

---

## Response payload details

### 1. `scenario_name`

Type:
- `string`

Description:
- canonical validated scenario name used for this decision run

Example:
```json
"scenario_name": "Supply Chain Disruption"
```

---

### 2. `summary`

Type:
- `object`

Description:
- compact recommendation output for the top candidate

Expected shape:
```json
{
  "scenario_name": "Supply Chain Disruption",
  "recommended_candidate_id": "C0028",
  "recommended_candidate_name": "Daniel Hartmann",
  "predicted_scenario_outcome": 68.12,
  "scenario_alignment_score": 63.74,
  "primary_feature": "competency_disruption_management",
  "top_strengths": [
    {
      "feature": "competency_disruption_management",
      "score": 64.32,
      "weight": 0.55,
      "weighted_contribution": 35.38
    }
  ]
}
```

Recommended UI usage:
- recommendation card
- headline metrics
- top candidate summary

---

### 3. `artifacts`

Type:
- `object`

Description:
- technical metadata about the ranking run

Expected shape:
```json
{
  "scenario_name": "Supply Chain Disruption",
  "graph_edges": [
    ["competency_leadership", "competency_disruption_management"],
    ["competency_disruption_management", "target_scenario_score"]
  ],
  "feature_columns": [
    "competency_disruption_management",
    "competency_operational_continuity",
    "competency_leadership",
    "competency_bmw_context_fit"
  ],
  "feature_weights": {
    "competency_disruption_management": 0.55,
    "competency_operational_continuity": 0.25,
    "competency_leadership": 0.10,
    "competency_bmw_context_fit": 0.10
  },
  "primary_feature": "competency_disruption_management",
  "n_training_rows": 75,
  "target_range": [10.27, 87.65]
}
```

Recommended UI usage:
- optional technical transparency section
- optional model details accordion
- not required for the main decision card

---

### 4. `explanation`

Type:
- `object`

Description:
- structured business explanation for why candidate #1 was selected

Expected shape:
```json
{
  "scenario_name": "Supply Chain Disruption",
  "business_goal": "Maximize disruption response and operational continuity while reducing ramp-up time.",
  "recommended_candidate_id": "C0028",
  "recommended_candidate_name": "Daniel Hartmann",
  "predicted_scenario_outcome": 68.12,
  "scenario_alignment_score": 63.74,
  "headline": "Daniel Hartmann is the recommended candidate for Supply Chain Disruption.",
  "summary_text": "Daniel Hartmann ranks first for Supply Chain Disruption with a predicted scenario outcome of 68.12 and a scenario alignment score of 63.74. The strongest scenario-relevant drivers are Disruption Management, Operational Continuity, and Leadership.",
  "top_strengths": [],
  "advantages_vs_runner_up": [],
  "tradeoffs": [],
  "what_if_insight": {},
  "explanation_ready": {
    "scenario_fit_reason": "The recommendation is based on scenario-weighted competencies aligned to Supply Chain Disruption, rather than a generic overall applicant score.",
    "primary_feature": "competency_disruption_management"
  }
}
```

Recommended UI usage:
- explanation panel
- “why this candidate” section
- tradeoff callout
- one-sentence explanation block

---

### 5. `ranking_preview`

Type:
- `list[object]`

Description:
- top-N ranked candidates as JSON records

Expected shape:
```json
[
  {
    "rank": 1,
    "candidate_id": "C0028",
    "name": "Daniel Hartmann",
    "candidate_source": "External",
    "predicted_scenario_outcome": 68.12,
    "scenario_alignment_score": 63.74,
    "competency_disruption_management": 64.32,
    "competency_operational_continuity": 59.65,
    "competency_leadership": 67.55,
    "competency_bmw_context_fit": 66.92
  }
]
```

Recommended UI usage:
- quick ranking preview
- preview table under recommendation card

---

### 6. `comparison_table`

Type:
- `list[object]`

Description:
- top-N comparison records limited to the most relevant scenario columns

Expected shape:
```json
[
  {
    "rank": 1,
    "candidate_id": "C0028",
    "name": "Daniel Hartmann",
    "predicted_scenario_outcome": 68.12,
    "scenario_alignment_score": 63.74,
    "competency_disruption_management": 64.32,
    "competency_operational_continuity": 59.65,
    "competency_leadership": 67.55,
    "competency_bmw_context_fit": 66.92
  }
]
```

Recommended UI usage:
- main comparison table in dashboard
- top 5 candidate comparison

---

### 7. `what_if_analysis`

Type:
- `list[object]`

Description:
- what-if intervention outputs for the top ranked candidates

Expected shape:
```json
[
  {
    "candidate_id": "C0028",
    "candidate_name": "Daniel Hartmann",
    "baseline_target": 68.12,
    "simulated_target": 72.98,
    "delta_vs_baseline": 4.86,
    "baseline_alignment": 63.74,
    "simulated_alignment": 70.68,
    "interventions": {
      "competency_disruption_management": 10.0
    },
    "intervention": "competency_disruption_management +10.0"
  }
]
```

Recommended UI usage:
- what-if analysis section
- improvement insight card
- optional expandable details

---

### 8. `row_counts`

Type:
- `object`

Description:
- simple run statistics

Expected shape:
```json
{
  "historical_rows": 250,
  "current_rows": 30,
  "ranked_rows": 30
}
```

Recommended UI usage:
- optional small metadata footer
- not required in the main experience

---

## Frontend rendering guidance

The UI should render the response in this order:

1. **Recommendation card**
   - use `summary`
   - use `explanation.headline`
   - use `explanation.summary_text`

2. **Top candidate comparison**
   - use `comparison_table`

3. **Why this candidate**
   - use `explanation.top_strengths`
   - use `explanation.advantages_vs_runner_up`
   - use `explanation.tradeoffs`

4. **What-if insight**
   - use `explanation.what_if_insight`
   - optionally show more from `what_if_analysis`

5. **Optional technical transparency**
   - use `artifacts`

---

## Contract rules

These rules should be followed unless the backend contract is intentionally revised:

1. The UI must call only `run_decision_pipeline(...)`
2. The UI must not call internal agents directly
3. Top-level payload keys must remain stable
4. Field names should not be renamed casually
5. Raw applicant input must remain raw
6. Competency scoring must stay inside the backend
7. Scenario names must remain canonical
8. The explanation must remain grounded in actual ranking outputs

---

## Example backend usage

```python
payload = run_decision_pipeline(
    scenario_name="Supply Chain Disruption",
    current_applicants_df=uploaded_df,
    auto_assign_mechanisms=False,
)
```

Then the frontend should read:

```python
payload["summary"]
payload["explanation"]
payload["comparison_table"]
payload["what_if_analysis"]
```

---

## Final note

This contract is intentionally designed so the frontend can remain simple:

- one scenario input
- one applicant upload
- one backend call
- one unified response payload

This contract should now be treated as frozen for frontend integration.
