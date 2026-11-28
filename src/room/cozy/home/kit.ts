// What the user's homes share (src/room/cozy/home/): what a home is made of (HomeDesign), its light, and the furniture
// and the animations more than one of them has (the desk and its screen with the team in a video call, the chair, the
// steam of a hot drink). The homes are drawn like the other cozy rooms (pixels.ts, decor.ts), in the same box.
import { COZY_HOME_PALETTE as H, COZY_PALETTE as C } from '../../../design/room-palette.ts';
import { CODE_LINES, paintChairSeat, paintDrawers, paintMonstera, paintWallBoxes } from '../decor.ts';
import { ORIGIN, ROOM_BOX, WALL_HEIGHT, WALL_THICKNESS, iso } from '../geometry.ts';
import type { Lighting, Outside } from '../light.ts';
import type { CozyTime } from '../time.ts';
import type { WallClock } from '../clock.ts';
import { PixelGrid, onLeftFace, outlined, outlinedBox, patchOnLeftFace, tint, type PixelTarget, type Tones } from '../pixels.ts';
import type { PetPixels } from '../pet.ts';
import type { Point } from '../../geometry.ts';

export const OUTLINE = C.outline;
export const newGrid = () => new PixelGrid(0, 0, ROOM_BOX.width, ROOM_BOX.height);
/** A box with its outline. */
export const ob = (grid: PixelGrid, u0: number, u1: number, v0: number, v1: number, z: number, height: number, tones: Tones, edge?: string) =>
  outlinedBox(grid, u0, u1, v0, v1, z, height, tones, OUTLINE, edge);
/** Something drawn on a layer of its own, outlined. */
export const art = (grid: PixelGrid, draw: (layer: PixelGrid) => void, colour: string = OUTLINE) => outlined(grid, draw, colour);

/** A number in [0, 1) that stays the same for (a, b): where the bricks, the stars and the lit windows fall. */
export function hash(a: number, b: number): number {
  let value = (a * 374761393 + b * 668265263) | 0;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

/** Where the user sits: on the floor at (u, v), `z` pixels up (the seat's height). */
export interface HomeSeat { u: number; v: number; z: number }

/** A screen: on the face v = `v`, from u `ua` to `ub`, from `za` to `zb` pixels up. */
export interface Screen { v: number; ua: number; ub: number; za: number; zb: number }

/** The part of a screen given to the video call: from u `ua` to the screen's end, in tiles. */
export interface CallGrid { ua: number; columns: number; rows: number }

/** Someone in the video call: their hair, their top and their skin; `speaking`: their tile is framed. */
export interface CallFace { hair: string; top: string; skin: string; speaking: boolean }

/** What the animations of a frame read: the cells of the art each one is drawn over, the call. */
export interface HomeScene { masks: Readonly<Record<string, Uint8Array>>; faces: readonly CallFace[]; time: CozyTime }

export { lamp, lightingOf, type Lamp, type Lighting } from '../light.ts';

/** One of the user's homes (Preferences.homeTheme). */
export interface HomeDesign {
  seat: HomeSeat;
  /** the screens on the desk */
  screens: readonly Screen[];
  /** its light at `outside.mood`, the hour it was drawn at: at the other moods, light.ts homeLightAt */
  lighting: Lighting;
  /** what its window shows, as drawn: it follows the hour (light.ts outsideAt) */
  outside: Outside;
  /** its clock on a wall */
  clock: WallClock;
  /** a free corner of its floor, for a festival's tree, pumpkins or balloons (festive.ts) */
  festiveSpot: { u: number; v: number };
  /** the colours that shine by themselves: never darkened by the light */
  glow: readonly string[];
  /** the colours of the back layer each animation is drawn over, by name */
  masks: Readonly<Record<string, readonly string[]>>;
  /** where the user's pet sleeps, or rests for a droid (its paws, in the room's pixels) */
  petSpot: Point;
  /** the floor, the walls and everything behind the user; `pet`: the user's pet (pet.ts), drawn at `petSpot`, or none */
  back(grid: PixelGrid, pet: PetPixels | null): void;
  /** the user's computer alone, as `back` draws it: outlined under the pointer, as a click there opens a terminal */
  computer(grid: PixelGrid): void;
  /** what is in front of the user (the chair's back, a lamp hanging from the ceiling) */
  front?(grid: PixelGrid): void;
  /** each frame, behind the user */
  animate(context: CanvasRenderingContext2D, frame: number, scene: HomeScene): void;
  /** each frame, in front of everything */
  animateFront?(context: CanvasRenderingContext2D, frame: number): void;
}

/** Every colour of a palette group (strings, lists of them, groups of them): a home's glowing colours. */
export function coloursOf(group: unknown): string[] {
  if (typeof group === 'string') return [group];
  if (group && typeof group === 'object') return Object.values(group).flatMap(coloursOf);
  return [];
}

/* Drawn each frame */

/** Single pixels on the room's canvas, only over the cells of `mask` (null: anywhere in the room's box). */
export function masked(context: CanvasRenderingContext2D, mask: Uint8Array | null): PixelTarget {
  return {
    set(x, y, colour) {
      const column = Math.floor(x), row = Math.floor(y);
      if (column < 0 || row < 0 || column >= ROOM_BOX.width || row >= ROOM_BOX.height) return;
      if (mask && !mask[row * ROOM_BOX.width + column]) return;
      context.fillStyle = colour;
      context.fillRect(column, row, 1, 1);
    },
  };
}

/** The steam of a hot drink, rising from (x, y). */
export function steam(context: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  for (let index = 0; index < 3; index++) {
    const age = (frame + index * 7) % 21;
    if (age > 17) continue;
    context.fillStyle = H.steam[age < 9 ? 0 : 1];
    context.fillRect(x + (index - 1) * 2 + Math.round(Math.sin((age + index * 3) * 0.55)), y - Math.floor(age * 0.6), 1, 1);
  }
}

/** A face in a call tile, its rows from the top: h hair, e eye, s skin, b top. */
const FACE = ['.hhhh.', 'hhhhhh', 'hesseh', 'hssssh', '.bbbb.'];
const STAND_INS: readonly CallFace[] = H.call.standIns.map(([hair, top, skin]) => ({ hair, top, skin, speaking: false }));

/**
 * The team in a video call on part of a screen: a tile per face, the one speaking framed, their mouth moving. Without
 * any face, stand-ins take their turns speaking; with fewer faces than tiles, the others are dark.
 */
function paintCall(target: PixelTarget, screen: Screen, { ua, columns, rows }: CallGrid, frame: number, faces: readonly CallFace[]) {
  const people = faces.length ? faces : STAND_INS;
  const width = Math.floor((screen.ub - ua) / columns), height = Math.floor((screen.zb - screen.za) / rows), tiles = columns * rows;
  // who speaks: the stand-ins in turn, else the speaking ones in turn
  const speakers = faces.length ? people.flatMap((face, index) => (face.speaking && index < tiles ? [index] : [])) : people.slice(0, tiles).map((_, index) => index);
  const talking = speakers.length ? speakers[Math.floor(frame / 20) % speakers.length] : -1;
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const index = row * columns + column, face = people[faces.length ? index : index % people.length], left = ua + column * width, bottom = screen.zb - (row + 1) * height;
    for (let a = left; a < left + width - 1; a++) for (let z = bottom; z < bottom + height - 1; z++) {
      const edge = a === left || a === left + width - 2 || z === bottom || z === bottom + height - 2;
      onLeftFace(target, screen.v, a, a + 1, z, index === talking && edge ? H.call.speaking : H.call.tile);
    }
    if (!face) continue;
    const faceLeft = left + Math.floor((width - 7) / 2), top = bottom + height - 3;
    FACE.forEach((line, down) => {
      [...line].forEach((letter, across) => {
        const colour = letter === 'h' ? face.hair : letter === 'b' ? face.top : letter === 's' ? face.skin : letter === 'e' ? H.call.eyes : null;
        if (colour && top - down > bottom) onLeftFace(target, screen.v, faceLeft + across, faceLeft + across + 1, top - down, colour);
      });
    });
    if (index === talking && (frame >> 1) & 1) onLeftFace(target, screen.v, faceLeft + 2, faceLeft + 4, top - 3, H.call.mouth);
  }
}

/** A screen at work: lines of code going up, a cursor blinking, and on its right part (`call`) the video call. */
export function paintScreen(target: PixelTarget, screen: Screen, frame: number, call: CallGrid | null, faces: readonly CallFace[]) {
  const codeEnd = call ? call.ua - 1 : screen.ub;
  if (codeEnd - screen.ua > 6) {
    const scroll = Math.floor(frame / 6), count = Math.floor((screen.zb - 3 - screen.za) / 2) + 1;
    for (let row = 0; row < count; row++) {
      const line = CODE_LINES[(scroll + row) % CODE_LINES.length], z = screen.zb - 2 - row * 2;
      for (const [indent, length, colour] of line) {
        const a0 = screen.ua + 1 + indent, a1 = Math.min(codeEnd - 1, a0 + length);
        if (a1 > a0) onLeftFace(target, screen.v, a0, a1, z, C.code[colour]);
      }
    }
    if ((frame >> 3) & 1) {
      const last = CODE_LINES[(scroll + count - 1) % CODE_LINES.length], end = last.reduce((most, [indent, length]) => Math.max(most, indent + length), 0);
      const a0 = Math.min(codeEnd - 3, screen.ua + 2 + end);
      onLeftFace(target, screen.v, a0, a0 + 2, screen.zb - 2 - (count - 1) * 2, C.cursor);
    }
  }
  if (call) paintCall(target, screen, call, frame, faces);
}

/* The furniture */

/** The two back walls, `cap` on their tops and ends. */
export function walls(grid: PixelGrid, left: string, right: string, cap: string) {
  paintWallBoxes(grid, { left, right, capTop: cap, capLeft: tint(cap, 0.9), capRight: tint(cap, 0.84) });
}

/** Where the top of the walls is above the pixel column x: what hangs from the ceiling starts there. */
export const ceilingAt = (x: number) => iso(-WALL_THICKNESS, -WALL_THICKNESS, WALL_HEIGHT).y + Math.floor(Math.abs(x - ORIGIN.x) / 2);

/** A round rug at (u, v): its rings, from the edge in, and two rings of dots. */
export function roundRug(grid: PixelGrid, u: number, v: number, rx: number, ry: number, rings: readonly string[], dots: string) {
  const { x, y } = iso(u, v);
  grid.ellipse(x, y + 1, rx, ry, tint(rings[0], 0.85)); grid.ellipse(x, y, rx, ry, rings[0]); grid.ellipse(x, y, rx - 1.6, ry - 1, rings[1]);
  grid.ellipse(x, y, rx * 0.74, ry * 0.74, rings[2]); grid.ellipse(x, y, rx * 0.46, ry * 0.46, rings[3]);
  for (let index = 0; index < 32; index++) { const angle = index / 32 * Math.PI * 2; grid.set(Math.round(x + Math.cos(angle) * rx * 0.86), Math.round(y + Math.sin(angle) * ry * 0.86), dots); }
  for (let index = 0; index < 18; index++) { const angle = index / 18 * Math.PI * 2; grid.set(Math.round(x + Math.cos(angle) * rx * 0.6), Math.round(y + Math.sin(angle) * ry * 0.6), dots); }
}

/** A table on four legs, its top `top` pixels up. */
export function desk(grid: PixelGrid, u0: number, u1: number, v0: number, v1: number, top: number, tones: Tones, legs: Tones, legWidth = 2) {
  for (const [lu, lv] of [[u0 + 1, v0 + 1], [u1 - 1 - legWidth, v0 + 1], [u0 + 1, v1 - 1 - legWidth], [u1 - 1 - legWidth, v1 - 1 - legWidth]]) ob(grid, lu, lu + legWidth, lv, lv + legWidth, 0, top - 3, legs);
  ob(grid, u0, u1, v0, v1, top - 3, 3, tones, tint(tones[0], 1.06));
}

/** The screen of a monitor from u0 to u1 whose front is the plane v = v1, standing on a desk `z0` up, `height` tall. */
export const screenOf = (u0: number, u1: number, v1: number, z0: number, height: number): Screen => ({ v: v1, ua: u0 + 1, ub: u1 - 1, za: z0 + 5, zb: z0 + 3 + height });

export function monitor(grid: PixelGrid, u0: number, u1: number, v1: number, z0: number, height: number, tones: Tones, stand: Tones) {
  const middle = (u0 + u1) >> 1, screen = screenOf(u0, u1, v1, z0, height);
  ob(grid, middle - 4, middle + 4, v1 - 7, v1 - 1, z0, 1, stand);
  ob(grid, middle - 1, middle + 1, v1 - 5, v1 - 3, z0 + 1, 4, stand);
  ob(grid, u0, u1, v1 - 2, v1, z0 + 4, height, tones, tint(tones[0], 1.05));
  patchOnLeftFace(grid, v1, screen.ua, screen.ub, screen.za, screen.zb, H.screen);
}

/** A webcam on top of a monitor, its light on: the call is live. */
export function webcam(grid: PixelGrid, u: number, v1: number, z: number) {
  ob(grid, u - 2, u + 2, v1 - 3, v1, z, 2, H.webcam.body);
  onLeftFace(grid, v1, u - 1, u, z + 1, H.webcam.lens); onLeftFace(grid, v1, u + 1, u + 2, z + 1, H.webcam.on);
}

/** The user's chair: its seat (behind them), in `seat` on a pole and a star base in `base`. */
export const chairSeat = (grid: PixelGrid, { u, v }: HomeSeat, seat: Tones, base: Tones) => paintChairSeat(grid, u, v, seat, base, [tint(base[0], 1.1), base[1], base[2]]);

/** The chair's back, just behind the user (in front of them on screen). */
export function chairBack(grid: PixelGrid, { u, v }: HomeSeat, tones: Tones, base: Tones, z = 12, height = 5) {
  ob(grid, u + 4, u + 6, v + 5, v + 7, 10, z - 10, base);
  ob(grid, u, u + 11, v + 5, v + 8, z, height, tones, tint(tones[0], 1.06));
}

/** Three drawers, their front the face towards the bottom right. */
export const cabinet = (grid: PixelGrid, u0: number, u1: number, v0: number, v1: number, height: number, tones: Tones) =>
  paintDrawers(grid, { u0, u1, v0, v1, height, tones, face: 'right' });

/** The offices' monstera, in a pot of the home's own. */
export const monstera = (grid: PixelGrid, u: number, v: number, pot: Tones) =>
  paintMonstera(grid, u, v, { light: pot[0], base: pot[1], shade: pot[2], rim: tint(pot[1], 0.92), face: false });
