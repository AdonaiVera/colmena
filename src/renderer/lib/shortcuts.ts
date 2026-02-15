export interface ShortcutDef {
  key: string;
  meta?: boolean;
  shift?: boolean;
  label: string;
  group: "tabs" | "terminal" | "app";
}

export interface ClaudeCommandDef {
  command: string;
  desc: string;
  group: "context" | "session" | "navigation" | "tools" | "input";
}

const isMac = navigator.platform.startsWith("Mac");
export const MOD_KEY = isMac ? "Cmd" : "Ctrl";
export const OPT_KEY = isMac ? "Option" : "Alt";

export const SHORTCUTS: ShortcutDef[] = [
  { key: "T", meta: true, label: "New tab", group: "tabs" },
  { key: "W", meta: true, label: "Close tab", group: "tabs" },
  { key: "[", meta: true, shift: true, label: "Previous tab", group: "tabs" },
  { key: "]", meta: true, shift: true, label: "Next tab", group: "tabs" },
  { key: "1-9", meta: true, label: "Switch to tab N", group: "tabs" },
  { key: "F", meta: true, label: "Find in terminal", group: "terminal" },
  { key: "?", meta: true, label: "Toggle cheat sheet", group: "app" },
];

export const CLAUDE_COMMANDS: ClaudeCommandDef[] = [
  { command: "/compact", desc: "Compress context", group: "context" },
  { command: "/clear", desc: "Clear conversation", group: "context" },
  { command: "/context", desc: "View context usage", group: "context" },
  { command: "/cost", desc: "Token usage stats", group: "context" },
  { command: "/usage", desc: "Plan limits & rate limits", group: "context" },

  { command: "/resume", desc: "Resume a session", group: "session" },
  { command: "/rename", desc: "Rename session", group: "session" },
  { command: "/rewind", desc: "Undo last turn", group: "session" },
  { command: "/export", desc: "Export conversation", group: "session" },
  { command: "/status", desc: "Version & account info", group: "session" },
  { command: "/stats", desc: "Usage history & streaks", group: "session" },

  { command: "/memory", desc: "Edit CLAUDE.md", group: "tools" },
  { command: "/model", desc: "Switch model", group: "tools" },
  { command: "/plan", desc: "Enter plan mode", group: "tools" },
  { command: "/permissions", desc: "Manage permissions", group: "tools" },
  { command: "/mcp", desc: "Manage MCP servers", group: "tools" },
  { command: "/init", desc: "Init project CLAUDE.md", group: "tools" },
  { command: "/config", desc: "Open settings", group: "tools" },
  { command: "/theme", desc: "Change color theme", group: "tools" },

  { command: "Ctrl+C", desc: "Cancel / interrupt", group: "input" },
  { command: "Esc Esc", desc: "Rewind or summarize", group: "input" },
  { command: "Shift+Tab", desc: "Toggle permission mode", group: "input" },
  { command: `${OPT_KEY}+P`, desc: "Switch model", group: "input" },
  { command: `${OPT_KEY}+T`, desc: "Toggle thinking", group: "input" },
  { command: "! cmd", desc: "Run bash directly", group: "input" },
  { command: "@ file", desc: "File autocomplete", group: "input" },
];

export const CLAUDE_COMMAND_GROUPS = [
  { key: "context" as const, label: "Context & Usage" },
  { key: "session" as const, label: "Session" },
  { key: "tools" as const, label: "Tools & Config" },
  { key: "input" as const, label: "Input Shortcuts" },
];

export function formatShortcut(def: ShortcutDef): string {
  const parts: string[] = [];
  if (def.meta) parts.push(MOD_KEY);
  if (def.shift) parts.push("Shift");
  parts.push(def.key);
  return parts.join("+");
}
