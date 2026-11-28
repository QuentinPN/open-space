// What Settings > Logs may show of an error or a toast: the keys it might carry masked, the user's home folder as "~",
// and no longer than MAX_LOG_TEXT. The server runs it before keeping a line (server/server-log.ts), with the values it
// knows to be secret; the page runs it on the toasts it shows, which it keeps too.

export const MASK = '•••';
export const MAX_LOG_TEXT = 2000;
/** A known value this long or longer is masked wherever it is, even inside a word. */
const MIN_KNOWN_LENGTH = 4;

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The names of assignments and fields whose value is a key (secret=, API_KEY=, "token": ...). */
const SECRET_NAME = '[A-Za-z0-9_.-]*(?:key|token|secret|password|passwd|pwd|pass|auth(?!or)|cookie|credential|signature)[A-Za-z0-9_.-]*';

/** Each shape a key takes in a text, and what is left of it. Run in this order: the widest shapes first. */
const RULES: readonly (readonly [RegExp, string | ((match: string, ...groups: string[]) => string)])[] = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g, MASK],
  // headers: what follows them is a key whatever its shape
  [/\b((?:proxy-)?authorization|set-cookie|cookie|x-api-key|api-key)(\s*:\s*)[^\r\n]+/gi, `$1$2${MASK}`],
  [/\b(bearer)(\s+)[A-Za-z0-9._~+/=-]{6,}/gi, `$1$2${MASK}`],
  // "Basic dXNlcjpwYXNz", not "Basic settings": a credential holds a digit, a sign of base64, or capitals inside
  [/\b(Basic|Token)(\s+)([A-Za-z0-9._~+/-]{6,}=*)/g, (match, name, space, value) => (/[\d=+/]|.[A-Z]/.test(value) ? `${name}${space}${MASK}` : match)],
  // https://user:password@host
  [/\b([a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:)[^\s/@]+@/gi, `$1${MASK}@`],
  // Open Space's own addresses with a key in them (server/http.ts)
  [/(\/(?:mcp|secrets|hooks)\/[^/\s?#'"]+\/|\/browser\/[^/\s?#'"]+\/(?:cdp|shared)\/)[^/\s?#'"&)]+/g, `$1${MASK}`],
  // "token": "value", and secret=value in an address, a command line or an environment
  [new RegExp(String.raw`("${SECRET_NAME}"\s*:\s*")[^"]*`, 'gi'), `$1${MASK}`],
  [new RegExp(String.raw`(?<![A-Za-z0-9_.-])(${SECRET_NAME}=)("?)[^\s&"'#,;]+`, 'gi'), `$1$2${MASK}`],
  // the shapes of well-known keys
  [/\bsk-[A-Za-z0-9_-]{16,}/g, MASK],
  [/\b(?:ghp|gho|ghs|ghu|ghr)_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}/g, MASK],
  [/\bxox[abprs]-[A-Za-z0-9-]{10,}/g, MASK],
  [/(?<!\d)\d{6,}:[A-Za-z0-9_-]{30,}/g, MASK],
  [/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g, MASK],
  [/\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g, MASK],
  // anything random enough to be one: a long hex, or a long base64 run mixing capitals, small letters and digits
  [/(?<![A-Za-z0-9])[A-Fa-f0-9]{32,}(?![A-Za-z0-9])/g, MASK],
  [/(?<![A-Za-z0-9_+-])[A-Za-z0-9_+-]{40,}={0,2}/g, (run) => (/[A-Z]/.test(run) && /[a-z]/.test(run) && /\d/.test(run) ? MASK : run)],
];

/** A home folder in any user's place on macOS, Linux or Windows (/Users/name, /home/name, C:\Users\name). */
const ANY_HOME = /\b[A-Za-z]:[\\/][Uu][Ss][Ee][Rr][Ss][\\/][^\\/\s'"`:;,)]+|(?<![\w.:/~-])\/(?:Users|home)\/[^/\s'"`:;,)]+/g;

/** `home` wherever it starts a path, written with either slash (and in any case, for a Windows one). */
function homePattern(home: string): RegExp | null {
  const trimmed = home.replace(/[\\/]+$/, '');
  if (trimmed.length < 2) return null;
  const windows = /^[A-Za-z]:|\\/.test(trimmed);
  const source = trimmed.split(/[\\/]+/).map(escapeRegExp).join(String.raw`[\\/]+`);
  return new RegExp(String.raw`${source}(?![^\\/\s'"\`:;,)])`, windows ? 'gi' : 'g');
}

/**
 * `text` with every value of `known` and every key-like run replaced by MASK, the home folder (`home`, and any user's
 * home folder) by "~", cut to MAX_LOG_TEXT.
 */
export function redact(text: string, known: readonly string[] = [], home?: string): string {
  return redactor(known, home)(text);
}

/** `redact` with `known` and `home` turned into patterns once, for many texts. */
export function redactor(known: readonly string[] = [], home?: string): (text: string) => string {
  const mask = maskerOf(known);
  const ownHome = home ? homePattern(home) : null;
  return (text) => {
    // the known values first, on the whole text (one linear pass), so the cut never splits one, even over several lines
    let out = cutBeforeRules(mask(text));
    if (ownHome) out = out.replace(ownHome, '~');
    out = out.replace(ANY_HOME, '~');
    for (const [pattern, replacement] of RULES) out = out.replace(pattern, replacement as string);
    return out.length > MAX_LOG_TEXT ? `${out.slice(0, MAX_LOG_TEXT)}…` : out;
  };
}

/** How far back from the early cut a whitespace is looked for; without one, that much is dropped. */
const CUT_MARGIN = 256;

/**
 * The text the rules work on: at most twice MAX_LOG_TEXT (masking shortens it; the final cut comes after). It is cut
 * at the last whitespace before that, so a key-like run, which holds none, is never split and left half unmasked; with
 * no whitespace in the last CUT_MARGIN characters, those are dropped.
 */
function cutBeforeRules(text: string): string {
  const limit = MAX_LOG_TEXT * 2;
  if (text.length <= limit) return text;
  for (let index = limit; index > limit - CUT_MARGIN; index -= 1) if (/\s/.test(text[index])) return text.slice(0, index);
  return text.slice(0, limit - CUT_MARGIN);
}

/** A short known value is masked only standing alone, never inside a word ("ab" in "table"). */
const SHORT_KNOWN_LENGTH = 2;
const TOKEN_CHAR = '[A-Za-z0-9_-]';

const base64Of = (value: string) => btoa(Array.from(new TextEncoder().encode(value), (byte) => String.fromCharCode(byte)).join('')).replace(/=+$/, '');

/** How a value shows in a text: as it is, in an address, inside a JSON string, in base64 and base64url (without padding). */
function writingsOf(value: string): string[] {
  const base64 = base64Of(value);
  return [value, encodeURIComponent(value), JSON.stringify(value).slice(1, -1), base64, base64.replace(/\+/g, '-').replace(/\//g, '_')];
}

/**
 * `text` with every value of `known`, however it is written (writingsOf), replaced by MASK. A writing of MIN_KNOWN_LENGTH
 * characters or more goes wherever it is; one of 2 or 3 only as a whole token. A 1-character value is not looked for:
 * it would mask every such letter of the text. One pass of one alternation of literals, the longest first so that one
 * holding another goes whole: linear in the text's length times the number of writings, without backtracking.
 * `short` false: the values of 2 or 3 characters are left, for a text the user reads as it is (a toast on screen:
 * "Started dev server" stays whole for a key "dev"); Settings > Logs masks them.
 */
export function maskKnown(text: string, known: readonly string[], { short = true }: { short?: boolean } = {}): string {
  return maskerOf(known, short)(text);
}

/** maskKnown with its pattern built once. */
function maskerOf(known: readonly string[], short = true): (text: string) => string {
  const shortest = short ? SHORT_KNOWN_LENGTH : MIN_KNOWN_LENGTH;
  const writings = [...new Set(known.filter((value) => value.length >= shortest).flatMap(writingsOf))]
    .filter((writing) => writing.length >= shortest)
    .sort((a, b) => b.length - a.length);
  if (!writings.length) return (text) => text;
  const pattern = new RegExp(writings.map((writing) => (writing.length >= MIN_KNOWN_LENGTH ? escapeRegExp(writing) : `(?<!${TOKEN_CHAR})${escapeRegExp(writing)}(?!${TOKEN_CHAR})`)).join('|'), 'g');
  return (text) => text.replace(pattern, MASK);
}
