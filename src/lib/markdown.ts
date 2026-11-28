// Markdown displayed safely (every message): raw HTML is escaped, only http(s)/mailto links (opened in a new tab),
// remote images are replaced by their alt text. Code blocks get a copy button (copyCodeOnClick copies them), and those
// of a shell a Run button too where a terminal can take them (runCodeOnClick); a copied selection keeps its links'
// addresses (copyWithLinks).
import { Marked } from 'marked';
import { findMentions } from '../../shared/mentions.ts';
import { t } from '../i18n/index.ts';
import { SAFE_URL } from './links.ts';
import { isShellLanguage } from './shell-code.ts';

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** A clipboard, then a tick once copied (components.css swaps them). */
const copyButton = () => `<button type="button" class="cp-code__copy" data-copy aria-label="${escapeHtml(t.common.code.copy)}" title="${escapeHtml(t.common.code.copyTitle)}">`
  + '<svg class="cp-icon" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
  + '<g class="cp-code__clipboard"><rect x="4.5" y="3" width="8" height="10.5" rx="1.5"/><path d="M6.5 3V2h4v1"/></g>'
  + '<path class="cp-code__done" d="M3.5 8.5l3 3 6-7"/></svg></button>';

/** Pastes the block into the session's terminal (Shift: and runs it); `icon`: its markup, from Icons.tsx. */
const runButton = (icon: string) => `<button type="button" class="cp-code__run" data-run aria-label="${escapeHtml(t.common.code.run)}" title="${escapeHtml(t.common.code.runTitle)}">${icon}</button>`;

// the session names "@" can name, and the Run button's icon (null: no Run button), for the text being parsed (marked
// has no per-call option an extension or a renderer can read)
let names: readonly string[] = [];
let runIcon: string | null = null;

const marked = new Marked({ breaks: true, gfm: true });
marked.use({
  extensions: [{
    name: 'mention',
    level: 'inline',
    start: (src) => findMentions(src, names)[0]?.start,
    tokenizer(src) {
      const mention = findMentions(src, names)[0];
      if (mention?.start === 0) return { type: 'mention', raw: src.slice(0, mention.end) };
    },
    renderer: ({ raw }) => `<span class="cp-mention"><span class="cp-at">@</span>${escapeHtml(raw.slice(1))}</span>`,
  }],
  renderer: {
    html: ({ text }) => escapeHtml(text ?? ''),
    link({ href, tokens }) {
      const text = this.parser.parseInline(tokens);
      if (!SAFE_URL.test(href ?? '')) return text;
      return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
    image({ text }) { return escapeHtml(text ?? ''); },
    code({ text, lang, escaped }) {
      const language = /^[\w+-]+$/.test(lang ?? '') ? ` class="language-${lang}"` : '';
      const body = `${text.replace(/\n$/, '')}\n`;
      const run = runIcon !== null && isShellLanguage(lang) ? runButton(runIcon) : '';
      return `<div class="cp-code"><pre><code${language}>${escaped ? body : escapeHtml(body)}</code></pre>${copyButton()}${run}</div>\n`;
    },
  },
});

/**
 * `mentions`: the session names an "@" in the text can name, shown as in the field. `run`: the shell blocks get a Run
 * button with this icon (the text is in a session's conversation and its terminal can take them).
 */
export function mdToHtml(text: string, mentions: readonly string[] = [], run?: { icon: string }): string {
  names = mentions;
  runIcon = run?.icon ?? null;
  return marked.parse(text, { async: false }) as string;
}
