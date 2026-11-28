// The bookshop café (ambiance 'cafe'): sage walls over a walnut wainscot, a parquet in squares, a window with a café
// curtain and basil on its sill, a green door with its glass and its sign, a station clock above it, a chalkboard
// menu, a marble bar with its espresso machine and its pastries under glass, brass pendants over it, a jar of lemon
// water, a cake under a dome, a tall bookcase and a low one, a green chesterfield, a banker's lamp, a red rug, walnut
// tables with a latte or a pile of books.
import { COZY_AMBIANCE_PALETTE, COZY_PALETTE as C } from '../../../design/room-palette.ts';
import type { WallClock } from '../clock.ts';
import { DOOR, ceilingAt, paintCouch, paintCouchArm, paintDrawers, paintPanes, paintWallBoxes, shadeAlongWalls, standing, type Drawers, type Topper } from '../decor.ts';
import { ROOM_UNITS as ROOM, WALL_HEIGHT, around, iso, onCouchAt } from '../geometry.ts';
import {
  fillTop, fillWall, onLeftFace, onRightFace, outlined, outlinedBox, patchOnLeftFace, patchOnRightFace, tint, wallPatch, wallPixel,
  type Painter, type PixelGrid, type Tones, type Wall,
} from '../pixels.ts';
import type { CozyTime } from '../time.ts';
import type { AmbianceDesign } from './index.ts';
import { BACK_RIGHT, COOLER, COUNTER, LAMP, office } from './office.ts';

const P = COZY_AMBIANCE_PALETTE.cafe, O = C.outline;
const ob = (grid: PixelGrid, u0: number, u1: number, v0: number, v1: number, z: number, height: number, tones: Tones, edge?: string) => outlinedBox(grid, u0, u1, v0, v1, z, height, tones, O, edge);
const art = (grid: PixelGrid, draw: (layer: PixelGrid) => void) => outlined(grid, draw, O);

/* Where things are, in the room's units */

/** The bar along the right wall, behind the back desks, where the offices' counter is; the jar of lemon water on its stand, in the back right corner, where their cooler is. */
const BAR = COUNTER, WATER = COOLER;
/** The tall bookcase in the back corner, the low one by the door. */
const TALL_SHELF = { u0: 0, u1: 11, v0: 2, v1: 30, height: 58 } as const;
const LOW_SHELF = { u0: 2, u1: 14, v0: 82, v1: 96, height: 26 } as const;
/** The rug in the middle of the room. */
const RUG = { u0: 30, u1: 74, v0: 74, v1: 114 } as const;
/** The brass pendants over the bar: (u, v) and how high they hang. */
const PENDANTS = [[42, 8, 64], [62, 8, 64]] as const;

/* The room */

function paintParquet(grid: PixelGrid) {
  const F = P.parquet;
  // squares of two planks each, turned a quarter from one square to the next
  fillTop(grid, 0, ROOM, 0, ROOM, 0, (u, v) => {
    const su = Math.floor(u / 8), sv = Math.floor(v / 8), alongU = (su + sv) % 2 === 0;
    const across = alongU ? v % 8 : u % 8, along = alongU ? u % 8 : v % 8, plank = across < 4 ? 0 : 1;
    if (across === 3 || across === 7) return F.seam;
    const colour = F.tones[(su * 3 + sv * 5 + plank * 2) % F.tones.length];
    if (along === 7) return tint(colour, 0.93);
    if (across === 0 || across === 4) return along < 5 ? F.light : colour;
    return colour;
  });
  shadeAlongWalls(grid);
}

function paintWalls(grid: PixelGrid) {
  const W = P.wall, S = P.wainscot, T = P.tiles;
  paintWallBoxes(grid, W);
  for (const [wall, paint, wood] of [['left', W.left, S.left], ['right', W.right, S.right]] as const) {
    // a faint stripe in the paint, and a cream picture rail under the ceiling
    fillWall(grid, wall, 0, ROOM, 36, WALL_HEIGHT - 6, (a) => (a % 8 === 4 ? tint(paint, 0.95) : null));
    wallPatch(grid, wall, 0, ROOM, WALL_HEIGHT - 6, WALL_HEIGHT - 4, W.top); wallPatch(grid, wall, 0, ROOM, WALL_HEIGHT - 7, WALL_HEIGHT - 6, W.topShade);
    // the walnut wainscot and its panels, a brass rail on top
    wallPatch(grid, wall, 0, ROOM, 0, 34, wood);
    for (let a = 3; a < ROOM - 8; a += 16) {
      wallPatch(grid, wall, a, a + 13, 7, 8, S.panel); wallPatch(grid, wall, a, a + 13, 28, 29, S.light);
      wallPatch(grid, wall, a, a + 1, 8, 28, S.panel); wallPatch(grid, wall, a + 12, a + 13, 8, 28, S.light);
    }
    wallPatch(grid, wall, 0, ROOM, 33, 36, S.rail); wallPatch(grid, wall, 0, ROOM, 35, 36, S.railLight);
    wallPatch(grid, wall, 0, ROOM, 0, 4, S.base); wallPatch(grid, wall, 0, ROOM, 3, 4, S.baseLight);
  }
  // white tiles behind the bar, up from the rail, framed in brass
  fillWall(grid, 'right', 30, 76, 36, 64, (a, z) => {
    const row = Math.floor((z - 36) / 3), shift = row % 2 ? 3 : 0;
    if ((z - 36) % 3 === 2 || (a + shift) % 6 === 5) return T.grout;
    return (a + shift) % 6 === 0 ? T.shade : T.tile;
  });
  wallPatch(grid, 'right', 29, 77, 64, 65, S.rail);
}

/** The window: its green frame and the sky of the hour, a café curtain on a brass rod over its lower half, basil on the sill. */
function paintWindow(grid: PixelGrid, time: CozyTime) {
  const wall: Wall = 'left', S = P.window, K = P.curtain;
  wallPatch(grid, wall, 31, 81, 41, 89, O);
  wallPatch(grid, wall, 32, 80, 42, 88, S.frame); wallPatch(grid, wall, 32, 80, 87, 88, S.frameLight);
  wallPatch(grid, wall, 33, 79, 43, 87, S.pane);
  paintPanes(grid, time);
  wallPatch(grid, wall, 55, 57, 46, 84, S.mullion); wallPatch(grid, wall, 36, 76, 73, 75, S.mullion);
  for (const a of [45, 66]) wallPatch(grid, wall, a, a + 1, 75, 84, S.mullion);
  ob(grid, 0, 6, 30, 82, 40, 3, S.sill, S.sillEdge);
  for (let a = 34; a < 78; a++) {
    const fold = (a - 34) % 4, tone = K[fold === 0 ? 0 : fold === 3 ? 2 : 1];
    wallPatch(grid, wall, a, a + 1, 46 + ((a >> 2) % 2), 63, tone);
  }
  wallPatch(grid, wall, 33, 79, 63, 65, P.curtainRod);
  for (let a = 35; a < 78; a += 4) wallPixel(grid, wall, a, 62, tint(P.curtainRod, 0.8));
  art(grid, (layer) => {
    const B = P.basil, { x, y } = iso(3, 72, 43);
    layer.rect(x - 3, y - 5, 7, 5, B.pot[1]); layer.rect(x + 2, y - 5, 2, 5, B.pot[2]); layer.rect(x - 4, y - 6, 9, 2, B.pot[0]);
    for (const [dx, dy, tone] of [[-3, -8, 1], [0, -10, 0], [3, -8, 2], [-1, -12, 1], [2, -12, 0], [0, -14, 1]] as const) layer.ellipse(x + dx + 0.5, y + dy, 2, 1.6, B.leaves[tone]);
  });
}

/** The green door with its glass, its sign and its brass knob: a click goes through it, to the break room. */
const paintDoor: Painter = (grid) => {
  const D = P.door, { a0, a1, height } = DOOR, wall: Wall = 'left', middle = (a0 + a1) >> 1;
  wallPatch(grid, wall, a0 - 2, a1 + 2, 0, height + 3, O);
  wallPatch(grid, wall, a0 - 1, a1 + 1, 0, height + 2, D.frame); wallPatch(grid, wall, a0 - 1, a1 + 1, height + 1, height + 2, D.frameLight);
  wallPatch(grid, wall, a0, a1, 0, height, D.leaf);
  wallPatch(grid, wall, a0, a0 + 1, 0, height, D.leafLight); wallPatch(grid, wall, a1 - 1, a1, 0, height, D.leafShade);
  // a panel below, the glass above, its two panes
  wallPatch(grid, wall, a0 + 3, a1 - 3, 5, 24, D.panel); wallPatch(grid, wall, a0 + 3, a1 - 3, 23, 24, D.panelLight); wallPatch(grid, wall, a0 + 3, a0 + 4, 5, 24, D.panelLight);
  wallPatch(grid, wall, a0 + 3, a1 - 3, 30, height - 5, D.leafShade);
  wallPatch(grid, wall, a0 + 4, a1 - 4, 31, height - 6, D.glass);
  wallPatch(grid, wall, a0 + 3, a1 - 3, 44, 45, D.leafShade);
  for (let step = 0; step < 4; step++) { wallPixel(grid, wall, a0 + 6 + step, 52 - step, D.glassLight); wallPixel(grid, wall, a0 + 6 + step, 39 - step, D.glassLight); }
  wallPatch(grid, wall, a1 - 5, a1 - 3, 27, 29, D.knob); wallPixel(grid, wall, a1 - 4, 27, D.knobShade);
  // the sign on its string, a cup on it
  wallPixel(grid, wall, middle - 3, 47, D.signInk); wallPixel(grid, wall, middle - 2, 48, D.signInk); wallPixel(grid, wall, middle + 3, 47, D.signInk); wallPixel(grid, wall, middle + 2, 48, D.signInk);
  wallPatch(grid, wall, middle - 5, middle + 6, 39, 47, D.signInk); wallPatch(grid, wall, middle - 4, middle + 5, 40, 46, D.sign);
  wallPatch(grid, wall, middle - 2, middle + 2, 41, 44, D.signInk); wallPixel(grid, wall, middle + 2, 43, D.signInk); wallPatch(grid, wall, middle - 3, middle + 3, 41, 42, D.signInk);
};

/** The coir mat in front of the door. */
function paintDoormat(grid: PixelGrid) {
  const { a0, a1 } = DOOR, M = P.door.mat;
  fillTop(grid, 1, 12, a0 + 1, a1 - 1, 0, (u, v) => (u === 1 || u === 11 || v === a0 + 1 || v === a1 - 2 ? M[2] : (u * 3 + v) % 5 === 0 ? M[0] : M[1]));
}

/** The chalkboard menu on the right wall, its chalk on its ledge: a click opens the board and its notes. */
const paintChalkboard: Painter = (grid) => {
  const wall: Wall = 'right', B = P.chalkboard;
  wallPatch(grid, wall, 73, 123, 45, 87, O);
  wallPatch(grid, wall, 74, 122, 46, 86, B.frame); wallPatch(grid, wall, 74, 122, 85, 86, B.frameLight); wallPatch(grid, wall, 74, 75, 46, 86, B.frameLight);
  wallPatch(grid, wall, 77, 119, 49, 83, B.surface);
  fillWall(grid, wall, 77, 119, 49, 83, (a, z) => ((a * 7 + z * 13) % 29 === 0 ? B.surfaceLight : null));
  // the title and its flourish, four lines of the menu with their prices, a cup and a heart
  wallPatch(grid, wall, 86, 110, 79, 80, B.chalk); wallPatch(grid, wall, 88, 108, 77, 78, B.chalkFaint);
  wallPixel(grid, wall, 84, 78, B.inks[0]); wallPixel(grid, wall, 112, 78, B.inks[0]);
  [[14, 0], [10, 1], [16, 2], [12, 3]].forEach(([length, ink], row) => {
    const z = 72 - row * 4;
    wallPatch(grid, wall, 80, 80 + length, z, z + 1, B.chalk);
    for (let a = 82 + length; a < 108; a += 2) wallPixel(grid, wall, a, z, B.chalkFaint);
    wallPatch(grid, wall, 110, 116, z, z + 1, B.inks[ink]);
  });
  wallPatch(grid, wall, 82, 89, 52, 53, B.chalk); wallPatch(grid, wall, 83, 88, 53, 57, B.chalk); wallPatch(grid, wall, 84, 87, 54, 56, B.surface);
  wallPixel(grid, wall, 89, 55, B.chalk); wallPixel(grid, wall, 90, 55, B.chalk); wallPixel(grid, wall, 89, 54, B.chalk);
  for (const [a, z] of [[84, 59], [85, 60], [86, 59], [87, 60]] as const) wallPixel(grid, wall, a, z, B.chalkFaint);
  for (const [a, z] of [[111, 55], [112, 56], [113, 55], [110, 54], [111, 54], [112, 54], [113, 54], [114, 54], [111, 53], [112, 53], [113, 53], [112, 52]] as const) wallPixel(grid, wall, a, z, B.inks[0]);
  ob(grid, 76, 120, 0, 4, 44, 2, B.tray);
  for (const [a, ink] of [[88, B.chalk], [93, B.inks[1]], [97, B.inks[0]]] as const) ob(grid, a, a + 3, 1, 3, 46, 1, [ink, tint(ink, 0.85), tint(ink, 0.75)]);
};

/** A brass clock above the door: its hands are drawn by clock.ts. */
const CLOCK: WallClock = { wall: 'left', a: 112, z: 80, radius: 6, tones: P.clock };

/* What stands on the floor */

/** The bar: walnut slats, a marble top, the espresso machine, its cups, the pastries under glass. */
function paintBar(grid: PixelGrid) {
  const K = P.counter;
  ob(grid, 34, 70, 0, 14, 0, 20, K.body);
  for (let a = 36; a < 69; a += 3) { patchOnLeftFace(grid, 14, a, a + 1, 2, 19, K.slat); patchOnLeftFace(grid, 14, a + 1, a + 2, 2, 19, K.slatLight); }
  patchOnLeftFace(grid, 14, 34, 70, 0, 2, K.slat);
  ob(grid, 33, 71, 0, 15, 20, 2, K.marble, K.marbleEdge);
  fillTop(grid, 33, 71, 0, 15, 22, (u, v) => ((u * 3 + v * 7) % 19 === 0 || (u + v * 2) % 29 === 0 ? K.vein : null));
  // the espresso machine, its copper band, its gauge, its two group heads and their cups
  ob(grid, 36, 50, 1, 9, 22, 13, K.chrome, K.chromeEdge);
  patchOnLeftFace(grid, 9, 36, 50, 31, 33, K.copper); onLeftFace(grid, 9, 36, 50, 32, K.copperLight);
  patchOnLeftFace(grid, 9, 43, 46, 27, 30, O); patchOnLeftFace(grid, 9, 44, 45, 28, 29, K.gauge);
  for (const a of [38, 47]) {
    patchOnLeftFace(grid, 9, a, a + 2, 25, 27, K.group);
    art(grid, (layer) => { const { x, y } = iso(a + 1, 11, 22); layer.rect(x - 1, y - 3, 3, 3, K.cup); layer.set(x + 1, y - 3, K.cupShade); layer.set(x, y - 3, K.coffee); });
  }
  art(grid, (layer) => { const { x, y } = iso(42, 4, 35); for (const dx of [-3, 0, 3]) { layer.rect(x + dx - 1, y - 3, 3, 3, K.cup); layer.set(x + dx + 1, y - 2, K.cupShade); } });
  // the pastries under glass: croissants below, macarons on the shelf
  ob(grid, 53, 69, 2, 13, 22, 10, K.glass, K.glassEdge);
  patchOnLeftFace(grid, 13, 54, 68, 27, 28, K.glass[2]);
  for (const a of [55, 60, 65]) { patchOnLeftFace(grid, 13, a, a + 3, 23, 25, K.croissant); onLeftFace(grid, 13, a + 1, a + 2, 25, K.croissant); onLeftFace(grid, 13, a, a + 3, 23, K.croissantShade); }
  K.macarons.forEach((colour, index) => { patchOnLeftFace(grid, 13, 56 + index * 4, 58 + index * 4, 28, 30, colour); });
}

/** The jar of lemon water on its stand, its tap towards the room, two glasses beside it. */
function paintWater(grid: PixelGrid) {
  const W = P.water, { u, v, width } = WATER;
  ob(grid, u, u + width, v, v + width, 0, 18, W.stand, W.standEdge);
  onLeftFace(grid, v + width, u + 1, u + width - 1, 9, W.stand[2]);
  art(grid, (layer) => {
    const { x, y } = iso(u + 6, v + 6, 18);
    layer.rect(x - 4, y - 15, 9, 14, W.glass); layer.rect(x - 3, y - 12, 7, 11, W.water); layer.rect(x + 3, y - 15, 1, 14, W.glassShade);
    layer.ellipse(x - 1, y - 5, 1.6, 1.6, W.lemon); layer.ellipse(x + 1.5, y - 9, 1.6, 1.6, W.lemon); layer.set(x - 1, y - 5, W.lemonLight);
    layer.points([[x, y - 11], [x + 1, y - 12], [x - 2, y - 8]], W.mint);
    layer.rect(x - 4, y - 16, 9, 1, W.tap); layer.rect(x - 1, y - 2, 2, 2, W.tap);
  });
  art(grid, (layer) => { const { x, y } = iso(u + 10, v + 2, 18); layer.rect(x - 1, y - 4, 3, 4, W.cups); layer.rect(x + 2, y - 3, 2, 3, W.cups); });
}

/** A cake under its glass dome, on the cabinet. */
const cakeDome: Topper = (layer, x, y) => {
  const K = P.cake;
  layer.ellipse(x, y - 1, 7, 1.6, K.plate);
  layer.ellipse(x, y - 7, 6, 7, K.dome); layer.rect(x - 6, y - 7, 13, 6, K.dome);
  layer.rect(x - 3, y - 6, 7, 4, K.sponge); layer.rect(x - 3, y - 7, 7, 2, K.icing); layer.points([[x - 2, y - 5], [x + 1, y - 5], [x + 3, y - 4]], K.icing);
  layer.rect(x - 3, y - 4, 7, 1, K.cream); layer.set(x, y - 8, K.cherry);
  layer.points([[x - 4, y - 10], [x - 4, y - 9], [x - 3, y - 11]], K.domeLight); layer.set(x, y - 14, K.domeLight);
};

/** A vase and a book lying on the low bookcase. */
const vase: Topper = (layer, x, y) => {
  layer.rect(x - 6, y - 2, 7, 2, P.books[1]); layer.rect(x - 6, y - 2, 7, 1, tint(P.books[1], 1.15));
  layer.rect(x + 2, y - 6, 3, 6, P.chalkboard.inks[2]); layer.set(x + 3, y - 7, P.basil.leaves[1]); layer.set(x + 3, y - 9, P.basil.leaves[0]); layer.set(x + 2, y - 10, P.chalkboard.inks[0]); layer.set(x + 4, y - 10, P.chalkboard.inks[1]);
};

const CABINET: Drawers = { u0: 78, u1: 90, v0: 2, v1: 12, height: 22, tones: P.cabinet, face: 'left', topper: cakeDome };

/** A bookcase against the left wall, its shelves towards the room, full of books. */
function paintBookcase(grid: PixelGrid, { u0, u1, v0, v1, height }: { u0: number; u1: number; v0: number; v1: number; height: number }, shelves: number, topper?: Topper) {
  ob(grid, u0, u1, v0, v1, 0, height, P.shelf, P.shelfEdge);
  const step = Math.floor((height - 3) / shelves);
  for (let shelf = 0; shelf < shelves; shelf++) {
    const z0 = 3 + shelf * step;
    patchOnRightFace(grid, u1, v0 + 2, v1 - 2, z0, z0 + step - 3, P.shelfBack);
    for (let v = v0 + 2, index = shelf * 5 + v0; v < v1 - 2; index++) {
      const width = 1 + ((index * 5) % 3), tall = Math.min(step - 4, 6 + ((index * 7) % 4));
      if ((index * 11) % 9 === 4) { v += 2; continue; }
      patchOnRightFace(grid, u1, v, Math.min(v1 - 2, v + width), z0, z0 + tall, P.books[index % P.books.length]);
      v += width + 1;
    }
    onRightFace(grid, u1, v0 + 1, v1 - 1, z0 - 1, P.shelf[2]);
  }
  if (topper) { const top = iso(((u0 + u1) >> 1) + 2, ((v0 + v1) >> 1) + 2, height); art(grid, (layer) => topper(layer, top.x, top.y)); }
}

/** The banker's lamp on its brass pole, its green shade. */
function paintLamp(grid: PixelGrid) {
  const L = P.lamp, { x, y } = iso(LAMP.u, LAMP.v);
  art(grid, (layer) => { layer.ellipse(x, y - 1, 5, 2, L.brass); layer.ellipse(x - 1, y - 2, 3, 1, L.brassLight); layer.rect(x, y - 40, 1, 39, L.brass); });
  art(grid, (layer) => {
    for (let row = 0; row < 8; row++) {
      const half = 2 + Math.round(row * 0.9);
      for (let dx = -half; dx <= half; dx++) layer.set(x + dx, y - 49 + row, dx < -half + 2 ? L.shade[0] : dx > half - 2 ? L.shade[2] : L.shade[1]);
    }
    layer.rect(x - 8, y - 41, 17, 1, L.brass); layer.rect(x - 1, y - 40, 3, 1, L.bulb);
  });
}

/** The green chesterfield: buttons on its back, a mustard cushion. */
function paintChesterfield(grid: PixelGrid) {
  const couch = office.couch;
  paintCouch(grid, couch, P.couch, 2, null);
  for (let v = couch.v + 9; v < couch.v + couch.length - 8; v += 6) for (const z of [17, 21]) onRightFace(grid, couch.u + 7, v, v + 1, z, P.couch.button);
  art(grid, (layer) => {
    const { x, y } = iso(...onCouchAt(couch, 10, 16), 13), K = P.pillow;
    layer.rect(x - 4, y - 8, 9, 8, K[1]); layer.rect(x - 4, y - 8, 9, 2, K[0]); layer.rect(x + 3, y - 6, 2, 6, K[2]); layer.set(x, y - 4, K[2]);
  });
}

/* Hung on the walls, lying on the floor */

function paintPendant(grid: PixelGrid, u: number, v: number, z: number) {
  const K = P.pendant, { x, y } = iso(u, v, z);
  for (let row = ceilingAt(x); row < y - 6; row++) grid.set(x, row, K.cord);
  art(grid, (layer) => {
    for (let row = 0; row < 6; row++) { const half = 1 + row; layer.rect(x - half, y - 6 + row, 2 * half + 1, 1, K.shade[1]); layer.set(x - half, y - 6 + row, K.shade[0]); layer.set(x + half, y - 6 + row, K.shade[2]); }
    layer.rect(x - 6, y, 13, 1, K.shade[2]); layer.rect(x - 1, y + 1, 3, 2, K.bulb);
  });
}

/** A print of a cup of coffee above the tall bookcase. */
function paintPrint(grid: PixelGrid) {
  const R = P.print, wall: Wall = 'left';
  wallPatch(grid, wall, 7, 27, 63, 87, O); wallPatch(grid, wall, 8, 26, 64, 86, R.frame); wallPatch(grid, wall, 10, 24, 66, 84, R.mat);
  wallPatch(grid, wall, 11, 23, 69, 70, R.saucer); wallPatch(grid, wall, 13, 21, 70, 76, R.cup); wallPatch(grid, wall, 13, 21, 75, 76, R.coffee); wallPatch(grid, wall, 19, 21, 70, 76, R.cupShade);
  wallPatch(grid, wall, 11, 13, 71, 74, R.cupShade); wallPixel(grid, wall, 12, 72, R.mat);
  for (const [a, z] of [[15, 78], [16, 79], [15, 80], [16, 81], [18, 78], [19, 79], [18, 80]] as const) wallPixel(grid, wall, a, z, R.steam);
}

/** A shelf on the right wall with three mugs and a pothos trailing from it. */
function paintWallShelf(grid: PixelGrid) {
  const wall: Wall = 'right', S = P.wallShelf, L = P.pothos;
  wallPatch(grid, wall, 5, 29, 58, 60, S[1]); wallPatch(grid, wall, 5, 29, 59, 60, S[0]); wallPatch(grid, wall, 5, 29, 57, 58, S[2]);
  P.mugs.forEach((colour, index) => { const a = 7 + index * 5; wallPatch(grid, wall, a, a + 3, 60, 64, colour); wallPixel(grid, wall, a + 3, 62, colour); wallPatch(grid, wall, a, a + 3, 63, 64, tint(colour, 1.1)); });
  wallPatch(grid, wall, 22, 27, 60, 65, P.basil.pot[1]); wallPatch(grid, wall, 22, 27, 64, 65, P.basil.pot[0]);
  for (let step = 0; step < 14; step++) {
    const a = 26 + (step % 3 === 1 ? 1 : 0) + Math.floor(step / 5), z = 63 - step * 2;
    wallPixel(grid, wall, a, z, L[1]); wallPixel(grid, wall, a + (step % 2 ? 1 : -1), z, L[step % 2 ? 0 : 2]);
  }
  for (const [a, z] of [[23, 66], [25, 67], [24, 68], [21, 65]] as const) wallPixel(grid, wall, a, z, L[a % 3]);
}

/** The red rug in the middle: a border, a field and its diamond. */
function paintRug(grid: PixelGrid) {
  const R = P.rug, { u0, u1, v0, v1 } = RUG, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  fillTop(grid, u0, u1, v0, v1, 0, (u, v) => {
    const edge = Math.min(u - u0, u1 - 1 - u, v - v0, v1 - 1 - v);
    if (edge < 1) return R.edge;
    if (edge < 4) return (u + v) % 4 === 0 ? R.motif : R.border;
    if (edge < 5) return R.light;
    const du = Math.abs(u - cu), dv = Math.abs(v - cv), diamond = du + dv * 1.1;
    if (diamond < 4) return R.light;
    if (Math.abs(diamond - 9) < 0.8 || Math.abs(diamond - 15) < 0.8) return R.motif;
    if (diamond < 9) return R.border;
    return (Math.floor(u / 3) + Math.floor(v / 3)) % 2 ? R.field : R.base;
  });
  fillTop(grid, u0 - 2, u0, v0, v1, 0, (_u, v) => (v % 2 ? R.fringe : null)); fillTop(grid, u1, u1 + 2, v0, v1, 0, (_u, v) => (v % 2 ? R.fringe : null));
}

/** The walnut tables' things: a latte on its saucer, a pile of books. */
const latte: Topper = (layer, x, y) => {
  const L = P.latte;
  layer.ellipse(x, y - 1, 4, 1.4, L.saucer); layer.rect(x - 2, y - 5, 5, 4, L.cup); layer.rect(x + 2, y - 5, 1, 4, L.shade);
  layer.rect(x - 2, y - 5, 5, 1, L.foam); layer.set(x, y - 5, L.heart); layer.set(x + 3, y - 4, L.cup);
};
const bookPile: Topper = (layer, x, y) => {
  layer.rect(x - 4, y - 2, 8, 2, P.books[0]); layer.rect(x - 4, y - 1, 8, 1, tint(P.books[0], 0.85)); layer.rect(x - 3, y - 4, 7, 2, P.books[2]); layer.rect(x - 3, y - 3, 7, 1, P.books[5]);
};

export const cafe: AmbianceDesign = {
  id: 'cafe',
  desks: office.desks,
  deskStyle: {
    top: P.desk.top, topEdge: P.desk.edge, leg: P.desk.leg, drawers: null, monitor: P.desk.monitor, monitorEdge: P.desk.monitorEdge, stand: P.desk.stand,
    vents: P.desk.vents, keyboard: P.desk.keyboard, key: P.desk.key, seats: P.seats, chairBase: P.chair.base, chairPole: P.chair.pole, backThing: latte, sideThing: bookPile,
  },
  couch: office.couch,
  couchPlaces: office.couchPlaces,
  paintCouch: paintChesterfield,
  paintCouchArm: (grid) => paintCouchArm(grid, office.couch, P.couch),
  door: DOOR,
  paintDoor,
  paintBoard: paintChalkboard,
  clock: CLOCK,
  footprints: [
    { ...TALL_SHELF, height: TALL_SHELF.height + 4 },
    { ...BAR, height: 38 },
    { u0: WATER.u, u1: WATER.u + WATER.width, v0: WATER.v, v1: WATER.v + WATER.width, height: 40 },
    { u0: CABINET.u0, u1: CABINET.u1, v0: CABINET.v0, v1: CABINET.v1, height: CABINET.height + 12 },
    { ...LOW_SHELF, height: LOW_SHELF.height + 12 },
    around(LAMP.u, LAMP.v, 3, 50),
  ],
  festiveSpot: office.festiveSpot,
  visits: {
    entry: [50, 124], middle: [50, 84],
    spots: [
      // a coffee at the bar, between the two back tables; a glass of lemon water; a look out of the window; a book from either bookcase
      { activity: 'coffee', at: [60, 19], facing: 0, via: [[64, 62], [65, 42]] },
      { activity: 'water', at: [120, 24], facing: 0, via: BACK_RIGHT },
      { activity: 'window', at: [28, 58], facing: 6, via: [[36, 66]] },
      { activity: 'books', at: [24, 92], facing: 6, via: [[34, 94]] },
      { activity: 'books', at: [18, 18], facing: 6, via: [[30, 40]] },
    ],
    party: [
      { activity: 'party', at: [104, 18], facing: 7, together: 3, via: BACK_RIGHT },
      { activity: 'party', at: [112, 30], facing: 7, together: 7, via: BACK_RIGHT },
    ],
  },
  paintRoom(grid, time) {
    paintParquet(grid);
    paintWalls(grid);
    paintWindow(grid, time);
  },
  dress(grid) {
    paintPrint(grid);
    paintWallShelf(grid);
    for (const [u, v, z] of PENDANTS) paintPendant(grid, u, v, z);
    paintRug(grid);
    paintDoormat(grid);
  },
  standing: [
    standing(TALL_SHELF.u0, TALL_SHELF.u1, TALL_SHELF.v0, TALL_SHELF.v1, (grid) => paintBookcase(grid, TALL_SHELF, 4)),
    standing(BAR.u0, BAR.u1, BAR.v0, BAR.v1, paintBar),
    standing(WATER.u, WATER.u + WATER.width, WATER.v, WATER.v + WATER.width, paintWater),
    standing(CABINET.u0, CABINET.u1, CABINET.v0, CABINET.v1, (grid) => paintDrawers(grid, CABINET)),
    standing(LOW_SHELF.u0, LOW_SHELF.u1, LOW_SHELF.v0, LOW_SHELF.v1, (grid) => paintBookcase(grid, LOW_SHELF, 2, vase)),
    standing(LAMP.u, LAMP.u, LAMP.v, LAMP.v, paintLamp),
  ],
  light: { lamp: LAMP, lampColour: P.light.lamp, ambient: P.light, lampGlow: [P.lamp.bulb], glow: [P.pendant.bulb, P.counter.gauge], sky: [] },
};
