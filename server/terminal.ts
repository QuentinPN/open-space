// The integrated terminal: real pseudo-terminals (node-pty), several tabs per session, streamed to the pages over the
// WebSocket. A tab keeps its shell running whatever pages are open: a page that attaches gets the last output once (the
// scrollback), then what follows. node-pty is native and optional: where it does not load, `available` is false and
// nothing else changes.
import { chmodSync, accessSync, constants, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { ServerMessage } from '../shared/protocol.ts';
import type { ShellFamily, TerminalChoice, TerminalKind, TerminalTab } from '../shared/terminal.ts';
import { st } from './i18n/index.ts';
import { findTerminals } from './desktop.ts';
import { withoutClaudeOnly } from './environment.ts';
import { signalTree } from './process-tree.ts';

/** Tabs of one session, exited ones included (they stay until the user closes them). */
export const MAX_TABS_PER_SESSION = 8;
/** What a tab remembers of its output, for a page that attaches later. */
export const MAX_SCROLLBACK = 256 * 1024;
/** Output reaches the pages in batches this far apart: a burst (`cat` of a big file) is one message, not thousands. */
export const FLUSH_MS = 16;

/** The part of node-pty this file uses, so that a test can stand in for it. */
export interface Pty {
  readonly pid: number;
  onData(listener: (data: string) => void): unknown;
  onExit(listener: (event: { exitCode: number }) => void): unknown;
  write(data: string): void;
  resize(cols: number, rows: number): void;
  kill(): void;
}
export interface PtyModule {
  spawn(file: string, args: string[], options: { name: string; cols: number; rows: number; cwd: string; env: NodeJS.ProcessEnv; useConptyDll?: boolean }): Pty;
}

export interface ShellSpec { file: string; args: string[]; title: string; /** added to the environment for this shell only */ env: Record<string, string>; family: ShellFamily }

interface ShellRequest {
  platform: NodeJS.Platform;
  /** the shell picked in the settings (Windows only) */
  kind: TerminalKind | undefined;
  choices: readonly TerminalChoice[];
  env: NodeJS.ProcessEnv;
  exists?: (file: string) => boolean;
}

/**
 * The shell a new tab runs. Windows: the one picked in the settings among those found (findTerminals), else cmd; for
 * Git Bash the `bash.exe` of the Git folder, not `git-bash.exe` (which opens a window of its own). macOS and Linux: the
 * user's login shell.
 */
export function chooseShell({ platform, kind, choices, env, exists = existsSync }: ShellRequest): ShellSpec {
  if (platform !== 'win32') {
    const shell = env.SHELL && path.posix.isAbsolute(env.SHELL) ? env.SHELL : platform === 'darwin' ? '/bin/zsh' : '/bin/bash';
    return { file: shell, args: ['-l'], title: path.posix.basename(shell), env: {}, family: 'posix' };
  }
  const cmd = (): ShellSpec => {
    const found = choices.find((choice) => choice.id === 'cmd');
    return { file: found?.path ?? (env.ComSpec || 'cmd.exe'), args: ['/d'], title: 'cmd', env: {}, family: 'cmd' };
  };
  const choice = choices.find((each) => each.id === (kind ?? 'cmd'));
  if (!choice) return cmd();
  switch (choice.id) {
    case 'powershell': return { file: choice.path, args: ['-NoLogo'], title: choice.name, env: {}, family: 'powershell' };
    case 'git-bash': {
      const root = path.win32.dirname(choice.path);
      const bash = [path.win32.join(root, 'bin', 'bash.exe'), path.win32.join(root, 'usr', 'bin', 'bash.exe')].find((candidate) => exists(candidate));
      // CHERE_INVOKING: Git's login profile would otherwise start in the home folder
      return bash ? { file: bash, args: ['--login', '-i'], title: choice.name, env: { CHERE_INVOKING: '1' }, family: 'posix' } : cmd();
    }
    default: return cmd();
  }
}

/** "PowerShell", then "PowerShell 2", "PowerShell 3"… the first number not taken by a tab of the session. */
export function tabTitle(base: string, taken: readonly string[]): string {
  if (!taken.includes(base)) return base;
  for (let number = 2; ; number += 1) if (!taken.includes(`${base} ${number}`)) return `${base} ${number}`;
}

/** How far past the cut a line break is looked for. */
const LINE_SEARCH = 4096;

/**
 * The scrollback with `chunk` added, cut from its start to `max` characters or a little less: it then begins after the
 * next line break (a replay must not start inside an escape sequence), else never between the two halves of a surrogate pair.
 */
export function appendScrollback(scrollback: string, chunk: string, max = MAX_SCROLLBACK): string {
  const all = scrollback + chunk;
  if (all.length <= max) return all;
  let start = all.length - max;
  const lineBreak = all.indexOf('\n', start);
  if (lineBreak !== -1 && lineBreak - start < LINE_SEARCH) return all.slice(lineBreak + 1);
  const code = all.charCodeAt(start);
  if (code >= 0xdc00 && code <= 0xdfff) start += 1;
  return all.slice(start);
}

/** One page's way to receive messages (a connection's send). */
export type TerminalListener = (message: ServerMessage) => void;

interface Tab {
  info: TerminalTab;
  pty: Pty | null;
  scrollback: string;
  /** output waiting for the next flush */
  pending: string;
  timer: NodeJS.Timeout | null;
  listeners: Set<TerminalListener>;
}

export interface TerminalDeps {
  /** what a shell inherits: the environment Claude Code gets (server/environment.ts), less what is for Claude alone */
  environment: NodeJS.ProcessEnv;
  /** the shell picked in the settings */
  kind: () => TerminalKind | undefined;
  broadcast: (message: ServerMessage) => void;
  log?: (what: string, error?: unknown) => void;
  /** node-pty, or null where it does not load */
  load?: () => Promise<PtyModule | null>;
  platform?: NodeJS.Platform;
  choices?: () => TerminalChoice[];
  /** ends a shell and what it started, by its pid (Windows: node-pty leaves some of them) */
  killTree?: (pid: number) => void;
}

/** node-pty's prebuilt helper of macOS may have lost its executable bit on the way (a tarball, a copy into an app). */
function ensureSpawnHelper(require: NodeJS.Require) {
  if (process.platform !== 'darwin') return;
  try {
    const root = path.dirname(path.dirname(require.resolve('node-pty'))).replace('app.asar', 'app.asar.unpacked');
    const helper = path.join(root, 'prebuilds', `darwin-${process.arch}`, 'spawn-helper');
    try { accessSync(helper, constants.X_OK); } catch { chmodSync(helper, 0o755); }
  } catch { /* not there: spawning says so */ }
}

async function loadNodePty(): Promise<PtyModule | null> {
  try {
    ensureSpawnHelper(createRequire(import.meta.url));
    // a CommonJS module: its exports are the default export, and also named ones where Node can see them
    const loaded = await import('node-pty') as unknown as { default?: PtyModule; spawn?: PtyModule['spawn'] };
    return loaded.default ?? (loaded.spawn ? { spawn: loaded.spawn } : null);
  } catch {
    return null;
  }
}

/**
 * node-pty on Windows (conpty.dll) reads a shell's output on a worker thread that it only ends when more output arrives
 * after the kill, which it does not: each tab would leave a thread behind. Its own cleanup, asked for here; if a node-pty
 * of another shape has no such worker, nothing happens.
 */
function releaseOutputThread(pty: Pty) {
  try { (pty as unknown as { _agent?: { _conoutSocketWorker?: { dispose(): void } } })._agent?._conoutSocketWorker?.dispose(); } catch { /* the thread stays until the server stops */ }
}

export class TerminalManager {
  private readonly tabs = new Map<string, Tab>();
  private pty: PtyModule | null = null;
  private readonly deps: TerminalDeps;

  constructor(deps: TerminalDeps) { this.deps = deps; }

  /** Loads node-pty; until then, and after a failure, no tab can open. */
  async init() { this.pty = await (this.deps.load ?? loadNodePty)(); }

  get available() { return this.pty !== null; }

  list(): TerminalTab[] { return [...this.tabs.values()].map((tab) => ({ ...tab.info })); }

  message(): ServerMessage { return { t: 'terminalTabs', available: this.available, tabs: this.list() }; }

  private changed() { this.deps.broadcast(this.message()); }

  /** A new tab with a shell in `cwd`; throws what the user should read when it cannot. */
  open(sessionId: string, cwd: string, cols: number, rows: number): TerminalTab {
    if (!this.pty) throw new Error(st.terminal.unavailable);
    const mine = this.list().filter((tab) => tab.sessionId === sessionId);
    if (mine.length >= MAX_TABS_PER_SESSION) throw new Error(st.terminal.tooMany(MAX_TABS_PER_SESSION));
    const shell = chooseShell({ platform: this.deps.platform ?? process.platform, kind: this.deps.kind(), choices: (this.deps.choices ?? findTerminals)(), env: this.deps.environment });
    let pty: Pty;
    try {
      // useConptyDll (Windows): the conpty.dll shipped with node-pty. Its kill is plain; the Windows one forks a helper
      // script, which the packaged app cannot (no ELECTRON_RUN_AS_NODE: it would start Open Space again)
      pty = this.pty.spawn(shell.file, shell.args, { name: 'xterm-256color', cols, rows, cwd, useConptyDll: true, env: { ...withoutClaudeOnly(this.deps.environment), ...shell.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' } });
    } catch (error) {
      this.deps.log?.('cannot start a terminal', error);
      throw new Error(st.terminal.shellFailed);
    }
    const info: TerminalTab = { id: randomUUID(), sessionId, title: tabTitle(shell.title, mine.map((tab) => tab.title)), shell: shell.family };
    const tab: Tab = { info, pty, scrollback: '', pending: '', timer: null, listeners: new Set() };
    this.tabs.set(info.id, tab);
    pty.onData((data) => {
      tab.pending += data;
      tab.timer ??= setTimeout(() => this.flush(tab), FLUSH_MS);
    });
    pty.onExit(({ exitCode }) => {
      if (!this.tabs.has(info.id)) return;
      this.flush(tab);
      tab.pty = null;
      releaseOutputThread(pty);
      tab.info = { ...tab.info, exitCode };
      this.changed();
    });
    this.changed();
    return { ...info };
  }

  private flush(tab: Tab) {
    if (tab.timer) clearTimeout(tab.timer);
    tab.timer = null;
    if (!tab.pending) return;
    const data = tab.pending;
    tab.pending = '';
    tab.scrollback = appendScrollback(tab.scrollback, data);
    for (const listener of tab.listeners) listener({ t: 'terminalOutput', terminalId: tab.info.id, data });
  }

  /** The page shows the tab: it gets the scrollback now (`replay`), then what follows. */
  attach(terminalId: string, listener: TerminalListener) {
    const tab = this.tabs.get(terminalId);
    if (!tab) return;
    // what is waiting belongs to the replay, not after it
    this.flush(tab);
    tab.listeners.add(listener);
    listener({ t: 'terminalOutput', terminalId, data: tab.scrollback, replay: true });
  }

  detach(terminalId: string, listener: TerminalListener) { this.tabs.get(terminalId)?.listeners.delete(listener); }

  /** A page went away. */
  detachAll(listener: TerminalListener) { for (const tab of this.tabs.values()) tab.listeners.delete(listener); }

  input(terminalId: string, data: string) {
    try { this.tabs.get(terminalId)?.pty?.write(data); } catch { /* the shell just ended: its exit follows */ }
  }

  resize(terminalId: string, cols: number, rows: number) {
    try { this.tabs.get(terminalId)?.pty?.resize(cols, rows); } catch { /* the shell just ended */ }
  }

  /** Kills the shell (and what it started) and removes the tab. */
  close(terminalId: string) {
    const tab = this.tabs.get(terminalId);
    if (!tab) return;
    this.dispose(tab);
    this.changed();
  }

  /** Every tab of a session: it is forgotten (its folder may be about to go). */
  closeSession(sessionId: string) {
    const mine = [...this.tabs.values()].filter((tab) => tab.info.sessionId === sessionId);
    if (mine.length === 0) return;
    for (const tab of mine) this.dispose(tab);
    this.changed();
  }

  /** Every tab: the server stops. */
  shutdown() { for (const tab of [...this.tabs.values()]) this.dispose(tab); }

  private dispose(tab: Tab) {
    this.tabs.delete(tab.info.id);
    if (tab.timer) clearTimeout(tab.timer);
    tab.listeners.clear();
    const pty = tab.pty;
    tab.pty = null;
    if (!pty) return;
    // a pty's kill reaches the shell; on Windows the whole tree goes (a dev server started from the tab would stay)
    if ((this.deps.platform ?? process.platform) === 'win32') (this.deps.killTree ?? ((pid) => signalTree(pid, 'SIGKILL')))(pty.pid);
    try { pty.kill(); } catch { /* already gone */ }
    releaseOutputThread(pty);
  }
}
