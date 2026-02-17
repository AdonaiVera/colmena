import { useEffect, useRef } from "react";

import type { Session, ActivityState } from "../../shared/types";

interface UseActivityDetectionOptions {
  sessions: Session[];
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
  onActivityChange?: (sessionId: string, prev: ActivityState, next: ActivityState) => void;
}

export function useActivityDetection({
  sessions,
  updateSession,
  onActivityChange,
}: UseActivityDetectionOptions) {
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;
  const callbackRef = useRef(onActivityChange);
  callbackRef.current = onActivityChange;

  useEffect(() => {
    const cleanup = window.colmena.pty.onActivity((sessionId, state) => {
      const session = sessionsRef.current.find((s) => s.id === sessionId);
      if (!session) return;

      const prev = session.activityState;
      if (prev === state) return;

      updateSession(sessionId, { activityState: state });
      callbackRef.current?.(sessionId, prev, state);
    });
    return () => {
      cleanup();
    };
  }, [updateSession]);
}
