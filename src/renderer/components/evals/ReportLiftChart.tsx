import type { ComponentMetrics, DiscoveredComponent } from "../../../shared/eval-types";

interface ReportLiftChartProps {
  metrics: ComponentMetrics[];
  components: DiscoveredComponent[];
}

export function ReportLiftChart({ metrics, components }: ReportLiftChartProps) {
  const getName = (id: string) => components.find((c) => c.id === id)?.name || id;

  const data = metrics.map((m) => {
    const results = m.scenarioResults;
    const avgWith =
      results.length > 0 ? results.reduce((s, r) => s + r.withToolsScore, 0) / results.length : 0;
    const avgWithout =
      results.length > 0
        ? results.reduce((s, r) => s + r.withoutToolsScore, 0) / results.length
        : 0;
    return { name: getName(m.componentId), withTools: avgWith, withoutTools: avgWithout };
  });

  if (data.length === 0) return null;

  const maxVal = Math.max(10, ...data.flatMap((d) => [d.withTools, d.withoutTools]));
  const barHeight = 20;
  const gap = 8;
  const groupGap = 16;
  const labelWidth = 120;
  const chartWidth = 400;
  const svgHeight = data.length * (barHeight * 2 + gap + groupGap);

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>
        Tool Lift by Component
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
        <span>
          <span style={{ display: "inline-block", width: 10, height: 10, backgroundColor: "var(--accent)", borderRadius: 2, marginRight: 4, verticalAlign: "middle" }} />
          With Tools
        </span>
        <span>
          <span style={{ display: "inline-block", width: 10, height: 10, backgroundColor: "var(--border)", borderRadius: 2, marginRight: 4, verticalAlign: "middle" }} />
          Without Tools
        </span>
      </div>
      <svg width={labelWidth + chartWidth + 40} height={svgHeight} style={{ display: "block" }}>
        {data.map((d, i) => {
          const y = i * (barHeight * 2 + gap + groupGap);
          const w1 = (d.withTools / maxVal) * chartWidth;
          const w2 = (d.withoutTools / maxVal) * chartWidth;
          return (
            <g key={i}>
              <text x={labelWidth - 8} y={y + barHeight + gap / 2} textAnchor="end" fill="var(--text-muted)" fontSize={11} dominantBaseline="middle">
                {d.name.length > 16 ? d.name.slice(0, 16) + "..." : d.name}
              </text>
              <rect x={labelWidth} y={y} width={Math.max(2, w1)} height={barHeight} rx={3} fill="var(--accent)" />
              <text x={labelWidth + Math.max(2, w1) + 6} y={y + barHeight / 2} fill="var(--text-muted)" fontSize={10} dominantBaseline="middle">
                {d.withTools.toFixed(1)}
              </text>
              <rect x={labelWidth} y={y + barHeight + gap} width={Math.max(2, w2)} height={barHeight} rx={3} fill="var(--border)" />
              <text x={labelWidth + Math.max(2, w2) + 6} y={y + barHeight + gap + barHeight / 2} fill="var(--text-muted)" fontSize={10} dominantBaseline="middle">
                {d.withoutTools.toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
