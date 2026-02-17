import { useEffect, useRef, useState } from "react";

import { Terminal } from "./Terminal";
import { SplitDivider } from "./SplitDivider";
import { WelcomeScreen } from "./WelcomeScreen";
import { DiffPanel } from "./DiffPanel";
import type { Session } from "../../shared/types";

interface TerminalAreaProps {
  sessions: Session[];
  activeSessionId: string | null;
  restored: boolean;
  diffPanelOpen: boolean;
  diffPath?: string;
  activeBranch?: string;
  activeSessionName?: string;
  onCloseDiffPanel: () => void;
  onStatusChange: (sessionId: string, status: "running" | "exited") => void;
  onNewTab: () => void;
  splitOpen: boolean;
  splitRatio: number;
  onSplitDrag: (deltaY: number) => void;
  onSetContainerHeight: (h: number) => void;
}

export function TerminalArea({
  sessions,
  activeSessionId,
  restored,
  diffPanelOpen,
  diffPath,
  activeBranch,
  activeSessionName,
  onCloseDiffPanel,
  onStatusChange,
  onNewTab,
  splitOpen,
  splitRatio,
  onSplitDrag,
  onSetContainerHeight,
}: TerminalAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mountedSplits, setMountedSplits] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        onSetContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [onSetContainerHeight]);

  useEffect(() => {
    if (splitOpen && activeSessionId) {
      setMountedSplits((prev) => {
        if (prev.has(activeSessionId)) return prev;
        const next = new Set(prev);
        next.add(activeSessionId);
        return next;
      });
    }
  }, [splitOpen, activeSessionId]);

  const active = sessions.find((s) => s.id === activeSessionId);
  const mainHeight = splitOpen ? `${splitRatio * 100}%` : "100%";
  const splitHeight = splitOpen ? `${(1 - splitRatio) * 100}%` : "0%";

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
    >
      <div style={{ height: mainHeight, position: "relative", overflow: "hidden", flexShrink: 0 }}>
        {restored &&
          sessions.map((session) => (
            <Terminal
              key={session.id}
              sessionId={session.id}
              workingDir={session.workingDir}
              command={session.command}
              isActive={session.id === activeSessionId}
              onStatusChange={(status) => onStatusChange(session.id, status)}
            />
          ))}

        {restored && sessions.length === 0 && <WelcomeScreen onNewTab={onNewTab} />}

        {diffPath && activeBranch && (
          <DiffPanel
            open={diffPanelOpen}
            onClose={onCloseDiffPanel}
            worktreePath={diffPath}
            baseBranch={activeBranch}
            sessionName={activeSessionName || ""}
          />
        )}
      </div>

      {splitOpen && <SplitDivider onDrag={onSplitDrag} />}

      <div
        style={{
          height: splitHeight,
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {sessions.map((session) => {
          const splitId = `split-${session.id}`;
          if (!mountedSplits.has(session.id)) return null;
          return (
            <Terminal
              key={splitId}
              sessionId={splitId}
              workingDir={session.workingDir}
              isActive={splitOpen && session.id === activeSessionId}
            />
          );
        })}
      </div>
    </div>
  );
}
