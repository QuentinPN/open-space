// What Settings > Logs shows of the server: its last errors and the toasts it sent, in memory only (gone at a restart).
// Each line is redacted as it is kept (shared/redact.ts), with the values the server knows to be keys at that moment,
// and again in `list`, with those it knows then: a key learnt after the line still never goes out.
import { MAX_SERVER_LOG, type LogEntry } from '../shared/protocol.ts';
import { redactor } from '../shared/redact.ts';

export { MAX_SERVER_LOG };

export interface ServerLogOptions {
  /** the values to mask wherever they appear: the server's secret, the MCP key, the keys the user gave */
  known: () => readonly string[];
  /** the user's home folder, written "~" */
  home: string;
  /** a line just kept, redacted, for the open pages (not called for a line added with `live` false) */
  onAdd?: (entry: LogEntry) => void;
  now?: () => number;
  max?: number;
}

export interface AddOptions {
  /** false: kept, but not handed to onAdd (a failure of the pages' connection itself, which must not loop) */
  live?: boolean;
  /** the keys known now, when the caller already has them (a toast masks them on its way out too) */
  known?: readonly string[];
}

export class ServerLog {
  private readonly options: ServerLogOptions;
  private entries: LogEntry[] = [];

  constructor(options: ServerLogOptions) { this.options = options; }

  add(level: LogEntry['level'], source: LogEntry['source'], text: string, { live = true, known = this.options.known() }: AddOptions = {}) {
    const entry: LogEntry = { at: (this.options.now ?? Date.now)(), level, source, text: redactor(known, this.options.home)(text) };
    this.entries.push(entry);
    const over = this.entries.length - (this.options.max ?? MAX_SERVER_LOG);
    if (over > 0) this.entries.splice(0, over);
    // redacted with the keys known this very moment: sent as it is
    if (live) this.options.onAdd?.(entry);
  }

  /** The lines kept, oldest first, redacted again with the keys known now. */
  list(): LogEntry[] {
    const redact = redactor(this.options.known(), this.options.home);
    return this.entries.map((entry) => ({ ...entry, text: redact(entry.text) }));
  }

  clear() { this.entries = []; }
}
