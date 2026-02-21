export type AppMode = "launcher" | "terminal" | "evals";
export type EvalStepId = "analysis" | "generation" | "execution" | "report";
export type EvalStepStatus = "pending" | "running" | "completed" | "error";
export type ScenarioType = "direct" | "paraphrased" | "edge_case" | "negative";

export interface DiscoveredComponent {
  id: string;
  type: "hook" | "mcp_server" | "slash_command" | "skill" | "tool";
  name: string;
  description: string;
  triggers: string[];
  selected: boolean;
}

export interface EvalScenario {
  id: string;
  componentId: string;
  type: ScenarioType;
  prompt: string;
  expectedBehavior: string;
  enabled: boolean;
  componentName: string;
  componentToolNames: string[];
}

export interface ToolInvocation {
  toolName: string;
  timestamp: number;
  input: string;
  output: string;
  success: boolean;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheRead: number;
  cacheWrite: number;
}

export type RunVariant = "with_tools" | "without_tools";
export type RunStatus = "queued" | "running" | "completed" | "error";
export type ExecutionMode = "sequential" | "parallel";

export interface ExecutionRun {
  id: string;
  scenarioId: string;
  variant: RunVariant;
  sessionId: string;
  status: RunStatus;
  transcript: string;
  toolInvocations: ToolInvocation[];
  tokenUsage: TokenUsage;
  costUsd: number;
  duration: number;
}

export interface ScenarioResult {
  scenarioId: string;
  withToolsScore: number;
  withoutToolsScore: number;
  toolLift: number;
  correctToolUsed: boolean;
  taskCompleted: boolean;
}

export interface ComponentMetrics {
  componentId: string;
  triggerRate: number;
  accuracy: number;
  avgQuality: number;
  falsePositives: number;
  falseNegatives: number;
  scenarioResults: ScenarioResult[];
}

export interface EvalReport {
  overallScore: number;
  triggerRate: number;
  accuracy: number;
  avgQuality: number;
  toolLiftScore: number;
  totalCost: number;
  componentMetrics: ComponentMetrics[];
  generatedAt: number;
}

export interface EvalStep {
  id: EvalStepId;
  status: EvalStepStatus;
}

export interface Experiment {
  id: string;
  name: string;
  workingDir: string;
  createdAt: number;
  currentStep: EvalStepId;
  steps: EvalStep[];
  components: DiscoveredComponent[];
  scenarios: EvalScenario[];
  runs: ExecutionRun[];
  report: EvalReport | null;
}

export interface LiveRun {
  runId: string;
  scenarioId: string;
  variant: string;
  status: string;
  transcript: string;
}

export const STEP_ORDER: EvalStepId[] = ["analysis", "generation", "execution", "report"];

export const STEP_LABELS: Record<EvalStepId, string> = {
  analysis: "Analysis",
  generation: "Generation",
  execution: "Execution",
  report: "Report",
};

export function statusColor(status: string): string {
  switch (status) {
    case "completed": return "var(--success)";
    case "running": return "var(--accent)";
    case "error": return "var(--error)";
    default: return "var(--border)";
  }
}

export function createDefaultSteps(): EvalStep[] {
  return [
    { id: "analysis", status: "pending" },
    { id: "generation", status: "pending" },
    { id: "execution", status: "pending" },
    { id: "report", status: "pending" },
  ];
}

export function createExperiment(id: string, name: string, workingDir: string): Experiment {
  return {
    id,
    name,
    workingDir,
    createdAt: Date.now(),
    currentStep: "analysis",
    steps: createDefaultSteps(),
    components: [],
    scenarios: [],
    runs: [],
    report: null,
  };
}
