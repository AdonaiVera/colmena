import { spawn, type ChildProcess } from "child_process";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import os from "os";
import type { BrowserWindow } from "electron";
import crypto from "crypto";

import { getLoginShellPath } from "./pty-manager";
import type { DiscoveredComponent } from "../shared/eval-types";

let activeProcesses: ChildProcess[] = [];

function readJsonSafe(filePath: string): Record<string, unknown> | null {
  try {
    if (!existsSync(filePath)) return null;
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function discoverHooks(workingDir: string): DiscoveredComponent[] {
  const components: DiscoveredComponent[] = [];
  const settingsPaths = [
    join(os.homedir(), ".claude", "settings.json"),
    join(workingDir, ".claude", "settings.json"),
  ];

  for (const settingsPath of settingsPaths) {
    const settings = readJsonSafe(settingsPath);
    if (!settings?.hooks) continue;
    const isLocal = settingsPath.startsWith(workingDir);
    const hooks = settings.hooks as Record<string, unknown[]>;
    for (const [hookName, hookConfigs] of Object.entries(hooks)) {
      if (!Array.isArray(hookConfigs)) continue;
      for (const config of hookConfigs) {
        const c = config as Record<string, unknown>;
        components.push({
          id: crypto.randomUUID(),
          type: "hook",
          name: `Hook: ${hookName}${isLocal ? " (local)" : ""}`,
          description: typeof c.command === "string" ? c.command : JSON.stringify(c),
          triggers: [hookName],
          selected: true,
        });
      }
    }
  }
  return components;
}

function discoverSlashCommands(workingDir: string): DiscoveredComponent[] {
  const components: DiscoveredComponent[] = [];
  const dirs = [
    join(workingDir, ".claude", "commands"),
    join(os.homedir(), ".claude", "commands"),
  ];

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    try {
      const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
      for (const file of files) {
        const name = file.replace(/\.md$/, "");
        const content = readFileSync(join(dir, file), "utf-8").slice(0, 200);
        components.push({
          id: crypto.randomUUID(),
          type: "slash_command",
          name: `/${name}`,
          description: content.split("\n")[0] || name,
          triggers: [`/${name}`],
          selected: true,
        });
      }
    } catch {
      continue;
    }
  }
  return components;
}

function spawnClaude(workingDir: string, prompt: string): Promise<string> {
  const env = { ...process.env, PATH: getLoginShellPath() };
  delete env.CLAUDECODE;
  return new Promise((resolve) => {
    const child = spawn("claude", ["-p", "--output-format", "text"], {
      env,
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
      cwd: workingDir,
    });
    activeProcesses.push(child);
    let output = "";
    child.stdout?.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    child.stderr?.on("data", () => {});
    child.on("close", () => { activeProcesses = activeProcesses.filter((p) => p !== child); resolve(output); });
    child.on("error", () => { activeProcesses = activeProcesses.filter((p) => p !== child); resolve(""); });
    child.stdin?.write(prompt);
    child.stdin?.end();
  });
}

function parseComponentsFromJson(
  raw: string,
  fallbackType: "mcp_server" | "skill",
): DiscoveredComponent[] {
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    const items = JSON.parse(jsonMatch[0]) as Array<{
      name: string;
      type?: string;
      description: string;
      triggers?: string[];
    }>;
    return items.map((item) => ({
      id: crypto.randomUUID(),
      type: (item.type as DiscoveredComponent["type"]) || fallbackType,
      name: item.name,
      description: item.description || "",
      triggers: item.triggers || [item.name],
      selected: true,
    }));
  } catch {
    return [];
  }
}

async function discoverMcpServers(workingDir: string): Promise<DiscoveredComponent[]> {
  const prompt =
    `List ALL MCP servers you have access to right now. ` +
    `For each one, provide the server name, a short description, and the COMPLETE list of every tool it provides.\n\n` +
    `IMPORTANT: The "triggers" field must contain EVERY tool from the server using the exact ` +
    `"mcp__serverName__toolName" format (e.g. "mcp__plugin_context7_context7__query-docs"). ` +
    `Do NOT omit any tools — list all of them so we can fully block/unblock the server during evaluation.\n\n` +
    `Return ONLY a JSON array like: [{"name":"server-name","description":"what it does","triggers":["mcp__server__tool1","mcp__server__tool2"]}]\n` +
    `If there are no MCP servers, return an empty array [].\n` +
    `Return ONLY valid JSON, no other text.`;

  const output = await spawnClaude(workingDir, prompt);
  return parseComponentsFromJson(output, "mcp_server");
}

async function discoverSkills(workingDir: string): Promise<DiscoveredComponent[]> {
  const prompt =
    `List ALL skills (slash commands provided by MCP servers or plugins) you have access to right now. ` +
    `Do NOT include built-in commands like /help, /clear, /compact, /cost, /doctor, /init, /login, /logout, /memory, /model, /permissions, /review, /status, /terminal, /vim. ` +
    `Only list custom skills from plugins or MCP servers.\n\n` +
    `IMPORTANT: For each skill, also identify the underlying MCP tool(s) that implement it. ` +
    `The tool names follow the pattern "mcp__serverName__toolName" (e.g. "mcp__plugin_fiftyone__import_dataset").\n\n` +
    `Return ONLY a JSON array like: [{"name":"/skill-name","type":"skill","description":"what it does","triggers":["mcp__server__tool1","mcp__server__tool2"]}]\n` +
    `The "triggers" field MUST contain the actual mcp__ tool identifiers, NOT the /skill-name.\n` +
    `If there are no custom skills, return an empty array [].\n` +
    `Return ONLY valid JSON, no other text.`;

  const output = await spawnClaude(workingDir, prompt);
  return parseComponentsFromJson(output, "skill");
}

export async function runAnalysis(
  window: BrowserWindow,
  workingDir: string,
): Promise<{ components: DiscoveredComponent[] }> {
  const dir = workingDir || os.homedir();

  const hooks = discoverHooks(dir);
  const slashCommands = discoverSlashCommands(dir);

  if (!window.isDestroyed()) {
    window.webContents.send("eval:analysis:data", `Found ${hooks.length} hooks, ${slashCommands.length} commands. Querying Claude for MCP servers and skills...\n`);
  }

  const [mcpServers, skills] = await Promise.all([
    discoverMcpServers(dir),
    discoverSkills(dir),
  ]);

  if (!window.isDestroyed()) {
    window.webContents.send("eval:analysis:data", `Found ${mcpServers.length} MCP servers, ${skills.length} skills.\n`);
  }

  const allComponents = [...hooks, ...mcpServers, ...skills, ...slashCommands];
  return { components: allComponents };
}

export function abortAnalysis(): void {
  for (const p of activeProcesses) { try { p.kill(); } catch {} }
  activeProcesses = [];
}
