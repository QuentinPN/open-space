// The tools of the HD people (src/room/chibi-hd.ts): a grid of colour cells that can shift what is drawn on it (the
// upper body bobs while walking), shaded balls, tones that lean warm in the light and plum in the shade, and how the
// body stands in the frame being drawn. Pure: no DOM, so the drawings are tested in node.
import { HD_INK } from '../../design/people-palette.ts';
import { COZY_PALETTE } from '../../design/room-palette.ts';
import type { Look } from '../../../shared/look.ts';
import { PixelGrid, type Cell } from '../cozy/pixels.ts';
import type { Outfit } from '../outfits.ts';
import type { Pose } from '../sprites.ts';

export const OUTLINE = COZY_PALETTE.outline;

/**
 * The art of one sprite, in art pixels: x -8 to 31, y -18 to 37. The person is centred on x 12 (between columns 11 and
 * 12, so the mirrored sprite keeps its place), the top of a bare head near row 1, the soles on row 35.
 */
export const BOX = { x0: -8, y0: -18, width: 40, height: 56 } as const;
/** Where the sprite stands: the first row under the soles, or, seated, under the hips (on the seat). */
export const ANCHOR = { x: 12, stand: 36, sit: 31 } as const;

/** A grid whose drawing can be shifted by (dx, dy): the upper body drawn one row up on a step. */
export class Art extends PixelGrid {
  dx = 0;
  dy = 0;
  override set(x: number, y: number, colour: Cell, clip?: readonly Cell[]) { super.set(x + this.dx, y + this.dy, colour, clip); }
  override get(x: number, y: number): Cell { return super.get(x + this.dx, y + this.dy); }
}

export const newArt = () => new Art(BOX.x0, BOX.y0, BOX.width, BOX.height);

/** Draws on a layer of its own (shifted like `art`), outlines it and lays it on `art`: a part with its own contour. */
export function layer(art: Art, draw: (part: Art) => void, colour: string = OUTLINE) {
  const part = newArt();
  part.dx = art.dx; part.dy = art.dy;
  draw(part);
  part.outline(colour);
  part.cells.forEach((cell, index) => { if (cell) art.cells[index] = cell; });
}

/** A colour and its tones: lit (towards a warm white), base, shaded and dark (towards plum). Hex in, hex out. */
export interface Tones { light: string; base: string; shade: string; dark: string }

const channels = (hex: string) => { const value = Number.parseInt(hex.slice(1), 16); return [(value >> 16) & 255, (value >> 8) & 255, value & 255]; };
const toHex = (values: readonly number[]) => `#${values.map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')).join('')}`;
/** `a` moved `amount` of the way to `b`. */
export const mixHex = (a: string, b: string, amount: number) => { const from = channels(a), to = channels(b); return toHex(from.map((value, index) => value + (to[index] - value) * amount)); };
const times = (hex: string, factor: number) => toHex(channels(hex).map((value) => value * factor));

const toneCache = new Map<string, Tones>();
export function hdTones(base: string): Tones {
  let value = toneCache.get(base);
  if (!value) {
    value = { light: mixHex(times(base, 1.3), HD_INK.warm, 0.2), base, shade: mixHex(times(base, 0.8), HD_INK.cool, 0.12), dark: mixHex(times(base, 0.6), HD_INK.cool, 0.2) };
    toneCache.set(base, value);
  }
  return value;
}

/** A ball shaded from the top left: its shade all over, the base inside it, a lit spot (`shine` false: none). */
export function ball(art: Art, cx: number, cy: number, rx: number, ry: number, tones: Tones, clip?: readonly Cell[], shine = true) {
  art.ellipse(cx, cy, rx, ry, tones.shade, clip);
  art.ellipse(cx - 0.8, cy - 0.9, rx - 0.9, ry - 0.9, tones.base, [tones.shade]);
  if (shine) art.ellipse(cx - rx * 0.42, cy - ry * 0.5, rx * 0.36, ry * 0.26, tones.light, [tones.base]);
}

/** A band of rows filled between two edges: `edges(row)` gives [left, right) for each row from `from` to `to`. */
export function band(art: Art, from: number, to: number, edges: (row: number) => readonly [number, number], colour: (x: number, row: number) => Cell) {
  for (let row = from; row <= to; row++) {
    const [left, right] = edges(row);
    for (let x = Math.round(left); x < Math.round(right); x++) art.set(x, row, colour(x, row));
  }
}

/** A row pattern read the other way round: the right-hand piece of a symmetric pair. */
export const flipRows = (rows: readonly string[]) => rows.map((row) => [...row].reverse().join(''));

/** What is drawn in one frame: the pose as the sprite needs it (left-facing poses are mirrored after). */
export interface Frame { back: boolean; posture: Pose['posture']; step: 0 | 1; blinking: boolean; smiling: boolean; gesture: Pose['gesture'] }

/** A leg standing or walking: its column (2 wide), its last row, its shoe's left column and top row (2 rows). */
export interface Leg { x: number; last: number; shoeX: number; shoeY: number; side: 0 | 1 }
/** An arm hanging, swinging or bent: the rows of the upper arm (2 wide at `x`) and where the hand is. */
export interface Arm { x: number; from: number; to: number; hand: { x: number; y: number }; side: 0 | 1; forearm?: { x: number; y: number; width: number } }

/** How the body stands in the frame, for every painter. */
export interface Body {
  art: Art;
  /** the look as drawn under the costumes and the wardrobe's pieces (underCostume, underWardrobe) */
  look: Look;
  /** the look as worn, its pieces included */
  worn: Look;
  outfit: Outfit;
  front: boolean;
  sit: boolean;
  walk: boolean;
  step: 0 | 1;
  frame: Frame;
  /** the upper body's shift up on a walking step (0 or -1) */
  bob: number;
  swim: boolean;
  skin: Tones;
  hair: Tones;
  legs: readonly Leg[];
  arms: readonly Arm[];
  raising: boolean;
  typing: boolean;
}

export const ROWS = {
  /** the torso, under the chin */
  torso: 19, waist: 27, hips: 28, hem: 30,
  /** the eyes' lid, the mouth, the blush */
  eyes: 12, mouth: 16, blush: 15,
} as const;
