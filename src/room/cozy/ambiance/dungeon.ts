// The cozy dungeon (ambiance 'dungeon'), furnished where the offices are (office.ts: the same desks, couch, door and
// walks): stone brick walls under an oak beam, flagstones with a little moss, an arrow slit on the sky of the hour
// between two red banners, three torches and their warm halo, a shield and crossed swords, an iron-banded door under a
// stone arch, a quest board with its notes and a treasure map, an alchemist's bench with its cauldron and its potions
// under a shelf of bottles, an ale barrel, an open treasure chest by the door, a bookcase of spellbooks with a crystal
// ball, a suit of armour, a brazier, a rug of glowing runes, a red velvet couch, oak tables with candles and flasks.
// The flames are still: a project room's art is drawn once per mood of the hour (decor.ts), with no frame of its own.
import { COZY_AMBIANCE_PALETTE } from '../../../design/room-palette.ts';
import type { WallClock } from '../clock.ts';
import { DOOR, paintCouch, paintCouchArm, paintWallBoxes, shadeAlongWalls, standing, type Topper } from '../decor.ts';
import { ROOM_UNITS as ROOM, WALL_HEIGHT, around, iso, onCouchAt } from '../geometry.ts';
import {
  fillTop, fillWall, onLeftFace, onRightFace, outlined, outlinedBox, patchOnLeftFace, patchOnRightFace, tint, wallEllipse, wallPatch, wallPixel, wallPoint,
  type Painter, type PixelGrid, type PixelTarget, type Tones, type Wall,
} from '../pixels.ts';
import type { CozyTime } from '../time.ts';
import type { AmbianceDesign } from './index.ts';
import { COOLER, COUNTER, DRAWERS, LAMP, MONSTERA, office } from './office.ts';

const P = COZY_AMBIANCE_PALETTE.dungeon, O = P.outline, F = P.torch.flame;
const ob = (grid: PixelGrid, u0: number, u1: number, v0: number, v1: number, z: number, height: number, tones: Tones, edge?: string) => outlinedBox(grid, u0, u1, v0, v1, z, height, tones, O, edge);
const art = (grid: PixelGrid, draw: (layer: PixelGrid) => void) => outlined(grid, draw, O);

/* Where things are */

/** The torches on the walls: where their bracket is, `a` along the wall and `z` up; their flame burns above it. */
const TORCHES: readonly { wall: Wall; a: number; z: number }[] = [{ wall: 'left', a: 24, z: 60 }, { wall: 'left', a: 90, z: 60 }, { wall: 'right', a: 27, z: 60 }];
/** The arrow slit on the left wall, where the offices' window is: its middle along the wall. */
const SLIT = { a: 56, z0: 46, z1: 86, half: 3, bar: 64, barHalf: 9 } as const;
/** The bricks' courses: from the plinth to the beam, `course` pixels tall, `brick` units long. */
const BRICK = { z0: 6, course: 7, length: 14 } as const;
const BEAM = WALL_HEIGHT - 8;
/**
 * The pieces standing where the offices' are: the bench at the counter, the barrel at the cooler, the bookcase at the
 * drawers behind the second back desk (tall enough to show over its screen), the chest at the drawers by the door.
 */
const BENCH = COUNTER, BARREL = COOLER, [BOOKCASE, CHEST] = DRAWERS;
const BOOKCASE_HEIGHT = 32, CHEST_HEIGHT = 10;
/** The rug of runes in the middle of the floor: its middle and its radius, in units. */
const RUG = { u: 52, v: 96, radius: 21 } as const;

/** Rows of letters drawn on a wall, the first letter of each row at `a` (the screen's left), from `z` down. */
function wallPattern(target: PixelTarget, wall: Wall, a: number, z: number, rows: readonly string[], colours: Readonly<Record<string, string>>) {
  rows.forEach((row, line) => {
    [...row].forEach((letter, column) => {
    const colour = colours[letter];
      if (colour) wallPixel(target, wall, wall === 'left' ? a - column : a + column, z - line, colour);
    });
  });
}

/* The room */

function paintFlagstones(grid: PixelGrid) {
  const S = P.floor;
  fillTop(grid, 0, ROOM, 0, ROOM, 0, (u, v) => {
    const row = Math.floor(v / 16), shift = row % 2 ? 8 : 0, pu = (u + shift) % 16, pv = v % 16, column = Math.floor((u + shift) / 16);
    if (pu === 15 || pv === 15) return (u < 10 || v < 10) && (u * 7 + v * 3) % 5 === 0 ? S.moss : S.seam;
    const hash = (row * 7 + column * 13) % 5;
    if (pu === 0 || pv === 0) return S.light;
    if (pu === 14 || pv === 14) return tint(S.tones[hash], 0.9);
    // a crack across some of the stones
    if ((row * 5 + column * 3) % 7 === 2 && pu - pv === 2 && pu > 4 && pu < 12) return S.crack;
    if ((row * 3 + column * 5) % 9 === 4 && pu + pv === 18 && pu > 5 && pu < 13) return S.crack;
    return S.tones[hash];
  });
  shadeAlongWalls(grid);
}

/**
 * The warm light a torch throws on the bricks round its flame, fading out in dithered rings: its bright middle, then
 * its rim, sparser and sparser. Null where none falls.
 */
function haloAt(wall: Wall, a: number, z: number): string | null {
  const [middle, rim] = wall === 'left' ? P.torch.halo : P.torch.haloRight, even = (a + z) % 2 === 0;
  for (const torch of TORCHES) {
    if (torch.wall !== wall) continue;
    const r = Math.sqrt(((a + 0.5 - torch.a) / 1.25) ** 2 + (z + 0.5 - (torch.z + 11)) ** 2);
    if (r < 7) return middle;
    if (r < 9.5) return even ? middle : rim;
    if (r < 12.5) return rim;
    if (r < 15) return even ? rim : null;
    if (r < 17) return a % 2 === 0 && z % 2 === 0 ? rim : null;
  }
  return null;
}

function paintStoneWalls(grid: PixelGrid) {
  const B = P.bricks;
  paintWallBoxes(grid, P.wall);
  for (const wall of ['left', 'right'] as const) {
    const [light, base, dark] = B[wall], mortar = wall === 'left' ? B.mortarLeft : B.mortarRight;
    // the brick's end the light comes from: the screen's left of it (the left wall runs to the left as `a` grows)
    const lit = wall === 'left' ? BRICK.length - 1 : 1, shaded = wall === 'left' ? 1 : BRICK.length - 1;
    fillWall(grid, wall, 0, ROOM, BRICK.z0, BEAM, (a, z) => {
      const course = Math.floor((z - BRICK.z0) / BRICK.course), up = (z - BRICK.z0) % BRICK.course;
      const shift = course % 2 ? BRICK.length >> 1 : 0, along = (a + shift) % BRICK.length, brick = Math.floor((a + shift) / BRICK.length);
      if (up === 0 || along === 0) return mortar;
      if (course < 2 && up === BRICK.course - 1 && (brick * 7 + course) % 4 === 1 && a % 3) return B.moss[a % 2];
      if (up === BRICK.course - 1 || along === lit) return light;
      if (up === 1 || along === shaded) return dark;
      // a torch's light on the face of the brick, its edges kept
      const halo = haloAt(wall, a, z);
      if (halo) return halo;
      const hash = (course * 5 + brick * 3 + (wall === 'left' ? 1 : 0)) % 7;
      return hash === 0 ? tint(base, 0.95) : hash === 3 ? tint(base, 1.04) : base;
    });
    // the plinth of big dark stones, the oak beam under the ceiling and its pegs
    wallPatch(grid, wall, 0, ROOM, 0, BRICK.z0, B.plinth[0]); wallPatch(grid, wall, 0, ROOM, 0, 2, B.plinth[1]); wallPatch(grid, wall, 0, ROOM, BRICK.z0 - 1, BRICK.z0, B.plinthEdge);
    for (let a = 11; a < ROOM; a += 22) wallPatch(grid, wall, a, a + 1, 0, BRICK.z0 - 1, mortar);
    wallPatch(grid, wall, 0, ROOM, BEAM, WALL_HEIGHT, B.beam[1]); wallPatch(grid, wall, 0, ROOM, WALL_HEIGHT - 2, WALL_HEIGHT, B.beam[0]); wallPatch(grid, wall, 0, ROOM, BEAM, BEAM + 1, B.beam[2]);
    for (let a = 6; a < ROOM; a += 13) wallPatch(grid, wall, a, a + 5, BEAM + 3, BEAM + 4, tint(B.beam[1], 0.9));
    for (let a = 14; a < ROOM; a += 26) wallPatch(grid, wall, a, a + 2, BEAM + 2, BEAM + 4, B.peg);
  }
}

/** Whether a point of the left wall is in the arrow slit's opening: the tall slit, its rounded top, the bar across. */
function inSlit(a: number, z: number): boolean {
  const { a: middle, z0, z1, half, bar, barHalf } = SLIT;
  if (a >= middle - barHalf && a < middle + barHalf && z >= bar && z < bar + 4) return true;
  if (a < middle - half || a >= middle + half || z < z0) return false;
  if (z < z1 - 3) return true;
  return z < z1 && Math.abs(a + 0.5 - middle) < half - (z - (z1 - 3)) * 0.8;
}

/** What the slit shows at `time`: the sky of the hour, a far hill, the sun and a cloud by day, the low sun at dusk, the moon and stars at night. */
function paintSlitView(grid: PixelGrid, time: CozyTime) {
  const V = P.view, sky = V[time], { a: middle, z0, z1 } = SLIT;
  fillWall(grid, 'left', middle - 12, middle + 12, z0, z1, (a, z) => {
    if (!inSlit(a, z)) return null;
    if (z < z0 + 3 + ((a * 5) % 3 === 0 ? 1 : 0)) return time === 'day' ? V.hill : time === 'dusk' ? V.hillDusk : V.hillNight;
    return sky[Math.min(sky.length - 1, Math.floor((z1 - z) / ((z1 - z0) / sky.length)))];
  });
  const at = (a: number, z: number, colour: string) => { if (inSlit(a, z)) wallPixel(grid, 'left', a, z, colour); };
  if (time === 'night') {
    for (const [a, z] of [[middle - 1, 80], [middle, 81], [middle - 1, 81], [middle, 79]] as const) at(a, z, V.moon);
    for (const [a, z] of [[middle + 1, 72], [middle - 2, 58], [middle + 6, 66], [middle - 6, 65], [middle + 1, 52]] as const) at(a, z, V.star);
  } else if (time === 'dusk') {
    for (let a = middle - 2; a < middle + 2; a++) for (const z of [53, 54, 55]) at(a, z, V.sun);
    at(middle - 2, 56, V.sun); at(middle + 1, 56, V.sun);
  } else {
    for (let a = middle - 2; a < middle + 1; a++) for (const z of [76, 77, 78]) at(a, z, V.sun);
    for (let a = middle - 8; a < middle - 2; a++) at(a, 66, V.cloud);
    for (let a = middle + 3; a < middle + 7; a++) at(a, 65, V.cloud);
    at(middle + 1, 60, V.cloud); at(middle + 2, 60, V.cloud); at(middle + 1, 61, V.cloud);
  }
}

/** The arrow slit: its dressed stones, its splay round the opening, the view of the hour, its sill and a candle on it. */
function paintArrowSlit(grid: PixelGrid, time: CozyTime) {
  const S = P.slit, { a: middle, z0, z1, barHalf } = SLIT, wall: Wall = 'left';
  // the dressed stones, block by block, and their outline
  art(grid, (layer) => fillWall(layer, wall, middle - barHalf - 3, middle + barHalf + 3, z0 - 3, z1 + 4, (a, z) => {
    const near = Math.abs(a + 0.5 - middle) < 7 || (z >= SLIT.bar - 4 && z < SLIT.bar + 8);
    if (!near) return null;
    const block = Math.floor((z - z0 + 3) / 6), up = (z - z0 + 3) % 6;
    if (up === 0) return S.stone[2];
    if (up === 5) return S.stone[0];
    return (block + Math.floor(a / 5)) % 2 ? S.stone[1] : tint(S.stone[1], 1.04);
  }));
  // the splay, two pixels round the opening: its sill lit, its sides and top in shade or in light
  fillWall(grid, wall, middle - barHalf - 2, middle + barHalf + 2, z0 - 2, z1 + 2, (a, z) => {
    if (inSlit(a, z)) return null;
    if (inSlit(a, z + 1) || inSlit(a, z + 2)) return S.splayLit;
    if (inSlit(a + 1, z) || inSlit(a + 2, z)) return S.splayShade;
    if (inSlit(a - 1, z) || inSlit(a - 2, z)) return S.splayLit;
    if (inSlit(a, z - 1) || inSlit(a, z - 2)) return S.splayShade;
    return null;
  });
  paintSlitView(grid, time);
  ob(grid, 0, 5, middle - 7, middle + 7, z0 - 4, 2, S.sill, S.sillEdge);
  // a candle on the sill
  art(grid, (layer) => {
    const { x, y } = iso(2, middle + 4, z0 - 2), C = P.candle;
    layer.rect(x - 2, y - 1, 5, 1, C.dish[0]); layer.set(x + 2, y - 1, C.dish[1]);
    layer.rect(x - 1, y - 6, 3, 5, C.wax); layer.rect(x + 1, y - 6, 1, 5, C.shade);
  });
  const wick = iso(2, middle + 4, z0 + 3);
  paintFlame(grid, wick.x + 1, wick.y, 'small');
}

/** A flame burning at (x, y) (its foot), outlined in its own red: a torch's or the brazier's, or a candle's little one. */
function paintFlame(grid: PixelGrid, x: number, y: number, size: 'small' | 'torch' | 'big') {
  const rows = size === 'small' ? ['.o.', 'oyo', 'oyo'] : size === 'torch'
    ? ['...o...', '...oo..', '..oyo..', '..oyyo.', '.oyywo.', '.oywwyo', '.oywwyo', '..oyyo.']
    : ['....o....', '....oo...', '...oyo.o.', '..ooyyoo.', '..oyyyyo.', '.oyywwyo.', '.oyywwyyo', '.oywwwwyo', '..oywwyo.', '..ooyyoo.'];
  const width = rows[0].length;
  outlined(grid, (layer) => layer.pattern(x - (width >> 1), y - rows.length, rows, { o: F[1], y: F[2], w: F[3] }), F[0]);
}

/** A torch on its iron bracket, its handle and its cup, its flame. */
function paintTorch(grid: PixelGrid, wall: Wall, a: number, z: number) {
  const T = P.torch, [x, y] = wallPoint(wall, a, z);
  art(grid, (layer) => {
    layer.rect(x - 1, y - 1, 3, 6, T.iron[1]); layer.set(x - 1, y - 1, T.iron[0]); layer.rect(x - 1, y + 4, 3, 1, T.iron[2]);
    layer.rect(x, y - 6, 2, 10, T.handle[1]); layer.rect(x, y - 6, 1, 10, T.handle[0]); layer.set(x + 1, y + 3, T.handle[2]);
    layer.rect(x - 2, y - 8, 6, 2, T.iron[1]); layer.rect(x - 2, y - 8, 6, 1, T.iron[0]); layer.set(x + 3, y - 7, T.iron[2]);
    layer.rect(x - 1, y + 1, 3, 1, T.iron[2]);
  });
  paintFlame(grid, x + 1, y - 8, 'torch');
}

/** A red banner on its rod, its swallowtail, its gold trim and its emblem: `a0` to `a1` along the left wall. */
function paintBanner(grid: PixelGrid, a0: number, a1: number, emblem: readonly string[]) {
  const B = P.banner, wall: Wall = 'left', middle = (a0 + a1) / 2, top = BEAM - 4;
  art(grid, (layer) => {
    for (let a = a0; a < a1; a++) {
      const bottom = 50 + Math.max(0, Math.round(6 - Math.abs(a + 0.5 - middle) * 1.3)), fold = (a - a0) % 4;
      const tone = a === a1 - 1 || fold === 1 ? B.cloth[0] : a === a0 || fold === 3 ? B.cloth[2] : B.cloth[1];
      wallPatch(layer, wall, a, a + 1, bottom, top, tone);
      wallPixel(layer, wall, a, bottom, B.trim);
    }
    wallPatch(layer, wall, a0, a1, top - 5, top - 3, B.trim);
    wallPattern(layer, wall, Math.floor(middle) + 3, 76, emblem, { y: B.emblem, d: B.emblemShade });
  });
  art(grid, (layer) => {
    wallPatch(layer, wall, a0 - 2, a1 + 2, top, top + 2, B.rod[1]); wallPatch(layer, wall, a0 - 2, a1 + 2, top + 1, top + 2, B.rod[0]);
    wallPatch(layer, wall, a0 - 4, a0 - 2, top - 1, top + 3, B.knob); wallPatch(layer, wall, a1 + 2, a1 + 4, top - 1, top + 3, B.knob);
  });
  wallPatch(grid, wall, a0, a0 + 1, top + 2, BEAM, B.rod[2]); wallPatch(grid, wall, a1 - 1, a1, top + 2, BEAM, B.rod[2]);
}

const CROWN = ['y..y..y', 'yy.y.yy', 'yyyyyyy', 'ydydydy', 'yyyyyyy'];
const CUP = ['yyyyyyy', 'yyyyyyd', '.yyyyd.', '..yyd..', '...y...', '..yyy..'];

/** The round wooden shield on the right wall, two swords crossed behind it. */
function paintShield(grid: PixelGrid) {
  const S = P.shield, wall: Wall = 'right', ca = 13, cz = 70;
  art(grid, (layer) => {
    for (const side of [-1, 1]) {
      for (let step = 0; step <= 22; step++) {
        const a = ca + side * (11 - step), z = cz - 12 + step;
        wallPixel(layer, wall, a, z, S.blade[0]); wallPixel(layer, wall, a + side, z, S.blade[1]);
      }
      const ga = ca + side * 9, gz = cz - 10;
      wallPatch(layer, wall, ga - 2, ga + 3, gz, gz + 1, S.guard);
      wallPatch(layer, wall, ca + side * 11, ca + side * 11 + 1, cz - 14, cz - 11, S.hilt);
    }
  });
  art(grid, (layer) => {
    wallEllipse(layer, wall, ca + 0.5, cz + 0.5, 8.4, 8.4, S.rim[1]);
    wallEllipse(layer, wall, ca + 0.5, cz + 0.5, 6.8, 6.8, S.wood[1]);
    fillWall(layer, wall, ca - 7, ca + 8, cz - 7, cz + 8, (a, z) => {
      const d = (a + 0.5 - ca - 0.5) ** 2 + (z + 0.5 - cz - 0.5) ** 2;
      if (d >= 6.8 * 6.8) return null;
      if ((a - ca + 8) % 4 === 0) return S.wood[2];
      return a < ca - 3 ? S.wood[0] : null;
    });
    for (let index = 0; index < 8; index++) { const angle = (index * Math.PI) / 4; wallPixel(layer, wall, Math.round(ca + Math.cos(angle) * 7.6), Math.round(cz + Math.sin(angle) * 7.6), S.rim[0]); }
    wallEllipse(layer, wall, ca + 0.5, cz + 0.5, 2.4, 2.4, S.rim[2]); wallEllipse(layer, wall, ca, cz + 1, 1.6, 1.6, S.boss);
  });
}

/** Cobwebs in the corners under the beam: threads from the corner and the rings between them. */
function paintCobweb(grid: PixelGrid, wall: Wall, corner: number, towards: 1 | -1) {
  const top = BEAM - 1;
  for (const angle of [0.15, 0.6, 1.05, 1.45]) for (let step = 1; step < 10; step++) wallPixel(grid, wall, Math.round(corner + towards * Math.sin(angle) * step), Math.round(top - Math.cos(angle) * step * 0.8), P.cobweb);
  for (const radius of [4, 7]) for (let angle = 0.15; angle < 1.5; angle += 0.22) wallPixel(grid, wall, Math.round(corner + towards * Math.sin(angle) * radius), Math.round(top - Math.cos(angle) * radius * 0.8 + 0.5), P.cobweb);
}

/** The iron-banded oak door under its stone arch, its grate, its studs and its ring: a click goes through it, to the break room. */
const paintDoor: Painter = (grid) => {
  const D = P.door, { a0, a1, height } = DOOR, wall: Wall = 'left', middle = (a0 + a1) / 2, half = (a1 - a0) / 2;
  // the top of the leaf: round, from `height - half` at its sides to `height` in the middle
  const topOf = (a: number) => height - half + Math.sqrt(Math.max(0, half * half - (a + 0.5 - middle) ** 2));
  const inArch = (a: number, z: number, grow: number) => {
    const d = Math.abs(a + 0.5 - middle);
    if (d >= half + grow) return false;
    return z < height - half + Math.sqrt(Math.max(0, (half + grow) ** 2 - d * d));
  };
  fillWall(grid, wall, a0 - 6, a1 + 6, 0, height + 8, (a, z) => (inArch(a, z, 5) ? O : null));
  fillWall(grid, wall, a0 - 5, a1 + 5, 0, height + 8, (a, z) => {
    if (!inArch(a, z, 4)) return null;
    const d = Math.abs(a + 0.5 - middle);
    // the voussoirs round the top, the blocks of the jambs below
    if (z >= height - half) {
      const angle = Math.atan2(z + 0.5 - (height - half), a + 0.5 - middle), stone = Math.floor((angle / Math.PI) * 7);
      if (Math.abs((angle / Math.PI) * 7 - Math.round((angle / Math.PI) * 7)) < 0.1) return D.arch[2];
      return stone % 2 ? D.arch[0] : D.arch[1];
    }
    if (d < half) return D.arch[1];
    const block = Math.floor(z / 7);
    if (z % 7 === 0) return D.arch[2];
    return (block + (a < middle ? 0 : 1)) % 2 ? D.arch[0] : D.arch[1];
  });
  fillWall(grid, wall, a0 - 1, a1 + 1, 0, height + 2, (a, z) => (inArch(a, z, 1) ? O : null));
  // the planks
  fillWall(grid, wall, a0, a1, 0, height + 1, (a, z) => {
    if (z >= topOf(a)) return null;
    const along = (a - a0) % 5;
    if (along === 4) return D.seam;
    if (along === 3) return D.plankLight;
    return D.planks[Math.floor((a - a0) / 5) % 3];
  });
  // two iron bands with their studs, the hinges' straps, the grate and its bars, the ring
  for (const z of [9, 44]) {
    wallPatch(grid, wall, a0, a1, z, z + 3, D.iron); wallPatch(grid, wall, a0, a1, z + 2, z + 3, D.ironLight);
    for (let a = a0 + 2; a < a1 - 1; a += 4) wallPixel(grid, wall, a, z + 1, D.stud);
  }
  for (const z of [10, 45]) { wallPatch(grid, wall, a0, a0 + 2, z - 2, z + 5, D.iron); wallPixel(grid, wall, a0, z + 4, D.ironLight); }
  wallPatch(grid, wall, middle - 4, middle + 4, 30, 40, D.iron);
  wallPatch(grid, wall, middle - 3, middle + 3, 31, 39, D.grate);
  for (let a = Math.floor(middle) - 2; a < middle + 3; a += 2) wallPatch(grid, wall, a, a + 1, 31, 39, D.ironLight);
  wallPatch(grid, wall, middle - 3, middle + 3, 35, 36, D.iron);
  wallEllipse(grid, wall, a1 - 4.5, 24, 2.6, 2.6, D.ring); wallEllipse(grid, wall, a1 - 4.5, 24, 1.2, 1.2, D.planks[1]);
  wallPatch(grid, wall, a1 - 5, a1 - 4, 26, 28, D.ringShade);
};

/** The straw mat in front of the door. */
function paintDoormat(grid: PixelGrid) {
  const { a0, a1 } = DOOR, M = P.door.mat;
  fillTop(grid, 1, 12, a0 + 1, a1 - 1, 0, (u, v) => (u === 1 || u === 11 || v === a0 + 1 || v === a1 - 2 ? M[2] : (u + v * 2) % 3 === 0 ? M[0] : M[1]));
}

/** The quest board on the right wall: its timber frame, its planks, four notes pinned on it, a treasure map, its ledge with a quill: a click opens the board and its notes. */
const paintQuestBoard: Painter = (grid) => {
  const wall: Wall = 'right', B = P.board;
  wallPatch(grid, wall, 73, 123, 45, 88, O);
  wallPatch(grid, wall, 74, 122, 46, 87, B.frame); wallPatch(grid, wall, 74, 122, 86, 87, B.frameLight); wallPatch(grid, wall, 74, 75, 46, 87, B.frameLight);
  fillWall(grid, wall, 77, 119, 49, 84, (a, z) => {
    const plank = Math.floor((z - 49) / 7);
    if ((z - 49) % 7 === 6) return B.plankSeam;
    return (a * 3 + plank * 11) % 23 === 0 ? B.plankSeam : B.planks[plank % 2];
  });
  // a note: its paper, its shaded edge, its lines of ink, its pin
  const note = (a0: number, a1: number, z0: number, z1: number, pin: number, lines: readonly number[]) => {
    wallPatch(grid, wall, a0, a1, z0 - 1, z1, O);
    wallPatch(grid, wall, a0 + 1, a1, z0, z1 - 1, B.note);
    wallPatch(grid, wall, a1 - 1, a1, z0, z1 - 1, B.noteShade); wallPatch(grid, wall, a0 + 1, a1, z0, z0 + 1, B.noteShade);
    lines.forEach((length, row) => {
      wallPatch(grid, wall, a0 + 3, a0 + 3 + length, z1 - 5 - row * 3, z1 - 4 - row * 3, row ? B.inkFaint : B.ink);
    });
    wallPatch(grid, wall, (a0 + a1) >> 1, ((a0 + a1) >> 1) + 2, z1 - 3, z1 - 1, B.pins[pin]);
  };
  note(79, 93, 60, 81, 0, [8, 9, 6, 9, 5]);
  note(108, 118, 56, 76, 2, [5, 6, 4]);
  note(84, 104, 50, 58, 1, [12]);
  // the treasure map: its dotted way and its red cross
  wallPatch(grid, wall, 95, 107, 64, 83, O); wallPatch(grid, wall, 96, 107, 65, 82, B.note); wallPatch(grid, wall, 106, 107, 65, 82, B.noteShade);
  for (const [a, z] of [[98, 79], [99, 77], [100, 75], [101, 74], [102, 72], [101, 70], [100, 68]] as const) wallPixel(grid, wall, a, z, B.inkFaint);
  for (let step = 0; step < 4; step++) { wallPixel(grid, wall, 101 + step, 66 + step, B.seal); wallPixel(grid, wall, 104 - step, 66 + step, B.seal); }
  wallPatch(grid, wall, 97, 100, 80, 82, B.ink);
  wallPatch(grid, wall, 100, 102, 79, 81, B.pins[0]);
  // a wax seal on the first note
  wallEllipse(grid, wall, 90, 62.5, 2.2, 2.2, B.seal); wallPixel(grid, wall, 89, 63, B.sealLight);
  // the ledge, an inkpot and a quill
  ob(grid, 76, 120, 0, 4, 44, 2, B.tray);
  ob(grid, 88, 92, 1, 4, 46, 3, [P.bench.cauldron[0], P.bench.cauldron[1], P.bench.cauldron[2]]);
  art(grid, (layer) => {
    const { x, y } = iso(90, 2, 49);
    for (let step = 0; step < 8; step++) { layer.set(x + 1 + step, y - 1 - step, B.quill); layer.set(x + 2 + step, y - 1 - step, B.quillShade); }
    layer.set(x + 1, y, B.ink);
  });
};

/** Above the door, its clock in brass. */
const CLOCK: WallClock = { wall: 'left', a: 112, z: 80, radius: 6, tones: P.clock };

/** The shelf of bottles over the bench, on the right wall: two planks on iron brackets, bottles, jars and a candle. */
function paintPotionShelf(grid: PixelGrid) {
  const wall: Wall = 'right', S = P.wallShelf, potions = P.potions;
  for (const z of [42, 60]) {
    art(grid, (layer) => {
      wallPatch(layer, wall, 35, 69, z - 2, z, S[1]); wallPatch(layer, wall, 35, 69, z - 1, z, S[0]); wallPatch(layer, wall, 35, 69, z - 2, z - 1, S[2]);
      for (const a of [38, 65]) { wallPatch(layer, wall, a, a + 1, z - 6, z - 2, P.bracket); wallPixel(layer, wall, a + 1, z - 3, P.bracket); }
    });
    // the bottles standing on it, a different shape each
    const shapes = z === 42 ? [[37, 0, 'round'], [43, 1, 'tall'], [48, 2, 'square'], [54, 3, 'round'], [60, 4, 'tall'], [64, 0, 'square']] as const
      : [[38, 2, 'tall'], [42, 4, 'round'], [49, 1, 'square'], [56, 0, 'round'], [62, 3, 'tall']] as const;
    for (const [a, potion, shape] of shapes) art(grid, (layer) => {
      const liquid = potions[potion], light = tint(liquid, 1.18), dark = tint(liquid, 0.78);
      if (shape === 'round') { wallEllipse(layer, wall, a + 2.5, z + 3, 2.6, 3, liquid); wallPatch(layer, wall, a + 2, a + 4, z + 5, z + 8, P.flask.glass); wallPatch(layer, wall, a + 2, a + 4, z + 8, z + 9, P.cork); }
      else if (shape === 'tall') { wallPatch(layer, wall, a, a + 3, z, z + 8, liquid); wallPatch(layer, wall, a + 1, a + 2, z + 8, z + 10, P.flask.glass); wallPixel(layer, wall, a + 1, z + 10, P.cork); }
      else { wallPatch(layer, wall, a, a + 4, z, z + 5, liquid); wallPatch(layer, wall, a + 1, a + 3, z + 5, z + 7, P.flask.glass); wallPatch(layer, wall, a + 1, a + 3, z + 7, z + 8, P.cork); }
      wallPatch(layer, wall, a + (shape === 'tall' ? 2 : 3), a + (shape === 'tall' ? 3 : 4), z, z + 4, dark);
      wallPixel(layer, wall, a, z + (shape === 'round' ? 3 : 4), light); wallPixel(layer, wall, a + 1, z + (shape === 'round' ? 4 : 5), P.potionGlint);
    });
  }
}

/* What stands on the floor */

/** The alchemist's bench where the offices' counter is: its planks and drawers, the cauldron of glowing brew, bottles, a spellbook. */
function paintBench(grid: PixelGrid) {
  const K = P.bench, { u0, u1, v0, v1 } = BENCH, front = v1 - 1;
  ob(grid, u0 + 1, u1 - 1, v0, front, 0, 20, K.body);
  for (const [a0, a1] of [[u0 + 4, u0 + 17], [u0 + 21, u0 + 34]] as const) {
    patchOnLeftFace(grid, front, a0, a1, 9, 17, K.body[0]); patchOnLeftFace(grid, front, a0, a1, 9, 10, K.plank); patchOnLeftFace(grid, front, a1 - 1, a1, 9, 17, K.plank);
    patchOnLeftFace(grid, front, ((a0 + a1) >> 1) - 1, ((a0 + a1) >> 1) + 1, 12, 14, P.door.ring);
  }
  for (let a = u0 + 3; a < u1 - 2; a += 9) patchOnLeftFace(grid, front, a, a + 1, 1, 7, K.plank);
  patchOnLeftFace(grid, front, u0 + 1, u1 - 1, 0, 1, K.plank);
  ob(grid, u0, u1, v0, v1, 20, 2, K.top, K.topEdge);
  // the cauldron on its little fire
  const pot = iso(u0 + 9, v0 + 7, 22);
  outlined(grid, (layer) => layer.pattern(pot.x - 2, pot.y - 2, ['.o.o.', 'ooooo'], { o: K.fire }), F[0]);
  art(grid, (layer) => {
    const { x, y } = pot;
    [6, 7, 7, 7, 6, 5, 4].forEach((half, row) => {
      for (let dx = -half; dx <= half; dx++) layer.set(x + dx, y - 9 + row, dx < -half + 2 ? K.cauldron[0] : dx > half - 3 ? K.cauldron[2] : K.cauldron[1]);
    });
    layer.ellipse(x + 0.5, y - 10, 7, 2.2, K.cauldronRim); layer.ellipse(x + 0.5, y - 10, 5.4, 1.4, K.brew);
    layer.points([[x - 2, y - 10], [x + 2, y - 11]], K.brewLight);
  });
  for (const [dx, dy] of [[-2, -13], [1, -15], [3, -12], [0, -18], [-1, -21]] as const) grid.set(pot.x + dx, pot.y + dy, dy < -16 ? K.brewLight : K.bubble);
  // three bottles and an open spellbook
  const bottle = (u: number, v: number, potion: number, tall: boolean) => art(grid, (layer) => {
    const { x, y } = iso(u, v, 22), liquid = P.potions[potion];
    if (tall) { layer.rect(x - 1, y - 8, 3, 8, liquid); layer.rect(x + 1, y - 8, 1, 8, tint(liquid, 0.78)); layer.rect(x, y - 11, 1, 3, P.flask.glass); layer.set(x, y - 12, P.cork); }
    else { layer.ellipse(x + 0.5, y - 3, 3.2, 3.2, liquid); layer.rect(x + 1, y - 5, 2, 4, tint(liquid, 0.78), [liquid]); layer.rect(x, y - 9, 2, 3, P.flask.glass); layer.rect(x, y - 10, 2, 1, P.cork); }
    layer.set(x - 1, y - (tall ? 6 : 4), P.potionGlint);
  });
  bottle(u0 + 21, v0 + 5, 0, false); bottle(u0 + 25, v0 + 3, 1, true); bottle(u0 + 29, v0 + 6, 2, false);
  art(grid, (layer) => {
    const { x, y } = iso(u0 + 32, v0 + 10, 22);
    layer.rect(x - 5, y - 2, 11, 2, K.book[1]); layer.rect(x - 4, y - 3, 4, 1, K.page); layer.rect(x + 1, y - 3, 4, 1, K.page);
    layer.rect(x - 4, y - 2, 4, 1, K.page); layer.rect(x + 1, y - 2, 4, 1, tint(K.page, 0.9)); layer.set(x, y - 3, K.book[0]);
  });
}

/** The ale barrel on its stand where the offices' water cooler is: its staves and hoops, its brass tap, a tankard on its lid. */
function paintBarrel(grid: PixelGrid) {
  const K = P.barrel, { u, v, width } = BARREL;
  ob(grid, u, u + width, v, v + width, 0, 3, K.stand);
  art(grid, (layer) => {
    const { x, y } = iso(u + 6, v + 6, 3), height = 22;
    for (let row = 0; row < height; row++) {
      const half = 6 + Math.round(1.4 * Math.sin((Math.PI * row) / (height - 1))), hoop = row === 2 || row === 3 || row === height - 4 || row === height - 3;
      for (let dx = -half; dx <= half; dx++) {
        const right = dx > half - 3, left = dx < -half + 2;
        const colour = hoop ? (right ? K.hoop[1] : K.hoop[0]) : left ? K.staves[0] : right ? K.staves[2] : (dx + 7) % 3 === 0 ? tint(K.staves[1], 0.88) : K.staves[1];
        layer.set(x + dx, y - height + row, colour);
      }
    }
    layer.ellipse(x + 0.5, y - height, 6.6, 2.4, K.staves[0]); layer.ellipse(x + 0.5, y - height, 5, 1.6, K.staves[1]);
    layer.rect(x - 4, y - height, 9, 1, tint(K.staves[1], 0.88));
    layer.rect(x - 2, y - 10, 3, 2, K.tap); layer.set(x - 1, y - 8, K.tap);
  });
  art(grid, (layer) => {
    const { x, y } = iso(u + 6, v + 6, 25);
    layer.rect(x + 1, y - 5, 4, 5, K.tankard[0]); layer.rect(x + 4, y - 5, 1, 5, K.tankard[1]); layer.rect(x + 5, y - 4, 1, 3, K.tankard[1]);
    layer.rect(x + 1, y - 6, 4, 1, K.foam); layer.set(x + 2, y - 7, K.foam);
  });
}

/**
 * The treasure chest by the door, against the left wall: open, its lid standing up at the back, heaped with gold and a
 * gem, its iron straps and its lock towards the room, coins spilt on the floor in front.
 */
function paintChest(grid: PixelGrid) {
  const K = P.chest, { u0, u1, v0, v1 } = CHEST, top = CHEST_HEIGHT, middle = (v0 + v1) >> 1;
  // the lid, open against the wall behind: its outside, then its inside turned to the room
  ob(grid, u0, u0 + 3, v0 + 1, v1 - 1, top - 2, 12, K.wood, K.wood[0]);
  patchOnRightFace(grid, u0 + 3, v0 + 2, v1 - 2, top, top + 8, K.wood[2]);
  for (const v of [v0 + 3, v1 - 5]) patchOnRightFace(grid, u0 + 3, v, v + 2, top - 2, top + 10, K.iron[1]);
  // the body, its straps and its lock on the front, a strap round its side
  ob(grid, u0 + 2, u1, v0 + 1, v1 - 1, 0, top, K.wood);
  for (const v of [v0 + 3, v1 - 5]) patchOnRightFace(grid, u1, v, v + 2, 0, top, K.iron[1]);
  onRightFace(grid, u1, v0 + 1, v1 - 1, top - 1, K.iron[0]);
  for (const u of [u0 + 4, u1 - 4]) patchOnLeftFace(grid, v1 - 1, u, u + 2, 0, top, K.iron[2]);
  patchOnRightFace(grid, u1, middle - 1, middle + 2, top - 5, top - 1, K.lock); onRightFace(grid, u1, middle, middle + 1, top - 4, O);
  // the gold heaped inside, a gem on it
  fillTop(grid, u0 + 3, u1 - 1, v0 + 2, v1 - 2, top, (u, v) => ((u * 3 + v * 5) % 7 === 0 ? K.gold[0] : (u + v) % 3 === 0 ? K.gold[2] : K.gold[1]));
  art(grid, (layer) => {
    const { x, y } = iso((u0 + u1) >> 1, middle, top);
    layer.ellipse(x + 0.5, y - 1, 6, 2.4, K.gold[1]); layer.ellipse(x, y - 2, 4, 1.6, K.gold[0]);
    layer.points([[x - 4, y - 1], [x + 3, y], [x - 1, y - 3]], K.gold[2]);
    layer.set(x + 2, y - 3, K.gem); layer.set(x + 3, y - 3, K.gem); layer.set(x + 2, y - 4, K.gemLight);
  });
  for (const [u, v] of [[u1 + 2, v0 + 4], [u1 + 4, v0 + 8], [u1 + 2, v1 - 3]] as const) art(grid, (layer) => {
    const { x, y } = iso(u, v); layer.rect(x - 1, y - 1, 3, 1, K.gold[1]); layer.set(x - 1, y - 1, K.gold[0]);
  });
}

/** The bookcase of spellbooks against the right wall, under the quest board, its shelves towards the room, a crystal ball on it. */
function paintBookcase(grid: PixelGrid) {
  const K = P.bookcase, { u0, u1, v0, v1 } = BOOKCASE, height = BOOKCASE_HEIGHT, shelves = 3, step = Math.floor((height - 3) / shelves);
  ob(grid, u0, u1, v0, v1, 0, height, K.wood, K.edge);
  for (let shelf = 0; shelf < shelves; shelf++) {
    const z0 = 3 + shelf * step;
    patchOnLeftFace(grid, v1, u0 + 2, u1 - 2, z0, z0 + step - 3, K.back);
    for (let u = u0 + 2, index = shelf * 5; u < u1 - 2; index++) {
      const width = 1 + ((index * 5) % 3), tall = Math.min(step - 3, 4 + ((index * 7) % 3)), book = K.books[index % K.books.length];
      if ((index * 11) % 9 === 4) { u += 2; continue; }
      patchOnLeftFace(grid, v1, u, Math.min(u1 - 2, u + width), z0, z0 + tall, book);
      onLeftFace(grid, v1, u, Math.min(u1 - 2, u + width), z0 + tall - 2, tint(book, 1.2));
      u += width + 1;
    }
    onLeftFace(grid, v1, u0 + 1, u1 - 1, z0 - 1, K.wood[2]);
  }
  art(grid, (layer) => {
    const C = P.crystal, { x, y } = iso((u0 + u1) >> 1, (v0 + v1) >> 1, height);
    layer.rect(x - 3, y - 2, 7, 2, C.stand[0]); layer.rect(x + 2, y - 2, 2, 2, C.stand[1]);
    layer.ellipse(x + 0.5, y - 6, 3.6, 3.6, C.glass); layer.ellipse(x + 1, y - 5.5, 2.2, 2.2, C.glow);
    layer.set(x - 1, y - 8, C.light); layer.set(x - 2, y - 7, C.light);
  });
}

/** The suit of armour on its plinth in the back corner, a halberd in its hand. */
function paintArmour(grid: PixelGrid) {
  const A = P.armour, { u, v } = MONSTERA;
  ob(grid, u - 6, u + 6, v - 6, v + 6, 0, 4, A.plinth, A.plinthEdge);
  const { x, y } = iso(u, v, 4);
  art(grid, (layer) => layer.pattern(x - 8, y - 30, [
    '.......pp.....x....',
    '......pqqp...xxx...',
    '.......pqqp..xwxx..',
    '........pqp..xwxx..',
    '.....ssmmmm...xw...',
    '....smmmmmmd...w...',
    '....smmmmmmd...w...',
    '....smmmmmmd...w...',
    '....vvvvvvvd...w...',
    '....smvmvmvd...w...',
    '....smmmmmmd...w...',
    '.....dmmmmd....w...',
    '...ssmmmmmmdd..w...',
    '..ssmmmmmmmmdd.w...',
    '..smmsmmmmmdmd.w...',
    '..smmsmmmmmdmd.w...',
    '..sm.smmmmmd.mdw...',
    '..sm.smmmmmd.mdw...',
    '..sm.smmmmmd.mdw...',
    '..dd.ddddddd.ssw...',
    '..ss.smmdmmd.ssw...',
    '.....smmdmmd...w...',
    '.....smm.mmd...w...',
    '.....smm.mmd...w...',
    '.....smm.mmd...w...',
    '.....smm.mmd...w...',
    '.....smm.mmd...w...',
    '.....smd.smd...w...',
    '....ssmd.smdd..w...',
    '....sddd.sddd..w...',
  ], { s: A.steel[0], m: A.steel[1], d: A.steel[2], v: A.visor, p: A.plume[0], q: A.plume[1], w: P.barrel.stand[0], x: A.steel[0] }));
}

/** The brazier where the offices' floor lamp stands: its iron tripod, its bowl of coals, its fire. */
function paintBrazier(grid: PixelGrid) {
  const B = P.brazier, { x, y } = iso(LAMP.u, LAMP.v);
  art(grid, (layer) => {
    layer.line(x - 6, y, x - 2, y - 14, B.iron[1]); layer.line(x + 6, y, x + 2, y - 14, B.iron[2]); layer.rect(x, y - 14, 1, 14, B.iron[1]);
    layer.rect(x - 4, y - 7, 9, 1, B.iron[0]);
    [8, 8, 7, 6, 5].forEach((half, row) => { for (let dx = -half; dx <= half; dx++) layer.set(x + dx, y - 19 + row, dx < -half + 2 ? B.iron[0] : dx > half - 3 ? B.iron[2] : B.iron[1]); });
    layer.rect(x - 7, y - 20, 15, 1, B.ember); layer.points([[x - 4, y - 20], [x - 1, y - 20], [x + 3, y - 20], [x + 5, y - 20]], B.coal);
  });
  paintFlame(grid, x, y - 20, 'big');
}

/* Hung on the walls, lying on the floor */

/** The rug of runes: its border, a gold ring, eight glowing runes round it, a star in the middle. */
function paintRuneRug(grid: PixelGrid) {
  const R = P.rug, { u: cu, v: cv, radius } = RUG;
  const runes = Array.from({ length: 8 }, (_, index) => { const angle = (index * Math.PI) / 4 + Math.PI / 8; return [cu + Math.cos(angle) * (radius - 6), cv + Math.sin(angle) * (radius - 6), index] as const; });
  // a rune: a little sign of its own in a 4 by 4 square, by its number
  const glyphs = [0b1001_0110_0110_1001, 0b0110_1001_1001_0110, 0b1111_0001_0001_0001, 0b1000_1100_1110_1111, 0b0100_1110_0100_0100, 0b1010_0101_1010_0101, 0b1110_1010_1110_0010, 0b0010_0111_0010_1010];
  fillTop(grid, cu - radius, cu + radius, cv - radius, cv + radius, 0, (u, v) => {
    const du = u + 0.5 - cu, dv = v + 0.5 - cv, d = Math.sqrt(du * du + dv * dv);
    if (d >= radius) return null;
    if (d >= radius - 1) return R.edge;
    if (d >= radius - 2) return (Math.round(Math.atan2(dv, du) * 12) % 2 === 0) ? R.ringShade : R.ring;
    for (const [ru, rv, index] of runes) {
      const gu = Math.floor(u - ru + 2), gv = Math.floor(v - rv + 2);
      if (gu >= 0 && gu < 4 && gv >= 0 && gv < 4) return (glyphs[index] >> (15 - (gv * 4 + gu))) & 1 ? R.rune : R.field;
    }
    if (Math.abs(d - (radius - 11)) < 0.6) return R.ring;
    if (d < radius - 11) {
      const star = Math.abs(du) + Math.abs(dv) < 6 - Math.min(Math.abs(du), Math.abs(dv)) * 1.6;
      return star ? R.rune : R.field;
    }
    return R.base;
  });
}

/** The tables' things: a candle in its brass dish, a little flask of potion. */
const candle: Topper = (layer, x, y) => {
  const C = P.candle;
  layer.rect(x - 2, y - 1, 5, 1, C.dish[0]); layer.set(x + 2, y - 1, C.dish[1]);
  layer.rect(x - 1, y - 6, 3, 5, C.wax); layer.rect(x + 1, y - 6, 1, 5, C.shade);
  layer.set(x, y - 7, F[1]); layer.set(x, y - 8, F[2]);
};
const flask: Topper = (layer, x, y) => {
  const K = P.flask;
  layer.ellipse(x + 0.5, y - 3, 3, 3, K.liquid); layer.rect(x + 1, y - 4, 2, 3, tint(K.liquid, 0.78), [K.liquid]);
  layer.rect(x, y - 8, 2, 3, K.glass); layer.rect(x, y - 9, 2, 1, K.cork); layer.set(x - 1, y - 4, P.potionGlint);
};

/** The red velvet couch: gold cushions, a little purple pillow. */
function paintVelvetCouch(grid: PixelGrid) {
  const couch = office.couch;
  paintCouch(grid, couch, P.couch, 2, null);
  art(grid, (layer) => {
    const { x, y } = iso(...onCouchAt(couch, 10, 16), 13), K = P.pillow;
    layer.rect(x - 4, y - 7, 9, 7, K[1]); layer.rect(x - 4, y - 7, 9, 2, K[0]); layer.rect(x + 3, y - 5, 2, 5, K[2]);
    layer.set(x, y - 4, P.banner.emblem); layer.set(x - 1, y - 3, P.banner.emblem); layer.set(x + 1, y - 3, P.banner.emblem); layer.set(x, y - 2, P.banner.emblem);
  });
}

const GLOW: readonly string[] = [...F, P.torch.halo[0], P.torch.haloRight[0], P.bench.brew, P.bench.brewLight, P.bench.bubble, P.bench.fire, P.rug.rune, P.crystal.glow, P.crystal.light, P.brazier.coal];
const VIEW: readonly string[] = [...P.view.day, ...P.view.dusk, ...P.view.night, P.view.sun, P.view.cloud, P.view.star, P.view.moon, P.view.hill, P.view.hillDusk, P.view.hillNight];

export const dungeon: AmbianceDesign = {
  ...office,
  id: 'dungeon',
  deskStyle: {
    top: P.desk.top, topEdge: P.desk.edge, leg: P.desk.leg, drawers: P.desk.drawers, monitor: P.desk.monitor, monitorEdge: P.desk.monitorEdge, stand: P.desk.stand,
    vents: P.desk.vents, keyboard: P.desk.keyboard, key: P.desk.key, seats: P.seats, chairBase: P.chair.base, chairPole: P.chair.pole, backThing: candle, sideThing: flask,
  },
  paintCouch: paintVelvetCouch,
  paintCouchArm: (grid) => paintCouchArm(grid, office.couch, P.couch),
  paintDoor,
  paintBoard: paintQuestBoard,
  clock: CLOCK,
  // the offices' footprints, at the heights of what stands there
  footprints: [
    around(MONSTERA.u, MONSTERA.v, 6, 40),
    { ...BENCH, height: 38 },
    { u0: BARREL.u, u1: BARREL.u + BARREL.width, v0: BARREL.v, v1: BARREL.v + BARREL.width, height: 40 },
    { u0: BOOKCASE.u0, u1: BOOKCASE.u1, v0: BOOKCASE.v0, v1: BOOKCASE.v1, height: BOOKCASE_HEIGHT + 12 },
    { u0: CHEST.u0, u1: CHEST.u1, v0: CHEST.v0, v1: CHEST.v1, height: CHEST_HEIGHT + 20 },
    around(LAMP.u, LAMP.v, 3, 50),
  ],
  paintRoom(grid, time) {
    paintFlagstones(grid);
    paintStoneWalls(grid);
    paintArrowSlit(grid, time);
  },
  dress(grid) {
    paintBanner(grid, 34, 45, CROWN);
    paintBanner(grid, 67, 78, CUP);
    paintShield(grid);
    paintPotionShelf(grid);
    for (const { wall, a, z } of TORCHES) paintTorch(grid, wall, a, z);
    paintCobweb(grid, 'left', 0, 1); paintCobweb(grid, 'right', 0, 1); paintCobweb(grid, 'right', ROOM - 1, -1);
    paintRuneRug(grid);
    paintDoormat(grid);
  },
  standing: [
    standing(MONSTERA.u - 6, MONSTERA.u + 6, MONSTERA.v - 6, MONSTERA.v + 6, paintArmour),
    standing(BENCH.u0, BENCH.u1, BENCH.v0, BENCH.v1, paintBench),
    standing(BARREL.u, BARREL.u + BARREL.width, BARREL.v, BARREL.v + BARREL.width, paintBarrel),
    standing(CHEST.u0, CHEST.u1, CHEST.v0, CHEST.v1, paintChest),
    standing(BOOKCASE.u0, BOOKCASE.u1, BOOKCASE.v0, BOOKCASE.v1, paintBookcase),
    standing(LAMP.u, LAMP.u, LAMP.v, LAMP.v, paintBrazier),
  ],
  light: { lamp: LAMP, lampColour: P.light.lamp, ambient: P.light, lampGlow: [...F, P.brazier.coal], glow: GLOW, sky: VIEW },
};
