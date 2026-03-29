import { useState } from "react";
import type { PipelineResponse } from "@/types/pipeline";

// Mock payload matching the backend contract exactly
const mockPayload: PipelineResponse = {
  scenario_name: "Supply Chain Disruption",
  summary: {
    scenario_name: "Supply Chain Disruption",
    recommended_candidate_id: "C0028",
    recommended_candidate_name: "Daniel Hartmann",
    predicted_scenario_outcome: 68.12,
    scenario_alignment_score: 63.74,
    primary_feature: "competency_disruption_management",
    top_strengths: [
      { feature: "competency_disruption_management", score: 64.32, weight: 0.55, weighted_contribution: 35.38 },
      { feature: "competency_leadership", score: 67.55, weight: 0.10, weighted_contribution: 6.76 },
      { feature: "competency_operational_continuity", score: 59.65, weight: 0.25, weighted_contribution: 14.91 },
    ],
  },
  artifacts: {
    scenario_name: "Supply Chain Disruption",
    graph_edges: [
      ["competency_leadership", "competency_disruption_management"],
      ["competency_disruption_management", "target_scenario_score"],
    ],
    feature_columns: [
      "competency_disruption_management",
      "competency_operational_continuity",
      "competency_leadership",
      "competency_bmw_context_fit",
    ],
    feature_weights: {
      competency_disruption_management: 0.55,
      competency_operational_continuity: 0.25,
      competency_leadership: 0.10,
      competency_bmw_context_fit: 0.10,
    },
    primary_feature: "competency_disruption_management",
    n_training_rows: 75,
    target_range: [10.27, 87.65],
  },
  explanation: {
    scenario_name: "Supply Chain Disruption",
    business_goal: "Maximize disruption response and operational continuity while reducing ramp-up time.",
    recommended_candidate_id: "C0028",
    recommended_candidate_name: "Daniel Hartmann",
    predicted_scenario_outcome: 68.12,
    scenario_alignment_score: 63.74,
    headline: "Daniel Hartmann is the recommended candidate for Supply Chain Disruption.",
    summary_text: "Daniel Hartmann ranks first for Supply Chain Disruption with a predicted scenario outcome of 68.12 and a scenario alignment score of 63.74. The strongest scenario-relevant drivers are Disruption Management, Operational Continuity, and Leadership.",
    top_strengths: [
      { feature: "Disruption Management", score: 64.32, weight: 0.55, weighted_contribution: 35.38 },
      { feature: "Leadership", score: 67.55, weight: 0.10, weighted_contribution: 6.76 },
      { feature: "Operational Continuity", score: 59.65, weight: 0.25, weighted_contribution: 14.91 },
    ],
    advantages_vs_runner_up: [
      { feature: "Disruption Management", candidate_score: 64.32, runner_up_score: 58.10, delta: 6.22 },
      { feature: "BMW Context Fit", candidate_score: 66.92, runner_up_score: 61.45, delta: 5.47 },
    ],
    tradeoffs: [
      { feature: "Leadership", candidate_score: 67.55, runner_up_score: 71.20, delta: -3.65 },
    ],
    what_if_insight: {
      candidate_id: "C0028",
      candidate_name: "Daniel Hartmann",
      baseline_target: 68.12,
      simulated_target: 72.98,
      delta_vs_baseline: 4.86,
      intervention: "competency_disruption_management +10.0",
    },
    explanation_ready: {
      scenario_fit_reason: "The recommendation is based on scenario-weighted competencies aligned to Supply Chain Disruption, rather than a generic overall applicant score.",
      primary_feature: "competency_disruption_management",
    },
  },
  ranking_preview: [
    { rank: 1, candidate_id: "C0028", name: "Daniel Hartmann", candidate_source: "External", predicted_scenario_outcome: 68.12, scenario_alignment_score: 63.74, competency_disruption_management: 64.32, competency_operational_continuity: 59.65, competency_leadership: 67.55, competency_bmw_context_fit: 66.92 },
    { rank: 2, candidate_id: "C0015", name: "Laura Meier", candidate_source: "Internal", predicted_scenario_outcome: 65.40, scenario_alignment_score: 60.12, competency_disruption_management: 58.10, competency_operational_continuity: 62.30, competency_leadership: 71.20, competency_bmw_context_fit: 61.45 },
    { rank: 3, candidate_id: "C0042", name: "Stefan Braun", candidate_source: "External", predicted_scenario_outcome: 62.88, scenario_alignment_score: 57.90, competency_disruption_management: 55.40, competency_operational_continuity: 61.10, competency_leadership: 65.80, competency_bmw_context_fit: 63.20 },
    { rank: 4, candidate_id: "C0007", name: "Anna Weber", candidate_source: "Internal", predicted_scenario_outcome: 60.15, scenario_alignment_score: 55.42, competency_disruption_management: 52.80, competency_operational_continuity: 58.90, competency_leadership: 63.40, competency_bmw_context_fit: 60.10 },
    { rank: 5, candidate_id: "C0091", name: "Thomas Fischer", candidate_source: "External", predicted_scenario_outcome: 57.30, scenario_alignment_score: 52.18, competency_disruption_management: 50.10, competency_operational_continuity: 56.40, competency_leadership: 60.20, competency_bmw_context_fit: 58.70 },
  ],
  comparison_table: [
    { rank: 1, candidate_id: "C0028", name: "Daniel Hartmann", predicted_scenario_outcome: 68.12, scenario_alignment_score: 63.74, competency_disruption_management: 64.32, competency_operational_continuity: 59.65, competency_leadership: 67.55, competency_bmw_context_fit: 66.92 },
    { rank: 2, candidate_id: "C0015", name: "Laura Meier", predicted_scenario_outcome: 65.40, scenario_alignment_score: 60.12, competency_disruption_management: 58.10, competency_operational_continuity: 62.30, competency_leadership: 71.20, competency_bmw_context_fit: 61.45 },
    { rank: 3, candidate_id: "C0042", name: "Stefan Braun", predicted_scenario_outcome: 62.88, scenario_alignment_score: 57.90, competency_disruption_management: 55.40, competency_operational_continuity: 61.10, competency_leadership: 65.80, competency_bmw_context_fit: 63.20 },
    { rank: 4, candidate_id: "C0007", name: "Anna Weber", predicted_scenario_outcome: 60.15, scenario_alignment_score: 55.42, competency_disruption_management: 52.80, competency_operational_continuity: 58.90, competency_leadership: 63.40, competency_bmw_context_fit: 60.10 },
    { rank: 5, candidate_id: "C0091", name: "Thomas Fischer", predicted_scenario_outcome: 57.30, scenario_alignment_score: 52.18, competency_disruption_management: 50.10, competency_operational_continuity: 56.40, competency_leadership: 60.20, competency_bmw_context_fit: 58.70 },
  ],
  what_if_analysis: [
    {
      candidate_id: "C0028", candidate_name: "Daniel Hartmann",
      baseline_target: 68.12, simulated_target: 72.98, delta_vs_baseline: 4.86,
      baseline_alignment: 63.74, simulated_alignment: 70.68,
      interventions: { competency_disruption_management: 10.0 },
      intervention: "competency_disruption_management +10.0",
    },
    {
      candidate_id: "C0015", candidate_name: "Laura Meier",
      baseline_target: 65.40, simulated_target: 69.90, delta_vs_baseline: 4.50,
      baseline_alignment: 60.12, simulated_alignment: 66.50,
      interventions: { competency_disruption_management: 10.0 },
      intervention: "competency_disruption_management +10.0",
    },
    {
      candidate_id: "C0042", candidate_name: "Stefan Braun",
      baseline_target: 62.88, simulated_target: 67.20, delta_vs_baseline: 4.32,
      baseline_alignment: 57.90, simulated_alignment: 63.80,
      interventions: { competency_disruption_management: 10.0 },
      intervention: "competency_disruption_management +10.0",
    },
  ],
  row_counts: {
    historical_rows: 250,
    current_rows: 30,
    ranked_rows: 30,
  },
};

export function usePipeline() {
  const [data, setData] = useState<PipelineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runPipeline = async (scenarioName: string, _applicantData?: unknown) => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call to run_decision_pipeline
      // const res = await fetch("/api/pipeline", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ scenario_name: scenarioName, current_applicants_df: applicantData }),
      // });
      // const payload = await res.json();

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      const payload = { ...mockPayload, scenario_name: scenarioName };
      setData(payload);
      return payload;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Pipeline call failed";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, runPipeline };
}
