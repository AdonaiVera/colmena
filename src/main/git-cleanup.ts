import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

import type { PersistedTab } from "../shared/types";

const execFileAsync = promisify(execFile);
const GIT_TIMEOUT = 30_000;
const WORKTREE_DIR = ".colmena-worktrees";

async function git(args: string[], cwd?: string): Promise<{ stdout: string; stderr: string }> {
  const opts = { timeout: GIT_TIMEOUT, cwd, maxBuffer: 10 * 1024 * 1024 };
  return execFileAsync("git", args, opts);
}

export async function cleanupOrphanedWorktrees(tabs: PersistedTab[]): Promise<void> {
  const activeWorktrees = new Set(tabs.filter((t) => t.worktreePath).map((t) => t.worktreePath!));
  const repoRoots = new Set(tabs.filter((t) => t.repoRoot).map((t) => t.repoRoot!));

  for (const repoRoot of repoRoots) {
    const wtDir = path.join(repoRoot, WORKTREE_DIR);
    try {
      const entries = await fs.readdir(wtDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const fullPath = path.join(wtDir, entry.name);
        if (!activeWorktrees.has(fullPath)) {
          try {
            await git(["worktree", "remove", fullPath, "--force"], repoRoot);
          } catch {
            await fs.rm(fullPath, { recursive: true, force: true });
          }
        }
      }
      await git(["worktree", "prune"], repoRoot).catch(() => {});
    } catch {}
  }
}
