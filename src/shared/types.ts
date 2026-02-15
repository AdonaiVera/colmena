export type SessionStatus = "running" | "exited";
export type ActivityState = "idling" | "running" | "finished" | "needs_input";
export type ClaudeMode = "new" | "continue" | "resume";
export type ClaudeModel = "default" | "sonnet" | "opus" | "haiku";

export const CLAUDE_MODES = [
  { value: "new" as const, label: "New session", desc: "Start fresh" },
  {
    value: "continue" as const,
    label: "Continue",
    desc: "Continue last conversation in this folder",
  },
  {
    value: "resume" as const,
    label: "Resume",
    desc: "Pick a previous session to resume",
  },
];

export const CLAUDE_MODELS = [
  { value: "default" as const, label: "Default" },
  { value: "sonnet" as const, label: "Sonnet" },
  { value: "opus" as const, label: "Opus" },
  { value: "haiku" as const, label: "Haiku" },
];

export function buildClaudeCommand(
  mode: ClaudeMode,
  model: ClaudeModel
): string {
  const parts = ["claude"];
  if (mode === "continue") parts.push("--continue");
  if (mode === "resume") parts.push("--resume");
  if (model !== "default") parts.push("--model", model);
  return parts.join(" ");
}

export interface Session {
  id: string;
  name: string;
  workingDir: string;
  command: string;
  mode: ClaudeMode;
  model: ClaudeModel;
  status: SessionStatus;
  activityState: ActivityState;
  gitBranch?: string;
  createdAt: number;
}

export interface PersistedTab {
  id: string;
  name: string;
  workingDir: string;
  command: string;
  mode: ClaudeMode;
  model: ClaudeModel;
}

export interface PtyCreateOptions {
  sessionId: string;
  cols: number;
  rows: number;
  workingDir?: string;
  command?: string;
}

export interface IpcChannels {
  "pty:create": (opts: PtyCreateOptions) => void;
  "pty:write": (sessionId: string, data: string) => void;
  "pty:resize": (sessionId: string, cols: number, rows: number) => void;
  "pty:destroy": (sessionId: string) => void;
  "pty:data": (sessionId: string, data: string) => void;
  "pty:exit": (sessionId: string, exitCode: number) => void;
}
