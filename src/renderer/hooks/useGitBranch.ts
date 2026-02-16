import { useEffect, useRef } from "react";

import { GIT_BRANCH_POLL_INTERVAL } from "../lib/config";
import type { Session } from "../../shared/types";

interface UseGitBranchOptions {
  sessions: Session[];
  updateSession: (id: string, updates: Partial<Session>) => void;
}

export function useGitBranch({ sessions, updateSession }: UseGitBranchOptions) {
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;

  useEffect(() => {
    const poll = async () => {
      for (const session of sessionsRef.current) {
        const dir = session.worktreePath || session.workingDir;
        if (!dir || session.status === "exited") continue;
        const branch = await window.colmena.git.getBranch(dir);
        if (branch && branch !== session.gitBranch) {
          updateSession(session.id, { gitBranch: branch });
        }
      }
    };

    poll();
    const interval = setInterval(poll, GIT_BRANCH_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [updateSession]);
}
