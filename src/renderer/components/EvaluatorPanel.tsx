import { useEffect, useRef } from "react";

import { EvaluatorActionBar } from "./EvaluatorActionBar";
import { EvaluatorLoadingView } from "./EvaluatorLoadingView";
import { useEvaluator } from "../hooks/useEvaluator";

interface EvaluatorPanelProps {
  open: boolean;
  onClose: () => void;
  sessionCwd: string;
  baseBranch?: string;
  sessionName: string;
  activeSessionId: string | null;
}

const statusLabel: Record<string, string> = {
  idle: "",
  loading: "Starting...",
  streaming: "Evaluating...",
  done: "Complete",
  error: "Error",
};

export function EvaluatorPanel({
  open,
  onClose,
  sessionCwd,
  baseBranch,
  sessionName,
  activeSessionId,
}: EvaluatorPanelProps) {
  const { status, output, error, start } = useEvaluator({ open, sessionCwd, baseBranch });
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoading = !output && !error && (status === "loading" || status === "streaming");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Evaluation</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{sessionName}</span>
          {statusLabel[status] && (
            <span
              style={{
                fontSize: 10,
                color: status === "error" ? "var(--error)" : "var(--accent)",
                fontWeight: 500,
              }}
            >
              {statusLabel[status]}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={start}
            disabled={status === "streaming" || status === "loading"}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "3px 10px",
              fontSize: 11,
              transition: "var(--transition)",
              opacity: status === "streaming" || status === "loading" ? 0.5 : 1,
            }}
          >
            Re-evaluate
          </button>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "3px 10px",
              fontSize: 11,
              transition: "var(--transition)",
            }}
          >
            Close
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "8px 12px", color: "var(--error)", fontSize: 12, flexShrink: 0 }}>
          {error}
        </div>
      )}

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: "auto",
          padding: "12px 16px",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 12,
          lineHeight: 1.6,
          color: "var(--text)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {isLoading ? <EvaluatorLoadingView /> : output}
      </div>

      {status === "done" && activeSessionId && output && (
        <EvaluatorActionBar
          output={output}
          activeSessionId={activeSessionId}
          onClose={onClose}
        />
      )}
    </div>
  );
}
