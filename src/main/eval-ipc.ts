import { ipcMain, shell, type BrowserWindow } from "electron";

import { listExperiments, saveExperiment, deleteExperiment, getExperimentDir } from "./eval-store";
import { runAnalysis, abortAnalysis } from "./eval-analysis";
import { runGeneration, abortGeneration } from "./eval-generation";
import { runExecution, abortExecution, cleanupEvalWorktree } from "./eval-execution";
import { runEvaluation, abortEvaluation } from "./eval-evaluation";
import type {
  Experiment,
  DiscoveredComponent,
  EvalScenario,
  ExecutionRun,
  ExecutionMode,
} from "../shared/eval-types";

export function registerEvalIpcHandlers(window: BrowserWindow): void {
  ipcMain.handle("eval:listExperiments", () => {
    return listExperiments();
  });

  ipcMain.handle("eval:saveExperiment", (_event, experiment: Experiment) => {
    saveExperiment(experiment);
  });

  ipcMain.handle(
    "eval:deleteExperiment",
    async (_event, experimentId: string, workingDir?: string) => {
      if (workingDir) await cleanupEvalWorktree(workingDir, experimentId).catch(() => {});
      deleteExperiment(experimentId);
    },
  );

  ipcMain.handle("eval:analysis:start", async (_event, workingDir: string) => {
    return runAnalysis(window, workingDir);
  });

  ipcMain.handle(
    "eval:generation:start",
    async (_event, components: DiscoveredComponent[], workingDir: string) => {
      return runGeneration(window, components, workingDir);
    },
  );

  ipcMain.handle(
    "eval:execution:start",
    async (
      _event,
      scenarios: EvalScenario[],
      workingDir: string,
      experimentId: string,
      mode: ExecutionMode,
    ) => {
      return runExecution(window, scenarios, workingDir, experimentId, mode);
    },
  );

  ipcMain.handle(
    "eval:evaluation:start",
    async (
      _event,
      experimentId: string,
      scenarios: EvalScenario[],
      runs: ExecutionRun[],
      components: DiscoveredComponent[],
    ) => {
      return runEvaluation(window, experimentId, scenarios, runs, components);
    },
  );

  ipcMain.handle("eval:openLogsFolder", (_event, experimentId: string) => {
    const dir = getExperimentDir(experimentId);
    shell.openPath(dir);
  });

  ipcMain.on("eval:abort", () => {
    abortAnalysis();
    abortGeneration();
    abortExecution();
    abortEvaluation();
  });
}
