import { spawn, type ChildProcess } from "child_process";
import os from "os";
import type { BrowserWindow } from "electron";
import crypto from "crypto";

import { getLoginShellPath } from "./pty-manager";
import type { DiscoveredComponent, EvalScenario, ScenarioType } from "../shared/eval-types";

let activeProcess: ChildProcess | null = null;

function buildPrompt(components: DiscoveredComponent[], workingDir: string): string {
  const compList = components
    .map((c) => `- [${c.type}] "${c.name}": ${c.description} (triggers: ${c.triggers.join(", ")})`)
    .join("\n");

  return (
    `You are generating test scenarios for evaluating Claude Code tool usage.\n` +
    `Workspace: ${workingDir}\n\n` +
    `Components to test:\n${compList}\n\n` +
    `For EACH component, generate exactly 4 scenarios with these types:\n` +
    `1. "direct" - A straightforward task that SHOULD trigger the component\n` +
    `2. "paraphrased" - Same intent but phrased very differently\n` +
    `3. "edge_case" - An unusual or boundary scenario\n` +
    `4. "negative" - A prompt that should NOT trigger the component\n\n` +
    `CRITICAL RULES:\n` +
    `- Write prompts as NATURAL LANGUAGE only. A real user describing their task.\n` +
    `- NEVER use slash commands (e.g. /skill-name) in prompts.\n` +
    `- NEVER mention tool names, skill names, or component names in prompts.\n` +
    `- The prompt should describe WHAT the user wants done, not HOW to do it.\n` +
    `- The eval measures whether Claude discovers and uses the right tool on its own.\n\n` +
    `Good: "I have a COCO dataset with images and labels, can you load it for analysis?"\n` +
    `Bad: "/fiftyone-dataset-import load my COCO dataset"\n` +
    `Bad: "Use the fiftyone import tool to load my dataset"\n\n` +
    `Return ONLY a valid JSON array of objects with these fields:\n` +
    `- "componentId": the component name (matching exactly from the list above)\n` +
    `- "type": one of "direct", "paraphrased", "edge_case", "negative"\n` +
    `- "prompt": the natural language test prompt\n` +
    `- "expectedBehavior": what should happen (tool triggered or not, expected outcome)\n\n` +
    `Return ONLY the JSON array, no markdown fences, no other text.`
  );
}

function parseScenarios(
  output: string,
  components: DiscoveredComponent[],
): EvalScenario[] {
  const jsonMatch = output.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const raw = JSON.parse(jsonMatch[0]) as Array<{
      componentId: string;
      type: string;
      prompt: string;
      expectedBehavior: string;
    }>;

    return raw
      .filter((r) => r.prompt && r.type)
      .map((r) => {
        const comp = components.find((c) => c.name === r.componentId);
        return {
          id: crypto.randomUUID(),
          componentId: comp?.id || r.componentId,
          type: (["direct", "paraphrased", "edge_case", "negative"].includes(r.type)
            ? r.type
            : "direct") as ScenarioType,
          prompt: r.prompt,
          expectedBehavior: r.expectedBehavior || "",
          enabled: true,
          componentName: comp?.name || r.componentId,
          componentToolNames: comp?.triggers || [],
        };
      });
  } catch {
    return [];
  }
}

export async function runGeneration(
  window: BrowserWindow,
  components: DiscoveredComponent[],
  workingDir: string,
): Promise<{ scenarios: EvalScenario[] }> {
  abortGeneration();

  const selected = components.filter((c) => c.selected);
  if (selected.length === 0) return { scenarios: [] };

  const prompt = buildPrompt(selected, workingDir);
  const shellPath = getLoginShellPath();
  const env = { ...process.env, PATH: shellPath };
  delete env.CLAUDECODE;

  return new Promise((resolve) => {
    const child = spawn("claude", ["-p", "--output-format", "text"], {
      env,
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
      cwd: workingDir || os.homedir(),
    });

    activeProcess = child;
    let output = "";

    child.stdout?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      output += text;
      if (!window.isDestroyed()) {
        window.webContents.send("eval:generation:data", text);
      }
    });

    child.stderr?.on("data", () => {});

    child.on("close", () => {
      activeProcess = null;
      const scenarios = parseScenarios(output, selected);
      resolve({ scenarios });
    });

    child.on("error", () => {
      activeProcess = null;
      resolve({ scenarios: [] });
    });

    child.stdin?.write(prompt);
    child.stdin?.end();
  });
}

export function abortGeneration(): void {
  if (activeProcess) {
    activeProcess.kill();
    activeProcess = null;
  }
}
