import { useState } from "react";

import { ScenarioEditor } from "./ScenarioEditor";
import type { EvalScenario, DiscoveredComponent, ScenarioType } from "../../../shared/eval-types";

interface ScenarioListProps {
  scenarios: EvalScenario[];
  components: DiscoveredComponent[];
  onUpdate: (scenarioId: string, updates: Partial<EvalScenario>) => void;
  onToggle: (scenarioId: string) => void;
  onDelete: (scenarioId: string) => void;
}

const ALL_TYPES: ScenarioType[] = ["direct", "paraphrased", "edge_case", "negative"];

export function ScenarioList({
  scenarios,
  components,
  onUpdate,
  onToggle,
  onDelete,
}: ScenarioListProps) {
  const [filterType, setFilterType] = useState<ScenarioType | "all">("all");
  const [filterComponent, setFilterComponent] = useState<string>("all");

  const filtered = scenarios.filter((s) => {
    if (filterType !== "all" && s.type !== filterType) return false;
    if (filterComponent !== "all" && s.componentId !== filterComponent) return false;
    return true;
  });

  const getComponentName = (componentId: string) => {
    return components.find((c) => c.id === componentId)?.name || componentId;
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, padding: "0 0 12px" }}>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as ScenarioType | "all")}
          style={{
            backgroundColor: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            color: "var(--text)",
            fontSize: 12,
            padding: "4px 8px",
          }}
        >
          <option value="all">All Types</option>
          {ALL_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace("_", " ")}
            </option>
          ))}
        </select>
        <select
          value={filterComponent}
          onChange={(e) => setFilterComponent(e.target.value)}
          style={{
            backgroundColor: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            color: "var(--text)",
            fontSize: 12,
            padding: "4px 8px",
          }}
        >
          <option value="all">All Components</option>
          {components.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <span style={{ fontSize: 12, color: "var(--text-muted)", alignSelf: "center" }}>
          {filtered.length} of {scenarios.length} scenarios
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.map((scenario) => (
          <ScenarioEditor
            key={scenario.id}
            scenario={scenario}
            componentName={getComponentName(scenario.componentId)}
            onToggle={() => onToggle(scenario.id)}
            onDelete={() => onDelete(scenario.id)}
            onUpdate={(updates) => onUpdate(scenario.id, updates)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          No scenarios match the current filters
        </div>
      )}
    </div>
  );
}
