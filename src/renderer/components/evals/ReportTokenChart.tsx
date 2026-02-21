import type { ExecutionRun, EvalScenario } from "../../../shared/eval-types";

interface ReportTokenChartProps {
  runs: ExecutionRun[];
  scenarios: EvalScenario[];
}

function sumTokens(runs: ExecutionRun[]) {
  let input = 0, output = 0, cacheRead = 0, cacheWrite = 0, cost = 0;
  for (const r of runs) {
    input += r.tokenUsage.inputTokens;
    output += r.tokenUsage.outputTokens;
    cacheRead += r.tokenUsage.cacheRead;
    cacheWrite += r.tokenUsage.cacheWrite;
    cost += r.costUsd || 0;
  }
  return { input, output, cacheRead, cacheWrite, total: input + output, cost };
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function ReportTokenChart({ runs, scenarios }: ReportTokenChartProps) {
  const withToolsRuns = runs.filter((r) => r.variant === "with_tools");
  const withoutToolsRuns = runs.filter((r) => r.variant === "without_tools");

  const w = sumTokens(withToolsRuns);
  const wo = sumTokens(withoutToolsRuns);

  const maxTokens = Math.max(1, w.total, wo.total);
  const barWidth = 280;

  const avgDuration = (list: ExecutionRun[]) =>
    list.length > 0 ? list.reduce((s, r) => s + r.duration, 0) / list.length / 1000 : 0;

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>
        Resource Usage
      </div>

      <svg width={barWidth + 180} height={80} style={{ display: "block", marginBottom: 16 }}>
        <text x={0} y={18} fill="var(--text-muted)" fontSize={11}>With Tools</text>
        <rect x={100} y={6} width={Math.max(2, (w.total / maxTokens) * barWidth)} height={20} rx={3} fill="var(--accent)" />
        <text x={100 + Math.max(2, (w.total / maxTokens) * barWidth) + 6} y={18} fill="var(--text-muted)" fontSize={10}>
          {fmt(w.total)} tokens
        </text>
        <text x={0} y={48} fill="var(--text-muted)" fontSize={11}>Without Tools</text>
        <rect x={100} y={36} width={Math.max(2, (wo.total / maxTokens) * barWidth)} height={20} rx={3} fill="var(--border)" />
        <text x={100 + Math.max(2, (wo.total / maxTokens) * barWidth) + 6} y={48} fill="var(--text-muted)" fontSize={10}>
          {fmt(wo.total)} tokens
        </text>
      </svg>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", fontSize: 12 }}>
        <TokenRow label="Input" with={w.input} without={wo.input} />
        <TokenRow label="Output" with={w.output} without={wo.output} />
        <TokenRow label="Cache Read" with={w.cacheRead} without={wo.cacheRead} />
        <TokenRow label="Cache Write" with={w.cacheWrite} without={wo.cacheWrite} />
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 24, fontSize: 12, color: "var(--text-muted)" }}>
        <span>Avg Duration: <b style={{ color: "var(--text)" }}>{avgDuration(withToolsRuns).toFixed(1)}s</b> vs <b style={{ color: "var(--text)" }}>{avgDuration(withoutToolsRuns).toFixed(1)}s</b></span>
        {(w.cost > 0 || wo.cost > 0) && (
          <span>Cost: <b style={{ color: "var(--text)" }}>${w.cost.toFixed(4)}</b> vs <b style={{ color: "var(--text)" }}>${wo.cost.toFixed(4)}</b></span>
        )}
      </div>

      <div style={{ marginTop: 4, fontSize: 12, color: "var(--text-muted)" }}>
        {scenarios.filter((s) => s.enabled).length} scenarios · {runs.length} total runs
      </div>
    </div>
  );
}

function TokenRow({ label, with: w, without: wo }: { label: string; with: number; without: number }) {
  if (w === 0 && wo === 0) return null;
  return (
    <>
      <div style={{ color: "var(--text-muted)" }}>
        {label}: <span style={{ color: "var(--accent)" }}>{fmt(w)}</span>
      </div>
      <div style={{ color: "var(--text-muted)" }}>
        vs <span style={{ color: "var(--text)" }}>{fmt(wo)}</span>
      </div>
    </>
  );
}
