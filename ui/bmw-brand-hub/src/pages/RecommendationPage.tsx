import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { ArrowLeft, ChevronDown, ChevronUp, Filter, Shield, X, TrendingUp, AlertTriangle, Zap, BookmarkPlus, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { scenarios } from "@/data/scenarios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { PipelineResponse } from "@/types/pipeline";

// Mock payload matching the backend contract
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
    graph_edges: [["competency_leadership", "competency_disruption_management"], ["competency_disruption_management", "target_scenario_score"]],
    feature_columns: ["competency_disruption_management", "competency_operational_continuity", "competency_leadership", "competency_bmw_context_fit"],
    feature_weights: { competency_disruption_management: 0.55, competency_operational_continuity: 0.25, competency_leadership: 0.10, competency_bmw_context_fit: 0.10 },
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
    { candidate_id: "C0028", candidate_name: "Daniel Hartmann", baseline_target: 68.12, simulated_target: 72.98, delta_vs_baseline: 4.86, baseline_alignment: 63.74, simulated_alignment: 70.68, interventions: { competency_disruption_management: 10.0 }, intervention: "competency_disruption_management +10.0" },
    { candidate_id: "C0015", candidate_name: "Laura Meier", baseline_target: 65.40, simulated_target: 69.90, delta_vs_baseline: 4.50, baseline_alignment: 60.12, simulated_alignment: 66.50, interventions: { competency_disruption_management: 10.0 }, intervention: "competency_disruption_management +10.0" },
    { candidate_id: "C0042", candidate_name: "Stefan Braun", baseline_target: 62.88, simulated_target: 67.20, delta_vs_baseline: 4.32, baseline_alignment: 57.90, simulated_alignment: 63.80, interventions: { competency_disruption_management: 10.0 }, intervention: "competency_disruption_management +10.0" },
  ],
  row_counts: { historical_rows: 250, current_rows: 30, ranked_rows: 30 },
};

const formatCompetency = (key: string) =>
  key.replace(/^competency_/, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

type SourceFilter = "all" | "Internal" | "External";

const RecommendationPage = () => {
  const [searchParams] = useSearchParams();
  const selectedScenarios = (searchParams.get("scenarios") || "supply-chain").split(",");
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");

  const [payload] = useState<PipelineResponse>(() => {
    const restored = sessionStorage.getItem("archiveRestore");
    if (restored) {
      sessionStorage.removeItem("archiveRestore");
      try { return JSON.parse(restored); } catch { /* fall through */ }
    }
    return mockPayload;
  });

  const { summary, explanation, comparison_table, what_if_analysis, artifacts, row_counts } = payload;
  const selectedScenarioData = scenarios.filter((s) => selectedScenarios.includes(s.id));
  const competencyKeys = artifacts.feature_columns;

  const filteredComparison = useMemo(() => {
    return comparison_table.filter((c) => {
      if (sourceFilter !== "all") {
        const preview = payload.ranking_preview.find((r) => r.candidate_id === c.candidate_id);
        if (preview && preview.candidate_source !== sourceFilter) return false;
      }
      return true;
    });
  }, [sourceFilter, comparison_table, payload.ranking_preview]);

  const hasActiveFilters = sourceFilter !== "all";

  const handleOpenSaveDialog = () => {
    setSaveName(`${selectedScenarioData[0]?.title || "Analysis"} — ${new Date().toLocaleDateString()}`);
    setSaveDescription("");
    setSaveDialogOpen(true);
  };

  const handleSaveToArchive = () => {
    const existing = JSON.parse(localStorage.getItem("decisionHistory") || "[]");
    const candidates = comparison_table.map((c) => {
      const preview = payload.ranking_preview.find((r) => r.candidate_id === c.candidate_id);
      return {
        rank: c.rank,
        name: c.name as string,
        score: (c.predicted_scenario_outcome as number),
        band: (c.predicted_scenario_outcome as number) >= 65 ? "STRONG FIT" : (c.predicted_scenario_outcome as number) >= 60 ? "GOOD FIT" : (c.predicted_scenario_outcome as number) >= 55 ? "MODERATE FIT" : "BELOW THRESHOLD",
        strength: formatCompetency(artifacts.primary_feature),
        source: preview?.candidate_source || "Unknown",
      };
    });
    const entry = {
      id: crypto.randomUUID(),
      name: saveName,
      description: saveDescription,
      date: new Date().toISOString(),
      scenarios: selectedScenarios,
      scenarioName: payload.scenario_name,
      payload: payload,
      candidates,
      topCandidate: { name: summary.recommended_candidate_name, score: summary.predicted_scenario_outcome },
    };
    existing.push(entry);
    localStorage.setItem("decisionHistory", JSON.stringify(existing));
    setSaveDialogOpen(false);
    toast.success("Saved to archive");
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-2">
              <ArrowLeft className="w-4 h-4" /> New analysis
            </Link>
            <h1 className="text-4xl font-bold tracking-tight">Recommendation — {payload.scenario_name}</h1>
            {selectedScenarioData.length > 0 && (
              <div className="flex gap-2 mt-3">
                {selectedScenarioData.map((s) => (
                  <span key={s.id} className="px-3 py-1 text-xs font-medium rounded-full border border-primary/40 text-primary bg-accent">{s.title}</span>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleOpenSaveDialog} className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors">
            <BookmarkPlus className="w-4 h-4" /> Save to Archive
          </button>
        </div>

        {/* Recommendation Card */}
        <div className="glass-card p-8 border-l-4 border-l-primary">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Recommended Candidate</p>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-4xl font-bold text-card-foreground">{summary.recommended_candidate_name}</h2>
                <span className="px-3 py-1 text-xs font-medium rounded-full border border-border text-card-foreground">{summary.recommended_candidate_id}</span>
                <span className="px-3 py-1 text-xs font-medium rounded-full border border-primary/40 text-primary bg-accent">{payload.scenario_name}</span>
              </div>
              <p className="text-lg font-medium text-card-foreground mb-1">{explanation.headline}</p>
              <p className="text-muted-foreground max-w-xl">{explanation.summary_text}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-5xl font-bold text-primary">{summary.predicted_scenario_outcome.toFixed(1)}</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Predicted Outcome</p>
              <p className="text-2xl font-bold text-card-foreground">{summary.scenario_alignment_score.toFixed(1)}</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Scenario Fit</p>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4">
            <h3 className="text-lg font-bold text-card-foreground">Top Candidate Comparison</h3>
            <div className="relative">
              <button onClick={() => setShowFilterPopover(!showFilterPopover)} className={`p-2 rounded-md transition-colors ${hasActiveFilters ? "bg-primary/15 text-primary" : "hover:bg-muted text-muted-foreground"}`}>
                <Filter className="w-4 h-4" />
              </button>
              {showFilterPopover && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-xl z-50 p-4 space-y-3 animate-scale-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Source</span>
                    <button onClick={() => setShowFilterPopover(false)} className="p-1 rounded hover:bg-muted"><X className="w-3 h-3 text-muted-foreground" /></button>
                  </div>
                  <div className="flex gap-1.5">
                    {(["all", "Internal", "External"] as SourceFilter[]).map((f) => (
                      <button key={f} onClick={() => setSourceFilter(f)} className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${sourceFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-card-foreground"}`}>
                        {f === "all" ? "All" : f}
                      </button>
                    ))}
                  </div>
                  {hasActiveFilters && (<button onClick={() => setSourceFilter("all")} className="text-xs text-primary hover:underline">Clear filter</button>)}
                </div>
              )}
            </div>
          </div>

          {hasActiveFilters && (
            <div className="px-6 pb-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary">
                {sourceFilter} <button onClick={() => setSourceFilter("all")}><X className="w-3 h-3" /></button>
              </span>
            </div>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border">
                <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-muted-foreground font-medium">Rank</th>
                <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-muted-foreground font-medium">Candidate</th>
                <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-muted-foreground font-medium">Outcome</th>
                <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-muted-foreground font-medium">Fit</th>
                {competencyKeys.map((k) => (<th key={k} className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-medium">{formatCompetency(k)}</th>))}
              </tr>
            </thead>
            <tbody>
              {filteredComparison.map((c) => (
                <tr key={c.candidate_id} className={`border-b border-border last:border-0 ${c.rank === 1 ? "bg-primary/5" : ""}`}>
                  <td className={`px-6 py-4 font-semibold ${c.rank === 1 ? "text-primary" : "text-muted-foreground"}`}>#{c.rank}</td>
                  <td className="px-6 py-4 font-medium text-card-foreground">{c.name as string}</td>
                  <td className="px-6 py-4 font-mono font-bold text-card-foreground">{(c.predicted_scenario_outcome as number).toFixed(1)}</td>
                  <td className="px-6 py-4 font-mono text-muted-foreground">{(c.scenario_alignment_score as number).toFixed(1)}</td>
                  {competencyKeys.map((k) => (<td key={k} className="px-4 py-4 font-mono text-card-foreground">{(c[k] as number)?.toFixed?.(1) ?? "—"}</td>))}
                </tr>
              ))}
              {filteredComparison.length === 0 && (
                <tr><td colSpan={4 + competencyKeys.length} className="px-6 py-8 text-center text-muted-foreground">No candidates match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Why + What-If */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-card-foreground mb-5">Why {summary.recommended_candidate_name}?</h3>
            <div className="space-y-3 mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Top Strengths</p>
              {explanation.top_strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{s.feature}</p>
                    <p className="text-xs text-muted-foreground">Score: {s.score.toFixed(1)} · Weight: {(s.weight * 100).toFixed(0)}% · Contribution: {s.weighted_contribution.toFixed(1)}</p>
                  </div>
                </div>
              ))}
            </div>
            {explanation.advantages_vs_runner_up.length > 0 && (
              <div className="space-y-3 mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-success">Edges Over Runner-Up</p>
                {explanation.advantages_vs_runner_up.map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{a.feature}</p>
                      <p className="text-xs text-muted-foreground">{summary.recommended_candidate_name}: {a.candidate_score.toFixed(1)} vs Runner-up: {a.runner_up_score.toFixed(1)} (+{a.delta.toFixed(1)})</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {explanation.tradeoffs.length > 0 && (
              <div className="pt-4 border-t border-border">
                <p className="text-xs font-semibold uppercase tracking-widest text-warning mb-3">Trade-Offs</p>
                {explanation.tradeoffs.map((t, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{t.feature}</p>
                      <p className="text-xs text-muted-foreground">{summary.recommended_candidate_name}: {t.candidate_score.toFixed(1)} vs Runner-up: {t.runner_up_score.toFixed(1)} ({t.delta.toFixed(1)})</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-card-foreground mb-2">What-If Improvement</h3>
            <p className="text-sm text-muted-foreground mb-5">Shows how much a candidate's score would improve if one skill were stronger.</p>
            <div className="bg-accent/50 rounded-lg p-4 mb-5 border border-primary/20">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-card-foreground">If {explanation.what_if_insight.candidate_name}'s top skill improved by 10 points:</p>
                  <p className="text-lg font-bold text-primary mt-1">
                    {explanation.what_if_insight.baseline_target.toFixed(1)} → {explanation.what_if_insight.simulated_target.toFixed(1)}
                    <span className="text-sm font-semibold text-success ml-2">+{explanation.what_if_insight.delta_vs_baseline.toFixed(1)}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {what_if_analysis.map((w) => (
                <div key={w.candidate_id} className="flex items-center justify-between bg-secondary/60 rounded-lg p-3 border border-border">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{w.candidate_name}</p>
                    <p className="text-xs text-muted-foreground">{Object.keys(w.interventions).map(formatCompetency).join(", ")} +{Object.values(w.interventions)[0]}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-card-foreground">{w.baseline_target.toFixed(1)} → {w.simulated_target.toFixed(1)}</p>
                    <p className="text-xs font-semibold text-success">+{w.delta_vs_baseline.toFixed(1)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <Accordion type="single" collapsible className="glass-card overflow-hidden">
          <AccordionItem value="technical" className="border-0">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-primary/15 flex items-center justify-center"><Info className="w-3.5 h-3.5 text-primary" /></div>
                <span className="text-sm font-medium text-card-foreground">Technical Details</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-secondary/60 rounded-lg p-4 border border-border">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Feature Weights</p>
                  <div className="space-y-2">
                    {Object.entries(artifacts.feature_weights).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between">
                        <span className="text-xs text-card-foreground">{formatCompetency(k)}</span>
                        <span className="text-xs font-mono font-bold text-primary">{(v * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-secondary/60 rounded-lg p-4 border border-border">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Run Statistics</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs"><span className="text-card-foreground">Historical records</span><span className="font-mono text-muted-foreground">{row_counts.historical_rows}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-card-foreground">Current applicants</span><span className="font-mono text-muted-foreground">{row_counts.current_rows}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-card-foreground">Ranked candidates</span><span className="font-mono text-muted-foreground">{row_counts.ranked_rows}</span></div>
                  </div>
                </div>
                <div className="bg-secondary/60 rounded-lg p-4 border border-border">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Score Range</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs"><span className="text-card-foreground">Lowest</span><span className="font-mono text-muted-foreground">{artifacts.target_range[0].toFixed(1)}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-card-foreground">Highest</span><span className="font-mono text-muted-foreground">{artifacts.target_range[1].toFixed(1)}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-card-foreground">Training rows</span><span className="font-mono text-muted-foreground">{artifacts.n_training_rows}</span></div>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-accent/30 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground italic">{explanation.explanation_ready.scenario_fit_reason}</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <p className="text-center text-xs text-muted-foreground uppercase tracking-widest">BMW Decision Intelligence Platform</p>
      </div>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Save to Archive</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name</label>
              <Input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Decision name..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea value={saveDescription} onChange={(e) => setSaveDescription(e.target.value)} placeholder="Optional notes about this analysis..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveToArchive} disabled={!saveName.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default RecommendationPage;
