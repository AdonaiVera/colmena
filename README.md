<p align="center">
  <img src="resources/logo.svg" width="80" height="80" alt="Colmena logo">
</p>

<h1 align="center">Colmena</h1>

<p align="center">
  Your AI beehive — a multi-session terminal for <a href="https://docs.anthropic.com/en/docs/claude-code">Claude Code</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-333?style=flat-square" alt="Platform">
  <img src="https://img.shields.io/badge/license-Apache%202.0-f59e0b?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/electron-30-47848f?style=flat-square" alt="Electron">
</p>

---

> ⚠️
> **Experimental**: under active development. Expect breaking changes and rough edges.

Run multiple Claude Code agents side by side. Each tab is an independent session with its own PTY, so you can work on different projects or tasks without switching windows.

I created Colmena because I was looking for something open-source that I could modify, personalize, and make my own. No more VSCode, no more Cursor, no more IDEs telling me how to work. My environment, my style, built only for me. Use this as a baseline, add the features you actually want, shape it however you like, and create your own Colmena.

## Features

- **Multi-tab sessions** — run several Claude Code agents at once
- **Session modes** — start fresh, continue last conversation, or pick one to resume
- **Model selection** — choose between Sonnet, Opus, or Haiku per tab
- **Git diff panel** — view changes against the default branch in any session mode
- **Split terminal** — open a shell below any session for manual git commands (Cmd+J)
- **Persistent tabs** — sessions restore when you relaunch
- **Smart restart** — exited sessions restart on keypress; failed modes fall back to new
- **In-terminal search** — Cmd+F to find text in any session
- **Activity indicators** — colored dots show when Claude is running, idle, or needs input
- **Sound notifications** — bee buzz alert when Claude needs attention in a background tab

## Quick Start

```bash
git clone https://github.com/AdonaiVera/colmena.git
cd colmena
npm install
npm run dev
```

> Requires Node.js 20+, npm, and Python 3 (for node-pty native build).

## Build

```bash
npm run build
npm run preview
```

## Tech Stack

Electron + React 19 + TypeScript + xterm.js + node-pty + shadcn/ui + Tailwind CSS + electron-store

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, code style, and guidelines.

## License

[Apache 2.0](LICENSE)
