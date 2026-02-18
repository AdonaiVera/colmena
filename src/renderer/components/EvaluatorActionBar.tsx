import { useState } from "react";

interface EvaluatorActionBarProps {
  output: string;
  activeSessionId: string;
  onClose: () => void;
}

export function EvaluatorActionBar({ output, activeSessionId, onClose }: EvaluatorActionBarProps) {
  const [copied, setCopied] = useState(false);

  const handleSendToAgent = () => {
    const message = `Apply the following evaluation feedback to improve the code:\n\n${output}\n`;
    window.colmena.pty.write(activeSessionId, message + "\n");
    onClose();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const borderBtnStyle: React.CSSProperties = {
    background: "none",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    color: "var(--text-muted)",
    cursor: "pointer",
    padding: "4px 12px",
    fontSize: 11,
    transition: "var(--transition)",
  };

  return (
    <div
      style={{
        flexShrink: 0,
        borderTop: "1px solid var(--border)",
        padding: "8px 12px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span style={{ fontSize: 12, color: "var(--text-muted)", marginRight: "auto" }}>
        Apply feedback?
      </span>
      <button
        onClick={handleSendToAgent}
        style={{
          background: "var(--accent)",
          border: "none",
          borderRadius: "var(--radius)",
          color: "var(--bg)",
          cursor: "pointer",
          padding: "4px 12px",
          fontSize: 11,
          fontWeight: 600,
          transition: "var(--transition)",
        }}
      >
        Send to Agent
      </button>
      <button onClick={handleCopy} style={borderBtnStyle}>
        {copied ? "Copied!" : "Copy"}
      </button>
      <button onClick={onClose} style={borderBtnStyle}>
        Dismiss
      </button>
    </div>
  );
}
