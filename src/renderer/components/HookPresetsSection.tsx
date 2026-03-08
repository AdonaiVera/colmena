import { HOOK_PRESETS } from "../../shared/hook-presets";
import { Switch } from "./ui/switch";

interface HookPresetsSectionProps {
  presets: Record<string, boolean>;
  onToggle: (id: string) => void;
}

const CATEGORIES = [
  { key: "safety" as const, label: "Safety" },
  { key: "quality" as const, label: "Quality" },
  { key: "notifications" as const, label: "Notifications" },
];

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "7px 10px",
  borderRadius: 8,
  transition: "var(--transition)",
};

const categoryStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  padding: "10px 0 4px",
};

export function HookPresetsSection({ presets, onToggle }: HookPresetsSectionProps) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>
        Hook Presets
      </div>

      {CATEGORIES.map((cat) => {
        const items = HOOK_PRESETS.filter((p) => p.category === cat.key);
        if (items.length === 0) return null;
        return (
          <div key={cat.key}>
            <div style={categoryStyle}>{cat.label}</div>
            {items.map((preset) => (
              <div
                key={preset.id}
                style={rowStyle}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--surface-hover)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                  <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 500 }}>
                    {preset.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginTop: 1,
                    }}
                  >
                    {preset.description}
                  </div>
                </div>
                <Switch
                  checked={!!presets[preset.id]}
                  onCheckedChange={() => onToggle(preset.id)}
                  style={{ flexShrink: 0 }}
                />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
