import { Dialog, DialogContent, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";

interface CloseSessionDialogProps {
  open: boolean;
  sessionName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CloseSessionDialog({
  open,
  sessionName,
  onConfirm,
  onCancel,
}: CloseSessionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent
        showCloseButton={false}
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          maxWidth: 400,
          padding: 0,
          gap: 0,
          borderRadius: 12,
        }}
      >
        <div style={{ padding: "28px 28px 0" }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
            Close session?
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
            This will terminate <strong style={{ color: "var(--text)" }}>{sessionName}</strong> and
            destroy its PTY. You can pick up where you left off by opening a new tab with Resume
            mode.
          </div>
        </div>

        <DialogFooter
          style={{ padding: "16px 28px", borderTop: "1px solid var(--surface-hover)", gap: 10 }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
              fontSize: 13,
              height: 36,
              padding: "0 16px",
              borderRadius: 8,
            }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            style={{
              backgroundColor: "var(--error)",
              color: "var(--bg)",
              fontSize: 13,
              fontWeight: 600,
              height: 36,
              padding: "0 20px",
              borderRadius: 8,
            }}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
