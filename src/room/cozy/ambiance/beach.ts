// The beach hut (ambiance 'beach'), furnished where the offices are (office.ts: the same desks, couch, door and walks):
// bamboo walls over a rattan wainscot under a thatch fringe, a light wooden deck, a wide window on the sea and the sand
// (the view of the hour), a string of lights, a surfboard over the tiki bar and its coconuts, a life ring, a cork board
// in driftwood, a teal hut door with its starfish, a sunburst clock, a jug of watermelon juice, a palm in its basket,
// rattan chests, a rattan couch, a bamboo lamp, a round jute rug, flip-flops by the door.
import { COZY_AMBIANCE_PALETTE, COZY_PALETTE as C } from '../../../design/room-palette.ts';
import type { WallClock } from '../clock.ts';
import { DOOR, paintCouch, paintCouchArm, paintDrawers, paintWallBoxes, shadeAlongWalls, standing, type Drawers, type Topper } from '../decor.ts';
import { ROOM_UNITS as ROOM, WALL_HEIGHT, iso, onCouchAt } from '../geometry.ts';
import {
  fillLeftFace, fillRightFace, fillTop, fillWall, onLeftFace, onRightFace, outlined, outlinedBox, patchOnLeftFace, patchOnRightFace, tint, wallEllipse, wallPatch, wallPixel,
  type Painter, type PixelGrid, type Tones, type Wall,
} from '../pixels.ts';
import type { CozyTime } from '../time.ts';
import { hash, redraw } from '../motion.ts';
import type { AmbianceDesign, AmbianceMotion } from './index.ts';
import { COOLER, COUNTER, DRAWERS, LAMP, MONSTERA, office } from './office.ts';

const P = COZY_AMBIANCE_PALETTE.beach, O = C.outline, V = P.view;
const ob = (grid: PixelGrid, u0: number, u1: number, v0: number, v1: number, z: number, height: number, tones: Tones, edge?: string) => outlinedBox(grid, u0, u1, v0, v1, z, height, tones, O, edge);
const art = (grid: PixelGrid, draw: (layer: PixelGrid) => void) => outlined(grid, draw, O);

/** The wide window on the left wall, over the couch: its frame from `a0` to `a1` along the wall and `z0` to `z1` up, its glass inside. */
const WINDOW = { a0: 20, a1: 94, z0: 40, z1: 85 } as const;
const GLASS = { a0: 23, a1: 91, z0: 43, z1: 80 } as const;
/** Where the sea meets the sky, and the sand the sea, in the window. */
const HORIZON = 61, SHORE = 51;
/** The thatch's lowest strands. */
const THATCH = WALL_HEIGHT - 9;
/** The couch, as the offices have it. */
const COUCH = office.couch;

/* The room */

/** A deck of light boards along u, their gaps, their joints and their nails. */
function paintDeck(grid: PixelGrid) {
  const F = P.deck;
  fillTop(grid, 0, ROOM, 0, ROOM, 0, (u, v) => {
    const board = Math.floor(v / 6), across = v % 6, shifted = u + board * 23, along = shifted % 44;
    if (across === 5) return F.gap;
    if (along === 0) return F.joint;
    if (along === 2 && (across === 1 || across === 3)) return F.nail;
    if (across === 0) return F.light;
    if ((u * 7 + board * 13) % 23 === 0) return F.grain;
    return F.tones[(board * 5 + Math.floor(shifted / 44)) % F.tones.length];
  });
  shadeAlongWalls(grid);
}

/** Bamboo poles over a woven rattan wainscot, a bamboo rail between, a thatch fringe under the roof. */
function paintWalls(grid: PixelGrid) {
  const B = P.bamboo, R = P.rattan, T = P.thatch;
  paintWallBoxes(grid, P.wall);
  for (const wall of ['left', 'right'] as const) {
    const shade = wall === 'right' ? 0.93 : 1, lit = (colour: string) => (shade === 1 ? colour : tint(colour, shade));
    // the poles, six units wide, their nodes staggered
    fillWall(grid, wall, 0, ROOM, 34, WALL_HEIGHT, (a, z) => {
      const pole = Math.floor(a / 6), across = a % 6;
      if (across === 5) return lit(B.seam);
      if ((z + pole * 7) % 19 === 0) return lit(B.node);
      if ((z + pole * 7) % 19 === 1) return lit(B.light);
      return lit(across === 0 ? B.light : across >= 3 ? B.shade : B.base);
    });
    // the rattan, its strands woven by squares of four
    fillWall(grid, wall, 0, ROOM, 2, 30, (a, z) => {
      const along = (Math.floor(a / 4) + Math.floor(z / 4)) % 2 === 0, step = along ? z % 4 : a % 4;
      return lit(step === 0 ? R.gap : step === 1 ? R.light : step === 3 ? R.dark : R.base);
    });
    wallPatch(grid, wall, 0, ROOM, 0, 2, lit(P.skirting));
    // the rail: a bamboo pole along the wall, its nodes
    wallPatch(grid, wall, 0, ROOM, 30, 34, lit(P.rail[1])); wallPatch(grid, wall, 0, ROOM, 32, 33, lit(P.rail[0])); wallPatch(grid, wall, 0, ROOM, 30, 31, lit(P.rail[2]));
    for (let a = 9; a < ROOM; a += 22) wallPatch(grid, wall, a, a + 1, 30, 34, lit(P.rail[2]));
    // the thatch: straw strands hanging from the roof, a rope along them
    fillWall(grid, wall, 0, ROOM, THATCH - 4, WALL_HEIGHT, (a, z) => {
      const bottom = THATCH - ((a * 7 + (a >> 2) * 3) % 5);
      if (z < bottom) return null;
      if (z === bottom) return lit(T.tip);
      return lit(T.tones[(a * 3 + (z >> 2)) % T.tones.length]);
    });
    wallPatch(grid, wall, 0, ROOM, WALL_HEIGHT - 4, WALL_HEIGHT - 3, lit(T.rope)); wallPatch(grid, wall, 0, ROOM, WALL_HEIGHT - 3, WALL_HEIGHT - 2, lit(T.ropeLight));
  }
}

type View = (typeof V)[CozyTime];

/**
 * The sea at a point of the window: its blue, deeper towards the horizon, and the crests of the waves, rows of foam
 * drifting along, a little lighter as they come in; `frame`: how far they have drifted (0 at rest).
 */
function seaAt(K: View, a: number, z: number, frame: number): string {
  const depth = HORIZON - z, tone = depth <= 2 ? K.sea[2] : depth <= 6 ? K.sea[1] : K.sea[0];
  // the nearer rows drift faster
  const drift = Math.floor(frame / (depth > 6 ? 3 : 5));
  if (depth > 1 && depth % 3 === 1 && (((a + depth * 5 + drift) % 13) + 13) % 13 < (depth > 6 ? 4 : 2)) return K.foam;
  return tone;
}

/** The sand at a point of the window, the foam of the waves lapping at its edge; `frame`: how far they have come and gone (0 at rest). */
function sandAt(K: View, a: number, z: number, frame: number): string {
  const lap = frame ? Math.sin(frame * 0.09) * 1.6 : 0, edge = SHORE - (Math.sin(a / 3.2 + lap) > 0.2 ? 1 : 0);
  if (z >= edge) return K.foam;
  if (z === edge - 1) return K.sand[2];
  return (a * 5 + z * 3) % 17 === 0 ? K.sand[1] : z < GLASS.z0 + 3 ? K.sand[1] : K.sand[0];
}

/** The view of the hour in the window: the sky, the sun or the moon, the sea and its waves, the sand, a palm, a parasol, a sail. */
function paintView(grid: PixelGrid, time: CozyTime) {
  const wall: Wall = 'left', K = V[time], { a0, a1, z0, z1 } = GLASS, night = time === 'night', dusk = time === 'dusk';
  const within = [a0, a1, z0, z1] as const;
  // the sky, the sea, the sand
  fillWall(grid, wall, a0, a1, HORIZON, z1, (_, z) => K.sky[Math.min(K.sky.length - 1, Math.floor((z1 - 1 - z) / ((z1 - HORIZON) / K.sky.length)))]);
  fillWall(grid, wall, a0, a1, SHORE, HORIZON, (a, z) => seaAt(K, a, z, 0));
  fillWall(grid, wall, a0, a1, z0, SHORE + 1, (a, z) => sandAt(K, a, z, 0));
  // what shines in the sky, and its light on the sea
  if (night) {
    // the moon in the middle pane, clear of the palm's fronds, and its path on the sea
    for (const [a, z] of [[28, 77], [36, 70], [44, 78], [52, 66], [64, 69], [84, 77], [88, 68], [32, 64], [62, 78]]) wallPixel(grid, wall, a, z, V.star);
    wallEllipse(grid, wall, 57.5, 73.5, 4.2, 4.2, V.moon, within);
    for (const [a, z] of [[56, 74], [59, 72], [58, 75]] as const) wallPixel(grid, wall, a, z, V.moonShade);
    for (let z = SHORE + 1; z < HORIZON; z += 2) wallPatch(grid, wall, 56 - ((z >> 1) % 2), 59 + ((z >> 1) % 2), z, z + 1, V.moonGlint);
  } else if (dusk) {
    wallEllipse(grid, wall, 50, HORIZON + 1, 6.5, 6.5, V.sunLow, [a0, a1, HORIZON, z1]); wallEllipse(grid, wall, 50.6, HORIZON + 1.8, 4.2, 4.2, V.sunLowLight, [a0, a1, HORIZON, z1]);
    for (let z = SHORE + 1; z < HORIZON; z += 2) { const half = 1 + ((HORIZON - z) >> 2); wallPatch(grid, wall, 50 - half, 51 + half, z, z + 1, V.glare); }
  } else {
    wallEllipse(grid, wall, 40, 72, 5, 5, V.sun, within); wallEllipse(grid, wall, 40.6, 72.8, 3.4, 3.4, V.sunLight, within);
    for (let z = SHORE + 3; z < HORIZON - 1; z += 3) wallPatch(grid, wall, 39 - (z % 2), 42 + (z % 2), z, z + 1, V.glare);
  }
  // two little clouds, by day and at dusk
  if (!night) for (const [ca, cz, size] of [[62, 74, 1], [80, 68, 0.7]] as const) {
    wallEllipse(grid, wall, ca, cz - 1, 5.5 * size, 2.2 * size, K.cloudShade, within); wallEllipse(grid, wall, ca, cz, 5.5 * size, 2.2 * size, K.cloud, within);
    wallEllipse(grid, wall, ca + 2 * size, cz + 1.6 * size, 3 * size, 2.2 * size, K.cloud, within);
  }
  // a sail on the horizon
  wallPatch(grid, wall, 60, 65, HORIZON - 1, HORIZON + 1, K.hull);
  for (let z = HORIZON + 1; z < HORIZON + 6; z++) wallPatch(grid, wall, 62, 62 + Math.max(1, HORIZON + 6 - z), z, z + 1, K.sail);
  // a parasol on the sand
  wallPatch(grid, wall, 33, 34, z0 + 1, z0 + 9, K.pole);
  for (let row = 0; row < 4; row++) {
    const half = 7 - row * 2 + (row === 0 ? 0 : 1);
    for (let a = 33 - half; a <= 33 + half; a++) wallPixel(grid, wall, a, z0 + 9 + row, Math.floor((a - 33 + 8) / 3) % 2 ? K.umbrella[0] : K.umbrella[1]);
  }
  // a palm leaning over the beach, its trunk and its fronds
  for (let z = z0; z < z0 + 26; z++) {
    const a = 85 - Math.round(((z - z0) / 26) ** 2 * 7);
    wallPatch(grid, wall, a, a + 2, z, z + 1, (z - z0) % 3 === 0 ? K.trunk[1] : K.trunk[0]);
  }
  const ta = 78, tz = z0 + 26;
  for (const [da, dz] of [[-10, -4], [-7, 2], [8, -5], [6, 1], [0, 4], [-12, -8], [10, -9]] as const) {
    const steps = Math.max(Math.abs(da), 3);
    for (let step = 1; step <= steps; step++) {
      const s = step / steps, a = Math.round(ta + da * s), z = Math.round(tz + dz * s + 3 * s * (1 - s) * 2);
      wallPixel(grid, wall, a, z, K.frond[1]); wallPixel(grid, wall, a, z - 1, K.frond[2]);
      if (step % 2 === 0) wallPixel(grid, wall, a, z - 2, K.frond[2]);
      if (s < 0.6) wallPixel(grid, wall, a, z + 1, K.frond[0]);
    }
  }
}

/** The wide window: its bleached bamboo frame round the view, its two mullions, a bamboo blind rolled up, the sill and its shells. */
function paintWindow(grid: PixelGrid, time: CozyTime) {
  const wall: Wall = 'left', W = P.window, { a0, a1, z0, z1 } = WINDOW;
  wallPatch(grid, wall, a0 - 1, a1 + 1, z0 - 1, z1 + 2, O);
  wallPatch(grid, wall, a0, a1, z0, z1 + 1, W.frame[1]); wallPatch(grid, wall, a0, a1, z1, z1 + 1, W.frame[0]); wallPatch(grid, wall, a0, a1, z0, z0 + 1, W.frame[2]);
  wallPatch(grid, wall, a0, a0 + 1, z0, z1 + 1, W.frame[0]); wallPatch(grid, wall, a1 - 1, a1, z0, z1 + 1, W.frame[2]);
  wallPatch(grid, wall, GLASS.a0 - 1, GLASS.a1 + 1, GLASS.z0 - 1, GLASS.z1 + 1, O);
  paintView(grid, time);
  for (const a of [45, 68]) { wallPatch(grid, wall, a, a + 2, GLASS.z0, GLASS.z1, W.mullion); wallPatch(grid, wall, a, a + 1, GLASS.z0, GLASS.z1, W.mullionLight); wallPatch(grid, wall, a - 1, a, GLASS.z0, GLASS.z1, O); wallPatch(grid, wall, a + 2, a + 3, GLASS.z0, GLASS.z1, O); }
  // the blind, rolled up under the frame's top, and its two cords
  wallPatch(grid, wall, a0 + 1, a1 - 1, z1 - 7, z1 - 1, O);
  wallPatch(grid, wall, a0 + 2, a1 - 2, z1 - 6, z1 - 2, W.blind[1]); wallPatch(grid, wall, a0 + 2, a1 - 2, z1 - 3, z1 - 2, W.blind[0]); wallPatch(grid, wall, a0 + 2, a1 - 2, z1 - 6, z1 - 5, W.blind[2]);
  for (let a = a0 + 4; a < a1 - 2; a += 3) wallPixel(grid, wall, a, z1 - 4, W.blind[2]);
  for (const a of [a0 + 9, a1 - 10]) { wallPatch(grid, wall, a, a + 1, z1 - 11, z1 - 6, W.cord); wallPatch(grid, wall, a - 1, a + 2, z1 - 12, z1 - 11, W.cord); }
  ob(grid, 0, 6, a0 - 2, a1 + 2, z0 - 3, 3, W.sill, W.sillEdge);
  // on the sill: a conch, a starfish, a bottle of sand
  art(grid, (layer) => conch(layer, ...xy(iso(3, 30, z0)), 1));
  art(grid, (layer) => starfish(layer, ...xy(iso(3, 52, z0)), 0));
  art(grid, (layer) => {
    const { x, y } = iso(3, 84, z0), S = P.sandcastle;
    layer.rect(x - 2, y - 7, 5, 7, P.juice.glass); layer.rect(x - 2, y - 3, 5, 3, S.sand[0]); layer.rect(x - 2, y - 2, 5, 1, S.sand[1]);
    layer.rect(x - 1, y - 9, 3, 2, P.juice.glass); layer.rect(x - 1, y - 10, 3, 1, P.juice.lid); layer.set(x + 2, y - 6, P.juice.glassShade); layer.set(x, y - 4, S.shell);
  });
}

const xy = ({ x, y }: { x: number; y: number }): [number, number] => [x, y];

/** A conch shell lying at (x, y); `turn` one way or the other. */
function conch(layer: PixelGrid, x: number, y: number, turn: 1 | -1) {
  const K = P.conch;
  layer.ellipse(x, y - 2, 4, 2.4, K.shell); layer.ellipse(x + turn, y - 2, 2, 1.4, K.inside);
  layer.points([[x - 4 * turn, y - 3], [x - 5 * turn, y - 3], [x - 3 * turn, y - 4]], K.shell);
  layer.points([[x - 2 * turn, y - 1], [x - 1 * turn, y - 1], [x + 2 * turn, y - 1]], K.shade);
}

/** A starfish standing at (x, y), or lying flat (`flat`: 1). */
function starfish(layer: PixelGrid, x: number, y: number, flat: 0 | 1) {
  const S = P.starfish;
  if (flat) {
    layer.pattern(x - 3, y - 2, ['..s..', 'sssss', '.sss.', 's...s'], { s: S[1] });
    layer.set(x - 1, y - 1, S[0]); layer.set(x + 1, y, S[2]);
    return;
  }
  layer.pattern(x - 3, y - 6, ['...s...', '..sss..', 'sssssss', '.sssss.', '..sss..', '.ss.ss.', '.s...s.'], { s: S[1] });
  layer.points([[x, y - 5], [x - 1, y - 4], [x - 2, y - 4]], S[0]); layer.points([[x + 1, y - 2], [x + 2, y - 3], [x + 2, y]], S[2]);
}

/** The string of lights along the right wall under the thatch, over the surfboard, sagging from hook to hook. */
function paintLights(grid: PixelGrid) {
  const L = P.lights, wall: Wall = 'right', top = THATCH - 4, from = 34, span = 19;
  const at = (a: number) => Math.round(top - 3 * Math.sin(Math.PI * (((a - from) % span) / span)));
  for (let a = from; a <= from + 2 * span; a++) wallPixel(grid, wall, a, at(a), L.string);
  for (let a = from + 3, index = 0; a < from + 2 * span; a += 5, index++) {
    const z = at(a);
    wallPixel(grid, wall, a, z - 1, L.string); wallPatch(grid, wall, a - 1, a + 1, z - 4, z - 1, L.bulbs[index % L.bulbs.length]); wallPixel(grid, wall, a, z - 5, L.bulbs[index % L.bulbs.length]);
  }
}

/** The sunburst round the clock: rattan rays. */
function paintClockRays(grid: PixelGrid) {
  const { wall, a, z } = CLOCK, [ray, shade, light] = P.clockRays;
  const rays = Array.from({ length: 12 }, (_, index) => {
    const angle = (index * Math.PI) / 6, long = index % 2 ? 10 : 12;
    return Array.from({ length: long - 6 }, (_, step) => [Math.round(a + Math.cos(angle) * (step + 7)), Math.round(z + Math.sin(angle) * (step + 7)), step + 7 === long] as const);
  });
  // the rays, darker at their tips, a lit pixel near the clock
  for (const points of rays) for (const [ra, rz, tip] of points) wallPixel(grid, wall, ra, rz, tip ? shade : ray);
  for (const points of rays) wallPixel(grid, wall, points[1][0], points[1][1], light);
  wallEllipse(grid, wall, a + 0.5, z + 0.5, 8.2, 8.2, O);
}

/** The teal hut door, its boards, its little window, its starfish and its brass knob: a click goes through it, to the break room. */
const paintHutDoor: Painter = (grid) => {
  const D = P.door, { a0, a1, height } = DOOR, wall: Wall = 'left', middle = (a0 + a1) >> 1;
  wallPatch(grid, wall, a0 - 3, a1 + 3, 0, height + 4, O);
  wallPatch(grid, wall, a0 - 2, a1 + 2, 0, height + 3, D.frame[1]); wallPatch(grid, wall, a0 - 2, a1 + 2, height + 2, height + 3, D.frame[0]);
  wallPatch(grid, wall, a0 - 2, a0 - 1, 0, height + 3, D.frame[0]); wallPatch(grid, wall, a1 + 1, a1 + 2, 0, height + 3, D.frame[2]);
  wallPatch(grid, wall, a0 - 1, a1 + 1, 0, height + 1, O);
  wallPatch(grid, wall, a0, a1, 0, height, D.leaf);
  // its boards, and the two halves of a stable door
  for (let a = a0 + 5; a < a1; a += 5) { wallPatch(grid, wall, a, a + 1, 0, height, D.seam); wallPatch(grid, wall, a + 1, a + 2, 0, height, D.leafLight); }
  wallPatch(grid, wall, a0, a0 + 1, 0, height, D.leafLight); wallPatch(grid, wall, a1 - 1, a1, 0, height, D.leafShade);
  wallPatch(grid, wall, a0, a1, 30, 32, D.leafShade); wallPatch(grid, wall, a0, a1, 32, 33, D.leafLight);
  // the little window in the top half, its cross, a glint
  wallPatch(grid, wall, a0 + 4, a1 - 4, 39, 56, O); wallPatch(grid, wall, a0 + 5, a1 - 5, 40, 55, D.glass);
  wallPatch(grid, wall, middle, middle + 1, 40, 55, D.leafShade); wallPatch(grid, wall, a0 + 5, a1 - 5, 47, 48, D.leafShade);
  for (let step = 0; step < 3; step++) wallPixel(grid, wall, a1 - 7 - step, 53 - step, D.glassLight);
  // the starfish on the bottom half
  const S = D.star;
  for (const [da, dz] of [[0, 4], [0, 3], [-1, 2], [0, 2], [1, 2], [-4, 1], [-3, 1], [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1], [-3, -2], [-2, -2], [2, -2], [3, -2], [-3, -3], [3, -3]] as const) {
    wallPixel(grid, wall, middle + da, 16 + dz, da > 0 && dz < 1 ? D.starShade : S);
  }
  wallPatch(grid, wall, a0 + 2, a0 + 4, 25, 28, D.knob); wallPixel(grid, wall, a0 + 3, 25, D.knobShade);
};

/** The coir mat in front of the door, sand spilt round it, and a pair of flip-flops left by it. */
function paintDoorstep(grid: PixelGrid) {
  const { a0, a1 } = DOOR, M = P.door.mat;
  fillTop(grid, 0, 26, a0 - 12, ROOM, 0, (u, v) => ((u * 13 + v * 7) % 11 === 0 && (u * 3 + v) % 4 !== 1 && u + (ROOM - v) < 30 ? P.sand[(u + v) % 2] : null));
  fillTop(grid, 1, 12, a0 + 1, a1 - 1, 0, (u, v) => (u === 1 || u === 11 || v === a0 + 1 || v === a1 - 2 ? M[2] : (u * 3 + v) % 5 === 0 ? M[0] : M[1]));
  const D = P.door;
  for (const [u, v, colour] of [[16, 104, D.flipflops[0]], [17, 110, D.flipflops[1]]] as const) {
    art(grid, (layer) => {
      const { x, y } = iso(u, v);
      layer.ellipse(x, y, 3.4, 1.6, colour); layer.ellipse(x + 2.5, y + 1.2, 2.8, 1.4, colour);
      layer.points([[x - 1, y - 1], [x, y - 1], [x + 1, y]], D.strap);
    });
  }
}

/** The cork board in its driftwood frame on the right wall: notes, a photo of the sea, pins, a shell. A click opens the board and its notes. */
const paintCorkBoard: Painter = (grid) => {
  const wall: Wall = 'right', B = P.board;
  wallPatch(grid, wall, 73, 123, 45, 87, O);
  fillWall(grid, wall, 74, 122, 46, 86, (a, z) => ((a * 3 + z * 7) % 11 === 0 ? B.frame[2] : (z + (a >> 3)) % 4 === 0 ? B.frame[0] : B.frame[1]));
  wallPatch(grid, wall, 76, 120, 48, 84, B.frame[2]);
  fillWall(grid, wall, 77, 119, 49, 83, (a, z) => ((a * 7 + z * 13) % 17 === 0 ? B.corkDot : (a * 5 + z * 3) % 23 === 0 ? B.corkLight : B.cork));
  // a note: its paper, its shadow (towards the bottom right of the screen), its lines, its pin
  const note = (n0: number, n1: number, z0: number, z1: number, paper: number, pin: number) => {
    wallPatch(grid, wall, n0 + 1, n1 + 1, z0 - 1, z1 - 1, B.noteShade[paper]); wallPatch(grid, wall, n0, n1, z0, z1, B.notes[paper]);
    wallPatch(grid, wall, ((n0 + n1) >> 1) - 1, ((n0 + n1) >> 1) + 1, z1 - 2, z1, B.pins[pin]); wallPixel(grid, wall, (n0 + n1) >> 1, z1, tint(B.pins[pin], 0.8));
  };
  note(80, 93, 64, 78, 0, 0);
  for (const [z, length] of [[73, 9], [70, 7], [67, 10]] as const) wallPatch(grid, wall, 82, 82 + length, z, z + 1, B.ink);
  note(96, 106, 68, 80, 1, 1);
  for (const z of [75, 72]) { wallPatch(grid, wall, 98, 100, z, z + 2, B.ink); wallPixel(grid, wall, 99, z + 1, B.notes[1]); wallPatch(grid, wall, 101, 105, z, z + 1, B.ink); }
  wallPixel(grid, wall, 98, 76, B.tick); wallPixel(grid, wall, 99, 75, B.tick); wallPixel(grid, wall, 100, 77, B.tick);
  note(81, 93, 51, 62, 2, 2);
  for (const [a, z] of [[85, 58], [86, 58], [88, 58], [89, 58], [84, 57], [85, 57], [86, 57], [87, 57], [88, 57], [89, 57], [90, 57], [85, 56], [86, 56], [87, 56], [88, 56], [89, 56], [86, 55], [87, 55], [88, 55], [87, 54]] as const) wallPixel(grid, wall, a, z, B.heart);
  // the photo of the sea, and its pin
  wallPatch(grid, wall, 108, 119, 58, 75, B.noteShade[3]); wallPatch(grid, wall, 107, 118, 59, 76, B.photo);
  wallPatch(grid, wall, 108, 117, 68, 75, B.photoSky); wallPatch(grid, wall, 108, 117, 65, 68, B.photoSea); wallPatch(grid, wall, 108, 117, 62, 65, B.photoSand);
  wallPatch(grid, wall, 114, 116, 71, 73, B.photoSun); wallPatch(grid, wall, 111, 113, 74, 76, B.pins[1]);
  note(96, 105, 51, 63, 3, 0);
  for (const z of [58, 55]) wallPatch(grid, wall, 98, 103, z, z + 1, B.ink);
  // a shell pinned in the corner
  wallEllipse(grid, wall, 111.5, 53.5, 3, 2.4, B.shellShade); wallEllipse(grid, wall, 111.5, 54, 2.6, 2, B.shell);
  for (const a of [110, 112]) wallPatch(grid, wall, a, a + 1, 52, 56, B.shellShade);
  ob(grid, 76, 120, 0, 4, 44, 2, B.tray);
  for (const [a, pen] of [[88, 0], [93, 1]] as const) ob(grid, a, a + 3, 0, 3, 46, 1, [B.pens[pen], tint(B.pens[pen], 0.85), tint(B.pens[pen], 0.72)]);
};

/** The clock above the door, in its sunburst. */
const CLOCK: WallClock = { wall: 'left', a: 112, z: 77, radius: 6, tones: P.clock };

/* Hung on the walls, lying on the floor */

/** The surfboard over the bar, on two pegs: a cream board, its stripes, its band and a hibiscus. */
function paintSurfboard(grid: PixelGrid) {
  const wall: Wall = 'right', S = P.surfboard, ca = 50, cz = 62, half = 21, high = 5;
  const inBoard = (a: number, z: number, grow: number) => {
    const t = (a + 0.5 - ca) / (half + grow), nose = t > 0 ? 1 - t * t * t * 0.6 : 1, r = (high + grow) * Math.sqrt(Math.max(0, 1 - t * t)) * nose;
    return Math.abs(t) <= 1 && Math.abs(z + 0.5 - cz) <= r;
  };
  for (const a of [36, 64]) { wallPatch(grid, wall, a - 1, a + 3, cz - 8, cz - 4, O); wallPatch(grid, wall, a, a + 2, cz - 7, cz - 5, S.peg[0]); wallPixel(grid, wall, a + 1, cz - 7, S.peg[1]); }
  fillWall(grid, wall, ca - half - 2, ca + half + 2, cz - high - 2, cz + high + 2, (a, z) => {
    if (!inBoard(a, z, 0)) return inBoard(a, z, 1.2) ? O : null;
    if (a >= 33 && a < 36) return S.band;
    if (z === cz && a > ca - half + 2 && a < ca + half - 3) return S.stringer;
    if (a >= 39 && a < 43) return a === 39 ? S.stripe[1] : S.stripe[0];
    if (!inBoard(a, z - 2, 0)) return S.board[0];
    if (!inBoard(a, z + 2, 0)) return S.board[2];
    return S.board[1];
  });
  for (const [da, dz] of [[0, 2], [-2, 0], [2, 0], [-1, -2], [1, -2], [0, 1], [-1, 0], [1, 0], [0, -1], [-1, 1], [1, 1]] as const) wallPixel(grid, wall, 58 + da, cz + dz, Math.abs(da) + Math.abs(dz) > 1 ? S.hibiscus : S.hibiscusLight);
  wallPixel(grid, wall, 58, cz, S.hibiscusHeart);
}

/** A life ring in the back corner of the right wall, on its rope from a peg. */
function paintLifeRing(grid: PixelGrid) {
  const wall: Wall = 'right', R = P.lifeRing, ca = 17, cz = 64, outer = 8.5, inner = 4.2;
  // the rope from the peg, down to the ring's two sides
  for (let step = 0; step <= 10; step++) for (const side of [-1, 1]) wallPixel(grid, wall, ca + Math.round((side * step * 6) / 10), cz + 18 - step, R.rope);
  wallPatch(grid, wall, ca - 1, ca + 2, cz + 17, cz + 20, O); wallPixel(grid, wall, ca, cz + 18, R.peg);
  fillWall(grid, wall, ca - 10, ca + 11, cz - 10, cz + 11, (a, z) => {
    const da = a + 0.5 - ca, dz = z + 0.5 - cz, d = Math.sqrt(da * da + dz * dz);
    if (d > outer + 0.9 || d < inner - 0.9) return null;
    if (d > outer || d < inner) return O;
    // four coral quarters between four white ones, lit from above, the rope round it in four places
    const turn = (Math.atan2(dz, da) + Math.PI * 2) % (Math.PI * 2), eighth = Math.floor((turn * 4) / Math.PI) % 8;
    if (Math.abs(((turn * 4) / Math.PI) % 2 - 1) < 0.18) return R.rope;
    const tones = eighth % 2 ? R.band : R.white, lit = dz > 1.5 ? 0 : dz < -1.5 ? 2 : 1;
    return tones[lit];
  });
}

/** The round jute rug in the middle: braided rings, a ring of waves, a sun. */
function paintRug(grid: PixelGrid) {
  const R = P.rug, { x, y } = iso(52, 96);
  grid.ellipse(x, y + 1, 31, 15.5, R.edge); grid.ellipse(x, y, 31, 15.5, R.rings[2]);
  for (const [rx, tone] of [[30, 0], [27, 1], [24, 0], [21, 2], [19, 0], [10, 1], [8, 0]] as const) grid.ellipse(x, y, rx, rx / 2, R.rings[tone]);
  for (let index = 0; index < 34; index++) { const angle = (index / 34) * Math.PI * 2; grid.set(Math.round(x + Math.cos(angle) * 28.5), Math.round(y + Math.sin(angle) * 14.2), R.stitch); }
  for (let index = 0; index < 160; index++) {
    const angle = (index / 160) * Math.PI * 2, wave = Math.sin(index * 0.4) * 0.9;
    grid.set(Math.round(x + Math.cos(angle) * (15 + wave)), Math.round(y + Math.sin(angle) * (7.5 + wave / 2)), R.wave);
    grid.set(Math.round(x + Math.cos(angle) * (14 + wave)), Math.round(y + Math.sin(angle) * (7 + wave / 2)), R.waveLight);
  }
  grid.ellipse(x, y, 5, 2.6, R.sun); grid.ellipse(x - 1, y - 0.5, 2.4, 1.2, R.middle);
}

/* What stands on the floor */

/** The tiki bar where the offices' counter is: bamboo poles, a straw skirt, a wooden top, coconuts, a pineapple, limes. */
function paintBar(grid: PixelGrid) {
  const K = P.bar, { u0, u1, v0, v1 } = COUNTER, front = v1 - 1;
  ob(grid, u0 + 1, u1 - 1, v0, front, 0, 20, K.body);
  for (let a = u0 + 1; a < u1 - 1; a += 4) {
    patchOnLeftFace(grid, front, a, a + 1, 0, 20, K.poleLight); patchOnLeftFace(grid, front, a + 1, a + 3, 0, 20, K.pole); patchOnLeftFace(grid, front, a + 3, a + 4, 0, 20, K.poleDark);
    for (const z of [5 + ((a >> 2) % 2) * 3, 13 - ((a >> 2) % 2) * 2]) onLeftFace(grid, front, a, a + 4, z, K.poleDark);
  }
  for (let a = v0 + 1; a < front; a += 4) { patchOnRightFace(grid, u1 - 1, a, a + 1, 0, 20, K.poleDark); patchOnRightFace(grid, u1 - 1, a + 1, a + 3, 0, 20, K.body[2]); }
  // the straw skirt under the top, its strands ending in a fringe
  art(grid, (layer) => {
    fillLeftFace(layer, v1, u0, u1, 11, 20, (a, z) => (z >= 11 + ((a * 5) % 4) ? K.skirt[(a + (z >> 1)) % 3 === 0 ? 0 : (a % 4 === 3 ? 2 : 1)] : null));
    fillRightFace(layer, u1, v0, v1, 11, 20, (a, z) => (z >= 11 + ((a * 3) % 4) ? K.skirt[a % 3 === 0 ? 1 : 2] : null));
  });
  ob(grid, u0, u1, v0, v1, 20, 2, K.top, K.topEdge);
  const top = 22;
  for (const [u, v, umbrella] of [[40, 8, 0], [47, 5, 1]] as const) art(grid, (layer) => coconut(layer, ...xy(iso(u, v, top)), umbrella, 1));
  art(grid, (layer) => {
    const A = P.pineapple, { x, y } = iso(56, 6, top);
    layer.ellipse(x + 0.5, y - 4, 3.4, 4.4, A.body); layer.rect(x + 2, y - 7, 2, 6, A.shade);
    for (const [dx, dy] of [[-2, -6], [0, -5], [2, -6], [-1, -3], [1, -3], [-2, -2], [2, -2]] as const) layer.set(x + dx, y + dy, A.dot);
    for (const [dx, h, tone] of [[-2, 3, 1], [-1, 5, 0], [0, 6, 1], [1, 5, 2], [2, 3, 1], [3, 2, 2]] as const) layer.rect(x + dx, y - 8 - h, 1, h, A.leaves[tone]);
  });
  art(grid, (layer) => {
    const L = P.limes, { x, y } = iso(65, 8, top);
    layer.ellipse(x, y - 2, 5, 2.4, L.bowl[1]); layer.rect(x - 4, y - 2, 9, 1, L.bowl[2]); layer.ellipse(x, y - 3, 4, 1.2, L.bowl[0]);
    for (const [dx, dy] of [[-2, -4], [1, -5], [3, -3]] as const) { layer.ellipse(x + dx + 0.5, y + dy, 1.8, 1.6, L.fruit); layer.set(x + dx + 1, y + dy + 1, L.shade); }
  });
}

/** A coconut cut open at (x, y), its straw and a paper parasol (`umbrella`: its colour), at `size` 1 on the bar, 0 on a desk. */
function coconut(layer: PixelGrid, x: number, y: number, umbrella: number, size: 0 | 1) {
  const K = P.coconut, r = size ? 3.4 : 2.6;
  layer.ellipse(x + 0.5, y - r, r, r, K.shell[1]); layer.ellipse(x - 0.5, y - r - 0.8, r * 0.5, r * 0.5, K.shell[0]); layer.rect(x + 1, y - r, Math.ceil(r) - 1, Math.ceil(r), K.shell[2]);
  layer.ellipse(x + 0.5, y - 2 * r + 1, r - 0.6, 1, K.flesh);
  layer.line(x + 1, y - 2 * r + 1, x + 3, y - 2 * r - 4 - size, K.straw); layer.set(x + 2, y - 2 * r - 1, K.strawLight);
  if (!size) return;
  const top = y - 2 * r - 4;
  layer.line(x - 1, top + 4, x - 2, top - 1, K.stick);
  layer.pattern(x - 5, top - 3, ['..u..', '.uuu.', 'uuuuu'], { u: K.umbrellas[umbrella] });
}

/** The jug of watermelon juice on its bamboo crate, where the offices' cooler is: its tap towards the room, a coconut beside it. */
function paintJuice(grid: PixelGrid) {
  const J = P.juice, { u, v, width } = COOLER, front = v + width;
  ob(grid, u, u + width, v, front, 0, 18, J.stand, J.standEdge);
  for (const z of [5, 11]) { onLeftFace(grid, front, u + 1, u + width - 1, z, J.stand[2]); onRightFace(grid, u + width, v + 1, front - 1, z, J.stand[2]); }
  for (const a of [u + 1, u + width - 2]) patchOnLeftFace(grid, front, a, a + 1, 0, 18, J.stand[2]);
  art(grid, (layer) => {
    const { x, y } = iso(u + 6, v + 6, 18);
    layer.rect(x - 4, y - 16, 9, 15, J.glass); layer.rect(x - 3, y - 13, 7, 12, J.juice); layer.rect(x - 3, y - 13, 7, 1, J.juiceLight); layer.rect(x - 3, y - 12, 2, 10, J.juiceLight);
    layer.points([[x, y - 9], [x + 2, y - 6], [x - 1, y - 4], [x + 2, y - 11]], J.seed);
    // a slice floating, its rind
    layer.rect(x - 1, y - 14, 4, 1, J.rind); layer.rect(x, y - 15, 2, 1, J.rindLight);
    layer.rect(x + 4, y - 16, 1, 15, J.glassShade);
    layer.rect(x - 4, y - 18, 9, 2, J.lid); layer.rect(x - 1, y - 19, 3, 1, J.lid);
    layer.rect(x - 1, y - 2, 2, 2, J.tap);
  });
  art(grid, (layer) => coconut(layer, ...xy(iso(u + 10, v + 2, 18)), 2, 0));
}

/** The palm where the offices' monstera is: a basket for a pot, a ringed trunk, fronds all round, coconuts under them. */
function paintPalm(grid: PixelGrid) {
  const K = P.palm, { x, y } = iso(MONSTERA.u, MONSTERA.v);
  // the trunk, bending a little towards the room
  const height = 40, bend = (row: number) => Math.round((row / height) ** 2 * 5);
  art(grid, (layer) => {
    for (let row = 0; row < height; row++) {
      const cx = x - bend(row), py = y - 14 - row, ring = row % 4 === 0;
      layer.set(cx - 2, py, ring ? K.ring : K.trunk[0]); layer.set(cx - 1, py, ring ? K.ring : K.trunk[0]);
      layer.set(cx, py, ring ? K.ring : K.trunk[1]); layer.set(cx + 1, py, ring ? K.ring : K.trunk[2]);
      if (row % 4 === 1) layer.set(cx + 1, py, K.trunk[1]);
    }
  });
  const tx = x - bend(height), ty = y - 14 - height;
  // the fronds, from the back ones to the front ones: (end dx, end dy, arch), and which green
  const fronds = [[-14, -4, 6, 1], [15, -5, 6, 1], [-4, -12, 4, 0], [9, -11, 4, 0], [-20, 6, 6, 0], [21, 5, 6, 0], [-11, 12, 3, 1], [12, 12, 3, 1], [1, 9, 2, 0]] as const;
  for (const [ex, ey, arch, tone] of fronds) art(grid, (layer) => frond(layer, tx, ty, ex, ey, arch, K.fronds[tone]));
  art(grid, (layer) => {
    for (const [dx, dy] of [[-2, 2], [1, 3], [-1, 4]] as const) { layer.ellipse(tx + dx + 0.5, ty + dy, 1.8, 1.8, K.coconut[1]); layer.set(tx + dx, ty + dy - 1, K.coconut[0]); }
  });
  // the basket: woven rows, a rim, the soil
  art(grid, (layer) => {
    for (let row = 0; row < 15; row++) {
      const half = row < 2 ? 10 : 10 - Math.floor((row - 2) / 5);
      for (let dx = -half; dx < half; dx++) {
        const weave = ((dx + 20) >> 1) % 2 === (row >> 1) % 2;
        layer.set(x + dx, y - 15 + row, dx < -half + 3 ? K.basket[0] : dx >= half - 4 ? K.basket[2] : weave ? K.basket[1] : K.basket[0]);
      }
    }
    layer.rect(x - 10, y - 15, 20, 1, K.rim); layer.rect(x - 9, y - 14, 18, 1, K.soil); layer.rect(x - 10, y - 13, 20, 1, K.basket[2]);
  });
}

/** A palm frond from (x0, y0) arching out to (x0 + ex, y0 + ey), its leaflets hanging from its rib. */
function frond(layer: PixelGrid, x0: number, y0: number, ex: number, ey: number, arch: number, tones: Tones) {
  const steps = Math.max(Math.abs(ex), Math.abs(ey)) + 2;
  for (let step = 1; step <= steps; step++) {
    const s = step / steps, x = Math.round(x0 + ex * s), y = Math.round(y0 + ey * s - arch * 4 * s * (1 - s));
    const reach = Math.max(1, Math.round((5 - 3 * s) * (step % 2 ? 1 : 0.6)));
    for (let down = 1; down <= reach; down++) layer.set(x, y + down, down === reach ? tones[2] : tones[1]);
    if (s < 0.8) layer.set(x, y - 1, tones[0]);
    layer.set(x, y, tones[0]);
  }
}

/** A starfish and a conch on the back chest. */
const shells: Topper = (layer, x, y) => { conch(layer, x + 2, y, -1); starfish(layer, x - 4, y, 1); };
/** A little sandcastle and its flag on the chest by the door. */
const sandcastle: Topper = (layer, x, y) => {
  const S = P.sandcastle;
  layer.rect(x - 5, y - 4, 11, 4, S.sand[1]); layer.rect(x - 5, y - 4, 11, 1, S.sand[0]); layer.rect(x + 3, y - 4, 3, 4, S.sand[2]);
  layer.rect(x - 2, y - 8, 5, 4, S.sand[1]); layer.rect(x - 2, y - 8, 5, 1, S.sand[0]); layer.rect(x + 2, y - 8, 1, 4, S.sand[2]);
  for (const dx of [-5, -3, 3, 5]) layer.set(x + dx, y - 5, S.sand[1]);
  for (const dx of [-2, 0, 2]) layer.set(x + dx, y - 9, S.sand[1]);
  layer.rect(x, y - 13, 1, 4, S.pole); layer.rect(x + 1, y - 13, 3, 2, S.flag); layer.set(x - 3, y - 2, S.shell);
};

/** A rattan chest at the back, a coral one by the door. */
const CHESTS: readonly Drawers[] = DRAWERS.map((drawers, index) => ({ ...drawers, tones: index ? P.chests.coral : P.chests.natural, topper: index ? sandcastle : shells }));

/** The bamboo floor lamp where the offices' lamp stands: a jointed pole, a rattan globe the light shines through. */
function paintBambooLamp(grid: PixelGrid) {
  const L = P.lamp, { x, y } = iso(LAMP.u, LAMP.v);
  art(grid, (layer) => {
    layer.ellipse(x, y - 1, 4.4, 1.8, L.pole[2]); layer.ellipse(x - 1, y - 2, 2.4, 1, L.pole[1]);
    for (let row = 2; row < 44; row++) { const node = row % 10 === 0; layer.set(x - 1, y - row, node ? L.node : L.pole[0]); layer.set(x, y - row, node ? L.node : L.pole[1]); layer.set(x + 1, y - row, node ? L.node : L.pole[2]); }
  });
  art(grid, (layer) => {
    const cy = y - 50, radius = 7.5;
    for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) {
      if ((dx + 0.5) ** 2 + (dy + 0.5) ** 2 > radius * radius) continue;
      const strand = (dx + dy + 16) % 4 === 0 || (dx - dy + 16) % 4 === 0;
      const side = dx < -4 ? 0 : dx > 3 ? 2 : 1;
      layer.set(x + dx, cy + dy, strand ? L.shade[side] : side === 2 ? L.glowWarm : L.glow);
    }
    layer.rect(x - 3, cy + 7, 7, 1, L.glowWarm);
  });
}

/** The rattan couch: its weave on the back and on the arms, cream cushions, a teal pillow with its flower. */
function paintRattanCouch(grid: PixelGrid) {
  const K = P.couch, { u, v, length } = COUCH;
  paintCouch(grid, COUCH, K, 2, null);
  fillRightFace(grid, u + 7, v + 1, v + length - 1, 14, 25, (a, z) => ((a + z) % 4 === 0 || (a - z + 100) % 4 === 0 ? K.weave : null));
  fillLeftFace(grid, v + 7, u + 5, u + 17, 1, 15, (a, z) => ((a + z) % 4 === 0 ? K.weave : null));
  art(grid, (layer) => {
    const { x, y } = iso(...onCouchAt(COUCH, 10, 17), 13), T = P.pillows[1], F = P.flower;
    layer.rect(x - 4, y - 8, 9, 8, T[1]); layer.rect(x - 4, y - 8, 9, 2, T[0]); layer.rect(x + 3, y - 6, 2, 6, T[2]);
    layer.points([[x - 1, y - 5], [x + 1, y - 5], [x, y - 6], [x, y - 4]], F.petal); layer.set(x, y - 5, F.heart);
  });
}

function paintRattanArm(grid: PixelGrid) {
  const K = P.couch, { u, v, depth, length } = COUCH;
  paintCouchArm(grid, COUCH, K);
  fillRightFace(grid, u + depth, v + length - 6, v + length - 1, 1, 15, (a, z) => ((a + z) % 4 === 0 ? K.weave : null));
  fillLeftFace(grid, v + length, u + 5, u + depth - 1, 1, 15, (a, z) => ((a + z) % 4 === 0 ? K.weave : null));
}

/** The desks' things: a coconut with its straw, an aloe in a teal pot. */
const deskCoconut: Topper = (layer, x, y) => coconut(layer, x, y, 0, 0);
const aloe: Topper = (layer, x, y) => {
  const A = P.aloe;
  layer.rect(x - 3, y - 4, 7, 4, A.pot[1]); layer.rect(x + 2, y - 4, 2, 4, A.pot[2]); layer.rect(x - 3, y - 5, 7, 1, A.pot[0]);
  for (const [dx, h, tone] of [[-2, 3, 1], [-1, 5, 0], [0, 6, 1], [1, 4, 2], [2, 3, 1]] as const) layer.rect(x + dx, y - 5 - h, 1, h, A.leaves[tone]);
};

const GLOW: readonly string[] = [...P.lights.bulbs];
const VIEW: readonly string[] = [...(['day', 'dusk', 'night'] as const).flatMap((time) => {
  const K = V[time];
  return [...K.sky, ...K.sea, K.foam, ...K.sand, ...K.frond, ...K.trunk, ...K.umbrella, K.pole, K.cloud, K.cloudShade, K.sail, K.hull];
}), V.sun, V.sunLight, V.sunLow, V.sunLowLight, V.glare, V.moon, V.moonShade, V.moonGlint, V.star];

/** The rows of the sea with crests on them (seaAt). */
const CRESTS = [HORIZON - 4, HORIZON - 7] as const;

/**
 * The sea moving in the window: its crests drifting along, the foam lapping at the sand, the sun's (the moon's)
 * light glinting on the water here and there.
 */
const motion: AmbianceMotion = {
  masks: {},
  paint({ view }, frame, { time }) {
    const K = V[time], wall: Wall = 'left';
    for (let a = GLASS.a0; a < GLASS.a1; a++) {
      for (const z of CRESTS) redraw(view, wall, a, z, seaAt(K, a, z, 0), seaAt(K, a, z, frame));
      for (let z = SHORE - 2; z <= SHORE; z++) redraw(view, wall, a, z, sandAt(K, a, z, 0), sandAt(K, a, z, frame));
    }
    // under the sun or the moon, a few glints coming and going on the water
    const middle = time === 'night' ? 57 : time === 'dusk' ? 50 : 40, glint = time === 'night' ? V.moonGlint : V.glare, step = frame >> 2;
    for (let index = 0; index < 4; index++) {
      const a = middle - 6 + Math.floor(hash(index, step) * 13), z = SHORE + 1 + Math.floor(hash(index + 9, step) * (HORIZON - SHORE - 2));
      for (const tone of K.sea) redraw(view, wall, a, z, tone, glint);
    }
  },
};

export const beach: AmbianceDesign = {
  ...office,
  id: 'beach',
  deskStyle: {
    top: P.desk.top, topEdge: P.desk.edge, leg: P.desk.leg, drawers: null, monitor: P.desk.monitor, monitorEdge: P.desk.monitorEdge, stand: P.desk.stand,
    vents: P.desk.vents, keyboard: P.desk.keyboard, key: P.desk.key, seats: P.seats, chairBase: P.chair.base, chairPole: P.chair.pole, backThing: deskCoconut, sideThing: aloe,
  },
  paintCouch: paintRattanCouch,
  paintCouchArm: paintRattanArm,
  paintDoor: paintHutDoor,
  paintBoard: paintCorkBoard,
  clock: CLOCK,
  paintRoom(grid, time) {
    paintDeck(grid);
    paintWalls(grid);
    paintWindow(grid, time);
    paintLights(grid);
    paintClockRays(grid);
  },
  dress(grid) {
    paintLifeRing(grid);
    paintSurfboard(grid);
    paintRug(grid);
    paintDoorstep(grid);
  },
  standing: [
    standing(MONSTERA.u, MONSTERA.u, MONSTERA.v, MONSTERA.v, paintPalm),
    standing(COUNTER.u0, COUNTER.u1, COUNTER.v0, COUNTER.v1, paintBar),
    standing(COOLER.u, COOLER.u + COOLER.width, COOLER.v, COOLER.v + COOLER.width, paintJuice),
    ...CHESTS.map((chest) => standing(chest.u0, chest.u1, chest.v0, chest.v1, (grid) => paintDrawers(grid, chest))),
    standing(LAMP.u, LAMP.u, LAMP.v, LAMP.v, paintBambooLamp),
  ],
  light: { lamp: LAMP, lampColour: P.light.lamp, ambient: P.light, lampGlow: [P.lamp.glow, P.lamp.glowWarm], glow: GLOW, sky: VIEW },
  glass: { wall: 'left', ...GLASS },
  motion,
};
