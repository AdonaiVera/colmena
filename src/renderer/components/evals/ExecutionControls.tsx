import { Play, Layers, ArrowRight, FolderOpen } from "lucide-react";

import type { ExecutionMode } from "../../../shared/eval-types";

interface ExecutionControlsProps {
  mode: ExecutionMode;
  onModeChange: (mode: ExecutionMode) => void;
  loading: boolean;
  enabledCount: number;
  totalExpected: number;
  stepStatus: string;
  hasRuns: boolean;
  experimentId: string;
  onRun: () => void;
  onAbort: () => void;
  onNext: () => void;
}

const pillStyle = (active: boolean): React.CSSProperties => ({
  padding: "4px 10px",
  fontSize: 12,
  fontWeight: 500,
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  backgroundColor: active ? "var(--accent)" : "var(--surface)",
  color: active ? "var(--bg)" : "var(--text-muted)",
  transition: "all 150ms ease",
});

export function ExecutionControls({
  mode,
  onModeChange,
  loading,
  enabledCount,
  totalExpected,
  stepStatus,
  hasRuns,
  experimentId,
  onRun,
  onAbort,
  onNext,
}: ExecutionControlsProps) {
  const handleOpenLogs = () => window.colmena.eval.openLogsFolder(experimentId);
  return (
    <div
      style={{
        padding: "20px 24px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
          Step 3: Execution
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
          Run {enabledCount} scenarios ({totalExpected} total runs: with and without tools)
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            display: "flex",
            gap: 2,
            backgroundColor: "var(--surface-hover)",
            borderRadius: 8,
            padding: 2,
          }}
        >
          <button
            onClick={() => onModeChange("sequential")}
            disabled={loading}
            style={pillStyle(mode === "sequential")}
          >
            <ArrowRight size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
            Sequential
          </button>
          <button
            onClick={() => onModeChange("parallel")}
            disabled={loading}
            style={pillStyle(mode === "parallel")}
          >
            <Layers size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
            Parallel
          </button>
        </div>

        {loading ? (
          <button
            onClick={onAbort}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              backgroundColor: "var(--error)",
              color: "white",
              border: "none",
              borderRadius: "var(--radius)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Abort
          </button>
        ) : (
          <button
            onClick={onRun}
            disabled={enabledCount === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              backgroundColor: "var(--accent)",
              color: "var(--bg)",
              border: "none",
              borderRadius: "var(--radius)",
              cursor: enabledCount === 0 ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              opacity: enabledCount === 0 ? 0.5 : 1,
            }}
          >
            <Play size={14} />
            {stepStatus === "completed" ? "Re-run" : "Run All"}
          </button>
        )}

        {hasRuns && (
          <button
            onClick={handleOpenLogs}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              backgroundColor: "transparent",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            <FolderOpen size={13} />
            Logs
          </button>
        )}

        {stepStatus === "completed" && hasRuns && (
          <button
            onClick={onNext}
            style={{
              padding: "8px 16px",
              backgroundColor: "var(--surface-hover)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Next: Report →
          </button>
        )}
      </div>
    </div>
  );
}
