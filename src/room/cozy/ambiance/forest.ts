// The forest cabin (ambiance 'forest'), furnished where the offices are (office.ts: the same desks, couch, door and
// walks): log walls with their sawn ends at the corners, wide planks, a big window on a pine forest (the sky of the
// hour, fireflies at night) with checked curtains, an arched plank door with its wreath, a log-slice clock, a cork
// board in a bark frame, a tea counter with its kettle, honey and apples, a rain barrel, a fern in a bucket with its
// mushrooms, a chest with a jar of fireflies, a stack of firewood, a lantern on its post, a moss rug, a bird house, a
// shelf of jars and herbs, a leafy garland under the ceiling, a log couch with its plaid and its mushroom pillow,
// wooden desks.
import { COZY_AMBIANCE_PALETTE, COZY_PALETTE as C } from '../../../design/room-palette.ts';
import type { WallClock } from '../clock.ts';
import { DOOR, paintCouch, paintCouchArm, paintDrawers, paintPlanks, paintWallBoxes, shadeAlongWalls, standing, type Drawers, type Topper } from '../decor.ts';
import { ROOM_UNITS as ROOM, WALL_HEIGHT, WALL_THICKNESS, iso, onCouchAt } from '../geometry.ts';
import {
  fillLeftFace, fillRightFace, fillTop, fillWall, onLeftFace, onRightFace, outlined, outlinedBox, patchOnLeftFace, wallEllipse, wallPatch, wallPixel, wallX, wallY,
  type Painter, type PixelGrid, type PixelTarget, type Tones, type Wall,
} from '../pixels.ts';
import type { CozyTime } from '../time.ts';
import { glimmer, hash } from '../motion.ts';
import type { AmbianceDesign, AmbianceMotion } from './index.ts';
import { COOLER, COUNTER, DRAWERS, LAMP, MONSTERA, office } from './office.ts';

const P = COZY_AMBIANCE_PALETTE.forest, O = C.outline, V = P.view;
const ob = (grid: PixelGrid, u0: number, u1: number, v0: number, v1: number, z: number, height: number, tones: Tones, edge?: string) => outlinedBox(grid, u0, u1, v0, v1, z, height, tones, O, edge);
const art = (grid: PixelGrid, draw: (layer: PixelGrid) => void) => outlined(grid, draw, O);

/** How tall a log of the walls is, in pixels. */
const LOG = 8;
/** The window's view on the left wall, where the offices' window is but taller: along it from a0 to a1, up from z0 to z1. */
const PANES = { a0: 30, a1: 82, z0: 38, z1: 86 } as const;
/** The cross of the window's frame: the middle along the wall, the height of the transom. */
const CROSS = { a: 56, z: 62 } as const;

/* The room */

function paintPlankFloor(grid: PixelGrid) {
  const F = P.planks;
  paintPlanks(grid, { tones: F.tones, seam: F.seam, joint: F.joint, width: 6, length: 44 });
  shadeAlongWalls(grid);
}

/** A log of the walls at `at` pixels up from its gap: dark below, lit on its top, its grain and a knot here and there. */
function logPixel(a: number, z: number, tones: Tones): string {
  const L = P.logs, row = Math.floor(z / LOG), at = z % LOG;
  if (at === 0) return L.chink;
  const knot = ((row * 41 + 13) % (ROOM - 16)) + 8, da = a - knot, dz = at - 4;
  if (row % 3 !== 2 && Math.abs(da) <= 2 && Math.abs(dz) <= 1) return Math.abs(da) <= 1 && dz <= 0 ? L.knot : tones[2];
  if (at === 1) return tones[2];
  if (at === 5 || at === 6) return (a + row * 7) % 23 < 2 ? tones[1] : tones[0];
  if ((at === 3 && (a + row * 17) % 19 < 3) || (at === 2 && (a * 3 + row * 5) % 29 < 2)) return tones[2];
  return tones[1];
}

/** The rings of a log's sawn end, `da` across it and `at` up from its gap. */
function logEnd(da: number, at: number): string {
  const L = P.logs;
  if (at === 0) return L.chink;
  const d = Math.sqrt(da * da + (at - 4) ** 2);
  return d < 1.3 ? L.heart : d < 2.4 ? L.end : d < 3 ? L.ring : L.knot;
}

function paintLogWalls(grid: PixelGrid) {
  const L = P.logs, T = WALL_THICKNESS;
  paintWallBoxes(grid, P.wall);
  fillWall(grid, 'left', 0, ROOM, 0, WALL_HEIGHT, (a, z) => logPixel(a, z, L.left));
  fillWall(grid, 'right', 0, ROOM, 0, WALL_HEIGHT, (a, z) => logPixel(a, z, L.right));
  // the logs' sawn ends at the front of the two walls
  fillLeftFace(grid, ROOM, -T, 0, 0, WALL_HEIGHT, (a, z) => logEnd(a + 0.5 + T / 2, z % LOG));
  fillRightFace(grid, ROOM, -T, 0, 0, WALL_HEIGHT, (a, z) => logEnd(a + 0.5 + T / 2, z % LOG));
}

/** A pine of the view: its tiers narrowing to its tip, lit on the sun's side (along the left wall, `a` grows to the screen's left). */
function pine(grid: PixelGrid, ca: number, zb: number, height: number, width: number, [lit, shade]: readonly [string, string]) {
  const { a0, a1, z0, z1 } = PANES, tier = Math.max(3, Math.round(height / 5));
  fillWall(grid, 'left', Math.max(a0, ca - width - 1), Math.min(a1, ca + width + 2), Math.max(z0, zb), Math.min(z1, zb + height), (a, z) => {
    const up = z - zb, half = width * (1 - up / height) * (1 - 0.4 * ((up % tier) / tier)) + 0.5, da = a + 0.5 - ca;
    return Math.abs(da) > half ? null : da > 0 ? lit : shade;
  });
}

/** What the window shows at `time`: the sky, the sun, the moon or the stars, clouds, three rows of pines, birds by day (its fireflies are drawn each frame: paintFireflies). */
function paintView(grid: PixelGrid, time: CozyTime) {
  const wall: Wall = 'left', { a0, a1, z0, z1 } = PANES, sky = V[time], pines = V.pines[time], panes = [a0, a1, z0, z1] as const;
  fillWall(grid, wall, a0, a1, z0, z1, (_, z) => sky[Math.min(sky.length - 1, Math.floor((z1 - 1 - z) / ((z1 - z0) / sky.length)))]);
  if (time === 'night') {
    for (const [a, z] of [[34, 82], [40, 74], [47, 84], [52, 70], [60, 80], [63, 72], [74, 84], [78, 70], [44, 66], [37, 64], [57, 66], [79, 78]] as const) wallPixel(grid, wall, a, z, V.star);
    wallEllipse(grid, wall, 69, 76, 5, 5, V.moon); wallEllipse(grid, wall, 71.2, 77.4, 4.2, 4.2, sky[1]);
    wallPixel(grid, wall, 67, 74, V.moonShade); wallPixel(grid, wall, 66, 77, V.moonShade);
  } else if (time === 'dusk') {
    wallEllipse(grid, wall, 46, 54, 7, 7, V.sunLow, panes); wallEllipse(grid, wall, 46.6, 54.6, 4.6, 4.6, V.sunLowLight, panes);
  } else {
    wallEllipse(grid, wall, 70, 77, 5, 5, V.sun); wallEllipse(grid, wall, 70.6, 77.6, 3.4, 3.4, V.sunLight);
  }
  if (time !== 'night') {
    const dusk = time === 'dusk', cloud = dusk ? V.duskCloud : V.cloud, shade = dusk ? V.duskCloudShade : V.cloudShade;
    for (const [ca, cz, size] of [[44, 76, 1], [62, 70, 0.7]] as const) {
      wallEllipse(grid, wall, ca, cz - 1, 6 * size, 2.4 * size, shade, panes); wallEllipse(grid, wall, ca, cz, 6 * size, 2.4 * size, cloud, panes);
      wallEllipse(grid, wall, ca + 2 * size, cz + 2 * size, 3.2 * size, 2.4 * size, cloud, panes);
    }
  }
  if (time === 'day') for (const [a, z] of [[52, 78], [57, 75]] as const) for (const [da, dz] of [[-2, 0], [-1, 1], [0, 0], [1, 1], [2, 0]] as const) wallPixel(grid, wall, a + da, z + dz, V.bird);
  // the far pines, the nearer ones, the three big ones at the front that frame the view
  wallPatch(grid, wall, a0, a1, z0, z0 + 9, pines.far[1]);
  for (let ca = a0 - 2; ca < a1 + 3; ca += 5) pine(grid, ca, z0 + 7, 9 + ((ca * 7) % 7), 3, pines.far);
  wallPatch(grid, wall, a0, a1, z0, z0 + 4, pines.mid[1]);
  for (let ca = a0 + 1; ca < a1 + 3; ca += 8) pine(grid, ca, z0 + 2, 15 + ((ca * 5) % 9), 5, pines.mid);
  wallPatch(grid, wall, a0, a1, z0, z0 + 2, pines.near[1]);
  for (const [ca, height, width] of [[a0 + 3, 40, 9], [62, 16, 5], [a1 - 4, 46, 10]] as const) {
    wallPatch(grid, wall, ca, ca + 1, z0, z0 + 4, pines.trunk);
    pine(grid, ca, z0 + 3, height, width, pines.near);
  }
}

/** Where the fireflies of the view are at rest, over the dark trees. */
const FLIES = [[36, 44], [42, 51], [49, 43], [58, 48], [66, 53], [73, 45], [78, 56], [45, 59], [61, 41], [70, 61], [38, 63], [53, 55]] as const;
const GLOWING = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const;

/**
 * The fireflies in the window at dusk and at night: the first few out at dusk, all of them at night with a soft glow
 * round each, wandering round where they rest and going out now and then (at rest, frame 0, all lit where they rest).
 */
function paintFireflies(target: PixelTarget, time: CozyTime, frame: number) {
  if (time === 'day') return;
  const wall: Wall = 'left';
  for (let index = 0; index < FLIES.length; index++) {
    if (time === 'dusk' && index % 4) continue;
    if (frame && hash(index, frame >> 3) < 0.22) continue;
    const a = FLIES[index][0] + Math.round(Math.sin(frame * 0.05 + index * 1.7) * 3), z = FLIES[index][1] + Math.round(Math.sin(frame * 0.04 + index * 2.3) * 2);
    if (time === 'night') for (const [da, dz] of GLOWING) wallPixel(target, wall, a + da, z + dz, V.fireflyGlow);
    wallPixel(target, wall, a, z, V.firefly);
  }
}

/** The big window: its log frame and its cross round the view of the hour, a glint on the glass, the sill and what stands on it. */
function paintWindow(grid: PixelGrid, time: CozyTime) {
  const wall: Wall = 'left', W = P.window, { a0, a1, z0, z1 } = PANES;
  wallPatch(grid, wall, a0 - 4, a1 + 4, z0 - 4, z1 + 4, O);
  wallPatch(grid, wall, a0 - 3, a1 + 3, z0 - 3, z1 + 3, W.frame[1]);
  wallPatch(grid, wall, a0 - 3, a1 + 3, z1 + 2, z1 + 3, W.frame[0]); wallPatch(grid, wall, a1 + 2, a1 + 3, z0 - 3, z1 + 3, W.frame[0]);
  wallPatch(grid, wall, a0 - 1, a1 + 1, z0 - 1, z1 + 1, W.frame[2]);
  paintView(grid, time);
  // the cross, lit on its top and on the side towards the sun
  wallPatch(grid, wall, CROSS.a - 1, CROSS.a + 2, z0, z1, W.frame[1]); wallPatch(grid, wall, CROSS.a + 1, CROSS.a + 2, z0, z1, W.frame[0]);
  wallPatch(grid, wall, a0, a1, CROSS.z - 1, CROSS.z + 2, W.frame[1]); wallPatch(grid, wall, a0, a1, CROSS.z + 1, CROSS.z + 2, W.frame[0]);
  wallPatch(grid, wall, CROSS.a - 2, CROSS.a - 1, z0, z1, W.frame[2]); wallPatch(grid, wall, a0, a1, CROSS.z - 2, CROSS.z - 1, W.frame[2]);
  if (time === 'day') for (const [a, z] of [[78, 82], [70, 58]] as const) for (let step = 0; step < 4; step++) wallPixel(grid, wall, a - step, z - step, W.glint);
  ob(grid, 0, 7, a0 - 3, a1 + 3, z0 - 7, 3, W.sill, W.sillEdge);
  // a pinecone and a red mushroom in its little pot on the sill
  art(grid, (layer) => pinecone(layer, iso(3, a0 + 4, z0 - 4).x, iso(3, a0 + 4, z0 - 4).y));
  art(grid, (layer) => {
    const { x, y } = iso(3, a1 - 2, z0 - 4), B = P.fern.bucket;
    layer.rect(x - 3, y - 4, 7, 4, B[1]); layer.rect(x + 2, y - 4, 2, 4, B[2]); layer.rect(x - 3, y - 5, 7, 1, B[0]);
    mushroom(layer, x, y - 5, 4, P.mushroom.cap);
  });
}

/** The red checked curtains, gathered by their ties on either side of the window, and their rod. */
function paintCurtains(grid: PixelGrid) {
  const wall: Wall = 'left', K = P.curtain, { a0, a1, z0, z1 } = PANES, top = z1 + 6, bottom = z0 - 3, tie = CROSS.z - 6, full = 10;
  // each panel hangs from its outer edge: full above, pinched at its tie, a little flared below; a cream check in the red
  for (const [outer, inward] of [[a0 - 8, 1], [a1 + 7, -1]] as const) {
    for (let z = bottom; z < top; z++) {
      const above = z >= tie, t = above ? Math.min(1, (z - tie) / (top - 6 - tie)) : (tie - z) / (tie - bottom);
      const width = Math.round(above ? 4 + (full - 4) * Math.sqrt(t) : 4 + 2 * t);
      for (let index = 0; index < width; index++) {
        const a = outer + inward * index, band = (z - bottom) % 6 === 0, stripe = index % 5 === 2, fold = index === width - 1 || index % 3 === 1;
        const colour = band && stripe ? K.creamShade : band || stripe ? K.cream : fold ? K.redShade : K.red;
        wallPixel(grid, wall, a, z, colour);
      }
      wallPixel(grid, wall, outer + inward * width, z, O);
    }
    for (let index = 0; index <= 4; index++) wallPixel(grid, wall, outer + inward * index, bottom - 1, O);
    const near = outer - inward, far = outer + inward * 5;
    wallPatch(grid, wall, Math.min(near, far), Math.max(near, far) + 1, tie - 1, tie + 2, O); wallPatch(grid, wall, Math.min(near, far) + 1, Math.max(near, far), tie, tie + 1, K.tie);
  }
  wallPatch(grid, wall, a0 - 12, a1 + 12, top - 1, top + 2, O); wallPatch(grid, wall, a0 - 11, a1 + 11, top, top + 1, K.rod);
  for (const a of [a0 - 12, a1 + 10]) { wallPatch(grid, wall, a, a + 2, top - 2, top + 3, O); wallPatch(grid, wall, a, a + 2, top - 1, top + 2, P.window.frame[0]); }
}

/** The arched plank door, its iron straps, its knob and its wreath: a click goes through it, to the break room. */
const paintCabinDoor: Painter = (grid) => {
  const D = P.door, { a0, a1, height } = DOOR, wall: Wall = 'left', middle = (a0 + a1) / 2, half = (a1 - a0) / 2;
  const top = (a: number, grow: number) => {
    const dx = Math.min(Math.abs(a + 0.5 - middle), half + grow - 0.5);
    return height - 5 + grow + Math.sqrt(Math.max(0, (half + grow) ** 2 - dx * dx)) * 0.5;
  };
  for (const [grow, colour] of [[2, O], [1, D.frame]] as const) fillWall(grid, wall, a0 - grow, a1 + grow, 0, height + 8, (a, z) => (z < top(a, grow) ? colour : null));
  fillWall(grid, wall, a0, a1, 0, height + 8, (a, z) => {
    if (z >= top(a, 0)) return null;
    if (z >= top(a, 0) - 1) return D.leafLight;
    const across = (a - a0) % 5;
    if (across === 4) return D.seam;
    if (across === 0) return D.leafLight;
    return (a * 7 + Math.floor(z / 3) * 5) % 31 === 0 ? D.leafShade : D.leaf;
  });
  wallPatch(grid, wall, a1 - 1, a1, 0, height - 4, D.leafShade);
  // the iron straps on the hinges' side, their rivets, the ring of the knob
  for (const z of [10, 46]) {
    wallPatch(grid, wall, a0, a0 + 13, z, z + 2, D.iron); wallPatch(grid, wall, a0, a0 + 13, z + 1, z + 2, D.ironLight);
    for (const a of [a0 + 3, a0 + 8, a0 + 12]) wallPixel(grid, wall, a, z, D.ironLight);
  }
  wallPatch(grid, wall, a1 - 6, a1 - 2, 27, 31, D.iron); wallPatch(grid, wall, a1 - 5, a1 - 3, 28, 30, D.knob); wallPixel(grid, wall, a1 - 4, 28, D.knobShade);
  // the wreath: leaves round, berries, a red bow at its foot
  const cz = 36;
  wallEllipse(grid, wall, middle, cz, 5.6, 5.6, O);
  wallEllipse(grid, wall, middle, cz, 4.8, 4.8, D.wreath[1]);
  for (let index = 0; index < 12; index++) {
    const angle = (index / 12) * Math.PI * 2;
    wallPixel(grid, wall, Math.floor(middle + Math.cos(angle) * 3.6), Math.floor(cz + Math.sin(angle) * 3.6), index % 2 ? D.wreath[0] : D.wreath[2]);
  }
  wallEllipse(grid, wall, middle, cz, 2.4, 2.4, O); wallEllipse(grid, wall, middle, cz, 1.6, 1.6, D.leafShade);
  for (const [a, z] of [[middle + 3, cz + 2], [middle - 4, cz + 1], [middle + 1, cz + 4]] as const) wallPixel(grid, wall, Math.floor(a), Math.floor(z), D.berry);
  for (const [a, z] of [[-2, -4], [-1, -4], [0, -4], [1, -4], [-2, -5], [1, -5], [-1, -6], [0, -6]] as const) wallPixel(grid, wall, Math.floor(middle + a), cz + z, D.bow);
};

/** The coir mat in front of the door, a leaf woven in it. */
function paintDoormat(grid: PixelGrid) {
  const { a0, a1 } = DOOR, M = P.door.mat, middle = (a0 + a1) / 2;
  fillTop(grid, 1, 12, a0 + 1, a1 - 1, 0, (u, v) => {
    if (u === 1 || u === 11 || v === a0 + 1 || v === a1 - 2) return M[2];
    if (Math.abs(v + 0.5 - middle) + Math.abs(u - 6) * 1.6 < 5) return u === 6 ? M[2] : M[0];
    return (u + v) % 3 === 0 ? M[2] : M[1];
  });
}

/** The cork board in its bark frame on the right wall, its notes, a map and a pressed leaf: a click opens the board and its notes. */
const paintCorkBoard: Painter = (grid) => {
  const wall: Wall = 'right', B = P.board;
  wallPatch(grid, wall, 73, 123, 44, 88, O);
  fillWall(grid, wall, 74, 122, 45, 87, (a, z) => {
    if (z === 86) return B.frame[0];
    if (z === 45) return B.frame[2];
    return (a * 5 + z * 3) % 7 === 0 ? B.frame[2] : (a + z * 2) % 11 === 0 ? B.frame[0] : B.frame[1];
  });
  wallPatch(grid, wall, 76, 120, 48, 84, B.frame[2]);
  fillWall(grid, wall, 77, 119, 49, 83, (a, z) => ((a * 7 + z * 13) % 11 === 0 ? B.corkDot : B.cork));
  const note = (a0: number, a1: number, z0: number, z1: number, paper: string, pin: string) => {
    wallPatch(grid, wall, a0 + 1, a1 + 1, z0 - 1, z1 - 1, B.corkDot);
    wallPatch(grid, wall, a0, a1, z0, z1, paper);
    const middle = (a0 + a1) >> 1;
    wallPatch(grid, wall, middle - 1, middle + 1, z1 - 2, z1, pin);
  };
  // a to-do list, its lines and its ticks
  note(80, 93, 64, 80, B.papers[0], B.pins[0]);
  for (const [z, length, ticked] of [[75, 8, true], [71, 6, true], [67, 9, false]] as const) {
    wallPatch(grid, wall, 82, 84, z, z + 2, B.inkSoft);
    if (ticked) { wallPixel(grid, wall, 82, z + 1, B.pins[3]); wallPixel(grid, wall, 83, z, B.pins[3]); }
    wallPatch(grid, wall, 85, 85 + length - 3, z, z + 1, B.ink);
  }
  // a note, a map with its trail to a cross
  note(96, 106, 70, 81, B.papers[1], B.pins[1]);
  for (const [z, length] of [[77, 7], [74, 5], [72, 6]] as const) wallPatch(grid, wall, 98, 98 + length, z, z + 1, B.ink);
  note(84, 104, 51, 63, B.papers[3], B.pins[2]);
  for (const [a, z] of [[86, 53], [88, 54], [90, 56], [92, 55], [94, 57], [96, 58], [98, 57]] as const) wallPixel(grid, wall, a, z, B.string);
  for (const [a, z] of [[100, 59], [102, 59], [101, 58], [100, 57], [102, 57]] as const) wallPixel(grid, wall, a, z, B.ink);
  wallPatch(grid, wall, 86, 89, 58, 61, B.leaf[1]); wallPixel(grid, wall, 87, 61, B.leaf[2]);
  // a pressed leaf on its card
  note(108, 118, 58, 79, B.papers[2], B.pins[3]);
  for (let z = 61; z < 76; z++) {
    const half = Math.round(Math.sin(((z - 61) / 15) * Math.PI) * 3.4);
    wallPatch(grid, wall, 113 - half, 114 + half, z, z + 1, B.leaf[1]);
    if (half > 1) wallPixel(grid, wall, 113 - half, z, B.leaf[0]);
  }
  wallPatch(grid, wall, 113, 114, 59, 76, B.leaf[2]);
  for (const z of [65, 69, 73]) { wallPixel(grid, wall, 112, z + 1, B.leaf[2]); wallPixel(grid, wall, 115, z + 1, B.leaf[2]); }
  // the twig ledge under it, a pencil on it
  ob(grid, 76, 120, 0, 4, 42, 2, B.frame);
  ob(grid, 90, 102, 1, 3, 44, 1, [B.pins[2], B.pins[2], B.frame[2]]);
};

/** A slice of log for a clock above the door: its hands are drawn by clock.ts. */
const CLOCK: WallClock = { wall: 'left', a: 112, z: 80, radius: 6, tones: P.clock };

/* Small things */

/** A mushroom with its spotted cap, `size` its cap's half width. */
function mushroom(layer: PixelGrid, x: number, y: number, size: number, cap: Tones) {
  const M = P.mushroom, stem = Math.max(2, size - 1);
  layer.rect(x - 1, y - stem, 3, stem, M.stem[0]); layer.set(x + 1, y - 1, M.stem[1]);
  for (let row = 0; row < size; row++) {
    const half = Math.round(Math.sqrt(1 - (row / size) ** 2) * size);
    for (let dx = -half; dx <= half; dx++) layer.set(x + dx, y - stem - row, dx > half - 2 ? cap[2] : row > size - 2 || dx < -half + 2 ? cap[0] : cap[1]);
  }
  if (size >= 3 && cap !== M.brown) for (const [dx, dy] of [[-2, 1], [1, 2], [2, 0]] as const) layer.set(x + dx, y - stem - dy, M.spot);
}

const pinecone = (layer: PixelGrid, x: number, y: number) => {
  const [light, base, dark] = P.pinecone;
  layer.pattern(x - 2, y - 7, ['..l..', '.lbd.', 'lbbbd', '.bdb.', 'lbdbd', '.bbd.', '..d..'], { l: light, b: base, d: dark });
};

/** The desks' things: a mug of tea with its leaf, a red mushroom in its pot. */
const teaMug: Topper = (layer, x, y) => {
  const M = P.mug;
  layer.rect(x - 2, y - 5, 5, 5, M.body); layer.rect(x + 2, y - 5, 1, 5, M.shade); layer.rect(x - 1, y - 5, 3, 1, M.tea); layer.rect(x + 3, y - 4, 1, 2, M.body);
  layer.set(x - 1, y - 3, M.leaf); layer.set(x, y - 2, M.leaf);
};
const pottedMushroom: Topper = (layer, x, y) => {
  const B = P.fern.bucket;
  layer.rect(x - 3, y - 3, 6, 3, B[1]); layer.rect(x + 1, y - 3, 2, 3, B[2]); layer.rect(x - 3, y - 4, 6, 1, B[0]);
  mushroom(layer, x, y - 4, 3, P.mushroom.cap);
};

/* What stands on the floor */

/** The fern in its bucket in the back corner, where the offices' monstera is, and a cluster of mushrooms at its foot. */
function paintFern(grid: PixelGrid) {
  const F = P.fern, { x, y } = iso(MONSTERA.u, MONSTERA.v), rim = y - 15;
  const frond = (layer: PixelGrid, angle: number, length: number, front: boolean) => {
    const droop = 0.045, [lit, base, dark] = F.fronds;
    let last: [number, number] = [x, rim];
    for (let s = 1; s <= length; s++) {
      const px = x + Math.sin(angle) * s, py = rim - Math.cos(angle) * s + droop * s * s, at: [number, number] = [Math.round(px), Math.round(py)];
      layer.set(at[0], at[1], front ? base : dark);
      if (s % 2 === 0 && s > 2) {
        const tx = Math.sin(angle), ty = -Math.cos(angle) + 2 * droop * s, norm = Math.hypot(tx, ty), nx = -ty / norm, ny = tx / norm;
        const reach = Math.max(1, Math.round(4 * (1 - s / length)) + 1);
        for (const side of [-1, 1]) for (let j = 1; j <= reach; j++) {
          layer.set(Math.round(px + side * nx * j + (tx / norm) * j * 0.6), Math.round(py + side * ny * j + (ty / norm) * j * 0.6), j === reach ? lit : front ? lit : base);
        }
      }
      last = at;
    }
    layer.set(last[0], last[1], lit);
  };
  art(grid, (layer) => { for (const [angle, length] of [[-0.5, 20], [0.15, 22], [0.7, 19], [-1.1, 16], [1.25, 15]] as const) frond(layer, angle, length, false); });
  art(grid, (layer) => {
    for (let row = 0; row < 15; row++) {
      const half = row < 2 ? 9 : 8 - Math.floor((row - 2) / 7);
      for (let dx = -half; dx < half; dx++) layer.set(x + dx, rim + row, dx < -half + 3 ? F.bucket[0] : dx >= half - 4 ? F.bucket[2] : (dx + 20) % 5 === 0 ? F.bucket[2] : F.bucket[1]);
    }
    layer.rect(x - 9, rim, 18, 1, F.bucket[0]); layer.rect(x - 8, rim + 1, 16, 1, F.soil);
    for (const row of [4, 11]) layer.rect(x - 8, rim + row, 16, 1, F.hoop);
  });
  art(grid, (layer) => { for (const [angle, length] of [[-0.85, 17], [0.45, 18], [-0.2, 14], [1.0, 14]] as const) frond(layer, angle, length, true); });
  art(grid, (layer) => {
    const at = iso(MONSTERA.u + 5, MONSTERA.v + 6);
    mushroom(layer, at.x - 3, at.y, 4, P.mushroom.cap); mushroom(layer, at.x + 3, at.y + 1, 3, P.mushroom.cap); mushroom(layer, at.x, at.y + 2, 2, P.mushroom.brown);
  });
}

/** The tea counter where the offices' coffee counter is: planks, a thick top, the kettle on its trivet, two cups, honey, a basket of apples. */
function paintTeaCounter(grid: PixelGrid) {
  const K = P.counter, { u0, u1, v0, v1 } = COUNTER, front = v1 - 1;
  ob(grid, u0 + 1, u1 - 1, v0, front, 0, 20, K.body);
  for (let a = u0 + 5; a < u1 - 2; a += 5) { patchOnLeftFace(grid, front, a, a + 1, 1, 20, K.plank); onLeftFace(grid, front, a + 1, a + 4, 19, K.plankLight); }
  patchOnLeftFace(grid, front, u0 + 1, u1 - 1, 0, 2, K.plank);
  ob(grid, u0, u1, v0, v1, 20, 3, K.top, K.topEdge);
  const z = 23;
  art(grid, (layer) => {
    const { x, y } = iso(40, 7, z);
    layer.rect(x - 5, y - 1, 11, 1, K.iron);
    layer.ellipse(x, y - 5, 5.5, 4.2, K.kettle[1]); layer.ellipse(x - 2, y - 7, 2, 1.4, K.kettle[0]);
    layer.points([[x + 3, y - 3], [x + 4, y - 4], [x + 4, y - 5], [x + 2, y - 2], [x + 4, y - 6]], K.kettle[2]);
    layer.rect(x - 2, y - 10, 5, 1, K.kettle[2]); layer.rect(x - 1, y - 11, 3, 1, K.iron);
    layer.line(x + 5, y - 5, x + 8, y - 9, K.kettle[1]); layer.set(x + 8, y - 10, K.kettle[1]);
    layer.points([[x - 4, y - 9], [x - 4, y - 10], [x - 3, y - 12], [x - 2, y - 13], [x - 1, y - 14], [x, y - 14], [x + 1, y - 14], [x + 2, y - 13], [x + 3, y - 12], [x + 4, y - 10], [x + 4, y - 9]], K.iron);
  });
  { const { x, y } = iso(40, 7, z); grid.points([[x + 9, y - 13], [x + 10, y - 15], [x + 9, y - 17], [x + 10, y - 19], [x + 8, y - 15]], K.steam); }
  for (const u of [49, 53]) art(grid, (layer) => {
    const { x, y } = iso(u, 11, z);
    layer.rect(x - 1, y - 3, 4, 3, K.cup); layer.set(x + 2, y - 3, K.cupShade); layer.set(x + 2, y - 2, K.cupShade); layer.rect(x, y - 3, 2, 1, K.tea); layer.set(x - 2, y - 2, K.cup);
  });
  art(grid, (layer) => {
    const { x, y } = iso(57, 5, z);
    layer.rect(x - 2, y - 7, 6, 7, K.honey); layer.rect(x - 1, y - 6, 1, 4, K.honeyLight); layer.rect(x + 3, y - 7, 1, 7, K.kettle[2]);
    layer.rect(x - 3, y - 9, 8, 2, K.cloth); layer.set(x - 2, y - 9, K.clothLight); layer.set(x + 1, y - 9, K.clothLight); layer.set(x, y - 8, K.clothLight); layer.set(x + 3, y - 8, K.clothLight);
  });
  art(grid, (layer) => {
    const { x, y } = iso(66, 8, z), [light, base, dark] = K.basket;
    for (const [dx, dy, tone] of [[-3, -6, 0], [0, -7, 1], [3, -6, 0], [-1, -9, 1], [2, -9, 0]] as const) {
      layer.ellipse(x + dx + 0.5, y + dy, 2, 2, K.apples[tone]); layer.set(x + dx, y + dy - 1, K.cup);
    }
    layer.set(x, y - 11, K.appleLeaf); layer.set(x + 1, y - 12, K.appleLeaf);
    for (let row = 0; row < 5; row++) for (let dx = -5; dx <= 5; dx++) layer.set(x + dx, y - 5 + row, dx > 3 ? dark : (dx + row) % 2 ? base : light);
  });
}

/** The rain barrel where the offices' water cooler is: staves, iron hoops, its tap towards the room, a tin cup on its lid. */
function paintBarrel(grid: PixelGrid) {
  const B = P.barrel, { u, v, width } = COOLER, { x, y } = iso(u + width / 2, v + width / 2), height = 22;
  art(grid, (layer) => {
    for (let row = 0; row <= height; row++) {
      const t = row / height, half = Math.round(9 + Math.sin(t * Math.PI) * 1.6), curve = Math.round(Math.sqrt(Math.max(0, 1 - 0)) * 0);
      for (let dx = -half; dx <= half; dx++) {
        const sag = Math.round(Math.sqrt(Math.max(0, 1 - (dx / (half + 0.5)) ** 2)) * 3), py = y - row + sag + curve;
        const hoop = row === 4 || row === 5 || row === height - 5 || row === height - 4;
        const tone = dx < -half + 3 ? 0 : dx > half - 4 ? 2 : 1;
        layer.set(x + dx, py, hoop ? B.hoop[tone] : (dx + 20) % 4 === 0 ? B.seam : B.staves[tone]);
      }
    }
    layer.ellipse(x, y - height, 9, 3.4, B.lid[0]); layer.ellipse(x + 1, y - height + 0.6, 7.4, 2.4, B.lid[1], [B.lid[0]]);
    layer.rect(x - 5, y - 9, 3, 2, B.tap); layer.set(x - 5, y - 7, B.tapShade); layer.set(x - 3, y - 9, B.tapShade);
  });
  art(grid, (layer) => {
    const at = { x: x + 3, y: y - height - 1 };
    layer.rect(at.x - 2, at.y - 3, 4, 3, B.cup[0]); layer.rect(at.x + 1, at.y - 3, 1, 3, B.cup[1]); layer.set(at.x + 2, at.y - 2, B.cup[1]);
  });
}

/** A jar of fireflies on the chest. */
const fireflyJar: Topper = (layer, x, y) => {
  const J = P.jar;
  layer.rect(x - 3, y - 9, 7, 9, J.glass); layer.rect(x + 2, y - 9, 2, 9, J.glassShade);
  layer.rect(x - 3, y - 11, 7, 2, J.lid); layer.rect(x - 2, y - 12, 5, 1, J.lid);
  for (const [dx, dy] of [[-1, -6], [1, -3], [0, -8], [-2, -2], [2, -6]] as const) layer.set(x + dx, y + dy, J.glow);
  for (const [dx, dy] of [[-1, -5], [1, -4], [0, -7]] as const) layer.set(x + dx, y + dy, J.glowSoft);
};

const CHEST: Drawers = { ...DRAWERS[0], tones: P.chest, topper: fireflyJar };
/** The stack of firewood where the offices' mint drawers are, by the door. */
const WOOD = DRAWERS[1];

function paintWoodStack(grid: PixelGrid) {
  const K = P.logStack, { u0, u1, v0, v1, height } = WOOD;
  // the board at the back end first: the logs stand in front of it, the board at the front end in front of them
  ob(grid, u0, u1, v0, v0 + 2, 0, height + 5, K.frame);
  ob(grid, u0, u1 - 1, v0 + 1, v1 - 1, 0, height, [K.bark, K.bark, K.bark]);
  fillRightFace(grid, u1 - 1, v0 + 1, v1 - 1, 0, height, (a, z) => {
    const row = Math.floor(z / 6), ca = v0 + 4 + (row % 2) * 3 + Math.round((a - v0 - 4 - (row % 2) * 3) / 6) * 6, d = Math.hypot(a + 0.5 - ca, z + 0.5 - (row * 6 + 3));
    return d < 1.2 ? K.heart : d < 2.2 ? K.end : d < 2.9 ? K.ring : K.bark;
  });
  fillTop(grid, u0, u1 - 1, v0 + 1, v1 - 1, height, (u, v) => ((u + v) % 5 === 0 ? K.moss : null));
  ob(grid, u0, u1, v1 - 2, v1, 0, height + 5, K.frame);
  art(grid, (layer) => {
    const { x, y } = iso((u0 + u1) / 2 + 2, (v0 + v1) / 2 + 2, height);
    mushroom(layer, x - 2, y, 3, P.mushroom.brown); mushroom(layer, x + 3, y + 1, 2, P.mushroom.brown);
  });
}

/** The lantern on its post where the offices' floor lamp is: a stump for a foot, an iron arm, the lantern hanging from it. */
function paintLantern(grid: PixelGrid) {
  const L = P.lantern, { x, y } = iso(LAMP.u, LAMP.v);
  art(grid, (layer) => {
    layer.ellipse(x, y - 1, 5, 2.2, L.post[2]); layer.rect(x - 4, y - 5, 9, 4, L.post[1]); layer.rect(x + 2, y - 5, 3, 4, L.post[2]); layer.ellipse(x, y - 5, 4.5, 1.6, L.post[0]);
    layer.rect(x - 1, y - 48, 3, 43, L.post[1]); layer.rect(x - 1, y - 48, 1, 43, L.post[0]); layer.rect(x + 1, y - 48, 1, 43, L.post[2]);
  });
  art(grid, (layer) => {
    layer.rect(x + 2, y - 47, 8, 1, L.iron); layer.line(x + 2, y - 43, x + 5, y - 46, L.iron);
    layer.rect(x + 8, y - 46, 1, 3, L.iron);
    layer.rect(x + 6, y - 43, 5, 1, L.iron); layer.rect(x + 5, y - 42, 7, 1, L.ironLight);
    layer.rect(x + 6, y - 41, 5, 7, L.glass); layer.rect(x + 7, y - 40, 3, 5, L.glassLight); layer.rect(x + 8, y - 38, 1, 2, L.flame);
    layer.rect(x + 5, y - 41, 1, 7, L.iron); layer.rect(x + 11, y - 41, 1, 7, L.iron);
    layer.rect(x + 5, y - 34, 7, 1, L.iron);
  });
}

/** The log couch with its moss cushions, a plaid over its back, a mushroom pillow. */
function paintLogCouch(grid: PixelGrid) {
  const couch = office.couch, K = P.plaid;
  paintCouch(grid, couch, P.couch, 2, null);
  const [u0, va] = onCouchAt(couch, 0, 6), [u1, vb] = onCouchAt(couch, 7, 20);
  const stripe = (v: number) => ((v - va) % 5 === 1 ? K.cream : (v - va) % 5 === 3 ? K.dark : K.red);
  fillTop(grid, u0, u1, va, vb, 26, (u, v) => (u === u0 ? K.redShade : stripe(v)));
  fillRightFace(grid, u1, va, vb, 14, 26, (a, z) => (z === 14 ? (a % 2 ? K.cream : null) : z === 15 ? K.redShade : stripe(a)));
  art(grid, (layer) => {
    const { x, y } = iso(...onCouchAt(couch, 11, 30), 13), M = P.mushroom;
    layer.rect(x - 2, y - 4, 5, 4, M.stem[0]); layer.rect(x + 2, y - 4, 1, 4, M.stem[1]);
    layer.ellipse(x + 0.5, y - 6, 5.5, 3.6, M.cap[1]); layer.rect(x - 5, y - 5, 11, 1, M.cap[2]);
    layer.points([[x - 3, y - 8], [x + 1, y - 9], [x + 3, y - 7], [x - 1, y - 6]], M.spot); layer.set(x - 2, y - 9, M.cap[0]);
  });
}

/* Hung on the walls, lying on the floor */

/** The bird house on the right wall, on its post: its roof's ridge along the wall, a gable at its side, its round door and its perch, a robin on the ridge. */
function paintBirdhouse(grid: PixelGrid) {
  const B = P.birdhouse, wall: Wall = 'right', u0 = 10, u1 = 22, depth = 8, z = 50, height = 12, middle = (u0 + u1) / 2, ridge = depth / 2, peak = 5, top = z + height;
  wallPatch(grid, wall, middle - 2, middle + 2, 32, z, O); wallPatch(grid, wall, middle - 1, middle + 1, 33, z, B.perch);
  ob(grid, u0, u1, 0, depth, z, height, B.body);
  art(grid, (layer) => {
    for (let rise = 0; rise < peak; rise++) {
      const half = ridge * (1 - rise / peak);
      onRightFace(layer, u1, Math.round(ridge - half), Math.round(ridge + half), top + rise, rise === 0 ? B.body[2] : B.body[1]);
    }
    for (let u = u0 - 1; u <= u1 + 1; u++) for (let v = 0; v <= depth + 1; v++) {
      const at = iso(u, v, top - 1 + peak * (1 - Math.abs(v - ridge) / (ridge + 1)));
      layer.rect(at.x, Math.round(at.y), 2, 2, u === u1 + 1 || v === depth + 1 ? B.roof[2] : v === ridge ? B.ridge : v < ridge ? B.roof[0] : B.roof[1]);
    }
  });
  patchOnLeftFace(grid, depth, middle - 2, middle + 2, z + 2, z + 8, O); patchOnLeftFace(grid, depth, middle - 1, middle + 1, z + 3, z + 7, B.hole);
  ob(grid, middle - 1, middle + 1, depth, depth + 3, z + 1, 1, [B.perch, B.perch, B.perch]);
  art(grid, (layer) => {
    const { x, y } = iso(middle + 2, ridge, top + peak);
    layer.pattern(x - 3, Math.round(y) - 6, ['....bb.', '...bbek', 'bbbrrb.', '.bbrrb.', '..bbb..', '..f.f..'], { b: B.bird, e: B.eye, k: B.beak, r: B.breast, f: B.perch });
  });
}

/** A shelf on the right wall over the counter: three jars, bundles of herbs drying under it. */
function paintJarShelf(grid: PixelGrid) {
  const S = P.shelf;
  ob(grid, 34, 68, 0, 5, 54, 2, S.board);
  for (const [index, colour] of S.jars.entries()) art(grid, (layer) => {
    const { x, y } = iso(37 + index * 7, 2, 56);
    layer.rect(x - 2, y - 5, 4, 5, colour); layer.rect(x + 1, y - 5, 1, 5, S.board[2]); layer.rect(x - 2, y - 6, 4, 1, S.lid); layer.set(x - 1, y - 4, S.lid);
  });
  for (const u of [58, 64]) art(grid, (layer) => {
    const { x, y } = iso(u, 3, 53);
    layer.rect(x, y, 1, 3, S.twine);
    for (let row = 0; row < 7; row++) { const half = row < 2 ? 1 : row < 5 ? 2 : 1; for (let dx = -half; dx <= half; dx++) layer.set(x + dx, y + 3 + row, S.herbs[(dx + row) & 1]); }
  });
}

/** A garland of leaves along the top of the two walls, sagging between its hooks, little lights and berries in it. */
function paintGarland(grid: PixelGrid) {
  const G = P.garland, span = 32;
  art(grid, (layer) => {
    for (const wall of ['left', 'right'] as const) for (let a = 1; a < ROOM - 1; a++) {
      const t = (a % span) / span, z = Math.round(96 - Math.sin(t * Math.PI) * 4);
      wallPixel(layer, wall, a, z, G.vine);
      if (a % 3 === 0) { const side = (a / 3) % 2 ? 1 : -1; wallPatch(layer, wall, a - 1, a + 1, z + side, z + side + 1, G.leaves[1]); wallPixel(layer, wall, a, z + side * 2, G.leaves[(a / 3) % 4 ? 0 : 2]); }
      if (a % 3 === 1) wallPixel(layer, wall, a, z - 1, G.leaves[2]);
      if (a % 8 === 4) { wallPixel(layer, wall, a, z - 2, G.bulb); wallPixel(layer, wall, a, z - 3, G.bulbShade); }
      if (a % 11 === 6) wallPixel(layer, wall, a, z + 1, G.berry);
    }
  });
}

/** The moss rug in the middle of the room: soft edges, clover and little flowers in it. */
function paintMossRug(grid: PixelGrid) {
  const R = P.rug, cu = 53, cv = 96;
  fillTop(grid, 28, 78, 72, 120, 0, (u, v) => {
    const du = (u + 0.5 - cu) / 23, dv = (v + 0.5 - cv) / 21, angle = Math.atan2(dv, du);
    const d = Math.hypot(du, dv) * (1 + 0.06 * Math.sin(angle * 5) + 0.04 * Math.cos(angle * 3));
    if (d >= 1) return null;
    if (d >= 0.93) return R.edge;
    if (d >= 0.85) return (u + v) % 2 ? R.dark : R.base;
    const seed = (u * 7 + v * 13) % 37;
    if (seed === 0) return R.flowers[(u + v) % 3];
    if (seed < 4) return R.light;
    if (seed < 8) return R.dark;
    return R.base;
  });
}

const GLOW: readonly string[] = [P.jar.glow, P.jar.glowSoft, P.garland.bulb, P.garland.bulbShade];
const VIEW: readonly string[] = [
  ...V.day, ...V.dusk, ...V.night, ...Object.values(V.pines).flatMap((pines) => [...pines.far, ...pines.mid, ...pines.near, pines.trunk]),
  V.sun, V.sunLight, V.sunLow, V.sunLowLight, V.moon, V.moonShade, V.star, V.cloud, V.cloudShade, V.duskCloud, V.duskCloudShade, V.bird, V.firefly, V.fireflyGlow,
];

const LANTERN = iso(LAMP.u, LAMP.v);
const JAR = iso(((CHEST.u0 + CHEST.u1) >> 1) + 3, ((CHEST.v0 + CHEST.v1) >> 1) + 3, CHEST.height);

/**
 * The fireflies wandering in the window (paintFireflies); while someone is there, the ones in the jar glimmering, the
 * garland's bulbs twinkling and the lantern's flame once it is lit, at dusk and at night.
 */
const motion: AmbianceMotion = {
  masks: { jar: [P.jar.glowSoft, P.jar.glow], bulbs: [P.garland.bulbShade, P.garland.bulb], lantern: [P.lantern.flame, P.lantern.glass, P.lantern.glassLight] },
  paint({ view, jar, bulbs, lantern }, frame, { time, lit }) {
    paintFireflies(view, time, frame);
    if (!lit) return;
    glimmer(jar, JAR.x - 3, JAR.y - 12, 7, 12, frame, 1);
    for (const wall of WALLS) for (let a = 4; a < ROOM - 1; a += 8) {
      if (hash(a + (wall === 'left' ? 0 : ROOM), frame >> 3) > 0.18) continue;
      const z = Math.round(96 - Math.sin(((a % 32) / 32) * Math.PI) * 4) - 2;
      bulbs.set(wallX(wall, a), wallY(wall, a, z), P.garland.bulbShade);
    }
    if (time !== 'day') glimmer(lantern, LANTERN.x + 5, LANTERN.y - 42, 7, 9, frame, 2);
  },
};
const WALLS = ['left', 'right'] as const;

export const forest: AmbianceDesign = {
  ...office,
  id: 'forest',
  deskStyle: {
    top: P.desk.top, topEdge: P.desk.edge, leg: P.desk.leg, drawers: P.desk.drawers, monitor: P.desk.monitor, monitorEdge: P.desk.monitorEdge, stand: P.desk.stand,
    vents: P.desk.vents, keyboard: P.desk.keyboard, key: P.desk.key, seats: P.seats, chairBase: P.chair.base, chairPole: P.chair.pole, backThing: teaMug, sideThing: pottedMushroom,
  },
  paintCouch: paintLogCouch,
  paintCouchArm: (grid) => paintCouchArm(grid, office.couch, P.couch),
  paintDoor: paintCabinDoor,
  paintBoard: paintCorkBoard,
  clock: CLOCK,
  paintRoom(grid, time) {
    paintPlankFloor(grid);
    paintLogWalls(grid);
    paintWindow(grid, time);
    paintCurtains(grid);
  },
  dress(grid) {
    paintBirdhouse(grid);
    paintJarShelf(grid);
    paintGarland(grid);
    paintMossRug(grid);
    paintDoormat(grid);
  },
  standing: [
    standing(MONSTERA.u, MONSTERA.u, MONSTERA.v, MONSTERA.v, paintFern),
    standing(COUNTER.u0, COUNTER.u1, COUNTER.v0, COUNTER.v1, paintTeaCounter),
    standing(COOLER.u, COOLER.u + COOLER.width, COOLER.v, COOLER.v + COOLER.width, paintBarrel),
    standing(CHEST.u0, CHEST.u1, CHEST.v0, CHEST.v1, (grid) => paintDrawers(grid, CHEST)),
    standing(WOOD.u0, WOOD.u1, WOOD.v0, WOOD.v1, paintWoodStack),
    standing(LAMP.u, LAMP.u, LAMP.v, LAMP.v, paintLantern),
  ],
  light: { lamp: LAMP, lampColour: P.light.lamp, ambient: P.light, lampGlow: [P.lantern.glass, P.lantern.glassLight, P.lantern.flame], glow: GLOW, sky: VIEW },
  glass: { wall: 'left', ...PANES },
  motion,
};
