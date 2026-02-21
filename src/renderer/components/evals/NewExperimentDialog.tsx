import { useCallback, useEffect, useState } from "react";

import { Dialog, DialogContent, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { FolderPicker } from "../FolderPicker";
import { getBaseName } from "../../lib/utils";
import { triggerStyle, labelStyle } from "../dialog-styles";

interface NewExperimentDialogProps {
  open: boolean;
  onConfirm: (name: string, workingDir: string) => void;
  onCancel: () => void;
}

const contentStyle: React.CSSProperties = {
  backgroundColor: "var(--surface)",
  border: "1px solid var(--border)",
  maxWidth: 460,
  padding: 0,
  gap: 0,
  borderRadius: 12,
};

const btnBase: React.CSSProperties = { fontSize: 13, height: 36, borderRadius: 8 };

export function NewExperimentDialog({ open, onConfirm, onCancel }: NewExperimentDialogProps) {
  const [name, setName] = useState("");
  const [workingDir, setWorkingDir] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setWorkingDir("");
    }
  }, [open]);

  const handleBrowse = useCallback(async () => {
    const folder = await window.colmena.dialog.openFolder();
    if (folder) {
      setWorkingDir(folder);
      if (!name) setName(getBaseName(folder));
    }
  }, [name]);

  const handleSubmit = useCallback(() => {
    if (!name.trim()) return;
    onConfirm(name.trim(), workingDir);
  }, [name, workingDir, onConfirm]);

  const folderName = workingDir ? getBaseName(workingDir) : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent showCloseButton={false} style={contentStyle}>
        <div style={{ padding: "28px 28px 0" }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
            New Experiment
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Configure an evaluation experiment
          </div>
        </div>

        <div style={{ padding: "20px 28px 0" }}>
          <label style={labelStyle}>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Experiment"
            style={{
              ...triggerStyle,
              outline: "none",
              transition: "border-color 150ms ease",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
        </div>

        <FolderPicker workingDir={workingDir} folderName={folderName} onBrowse={handleBrowse} />

        <DialogFooter
          style={{ padding: "16px 28px", borderTop: "1px solid var(--surface-hover)", gap: 10 }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            style={{ ...btnBase, borderColor: "var(--border)", color: "var(--text-secondary)", padding: "0 16px" }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!name.trim()}
            style={{
              ...btnBase,
              backgroundColor: "var(--accent)",
              color: "var(--bg)",
              fontWeight: 600,
              padding: "0 20px",
              opacity: name.trim() ? 1 : 0.5,
            }}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
