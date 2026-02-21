import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import type { DiscoveredComponent } from "../../../shared/eval-types";

interface AnalysisComponentListProps {
  components: DiscoveredComponent[];
  onToggle: (componentId: string) => void;
  onToggleGroup: (type: string, selected: boolean) => void;
}

const TYPE_LABELS: Record<string, string> = {
  hook: "Hooks",
  mcp_server: "MCP Servers",
  slash_command: "Slash Commands",
  skill: "Skills",
  tool: "Tools",
};

const TYPE_ORDER = ["hook", "mcp_server", "skill", "slash_command", "tool"];

function GroupHeader({
  label,
  count,
  selectedCount,
  expanded,
  onToggleExpand,
  onToggleAll,
}: {
  label: string;
  count: number;
  selectedCount: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleAll: () => void;
}) {
  const allSelected = selectedCount === count;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 16px",
        cursor: "pointer",
        borderBottom: expanded ? "1px solid var(--border)" : "none",
        userSelect: "none",
      }}
      onClick={onToggleExpand}
    >
      {expanded ? (
        <ChevronDown size={14} color="var(--text-muted)" />
      ) : (
        <ChevronRight size={14} color="var(--text-muted)" />
      )}
      <input
        type="checkbox"
        checked={allSelected}
        ref={(el) => { if (el) el.indeterminate = selectedCount > 0 && !allSelected; }}
        onChange={(e) => { e.stopPropagation(); onToggleAll(); }}
        onClick={(e) => e.stopPropagation()}
        style={{ accentColor: "var(--accent)" }}
      />
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", flex: 1 }}>
        {label}
      </span>
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
        {selectedCount}/{count}
      </span>
    </div>
  );
}

export function AnalysisComponentList({
  components,
  onToggle,
  onToggleGroup,
}: AnalysisComponentListProps) {
  const grouped = TYPE_ORDER.map((type) => ({
    type,
    label: TYPE_LABELS[type] || type,
    items: components.filter((c) => c.type === type),
  })).filter((g) => g.items.length > 0);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(grouped.map((g) => [g.type, true])),
  );

  if (components.length === 0) {
    return (
      <div style={{ padding: 24, color: "var(--text-muted)", fontSize: 13 }}>
        No components discovered. Run analysis to scan your workspace.
      </div>
    );
  }

  return (
    <div style={{ padding: "12px 0" }}>
      {grouped.map((group) => {
        const selectedCount = group.items.filter((c) => c.selected).length;
        const isExpanded = expanded[group.type] ?? true;

        return (
          <div
            key={group.type}
            style={{
              margin: "0 16px 8px",
              border: "1px solid var(--border)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <GroupHeader
              label={group.label}
              count={group.items.length}
              selectedCount={selectedCount}
              expanded={isExpanded}
              onToggleExpand={() =>
                setExpanded((prev) => ({ ...prev, [group.type]: !prev[group.type] }))
              }
              onToggleAll={() => onToggleGroup(group.type, selectedCount < group.items.length)}
            />
            {isExpanded &&
              group.items.map((comp) => (
                <label
                  key={comp.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "8px 16px 8px 40px",
                    cursor: "pointer",
                    transition: "var(--transition)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={comp.selected}
                    onChange={() => onToggle(comp.id)}
                    style={{ marginTop: 2, accentColor: "var(--accent)" }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
                      {comp.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginTop: 2,
                        lineHeight: 1.4,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {comp.description}
                    </div>
                  </div>
                </label>
              ))}
          </div>
        );
      })}
    </div>
  );
}
