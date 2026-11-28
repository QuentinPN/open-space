export const TERMINALS = ['cmd', 'powershell', 'git-bash'] as const;
export type TerminalKind = (typeof TERMINALS)[number];
export interface TerminalChoice { id: TerminalKind; name: string; path: string }

/** Where the room and the shortcut open a terminal: a window of the computer (the default), or tabs inside Open Space. */
export const TERMINAL_MODES = ['external', 'internal'] as const;
export type TerminalMode = (typeof TERMINAL_MODES)[number];

/** How a shell's command line reads: its separator between commands and its line continuation (cmd: & and ^, PowerShell: ; and `, the others: ; and \). */
export type ShellFamily = 'cmd' | 'powershell' | 'posix';

/**
 * One shell of the integrated terminal, a tab in its session's panel; `exitCode` once its shell has ended. `shell`: its
 * family, for what the page pastes into it (absent from an older server).
 */
export interface TerminalTab { id: string; sessionId: string; title: string; exitCode?: number; shell?: ShellFamily }

/** At most this much text per `terminalInput` (a paste bigger than this is cut by the page). */
export const MAX_TERMINAL_INPUT = 65_536;
