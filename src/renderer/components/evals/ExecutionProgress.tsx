import type { LiveRun } from "../../../shared/eval-types";

interface ExecutionProgressProps {
  runs: LiveRun[];
  totalExpected: number;
}

export function ExecutionProgress({ runs, totalExpected }: ExecutionProgressProps) {
  const completed = runs.filter((r) => r.status === "completed").length;
  const errored = runs.filter((r) => r.status === "error").length;
  const running = runs.filter((r) => r.status === "running").length;
  const progress = totalExpected > 0 ? ((completed + errored) / totalExpected) * 100 : 0;

  return (
    <div style={{ padding: "0 0 16px" }}>
      <div
        style={{
          height: 6,
          backgroundColor: "var(--border)",
          borderRadius: 3,
          overflow: "hidden",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            backgroundColor: errored > 0 ? "var(--warning)" : "var(--accent)",
            borderRadius: 3,
            transition: "width 300ms ease",
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)" }}>
        <span>
          <strong style={{ color: "var(--text)" }}>{completed}</strong> completed
        </span>
        {running > 0 && (
          <span>
            <strong style={{ color: "var(--accent)" }}>{running}</strong> running
          </span>
        )}
        {errored > 0 && (
          <span>
            <strong style={{ color: "var(--error)" }}>{errored}</strong> errors
          </span>
        )}
        <span style={{ marginLeft: "auto" }}>
          {completed + errored} / {totalExpected}
        </span>
      </div>
    </div>
  );
}
