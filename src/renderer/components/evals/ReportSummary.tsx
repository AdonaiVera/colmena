import type { EvalReport } from "../../../shared/eval-types";

interface ReportSummaryProps {
  report: EvalReport;
}

interface ScoreCardProps {
  label: string;
  value: string;
  color: string;
}

function ScoreCard({ label, value, color }: ScoreCardProps) {
  return (
    <div
      style={{
        flex: 1,
        padding: "16px 20px",
        borderRadius: 10,
        border: "1px solid var(--border)",
        backgroundColor: "var(--surface)",
      }}
    >
      <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
    </div>
  );
}

export function ReportSummary({ report }: ReportSummaryProps) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <ScoreCard
        label="Overall Score"
        value={report.overallScore.toFixed(1)}
        color="var(--accent)"
      />
      <ScoreCard
        label="Tool Lift"
        value={report.toolLiftScore > 0 ? `+${report.toolLiftScore.toFixed(1)}` : report.toolLiftScore.toFixed(1)}
        color={report.toolLiftScore > 0 ? "var(--success)" : "var(--error)"}
      />
      <ScoreCard
        label="Trigger Rate"
        value={`${(report.triggerRate * 100).toFixed(0)}%`}
        color="var(--info)"
      />
      <ScoreCard
        label="Accuracy"
        value={`${(report.accuracy * 100).toFixed(0)}%`}
        color="var(--text)"
      />
    </div>
  );
}
