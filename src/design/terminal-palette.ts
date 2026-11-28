// The colours of the integrated terminal (src/command/TerminalPanel.tsx). xterm.js paints them itself, so it cannot
// read the CSS tokens: they are read here from the page (tokens.css, the window style applied) and handed to it, and
// read again when the window style changes. The panel's background is the one it really shows (a translucent token
// laid over what is behind it); the ANSI colours are a set tuned for a dark background or one for a light background,
// picked by its luminance. On a dark one, the tones of tokens.css take over red, green, yellow, blue and magenta.
import type { ITheme } from '@xterm/xterm';

type Ansi = Required<Pick<ITheme, 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'brightBlack' | 'brightRed' | 'brightGreen' | 'brightYellow' | 'brightBlue' | 'brightMagenta' | 'brightCyan' | 'brightWhite'>>;

/** Tuned to the panes' night blue. */
const ANSI_DARK: Ansi = {
  black: '#1d2333',
  red: '#ff8f8a',
  green: '#6fdc9b',
  yellow: '#ffb866',
  blue: '#8cc2ff',
  magenta: '#f29bd2',
  cyan: '#7fd8e0',
  white: '#c9d0e0',
  brightBlack: '#5c6580',
  brightRed: '#ffb3ae',
  brightGreen: '#9cf0bf',
  brightYellow: '#ffd29e',
  brightBlue: '#b5d8ff',
  brightMagenta: '#f9c1e4',
  brightCyan: '#a9ecf1',
  brightWhite: '#f3f5fb',
};

/** For a light background: the same hues, deep enough to read on it ("white" is a mid grey, as light terminals do). */
const ANSI_LIGHT: Ansi = {
  black: '#1d2333',
  red: '#c4302b',
  green: '#1f8a4c',
  yellow: '#9a6700',
  blue: '#2563c9',
  magenta: '#a3329b',
  cyan: '#0e7c86',
  white: '#6b7280',
  brightBlack: '#4b5563',
  brightRed: '#d9443f',
  brightGreen: '#22a05a',
  brightYellow: '#b07a00',
  brightBlue: '#3b7ae0',
  brightMagenta: '#bb44b2',
  brightCyan: '#11929d',
  brightWhite: '#374151',
};

/** What is behind the panel when nothing on the page says (and the classic style's sunken surface). */
const NIGHT = '#080b12';

/** Until the page's tokens are read (and if one cannot be): the classic window style's. */
const FALLBACK: ITheme = {
  ...ANSI_DARK,
  background: NIGHT,
  foreground: '#e9edf7',
  cursor: '#9aa8ff',
  cursorAccent: NIGHT,
  selectionBackground: 'rgba(154, 168, 255, 0.28)',
};

/** Which token gives each colour: the sunken surface of the code blocks, the text, the accent for the cursor. */
const TOKENS: Partial<Record<keyof ITheme, string>> = {
  foreground: '--color-text',
  cursor: '--color-accent',
  selectionBackground: '--color-accent-soft',
};
/** The tones that colour the ANSI hues on a dark background (pastels, made for one). */
const TONES: Partial<Record<keyof Ansi, string>> = {
  red: '--tone-error',
  green: '--tone-reply',
  yellow: '--tone-permission',
  blue: '--tone-work',
  magenta: '--tone-peer',
};
const BACKGROUND = '--color-surface-sunken';

export const TERMINAL_FONT_SIZE = 13;
/** Every colour keeps at least this contrast with what is under it (WCAG AA for text): xterm.js adjusts the others. */
export const TERMINAL_MIN_CONTRAST = 4.5;
const FALLBACK_FONT = 'ui-monospace, Menlo, Consolas, monospace';

export interface Rgba { r: number; g: number; b: number; a: number }

/** A colour as the canvas writes it ("#rrggbb", "rgba(r, g, b, a)") or a computed style ("rgb(r, g, b)"); null otherwise. */
export function parseColor(color: string): Rgba | null {
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color.trim());
  if (hex) return { r: Number.parseInt(hex[1], 16), g: Number.parseInt(hex[2], 16), b: Number.parseInt(hex[3], 16), a: 1 };
  const rgb = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i.exec(color.trim());
  if (!rgb) {
    const srgb = /^color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/i.exec(color.trim());
    if (!srgb) return null;
    const a = srgb[4] === undefined ? 1 : srgb[4].endsWith('%') ? Number.parseFloat(srgb[4]) / 100 : Number.parseFloat(srgb[4]);
    return { r: Math.round(Number(srgb[1]) * 255), g: Math.round(Number(srgb[2]) * 255), b: Math.round(Number(srgb[3]) * 255), a };
  }
  const alpha = rgb[4] === undefined ? 1 : rgb[4].endsWith('%') ? Number.parseFloat(rgb[4]) / 100 : Number.parseFloat(rgb[4]);
  return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]), a: alpha };
}

/** `top` laid over `bottom`, which shows through as much as `top` is transparent. */
export function over(top: Rgba, bottom: Rgba): Rgba {
  const mix = (front: number, back: number) => Math.round(front * top.a + back * (1 - top.a));
  return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a: 1 };
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance({ r, g, b }: Rgba): number {
  const channel = (value: number) => { const c = value / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Light: dark text reads better on it than light text (the luminance where both contrast alike). */
export const isLight = (background: Rgba) => luminance(background) > 0.179;

/** The ANSI colours made for `background`. */
export const ansiFor = (background: Rgba): Ansi => (isLight(background) ? ANSI_LIGHT : ANSI_DARK);

const hexOf = ({ r, g, b }: Rgba) => `#${[r, g, b].map((each) => each.toString(16).padStart(2, '0')).join('')}`;

let canvas: CanvasRenderingContext2D | null | undefined;

/** A CSS colour as xterm.js reads it ("#rrggbb", or "rgba(r, g, b, a)" once translucent): the canvas writes it so. */
function normalized(color: string): string | null {
  if (canvas === undefined) canvas = document.createElement('canvas').getContext('2d');
  if (!canvas || !color) return null;
  canvas.fillStyle = '#000001';
  canvas.fillStyle = color;
  const written = String(canvas.fillStyle);
  // a colour the canvas could not read leaves the marker in place
  return written === '#000001' && color !== '#000001' ? null : written;
}

/** What shows behind `element`: its ancestors' backgrounds (not its own, which is the one being worked out) laid one over the other, on the night when they let it through. */
function behind(element: Element | null): Rgba {
  const layers: Rgba[] = [];
  for (let each = element?.parentElement ?? null; each; each = each.parentElement) {
    const color = parseColor(getComputedStyle(each).backgroundColor);
    if (!color || color.a === 0) continue;
    layers.push(color);
    if (color.a >= 1) break;
  }
  return layers.reduceRight((under, layer) => over(layer, under), parseColor(NIGHT) as Rgba);
}

/** The terminal's colours, from the tokens of the page as it is dressed now; `panel`: where the terminal is shown. */
export function terminalTheme(panel: Element | null = null): ITheme {
  const style = getComputedStyle(document.documentElement);
  const read = (token: string) => normalized(style.getPropertyValue(token).trim());
  const sunken = parseColor(read(BACKGROUND) ?? NIGHT) ?? (parseColor(NIGHT) as Rgba);
  const background = sunken.a >= 1 ? sunken : over(sunken, behind(panel));
  const light = isLight(background);
  const theme: ITheme = { ...FALLBACK, ...ansiFor(background), background: hexOf(background), cursorAccent: hexOf(background) };
  for (const [key, token] of Object.entries({ ...TOKENS, ...(light ? {} : TONES) }) as [keyof ITheme, string][]) {
    const color = read(token);
    if (color) (theme as Record<string, unknown>)[key] = color;
  }
  return theme;
}

/** The code font of the page (--font-mono, as the code editor's). */
export const terminalFont = () => getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim() || FALLBACK_FONT;
