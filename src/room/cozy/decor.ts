// What a cozy room is made of (src/room/cozy/), drawn once per kind of room and per light: cream walls with a wainscot,
// honey planks, a window with lavender curtains, hanging plants, a monstera, the couch with its star pillow, the coffee
// counter, the water cooler, the whiteboard, the door to the break room, a pink rug, pastel drawers, and white desks
// with their screens. Everything behind the people goes on one canvas (`back`); what can stand in front of someone (a
// chair's back, a desk seen from behind its person, the couch's arm) is a piece of its own, drawn in depth order with
// the people. The break room is made of the same pieces (lounge-art.ts).
import type { Festival } from '../../../shared/festivals.ts';
import { COZY_PALETTE as C } from '../../design/room-palette.ts';
import { paintClockFace, type WallClock } from './clock.ts';
import { FESTIVE_DECOR, FESTIVE_GLOW, paintFestiveFloor, paintFestiveWalls } from './festive.ts';
import { SKY_GLOW, lamp, lightingOf } from './light.ts';
import type { CozyRoomKind } from './rooms.ts';
import { cozyTimeOf, sceneCache, sceneKey, type CozyTime } from './time.ts';
import { COUCH, COUCH_ARM_DEPTH, DESKS, ROOM_BOX, ROOM_UNITS, WALL_HEIGHT, WALL_THICKNESS, CAT_SPOT, around, cozyDepth, deskPlace, iso, onCouchAt, type Couch, type Desk, type Footprint } from './geometry.ts';
import { paintPet, petKey, petPixels, type CozyPet } from './pet.ts';
import {
  PixelGrid, box, fillTop, fillWall, onLeftFace, onRightFace, outlined, outlinedBox, patchOnLeftFace, shadeFloor, tint, wallEllipse, wallPatch, wallPixel, wallPoint,
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

/** The window's panes: the sky of the hour (time.ts), the sun high with its clouds by day, low and pink at dusk, the moon and stars at night. */
function paintPanes(grid: PixelGrid, time: CozyTime) {
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

/** The whiteboard on the right wall, its tray and its pens: a click opens the board and its notes, like the classic one. */
export const paintWhiteboard: Painter = (grid) => {
  const wall: Wall = 'right', B = C.whiteboard;
  wallPatch(grid, wall, 74, 122, 46, 86, B.frame); wallPatch(grid, wall, 75, 121, 47, 85, B.frameLight); wallPatch(grid, wall, 77, 119, 49, 83, B.surface);
  wallPatch(grid, wall, 77, 119, 49, 50, B.surfaceTop);
  for (const [a0, a1, z, ink] of [[80, 96, 78, 0], [80, 104, 75, 0], [80, 90, 72, 1], [92, 100, 72, 2], [80, 94, 69, 2]] as const) wallPatch(grid, wall, a0, a1, z, z + 1, B.ink[ink]);
  for (const [a, height, ink] of [[100, 6, 0], [104, 10, 1], [108, 14, 3], [112, 9, 2]] as const) wallPatch(grid, wall, a, a + 3, 54, 54 + height, B.ink[ink]);
  wallPatch(grid, wall, 98, 117, 53, 54, B.grey);
  wallPatch(grid, wall, 80, 88, 58, 59, B.grey); wallPatch(grid, wall, 80, 92, 61, 62, B.grey);
  ob(grid, 76, 120, 0, 4, 44, 2, B.tray);
  for (const [a, ink] of [[86, 1], [90, 0], [94, 2]] as const) ob(grid, a, a + 3, 0, 3, 46, 1, [B.ink[ink], B.inkShade[ink], B.inkShade[ink]]);
  const [x, y] = wallPoint(wall, 114, 82);
  art((layer) => {
    layer.pattern(x - 4, y - 4, ['....y....', '...yyy...', 'yyyyyyyyy', '.yyyyyyy.', '..yyyyy..', '.yyy.yyy.', '.yy...yy.'], { y: B.star });
    layer.points([[x, y - 2], [x - 1, y - 1], [x - 2, y]], B.starLight);
  }, grid);
  art((layer) => { layer.pattern(x + 7, y - 2, ['.rr.rr', 'rrrrrr', 'rrrrrr', '.rrrr.', '..rr..'], { r: B.heart }); layer.set(x + 8, y - 1, B.heartLight); }, grid);
};

/** The door to the break room (in the break room, back to the offices): on the left wall, near the front of the room. */
export const DOOR = { wall: 'left', a0: 102, a1: 122, height: 62 } as const satisfies { wall: Wall; a0: number; a1: number; height: number };

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

function paintRug(grid: PixelGrid) {
  const R = C.rug, { x, y } = iso(52, 96);
  grid.ellipse(x, y + 1, 31, 15.5, R.edgeShade); grid.ellipse(x, y, 31, 15.5, R.edge);
  grid.ellipse(x, y, 30, 14.6, R.base); grid.ellipse(x, y, 25, 12, R.ring); grid.ellipse(x, y, 18, 8.6, R.middle);
  for (let index = 0; index < 28; index++) { const angle = index / 28 * Math.PI * 2; grid.set(Math.round(x + Math.cos(angle) * 27.5), Math.round(y + Math.sin(angle) * 13.2), R.dots); }
  for (let index = 0; index < 20; index++) { const angle = index / 20 * Math.PI * 2; grid.set(Math.round(x + Math.cos(angle) * 18.5), Math.round(y + Math.sin(angle) * 8.9), R.base); }
  grid.pattern(x - 3, y - 2, ['.p.p.', 'ppppp', '.ppp.', '..p..'], { p: R.heart });
}

/* The furniture */

/** A desk whose person faces the back wall: legs, a drawer unit, the screen towards us, a keyboard and a mug. */
function paintBackDesk(grid: PixelGrid, desk: Desk) {
  const u = desk.u - 36, v = desk.v - 38, D = C.drawer.mint;
  ob(grid, u + 37, u + 40, v + 39, v + 42, 0, 13, C.leg);
  ob(grid, u + 58, u + 71, v + 39, v + 51, 0, 13, D);
  ob(grid, u + 37, u + 40, v + 48, v + 51, 0, 13, C.leg);
  ob(grid, u + 36, u + 72, v + 38, v + 52, 13, 3, C.desk, C.deskEdge);
  for (const z of [4, 8]) onLeftFace(grid, v + 51, u + 58, u + 71, z, D[2]);
  for (const z of [2, 6, 10]) onLeftFace(grid, v + 51, u + 63, u + 66, z, C.desk[0]);
  ob(grid, u + 54, u + 60, v + 40, v + 44, 16, 3, C.stand);
  ob(grid, u + 44, u + 70, v + 40, v + 44, 19, 17, C.monitor, C.monitorEdge);
  patchOnLeftFace(grid, v + 44, u + 46, u + 68, 21, 35, C.screen);
  onLeftFace(grid, v + 44, u + 46, u + 68, 34, C.screenTop);
  ob(grid, u + 46, u + 60, v + 46, v + 50, 16, 1, C.keyboard);
  for (let key = u + 47; key < u + 59; key += 2) for (const row of [v + 47, v + 49]) { const at = iso(key, row, 17); grid.set(at.x, at.y - 1, C.key); }
  art((layer) => {
    const M = C.mug, { x, y } = iso(u + 66, v + 49, 16);
    layer.rect(x - 2, y - 6, 5, 6, M.body); layer.rect(x + 2, y - 6, 1, 6, M.shade); layer.rect(x - 2, y - 7, 5, 1, M.rim);
    layer.points([[x + 3, y - 4], [x + 4, y - 4], [x + 4, y - 3]], M.body); layer.points([[x - 1, y - 6], [x, y - 6]], M.coffee);
  }, grid);
}

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
function paintSideDesk(grid: PixelGrid, desk: Desk) {
  const u = desk.u, v = desk.v, end = v + desk.length, D = C.drawer.pink;
  ob(grid, u + 1, u + 13, end - 13, end - 1, 0, 13, D);
  ob(grid, u + 1, u + 4, v + 1, v + 4, 0, 13, C.leg);
  ob(grid, u + 10, u + 13, v + 1, v + 4, 0, 13, C.leg);
  for (const z of [4, 8]) onLeftFace(grid, end - 1, u + 1, u + 13, z, D[2]);
  for (const z of [2, 6, 10]) onLeftFace(grid, end - 1, u + 6, u + 9, z, D[0]);
  ob(grid, u, u + 14, v, end, 13, 3, C.desk, C.deskEdge);
  ob(grid, u + 5, u + 9, v + 7, v + 13, 16, 3, C.stand);
  ob(grid, u + 4, u + 8, v + 1, v + 20, 19, 16, C.monitor, C.monitorEdge);
  for (const z of [24, 27, 30]) onRightFace(grid, u + 8, v + 5, v + 16, z, C.vents);
  onLeftFace(grid, v + 20, u + 4, u + 8, 21, C.led);
  // the keyboard in front of whoever sits there (deskPlace)
  ob(grid, u - 6, u - 1, v + 19, v + 30, 16, 1, C.keyboard);
  art((layer) => {
    const { x, y } = iso(u + 8, end - 6, 16), L = C.leaves;
    layer.rect(x - 3, y - 5, 7, 5, C.succulentPot[0]); layer.rect(x + 2, y - 5, 2, 5, C.succulentPot[1]);
    layer.ellipse(x - 1, y - 8, 2.4, 2.4, L[1]); layer.ellipse(x + 2, y - 9, 2.2, 2.4, L[2]); layer.ellipse(x, y - 11, 2, 2, L[0]);
  }, grid);
}

/** An office chair's seat on its pole and its star base, (u, v) its middle. */
export function paintChairSeat(grid: PixelGrid, u: number, v: number, seat: Tones, base: Tones = C.chair.base, pole: Tones = C.chair.pole) {
  ob(grid, u - 6, u + 6, v - 2, v + 2, 0, 2, base);
  ob(grid, u - 2, u + 2, v - 6, v + 6, 0, 2, base);
  ob(grid, u - 1, u + 1, v - 1, v + 1, 2, 7, pole);
  ob(grid, u - 6, u + 6, v - 6, v + 6, 9, 2, seat, tint(seat[0], 1.06));
}

function paintChairBack(grid: PixelGrid, u0: number, u1: number, v0: number, v1: number, seat: Tones, z: number, height: number) {
  const cu = (u0 + u1) >> 1, cv = (v0 + v1) >> 1;
  ob(grid, cu - 1, cu + 1, cv - 1, cv + 1, 10, Math.max(1, z - 10), C.chair.pole);
  ob(grid, u0, u1, v0, v1, z, height, seat, tint(seat[0], 1.06));
}

function paintCounter(grid: PixelGrid) {
  const K = C.counter;
  ob(grid, 34, 70, 0, 14, 0, 20, K.body);
  for (const [a0, a1] of [[36, 51], [53, 68]]) {
    patchOnLeftFace(grid, 14, a0, a1, 3, 4, K.panel); patchOnLeftFace(grid, 14, a0, a1, 17, 18, K.panel);
    patchOnLeftFace(grid, 14, a0, a0 + 1, 3, 18, K.panel); patchOnLeftFace(grid, 14, a1 - 1, a1, 3, 18, K.panel);
    patchOnLeftFace(grid, 14, a0 + 1, a1 - 1, 16, 17, K.panelLight);
  }
  patchOnLeftFace(grid, 14, 48, 50, 9, 11, K.knob); patchOnLeftFace(grid, 14, 55, 57, 9, 11, K.knob);
  ob(grid, 33, 71, 0, 15, 20, 2, K.top, K.topEdge);
  ob(grid, 38, 48, 2, 10, 22, 16, K.machine, K.machineEdge);
  patchOnLeftFace(grid, 10, 40, 46, 26, 34, K.machineFace); onLeftFace(grid, 10, 44, 45, 35, K.red); onLeftFace(grid, 10, 41, 42, 35, K.green);
  patchOnLeftFace(grid, 10, 42, 44, 31, 33, K.nozzle);
  art((layer) => { const { x, y } = iso(44, 12, 22); layer.rect(x - 2, y - 4, 4, 4, K.cup); layer.rect(x + 1, y - 4, 1, 4, K.cupShade); layer.rect(x - 2, y - 4, 4, 1, K.coffee); }, grid);
  art((layer) => {
    const { x, y } = iso(61, 7, 22);
    layer.ellipse(x, y - 1, 9, 3.4, K.plate); layer.ellipse(x, y - 1, 7, 2.4, K.plateShade);
    for (const [dx, dy, icing] of [[-4, -3, 0], [3, -3, 1], [0, -6, 0]] as const) {
      layer.ellipse(x + dx, y + dy, 3.2, 2.2, K.donut); layer.ellipse(x + dx, y + dy - 0.6, 2.8, 1.6, K.icing[icing]); layer.set(x + dx, y + dy - 1, K.donutHole);
      layer.set(x + dx - 2, y + dy - 1, K.sprinkles[0]); layer.set(x + dx + 1, y + dy - 2, K.sprinkles[1]); layer.set(x + dx + 2, y + dy - 1, K.sprinkles[2]);
    }
  }, grid);
}

/** The water cooler, in the back right corner: clear of the desks, its taps on the face towards the room. */
const COOLER = { u: 114, v: 2, width: 12 } as const;

function paintCooler(grid: PixelGrid) {
  const K = C.cooler, { u, v, width } = COOLER, front = v + width;
  ob(grid, u, u + width, v, front, 0, 22, K.body, K.edge);
  patchOnLeftFace(grid, front, u + 2, u + 10, 8, 9, K.slot); patchOnLeftFace(grid, front, u + 2, u + 10, 9, 10, K.slotShade);
  patchOnLeftFace(grid, front, u + 3, u + 5, 13, 15, K.hot); patchOnLeftFace(grid, front, u + 7, u + 9, 13, 15, K.cold);
  art((layer) => {
    const { x, y } = iso(u + 6, v + 6, 22);
    layer.rect(x - 2, y - 3, 5, 3, K.neck);
    layer.ellipse(x + 0.5, y - 9, 6, 6.5, K.water); layer.ellipse(x - 0.2, y - 9.8, 5, 5.4, K.waterLight, [K.water]);
    layer.rect(x - 3, y - 15, 7, 3, K.waterLight); layer.rect(x + 2, y - 15, 2, 3, K.water);
    layer.rect(x - 1, y - 18, 3, 3, K.cap);
    layer.points([[x - 3, y - 12], [x - 3, y - 11], [x - 4, y - 10], [x - 4, y - 9], [x - 4, y - 8]], K.glint);
    layer.rect(x - 5, y - 8, 11, 1, K.cap);
  }, grid);
}

type Topper = (layer: PixelGrid, x: number, y: number) => void;

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

const cactus: Topper = (layer, x, y) => {
  const K = C.cactus;
  layer.rect(x - 3, y - 4, 7, 4, K.pot); layer.rect(x + 2, y - 4, 2, 4, K.potShade);
  layer.ellipse(x + 0.5, y - 7, 2.6, 3.4, K.body); layer.ellipse(x, y - 8, 1.4, 2.2, K.light, [K.body]);
  layer.set(x + 1, y - 11, K.flower); layer.set(x, y - 11, K.flower); layer.set(x + 1, y - 12, K.flowerLight);
};
const books: Topper = (layer, x, y) => {
  const B = C.books;
  layer.rect(x - 5, y - 3, 10, 3, B.blue); layer.rect(x - 5, y - 1, 10, 1, B.blueShade); layer.rect(x - 4, y - 6, 9, 3, B.red); layer.rect(x - 4, y - 4, 9, 1, B.redShade);
  layer.set(x - 4, y - 5, B.page); layer.set(x - 5, y - 2, B.page); layer.rect(x - 3, y - 9, 6, 3, B.yellow); layer.rect(x - 3, y - 7, 6, 1, B.yellowShade);
};
/** Where the monstera's pot and the floor lamp stand. */
const MONSTERA = { u: 12, v: 12 } as const;
const LAMP = { u: 10, v: 100 } as const;

/** The drawers of a project room; the front of the left wall is the door's. */
const DRAWERS: readonly Drawers[] = [
  { u0: 78, u1: 90, v0: 2, v1: 12, height: 22, tones: C.drawer.lemon, face: 'left', topper: cactus },
  { u0: 2, u1: 14, v0: 82, v1: 96, height: 18, tones: C.drawer.mint, face: 'right', topper: books },
];

/** A couch's colours: its body and its cushions. */
export interface CouchTones { body: Tones; edge: string; cushion: Tones; cushionEdge: string }

/** A box of a couch, `across` from the wall and `along` it from its far end (geometry.ts onCouchAt). */
function couchBox(grid: PixelGrid, couch: Couch, across: [number, number], along: [number, number], z: number, height: number, tones: Tones, edge?: string) {
  const [u0, v0] = onCouchAt(couch, across[0], along[0]), [u1, v1] = onCouchAt(couch, across[1], along[1]);
  ob(grid, u0, u1, v0, v1, z, height, tones, edge);
}

/**
 * A couch against a wall, but its front arm (a piece of its own: it is in front of whoever naps at that end): `seats`
 * cushions, and the star pillow `pillow` units from its far end.
 */
export function paintCouch(grid: PixelGrid, couch: Couch = COUCH, tones: CouchTones = C.couch, seats = 2, pillow = 16) {
  const K = C.couch, { depth, length } = couch, slot = Math.floor((length - 12) / seats);
  couchBox(grid, couch, [0, 7], [0, length], 0, 26, tones.body, tones.edge);
  couchBox(grid, couch, [4, depth], [0, 7], 0, 16, tones.body, tones.edge);
  couchBox(grid, couch, [6, depth], [6, length - 6], 0, 9, tones.body);
  for (let seat = 0; seat < seats; seat++) couchBox(grid, couch, [7, depth], [7 + seat * slot, 6 + (seat + 1) * slot], 9, 4, tones.cushion, tones.cushionEdge);
  art((layer) => {
    const { x, y } = iso(...onCouchAt(couch, 10, pillow), 13);
    layer.pattern(x - 6, y - 10, ['......y......', '.....yyy.....', '....yyyyy....', 'yyyyyyyyyyyyy', '.yyyyyyyyyyy.', '..yyyyyyyyy..', '...yyyyyyy...', '..yyyyyyyyy..', '..yyyy.yyyy..', '.yyy.....yyy.', '.yy.......yy.'], { y: K.star });
    for (let index = 0; index < 4; index++) layer.set(x - 3 + index, y - 7 + (index >> 1), K.starLight);
    layer.points([[x + 2, y - 4], [x + 3, y - 4], [x + 4, y - 5], [x + 4, y - 3], [x + 3, y - 3]], K.starShade);
    layer.points([[x - 2, y - 5], [x + 2, y - 5]], O); layer.points([[x - 1, y - 3], [x, y - 3], [x + 1, y - 3]], O);
  }, grid);
}

export function paintCouchArm(grid: PixelGrid, couch: Couch = COUCH, tones: CouchTones = C.couch) {
  couchBox(grid, couch, [4, couch.depth], [couch.length - 7, couch.length], 0, 16, tones.body, tones.edge);
}

/** A monstera's pot: its tones, light to dark, and its rim; `face`: the offices' little face on it. */
export interface MonsteraPot { light: string; base: string; shade: string; rim: string; face: boolean }
const OFFICE_POT: MonsteraPot = { light: C.monstera.potLight, base: C.monstera.pot, shade: C.monstera.potShade, rim: C.monstera.potRim, face: true };

export function paintMonstera(grid: PixelGrid, u: number = MONSTERA.u, v: number = MONSTERA.v, pot: MonsteraPot = OFFICE_POT) {
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

export function paintLamp(grid: PixelGrid, at: { u: number; v: number } = LAMP) {
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
  /**
   * The user's pet on the room's rug, asleep or woken by a poke (drawn in the room it is in, over the back layer but
   * under what stands in front of it), each look drawn the first time it is asked for.
   */
  petLayer: (pet: CozyPet) => HTMLCanvasElement;
  /** what stands in front of someone standing or walking at a depth, on a layer of its own (null: nothing does) */
  frontOf: (depth: number) => HTMLCanvasElement | null;
}

const SEAT_TONES = C.chair.seats as readonly Tones[];

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

/** Which desks a kind of room has: the flat has the user's one, the server room none (racks instead). */
export const desksOf = (kind: CozyRoomKind): readonly Desk[] => (kind === 'project' ? DESKS : kind === 'home' ? DESKS.slice(0, 1) : []);

/** The clock of the offices, on the right wall above the coffee counter. */
export const ROOM_CLOCK: WallClock = { wall: 'right', a: 52, z: 70, radius: 6 };
/** Where a festival's tree, pumpkins or balloons stand: by the water cooler, under the whiteboard. */
export const FESTIVE_SPOT = { u: 100, v: 8 } as const;

/** The coffee counter along the right wall, between the back desks and the wall. */
const COUNTER = { u0: 33, u1: 71, v0: 0, v1: 15 } as const;

/** What people walk round in a project room (cozy/floor.ts), its festival's decoration aside; its chairs are seats. */
export const ROOM_FOOTPRINTS: readonly Footprint[] = [
  around(MONSTERA.u, MONSTERA.v, 6, 40),
  { ...COUNTER, height: 38 },
  { u0: COOLER.u, u1: COOLER.u + COOLER.width, v0: COOLER.v, v1: COOLER.v + COOLER.width, height: 40 },
  ...DRAWERS.map(({ u0, u1, v0, v1, height }) => ({ u0, u1, v0, v1, height: height + 12 })),
  { u0: COUCH.u, u1: COUCH.u + COUCH.depth, v0: COUCH.v, v1: COUCH.v + COUCH.length, height: 20 },
  around(LAMP.u, LAMP.v, 3, 50),
  ...DESKS.map((desk): Footprint => (desk.kind === 'back'
    ? { u0: desk.u, u1: desk.u + desk.length, v0: desk.v, v1: desk.v + 14, height: 36 }
    : { u0: desk.u, u1: desk.u + 14, v0: desk.v, v1: desk.v + desk.length, height: 36 })),
];

/**
 * A room's light at a mood of the hour, its lights on (someone is there) or off: through the window by day; at dusk
 * and at night the floor lamp at `lampAt` lit and, at night, the `screens`' blue glow; what shines by itself
 * (`shining`, while the lights are on) left as it is.
 */
export function roomLight(lit: boolean, time: CozyTime, lampAt: { u: number; v: number }, screens: readonly { u: number; v: number }[], shining: readonly string[]): RoomLight {
  const L = C.light;
  if (lit && time === 'day') return null;
  const lampsOn = lit && time !== 'day';
  const lamps = lampsOn ? [
    lamp(lampAt.u, lampAt.v, 44, L.lamp[time as 'dusk' | 'night'], 74, 0.6, 4),
    ...(time === 'night' ? screens.map((screen) => lamp(screen.u, screen.v, 26, L.screen, 32)) : []),
  ] : [];
  const glow = [...SKY_GLOW, ...FESTIVE_GLOW, ...(lit ? shining : []), ...(lampsOn ? [C.lamp.shade, C.lamp.shadeLight, C.lamp.shadeDark] : [])];
  return lightingOf({ ambient: L[lit ? 'on' : 'off'][time], lamps }, new Set(glow));
}

/**
 * The user's pet on a room's floor at `spot`, asleep or awake, on a layer of its own lit like the room, with what
 * stands in front of it there laid over it: each look drawn the first time it is asked for.
 */
export function petLayers(floor: readonly Standing[], light: RoomLight, spot: { u: number; v: number }): (pet: CozyPet) => HTMLCanvasElement {
  const made = new Map<string, HTMLCanvasElement>();
  return (pet) => {
    const key = petKey(pet);
    let canvas = made.get(key);
    if (!canvas) {
      const { x, y } = iso(spot.u, spot.v);
      canvas = toCanvas(pieceGrid(cozyDepth(spot.u, spot.v), (grid) => paintPet(grid, petPixels(pet), x, y), floor), light);
      made.set(key, canvas);
    }
    return canvas;
  };
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

function build(kind: CozyRoomKind, lit: boolean, time: CozyTime, festival: Festival | null): RoomArt {
  const back = newGrid();
  paintFloor(back);
  paintWalls(back);
  paintWindow(back, time);
  paintWhiteboard(back);
  paintDoor(back);
  paintClockFace(back, ROOM_CLOCK);
  if (festival) paintFestiveWalls(back, festival);
  paintHangingPlant(back, wallPoint('right', 22, 100), 26, 6);
  paintHangingPlant(back, wallPoint('left', 121, 100), 16, -2);
  paintRug(back);
  paintDoormat(back);
  const floor: Standing[] = [
    standing(MONSTERA.u, MONSTERA.u, MONSTERA.v, MONSTERA.v, (grid) => paintMonstera(grid)),
    standing(COUNTER.u0, COUNTER.u1, COUNTER.v0, COUNTER.v1, paintCounter),
    standing(COOLER.u, COOLER.u + COOLER.width, COOLER.v, COOLER.v + COOLER.width, paintCooler),
    ...DRAWERS.map((drawers) => standing(drawers.u0, drawers.u1, drawers.v0, drawers.v1, (grid) => paintDrawers(grid, drawers))),
    standing(COUCH.u, COUCH.u + COUCH.depth, COUCH.v, COUCH.v + COUCH.length, paintCouch),
    standing(LAMP.u, LAMP.u, LAMP.v, LAMP.v, paintLamp),
  ];
  if (festival && FESTIVE_DECOR[festival].floor) floor.push(standing(FESTIVE_SPOT.u, FESTIVE_SPOT.u, FESTIVE_SPOT.v, FESTIVE_SPOT.v, (grid) => paintFestiveFloor(grid, festival, FESTIVE_SPOT.u, FESTIVE_SPOT.v)));
  if (kind === 'servers') for (const [u, v] of RACKS) floor.push(standing(u, u + RACK.width, v, v + RACK.depth, (grid) => paintRack(grid, u, v, lit)));
  const pieces: Standing[] = [];
  const piece = (depth: number, paint: (grid: PixelGrid) => void) => pieces.push({ depth, paint });
  desksOf(kind).forEach((desk, index) => {
    const place = deskPlace(desk), seat = SEAT_TONES[index % SEAT_TONES.length];
    floor.push(standing(place.u - 6, place.u + 6, place.v - 6, place.v + 6, (grid) => paintChairSeat(grid, place.u, place.v, seat)));
    if (desk.kind === 'back') {
      floor.push(standing(desk.u, desk.u + desk.length, desk.v, desk.v + 14, (grid) => paintBackDesk(grid, desk)));
      piece(cozyDepth(place.u, place.v + 6), (grid) => paintChairBack(grid, place.u - 5, place.u + 5, place.v + 5, place.v + 8, seat, 11, 4));
    } else {
      floor.push(standing(place.u - 10, place.u - 6, place.v - 6, place.v + 6, (grid) => paintChairBack(grid, place.u - 10, place.u - 6, place.v - 6, place.v + 6, seat, 15, 10)));
      piece(cozyDepth(desk.u + 7, desk.v + desk.length / 2), (grid) => paintSideDesk(grid, desk));
    }
  });
  piece(COUCH_ARM_DEPTH, paintCouchArm);
  floor.sort((a, b) => a.depth - b.depth);
  for (const { paint } of floor) paint(back);
  const screens = desksOf(kind).filter((desk) => desk.kind === 'back').map((desk) => ({ u: desk.u + 21, v: desk.v + 6 }));
  const light = roomLight(lit, time, LAMP, screens, [C.screen, C.screenTop, C.screenGlow, C.led, C.rack.on, C.rack.busy, C.rack.link, C.counter.red, C.counter.green]);
  return {
    back: toCanvas(back, light),
    pieces: pieces.map(({ depth, paint }) => ({ depth, canvas: toCanvas(pieceGrid(depth, paint, floor), light) })),
    petLayer: petLayers(floor, light, CAT_SPOT),
    frontOf: frontLayers(floor, light),
  };
}

const built = sceneCache<RoomArt>();
/**
 * A kind of room with its lights on or off at an hour (its mood, time.ts) and on a festival (none in the server room,
 * which keeps its own look, like the classic one), drawn the first time it is asked for and kept until the mood or the
 * festival changes.
 */
export function roomArt(kind: CozyRoomKind, lit: boolean, hour: number, festival: Festival | null): RoomArt {
  const shown = kind === 'servers' ? null : festival;
  return built(sceneKey(hour, festival), `${kind}:${lit}:${shown ?? ''}`, () => build(kind, lit, cozyTimeOf(hour), shown));
}
