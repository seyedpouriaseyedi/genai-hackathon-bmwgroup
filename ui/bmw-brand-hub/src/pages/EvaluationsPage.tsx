import React, { useState, useMemo, useEffect, useRef, useCallback, Suspense, lazy } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { ChevronDown, ChevronUp, Eye, EyeOff, AlertTriangle, ChevronLeft, ChevronRight, Lock, LockOpen, RotateCcw, Pause, Play, OctagonX, X, Info, Layers } from "lucide-react";
import { scenarios, weightKeys, weightColors, candidateProfiles, type ScenarioWeight } from "@/data/scenarios";
import { usePipelineContext } from "@/contexts/PipelineContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const AgentPlan = lazy(() => import("@/components/ui/agent-plan"));

const metricLabels: Record<keyof ScenarioWeight, string> = {
  scalability_mindset: "Scalability Mindset",
  hard_skill_match: "Hard Skill Match",
  cultural_alignment: "Cultural Alignment",
  risk_mitigation: "Risk Mitigation",
  adaptability_index: "Adaptability Index",
};

// Pipeline stage templates
const stageTemplates = [
  { label: "SCENARIO", detail: "Checking scenario priorities", color: "bg-primary", glowColor: "shadow-[0_0_0_1.5px_hsl(var(--primary))]", barColor: "bg-primary" },
  { label: "CANDIDATE", detail: "Reading candidate profiles", color: "bg-warning", glowColor: "shadow-[0_0_0_1.5px_hsl(var(--warning))]", barColor: "bg-warning" },
  { label: "RANKING", detail: "Scoring and ranking candidates", color: "bg-success", glowColor: "shadow-[0_0_0_1.5px_hsl(var(--success))]", barColor: "bg-success" },
  { label: "DECISION", detail: "Checking minimum requirements", color: "bg-[hsl(270,60%,55%)]", glowColor: "shadow-[0_0_0_1.5px_hsl(270,60%,55%)]", barColor: "bg-[hsl(270,60%,55%)]" },
  { label: "OUTPUT", detail: "Preparing recommendation", color: "bg-[hsl(185,60%,45%)]", glowColor: "shadow-[0_0_0_1.5px_hsl(185,60%,45%)]", barColor: "bg-[hsl(185,60%,45%)]" },
];

const logTemplates = [
  { text: "Getting everything ready to evaluate your candidates...", warn: false, refId: "" },
  { text: "All set. Let's begin the evaluation.", warn: false, refId: "" },
  { text: "Using the priorities you set for Supply Chain Disruption.", warn: false, refId: "" },
  { text: "Now comparing each candidate's skills against the job requirements.", warn: false, refId: "" },
  { text: "Looking at candidate CV_001_DE's profile...", warn: false, refId: "CV_001_DE" },
  { text: "Finished reviewing CV_001_DE.", warn: false, refId: "CV_001_DE" },
  { text: "Heads up — the file for CV_042_US had some missing data. We'll work with what's available.", warn: true, refId: "CV_042_US" },
  { text: "Looking at candidate CV_119_UK's profile...", warn: false, refId: "CV_119_UK" },
  { text: "Finished reviewing CV_119_UK.", warn: false, refId: "CV_119_UK" },
  { text: "Scoring all 8 candidates based on your scenario priorities...", warn: false, refId: "" },
  { text: "Two candidates are very close — running a tiebreaker between CV_001_DE and CV_099_DE.", warn: false, refId: "CV_099_DE" },
  { text: "Good news — the top 5 candidates all meet the minimum requirements.", warn: false, refId: "" },
  { text: "All done! Rankings are ready. Preparing your recommendation now.", warn: false, refId: "" },
];

interface StackRow {
  id: string;
  name: string;
  progress: number;
  barColor: string;
  confidence: number;
  halted: boolean;
}

const initialStack: StackRow[] = [
  { id: "CV_001_DE", name: "Anna Keller", progress: 0, barColor: "bg-primary", confidence: 0.94, halted: false },
  { id: "CV_042_US", name: "Marco Bauer", progress: 0, barColor: "bg-primary", confidence: 0.71, halted: false },
  { id: "CV_119_UK", name: "Lisa Schneider", progress: 0, barColor: "bg-primary", confidence: 0.88, halted: false },
  { id: "CV_099_DE", name: "Hans Weber", progress: 0, barColor: "bg-primary", confidence: 0.91, halted: false },
  { id: "CV_055_FR", name: "Marie Dupont", progress: 0, barColor: "bg-primary", confidence: 0.85, halted: false },
  { id: "CV_078_JP", name: "Kenji Tanaka", progress: 0, barColor: "bg-primary", confidence: 0.79, halted: false },
  { id: "CV_033_DE", name: "Elena Rodriguez", progress: 0, barColor: "bg-primary", confidence: 0.92, halted: false },
  { id: "CV_012_US", name: "Sarah Jenkins", progress: 0, barColor: "bg-primary", confidence: 0.76, halted: false },
];

type LogFilter = "all" | "processes" | "warnings";

const EvaluationsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedScenarioIds = searchParams.get("scenarios")?.split(",").filter(Boolean) || [];
  const autorun = searchParams.get("autorun") === "true";
  const scenariosParam = searchParams.get("scenarios") || "supply-chain";

  const availableScenarios = selectedScenarioIds.length > 0
    ? scenarios.filter((s) => selectedScenarioIds.includes(s.id))
    : scenarios;
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(autorun ? 4 : 1);

  // Tool 1 state
  const [selectedScenario, setSelectedScenario] = useState(availableScenarios[0]?.id || scenarios[0].id);
  const currentScenario = scenarios.find((s) => s.id === selectedScenario) || scenarios[0];
  const [editableWeights, setEditableWeights] = useState<ScenarioWeight>({ ...currentScenario.weights });
  const [lockedKeys, setLockedKeys] = useState<Set<keyof ScenarioWeight>>(new Set());
  const [autoBalance, setAutoBalance] = useState(true);

  // Tool 2 state
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [blindMode, setBlindMode] = useState(false);
  const candidate = candidateProfiles[candidateIndex];

  // Tool 3 state
  const [expandedRankRow, setExpandedRankRow] = useState<number | null>(null);
  const [algorithmOpen, setAlgorithmOpen] = useState(false);

  // Tool 4: Pipeline + Decision state
  const pipelineCtx = usePipelineContext();
  const [showBehindScenes, setShowBehindScenes] = useState(false);
  const [showHaltModal, setShowHaltModal] = useState(false);
  const [showNames, setShowNames] = useState(false);
  const [logFilter, setLogFilter] = useState<LogFilter>("all");
  const [highlightedRow, setHighlightedRow] = useState<string | null>(null);
  const [stack, setStack] = useState<StackRow[]>(initialStack.map(r => ({ ...r })));
  const [extraLogs, setExtraLogs] = useState<typeof logTemplates>([]);
  const [localStage, setLocalStage] = useState(0);
  const [localVisibleLogs, setLocalVisibleLogs] = useState(0);
  const [localProgress, setLocalProgress] = useState(0);
  const [localRunning, setLocalRunning] = useState(false);
  const [localPaused, setLocalPaused] = useState(false);
  const [localComplete, setLocalComplete] = useState(false);
  const [localHalted, setLocalHalted] = useState(false);

  const highlightTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const timersRef = useRef<{ progress?: ReturnType<typeof setInterval>; stages: ReturnType<typeof setTimeout>[]; logs: ReturnType<typeof setTimeout>[]; complete?: ReturnType<typeof setTimeout> }>({ stages: [], logs: [] });
  const pausedAtRef = useRef<{ progress: number; stage: number; logs: number }>({ progress: 0, stage: 0, logs: 0 });
  const startedRef = useRef(false);

  const totalDuration = 6000;

  const clearAllTimers = useCallback(() => {
    if (timersRef.current.progress) clearInterval(timersRef.current.progress);
    timersRef.current.stages.forEach(clearTimeout);
    timersRef.current.logs.forEach(clearTimeout);
    if (timersRef.current.complete) clearTimeout(timersRef.current.complete);
    timersRef.current = { stages: [], logs: [] };
  }, []);

  const stackTickRef = useRef(0);

  const startSimulation = useCallback((fromProgress: number, fromStage: number, fromLogs: number, remainingTime: number) => {
    const progressInterval = 100;
    stackTickRef.current = 0;
    timersRef.current.progress = setInterval(() => {
      setLocalProgress((p) => {
        const step = 100 / (totalDuration / progressInterval);
        return Math.min(p + step, 100);
      });
      stackTickRef.current++;
      if (stackTickRef.current % 5 === 0) {
        setStack(prev => prev.map(r => r.halted ? r : { ...r, progress: Math.min(r.progress + 4, 100) }));
      }
    }, progressInterval);

    for (let i = fromStage; i < stageTemplates.length; i++) {
      const delay = ((i - fromStage) / Math.max(stageTemplates.length - fromStage, 1)) * remainingTime;
      timersRef.current.stages.push(setTimeout(() => setLocalStage(i), delay));
    }

    for (let i = fromLogs; i < logTemplates.length; i++) {
      const delay = ((i - fromLogs) / Math.max(logTemplates.length - fromLogs, 1)) * remainingTime;
      timersRef.current.logs.push(setTimeout(() => setLocalVisibleLogs(i + 1), delay));
    }

    timersRef.current.complete = setTimeout(() => {
      clearAllTimers();
      setLocalRunning(false);
      setLocalComplete(true);
      setLocalStage(stageTemplates.length - 1);
      setLocalProgress(100);
      setLocalVisibleLogs(logTemplates.length);
      setStack(prev => prev.map(r => r.halted ? r : { ...r, progress: 100, barColor: "bg-success" }));
    }, remainingTime);
  }, [clearAllTimers, totalDuration]);

  // Start on autorun
  useEffect(() => {
    if (autorun && !startedRef.current) {
      startedRef.current = true;
      setLocalRunning(true);
      setLocalProgress(0);
      setLocalStage(0);
      setLocalVisibleLogs(0);
      setLocalComplete(false);
      setLocalHalted(false);
      setLocalPaused(false);
      setStack(initialStack.map(r => ({ ...r })));
      pipelineCtx.startPipeline(scenariosParam);
    }
  }, [autorun, scenariosParam]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!localRunning || localPaused || localHalted) return;
    const remaining = totalDuration * (1 - pausedAtRef.current.progress / 100);
    startSimulation(pausedAtRef.current.progress, pausedAtRef.current.stage, pausedAtRef.current.logs, remaining > 0 ? remaining : totalDuration);
    return () => clearAllTimers();
  }, [localRunning, localPaused, localHalted, startSimulation, clearAllTimers]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePause = () => {
    clearAllTimers();
    setLocalPaused(true);
    pipelineCtx.pausePipeline();
    pausedAtRef.current = { progress: localProgress, stage: localStage, logs: localVisibleLogs };
  };

  const handleResume = () => {
    setLocalPaused(false);
    pipelineCtx.resumePipeline();
  };

  const handleStop = () => {
    clearAllTimers();
    setLocalHalted(true);
    setLocalRunning(false);
    setShowHaltModal(false);
    setStack(prev => prev.map(r => ({ ...r, halted: true, barColor: r.progress >= 100 ? "bg-success" : "bg-destructive" })));
    setExtraLogs(prev => [...prev, { text: "You stopped the evaluation. Partial results have been saved.", warn: true, refId: "" }]);
    pipelineCtx.haltPipeline();
  };

  const handleHaltRow = (id: string) => {
    setStack(prev => prev.map(r => r.id === id ? { ...r, halted: true, barColor: "bg-destructive" } : r));
    setExtraLogs(prev => [...prev, { text: `${id} stopped by user.`, warn: true, refId: id }]);
  };

  const handleLogClick = (refId: string) => {
    if (!refId) return;
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    setHighlightedRow(refId);
    highlightTimerRef.current = setTimeout(() => setHighlightedRow(null), 1500);
  };

  const getStageStatus = (index: number) => {
    if (localHalted) {
      if (index < localStage) return "DONE";
      if (index === localStage) return "STOPPED";
      return "WAITING";
    }
    if (index < localStage) return "DONE";
    if (index === localStage && localRunning && !localPaused) return "RUNNING";
    if (index === localStage && localPaused) return "PAUSED";
    if (localComplete) return "DONE";
    return "WAITING";
  };

  // Weight computation
  const weightSum = useMemo(() => Object.values(editableWeights).reduce((a, b) => a + b, 0), [editableWeights]);
  const isValidSum = Math.abs(weightSum - 1.0) < 0.005;

  const handleScenarioChange = (id: string) => {
    setSelectedScenario(id);
    const sc = scenarios.find((s) => s.id === id);
    if (sc) { setEditableWeights({ ...sc.weights }); setLockedKeys(new Set()); }
  };

  const runAutoBalance = (weights: ScenarioWeight, locked: Set<keyof ScenarioWeight>) => {
    const actualLocked = weightKeys.filter((k) => locked.has(k));
    const actualUnlocked = weightKeys.filter((k) => !locked.has(k));
    if (actualUnlocked.length === 0) return weights;
    const lockedSum = actualLocked.reduce((sum, k) => sum + weights[k], 0);
    const remaining = Math.max(0, 1.0 - lockedSum);
    const perUnlocked = remaining / actualUnlocked.length;
    const newWeights = { ...weights };
    actualUnlocked.forEach((k) => { newWeights[k] = Math.round(perUnlocked * 100) / 100; });
    return newWeights;
  };

  const handleToggleLock = (key: keyof ScenarioWeight) => {
    const newLocked = new Set(lockedKeys);
    if (newLocked.has(key)) newLocked.delete(key); else newLocked.add(key);
    setLockedKeys(newLocked);
    if (autoBalance) setEditableWeights(runAutoBalance(editableWeights, newLocked));
  };

  const handleToggleAutoBalance = () => {
    const newAuto = !autoBalance;
    setAutoBalance(newAuto);
    if (newAuto) setEditableWeights(runAutoBalance(editableWeights, lockedKeys));
  };

  const handleWeightAdjust = (key: keyof ScenarioWeight, delta: number) => {
    const newVal = Math.max(0, Math.min(1, editableWeights[key] + delta));
    const newWeights = { ...editableWeights, [key]: Math.round(newVal * 100) / 100 };
    if (autoBalance) {
      const adjustLocked = new Set(lockedKeys);
      adjustLocked.add(key);
      setEditableWeights(runAutoBalance(newWeights, adjustLocked));
    } else setEditableWeights(newWeights);
  };

  const handleWeightType = (key: keyof ScenarioWeight, value: string) => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return;
    const clamped = Math.max(0, Math.min(1, Math.round(parsed * 100) / 100));
    const newWeights = { ...editableWeights, [key]: clamped };
    if (autoBalance) {
      const adjustLocked = new Set(lockedKeys);
      adjustLocked.add(key);
      setEditableWeights(runAutoBalance(newWeights, adjustLocked));
    } else setEditableWeights(newWeights);
  };

  const rankedCandidates = useMemo(() => {
    return [...candidateProfiles]
      .map((c) => {
        const score = editableWeights.scalability_mindset * c.scores.scalability_mindset +
          editableWeights.hard_skill_match * c.scores.hard_skill_match +
          editableWeights.cultural_alignment * c.scores.cultural_alignment +
          editableWeights.risk_mitigation * c.scores.risk_mitigation +
          editableWeights.adaptability_index * c.scores.adaptability_index;
        return { ...c, compositeScore: Math.round(score * 10) / 10 };
      })
      .sort((a, b) => b.compositeScore - a.compositeScore);
  }, [editableWeights]);

  const hasNearTie = rankedCandidates.length >= 2 &&
    Math.abs(rankedCandidates[0].compositeScore - rankedCandidates[1].compositeScore) < 2;

  // Tool 4: Decision thinking
  const [decideReady, setDecideReady] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState(0);

  const thinkingSteps = useMemo(() => {
    const top = rankedCandidates[0];
    const runner = rankedCandidates[1];
    if (!top || !runner) return [];
    return [
      { icon: "📥", text: `Received ${rankedCandidates.length} ranked candidates...` },
      { icon: "🔍", text: `Comparing top 2: ${top.name} (${top.compositeScore}) vs ${runner.name} (${runner.compositeScore})...` },
      { icon: "📊", text: `Evaluating strengths: ${top.name} leads in ${Object.keys(top.scores).filter(k => (top.scores as any)[k] > (runner.scores as any)[k]).length}/5 areas...` },
      { icon: "⚖️", text: `Checking tradeoffs: ${runner.name} scores higher in ${Object.keys(runner.scores).filter(k => (runner.scores as any)[k] > (top.scores as any)[k]).map(k => metricLabels[k as keyof ScenarioWeight] || k).join(", ")}...` },
      { icon: "🧪", text: `Running what-if simulation: +10pt improvement analysis...` },
      { icon: "✅", text: `Final decision: ${top.name} recommended with score ${top.compositeScore}` },
    ];
  }, [rankedCandidates]);

  const handleStartDecide = () => {
    setDecideReady(false);
    setVisibleSteps(0);
    thinkingSteps.forEach((_, i) => {
      setTimeout(() => setVisibleSteps(i + 1), (i + 1) * 800);
    });
    setTimeout(() => setDecideReady(true), thinkingSteps.length * 800 + 400);
  };

  // Auto-trigger decide when pipeline completes
  useEffect(() => {
    if (localComplete && activeTab === 4 && visibleSteps === 0) {
      handleStartDecide();
    }
  }, [localComplete, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const timeStrRef = useRef("");
  if (!timeStrRef.current) {
    const now = new Date();
    timeStrRef.current = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  }
  const timeStr = timeStrRef.current;
  const processedCount = stack.filter(r => r.progress >= 100).length;
  const allLogs = [...logTemplates.slice(0, localVisibleLogs), ...extraLogs];
  const filteredLogs = allLogs.filter(l => {
    if (logFilter === "warnings") return l.warn;
    if (logFilter === "processes") return !l.warn;
    return true;
  });

  const globalStatus = localHalted ? "STOPPED" : localRunning && !localPaused ? "LIVE" : localPaused ? "PAUSED" : localComplete ? "COMPLETE" : "STANDBY";

  const tabs = [
    { num: 1 as const, label: "EVALUATE" },
    { num: 2 as const, label: "EXTRACT" },
    { num: 3 as const, label: "RANK" },
    { num: 4 as const, label: "DECIDE" },
  ];

  const handleRunWithWeights = () => {
    setActiveTab(4);
    setLocalRunning(true);
    setLocalProgress(0);
    setLocalStage(0);
    setLocalVisibleLogs(0);
    setLocalComplete(false);
    setLocalHalted(false);
    setLocalPaused(false);
    setStack(initialStack.map(r => ({ ...r })));
    setDecideReady(false);
    setVisibleSteps(0);
    setExtraLogs([]);
    pausedAtRef.current = { progress: 0, stage: 0, logs: 0 };
    pipelineCtx.startPipeline(selectedScenario);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Evaluation Center</h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            Four steps that evaluate, extract, rank, and decide on the best candidate for each scenario.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-center gap-0">
          {tabs.map((tab, i) => (
            <div key={tab.num} className="flex items-center">
              <button
                onClick={() => setActiveTab(tab.num)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab.num
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-card/60 backdrop-blur-sm border border-border text-muted-foreground hover:text-card-foreground hover:bg-muted"
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${activeTab === tab.num ? "bg-success animate-pulse" : "bg-muted-foreground/30"}`} />
                Step {tab.num} · {tab.label}
              </button>
              {i < tabs.length - 1 && (
                <div className="mx-3 text-muted-foreground/40 font-mono text-lg tracking-widest select-none">──►</div>
              )}
            </div>
          ))}
        </div>

        {/* Tab 1: Evaluate */}
        {activeTab === 1 && (
          <div className="glass-card p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Step 1 · Evaluate</span>
                <span className="ml-3 inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                  <span className="w-2 h-2 rounded-full bg-success" /> ACTIVE
                </span>
                {selectedScenarioIds.length > 0 && (
                  <p className="mt-1 text-sm text-primary font-semibold">{currentScenario.title}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Scenario Name</label>
                  <select
                    value={selectedScenario}
                    onChange={(e) => handleScenarioChange(e.target.value)}
                    className="mt-1 w-full bg-secondary rounded-md px-4 py-2.5 text-sm text-secondary-foreground border border-primary/30 outline-none cursor-pointer focus:ring-1 focus:ring-primary"
                  >
                    {availableScenarios.map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-muted-foreground italic">{currentScenario.description}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Criteria Weights</label>
                  <div className="mt-2 border border-border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium w-8"></th>
                          <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Metric</th>
                          <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium">Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weightKeys.map((key) => (
                          <tr key={key} className="border-b border-border last:border-0">
                            <td className="px-2 py-2.5">
                              <button onClick={() => handleToggleLock(key)} className={`p-1 rounded transition-colors ${lockedKeys.has(key) ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`} title={lockedKeys.has(key) ? "Unlock" : "Lock"}>
                                {lockedKeys.has(key) ? <Lock className="w-3.5 h-3.5" /> : <LockOpen className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                            <td className="px-3 py-2.5 text-card-foreground flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: weightColors[key] }} />
                              {metricLabels[key]}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-semibold text-primary">
                              <input type="number" step="0.01" min="0" max="1" value={editableWeights[key]}
                                onChange={(e) => handleWeightType(key, e.target.value)}
                                className="w-16 bg-transparent border-b border-primary/30 text-right font-mono font-semibold text-primary outline-none focus:border-primary px-1 py-0.5 text-sm"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className={`mt-2 flex items-center justify-between text-xs font-semibold ${isValidSum ? "text-success" : "text-destructive"}`}>
                    <span>Σ = {weightSum.toFixed(2)}</span>
                    {!isValidSum && <span>Must equal 1.00</span>}
                    {lockedKeys.size > 0 && (
                      <button onClick={() => { setLockedKeys(new Set()); setEditableWeights({ ...currentScenario.weights }); }} className="text-muted-foreground hover:text-primary">Reset</button>
                    )}
                  </div>

                  <button onClick={handleToggleAutoBalance}
                    className={`mt-3 w-full px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${autoBalance ? "bg-primary/15 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"}`}>
                    Auto-Balance {autoBalance ? "ON" : "OFF"}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Weight Distribution</label>
                <div className="h-10 rounded-lg overflow-hidden flex">
                  {weightKeys.map((key) => (
                    <div key={key} className="h-full transition-all duration-500 relative group"
                      style={{ width: `${editableWeights[key] * 100}%`, backgroundColor: weightColors[key], minWidth: editableWeights[key] > 0 ? "2px" : "0" }}>
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        {(editableWeights[key] * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {weightKeys.map((key) => (
                    <div key={key} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: weightColors[key] }} />
                      {metricLabels[key]}
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-secondary/60 backdrop-blur-sm rounded-lg">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-primary">Auto-Balance</span> distributes remaining weight equally
                    across unlocked metrics after 2+ metrics are manually set. This ensures Σ always equals 1.00.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>Today · 14:21:45</span>
              <span className="text-success font-semibold">Validated · 5 rubrics</span>
            </div>
          </div>
        )}

        {/* Tab 2: Extract */}
        {activeTab === 2 && (
          <div className="glass-card p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Step 2 · Extract</span>
                <span className="ml-3 inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                  <span className="w-2 h-2 rounded-full bg-success" /> ACTIVE
                </span>
              </div>
              <button onClick={() => setBlindMode(!blindMode)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${blindMode ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>
                {blindMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                Blind Mode {blindMode ? "ON" : "OFF"}
              </button>
            </div>

            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              {candidateProfiles.map((c, i) => (
                <button key={c.id} onClick={() => setCandidateIndex(i)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${candidateIndex === i ? "bg-primary text-primary-foreground" : "bg-secondary/60 backdrop-blur-sm text-secondary-foreground hover:bg-muted"}`}>
                  {blindMode ? `CV-${String(i + 1).padStart(3, "0")}` : c.refId} · {c.score}%
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Verified Specs</h3>
                <div className="space-y-3 text-sm">
                  <div><span className="text-xs text-muted-foreground">CANDIDATE_ID</span><p className="font-mono text-card-foreground">{blindMode ? `CV-${String(candidateIndex + 1).padStart(3, "0")}` : candidate.id}</p></div>
                  <div><span className="text-xs text-muted-foreground">NAME</span><p className="font-semibold text-card-foreground text-lg">{blindMode ? "██████████" : candidate.name}</p></div>
                  <div><span className="text-xs text-muted-foreground">SOURCE</span><span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${candidate.source === "INTERNAL" ? "bg-primary/15 text-primary" : "bg-accent text-accent-foreground"}`}>{candidate.source}</span></div>
                  <div><span className="text-xs text-muted-foreground">EDUCATION</span><p className="text-card-foreground">{candidate.education}</p></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><span className="text-xs text-muted-foreground">TOTAL XP</span><p className="text-2xl font-bold text-card-foreground">{candidate.totalXp}<span className="text-sm text-muted-foreground ml-1">yrs</span></p></div>
                    <div><span className="text-xs text-muted-foreground">LEADERSHIP XP</span><p className="text-2xl font-bold text-primary">{candidate.leadershipXp}<span className="text-sm text-muted-foreground ml-1">yrs</span></p></div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Extracted</h3>
                <div><span className="text-xs text-muted-foreground">LATEST ROLES</span>
                  <div className="mt-1 space-y-1.5">{candidate.latestRoles.map((r, i) => (<p key={i} className="text-sm text-card-foreground bg-secondary/60 backdrop-blur-sm rounded px-3 py-1.5">{r}</p>))}</div>
                </div>
                <div><span className="text-xs text-muted-foreground">EXPERTISE</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">{candidate.expertise.map((e) => (<span key={e} className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">{e}</span>))}</div>
                </div>
                <div className="space-y-3 mt-2">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-warning border-b border-warning/20 pb-2 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-warning" /> AI Inferred</h3>
                  <div className="border border-warning/20 rounded-lg p-3 bg-warning/5"><span className="text-xs text-muted-foreground">INDUSTRY_EXPERIENCE</span><p className="text-sm text-card-foreground mt-0.5">{candidate.industryScope}</p></div>
                  <div className="border border-warning/20 rounded-lg p-3 bg-warning/5"><span className="text-xs text-muted-foreground">CROSS_FUNCTIONAL_SCOPE</span><p className="text-sm text-card-foreground mt-0.5">{candidate.crossFunctionalScope}</p></div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
              <div className="flex gap-2">
                {candidate.flags.length > 0 ? candidate.flags.map((f) => (<span key={f} className="px-2 py-1 text-[10px] font-semibold rounded bg-warning/15 text-warning">{f}</span>)) : (<span className="text-xs text-muted-foreground">No flags</span>)}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <button onClick={() => setCandidateIndex(Math.max(0, candidateIndex - 1))} disabled={candidateIndex === 0} className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4 text-muted-foreground" /></button>
                <span className="text-muted-foreground font-mono">CV {candidateIndex + 1} of {candidateProfiles.length}</span>
                <button onClick={() => setCandidateIndex(Math.min(candidateProfiles.length - 1, candidateIndex + 1))} disabled={candidateIndex === candidateProfiles.length - 1} className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4 text-muted-foreground" /></button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Rank */}
        {activeTab === 3 && (
          <div className="glass-card p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Step 3 · Rank</span>
                <span className="ml-3 inline-flex items-center gap-1.5 text-xs font-semibold text-success"><span className="w-2 h-2 rounded-full bg-success" /> ACTIVE</span>
              </div>
            </div>

            {hasNearTie && (
              <div className="flex items-center gap-2 px-4 py-2.5 mb-6 rounded-lg border border-warning/30 bg-warning/5">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium text-warning">CLOSE MATCH — Top candidates differ by less than 2 points. Consider reviewing both.</span>
              </div>
            )}

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["#", "Candidate", "Score", "Score Breakdown", "Driver"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs uppercase tracking-widest text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rankedCandidates.slice(0, 5).map((c, i) => {
                    const rank = i + 1;
                    const topKey = (Object.entries(c.scores) as [keyof ScenarioWeight, number][]).sort((a, b) => b[1] - a[1])[0][0];
                    return (
                      <React.Fragment key={c.id}>
                        <tr className={`border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 transition-colors ${rank === 1 ? "bg-primary/5" : ""}`} onClick={() => setExpandedRankRow(expandedRankRow === i ? null : i)}>
                          <td className={`px-4 py-3 font-bold ${rank === 1 ? "text-primary" : "text-muted-foreground"}`}>#{rank}</td>
                          <td className="px-4 py-3 font-medium text-card-foreground">{c.name}</td>
                          <td className="px-4 py-3"><span className="font-mono font-bold text-primary text-lg">{c.compositeScore.toFixed(1)}</span></td>
                          <td className="px-4 py-3">
                            <div className="flex h-4 rounded overflow-hidden w-40 border border-border">
                              {weightKeys.map((key, ki) => {
                                const segmentWidth = (editableWeights[key] * c.scores[key]) / c.compositeScore * 100;
                                return (<div key={key} className={`h-full ${ki < weightKeys.length - 1 ? "border-r-2 border-background" : ""}`} style={{ width: `${segmentWidth}%`, backgroundColor: weightColors[key] }} />);
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3"><span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-accent text-accent-foreground">{metricLabels[topKey]}</span></td>
                        </tr>
                        {expandedRankRow === i && (
                          <tr className="border-b border-border">
                            <td colSpan={5} className="px-4 py-3 bg-muted/20">
                              <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
                                <p className="font-semibold text-card-foreground mb-1">Score breakdown:</p>
                                {weightKeys.map((key) => (
                                  <div key={key} className="flex items-center gap-2">
                                    <span className="w-36">{metricLabels[key]}</span>
                                    <span className="text-card-foreground">{c.scores[key]} pts</span>
                                    <span className="text-muted-foreground">× {(editableWeights[key] * 100).toFixed(0)}% weight</span>
                                    <span className="text-primary font-semibold ml-auto">= {(editableWeights[key] * c.scores[key]).toFixed(1)}</span>
                                  </div>
                                ))}
                                <div className="pt-1 border-t border-border font-semibold text-primary">Total: {c.compositeScore.toFixed(1)}</div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <button onClick={() => setAlgorithmOpen(!algorithmOpen)} className="flex items-center justify-between w-full text-left px-4 py-3 rounded-lg bg-secondary/60 backdrop-blur-sm hover:bg-muted transition-colors">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">How Scoring Works</span>
                {algorithmOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
              {algorithmOpen && (
                <div className="mt-2 px-4 py-3 bg-secondary/60 backdrop-blur-sm rounded-lg text-sm text-secondary-foreground space-y-2 animate-fade-in">
                  <p className="leading-relaxed"><span className="text-primary font-semibold">Weighted scoring</span> — Each candidate's skills are measured against the scenario's priorities to produce a single score.</p>
                  <p className="leading-relaxed"><span className="text-primary font-semibold">Minimum thresholds</span> filter out candidates who don't meet baseline requirements. Close-match detection flags when top scores are within 2 points.</p>
                  <p className="leading-relaxed"><span className="text-primary font-semibold">Score bands</span> group candidates into Strong Fit, Good Fit, Moderate Fit, and Below Threshold categories.</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end">
              <span className="text-xs text-muted-foreground">Today · 14:22:18 · <span className="text-success font-semibold">{rankedCandidates.length} candidates ranked</span></span>
            </div>
          </div>
        )}

        {/* Tab 4: Decide — Merged Pipeline + Decision Dashboard */}
        {activeTab === 4 && (
          <div className="space-y-6 animate-fade-in">
            {/* Status + Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Step 4 · Decide</span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  globalStatus === "LIVE" ? "bg-success/15 text-success" :
                  globalStatus === "STOPPED" ? "bg-destructive/15 text-destructive" :
                  globalStatus === "PAUSED" ? "bg-warning/15 text-warning" :
                  globalStatus === "COMPLETE" ? "bg-success/15 text-success" :
                  "bg-muted text-muted-foreground"
                }`}>
                  <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                    globalStatus === "LIVE" ? "bg-success animate-pulse" :
                    globalStatus === "STOPPED" ? "bg-destructive" :
                    globalStatus === "PAUSED" ? "bg-warning" :
                    globalStatus === "COMPLETE" ? "bg-success" :
                    "bg-muted-foreground"
                  }`} />
                  {globalStatus}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {(localRunning || localPaused) && (
                  <>
                    <button onClick={localPaused ? handleResume : handlePause}
                      className={`px-3 py-1.5 text-xs rounded-md border font-semibold transition-colors flex items-center gap-1 ${localPaused ? "border-success bg-success/10 text-success" : "border-border text-card-foreground hover:bg-muted"}`}>
                      {localPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                      {localPaused ? "RESUME" : "PAUSE"}
                    </button>
                    <button onClick={() => setShowHaltModal(true)}
                      className="px-3 py-1.5 text-xs rounded-md border border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20 font-semibold flex items-center gap-1">
                      <OctagonX className="w-3 h-3" /> STOP ALL
                    </button>
                  </>
                )}
                <button onClick={() => setShowBehindScenes(!showBehindScenes)}
                  className={`px-3 py-1.5 text-xs rounded-md border font-semibold transition-colors flex items-center gap-1 ${showBehindScenes ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-card-foreground"}`}>
                  <Layers className="w-3 h-3" /> Behind the Scenes
                </button>
              </div>
            </div>

            {/* Stop Modal */}
            {showHaltModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full shadow-2xl animate-scale-in">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-6 h-6 text-warning" />
                    <h2 className="text-xl font-bold text-card-foreground">Stop all processes?</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">This will stop the evaluation of all candidates.</p>
                  <p className="text-sm text-muted-foreground mb-6">Partial results will be preserved.</p>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setShowHaltModal(false)} className="px-5 py-2 rounded-md border border-border text-card-foreground hover:bg-muted transition-colors text-sm font-medium">Cancel</button>
                    <button onClick={handleStop} className="px-5 py-2 rounded-md bg-destructive text-destructive-foreground font-semibold text-sm hover:bg-destructive/90 transition-colors flex items-center gap-2">🛑 STOP ALL</button>
                  </div>
                </div>
              </div>
            )}

            {/* 5 Process Cards */}
            <div className="flex gap-3">
              {stageTemplates.map((s, i) => {
                const status = getStageStatus(i);
                const isDone = status === "DONE";
                const isActive = status === "RUNNING";
                const isStopped = status === "STOPPED";
                const isPausedStage = status === "PAUSED";
                return (
                  <div key={s.label} className={`flex-1 p-4 rounded-lg border transition-all duration-500 ${
                    isDone ? "border-success/30 bg-success/5" :
                    isActive ? `border-primary/40 bg-card ${s.glowColor}` :
                    isStopped ? "border-destructive/30 bg-destructive/5" :
                    isPausedStage ? "border-warning/30 bg-warning/5" :
                    "border-border bg-card opacity-50"
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">{s.label}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${isDone ? "bg-success" : isActive ? `${s.color} animate-pulse` : isStopped ? "bg-destructive" : isPausedStage ? "bg-warning" : "bg-muted-foreground/30"}`} />
                    </div>
                    <p className={`text-sm font-bold ${isDone ? "text-success" : isActive ? "text-primary" : isStopped ? "text-destructive" : isPausedStage ? "text-warning" : "text-muted-foreground"}`}>{status}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{isDone ? "Complete" : s.detail}</p>
                    <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${isDone ? "bg-success w-full" : isStopped ? "bg-destructive" : isPausedStage ? "bg-warning" : isActive ? s.barColor : "bg-transparent"}`}
                        style={isActive ? { width: `${localProgress % 100}%` } : (isPausedStage || isStopped) ? { width: `${localProgress % 100}%` } : undefined} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time to Completion */}
            <div className="flex items-center justify-between bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Time to Completion</p>
              </div>
              <p className={`text-xl font-bold font-mono ${localComplete ? "text-success" : localHalted ? "text-destructive" : localPaused ? "text-warning" : "text-primary"}`}>
                {localComplete ? "COMPLETE" : localHalted ? "STOPPED" : localPaused ? "PAUSED" : `00:00:${Math.max(0, Math.round(8 - localProgress * 0.08)).toString().padStart(2, "0")}`}
              </p>
            </div>

            {/* Behind the Scenes — Agent Plan */}
            {showBehindScenes && (
              <div className="glass-card p-6 animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-card-foreground">Behind the Scenes — What the system is doing</h3>
                </div>
                <Suspense fallback={<div className="text-sm text-muted-foreground py-4 text-center">Loading...</div>}>
                  <AgentPlan />
                </Suspense>
              </div>
            )}

            {/* Logs + Active Stack */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Logs */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-card-foreground">Process Logs</h2>
                  <span className={`flex items-center gap-1.5 text-xs font-semibold ${localHalted ? "text-destructive" : localPaused ? "text-warning" : localRunning ? "text-destructive" : "text-muted-foreground"}`}>
                    {(localRunning || localPaused || localHalted) && <span className={`w-2 h-2 rounded-full ${localHalted ? "bg-destructive" : localPaused ? "bg-warning" : "bg-destructive animate-pulse"}`} />}
                    {localHalted ? "STOPPED" : localPaused ? "PAUSED" : localRunning ? "LIVE" : "FINISHED"}
                  </span>
                </div>

                <div className="flex gap-2 mb-4">
                  {(["all", "processes", "warnings"] as LogFilter[]).map(f => {
                    const warningCount = allLogs.filter(l => l.warn).length;
                    return (
                      <button key={f} onClick={() => setLogFilter(f)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${logFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-card-foreground"}`}>
                        {f === "warnings" ? "⚠ Warnings" : f === "processes" ? "Processes" : "All"}
                        {f === "warnings" && warningCount > 0 && (
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-warning text-[9px] font-bold text-warning-foreground">{warningCount}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2 font-mono text-xs max-h-72 overflow-y-auto">
                  {filteredLogs.map((l, i) => (
                    <div key={i} onClick={() => handleLogClick(l.refId)}
                      className={`transition-all duration-200 px-2 py-1 rounded flex items-start gap-1.5 ${l.warn ? "bg-warning/10 border border-warning/20" : ""} ${l.refId ? "cursor-pointer hover:bg-muted/50" : ""}`}>
                      <div className="flex-1">
                        <span className="text-muted-foreground">[{timeStr}:{(i * 3 + 10).toString().padStart(2, "0")}]</span>{" "}
                        <span className={l.warn ? "text-warning font-semibold" : "text-card-foreground"}>{l.text}</span>
                      </div>
                      {l.warn && (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="mt-0.5 flex-shrink-0 cursor-help"><Info className="w-3.5 h-3.5 text-warning" /></span>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs text-xs">
                              <p className="font-semibold text-warning mb-1">Warning Details</p>
                              <p>{l.refId ? `Issue detected with candidate ${l.refId}. ` : ""}{l.text.includes("Low-quality") ? "The uploaded file had missing or poorly formatted fields. Some scores may be estimated." : "An unexpected condition was encountered. Results may need manual review."}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  ))}
                  {(localComplete || localHalted) && <p className="text-[10px] text-muted-foreground text-center pt-2">END OF STREAM</p>}
                </div>
              </div>

              {/* Active Stack */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h2 className="text-lg font-bold text-card-foreground">Candidate Progress</h2>
                    <p className="text-xs text-muted-foreground">Tracking {stack.length} candidates</p>
                  </div>
                  <button onClick={() => setShowNames(!showNames)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-colors ${showNames ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {showNames ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {showNames ? "Reveal" : "Blind"}
                  </button>
                </div>

                <table className="w-full text-xs mt-3">
                  <thead>
                    <tr className="border-b border-border">
                      {["REF ID", "CANDIDATE", "PROGRESS", "CONFIDENCE", ""].map(h => (
                        <th key={h} className="text-left px-2 py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stack.map(row => (
                      <tr key={row.id} className={`border-b border-border last:border-0 transition-all duration-300 group ${row.halted ? "bg-destructive/5" : ""} ${highlightedRow === row.id ? "border-l-2 border-l-primary bg-primary/5" : ""} ${highlightedRow && highlightedRow !== row.id ? "opacity-40" : "opacity-100"}`}>
                        <td className="px-2 py-2.5 font-mono text-muted-foreground">
                          {row.id}
                          {row.halted && <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold rounded bg-destructive/15 text-destructive">STOPPED</span>}
                        </td>
                        <td className="px-2 py-2.5 font-medium text-card-foreground">{showNames ? row.name : row.id}</td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${row.halted ? "bg-destructive" : row.progress >= 100 ? "bg-success" : "bg-primary"}`} style={{ width: `${row.progress}%` }} />
                            </div>
                            <span className="text-muted-foreground w-8">{Math.round(row.progress)}%</span>
                          </div>
                        </td>
                        <td className={`px-2 py-2.5 font-mono font-bold ${row.confidence < 0.75 ? "text-warning" : "text-primary"}`}>{row.confidence.toFixed(2)}</td>
                        <td className="px-2 py-2.5">
                          {!row.halted && localRunning && (
                            <button onClick={() => handleHaltRow(row.id)} className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" title="Stop">
                              <OctagonX className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Decision Output — shows after completion */}
            {decideReady && rankedCandidates.length >= 2 && (() => {
                  const top = rankedCandidates[0];
                  const runner = rankedCandidates[1];
                  const gap = Math.abs(top.compositeScore - runner.compositeScore);
                  const confidence = gap > 5 ? "High" : gap > 2 ? "Medium" : "Low";
                  const confidenceColor = gap > 5 ? "text-success" : gap > 2 ? "text-warning" : "text-destructive";
                  const confidenceWidth = gap > 5 ? "75%" : gap > 2 ? "50%" : "25%";
                  const strengths = Object.keys(top.scores).filter(k => (top.scores as any)[k] > (runner.scores as any)[k]).map(k => metricLabels[k as keyof ScenarioWeight] || k);
                  const tradeoffs = Object.keys(runner.scores).filter(k => (runner.scores as any)[k] > (top.scores as any)[k]).map(k => metricLabels[k as keyof ScenarioWeight] || k);

                  return (
                    <div className="glass-card p-8 animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="p-5 rounded-xl border border-success/30 bg-success/5 space-y-3">
                        <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Recommendation</label>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center text-lg">🏆</div>
                          <div>
                            <p className="text-lg font-bold text-card-foreground">{top.name}</p>
                            <p className="text-sm text-muted-foreground">Score: <span className="text-success font-semibold">{top.compositeScore}</span> · Runner-up: {runner.name} ({runner.compositeScore})</p>
                          </div>
                        </div>
                        <div className="space-y-1.5 pt-2">
                          <p className="text-xs font-semibold text-success">Why they win:</p>
                          {strengths.slice(0, 3).map((s, i) => (<p key={i} className="text-sm text-card-foreground flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-success" /> Leads in {s}</p>))}
                        </div>
                        {tradeoffs.length > 0 && (
                          <div className="space-y-1.5 pt-2">
                            <p className="text-xs font-semibold text-warning">Acknowledged tradeoff:</p>
                            {tradeoffs.slice(0, 2).map((t, i) => (<p key={i} className="text-sm text-card-foreground flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-warning" /> {runner.name} scores higher in {t}</p>))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-5">
                        <div className="p-5 rounded-xl border border-border bg-card/60 space-y-3">
                          <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Decision Confidence</label>
                          <div className="flex items-center justify-between">
                            <span className={`text-lg font-bold ${confidenceColor}`}>{confidence}</span>
                            <span className="text-xs text-muted-foreground">{gap.toFixed(1)} point margin</span>
                          </div>
                          <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-1000 ${gap > 5 ? "bg-success" : gap > 2 ? "bg-warning" : "bg-destructive"}`} style={{ width: confidenceWidth }} />
                          </div>
                          <p className="text-xs text-muted-foreground">{gap > 5 ? "Clear margin — strong recommendation." : gap > 2 ? "Moderate gap — consider reviewing tradeoffs." : "Very close — manual review recommended."}</p>
                        </div>
                        <div className="p-5 rounded-xl border border-border bg-card/60 space-y-3">
                          <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">What-If Insight</label>
                          <p className="text-sm text-card-foreground">
                            If <span className="text-primary font-semibold">{runner.name}</span> improved by <span className="text-primary font-semibold">+10 pts</span> in their weakest area, their score would move closer to {top.name}'s — but {top.name} would still lead.
                          </p>
                        </div>
                      </div>
                    </div>
                    </div>
                  );
                })()}
          </div>
        )}

        {/* Apply New Weights & Re-Run */}
        <div className="flex justify-center">
          <button onClick={handleRunWithWeights}
            className="w-full max-w-xl py-3.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest hover:bg-primary/90 transition-colors">
            Apply New Weights & Re-Run
          </button>
        </div>

        {/* Global Bottom Bar */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-4">
          <div className="flex items-center gap-6">
            <span>VERSION: <span className="text-primary font-semibold">3.0.4</span></span>
            <span>STEPS ACTIVE: <span className="text-success font-semibold">4/4</span></span>
            <span>LAST RUN: <span className="font-semibold text-card-foreground">14:22:18</span></span>
            <span>CANDIDATES: <span className="font-semibold text-card-foreground">{candidateProfiles.length.toString().padStart(2, "0")}</span></span>
          </div>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success" /> ALL SYSTEMS GO
          </span>
        </div>
      </div>
    </AppLayout>
  );
};

export default EvaluationsPage;
