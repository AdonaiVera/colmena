import type { Experiment, ExecutionRun, ComponentMetrics, DiscoveredComponent } from "../../../shared/eval-types";

function getCompName(id: string, components: DiscoveredComponent[]) {
  return components.find((c) => c.id === id)?.name || id;
}

function runStats(runs: ExecutionRun[]) {
  let input = 0, output = 0, cost = 0, duration = 0;
  for (const r of runs) {
    input += r.tokenUsage.inputTokens;
    output += r.tokenUsage.outputTokens;
    cost += r.costUsd || 0;
    duration += r.duration;
  }
  return { input, output, total: input + output, cost, duration };
}

export function avgLift(m: ComponentMetrics): number {
  if (m.scenarioResults.length === 0) return 0;
  return m.scenarioResults.reduce((s, r) => s + r.toolLift, 0) / m.scenarioResults.length;
}

export function buildMarkdown(experiment: Experiment): string {
  const r = experiment.report;
  if (!r) return "";

  const enabledRuns = experiment.runs.filter((run) =>
    experiment.scenarios.some((s) => s.id === run.scenarioId && s.enabled),
  );
  const wRuns = enabledRuns.filter((run) => run.variant === "with_tools");
  const woRuns = enabledRuns.filter((run) => run.variant === "without_tools");
  const wStats = runStats(wRuns);
  const woStats = runStats(woRuns);

  const lines: string[] = [
    `# Pollen Test Report: ${experiment.name}`,
    `> Generated: ${new Date(r.generatedAt).toLocaleString()}`,
    `> Working Dir: ${experiment.workingDir}`,
    "",
    "## Summary",
    "",
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Overall Score | ${r.overallScore.toFixed(1)} / 10 |`,
    `| Tool Lift | ${r.toolLiftScore > 0 ? "+" : ""}${r.toolLiftScore.toFixed(1)} |`,
    `| Trigger Rate | ${(r.triggerRate * 100).toFixed(0)}% |`,
    `| Accuracy | ${(r.accuracy * 100).toFixed(0)}% |`,
    "",
    "## Resource Usage",
    "",
    "| Metric | With Tools | Without Tools |",
    "|--------|-----------|---------------|",
    `| Total Tokens | ${wStats.total.toLocaleString()} | ${woStats.total.toLocaleString()} |`,
    `| Input Tokens | ${wStats.input.toLocaleString()} | ${woStats.input.toLocaleString()} |`,
    `| Output Tokens | ${wStats.output.toLocaleString()} | ${woStats.output.toLocaleString()} |`,
    `| Cost | $${wStats.cost.toFixed(4)} | $${woStats.cost.toFixed(4)} |`,
    `| Avg Duration | ${(wRuns.length > 0 ? wStats.duration / wRuns.length / 1000 : 0).toFixed(1)}s | ${(woRuns.length > 0 ? woStats.duration / woRuns.length / 1000 : 0).toFixed(1)}s |`,
    "",
    "## Components",
    "",
    "| Component | Trigger Rate | Accuracy | Quality | Tool Lift | Scenarios |",
    "|-----------|-------------|----------|---------|-----------|-----------|",
  ];

  for (const m of r.componentMetrics) {
    const name = getCompName(m.componentId, experiment.components);
    const lift = avgLift(m);
    lines.push(
      `| ${name} | ${(m.triggerRate * 100).toFixed(0)}% | ${(m.accuracy * 100).toFixed(0)}% | ${m.avgQuality.toFixed(1)} | ${lift > 0 ? "+" : ""}${lift.toFixed(1)} | ${m.scenarioResults.length} |`,
    );
  }

  lines.push("");
  lines.push("## Scenario Details");
  lines.push("");

  for (const m of r.componentMetrics) {
    const name = getCompName(m.componentId, experiment.components);
    lines.push(`### ${name}`);
    lines.push("");
    for (const sr of m.scenarioResults) {
      const scenario = experiment.scenarios.find((s) => s.id === sr.scenarioId);
      if (!scenario) continue;
      lines.push(`- **${scenario.type}**: "${scenario.prompt}"`);
      lines.push(`  - With tools: ${sr.withToolsScore}/10 | Without: ${sr.withoutToolsScore}/10 | Lift: ${sr.toolLift > 0 ? "+" : ""}${sr.toolLift.toFixed(1)}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function buildJson(experiment: Experiment): string {
  const r = experiment.report;
  if (!r) return "{}";

  const enabledRuns = experiment.runs.filter((run) =>
    experiment.scenarios.some((s) => s.id === run.scenarioId && s.enabled),
  );
  const wStats = runStats(enabledRuns.filter((run) => run.variant === "with_tools"));
  const woStats = runStats(enabledRuns.filter((run) => run.variant === "without_tools"));

  return JSON.stringify({
    name: experiment.name,
    workingDir: experiment.workingDir,
    generatedAt: new Date(r.generatedAt).toISOString(),
    summary: {
      overallScore: r.overallScore,
      toolLift: r.toolLiftScore,
      triggerRate: r.triggerRate,
      accuracy: r.accuracy,
    },
    resourceUsage: {
      withTools: { totalTokens: wStats.total, inputTokens: wStats.input, outputTokens: wStats.output, costUsd: wStats.cost },
      withoutTools: { totalTokens: woStats.total, inputTokens: woStats.input, outputTokens: woStats.output, costUsd: woStats.cost },
    },
    components: r.componentMetrics.map((m) => ({
      name: getCompName(m.componentId, experiment.components),
      triggerRate: m.triggerRate,
      accuracy: m.accuracy,
      avgQuality: m.avgQuality,
      toolLift: avgLift(m),
      scenarios: m.scenarioResults.map((sr) => {
        const s = experiment.scenarios.find((sc) => sc.id === sr.scenarioId);
        return {
          type: s?.type, prompt: s?.prompt,
          withToolsScore: sr.withToolsScore, withoutToolsScore: sr.withoutToolsScore,
          toolLift: sr.toolLift, taskCompleted: sr.taskCompleted,
        };
      }),
    })),
  }, null, 2);
}
