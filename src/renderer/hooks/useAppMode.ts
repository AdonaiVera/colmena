import { useCallback, useState } from "react";

type AppMode = "launcher" | "terminal";

export function useAppMode() {
  const [mode, setMode] = useState<AppMode>("launcher");

  const goToTerminal = useCallback(() => setMode("terminal"), []);
  const goToLauncher = useCallback(() => setMode("launcher"), []);

  return { mode, goToTerminal, goToLauncher };
}
