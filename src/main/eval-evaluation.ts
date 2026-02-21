import { spawn, type ChildProcess } from "child_process";
import os from "os";
import type { BrowserWindow } from "electron";

import { getLoginShellPath } from "./pty-manager";
import { saveReport, loadTranscript } from "./eval-store";
import type {
  DiscoveredComponent,
  EvalScenario,
  ExecutionRun,
  EvalReport,
  ComponentMetrics,
  ScenarioResult,
} from "../shared/eval-types";

let activeProcess: ChildProcess | null = null;

function programmaticPass(
  scenarios: EvalScenario[],
  runs: ExecutionRun[],
  components: DiscoveredComponent[],
): ComponentMetrics[] {
  const metricsMap = new Map<string, ComponentMetrics>();

  const evaluatedCompIds = new Set(scenarios.filter((s) => s.enabled).map((s) => s.componentId));
  for (const comp of components) {
    if (!evaluatedCompIds.has(comp.id)) continue;
    metricsMap.set(comp.id, {
      componentId: comp.id, triggerRate: 0, accuracy: 0, avgQuality: 0,
      falsePositives: 0, falseNegatives: 0, scenarioResults: [],
    });
  }

  for (const scenario of scenarios) {
    if (!scenario.enabled) continue;
    const withRun = runs.find((r) => r.scenarioId === scenario.id && r.variant === "with_tools");
    const withTools = withRun?.toolInvocations.length || 0;

    const result: ScenarioResult = {
      scenarioId: scenario.id, withToolsScore: 0, withoutToolsScore: 0, toolLift: 0,
      correctToolUsed: withTools > 0 && scenario.type !== "negative",
      taskCompleted: withRun?.status === "completed",
    };

    const metrics = metricsMap.get(scenario.componentId);
    if (metrics) {
      if (scenario.type === "negative" && withTools > 0) metrics.falsePositives++;
      if (scenario.type !== "negative" && withTools === 0) metrics.falseNegatives++;
      if (withTools > 0) metrics.triggerRate++;
      metrics.scenarioResults.push(result);
    }
  }

  for (const metrics of metricsMap.values()) {
    const total = metrics.scenarioResults.length;
    if (total > 0) {
      metrics.triggerRate = metrics.triggerRate / total;
      const correct = total - metrics.falsePositives - metrics.falseNegatives;
      metrics.accuracy = correct / total;
    }
  }

  return Array.from(metricsMap.values());
}

function buildJudgePrompt(
  scenarios: EvalScenario[],
  runs: ExecutionRun[],
  experimentId: string,
): string {
  const getTranscript = (run: ExecutionRun | undefined) =>
    run ? (loadTranscript(experimentId, run.id) || run.transcript).slice(0, 2000) : "No run";

  const pairs = scenarios.filter((s) => s.enabled).map((s) => {
    const w = runs.find((r) => r.scenarioId === s.id && r.variant === "with_tools");
    const wo = runs.find((r) => r.scenarioId === s.id && r.variant === "without_tools");
    return `## Scenario: ${s.prompt}\nType: ${s.type}\nExpected: ${s.expectedBehavior}\n\n### With Tools:\n${getTranscript(w)}\n\n### Without Tools:\n${getTranscript(wo)}`;
  });

  return `You are an evaluator scoring Claude Code runs. For each scenario pair, score both runs 1-10 on correctness, quality, and task completion.\n\n${pairs.join("\n---\n")}\n\nReturn ONLY a JSON array: [{"prompt":"...","withToolsScore":N,"withoutToolsScore":N,"quality":N}]. No other text.`;
}

function applyScores(
  scenarios: EvalScenario[],
  metrics: ComponentMetrics[],
  scores: Array<{ withToolsScore: number; withoutToolsScore: number }>,
): void {
  const enabled = scenarios.filter((s) => s.enabled);
  for (let i = 0; i < scores.length && i < enabled.length; i++) {
    const sc = scores[i];
    for (const m of metrics) {
      const sr = m.scenarioResults.find((r) => r.scenarioId === enabled[i].id);
      if (sr) {
        sr.withToolsScore = sc.withToolsScore || 0;
        sr.withoutToolsScore = sc.withoutToolsScore || 0;
        sr.toolLift = (sc.withToolsScore || 0) - (sc.withoutToolsScore || 0);
      }
    }
  }
  for (const m of metrics) {
    const r = m.scenarioResults;
    if (r.length > 0) m.avgQuality = r.reduce((s, x) => s + x.withToolsScore, 0) / r.length;
  }
}

async function llmJudgePass(
  window: BrowserWindow,
  scenarios: EvalScenario[],
  runs: ExecutionRun[],
  experimentId: string,
  metrics: ComponentMetrics[],
): Promise<ComponentMetrics[]> {
  const prompt = buildJudgePrompt(scenarios, runs, experimentId);
  const env = { ...process.env, PATH: getLoginShellPath() };
  delete env.CLAUDECODE;

  return new Promise((resolve) => {
    const child = spawn("claude", ["-p", "--output-format", "text"], {
      env,
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });
    activeProcess = child;
    let output = "";

    child.stdout?.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      if (!window.isDestroyed()) window.webContents.send("eval:evaluation:data", chunk.toString());
    });
    child.stderr?.on("data", () => {});

    child.on("close", () => {
      activeProcess = null;
      try {
        const m = output.match(/\[[\s\S]*\]/);
        if (m) applyScores(scenarios, metrics, JSON.parse(m[0]));
      } catch {}
      resolve(metrics);
    });

    child.on("error", () => {
      activeProcess = null;
      resolve(metrics);
    });

    child.stdin?.write(prompt);
    child.stdin?.end();
  });
}

export async function runEvaluation(
  window: BrowserWindow,
  experimentId: string,
  scenarios: EvalScenario[],
  runs: ExecutionRun[],
  components: DiscoveredComponent[],
): Promise<{ report: EvalReport | null }> {
  abortEvaluation();

  if (runs.length === 0) return { report: null };

  let metrics = programmaticPass(scenarios, runs, components);
  metrics = await llmJudgePass(window, scenarios, runs, experimentId, metrics);

  const allResults = metrics.flatMap((m) => m.scenarioResults);
  const n = metrics.length || 1;
  const avg = (fn: (m: ComponentMetrics) => number) => metrics.reduce((s, m) => s + fn(m), 0) / n;
  const avgLift = allResults.length > 0
    ? allResults.reduce((s, r) => s + r.toolLift, 0) / allResults.length : 0;

  const report: EvalReport = {
    overallScore: avg((m) => m.avgQuality),
    triggerRate: avg((m) => m.triggerRate),
    accuracy: avg((m) => m.accuracy),
    avgQuality: avg((m) => m.avgQuality),
    toolLiftScore: avgLift,
    totalCost: runs.reduce((s, r) => s + (r.costUsd || 0), 0),
    componentMetrics: metrics,
    generatedAt: Date.now(),
  };

  saveReport(experimentId, report);
  return { report };
}

export function abortEvaluation(): void {
  if (activeProcess) {
    activeProcess.kill();
    activeProcess = null;
  }
}
