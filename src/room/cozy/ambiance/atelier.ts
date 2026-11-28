// The creative studio (ambiance 'atelier'), furnished where the offices are (office.ts: the same desks, couch, door
// and walks): white plaster walls splashed with paint, swatches tried on them, whitewashed planks with drops of
// paint, a big steel window on the sky of the hour, a mint door with its drips, a cork board of sketches, a pegboard of
// tools and drawings drying on a line, an easel with a painting under way, canvases leaning on the wall, a workbench
// with its brushes and its kettle, a jug of water on a crate, a paint taboret, a flat file of art books, a snake plant,
// a mustard couch, an architect's lamp, a striped rag rug, birch drafting tables.
import { COZY_AMBIANCE_PALETTE, COZY_PALETTE as C } from '../../../design/room-palette.ts';
import type { WallClock } from '../clock.ts';
import { DOOR, paintCouch, paintCouchArm, paintDrawers, paintHangingPlant, paintPlanks, paintWallBoxes, shadeAlongWalls, standing, type Drawers, type Topper } from '../decor.ts';
import { ROOM_UNITS as ROOM, WALL_HEIGHT, around, iso, onCouchAt } from '../geometry.ts';
import {
  fillLeftFace, fillTop, fillWall, onLeftFace, onRightFace, outlined, outlinedBox, shadeFloor, tint, wallEllipse, wallPatch, wallPixel, wallPoint,
  type Painter, type PixelGrid, type Tones, type Wall,
} from '../pixels.ts';
import type { CozyTime } from '../time.ts';
import type { AmbianceDesign } from './index.ts';
import { COOLER, COUNTER, DRAWERS, LAMP, office } from './office.ts';

const P = COZY_AMBIANCE_PALETTE.atelier, O = C.outline;
const [PINK, YELLOW, BLUE, GREEN, VIOLET, ORANGE] = P.paints;
const ob = (grid: PixelGrid, u0: number, u1: number, v0: number, v1: number, z: number, height: number, tones: Tones, edge?: string) => outlinedBox(grid, u0, u1, v0, v1, z, height, tones, O, edge);
const art = (grid: PixelGrid, draw: (layer: PixelGrid) => void) => outlined(grid, draw, O);

/* Where things are, in the room's units */

/** The workbench where the offices' counter is (the coffee); the jug of water on its crate where their cooler is. */
const BENCH = COUNTER, WATER = COOLER;
/** The easel in the back corner, the snake plant beside it, the canvases leaning on the right wall. */
const EASEL = { u: 13, v: 13 } as const;
const PLANT = { u: 8, v: 26 } as const;
const CANVASES = { u0: 20, u1: 31, v0: 0, v1: 5 } as const;
/** The big window on the left wall, its frame from a0 to a1 along it, z0 to z1 up; its panes inside. */
const WINDOW = { a0: 30, a1: 84, z0: 34, z1: 94 } as const;
const PANES = [WINDOW.a0 + 2, WINDOW.a1 - 2, WINDOW.z0 + 2, WINDOW.z1 - 2] as const;
/** The steel bars across the panes: upright at these points along the wall, across at these heights. */
const BARS_UP = [44, 57, 70] as const, BARS_ACROSS = [54, 73] as const;
/** Where the hanging plant hangs along the left wall, between the corner and the window. */
const HANGING_PLANT = 14;
/** The rug in the middle of the room. */
const RUG = { u0: 30, u1: 74, v0: 74, v1: 114 } as const;
/** How much the sun through the window lights the floor by day. */
const SUNBEAM = 1.07;

/* The room */

/** Drops of paint on the floor: (u, v), their radius, their paint. */
const FLOOR_DROPS = [
  [18, 23, 2.4, 0], [23, 9, 1.8, 1], [44, 64, 2.2, 2], [88, 46, 1.8, 4], [92, 110, 2.4, 5], [112, 44, 1.8, 1],
] as const;

function paintBoards(grid: PixelGrid, time: CozyTime) {
  paintPlanks(grid, { tones: P.planks.tones, seam: P.planks.seam, joint: P.planks.joint, width: 5, length: 46 });
  for (const [cu, cv, radius, paint] of FLOOR_DROPS) {
    const tones = P.paints[paint];
    fillTop(grid, Math.floor(cu - radius - 2), Math.ceil(cu + radius + 2), Math.floor(cv - radius - 2), Math.ceil(cv + radius + 2), 0, (u, v) => {
      const d = (u + 0.5 - cu) ** 2 + (v + 0.5 - cv) ** 2;
      if (d < (radius * 0.45) ** 2 && radius > 1.5) return tones[0];
      return d < radius * radius ? tones[1] : null;
    });
  }
  shadeAlongWalls(grid);
  // by day, the panes of the window lit on the floor in front of the couch
  if (time === 'day') for (const [u0, u1] of [[20, 31], [33, 46]]) for (const [v0, v1] of [[38, 49], [51, 61], [63, 73], [75, 85]]) shadeFloor(grid, u0, u1, v0, v1, SUNBEAM);
}

/** A splash of paint on a wall: its middle, its radius, its paint, and how far it ran down. */
const WALL_SPLASHES: readonly (readonly [Wall, number, number, number, number, number])[] = [
  ['left', 92, 30, 2.6, 0, 9], ['left', 97, 22, 1.8, 1, 6], ['left', 88, 17, 1.4, 2, 4], ['left', 26, 30, 1.6, 4, 5],
  ['right', 96, 28, 2.4, 2, 8], ['right', 104, 21, 1.6, 0, 5], ['right', 109, 32, 1.3, 1, 3], ['right', 6, 34, 1.8, 5, 6],
  ['right', 34, 30, 1.4, 3, 4],
];

/** Paints tried on the plaster between the window and the door: each swatch from a0 to a1 along the wall, z0 to z1 up, and its paint. */
const SWATCHES = [[87, 92, 80, 88, 0], [94, 98, 81, 89, 1], [87, 92, 69, 77, 2], [94, 98, 70, 78, 3]] as const;

function paintPlaster(grid: PixelGrid) {
  const W = P.wall, B = P.baseboard;
  paintWallBoxes(grid, W);
  for (const wall of ['left', 'right'] as const) {
    const speck = wall === 'left' ? W.speck : W.speckRight;
    fillWall(grid, wall, 0, ROOM, 7, WALL_HEIGHT - 4, (a, z) => ((a * 37 + z * 61) % 53 === 0 || (a * 13 + z * 29) % 71 === 0 ? speck : null));
    wallPatch(grid, wall, 0, ROOM, WALL_HEIGHT - 4, WALL_HEIGHT - 3, speck);
    wallPatch(grid, wall, 0, ROOM, 0, 6, B.face); wallPatch(grid, wall, 0, ROOM, 5, 6, B.light); wallPatch(grid, wall, 0, ROOM, 0, 1, B.shade);
  }
  // the swatches: brushed square, their last stroke lighter, a dry brush trailing off their far end
  for (const [a0, a1, z0, z1, paint] of SWATCHES) {
    const tones = P.paints[paint];
    fillWall(grid, 'left', a0, a1 + 1, z0, z1, (a, z) => {
      if (a === a1) return z % 2 ? tones[1] : null;
      if (a === a0 && (z === z0 || z === z1 - 1)) return null;
      return z === z1 - 1 ? tones[0] : tones[1];
    });
  }
  for (const [wall, a, z, radius, paint, run] of WALL_SPLASHES) {
    const tones = P.paints[paint];
    wallEllipse(grid, wall, a + 0.5, z + 0.5, radius, radius, tones[1]);
    wallPatch(grid, wall, a, a + 1, z - run, z, tones[1]); wallPatch(grid, wall, a, a + 2, z - run - 2, z - run, tones[1]);
    wallPixel(grid, wall, a, z + 1, tones[0]);
    for (const [da, dz] of [[-radius - 2, 1], [radius + 2, -1], [radius + 1, 3]]) wallPixel(grid, wall, Math.round(a + da), z + dz, tones[1]);
  }
}

/** The sky of the hour in the window's panes: the sun high with its clouds by day, low and pink at dusk, the moon and stars at night. */
function paintSky(grid: PixelGrid, time: CozyTime) {
  const wall: Wall = 'left', K = C.sky, S = P.window, sky = K[time], [a0, a1, z0, z1] = PANES, band = (z1 - z0) / sky.length;
  const bandAt = (z: number) => sky[Math.min(sky.length - 1, Math.max(0, Math.floor((z1 - 1 - z) / band)))];
  fillWall(grid, wall, a0, a1, z0, z1, (_, z) => bandAt(z));
  if (time === 'night') {
    const ma = a0 + 12, mz = z1 - 11;
    wallEllipse(grid, wall, ma, mz, 5.5, 5.5, K.moon);
    fillWall(grid, wall, ma - 4, ma + 9, mz - 6, mz + 7, (a, z) => ((a + 0.5 - ma - 2.4) ** 2 + (z + 0.5 - mz - 1.4) ** 2 < 4.4 * 4.4 ? bandAt(z) : null));
    wallPixel(grid, wall, ma - 3, mz - 2, K.moonShade); wallPixel(grid, wall, ma - 2, mz - 4, K.moonShade);
    for (const [da, dz] of [[4, 50], [24, 44], [33, 52], [40, 38], [46, 48], [6, 24], [18, 14], [36, 26], [44, 8], [28, 32], [8, 6], [14, 40], [47, 20]]) wallPixel(grid, wall, a0 + da, z0 + dz, K.star);
    return;
  }
  const dusk = time === 'dusk';
  if (dusk) { wallEllipse(grid, wall, a0 + 30, z0 + 9, 6.5, 6.5, K.sunLow, PANES); wallEllipse(grid, wall, a0 + 30.6, z0 + 9.6, 4.4, 4.4, K.sunLowLight, PANES); }
  else { wallEllipse(grid, wall, a0 + 12, z1 - 12, 6, 6, K.sun); wallEllipse(grid, wall, a0 + 12.6, z1 - 11.4, 4.4, 4.4, K.sunLight); }
  const [light, shade] = dusk ? [K.duskCloud, K.duskCloudShade] : [S.cloud, S.cloudShade];
  for (const [ca, cz, size] of [[a0 + 34, z1 - 14, 1], [a0 + 16, z0 + 26, 0.8], [a0 + 44, z0 + 16, 0.7]] as const) {
    wallEllipse(grid, wall, ca, cz - 1, 7 * size, 2.8 * size, shade, PANES); wallEllipse(grid, wall, ca, cz, 7 * size, 2.8 * size, light, PANES);
    wallEllipse(grid, wall, ca + 2.4 * size, cz + 2.2 * size, 3.8 * size, 2.8 * size, light, PANES);
  }
}

/** The big steel window: its frame, its bars and their light edges, a glint in a few panes, its sill and what stands there. */
function paintStudioWindow(grid: PixelGrid, time: CozyTime) {
  const wall: Wall = 'left', S = P.window, { a0, a1, z0, z1 } = WINDOW, [p0, p1, q0, q1] = PANES;
  wallPatch(grid, wall, a0 - 1, a1 + 1, z0 - 1, z1 + 1, O);
  wallPatch(grid, wall, a0, a1, z0, z1, S.frame[1]);
  wallPatch(grid, wall, a0, a1, z1 - 1, z1, S.frame[0]); wallPatch(grid, wall, a0, a0 + 1, z0, z1, S.frame[0]);
  wallPatch(grid, wall, p0 - 1, p1 + 1, q0 - 1, q0, S.frame[2]);
  paintSky(grid, time);
  for (const a of BARS_UP) { wallPatch(grid, wall, a, a + 2, q0, q1, S.bar); wallPatch(grid, wall, a, a + 1, q0, q1, S.barLight); }
  for (const z of BARS_ACROSS) { wallPatch(grid, wall, p0, p1, z, z + 2, S.bar); wallPatch(grid, wall, p0, p1, z + 1, z + 2, S.barLight); }
  for (const [a, z] of [[p0 + 3, q0 + 3], [BARS_UP[1] + 4, BARS_ACROSS[0] + 4], [BARS_UP[2] + 4, q0 + 3], [p0 + 3, BARS_ACROSS[1] + 4]]) {
    for (let step = 0; step < 4; step++) wallPixel(grid, wall, a + step, z + 3 - step, S.glint);
    for (let step = 0; step < 2; step++) wallPixel(grid, wall, a + step + 3, z + 3 - step, S.glint);
  }
  ob(grid, 0, 6, a0 - 2, a1 + 2, z0 - 3, 3, S.sill, S.sillEdge);
  // on the sill: a jar of brushes, a little pot of paint, a succulent
  const sill = (v: number, topper: Topper) => { const { x, y } = iso(3, v, z0); art(grid, (layer) => topper(layer, x, y)); };
  sill(40, brushJar);
  sill(56, paintPots);
  sill(76, succulent);
}

/** The mint door with its two panels, drips of paint from its top, a sign with a palette, its brass knob: a click goes through it. */
const paintStudioDoor: Painter = (grid) => {
  const D = P.door, { a0, a1, height } = DOOR, wall: Wall = 'left', middle = (a0 + a1) >> 1;
  wallPatch(grid, wall, a0 - 2, a1 + 2, 0, height + 3, O);
  wallPatch(grid, wall, a0 - 1, a1 + 1, 0, height + 2, D.frame); wallPatch(grid, wall, a0 - 1, a1 + 1, height + 1, height + 2, D.frameLight);
  wallPatch(grid, wall, a0, a1, 0, height, D.leaf);
  wallPatch(grid, wall, a0, a0 + 1, 0, height, D.leafLight); wallPatch(grid, wall, a1 - 1, a1, 0, height, D.leafShade);
  for (const [z0, z1] of [[5, 25], [31, height - 6]]) {
    wallPatch(grid, wall, a0 + 3, a1 - 3, z0, z1, D.panel);
    wallPatch(grid, wall, a0 + 3, a1 - 3, z1 - 1, z1, D.leafShade); wallPatch(grid, wall, a1 - 4, a1 - 3, z0, z1, D.leafShade);
    wallPatch(grid, wall, a0 + 3, a1 - 3, z0, z0 + 1, D.panelLight); wallPatch(grid, wall, a0 + 3, a0 + 4, z0, z1, D.panelLight);
  }
  // drips of paint from the top of the leaf
  for (const [a, run, paint] of [[a0 + 2, 7, PINK], [a0 + 5, 4, YELLOW], [a0 + 9, 11, BLUE], [a0 + 13, 5, GREEN], [a0 + 16, 8, VIOLET]] as const) {
    wallPatch(grid, wall, a, a + 1, height - run, height, paint[1]); wallPatch(grid, wall, a, a + 2, height - run - 2, height - run, paint[1]);
    wallPixel(grid, wall, a, height - run - 1, paint[0]);
  }
  wallPatch(grid, wall, a0, a1, height - 1, height, PINK[1]);
  // the sign: a palette and its paints
  wallPatch(grid, wall, middle - 6, middle + 6, 40, 49, O); wallPatch(grid, wall, middle - 5, middle + 5, 41, 48, D.sign);
  wallEllipse(grid, wall, middle + 0.5, 44.5, 3.6, 2.4, P.palette.wood[1]); wallPixel(grid, wall, middle + 2, 44, D.sign);
  for (const [da, dz, paint] of [[-2, 45, PINK], [0, 46, YELLOW], [-1, 43, BLUE], [1, 43, GREEN]] as const) wallPixel(grid, wall, middle + da, dz, paint[1]);
  wallPatch(grid, wall, a1 - 5, a1 - 3, 27, 29, D.knob); wallPixel(grid, wall, a1 - 4, 27, D.knobShade);
};

/** The mat in front of the door, with three stripes of paint. */
function paintDoormat(grid: PixelGrid) {
  const { a0, a1 } = DOOR, M = P.door.mat;
  fillTop(grid, 1, 12, a0 + 1, a1 - 1, 0, (u, v) => {
    if (u === 1 || u === 11 || v === a0 + 1 || v === a1 - 2) return M[2];
    if (u === 4) return PINK[0];
    if (u === 6) return YELLOW[0];
    if (u === 8) return BLUE[0];
    return (u * 3 + v) % 5 === 0 ? M[0] : M[1];
  });
}

/** Something pinned on the cork board: a sheet from a0 to a1, z0 to z1, its shadow on the cork, a pin of `pin` on top. */
function pinned(grid: PixelGrid, a0: number, a1: number, z0: number, z1: number, sheet: string, pin: Tones) {
  const wall: Wall = 'right', B = P.board, middle = (a0 + a1) >> 1;
  wallPatch(grid, wall, a0 + 1, a1 + 1, z0 - 1, z1 - 1, B.corkDark);
  wallPatch(grid, wall, a0, a1, z0, z1, sheet); wallPatch(grid, wall, a0, a1, z0, z0 + 1, tint(sheet, 0.92));
  wallPatch(grid, wall, middle, middle + 2, z1 - 2, z1, pin[1]); wallPixel(grid, wall, middle, z1 - 1, pin[0]);
}

/** The cork board on the right wall: a sketch of a cat, colour swatches, a photo, notes; its pencils on its ledge. A click opens the board and its notes. */
const paintCorkBoard: Painter = (grid) => {
  const wall: Wall = 'right', B = P.board;
  wallPatch(grid, wall, 73, 123, 45, 87, O);
  wallPatch(grid, wall, 74, 122, 46, 86, B.frame); wallPatch(grid, wall, 74, 122, 85, 86, B.frameLight); wallPatch(grid, wall, 74, 75, 46, 86, B.frameLight);
  wallPatch(grid, wall, 77, 119, 49, 83, B.cork);
  fillWall(grid, wall, 77, 119, 49, 83, (a, z) => ((a * 5 + z * 11) % 13 === 0 ? B.corkLight : (a * 7 + z * 3) % 17 === 0 ? B.corkDark : null));
  // the sketch of a cat
  pinned(grid, 79, 93, 61, 80, B.paper, PINK);
  fillWall(grid, wall, 80, 92, 62, 78, (a, z) => {
    const d = ((a + 0.5 - 86) / 4.6) ** 2 + ((z + 0.5 - 68.5) / 4) ** 2;
    return d < 1.12 && d > 0.62 ? B.pencil : null;
  });
  for (const [a, z] of [[82, 72], [82, 73], [83, 74], [84, 73], [88, 73], [89, 74], [90, 73], [90, 72], [84, 69], [88, 69], [86, 67], [85, 66], [87, 66], [81, 67], [91, 67], [80, 68], [92, 68]]) wallPixel(grid, wall, a, z, B.pencil);
  wallPatch(grid, wall, 81, 89, 63, 64, B.pencil);
  // the colour swatches
  pinned(grid, 96, 102, 58, 81, B.paper, BLUE);
  for (const [index, paint] of [PINK, YELLOW, BLUE, GREEN, VIOLET].entries()) wallPatch(grid, wall, 97, 101, 75 - index * 4, 78 - index * 4, paint[1]);
  // a photo of the hills
  pinned(grid, 104, 117, 63, 79, B.photo, YELLOW);
  const S = P.poster;
  wallPatch(grid, wall, 105, 116, 67, 78, S.sky);
  wallEllipse(grid, wall, 113.5, 74.5, 2.2, 2.2, S.sun);
  fillWall(grid, wall, 105, 116, 67, 74, (a, z) => (z < 70 + Math.round(2 * Math.sin((a - 103) / 3)) ? S.hill : z < 72 - Math.round(1.5 * Math.cos((a - 104) / 2.6)) ? S.hillFar : null));
  // the notes
  pinned(grid, 80, 88, 51, 58, B.note[0], GREEN);
  wallPatch(grid, wall, 81, 86, 54, 55, B.pencil); wallPatch(grid, wall, 81, 85, 52, 53, B.pencil);
  pinned(grid, 105, 113, 51, 59, B.note[1], VIOLET);
  wallPatch(grid, wall, 106, 111, 55, 56, B.pencil); wallPatch(grid, wall, 106, 110, 53, 54, B.pencil);
  pinned(grid, 89, 95, 50, 56, B.note[2], ORANGE);
  // a heart in pink, drawn on the cork
  for (const [a, z] of [[115, 55], [116, 56], [117, 55], [114, 54], [115, 54], [116, 54], [117, 54], [118, 54], [115, 53], [116, 53], [117, 53], [116, 52]] as const) wallPixel(grid, wall, a, z, PINK[1]);
  ob(grid, 76, 120, 0, 4, 44, 2, B.tray);
  for (const [a, paint] of [[86, PINK], [90, BLUE], [94, YELLOW], [98, GREEN]] as const) ob(grid, a, a + 3, 0, 3, 46, 1, paint);
};

/** A blue clock above the door: its hands are drawn by clock.ts. */
const CLOCK: WallClock = { wall: 'left', a: 112, z: 80, radius: 6, tones: P.clock };

/* Hung on the walls, lying on the floor */

/** A framed print on a wall: from a0 to a1, z0 to z1, its picture drawn by `picture` inside its mat. */
function paintPrint(grid: PixelGrid, wall: Wall, a0: number, a1: number, z0: number, z1: number, picture: (a0: number, a1: number, z0: number, z1: number) => void) {
  const S = P.poster;
  wallPatch(grid, wall, a0 - 1, a1 + 1, z0 - 1, z1 + 1, O);
  wallPatch(grid, wall, a0, a1, z0, z1, S.frame);
  wallPatch(grid, wall, a0 + 1, a1 - 1, z0 + 1, z1 - 1, S.mat);
  picture(a0 + 3, a1 - 3, z0 + 3, z1 - 3);
}

/** On the right wall, a print of shapes: a yellow sun, a blue block, a pink arch. */
const shapesPrint = (grid: PixelGrid) => paintPrint(grid, 'right', 4, 26, 52, 84, (a0, a1, z0, z1) => {
  const wall: Wall = 'right';
  wallPatch(grid, wall, a0, a1, z0, z1, P.poster.sky);
  wallEllipse(grid, wall, a0 + 11, z1 - 8, 5.4, 5.4, YELLOW[1]);
  wallPatch(grid, wall, a0 + 1, a0 + 8, z0 + 1, z0 + 15, BLUE[1]);
  fillWall(grid, wall, a0 + 9, a1, z0, z0 + 12, (a, z) => {
    const d = ((a + 0.5 - (a0 + 13)) / 6) ** 2 + ((z + 0.5 - z0) / 11) ** 2;
    return d < 1 && d > 0.3 ? PINK[1] : null;
  });
  wallPatch(grid, wall, a0, a1, z0 + 15, z0 + 16, O);
});

/** The pegboard over the workbench: scissors, a ruler, a set square, three brushes. */
function paintPegboard(grid: PixelGrid) {
  const wall: Wall = 'right', K = P.pegboard;
  wallPatch(grid, wall, 34, 71, 41, 66, O);
  wallPatch(grid, wall, 35, 70, 42, 65, K.board); wallPatch(grid, wall, 35, 70, 42, 43, K.frame); wallPatch(grid, wall, 69, 70, 42, 65, K.frame);
  fillWall(grid, wall, 35, 70, 42, 65, (a, z) => ((a - 35) % 4 === 2 && (z - 42) % 4 === 2 ? K.hole : null));
  // the scissors: two blades, two pink rings
  for (let step = 0; step < 9; step++) { wallPixel(grid, wall, 39 + (step >> 2), 61 - step, K.metal); wallPixel(grid, wall, 42 - (step >> 2), 61 - step, K.metalShade); }
  for (const a of [38, 42]) { wallEllipse(grid, wall, a + 0.5, 49.5, 2.2, 2.2, PINK[1]); wallPixel(grid, wall, a, 49, K.board); }
  // the ruler and its marks
  wallPatch(grid, wall, 46, 49, 44, 64, O); wallPatch(grid, wall, 47, 48, 45, 63, K.ruler);
  for (let z = 46; z < 63; z += 3) wallPixel(grid, wall, 47, z, K.rulerTick);
  // the set square
  fillWall(grid, wall, 51, 62, 47, 62, (a, z) => {
    const inside = a - 51 <= 61 - z;
    if (!inside) return null;
    const rim = a === 51 || z === 47 || a - 51 === 61 - z || a - 51 === 60 - z;
    return rim ? BLUE[2] : a - 51 > 3 && z > 50 && a - 51 < 57 - z ? null : BLUE[0];
  });
  // three brushes hanging by their handles
  for (const [a, paint] of [[64, ORANGE], [66, GREEN], [68, VIOLET]] as const) {
    wallPatch(grid, wall, a, a + 1, 52, 62, P.jar.handle); wallPatch(grid, wall, a, a + 1, 50, 52, K.metal); wallPatch(grid, wall, a, a + 1, 47, 50, paint[1]); wallPixel(grid, wall, a, 62, K.metalShade);
  }
}

/** Drawings drying on a line above the pegboard: a sun, a heart, a tree, a wave. */
function paintDryingLine(grid: PixelGrid) {
  const wall: Wall = 'right', L = P.line, B = P.board;
  const lineAt = (a: number) => 91 - Math.round(3 * Math.sin((Math.PI * (a - 32)) / 38));
  for (let a = 32; a < 71; a++) wallPixel(grid, wall, a, lineAt(a), L.string);
  wallPatch(grid, wall, 31, 33, 90, 92, O); wallPatch(grid, wall, 70, 72, 90, 92, O);
  for (const [index, a] of [35, 44, 53, 62].entries()) {
    const top = lineAt(a + 3) - 1, bottom = top - 10;
    wallPatch(grid, wall, a - 1, a + 8, bottom - 1, top + 1, O);
    wallPatch(grid, wall, a, a + 7, bottom, top, B.paper); wallPatch(grid, wall, a, a + 7, bottom, bottom + 1, B.paperShade);
    const ma = a + 3, mz = bottom + 5;
    if (index === 0) { wallEllipse(grid, wall, ma + 0.5, mz + 0.5, 2.2, 2.2, YELLOW[1]); for (const [da, dz] of [[-3, 0], [3, 0], [0, 3], [0, -3]]) wallPixel(grid, wall, ma + da, mz + dz, ORANGE[1]); }
    if (index === 1) for (const [da, dz] of [[-1, 1], [1, 1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-1, -1], [0, -1], [1, -1], [0, -2], [-2, 1], [2, 1]]) wallPixel(grid, wall, ma + da, mz + dz, PINK[1]);
    if (index === 2) { wallEllipse(grid, wall, ma + 0.5, mz + 1.5, 2.4, 2.6, GREEN[1]); wallPatch(grid, wall, ma, ma + 1, bottom + 1, mz, P.easel[2]); }
    if (index === 3) for (let da = -2; da <= 3; da++) { wallPixel(grid, wall, ma + da, mz + 1 + (da & 1), BLUE[1]); wallPixel(grid, wall, ma + da, mz - 2 + (da & 1), BLUE[0]); }
    wallPatch(grid, wall, a + 3, a + 4, top - 1, top + 2, L.clip);
  }
}

/** A painter's palette on its nail, between the window and the door: its thumb hole, six blobs of paint round its rim. */
function paintWallPalette(grid: PixelGrid) {
  const wall: Wall = 'left', W = P.palette.wood;
  wallEllipse(grid, wall, 93.5, 54, 7, 6.6, O);
  wallEllipse(grid, wall, 93.5, 54, 6, 5.6, W[2]); wallEllipse(grid, wall, 93.5, 54.5, 5.2, 4.8, W[1]);
  wallEllipse(grid, wall, 89.5, 56, 1.6, 1.6, W[2]); wallEllipse(grid, wall, 89.5, 56, 0.9, 0.9, P.wall.left);
  for (const [a, z, paint] of [[92, 58, PINK], [95, 57, YELLOW], [97, 54, BLUE], [96, 51, GREEN], [93, 50, ORANGE], [90, 52, VIOLET]] as const) {
    wallPatch(grid, wall, a, a + 2, z - 1, z + 1, paint[1]); wallPixel(grid, wall, a, z, paint[0]);
  }
}

/** The rag rug: stripes of paint colours, flecks of white, a fringe at both ends. */
function paintRug(grid: PixelGrid) {
  const R = P.rug, { u0, u1, v0, v1 } = RUG;
  fillTop(grid, u0, u1, v0, v1, 0, (u, v) => {
    const edge = Math.min(u - u0, u1 - 1 - u, v - v0, v1 - 1 - v);
    if (edge < 1) return R.edge;
    const stripe = Math.floor((v - v0 - 1) / 4), colour = R.stripes[stripe % R.stripes.length];
    if ((u * 3 + v * 5) % 13 === 0) return R.fleck;
    return (v - v0 - 1) % 4 === 3 ? tint(colour, 0.9) : colour;
  });
  fillTop(grid, u0 - 2, u0, v0, v1, 0, (_u, v) => (v % 2 ? R.fringe : null)); fillTop(grid, u1, u1 + 2, v0, v1, 0, (_u, v) => (v % 2 ? R.fringe : null));
}

/* What stands on the floor */

/** The easel in the back corner, its painting of the hills half done, the pencil lines of the rest, two tubes on its ledge. */
function paintEasel(grid: PixelGrid) {
  const E = P.easel, S = P.poster, { x, y } = iso(EASEL.u, EASEL.v);
  art(grid, (layer) => { layer.line(x, y - 50, x + 1, y - 8, E[2]); layer.line(x + 1, y - 50, x + 2, y - 8, E[2]); });
  art(grid, (layer) => {
    layer.line(x - 3, y - 54, x - 9, y, E[1]); layer.line(x - 2, y - 54, x - 8, y, E[0]);
    layer.line(x + 2, y - 54, x + 8, y, E[1]); layer.line(x + 3, y - 54, x + 9, y, E[2]);
    layer.rect(x - 1, y - 58, 3, 6, E[1]); layer.set(x - 1, y - 58, E[0]);
  });
  art(grid, (layer) => {
    const left = x - 12, top = y - 49, width = 25, height = 22;
    layer.rect(left, top, width, height, P.canvas[0]);
    // the painted part: sky, sun, two hills, a field of flowers
    layer.rect(left, top, 17, height, S.sky);
    layer.ellipse(left + 12, top + 6, 3.2, 3.2, S.sun);
    for (let column = 0; column < 17; column++) {
      const far = top + 12 - Math.round(2.6 * Math.sin(column / 3.2)), near = top + 15 - Math.round(2 * Math.cos(column / 2.6));
      layer.rect(left + column, far, 1, height - (far - top), S.hillFar); layer.rect(left + column, near, 1, height - (near - top), S.hill);
    }
    layer.points([[left + 3, top + 18], [left + 7, top + 19], [left + 11, top + 17], [left + 14, top + 19]], PINK[1]);
    layer.points([[left + 5, top + 17], [left + 9, top + 20], [left + 13, top + 18]], YELLOW[0]);
    // the brush's last strokes, ragged, and the pencil lines still to paint
    for (let row = 0; row < height; row += 2) layer.set(left + 17, top + row, row % 4 ? S.hillFar : S.sky);
    layer.line(left + 19, top + 13, left + 24, top + 11, P.board.pencil); layer.line(left + 19, top + 16, left + 24, top + 15, P.board.pencil);
    layer.set(left + 21, top + 6, P.board.pencil); layer.set(left + 22, top + 5, P.board.pencil); layer.set(left + 23, top + 6, P.board.pencil);
    layer.rect(left + width - 1, top, 1, height, P.canvas[2]); layer.rect(left, top + height - 1, width, 1, P.canvas[1]);
  });
  art(grid, (layer) => {
    layer.rect(x - 14, y - 27, 28, 3, E[1]); layer.rect(x - 14, y - 27, 28, 1, E[0]); layer.rect(x + 10, y - 26, 4, 2, E[2]);
  });
  art(grid, (layer) => { layer.rect(x - 9, y - 29, 4, 2, PINK[1]); layer.set(x - 10, y - 29, P.bench.can[1]); layer.rect(x + 5, y - 29, 4, 2, BLUE[1]); layer.set(x + 9, y - 29, P.bench.can[1]); });
  art(grid, (layer) => { layer.rect(x - 2, y - 52, 5, 4, E[1]); layer.rect(x - 2, y - 52, 5, 1, E[0]); });
}

/** The snake plant in its terracotta pot. */
function paintSnakePlant(grid: PixelGrid) {
  const L = P.plant, { x, y } = iso(PLANT.u, PLANT.v);
  art(grid, (layer) => {
    for (const [dx, height, lean, tone] of [[-4, 22, -3, 1], [3, 24, 3, 2], [-1, 30, -1, 0], [1, 26, 1, 1], [5, 16, 4, 0], [-6, 15, -4, 2]] as const) {
      for (let row = 0; row < height; row++) {
        const at = x + dx + Math.round((lean * row) / height), width = row < height - 5 ? 3 : row < height - 2 ? 2 : 1, z = y - 10 - row;
        for (let column = 0; column < width; column++) layer.set(at + column, z, L.leaves[column === 0 ? 0 : column === width - 1 ? 2 : tone]);
        if (row % 5 === 2 && width > 2) layer.set(at + 1, z, L.leaves[2]);
        if (width === 3 && row % 7 === 0) layer.set(at, z, L.edge);
      }
    }
  });
  art(grid, (layer) => {
    for (let row = 0; row < 11; row++) {
      const half = row < 2 ? 7 : 6 - Math.floor((row - 2) / 4);
      for (let dx = -half; dx < half; dx++) layer.set(x + dx, y - 11 + row, dx < -half + 2 ? L.pot[0] : dx >= half - 3 ? L.pot[2] : L.pot[1]);
    }
    layer.rect(x - 7, y - 11, 14, 1, L.potRim); layer.rect(x - 6, y - 10, 12, 1, L.soil);
  });
}

/** Two canvases leaning on the right wall: a big one of shapes, a small one of the sea in front of it. */
function paintCanvases(grid: PixelGrid) {
  const { u0, u1, v0 } = CANVASES;
  ob(grid, u0, u1, v0, v0 + 2, 0, 27, P.stretcher);
  fillLeftFace(grid, v0 + 2, u0 + 1, u1 - 1, 1, 26, (a, z) => {
    if (((a + 0.5 - (u0 + 7)) ** 2) / 9 + ((z + 0.5 - 17) ** 2) / 25 < 1) return YELLOW[1];
    if (z < 9 && a > u0 + 4) return VIOLET[1];
    return VIOLET[0];
  });
  ob(grid, u0 + 3, u1 - 1, v0 + 2, v0 + 4, 0, 17, P.canvas);
  fillLeftFace(grid, v0 + 4, u0 + 4, u1 - 2, 1, 16, (a, z) => {
    if (z > 11) return P.poster.sky;
    if (z === 11) return BLUE[0];
    return (a + z) % 4 === 0 ? BLUE[0] : z < 5 ? BLUE[2] : BLUE[1];
  });
}

/** A paint can standing at (u, v), `z` up: its band of paint and a drip over its rim. */
function paintCan(grid: PixelGrid, u: number, v: number, z: number, paint: Tones) {
  const K = P.bench.can, { x, y } = iso(u, v, z);
  art(grid, (layer) => {
    layer.rect(x - 3, y - 7, 7, 7, K[1]); layer.rect(x + 2, y - 7, 2, 7, K[2]);
    layer.rect(x - 3, y - 5, 7, 3, paint[1]); layer.rect(x + 2, y - 5, 2, 3, paint[2]);
    layer.ellipse(x + 0.5, y - 7, 3.5, 1.4, K[0]); layer.rect(x - 1, y - 8, 3, 1, paint[1]);
    layer.set(x - 2, y - 7, paint[1]); layer.set(x - 2, y - 6, paint[1]);
  });
}

/** The workbench: birch legs, a shelf of paint cans, jars of brushes, paper, the kettle, a coffee press and mugs. */
function paintBench(grid: PixelGrid) {
  const K = P.bench, { u0, u1, v0, v1 } = BENCH;
  for (const u of [u0 + 1, u1 - 3]) ob(grid, u, u + 2, v0 + 1, v0 + 3, 0, 20, K.body);
  ob(grid, u0 + 1, u1 - 1, v0 + 1, v1 - 1, 5, 2, K.top, K.edge);
  for (const [u, paint] of [[39, ORANGE], [47, BLUE], [55, GREEN], [63, PINK]] as const) paintCan(grid, u, 9, 7, paint);
  for (const u of [u0 + 1, u1 - 3]) ob(grid, u, u + 2, v1 - 3, v1 - 1, 0, 20, K.body);
  ob(grid, u0, u1, v0, v1, 20, 2, K.top, K.edge);
  const on = (u: number, v: number, topper: Topper) => { const { x, y } = iso(u, v, 22); art(grid, (layer) => topper(layer, x, y)); };
  on(37, 4, brushJar);
  ob(grid, 44, 53, 2, 11, 22, 2, P.paper); ob(grid, 45, 52, 3, 10, 24, 1, P.paper, P.paper[0]);
  on(41, 10, brushJar);
  on(58, 5, coffeePress);
  on(64, 5, kettle);
  on(57, 11, mug(P.mugs[1]));
  on(66, 11, mug(P.mugs[0]));
}

/** The jug of water on its crate, its tap towards the room, paper cups beside it. */
function paintWater(grid: PixelGrid) {
  const W = P.water, { u, v, width } = WATER, front = v + width;
  ob(grid, u, u + width, v, front, 0, 16, W.crate, tint(W.crate[0], 1.05));
  for (const z of [5, 10]) { onLeftFace(grid, front, u + 1, u + width, z, W.slat); onRightFace(grid, u + width, v + 1, front, z, W.slat); }
  art(grid, (layer) => {
    const { x, y } = iso(u + 6, v + 6, 16);
    layer.rect(x - 4, y - 16, 9, 15, W.glass); layer.rect(x - 3, y - 12, 7, 11, W.water); layer.rect(x + 3, y - 16, 1, 15, W.glassShade);
    layer.points([[x - 2, y - 11], [x - 2, y - 10], [x - 2, y - 9]], W.glass);
    layer.rect(x - 4, y - 18, 9, 2, W.cap); layer.rect(x - 1, y - 3, 2, 2, W.cap);
  });
  art(grid, (layer) => { const { x, y } = iso(u + 10, v + 2, 16); layer.rect(x - 1, y - 6, 4, 6, W.cups); layer.rect(x + 2, y - 6, 1, 6, W.glassShade); layer.rect(x - 2, y - 7, 6, 1, W.cups); });
}

/* The little things on the desks, the bench, the sill and the drawers */

const brushJar: Topper = (layer, x, y) => {
  const J = P.jar;
  for (const [dx, top, paint] of [[-1, 11, PINK], [1, 12, BLUE], [0, 10, YELLOW]] as const) { layer.rect(x + dx, y - top, 1, top - 3, J.handle); layer.set(x + dx, y - top, paint[1]); layer.set(x + dx, y - top + 1, J.bristle); }
  layer.rect(x - 2, y - 5, 5, 5, J.glass); layer.rect(x - 2, y - 3, 5, 3, J.water); layer.rect(x + 2, y - 5, 1, 5, J.glassShade);
};
const paintPots: Topper = (layer, x, y) => {
  for (const [dx, dy, paint] of [[-4, -2, YELLOW], [2, -2, PINK], [-1, 1, BLUE]] as const) {
    layer.rect(x + dx - 2, y + dy - 4, 5, 4, paint[1]); layer.rect(x + dx + 2, y + dy - 4, 1, 4, paint[2]); layer.rect(x + dx - 2, y + dy - 4, 5, 1, paint[0]);
  }
};
const succulent: Topper = (layer, x, y) => {
  const L = P.plant;
  layer.rect(x - 3, y - 4, 7, 4, L.pot[1]); layer.rect(x + 2, y - 4, 2, 4, L.pot[2]); layer.rect(x - 3, y - 5, 7, 1, L.potRim);
  layer.ellipse(x - 1, y - 7, 2.2, 2.2, L.leaves[1]); layer.ellipse(x + 2, y - 8, 2, 2.2, L.leaves[2]); layer.ellipse(x, y - 10, 1.8, 1.8, L.leaves[0]);
};
const kettle: Topper = (layer, x, y) => {
  const K = P.kettle;
  layer.ellipse(x + 0.5, y - 4, 4.5, 4, K.body[1]); layer.ellipse(x - 0.5, y - 5, 2.6, 2.2, K.body[0], [K.body[1]]); layer.rect(x + 3, y - 5, 2, 4, K.body[2]);
  layer.points([[x - 4, y - 5], [x - 5, y - 6], [x - 6, y - 7]], K.body[1]);
  layer.rect(x - 1, y - 9, 3, 1, K.lid); layer.points([[x - 3, y - 9], [x - 3, y - 10], [x - 2, y - 11], [x + 2, y - 11], [x + 3, y - 10], [x + 3, y - 9]], K.handle);
};
const coffeePress: Topper = (layer, x, y) => {
  const K = P.kettle;
  layer.rect(x - 2, y - 8, 5, 8, K.press); layer.rect(x - 2, y - 5, 5, 5, K.coffee); layer.rect(x + 2, y - 8, 1, 8, K.metal);
  layer.rect(x - 2, y - 9, 5, 1, K.metal); layer.set(x, y - 10, K.handle);
};
const mug = (colour: string): Topper => (layer, x, y) => {
  layer.rect(x - 2, y - 4, 4, 4, colour); layer.rect(x + 1, y - 4, 1, 4, tint(colour, 0.85)); layer.points([[x + 2, y - 3], [x + 3, y - 3], [x + 3, y - 2]], colour);
  layer.rect(x - 1, y - 4, 2, 1, P.kettle.coffee);
};
const palette: Topper = (layer, x, y) => {
  const W = P.palette.wood;
  layer.ellipse(x, y - 1.5, 4.6, 2, W[1]); layer.rect(x - 3, y - 3, 5, 1, W[0]); layer.set(x + 2, y - 1, W[2]);
  layer.set(x - 3, y - 2, PINK[1]); layer.set(x - 1, y - 3, YELLOW[1]); layer.set(x + 1, y - 3, BLUE[1]); layer.set(x - 1, y - 1, GREEN[1]);
};
const artBooks: Topper = (layer, x, y) => {
  const B = P.books;
  layer.rect(x - 5, y - 3, 10, 3, B[1]); layer.rect(x - 5, y - 1, 10, 1, tint(B[1], 0.85)); layer.rect(x - 4, y - 6, 9, 3, B[0]); layer.rect(x - 4, y - 4, 9, 1, tint(B[0], 0.85));
  layer.rect(x - 3, y - 9, 7, 3, B[2]); layer.rect(x - 3, y - 7, 7, 1, tint(B[2], 0.85)); layer.set(x - 4, y - 5, P.paper[0]); layer.set(x - 5, y - 2, P.paper[0]);
  layer.rect(x + 3, y - 15, 2, 6, P.paper[1]); layer.set(x + 3, y - 15, P.paper[0]);
};

const TABORET: Drawers = { ...DRAWERS[0], tones: P.taboret, topper: paintPots };
const FLAT_FILE: Drawers = { ...DRAWERS[1], tones: P.flatFile, topper: artBooks };

/** The architect's lamp: its foot, its pole, its arm reaching over the room, its red shade and its bulb. */
function paintArchitectLamp(grid: PixelGrid) {
  const L = P.lamp, { x, y } = iso(LAMP.u, LAMP.v);
  art(grid, (layer) => {
    layer.ellipse(x, y - 1, 5, 2, L.base[1]); layer.ellipse(x - 1, y - 2, 3, 1, L.base[0]);
    layer.rect(x, y - 36, 1, 35, L.base[1]); layer.rect(x - 1, y - 38, 3, 3, L.base[2]);
    layer.line(x + 1, y - 38, x + 9, y - 47, L.base[1]); layer.line(x + 1, y - 37, x + 9, y - 46, L.base[0]); layer.rect(x + 8, y - 48, 3, 3, L.base[2]);
  });
  art(grid, (layer) => {
    for (let row = 0; row < 7; row++) { const half = 2 + Math.round(row * 0.8); for (let dx = -half; dx <= half; dx++) layer.set(x + 12 + dx, y - 49 + row, dx < -half + 2 ? L.shade[0] : dx > half - 2 ? L.shade[2] : L.shade[1]); }
    layer.rect(x + 5, y - 42, 15, 1, L.shade[2]); layer.rect(x + 9, y - 41, 7, 1, L.inside); layer.rect(x + 11, y - 40, 3, 1, L.bulb);
  });
}

/** The mustard couch, a striped mint pillow on it. */
function paintMustardCouch(grid: PixelGrid) {
  const couch = office.couch;
  paintCouch(grid, couch, P.couch, 2, null);
  art(grid, (layer) => {
    const { x, y } = iso(...onCouchAt(couch, 10, 16), 13), K = P.pillow;
    layer.rect(x - 4, y - 8, 9, 8, K[1]); layer.rect(x - 4, y - 8, 9, 2, K[0]); layer.rect(x + 3, y - 6, 2, 6, K[2]);
    layer.rect(x - 3, y - 5, 6, 1, P.pillowStripe); layer.rect(x - 3, y - 3, 6, 1, P.pillowStripe);
  });
}

export const atelier: AmbianceDesign = {
  ...office,
  id: 'atelier',
  deskStyle: {
    top: P.desk.top, topEdge: P.desk.edge, leg: P.desk.leg, drawers: null, monitor: P.desk.monitor, monitorEdge: P.desk.monitorEdge, stand: P.desk.stand,
    vents: P.desk.vents, keyboard: P.desk.keyboard, key: P.desk.key, seats: P.seats, chairBase: P.chair.base, chairPole: P.chair.pole, backThing: brushJar, sideThing: palette,
  },
  paintCouch: paintMustardCouch,
  paintCouchArm: (grid) => paintCouchArm(grid, office.couch, P.couch),
  paintDoor: paintStudioDoor,
  paintBoard: paintCorkBoard,
  clock: CLOCK,
  footprints: [
    around(EASEL.u, EASEL.v, 7, 58),
    around(PLANT.u, PLANT.v, 4, 40),
    { ...CANVASES, height: 28 },
    { ...BENCH, height: 40 },
    { u0: WATER.u, u1: WATER.u + WATER.width, v0: WATER.v, v1: WATER.v + WATER.width, height: 36 },
    ...[TABORET, FLAT_FILE].map(({ u0, u1, v0, v1, height }) => ({ u0, u1, v0, v1, height: height + 12 })),
    around(LAMP.u, LAMP.v, 3, 50),
  ],
  paintRoom(grid, time) {
    paintBoards(grid, time);
    paintPlaster(grid);
    paintStudioWindow(grid, time);
  },
  dress(grid) {
    shapesPrint(grid);
    paintPegboard(grid);
    paintDryingLine(grid);
    paintWallPalette(grid);
    paintHangingPlant(grid, wallPoint('left', HANGING_PLANT, 100), 20, 1);
    paintRug(grid);
    paintDoormat(grid);
  },
  standing: [
    standing(EASEL.u, EASEL.u, EASEL.v, EASEL.v, paintEasel),
    standing(PLANT.u, PLANT.u, PLANT.v, PLANT.v, paintSnakePlant),
    standing(CANVASES.u0, CANVASES.u1, CANVASES.v0, CANVASES.v1, paintCanvases),
    standing(BENCH.u0, BENCH.u1, BENCH.v0, BENCH.v1, paintBench),
    standing(WATER.u, WATER.u + WATER.width, WATER.v, WATER.v + WATER.width, paintWater),
    ...[TABORET, FLAT_FILE].map((drawers) => standing(drawers.u0, drawers.u1, drawers.v0, drawers.v1, (grid) => paintDrawers(grid, drawers))),
    standing(LAMP.u, LAMP.u, LAMP.v, LAMP.v, paintArchitectLamp),
  ],
  light: { lamp: LAMP, lampColour: P.light.lamp, ambient: P.light, lampGlow: [P.lamp.bulb, P.lamp.inside], glow: [], sky: [] },
};
