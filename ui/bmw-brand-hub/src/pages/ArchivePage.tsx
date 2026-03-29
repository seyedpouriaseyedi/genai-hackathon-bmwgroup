import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Search, Trash2, ChevronDown, ChevronUp, Archive, Eye, Trophy, TrendingUp, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { PipelineResponse } from "@/types/pipeline";

interface DecisionEntry {
  id: string;
  name: string;
  description: string;
  date: string;
  scenarios: string[];
  scenarioName?: string;
  payload?: PipelineResponse;
  candidates?: { rank: number; name: string; score: number; strength: string; source: string; band: string }[];
  topCandidate?: { name: string; score: number };
}

const scenarioLabels: Record<string, string> = {
  "supply-chain": "Supply Chain",
  "digital-transformation": "Digital Transformation",
  "operational-continuity": "Operational Continuity",
};

const filterOptions = ["All", "Supply Chain", "Digital Transformation", "Operational Continuity"];

const bandColors: Record<string, string> = {
  "STRONG FIT": "bg-success/15 text-success border-success/30",
  "GOOD FIT": "bg-primary/15 text-primary border-primary/30",
  "MODERATE FIT": "bg-warning/15 text-warning border-warning/30",
  "BELOW THRESHOLD": "bg-destructive/15 text-destructive border-destructive/30",
};

const formatCompetency = (key: string) =>
  key.replace(/^competency_/, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const ArchivePage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [entries, setEntries] = useState<DecisionEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem("decisionHistory") || "[]"); } catch { return []; }
  });

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchesSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = activeFilter === "All" || e.scenarios.some((s) => scenarioLabels[s]?.includes(activeFilter));
      return matchesSearch && matchesFilter;
    });
  }, [entries, search, activeFilter]);

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      const updated = entries.filter((e) => e.id !== id);
      setEntries(updated);
      localStorage.setItem("decisionHistory", JSON.stringify(updated));
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const handleViewRecommendation = (entry: DecisionEntry) => {
    if (entry.payload) {
      sessionStorage.setItem("archiveRestore", JSON.stringify(entry.payload));
      navigate(`/recommendation?scenarios=${entry.scenarios.join(",")}`);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Archive className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Decision Archive</h1>
            <Badge variant="secondary" className="text-xs font-mono">{entries.length}</Badge>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search decisions..." className="pl-10" />
          </div>
          <div className="flex gap-1.5">
            {filterOptions.map((f) => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Archive className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {entries.length === 0 ? "No saved decisions yet. Run an evaluation and save it from the Recommendation page." : "No decisions match your search."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((entry) => {
              const isExpanded = expandedId === entry.id;
              const hasPayload = !!entry.payload;
              return (
                <div key={entry.id} className="glass-card overflow-hidden">
                  <div className="p-5 flex items-start justify-between cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => setExpandedId(isExpanded ? null : entry.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-card-foreground truncate">{entry.name}</h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(entry.date).toLocaleDateString()}</span>
                      </div>
                      {entry.description && (<p className="text-sm text-muted-foreground mb-2 line-clamp-1">{entry.description}</p>)}
                      <div className="flex items-center gap-2 flex-wrap">
                        {entry.scenarios.map((s) => (
                          <span key={s} className="px-2 py-0.5 text-[10px] font-semibold rounded-full border border-primary/40 text-primary bg-accent">
                            {entry.scenarioName || scenarioLabels[s] || s}
                          </span>
                        ))}
                        {entry.topCandidate && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-success/15 text-success border border-success/30">
                            #1 {entry.topCandidate.name} ({entry.topCandidate.score.toFixed?.(1) ?? entry.topCandidate.score})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {hasPayload && (
                        <button onClick={(e) => { e.stopPropagation(); handleViewRecommendation(entry); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                          <Eye className="w-3.5 h-3.5" /> View Full Recommendation
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                        className={`p-2 rounded-md text-xs font-semibold transition-colors ${confirmDeleteId === entry.id ? "bg-destructive text-destructive-foreground" : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"}`}>
                        {confirmDeleteId === entry.id ? "Confirm?" : <Trash2 className="w-4 h-4" />}
                      </button>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border px-5 pb-5 pt-4">
                      {hasPayload && entry.payload ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 bg-accent/50 rounded-lg p-4 border border-primary/20">
                            <Trophy className="w-6 h-6 text-primary flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-bold text-card-foreground">{entry.payload.summary.recommended_candidate_name}</p>
                              <p className="text-xs text-muted-foreground">{entry.payload.explanation.headline}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">{entry.payload.summary.predicted_scenario_outcome.toFixed(1)}</p>
                              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Score</p>
                            </div>
                          </div>

                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Rank</th>
                                <th className="text-left px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Candidate</th>
                                <th className="text-left px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Outcome</th>
                                <th className="text-left px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">Fit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entry.payload.comparison_table.map((c) => (
                                <tr key={c.candidate_id} className={`border-b border-border last:border-0 ${c.rank === 1 ? "bg-primary/5" : ""}`}>
                                  <td className={`px-3 py-2.5 font-semibold ${c.rank === 1 ? "text-primary" : "text-muted-foreground"}`}>#{c.rank}</td>
                                  <td className="px-3 py-2.5 font-medium text-card-foreground">{c.name as string}</td>
                                  <td className="px-3 py-2.5 font-mono font-bold text-card-foreground">{(c.predicted_scenario_outcome as number).toFixed(1)}</td>
                                  <td className="px-3 py-2.5 font-mono text-muted-foreground">{(c.scenario_alignment_score as number).toFixed(1)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {entry.payload.explanation.what_if_insight && (
                            <div className="flex items-center gap-3 bg-secondary/60 rounded-lg p-3 border border-border">
                              <Zap className="w-5 h-5 text-primary flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-xs font-medium text-card-foreground">If {entry.payload.explanation.what_if_insight.candidate_name}'s top skill improved by 10pts:</p>
                                <p className="text-sm font-bold text-primary">
                                  {entry.payload.explanation.what_if_insight.baseline_target.toFixed(1)} → {entry.payload.explanation.what_if_insight.simulated_target.toFixed(1)}
                                  <span className="text-xs font-semibold text-success ml-2">+{entry.payload.explanation.what_if_insight.delta_vs_baseline.toFixed(1)}</span>
                                </p>
                              </div>
                            </div>
                          )}

                          {entry.payload.explanation.top_strengths.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                              {entry.payload.explanation.top_strengths.map((s, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                                  <TrendingUp className="w-3 h-3" /> {s.feature}: {s.score.toFixed(1)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : entry.candidates ? (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              {["Rank", "Candidate", "Score", "Band", "Strength", "Source"].map((h) => (
                                <th key={h} className="text-left px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {entry.candidates.map((c) => (
                              <tr key={c.rank} className="border-b border-border last:border-0">
                                <td className="px-3 py-2.5 font-semibold text-muted-foreground">#{c.rank}</td>
                                <td className="px-3 py-2.5 font-medium text-card-foreground">{c.name}</td>
                                <td className="px-3 py-2.5 font-mono font-bold text-card-foreground">{c.score}</td>
                                <td className="px-3 py-2.5"><span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${bandColors[c.band] || ""}`}>{c.band}</span></td>
                                <td className="px-3 py-2.5 text-card-foreground">{c.strength}</td>
                                <td className="px-3 py-2.5 text-muted-foreground">{c.source}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-sm text-muted-foreground">No detailed data available for this entry.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ArchivePage;
