import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface PipelineState {
  isRunning: boolean;
  isPaused: boolean;
  isComplete: boolean;
  isHalted: boolean;
  progress: number;
  currentStage: number;
  visibleLogs: number;
  scenariosParam: string;
}

interface PipelineContextValue extends PipelineState {
  startPipeline: (scenariosParam: string) => void;
  pausePipeline: () => void;
  resumePipeline: () => void;
  haltPipeline: () => void;
  resetPipeline: () => void;
}

const PipelineContext = createContext<PipelineContextValue | null>(null);

const TOTAL_DURATION = 6000;
const STAGE_COUNT = 5;
const LOG_COUNT = 13;

export function PipelineProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [state, setState] = useState<PipelineState>({
    isRunning: false,
    isPaused: false,
    isComplete: false,
    isHalted: false,
    progress: 0,
    currentStage: 0,
    visibleLogs: 0,
    scenariosParam: "supply-chain",
  });

  const timersRef = useRef<{ progress?: ReturnType<typeof setInterval>; stages: ReturnType<typeof setTimeout>[]; logs: ReturnType<typeof setTimeout>[]; complete?: ReturnType<typeof setTimeout> }>({ stages: [], logs: [] });
  const pausedProgressRef = useRef(0);
  const startTimeRef = useRef(0);
  const hasNavigatedRef = useRef(false);

  const clearAllTimers = useCallback(() => {
    if (timersRef.current.progress) clearInterval(timersRef.current.progress);
    timersRef.current.stages.forEach(clearTimeout);
    timersRef.current.logs.forEach(clearTimeout);
    if (timersRef.current.complete) clearTimeout(timersRef.current.complete);
    timersRef.current = { stages: [], logs: [] };
  }, []);

  const runSimulation = useCallback((fromProgress: number, fromStage: number, fromLogs: number, remainingTime: number) => {
    startTimeRef.current = Date.now();
    const progressInterval = 100;

    timersRef.current.progress = setInterval(() => {
      setState(prev => {
        const step = 100 / (TOTAL_DURATION / progressInterval);
        const next = Math.min(prev.progress + step, 100);
        pausedProgressRef.current = next;
        return { ...prev, progress: next };
      });
    }, progressInterval);

    for (let i = fromStage; i < STAGE_COUNT; i++) {
      const delay = ((i - fromStage) / Math.max(STAGE_COUNT - fromStage, 1)) * remainingTime;
      timersRef.current.stages.push(setTimeout(() => {
        setState(prev => ({ ...prev, currentStage: i }));
      }, delay));
    }

    for (let i = fromLogs; i < LOG_COUNT; i++) {
      const delay = ((i - fromLogs) / Math.max(LOG_COUNT - fromLogs, 1)) * remainingTime;
      timersRef.current.logs.push(setTimeout(() => {
        setState(prev => ({ ...prev, visibleLogs: i + 1 }));
      }, delay));
    }

    timersRef.current.complete = setTimeout(() => {
      clearAllTimers();
      setState(prev => ({
        ...prev,
        isRunning: false,
        isComplete: true,
        progress: 100,
        currentStage: STAGE_COUNT - 1,
        visibleLogs: LOG_COUNT,
      }));
    }, remainingTime);
  }, [clearAllTimers]);

  // Auto-navigate to recommendation when complete (not when halted) — ONCE only
  useEffect(() => {
    if (!state.isComplete || state.isHalted || hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    const timer = setTimeout(() => {
      navigate(`/recommendation?scenarios=${state.scenariosParam}`);
    }, 1500);
    return () => clearTimeout(timer);
  }, [state.isComplete, state.isHalted, state.scenariosParam, navigate]);

  // Drive the simulation when running and not paused/halted
  useEffect(() => {
    if (!state.isRunning || state.isPaused || state.isHalted) return;
    const remaining = TOTAL_DURATION * (1 - pausedProgressRef.current / 100);
    runSimulation(
      pausedProgressRef.current,
      state.currentStage,
      state.visibleLogs,
      remaining > 0 ? remaining : TOTAL_DURATION
    );
    return () => clearAllTimers();
    // Only re-run when these flags change, not on every state update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isRunning, state.isPaused, state.isHalted]);

  const startPipeline = useCallback((scenariosParam: string) => {
    clearAllTimers();
    pausedProgressRef.current = 0;
    hasNavigatedRef.current = false;
    setState({
      isRunning: true,
      isPaused: false,
      isComplete: false,
      isHalted: false,
      progress: 0,
      currentStage: 0,
      visibleLogs: 0,
      scenariosParam,
    });
  }, [clearAllTimers]);

  const pausePipeline = useCallback(() => {
    clearAllTimers();
    setState(prev => ({ ...prev, isPaused: true }));
  }, [clearAllTimers]);

  const resumePipeline = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: false }));
  }, []);

  const haltPipeline = useCallback(() => {
    clearAllTimers();
    setState(prev => ({ ...prev, isRunning: false, isHalted: true }));
  }, [clearAllTimers]);

  const resetPipeline = useCallback(() => {
    clearAllTimers();
    pausedProgressRef.current = 0;
    hasNavigatedRef.current = false;
    setState({
      isRunning: false,
      isPaused: false,
      isComplete: false,
      isHalted: false,
      progress: 0,
      currentStage: 0,
      visibleLogs: 0,
      scenariosParam: "supply-chain",
    });
  }, [clearAllTimers]);

  return (
    <PipelineContext.Provider value={{ ...state, startPipeline, pausePipeline, resumePipeline, haltPipeline, resetPipeline }}>
      {children}
    </PipelineContext.Provider>
  );
}

export function usePipelineContext() {
  const ctx = useContext(PipelineContext);
  if (!ctx) throw new Error("usePipelineContext must be used within PipelineProvider");
  return ctx;
}
