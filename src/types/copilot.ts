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
}

export interface ActionStep {
  task: string;
  nextStep: string;
  timeEstimate: string;
}

export interface AnalysisResult {
  topPriorities: Priority[];
  secondary: string[];
  ignore: string[];
  actionPlan: ActionStep[];
}

export interface Memory {
  userProfile: { goal: string };
  pastPriorities: string[];
  patterns: string[];
  ignoredTasks: string[];
}
