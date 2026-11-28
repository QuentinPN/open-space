// What the cozy rooms are made of (src/room/cozy/), drawn once per room and per light: the offices' pieces every room
// may use (cream walls with a wainscot, honey planks, a window with lavender curtains, the door to the break room,
// hanging plants, a monstera, couches, drawers, a floor lamp, the desks with their screens and chairs, in a room's own
// style) and a project room put together from its ambiance (ambiance/index.ts: what it is made of, where). Everything
// behind the people goes on one canvas (`back`); what can stand in front of someone (a chair's back, a desk seen from
// behind its person, the couch's arm) is a piece of its own, drawn in depth order with the people. The break room is
// made of the same pieces (lounge-art.ts).
import type { Festival } from '../../../shared/festivals.ts';
import { COZY_PALETTE as C } from '../../design/room-palette.ts';
import { paintWholeClock, type WallClock } from './clock.ts';
import { FESTIVE_DECOR, FESTIVE_GLOW, paintFestiveFloor, paintFestiveWalls } from './festive.ts';
import { SKY_GLOW, lamp, lightingOf, type Rgb } from './light.ts';
import type { AmbianceDesign, AmbianceScene } from './ambiance/index.ts';
import { MotionLayer, colourMask, withinWall, type CellMask } from './motion.ts';
import { cozyTimeOf, sceneCache, sceneKey, type CozyTime } from './time.ts';
import { ORIGIN, ROOM_BOX, ROOM_UNITS, WALL_HEIGHT, WALL_THICKNESS, couchArmDepth, cozyDepth, deskPlace, iso, onCouchAt, type Couch, type Desk } from './geometry.ts';
import {
  PixelGrid, box, fillTop, fillWall, onLeftFace, onRightFace, outlined, outlinedBox, patchOnLeftFace, shadeFloor, tint, wallEllipse, wallPatch, wallPixel,
  canvasTarget, type Painter, type Tones, type Wall,
} from './pixels.ts';

const O = C.outline;
export const newGrid = () => new PixelGrid(0, 0, ROOM_BOX.width, ROOM_BOX.height);
const ob = (grid: PixelGrid, u0: number, u1: number, v0: number, v1: number, z: number, height: number, tones: Tones, edge?: string) => outlinedBox(grid, u0, u1, v0, v1, z, height, tones, O, edge);
const art = (draw: (layer: PixelGrid) => void, grid: PixelGrid, colour: string = O) => outlined(grid, draw, colour);

/* The room itself */

/** A plank floor: planks `width` units wide running along u (or along v, `alongV`), a joint every `length` units. */
export interface Planks { tones: readonly string[]; seam: string; joint: string; width: number; length: number; alongV?: boolean }

export function paintPlanks(grid: PixelGrid, { tones, seam, joint, width, length, alongV = false }: Planks) {
  fillTop(grid, 0, ROOM_UNITS, 0, ROOM_UNITS, 0, (u, v) => {
    const across = alongV ? u : v, along = alongV ? v : u, plank = Math.floor(across / width);
    if (across % width === width - 1) return seam;
    if ((along + plank * 29) % length === 0) return joint;
    const colour = tones[(plank * 7 + (plank >> 1)) % tones.length];
    if ((along * 13 + plank * 31) % 41 === 0) return tint(colour, 0.94);
    if (across % width === 0 && (along + plank * 5) % 11 < 6) return tint(colour, 1.05);
    return colour;
  });
}

/** Where the top of the back walls is above the pixel column x: what hangs from the ceiling hangs from there. */
export const ceilingAt = (x: number) => iso(-WALL_THICKNESS, -WALL_THICKNESS, WALL_HEIGHT).y + Math.floor(Math.abs(x - ORIGIN.x) / 2);

/** The floor a little darker along the two walls. */
export function shadeAlongWalls(grid: PixelGrid) {
  shadeFloor(grid, 0, 6, 0, ROOM_UNITS, 0.9); shadeFloor(grid, 0, ROOM_UNITS, 0, 6, 0.9);
  shadeFloor(grid, 0, 3, 0, ROOM_UNITS, 0.92); shadeFloor(grid, 0, ROOM_UNITS, 0, 3, 0.92);
}

export function paintFloor(grid: PixelGrid) {
  paintPlanks(grid, { tones: C.planks, seam: C.plankSeam, joint: C.plankJoint, width: 4, length: 52 });
  shadeAlongWalls(grid);
}

/** The two back walls' boxes: their faces into the room, their caps on top and at their ends. */
export interface WallTones { left: string; right: string; capTop: string; capLeft: string; capRight: string }

export function paintWallBoxes(grid: PixelGrid, W: WallTones) {
  const T = WALL_THICKNESS;
  art((layer) => {
    box(layer, -T, ROOM_UNITS, -T, 0, 0, WALL_HEIGHT, [W.capTop, W.right, W.capRight]);
    box(layer, -T, 0, 0, ROOM_UNITS, 0, WALL_HEIGHT, [W.capTop, W.capLeft, W.left]);
  }, grid);
}

export function paintWalls(grid: PixelGrid) {
  const W = C.wall, P = C.wainscot;
  paintWallBoxes(grid, W);
  for (const [wall, wainscot, panel, light, top] of [['left', P.left, P.panelLeft, P.lightLeft, W.topLeft], ['right', P.right, P.panelRight, P.lightRight, W.topRight]] as const) {
    wallPatch(grid, wall, 0, ROOM_UNITS, 0, 30, wainscot);
    for (let a = 4; a < ROOM_UNITS - 6; a += 14) {
      wallPatch(grid, wall, a, a + 10, 6, 7, panel); wallPatch(grid, wall, a, a + 10, 25, 26, light);
      wallPatch(grid, wall, a, a + 1, 7, 25, panel); wallPatch(grid, wall, a + 9, a + 10, 7, 25, light);
    }
    wallPatch(grid, wall, 0, ROOM_UNITS, 29, 33, P.rail); wallPatch(grid, wall, 0, ROOM_UNITS, 32, 33, P.railLight);
    wallPatch(grid, wall, 0, ROOM_UNITS, 0, 4, P.base); wallPatch(grid, wall, 0, ROOM_UNITS, 3, 4, P.baseLight);
    wallPatch(grid, wall, 0, ROOM_UNITS, WALL_HEIGHT - 4, WALL_HEIGHT - 3, top);
  }
}

/**
 * The window's panes on the left wall (from 36 to 76 along it, 46 to 84 up): the sky of the hour (time.ts), the sun
 * high with its clouds by day, low and pink at dusk, the moon and stars at night.
 */
export function paintPanes(grid: PixelGrid, time: CozyTime) {
  const wall: Wall = 'left', K = C.sky, S = C.window;
  const sky = K[time];
  fillWall(grid, wall, 36, 76, 46, 84, (_, z) => sky[Math.min(sky.length - 1, Math.floor((84 - z) / (38 / sky.length)))]);
  const panes = [36, 76, 46, 84] as const;
  if (time === 'night') {
    wallEllipse(grid, wall, 64, 74, 5.5, 5.5, K.moon); wallEllipse(grid, wall, 66.4, 75.4, 4.4, 4.4, sky[1]);
    wallPixel(grid, wall, 61, 72, K.moonShade); wallPixel(grid, wall, 62, 70, K.moonShade);
    for (const [a, z] of [[40, 80], [47, 72], [52, 81], [70, 62], [44, 60], [72, 79], [50, 50], [68, 52]]) wallPixel(grid, wall, a, z, K.star);
    return;
  }
  const dusk = time === 'dusk';
  if (dusk) { wallEllipse(grid, wall, 66, 52, 6, 6, K.sunLow, panes); wallEllipse(grid, wall, 66.6, 52.6, 4, 4, K.sunLowLight, panes); }
  else { wallEllipse(grid, wall, 66, 74, 5.5, 5.5, K.sun); wallEllipse(grid, wall, 66.6, 74.6, 4, 4, K.sunLight); wallPixel(grid, wall, 67, 76, S.sunGlint); }
  for (const [ca, cz, size] of [[46, 64, 1], [62, 58, 0.7]]) {
    wallEllipse(grid, wall, ca, cz - 1, 6 * size, 2.6 * size, dusk ? K.duskCloudShade : S.cloudShade); wallEllipse(grid, wall, ca, cz, 6 * size, 2.6 * size, dusk ? K.duskCloud : S.cloud);
    wallEllipse(grid, wall, ca + 2 * size, cz + 2 * size, 3.4 * size, 2.6 * size, dusk ? K.duskCloud : S.cloud);
  }
}

export function paintWindow(grid: PixelGrid, time: CozyTime) {
  const wall: Wall = 'left', S = C.window, F = C.sunflower;
  wallPatch(grid, wall, 32, 80, 42, 88, S.frame);
  wallPatch(grid, wall, 33, 79, 43, 87, S.pane);
  paintPanes(grid, time);
  wallPatch(grid, wall, 55, 57, 46, 84, S.pane); wallPatch(grid, wall, 36, 76, 64, 66, S.pane);
  wallPatch(grid, wall, 36, 76, 46, 47, S.mullionShade);
  ob(grid, 0, 6, 30, 82, 40, 3, S.sill, S.sillEdge);
  // a sunflower in its pot on the sill
  art((layer) => {
    const { x, y } = iso(3, 70, 43);
    layer.rect(x - 3, y - 6, 7, 6, F.pot); layer.rect(x + 2, y - 6, 2, 6, F.potShade); layer.rect(x - 4, y - 7, 9, 2, F.potRim);
    layer.line(x, y - 8, x, y - 14, F.stem);
    layer.points([[x - 1, y - 11], [x - 2, y - 11], [x + 1, y - 10]], F.leaf);
    layer.ellipse(x + 0.5, y - 17.5, 4, 4, F.petals); layer.ellipse(x + 0.5, y - 17.5, 1.8, 1.8, F.heart); layer.set(x - 2, y - 20, F.petalLight);
  }, grid);
  // the curtains, tied back, and their rod
  const curtain = C.curtain;
  for (const [a0, a1] of [[28, 38], [74, 84]]) for (let a = a0; a < a1; a++) {
    const tone = curtain[(a - a0) % 3 === 2 ? 2 : (a - a0) % 3 === 0 ? 0 : 1];
    const bottom = Math.round(44 + Math.abs(a - (a0 + a1) / 2) * 0.6);
    wallPatch(grid, wall, a, a + 1, bottom, 88, tone);
    wallPixel(grid, wall, a, bottom, curtain[2]);
  }
  wallPatch(grid, wall, 28, 38, 60, 62, C.curtainTie); wallPatch(grid, wall, 74, 84, 60, 62, C.curtainTie);
  wallPatch(grid, wall, 26, 86, 86, 91, curtain[1]); wallPatch(grid, wall, 26, 86, 90, 91, curtain[0]);
  for (let a = 26; a < 86; a += 4) { wallPixel(grid, wall, a + 1, 85, curtain[1]); wallPixel(grid, wall, a + 2, 85, curtain[1]); wallPixel(grid, wall, a + 3, 86, curtain[2]); wallPixel(grid, wall, a, 86, curtain[2]); }
  wallPatch(grid, wall, 24, 88, 91, 92, C.curtainRod);
}

/** A door on the left wall, where people come in: from `a0` to `a1` along it, `height` pixels tall. */
export interface DoorSpot { a0: number; a1: number; height: number }

/** The door to the break room (in the break room, back to the offices): on the left wall, near the front of the room. */
export const DOOR = { wall: 'left', a0: 102, a1: 122, height: 62 } as const satisfies DoorSpot & { wall: Wall };

/** The door in its frame, two panels, its knob and a little moon on a plaque: a click goes through it, like the classic room's. */
export const paintDoor: Painter = (grid) => {
  const D = C.door, { wall, a0, a1, height } = DOOR;
  wallPatch(grid, wall, a0 - 2, a1 + 2, 0, height + 3, O);
  wallPatch(grid, wall, a0 - 1, a1 + 1, 0, height + 2, D.frame);
  wallPatch(grid, wall, a0 - 1, a1 + 1, height + 1, height + 2, D.frameLight);
  wallPatch(grid, wall, a0, a1, 0, height, D.leaf);
  wallPatch(grid, wall, a0, a0 + 1, 0, height, D.leafLight);
  wallPatch(grid, wall, a1 - 1, a1, 0, height, D.leafShade);
  for (const [z0, z1] of [[6, 26], [32, height - 6]]) {
    wallPatch(grid, wall, a0 + 3, a1 - 3, z0, z1, D.panel);
    wallPatch(grid, wall, a0 + 3, a1 - 3, z1 - 1, z1, D.panelLight);
    wallPatch(grid, wall, a0 + 3, a0 + 4, z0, z1, D.panelLight);
  }
  // the knob on the side away from the hinges, and a plaque with a moon: where one goes to rest
  wallPatch(grid, wall, a1 - 5, a1 - 3, 28, 30, D.knob); wallPixel(grid, wall, a1 - 4, 28, D.knobShade);
  const middle = (a0 + a1) >> 1;
  wallPatch(grid, wall, middle - 4, middle + 4, height - 20, height - 13, D.sign);
  wallEllipse(grid, wall, middle + 0.5, height - 16, 2.2, 2.2, D.signInk); wallEllipse(grid, wall, middle + 1.6, height - 15.4, 1.8, 1.8, D.sign);
};

/** The doormat in front of the door, on the floor. */
export function paintDoormat(grid: PixelGrid) {
  const { a0, a1 } = DOOR, M = C.door.mat;
  fillTop(grid, 1, 12, a0 + 1, a1 - 1, 0, (u, v) => (u === 1 || u === 11 || v === a0 + 1 || v === a1 - 2 ? M[2] : (u + v) % 4 === 0 ? M[0] : M[1]));
}

/** A plant in a macramé hanger from the top of a wall. */
export function paintHangingPlant(grid: PixelGrid, [hx, hy]: [number, number], length: number, lean: number) {
  const M = C.macrame, L = C.leaves, x = hx + lean, y = hy + length;
  art((layer) => {
    for (const dx of [-5, 0, 5]) layer.line(hx, hy, x + dx, y, M.cord);
    for (const dx of [-3, 3]) layer.line(x + dx * 2, y - 10, x, y - 5, M.knot);
    layer.ellipse(hx, hy + 1, 1.5, 1.5, M.hook);
  }, grid, M.outline);
  art((layer) => {
    for (const [dx, count] of [[-6, 4], [-2, 6], [3, 5], [7, 3]]) for (let index = 0; index < count; index++) {
      const leafY = y + 3 + index * 3, leafX = x + dx + (index % 2 ? 1 : -1);
      layer.ellipse(leafX, leafY, 2.1, 1.6, L[(index + dx) & 1 ? 1 : 2]); layer.set(leafX - 1, leafY - 1, L[0]);
    }
    for (const [dx, dy] of [[-5, -3], [-1, -5], [4, -4], [7, -2]]) { layer.ellipse(x + dx, y + dy, 2.6, 2, L[1]); layer.set(x + dx - 1, y + dy - 1, L[0]); }
    for (let row = 0; row < 6; row++) {
      const half = row < 3 ? 7 : 7 - (row - 2) * 2;
      for (let dx = -half; dx < half; dx++) layer.set(x + dx, y - 2 + row, dx < -half + 2 ? M.pot[0] : dx >= half - 3 ? M.pot[2] : M.pot[1]);
    }
    layer.rect(x - 7, y - 2, 14, 1, M.potRim); layer.rect(x - 3, y + 1, 6, 1, M.potBand); layer.set(x - 1, y + 1, M.pot[1]);
  }, grid);
}

/* The furniture */

/** Something small that stands on a desk or on drawers, drawn on a layer of its own (outlined) at (x, y) on screen. */
export type Topper = (layer: PixelGrid, x: number, y: number) => void;

/** How a room's desks look: their top and legs, the drawers under them, their screen's monitor, their chairs, and what stands by the keyboard. */
export interface DeskStyle {
  top: Tones; topEdge: string; leg: Tones;
  /** the drawers under a back desk and under a side desk; null: a table on four legs */
  drawers: readonly [Tones, Tones] | null;
  monitor: Tones; monitorEdge: string; stand: Tones; vents: string; keyboard: Tones; key: string;
  /** the chairs: a seat's tones for each desk in turn, their star base and their pole */
  seats: readonly Tones[]; chairBase: Tones; chairPole: Tones;
  /** what stands on a back desk at the end of its keyboard (a mug), on a side desk by its screen (a plant) */
  backThing: Topper; sideThing: Topper;
}

/** A desk whose person faces the back wall: legs, a drawer unit, the screen towards us, a keyboard and what stands by it. */
function paintBackDesk(grid: PixelGrid, desk: Desk, S: DeskStyle) {
  const u = desk.u - 36, v = desk.v - 38;
  ob(grid, u + 37, u + 40, v + 39, v + 42, 0, 13, S.leg);
  if (S.drawers) ob(grid, u + 58, u + 71, v + 39, v + 51, 0, 13, S.drawers[0]);
  else for (const lv of [v + 39, v + 48]) ob(grid, u + 68, u + 71, lv, lv + 3, 0, 13, S.leg);
  ob(grid, u + 37, u + 40, v + 48, v + 51, 0, 13, S.leg);
  ob(grid, u + 36, u + 72, v + 38, v + 52, 13, 3, S.top, S.topEdge);
  if (S.drawers) {
    for (const z of [4, 8]) onLeftFace(grid, v + 51, u + 58, u + 71, z, S.drawers[0][2]);
    for (const z of [2, 6, 10]) onLeftFace(grid, v + 51, u + 63, u + 66, z, S.top[0]);
  }
  ob(grid, u + 54, u + 60, v + 40, v + 44, 16, 3, S.stand);
  ob(grid, u + 44, u + 70, v + 40, v + 44, 19, 17, S.monitor, S.monitorEdge);
  patchOnLeftFace(grid, v + 44, u + 46, u + 68, 21, 35, C.screen);
  onLeftFace(grid, v + 44, u + 46, u + 68, 34, C.screenTop);
  ob(grid, u + 46, u + 60, v + 46, v + 50, 16, 1, S.keyboard);
  for (let key = u + 47; key < u + 59; key += 2) for (const row of [v + 47, v + 49]) { const at = iso(key, row, 17); grid.set(at.x, at.y - 1, S.key); }
  const { x, y } = iso(u + 66, v + 49, 16);
  art((layer) => S.backThing(layer, x, y), grid);
}

/** The offices' mug of coffee, on a desk at (x, y). */
export const mug: Topper = (layer, x, y) => {
  const M = C.mug;
  layer.rect(x - 2, y - 6, 5, 6, M.body); layer.rect(x + 2, y - 6, 1, 6, M.shade); layer.rect(x - 2, y - 7, 5, 1, M.rim);
  layer.points([[x + 3, y - 4], [x + 4, y - 4], [x + 4, y - 3]], M.body); layer.points([[x - 1, y - 6], [x, y - 6]], M.coffee);
};

/** The offices' succulent in its pot, on a desk at (x, y). */
export const succulent: Topper = (layer, x, y) => {
  const L = C.leaves;
  layer.rect(x - 3, y - 5, 7, 5, C.succulentPot[0]); layer.rect(x + 2, y - 5, 2, 5, C.succulentPot[1]);
  layer.ellipse(x - 1, y - 8, 2.4, 2.4, L[1]); layer.ellipse(x + 2, y - 9, 2.2, 2.4, L[2]); layer.ellipse(x, y - 11, 2, 2, L[0]);
};

/** The screen of a back desk, at work: lines of code going up, a cursor blinking. Drawn each frame on the room's canvas. */
export function paintCode(context: CanvasRenderingContext2D, desk: Desk, frame: number) {
  const target = canvasTarget(context), u = desk.u - 36, v = desk.v - 38;
  const lines = CODE_LINES, scroll = Math.floor(frame / 6);
  for (let row = 0; row < 6; row++) {
    const line = lines[(scroll + row) % lines.length], z = 32 - row * 2;
    for (const [indent, length, colour] of line) onLeftFace(target, v + 44, u + 48 + indent, u + 48 + indent + length, z, C.code[colour]);
  }
  if ((frame >> 3) & 1) {
    const last = lines[(scroll + 5) % lines.length], end = last.reduce((most, [indent, length]) => Math.max(most, indent + length), 0);
    onLeftFace(target, v + 44, u + 49 + end, u + 51 + end, 22, C.cursor);
  }
}

/** The screen of a back desk with someone there who is not at work: lit, still. */
export function paintIdleScreen(context: CanvasRenderingContext2D, desk: Desk) {
  const target = canvasTarget(context), u = desk.u - 36, v = desk.v - 38;
  for (let z = 22; z < 34; z++) onLeftFace(target, v + 44, u + 47, u + 67, z, C.screenGlow);
}

/** [indent, length, colour of C.code] */
export const CODE_LINES: readonly (readonly (readonly [number, number, number])[])[] = [
  [[0, 6, 0], [7, 8, 1]], [[2, 5, 2], [8, 6, 3]], [[2, 10, 4]], [[4, 4, 5], [9, 7, 3]],
  [[4, 9, 1]], [[2, 3, 0], [6, 5, 2]], [[0, 2, 4]], [[0, 7, 0], [8, 5, 5]],
  [[2, 6, 3], [9, 6, 1]], [[4, 11, 2]], [[2, 2, 4]], [[0, 9, 1]],
];

/** A desk along the right of the room, its person facing the left wall: we see the back of its screen. */
function paintSideDesk(grid: PixelGrid, desk: Desk, S: DeskStyle) {
  const u = desk.u, v = desk.v, end = v + desk.length;
  if (S.drawers) ob(grid, u + 1, u + 13, end - 13, end - 1, 0, 13, S.drawers[1]);
  else for (const lu of [u + 1, u + 10]) ob(grid, lu, lu + 3, end - 4, end - 1, 0, 13, S.leg);
  ob(grid, u + 1, u + 4, v + 1, v + 4, 0, 13, S.leg);
  ob(grid, u + 10, u + 13, v + 1, v + 4, 0, 13, S.leg);
  if (S.drawers) {
    for (const z of [4, 8]) onLeftFace(grid, end - 1, u + 1, u + 13, z, S.drawers[1][2]);
    for (const z of [2, 6, 10]) onLeftFace(grid, end - 1, u + 6, u + 9, z, S.drawers[1][0]);
  }
  ob(grid, u, u + 14, v, end, 13, 3, S.top, S.topEdge);
  ob(grid, u + 5, u + 9, v + 7, v + 13, 16, 3, S.stand);
  ob(grid, u + 4, u + 8, v + 1, v + 20, 19, 16, S.monitor, S.monitorEdge);
  for (const z of [24, 27, 30]) onRightFace(grid, u + 8, v + 5, v + 16, z, S.vents);
  onLeftFace(grid, v + 20, u + 4, u + 8, 21, C.led);
  // the keyboard in front of whoever sits there (deskPlace)
  ob(grid, u - 6, u - 1, v + 19, v + 30, 16, 1, S.keyboard);
  const { x, y } = iso(u + 8, end - 6, 16);
  art((layer) => S.sideThing(layer, x, y), grid);
}

/** An office chair's seat on its pole and its star base, (u, v) its middle. */
export function paintChairSeat(grid: PixelGrid, u: number, v: number, seat: Tones, base: Tones = C.chair.base, pole: Tones = C.chair.pole) {
  ob(grid, u - 6, u + 6, v - 2, v + 2, 0, 2, base);
  ob(grid, u - 2, u + 2, v - 6, v + 6, 0, 2, base);
  ob(grid, u - 1, u + 1, v - 1, v + 1, 2, 7, pole);
  ob(grid, u - 6, u + 6, v - 6, v + 6, 9, 2, seat, tint(seat[0], 1.06));
}

function paintChairBack(grid: PixelGrid, u0: number, u1: number, v0: number, v1: number, seat: Tones, z: number, height: number, pole: Tones = C.chair.pole) {
  const cu = (u0 + u1) >> 1, cv = (v0 + v1) >> 1;
  ob(grid, cu - 1, cu + 1, cv - 1, cv + 1, 10, Math.max(1, z - 10), pole);
  ob(grid, u0, u1, v0, v1, z, height, seat, tint(seat[0], 1.06));
}

/** A drawer unit against a wall, its drawers on `face`, the face that looks into the room, something on top. */
export interface Drawers { u0: number; u1: number; v0: number; v1: number; height: number; tones: Tones; face: Wall; topper?: Topper }

export function paintDrawers(grid: PixelGrid, { u0, u1, v0, v1, height, tones, face, topper }: Drawers) {
  ob(grid, u0, u1, v0, v1, 0, height, tones, tint(tones[0], 1.05));
  const step = Math.floor(height / 3), line = tint(tones[2], 0.88), light = tint(tones[0], 1.03);
  const along = face === 'left' ? (z: number, a: number, b: number, colour: string) => onLeftFace(grid, v1, a, b, z, colour) : (z: number, a: number, b: number, colour: string) => onRightFace(grid, u1, a, b, z, colour);
  const [a0, a1] = face === 'left' ? [u0, u1] : [v0, v1], middle = (a0 + a1) >> 1;
  for (let index = 1; index < 3; index++) along(index * step + 1, a0, a1, line);
  for (let index = 0; index < 3; index++) { const z = index * step + (step >> 1) + 1; along(z, middle - 2, middle + 2, light); along(z - 1, middle - 2, middle + 2, line); }
  // what stands on top sits towards the front, so more of the top's two back edges shows
  const top = iso(((u0 + u1) >> 1) + 3, ((v0 + v1) >> 1) + 3, height);
  if (topper) art((layer) => topper(layer, top.x, top.y), grid);
}

/** A couch's colours: its body and its cushions. */
export interface CouchTones { body: Tones; edge: string; cushion: Tones; cushionEdge: string }

/** A box of a couch, `across` from the wall and `along` it from its far end (geometry.ts onCouchAt). */
function couchBox(grid: PixelGrid, couch: Couch, across: [number, number], along: [number, number], z: number, height: number, tones: Tones, edge?: string) {
  const [u0, v0] = onCouchAt(couch, across[0], along[0]), [u1, v1] = onCouchAt(couch, across[1], along[1]);
  ob(grid, u0, u1, v0, v1, z, height, tones, edge);
}

/**
 * A couch against a wall, but its front arm (a piece of its own: it is in front of whoever naps at that end): `seats`
 * cushions, and the star pillow `pillow` units from its far end (null: none).
 */
export function paintCouch(grid: PixelGrid, couch: Couch, tones: CouchTones = C.couch, seats = 2, pillow: number | null = 16) {
  const K = C.couch, { depth, length } = couch, slot = Math.floor((length - 12) / seats);
  couchBox(grid, couch, [0, 7], [0, length], 0, 26, tones.body, tones.edge);
  couchBox(grid, couch, [4, depth], [0, 7], 0, 16, tones.body, tones.edge);
  couchBox(grid, couch, [6, depth], [6, length - 6], 0, 9, tones.body);
  for (let seat = 0; seat < seats; seat++) couchBox(grid, couch, [7, depth], [7 + seat * slot, 6 + (seat + 1) * slot], 9, 4, tones.cushion, tones.cushionEdge);
  if (pillow === null) return;
  art((layer) => {
    const { x, y } = iso(...onCouchAt(couch, 10, pillow), 13);
    layer.pattern(x - 6, y - 10, ['......y......', '.....yyy.....', '....yyyyy....', 'yyyyyyyyyyyyy', '.yyyyyyyyyyy.', '..yyyyyyyyy..', '...yyyyyyy...', '..yyyyyyyyy..', '..yyyy.yyyy..', '.yyy.....yyy.', '.yy.......yy.'], { y: K.star });
    for (let index = 0; index < 4; index++) layer.set(x - 3 + index, y - 7 + (index >> 1), K.starLight);
    layer.points([[x + 2, y - 4], [x + 3, y - 4], [x + 4, y - 5], [x + 4, y - 3], [x + 3, y - 3]], K.starShade);
    layer.points([[x - 2, y - 5], [x + 2, y - 5]], O); layer.points([[x - 1, y - 3], [x, y - 3], [x + 1, y - 3]], O);
  }, grid);
}

export function paintCouchArm(grid: PixelGrid, couch: Couch, tones: CouchTones = C.couch) {
  couchBox(grid, couch, [4, couch.depth], [couch.length - 7, couch.length], 0, 16, tones.body, tones.edge);
}

/** A monstera's pot: its tones, light to dark, and its rim; `face`: the offices' little face on it. */
export interface MonsteraPot { light: string; base: string; shade: string; rim: string; face: boolean }
export const OFFICE_POT: MonsteraPot = { light: C.monstera.potLight, base: C.monstera.pot, shade: C.monstera.potShade, rim: C.monstera.potRim, face: true };

export function paintMonstera(grid: PixelGrid, u: number, v: number, pot: MonsteraPot = OFFICE_POT) {
  const M = C.monstera, { x, y } = iso(u, v);
  const leaf = (cx: number, cy: number, rx: number, ry: number, angle: number, light: boolean) => art((layer) => {
    const tones = light ? M.leavesLight : M.leaves;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const at = (a: number, b: number): [number, number] => [Math.floor(cx + a * cos - b * sin), Math.floor(cy + a * sin + b * cos)];
    layer.turnedEllipse(cx, cy, rx, ry, angle, tones[2]); layer.turnedEllipse(cx - 0.6, cy - 0.8, rx - 1, ry - 1, angle, tones[1], [tones[2]]);
    layer.turnedEllipse(cx - 0.6 + cos * rx * 0.2, cy - 0.8 + sin * rx * 0.2 - ry * 0.35, rx * 0.45, ry * 0.25, angle, tones[0], [tones[1]]);
    for (let a = -rx + 1; a < rx - 1; a++) layer.set(...at(a, 0), tones[2]);
    // the holes and slits of a monstera leaf
    for (const f of [-0.5, -0.05, 0.4]) for (const side of [-1, 1]) for (let index = 0; index < ry * 0.6; index++) layer.set(...at(f * rx + index * 0.5, side * (ry - 0.5 - index)), null);
    layer.set(...at(-rx + 0.5, 0), null); layer.set(...at(-rx + 1.5, 0), null);
  }, grid);
  const leaves = [[-1, -68, 9, 6], [13, -62, 10, 6.5], [-15, -58, 10, 6.5], [4, -50, 10, 6.5], [-19, -40, 10, 6.5], [18, -42, 10, 6.5], [-9, -31, 8, 5.5], [10, -30, 8, 5.5]] as const;
  for (const [dx, dy] of leaves) { grid.line(x, y - 20, x + dx, y + dy, M.stem); grid.line(x, y - 20, x + dx + 1, y + dy, M.stem); }
  for (const [index, [dx, dy, rx, ry]] of leaves.entries()) leaf(x + dx, y + dy, rx, ry, Math.atan2((dy + 22) * 0.35, dx || 0.1), index % 2 === 1);
  art((layer) => {
    for (let row = 0; row < 20; row++) {
      const half = row < 3 ? 12 : 11 - Math.floor((row - 3) / 6);
      for (let dx = -half; dx < half; dx++) layer.set(x + dx, y - 20 + row, dx < -half + 3 ? pot.light : dx >= half - 5 ? pot.shade : pot.base);
    }
    layer.rect(x - 12, y - 20, 24, 1, pot.light); layer.rect(x - 11, y - 19, 22, 1, M.soil); layer.rect(x - 12, y - 18, 24, 1, pot.rim);
    if (!pot.face) return;
    // the pot's little face
    layer.points([[x - 5, y - 11], [x - 5, y - 10], [x + 3, y - 11], [x + 3, y - 10]], O);
    layer.set(x - 5, y - 11, M.eye);
    layer.points([[x - 3, y - 7], [x - 2, y - 6], [x - 1, y - 6], [x, y - 6], [x + 1, y - 7]], O);
    layer.points([[x - 9, y - 8], [x - 8, y - 8], [x + 5, y - 8], [x + 6, y - 8]], C.blush);
  }, grid);
}

export function paintLamp(grid: PixelGrid, at: { u: number; v: number }) {
  const L = C.lamp, { x, y } = iso(at.u, at.v);
  art((layer) => { layer.ellipse(x, y - 1, 5, 2, L.base); layer.ellipse(x, y - 2, 4, 1.4, L.baseLight); layer.rect(x, y - 38, 1, 37, L.pole); }, grid);
  art((layer) => {
    for (let row = 0; row < 11; row++) { const half = 4 + Math.floor(row / 2); for (let dx = -half; dx <= half; dx++) layer.set(x + dx, y - 49 + row, dx < -half + 2 ? L.shadeLight : dx > half - 3 ? L.shadeDark : L.shade); }
    layer.rect(x - 9, y - 39, 19, 1, L.shadeRim);
  }, grid);
}

/** The server room's racks, in rows where the desks are (their corner nearest the back): their lights on while automatons work. */
const RACKS = [[24, 24], [46, 24], [68, 24], [24, 60], [46, 60], [68, 60]] as const;
const RACK = { width: 16, depth: 12 } as const;

function paintRack(grid: PixelGrid, u: number, v: number, lit: boolean) {
  const K = C.rack, front = v + RACK.depth;
  ob(grid, u, u + RACK.width, v, front, 0, 46, K.body);
  patchOnLeftFace(grid, front, u + 2, u + 14, 4, 42, K.face);
  for (let z = 8; z < 42; z += 6) for (let a = u + 3; a < u + 13; a += 3) onLeftFace(grid, front, a, a + 1, z, !lit ? K.off : (a + z) % 4 === 0 ? K.busy : (a + z) % 5 === 0 ? K.link : K.on);
}

/** A sleeper's Z's rising from (x, y), one after the other. */
export function paintZzzAt(context: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  for (let index = 0; index < 2; index++) {
    const age = (frame + index * 18) % 36, zx = x + (age >> 3), zy = y - (age >> 2);
    context.fillStyle = age < 28 ? C.cat.zzz : C.cat.zzzFading;
    context.fillRect(zx, zy, 3, 1); context.fillRect(zx + 1, zy + 1, 1, 1); context.fillRect(zx, zy + 2, 3, 1);
  }
}

/* A room, put together */

/** Something that can stand in front of someone: drawn in depth order with the people. */
export interface Piece { depth: number; canvas: HTMLCanvasElement }

export interface RoomArt {
  /** the floor, the walls and everything behind the people */
  back: HTMLCanvasElement;
  /** the pieces that may be in front of someone */
  pieces: Piece[];
  /** what stands in front of someone standing or walking at a depth, on a layer of its own (null: nothing does) */
  frontOf: (depth: number) => HTMLCanvasElement | null;
  /** what its ambiance's motion draws on, each frame, and the scene it was drawn for (none: nothing moves) */
  motion?: RoomMotion | null;
}

/** A room's motion layers (ambiance/index.ts AmbianceMotion), made with its art, and the scene they follow. */
export interface RoomMotion { layers: Readonly<Record<string, MotionLayer>>; scene: AmbianceScene }

/**
 * Something standing on the floor of the back layer, from (u0, v0) to (u1, v1): they are painted from the back to the
 * front, so that one in front covers one behind wherever they meet on the screen, whatever order they are listed in.
 */
export interface Standing { depth: number; paint: (grid: PixelGrid) => void }
export const standing = (u0: number, u1: number, v0: number, v1: number, paint: (grid: PixelGrid) => void): Standing => ({ depth: cozyDepth((u0 + u1) / 2, (v0 + v1) / 2), paint });

/**
 * A piece on a layer of its own (it is laid over the back layer and the people), and over it, where they meet, what
 * stands in front of it in the back layer: a piece never covers something nearer than itself.
 */
export function pieceGrid(depth: number, paint: (grid: PixelGrid) => void, floor: readonly Standing[]): PixelGrid {
  const grid = newGrid(), front = newGrid();
  paint(grid);
  for (const thing of floor) if (thing.depth > depth) thing.paint(front);
  grid.cells.forEach((colour, index) => { if (colour && front.cells[index]) grid.cells[index] = front.cells[index]; });
  return grid;
}

/** How a room's light changes a colour at (x, y) (light.ts lightingOf); null: as drawn. */
export type RoomLight = ((colour: string, x: number, y: number) => string) | null;

export function toCanvas(grid: PixelGrid, light: RoomLight): HTMLCanvasElement {
  if (light) grid.recolour(light);
  const canvas = document.createElement('canvas');
  canvas.width = ROOM_BOX.width;
  canvas.height = ROOM_BOX.height;
  grid.paint(canvas.getContext('2d')!);
  return canvas;
}

/** The clock of the offices and of the break room, on the right wall above the coffee counter. */
export const ROOM_CLOCK: WallClock = { wall: 'right', a: 52, z: 70, radius: 6 };

/**
 * A room's own light, beside the offices' (COZY_PALETTE.light): its ambient light with its lights on and off at each
 * mood (multiplied, per channel), its floor lamp's at dusk and at night (added), and the colours its lamp's shade
 * shines in once lit.
 */
export interface OwnLight {
  ambient?: { on: Readonly<Record<CozyTime, Rgb>>; off: Readonly<Record<CozyTime, Rgb>> };
  lamp?: Readonly<Record<'dusk' | 'night', Rgb>>;
  lampGlow?: readonly string[];
}

/**
 * A room's light at a mood of the hour, its lights on (someone is there) or off: through the window by day; at dusk
 * and at night the floor lamp at `lampAt` lit and, at night, the `screens`' blue glow; what shines by itself
 * (`shining`, while the lights are on) left as it is. `own`: the room's own light (an ambiance's), else the offices'.
 */
export function roomLight(lit: boolean, time: CozyTime, lampAt: { u: number; v: number }, screens: readonly { u: number; v: number }[], shining: readonly string[], own: OwnLight = {}): RoomLight {
  const L = C.light, ambient = (own.ambient ?? L)[lit ? 'on' : 'off'][time];
  if (lit && time === 'day' && ambient.every((channel) => channel === 1)) return null;
  const lampsOn = lit && time !== 'day';
  const lamps = lampsOn ? [
    lamp(lampAt.u, lampAt.v, 44, (own.lamp ?? L.lamp)[time as 'dusk' | 'night'], 74, 0.6, 4),
    ...(time === 'night' ? screens.map((screen) => lamp(screen.u, screen.v, 26, L.screen, 32)) : []),
  ] : [];
  const glow = [...SKY_GLOW, ...FESTIVE_GLOW, ...(lit ? shining : []), ...(lampsOn ? own.lampGlow ?? [C.lamp.shade, C.lamp.shadeLight, C.lamp.shadeDark] : [])];
  return lightingOf({ ambient, lamps }, new Set(glow));
}

/**
 * What stands in front of someone at a depth (a visitor, someone walking), on a layer of its own lit like the room,
 * laid over them: what is deeper than them of `floor` (sorted back to front), each such layer drawn the first time it
 * is asked for.
 */
export function frontLayers(floor: readonly Standing[], light: RoomLight): (depth: number) => HTMLCanvasElement | null {
  const made = new Map<number, HTMLCanvasElement>();
  return (depth) => {
    const first = floor.findIndex((thing) => thing.depth > depth);
    if (first < 0) return null;
    let canvas = made.get(first);
    if (!canvas) {
      const front = newGrid();
      for (const thing of floor.slice(first)) thing.paint(front);
      canvas = toCanvas(front, light);
      made.set(first, canvas);
    }
    return canvas;
  };
}

/** What screens shine in, whatever the room: never darkened while its lights are on. */
const SCREEN_GLOW: readonly string[] = [C.screen, C.screenTop, C.screenGlow, C.led, C.rack.on, C.rack.busy, C.rack.link];

/**
 * A project room in its ambiance (ambiance/index.ts), or the server room (the offices' with racks for desks), before
 * its light: its floor, walls and window, its board, door and clock, the festival's walls, what hangs and lies on the
 * floor, then what stands there from back to front, its desks and chairs and its couch (`back`); the pieces in front
 * of people apart; the light that goes over all of them; the cells its motion draws over (AmbianceMotion). Pure.
 */
export function roomLayout(kind: 'project' | 'servers', design: AmbianceDesign, lit: boolean, time: CozyTime, festival: Festival | null) {
  const back = newGrid(), { couch, festiveSpot: spot, deskStyle: style } = design;
  design.paintRoom(back, time);
  design.paintBoard(back);
  design.paintDoor(back);
  paintWholeClock(back, design.clock);
  if (festival) paintFestiveWalls(back, festival);
  design.dress(back);
  const [couchEnd, couchSide] = onCouchAt(couch, couch.depth, couch.length);
  const floor: Standing[] = [...design.standing, standing(couch.u, couchEnd, couch.v, couchSide, design.paintCouch)];
  if (festival && FESTIVE_DECOR[festival].floor) floor.push(standing(spot.u, spot.u, spot.v, spot.v, (grid) => paintFestiveFloor(grid, festival, spot.u, spot.v)));
  if (kind === 'servers') for (const [u, v] of RACKS) floor.push(standing(u, u + RACK.width, v, v + RACK.depth, (grid) => paintRack(grid, u, v, lit)));
  const pieces: Standing[] = [];
  const piece = (depth: number, paint: (grid: PixelGrid) => void) => pieces.push({ depth, paint });
  const desks = kind === 'project' ? design.desks : [];
  desks.forEach((desk, index) => {
    const place = deskPlace(desk), seat = style.seats[index % style.seats.length];
    floor.push(standing(place.u - 6, place.u + 6, place.v - 6, place.v + 6, (grid) => paintChairSeat(grid, place.u, place.v, seat, style.chairBase, style.chairPole)));
    if (desk.kind === 'back') {
      floor.push(standing(desk.u, desk.u + desk.length, desk.v, desk.v + 14, (grid) => paintBackDesk(grid, desk, style)));
      piece(cozyDepth(place.u, place.v + 6), (grid) => paintChairBack(grid, place.u - 5, place.u + 5, place.v + 5, place.v + 8, seat, 11, 4, style.chairPole));
    } else {
      floor.push(standing(place.u - 10, place.u - 6, place.v - 6, place.v + 6, (grid) => paintChairBack(grid, place.u - 10, place.u - 6, place.v - 6, place.v + 6, seat, 15, 10, style.chairPole)));
      piece(cozyDepth(desk.u + 7, desk.v + desk.length / 2), (grid) => paintSideDesk(grid, desk, style));
    }
  });
  piece(couchArmDepth(couch), design.paintCouchArm);
  floor.sort((a, b) => a.depth - b.depth);
  for (const { paint } of floor) paint(back);
  const screens = desks.filter((desk) => desk.kind === 'back').map((desk) => ({ u: desk.u + 21, v: desk.v + 6 }));
  const { lamp: lampAt, lampColour, glow, sky, ...own } = design.light;
  const light = roomLight(lit, time, lampAt, screens, [...SCREEN_GLOW, ...glow], { ...own, lamp: lampColour });
  const shine = new Set(sky);
  const lightOf: RoomLight = light && ((colour, x, y) => (shine.has(colour) ? colour : light(colour, x, y)));
  const motion = kind === 'project' ? design.motion : undefined;
  const masks: Record<string, { mask: CellMask; colours: readonly string[] }> = {};
  if (motion) {
    for (const [name, colours] of Object.entries(motion.masks)) masks[name] = { mask: colourMask(back, colours), colours };
    if (design.glass && !masks.view) masks.view = { mask: withinWall(colourMask(back, sky), design.glass), colours: sky };
  }
  return { back, floor, pieces, light: lightOf, masks };
}

/** A project room in its ambiance, or the server room (roomLayout), lit, on its canvases. */
function build(kind: 'project' | 'servers', design: AmbianceDesign, lit: boolean, time: CozyTime, festival: Festival | null): RoomArt {
  const { back, floor, pieces, light, masks } = roomLayout(kind, design, lit, time, festival);
  const layers = Object.fromEntries(Object.entries(masks).map(([name, { mask, colours }]) => [name, new MotionLayer(mask, colours)]));
  return {
    back: toCanvas(back, light),
    pieces: pieces.map(({ depth, paint }) => ({ depth, canvas: toCanvas(pieceGrid(depth, paint, floor), light) })),
    frontOf: frontLayers(floor, light),
    motion: Object.keys(layers).length ? { layers, scene: { time, lit, festival } } : null,
  };
}

const built = sceneCache<RoomArt>();
/**
 * A project room in its ambiance with its lights on or off at an hour (its mood, time.ts) and on a festival, or the
 * server room (none there: it keeps its own look, like the classic one), drawn the first time it is asked for and
 * kept until the mood or the festival changes.
 */
export function roomArt(kind: 'project' | 'servers', design: AmbianceDesign, lit: boolean, hour: number, festival: Festival | null): RoomArt {
  const shown = kind === 'servers' ? null : festival;
  return built(sceneKey(hour, festival), `${kind}:${design.id}:${lit}:${shown ?? ''}`, () => build(kind, design, lit, cozyTimeOf(hour), shown));
}
