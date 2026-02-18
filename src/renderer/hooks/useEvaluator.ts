import { useCallback, useEffect, useRef, useState } from "react";

import type { EvaluatorStatus } from "../../shared/types";

interface UseEvaluatorOptions {
  open: boolean;
  sessionCwd: string;
  baseBranch?: string;
}

export function useEvaluator({ open, sessionCwd, baseBranch }: UseEvaluatorOptions) {
  const [status, setStatus] = useState<EvaluatorStatus>("idle");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  const start = useCallback(async () => {
    if (statusRef.current === "streaming" || statusRef.current === "loading") return;
    setStatus("loading");
    setOutput("");
    setError(null);

    const result = await window.colmena.evaluator.start(sessionCwd, baseBranch);
    if (result.error) {
      setError(result.error);
      setStatus("error");
      return;
    }
    setStatus("streaming");
  }, [sessionCwd, baseBranch]);

  const reset = useCallback(() => {
    setStatus("idle");
    setOutput("");
    setError(null);
  }, []);

  const abort = useCallback(() => {
    window.colmena.evaluator.abort();
    setStatus("idle");
  }, []);

  useEffect(() => {
    const removeData = window.colmena.evaluator.onData((chunk) => {
      setOutput((prev) => prev + chunk);
    });

    const removeDone = window.colmena.evaluator.onDone((err) => {
      if (err) {
        setError(err);
        setStatus("error");
      } else {
        setStatus("done");
      }
    });

    return () => {
      removeData();
      removeDone();
    };
  }, []);

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      reset();
    }
    prevOpenRef.current = open;
  }, [open, reset]);

  useEffect(() => {
    if (open && statusRef.current === "idle") {
      start();
    }
  }, [open, start]);

  useEffect(() => {
    if (!open && statusRef.current === "streaming") {
      abort();
    }
  }, [open, abort]);

  return { status, output, error, start, abort };
}
