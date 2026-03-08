import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from "fs";
import { join, dirname } from "path";
import os from "os";

import type { ClaudeSettingsData, HooksScope, HookEvent } from "../shared/types";
import { HOOK_PRESETS } from "../shared/hook-presets";

const COLMENA_MARKER = "COLMENA_SESSION_ID";
const PRESET_MARKER = "colmena-preset:";

function resolveSettingsPath(scope: HooksScope, projectDir?: string): string {
  if (scope === "project" && projectDir) {
    return join(projectDir, ".claude", "settings.json");
  }
  return join(os.homedir(), ".claude", "settings.json");
}

function readSettingsFile(path: string): Record<string, unknown> {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return {};
  }
}

function isColmenaInternal(command: string): boolean {
  return command.includes(COLMENA_MARKER);
}

function extractPresetId(command: string): string | null {
  const match = command.match(/colmena-preset:(\S+)/);
  return match ? match[1] : null;
}

interface RawHookRule {
  matcher?: string;
  hooks?: Array<{ type?: string; command?: string }>;
}

export function loadClaudeSettings(scope: HooksScope, projectDir?: string): ClaudeSettingsData {
  const path = resolveSettingsPath(scope, projectDir);
  const settings = readSettingsFile(path);

  const hooks = (settings.hooks || {}) as Record<string, RawHookRule[]>;
  const enabledPresets: Record<string, boolean> = {};
  const customHooks: Record<
    string,
    Array<{ matcher: string; hooks: Array<{ type: string; command: string }> }>
  > = {};

  for (const preset of HOOK_PRESETS) {
    enabledPresets[preset.id] = false;
  }

  for (const [event, rules] of Object.entries(hooks)) {
    if (!Array.isArray(rules)) continue;
    for (const rule of rules) {
      const commands = rule.hooks || [];
      for (const hook of commands) {
        const cmd = hook.command || "";
        if (isColmenaInternal(cmd)) continue;

        const presetId = extractPresetId(cmd);
        if (presetId) {
          enabledPresets[presetId] = true;
          continue;
        }

        if (!customHooks[event]) customHooks[event] = [];
        customHooks[event].push({
          matcher: rule.matcher || "",
          hooks: commands
            .filter((h) => h.command && !isColmenaInternal(h.command || ""))
            .map((h) => ({ type: h.type || "command", command: h.command || "" })),
        });
      }
    }
  }

  const denyRules = ((settings.permissions as Record<string, unknown>)?.deny || []) as string[];

  return { presets: enabledPresets, denyRules, customHooks };
}

export function saveClaudeSettings(
  data: ClaudeSettingsData,
  scope: HooksScope,
  projectDir?: string,
): void {
  const path = resolveSettingsPath(scope, projectDir);
  const settings = readSettingsFile(path);
  const existingHooks = (settings.hooks || {}) as Record<string, RawHookRule[]>;

  const newHooks: Record<string, RawHookRule[]> = {};

  for (const [event, rules] of Object.entries(existingHooks)) {
    if (!Array.isArray(rules)) continue;
    const internal = rules.filter((rule) =>
      (rule.hooks || []).some((h) => isColmenaInternal(h.command || "")),
    );
    if (internal.length > 0) {
      newHooks[event] = internal;
    }
  }

  for (const preset of HOOK_PRESETS) {
    if (!data.presets[preset.id]) continue;
    if (!newHooks[preset.event]) newHooks[preset.event] = [];
    newHooks[preset.event].push({
      matcher: preset.matcher,
      hooks: [{ type: "command", command: preset.command }],
    });
  }

  for (const [event, rules] of Object.entries(data.customHooks)) {
    if (!newHooks[event]) newHooks[event] = [];
    for (const rule of rules) {
      newHooks[event].push(rule);
    }
  }

  settings.hooks = newHooks;

  if (!settings.permissions) settings.permissions = {};
  (settings.permissions as Record<string, unknown>).deny = data.denyRules;

  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const tmp = `${path}.tmp.${process.pid}`;
  writeFileSync(tmp, JSON.stringify(settings, null, 2), "utf-8");
  renameSync(tmp, path);
}
