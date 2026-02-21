import { useCallback, useState } from "react";

import type { AppMode } from "../../shared/eval-types";

export function useAppMode() {
  const [mode, setMode] = useState<AppMode>("launcher");

  const goToTerminal = useCallback(() => setMode("terminal"), []);
  const goToEvals = useCallback(() => setMode("evals"), []);
  const goToLauncher = useCallback(() => setMode("launcher"), []);

  return { mode, goToTerminal, goToEvals, goToLauncher };
}
