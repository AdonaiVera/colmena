import { useCallback, useEffect, useRef, useState } from "react";

import type { ActivityState } from "../../shared/types";

interface UseNotificationsOptions {
  activeSessionId: string | null;
}

function playBeeSound(): void {
  const ctx = new AudioContext();
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.15, now);
  master.connect(ctx.destination);

  function buzz(t: number, dur: number, freq: number): OscillatorNode {
    const carrier = ctx.createOscillator();
    carrier.type = "sine";
    carrier.frequency.setValueAtTime(freq, t);
    carrier.frequency.linearRampToValueAtTime(freq + 15, t + dur);

    const wingBeat = ctx.createOscillator();
    wingBeat.frequency.setValueAtTime(125, t);
    const modDepth = ctx.createGain();
    modDepth.gain.setValueAtTime(0.35, t);
    wingBeat.connect(modDepth);

    const am = ctx.createGain();
    am.gain.setValueAtTime(0.5, t);
    modDepth.connect(am.gain);
    carrier.connect(am);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(1, t + 0.02);
    env.gain.setValueAtTime(1, t + dur - 0.03);
    env.gain.linearRampToValueAtTime(0, t + dur);

    am.connect(env);
    env.connect(master);

    carrier.start(t);
    wingBeat.start(t);
    carrier.stop(t + dur);
    wingBeat.stop(t + dur);
    return carrier;
  }

  buzz(now, 0.12, 195);
  const last = buzz(now + 0.19, 0.14, 215);
  last.onended = () => ctx.close();
}

export function useNotifications({ activeSessionId }: UseNotificationsOptions) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  const activeIdRef = useRef(activeSessionId);
  activeIdRef.current = activeSessionId;

  useEffect(() => {
    window.colmena.settings.getSoundEnabled().then(setSoundEnabled);
  }, []);

  const toggleSound = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled);
    window.colmena.settings.setSoundEnabled(enabled);
  }, []);

  const handleActivityChange = useCallback(
    (sessionId: string, _prev: ActivityState, next: ActivityState) => {
      if (next !== "needs_input") return;

      const isActiveAndFocused = sessionId === activeIdRef.current && document.hasFocus();
      if (isActiveAndFocused) return;

      if (soundEnabledRef.current) {
        playBeeSound();
      }
    },
    [],
  );

  return { soundEnabled, toggleSound, handleActivityChange };
}
