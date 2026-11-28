import { createContext, type MouseEvent } from 'react';
import { commandOf } from '../lib/shell-code.ts';
import { useTerminals } from '../state/terminals.ts';

/** Copies the code block whose copy button was clicked (see mdToHtml), and shows a tick for a moment. */
export function copyCodeOnClick(target: EventTarget | null) {
  const button = target instanceof Element ? target.closest<HTMLElement>('[data-copy]') : null;
  const code = button?.closest('.cp-code')?.querySelector('pre');
  if (!button || !code) return;
  void navigator.clipboard.writeText((code.textContent ?? '').replace(/\n$/, '')).then(() => {
    button.dataset.copied = 'true';
    window.setTimeout(() => { delete button.dataset.copied; }, 1500);
  }, () => { /* refused: nothing copied, the button stays as it is */ });
}

/** The session whose conversation a message is in: its shell code blocks get a Run button for its terminal (Prose). */
export const CodeRunContext = createContext<string | null>(null);

const LANGUAGE_CLASS = 'language-';

/**
 * Pastes the shell code block whose Run button was clicked (see mdToHtml) into the session's terminal, its panel
 * opened, without running it; with Shift, runs it too.
 */
export function runCodeOnClick(event: MouseEvent, sessionId: string) {
  const button = event.target instanceof Element ? event.target.closest('[data-run]') : null;
  const code = button?.closest('.cp-code')?.querySelector('pre > code');
  if (!button || !code) return;
  const language = code.className.startsWith(LANGUAGE_CLASS) ? code.className.slice(LANGUAGE_CLASS.length) : null;
  const text = commandOf(code.textContent ?? '', language);
  if (text) useTerminals.getState().run(sessionId, { text, run: event.shiftKey });
}
