import { STEP_ORDER, STEP_LABELS, statusColor } from "../../../shared/eval-types";
import type { EvalStep, EvalStepId } from "../../../shared/eval-types";

interface EvalsTimelineProps {
  steps: EvalStep[];
  currentStep: EvalStepId;
  onStepClick: (stepId: EvalStepId) => void;
}

export function EvalsTimeline({ steps, currentStep, onStepClick }: EvalsTimelineProps) {
  return (
    <div
      className="titlebar-drag"
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        height: 52,
        borderBottom: "1px solid var(--border)",
        gap: 0,
      }}
    >
      {STEP_ORDER.map((stepId, index) => {
        const step = steps.find((s) => s.id === stepId);
        const isActive = stepId === currentStep;
        const color = step ? statusColor(step.status) : "var(--border)";

        return (
          <div key={stepId} style={{ display: "flex", alignItems: "center" }}>
            <button
              className="titlebar-no-drag"
              onClick={() => onStepClick(stepId)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                background: isActive ? "var(--surface-hover)" : "none",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                transition: "var(--transition)",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: color,
                  flexShrink: 0,
                  animation: step?.status === "running" ? "colmena-pulse 1.5s infinite" : "none",
                }}
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--text)" : "var(--text-muted)",
                }}
              >
                {STEP_LABELS[stepId]}
              </span>
            </button>
            {index < STEP_ORDER.length - 1 && (
              <div
                style={{
                  width: 24,
                  height: 1,
                  backgroundColor: "var(--border)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
