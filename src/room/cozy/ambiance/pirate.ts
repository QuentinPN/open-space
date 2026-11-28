// The pirate ship's cabin (ambiance 'pirate'), furnished where the offices are (office.ts: the same desks, couch, door
// and walks): walls of dark planks bowed with the hull between their ribs, a brass porthole on the sea (the view of the
// hour: a palm island and gulls by day, the sun setting at dusk, the moon on the water at night), the ship's wheel with
// the clock in its hub, the treasure map, the captain's banner, a net with its floats, crossed cutlasses over an oak
// door, a galley with its copper kettle, a water cask, a treasure chest, a crate with its rope coil, barrels and their
// parrot, lanterns, a red velvet couch, a compass rug on a deck of nailed planks, mahogany desks.
import { COZY_AMBIANCE_PALETTE, COZY_PALETTE as C } from '../../../design/room-palette.ts';
import type { WallClock } from '../clock.ts';
import { DOOR, paintCouch, paintCouchArm, paintWallBoxes, shadeAlongWalls, standing, type Topper } from '../decor.ts';
import { ROOM_UNITS as ROOM, WALL_HEIGHT, around, iso, onCouchAt } from '../geometry.ts';
import {
  fillTop, fillWall, onLeftFace, onRightFace, outlined, outlinedBox, patchOnLeftFace, patchOnRightFace, wallEllipse, wallPixel, wallPoint, wallY,
  type Painter, type PixelGrid, type PixelTarget, type Tones, type Wall,
} from '../pixels.ts';
import type { CozyTime } from '../time.ts';
import { glimmer, redraw } from '../motion.ts';
import type { AmbianceDesign, AmbianceMotion } from './index.ts';
import { COOLER, COUNTER, DRAWERS, LAMP, MONSTERA, office } from './office.ts';

const P = COZY_AMBIANCE_PALETTE.pirate, O = C.outline, V = P.view;
const ob = (grid: PixelGrid, u0: number, u1: number, v0: number, v1: number, z: number, height: number, tones: Tones, edge?: string) => outlinedBox(grid, u0, u1, v0, v1, z, height, tones, O, edge);
const art = (grid: PixelGrid, draw: (layer: PixelGrid) => void) => outlined(grid, draw, O);

/* Where things are, in the room's units */

/** The porthole on the left wall, where the offices' window is: its middle and the radius of its glass. */
const PORTHOLE = { a: 56, z: 65, glass: 15 } as const;
/** The barrels in the back corner, where the offices' monstera is; the crate and the treasure chest (by the door, in sight) where their drawers are. */
const BARRELS = MONSTERA;
const CRATE = DRAWERS[0], CHEST = DRAWERS[1];
/** The compass rug in the middle of the deck. */
const RUG = { u: 52, v: 96, radius: 22 } as const;
/** The ribs of the hull on each wall, along it. */
const RIBS: Readonly<Record<Wall, readonly number[]>> = { left: [28, 82], right: [29, 71] };

/**
 * Something flat on a back wall, outlined like the rest: `draw` puts its points (`a` along the wall, `z` up), then
 * each gets a line round it on the screen (not along the wall, whose rows step down every two pixels), then they are
 * laid on the wall.
 */
function wallArt(target: PixelTarget, wall: Wall, draw: (put: (a: number, z: number, colour: string) => void) => void) {
  const cells = new Map<string, [number, number, string]>();
  const record: PixelTarget = { set: (x, y, colour) => { cells.set(`${x},${y}`, [x, y, colour]); } };
  draw((a, z, colour) => wallPixel(record, wall, Math.floor(a), Math.floor(z), colour));
  for (const [x, y] of cells.values()) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!cells.has(`${x + dx},${y + dy}`)) target.set(x + dx, y + dy, O);
  for (const [x, y, colour] of cells.values()) target.set(x, y, colour);
}

/** Rows of letters on a back wall, the first row at the top (`z`), read from the screen's left to its right from `a`. */
function wallPattern(put: (a: number, z: number, colour: string) => void, wall: Wall, a: number, z: number, rows: readonly string[], colours: Readonly<Record<string, string>>) {
  const side = wall === 'right' ? 1 : -1;
  rows.forEach((row, line) => { [...row].forEach((letter, column) => { const colour = colours[letter]; if (colour) put(a + column * side, z - line, colour); }); });
}

/* The room */

/** The deck: planks along u, nailed at their ends, a joint here and there. */
function paintDeck(grid: PixelGrid) {
  const D = P.deck;
  fillTop(grid, 0, ROOM, 0, ROOM, 0, (u, v) => {
    const plank = Math.floor(v / 5), across = v % 5, along = (u + plank * 23) % 40;
    if (across === 4) return D.seam;
    if (along === 0) return D.joint;
    if ((along === 2 || along === 38) && (across === 1 || across === 2)) return across === 1 ? D.nail : null;
    const colour = D.tones[(plank * 7 + (plank >> 1)) % D.tones.length];
    if (across === 0 && (u + plank * 5) % 13 < 7) return D.light;
    return colour;
  });
  shadeAlongWalls(grid);
}

/** The hull: its planks bowed up towards the middle of each wall, their grain and knots, its ribs, the beam under the ceiling. */
function paintHull(grid: PixelGrid) {
  const H = P.hull;
  paintWallBoxes(grid, P.wall);
  for (const [wall, planks] of [['left', H.planksLeft], ['right', H.planksRight]] as const) {
    fillWall(grid, wall, 0, ROOM, 0, WALL_HEIGHT, (a, z) => {
      const lift = z - Math.round(3 * Math.sin((Math.PI * a) / ROOM)), row = Math.floor(lift / 7), within = ((lift % 7) + 7) % 7;
      if (within === 6) return H.seam;
      if ((a + row * 37) % 52 === 0) return H.seam;
      if (within === 5) return H.plankLight;
      if (within === 2 && (a * 3 + row * 11) % 29 < 4) return H.grain;
      if ((a + row * 19) % 61 === 30 && (within === 2 || within === 3)) return H.knot;
      return planks[(row * 5 + Math.floor((a + row * 37) / 52)) % planks.length];
    });
    for (const a of RIBS[wall]) wallArt(grid, wall, (put) => {
      for (let z = 4; z < WALL_HEIGHT - 8; z++) for (let step = 0; step < 4; step++) put(a + step, z, H.rib[step === 0 ? 0 : step === 3 ? 2 : 1]);
      for (const z of [18, 52, 80]) put(a + 1, z, H.peg);
    });
    // the beam under the ceiling, the skirting at the floor
    fillWall(grid, wall, 0, ROOM, WALL_HEIGHT - 8, WALL_HEIGHT, (_, z) => (z === WALL_HEIGHT - 8 ? O : z === WALL_HEIGHT - 7 ? H.beam[2] : z === WALL_HEIGHT - 1 ? H.beam[0] : H.beam[1]));
    fillWall(grid, wall, 0, ROOM, 0, 4, (_, z) => (z === 3 ? H.plankLight : H.skirting));
  }
}

/** Which point of a row of the sea's crests a column of the glass shows, the row `depth` under the horizon; the nearer rows drift faster as the `frame`s go by (0 at rest). */
function waveAt(pa: number, depth: number, frame: number): number {
  const drift = Math.floor((frame * (2 + Math.floor((depth - 1) / 3))) / 12);
  return (((pa + drift + ((depth * 5) % 9)) % 9) + 9) % 9;
}

/** The sea at `depth` pixels under the horizon in a column of the glass: rows of little crests every three, their tips foaming in the row above. */
function seaAt(time: CozyTime, pa: number, depth: number, frame: number): string {
  if (depth >= 2 && (depth - 2) % 3 === 0 && waveAt(pa, depth, frame) < 4) return V.crest[time];
  if (depth >= 1 && (depth - 1) % 3 === 0) { const k = waveAt(pa, depth + 1, frame); if (k === 1 || k === 2) return V.foam[time]; }
  const sea = V.sea[time];
  return sea[Math.min(sea.length - 1, Math.floor((depth - 1) / 4))];
}

/**
 * The sea through the porthole at `time`: the sky and its sun, clouds or stars, the island and its palm, the waves.
 * The view is seen through the wall, not painted on it: its horizon and its waves run level on the screen, so each
 * point of the glass is placed by how high it is on the screen above the horizon (`up`), not along the wall.
 */
function paintSea(grid: PixelGrid, time: CozyTime) {
  const wall: Wall = 'left', { a, z, glass } = PORTHOLE, sky = V[time], night = time === 'night', dusk = time === 'dusk';
  const foot = (pa: number) => wallPoint(wall, pa, 0)[1], horizon = foot(a) - (z - 2);
  /** how many pixels above the horizon a point of the glass shows, and the point of a column that many above it */
  const up = (pa: number, pz: number) => horizon - foot(pa) + pz;
  const at = (pa: number, rise: number) => foot(pa) - horizon + rise;
  const inGlass = (pa: number, pz: number) => (pa + 0.5 - a) ** 2 + (pz + 0.5 - z) ** 2 < glass * glass;
  const put = (pa: number, pz: number, colour: string) => { if (inGlass(pa, pz)) wallPixel(grid, wall, pa, pz, colour); };
  const level = (pa: number, rise: number, colour: string) => put(pa, at(pa, rise), colour);
  /** a disc round (ca, rise) above the horizon, cut at it */
  const disc = (ca: number, rise: number, radius: number, colour: string) => {
    for (let pa = Math.floor(ca - radius); pa <= ca + radius; pa++) for (let dz = Math.floor(-radius); dz <= radius; dz++) {
      if ((pa + 0.5 - ca) ** 2 + (dz + 0.5) ** 2 <= radius * radius && rise + dz >= 0) level(pa, Math.round(rise + dz), colour);
    }
  };
  fillWall(grid, wall, a - glass, a + glass, z - glass, z + glass, (pa, pz) => {
    if (!inGlass(pa, pz)) return null;
    const rise = up(pa, pz);
    if (rise >= 0) return sky[Math.max(0, sky.length - 1 - Math.floor((rise * sky.length) / (glass + 4)))];
    return seaAt(time, pa, -rise, 0);
  });
  if (night) {
    for (const [pa, rise] of [[a + 9, 13], [a + 3, 16], [a - 4, 8], [a + 12, 6], [a - 11, 5], [a + 6, 8], [a - 1, 14]]) level(pa, rise, V.star);
    disc(a - 5.5, 10, 3.8, V.moon); disc(a - 4.2, 11, 3, sky[1]); level(a - 7, 9, V.moonShade);
  } else if (dusk) {
    disc(a - 3.5, 0, 5.6, V.sunLow); disc(a - 3.5, 0, 3.6, V.sunLowLight);
  } else {
    disc(a - 7.5, 10, 3.4, V.sun); disc(a - 7.8, 10.3, 2, V.sunLight);
    for (const [ca, rise, size] of [[a + 6, 12, 1], [a - 1, 6, 0.7]] as const) {
      for (let pa = Math.floor(ca - 5 * size); pa <= ca + 5 * size; pa++) for (const dz of [0, 1]) {
        if (Math.abs(pa + 0.5 - ca) <= (dz ? 3 : 5) * size) level(pa, rise + dz, dz ? V.cloud : V.cloudShade);
      }
    }
    for (const [ga, rise] of [[a - 1, 13], [a + 3, 16]]) { level(ga + 1, rise, V.gull); level(ga, rise + 1, V.gull); level(ga - 1, rise, V.gull); }
  }
  // the island on the horizon and its palm
  const land = night ? V.nightIsland : dusk ? V.silhouette : V.island, palm = night ? V.nightIsland : dusk ? V.silhouette : V.palm, trunk = night ? V.nightIsland : dusk ? V.silhouette : V.trunk;
  for (let pa = a + 4; pa <= a + 12; pa++) { level(pa, 0, land); if (pa > a + 5 && pa < a + 11) level(pa, 1, land); }
  for (const [pa, rise] of [[a + 8, 2], [a + 8, 3], [a + 9, 4], [a + 9, 5]]) level(pa, rise, trunk);
  for (const [pa, rise] of [[a + 7, 6], [a + 8, 6], [a + 9, 6], [a + 10, 6], [a + 11, 6], [a + 6, 5], [a + 12, 5], [a + 9, 7], [a + 10, 7], [a + 5, 4], [a + 13, 4]]) level(pa, rise, palm);
  // the light of the sun or the moon on the water, under it
  const shine = night ? V.moonShade : dusk ? V.sunLowLight : V.glitter, along = night ? a - 5 : dusk ? a - 3 : a - 7;
  for (let depth = 1, row = 0; depth < glass; depth += 2, row++) {
    const half = Math.max(1, 3 - (row >> 1));
    for (let pa = along - half; pa <= along + half; pa += 2) level(pa + (row % 2), -depth, shine);
  }
}

/** The porthole: its brass ring and its bolts round the sea of the hour, its hinge and its latch, a glint on the glass. */
function paintPorthole(grid: PixelGrid, time: CozyTime) {
  const wall: Wall = 'left', R = P.porthole, { a, z, glass } = PORTHOLE;
  // the hinge on one side, the latch on the other, behind the ring
  wallArt(grid, wall, (put) => {
    for (let pa = a + glass + 3; pa < a + glass + 7; pa++) for (let pz = z - 3; pz < z + 3; pz++) put(pa, pz, pz === z + 2 ? R.hingeLight : R.hinge);
    for (let pa = a - glass - 6; pa < a - glass - 2; pa++) for (let pz = z - 1; pz < z + 2; pz++) put(pa, pz, pz === z + 1 ? R.hingeLight : R.hinge);
  });
  // the ring, lit from above, its lip round the glass, its bolts
  wallEllipse(grid, wall, a + 0.5, z + 0.5, glass + 5.6, glass + 5.6, O);
  wallEllipse(grid, wall, a + 0.5, z + 0.5, glass + 4.8, glass + 4.8, R.brass[2]);
  wallEllipse(grid, wall, a + 0.5, z + 1, glass + 4.2, glass + 4.2, R.brass[1]);
  wallEllipse(grid, wall, a + 0.5, z + 1.6, glass + 3.2, glass + 3.2, R.brass[0]);
  wallEllipse(grid, wall, a + 0.5, z + 0.8, glass + 2.4, glass + 2.4, R.brass[1]);
  wallEllipse(grid, wall, a + 0.5, z + 0.5, glass + 1.2, glass + 1.2, R.brass[2]);
  for (let index = 0; index < 8; index++) {
    const angle = (index * Math.PI) / 4 + Math.PI / 8;
    wallPixel(grid, wall, Math.round(a + Math.cos(angle) * (glass + 3)), Math.round(z + Math.sin(angle) * (glass + 3)), R.bolt);
  }
  paintSea(grid, time);
  for (let step = 0; step < 5; step++) wallPixel(grid, wall, a + 7 + step, z + 10 - step, R.glint);
  for (let step = 0; step < 2; step++) wallPixel(grid, wall, a + 11 + step, z + 4 - step, R.glint);
}

/** The ship's wheel on the right wall, above the galley, the clock in its hub: its rim, its eight spokes and their handles. */
const WHEEL = { a: 51, z: 70 } as const;
const paintWheel = (target: PixelTarget) => {
  const W = P.wheel, K = P.clock, { a, z } = WHEEL;
  wallArt(target, 'right', (put) => {
    for (let pa = a - 20; pa <= a + 20; pa++) for (let pz = z - 20; pz <= z + 20; pz++) {
      const da = pa + 0.5 - a, dz = pz + 0.5 - z, d = Math.sqrt(da * da + dz * dz);
      if (d <= 6) { put(pa, pz, K.face); continue; }
      if (d <= 7.6) { put(pa, pz, dz < -2 ? K.rimShade : K.rim); continue; }
      // the rim, lit from above, then the eight spokes through it, their handles beyond
      if (d >= 11.6 && d <= 14.2) { put(pa, pz, d < 12.6 ? W.wood[2] : dz > 4 ? W.wood[0] : dz < -4 ? W.wood[2] : W.wood[1]); continue; }
      for (let spoke = 0; spoke < 8; spoke++) {
        const angle = Math.PI / 8 + (spoke * Math.PI) / 4, along = da * Math.sin(angle) + dz * Math.cos(angle), off = Math.abs(da * Math.cos(angle) - dz * Math.sin(angle));
        if (along > 7.6 && along < 11.6 && off < 1.1) put(pa, pz, W.wood[1]);
        else if (along > 14.2 && along < 18.6 && off < (along > 16 ? 1.7 : 1.1)) put(pa, pz, off < 0.6 && along > 16 ? W.handle[0] : dz < 0 ? W.handle[2] : W.handle[1]);
      }
    }
  });
  for (const [da, dz] of [[0, 5], [5, 0], [0, -5], [-5, 0]]) wallPixel(target, 'right', a + da, z + dz, K.tick);
};
const CLOCK: WallClock = { wall: 'right', a: WHEEL.a, z: WHEEL.z, radius: 6, shape: paintWheel, tones: P.clock };

/** The captain's banner by the back corner: black cloth with its swallowtail, a skull and crossed bones, on its pole. */
function paintBanner(grid: PixelGrid) {
  const wall: Wall = 'right', B = P.banner, a0 = 6, a1 = 28, top = 84, bottom = 58, middle = (a0 + a1) / 2;
  wallArt(grid, wall, (put) => {
    for (let a = a0; a < a1; a++) {
      const low = bottom + Math.max(0, 7 - Math.abs(a + 0.5 - middle) * 0.9), fold = (a - a0) % 7;
      for (let z = Math.ceil(low); z < top; z++) put(a, z, z < low + 1.5 ? B.gold : fold < 2 ? B.cloth[0] : fold > 4 ? B.cloth[2] : B.cloth[1]);
    }
    const colours = { s: B.bone, d: B.boneShade, e: B.cloth[2] };
    wallPattern(put, wall, middle - 4.5, top - 5, ['..sssss..', '.sssssss.', 'sssssssss', 'seesdseed', 'seesdseed', 'sssseddss', '.sssssss.', '..sdsds..'], colours);
    wallPattern(put, wall, middle - 6.5, top - 14, ['ss.........ss', 'sdss.....ssds', '...ssd.dss...', '.....sss.....', '...ssd.dss...', 'sdss.....ssds', 'ss.........ss'], colours);
  });
  wallArt(grid, wall, (put) => {
    for (let a = a0 - 2; a < a1 + 2; a++) { put(a, top, B.poleShade); put(a, top + 1, B.pole); }
    for (const a of [a0 - 4, a1 + 2]) for (const [da, dz] of [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, -1]]) put(a + da, top - 0.5 + dz, B.gold);
  });
  // its cord, from the pole's two ends up to a nail over its middle
  for (let a = a0; a < a1; a++) wallPixel(grid, wall, a, top + 2 + Math.round(5 * (1 - Math.abs(a + 0.5 - middle) / (middle - a0))), B.cord);
  wallPixel(grid, wall, Math.floor(middle), top + 8, P.hull.peg);
}

/** A net hung in the back corner of the left wall, its glass floats and a starfish caught in it. */
function paintNet(grid: PixelGrid) {
  const wall: Wall = 'left', N = P.net, a0 = 3, a1 = 25, top = 90;
  fillWall(grid, wall, a0, a1, 54, top, (a, z) => {
    const low = 60 + 0.05 * (a - 14) ** 2;
    if (z < low) return null;
    const one = (a + z) % 4 === 0, other = (((a - z) % 4) + 4) % 4 === 0;
    return one && other ? N.knot : one || other ? N.cord : z < low + 1 ? N.cord : null;
  });
  for (const [a, z, radius] of [[8, 70, 3.2], [19, 75, 2.6]] as const) wallArt(grid, wall, (put) => {
    for (let pa = Math.floor(a - radius); pa <= a + radius; pa++) for (let pz = Math.floor(z - radius); pz <= z + radius; pz++) {
      const da = pa + 0.5 - a, dz = pz + 0.5 - z;
      if (da * da + dz * dz <= radius * radius) put(pa, pz, dz > radius * 0.3 ? N.float[0] : dz < -radius * 0.35 ? N.float[2] : N.float[1]);
    }
    put(a + 1, z + 1, N.floatLight);
  });
  wallArt(grid, wall, (put) => wallPattern(put, wall, 16, 86, ['..s..', 'sssss', '.sss.', '.s.s.'], { s: N.star }));
  wallPixel(grid, wall, 14, 84, N.starShade);
  for (const a of [a0, a1 - 1]) wallArt(grid, wall, (put) => { put(a, top, P.hull.peg); put(a, top + 1, P.hull.peg); });
}

/** Two cutlasses crossed above the door. */
function paintCutlasses(grid: PixelGrid) {
  const wall: Wall = 'left', K = P.cutlass, { a0, a1 } = DOOR, z0 = 70;
  wallArt(grid, wall, (put) => {
    for (const side of [1, -1]) {
      const from = side > 0 ? a0 + 3 : a1 - 3;
      for (let step = 0; step < 15; step++) {
        const a = from + side * step, z = z0 + 3 + step + Math.round(Math.sin((step / 14) * Math.PI) * 1.4);
        put(a, z, step < 3 ? K.grip : K.blade); if (step >= 3) put(a, z - 1, K.bladeShade);
      }
      for (let step = -2; step <= 2; step++) put(from + side * (3 + step), z0 + 6 - step, K.hilt);
      put(from - side, z0 + 2, K.hilt);
    }
  });
}

/** A coil of rope hung on a peg on the left wall, between the rib and the door. */
function paintHungRope(grid: PixelGrid) {
  const wall: Wall = 'left', R = P.crate.rope, a = 92, z = 58;
  wallArt(grid, wall, (put) => {
    for (let pa = a - 6; pa <= a + 6; pa++) for (let pz = z - 7; pz <= z + 7; pz++) {
      const da = (pa + 0.5 - a) / 5.6, dz = (pz + 0.5 - z) / 6.6, d = Math.sqrt(da * da + dz * dz);
      if (d > 1 || d < 0.5) continue;
      put(pa, pz, d > 0.84 ? R[2] : (pa + pz) % 3 === 0 ? R[0] : R[1]);
    }
    for (let pz = z - 9; pz < z - 5; pz++) put(a + 2, pz, R[1]);
    put(a, z + 7, P.hull.peg); put(a - 1, z + 7, P.hull.peg);
  });
}

/** The oak door of the cabin: its planks, two iron straps, its round window and its brass ring: a click goes through it. */
const paintCabinDoor: Painter = (grid) => {
  const D = P.door, { a0, a1, height } = DOOR, wall: Wall = 'left', middle = (a0 + a1) >> 1;
  wallArt(grid, wall, (put) => {
    for (let a = a0 - 2; a < a1 + 2; a++) for (let z = 0; z < height + 3; z++) {
      const frame = a < a0 || a >= a1 || z >= height;
      if (frame) { put(a, z, z >= height + 2 ? D.frame[0] : a === a0 - 2 ? D.frame[0] : a === a1 + 1 ? D.frame[2] : D.frame[1]); continue; }
      const plank = (a - a0) % 5;
      put(a, z, plank === 4 ? D.seam : plank === 0 ? D.leafLight : (a * 7 + z * 3) % 37 === 0 ? D.leafShade : D.leaf);
    }
    for (const z of [8, 30]) for (let a = a0; a < a1; a++) {
      put(a, z, D.iron); put(a, z + 1, D.iron); put(a, z + 2, D.ironLight);
      if ((a - a0) % 5 === 2) put(a, z + 1, D.rivet);
    }
    // the round window, its brass ring, the glass and its glint
    const wz = 46;
    for (let a = middle - 6; a <= middle + 6; a++) for (let z = wz - 6; z <= wz + 6; z++) {
      const d = Math.sqrt((a + 0.5 - middle) ** 2 + (z + 0.5 - wz) ** 2);
      if (d <= 4) put(a, z, D.glass);
      else if (d <= 5.6) put(a, z, z < wz - 1 ? D.ringShade : D.ring);
    }
    put(middle + 1, wz + 2, D.glassLight); put(middle + 2, wz + 1, D.glassLight); put(middle, wz + 3, D.glassLight);
    // the ring to pull it by, on the side away from the hinges
    const ra = a1 - 5, rz = 21;
    for (let a = ra - 3; a <= ra + 3; a++) for (let z = rz - 3; z <= rz + 3; z++) {
      const d = Math.sqrt((a + 0.5 - ra) ** 2 + (z + 0.5 - rz) ** 2);
      if (d > 1.4 && d <= 2.9) put(a, z, z < rz ? D.ringShade : D.ring);
    }
    put(ra, rz + 3, D.iron); put(ra - 1, rz + 3, D.iron); put(ra, rz + 4, D.iron); put(ra - 1, rz + 4, D.iron);
  });
};

/** The rope mat in front of the door: rings of braid. */
function paintRopeMat(grid: PixelGrid) {
  const { a0, a1 } = DOOR, M = P.door.mat, cu = 6.5, cv = (a0 + a1) / 2;
  fillTop(grid, 0, 13, a0, a1, 0, (u, v) => {
    const d = Math.sqrt(((u + 0.5 - cu) / 6) ** 2 + ((v + 0.5 - cv) / 10) ** 2);
    if (d > 1) return null;
    if (d > 0.9) return M[2];
    const ring = Math.floor(d * 6);
    return (u + v + ring) % 3 === 0 ? M[0] : ring % 2 ? M[1] : M[2];
  });
}

/** The treasure map on the right wall, the board: its islands, the dotted way to the X, a compass rose, pinned at its corners. */
const paintMap: Painter = (grid) => {
  const wall: Wall = 'right', M = P.map, a0 = 75, a1 = 121, z0 = 47, z1 = 86;
  const bite = (n: number) => (((n * 7) % 11 === 0 || (n * 5) % 13 === 0) ? 1 : 0);
  const inside = (a: number, z: number) => a >= a0 + bite(z) && a < a1 - bite(z + 3) && z >= z0 + bite(a) && z < z1 - bite(a + 2);
  const island = (a: number, z: number, ca: number, cz: number, ra: number, rz: number) => ((a + 0.5 - ca) / ra) ** 2 + ((z + 0.5 - cz) / rz) ** 2 + 0.12 * Math.sin(a * 1.3) + 0.1 * Math.cos(z * 1.7) < 1;
  const onLand = (a: number, z: number) => island(a, z, 89, 63, 11, 8) || island(a, z, 111, 77, 5, 3.6);
  wallArt(grid, wall, (put) => {
    for (let a = a0; a < a1; a++) for (let z = z0; z < z1; z++) {
      if (!inside(a, z)) continue;
      const edge = !inside(a - 1, z) || !inside(a + 1, z) || !inside(a, z - 1) || !inside(a, z + 1);
      const near = !inside(a - 2, z) || !inside(a + 2, z) || !inside(a, z - 2) || !inside(a, z + 2);
      if (edge) { put(a, z, M.burnt); continue; }
      if (onLand(a, z)) {
        const coast = !onLand(a - 1, z) || !onLand(a + 1, z) || !onLand(a, z - 1) || !onLand(a, z + 1);
        put(a, z, coast ? M.ink : M.land);
        continue;
      }
      const shore = onLand(a - 2, z) || onLand(a + 2, z) || onLand(a, z - 2) || onLand(a, z + 2);
      put(a, z, shore ? M.sea : near ? M.parchment[2] : (a + z * 3) % 17 === 0 ? M.parchment[1] : z > z1 - 10 && a < a0 + 12 ? M.parchment[1] : M.parchment[0]);
    }
  });
  const ink = (a: number, z: number, colour: string) => wallPixel(grid, wall, a, z, colour);
  // trees and a hill on the big island, the X where the treasure is
  for (const [a, z] of [[82, 64], [85, 68], [97, 66]] as const) { ink(a, z + 1, M.green); ink(a - 1, z + 1, M.green); ink(a + 1, z + 1, M.green); ink(a, z + 2, M.green); ink(a, z, M.greenDark); ink(a, z - 1, M.inkFaint); }
  for (let step = 0; step < 4; step++) { ink(91 + step, 64 + step, M.ink); ink(98 - step, 64 + step, M.ink); }
  for (let step = -2; step <= 2; step++) { ink(89 + step, 59 + step, M.x); ink(89 + step, 59 - step, M.x); ink(90 + step, 59 + step, M.x); ink(90 + step, 59 - step, M.x); }
  // the way from the little island, dotted
  for (let step = 0, dot = 0; step <= 24; step++) {
    const t = step / 24, a = Math.round((1 - t) ** 2 * 108 + 2 * (1 - t) * t * 104 + t * t * 93), z = Math.round((1 - t) ** 2 * 74 + 2 * (1 - t) * t * 64 + t * t * 61);
    if (step % 3 < 2 && dot++ >= 0) ink(a, z, M.path);
  }
  // waves, a little ship, the compass rose
  for (const [a, z] of [[79, 79], [101, 52], [114, 64], [79, 52], [105, 82]] as const) { ink(a, z, M.inkFaint); ink(a + 1, z + 1, M.inkFaint); ink(a + 2, z, M.inkFaint); ink(a + 3, z + 1, M.inkFaint); }
  for (let a = 100; a < 105; a++) ink(a, 72, M.ink);
  for (const [a, z] of [[101, 73], [102, 73], [103, 73], [102, 74], [102, 75], [102, 76], [103, 75], [103, 74]] as const) ink(a, z, z === 73 ? M.ink : M.parchment[2]);
  const [ca, cz] = [114, 55];
  for (let step = 1; step <= 4; step++) { ink(ca, cz + step, step === 4 ? M.x : M.ink); ink(ca, cz - step, M.ink); ink(ca + step, cz, M.ink); ink(ca - step, cz, M.ink); }
  for (const [da, dz] of [[1, 1], [-1, 1], [1, -1], [-1, -1], [2, 2], [-2, 2], [2, -2], [-2, -2]] as const) ink(ca + da, cz + dz, M.inkFaint);
  for (const [a, z] of [[77, 83], [118, 83], [77, 49], [118, 49]] as const) { ink(a, z, M.pin); ink(a + 1, z, M.pinShade); ink(a, z - 1, M.pinShade); }
};

/* What stands on the floor */

/**
 * A barrel standing at (x, y) on screen (the middle of its foot), `half` pixels across each way, `height` tall: its
 * staves lit from the left, two hoops, its lid. On a layer of its own.
 */
function barrel(layer: PixelGrid, x: number, y: number, half: number, height: number, K: { staves: Tones; hoop: string; hoopLight: string; lid: Tones }) {
  const rise = half / 2;
  for (let dx = -half - 1; dx <= half + 1; dx++) {
    const t = Math.min(1, Math.abs(dx) / (half + 0.5)), foot = Math.round(rise * Math.sqrt(1 - t * t)), bulge = Math.abs(dx) > half;
    const tone = dx < -half * 0.45 ? K.staves[0] : dx > half * 0.5 ? K.staves[2] : K.staves[1];
    const from = bulge ? y - Math.round(height * 0.75) : y - height, to = bulge ? y - Math.round(height * 0.25) : y + foot;
    for (let row = from; row < to; row++) layer.set(x + dx, row, dx % 3 === 0 && !bulge && Math.abs(dx) < half ? K.staves[dx < 0 ? 1 : 2] : tone);
    if (bulge) continue;
    for (const lift of [3, height - 4]) { layer.set(x + dx, y + foot - lift, K.hoop); layer.set(x + dx, y + foot - lift - 1, dx < 0 ? K.hoopLight : K.hoop); }
  }
  layer.ellipse(x + 0.5, y - height + 0.5, half + 0.5, rise + 0.5, K.lid[2]);
  layer.ellipse(x + 0.5, y - height, half - 0.5, rise - 0.3, K.lid[1]);
  layer.ellipse(x - 0.5, y - height - 0.5, half * 0.5, rise * 0.4, K.lid[0], [K.lid[1]]);
}

/** The barrels in the back corner, a keg on the big one and the ship's parrot on the keg. */
function paintBarrels(grid: PixelGrid) {
  const { x, y } = iso(BARRELS.u, BARRELS.v), R = P.parrot;
  art(grid, (layer) => barrel(layer, x, y, 8, 22, P.barrel));
  art(grid, (layer) => barrel(layer, x + 1, y - 24, 5, 11, { ...P.barrel, staves: P.cask.staves }));
  art(grid, (layer) => layer.pattern(x - 2, y - 46, [
    '..rr...', '.rrrr..', 'krerrr.', 'kkrrrr.', '.yrrrb.', '.yrrbb.', '..rrbg.', '..rbbg.', '...bg..', '..f.f..',
  ], { r: R.red, k: R.beak, e: R.eye, y: R.yellow, b: R.blue, g: R.green, f: O }));
  grid.set(x - 1, y - 44, O);
}

/** The galley where the offices' counter is: oak slats, a top, the copper kettle, two bottles, a bowl of fruit. */
function paintGalley(grid: PixelGrid) {
  const G = P.galley, { u0, u1, v0, v1 } = COUNTER, front = v1 - 1;
  ob(grid, u0 + 1, u1 - 1, v0, front, 0, 20, G.body);
  for (let a = u0 + 3; a < u1 - 2; a += 3) { patchOnLeftFace(grid, front, a, a + 1, 2, 19, G.slat); patchOnLeftFace(grid, front, a + 1, a + 2, 3, 19, G.slatLight); }
  patchOnLeftFace(grid, front, u0 + 1, u1 - 1, 0, 2, G.slat);
  ob(grid, u0, u1, v0, v1, 20, 2, G.top, G.topEdge);
  art(grid, (layer) => {
    const { x, y } = iso(u0 + 8, v0 + 8, 22);
    layer.ellipse(x + 0.5, y - 4, 4.6, 3.8, G.kettle[1]); layer.ellipse(x - 0.5, y - 5, 2.6, 2.2, G.kettle[0], [G.kettle[1]]);
    layer.rect(x + 3, y - 6, 2, 5, G.kettle[2]); layer.rect(x - 2, y - 9, 5, 1, G.kettleLight); layer.set(x, y - 10, G.kettle[2]);
    layer.points([[x - 5, y - 4], [x - 6, y - 5], [x - 7, y - 6], [x - 5, y - 5]], G.kettle[1]);
    layer.points([[x - 3, y - 10], [x - 3, y - 11], [x - 2, y - 12], [x - 1, y - 12], [x, y - 12], [x + 1, y - 12], [x + 2, y - 12], [x + 3, y - 11], [x + 3, y - 10]], G.kettle[2]);
  });
  art(grid, (layer) => {
    const { x, y } = iso(u0 + 17, v0 + 5, 22);
    layer.rect(x - 1, y - 8, 3, 8, G.bottle[1]); layer.rect(x - 1, y - 8, 1, 8, G.bottle[0]); layer.rect(x + 1, y - 8, 1, 8, G.bottle[2]);
    layer.rect(x, y - 11, 1, 3, G.bottle[1]); layer.set(x, y - 12, G.cork);
  });
  art(grid, (layer) => {
    const { x, y } = iso(u0 + 21, v0 + 9, 22);
    layer.rect(x - 2, y - 7, 5, 7, G.rum[1]); layer.rect(x - 2, y - 7, 1, 7, G.rum[0]); layer.rect(x + 2, y - 7, 1, 7, G.rum[2]);
    layer.rect(x - 1, y - 5, 3, 2, G.label); layer.rect(x, y - 10, 1, 3, G.rum[1]); layer.set(x, y - 11, G.cork);
  });
  art(grid, (layer) => {
    const { x, y } = iso(u0 + 30, v0 + 8, 22);
    layer.ellipse(x - 2.5, y - 5, 2.2, 2.2, G.orange); layer.set(x - 3, y - 6, G.orangeLight);
    layer.ellipse(x + 2.5, y - 5, 2.2, 2.2, G.orange); layer.set(x + 2, y - 6, G.orangeLight);
    layer.ellipse(x + 0.5, y - 7, 2.2, 2.2, G.apple); layer.set(x, y - 10, G.leaf); layer.set(x + 1, y - 10, G.leaf);
    for (const [row, half, tone] of [[3, 5, 0], [2, 4, 1], [1, 3, 2]] as const) layer.rect(x - half, y - row, 2 * half + 1, 1, G.bowl[tone]);
  });
}

/** The water cask where the offices' cooler is: on its stand, its brass tap towards the room, a tankard waiting by it. */
function paintCask(grid: PixelGrid) {
  const K = P.cask, { u, v, width } = COOLER;
  ob(grid, u, u + width, v, v + width, 0, 6, K.stand);
  onLeftFace(grid, v + width, u + 1, u + width - 1, 3, K.stand[2]);
  const { x, y } = iso(u + 6, v + 6, 6);
  art(grid, (layer) => barrel(layer, x, y, 7, 20, { staves: K.staves, hoop: K.hoop, hoopLight: K.hoopLight, lid: P.barrel.lid }));
  art(grid, (layer) => { layer.rect(x - 7, y - 6, 4, 2, K.tap); layer.set(x - 7, y - 4, K.tapShade); layer.set(x - 5, y - 7, K.tapShade); });
  grid.set(x - 7, y - 2, K.drip);
  art(grid, (layer) => tankard(layer, ...xyOf(iso(u + 3, v + 11, 6))));
}

const xyOf = ({ x, y }: { x: number; y: number }): [number, number] => [x, y];

/** The treasure chest where the offices' mint drawers are, by the door: its front towards the room, its lid open against the wall, its gold and its gems spilling. */
function paintChest(grid: PixelGrid) {
  const K = P.chest, { u0, u1, v0, v1 } = CHEST, middle = (v0 + v1) >> 1, height = 10;
  ob(grid, u0 + 1, u1, v0, v1, 0, height, K.wood, K.wood[0]);
  for (const v of [v0 + 2, v1 - 4]) { patchOnRightFace(grid, u1, v, v + 2, 0, height, K.band[1]); onRightFace(grid, u1, v, v + 2, height - 1, K.band[0]); }
  for (const u of [u0 + 3, u1 - 4]) patchOnLeftFace(grid, v1, u, u + 2, 0, height, K.band[1]);
  patchOnRightFace(grid, u1, middle - 1, middle + 2, 4, 8, K.lock); onRightFace(grid, u1, middle, middle + 1, 5, K.band[2]);
  // the lid, open against the wall, its red lining towards the room
  ob(grid, u0, u0 + 2, v0, v1, height, 12, K.wood, K.wood[0]);
  patchOnRightFace(grid, u0 + 2, v0 + 1, v1 - 1, height + 2, height + 11, K.lining);
  patchOnLeftFace(grid, v1, u0, u0 + 2, height + 2, height + 4, K.band[1]); patchOnLeftFace(grid, v1, u0, u0 + 2, height + 8, height + 10, K.band[1]);
  art(grid, (layer) => {
    const { x, y } = iso((u0 + u1) / 2 + 1, middle, height);
    layer.ellipse(x + 0.5, y - 1, 7, 3, K.coins[2]); layer.ellipse(x + 0.5, y - 2, 6, 2.6, K.coins[1]); layer.ellipse(x + 0.5, y - 3, 3.6, 1.8, K.coins[1]);
    for (const [dx, dy] of [[-4, -2], [-1, -4], [2, -3], [4, -1], [0, -1], [-2, 0], [2, 0]]) layer.set(x + dx, y + dy, K.coins[0]);
    layer.set(x - 2, y - 3, K.gems[0]); layer.set(x + 3, y - 2, K.gems[1]); layer.set(x + 1, y - 4, K.gems[2]);
    for (const [dx, dy] of [[5, -3], [6, -2], [6, -1], [5, 0]]) layer.set(x + dx, y + dy, K.pearl);
  });
  art(grid, (layer) => {
    for (const [du, dv] of [[3, -2], [5, 2], [3, 5]]) { const { x, y } = iso(u1 + du, middle + dv); layer.rect(x - 1, y - 1, 3, 1, K.coins[1]); layer.set(x, y - 1, K.coins[0]); }
  });
}

/** A crate where the offices' lemon drawers are, by the back wall: its slats and its brace, a coil of rope on top. */
function paintCrate(grid: PixelGrid) {
  const K = P.crate, { u0, u1, v0, v1 } = CRATE, height = 16;
  ob(grid, u0, u1, v0, v1, 0, height, K.wood, K.wood[0]);
  for (const z of [5, 10]) { onRightFace(grid, u1, v0, v1, z, K.brace); onLeftFace(grid, v1, u0, u1, z, K.brace); }
  for (let step = 0; step < v1 - v0 - 2; step++) onRightFace(grid, u1, v0 + 1 + step, v0 + 2 + step, 2 + Math.round((step * (height - 4)) / (v1 - v0 - 3)), K.brace);
  for (const a of [v0, v1 - 1]) patchOnRightFace(grid, u1, a, a + 1, 0, height, K.brace);
  const { x, y } = iso((u0 + u1) / 2, (v0 + v1) / 2, height);
  art(grid, (layer) => {
    for (let ring = 0; ring < 3; ring++) {
      layer.ellipse(x + 0.5, y - 1 - ring * 2, 7 - ring, 3.4 - ring * 0.4, K.rope[2]);
      layer.ellipse(x + 0.5, y - 2 - ring * 2, 7 - ring, 3.2 - ring * 0.4, K.rope[1]);
    }
    layer.ellipse(x + 0.5, y - 6.5, 2.4, 1.1, K.wood[2]);
    for (let dx = -6; dx <= 6; dx += 3) layer.set(x + dx, y - 2 - (Math.abs(dx) < 4 ? 2 : 0), K.rope[0]);
    for (const [dx, dy] of [[5, -1], [6, 0], [6, 1], [7, 2], [7, 3]]) layer.set(x + dx, y + dy, K.rope[1]);
  });
}

/** A lantern of iron and glass, on a layer of its own, its top at (x, y) on screen. */
function lantern(layer: PixelGrid, x: number, y: number, K: { iron: string; ironLight: string; glass: string; glassLight: string; glassShade: string }) {
  layer.pattern(x - 3, y, ['...i...', '..ili..', '.iiiii.', '.ighsi.', '.igLsi.', '.iggsi.', '.ighsi.', '.iiiii.', '..iii..'], {
    i: K.iron, l: K.ironLight, g: K.glass, L: K.glassLight, h: K.glassLight, s: K.glassShade,
  });
}

/** A lantern hung from the ship's rib on the left wall, between the net and the porthole. */
function paintWallLantern(grid: PixelGrid) {
  const [x, y] = wallPoint('left', 30, 74), L = P.wallLantern;
  art(grid, (layer) => { layer.rect(x - 1, y, 3, 1, L.iron); layer.rect(x + 1, y, 1, 3, L.iron); lantern(layer, x + 1, y + 3, L); });
}

/** The lantern on its post where the offices' floor lamp stands. */
function paintLanternPost(grid: PixelGrid) {
  const L = P.lamp, { x, y } = iso(LAMP.u, LAMP.v);
  art(grid, (layer) => {
    layer.ellipse(x + 0.5, y - 1, 4, 1.8, L.post[1]); layer.ellipse(x - 0.5, y - 1.5, 2, 0.9, L.post[0], [L.post[1]]);
    layer.rect(x - 1, y - 42, 3, 41, L.post[1]); layer.rect(x - 1, y - 42, 1, 41, L.post[0]); layer.rect(x + 1, y - 42, 1, 41, L.post[2]);
    layer.rect(x + 2, y - 41, 6, 1, L.iron); layer.points([[x + 2, y - 38], [x + 3, y - 39], [x + 4, y - 40]], L.iron);
  });
  art(grid, (layer) => { layer.set(x + 6, y - 40, L.iron); lantern(layer, x + 6, y - 39, L); });
}

/** The red velvet couch of the captain, gold buttons on its back, a navy pillow with its anchor. */
function paintCaptainCouch(grid: PixelGrid) {
  const couch = office.couch;
  paintCouch(grid, couch, P.couch, 2, null);
  for (let v = couch.v + 9; v < couch.v + couch.length - 8; v += 6) for (const z of [17, 21]) onRightFace(grid, couch.u + 7, v, v + 1, z, P.couch.button);
  art(grid, (layer) => {
    const { x, y } = iso(...onCouchAt(couch, 10, 16), 13), K = P.pillow;
    layer.rect(x - 4, y - 9, 9, 9, K[1]); layer.rect(x - 4, y - 9, 9, 2, K[0]); layer.rect(x + 3, y - 7, 2, 7, K[2]);
    layer.pattern(x - 2, y - 7, ['..a..', '.aaa.', '..a..', 'a.a.a', '.aaa.'], { a: P.pillowAnchor });
  });
}

/* Lying on the floor */

/** The compass rug: a navy disc in a gold border, a rose of eight points (the long ones to the screen's sides, the short ones along the room's), its north in red. */
function paintCompassRug(grid: PixelGrid) {
  const R = P.rug, { u: cu, v: cv, radius } = RUG, long = radius - 6, short = long * 0.6;
  // a point from the middle along (du, dv) turned to (x, y), length long and width wide at its foot: its lit half, its shaded half, or none
  const point = (du: number, dv: number, x: number, y: number, length: number, width: number) => {
    const along = du * x + dv * y, side = dv * x - du * y;
    if (along < 0 || along >= length || Math.abs(side) >= width * (1 - along / length)) return null;
    return side >= 0 ? 'lit' : 'shade';
  };
  const half = Math.SQRT1_2;
  fillTop(grid, cu - radius, cu + radius, cv - radius, cv + radius, 0, (u, v) => {
    const du = u + 0.5 - cu, dv = v + 0.5 - cv, d = Math.sqrt(du * du + dv * dv);
    if (d >= radius) return null;
    if (d >= radius - 1) return R.edge;
    if (d >= radius - 3) return Math.floor(((Math.atan2(dv, du) + Math.PI) * 16) / Math.PI) % 2 ? R.border : R.borderLight;
    if (d >= radius - 4) return R.edge;
    if (d < 1.5) return R.edge;
    // the long points to the screen's four sides (the room's diagonals), the north up, in red; the short ones along the room's sides
    const north = point(du, dv, -half, -half, long, 4.4);
    if (north) return north === 'lit' ? R.north : R.northShade;
    for (const [x, y] of [[half, half], [half, -half], [-half, half]] as const) { const side = point(du, dv, x, y, long, 4.4); if (side) return side === 'lit' ? R.star : R.starShade; }
    for (const [x, y] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) { const side = point(du, dv, x, y, short, 2.6); if (side) return side === 'lit' ? R.borderLight : R.border; }
    if (Math.abs(d - short) < 0.6) return R.borderLight;
    return (Math.floor(u / 3) + Math.floor(v / 3)) % 2 ? R.field : R.base;
  });
}

/* The desks' things */

/** A pewter tankard of grog, its foam over the rim. */
function tankard(layer: PixelGrid, x: number, y: number) {
  const T = P.tankard;
  layer.rect(x - 2, y - 6, 5, 6, T.body); layer.rect(x + 2, y - 6, 1, 6, T.shade); layer.rect(x - 2, y - 5, 5, 1, T.band); layer.rect(x - 2, y - 2, 5, 1, T.band);
  layer.rect(x - 2, y - 7, 5, 1, T.foam); layer.set(x - 1, y - 8, T.foam); layer.set(x, y - 8, T.foam);
  layer.points([[x + 3, y - 5], [x + 4, y - 5], [x + 4, y - 4], [x + 4, y - 3], [x + 3, y - 3]], T.shade);
}
const deskTankard: Topper = (layer, x, y) => tankard(layer, x, y);
/** A ship in a bottle, lying on its side. */
const shipInABottle: Topper = (layer, x, y) => {
  const B = P.bottle;
  layer.rect(x - 6, y - 5, 9, 5, B.glass); layer.rect(x - 6, y - 1, 9, 1, B.glassShade); layer.rect(x + 3, y - 4, 2, 3, B.glass); layer.rect(x + 5, y - 4, 1, 3, B.cork);
  layer.rect(x - 5, y - 2, 7, 1, B.sea); layer.rect(x - 4, y - 3, 4, 1, B.hull); layer.rect(x - 3, y - 5, 1, 2, B.sail); layer.set(x - 2, y - 4, B.sail);
  layer.set(x - 5, y - 4, P.porthole.brass[0]);
};

const GLOW: readonly string[] = [P.wallLantern.glass, P.wallLantern.glassLight, P.wallLantern.glassShade];
const VIEW: readonly string[] = [
  ...V.day, ...V.dusk, ...V.night, ...V.sea.day, ...V.sea.dusk, ...V.sea.night, ...Object.values(V.crest), ...Object.values(V.foam),
  V.sun, V.sunLight, V.sunLow, V.sunLowLight, V.glitter, V.moon, V.moonShade, V.star, V.cloud, V.cloudShade, V.island, V.palm, V.trunk, V.gull, V.silhouette, V.nightIsland, P.porthole.glint,
];

/** The wall lantern's glass and the post lantern's, on screen: their top left corner (lantern's pattern). */
const [WALL_LANTERN_X, WALL_LANTERN_Y] = wallPoint('left', 30, 74), POST = iso(LAMP.u, LAMP.v);

/**
 * The waves rolling past the porthole, on its sea only (what shines on it stays); the lanterns' flames glimmering in
 * their glass while someone is there, the post's once it is lit, at dusk and at night.
 */
const motion: AmbianceMotion = {
  masks: {
    lantern: [P.wallLantern.glassShade, P.wallLantern.glass, P.wallLantern.glassLight],
    post: [P.lamp.glassShade, P.lamp.glass, P.lamp.glassLight],
  },
  paint({ view, lantern, post }, frame, { time, lit }) {
    const { a, z, glass } = PORTHOLE, horizon = wallY('left', a, 0) - (z - 2);
    for (let pa = a - glass; pa < a + glass; pa++) {
      const foot = wallY('left', pa, 0);
      for (let pz = z - glass; pz < z + glass; pz++) {
        const depth = foot - horizon - pz;
        if (depth > 0) redraw(view, 'left', pa, pz, seaAt(time, pa, depth, 0), seaAt(time, pa, depth, frame));
      }
    }
    if (!lit) return;
    glimmer(lantern, WALL_LANTERN_X - 2, WALL_LANTERN_Y + 3, 7, 9, frame, 1);
    if (time !== 'day') glimmer(post, POST.x + 3, POST.y - 39, 7, 9, frame, 2);
  },
};

export const pirate: AmbianceDesign = {
  ...office,
  id: 'pirate',
  deskStyle: {
    top: P.desk.top, topEdge: P.desk.edge, leg: P.desk.leg, drawers: [P.desk.drawers, P.desk.drawers], monitor: P.desk.monitor, monitorEdge: P.desk.monitorEdge, stand: P.desk.stand,
    vents: P.desk.vents, keyboard: P.desk.keyboard, key: P.desk.key, seats: P.seats, chairBase: P.chair.base, chairPole: P.chair.pole, backThing: deskTankard, sideThing: shipInABottle,
  },
  paintCouch: paintCaptainCouch,
  paintCouchArm: (grid) => paintCouchArm(grid, office.couch, P.couch),
  paintDoor: paintCabinDoor,
  paintBoard: paintMap,
  clock: CLOCK,
  footprints: [
    around(BARRELS.u, BARRELS.v, 6, 52),
    { ...COUNTER, height: 38 },
    { u0: COOLER.u, u1: COOLER.u + COOLER.width, v0: COOLER.v, v1: COOLER.v + COOLER.width, height: 40 },
    { u0: CHEST.u0, u1: CHEST.u1, v0: CHEST.v0, v1: CHEST.v1, height: 30 },
    { u0: CRATE.u0, u1: CRATE.u1, v0: CRATE.v0, v1: CRATE.v1, height: 30 },
    around(LAMP.u, LAMP.v, 3, 50),
  ],
  paintRoom(grid, time) {
    paintDeck(grid);
    paintHull(grid);
    paintPorthole(grid, time);
    paintBanner(grid);
    paintNet(grid);
    paintCutlasses(grid);
    paintHungRope(grid);
  },
  dress(grid) {
    paintWallLantern(grid);
    paintCompassRug(grid);
    paintRopeMat(grid);
  },
  standing: [
    standing(BARRELS.u - 6, BARRELS.u + 6, BARRELS.v - 6, BARRELS.v + 6, paintBarrels),
    standing(COUNTER.u0, COUNTER.u1, COUNTER.v0, COUNTER.v1, paintGalley),
    standing(COOLER.u, COOLER.u + COOLER.width, COOLER.v, COOLER.v + COOLER.width, paintCask),
    standing(CHEST.u0, CHEST.u1, CHEST.v0, CHEST.v1, paintChest),
    standing(CRATE.u0, CRATE.u1, CRATE.v0, CRATE.v1, paintCrate),
    standing(LAMP.u, LAMP.u, LAMP.v, LAMP.v, paintLanternPost),
  ],
  light: { lamp: LAMP, lampColour: P.light.lamp, ambient: P.light, lampGlow: [P.lamp.glass, P.lamp.glassLight, P.lamp.glassShade], glow: GLOW, sky: VIEW },
  glass: { wall: 'left', a0: PORTHOLE.a - PORTHOLE.glass, a1: PORTHOLE.a + PORTHOLE.glass, z0: PORTHOLE.z - PORTHOLE.glass, z1: PORTHOLE.z + PORTHOLE.glass },
  motion,
};
