import { spawn } from "child_process";
import type { BrowserWindow } from "electron";

import { getLoginShellPath } from "./pty-manager";
import { runPipeEval, abortAllRuns } from "./eval-pty-runner";
import { setupEvalWorktree, cleanupEvalWorktree } from "./eval-worktree";
import type { EvalScenario, ExecutionRun, ExecutionMode, RunVariant } from "../shared/eval-types";

const MAX_CONCURRENT = 3;
const WARMUP_TIMEOUT_MS = 600_000;
let aborted = false;

type Task = { scenario: EvalScenario; variant: RunVariant };

function warmupClaude(cwd: string): Promise<void> {
  return new Promise((resolve) => {
    const env = { ...process.env, PATH: getLoginShellPath() };
    delete env.CLAUDECODE;
    const child = spawn(
      'claude -p --output-format json --dangerously-skip-permissions',
      [],
      { env, stdio: ["pipe", "pipe", "pipe"], shell: true, cwd },
    );
    const timeout = setTimeout(() => { child.kill(); resolve(); }, WARMUP_TIMEOUT_MS);
    child.on("close", () => { clearTimeout(timeout); resolve(); });
    child.on("error", () => { clearTimeout(timeout); resolve(); });
    child.stdin?.write("Reply with just the word OK");
    child.stdin?.end();
  });
}

async function runQueue(
  win: BrowserWindow,
  tasks: Task[],
  workingDir: string,
  experimentId: string,
  concurrency: number,
): Promise<ExecutionRun[]> {
  const results: ExecutionRun[] = [];
  let idx = 0;

  async function next(): Promise<void> {
    if (aborted || idx >= tasks.length) return;
    const task = tasks[idx++];
    const run = await runPipeEval(win, task.scenario, task.variant, workingDir, experimentId);
    results.push(run);
    return next();
  }

  const workers = Array.from(
    { length: Math.min(concurrency, tasks.length) },
    () => next(),
  );
  await Promise.all(workers);
  return results;
}

export async function runExecution(
  win: BrowserWindow,
  scenarios: EvalScenario[],
  workingDir: string,
  experimentId: string,
  mode: ExecutionMode = "parallel",
): Promise<{ runs: ExecutionRun[] }> {
  aborted = false;

  const worktree = await setupEvalWorktree(workingDir, experimentId);
  const evalCwd = worktree.success ? worktree.worktreePath : workingDir;

  if (!win.isDestroyed()) {
    win.webContents.send("eval:execution:runStatus", "warmup", "running", "Warming up Claude Code (initializing MCP servers)...");
  }
  await warmupClaude(evalCwd);

  if (aborted) return { runs: [] };

  const tasks: Task[] = [];
  for (const s of scenarios.filter((s) => s.enabled)) {
    tasks.push({ scenario: s, variant: "with_tools" });
    tasks.push({ scenario: s, variant: "without_tools" });
  }

  const concurrency = mode === "sequential" ? 1 : MAX_CONCURRENT;
  return { runs: await runQueue(win, tasks, evalCwd, experimentId, concurrency) };
}

export function abortExecution(): void {
  aborted = true;
  abortAllRuns();
}

export { cleanupEvalWorktree };
