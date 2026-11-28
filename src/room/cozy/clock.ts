// The clock on a wall of every cozy room (src/room/cozy/), at the classic room's hour (the "try an hour" preview, else
// now): its face is part of the room's cached art, its hands are drawn on a layer of their own, again only when the
// minute changes (time.ts clockMinute), and laid over the room each frame. Under the pointer it is outlined; a click on
// it tells the time (CozyView). Where a point falls on it is pure: tested without a DOM.
import { COZY_PALETTE as C } from '../../design/room-palette.ts';
import type { Point } from '../geometry.ts';
import { ROOM_BOX } from './geometry.ts';
import { PixelGrid, canvasTarget, hoverOutline, wallEllipse, wallPixel, type PixelTarget, type Wall } from './pixels.ts';
import { clockMinute } from './time.ts';

/**
 * A clock on a back wall: its middle (`a` along the wall, `z` up) and its radius; `shape`: the room's own drawing of
 * it (the chalet's cuckoo clock), whose face this one does not draw, but that its outline and its clicks follow.
 */
export interface WallClock { wall: Wall; a: number; z: number; radius: number; shape?: (target: PixelTarget) => void }

/** Along the wall, which way the screen's right is: the left wall runs the other way (pixels.ts wallPoint). */
const rightward = (wall: Wall) => (wall === 'right' ? 1 : -1);

/** The clock's face, with a mark at each quarter: drawn once, with the room. */
export function paintClockFace(grid: PixelGrid, clock: WallClock) {
  if (clock.shape) return;
  const { wall, a, z, radius } = clock, K = C.wallClock, side = rightward(wall);
  wallEllipse(grid, wall, a + 0.5, z + 0.5, radius + 1.4, radius + 1.4, K.rimShade);
  wallEllipse(grid, wall, a + 0.5, z + 1, radius + 1, radius + 1, K.rim);
  wallEllipse(grid, wall, a + 0.5, z + 0.5, radius, radius, K.face);
  const mark = radius - 1;
  for (const [da, dz] of [[0, mark], [mark * side, 0], [0, -mark], [-mark * side, 0]]) wallPixel(grid, wall, a + da, z + dz, K.tick);
}

/** A hand from the middle, `turns` of a full turn from twelve o'clock, `length` long. */
function hand(target: PixelTarget, { wall, a, z }: WallClock, turns: number, length: number, colour: string) {
  const side = rightward(wall), angle = turns * Math.PI * 2;
  for (let step = 0; step <= length * 2; step++) {
    const along = step / 2;
    wallPixel(target, wall, Math.floor(a + 0.5 + Math.sin(angle) * along * side), Math.floor(z + 0.5 + Math.cos(angle) * along), colour);
  }
}

/** The hands at `hour` (a fractional one: 14.5 is 14:30). */
export function paintClockHands(target: PixelTarget, clock: WallClock, hour: number) {
  const minute = clockMinute(hour), K = C.wallClock;
  hand(target, clock, (minute % 720) / 720, Math.max(2, clock.radius * 0.5), K.hands);
  hand(target, clock, (minute % 60) / 60, Math.max(3, clock.radius * 0.8), K.minute);
  wallPixel(target, clock.wall, clock.a, clock.z, K.pin);
}

/** The clock as it hangs on its wall, face and rim, or the room's own drawing of it. */
function paintWholeClock(grid: PixelGrid, clock: WallClock) {
  if (clock.shape) clock.shape(grid);
  else paintClockFace(grid, clock);
}

const grids = new WeakMap<WallClock, PixelGrid>();

/** Whether a point of a room (in its pixels) falls on its clock, or a pixel beside it (they are small). */
export function clockAt(clock: WallClock, point: Point): boolean {
  let grid = grids.get(clock);
  if (!grid) {
    grid = new PixelGrid(0, 0, ROOM_BOX.width, ROOM_BOX.height);
    paintWholeClock(grid, clock);
    grids.set(clock, grid);
  }
  const x = Math.floor(point.x), y = Math.floor(point.y);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (grid.get(x + dx, y + dy)) return true;
  return false;
}

const outlines = new WeakMap<WallClock, HTMLCanvasElement>();

/** The white line around a clock under the pointer, on a layer the size of a room. */
export function clockOutline(clock: WallClock): HTMLCanvasElement {
  let canvas = outlines.get(clock);
  if (!canvas) { canvas = hoverOutline((grid) => paintWholeClock(grid, clock)); outlines.set(clock, canvas); }
  return canvas;
}

const hands = new Map<string, { minute: number; canvas: HTMLCanvasElement }>();

/** The hands of a clock at `hour`, on a layer the size of a room: drawn again only when the minute changes. */
export function clockHands(clock: WallClock, hour: number): HTMLCanvasElement {
  const key = `${clock.wall}:${clock.a}:${clock.z}:${clock.radius}`, minute = clockMinute(hour);
  let layer = hands.get(key);
  if (!layer) {
    const canvas = document.createElement('canvas');
    canvas.width = ROOM_BOX.width;
    canvas.height = ROOM_BOX.height;
    layer = { minute: -1, canvas };
    hands.set(key, layer);
  }
  if (layer.minute !== minute) {
    const context = layer.canvas.getContext('2d')!;
    context.clearRect(0, 0, ROOM_BOX.width, ROOM_BOX.height);
    paintClockHands(canvasTarget(context), clock, hour);
    layer.minute = minute;
  }
  return layer.canvas;
}
