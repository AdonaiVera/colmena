import { useCallback, useEffect, useRef } from "react";

interface UsePtyOptions {
  sessionId: string;
  onData: (data: string) => void;
  onExit: (exitCode: number) => void;
}

export function usePty({ sessionId, onData, onExit }: UsePtyOptions) {
  const onDataRef = useRef(onData);
  const onExitRef = useRef(onExit);
  onDataRef.current = onData;
  onExitRef.current = onExit;

  useEffect(() => {
    const removeDataListener = window.colmena.pty.onData(
      (id: string, data: string) => {
        if (id === sessionId) {
          onDataRef.current(data);
        }
      }
    );

    const removeExitListener = window.colmena.pty.onExit(
      (id: string, exitCode: number) => {
        if (id === sessionId) {
          onExitRef.current(exitCode);
        }
      }
    );

    return () => {
      removeDataListener();
      removeExitListener();
    };
  }, [sessionId]);

  const spawn = useCallback(
    (
      cols: number,
      rows: number,
      workingDir?: string,
      command?: string
    ) => {
      window.colmena.pty.create({
        sessionId,
        cols,
        rows,
        workingDir,
        command,
      });
    },
    [sessionId]
  );

  const write = useCallback(
    (data: string) => {
      window.colmena.pty.write(sessionId, data);
    },
    [sessionId]
  );

  const resize = useCallback(
    (cols: number, rows: number) => {
      window.colmena.pty.resize(sessionId, cols, rows);
    },
    [sessionId]
  );

  const destroy = useCallback(() => {
    window.colmena.pty.destroy(sessionId);
  }, [sessionId]);

  return { spawn, write, resize, destroy };
}
