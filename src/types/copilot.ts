export type Impact = "High" | "Medium" | "Low";
export type Urgency = "High" | "Medium" | "Low";
export type Effort = "High" | "Medium" | "Low";

export interface Priority {
  task: string;
  impact: Impact;
  urgency: Urgency;
  effort: Effort;
  reasoning: string;
  memoryInfluence: string;
  assignee?: string;
  dueDate?: string;
  source?: "Jira" | "Slack" | "Email" | "Other";
  status?: "Open" | "In Progress" | "Closed";
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

export interface InboxItem {
  id: string;
  text: string;
  timestamp: string;
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
}

