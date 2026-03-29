# Scenario-Based Hiring Decisions

A multi-agent decision-support system that ranks candidates based on **business scenario**, not one generic hiring score.

**Current prototype role:** Supply Chain Operations Lead  
**Context:** BMW GenAI Hackathon prototype

---

## Why this project exists

Traditional candidate ranking is often too generic. The same applicant may not be the best choice for every business situation.

This prototype addresses that problem by letting the user define the hiring need through a structured intake flow, mapping that need to a scenario, and then ranking applicants based on **expected scenario-specific business outcomes**.

In short:

- same candidates
- different business context
- different best choice

---

## What the system does

The application supports a guided hiring workflow:

1. HR describes the hiring need through a short intake flow
2. the system recommends the most relevant business scenario
3. HR uploads a raw applicant CSV
4. the backend scores raw profiles internally
5. candidates are ranked based on expected scenario outcome
6. the system explains why the top candidate was selected
7. the system provides a simple what-if analysis

---

## Supported scenarios

The prototype currently supports:

- **Supply Chain Disruption**
- **Digital Transformation**
- **Operational Continuity**

These scenarios determine how candidate strengths are weighted and how expected success is modeled.

---

## Prototype role

The current prototype is focused on:

**Supply Chain Operations Lead**

The architecture is intentionally designed so additional roles can be added later.

---

## Multi-agent architecture

The backend is organized as specialized agents:

### 1. Intake / Scenario Selection Layer
Maps HR’s business need to the most relevant scenario.

### 2. Scenario Agent
Defines what success means for the selected scenario and constructs the scenario-specific target outcome.

### 3. Candidate Intelligence Agent
Converts raw applicant profiles into structured competency scores.

### 4. Ranking Agent
Estimates expected scenario outcomes and ranks candidates.

### 5. Decision Explanation Agent
Explains why the top candidate was selected and what tradeoffs exist.

### 6. Orchestrator Agent
Coordinates the full workflow and returns one unified payload to the UI.

---

## Project structure

```text
agents/
  scenario_agent.py
  candidate_agent.py
  ranking_agent.py
  decision_agent.py
  workflow_orchestrator.py

api/
  server.py

data/generated/
  historical_outcomes_raw.csv
  current_applicants_raw.csv
  historical_outcomes_internal_debug.csv
  current_applicants_internal_debug.csv

scripts/
  validate_candidate_agent.py

docs/
  backend_contract.md

ui/
  bmw-brand-hub/
