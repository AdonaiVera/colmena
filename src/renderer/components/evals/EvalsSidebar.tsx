import { useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

import { ColmenaLogo } from "../ColmenaLogo";
import type { Experiment } from "../../../shared/eval-types";

interface EvalsSidebarProps {
  experiments: Experiment[];
  activeExperimentId: string | null;
  onSelectExperiment: (id: string) => void;
  onNewExperiment: () => void;
  onDeleteExperiment: (id: string) => void;
  onBack: () => void;
}

export function EvalsSidebar({
  experiments,
  activeExperimentId,
  onSelectExperiment,
  onNewExperiment,
  onDeleteExperiment,
  onBack,
}: EvalsSidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div
      style={{
        width: 220,
        height: "100%",
        backgroundColor: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="titlebar-drag" style={{ height: 52 }} />

      <div
        style={{
          padding: "0 16px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ColmenaLogo size={22} />
          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--accent)" }}>Pollen Test</span>
        </div>
        <button
          className="titlebar-no-drag"
          onClick={onNewExperiment}
          style={{
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            color: "var(--text)",
            cursor: "pointer",
            padding: "4px 8px",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 4,
            transition: "var(--transition)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          <Plus size={12} />
          New
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {experiments.map((exp) => (
          <div
            key={exp.id}
            onClick={() => onSelectExperiment(exp.id)}
            onMouseEnter={() => setHoveredId(exp.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              cursor: "pointer",
              backgroundColor:
                exp.id === activeExperimentId ? "var(--surface-hover)" : "transparent",
              transition: "var(--transition)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: exp.id === activeExperimentId ? 600 : 400,
                  color:
                    exp.id === activeExperimentId ? "var(--text)" : "var(--text-secondary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {exp.name}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                {new Date(exp.createdAt).toLocaleDateString()}
              </div>
            </div>
            {hoveredId === exp.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteExperiment(exp.id);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
        {experiments.length === 0 && (
          <div
            style={{
              padding: "24px 12px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 12,
            }}
          >
            No experiments yet.
            <br />
            Click + New to start.
          </div>
        )}
      </div>

      <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border)" }}>
        <button
          className="titlebar-no-drag"
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            background: "none",
            border: "none",
            borderRadius: "var(--radius)",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: "6px 8px",
            fontSize: 12,
            transition: "var(--transition)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <ArrowLeft size={14} />
          <span>Back to Landing</span>
        </button>
      </div>
    </div>
  );
}
