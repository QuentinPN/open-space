// What moves in the cozy rooms' decor (src/room/cozy/): an ambiance's sea, flames, neon or fireflies (ambiance/index.ts
// AmbianceMotion), a home's screens and fire (home/kit.ts). Each frame they are drawn over the room's cached art, a few
// pixels each, on layers that only take the cells of the art painted in some colours (a mask, taken once per scene
// with the art, before its light): what stands in front of them in the art keeps them out, and the room is never
// painted again. Pure but for the pen the layers draw with (the room's canvas): tested without a DOM.
import { COZY_HOME_PALETTE } from '../../design/room-palette.ts';
import { ROOM_BOX } from './geometry.ts';
import { type PixelGrid, type PixelTarget, type Wall, wallPatch, wallX, wallY } from './pixels.ts';

/** What a layer draws its pixels with: the room's canvas (its transform set to the room's pixels), or a test's. */
export interface Pen { fillStyle: CanvasRenderingContext2D['fillStyle']; fillRect(x: number, y: number, width: number, height: number): void }

/** For each cell of a room's box: 0 off the mask, else 1 + the index of the art's colour there among the mask's colours. */
export type CellMask = Uint16Array;

/** The cells of `grid` (a room's box) painted in one of `colours`, each with its colour's place among them (CellMask). */
export function colourMask(grid: PixelGrid, colours: readonly string[]): CellMask {
  const places = new Map<string, number>();
  colours.forEach((colour, index) => { if (!places.has(colour)) places.set(colour, index + 1); });
  const mask: CellMask = new Uint16Array(ROOM_BOX.width * ROOM_BOX.height);
  grid.cells.forEach((colour, cell) => { if (colour) mask[cell] = places.get(colour) ?? 0; });
  return mask;
}

/** A part of a back wall, from `a0` to `a1` along it and `z0` to `z1` up: a window's glass. */
export interface WallRect { wall: Wall; a0: number; a1: number; z0: number; z1: number }

/** `mask` kept only inside `rect` on its wall (a window's glass): what its view shows, and nowhere else. */
export function withinWall(mask: CellMask, rect: WallRect): CellMask {
  const inside = new Uint8Array(mask.length);
  wallPatch({ set(x, y) { if (x >= 0 && y >= 0 && x < ROOM_BOX.width && y < ROOM_BOX.height) inside[Math.floor(y) * ROOM_BOX.width + Math.floor(x)] = 1; } }, rect.wall, rect.a0, rect.a1, rect.z0, rect.z1, '');
  return mask.map((tone, cell) => (inside[cell] ? tone : 0));
}

/**
 * Single pixels drawn by `pen`, only over the cells of `mask`: one per mask, made once with the room's art and given
 * the room's canvas each frame (nothing is made as the frames go by).
 */
export class MotionLayer implements PixelTarget {
  pen: Pen | null = null;
  readonly mask: CellMask;
  /** the mask's colours, in its order */
  readonly colours: readonly string[];
  constructor(mask: CellMask, colours: readonly string[]) { this.mask = mask; this.colours = colours; }

  private cell(x: number, y: number): number {
    const column = Math.floor(x), row = Math.floor(y);
    return column < 0 || row < 0 || column >= ROOM_BOX.width || row >= ROOM_BOX.height ? -1 : row * ROOM_BOX.width + column;
  }

  /** Which of its mask's colours the art has at (x, y), by its place among them; -1 off the mask. */
  toneAt(x: number, y: number): number {
    const cell = this.cell(x, y);
    return cell < 0 ? -1 : this.mask[cell] - 1;
  }

  /** The art's colour at (x, y), if it is one of the mask's; null off the mask. */
  colourAt(x: number, y: number): string | null {
    const tone = this.toneAt(x, y);
    return tone < 0 ? null : this.colours[tone];
  }

  set(x: number, y: number, colour: string) {
    const cell = this.cell(x, y);
    if (cell < 0 || !this.mask[cell] || !this.pen) return;
    this.pen.fillStyle = colour;
    this.pen.fillRect(Math.floor(x), Math.floor(y), 1, 1);
  }
}

/**
 * A point of a back wall drawn `now` this frame, where the art shows it `was` (what it is at rest): left alone where
 * something else was drawn over it (a glint on the sea, a mullion), or where it does not change.
 */
export function redraw(layer: MotionLayer, wall: Wall, a: number, z: number, was: string, now: string) {
  if (was === now) return;
  const x = wallX(wall, a), y = wallY(wall, a, z);
  if (layer.colourAt(x, y) === was) layer.set(x, y, now);
}

/** A number in [0, 1) that stays the same for (a, b): where the bricks, the stars and the lit windows fall, which way a flame leans. */
export function hash(a: number, b: number): number {
  let value = (a * 374761393 + b * 668265263) | 0;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

/**
 * A flame flickering where the art has one: its cells in the box `width` wide and `height` tall standing on (x, y)
 * (its foot, on screen) take its `tones` (its edge, its body, its heart, its core, as its mask lists them) by how hot
 * they are this frame: hotter low and in the middle, the middle swaying, the whole of it breathing. Its outline stays
 * the art's, so nothing round it is drawn over. `seed`: each flame its own.
 */
export function flicker(layer: MotionLayer, x: number, y: number, width: number, height: number, tones: readonly [string, string, string, string], frame: number, seed: number) {
  const step = frame >> 1, sway = (hash(seed, step) - 0.5) * 2.4, breath = hash(step, seed + 7) * 0.2 - 0.1, half = width / 2;
  for (let row = 0; row < height; row++) {
    const up = (row + 0.5) / height, py = y - 1 - row, middle = x + 0.5 + sway * up;
    for (let px = Math.floor(x - half) - 1; px <= Math.ceil(x + half) + 1; px++) {
      if (layer.toneAt(px, py) < 0) continue;
      const across = Math.abs(px + 0.5 - middle) / (half * (1.1 - up * 0.6) + 0.5);
      const heat = 1.05 - across - up * 0.75 + breath + (hash(px * 31 + py, step + seed) - 0.5) * 0.18;
      layer.set(px, py, tones[heat > 0.62 ? 3 : heat > 0.38 ? 2 : heat > 0.12 ? 1 : 0]);
    }
  }
}

/**
 * A light glimmering where the art has it (a lantern's glass, a bulb, a lit paper): each of its cells in the box from
 * (x0, y0), `width` by `height`, takes one of its layer's colours, listed from the darkest to the brightest, a step
 * brighter or darker as the light breathes this frame, a cell or two on its own. `seed`: each light its own.
 */
export function glimmer(layer: MotionLayer, x0: number, y0: number, width: number, height: number, frame: number, seed: number) {
  const step = frame >> 1, roll = hash(seed, step), shift = roll < 0.22 ? -1 : roll > 0.84 ? 1 : 0, last = layer.colours.length - 1;
  for (let y = y0; y < y0 + height; y++) for (let x = x0; x < x0 + width; x++) {
    const tone = layer.toneAt(x, y);
    if (tone < 0) continue;
    const own = hash(x * 53 + y, step + seed), next = Math.max(0, Math.min(last, tone + shift + (own > 0.93 ? 1 : own < 0.05 ? -1 : 0)));
    if (next !== tone) layer.set(x, y, layer.colours[next]);
  }
}

/** The steam of a hot drink, rising from (x, y): see-through (`tones`: thick, then thin), it shows the same at every hour. */
export function steam(target: PixelTarget, x: number, y: number, frame: number, tones: readonly [string, string] = COZY_HOME_PALETTE.steam) {
  for (let index = 0; index < 3; index++) {
    const age = (frame + index * 7) % 21;
    if (age > 17) continue;
    target.set(x + (index - 1) * 2 + Math.round(Math.sin((age + index * 3) * 0.55)), y - Math.floor(age * 0.6), tones[age < 9 ? 0 : 1]);
  }
}
