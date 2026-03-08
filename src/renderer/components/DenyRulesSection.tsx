import { useState } from "react";
import { Trash2 } from "lucide-react";

interface DenyRulesSectionProps {
  rules: string[];
  onAdd: (rule: string) => void;
  onRemove: (index: number) => void;
}

const QUICK_RULES = [
  { label: "git push", rule: "Bash(git push*)" },
  { label: "git commit", rule: "Bash(git commit*)" },
  { label: "rm -rf", rule: "Bash(rm -rf*)" },
  { label: ".env files", rule: "Read(./.env*)" },
];

const chipStyle: React.CSSProperties = {
  padding: "3px 10px",
  fontSize: 11,
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--text-muted)",
  cursor: "pointer",
  transition: "var(--transition)",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  height: 34,
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid var(--border)",
  backgroundColor: "var(--bg)",
  color: "var(--text)",
  padding: "0 10px",
  outline: "none",
  fontFamily: "var(--font-mono)",
};

const addBtnStyle: React.CSSProperties = {
  height: 34,
  padding: "0 14px",
  fontSize: 12,
  fontWeight: 500,
  borderRadius: 8,
  border: "1px solid var(--border)",
  backgroundColor: "transparent",
  color: "var(--text-muted)",
  cursor: "pointer",
  transition: "var(--transition)",
};

export function DenyRulesSection({ rules, onAdd, onRemove }: DenyRulesSectionProps) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInput("");
  };

  const activeRuleSet = new Set(rules);
  const availableChips = QUICK_RULES.filter((q) => !activeRuleSet.has(q.rule));

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Deny Rules</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          Block specific tool patterns from being used
        </div>
      </div>

      {availableChips.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {availableChips.map((q) => (
            <button
              key={q.rule}
              style={chipStyle}
              onClick={() => onAdd(q.rule)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              + {q.label}
            </button>
          ))}
        </div>
      )}

      {rules.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
          {rules.map((rule, i) => (
            <div
              key={`${rule}-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderRadius: 8,
                backgroundColor: "var(--bg)",
                border: "1px solid var(--border)",
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {rule}
              </span>
              <button
                onClick={() => onRemove(i)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: 2,
                  flexShrink: 0,
                  transition: "var(--transition)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--error)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="e.g. Bash(docker rm*)"
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          style={{ ...addBtnStyle, opacity: input.trim() ? 1 : 0.4 }}
          onMouseEnter={(e) => {
            if (input.trim()) {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
