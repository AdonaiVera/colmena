import { useCallback, useState } from "react";
import { BarChart3, Loader2, Check } from "lucide-react";

import { ReportSummary } from "./ReportSummary";
import { ReportComponentTable } from "./ReportComponentTable";
import { ReportLiftChart } from "./ReportLiftChart";
import { ReportTokenChart } from "./ReportTokenChart";
import { buildMarkdown, buildJson } from "./report-export";
import type { Experiment } from "../../../shared/eval-types";
import type { useExperimentStore } from "../../hooks/useExperimentStore";

interface ReportStepProps {
  experiment: Experiment;
  store: ReturnType<typeof useExperimentStore>;
}

export function ReportStep({ experiment, store }: ReportStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (experiment.runs.length === 0) return;
    setLoading(true);
    setError(null);
    store.setStepStatus(experiment.id, "report", "running");
    try {
      const result = await window.colmena.eval.evaluationStart(
        experiment.id, experiment.scenarios, experiment.runs, experiment.components,
      );
      store.setReport(experiment.id, result.report);
      store.setStepStatus(experiment.id, "report", "completed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed");
      store.setStepStatus(experiment.id, "report", "error");
    } finally {
      setLoading(false);
    }
  }, [experiment, store]);

  const handleCopy = useCallback((format: "json" | "markdown") => {
    const text = format === "json" ? buildJson(experiment) : buildMarkdown(experiment);
    navigator.clipboard.writeText(text);
    setCopied(format);
    setTimeout(() => setCopied(null), 2000);
  }, [experiment]);

  const evaluatedComponents = experiment.components.filter((c) =>
    experiment.report?.componentMetrics.some((m) => m.componentId === c.id),
  );

  const evaluatedRuns = experiment.runs.filter((r) =>
    experiment.scenarios.some((s) => s.id === r.scenarioId && s.enabled),
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
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
            Step 4: Report
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            Evaluate runs and generate comparison report
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleGenerate}
            disabled={loading || experiment.runs.length === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              backgroundColor: "var(--accent)",
              color: "var(--bg)",
              border: "none",
              borderRadius: "var(--radius)",
              cursor: loading || experiment.runs.length === 0 ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              opacity: loading || experiment.runs.length === 0 ? 0.7 : 1,
            }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <BarChart3 size={14} />}
            {loading ? "Evaluating..." : experiment.report ? "Re-evaluate" : "Generate Report"}
          </button>
          {experiment.report && (
            <>
              <CopyButton label="Copy JSON" copied={copied === "json"} onClick={() => handleCopy("json")} />
              <CopyButton label="Copy Markdown" copied={copied === "markdown"} onClick={() => handleCopy("markdown")} />
            </>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 24px", color: "var(--error)", fontSize: 13 }}>{error}</div>
      )}

      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {experiment.report ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <ReportSummary report={experiment.report} />
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <ReportLiftChart metrics={experiment.report.componentMetrics} components={evaluatedComponents} />
              </div>
              <div style={{ flex: 1 }}>
                <ReportTokenChart runs={evaluatedRuns} scenarios={experiment.scenarios} />
              </div>
            </div>
            <ReportComponentTable metrics={experiment.report.componentMetrics} components={evaluatedComponents} />
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 40, fontSize: 13 }}>
            {experiment.runs.length === 0
              ? "No execution runs. Go back to Execution to run scenarios."
              : "Click Generate Report to analyze and score the execution runs."}
          </div>
        )}
      </div>
    </div>
  );
}

function CopyButton({ label, copied, onClick }: { label: string; copied: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "8px 12px",
        backgroundColor: copied ? "var(--success)" : "var(--surface-hover)",
        color: copied ? "white" : "var(--text-muted)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        cursor: "pointer",
        fontSize: 12,
        transition: "all 150ms ease",
      }}
    >
      {copied && <Check size={12} />}
      {copied ? "Copied!" : label}
    </button>
  );
}
