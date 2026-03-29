// Backend contract types for run_decision_pipeline response

export interface StrengthEntry {
  feature: string;
  score: number;
  weight: number;
  weighted_contribution: number;
}

export interface PipelineSummary {
  scenario_name: string;
  recommended_candidate_id: string;
  recommended_candidate_name: string;
  predicted_scenario_outcome: number;
  scenario_alignment_score: number;
  primary_feature: string;
  top_strengths: StrengthEntry[];
}

export interface AdvantageEntry {
  feature: string;
  candidate_score: number;
  runner_up_score: number;
  delta: number;
}

export interface TradeoffEntry {
  feature: string;
  candidate_score: number;
  runner_up_score: number;
  delta: number;
}

export interface WhatIfInsight {
  candidate_id: string;
  candidate_name: string;
  baseline_target: number;
  simulated_target: number;
  delta_vs_baseline: number;
  intervention: string;
}

export interface PipelineExplanation {
  scenario_name: string;
  business_goal: string;
  recommended_candidate_id: string;
  recommended_candidate_name: string;
  predicted_scenario_outcome: number;
  scenario_alignment_score: number;
  headline: string;
  summary_text: string;
  top_strengths: StrengthEntry[];
  advantages_vs_runner_up: AdvantageEntry[];
  tradeoffs: TradeoffEntry[];
  what_if_insight: WhatIfInsight;
  explanation_ready: {
    scenario_fit_reason: string;
    primary_feature: string;
  };
}

export interface RankingPreviewRow {
  rank: number;
  candidate_id: string;
  name: string;
  candidate_source: string;
  predicted_scenario_outcome: number;
  scenario_alignment_score: number;
  [competency: string]: string | number;
}

export interface ComparisonRow {
  rank: number;
  candidate_id: string;
  name: string;
  predicted_scenario_outcome: number;
  scenario_alignment_score: number;
  [competency: string]: string | number;
}

export interface WhatIfEntry {
  candidate_id: string;
  candidate_name: string;
  baseline_target: number;
  simulated_target: number;
  delta_vs_baseline: number;
  baseline_alignment: number;
  simulated_alignment: number;
  interventions: Record<string, number>;
  intervention: string;
}

export interface PipelineArtifacts {
  scenario_name: string;
  graph_edges: [string, string][];
  feature_columns: string[];
  feature_weights: Record<string, number>;
  primary_feature: string;
  n_training_rows: number;
  target_range: [number, number];
}

export interface RowCounts {
  historical_rows: number;
  current_rows: number;
  ranked_rows: number;
}

export interface PipelineResponse {
  scenario_name: string;
  summary: PipelineSummary;
  artifacts: PipelineArtifacts;
  explanation: PipelineExplanation;
  ranking_preview: RankingPreviewRow[];
  comparison_table: ComparisonRow[];
  what_if_analysis: WhatIfEntry[];
  row_counts: RowCounts;
}
