import { useCallback, useEffect, useState } from "react";

import { Dialog, DialogContent, DialogFooter } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { FolderPicker } from "./FolderPicker";
import { BranchPicker, NEW_BRANCH_VALUE } from "./BranchPicker";
import { getBaseName } from "../lib/utils";
import { triggerStyle, dropdownStyle, labelStyle, itemStyle } from "../lib/dialog-styles";
import type { ClaudeMode, ClaudeModel } from "../../shared/types";
import { CLAUDE_MODES, CLAUDE_MODELS } from "../../shared/types";

interface NewTabConfig {
  workingDir: string;
  mode: ClaudeMode;
  model: ClaudeModel;
  existingBranch?: string;
}

interface NewSessionDialogProps {
  open: boolean;
  loading?: boolean;
  onConfirm: (config: NewTabConfig) => void;
  onCancel: () => void;
}

export function NewSessionDialog({ open, loading, onConfirm, onCancel }: NewSessionDialogProps) {
  const [mode, setMode] = useState<ClaudeMode>("new");
  const [model, setModel] = useState<ClaudeModel>("default");
  const [workingDir, setWorkingDir] = useState("");
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState(NEW_BRANCH_VALUE);

  useEffect(() => {
    if (open) {
      setMode("new");
      setModel("default");
      setWorkingDir("");
      setBranches([]);
      setSelectedBranch(NEW_BRANCH_VALUE);
    }
  }, [open]);

  useEffect(() => {
    if (!workingDir) {
      setBranches([]);
      setSelectedBranch(NEW_BRANCH_VALUE);
      return;
    }
    let stale = false;
    window.colmena.git.listBranches(workingDir).then((result) => {
      if (!stale) {
        setBranches(result);
        setSelectedBranch(NEW_BRANCH_VALUE);
      }
    });
    return () => {
      stale = true;
    };
  }, [workingDir]);

  const handleSubmit = useCallback(() => {
    const existingBranch = selectedBranch !== NEW_BRANCH_VALUE ? selectedBranch : undefined;
    onConfirm({ workingDir, mode, model, existingBranch });
  }, [workingDir, mode, model, selectedBranch, onConfirm]);

  const handleBrowse = useCallback(async () => {
    const folder = await window.colmena.dialog.openFolder();
    if (folder) setWorkingDir(folder);
  }, []);

  const folderName = workingDir ? getBaseName(workingDir) : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent
        showCloseButton={false}
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          maxWidth: 460,
          padding: 0,
          gap: 0,
          borderRadius: 12,
        }}
      >
        <div style={{ padding: "28px 28px 0" }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
            New Tab
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Open a Claude Code session</div>
        </div>

        <FolderPicker workingDir={workingDir} folderName={folderName} onBrowse={handleBrowse} />

        <div style={{ padding: "0 28px 20px", display: "flex", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <Label style={labelStyle}>Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as ClaudeMode)}>
              <SelectTrigger style={triggerStyle}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ ...dropdownStyle, minWidth: 200 }}>
                {CLAUDE_MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value} description={m.desc} style={itemStyle}>
                    <span style={{ color: "var(--text)", fontSize: 13 }}>{m.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div style={{ flex: 1 }}>
            <Label style={labelStyle}>Model</Label>
            <Select value={model} onValueChange={(v) => setModel(v as ClaudeModel)}>
              <SelectTrigger style={triggerStyle}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ ...dropdownStyle, minWidth: 180 }}>
                {CLAUDE_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value} style={itemStyle}>
                    <span style={{ color: "var(--text)" }}>{m.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {mode === "new" && workingDir && (
          <BranchPicker
            branches={branches}
            selectedBranch={selectedBranch}
            onSelectBranch={setSelectedBranch}
          />
        )}

        <DialogFooter
          style={{ padding: "16px 28px", borderTop: "1px solid var(--surface-hover)", gap: 10 }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={loading}
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
            onClick={handleSubmit}
            disabled={loading}
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--bg)",
              fontSize: 13,
              fontWeight: 600,
              height: 36,
              padding: "0 20px",
              borderRadius: 8,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Setting up..." : "Open"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
