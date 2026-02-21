import Store from "electron-store";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import os from "os";

import type { Experiment, EvalReport } from "../shared/eval-types";

interface EvalStoreSchema {
  experiments: Experiment[];
}

const store = new Store<EvalStoreSchema>({
  name: "colmena-evals",
  defaults: { experiments: [] },
});

const EVALS_DIR = join(os.homedir(), ".colmena", "evals");

function ensureEvalsDir(): void {
  mkdirSync(EVALS_DIR, { recursive: true });
}

export function listExperiments(): Experiment[] {
  return store.get("experiments", []);
}

export function saveExperiment(experiment: Experiment): void {
  const experiments = listExperiments();
  const idx = experiments.findIndex((e) => e.id === experiment.id);
  if (idx >= 0) {
    experiments[idx] = experiment;
  } else {
    experiments.push(experiment);
  }
  store.set("experiments", experiments);
}

export function deleteExperiment(experimentId: string): void {
  const experiments = listExperiments().filter((e) => e.id !== experimentId);
  store.set("experiments", experiments);
  const expDir = join(EVALS_DIR, experimentId);
  if (existsSync(expDir)) {
    rmSync(expDir, { recursive: true, force: true });
  }
}

export function saveTranscript(experimentId: string, runId: string, transcript: string): void {
  ensureEvalsDir();
  const runsDir = join(EVALS_DIR, experimentId, "runs");
  mkdirSync(runsDir, { recursive: true });
  writeFileSync(join(runsDir, `${runId}.txt`), transcript, "utf-8");
}

export function saveConversationLog(experimentId: string, runId: string, log: string): void {
  ensureEvalsDir();
  const logsDir = join(EVALS_DIR, experimentId, "logs");
  mkdirSync(logsDir, { recursive: true });
  writeFileSync(join(logsDir, `${runId}.md`), log, "utf-8");
}

export function getExperimentDir(experimentId: string): string {
  return join(EVALS_DIR, experimentId);
}

export function loadTranscript(experimentId: string, runId: string): string {
  const filePath = join(EVALS_DIR, experimentId, "runs", `${runId}.txt`);
  if (!existsSync(filePath)) return "";
  return readFileSync(filePath, "utf-8");
}

export function saveReport(experimentId: string, report: EvalReport): void {
  ensureEvalsDir();
  const expDir = join(EVALS_DIR, experimentId);
  mkdirSync(expDir, { recursive: true });
  writeFileSync(join(expDir, "report.json"), JSON.stringify(report, null, 2), "utf-8");
}

