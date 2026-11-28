// Settings > Logs: the server's last errors and toasts (server/server-log.ts) and the toasts this page showed
// (state/logs.ts), newest first, redacted on both sides (shared/redact.ts), to read again a message gone too fast.
import { useEffect, useMemo, useState } from 'react';
import type { LogEntry } from '../../shared/protocol.ts';
import { t } from '../i18n/index.ts';
import { formatLogTime } from '../lib/format.ts';
import { logLines } from '../state/logs.ts';
import { useSessions } from '../state/sessions.ts';
import { CleanIcon, CopyIcon, RefreshIcon } from './Icons.tsx';

const COPIED_MS = 1500;

export function LogsPanel() {
  const shown = useSessions((s) => s.shownToasts);
  const server = useSessions((s) => s.serverLogs);
  const send = useSessions((s) => s.send);
  const clear = useSessions((s) => s.clearLogs);
  const [copied, setCopied] = useState(false);
  const words = t.settings.logs;
  const lines = useMemo(() => logLines(shown, server ?? []), [shown, server]);
  const refresh = () => send({ t: 'getLogs' });

  // asked once open (and again on a reconnection: `send` changes); the server's new lines come on their own (logEntry)
  useEffect(() => { send({ t: 'getLogs' }); }, [send]);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const describe = (line: LogEntry) => `${formatLogTime(line.at)}  ${words.levels[line.level]}  ${words.sources[line.source]}  ${line.text}`;
  const copy = () => { void navigator.clipboard.writeText(lines.map(describe).join('\n')).then(() => setCopied(true), () => {}); };

  return (
    <section className="cp-prefs__group cp-logs" aria-label={t.settings.prefs.sections.logs}>
      <div className="cp-logs__tools">
        <button type="button" className="cp-button" data-size="small" onClick={refresh}><RefreshIcon />{words.refresh}</button>
        <button type="button" className="cp-button" data-size="small" disabled={!lines.length} onClick={copy}><CopyIcon />{copied ? words.copied : words.copy}</button>
        <button type="button" className="cp-button" data-size="small" data-variant="danger" disabled={!lines.length} onClick={clear}><CleanIcon />{words.clear}</button>
      </div>
      {lines.length ? (
        <ol className="cp-prefs__card cp-logs__list">
          {lines.map((line, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: lines have no id, and two may share time and text
            <li key={index} className="cp-logs__line" data-level={line.level}>
              <time className="cp-logs__time" dateTime={new Date(line.at).toISOString()}>{formatLogTime(line.at)}</time>
              <span className="cp-logs__level">{words.levels[line.level]}</span>
              <span className="cp-logs__source">{words.sources[line.source]}</span>
              <span className="cp-logs__text">{line.text}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="cp-prefs__empty">{words.empty}</p>
      )}
    </section>
  );
}
