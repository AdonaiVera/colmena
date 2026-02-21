import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import type { RunVariant } from "../../../shared/eval-types";

interface ExecutionRunViewerProps {
  scenarioPrompt: string;
  variant: RunVariant;
  status: string;
  transcript: string;
  onClose: () => void;
}

export function ExecutionRunViewer({
  scenarioPrompt,
  variant,
  status,
  transcript,
  onClose,
}: ExecutionRunViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const statusColor =
    status === "running"
      ? "var(--accent)"
      : status === "completed"
        ? "var(--success)"
        : status === "error"
          ? "var(--error)"
          : "var(--text-muted)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderLeft: "1px solid var(--border)",
        backgroundColor: "var(--bg)",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: statusColor,
                flexShrink: 0,
                animation: status === "running" ? "colmena-pulse 1.5s infinite" : "none",
              }}
            />
            <span
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                color: "var(--text-muted)",
                fontWeight: 600,
              }}
            >
              {variant === "with_tools" ? "With Tools" : "Baseline"} — {status}
            </span>
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text)",
              marginTop: 4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {scenarioPrompt}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: 4,
            flexShrink: 0,
          }}
        >
          <X size={16} />
        </button>
      </div>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: "auto",
          padding: 16,
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 12,
          lineHeight: 1.6,
          color: "var(--text)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {transcript || (
          status !== "running" ? <span style={{ color: "var(--text-muted)" }}>No transcript available.</span> : null
        )}
      </div>
    </div>
  );
}
