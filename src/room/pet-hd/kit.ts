// What the cozy rooms' HD pets are drawn with (src/room/pet-hd.ts): a fur's warm tones, shaded balls, ears, eyes and
// blush, on a PixelGrid (cozy/pixels.ts) whose row 0 is the floor under the pet, where the outline under its paws
// falls (they are drawn down to row -1) and column 0 the middle of its feet; up is negative, the pet faces right. Each part is drawn on a layer of its own and outlined, so a head stands out of its
// body as the HD people's do.
import { PET_HD_PALETTE as H } from '../../design/room-palette.ts';
import type { PetChoice } from '../../../shared/pets.ts';
import { type PixelGrid, outlined } from '../cozy/pixels.ts';
import type { PetActivity } from '../pet.ts';

export const OUT = H.outline;

/** A fur's tones: lit (top left), its own, shaded (bottom right), and darker still for stripes and lines. */
export interface Fur { light: string; base: string; shade: string; dark: string }

const rgb = (hex: string) => { const value = Number.parseInt(hex.slice(1), 16); return [(value >> 16) & 255, (value >> 8) & 255, value & 255]; };
const hexOf = (channels: readonly number[]) => `#${channels.map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0')).join('')}`;

/** From `a` towards `b`, `amount` of the way (0 to 1). */
export const mix = (a: string, b: string, amount: number) => { const from = rgb(a), to = rgb(b); return hexOf(from.map((channel, index) => channel + (to[index] - channel) * amount)); };
/** Darker by `factor`, the blue going down more than the red: shadows lean warm. */
export const warmDarker = (hex: string, factor: number) => { const [red, green, blue] = rgb(hex); return hexOf([red * factor, green * (factor - 0.07), blue * (factor - 0.12)]); };
const lightness = (hex: string) => { const [red, green, blue] = rgb(hex); return (0.3 * red + 0.59 * green + 0.11 * blue) / 255; };

const furs = new Map<string, Fur>();
/** A colour's tones, lit towards a warm cream and shaded towards brown. */
export function furTones(base: string): Fur {
  let fur = furs.get(base);
  if (!fur) {
    const pale = lightness(base);
    fur = {
      light: mix(base, H.warmLight, pale < 0.2 ? 0.22 : pale > 0.85 ? 0.6 : 0.38),
      base,
      shade: pale > 0.85 ? mix(base, H.warmShade, 0.16) : pale < 0.2 ? warmDarker(base, 0.78) : warmDarker(base, 0.86),
      dark: pale < 0.2 ? mix(base, H.warmLight, 0.12) : warmDarker(base, 0.66),
    };
    furs.set(base, fur);
  }
  return fur;
}

/** What a pet's eyes show: open, shut (asleep, washing), or happy arcs (cuddled). */
export type Eyes = 'open' | 'shut' | 'happy';

export interface Pose { activity: PetActivity; frame: 0 | 1; cuddled: boolean }

/** The pet as drawn: its choice, its fur's tones, its eyes' colour. */
export interface Look { choice: Exclude<PetChoice, { kind: 'none' }>; fur: Fur; iris: string }

export type Painter = (grid: PixelGrid, look: Look, pose: Pose) => void;

/** Its eyes in a pose: happy when cuddled, shut asleep (and washing, unless `washOpen`). */
export const eyesOf = (pose: Pose, washOpen = false): Eyes =>
  (pose.cuddled ? 'happy' : pose.activity === 'sleep' || (pose.activity === 'wash' && !washOpen) ? 'shut' : 'open');

/** Draws on a layer of its own, outlined. */
export const part = (grid: PixelGrid, draw: (layer: PixelGrid) => void) => outlined(grid, draw, OUT);

/** An ellipse lit at its top left and shaded at its bottom right. */
export function ball(grid: PixelGrid, cx: number, cy: number, rx: number, ry: number, fur: Fur) {
  grid.ellipse(cx, cy, rx, ry, fur.shade);
  grid.ellipse(cx - 0.7, cy - 0.8, Math.max(0.6, rx - 0.8), Math.max(0.6, ry - 0.8), fur.base, [fur.shade]);
  grid.ellipse(cx - rx * 0.4, cy - ry * 0.45, Math.max(0.6, rx * 0.32), Math.max(0.5, ry * 0.24), fur.light, [fur.base]);
}

/** A patch of `colour` over what is already drawn (a marking clipped to the fur under it). */
export function patch(grid: PixelGrid, cx: number, cy: number, rx: number, ry: number, colour: string, over: readonly string[]) {
  grid.ellipse(cx, cy, rx, ry, colour, over);
}

/** The colours a fur is drawn in, to lay markings over. */
export const furCells = (fur: Fur): readonly string[] => [fur.light, fur.base, fur.shade];

/**
 * A pointed ear `height` rows tall, its tip at (x, y), widening a cell a row towards `inward` (+1: right, -1: left) and
 * one every other row outwards, lined with `inside` within.
 */
export function pointedEar(grid: PixelGrid, x: number, y: number, height: number, inward: 1 | -1, fur: Fur, inside: string | null, spread = 0.5) {
  for (let row = 0; row < height; row++) {
    const outer = x - inward * Math.floor(row * spread), inner = x + inward * row;
    for (let cell = Math.min(outer, inner); cell <= Math.max(outer, inner); cell++) {
      const edge = cell === outer || cell === inner;
      grid.set(cell, y + row, !edge && inside && row > 0 && row < height - 1 ? inside : inward === 1 ? fur.light : fur.base);
    }
  }
}

/**
 * Two eyes, the left one's columns `lx` and `lx + 1`, the right one's `rx` and `rx + 1`, their top row at y. Open: a lid,
 * a white glint, the iris (big: three rows; small: two). Shut: a little smile of a lid each (asleep, ‿ ‿); happy: arcs
 * up (^ ^).
 */
export function eyes(grid: PixelGrid, lx: number, rx: number, y: number, state: Eyes, iris: string = H.eye, small = false) {
  for (const [x, outer] of [[lx, lx - 1], [rx, rx + 2]] as const) {
    const inner = outer < x ? x + 2 : x - 1;
    if (state === 'open') {
      if (small) { grid.set(x, y, H.glint); grid.set(x + 1, y, H.eye); grid.rect(x, y + 1, 2, 1, H.eye); if (iris !== H.eye) grid.set(x + 1, y + 1, iris); continue; }
      grid.rect(x, y, 2, 1, H.eye);
      grid.set(x, y + 1, H.glint); grid.set(x + 1, y + 1, iris === H.eye ? H.eye : iris);
      grid.set(x, y + 2, iris === H.eye ? H.eye : mix(iris, H.eye, 0.45)); grid.set(x + 1, y + 2, iris === H.eye ? H.eye : iris);
      continue;
    }
    const low = small ? y + 1 : y + 2;
    if (state === 'shut') { grid.rect(x, low, 2, 1, H.eye); grid.set(outer, low - 1, H.eye); if (!small) grid.set(inner, low - 1, H.eye); }
    else { grid.rect(x, low - 1, 2, 1, H.eye); grid.set(outer, low, H.eye); if (!small) grid.set(inner, low, H.eye); }
  }
}

/** A touch of blush, `width` cells. */
export const blush = (grid: PixelGrid, x: number, y: number, width = 2) => grid.rect(x, y, width, 1, H.blush);

/** Lays rows of letters (`.` left empty) from (x, y), each letter a colour of `colours`. */
export const rows = (grid: PixelGrid, x: number, y: number, lines: readonly string[], colours: Readonly<Record<string, string>>) => grid.pattern(x, y, lines, colours);
