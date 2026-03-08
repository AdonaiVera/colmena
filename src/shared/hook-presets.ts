import type { HookEvent } from "./types";

export interface HookPreset {
  id: string;
  label: string;
  description: string;
  category: "safety" | "quality" | "notifications";
  event: HookEvent;
  matcher: string;
  command: string;
}

const denyJson = (reason: string): string =>
  `echo '{"hookSpecificOutput":{"permissionDecision":"deny","userMessage":"${reason}"}}'`;

export const HOOK_PRESETS: HookPreset[] = [
  {
    id: "block-main-push",
    label: "Block push to main/master",
    description: "Prevents git push targeting main or master",
    category: "safety",
    event: "PreToolUse",
    matcher: "Bash",
    command: `if echo "$TOOL_INPUT" | grep -qE 'git\\s+push.*\\b(main|master)\\b'; then ${denyJson("Push to main/master is blocked by Colmena")}; fi # colmena-preset:block-main-push`,
  },
  {
    id: "block-force-push",
    label: "Block force push",
    description: "Prevents git push --force",
    category: "safety",
    event: "PreToolUse",
    matcher: "Bash",
    command: `if echo "$TOOL_INPUT" | grep -qE 'git\\s+push\\s+.*--force'; then ${denyJson("Force push is blocked by Colmena")}; fi # colmena-preset:block-force-push`,
  },
  {
    id: "block-dangerous-rm",
    label: "Block rm -rf",
    description: "Prevents destructive rm -rf commands",
    category: "safety",
    event: "PreToolUse",
    matcher: "Bash",
    command: `if echo "$TOOL_INPUT" | grep -qE 'rm\\s+-[^\\s]*r[^\\s]*f|rm\\s+-[^\\s]*f[^\\s]*r'; then ${denyJson("rm -rf is blocked by Colmena")}; fi # colmena-preset:block-dangerous-rm`,
  },
  {
    id: "protect-env-files",
    label: "Protect .env files",
    description: "Blocks edits to .env files",
    category: "safety",
    event: "PreToolUse",
    matcher: "Edit|Write",
    command: `if echo "$TOOL_INPUT" | grep -qE '\\.env'; then ${denyJson(".env file editing is blocked by Colmena")}; fi # colmena-preset:protect-env-files`,
  },
  {
    id: "auto-format",
    label: "Auto-format on write",
    description: "Runs prettier on files after editing",
    category: "quality",
    event: "PostToolUse",
    matcher: "Edit|Write",
    command: `file=$(echo "$TOOL_INPUT" | grep -oE '"file_path":\\s*"[^"]*"' | head -1 | sed 's/.*"file_path":\\s*"//;s/"$//'); [ -n "$file" ] && npx prettier --write "$file" 2>/dev/null || true # colmena-preset:auto-format`,
  },
  {
    id: "lint-on-write",
    label: "Lint after write",
    description: "Runs linter on files after editing",
    category: "quality",
    event: "PostToolUse",
    matcher: "Edit|Write",
    command: `file=$(echo "$TOOL_INPUT" | grep -oE '"file_path":\\s*"[^"]*"' | head -1 | sed 's/.*"file_path":\\s*"//;s/"$//'); [ -n "$file" ] && npx eslint "$file" 2>/dev/null || true # colmena-preset:lint-on-write`,
  },
  {
    id: "code-review-commit",
    label: "Review before commit",
    description: "Reviews staged changes before git commit",
    category: "quality",
    event: "PreToolUse",
    matcher: "Bash",
    command: `if echo "$TOOL_INPUT" | grep -qE 'git\\s+commit'; then echo "Reviewing staged changes..." && git diff --cached --stat 2>/dev/null; fi # colmena-preset:code-review-commit`,
  },
  {
    id: "notify-on-stop",
    label: "Notify when done",
    description: "macOS notification when Claude finishes",
    category: "notifications",
    event: "Stop",
    matcher: "",
    command: `osascript -e 'display notification "Claude has finished" with title "Colmena"' 2>/dev/null || true # colmena-preset:notify-on-stop`,
  },
];

export function getPresetById(id: string): HookPreset | undefined {
  return HOOK_PRESETS.find((p) => p.id === id);
}
