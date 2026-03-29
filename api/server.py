from __future__ import annotations

import io
import os

import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from agents.workflow_orchestrator import run_decision_pipeline  # or agents.orchestrator

app = FastAPI(title="Scenario-Based Hiring Decisions API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze(
    scenario_name: str = Form(...),
    applicants_file: UploadFile = File(...),
) -> dict:
    if not applicants_file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a CSV file.")

    try:
        content = await applicants_file.read()
        df = pd.read_csv(io.BytesIO(content))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read CSV: {exc}") from exc

    try:
        payload = run_decision_pipeline(
            scenario_name=scenario_name,
            current_applicants_df=df,
            auto_assign_mechanisms=False,
        )
        return payload
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc