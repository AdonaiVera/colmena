import { useCallback, useRef, useState } from "react";

interface SplitTerminalState {
  open: boolean;
  splitRatio: number;
}

export function useSplitTerminal() {
  const [state, setState] = useState<SplitTerminalState>({
    open: false,
    splitRatio: 0.65,
  });
  const containerHeight = useRef(0);

  const toggle = useCallback(() => {
    setState((prev) => ({ ...prev, open: !prev.open }));
  }, []);

  const handleDrag = useCallback((deltaY: number) => {
    setState((prev) => {
      const h = containerHeight.current;
      if (h <= 0) return prev;
      const newRatio = Math.min(0.8, Math.max(0.2, prev.splitRatio + deltaY / h));
      return { ...prev, splitRatio: newRatio };
    });
  }, []);

  const setContainerHeight = useCallback((h: number) => {
    containerHeight.current = h;
  }, []);

  return {
    isOpen: state.open,
    splitRatio: state.splitRatio,
    toggle,
    handleDrag,
    setContainerHeight,
  };
}
