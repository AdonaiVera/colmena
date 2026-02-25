import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import os from "os";

const SETTINGS_PATH = join(os.homedir(), ".claude", "settings.json");
const COLMENA_MARKER = "COLMENA_SESSION_ID";

interface HookEntry {
  event: string;
  matcher: string;
  status: string;
  captureSessionId?: boolean;
}

const HOOK_ENTRIES: HookEntry[] = [
  { event: "UserPromptSubmit", matcher: "", status: "UserPromptSubmit", captureSessionId: true },
  { event: "Stop", matcher: "", status: "Stop" },
  { event: "PreToolUse", matcher: "", status: "PreToolUse" },
  { event: "PreToolUse", matcher: "AskUserQuestion", status: "AskUserQuestion" },
  { event: "PermissionRequest", matcher: "", status: "PermissionRequest" },
  { event: "Notification", matcher: "permission_prompt", status: "NeedsInput" },
  { event: "Notification", matcher: "elicitation_dialog", status: "NeedsInput" },
];

function hookCommandWithStdin(eventName: string): string {
  const nodeExpr = `try{JSON.parse(require('fs').readFileSync(0,'utf8')).session_id||''}catch{''}`;
  return [
    '[ -n "$COLMENA_SESSION_ID" ]',
    "&&",
    'd="$HOME/.colmena/sessions/$COLMENA_SESSION_ID"',
    '&& [ -d "$d" ]',
    "&&",
    "{",
    "p=$(cat);",
    'f="$d/status"; t="$f.tmp.$$";',
    `echo "${eventName}" > "$t" && mv "$t" "$f";`,
    `sid=$(printf '%s' "$p" | node -pe "${nodeExpr}" 2>/dev/null);`,
    '[ -n "$sid" ] && { sf="$d/claude-session-id"; st="$sf.tmp.$$"; printf \'%s\' "$sid" > "$st" && mv "$st" "$sf"; };',
    "}",
    "|| true",
  ].join(" ");
}

function hookCommand(eventName: string): string {
  const parts = [
    '[ -n "$COLMENA_SESSION_ID" ]',
    "&&",
    'd="$HOME/.colmena/sessions/$COLMENA_SESSION_ID"',
    '&& [ -d "$d" ]',
    "&&",
    "{",
    'f="$d/status";',
    't="$f.tmp.$$";',
    `echo "${eventName}" > "$t"`,
    '&& mv "$t" "$f";',
    "}",
    "|| true",
  ];
  return parts.join(" ");
}

export function ensureHooks(): void {
  const claudeDir = join(os.homedir(), ".claude");
  if (!existsSync(claudeDir)) {
    mkdirSync(claudeDir, { recursive: true });
  }

  let settings: Record<string, unknown> = {};
  if (existsSync(SETTINGS_PATH)) {
    try {
      settings = JSON.parse(readFileSync(SETTINGS_PATH, "utf-8"));
    } catch {
      settings = {};
    }
  }

  const hooks = (settings.hooks || {}) as Record<string, unknown[]>;

  const grouped = new Map<string, HookEntry[]>();
  for (const entry of HOOK_ENTRIES) {
    const list = grouped.get(entry.event) || [];
    list.push(entry);
    grouped.set(entry.event, list);
  }

  let changed = false;
  for (const [event, entries] of grouped) {
    if (!hooks[event]) {
      hooks[event] = [];
    }
    const existing = hooks[event] as Record<string, unknown>[];
    const filtered = existing.filter((e) => !JSON.stringify(e).includes(COLMENA_MARKER));
    for (const entry of entries) {
      filtered.push({
        matcher: entry.matcher,
        hooks: [
          {
            type: "command",
            command: entry.captureSessionId
              ? hookCommandWithStdin(entry.status)
              : hookCommand(entry.status),
          },
        ],
      });
    }
    if (JSON.stringify(filtered) !== JSON.stringify(existing)) {
      hooks[event] = filtered;
      changed = true;
    }
  }

  if (changed) {
    settings.hooks = hooks;
    writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf-8");
  }
}
