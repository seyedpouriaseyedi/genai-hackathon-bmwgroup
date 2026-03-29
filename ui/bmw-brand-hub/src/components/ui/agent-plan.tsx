"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  CircleAlert,
  CircleDotDashed,
  CircleX,
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

interface Subtask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  tools?: string[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  level: number;
  dependencies: string[];
  subtasks: Subtask[];
}

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Evaluate Scenario Criteria",
    description: "Load scenario weights and validate evaluation rubrics",
    status: "completed",
    priority: "high",
    level: 0,
    dependencies: [],
    subtasks: [
      { id: "1.1", title: "Load scenario weights", description: "Read the selected scenario's priority weights from configuration", status: "completed", priority: "high", tools: ["scenario-loader"] },
      { id: "1.2", title: "Validate weight distribution", description: "Ensure all weights sum to 1.0 and meet minimum thresholds", status: "completed", priority: "medium", tools: ["weight-validator"] },
      { id: "1.3", title: "Map competency rubrics", description: "Link each weight to the corresponding competency scoring rubric", status: "completed", priority: "medium", tools: ["rubric-mapper"] },
    ],
  },
  {
    id: "2",
    title: "Extract Candidate Profiles",
    description: "Parse and normalize all candidate data from uploaded files",
    status: "in-progress",
    priority: "high",
    level: 0,
    dependencies: [],
    subtasks: [
      { id: "2.1", title: "Parse uploaded CSV", description: "Extract structured data from the uploaded applicant file", status: "completed", priority: "high", tools: ["file-parser", "csv-reader"] },
      { id: "2.2", title: "Normalize competency scores", description: "Standardize all competency scores to a 0-100 scale", status: "in-progress", priority: "medium", tools: ["score-normalizer"] },
      { id: "2.3", title: "Flag data quality issues", description: "Identify missing fields, date inconsistencies, and low-quality entries", status: "pending", priority: "high", tools: ["quality-checker"] },
    ],
  },
  {
    id: "3",
    title: "Score & Rank Candidates",
    description: "Apply weighted scoring model and produce ranked list",
    status: "pending",
    priority: "high",
    level: 1,
    dependencies: ["1", "2"],
    subtasks: [
      { id: "3.1", title: "Calculate weighted scores", description: "Multiply each competency by its scenario weight and sum", status: "pending", priority: "high", tools: ["scoring-engine"] },
      { id: "3.2", title: "Apply minimum thresholds", description: "Filter out candidates below the minimum competency requirements", status: "pending", priority: "medium", tools: ["threshold-filter"] },
      { id: "3.3", title: "Detect close matches", description: "Flag candidates within 2 points of each other for manual review", status: "pending", priority: "medium", tools: ["tie-detector"] },
    ],
  },
  {
    id: "4",
    title: "Compare Top Candidates",
    description: "Deep comparison of the top-ranked candidates",
    status: "pending",
    priority: "medium",
    level: 1,
    dependencies: ["3"],
    subtasks: [
      { id: "4.1", title: "Identify strengths vs runner-up", description: "Find competencies where #1 outperforms #2", status: "pending", priority: "high", tools: ["comparison-engine"] },
      { id: "4.2", title: "Identify tradeoffs", description: "Find areas where the runner-up scores higher than #1", status: "pending", priority: "medium", tools: ["tradeoff-analyzer"] },
      { id: "4.3", title: "Run what-if simulation", description: "Simulate +10pt improvement scenarios for top candidates", status: "pending", priority: "medium", tools: ["what-if-simulator"] },
    ],
  },
  {
    id: "5",
    title: "Generate Recommendation",
    description: "Produce final recommendation with explanation and confidence level",
    status: "pending",
    priority: "high",
    level: 1,
    dependencies: ["4"],
    subtasks: [
      { id: "5.1", title: "Draft recommendation text", description: "Generate human-readable explanation of the decision", status: "pending", priority: "high", tools: ["text-generator", "explanation-builder"] },
      { id: "5.2", title: "Calculate confidence level", description: "Determine decision confidence based on score margins", status: "pending", priority: "medium", tools: ["confidence-calculator"] },
      { id: "5.3", title: "Package output payload", description: "Assemble the full response payload for the recommendation page", status: "pending", priority: "high", tools: ["payload-builder"] },
    ],
  },
];

export default function AgentPlan() {
  const [tasks, setTasks] = useState(initialTasks);
  const [expandedTasks, setExpandedTasks] = useState(["1", "2"]);
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({});

  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const toggleSubtaskExpansion = (taskId: string, subtaskId: string) => {
    const key = `${taskId}-${subtaskId}`;
    setExpandedSubtasks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const taskVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : -5 },
    visible: { opacity: 1, y: 0, transition: { type: prefersReducedMotion ? "tween" as const : "spring" as const, stiffness: 500, damping: 30 } },
    exit: { opacity: 0, y: prefersReducedMotion ? 0 : -5, transition: { duration: 0.15 } },
  };

  const subtaskListVariants = {
    hidden: { opacity: 0, height: 0, overflow: "hidden" as const },
    visible: { height: "auto", opacity: 1, overflow: "visible" as const, transition: { duration: 0.25, staggerChildren: prefersReducedMotion ? 0 : 0.05, when: "beforeChildren" as const, ease: [0.2, 0.65, 0.3, 0.9] as [number, number, number, number] } },
    exit: { height: 0, opacity: 0, overflow: "hidden" as const, transition: { duration: 0.2, ease: [0.2, 0.65, 0.3, 0.9] as [number, number, number, number] } },
  };

  const subtaskVariants = {
    hidden: { opacity: 0, x: prefersReducedMotion ? 0 : -10 },
    visible: { opacity: 1, x: 0, transition: { type: prefersReducedMotion ? "tween" as const : "spring" as const, stiffness: 500, damping: 25 } },
    exit: { opacity: 0, x: prefersReducedMotion ? 0 : -10, transition: { duration: 0.15 } },
  };

  const subtaskDetailsVariants = {
    hidden: { opacity: 0, height: 0, overflow: "hidden" as const },
    visible: { opacity: 1, height: "auto", overflow: "visible" as const, transition: { duration: 0.25, ease: [0.2, 0.65, 0.3, 0.9] as [number, number, number, number] } },
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-5 h-5 text-success" />;
      case "in-progress": return <CircleDotDashed className="w-5 h-5 text-primary animate-spin" style={{ animationDuration: "3s" }} />;
      case "need-help": return <CircleAlert className="w-5 h-5 text-warning" />;
      case "failed": return <CircleX className="w-5 h-5 text-destructive" />;
      default: return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success/15 text-success border-success/30";
      case "in-progress": return "bg-primary/15 text-primary border-primary/30";
      case "need-help": return "bg-warning/15 text-warning border-warning/30";
      case "failed": return "bg-destructive/15 text-destructive border-destructive/30";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="w-full">
      <LayoutGroup>
        <div className="space-y-1">
          {tasks.map((task) => {
            const isExpanded = expandedTasks.includes(task.id);
            return (
              <motion.div key={task.id} variants={taskVariants} initial="hidden" animate="visible" exit="exit" layout>
                {/* Task row */}
                <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <motion.button
                    onClick={(e) => { e.stopPropagation(); }}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.1 }}
                    className="flex-shrink-0"
                  >
                    <StatusIcon status={task.status} />
                  </motion.button>

                  <button onClick={() => toggleTaskExpansion(task.id)} className="flex-1 flex items-center justify-between min-w-0">
                    <span className={`text-sm font-medium truncate ${task.status === "completed" ? "line-through text-muted-foreground" : "text-card-foreground"}`}>
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      {task.dependencies.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          needs: {task.dependencies.map((dep) => (
                            <span key={dep} className="inline-block px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono ml-0.5">{dep}</span>
                          ))}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                  </button>
                </div>

                {/* Subtasks */}
                <AnimatePresence>
                  {isExpanded && task.subtasks.length > 0 && (
                    <motion.div variants={subtaskListVariants} initial="hidden" animate="visible" exit="exit" className="relative ml-6 pl-4 border-l border-border">
                      {task.subtasks.map((subtask) => {
                        const subtaskKey = `${task.id}-${subtask.id}`;
                        const isSubtaskExpanded = expandedSubtasks[subtaskKey];

                        return (
                          <motion.div
                            key={subtask.id}
                            onClick={() => toggleSubtaskExpansion(task.id, subtask.id)}
                            variants={subtaskVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            layout
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-muted/20 transition-colors">
                              <div className="flex-shrink-0 scale-75">
                                <StatusIcon status={subtask.status} />
                              </div>
                              <span className={`text-xs ${subtask.status === "completed" ? "line-through text-muted-foreground" : "text-card-foreground"}`}>
                                {subtask.title}
                              </span>
                            </div>

                            <AnimatePresence>
                              {isSubtaskExpanded && (
                                <motion.div variants={subtaskDetailsVariants} initial="hidden" animate="visible" exit="hidden" className="ml-8 pb-2">
                                  <p className="text-xs text-muted-foreground">{subtask.description}</p>
                                  {subtask.tools && subtask.tools.length > 0 && (
                                    <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                                      <span className="text-[10px] text-muted-foreground">Tools:</span>
                                      {subtask.tools.map((tool) => (
                                        <span key={tool} className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-primary/10 text-primary border border-primary/20">
                                          {tool}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}
