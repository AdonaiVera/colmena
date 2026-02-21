import { type ChildProcess } from "child_process";
import os from "os";
import crypto from "crypto";
import type { BrowserWindow } from "electron";

import { saveTranscript, saveConversationLog } from "./eval-store";
import { askPersona } from "./eval-persona";
import { runClaudeTurn, appendLine, getText, type LiveTranscript, type TurnResult } from "./eval-claude-turn";
import type { EvalScenario, ExecutionRun, RunVariant, ToolInvocation } from "../shared/eval-types";

const MAX_TURNS = 10;

let activeProcesses: ChildProcess[] = [];

function send(win: BrowserWindow, ch: string, ...args: unknown[]) {
  if (!win.isDestroyed()) win.webContents.send(ch, ...args);
}

function wrapPrompt(prompt: string): string {
  return `Complete this task autonomously. If you need info, make reasonable assumptions. TASK: ${prompt}`;
}

function ts(): string {
  return new Date().toISOString().slice(11, 19);
}

export function abortAllRuns(): void {
  for (const p of activeProcesses) { try { p.kill(); } catch {} }
  activeProcesses = [];
}

export async function runPipeEval(
  win: BrowserWindow,
  scenario: EvalScenario,
  variant: RunVariant,
  workingDir: string,
  experimentId: string,
): Promise<ExecutionRun> {
  const runId = crypto.randomUUID();
  const startTime = Date.now();
  const cwd = workingDir || os.homedir();

  send(win, "eval:execution:runStarted", runId, scenario.id, variant);

  const log: string[] = [
    `# Eval Run: ${runId}`,
    `- Scenario: ${scenario.prompt.slice(0, 100)}`,
    `- Variant: ${variant}`,
    `- Working Dir: ${cwd}`,
    `- Started: ${new Date().toISOString()}`,
    "",
  ];

  const lt: LiveTranscript = { lines: [], totalChars: 0 };
  const allToolCalls: ToolInvocation[] = [];
  const wrappedPrompt = wrapPrompt(scenario.prompt);
  let sessionId = "";
  let turns = 0;
  let totalCost = 0;
  let totalInput = 0;
  let totalOutput = 0;
  let totalCacheRead = 0;
  let totalCacheWrite = 0;
  let success = true;

  try {
    let currentInput = wrappedPrompt;

    while (turns < MAX_TURNS) {
      turns++;
      let cmd = "claude -p --output-format stream-json --verbose --dangerously-skip-permissions";
      if (variant === "without_tools") {
        const blocked = [...(scenario.componentToolNames || [])];
        const skillName = (scenario.componentName || "").replace(/^\//, "");
        if (skillName) blocked.push(`Skill(${skillName}*)`);
        if (blocked.length > 0) cmd += ` --disallowedTools "${blocked.join(",")}"`;
      }
      if (sessionId) cmd += ` --resume "${sessionId}"`;

      log.push(`## [${ts()}] TURN ${turns}`);
      log.push(`**Cmd:** ${cmd}`);
      log.push(`**Cwd:** ${cwd}`);
      log.push(`**Input:** ${currentInput.slice(0, 300)}`);
      log.push("");

      appendLine(lt, `\n━━━ Turn ${turns} ━━━`);
      appendLine(lt, `👤 ${currentInput}`);
      send(win, "eval:execution:runStatus", runId, "running", getText(lt));

      const result = await runClaudeTurn(cmd, currentInput, cwd, win, runId, lt, activeProcesses);
      accumulateTokens(result, log, allToolCalls);

      if (!sessionId && result.sessionId) sessionId = result.sessionId;
      totalCost += result.costUsd;
      totalInput += result.inputTokens;
      totalOutput += result.outputTokens;
      totalCacheRead += result.cacheRead;
      totalCacheWrite += result.cacheWrite;

      if (result.resultText) appendLine(lt, `\n✅ ${result.resultText.slice(0, 1000)}`);
      send(win, "eval:execution:runStatus", runId, "running", getText(lt));

      if (result.isError) { success = false; break; }

      const personaReply = await askPersona(scenario.prompt, scenario.expectedBehavior, result.resultText);
      if (personaReply.includes("[DONE]")) {
        log.push(`## [${ts()}] PERSONA: [DONE]`);
        break;
      }

      log.push(`## [${ts()}] PERSONA: ${personaReply.slice(0, 200)}`);
      log.push("");
      currentInput = personaReply;
    }
  } catch (err) {
    success = false;
    log.push(`## [${ts()}] ERROR: ${err instanceof Error ? err.message : "Unknown"}`);
  }

  const transcript = getText(lt);
  log.push(`## [${ts()}] RUN ${success ? "COMPLETED" : "FAILED"}`);
  log.push(`- Duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s | Turns: ${turns} | Cost: $${totalCost.toFixed(4)}`);
  log.push(`- Total Tokens: in=${totalInput} out=${totalOutput} cache_read=${totalCacheRead} cache_write=${totalCacheWrite}`);
  log.push(`- Total Tool Calls: ${allToolCalls.length} (${[...new Set(allToolCalls.map((t) => t.toolName))].join(", ")})`);

  saveTranscript(experimentId, runId, transcript);
  saveConversationLog(experimentId, runId, log.join("\n"));

  const run: ExecutionRun = {
    id: runId, scenarioId: scenario.id, variant, sessionId,
    status: success ? "completed" : "error",
    transcript: transcript.slice(-4000),
    toolInvocations: allToolCalls,
    tokenUsage: { inputTokens: totalInput, outputTokens: totalOutput, cacheRead: totalCacheRead, cacheWrite: totalCacheWrite },
    costUsd: totalCost,
    duration: Date.now() - startTime,
  };

  send(win, "eval:execution:runStatus", runId, run.status, transcript);
  return run;
}

function accumulateTokens(result: TurnResult, log: string[], allToolCalls: ToolInvocation[]): void {
  if (result.stderr) log.push(`**Stderr:** ${result.stderr.slice(0, 500)}`);
  allToolCalls.push(...result.toolCalls);
  log.push(`**Tools used:** ${result.toolCalls.map((t) => t.toolName).join(", ") || "none"}`);
  log.push(`**Response:** ${result.resultText.slice(0, 500)}`);
  log.push(`- Cost: $${result.costUsd.toFixed(4)} | Duration: ${result.durationMs}ms | Tools: ${result.toolCalls.length}`);
  log.push(`- Tokens: in=${result.inputTokens} out=${result.outputTokens} cache_read=${result.cacheRead} cache_write=${result.cacheWrite}`);
  log.push("");
}
