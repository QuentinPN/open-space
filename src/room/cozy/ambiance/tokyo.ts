// The Tokyo apartment-office (ambiance 'tokyo'), furnished where the offices are (office.ts: the same desks, couch,
// door and walks): sand plaster over a cedar wainscot, tatami mats, a window on the city's towers and its red lattice
// tower (the view of the hour), a rolled bamboo blind and a teru teru bozu, a daruma on the sill, a sliding shoji door
// under its indigo noren, slippers on the genkan mat, neon signs ("ラーメン" and a bowl, "トーキョー" down the wall),
// a cherry blossom poster, a cork board of notes, a drinks vending machine, a kitchenette with its rice cooker and cup
// noodles, a hot water pot for the tea, cedar tansu with a lucky cat and manga, bamboo in a pot, a red paper lantern,
// an andon floor lamp, an indigo couch with an onigiri pillow, light wood tables with ramen and bento.
import { COZY_AMBIANCE_PALETTE, COZY_PALETTE as C } from '../../../design/room-palette.ts';
import type { WallClock } from '../clock.ts';
import { DOOR, ceilingAt, paintCouch, paintCouchArm, paintDrawers, paintWallBoxes, shadeAlongWalls, standing, type Drawers, type Topper } from '../decor.ts';
import { ROOM_UNITS as ROOM, WALL_HEIGHT, around, iso, onCouchAt } from '../geometry.ts';
import {
  fillTop, fillWall, onLeftFace, outlined, outlinedBox, patchOnLeftFace, patchOnRightFace, wallEllipse, wallPatch, wallPixel,
  type Painter, type PixelGrid, type Tones, type Wall,
} from '../pixels.ts';
import type { CozyTime } from '../time.ts';
import type { AmbianceDesign } from './index.ts';
import { COOLER, COUNTER, DRAWERS, LAMP, MONSTERA, office } from './office.ts';

const P = COZY_AMBIANCE_PALETTE.tokyo, O = C.outline, V = P.view;
const ob = (grid: PixelGrid, u0: number, u1: number, v0: number, v1: number, z: number, height: number, tones: Tones, edge?: string) => outlinedBox(grid, u0, u1, v0, v1, z, height, tones, O, edge);
const art = (grid: PixelGrid, draw: (layer: PixelGrid) => void) => outlined(grid, draw, O);

/* Where things are, in the room's units */

/** The window's view on the left wall, where the offices' window is (its frame round it). */
const VIEW = { a0: 34, a1: 78, z0: 44, z1: 86 } as const;
/** The kitchenette and the vending machine share the offices' counter's place, along the right wall behind the back desks. */
const KITCHEN = { u0: COUNTER.u0, u1: 51, v0: COUNTER.v0, v1: COUNTER.v1 } as const;
const VENDING = { u0: 51, u1: COUNTER.u1, v0: COUNTER.v0, v1: COUNTER.v1, height: 50 } as const;
/** The hot water pot on its stand, where the offices' cooler is; the bamboo where their monstera is. */
const TEA = COOLER, BAMBOO = MONSTERA;
/** The red paper lantern, hung between the window and the door: (u, v) and how high its middle hangs. */
const LANTERN = { u: 3, v: 91, z: 70 } as const;

/* The room */

function paintTatami(grid: PixelGrid) {
  const T = P.tatami;
  // mats of 32 by 16, two to a square, the squares turned a quarter from one to the next; a cloth border along their long sides
  fillTop(grid, 0, ROOM, 0, ROOM, 0, (u, v) => {
    const su = u >> 5, sv = v >> 5, alongU = (su + sv) % 2 === 0;
    const across = (alongU ? v : u) % 16, along = (alongU ? u : v) % 32, mat = alongU ? v >> 4 : u >> 4;
    if (across === 0) return T.heri;
    if (across === 15) return T.heriShade;
    if (along === 0 || along === 31) return T.seam;
    if (across === 1) return T.light;
    if (across % 3 === 2) return T.weave;
    return T.tones[(su * 3 + sv * 5 + mat) % T.tones.length];
  });
  shadeAlongWalls(grid);
}

function paintWalls(grid: PixelGrid) {
  const W = P.wall, S = P.wainscot;
  paintWallBoxes(grid, W);
  for (const [wall, wood, speckle] of [['left', S.left, W.speckle], ['right', S.right, W.speckleRight]] as const) {
    // a speckled plaster, a beam under the ceiling, a cedar wainscot of boards under its rail
    fillWall(grid, wall, 0, ROOM, 27, WALL_HEIGHT, (a, z) => ((a * 7 + z * 11) % 23 === 0 || (a * 5 + z * 3) % 37 === 0 ? speckle : null));
    wallPatch(grid, wall, 0, ROOM, WALL_HEIGHT - 9, WALL_HEIGHT - 4, W.beam[1]);
    wallPatch(grid, wall, 0, ROOM, WALL_HEIGHT - 5, WALL_HEIGHT - 4, W.beam[0]); wallPatch(grid, wall, 0, ROOM, WALL_HEIGHT - 9, WALL_HEIGHT - 8, W.beam[2]);
    wallPatch(grid, wall, 0, ROOM, 0, 24, wood);
    for (let a = 2; a < ROOM; a += 6) { wallPatch(grid, wall, a, a + 1, 3, 24, S.board); wallPatch(grid, wall, a + 1, a + 2, 3, 24, S.light); }
    wallPatch(grid, wall, 0, ROOM, 24, 27, S.rail); wallPatch(grid, wall, 0, ROOM, 26, 27, S.railLight);
    wallPatch(grid, wall, 0, ROOM, 0, 3, S.base);
    // the post in the corner
    wallPatch(grid, wall, 0, 3, 0, WALL_HEIGHT - 4, W.beam[1]); wallPatch(grid, wall, 2, 3, 0, WALL_HEIGHT - 4, W.beam[2]);
  }
}

/** A tower's lit windows: always the same for a tower, more of them at night. */
const litAt = (a: number, z: number, share: number) => ((a * 37 + z * 61 + ((a * z) % 13) * 7) % 100) < share;

/** The view through the window at `time`: the sky, the sun, the moon or the clouds, far towers in the haze, the red lattice tower, near towers and their windows. */
function paintView(grid: PixelGrid, time: CozyTime) {
  const wall: Wall = 'left', { a0, a1, z0, z1 } = VIEW, K = V[time], night = time === 'night', dusk = time === 'dusk';
  const within = [a0, a1, z0, z1] as const;
  fillWall(grid, wall, a0, a1, z0, z1, (_, z) => K.sky[Math.min(K.sky.length - 1, Math.floor((z1 - 1 - z) / ((z1 - z0) / K.sky.length)))]);
  if (night) {
    wallEllipse(grid, wall, 70, 78, 4, 4, V.moon, within); wallEllipse(grid, wall, 71.6, 79.2, 3.4, 3.4, K.sky[0], within);
    for (const [a, z] of [[38, 82], [46, 79], [52, 84], [60, 80], [64, 85], [42, 75], [75, 72], [57, 74]]) wallPixel(grid, wall, a, z, V.star);
  } else if (dusk) {
    wallEllipse(grid, wall, 46, 60, 7, 7, V.sunLow, within); wallEllipse(grid, wall, 46.6, 60.6, 4.6, 4.6, V.sunLowLight, within);
  } else {
    wallEllipse(grid, wall, 70, 78, 4.6, 4.6, V.sunGlow, within); wallEllipse(grid, wall, 70.4, 78.4, 3.2, 3.2, V.sun, within);
    for (const [ca, cz, size] of [[46, 78, 1], [60, 70, 0.7]] as const) {
      wallEllipse(grid, wall, ca, cz - 1, 6 * size, 2.2 * size, V.cloudShade, within); wallEllipse(grid, wall, ca, cz, 6 * size, 2.2 * size, V.cloud, within);
      wallEllipse(grid, wall, ca + 2 * size, cz + 1.6 * size, 3.2 * size, 2.2 * size, V.cloud, within);
    }
  }
  // the far towers, flat in the haze, a red light on the tallest
  for (const [t0, t1, top] of [[34, 40, 66], [40, 46, 73], [46, 51, 62], [51, 56, 77], [67, 72, 70], [72, 78, 64]] as const) {
    wallPatch(grid, wall, t0, t1, z0, top, K.far);
    if (top > 70 && time !== 'day') wallPixel(grid, wall, (t0 + t1) >> 1, top, V.beacon);
  }
  // the red lattice tower: its legs coming together, crossed, its two decks, its mast
  const middle = 61;
  for (let z = z0; z < 80; z++) {
    const half = Math.round(0.4 + (80 - z) * 0.16);
    for (let a = middle - half; a <= middle + half; a++) {
      const edge = a === middle - half || a === middle + half;
      if (edge || (a + z) % 3 === 0 || z % 6 === 0) wallPixel(grid, wall, a, z, V.tower[time]);
    }
  }
  for (const [z, half] of [[62, 3], [72, 2]] as const) wallPatch(grid, wall, middle - half, middle + half + 1, z, z + 2, V.deck[time]);
  wallPatch(grid, wall, middle, middle + 1, 80, 86, V.tower[time]);
  if (time !== 'day') wallPixel(grid, wall, middle, 85, V.beacon);
  // the near towers and their windows
  for (const [t0, t1, top] of [[34, 39, 56], [39, 45, 52], [45, 51, 60], [51, 56, 53], [56, 60, 49], [66, 71, 58], [71, 78, 52]] as const) {
    wallPatch(grid, wall, t0, t1, z0, top, K.near); wallPatch(grid, wall, t1 - 1, t1, z0, top, K.nearLight);
    wallPatch(grid, wall, t0, t1, top - 1, top, K.nearLight);
    const share = night ? 55 : dusk ? 28 : 0;
    for (let a = t0 + 1; a < t1 - 1; a += 2) for (let z = z0 + 2; z < top - 2; z += 3) {
      wallPixel(grid, wall, a, z, litAt(a, z, share) ? K.lit[(a + z) % K.lit.length] : K.window);
    }
  }
}

/** The window: its dark wood frame round the view of the hour, its two sliding panes, a rolled bamboo blind, a teru teru bozu, a daruma on the sill. */
function paintWindow(grid: PixelGrid, time: CozyTime) {
  const wall: Wall = 'left', S = P.window, B = P.sudare, T = P.teru;
  wallPatch(grid, wall, 31, 81, 41, 89, O);
  wallPatch(grid, wall, 32, 80, 42, 88, S.frame); wallPatch(grid, wall, 32, 80, 87, 88, S.frameLight); wallPatch(grid, wall, 79, 80, 42, 88, S.frameLight);
  paintView(grid, time);
  // the two panes overlap in the middle
  wallPatch(grid, wall, 55, 58, VIEW.z0, VIEW.z1, S.frame); wallPatch(grid, wall, 57, 58, VIEW.z0, VIEW.z1, S.frameLight);
  for (let step = 0; step < 5; step++) { wallPixel(grid, wall, 40 + step, 58 + step, V.glint); wallPixel(grid, wall, 66 + step, 52 + step, V.glint); }
  // the bamboo blind rolled up under the top of the frame, on its two cords
  wallPatch(grid, wall, 33, 79, 81, 86, B[1]); wallPatch(grid, wall, 33, 79, 85, 86, B[0]); wallPatch(grid, wall, 33, 79, 81, 82, B[2]);
  for (let a = 35; a < 78; a += 3) wallPatch(grid, wall, a, a + 1, 82, 85, B[2]);
  for (const a of [38, 74]) wallPatch(grid, wall, a, a + 1, 78, 86, P.teru.string);
  // the teru teru bozu hung from the blind, asking for a fine day
  wallPatch(grid, wall, 44, 45, 76, 81, T.string);
  wallEllipse(grid, wall, 44.5, 73, 3.6, 3.4, O); wallEllipse(grid, wall, 44.5, 73, 2.8, 2.6, T.body);
  for (let row = 0; row < 6; row++) { const half = 1 + Math.floor(row * 0.7); wallPatch(grid, wall, 44 - half - 1, 45 + half + 1, 69 - row, 70 - row, O); wallPatch(grid, wall, 44 - half, 45 + half, 69 - row, 70 - row, row === 5 ? T.shade : T.body); }
  wallPixel(grid, wall, 45, 73, T.face); wallPixel(grid, wall, 43, 73, T.face); wallPatch(grid, wall, 44, 45, 71, 72, T.face);
  wallPixel(grid, wall, 46, 72, T.cheek); wallPixel(grid, wall, 42, 72, T.cheek);
  ob(grid, 0, 6, 30, 82, 40, 3, S.sill, S.sillEdge);
  art(grid, (layer) => {
    const D = P.daruma, { x, y } = iso(3, 68, 43);
    layer.ellipse(x + 0.5, y - 4, 4.4, 4.6, D.body[1]); layer.ellipse(x - 0.5, y - 5, 2.6, 2.8, D.body[0], [D.body[1]]); layer.rect(x + 2, y - 6, 2, 5, D.body[2]);
    layer.ellipse(x + 0.5, y - 5, 2.6, 2, D.face); layer.set(x - 1, y - 5, O); layer.set(x + 2, y - 5, O);
    layer.rect(x - 1, y - 2, 3, 1, D.gold);
  });
}

/* Hung on the walls */

/** A neon sign's tubes (rows of '#', from the top, from the screen's left), a glow round them. */
function neon(grid: PixelGrid, wall: Wall, left: number, top: number, rows: readonly string[], tube: string, glow: string) {
  const lit: [number, number][] = [];
  rows.forEach((row, line) => { [...row].forEach((letter, column) => { if (letter === '#') lit.push([wall === 'right' ? left + column : left - column, top - line]); }); });
  const on = new Set(lit.map(([a, z]) => `${a},${z}`));
  for (const [a, z] of lit) for (const [da, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!on.has(`${a + da},${z + dz}`)) wallPixel(grid, wall, a + da, z + dz, glow);
  for (const [a, z] of lit) wallPixel(grid, wall, a, z, tube);
}

/** The dark plate a neon sign is mounted on, its screws in its corners. */
function neonPlate(grid: PixelGrid, wall: Wall, a0: number, a1: number, z0: number, z1: number) {
  const N = P.neon;
  wallPatch(grid, wall, a0 - 1, a1 + 1, z0 - 1, z1 + 1, O); wallPatch(grid, wall, a0, a1, z0, z1, N.plate);
  wallPatch(grid, wall, a0, a1, z1 - 1, z1, N.plateEdge);
  for (const a of [a0 + 1, a1 - 2]) for (const z of [z0 + 1, z1 - 2]) wallPixel(grid, wall, a, z, N.pin);
}

const RA = ['.###.', '.....', '#####', '....#', '..##.'];
const LONG = ['.....', '.....', '#####', '.....', '.....'];
const ME = ['....#', '.#.#.', '..#..', '.#.#.', '#....'];
const N_ = ['#....', '.#..#', '...#.', '..#..', '##...'];
const BOWL = ['.....#.#.', '....#.#..', '#########', '.#.....#.', '..#####..'];
/** "ラーメン" and a bowl in pink and yellow, over the kitchenette and the vending machine. */
function paintRamenSign(grid: PixelGrid) {
  const N = P.neon, wall: Wall = 'right';
  neonPlate(grid, wall, 31, 71, 63, 76);
  [RA, LONG, ME, N_].forEach((glyph, index) => { neon(grid, wall, 33 + index * 6, 72, glyph, N.pink, N.pinkGlow); });
  neon(grid, wall, 59, 72, BOWL, N.yellow, N.yellowGlow);
}

const TO = ['..#..', '..#..', '..##.', '..#.#', '..#..'];
const LONG_DOWN = ['..#..', '..#..', '..#..', '..#..', '..#..'];
const KI = ['..#..', '####.', '..#..', '#####', '..#..'];
const SMALL_YO = ['.###.', '...#.', '.###.', '...#.', '.###.'];
/** "トーキョー" down the left wall, between the corner and the window, in cyan. */
function paintTokyoSign(grid: PixelGrid) {
  const N = P.neon, wall: Wall = 'left';
  neonPlate(grid, wall, 11, 21, 46, 88);
  [TO, LONG_DOWN, KI, SMALL_YO, LONG_DOWN].forEach((glyph, index) => { neon(grid, wall, 18, 84 - index * 8, glyph, N.cyan, N.cyanGlow); });
}

/** A cherry blossom poster on the right wall: the sun, the snowy mountain, a branch in bloom, taped at its top. */
function paintPoster(grid: PixelGrid) {
  const wall: Wall = 'right', R = P.poster, a0 = 9, a1 = 29, z0 = 40, z1 = 80;
  wallPatch(grid, wall, a0 - 1, a1 + 1, z0 - 1, z1 + 1, O);
  fillWall(grid, wall, a0, a1, z0, z1, (_, z) => (z > z0 + 22 ? R.paper : R.glow));
  wallEllipse(grid, wall, 22.5, 63, 4.4, 4.4, R.sun);
  for (let z = z0 + 2; z < z0 + 18; z++) {
    const half = Math.round((z0 + 18 - z) * 1.05);
    wallPatch(grid, wall, Math.max(a0, 18 - half), Math.min(a1, 19 + half), z, z + 1, z > z0 + 12 - ((z * 3) % 2) ? R.snow : R.fuji);
    wallPatch(grid, wall, Math.min(a1, 19 + half) - Math.max(1, half >> 1), Math.min(a1, 19 + half), z, z + 1, z > z0 + 12 ? R.snow : R.fujiShade);
  }
  wallPatch(grid, wall, a0, a1, z0, z0 + 2, R.fujiShade);
  // the branch from the top left corner, its blossoms
  for (let step = 0; step < 14; step++) wallPixel(grid, wall, a0 + step, z1 - 3 - Math.floor(step * 0.6), R.branch);
  for (let step = 0; step < 5; step++) wallPixel(grid, wall, a0 + 6 + step, z1 - 7 + Math.floor(step * 0.5), R.branch);
  for (const [a, z] of [[a0 + 3, z1 - 3], [a0 + 7, z1 - 7], [a0 + 11, z1 - 4], [a0 + 13, z1 - 11], [a0 + 2, z1 - 7], [a0 + 16, z1 - 9]] as const) {
    for (const [da, dz] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) wallPixel(grid, wall, a + da, z + dz, R.blossom);
    wallPixel(grid, wall, a, z, R.blossomLight); wallPixel(grid, wall, a + 1, z - 1, R.blossomDeep);
  }
  for (const [a, z] of [[a0 + 5, z1 - 14], [a0 + 12, z1 - 18], [a0 + 8, z1 - 22]] as const) wallPixel(grid, wall, a, z, R.blossom);
  wallPatch(grid, wall, a0 + 1, a0 + 5, z1 - 1, z1 + 2, R.tape); wallPatch(grid, wall, a1 - 5, a1 - 1, z1 - 1, z1 + 2, R.tape);
}

/** The sliding shoji door, its two panels and their paper, under the indigo noren: a click goes through it, to the break room. */
const paintShoji: Painter = (grid) => {
  const D = P.door, { a0, a1, height } = DOOR, wall: Wall = 'left', middle = (a0 + a1) >> 1;
  wallPatch(grid, wall, a0 - 2, a1 + 2, 0, height + 3, O);
  wallPatch(grid, wall, a0 - 1, a1 + 1, 0, height + 2, D.frame); wallPatch(grid, wall, a0 - 1, a1 + 1, height + 1, height + 2, D.frameLight);
  for (const [p0, p1] of [[a0, middle + 1], [middle, a1]] as const) {
    wallPatch(grid, wall, p0, p1, 0, height, D.wood);
    wallPatch(grid, wall, p1 - 1, p1, 0, height, D.woodLight); wallPatch(grid, wall, p0, p0 + 1, 0, height, D.woodShade);
    // the wooden lower panel, the paper above it in its lattice
    wallPatch(grid, wall, p0 + 1, p1 - 1, 2, 14, D.koshi); wallPatch(grid, wall, p0 + 1, p1 - 1, 13, 14, D.woodLight);
    fillWall(grid, wall, p0 + 1, p1 - 1, 16, height - 2, (a, z) => {
      if ((a - p0) % 4 === 0 || (z - 16) % 9 === 8) return D.wood;
      return (z - 16) % 9 === 0 ? D.paperShade : D.paper;
    });
  }
  wallPatch(grid, wall, middle, middle + 1, 0, height, D.woodShade);
  // the pulls, where the panels meet
  for (const a of [middle - 2, middle + 2]) wallPatch(grid, wall, a, a + 1, 26, 30, D.pull);
  wallPatch(grid, wall, a0 - 1, a1 + 1, 0, 1, D.rail);
  // the noren: three panels of indigo cloth, a white crest across them
  const N = P.noren;
  for (let index = 0; index < 3; index++) {
    const p0 = a0 + index * 7, p1 = Math.min(a1, p0 + 6);
    wallPatch(grid, wall, p0, p1, height - 15, height, N[1]); wallPatch(grid, wall, p0, p0 + 1, height - 15, height, N[0]);
    wallPatch(grid, wall, p0, p1, height - 15, height - 14, N[2]);
  }
  wallPatch(grid, wall, a0 - 1, a1 + 1, height - 1, height, P.door.frameLight);
  wallEllipse(grid, wall, middle + 0.5, height - 7, 3, 3, P.norenInk); wallEllipse(grid, wall, middle + 0.5, height - 7, 1.6, 1.6, N[1]);
  wallPatch(grid, wall, middle - 6, middle - 3, height - 7, height - 6, P.norenInk); wallPatch(grid, wall, middle + 4, middle + 7, height - 7, height - 6, P.norenInk);
};

/** The genkan's stone mat in front of the door, two pairs of slippers on it, their toes towards the room. */
function paintGenkan(grid: PixelGrid) {
  const { a0, a1 } = DOOR, G = P.genkan;
  fillTop(grid, 1, 13, a0 + 1, a1 - 1, 0, (u, v) => (u === 1 || u === 12 || v === a0 + 1 || v === a1 - 2 ? G.edge : (u * 5 + v * 3) % 7 === 0 ? G.light : G.base));
  G.slippers.forEach(([upper, sole], pair) => {
    for (const side of [0, 3]) {
      const v0 = a0 + 4 + pair * 8 + side;
      fillTop(grid, 3, 10, v0, v0 + 2, 0, (u) => (u >= 6 ? upper : sole));
    }
  });
}

/** The cork board on the right wall, its notes, a photo and a sticker pinned on it: a click opens the board and its notes. */
const paintCorkBoard: Painter = (grid) => {
  const wall: Wall = 'right', B = P.board;
  wallPatch(grid, wall, 73, 123, 45, 87, O);
  wallPatch(grid, wall, 74, 122, 46, 86, B.frame); wallPatch(grid, wall, 74, 122, 85, 86, B.frameLight); wallPatch(grid, wall, 74, 75, 46, 86, B.frameLight);
  fillWall(grid, wall, 77, 119, 49, 83, (a, z) => ((a * 7 + z * 13) % 11 === 0 ? B.corkDark : (a * 3 + z * 5) % 17 === 0 ? B.corkLight : B.cork));
  // four notes, their lines and their pins
  for (const [n0, z0, index, pin] of [[80, 66, 0, 0], [93, 69, 1, 1], [80, 52, 2, 2], [106, 52, 3, 0]] as const) {
    wallPatch(grid, wall, n0 + 1, n0 + 12, z0 - 1, z0 + 11, B.corkDark);
    wallPatch(grid, wall, n0, n0 + 11, z0, z0 + 11, B.notes[index]);
    for (let line = 0; line < 3; line++) wallPatch(grid, wall, n0 + 2, n0 + 9 - ((line * 3 + index) % 4), z0 + 7 - line * 2, z0 + 8 - line * 2, B.ink);
    wallPixel(grid, wall, n0 + 5, z0 + 10, B.pins[pin]);
  }
  // a photo of a green hill under a blue sky
  wallPatch(grid, wall, 107, 118, 66, 80, B.photo);
  wallPatch(grid, wall, 108, 117, 70, 79, B.photoSky);
  fillWall(grid, wall, 108, 117, 70, 75, (a, z) => (z < 71 + Math.round(3 - Math.abs(a - 112) * 0.6) ? B.photoHill : null));
  wallPixel(grid, wall, 112, 79, B.pins[1]);
  // a sakura sticker
  for (const [da, dz] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) wallPixel(grid, wall, 99 + da, 58 + dz, B.sticker);
  wallPixel(grid, wall, 99, 58, B.stickerLight);
};

/** A black and red clock above the door. */
const CLOCK: WallClock = { wall: 'left', a: 112, z: 78, radius: 6, tones: P.clock };

/** The red paper lantern hung from the ceiling, its black caps and its tassel. */
function paintLantern(grid: PixelGrid) {
  const L = P.lantern, { x, y } = iso(LANTERN.u, LANTERN.v, LANTERN.z);
  for (let row = ceilingAt(x); row < y - 10; row++) grid.set(x, row, L.cord);
  art(grid, (layer) => {
    layer.ellipse(x + 0.5, y, 6.4, 8, L.paper[1]);
    layer.ellipse(x - 1, y - 1, 3.6, 6, L.paper[0], [L.paper[1]]);
    for (let dx = 3; dx <= 6; dx++) for (let dy = -8; dy <= 8; dy++) if (layer.get(x + dx, y + dy) === L.paper[1]) layer.set(x + dx, y + dy, L.paper[2]);
    for (const dy of [-5, -2, 1, 4]) for (let dx = -6; dx <= 6; dx++) if (layer.get(x + dx, y + dy)) layer.set(x + dx, y + dy, dx > 2 ? L.paper[2] : L.glow);
    layer.rect(x - 3, y - 10, 7, 3, L.band); layer.rect(x - 3, y + 7, 7, 3, L.band);
    layer.rect(x, y + 10, 1, 3, L.tassel); layer.rect(x - 1, y + 12, 3, 2, L.tassel);
  });
}

/* What stands on the floor */

/** The kitchenette: a cedar cabinet with its sliding doors, the rice cooker and a pile of cup noodles on its top. */
function paintKitchen(grid: PixelGrid) {
  const K = P.counter, { u0, u1, v0, v1 } = KITCHEN, front = v1 - 1;
  ob(grid, u0 + 1, u1, v0, front, 0, 20, K.body);
  for (const [d0, d1] of [[u0 + 3, u0 + 10], [u0 + 10, u1 - 2]] as const) {
    patchOnLeftFace(grid, front, d0, d1, 3, 18, K.door); onLeftFace(grid, front, d0, d1, 17, K.doorLight); patchOnLeftFace(grid, front, d0, d0 + 1, 3, 18, K.doorLight);
  }
  patchOnLeftFace(grid, front, u0 + 8, u0 + 9, 9, 12, K.pull); patchOnLeftFace(grid, front, u0 + 12, u0 + 13, 9, 12, K.pull);
  ob(grid, u0, u1, v0, v1, 20, 2, K.top, K.topEdge);
  // the rice cooker, its lid, its pink flower and its light
  ob(grid, u0 + 2, u0 + 10, v0 + 3, v0 + 11, 22, 7, K.cooker);
  art(grid, (layer) => {
    const { x, y } = iso(u0 + 6, v0 + 7, 29);
    layer.ellipse(x, y, 5.6, 2.8, K.cookerLid); layer.ellipse(x - 1, y - 1, 3, 1.4, K.cooker[0], [K.cookerLid]); layer.rect(x - 1, y - 2, 3, 1, K.cooker[2]);
  });
  onLeftFace(grid, v0 + 11, u0 + 4, u0 + 5, 26, K.cookerFlower); onLeftFace(grid, v0 + 11, u0 + 3, u0 + 6, 25, K.cookerFlower); onLeftFace(grid, v0 + 11, u0 + 8, u0 + 9, 25, K.cookerLed);
  // three cup noodles, one on two
  art(grid, (layer) => {
    const { x, y } = iso(u0 + 14, v0 + 8, 22);
    for (const [dx, dy] of [[-3, 0], [3, 0], [0, -6]] as const) {
      layer.rect(x + dx - 2, y + dy - 6, 5, 6, K.cup[1]); layer.rect(x + dx + 2, y + dy - 6, 1, 6, K.cup[2]); layer.rect(x + dx - 2, y + dy - 6, 1, 6, K.cup[0]);
      layer.rect(x + dx - 2, y + dy - 4, 5, 2, K.cupBand); layer.rect(x + dx - 2, y + dy - 7, 5, 1, K.cupLid);
    }
  });
}

/** The drinks vending machine: its lit window of cans and bottles, their buttons, the coins and the slot below. */
function paintVending(grid: PixelGrid) {
  const M = P.vending, { u0, u1, v0, v1, height } = VENDING, front = v1 - 1;
  ob(grid, u0, u1, v0, front, 0, height, M.body, M.edge);
  patchOnLeftFace(grid, front, u0 + 2, u1 - 2, 44, 48, M.header);
  for (let a = u0 + 4; a < u1 - 4; a += 4) onLeftFace(grid, front, a, a + 2, 46, M.logo);
  patchOnLeftFace(grid, front, u0 + 2, u1 - 2, 22, 43, M.panelShade);
  patchOnLeftFace(grid, front, u0 + 2, u1 - 2, 23, 43, M.panel);
  [34, 24].forEach((z, row) => {
    for (let index = 0, a = u0 + 3; a + 2 <= u1 - 3; index++, a += 3) {
      const drink = M.drinks[(index * 2 + row * 3) % M.drinks.length];
      patchOnLeftFace(grid, front, a, a + 2, z + 2, z + 8, drink); onLeftFace(grid, front, a, a + 1, z + 8, M.cap);
      onLeftFace(grid, front, a, a + 2, z, (index + row) % 3 === 0 ? M.buttonOff : M.button);
    }
  });
  // the coins on the right, the slot at the bottom
  patchOnLeftFace(grid, front, u1 - 7, u1 - 2, 11, 20, M.coin); patchOnLeftFace(grid, front, u1 - 5, u1 - 4, 15, 18, M.coinShade); onLeftFace(grid, front, u1 - 6, u1 - 3, 13, M.coinShade);
  patchOnLeftFace(grid, front, u0 + 3, u1 - 9, 4, 10, M.slot); patchOnLeftFace(grid, front, u0 + 3, u1 - 9, 8, 10, M.flap);
  // a sticker on its side
  patchOnRightFace(grid, u1, v0 + 4, front - 3, 28, 36, M.sticker); patchOnRightFace(grid, u1, v0 + 5, front - 4, 31, 33, M.logo);
}

/** The hot water pot on its stand, its flowers and its button, two tea cups beside it. */
function paintTea(grid: PixelGrid) {
  const K = P.tea, { u, v, width } = TEA;
  ob(grid, u, u + width, v, v + width, 0, 18, K.stand, K.standEdge);
  onLeftFace(grid, v + width, u + 1, u + width - 1, 9, K.stand[2]);
  art(grid, (layer) => {
    const { x, y } = iso(u + 5, v + 6, 18);
    layer.rect(x - 4, y - 13, 9, 13, K.pot); layer.rect(x + 3, y - 13, 2, 13, K.potShade);
    layer.ellipse(x + 0.5, y - 14, 4.6, 1.8, K.potTop); layer.rect(x - 1, y - 17, 3, 2, K.potShade);
    layer.rect(x - 5, y - 12, 1, 6, K.potShade); layer.rect(x + 5, y - 11, 1, 3, K.potShade);
    layer.points([[x - 2, y - 7], [x - 1, y - 8], [x, y - 7], [x - 1, y - 6]], K.flower); layer.points([[x + 1, y - 5], [x - 3, y - 5]], K.leaf);
    layer.set(x - 1, y - 11, K.button);
  });
  art(grid, (layer) => {
    const { x, y } = iso(u + 10, v + 2, 18);
    layer.rect(x - 1, y - 4, 3, 4, K.cup[1]); layer.set(x + 1, y - 4, K.cup[2]); layer.rect(x + 3, y - 3, 3, 3, K.cup[1]); layer.set(x + 5, y - 3, K.cup[2]);
  });
}

/** A lucky cat on the high tansu, its paw up. */
const maneki: Topper = (layer, x, y) => {
  const M = P.maneki;
  layer.ellipse(x + 0.5, y - 4, 4, 4, M.body); layer.rect(x + 2, y - 7, 2, 6, M.shade);
  layer.ellipse(x + 0.5, y - 10, 4, 3.4, M.body);
  layer.points([[x - 3, y - 13], [x - 3, y - 14], [x - 2, y - 13], [x + 3, y - 13], [x + 4, y - 14], [x + 4, y - 13]], M.body); layer.set(x - 3, y - 13, M.ear); layer.set(x + 3, y - 13, M.ear);
  layer.set(x - 1, y - 10, M.eye); layer.set(x + 2, y - 10, M.eye); layer.set(x + 2, y - 12, M.spot); layer.set(x + 3, y - 11, M.spot);
  layer.rect(x - 2, y - 7, 6, 1, M.collar); layer.set(x + 0, y - 6, M.bell); layer.set(x + 1, y - 6, M.bell);
  layer.rect(x - 5, y - 13, 2, 5, M.body); layer.set(x - 5, y - 13, M.shade);
};
/** A pile of manga on the low tansu. */
const manga: Topper = (layer, x, y) => {
  const [red, blue, yellow, green, page] = P.manga;
  layer.rect(x - 4, y - 2, 8, 2, red); layer.rect(x - 4, y - 2, 1, 2, page); layer.rect(x - 3, y - 4, 7, 2, blue); layer.rect(x - 3, y - 4, 1, 2, page);
  layer.rect(x - 4, y - 6, 8, 2, yellow); layer.rect(x + 3, y - 6, 1, 2, page); layer.rect(x - 2, y - 8, 6, 2, green); layer.rect(x + 3, y - 8, 1, 2, page);
};

const TANSU: readonly Drawers[] = DRAWERS.map((drawers, index) => ({ ...drawers, tones: P.tansu, topper: index ? manga : maneki }));

/** A cedar chest of drawers, black iron on its drawers' pulls. */
function paintTansu(grid: PixelGrid, tansu: Drawers) {
  paintDrawers(grid, tansu);
  const { u0, u1, v0, v1, height, face } = tansu, step = Math.floor(height / 3), [a0, a1] = face === 'left' ? [u0, u1] : [v0, v1], middle = (a0 + a1) >> 1;
  for (let index = 0; index < 3; index++) {
    const z = index * step + (step >> 1);
    if (face === 'left') patchOnLeftFace(grid, v1, middle - 2, middle + 2, z, z + 2, P.iron);
    else patchOnRightFace(grid, u1, middle - 2, middle + 2, z, z + 2, P.iron);
  }
}

/** Bamboo in a blue glazed pot, in the corner. */
function paintBamboo(grid: PixelGrid) {
  const B = P.bamboo, { x, y } = iso(BAMBOO.u, BAMBOO.v);
  for (const [dx, top, lean] of [[-3, 60, -2], [0, 68, 1], [3, 54, 3]] as const) {
    art(grid, (layer) => {
      for (let row = 10; row < top; row++) {
        const sx = x + dx + Math.round((lean * (row - 10)) / top);
        layer.set(sx, y - row, row % 11 === 0 ? B.node : B.stalk[1]); layer.set(sx + 1, y - row, row % 11 === 0 ? B.node : B.stalk[2]);
        if (row % 11 !== 0) layer.set(sx, y - row, B.stalk[0]);
      }
    });
  }
  art(grid, (layer) => {
    for (const [dx, dy, angle, tone] of [[-8, -60, 0.5, 1], [-5, -64, -0.4, 0], [2, -70, 0.4, 1], [6, -66, -0.5, 2], [-2, -56, -0.6, 2], [8, -54, 0.5, 0], [-7, -50, 0.3, 2], [5, -46, -0.3, 1], [1, -62, 0.1, 0]] as const) {
      layer.turnedEllipse(x + dx, y + dy, 4, 1.4, angle, B.leaves[tone]);
    }
  });
  art(grid, (layer) => {
    for (let row = 0; row < 10; row++) {
      const half = row < 2 ? 7 : 6 - Math.floor((row - 2) / 4);
      for (let dx = -half; dx < half; dx++) layer.set(x + dx, y - 10 + row, dx < -half + 2 ? B.pot[0] : dx >= half - 3 ? B.pot[2] : B.pot[1]);
    }
    layer.rect(x - 7, y - 10, 14, 1, B.potRim); layer.rect(x - 6, y - 9, 12, 1, B.soil);
  });
}

/** The andon: a paper lantern on four wooden legs, lit at dusk and at night. */
function paintAndon(grid: PixelGrid) {
  const A = P.andon, { x, y } = iso(LAMP.u, LAMP.v);
  art(grid, (layer) => {
    for (const dx of [-5, 4]) layer.rect(x + dx, y - 10, 2, 10, A.wood[1]);
    layer.rect(x - 1, y - 8, 2, 8, A.wood[2]);
    layer.rect(x - 6, y - 36, 13, 26, A.paper); layer.rect(x - 5, y - 35, 4, 24, A.paperLight); layer.rect(x + 3, y - 35, 3, 24, A.paperShade);
    for (const dy of [-36, -24, -11]) layer.rect(x - 6, y + dy, 13, 1, A.wood[1]);
    for (const dx of [-6, 0, 6]) layer.rect(x + dx, y - 36, 1, 26, dx > 0 ? A.wood[2] : A.wood[0]);
    layer.rect(x - 7, y - 38, 15, 2, A.wood[1]); layer.rect(x - 7, y - 38, 15, 1, A.wood[0]);
  });
}

/** The indigo couch, an onigiri pillow on it. */
function paintTokyoCouch(grid: PixelGrid) {
  const couch = office.couch, K = P.onigiri;
  paintCouch(grid, couch, P.couch, 2, null);
  art(grid, (layer) => {
    const { x, y } = iso(...onCouchAt(couch, 10, 16), 13);
    for (let row = 0; row < 9; row++) { const half = 1 + Math.floor(row * 0.6); layer.rect(x - half, y - 10 + row, 2 * half + 1, 1, K.rice); }
    layer.rect(x + 3, y - 5, 3, 4, K.riceShade); layer.set(x, y - 10, K.riceShade);
    layer.rect(x - 2, y - 4, 5, 3, K.nori);
    layer.set(x - 2, y - 7, K.nori); layer.set(x + 2, y - 7, K.nori); layer.set(x - 3, y - 6, K.cheek); layer.set(x + 3, y - 6, K.cheek);
  });
}

/* The tables' things */

/** A bowl of ramen, its egg and its naruto, chopsticks across it. */
const ramen: Topper = (layer, x, y) => {
  const R = P.ramen;
  layer.rect(x - 3, y - 5, 7, 1, R.rim); layer.rect(x - 3, y - 4, 7, 2, R.bowl); layer.rect(x - 2, y - 2, 5, 1, R.bowlShade); layer.rect(x - 1, y - 1, 3, 1, R.bowlShade);
  layer.rect(x - 2, y - 6, 5, 1, R.broth); layer.set(x - 2, y - 6, R.noodle); layer.set(x, y - 6, R.noodle); layer.set(x + 1, y - 6, R.egg); layer.set(x + 2, y - 6, R.yolk); layer.set(x - 1, y - 7, R.naruto);
  layer.line(x - 1, y - 9, x + 4, y - 6, R.chopsticks);
};
/** A bento box: rice and its plum, salmon, egg and greens. */
const bento: Topper = (layer, x, y) => {
  const B = P.bento;
  layer.rect(x - 4, y - 4, 9, 4, B.box); layer.rect(x - 4, y - 1, 9, 1, B.lid);
  layer.rect(x - 3, y - 4, 3, 3, B.rice); layer.set(x - 2, y - 3, B.plum);
  layer.rect(x + 1, y - 4, 3, 1, B.salmon); layer.rect(x + 1, y - 3, 2, 1, B.egg); layer.set(x + 3, y - 3, B.green); layer.rect(x + 1, y - 2, 3, 1, B.green);
};

/* What shines */

const stringsOf = (value: unknown): string[] => (typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value).flatMap(stringsOf) : []);
const N = P.neon, M = P.vending;
const GLOW: readonly string[] = [N.pink, N.pinkGlow, N.cyan, N.cyanGlow, N.yellow, N.yellowGlow, M.panel, M.panelShade, M.header, M.button, ...M.drinks, M.cap, ...P.lantern.paper, P.lantern.glow, P.counter.cookerLed];
const SKY: readonly string[] = stringsOf(V);

export const tokyo: AmbianceDesign = {
  ...office,
  id: 'tokyo',
  deskStyle: {
    top: P.desk.top, topEdge: P.desk.edge, leg: P.desk.leg, drawers: null, monitor: P.desk.monitor, monitorEdge: P.desk.monitorEdge, stand: P.desk.stand,
    vents: P.desk.vents, keyboard: P.desk.keyboard, key: P.desk.key, seats: P.seats, chairBase: P.chair.base, chairPole: P.chair.pole, backThing: ramen, sideThing: bento,
  },
  paintCouch: paintTokyoCouch,
  paintCouchArm: (grid) => paintCouchArm(grid, office.couch, P.couch),
  paintDoor: paintShoji,
  paintBoard: paintCorkBoard,
  clock: CLOCK,
  footprints: [
    around(BAMBOO.u, BAMBOO.v, 6, 64),
    { ...KITCHEN, height: 38 },
    { u0: VENDING.u0, u1: VENDING.u1, v0: VENDING.v0, v1: VENDING.v1, height: VENDING.height + 6 },
    { u0: TEA.u, u1: TEA.u + TEA.width, v0: TEA.v, v1: TEA.v + TEA.width, height: 40 },
    ...TANSU.map(({ u0, u1, v0, v1, height }) => ({ u0, u1, v0, v1, height: height + 12 })),
    around(LAMP.u, LAMP.v, 4, 42),
  ],
  paintRoom(grid, time) {
    paintTatami(grid);
    paintWalls(grid);
    paintWindow(grid, time);
    paintPoster(grid);
    paintRamenSign(grid);
    paintTokyoSign(grid);
  },
  dress(grid) {
    paintLantern(grid);
    paintGenkan(grid);
  },
  standing: [
    standing(BAMBOO.u, BAMBOO.u, BAMBOO.v, BAMBOO.v, paintBamboo),
    standing(KITCHEN.u0, KITCHEN.u1, KITCHEN.v0, KITCHEN.v1, paintKitchen),
    standing(VENDING.u0, VENDING.u1, VENDING.v0, VENDING.v1, paintVending),
    standing(TEA.u, TEA.u + TEA.width, TEA.v, TEA.v + TEA.width, paintTea),
    ...TANSU.map((tansu) => standing(tansu.u0, tansu.u1, tansu.v0, tansu.v1, (grid) => paintTansu(grid, tansu))),
    standing(LAMP.u, LAMP.u, LAMP.v, LAMP.v, paintAndon),
  ],
  light: { lamp: LAMP, lampColour: P.light.lamp, ambient: P.light, lampGlow: [P.andon.paper, P.andon.paperLight, P.andon.paperShade], glow: GLOW, sky: SKY },
};
