export type Impact = "High" | "Medium" | "Low";
export type Urgency = "High" | "Medium" | "Low";
export type Effort = "High" | "Medium" | "Low";

export type Category = "Frontend" | "Backend" | "Payment" | "DevOps" | "Mobile" | "Other";

export interface Priority {
  task: string;
  impact: Impact;
  urgency: Urgency;
  effort: Effort;
  category?: Category;
  reasoning: string;
  memoryInfluence: string;
  assignee?: string;
  dueDate?: string;
  source?: "Jira" | "Slack" | "Email" | "Other";
  status?: "Open" | "In Progress" | "Closed";
  predictionId?: string;
  confidence?: number;
}

export interface ActionStep {
  task: string;
  nextStep: string;
  timeEstimate: string;
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  topPriorities: Priority[];
  secondary: string[];
  ignore: string[];
  actionPlan: ActionStep[];
}

export type InboxStatus = "pending" | "processed";

export interface InboxItem {
  id: string;
  text: string;
  timestamp: string;
  status: InboxStatus;
  processedAt?: string;
}

export interface HistorySession {
  id: string;
  inputSummary: string;
  topPriority: string;
  result: AnalysisResult;
  timestamp: string;
}

export interface Memory {
  userProfile: { goal: string };
  pastPriorities: string[];
  patterns: string[];
  ignoredTasks: string[];
  useMemoryToggle?: boolean;
  verdicts?: Verdict[];
  calibration?: CalibrationStats;
}

export type VerdictType =
  | "right"
  | "wrong_urgency"
  | "wrong_size"
  | "wrong_impact"
  | "memory_miss"
  | "noise_call";

export interface Verdict {
  predictionId: string;
  sessionId: string;
  task: string;
  verdict: VerdictType;
  delta?: string;
  evidence: string[];
  reconciledAt: string;
  modelNote: string;
}

export interface CalibrationStats {
  [bucket: string]: { hits: number; misses: number };
}

