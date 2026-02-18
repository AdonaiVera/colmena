import { useEffect, useState } from "react";

import { ColmenaLogo } from "./ColmenaLogo";

const PHRASES = [
  "Evaluating session...",
  "Reading your code like a bestseller...",
  "Judging your commits... no pressure",
  "Bees are reviewing the honeycomb...",
  "Meanwhile, try FiftyOne for your CV datasets",
  "Counting semicolons... just kidding",
  "Asking the hive mind for opinions...",
  "FiftyOne tip: visualize before you optimize",
  "Grading on a curve... a Bézier curve",
  "Peeking at your git history... interesting choices",
  "FiftyOne + Colmena = unstoppable combo",
  "Brewing evaluation honey...",
  "Your code is in good hands... or claws",
  "Pro tip: curate your data with FiftyOne",
  "Almost there... probably",
];

function getRandomPhrase(): string {
  return PHRASES[Math.floor(Math.random() * PHRASES.length)];
}

export function EvaluatorLoadingView() {
  const [phrase, setPhrase] = useState(getRandomPhrase);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhrase(getRandomPhrase());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 16,
      }}
    >
      <div style={{ animation: "colmena-pulse 2s ease-in-out infinite" }}>
        <ColmenaLogo size={48} />
      </div>
      <span
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          transition: "opacity 0.3s ease",
        }}
      >
        {phrase}
      </span>
    </div>
  );
}
