import { execFile, spawn } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

import type { GitDiffFile, GitDiffHunk } from "../shared/types";

const execFileAsync = promisify(execFile);
const GIT_TIMEOUT = 30_000;

async function git(args: string[], cwd: string): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync("git", args, {
    timeout: GIT_TIMEOUT,
    cwd,
    maxBuffer: 10 * 1024 * 1024,
  });
}

function parseStatus(code: string): GitDiffFile["status"] {
  if (code.startsWith("A")) return "added";
  if (code.startsWith("D")) return "deleted";
  if (code.startsWith("R")) return "renamed";
  return "modified";
}

export function parseDiffHunks(diffText: string): GitDiffHunk[] {
  const hunks: GitDiffHunk[] = [];
  const hunkRegex = /^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@(.*)$/gm;
  let match: RegExpExecArray | null;
  const matches: {
    index: number;
    header: string;
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
  }[] = [];

  while ((match = hunkRegex.exec(diffText)) !== null) {
    matches.push({
      index: match.index,
      header: match[0],
      oldStart: parseInt(match[1], 10),
      oldLines: parseInt(match[2] ?? "1", 10),
      newStart: parseInt(match[3], 10),
      newLines: parseInt(match[4] ?? "1", 10),
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const start = m.index + m.header.length + 1;
    const end = i + 1 < matches.length ? matches[i + 1].index : diffText.length;
    const content = diffText.slice(start, end).trimEnd();

    hunks.push({
      oldStart: m.oldStart,
      oldLines: m.oldLines,
      newStart: m.newStart,
      newLines: m.newLines,
      header: m.header,
      content,
    });
  }

  return hunks;
}

async function getFileContent(cwd: string, ref: string, filePath: string): Promise<string> {
  try {
    const { stdout } = await git(["show", `${ref}:${filePath}`], cwd);
    return stdout;
  } catch {
    return "";
  }
}

export async function getDiffFiles(
  worktreePath: string,
  baseBranch: string,
): Promise<GitDiffFile[]> {
  await git(["add", "-A"], worktreePath);

  const { stdout: statusOut } = await git(
    ["diff", "--name-status", "--no-renames", baseBranch],
    worktreePath,
  );

  if (!statusOut.trim()) return [];

  const files: GitDiffFile[] = [];

  for (const line of statusOut.trim().split("\n")) {
    const [code, ...rest] = line.split("\t");
    const filePath = rest.join("\t");
    if (!filePath) continue;

    const status = parseStatus(code);

    let diffText = "";
    try {
      const { stdout } = await git(["diff", baseBranch, "--", filePath], worktreePath);
      diffText = stdout;
    } catch {}

    const hunks = parseDiffHunks(diffText);
    const originalContent = await getFileContent(worktreePath, baseBranch, filePath);
    let modifiedContent = "";
    if (status !== "deleted") {
      try {
        modifiedContent = await fs.readFile(path.join(worktreePath, filePath), "utf-8");
      } catch {}
    }

    files.push({ filePath, status, hunks, originalContent, modifiedContent });
  }

  return files;
}

export async function writeFileContent(
  worktreePath: string,
  filePath: string,
  content: string,
): Promise<boolean> {
  try {
    await fs.writeFile(path.join(worktreePath, filePath), content, "utf-8");
    return true;
  } catch {
    return false;
  }
}

export async function revertFile(
  worktreePath: string,
  filePath: string,
  baseBranch: string,
): Promise<boolean> {
  try {
    await git(["checkout", baseBranch, "--", filePath], worktreePath);
    return true;
  } catch {
    return false;
  }
}

export async function revertHunk(
  worktreePath: string,
  filePath: string,
  hunkIndex: number,
  baseBranch: string,
): Promise<boolean> {
  try {
    const { stdout: diffOut } = await git(["diff", baseBranch, "--", filePath], worktreePath);

    const hunks = parseDiffHunks(diffOut);
    if (hunkIndex < 0 || hunkIndex >= hunks.length) return false;

    const hunk = hunks[hunkIndex];
    const headerMatch = diffOut.match(/^diff --git[\s\S]*?(?=^@@)/m);
    const diffHeader = headerMatch ? headerMatch[0] : "";
    const patch = `${diffHeader}${hunk.header}\n${hunk.content}\n`;

    return new Promise<boolean>((resolve) => {
      const child = spawn("git", ["apply", "--reverse", "--recount", "--allow-empty"], {
        cwd: worktreePath,
      });
      child.stdin.write(patch);
      child.stdin.end();
      child.on("close", (code) => resolve(code === 0));
      child.on("error", () => resolve(false));
    });
  } catch {
    return false;
  }
}
