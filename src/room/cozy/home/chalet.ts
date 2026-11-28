// The chalet (Preferences.homeTheme 'chalet'), a snowy night: log walls, a stone fireplace with its fire, stockings and
// candles, an armchair under a tartan throw, a cuckoo clock and its pendulum, snow falling past the window, the user's
// pet asleep by the fire, a hot chocolate steaming on the desk.
import { COZY_HOME_PALETTE as H } from '../../../design/room-palette.ts';
import { paintPlanks, shadeAlongWalls } from '../decor.ts';
import { ROOM_UNITS as ROOM, WALL_HEIGHT, iso } from '../geometry.ts';
import {
  box, fillLeftFace, fillRightFace, fillTop, fillWall, onLeftFace, onRightFace, patchOnLeftFace, tint, wallEllipse, wallPatch, wallPixel, type PixelGrid, type PixelTarget,
} from '../pixels.ts';
import { art, coloursOf, chairSeat, desk, hash, lamp, masked, monitor, ob, paintScreen, screenOf, steam, walls, webcam, type HomeDesign } from './kit.ts';

const K = H.chalet, G = K.glow;
const SEAT = { u: 55, v: 28, z: 11 } as const;
const SCREEN = screenOf(38, 72, 11, 17, 18);
/** The round rug by the fire, the pet's bed. */
const RUG = iso(40, 64);
const PET = { u: 41.5, v: 64.5, z: 0 } as const;
const MUG = iso(76, 17, 17);
const CANDLES = [44, 82] as const;

/** A stone of the fireplace, by where it is on its face. */
function stone(a: number, z: number): string {
  const row = Math.floor(z / 6), offset = (row % 3) * 4, column = Math.floor((a + offset) / 9);
  if (z % 6 === 5 || (a + offset) % 9 === 8) return K.stoneJoint;
  const colour = K.stone[Math.floor(hash(row, column) * 3)];
  return z % 6 === 4 ? tint(colour, 1.08) : colour;
}

/** The tartan's check at (a, b), darker by `shade`. */
function tartan(a: number, b: number, shade: number): string {
  const ia = ((a % 8) + 8) % 8, ib = ((b % 8) + 8) % 8, T = K.tartan;
  const colour = ia < 2 && ib < 2 ? T.light : ia < 2 || ib < 2 ? T.stripe : ia === 4 || ib === 4 ? T.line : T.red;
  return shade === 1 ? colour : tint(colour, shade);
}

function paintLogWalls(grid: PixelGrid) {
  const W = K.wall;
  walls(grid, W.left, W.right, W.cap);
  for (const wall of ['left', 'right'] as const) {
    const logs = wall === 'left' ? W.logsLeft : W.logsRight;
    fillWall(grid, wall, 0, ROOM, 0, WALL_HEIGHT, (a, z) => {
      const row = Math.floor(z / 8), r = z % 8, base = logs[row % 3];
      if (r === 0) return W.gap;
      if (r === 1) return tint(base, 0.78);
      if (r === 2) return tint(base, 0.9);
      if (r === 7) return tint(base, 1.1);
      const knot = 8 + Math.floor(hash(row, wall === 'left' ? 1 : 2) * 110);
      if (Math.abs(a - knot) <= 1 && r >= 3 && r <= 5) return a === knot && r === 4 ? W.knot : W.knotRing;
      if ((a * 7 + row * 13) % 29 === 0 && r >= 3) return tint(base, 0.92);
      return base;
    });
  }
}

/** The cuckoo clock, its chains and their weights (its pendulum swings each frame; its hands show the hour, clock.ts). */
function paintCuckoo(target: PixelTarget) {
  const Q = K.cuckoo;
  wallPatch(target, 'right', 14, 26, 46, 58, Q.frame); wallPatch(target, 'right', 15, 25, 47, 57, Q.body);
  for (let z = 58; z < 65; z++) { const half = 8 - (z - 58); wallPatch(target, 'right', 20 - half, 20 + half, z, z + 1, z === 58 ? Q.roofEdge : Q.roof); }
  wallEllipse(target, 'right', 20, 52, 3.4, 3.4, Q.face);
  wallPatch(target, 'right', 19, 22, 57, 58, Q.door);
  wallPatch(target, 'right', 17, 18, 34, 46, Q.chain); wallPatch(target, 'right', 23, 24, 38, 46, Q.chain);
  wallPatch(target, 'right', 16, 19, 29, 34, Q.roofEdge); wallPatch(target, 'right', 22, 25, 33, 38, Q.roofEdge); wallPixel(target, 'right', 16, 33, Q.roof); wallPixel(target, 'right', 22, 37, Q.roof);
}

function paintWallThings(grid: PixelGrid) {
  paintCuckoo(grid);
  // a mountain picture above the desk
  const P = K.picture;
  wallPatch(grid, 'right', 44, 66, 50, 66, P.frame); wallPatch(grid, 'right', 45, 65, 51, 65, P.sky);
  fillWall(grid, 'right', 45, 65, 51, 65, (a, z) => {
    const near = 51 + 11 - Math.abs(a - 52) * 1.2, far = 51 + 8 - Math.abs(a - 60) * 1.1;
    if (z < 54) return P.meadow;
    if (z < near) return z > near - 3 ? P.snow : P.mountain;
    if (z < far) return z > far - 2 ? P.snowFar : P.mountainFar;
    return null;
  });
  // the window: a snowy night, pines and the moon
  wallPatch(grid, 'right', 84, 122, 30, 76, K.window.frame); wallPatch(grid, 'right', 85, 121, 31, 75, K.window.bars);
  fillWall(grid, 'right', 87, 119, 33, 73, (a, z) => G.night[Math.min(4, Math.floor(((73 - z) + ((a + z) & 1) * 0.8) / 8))]);
  for (let index = 0; index < 9; index++) wallPixel(grid, 'right', 88 + Math.floor(hash(index, 3) * 30), 58 + Math.floor(hash(index, 7) * 14), G.star);
  wallEllipse(grid, 'right', 112, 65, 4, 4, G.moon);
  for (const [a, z] of [[111, 66], [113, 64], [112, 63]]) wallPixel(grid, 'right', a, z, G.moonShade);
  for (const [middle, base, height, width, colour] of [[92, 36, 18, 6, G.pine], [99, 36, 24, 7, G.pineLight], [108, 36, 16, 5, G.pine], [116, 36, 21, 6, G.pineLight]] as const) {
    for (let z = base; z < base + height; z++) {
      const t = (z - base) / height, half = Math.max(0, Math.round(width * (1 - t) + ((z - base) % 5 === 0 ? 1 : 0)));
      wallPatch(grid, 'right', middle - half, middle + half + 1, z, z + 1, colour);
      if ((z - base) % 5 === 4 || z === base + height - 1) {
        wallPixel(grid, 'right', middle - half, z, G.snow); wallPixel(grid, 'right', middle + half, z, G.snow);
        if (half < 2) wallPixel(grid, 'right', middle, z, G.snow);
      }
    }
  }
  fillWall(grid, 'right', 87, 119, 33, 40, (a, z) => (z < 36 + Math.round(Math.sin(a * 0.35) * 1.5 + 1) ? (z === 33 ? G.snowShade : G.snow) : null));
  wallPatch(grid, 'right', 102, 104, 33, 73, K.window.bars); wallPatch(grid, 'right', 87, 119, 52, 54, K.window.bars);
  for (const a0 of [87, 104]) { wallPatch(grid, 'right', a0, a0 + 4, 54, 55, G.snow); wallPixel(grid, 'right', a0, 55, G.snow); wallPatch(grid, 'right', a0 + 11, a0 + 15, 54, 55, G.snow); }
  art(grid, (layer) => box(layer, 83, 123, 0, 6, 27, 3, K.darkWood, K.darkWoodEdge));
  art(grid, (layer) => box(layer, 84, 122, 0, 6, 30, 1, [G.snow, G.snowShade, G.snowShade]));
}

function paintFireplace(grid: PixelGrid) {
  // the firewood basket
  ob(grid, 2, 14, 27, 39, 0, 8, K.basket, K.basketEdge);
  fillRightFace(grid, 14, 27, 39, 0, 8, (a, z) => ((a + z) % 3 === 0 ? K.weave : null)); fillLeftFace(grid, 39, 2, 14, 0, 8, (a, z) => ((a + z) % 3 === 0 ? K.weaveLight : null));
  for (const [u, v, z] of [[5, 31, 8], [10, 31, 8], [5, 36, 8], [10, 36, 8], [7.5, 33.5, 12]]) {
    art(grid, (layer) => { const { x, y } = iso(u, v, z); layer.ellipse(x, y - 2, 3.2, 2.4, K.logBark); layer.ellipse(x - 0.3, y - 2.2, 2.2, 1.6, K.logEnd); layer.set(Math.floor(x), Math.floor(y - 2), K.logRing); });
  }
  ob(grid, 0, 28, 42, 84, 0, 2, K.hearth, K.hearthEdge);
  ob(grid, 0, 18, 46, 80, 2, 42, K.stone);
  fillRightFace(grid, 18, 46, 80, 2, 44, stone); fillLeftFace(grid, 80, 0, 18, 2, 44, (a, z) => tint(stone(a, z), 0.9));
  // the firebox (its fire is drawn each frame) and the logs in it
  fillRightFace(grid, 18, 52, 74, 3, 27, (a, z) => {
    const inside = z < 22 || ((a + 0.5 - 63) / 11) ** 2 + ((z + 0.5 - 22) / 5) ** 2 <= 1;
    if (!inside) return null;
    return a === 52 || a === 73 || z === 3 ? K.fireRim : K.fireBack;
  });
  fillRightFace(grid, 18, 54, 72, 4, 8, (a, z) => {
    const end = a <= 55 || a >= 70;
    if (z === 7 && a > 56 && a < 69) return K.logTop;
    if (z >= 6) return end ? K.logEnd : K.logInside;
    return z === 4 && a % 3 === 0 ? G.ember : end ? K.logEndLow : K.logLow;
  });
  ob(grid, 0, 22, 40, 86, 44, 4, K.darkWood, K.darkWoodEdge);
  ob(grid, 0, 14, 48, 78, 48, WALL_HEIGHT - 48, K.stone);
  fillRightFace(grid, 14, 48, 78, 48, WALL_HEIGHT, stone); fillLeftFace(grid, 78, 0, 14, 48, WALL_HEIGHT, (a, z) => tint(stone(a, z), 0.9));
  // the garland along the mantel, the stockings and the candles
  const R = K.garland;
  fillRightFace(grid, 22, 40, 86, 38, 46, (a, z) => {
    const line = 43 - Math.round(3 * Math.sin(Math.PI * (((a - 40) % 15) / 15)));
    if (z < line - 2 || z > line) return null;
    if ((a * 5 + z) % 11 === 0) return R.berry;
    return (a + z) % 2 ? R.leaf : R.leafLight;
  });
  for (const [a0, colour] of [[52, K.stockings[0]], [67, K.stockings[1]]] as const) {
    fillRightFace(grid, 22, a0, a0 + 7, 28, 41, (a, z) => {
      const along = a - a0;
      if (z >= 38) return along < 6 ? (z === 38 ? K.cuff : K.cuffLight) : null;
      if (z >= 31) return along >= 1 && along < 5 ? (along === 4 ? tint(colour, 0.8) : colour) : null;
      return along < 6 ? (z === 28 ? tint(colour, 0.75) : colour) : null;
    });
  }
  for (const v of CANDLES) art(grid, (layer) => { const { x, y } = iso(18, v, 48); layer.rect(x - 1, y - 6, 3, 6, K.candle); layer.rect(x + 1, y - 6, 1, 6, K.candleShade); layer.set(x, y - 7, K.wick); });
}

function paintArmchair(grid: PixelGrid) {
  ob(grid, 0, 9, 90, 118, 0, 30, K.armchair, K.armchairEdge);
  ob(grid, 7, 30, 90, 97, 0, 18, K.armchair, K.armchairEdge);
  ob(grid, 8, 30, 96, 112, 0, 10, K.armchair);
  ob(grid, 9, 30, 97, 111, 10, 4, K.seat, K.seatEdge);
  fillTop(grid, 0, 9, 99, 112, 30, (u, v) => tartan(u, v, 1));
  fillRightFace(grid, 9, 99, 112, 13, 30, (a, z) => tartan(a, z, 0.82));
  fillTop(grid, 9, 24, 99, 111, 14, (u, v) => tartan(u, v, 1));
  fillRightFace(grid, 30, 99, 108, 4, 14, (a, z) => (z === 4 ? (a % 2 ? K.tartan.light : null) : tartan(a, z, 0.8)));
  ob(grid, 7, 30, 111, 118, 0, 18, K.armchair, K.armchairEdge);
}

/** Its screen and the webcam on it. */
function paintComputer(grid: PixelGrid) {
  monitor(grid, 38, 72, 11, 17, 18, K.monitor, K.stand);
  webcam(grid, 55, 11, 39);
}

function paintDesk(grid: PixelGrid) {
  // the chest under the window, skis in the corner
  ob(grid, 88, 116, 3, 17, 0, 13, K.wood, K.woodEdge);
  onLeftFace(grid, 17, 88, 116, 10, K.chest.band); patchOnLeftFace(grid, 17, 93, 95, 0, 13, K.chest.iron); patchOnLeftFace(grid, 17, 109, 111, 0, 13, K.chest.iron);
  patchOnLeftFace(grid, 17, 101, 103, 6, 9, K.chest.lock);
  ob(grid, 92, 104, 6, 14, 13, 3, K.blanket);
  fillTop(grid, 92, 104, 6, 14, 16, (u, v) => tartan(u, v, 1));
  ob(grid, 119, 122, 1, 3, 0, 52, K.skis[0]); ob(grid, 123, 126, 1, 3, 0, 49, K.skis[1]);
  patchOnLeftFace(grid, 3, 119, 122, 40, 42, K.skiBand); patchOnLeftFace(grid, 3, 123, 126, 37, 39, K.skiBand);
  // the desk, its banker's lamp and a hot chocolate
  desk(grid, 34, 84, 2, 22, 17, K.wood, K.darkWood, 3);
  paintComputer(grid);
  ob(grid, 45, 61, 14, 19, 17, 1, K.keyboard);
  fillTop(grid, 46, 60, 15, 18, 18, (u, v) => (u % 2 === 0 && v % 2 === 1 ? K.keys : null));
  const L = K.lamp, { x, y } = iso(77, 8, 17);
  art(grid, (layer) => { layer.ellipse(x, y - 1, 4, 1.8, L.brass); layer.rect(x, y - 10, 1, 9, L.brass); layer.set(x, y - 2, L.brassLight); });
  art(grid, (layer) => {
    layer.pattern(x - 6, y - 16, ['..gggggggg..', '.gGGGGGGGGg.', 'gGGGGGGGGGGg', 'gggggggggggg', '.yyyyyyyyyy.'], { g: L.shade, G: L.shadeLight, y: G.lampGlow });
    layer.rect(x - 4, y - 15, 3, 1, L.shine);
  });
  const M = K.cocoa;
  art(grid, (layer) => {
    layer.rect(MUG.x - 2, MUG.y - 6, 5, 6, M.mug); layer.rect(MUG.x + 2, MUG.y - 6, 1, 6, M.shade); layer.rect(MUG.x - 2, MUG.y - 6, 5, 1, M.cocoa);
    layer.points([[MUG.x - 1, MUG.y - 7], [MUG.x + 1, MUG.y - 7]], M.marshmallow);
    layer.points([[MUG.x + 3, MUG.y - 5], [MUG.x + 4, MUG.y - 5], [MUG.x + 4, MUG.y - 4], [MUG.x + 4, MUG.y - 3], [MUG.x + 3, MUG.y - 2]], M.mug);
    layer.set(MUG.x, MUG.y - 3, M.glint);
  });
  chairSeat(grid, SEAT, K.chair, K.darkWood);
}

export const chalet: HomeDesign = {
  seat: SEAT,
  screens: [SCREEN],
  lighting: {
    ambient: [0.5, 0.48, 0.64],
    lamps: [
      lamp(22, 63, 14, [1.05, 0.58, 0.22], 122, 0.62, 5), lamp(77, 9, 28, [0.75, 0.6, 0.32], 42),
      lamp(55, 11, 30, [0.16, 0.24, 0.44], 36), lamp(103, 0, 50, [0.12, 0.16, 0.3], 38),
    ],
  },
  outside: { mood: 'night', sky: G.night, body: [G.moon, G.moonShade], stars: [G.star], shade: [G.pine, G.pineLight, G.snow, G.snowShade] },
  // the cuckoo clock, its own drawing
  clock: { wall: 'right', a: 20, z: 52, radius: 3, shape: paintCuckoo },
  metrics: { wall: 'left', a: 92, z: 44 },
  festiveSpot: { u: 110, v: 50 },
  glow: [...coloursOf(G), H.screen, H.webcam.on],
  masks: {
    screen: [H.screen], fire: [K.fireBack],
    glass: [...G.night, G.pine, G.pineLight, G.snow, G.snowShade, G.moon, G.moonShade, G.star],
  },
  petBed: PET,
  furniture: [
    { u0: 83, u1: 123, v0: 0, v1: 6, height: 30 }, { u0: 2, u1: 14, v0: 27, v1: 39, height: 8 }, { u0: 0, u1: 28, v0: 42, v1: 84, height: 48 },
    { u0: 0, u1: 9, v0: 90, v1: 118, height: 30 }, { u0: 7, u1: 30, v0: 90, v1: 97, height: 18 }, { u0: 8, u1: 30, v0: 96, v1: 112, height: 14 }, { u0: 7, u1: 30, v0: 111, v1: 118, height: 18 },
    { u0: 88, u1: 116, v0: 3, v1: 17, height: 16 }, { u0: 119, u1: 126, v0: 1, v1: 3, height: 52 }, { u0: 34, u1: 84, v0: 2, v1: 22, height: 40 },
  ],
  // the armchair by the fire
  spots: [{ u: 25, v: 104, direction: 'down-right', lift: 14 }],
  computer: paintComputer,
  back(grid) {
    paintPlanks(grid, { tones: K.planks, seam: K.plankSeam, joint: K.plankJoint, width: 6, length: 64 });
    shadeAlongWalls(grid);
    const U = K.rug;
    grid.ellipse(RUG.x, RUG.y + 1, 27, 13.5, U.edge);
    U.rings.forEach((colour, index) => { grid.ellipse(RUG.x, RUG.y, 27 - index * 4.2, 13.5 - index * 2.1, colour); });
    for (let index = 0; index < 40; index++) { const angle = index / 40 * Math.PI * 2; grid.set(Math.round(RUG.x + Math.cos(angle) * 25), Math.round(RUG.y + Math.sin(angle) * 12.4), U.dots); }
    paintLogWalls(grid);
    paintWallThings(grid);
    paintFireplace(grid);
    paintArmchair(grid);
    paintDesk(grid);
  },
  front(grid) {
    // a wooden chair's back: three spindles and a rail
    for (const du of [1, 5, 9]) ob(grid, SEAT.u + du, SEAT.u + du + 2, SEAT.v + 5, SEAT.v + 7, 11, 5, K.wood);
    ob(grid, SEAT.u, SEAT.u + 12, SEAT.v + 5, SEAT.v + 8, 16, 3, K.wood, K.woodEdge);
  },
  animate(context, frame, { masks, faces }) {
    paintScreen(masked(context, masks.screen), SCREEN, frame, { ua: 62, columns: 1, rows: 2 }, faces);
    // the fire: flames along the firebox, higher in the middle, flickering, a spark now and then
    const fire = masked(context, masks.fire), phase = frame >> 1;
    for (let a = 53; a < 73; a++) {
      const profile = 1 - ((a + 0.5 - 63) / 10.5) ** 2;
      if (profile <= 0) continue;
      const height = Math.round(3 + profile * 13 * (0.65 + 0.35 * hash(a, phase)) + Math.sin(frame * 0.7 + a) * 1.2);
      for (let z = 6; z < 6 + height; z++) {
        const up = (z - 6) / height;
        onRightFace(fire, 18, a, a + 1, z, K.flames[up < 0.35 ? 0 : up < 0.62 ? 1 : up < 0.86 ? 2 : 3]);
      }
      if (hash(a, phase + 99) > 0.93) onRightFace(fire, 18, a, a + 1, 8 + height + (frame % 4), K.spark);
    }
    for (const v of CANDLES) {
      const { x, y } = iso(18, v, 48), high = (frame + v) % 6 < 3;
      context.fillStyle = G.candle[1]; context.fillRect(x, y - 9 - (high ? 1 : 0), 1, 2 + (high ? 1 : 0));
      context.fillStyle = G.candle[0]; context.fillRect(x, y - 8, 1, 1);
    }
    const glass = masked(context, masks.glass);
    for (let index = 0; index < 16; index++) {
      const z = 73 - ((frame * 0.5 + index * 9.7) % 42), a = 87 + ((index * 7.3 + Math.sin((frame + index * 13) * 0.08) * 2 + 40) % 32);
      wallPixel(glass, 'right', Math.floor(a), Math.floor(z), K.snowflakes[index % 3 ? 0 : 1]);
    }
    const swing = [0, 1, 2, 2, 1, 0, -1, -2, -2, -1][frame % 10], anywhere = masked(context, null);
    for (let z = 37; z < 46; z++) wallPixel(anywhere, 'right', 20 + Math.round(swing * (46 - z) / 9), z, K.cuckoo.chain);
    wallPatch(anywhere, 'right', 19 + swing, 22 + swing, 35, 38, K.cuckoo.bob);
  },
  animateFront(context, frame) { steam(context, MUG.x, MUG.y - 9, frame); },
};
