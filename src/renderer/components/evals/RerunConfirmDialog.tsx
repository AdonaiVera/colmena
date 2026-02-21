import { Dialog, DialogContent, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { STEP_LABELS } from "../../../shared/eval-types";
import type { EvalStepId } from "../../../shared/eval-types";

interface RerunConfirmDialogProps {
  open: boolean;
  stepName: EvalStepId;
  onConfirmRerun: () => void;
  onNavigateOnly: () => void;
  onCancel: () => void;
}

const contentStyle: React.CSSProperties = {
  backgroundColor: "var(--surface)",
  border: "1px solid var(--border)",
  maxWidth: 420,
  padding: 0,
  gap: 0,
  borderRadius: 12,
};

const btnBase: React.CSSProperties = { fontSize: 13, height: 36, borderRadius: 8 };

export function RerunConfirmDialog({
  open,
  stepName,
  onConfirmRerun,
  onNavigateOnly,
  onCancel,
}: RerunConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent showCloseButton={false} style={contentStyle}>
        <div style={{ padding: "28px 28px 16px" }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
            Re-run {STEP_LABELS[stepName]}?
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Re-running this step will clear all downstream data (scenarios, runs, and reports generated after this step). You can also just view the step without clearing.
          </div>
        </div>
        <DialogFooter
          style={{ padding: "16px 28px", borderTop: "1px solid var(--surface-hover)", gap: 8 }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            style={{ ...btnBase, borderColor: "var(--border)", color: "var(--text-secondary)", padding: "0 14px" }}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateOnly}
            style={{ ...btnBase, borderColor: "var(--border)", color: "var(--text)", padding: "0 14px" }}
          >
            Just View
          </Button>
          <Button
            size="sm"
            onClick={onConfirmRerun}
            style={{
              ...btnBase,
              backgroundColor: "var(--accent)",
              color: "var(--bg)",
              fontWeight: 600,
              padding: "0 16px",
            }}
          >
            Re-run & Clear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
