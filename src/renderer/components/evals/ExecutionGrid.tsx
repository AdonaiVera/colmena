import { statusColor } from "../../../shared/eval-types";
import type { EvalScenario, LiveRun } from "../../../shared/eval-types";

interface ExecutionGridProps {
  liveRuns: LiveRun[];
  scenarios: EvalScenario[];
  totalExpected: number;
  selectedRunId: string | null;
  onSelectRun: (runId: string) => void;
}

export function ExecutionGrid({
  liveRuns,
  scenarios,
  totalExpected,
  selectedRunId,
  onSelectRun,
}: ExecutionGridProps) {
  const getScenarioPrompt = (scenarioId: string) => {
    const s = scenarios.find((sc) => sc.id === scenarioId);
    return s?.prompt.slice(0, 80) || scenarioId;
  };

  const lastLine = (transcript: string) => {
    const lines = transcript.trim().split("\n").filter(Boolean);
    return lines.length > 0 ? lines[lines.length - 1].slice(0, 120) : "";
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: 8,
      }}
    >
      {liveRuns.map((run) => (
        <div
          key={run.runId}
          onClick={() => onSelectRun(run.runId)}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: selectedRunId === run.runId
              ? "1px solid var(--accent)"
              : "1px solid var(--border)",
            backgroundColor: selectedRunId === run.runId
              ? "var(--surface-hover)"
              : "var(--surface)",
            cursor: "pointer",
            transition: "border-color 150ms ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: statusColor(run.status),
                flexShrink: 0,
                animation: run.status === "running" ? "colmena-pulse 1.5s infinite" : "none",
              }}
            />
            <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>
              {run.variant === "with_tools" ? "with tools" : "baseline"}
            </span>
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginBottom: 4,
            }}
          >
            {getScenarioPrompt(run.scenarioId)}
          </div>
          {run.status === "running" && run.transcript && (
            <div
              style={{
                fontSize: 11,
                color: "var(--accent)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              {lastLine(run.transcript)}
            </div>
          )}
          {run.status === "completed" && (
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Done — click to view transcript
            </div>
          )}
          {run.status === "error" && (
            <div style={{ fontSize: 11, color: "var(--error)" }}>Failed</div>
          )}
        </div>
      ))}

      {Array.from({ length: Math.max(0, totalExpected - liveRuns.length) }).map((_, i) => (
        <div
          key={`pending-${i}`}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px dashed var(--border)",
            backgroundColor: "transparent",
            height: 70,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Queued</span>
        </div>
      ))}
    </div>
  );
}
