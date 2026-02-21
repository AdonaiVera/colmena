import { useState } from "react";
import { Trash2, ChevronDown, ChevronRight } from "lucide-react";

import type { EvalScenario, ScenarioType } from "../../../shared/eval-types";

interface ScenarioEditorProps {
  scenario: EvalScenario;
  componentName: string;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<EvalScenario>) => void;
}

const TYPE_COLORS: Record<ScenarioType, string> = {
  direct: "var(--accent)",
  paraphrased: "var(--info)",
  edge_case: "var(--warning)",
  negative: "var(--error)",
};

export function ScenarioEditor({
  scenario,
  componentName,
  onToggle,
  onDelete,
  onUpdate,
}: ScenarioEditorProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 8,
        backgroundColor: scenario.enabled ? "var(--surface)" : "var(--bg)",
        opacity: scenario.enabled ? 1 : 0.6,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown size={14} color="var(--text-muted)" />
        ) : (
          <ChevronRight size={14} color="var(--text-muted)" />
        )}
        <input
          type="checkbox"
          checked={scenario.enabled}
          onChange={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          onClick={(e) => e.stopPropagation()}
          style={{ accentColor: "var(--accent)" }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            color: TYPE_COLORS[scenario.type],
            letterSpacing: "0.05em",
            flexShrink: 0,
          }}
        >
          {scenario.type.replace("_", " ")}
        </span>
        <span
          style={{
            fontSize: 13,
            color: "var(--text)",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {scenario.prompt}
        </span>
        <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
          {componentName}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: 2,
            display: "flex",
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>

      {expanded && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border)" }}>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Prompt</div>
            <textarea
              value={scenario.prompt}
              onChange={(e) => onUpdate({ prompt: e.target.value })}
              style={{
                width: "100%",
                minHeight: 60,
                backgroundColor: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                color: "var(--text)",
                fontSize: 13,
                padding: "8px 10px",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
              Expected Behavior
            </div>
            <textarea
              value={scenario.expectedBehavior}
              onChange={(e) => onUpdate({ expectedBehavior: e.target.value })}
              style={{
                width: "100%",
                minHeight: 40,
                backgroundColor: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                color: "var(--text)",
                fontSize: 13,
                padding: "8px 10px",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
