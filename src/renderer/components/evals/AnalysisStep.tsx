import { useCallback, useState } from "react";
import { Search, Loader2 } from "lucide-react";

import { AnalysisComponentList } from "./AnalysisComponentList";
import type { Experiment } from "../../../shared/eval-types";
import type { useExperimentStore } from "../../hooks/useExperimentStore";

interface AnalysisStepProps {
  experiment: Experiment;
  store: ReturnType<typeof useExperimentStore>;
}

export function AnalysisStep({ experiment, store }: AnalysisStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stepStatus = experiment.steps.find((s) => s.id === "analysis")?.status || "pending";

  const handleRun = useCallback(async () => {
    setLoading(true);
    setError(null);
    store.setStepStatus(experiment.id, "analysis", "running");
    try {
      const result = await window.colmena.eval.analysisStart(experiment.workingDir);
      store.setComponents(experiment.id, result.components);
      store.setStepStatus(experiment.id, "analysis", "completed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      store.setStepStatus(experiment.id, "analysis", "error");
    } finally {
      setLoading(false);
    }
  }, [experiment.id, experiment.workingDir, store]);

  const handleToggle = useCallback(
    (componentId: string) => {
      const updated = experiment.components.map((c) =>
        c.id === componentId ? { ...c, selected: !c.selected } : c,
      );
      store.setComponents(experiment.id, updated);
    },
    [experiment.id, experiment.components, store],
  );

  const handleToggleGroup = useCallback(
    (type: string, selected: boolean) => {
      const updated = experiment.components.map((c) =>
        c.type === type ? { ...c, selected } : c,
      );
      store.setComponents(experiment.id, updated);
    },
    [experiment.id, experiment.components, store],
  );

  const handleSelectAll = useCallback(() => {
    const updated = experiment.components.map((c) => ({ ...c, selected: true }));
    store.setComponents(experiment.id, updated);
  }, [experiment.id, experiment.components, store]);

  const handleDeselectAll = useCallback(() => {
    const updated = experiment.components.map((c) => ({ ...c, selected: false }));
    store.setComponents(experiment.id, updated);
  }, [experiment.id, experiment.components, store]);

  const handleNext = useCallback(() => {
    store.setCurrentStep(experiment.id, "generation");
  }, [experiment.id, store]);

  const selectedCount = experiment.components.filter((c) => c.selected).length;
  const totalCount = experiment.components.length;
  const allSelected = totalCount > 0 && selectedCount === totalCount;

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
            Step 1: Analysis
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            Discover tools, MCP servers, hooks, and commands in your workspace
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleRun}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              backgroundColor: "var(--accent)",
              color: "var(--bg)",
              border: "none",
              borderRadius: "var(--radius)",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            {loading ? "Scanning..." : stepStatus === "completed" ? "Re-scan" : "Scan Workspace"}
          </button>
          {stepStatus === "completed" && selectedCount > 0 && (
            <button
              onClick={handleNext}
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
              Next: Generate Scenarios →
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 24px", color: "var(--error)", fontSize: 13 }}>{error}</div>
      )}

      <div style={{ flex: 1, overflow: "auto" }}>
        {totalCount > 0 && (
          <div
            style={{
              padding: "12px 24px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {selectedCount} of {totalCount} components selected
            </span>
            <button
              onClick={allSelected ? handleDeselectAll : handleSelectAll}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent)",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
                padding: "2px 0",
              }}
            >
              {allSelected ? "Deselect All" : "Select All"}
            </button>
          </div>
        )}
        <AnalysisComponentList
          components={experiment.components}
          onToggle={handleToggle}
          onToggleGroup={handleToggleGroup}
        />
      </div>
    </div>
  );
}
