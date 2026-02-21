import { useCallback, useState, type ReactNode } from "react";

import { useExperimentStore } from "../../hooks/useExperimentStore";
import { useEvalStep } from "../../hooks/useEvalStep";
import { EvalsSidebar } from "./EvalsSidebar";
import { EvalsTimeline } from "./EvalsTimeline";
import { EvalsWelcome } from "./EvalsWelcome";
import { NewExperimentDialog } from "./NewExperimentDialog";
import { RerunConfirmDialog } from "./RerunConfirmDialog";
import { AnalysisStep } from "./AnalysisStep";
import { GenerationStep } from "./GenerationStep";
import { ExecutionStep } from "./ExecutionStep";
import { ReportStep } from "./ReportStep";
import type { EvalStepId } from "../../../shared/eval-types";

interface EvalsAppProps {
  onBack: () => void;
}

export function EvalsApp({ onBack }: EvalsAppProps) {
  const store = useExperimentStore();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [pendingRerunStep, setPendingRerunStep] = useState<EvalStepId | null>(null);

  const evalStep = useEvalStep({ experiment: store.activeExperiment, store });

  const handleNewExperiment = (name: string, workingDir: string) => {
    store.addExperiment(name, workingDir);
    setShowNewDialog(false);
  };

  const handleStepClick = useCallback(
    (stepId: EvalStepId) => {
      if (!store.activeExperiment) return;
      const step = store.activeExperiment.steps.find((s) => s.id === stepId);
      if (step?.status === "completed" && evalStep.hasDownstreamData(stepId)) {
        setPendingRerunStep(stepId);
        return;
      }
      evalStep.navigateToStep(stepId);
    },
    [store.activeExperiment, evalStep],
  );

  const handleConfirmRerun = useCallback(() => {
    if (pendingRerunStep) {
      evalStep.rerunStep(pendingRerunStep);
      setPendingRerunStep(null);
    }
  }, [pendingRerunStep, evalStep]);

  const handleNavigateOnly = useCallback(() => {
    if (pendingRerunStep) {
      evalStep.navigateToStep(pendingRerunStep);
      setPendingRerunStep(null);
    }
  }, [pendingRerunStep, evalStep]);

  const active = store.activeExperiment;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: "var(--bg)",
      }}
    >
      <EvalsSidebar
        experiments={store.experiments}
        activeExperimentId={store.activeExperimentId}
        onSelectExperiment={store.setActiveExperiment}
        onNewExperiment={() => setShowNewDialog(true)}
        onDeleteExperiment={store.deleteExperiment}
        onBack={onBack}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {active ? (
          <>
            <EvalsTimeline
              steps={active.steps}
              currentStep={active.currentStep}
              onStepClick={handleStepClick}
            />
            <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
              <StepPanel visible={active.currentStep === "analysis"}>
                <AnalysisStep experiment={active} store={store} />
              </StepPanel>
              <StepPanel visible={active.currentStep === "generation"}>
                <GenerationStep experiment={active} store={store} />
              </StepPanel>
              <StepPanel visible={active.currentStep === "execution"}>
                <ExecutionStep experiment={active} store={store} />
              </StepPanel>
              <StepPanel visible={active.currentStep === "report"}>
                <ReportStep experiment={active} store={store} />
              </StepPanel>
            </div>
          </>
        ) : (
          <EvalsWelcome onNewExperiment={() => setShowNewDialog(true)} />
        )}
      </div>

      <NewExperimentDialog
        open={showNewDialog}
        onConfirm={handleNewExperiment}
        onCancel={() => setShowNewDialog(false)}
      />

      <RerunConfirmDialog
        open={!!pendingRerunStep}
        stepName={pendingRerunStep || "analysis"}
        onConfirmRerun={handleConfirmRerun}
        onNavigateOnly={handleNavigateOnly}
        onCancel={() => setPendingRerunStep(null)}
      />
    </div>
  );
}

function StepPanel({ visible, children }: { visible: boolean; children: ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "auto",
        visibility: visible ? "visible" : "hidden",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {children}
    </div>
  );
}
