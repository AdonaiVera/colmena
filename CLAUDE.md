# CLAUDE.md

## Project Overview

**Colmena** ("beehive" in Spanish) is a cross-platform multi-agent terminal UI for Claude Code, built with Electron + React + TypeScript. Each session runs an independent PTY via node-pty with xterm.js rendering.

## Architecture

- **Main process** (`src/main/`): Electron main, node-pty management, IPC handlers, Claude Code hooks
- **Preload** (`src/preload/`): Context bridge exposing safe IPC API
- **Renderer** (`src/renderer/`): React UI with xterm.js terminals
- **Shared** (`src/shared/`): Types shared between main and renderer

## Tech Stack

- Electron + electron-vite
- React 19 + TypeScript
- xterm.js v6 + node-pty
- shadcn/ui + Tailwind CSS
- electron-store for persistence

## Rules

- Use npm for package management
- Use inline styles for spacing (padding, margin, gap)
- Prefer shadcn components over custom components
- Keep each file under 200 lines of code
- Dark minimal theme (amber accent on near-black)
- No default exports — use named exports only
- Never use `display: none` for xterm terminals — use `visibility: hidden` + `position: absolute`
- Never return `null` from App — always render the layout skeleton
- Radix Select descriptions go outside `SelectPrimitive.ItemText`
- electron-store must be in `externalizeDeps.exclude` (ESM-only)
- Run `npx electron-builder install-app-deps` after install for node-pty
- No inline comments between lines of code — code should be self-explanatory

## See Also

- [CONTRIBUTING.md](CONTRIBUTING.md) for full code style and setup guide
