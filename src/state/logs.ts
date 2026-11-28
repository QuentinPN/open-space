// Settings > Logs on the page's side: the toasts this page raised itself (in memory, gone at a reload), merged with the
// server's lines (server/server-log.ts), which hold every toast the server sent. Both are redacted (shared/redact.ts).
import type { LogEntry } from '../../shared/protocol.ts';
import { redact } from '../../shared/redact.ts';

export const MAX_SHOWN_TOASTS = 200;

/** The page's own toasts, with this one added (redacted), the last MAX_SHOWN_TOASTS only. */
export function keepToast(shown: readonly LogEntry[], kind: LogEntry['level'], text: string, at: number): LogEntry[] {
  return [...shown, { at, level: kind, source: 'toast' as const, text: redact(text) }].slice(-MAX_SHOWN_TOASTS);
}

/** The lines of Settings > Logs, newest first: the server's and the page's own toasts. */
export function logLines(shown: readonly LogEntry[], server: readonly LogEntry[]): LogEntry[] {
  return [...server, ...shown].sort((a, b) => b.at - a.at);
}
