import { useCallback, useEffect, useRef, useState } from "react";
import { nanoid } from "nanoid";

import { createExperiment } from "../../shared/eval-types";
import type {
  Experiment,
  DiscoveredComponent,
  EvalScenario,
  ExecutionRun,
  EvalReport,
  EvalStepId,
  EvalStepStatus,
} from "../../shared/eval-types";

interface ExperimentStoreState {
  experiments: Experiment[];
  activeExperimentId: string | null;
  restored: boolean;
}

const DEFAULT_STATE: ExperimentStoreState = {
  experiments: [],
  activeExperimentId: null,
  restored: false,
};

export function useExperimentStore() {
  const [state, setState] = useState<ExperimentStoreState>(DEFAULT_STATE);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!state.restored) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      for (const exp of state.experiments) {
        window.colmena.eval.saveExperiment(exp);
      }
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [state.experiments, state.restored]);

  useEffect(() => {
    window.colmena.eval.listExperiments().then((persisted) => {
      const experiments: Experiment[] = persisted.map((p) => ({ ...p }));
      setState({
        experiments,
        activeExperimentId: experiments.length > 0 ? experiments[0].id : null,
        restored: true,
      });
    });
  }, []);

  const addExperiment = useCallback((name: string, workingDir: string) => {
    const id = nanoid();
    const experiment = createExperiment(id, name, workingDir);
    setState((prev) => ({
      ...prev,
      experiments: [...prev.experiments, experiment],
      activeExperimentId: id,
    }));
    return experiment;
  }, []);

  const deleteExperiment = useCallback((experimentId: string) => {
    window.colmena.eval.deleteExperiment(experimentId);
    setState((prev) => {
      const experiments = prev.experiments.filter((e) => e.id !== experimentId);
      const activeExperimentId =
        prev.activeExperimentId === experimentId
          ? experiments.length > 0
            ? experiments[0].id
            : null
          : prev.activeExperimentId;
      return { ...prev, experiments, activeExperimentId };
    });
  }, []);

  const setActiveExperiment = useCallback((experimentId: string) => {
    setState((prev) => ({ ...prev, activeExperimentId: experimentId }));
  }, []);

  const updateExperiment = useCallback((experimentId: string, updates: Partial<Experiment>) => {
    setState((prev) => ({
      ...prev,
      experiments: prev.experiments.map((e) =>
        e.id === experimentId ? { ...e, ...updates } : e,
      ),
    }));
  }, []);

  const setStepStatus = useCallback(
    (experimentId: string, stepId: EvalStepId, status: EvalStepStatus) => {
      setState((prev) => ({
        ...prev,
        experiments: prev.experiments.map((e) =>
          e.id === experimentId
            ? {
                ...e,
                steps: e.steps.map((s) => (s.id === stepId ? { ...s, status } : s)),
              }
            : e,
        ),
      }));
    },
    [],
  );

  const setComponents = useCallback(
    (experimentId: string, components: DiscoveredComponent[]) => {
      updateExperiment(experimentId, { components });
    },
    [updateExperiment],
  );

  const setScenarios = useCallback(
    (experimentId: string, scenarios: EvalScenario[]) => {
      updateExperiment(experimentId, { scenarios });
    },
    [updateExperiment],
  );

  const setRuns = useCallback(
    (experimentId: string, runs: ExecutionRun[]) => {
      updateExperiment(experimentId, { runs });
    },
    [updateExperiment],
  );

  const setReport = useCallback(
    (experimentId: string, report: EvalReport | null) => {
      updateExperiment(experimentId, { report });
    },
    [updateExperiment],
  );

  const setCurrentStep = useCallback(
    (experimentId: string, step: EvalStepId) => {
      updateExperiment(experimentId, { currentStep: step });
    },
    [updateExperiment],
  );

  const active = state.experiments.find((e) => e.id === state.activeExperimentId) || null;

  return {
    experiments: state.experiments,
    activeExperiment: active,
    activeExperimentId: state.activeExperimentId,
    restored: state.restored,
    addExperiment,
    deleteExperiment,
    setActiveExperiment,
    updateExperiment,
    setStepStatus,
    setComponents,
    setScenarios,
    setRuns,
    setReport,
    setCurrentStep,
  };
}
