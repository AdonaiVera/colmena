import { Dialog, DialogContent, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { useClaudeSettings } from "../hooks/useClaudeSettings";
import { DenyRulesSection } from "./DenyRulesSection";
import { HookPresetsSection } from "./HookPresetsSection";
import { CustomHooksSection } from "./CustomHooksSection";
import type { HooksScope } from "../../shared/types";

interface HooksDialogProps {
  open: boolean;
  onClose: () => void;
  projectDir?: string;
}

const contentStyle: React.CSSProperties = {
  backgroundColor: "var(--surface)",
  border: "1px solid var(--border)",
  maxWidth: 520,
  padding: 0,
  gap: 0,
  borderRadius: 12,
};

const scopeBtn = (active: boolean, disabled?: boolean): React.CSSProperties => ({
  padding: "4px 12px",
  fontSize: 12,
  borderRadius: 6,
  border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
  backgroundColor: active ? "var(--accent)" : "transparent",
  color: active ? "var(--bg)" : "var(--text-muted)",
  cursor: disabled ? "not-allowed" : "pointer",
  fontWeight: active ? 600 : 400,
  transition: "var(--transition)",
  opacity: disabled ? 0.4 : 1,
});

const cancelBtn: React.CSSProperties = {
  fontSize: 13,
  height: 36,
  borderRadius: 8,
  borderColor: "var(--border)",
  color: "var(--text-secondary)",
  padding: "0 16px",
};

const saveBtn = (dirty: boolean): React.CSSProperties => ({
  fontSize: 13,
  height: 36,
  borderRadius: 8,
  backgroundColor: "var(--accent)",
  color: "var(--bg)",
  fontWeight: 600,
  padding: "0 20px",
  opacity: dirty ? 1 : 0.5,
});

const dividerStyle: React.CSSProperties = {
  height: 1,
  backgroundColor: "var(--border)",
  margin: "16px 0",
};

export function HooksDialog({ open, onClose, projectDir }: HooksDialogProps) {
  const settings = useClaudeSettings(projectDir);

  const handleSave = () => {
    settings.save();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton={false} style={contentStyle}>
        <div style={{ padding: "24px 24px 0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>Hooks & Rules</div>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                style={scopeBtn(settings.scope === "user")}
                onClick={() => settings.setScope("user" as HooksScope)}
              >
                User
              </button>
              <button
                style={scopeBtn(settings.scope === "project", !projectDir)}
                onClick={() => projectDir && settings.setScope("project" as HooksScope)}
                disabled={!projectDir}
                title={!projectDir ? "Open a session to use project scope" : undefined}
              >
                Project
              </button>
            </div>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Configure Claude Code hooks and permissions
          </div>
        </div>

        {settings.loaded && (
          <div
            style={{
              padding: "16px 24px 0",
              overflowY: "auto",
              maxHeight: "calc(70vh - 140px)",
            }}
          >
            <DenyRulesSection
              rules={settings.denyRules}
              onAdd={settings.addDenyRule}
              onRemove={settings.removeDenyRule}
            />
            <div style={dividerStyle} />
            <HookPresetsSection presets={settings.presets} onToggle={settings.togglePreset} />
            <div style={dividerStyle} />
            <CustomHooksSection
              customHooks={settings.customHooks}
              onAdd={settings.addCustomHook}
              onRemove={settings.removeCustomHook}
            />
          </div>
        )}

        <DialogFooter
          style={{ padding: "16px 24px", borderTop: "1px solid var(--surface-hover)", gap: 10 }}
        >
          <Button variant="outline" size="sm" onClick={onClose} style={cancelBtn}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!settings.dirty}
            style={saveBtn(settings.dirty)}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
