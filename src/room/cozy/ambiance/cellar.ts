// The wine and cheese cellar (ambiance 'cellar'), furnished where the offices are (office.ts: the same desks, couch,
// door and walks): brick walls in vaulted bays between stone piers, bulbs strung along the arches, a stone floor, a
// small high window at ground level (the grass, the sky of the hour), an oak door under its arch, a cork board of
// tasting notes, a tall wine rack, a cheese counter with its shelves of wheels and bottles above it, a cask with its tap,
// a crate of bottles, a barrel for a table, an iron candle stand, a burgundy chesterfield, a kilim, oak desks.
import { COZY_AMBIANCE_PALETTE, COZY_PALETTE as C } from '../../../design/room-palette.ts';
import type { WallClock } from '../clock.ts';
import { DOOR, ceilingAt, paintCouch, paintCouchArm, paintWallBoxes, shadeAlongWalls, standing, type Topper } from '../decor.ts';
import { ROOM_UNITS as ROOM, WALL_HEIGHT, around, iso, onCouchAt } from '../geometry.ts';
import {
  fillLeftFace, fillRightFace, fillTop, fillWall, onLeftFace, onRightFace, outlined, outlinedBox, patchOnLeftFace, tint, wallEllipse, wallPatch, wallPixel,
  type Painter, type PixelGrid, type Tones, type Wall,
} from '../pixels.ts';
import type { CozyTime } from '../time.ts';
import type { AmbianceDesign } from './index.ts';
import { BACK_RIGHT, COOLER, COUNTER, LAMP, office } from './office.ts';

const P = COZY_AMBIANCE_PALETTE.cellar, O = C.outline, V = P.view;
const ob = (grid: PixelGrid, u0: number, u1: number, v0: number, v1: number, z: number, height: number, tones: Tones, edge?: string) => outlinedBox(grid, u0, u1, v0, v1, z, height, tones, O, edge);
const art = (grid: PixelGrid, draw: (layer: PixelGrid) => void) => outlined(grid, draw, O);
/** A small number that stays the same for a spot: which brick, stone or bottle it is. */
const pick = (a: number, b: number, count: number) => (((a * 73856093) ^ (b * 19349663)) >>> 0) % count;

/* Where things are, in the room's units */

/** The tall wine rack in the back corner, where the offices' monstera is. */
const RACK = { u0: 0, u1: 11, v0: 2, v1: 30, height: 58 } as const;
/** The cask on its cradle in the back right corner, where the offices' water cooler is: its tap towards the room. */
const CASK = COOLER;
/** The crate of bottles where the offices' lemon drawers are, the barrel table where their mint ones are. */
const CRATE = { u0: 78, u1: 90, v0: 2, v1: 12, height: 12 } as const;
const BARREL = { u0: 2, u1: 14, v0: 82, v1: 96, height: 20 } as const;
/** The kilim in the middle of the room. */
const RUG = { u0: 30, u1: 74, v0: 74, v1: 114 } as const;
/** The two bulbs hanging over the cheese counter: (u, v) and how high. */
const PENDANTS = [[34, 9, 64], [66, 9, 64]] as const;

/** Where the arches spring from, the stone piers between the bays (`a` along each wall), and the plinth's height. */
const SPRING = 70, PLINTH = 12, ARCH_BAND = 5;
const PIERS: Readonly<Record<Wall, readonly (readonly [number, number])[]>> = {
  left: [[0, 6], [94, 100], [124, ROOM]],
  right: [[0, 6], [74, 80], [122, ROOM]],
};
/** The bays between the piers: their middle, half their width and the height of their arch above SPRING. */
const baysOf = (wall: Wall) => PIERS[wall].slice(1).map(([a0], index) => {
  const start = PIERS[wall][index][1], half = (a0 - start) / 2;
  return { start, end: a0, middle: start + half, half, rise: Math.min(24, half) };
});
const BAYS = { left: baysOf('left'), right: baysOf('right') } as const;

/** The high window on the left wall, over the couch: its middle, its sides, its foot, where its round top starts. */
const WINDOW = { a: 52, a0: 41, a1: 63, z0: 56, z1: 72, rise: 7 } as const;

/* The room */

function paintStoneFloor(grid: PixelGrid) {
  const F = P.floor;
  // flagstones in rows along u, 16 by 12, each row shifted by half a stone
  fillTop(grid, 0, ROOM, 0, ROOM, 0, (u, v) => {
    const row = Math.floor(v / 12), shift = row % 2 ? 8 : 0, column = Math.floor((u + shift) / 16), lu = (u + shift) % 16, lv = v % 12;
    if (lu === 0 || lv === 0) return F.seam;
    const tone = F.tones[pick(column, row, F.tones.length)];
    if (lu === 1 || lv === 1) return F.light;
    if (lu === 15 || lv === 11) return tint(tone, 0.94);
    if (pick(column, row, 7) === 2 && lu - 3 === Math.floor(lv * 0.8) && lv > 2 && lv < 9) return F.crack;
    if ((u * 7 + v * 13) % 23 === 0) return F.speckle;
    return tone;
  });
  shadeAlongWalls(grid);
}

/** A brick of a wall at (a, z): three pixels high, eight long, each row shifted by half a brick; `recess`: inside a bay. */
function brickAt(a: number, z: number, recess: boolean): string {
  const B = P.brick, row = Math.floor(z / 4), shift = row % 2 ? 4 : 0;
  if (z % 4 === 3 || (a + shift) % 8 === 7) return recess ? tint(B.mortar, B.recess) : B.mortar;
  const tone = B.tones[pick(Math.floor((a + shift) / 8), row, B.tones.length)];
  const lit = z % 4 === 2 && (a + shift) % 8 < 5 ? B.light : tone;
  return recess ? tint(lit, B.recess) : lit;
}

/** A stone of a pier or of the plinth, in rows `high` pixels tall, `long` long. */
function blockAt(a: number, z: number, high: number, long: number, tones: readonly string[], joint: string, light: string): string {
  const row = Math.floor(z / high), shift = row % 2 ? long >> 1 : 0, along = (a + shift) % long;
  if (z % high === high - 1 || along === long - 1) return joint;
  if (z % high === high - 2) return light;
  return tones[pick(Math.floor((a + shift) / long), row, tones.length)];
}

/** What a back wall shows at (a, z): the plinth, a pier and its cap, an arch's stones, the bricks of a bay. */
function wallAt(wall: Wall, a: number, z: number): string {
  if (z < PLINTH) return blockAt(a + 3, z, 6, 11, P.plinth.stones, P.plinth.joint, P.plinth.light);
  const R = P.pier, pier = PIERS[wall].find(([p0, p1]) => a >= p0 && a < p1);
  if (pier) {
    if (z >= SPRING - 4 && z < SPRING) return z === SPRING - 1 ? R.cap : z === SPRING - 4 ? R.capShade : R.cap;
    const stone = blockAt(a - pier[0], z - PLINTH, 8, 7, R.stones, R.joint, R.light);
    if (a === pier[0] && pier[0] > 0) return R.shade;
    return stone;
  }
  const bay = BAYS[wall].find(({ start, end }) => a >= start && a < end);
  if (!bay || z < SPRING) return brickAt(a, z, !!bay);
  const da = (a + 0.5 - bay.middle) / bay.half, dz = (z + 0.5 - SPRING) / bay.rise;
  const inner = da * da + dz * dz;
  if (inner < 1) return brickAt(a, z, true);
  const oa = (a + 0.5 - bay.middle) / (bay.half + ARCH_BAND), oz = (z + 0.5 - SPRING) / (bay.rise + ARCH_BAND);
  if (oa * oa + oz * oz >= 1) return brickAt(a, z, false);
  // the arch's stones, a keystone at the top, a joint between each two
  const A = P.arch, angle = Math.atan2(dz, da), count = Math.max(5, Math.round(bay.half / 4) * 2 + 1), at = (angle / Math.PI) * count;
  const index = Math.floor(at), fraction = at - index;
  if (fraction < 0.16 && index > 0) return A.joint;
  if (index === (count - 1) / 2) return A.keystone;
  if (inner < 1.12) return A.shade;
  return A.stones[index % 2];
}

function paintBrickWalls(grid: PixelGrid) {
  paintWallBoxes(grid, P.wall);
  for (const wall of ['left', 'right'] as const) {
    const darker = wall === 'right' ? 0.92 : 1;
    fillWall(grid, wall, 0, ROOM, 0, WALL_HEIGHT, (a, z) => (darker === 1 ? wallAt(wall, a, z) : tint(wallAt(wall, a, z), darker)));
  }
}

/** Whether (a, z) of the left wall is in the window grown by `margin`: its square foot, its round top. */
function inWindow(a: number, z: number, margin: number) {
  const { a: middle, a0, a1, z0, z1, rise } = WINDOW, half = (a1 - a0) / 2 + margin;
  if (a < a0 - margin || a >= a1 + margin || z < z0 - margin) return false;
  if (z < z1) return true;
  const da = (a + 0.5 - middle) / half, dz = (z + 0.5 - z1) / (rise + margin);
  return da * da + dz * dz < 1;
}

/**
 * The window at ground level at `time`: the sky of the hour, the sun high by day, low and orange at dusk, the moon, the
 * stars and two fireflies at night, the grass and a buttercup at the bottom; its iron bars, its stone surround, its sill.
 */
function paintHighWindow(grid: PixelGrid, time: CozyTime) {
  const wall: Wall = 'left', W = P.window, { a, a0, a1, z0, z1, rise } = WINDOW, top = z1 + rise, sky = V[time], grass = V.grass[time];
  const within = (paint: (pa: number, pz: number) => string | null, margin = 0) => fillWall(grid, wall, a0 - 4, a1 + 4, z0 - 4, top + 4, (pa, pz) => (inWindow(pa, pz, margin) ? paint(pa, pz) : null));
  within(() => O, 3);
  within((pa, pz) => W.frame[Math.floor((pa + pz * 2) / 5) % 2], 2);
  within((_, pz) => sky[Math.min(sky.length - 1, Math.max(0, Math.floor((top - pz) / ((top - z0) / sky.length))))]);
  const glass = [a0, a1, z0, top] as const;
  if (time === 'day') {
    wallEllipse(grid, wall, a - 5, z1 + 1, 3.2, 3.2, V.sun, glass);
    wallEllipse(grid, wall, a + 6, z1 - 3, 3.6, 1.6, V.cloud, glass); wallEllipse(grid, wall, a + 4, z1 - 2, 2.2, 1.6, V.cloud, glass);
  } else if (time === 'dusk') {
    wallEllipse(grid, wall, a + 4, z0 + 6, 4.6, 4.6, V.sunLow, glass); wallEllipse(grid, wall, a + 4.4, z0 + 6.6, 3, 3, V.sunLowLight, glass);
  } else {
    wallEllipse(grid, wall, a - 5, z1 + 1, 3.2, 3.2, V.moon, glass); wallEllipse(grid, wall, a - 6.4, z1 + 2, 2.6, 2.6, sky[0], glass);
    wallPixel(grid, wall, a - 4, z1, V.moonShade);
    for (const [sa, sz] of [[a + 4, z1 + 3], [a + 8, z1 - 2], [a - 1, z1 - 4], [a + 2, z1 + 6], [a - 8, z1 - 6]] as const) if (inWindow(sa, sz, 0)) wallPixel(grid, wall, sa, sz, V.star);
  }
  // the grass along the foot of the glass, blade by blade, and a buttercup in it (fireflies over it at night)
  within((pa, pz) => {
    const blade = 3 + ((pa * 5) % 4) - (pa % 3 === 0 ? 1 : 0);
    return pz < z0 + blade ? grass[pz < z0 + 2 || (pa + pz) % 3 === 0 ? 1 : 0] : null;
  });
  if (time === 'night') { wallPixel(grid, wall, a + 5, z0 + 6, V.firefly); wallPixel(grid, wall, a - 7, z0 + 8, V.firefly); }
  else {
    wallPatch(grid, wall, a1 - 6, a1 - 5, z0 + 3, z0 + 6, grass[1]);
    for (const [fa, fz] of [[a1 - 6, z0 + 7], [a1 - 7, z0 + 6], [a1 - 5, z0 + 6], [a1 - 6, z0 + 5]] as const) wallPixel(grid, wall, fa, fz, V.flower);
    wallPixel(grid, wall, a1 - 6, z0 + 6, V.flowerHeart);
  }
  // the deep reveal along the top of the glass, the iron bars
  within((pa, pz) => (!inWindow(pa, pz + 1, 0) || !inWindow(pa + 1, pz, 0) ? W.reveal : null));
  within((pa, pz) => {
    const upright = pa === a0 + 5 || pa === a || pa === a1 - 6, across = pz === z0 + 9;
    if (!upright && !across) return null;
    return upright && pa === a ? W.barLight : W.bar;
  });
  ob(grid, 0, 5, a0 - 4, a1 + 4, z0 - 7, 3, W.sill, W.sillEdge);
  // a candle in an old bottle on the sill, its wax run down its neck
  art(grid, (layer) => candleBottle(layer, ...xy(iso(2, a0, z0 - 4)), P.bottles[0]));
}

const xy = ({ x, y }: { x: number; y: number }): [number, number] => [x, y];

/** The oak door under its stone arch: planks, two iron straps, a grille to look through, a ring: a click goes through it. */
const paintOakDoor: Painter = (grid) => {
  const D = P.door, wall: Wall = 'left', { a0, a1, height } = DOOR, middle = (a0 + a1) / 2, half = (a1 - a0) / 2, rise = 9, spring = height - rise;
  const inDoor = (a: number, z: number, margin: number) => {
    if (a < a0 - margin || a >= a1 + margin || z < 0) return false;
    if (z < spring) return true;
    const da = (a + 0.5 - middle) / (half + margin), dz = (z + 0.5 - spring) / (rise + margin);
    return da * da + dz * dz < 1;
  };
  const fill = (margin: number, paint: (a: number, z: number) => string | null) => fillWall(grid, wall, a0 - 4, a1 + 4, 0, height + 4, (a, z) => (inDoor(a, z, margin) ? paint(a, z) : null));
  fill(3, () => O);
  fill(2, (a, z) => D.stone[Math.floor((a + (z >> 2) * 3) / 4) % 2]);
  fill(0, (a, z) => {
    const plank = Math.floor((a - a0) / 5), along = (a - a0) % 5;
    if (along === 4) return D.seam;
    if (!inDoor(a, z + 1, 0)) return D.seam;
    return along === 0 ? D.leaf[0] : D.leaf[plank % 2 ? 2 : 1];
  });
  for (const z of [10, 40]) {
    wallPatch(grid, wall, a0, a1, z, z + 3, D.strap); wallPatch(grid, wall, a0, a1, z + 2, z + 3, D.strapLight);
    for (let a = a0 + 2; a < a1; a += 5) wallPixel(grid, wall, a, z + 1, D.rivet);
  }
  // the grille, the ring and its plate
  wallPatch(grid, wall, middle - 3, middle + 3, 46, 53, D.strap); wallPatch(grid, wall, middle - 2, middle + 2, 47, 52, D.grille);
  for (const a of [middle - 1, middle + 1]) wallPatch(grid, wall, a, a + 1, 47, 52, D.strapLight);
  const ring = a0 + 4;
  wallPatch(grid, wall, ring - 1, ring + 2, 30, 33, D.strap);
  for (const [ra, rz] of [[ring - 1, 28], [ring - 1, 27], [ring, 26], [ring + 1, 27], [ring + 1, 28], [ring, 29]] as const) wallPixel(grid, wall, ra, rz, D.ring);
  wallPixel(grid, wall, ring, 26, D.ringShade);
};

/** A worn stone step and a jute mat in front of the door. */
function paintDoorstep(grid: PixelGrid) {
  const { a0, a1 } = DOOR, D = P.door;
  fillTop(grid, 0, 3, a0 - 1, a1 + 1, 0, (u, v) => (u === 2 || v === a0 - 1 || v === a1 ? D.step[2] : (u + v) % 5 === 0 ? D.step[0] : D.step[1]));
  fillTop(grid, 4, 13, a0 + 1, a1 - 1, 0, (u, v) => (u === 4 || u === 12 || v === a0 + 1 || v === a1 - 2 ? D.mat[2] : (u + v * 2) % 4 === 0 ? D.mat[0] : D.mat[1]));
}

/** The cork board of tasting notes on the right wall, in its bay: a click opens the board and its notes. */
const paintCorkBoard: Painter = (grid) => {
  const wall: Wall = 'right', B = P.board, a0 = 84, a1 = 120, z0 = 40, z1 = 74;
  wallPatch(grid, wall, a0 - 1, a1 + 1, z0 - 1, z1 + 1, O);
  wallPatch(grid, wall, a0, a1, z0, z1, B.frame); wallPatch(grid, wall, a0, a1, z1 - 1, z1, B.frameLight); wallPatch(grid, wall, a0, a0 + 1, z0, z1, B.frameLight);
  fillWall(grid, wall, a0 + 2, a1 - 2, z0 + 2, z1 - 2, (a, z) => ((a * 5 + z * 11) % 13 === 0 ? B.corkDot : (a * 7 + z * 3) % 17 === 0 ? B.corkLight : B.cork));
  const note = (n0: number, n1: number, m0: number, m1: number, paper: string, pin: string) => {
    wallPatch(grid, wall, n0 + 1, n1 + 1, m0 - 1, m1 - 1, B.corkDot);
    wallPatch(grid, wall, n0, n1, m0, m1, paper); wallPatch(grid, wall, n0, n1, m0, m0 + 1, B.paperShade);
    const middle = (n0 + n1) >> 1;
    wallPatch(grid, wall, middle, middle + 2, m1 - 2, m1, pin);
  };
  // a tasting note with its lines
  note(87, 99, 55, 71, B.paper, B.pins[0]);
  for (const [length, z] of [[8, 66], [6, 63], [9, 60], [5, 57]] as const) wallPatch(grid, wall, 89, 89 + length, z, z + 1, z === 66 ? B.ink : B.inkFaint);
  // a wine label: its burgundy band, its gold rule, a bunch of grapes
  note(102, 112, 56, 71, B.paper, B.pins[1]);
  wallPatch(grid, wall, 102, 112, 64, 67, B.label); wallPatch(grid, wall, 103, 111, 63, 64, B.gold);
  for (const [ga, gz] of [[105, 61], [107, 61], [106, 60], [108, 60], [104, 60], [106, 59], [107, 58], [105, 58], [106, 57]] as const) wallPixel(grid, wall, ga, gz, B.grape);
  wallPixel(grid, wall, 107, 62, B.leaf); wallPixel(grid, wall, 108, 62, B.leaf);
  // a pink note with three ticks, a card with a wedge of cheese
  note(89, 99, 43, 53, B.pink, B.pins[2]);
  for (const z of [49, 46]) { wallPixel(grid, wall, 90, z, B.label); wallPixel(grid, wall, 91, z - 1, B.label); wallPixel(grid, wall, 92, z, B.label); wallPatch(grid, wall, 94, 98, z, z + 1, B.inkFaint); }
  note(104, 117, 43, 53, B.paper, B.pins[0]);
  for (let step = 0; step < 6; step++) wallPatch(grid, wall, 106 + step, 116, 45 + step, 46 + step, step === 0 ? B.cheeseShade : B.cheese);
  for (const [ha, hz] of [[112, 46], [114, 48], [110, 47]] as const) wallPixel(grid, wall, ha, hz, B.cheeseShade);
};

/** An iron clock in the first arch on the right wall, over the cheese counter. */
const CLOCK: WallClock = { wall: 'right', a: 40, z: 80, radius: 6, tones: P.clock };

/* Hung on the walls, lying on the floor */

/** A string of bulbs along the inside of each arch, a bulb hanging from it every few stones. */
function paintArchBulbs(grid: PixelGrid) {
  const L = P.bulb;
  for (const wall of ['left', 'right'] as const) for (const bay of BAYS[wall]) {
    const ra = bay.half - 1.5, rz = bay.rise - 1.5, count = Math.max(3, Math.round(bay.half / 8));
    for (let step = 0; step <= 60; step++) {
      const angle = Math.PI * (0.16 + (0.68 * step) / 60);
      wallPixel(grid, wall, Math.floor(bay.middle + Math.cos(angle) * ra), Math.floor(SPRING + Math.sin(angle) * rz), L.cord);
    }
    for (let index = 0; index < count; index++) {
      const angle = Math.PI * (0.2 + (0.6 * (index + 0.5)) / count), ba = Math.floor(bay.middle + Math.cos(angle) * ra), bz = Math.floor(SPRING + Math.sin(angle) * rz);
      wallPixel(grid, wall, ba, bz - 1, L.cap);
      wallPatch(grid, wall, ba - 1, ba + 1, bz - 4, bz - 1, L.glass); wallPixel(grid, wall, ba, bz - 3, L.filament);
    }
  }
}

/** An Edison bulb hanging from the ceiling on its cord, in a little iron cage. */
function paintPendant(grid: PixelGrid, u: number, v: number, z: number) {
  const L = P.bulb, { x, y } = iso(u, v, z);
  for (let row = ceilingAt(x); row < y - 7; row++) grid.set(x, row, L.cord);
  art(grid, (layer) => {
    layer.rect(x - 1, y - 7, 3, 2, L.cap);
    layer.rect(x - 2, y - 5, 5, 4, L.glass); layer.rect(x - 1, y - 1, 3, 1, L.glass);
    layer.points([[x, y - 4], [x - 1, y - 3], [x + 1, y - 3], [x, y - 2]], L.filament);
    layer.points([[x - 2, y - 5], [x - 2, y - 2], [x + 2, y - 5], [x + 2, y - 2], [x, y]], P.candle.iron[1]);
  });
}

/** The shelf on the right wall over the cheese counter: its brackets, three bottles and two wheels on it. */
function paintCheeseShelf(grid: PixelGrid) {
  const S = P.shelf, wall: Wall = 'right';
  for (const a of [38, 66]) { wallPatch(grid, wall, a, a + 2, 42, 48, S[2]); wallPatch(grid, wall, a, a + 1, 44, 48, S[1]); }
  ob(grid, 35, 71, 0, 5, 48, 2, S, P.shelfEdge);
  art(grid, (layer) => {
    for (const [index, u] of [39, 43, 47].entries()) bottle(layer, ...xy(iso(u, 3, 50)), P.bottles[index], P.foil[index]);
  });
  art(grid, (layer) => { const { x, y } = iso(57, 3, 50); wheel(layer, x, y, 5, 3, P.cheese.gold); });
  art(grid, (layer) => { const { x, y } = iso(65, 3, 50); wheel(layer, x, y, 4, 3, P.cheese.wax); wheel(layer, x, y - 3, 3, 2, P.cheese.orange); });
}

/** A little mouse hole in the plinth of the right wall, two eyes in it. */
function paintMouseHole(grid: PixelGrid) {
  const M = P.mouse, wall: Wall = 'right';
  fillWall(grid, wall, 96, 103, 0, 6, (a, z) => {
    const da = (a + 0.5 - 99.5) / 3.6, dz = (z + 0.5) / 6;
    return da * da + dz * dz < 1 ? M.hole : da * da + dz * dz < 1.35 ? O : null;
  });
  wallPixel(grid, wall, 98, 2, M.eye); wallPixel(grid, wall, 101, 2, M.eye);
  wallPixel(grid, wall, 98, 3, M.fur); wallPixel(grid, wall, 101, 3, M.fur);
}

/** The kilim in the middle: a border of steps, a field of diamonds, a fringe at both ends. */
function paintKilim(grid: PixelGrid) {
  const R = P.rug, { u0, u1, v0, v1 } = RUG, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  fillTop(grid, u0, u1, v0, v1, 0, (u, v) => {
    const edge = Math.min(u - u0, u1 - 1 - u, v - v0, v1 - 1 - v);
    if (edge < 1) return R.edge;
    if (edge < 4) return (u + v) % 4 < 2 === (edge === 2) ? R.motif : R.border;
    if (edge < 5) return R.light;
    const du = Math.abs(u - cu), dv = Math.abs(v - cv), diamond = du + dv * 1.2;
    if (diamond < 3) return R.light;
    if (diamond < 6) return R.teal;
    if (Math.abs(diamond - 8) < 0.8 || Math.abs(diamond - 14) < 0.8) return R.motif;
    if (diamond < 11) return R.border;
    return (Math.floor(u / 4) + Math.floor(v / 4)) % 2 ? R.field : R.base;
  });
  fillTop(grid, u0 - 2, u0, v0, v1, 0, (_u, v) => (v % 2 ? R.fringe : null)); fillTop(grid, u1, u1 + 2, v0, v1, 0, (_u, v) => (v % 2 ? R.fringe : null));
}

/* Little things, on a layer of their own at (x, y) on screen */

/** A cheese wheel standing on its face: its side, its top, its rind. */
function wheel(layer: PixelGrid, x: number, y: number, rx: number, high: number, cheese: { tones: Tones; rind: string }) {
  const [light, base, dark] = cheese.tones, ry = rx / 2;
  layer.ellipse(x, y - 1, rx, ry, cheese.rind);
  layer.rect(x - rx, y - 1 - high, 2 * rx, high, base);
  layer.rect(x + Math.ceil(rx / 2), y - 1 - high, Math.floor(rx / 2), high, dark);
  layer.rect(x - rx, y - 1 - high, 1, high, light);
  layer.ellipse(x, y - 1 - high, rx, ry, light);
  layer.ellipse(x + 0.6, y - 0.6 - high, rx - 1.4, ry - 0.8, base, [light]);
}

/** A wine bottle standing: its glass, its shoulder's shine, its label, its foil. */
function bottle(layer: PixelGrid, x: number, y: number, glass: string, foil: string) {
  layer.rect(x - 1, y - 8, 3, 8, glass); layer.rect(x, y - 11, 1, 3, glass); layer.rect(x, y - 13, 1, 2, foil);
  layer.rect(x - 1, y - 6, 3, 3, P.label); layer.set(x - 1, y - 8, P.bottleShine); layer.set(x - 1, y - 2, P.bottleShine);
}

/** A candle stuck in an old bottle, its wax run down the neck, its flame. */
function candleBottle(layer: PixelGrid, x: number, y: number, glass: string) {
  const K = P.candle;
  layer.rect(x - 2, y - 8, 5, 8, glass); layer.rect(x - 1, y - 11, 3, 3, glass); layer.set(x - 2, y - 7, P.bottleShine);
  layer.rect(x - 1, y - 12, 3, 2, K.wax); layer.points([[x - 1, y - 10], [x + 1, y - 9], [x + 1, y - 8], [x - 2, y - 8]], K.waxShade);
  layer.rect(x, y - 16, 1, 4, K.wax); layer.set(x, y - 17, K.flame); layer.set(x, y - 18, K.flameCore); layer.set(x, y - 16, K.flameCore);
}

/** A wine glass, a little red wine in it. */
const wineGlass: Topper = (layer, x, y) => {
  const G = P.glass;
  layer.rect(x - 2, y - 1, 5, 1, G.shade); layer.rect(x, y - 4, 1, 3, G.bowl);
  layer.rect(x - 2, y - 8, 5, 4, G.bowl); layer.rect(x - 1, y - 6, 3, 2, G.wine); layer.rect(x + 2, y - 8, 1, 4, G.shade);
};

/** A slice of cheese on a little board, two grapes beside it. */
const cheeseBoard: Topper = (layer, x, y) => {
  const K = P.counter.board, H = P.cheese.gold.tones;
  layer.rect(x - 4, y - 2, 9, 2, K[1]); layer.rect(x - 4, y - 2, 9, 1, K[0]); layer.set(x + 5, y - 1, K[2]);
  layer.rect(x - 3, y - 5, 4, 3, H[1]); layer.rect(x - 3, y - 5, 4, 1, H[0]); layer.set(x - 2, y - 4, P.hole);
  layer.set(x + 2, y - 3, P.grapes[1]); layer.set(x + 3, y - 3, P.grapes[0]); layer.set(x + 2, y - 4, P.grapes[2]);
};

/* What stands on the floor */

/** The tall wine rack: its oak box, a lattice of cells full of bottles seen from their end, a candle on top. */
function paintWineRack(grid: PixelGrid) {
  const R = P.rack, { u0, u1, v0, v1, height } = RACK;
  ob(grid, u0, u1, v0, v1, 0, height, R.wood, R.edge);
  fillRightFace(grid, u1, v0 + 1, v1 - 1, 3, height - 3, (a, z) => {
    const la = a - (v0 + 1), lz = z - 3, cell = Math.floor(la / 5), row = Math.floor(lz / 6), ia = la % 5, iz = lz % 6;
    if (cell >= 5 || ia === 0 || iz === 0) return R.lattice;
    if (pick(cell, row, 9) === 4 || iz === 1) return R.back;
    const along = ia - 1, up = iz - 2;
    if ((along === 0 || along === 3) && (up === 0 || up === 3)) return R.back;
    const glass = P.bottles[pick(row, cell, P.bottles.length)];
    if (along === 2 && up === 2) return P.bottleShine;
    if ((along === 1 || along === 2) && (up === 1 || up === 2)) return tint(glass, 0.7);
    return glass;
  });
  onRightFace(grid, u1, v0 + 1, v1 - 1, height - 3, R.wood[0]);
  art(grid, (layer) => candleBottle(layer, ...xy(iso(6, 22, height)), P.bottles[1]));
}

/** The cheese counter where the offices' coffee counter is: open shelves of wheels, a butcher's block, a big wheel cut open, more on it. */
function paintCheeseCounter(grid: PixelGrid) {
  const K = P.counter, H = P.cheese, { u0, u1, v1 } = COUNTER, front = v1 - 1;
  ob(grid, u0 + 1, u1 - 1, 0, front, 0, 20, K.body);
  // the open shelves on the face towards the room, their wheels seen from the side
  patchOnLeftFace(grid, front, u0 + 3, u1 - 3, 2, 18, K.back);
  patchOnLeftFace(grid, front, u0 + 3, u1 - 3, 9, 11, K.body[0]); onLeftFace(grid, front, u0 + 3, u1 - 3, 9, K.body[2]);
  const shelf = (z0: number, wheels: readonly (readonly [number, number, { tones: Tones; rind: string }])[]) => {
    for (const [a0, width, cheese] of wheels) fillLeftFace(grid, front, a0, a0 + width, z0, z0 + 6, (a, z) => {
      const corner = (a === a0 || a === a0 + width - 1) && (z === z0 || z === z0 + 5);
      if (corner) return null;
      if (z === z0 || z === z0 + 5 || a === a0 || a === a0 + width - 1) return cheese.rind;
      return z === z0 + 4 ? cheese.tones[0] : a > a0 + width - 3 ? cheese.tones[2] : cheese.tones[1];
    });
  };
  shelf(11, [[u0 + 4, 9, H.gold], [u0 + 14, 8, H.wax], [u0 + 23, 9, H.orange], [u0 + 33, 3, H.white]]);
  shelf(2, [[u0 + 4, 8, H.white], [u0 + 13, 9, H.gold], [u0 + 23, 8, H.blue], [u0 + 32, 4, H.gold]]);
  ob(grid, u0, u1, 0, v1, 20, 3, K.top, K.topEdge);
  // a big wheel cut open on a board, two stacked, a wedge of blue, grapes and a knife
  ob(grid, u0 + 3, u0 + 15, 2, 12, 23, 1, K.board);
  art(grid, (layer) => {
    const { x, y } = iso(u0 + 9, 7, 24);
    wheel(layer, x, y, 7, 5, H.gold);
    // the wedge cut out of it, its paste showing
    for (let row = 0; row < 4; row++) layer.rect(x + 1, y - 9 + row, 2 + row, 1, H.gold.tones[1]);
    layer.rect(x + 1, y - 5, 6, 4, H.gold.tones[0]); layer.set(x + 3, y - 4, P.hole); layer.set(x + 5, y - 3, P.hole);
  });
  art(grid, (layer) => { const { x, y } = iso(u0 + 23, 6, 23); wheel(layer, x, y, 5, 3, H.orange); wheel(layer, x, y - 3, 4, 3, H.white); });
  art(grid, (layer) => {
    const { x, y } = iso(u0 + 31, 8, 23), B = H.blue;
    for (let row = 0; row < 5; row++) layer.rect(x - 4 + row, y - 6 + row, 8 - row, 1, row === 0 ? B.tones[0] : B.tones[1]);
    layer.points([[x - 2, y - 5], [x + 1, y - 4], [x + 2, y - 3], [x - 1, y - 6]], B.rind);
  });
  art(grid, (layer) => {
    const { x, y } = iso(u0 + 30, 3, 23), G = P.grapes;
    for (const [dx, dy, tone] of [[-2, -2, 1], [0, -2, 0], [2, -2, 1], [-1, -4, 0], [1, -4, 2], [0, -6, 1], [-1, 0, 2], [1, 0, 1]] as const) layer.rect(x + dx, y + dy, 2, 2, G[tone]);
    layer.set(x, y - 8, P.grapeStem); layer.set(x + 1, y - 9, P.grapeStem);
  });
  art(grid, (layer) => { const { x, y } = iso(u0 + 18, 12, 23); layer.rect(x - 4, y - 1, 6, 1, K.knife); layer.rect(x - 4, y, 6, 1, K.knifeShade); layer.rect(x + 2, y - 1, 3, 2, K.handle); });
}

/** A cask lying on its cradle where the offices' water cooler is: its staves and hoops, its head towards the room, its brass tap, a glass on it. */
function paintCask(grid: PixelGrid) {
  const K = P.cask, { u, v, width } = CASK, front = v + width, middle = u + width / 2, radius = 6, centre = 5 + radius;
  for (const cv of [v + 2, v + 8]) ob(grid, u + 1, u + width - 1, cv, cv + 3, 0, 5, K.cradle);
  art(grid, (layer) => {
    for (let plane = v + 1; plane <= front; plane++) {
      const t = (plane - (v + 1 + front) / 2) / ((front - v - 1) / 2), r = radius * (1 - 0.1 * t * t) - (plane === front ? 0.6 : 0);
      const hoop = plane === v + 3 || plane === front - 2;
      fillLeftFace(layer, plane, u - 1, u + width + 1, centre - radius - 1, centre + radius + 1, (a, z) => {
        const da = a + 0.5 - middle, dz = z + 0.5 - centre, d = Math.sqrt(da * da + dz * dz);
        if (d >= r) return null;
        if (plane === front) return d > r - 1.2 ? K.headRing : Math.abs(da) < 0.6 || Math.abs(dz + 2) < 0.5 ? K.grain : K.head;
        const tone = dz > r * 0.35 ? 0 : dz < -r * 0.4 ? 2 : 1;
        if (hoop) return K.hoop[tone];
        return (Math.floor(Math.atan2(dz, da) * 3) % 2 === 0 && tone === 0) ? K.seam : K.staves[tone];
      });
    }
  });
  art(grid, (layer) => {
    const { x, y } = iso(middle, front, centre - 3);
    layer.rect(x - 1, y - 2, 3, 2, K.tap); layer.set(x - 1, y - 3, K.tapShade); layer.set(x, y - 3, K.tapShade);
    layer.rect(x, y, 1, 2, K.tapShade); layer.set(x, y + 3, K.drip);
  });
  art(grid, (layer) => wineGlass(layer, ...xy(iso(middle - 1, v + 4, centre + radius))));
}

/** The crate of bottles where the offices' lemon drawers are: its slats, its stamp, the bottles standing in it. */
function paintCrate(grid: PixelGrid) {
  const K = P.crate, { u0, u1, v0, v1, height } = CRATE;
  ob(grid, u0, u1, v0, v1, 0, height, K.wood, K.edge);
  for (const z of [4, 8]) { onLeftFace(grid, v1, u0 + 1, u1 - 1, z, K.gap); onRightFace(grid, u1, v0 + 1, v1 - 1, z, K.gap); }
  for (const [a, z] of [[u0 + 5, 6], [u0 + 6, 5], [u0 + 7, 6], [u0 + 6, 7], [u0 + 5, 5], [u0 + 7, 5]] as const) onLeftFace(grid, v1, a, a + 1, z, K.stamp);
  fillTop(grid, u0 + 1, u1 - 1, v0 + 1, v1 - 1, height, () => K.inside);
  art(grid, (layer) => {
    for (const [index, [bu, bv]] of [[81, 4], [86, 4], [81, 9], [86, 9]].entries()) bottle(layer, ...xy(iso(bu, bv, height)), P.bottles[(index + 1) % P.bottles.length], P.foil[index % P.foil.length]);
  });
}

/** An upright barrel, from z 0 to `height`: its staves bulging, its hoops, its head on top. */
function paintBarrelTable(grid: PixelGrid) {
  const K = P.cask, { u0, u1, v0, v1, height } = BARREL, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, radius = 6;
  art(grid, (layer) => {
    for (let z = 0; z <= height; z++) {
      const t = (z - height / 2) / (height / 2), r = radius * (0.9 + 0.1 * (1 - t * t)), top = z === height;
      const hoop = z === 2 || z === 3 || z === height - 3 || z === height - 4;
      fillTop(layer, Math.floor(cu - radius - 1), Math.ceil(cu + radius + 1), Math.floor(cv - radius - 1), Math.ceil(cv + radius + 1), z, (u, v) => {
        const du = u + 0.5 - cu, dv = v + 0.5 - cv, d = Math.sqrt(du * du + dv * dv);
        if (d >= r) return null;
        if (top) return d > r - 1.4 ? K.headRing : (u + v) % 5 === 0 ? K.grain : K.head;
        const tone = dv - du > r * 0.45 ? 0 : du - dv > r * 0.2 ? 2 : 1;
        if (hoop) return K.hoop[tone];
        const stave = ((Math.atan2(dv, du) + Math.PI) / (2 * Math.PI)) * 14;
        return stave - Math.floor(stave) < 0.14 ? K.seam : K.staves[tone];
      });
    }
  });
  art(grid, (layer) => cheeseBoard(layer, ...xy(iso(cu + 1, cv + 2, height + 1))));
  art(grid, (layer) => candleBottle(layer, ...xy(iso(cu - 2, cv - 3, height + 1)), P.bottles[3]));
}

/** The iron candle stand where the offices' floor lamp is: three feet, its pole, three candles on its arms. */
function paintCandleStand(grid: PixelGrid) {
  const K = P.candle, I = K.iron, { x, y } = iso(LAMP.u, LAMP.v);
  art(grid, (layer) => {
    layer.line(x - 4, y, x, y - 4, I[1]); layer.line(x + 4, y, x, y - 4, I[2]); layer.line(x, y + 1, x, y - 4, I[1]);
    layer.rect(x, y - 36, 1, 33, I[1]); layer.set(x, y - 20, I[0]); layer.rect(x - 1, y - 21, 3, 1, I[0]);
    layer.rect(x - 6, y - 36, 13, 1, I[1]); layer.set(x - 6, y - 37, I[1]); layer.set(x + 6, y - 37, I[1]);
    for (const dx of [-6, 0, 6]) {
      const lift = dx === 0 ? 4 : 0;
      layer.rect(x + dx - 1, y - 38 - lift, 3, 1, I[0]);
      layer.rect(x + dx, y - 44 - lift, 1, 6, K.wax); layer.set(x + dx + 1, y - 40 - lift, K.waxShade);
      layer.set(x + dx, y - 45 - lift, K.flame); layer.set(x + dx, y - 46 - lift, K.flameCore);
    }
  });
}

/** The burgundy chesterfield: buttons on its back, a mustard cushion, a plaid over its far arm. */
function paintChesterfield(grid: PixelGrid) {
  const couch = office.couch, T = P.throw;
  paintCouch(grid, couch, P.couch, 2, null);
  for (let v = couch.v + 9; v < couch.v + couch.length - 8; v += 6) for (const z of [17, 21]) onRightFace(grid, couch.u + 7, v, v + 1, z, P.couch.button);
  art(grid, (layer) => {
    const { x, y } = iso(...onCouchAt(couch, 10, couch.length - 16), 13), K = P.pillow;
    layer.rect(x - 4, y - 8, 9, 8, K[1]); layer.rect(x - 4, y - 8, 9, 2, K[0]); layer.rect(x + 3, y - 6, 2, 6, K[2]); layer.set(x, y - 4, K[2]);
  });
  // the plaid over the far arm, in checks
  const [u0, v0] = onCouchAt(couch, 3, 0), [u1, v1] = onCouchAt(couch, couch.depth - 2, 8);
  art(grid, (layer) => fillTop(layer, Math.min(u0, u1), Math.max(u0, u1), Math.min(v0, v1), Math.max(v0, v1), 16, (u, v) => ((u >> 1) + (v >> 1)) % 2 ? T[0] : (u + v) % 4 === 0 ? T[3] : T[2]));
}

const GLOW: readonly string[] = [P.bulb.glass, P.bulb.filament, P.candle.flame, P.candle.flameCore];
const VIEW: readonly string[] = [
  ...V.day, ...V.dusk, ...V.night, ...V.grass.day, ...V.grass.dusk, ...V.grass.night,
  V.sun, V.sunLow, V.sunLowLight, V.cloud, V.moon, V.moonShade, V.star, V.flower, V.flowerHeart, V.firefly,
];

export const cellar: AmbianceDesign = {
  id: 'cellar',
  desks: office.desks,
  deskStyle: {
    top: P.desk.top, topEdge: P.desk.edge, leg: P.desk.leg, drawers: null, monitor: P.desk.monitor, monitorEdge: P.desk.monitorEdge, stand: P.desk.stand,
    vents: P.desk.vents, keyboard: P.desk.keyboard, key: P.desk.key, seats: P.seats, chairBase: P.chair.base, chairPole: P.chair.pole, backThing: wineGlass, sideThing: cheeseBoard,
  },
  couch: office.couch,
  couchPlaces: office.couchPlaces,
  paintCouch: paintChesterfield,
  paintCouchArm: (grid) => paintCouchArm(grid, office.couch, P.couch),
  door: DOOR,
  paintDoor: paintOakDoor,
  paintBoard: paintCorkBoard,
  clock: CLOCK,
  footprints: [
    { ...RACK, height: RACK.height + 4 },
    { ...COUNTER, height: 38 },
    { u0: CASK.u, u1: CASK.u + CASK.width, v0: CASK.v, v1: CASK.v + CASK.width, height: 40 },
    { ...CRATE, height: 34 },
    { ...BARREL, height: 38 },
    around(LAMP.u, LAMP.v, 3, 50),
  ],
  festiveSpot: office.festiveSpot,
  visits: {
    entry: [50, 124], middle: [50, 84],
    spots: [
      // a taste at the cheese counter, between the two back desks; a glass from the cask; a look out of the window; a bottle from the rack or the barrel
      { activity: 'coffee', at: [60, 19], facing: 0, via: [[64, 62], [65, 42]] },
      { activity: 'water', at: [120, 24], facing: 0, via: BACK_RIGHT },
      { activity: 'window', at: [28, 54], facing: 6, via: [[36, 66]] },
      { activity: 'books', at: [24, 92], facing: 6, via: [[34, 94]] },
      { activity: 'books', at: [18, 18], facing: 6, via: [[30, 40]] },
    ],
    party: office.visits.party,
  },
  paintRoom(grid, time) {
    paintStoneFloor(grid);
    paintBrickWalls(grid);
    paintHighWindow(grid, time);
  },
  dress(grid) {
    paintArchBulbs(grid);
    paintCheeseShelf(grid);
    paintMouseHole(grid);
    for (const [u, v, z] of PENDANTS) paintPendant(grid, u, v, z);
    paintKilim(grid);
    paintDoorstep(grid);
  },
  standing: [
    standing(RACK.u0, RACK.u1, RACK.v0, RACK.v1, paintWineRack),
    standing(COUNTER.u0, COUNTER.u1, COUNTER.v0, COUNTER.v1, paintCheeseCounter),
    standing(CASK.u, CASK.u + CASK.width, CASK.v, CASK.v + CASK.width, paintCask),
    standing(CRATE.u0, CRATE.u1, CRATE.v0, CRATE.v1, paintCrate),
    standing(BARREL.u0, BARREL.u1, BARREL.v0, BARREL.v1, paintBarrelTable),
    standing(LAMP.u, LAMP.u, LAMP.v, LAMP.v, paintCandleStand),
  ],
  light: { lamp: LAMP, lampColour: P.light.lamp, ambient: P.light, lampGlow: [P.candle.wax, P.candle.waxShade], glow: GLOW, sky: VIEW },
};
