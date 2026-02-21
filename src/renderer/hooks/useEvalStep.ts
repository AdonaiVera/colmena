import { useCallback } from "react";

import { STEP_ORDER, createDefaultSteps } from "../../shared/eval-types";
import type { EvalStepId, Experiment } from "../../shared/eval-types";
import type { useExperimentStore } from "./useExperimentStore";

function getDownstreamSteps(stepId: EvalStepId): EvalStepId[] {
  const idx = STEP_ORDER.indexOf(stepId);
  return STEP_ORDER.slice(idx + 1);
}

interface UseEvalStepOptions {
  experiment: Experiment | null;
  store: ReturnType<typeof useExperimentStore>;
}

export function useEvalStep({ experiment, store }: UseEvalStepOptions) {
  const clearDownstream = useCallback(
    (stepId: EvalStepId) => {
      if (!experiment) return;
      const downstream = getDownstreamSteps(stepId);
      const freshSteps = createDefaultSteps();

      const updatedSteps = experiment.steps.map((s) => {
        if (downstream.includes(s.id)) {
          return freshSteps.find((f) => f.id === s.id) || s;
        }
        if (s.id === stepId) {
          return { ...s, status: "pending" as const };
        }
        return s;
      });

      const updates: Partial<Experiment> = { steps: updatedSteps };

      if (stepId === "analysis" || downstream.includes("analysis")) {
        updates.components = [];
      }
      if (stepId === "generation" || downstream.includes("generation")) {
        updates.scenarios = [];
      }
      if (stepId === "execution" || downstream.includes("execution")) {
        updates.runs = [];
      }
      if (stepId === "report" || downstream.includes("report")) {
        updates.report = null;
      }

      store.updateExperiment(experiment.id, updates);
    },
    [experiment, store],
  );

  const navigateToStep = useCallback(
    (stepId: EvalStepId) => {
      if (!experiment) return;
      store.setCurrentStep(experiment.id, stepId);
    },
    [experiment, store],
  );

  const rerunStep = useCallback(
    (stepId: EvalStepId) => {
      if (!experiment) return;
      clearDownstream(stepId);
      store.setCurrentStep(experiment.id, stepId);
    },
    [experiment, store, clearDownstream],
  );

  const abort = useCallback(() => {
    window.colmena.eval.abort();
  }, []);

  const hasDownstreamData = useCallback(
    (stepId: EvalStepId): boolean => {
      if (!experiment) return false;
      const downstream = getDownstreamSteps(stepId);
      if (downstream.includes("generation") && experiment.scenarios.length > 0) return true;
      if (downstream.includes("execution") && experiment.runs.length > 0) return true;
      if (downstream.includes("report") && experiment.report !== null) return true;
      return false;
    },
    [experiment],
  );

  return {
    navigateToStep,
    rerunStep,
    clearDownstream,
    abort,
    hasDownstreamData,
  };
}
