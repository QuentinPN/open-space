// The integrated terminal (shared/terminal.ts): the tabs of every session, the one each session's panel shows, whether
// its panel is open, and what a code block's Run button pastes into it. The server owns the tabs (`terminalTabs`); the
// page only keeps which one it shows. A panel's views (src/command/TerminalPanel.tsx) hear their tab's output here.
import { create } from 'zustand';
import type { ServerMessage } from '../../shared/protocol.ts';
import { MAX_TERMINAL_INPUT, type TerminalTab } from '../../shared/terminal.ts';
import { readPreference, writePreference } from '../lib/preferences.ts';
import { useSessions } from './sessions.ts';

/** Text for a tab's shell, pasted as the user would (bracketed, so several lines wait together); `run`: Enter after it. */
export interface Paste { text: string; run: boolean }

/** A tab this page asked for (`terminalOpen`), until the server answers its request (`terminalOpened`). */
export interface Opening { sessionId: string; /** what to paste into it once made */ paste?: Paste }

/** The tabs as the page knows them: the pure part of the store, kept up with the server by `afterTabs` and `afterOpened`. */
export interface TerminalBook {
  tabs: TerminalTab[];
  /** the tab each session's panel shows, by session */
  active: Record<string, string>;
  /** the tabs asked for and not answered yet, by request */
  opening: Record<string, Opening>;
  /** by tab: what its view has to paste */
  pastes: Record<string, Paste>;
}

export const EMPTY_BOOK: TerminalBook = { tabs: [], active: {}, opening: {}, pastes: {} };

/**
 * The book once the server lists the tabs again. A tab still there stays shown (a tab another page opened takes
 * nothing from it); a shown tab gone gives way to the one after it, else the one before; a session that had none shown
 * shows its first. A tab this page asked for is shown by `afterOpened`, whichever of the two messages comes first.
 */
export function afterTabs(book: TerminalBook, tabs: TerminalTab[]): TerminalBook {
  const ids = new Set(tabs.map((tab) => tab.id));
  const active: Record<string, string> = {};
  const pastes = Object.fromEntries(Object.entries(book.pastes).filter(([id]) => ids.has(id)));
  for (const sessionId of new Set(tabs.map((tab) => tab.sessionId))) {
    const mine = tabs.filter((tab) => tab.sessionId === sessionId);
    const current = book.active[sessionId];
    if (current && ids.has(current)) { active[sessionId] = current; continue; }
    const before = book.tabs.filter((tab) => tab.sessionId === sessionId);
    const at = before.findIndex((tab) => tab.id === current);
    const neighbour = at < 0 ? undefined : (before.slice(at + 1).find((tab) => ids.has(tab.id)) ?? before.slice(0, at).reverse().find((tab) => ids.has(tab.id)));
    active[sessionId] = neighbour?.id ?? mine[0].id;
  }
  return { ...book, tabs, active, pastes };
}

/**
 * The book once the server answered one of this page's requests: its tab is shown, with what waited to be pasted in
 * it; refused (`error`), the request is forgotten, so asking again opens one.
 */
export function afterOpened(book: TerminalBook, requestId: string, terminalId: string | null): TerminalBook {
  const request = book.opening[requestId];
  if (!request) return book;
  const opening = Object.fromEntries(Object.entries(book.opening).filter(([id]) => id !== requestId));
  if (terminalId === null) return { ...book, opening };
  return {
    ...book, opening,
    active: { ...book.active, [request.sessionId]: terminalId },
    pastes: request.paste ? { ...book.pastes, [terminalId]: request.paste } : book.pastes,
  };
}

/** The request of a tab being opened for the session, if any. */
export const openingFor = (book: TerminalBook, sessionId: string) => Object.keys(book.opening).find((id) => book.opening[id].sessionId === sessionId);

/** A session's tabs, in the server's order. */
export const tabsOf = (tabs: readonly TerminalTab[], sessionId: string) => tabs.filter((tab) => tab.sessionId === sessionId);

/** Text for `terminalInput`, in pieces the server takes (MAX_TERMINAL_INPUT), never splitting a character in two. */
export function chunkInput(data: string, max = MAX_TERMINAL_INPUT): string[] {
  const chunks: string[] = [];
  let from = 0;
  while (from < data.length) {
    let to = Math.min(from + max, data.length);
    // a character outside the BMP is two code units: the cut goes before it
    if (to < data.length && to - from > 1 && /[\uD800-\uDBFF]/.test(data[to - 1])) to--;
    chunks.push(data.slice(from, to));
    from = to;
  }
  return chunks;
}

type Output = (data: string, replay: boolean) => void;
const listeners = new Map<string, Output>();

/** The view of a tab hears its output (a `replay` first, once attached); returns how to stop. */
export function onOutput(terminalId: string, listener: Output) {
  listeners.set(terminalId, listener);
  return () => { if (listeners.get(terminalId) === listener) listeners.delete(terminalId); };
}

/** The size of the last terminal fitted to its panel: a new tab starts at it, before its own view fits it. */
let lastSize = { cols: 80, rows: 24 };
export const noteSize = (cols: number, rows: number) => { lastSize = { cols, rows }; };

export const TERMINAL_HEIGHT = { initial: 260, min: 120 };

interface TerminalsState extends TerminalBook {
  /** false: the server has no pseudo-terminal (node-pty did not load), the integrated terminal is off */
  available: boolean;
  /** by session: its panel is open */
  shown: Record<string, boolean>;
  /** the panels' height, in pixels, kept in this browser */
  height: number;
  receive: (message: Extract<ServerMessage, { t: 'terminalTabs' | 'terminalOutput' | 'terminalOpened' }>) => void;
  /** opens or closes a session's panel; open, it has a tab (a first one is asked for) */
  show: (sessionId: string, shown: boolean) => void;
  /** a new tab in the session's folder, shown once the server made it, `paste` pasted into it */
  openTab: (sessionId: string, paste?: Paste) => void;
  pick: (sessionId: string, terminalId: string) => void;
  /** ends the tab's shell, and the tab */
  close: (terminalId: string) => void;
  /** pastes into the session's shown tab, a new one when it has none still running, and shows the panel */
  run: (sessionId: string, paste: Paste) => void;
  /** the tab's view made its paste */
  pasted: (terminalId: string) => void;
  setHeight: (height: number) => void;
}

const send = (...args: Parameters<ReturnType<typeof useSessions.getState>['send']>) => useSessions.getState().send(...args);
let requests = 0;

export const useTerminals = create<TerminalsState>((set, get) => ({
  ...EMPTY_BOOK,
  available: false,
  shown: {},
  height: readPreference('terminalHeight', TERMINAL_HEIGHT.initial),

  receive: (message) => {
    if (message.t === 'terminalOutput') { listeners.get(message.terminalId)?.(message.data, message.replay === true); return; }
    if (message.t === 'terminalOpened') {
      if ('error' in message) useSessions.getState().toast('error', message.error);
      set(afterOpened(get(), message.requestId, 'error' in message ? null : message.terminalId));
      return;
    }
    const book = afterTabs(get(), message.tabs);
    // without a terminal on the server, nothing asked for will come
    set({ ...book, available: message.available, ...(message.available ? {} : { opening: {} }) });
  },

  show: (sessionId, shown) => {
    set({ shown: { ...get().shown, [sessionId]: shown } });
    const s = get();
    if (shown && !tabsOf(s.tabs, sessionId).length && !openingFor(s, sessionId)) s.openTab(sessionId);
  },

  openTab: (sessionId, paste) => {
    const requestId = `${Date.now().toString(36)}-${++requests}`;
    if (!send({ t: 'terminalOpen', sessionId, requestId, ...lastSize })) return;
    set({ opening: { ...get().opening, [requestId]: paste ? { sessionId, paste } : { sessionId } } });
  },

  pick: (sessionId, terminalId) => set({ active: { ...get().active, [sessionId]: terminalId } }),

  close: (terminalId) => { send({ t: 'terminalClose', terminalId }); },

  run: (sessionId, paste) => {
    const s = get();
    const mine = tabsOf(s.tabs, sessionId).filter((tab) => tab.exitCode === undefined);
    const target = mine.find((tab) => tab.id === s.active[sessionId]) ?? mine[0];
    if (target) set({ active: { ...s.active, [sessionId]: target.id }, pastes: { ...s.pastes, [target.id]: paste } });
    else {
      const asked = openingFor(s, sessionId);
      if (asked) set({ opening: { ...s.opening, [asked]: { sessionId, paste } } });
      else get().openTab(sessionId, paste);
    }
    get().show(sessionId, true);
  },

  pasted: (terminalId) => set({ pastes: Object.fromEntries(Object.entries(get().pastes).filter(([id]) => id !== terminalId)) }),

  setHeight: (height) => {
    const rounded = Math.round(Math.max(TERMINAL_HEIGHT.min, height));
    set({ height: rounded });
    writePreference('terminalHeight', rounded);
  },
}));

/**
 * The room's screen, Ctrl/Cmd+Alt+T, the palette and a session's menu open a terminal: the session's panel (its first
 * tab made if it has none, closed if open) when the settings put the terminal in Open Space and it can, else a window
 * of the computer in the session's folder, as before (`sessionId` null: the default folder). `panelFor`: the session
 * whose panel opens, when it is not the one whose folder the window opens in (the room's screen is the user's own).
 */
export function openTerminal(sessionId: string | null | undefined, panelFor: string | null | undefined = sessionId) {
  const sessions = useSessions.getState();
  const terminals = useTerminals.getState();
  if (panelFor && terminals.available && sessions.preferences.terminalMode === 'internal') terminals.show(panelFor, !terminals.shown[panelFor]);
  else sessions.openTerminal(sessionId);
}

// a connection lost or made again: the answers to what was asked before will not come
useSessions.subscribe((state, previous) => { if (state.connection !== previous.connection) useTerminals.setState({ opening: {} }); });

/** Ctrl/Cmd+Alt+T, which shows and hides the terminal: the one key a focused terminal leaves to the page. */
export const isTerminalShortcut = (event: KeyboardEvent) => (event.metaKey || event.ctrlKey) && event.altKey && event.code === 'KeyT';

/** A key typed in a terminal goes to its shell, not to the page's shortcuts (but the terminal's own). */
export const keyForShell = (event: KeyboardEvent) => event.target instanceof Element && event.target.closest('.cp-terminal') !== null && !isTerminalShortcut(event);
