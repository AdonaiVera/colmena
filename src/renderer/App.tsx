import { useAppMode } from "./hooks/useAppMode";
import { LandingScreen } from "./components/LandingScreen";
import { TerminalMode } from "./components/TerminalMode";

export function App() {
  const { mode, goToTerminal, goToLauncher } = useAppMode();

  if (mode === "launcher") {
    return <LandingScreen onSelectTerminal={goToTerminal} />;
  }

  return <TerminalMode onBack={goToLauncher} />;
}
