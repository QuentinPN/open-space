// The cozy rooms' pixel art (src/room/cozy/): a grid of colour cells in the room's own pixels, each part drawn on a
// layer of its own and outlined before it is laid on the rest, then painted on a canvas in runs. The helpers draw boxes
// standing on the floor and lines and patches on their faces and on the two back walls, in the room's units (see
// geometry.ts: two units across are one pixel down).
import { ROOM_PALETTE } from '../../design/room-palette.ts';
import { ring } from '../pixel-art.ts';
import { ORIGIN, ROOM_BOX } from './geometry.ts';

export type Cell = string | null;
/** A colour and its tones: light, base, dark. */
export type Tones = readonly [string, string, string];

export class PixelGrid {
  cells: Cell[];
  readonly x0: number;
  readonly y0: number;
  readonly width: number;
  readonly height: number;
  constructor(x0: number, y0: number, width: number, height: number) {
    this.x0 = x0; this.y0 = y0; this.width = width; this.height = height;
    this.cells = new Array<Cell>(width * height).fill(null);
  }

  private index(x: number, y: number): number {
    const column = Math.floor(x) - this.x0, row = Math.floor(y) - this.y0;
    return column < 0 || row < 0 || column >= this.width || row >= this.height ? -1 : row * this.width + column;
  }

  /** `clip`: only over cells of these colours (null for empty ones). */
  set(x: number, y: number, colour: Cell, clip?: readonly Cell[]) {
    const index = this.index(x, y);
    if (index < 0 || (clip && !clip.includes(this.cells[index]))) return;
    this.cells[index] = colour;
  }

  get(x: number, y: number): Cell {
    const index = this.index(x, y);
    return index < 0 ? null : this.cells[index];
  }

  rect(x: number, y: number, width: number, height: number, colour: Cell, clip?: readonly Cell[]) {
    for (let row = 0; row < height; row++) for (let column = 0; column < width; column++) this.set(x + column, y + row, colour, clip);
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, colour: Cell, clip?: readonly Cell[]) {
    for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry) + 1; y++) for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx) + 1; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) this.set(x, y, colour, clip);
    }
  }

  /** An ellipse turned by `angle` (radians). */
  turnedEllipse(cx: number, cy: number, rx: number, ry: number, angle: number, colour: Cell, clip?: readonly Cell[]) {
    const cos = Math.cos(angle), sin = Math.sin(angle), reach = Math.ceil(Math.max(rx, ry)) + 1;
    for (let y = Math.floor(cy) - reach; y <= Math.floor(cy) + reach; y++) for (let x = Math.floor(cx) - reach; x <= Math.floor(cx) + reach; x++) {
      const px = x + 0.5 - cx, py = y + 0.5 - cy, a = (px * cos + py * sin) / rx, b = (-px * sin + py * cos) / ry;
      if (a * a + b * b <= 1) this.set(x, y, colour, clip);
    }
  }

  points(list: readonly (readonly [number, number])[], colour: Cell, clip?: readonly Cell[]) {
    for (const [x, y] of list) this.set(x, y, colour, clip);
  }

  line(x0: number, y0: number, x1: number, y1: number, colour: Cell) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let step = 0; step <= steps; step++) this.set(Math.round(x0 + (x1 - x0) * step / steps), Math.round(y0 + (y1 - y0) * step / steps), colour);
  }

  /** Rows of letters, each letter a colour of `colours` (others left as they are). */
  pattern(x: number, y: number, rows: readonly string[], colours: Readonly<Record<string, string>>) {
    rows.forEach((row, line) => {
      [...row].forEach((letter, column) => { if (colours[letter] !== undefined) this.set(x + column, y + line, colours[letter]); });
    });
  }

  /** A one-pixel line of `colour` around everything drawn. */
  outline(colour: string): this {
    const next = this.cells.slice(), { width, height, cells } = this;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (cells[index]) continue;
      if ((x > 0 && cells[index - 1]) || (x < width - 1 && cells[index + 1]) || (y > 0 && cells[index - width]) || (y < height - 1 && cells[index + width])) next[index] = colour;
    }
    this.cells = next;
    return this;
  }

  /** Lays what another grid holds over this one. */
  merge(other: PixelGrid) {
    for (let y = 0; y < other.height; y++) for (let x = 0; x < other.width; x++) {
      const colour = other.cells[y * other.width + x];
      if (colour) this.set(x + other.x0, y + other.y0, colour);
    }
  }

  /** Every colour changed by `change`, told where the cell is. */
  recolour(change: (colour: string, x: number, y: number) => string) {
    this.cells = this.cells.map((colour, index) => (colour ? change(colour, this.x0 + (index % this.width), this.y0 + Math.floor(index / this.width)) : colour));
  }

  /** Paints the grid with its own top left corner at (x, y), in runs of one colour. */
  paint(context: CanvasRenderingContext2D, x = this.x0, y = this.y0) {
    for (let row = 0; row < this.height; row++) {
      let column = 0;
      while (column < this.width) {
        const colour = this.cells[row * this.width + column];
        if (!colour) { column++; continue; }
        let end = column + 1;
        while (end < this.width && this.cells[row * this.width + end] === colour) end++;
        context.fillStyle = colour;
        context.fillRect(x + column, y + row, end - column, 1);
        column = end;
      }
    }
  }
}

/** Draws something on a layer of its own, outlines it, then lays it on `grid`: each part gets its own contour. */
export function outlined(grid: PixelGrid, draw: (layer: PixelGrid) => void, colour: string) {
  const layer = new PixelGrid(grid.x0, grid.y0, grid.width, grid.height);
  draw(layer);
  layer.outline(colour);
  grid.merge(layer);
}

const hexOf = (value: number) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
const channels = (hex: string) => { const value = Number.parseInt(hex.slice(1), 16); return [(value >> 16) & 255, (value >> 8) & 255, value & 255]; };

const scaled = new Map<string, string>();
/** A hex colour, each channel times `factor` (darker below 1), as hex again so it can be changed once more. */
export function tint(hex: string, factor: number): string {
  const key = `${hex}*${factor}`;
  let value = scaled.get(key);
  if (!value) { value = `#${channels(hex).map((channel) => hexOf(channel * factor)).join('')}`; scaled.set(key, value); }
  return value;
}

/** Something that takes single pixels: a grid, or a canvas (the screens, drawn each frame). */
export interface PixelTarget { set(x: number, y: number, colour: string): void }

/*
 * The floor is drawn in pairs of columns, one pixel down every two across: the pair k (its columns ORIGIN.x + 2k and
 * + 2k + 1) shows, on the row ORIGIN.y + y, the floor at its middle, (u, v) = (y + k + 1, y - k). Taken at the pair's
 * middle, a footprint from u0 to u1 and v0 to v1 is u1 - u0 + v1 - v0 pixels across, its side along u u1 - u0 of them
 * and its side along v v1 - v0: the two faces of a box keep the widths of its two sides.
 */
const across = (x: number) => Math.floor((x - ORIGIN.x) / 2);

/** The floor's point (u, v) shown by the pixel (x, y), on the floor itself. */
export function floorAt(x: number, y: number): [number, number] {
  const k = across(x);
  return [y - ORIGIN.y + k + 1, y - ORIGIN.y - k];
}

/** The rows a footprint covers in the pair of columns k, from `top` (included) to `bottom` (not), from ORIGIN.y. */
function rowsOf(k: number, u0: number, u1: number, v0: number, v1: number) {
  return { top: Math.max(v0 + k, u0 - k - 1), bottom: Math.min(v1 + k, u1 - k - 1) };
}

/** The pairs of columns a footprint may cover. */
function* pairsOf(u0: number, u1: number, v0: number, v1: number) {
  for (let k = Math.floor((u0 - v1) / 2) - 1; k <= Math.ceil((u1 - v0) / 2) + 1; k++) yield k;
}

/**
 * A box standing on the floor from (u0, v0) to (u1, v1), from `z` to `z + height` pixels up: its top, its face towards
 * the bottom left and its face towards the bottom right in `tones`; `edge`: a lit line along its front edge.
 */
export function box(grid: PixelGrid, u0: number, u1: number, v0: number, v1: number, z: number, height: number, tones: Tones, edge?: string) {
  for (const k of pairsOf(u0, u1, v0, v1)) {
    const { top: a, bottom: b } = rowsOf(k, u0, u1, v0, v1);
    if (a >= b) continue;
    // under the edge along u (v = v1): the face towards the bottom left; under the one along v (u = u1): the other
    const side = v1 + k < u1 - k - 1 ? tones[1] : tones[2];
    for (const x of [ORIGIN.x + 2 * k, ORIGIN.x + 2 * k + 1]) {
      for (let y = a; y < b; y++) grid.set(x, ORIGIN.y + y - z - height, tones[0]);
      if (edge && b - a > 1) grid.set(x, ORIGIN.y + b - 1 - z - height, edge);
      for (let y = b; y < b + height; y++) grid.set(x, ORIGIN.y + y - z - height, side);
    }
  }
}

export const outlinedBox = (grid: PixelGrid, u0: number, u1: number, v0: number, v1: number, z: number, height: number, tones: Tones, outline: string, edge?: string) =>
  outlined(grid, (layer) => box(layer, u0, u1, v0, v1, z, height, tones, edge), outline);

/** Darkens the floor under a box's footprint by `factor` (a soft shadow along the walls). */
export function shadeFloor(grid: PixelGrid, u0: number, u1: number, v0: number, v1: number, factor: number) {
  for (const k of pairsOf(u0, u1, v0, v1)) {
    const { top: a, bottom: b } = rowsOf(k, u0, u1, v0, v1);
    for (const x of [ORIGIN.x + 2 * k, ORIGIN.x + 2 * k + 1]) for (let y = a; y < b; y++) {
      const colour = grid.get(x, ORIGIN.y + y);
      if (colour) grid.set(x, ORIGIN.y + y, tint(colour, factor));
    }
  }
}

/** A line along the face of a box that looks to the bottom left (the plane v = `v1`), from u `ua` to `ub`, `z` pixels up. */
export function onLeftFace(target: PixelTarget, v1: number, ua: number, ub: number, z: number, colour: string) {
  for (let x = ORIGIN.x + ua - v1; x < ORIGIN.x + ub - v1; x++) target.set(x, ORIGIN.y + v1 + across(x) - 1 - z, colour);
}

/** A line along the face of a box that looks to the bottom right (the plane u = `u1`), from v `va` to `vb`, `z` pixels up. */
export function onRightFace(target: PixelTarget, u1: number, va: number, vb: number, z: number, colour: string) {
  for (let x = ORIGIN.x + u1 - vb; x < ORIGIN.x + u1 - va; x++) target.set(x, ORIGIN.y + u1 - across(x) - 2 - z, colour);
}

export function patchOnLeftFace(target: PixelTarget, v1: number, ua: number, ub: number, z0: number, z1: number, colour: string) {
  for (let z = z0; z < z1; z++) onLeftFace(target, v1, ua, ub, z, colour);
}

export function patchOnRightFace(target: PixelTarget, u1: number, va: number, vb: number, z0: number, z1: number, colour: string) {
  for (let z = z0; z < z1; z++) onRightFace(target, u1, va, vb, z, colour);
}

/** A patch on the face that looks to the bottom left (v = `v1`), each of its points (`a` along u, `z` up) coloured by `colour` (null: left as it is). */
export function fillLeftFace(target: PixelTarget, v1: number, a0: number, a1: number, z0: number, z1: number, colour: (a: number, z: number) => string | null) {
  for (let a = a0; a < a1; a++) for (let z = z0; z < z1; z++) { const value = colour(a, z); if (value) onLeftFace(target, v1, a, a + 1, z, value); }
}

/** A patch on the face that looks to the bottom right (u = `u1`), each of its points (`a` along v, `z` up) coloured by `colour`. */
export function fillRightFace(target: PixelTarget, u1: number, a0: number, a1: number, z0: number, z1: number, colour: (a: number, z: number) => string | null) {
  for (let a = a0; a < a1; a++) for (let z = z0; z < z1; z++) { const value = colour(a, z); if (value) onRightFace(target, u1, a, a + 1, z, value); }
}

/** A flat top from (u0, v0) to (u1, v1), `z` pixels up (0: the floor), each of its points coloured by `colour` (null: left as it is). */
export function fillTop(grid: PixelGrid, u0: number, u1: number, v0: number, v1: number, z: number, colour: (u: number, v: number) => string | null) {
  for (let y = ORIGIN.y + Math.floor((u0 + v0) / 2) - z - 2; y <= ORIGIN.y + Math.ceil((u1 + v1) / 2) - z + 2; y++) {
    for (let x = ORIGIN.x + u0 - v1 - 2; x <= ORIGIN.x + u1 - v0 + 2; x++) {
      const [u, v] = floorAt(x, y + z);
      if (u < u0 || v < v0 || u >= u1 || v >= v1) continue;
      const value = colour(u, v);
      if (value) grid.set(x, y, value);
    }
  }
}

/** The two back walls: 'left' is the plane u = 0 (`a` runs along v), 'right' the plane v = 0 (`a` runs along u). */
export type Wall = 'left' | 'right';

export function wallPatch(target: PixelTarget, wall: Wall, a0: number, a1: number, z0: number, z1: number, colour: string) {
  if (wall === 'left') patchOnRightFace(target, 0, a0, a1, z0, z1, colour);
  else patchOnLeftFace(target, 0, a0, a1, z0, z1, colour);
}

/** A patch of a back wall, each of its points coloured by `colour` (null: left as it is). */
export function fillWall(target: PixelTarget, wall: Wall, a0: number, a1: number, z0: number, z1: number, colour: (a: number, z: number) => string | null) {
  if (wall === 'left') fillRightFace(target, 0, a0, a1, z0, z1, colour);
  else fillLeftFace(target, 0, a0, a1, z0, z1, colour);
}

export const wallPixel = (target: PixelTarget, wall: Wall, a: number, z: number, colour: string) => wallPatch(target, wall, a, a + 1, z, z + 1, colour);

/** `within`: [a0, a1, z0, z1], the part of the wall it is cut to (a window's panes). */
export function wallEllipse(target: PixelTarget, wall: Wall, ca: number, cz: number, ra: number, rz: number, colour: string, within?: readonly [number, number, number, number]) {
  for (let a = Math.floor(ca - ra) - 1; a <= ca + ra + 1; a++) for (let z = Math.floor(cz - rz) - 1; z <= cz + rz + 1; z++) {
    if (within && (a < within[0] || a >= within[1] || z < within[2] || z >= within[3])) continue;
    const dx = (a + 0.5 - ca) / ra, dz = (z + 0.5 - cz) / rz;
    if (dx * dx + dz * dz <= 1) wallPixel(target, wall, a, z, colour);
  }
}

/** Where a point of a back wall (`a` along it, `z` up) is in the room's box. */
export function wallPoint(wall: Wall, a: number, z: number): [number, number] {
  return wall === 'left' ? [ORIGIN.x - 1 - a, ORIGIN.y - across(ORIGIN.x - 1 - a) - 2 - z] : [ORIGIN.x + a, ORIGIN.y + across(ORIGIN.x + a) - 1 - z];
}

/**
 * A white line around what `paint` draws, nothing else, on a layer the size of a room: what the pointer is on and a
 * click opens, like the classic room's (pixel-art.ts ring, the furniture's highlight colour).
 */
export function hoverOutline(paint: (grid: PixelGrid) => void): HTMLCanvasElement {
  const grid = new PixelGrid(0, 0, ROOM_BOX.width, ROOM_BOX.height);
  paint(grid);
  const canvas = document.createElement('canvas');
  canvas.width = ROOM_BOX.width;
  canvas.height = ROOM_BOX.height;
  grid.paint(canvas.getContext('2d', { willReadFrequently: true })!);
  return ring(canvas, ROOM_PALETTE.furniture.highlight);
}

/** Something a click opens, drawn alone: the same function each time, its drawing and its outline are kept. */
export type Painter = (grid: PixelGrid) => void;

const shapes = new WeakMap<Painter, PixelGrid>();
/** Whether a point of a room (in its pixels) falls on what `paint` draws, or on a pixel beside it (small things stay easy to hit). */
export function paintedAt(paint: Painter, point: { x: number; y: number }): boolean {
  let grid = shapes.get(paint);
  if (!grid) {
    grid = new PixelGrid(0, 0, ROOM_BOX.width, ROOM_BOX.height);
    paint(grid);
    shapes.set(paint, grid);
  }
  const x = Math.floor(point.x), y = Math.floor(point.y);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (grid.get(x + dx, y + dy)) return true;
  return false;
}

const outlines = new WeakMap<Painter, HTMLCanvasElement>();
/** The white line around what `paint` draws (hoverOutline), drawn once. */
export function outlineOf(paint: Painter): HTMLCanvasElement {
  let canvas = outlines.get(paint);
  if (!canvas) { canvas = hoverOutline(paint); outlines.set(paint, canvas); }
  return canvas;
}

/** Single pixels on a canvas, in the room's pixels (its transform is set by the caller). */
export const canvasTarget = (context: CanvasRenderingContext2D): PixelTarget => ({
  set(x, y, colour) { context.fillStyle = colour; context.fillRect(x, y, 1, 1); },
});
