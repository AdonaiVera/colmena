import { useCallback, useEffect, useRef, useState } from "react";

import { ExecutionControls } from "./ExecutionControls";
import { ExecutionGrid } from "./ExecutionGrid";
import { ExecutionProgress } from "./ExecutionProgress";
import { ExecutionRunViewer } from "./ExecutionRunViewer";
import type { Experiment, ExecutionMode, LiveRun, RunVariant } from "../../../shared/eval-types";
import type { useExperimentStore } from "../../hooks/useExperimentStore";

interface ExecutionStepProps {
  experiment: Experiment;
  store: ReturnType<typeof useExperimentStore>;
}

export function ExecutionStep({ experiment, store }: ExecutionStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ExecutionMode>("parallel");
  const [liveRuns, setLiveRuns] = useState<LiveRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const liveRunsRef = useRef<LiveRun[]>([]);

  const stepStatus = experiment.steps.find((s) => s.id === "execution")?.status || "pending";
  const enabledScenarios = experiment.scenarios.filter((s) => s.enabled);
  const totalExpected = enabledScenarios.length * 2;

  useEffect(() => {
    const unsubStart = window.colmena.eval.onExecutionRunStarted(
      (runId: string, scenarioId: string, variant: string) => {
        const newRun: LiveRun = { runId, scenarioId, variant, status: "running", transcript: "" };
        liveRunsRef.current = [...liveRunsRef.current, newRun];
        setLiveRuns([...liveRunsRef.current]);
      },
    );

    const unsubStatus = window.colmena.eval.onExecutionRunStatus(
      (runId: string, status: string, transcript: string) => {
        liveRunsRef.current = liveRunsRef.current.map((r) =>
          r.runId === runId ? { ...r, status, transcript } : r,
        );
        setLiveRuns([...liveRunsRef.current]);
      },
    );

    return () => { unsubStart(); unsubStatus(); };
  }, []);

  const handleRun = useCallback(async () => {
    if (enabledScenarios.length === 0) return;
    setLoading(true);
    setError(null);
    setSelectedRunId(null);
    liveRunsRef.current = [];
    setLiveRuns([]);
    store.setStepStatus(experiment.id, "execution", "running");
    store.setRuns(experiment.id, []);
    try {
      const result = await window.colmena.eval.executionStart(
        enabledScenarios,
        experiment.workingDir,
        experiment.id,
        mode,
      );
      store.setRuns(experiment.id, result.runs);
      store.setStepStatus(experiment.id, "execution", "completed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Execution failed");
      store.setStepStatus(experiment.id, "execution", "error");
    } finally {
      setLoading(false);
    }
  }, [experiment.id, experiment.workingDir, enabledScenarios, store, mode]);

  const handleAbort = useCallback(() => {
    window.colmena.eval.abort();
    setLoading(false);
    store.setStepStatus(experiment.id, "execution", "error");
  }, [experiment.id, store]);

  const handleNext = useCallback(() => {
    store.setCurrentStep(experiment.id, "report");
  }, [experiment.id, store]);

  const selectedRun = liveRuns.find((r) => r.runId === selectedRunId);
  const selectedPrompt = selectedRun
    ? experiment.scenarios.find((s) => s.id === selectedRun.scenarioId)?.prompt || ""
    : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ExecutionControls
        mode={mode}
        onModeChange={setMode}
        loading={loading}
        enabledCount={enabledScenarios.length}
        totalExpected={totalExpected}
        stepStatus={stepStatus}
        hasRuns={experiment.runs.length > 0 || liveRuns.length > 0}
        experimentId={experiment.id}
        onRun={handleRun}
        onAbort={handleAbort}
        onNext={handleNext}
      />

      {error && (
        <div style={{ padding: "12px 24px", color: "var(--error)", fontSize: 13 }}>{error}</div>
      )}

      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {(liveRuns.length > 0 || loading) && (
            <ExecutionProgress runs={liveRuns} totalExpected={totalExpected} />
          )}
          <ExecutionGrid
            liveRuns={liveRuns}
            scenarios={experiment.scenarios}
            totalExpected={totalExpected}
            selectedRunId={selectedRunId}
            onSelectRun={setSelectedRunId}
          />
          {liveRuns.length === 0 && !loading && (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 40, fontSize: 13 }}>
              {enabledScenarios.length === 0
                ? "No enabled scenarios. Go back to Generation to enable scenarios."
                : "Click Run All to execute scenarios with and without tools."}
            </div>
          )}
        </div>

        {selectedRun && (
          <div style={{ width: 420, flexShrink: 0 }}>
            <ExecutionRunViewer
              scenarioPrompt={selectedPrompt}
              variant={selectedRun.variant as RunVariant}
              status={selectedRun.status}
              transcript={selectedRun.transcript}
              onClose={() => setSelectedRunId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
