import '@xterm/xterm/css/xterm.css';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import { type KeyboardEvent, type PointerEvent, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { TERMINAL_FONT_SIZE, TERMINAL_MIN_CONTRAST, terminalFont, terminalTheme } from '../design/terminal-palette.ts';
import type { ShellFamily } from '../../shared/terminal.ts';
import { t } from '../i18n/index.ts';
import { oneLine } from '../lib/shell-code.ts';
import { useSessions } from '../state/sessions.ts';
import { chunkInput, isTerminalShortcut, noteSize, onOutput, openingFor, TERMINAL_HEIGHT, tabsOf, useTerminals } from '../state/terminals.ts';
import { ChevronDownIcon, CloseIcon, PlusIcon } from './Icons.tsx';

/**
 * A paste waits for the tab's replay (which clears the screen), then for the shell to have been quiet this long (its
 * prompt drawn, bracketed paste turned on)...
 */
const SETTLE_MS = 150;
/** ...but no longer than this after the replay. */
const PASTE_DEADLINE_MS = 2000;
/** The panel never takes more of its window than this. */
const MAX_SHARE = 0.75;
const KEY_STEP = 24;

const live = () => useSessions.getState().connection === 'live';
const send = (...args: Parameters<ReturnType<typeof useSessions.getState>['send']>) => useSessions.getState().send(...args);

/**
 * One tab's shell, drawn by xterm.js. Its terminal lives as long as the view, which the panel keeps for every tab of the
 * session while it is open (only the shown one is visible): switching tabs keeps each one's screen and modes, and the
 * view hears its output all along. Hidden or closed, the panel lets go of them; opened again, each tab is attached
 * again and starts from the server's replay of its recent output.
 */
function TerminalView({ terminalId, visible, ended, shell }: { terminalId: string; visible: boolean; ended: boolean; shell: ShellFamily | undefined }) {
  const host = useRef<HTMLDivElement>(null);
  /** `replayed`: since it was last attached, at which the replay clears it (a paste made before would be wiped) */
  const view = useRef<{ term: Terminal; replayed: number | null; lastOutput: number } | null>(null);
  const connected = useSessions((s) => s.connection === 'live');
  const paste = useTerminals((s) => s.pastes[terminalId]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const term = new Terminal({ fontFamily: terminalFont(), fontSize: TERMINAL_FONT_SIZE, theme: terminalTheme(element), minimumContrastRatio: TERMINAL_MIN_CONTRAST, cursorBlink: true, scrollback: 5000 });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(element);
    const state: { term: Terminal; replayed: number | null; lastOutput: number } = { term, replayed: null, lastOutput: 0 };
    view.current = state;
    term.attachCustomKeyEventHandler((event) => {
      // the shortcut that shows and hides the panel reaches the page, not the shell
      if (isTerminalShortcut(event)) return false;
      // with a selection, Ctrl+C copies it (as in VS Code); without, it interrupts as usual
      if (event.type === 'keydown' && event.ctrlKey && !event.altKey && event.key.toLowerCase() === 'c' && term.hasSelection()) {
        void navigator.clipboard.writeText(term.getSelection()).catch(() => { /* refused: nothing copied */ });
        term.clearSelection();
        return false;
      }
      return true;
    });
    // the replay holds the shell's old queries (device attributes, cursor position): what xterm.js answers to them
    // while it writes the replay is not the user's and is not sent, or the shell would read it as typed
    let replaying = 0;
    const typed = term.onData((data) => {
      if (!live() || replaying) return;
      for (const chunk of chunkInput(data)) send({ t: 'terminalInput', terminalId, data: chunk });
    });
    const stopHearing = onOutput(terminalId, (data, replay) => {
      if (replay) {
        term.reset();
        state.replayed = Date.now();
        replaying++;
        term.write(data, () => { replaying--; });
      } else term.write(data);
      state.lastOutput = Date.now();
    });
    let sent = '';
    const refit = () => {
      // a tab out of sight has no size to fit to
      if (!element.clientWidth || !element.clientHeight) return;
      fit.fit();
      noteSize(term.cols, term.rows);
      const size = `${term.cols}x${term.rows}`;
      if (size !== sent && live() && send({ t: 'terminalResize', terminalId, cols: term.cols, rows: term.rows })) sent = size;
    };
    const resized = new ResizeObserver(refit);
    resized.observe(element);
    // the window style changes the tokens the colours come from
    const restyled = new MutationObserver(() => {
      term.options.theme = terminalTheme(element);
      term.options.fontFamily = terminalFont();
      refit();
    });
    restyled.observe(document.documentElement, { attributes: true, attributeFilter: ['data-window-style'] });
    return () => {
      typed.dispose();
      stopHearing();
      resized.disconnect();
      restyled.disconnect();
      view.current = null;
      term.dispose();
    };
  }, [terminalId]);

  // attached while connected: a new connection attaches again, and the replay puts the screen back
  useEffect(() => {
    if (!connected) return;
    // a replay is coming: what is to be pasted waits for it
    if (view.current) view.current.replayed = null;
    send({ t: 'terminalAttach', terminalId });
    return () => { if (live()) send({ t: 'terminalDetach', terminalId }); };
  }, [connected, terminalId]);

  useEffect(() => { if (view.current) view.current.term.options.disableStdin = ended; }, [ended]);
  useEffect(() => { if (visible) view.current?.term.focus(); }, [visible]);

  // a code block's command: pasted as the user would, once the shell is ready, then Enter if it is to run
  useEffect(() => {
    if (!paste) return;
    let timer = 0;
    const attempt = () => {
      const state = view.current;
      if (!state) return;
      const now = Date.now();
      const settled = state.replayed !== null && (now - state.lastOutput >= SETTLE_MS || now - state.replayed >= PASTE_DEADLINE_MS);
      if (!settled) { timer = window.setTimeout(attempt, SETTLE_MS); return; }
      // a shell without bracketed paste (cmd) runs each pasted line at once: unless asked to run, it gets one line, to
      // run with Enter (an older server does not say which shell: a POSIX one, whose separator cmd ignores harmlessly)
      const several = !paste.run && !state.term.modes.bracketedPasteMode && paste.text.includes('\n');
      state.term.paste(several ? oneLine(paste.text, shell ?? 'posix') : paste.text);
      if (paste.run && live()) send({ t: 'terminalInput', terminalId, data: '\r' });
      state.term.focus();
      useTerminals.getState().pasted(terminalId);
    };
    attempt();
    return () => window.clearTimeout(timer);
  }, [paste, terminalId, shell]);

  return <div ref={host} className="cp-terminal__screen" hidden={!visible} />;
}

/**
 * A session's integrated terminal, at the bottom of its window: a tab per shell (the server's), a new one with "+",
 * hidden with its chevron (or Ctrl/Cmd+Alt+T), and as tall as the user drags its top edge. Loaded the first time a
 * panel opens (Detail's TerminalSlot), so xterm.js stays out of the page until then.
 */
export function TerminalDrawer({ sessionId }: { sessionId: string }) {
  const words = t.session.terminal;
  const all = useTerminals((s) => s.tabs);
  const tabs = useMemo(() => tabsOf(all, sessionId), [all, sessionId]);
  const active = useTerminals((s) => s.active[sessionId]);
  const opening = useTerminals((s) => openingFor(s, sessionId) !== undefined);
  const height = useTerminals((s) => s.height);
  const { show, openTab, pick, close, setHeight } = useTerminals.getState();
  const box = useRef<HTMLElement>(null);
  useLayoutEffect(() => { box.current?.style.setProperty('--terminal-height', `${height}px`); }, [height]);
  // its last tab closed: the panel goes too
  useEffect(() => { if (!tabs.length && !opening) show(sessionId, false); }, [tabs.length, opening, show, sessionId]);

  const bounded = (next: number) => {
    const room = box.current?.parentElement?.clientHeight ?? 0;
    return Math.round(Math.min(Math.max(TERMINAL_HEIGHT.min, next), Math.max(TERMINAL_HEIGHT.min, room * MAX_SHARE)));
  };
  // dragged, it follows the pointer and the height is kept once let go
  const drag = (event: PointerEvent<HTMLDivElement>) => {
    const panel = box.current;
    if (!panel || event.button !== 0) return;
    event.preventDefault();
    const handle = event.currentTarget;
    const from = event.clientY, start = panel.offsetHeight;
    let next = start;
    handle.setPointerCapture(event.pointerId);
    const move = (each: globalThis.PointerEvent) => {
      next = bounded(start + from - each.clientY);
      panel.style.setProperty('--terminal-height', `${next}px`);
    };
    const end = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', end);
      handle.removeEventListener('pointercancel', end);
      setHeight(next);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  };
  const nudge = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowUp' ? KEY_STEP : event.key === 'ArrowDown' ? -KEY_STEP : 0;
    if (!step) return;
    event.preventDefault();
    setHeight(bounded(height + step));
  };

  return (
    <section ref={box} className="cp-terminal" aria-label={words.label}>
      <div
        className="cp-terminal__grip" role="separator" aria-orientation="horizontal" aria-label={words.resize} aria-valuenow={height} aria-valuemin={TERMINAL_HEIGHT.min}
        tabIndex={0} onPointerDown={drag} onKeyDown={nudge}
      />
      <header className="cp-terminal__bar">
        <div className="cp-terminal__tabs" role="tablist" aria-label={words.tabs}>
          {tabs.map((tab) => {
            const ended = tab.exitCode !== undefined;
            return (
              <div key={tab.id} className="cp-terminal__tab" data-active={tab.id === active} data-ended={ended}>
                <button type="button" role="tab" aria-selected={tab.id === active} title={ended ? words.endedTitle : tab.title} onClick={() => pick(sessionId, tab.id)}>
                  <span className="cp-terminal__title">{tab.title}</span>
                  {tab.exitCode !== undefined && <span className="cp-terminal__ended">{words.ended(tab.exitCode)}</span>}
                </button>
                <button type="button" className="cp-terminal__close" aria-label={words.close(tab.title)} title={words.close(tab.title)} onClick={() => close(tab.id)}><CloseIcon /></button>
              </div>
            );
          })}
        </div>
        <button type="button" className="cp-icon-button" data-size="small" aria-label={words.newTab} title={words.newTabTitle} onClick={() => openTab(sessionId)}><PlusIcon /></button>
        <button type="button" className="cp-icon-button" data-size="small" aria-label={words.hide} title={words.hide} onClick={() => show(sessionId, false)}><ChevronDownIcon /></button>
      </header>
      <div className="cp-terminal__body">
        {tabs.map((tab) => <TerminalView key={tab.id} terminalId={tab.id} visible={tab.id === active} ended={tab.exitCode !== undefined} shell={tab.shell} />)}
        {!tabs.length && <p className="cp-terminal__note">{words.opening}</p>}
      </div>
    </section>
  );
}
