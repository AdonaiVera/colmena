import { useCallback, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

import { ScenarioList } from "./ScenarioList";
import type { Experiment, EvalScenario } from "../../../shared/eval-types";
import type { useExperimentStore } from "../../hooks/useExperimentStore";

interface GenerationStepProps {
  experiment: Experiment;
  store: ReturnType<typeof useExperimentStore>;
}

export function GenerationStep({ experiment, store }: GenerationStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stepStatus = experiment.steps.find((s) => s.id === "generation")?.status || "pending";
  const selectedComponents = experiment.components.filter((c) => c.selected);

  const handleGenerate = useCallback(async () => {
    if (selectedComponents.length === 0) return;
    setLoading(true);
    setError(null);
    store.setStepStatus(experiment.id, "generation", "running");
    try {
      const result = await window.colmena.eval.generationStart(
        selectedComponents,
        experiment.workingDir,
      );
      store.setScenarios(experiment.id, result.scenarios);
      store.setStepStatus(experiment.id, "generation", "completed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      store.setStepStatus(experiment.id, "generation", "error");
    } finally {
      setLoading(false);
    }
  }, [experiment.id, experiment.workingDir, selectedComponents, store]);

  const handleToggle = useCallback(
    (scenarioId: string) => {
      const updated = experiment.scenarios.map((s) =>
        s.id === scenarioId ? { ...s, enabled: !s.enabled } : s,
      );
      store.setScenarios(experiment.id, updated);
    },
    [experiment.id, experiment.scenarios, store],
  );

  const handleDelete = useCallback(
    (scenarioId: string) => {
      const updated = experiment.scenarios.filter((s) => s.id !== scenarioId);
      store.setScenarios(experiment.id, updated);
    },
    [experiment.id, experiment.scenarios, store],
  );

  const handleUpdate = useCallback(
    (scenarioId: string, updates: Partial<EvalScenario>) => {
      const updated = experiment.scenarios.map((s) =>
        s.id === scenarioId ? { ...s, ...updates } : s,
      );
      store.setScenarios(experiment.id, updated);
    },
    [experiment.id, experiment.scenarios, store],
  );

  const handleNext = useCallback(() => {
    store.setCurrentStep(experiment.id, "execution");
  }, [experiment.id, store]);

  const enabledCount = experiment.scenarios.filter((s) => s.enabled).length;

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
            Step 2: Scenario Generation
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            Generate test scenarios for {selectedComponents.length} selected components
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleGenerate}
            disabled={loading || selectedComponents.length === 0}
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
              opacity: loading || selectedComponents.length === 0 ? 0.7 : 1,
            }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {loading ? "Generating..." : stepStatus === "completed" ? "Regenerate" : "Generate"}
          </button>
          {stepStatus === "completed" && enabledCount > 0 && (
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
              Next: Execute →
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 24px", color: "var(--error)", fontSize: 13 }}>{error}</div>
      )}

      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {experiment.scenarios.length > 0 ? (
          <ScenarioList
            scenarios={experiment.scenarios}
            components={experiment.components}
            onUpdate={handleUpdate}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        ) : (
          <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>
            {selectedComponents.length === 0
              ? "No components selected. Go back to Analysis to select components."
              : "Click Generate to create test scenarios for your components."}
          </div>
        )}
      </div>
    </div>
  );
}
