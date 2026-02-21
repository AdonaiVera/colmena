import { useState } from "react";
import { ArrowUpDown } from "lucide-react";

import type { ComponentMetrics, DiscoveredComponent } from "../../../shared/eval-types";

interface ReportComponentTableProps {
  metrics: ComponentMetrics[];
  components: DiscoveredComponent[];
}

type SortKey = "name" | "triggerRate" | "accuracy" | "avgQuality" | "lift";

export function ReportComponentTable({ metrics, components }: ReportComponentTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("lift");
  const [sortAsc, setSortAsc] = useState(false);

  const getName = (componentId: string) =>
    components.find((c) => c.id === componentId)?.name || componentId;

  const getAvgLift = (m: ComponentMetrics) => {
    if (m.scenarioResults.length === 0) return 0;
    return m.scenarioResults.reduce((s, r) => s + r.toolLift, 0) / m.scenarioResults.length;
  };

  const sorted = [...metrics].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "name":
        cmp = getName(a.componentId).localeCompare(getName(b.componentId));
        break;
      case "triggerRate":
        cmp = a.triggerRate - b.triggerRate;
        break;
      case "accuracy":
        cmp = a.accuracy - b.accuracy;
        break;
      case "avgQuality":
        cmp = a.avgQuality - b.avgQuality;
        break;
      case "lift":
        cmp = getAvgLift(a) - getAvgLift(b);
        break;
    }
    return sortAsc ? cmp : -cmp;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const headerStyle: React.CSSProperties = {
    padding: "8px 12px",
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  };

  const cellStyle: React.CSSProperties = {
    padding: "10px 12px",
    fontSize: 13,
    color: "var(--text)",
    borderTop: "1px solid var(--border)",
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={headerStyle} onClick={() => handleSort("name")}>
              Component <ArrowUpDown size={10} style={{ verticalAlign: "middle" }} />
            </th>
            <th style={{ ...headerStyle, textAlign: "right" }} onClick={() => handleSort("triggerRate")}>
              Trigger Rate <ArrowUpDown size={10} style={{ verticalAlign: "middle" }} />
            </th>
            <th style={{ ...headerStyle, textAlign: "right" }} onClick={() => handleSort("accuracy")}>
              Accuracy <ArrowUpDown size={10} style={{ verticalAlign: "middle" }} />
            </th>
            <th style={{ ...headerStyle, textAlign: "right" }} onClick={() => handleSort("avgQuality")}>
              Quality <ArrowUpDown size={10} style={{ verticalAlign: "middle" }} />
            </th>
            <th style={{ ...headerStyle, textAlign: "right" }} onClick={() => handleSort("lift")}>
              Tool Lift <ArrowUpDown size={10} style={{ verticalAlign: "middle" }} />
            </th>
            <th style={{ ...headerStyle, textAlign: "right" }}>Scenarios</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((m) => {
            const lift = getAvgLift(m);
            return (
              <tr key={m.componentId}>
                <td style={cellStyle}>{getName(m.componentId)}</td>
                <td style={{ ...cellStyle, textAlign: "right" }}>
                  {(m.triggerRate * 100).toFixed(0)}%
                </td>
                <td style={{ ...cellStyle, textAlign: "right" }}>
                  {(m.accuracy * 100).toFixed(0)}%
                </td>
                <td style={{ ...cellStyle, textAlign: "right" }}>
                  {m.avgQuality.toFixed(1)}
                </td>
                <td
                  style={{
                    ...cellStyle,
                    textAlign: "right",
                    color: lift > 0 ? "var(--success)" : lift < 0 ? "var(--error)" : "var(--text-muted)",
                    fontWeight: 600,
                  }}
                >
                  {lift > 0 ? "+" : ""}{lift.toFixed(1)}
                </td>
                <td style={{ ...cellStyle, textAlign: "right", color: "var(--text-muted)" }}>
                  {m.scenarioResults.length}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
