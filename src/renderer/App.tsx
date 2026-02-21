import { useAppMode } from "./hooks/useAppMode";
import { LandingScreen } from "./components/LandingScreen";
import { TerminalMode } from "./components/TerminalMode";
import { EvalsApp } from "./components/evals/EvalsApp";

export function App() {
  const { mode, goToTerminal, goToEvals, goToLauncher } = useAppMode();

  if (mode === "launcher") {
    return <LandingScreen onSelectTerminal={goToTerminal} onSelectEvals={goToEvals} />;
  }

  if (mode === "evals") {
    return <EvalsApp onBack={goToLauncher} />;
  }

  return <TerminalMode onBack={goToLauncher} />;
}
