import { Flame, Cog, GitBranch } from "lucide-react";

export interface ScenarioWeight {
  scalability_mindset: number;
  hard_skill_match: number;
  cultural_alignment: number;
  risk_mitigation: number;
  adaptability_index: number;
}

export interface Scenario {
  id: string;
  icon: typeof Flame;
  title: string;
  backendName: string;
  description: string;
  weights: ScenarioWeight;
}

export const scenarios: Scenario[] = [
  {
    id: "supply-chain",
    icon: Flame,
    title: "Supply Chain Disruption",
    backendName: "Supply Chain Disruption",
    description: "Prioritizes crisis handling, supplier management, and rapid decision-making under uncertainty.",
    weights: {
      scalability_mindset: 0.25,
      hard_skill_match: 0.25,
      cultural_alignment: 0.20,
      risk_mitigation: 0.15,
      adaptability_index: 0.15,
    },
  },
  {
    id: "digital-transform",
    icon: Cog,
    title: "Digital Transformation",
    backendName: "Digital Transformation",
    description: "Prioritizes adaptability, transformation capability, and cross-functional change leadership.",
    weights: {
      scalability_mindset: 0.30,
      hard_skill_match: 0.20,
      cultural_alignment: 0.15,
      risk_mitigation: 0.20,
      adaptability_index: 0.15,
    },
  },
  {
    id: "operational",
    icon: GitBranch,
    title: "Operational Continuity",
    backendName: "Operational Continuity",
    description: "Prioritizes internal knowledge, continuity focus, and stable operations leadership.",
    weights: {
      scalability_mindset: 0.15,
      hard_skill_match: 0.25,
      cultural_alignment: 0.25,
      risk_mitigation: 0.10,
      adaptability_index: 0.25,
    },
  },
];

export const weightKeys: (keyof ScenarioWeight)[] = [
  "scalability_mindset",
  "hard_skill_match",
  "cultural_alignment",
  "risk_mitigation",
  "adaptability_index",
];

export const weightColors: Record<keyof ScenarioWeight, string> = {
  scalability_mindset: "hsl(207, 100%, 44%)",
  hard_skill_match: "hsl(142, 60%, 45%)",
  cultural_alignment: "hsl(38, 80%, 50%)",
  risk_mitigation: "hsl(0, 62%, 45%)",
  adaptability_index: "hsl(270, 60%, 55%)",
};

// Mock ranking results per scenario
export const scenarioRankings: Record<string, { rank1: string; score: number; reason: string }> = {
  "supply-chain": {
    rank1: "Anna Keller",
    score: 93.3,
    reason: "Crisis-response profile and supplier coordination expertise push her to the top when risk_mitigation and hard_skill_match are heavily weighted.",
  },
  "digital-transform": {
    rank1: "Marcus Thorne",
    score: 89.2,
    reason: "Under Digital Transformation, scalability_mindset is weighted 30%, causing candidates with strategic sourcing and broad industry experience to rise.",
  },
  "operational": {
    rank1: "Anna Keller",
    score: 87.7,
    reason: "With cultural_alignment and adaptability_index each at 25%, candidates with strong cross-functional scope and stakeholder management excel.",
  },
};

// Cross-scenario ranking data for "How does ranking change by scenario?"
export const crossScenarioRankings: Record<string, Record<string, { rank: number; score: number }>> = {
  "Anna Keller": { "supply-chain": { rank: 1, score: 93.3 }, "digital-transform": { rank: 2, score: 87.4 }, "operational": { rank: 1, score: 87.7 } },
  "Marcus Thorne": { "supply-chain": { rank: 2, score: 86.4 }, "digital-transform": { rank: 1, score: 89.2 }, "operational": { rank: 3, score: 84.1 } },
  "Elena Rodriguez": { "supply-chain": { rank: 3, score: 82.8 }, "digital-transform": { rank: 3, score: 85.6 }, "operational": { rank: 2, score: 86.2 } },
  "David Chen": { "supply-chain": { rank: 4, score: 80.4 }, "digital-transform": { rank: 4, score: 83.1 }, "operational": { rank: 4, score: 82.0 } },
  "Sarah Jenkins": { "supply-chain": { rank: 5, score: 78.0 }, "digital-transform": { rank: 5, score: 79.3 }, "operational": { rank: 5, score: 79.8 } },
  "Julian Vane": { "supply-chain": { rank: 6, score: 74.1 }, "digital-transform": { rank: 6, score: 76.2 }, "operational": { rank: 6, score: 77.5 } },
  "Linda Wu": { "supply-chain": { rank: 7, score: 71.6 }, "digital-transform": { rank: 7, score: 73.8 }, "operational": { rank: 7, score: 75.1 } },
  "Thomas More": { "supply-chain": { rank: 8, score: 69.6 }, "digital-transform": { rank: 8, score: 71.4 }, "operational": { rank: 8, score: 72.0 } },
};

// Mock candidate profiles for Tool 2
export interface CandidateProfile {
  id: string;
  refId: string;
  name: string;
  score: number;
  source: "INTERNAL" | "EXTERNAL";
  education: string;
  totalXp: number;
  leadershipXp: number;
  latestRoles: string[];
  expertise: string[];
  industryScope: string;
  crossFunctionalScope: string;
  flags: string[];
  scores: ScenarioWeight;
}

export const candidateProfiles: CandidateProfile[] = [
  {
    id: "CV_001_DE", refId: "AK-7729", name: "Anna Keller", score: 94,
    source: "INTERNAL", education: "MSc Supply Chain Mgmt, TU Munich",
    totalXp: 15, leadershipXp: 8,
    latestRoles: ["VP Logistics, BMW Group", "Sr. Supply Chain Lead, Siemens"],
    expertise: ["Crisis Logistics", "SAP S/4HANA", "Supplier Coordination", "Lean Six Sigma"],
    industryScope: "Automotive, Manufacturing — 12 years",
    crossFunctionalScope: "Procurement ↔ Operations ↔ Risk",
    flags: ["DATE_YEAR_ONLY"],
    scores: { scalability_mindset: 98, hard_skill_match: 91, cultural_alignment: 90, risk_mitigation: 95, adaptability_index: 92 },
  },
  {
    id: "CV_042_US", refId: "MT-3301", name: "Marcus Thorne", score: 89,
    source: "EXTERNAL", education: "MBA, Kellogg School of Management",
    totalXp: 12, leadershipXp: 5,
    latestRoles: ["Director Strategic Sourcing, Deloitte", "Procurement Manager, GE"],
    expertise: ["Strategic Sourcing", "Vendor Management", "Cost Optimization"],
    industryScope: "Consulting, Industrial — 10 years",
    crossFunctionalScope: "Sourcing ↔ Finance ↔ Strategy",
    flags: [],
    scores: { scalability_mindset: 85, hard_skill_match: 92, cultural_alignment: 88, risk_mitigation: 90, adaptability_index: 86 },
  },
  {
    id: "CV_033_DE", refId: "ER-4420", name: "Elena Rodriguez", score: 85,
    source: "INTERNAL", education: "BSc Industrial Engineering, RWTH Aachen",
    totalXp: 10, leadershipXp: 4,
    latestRoles: ["Logistics Team Lead, BMW Group", "Operations Analyst, DHL"],
    expertise: ["Stakeholder Comms", "Change Management", "Process Optimization"],
    industryScope: "Automotive, Logistics — 8 years",
    crossFunctionalScope: "Operations ↔ HR ↔ Digital",
    flags: ["OPEN_ENDED_RANGE"],
    scores: { scalability_mindset: 80, hard_skill_match: 82, cultural_alignment: 92, risk_mitigation: 78, adaptability_index: 95 },
  },
  {
    id: "CV_099_DE", refId: "DC-5518", name: "David Chen", score: 82,
    source: "EXTERNAL", education: "PhD Risk Analytics, ETH Zurich",
    totalXp: 14, leadershipXp: 6,
    latestRoles: ["Head of Risk, Zurich Insurance", "Risk Analyst, McKinsey"],
    expertise: ["Risk Modeling", "Predictive Analytics", "Monte Carlo Simulations"],
    industryScope: "Insurance, Consulting — 11 years",
    crossFunctionalScope: "Risk ↔ Data Science ↔ Strategy",
    flags: [],
    scores: { scalability_mindset: 88, hard_skill_match: 85, cultural_alignment: 80, risk_mitigation: 92, adaptability_index: 82 },
  },
  {
    id: "CV_055_FR", refId: "SJ-6623", name: "Sarah Jenkins", score: 80,
    source: "INTERNAL", education: "MSc Operations Research, MIT",
    totalXp: 9, leadershipXp: 3,
    latestRoles: ["Sr. Inventory Planner, BMW Group", "Supply Analyst, Amazon"],
    expertise: ["Rapid Procurement", "Inventory Optimization", "Demand Forecasting"],
    industryScope: "Automotive, E-commerce — 7 years",
    crossFunctionalScope: "Inventory ↔ Procurement ↔ IT",
    flags: ["DATE_YEAR_ONLY"],
    scores: { scalability_mindset: 82, hard_skill_match: 80, cultural_alignment: 78, risk_mitigation: 76, adaptability_index: 84 },
  },
  {
    id: "CV_078_JP", refId: "JV-7791", name: "Julian Vane", score: 77,
    source: "EXTERNAL", education: "LLM International Trade, LSE",
    totalXp: 11, leadershipXp: 4,
    latestRoles: ["Compliance Director, HSBC", "Regulatory Affairs, WTO"],
    expertise: ["Regulatory Compliance", "Trade Law", "Cross-Border Logistics"],
    industryScope: "Banking, Government — 9 years",
    crossFunctionalScope: "Legal ↔ Compliance ↔ Operations",
    flags: [],
    scores: { scalability_mindset: 72, hard_skill_match: 78, cultural_alignment: 85, risk_mitigation: 80, adaptability_index: 70 },
  },
  {
    id: "CV_119_UK", refId: "LW-8834", name: "Linda Wu", score: 74,
    source: "INTERNAL", education: "BBA, University of Hong Kong",
    totalXp: 8, leadershipXp: 2,
    latestRoles: ["Vendor Relations Manager, BMW Group", "Buyer, Foxconn"],
    expertise: ["Vendor Relations", "Negotiation", "APAC Sourcing"],
    industryScope: "Automotive, Electronics — 6 years",
    crossFunctionalScope: "Procurement ↔ Quality ↔ Logistics",
    flags: ["OPEN_ENDED_RANGE"],
    scores: { scalability_mindset: 70, hard_skill_match: 75, cultural_alignment: 82, risk_mitigation: 68, adaptability_index: 76 },
  },
  {
    id: "CV_012_US", refId: "TM-9902", name: "Thomas More", score: 72,
    source: "EXTERNAL", education: "MSc Logistics, Georgia Tech",
    totalXp: 7, leadershipXp: 2,
    latestRoles: ["Warehouse Ops Lead, FedEx", "Logistics Coordinator, UPS"],
    expertise: ["Inventory Optimization", "Warehouse Automation", "Last-Mile Delivery"],
    industryScope: "Logistics, Freight — 5 years",
    crossFunctionalScope: "Warehouse ↔ IT ↔ Distribution",
    flags: [],
    scores: { scalability_mindset: 68, hard_skill_match: 72, cultural_alignment: 70, risk_mitigation: 65, adaptability_index: 74 },
  },
];
