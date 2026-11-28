// The Japanese flat (Preferences.homeTheme 'japonais'), in spring: tatami mats, a kotatsu with a laptop, mikan and tea,
// a zabuton to sit on, a tokonoma with its scroll and bonsai, fusuma doors, a paper andon, a lantern hanging from the
// ceiling, the shoji slid open on Mount Fuji and a cherry tree, its petals falling past the window and into the room.
import { COZY_HOME_PALETTE as H } from '../../../design/room-palette.ts';
import { shadeAlongWalls } from '../decor.ts';
import { ROOM_UNITS as ROOM, WALL_HEIGHT, iso } from '../geometry.ts';
import { box, fillLeftFace, fillRightFace, fillTop, fillWall, patchOnLeftFace, tint, wallEllipse, wallPatch, wallPixel, wallPoint, type PixelGrid } from '../pixels.ts';
import { paintPet } from '../pet.ts';
import { art, ceilingAt, coloursOf, lamp, masked, ob, paintScreen, steam, walls, type HomeDesign, type Screen } from './kit.ts';

const J = H.japonais, G = J.glow;
const SEAT = { u: 60, v: 69, z: 4 } as const;
/** The laptop's screen on the kotatsu. */
const SCREEN: Screen = { v: 50, ua: 53, ub: 75, za: 15, zb: 31 };
const CUP = iso(82, 54, 13);
/** The pet's own zabuton, by the kotatsu's warm side, and the pet asleep on it. */
const CUSHION = { u: 93, v: 66 } as const;
const PET = iso(CUSHION.u + 6, CUSHION.v + 6, 4);
const LANTERN = iso(104, 64, 74);
/** The tatami mats: from u0 to u1 and v0 to v1, laid along u or along v. */
const MATS = [[0, 64, 0, 32, 'u'], [64, 128, 0, 32, 'u'], [0, 32, 32, 96, 'v'], [32, 96, 32, 64, 'u'], [32, 96, 64, 96, 'u'], [96, 128, 32, 96, 'v'], [0, 64, 96, 128, 'u'], [64, 128, 96, 128, 'u']] as const;
/** The window's panes, where the tree's blossoms are cut. */
const PANES = [28, 58, 20, 64] as const;

function paintTatami(grid: PixelGrid) {
  const T = J.tatami;
  fillTop(grid, 0, ROOM, 0, ROOM, 0, (u, v) => {
    const mat = MATS.find(([u0, u1, v0, v1]) => u >= u0 && u < u1 && v >= v0 && v < v1);
    if (!mat) return null;
    const [u0, u1, v0, v1, along] = mat;
    const length = along === 'u' ? u1 - u0 : v1 - v0, at = along === 'u' ? u - u0 : v - v0, across = along === 'u' ? v - v0 : u - u0;
    if (at === 0 || at === length - 1) return T.border;
    if (across < 2 || across >= 30) return at % 6 === 2 ? T.edgeDot : T.edge;
    if (at % 12 === 6 && across & 1) return T.weave;
    return (across >> 1) & 1 ? T.light : T.base;
  });
  shadeAlongWalls(grid);
}

function paintWalls(grid: PixelGrid) {
  const W = J.wall, D = J.wood;
  walls(grid, W.left, W.right, W.cap);
  for (const wall of ['left', 'right'] as const) {
    wallPatch(grid, wall, 0, ROOM, 0, 3, D[2]); wallPatch(grid, wall, 0, ROOM, 2, 3, D[1]);
    wallPatch(grid, wall, 0, ROOM, 70, 75, D[1]); wallPatch(grid, wall, 0, ROOM, 74, 75, D[0]); wallPatch(grid, wall, 0, ROOM, 70, 71, D[2]);
    wallPatch(grid, wall, 0, 3, 0, WALL_HEIGHT, D[1]); wallPatch(grid, wall, 124, 128, 0, WALL_HEIGHT, D[1]); wallPatch(grid, wall, 124, 125, 0, WALL_HEIGHT, D[0]);
  }
  // the tokonoma: a hanging scroll over a bonsai
  const S = J.scroll;
  wallPatch(grid, 'right', 6, 44, 6, 70, J.alcove); wallPatch(grid, 'right', 44, 47, 0, 70, D[1]); wallPatch(grid, 'right', 46, 47, 0, 70, D[0]);
  wallPatch(grid, 'right', 25, 26, 66, 70, S.rod);
  wallPatch(grid, 'right', 19, 32, 22, 66, S.mount); wallPatch(grid, 'right', 21, 30, 26, 62, S.paper);
  wallPatch(grid, 'right', 18, 33, 64, 66, S.rod); wallPatch(grid, 'right', 18, 33, 21, 23, S.rod);
  wallEllipse(grid, 'right', 25.5, 53, 2.6, 2.6, S.sun);
  fillWall(grid, 'right', 21, 30, 30, 46, (a, z) => {
    const near = 36 + 8 - Math.abs(a - 24) * 1.5, far = 34 + 5 - Math.abs(a - 28) * 1.2;
    return Math.abs(z - near) < 0.8 ? S.ink : Math.abs(z - far) < 0.8 ? S.inkLight : null;
  });
  ob(grid, 6, 44, 0, 12, 0, 6, J.dais, J.daisEdge);
  const B = J.bonsai, { x, y } = iso(26, 6, 6);
  art(grid, (layer) => {
    layer.rect(x - 7, y - 4, 14, 4, B.pot); layer.rect(x - 7, y - 4, 14, 1, B.potLight); layer.rect(x + 4, y - 3, 3, 3, B.potShade);
    layer.rect(x - 6, y, 2, 1, B.feet); layer.rect(x + 4, y, 2, 1, B.feet);
  });
  art(grid, (layer) => {
    layer.line(x - 1, y - 5, x - 3, y - 10, B.trunk); layer.line(x, y - 5, x - 2, y - 10, B.trunk); layer.line(x - 3, y - 10, x + 2, y - 15, B.trunk);
    layer.line(x - 2, y - 10, x + 3, y - 15, B.trunkShade); layer.line(x + 2, y - 15, x - 2, y - 19, B.trunk);
    for (const [dx, dy, rx, ry] of [[-6, -12, 5, 2.4], [6, -16, 5.5, 2.6], [-2, -21, 5, 2.4]]) {
      layer.ellipse(x + dx, y + dy, rx, ry, B.leaves[2]); layer.ellipse(x + dx - 0.6, y + dy - 0.6, rx - 1, ry - 0.9, B.leaves[1], [B.leaves[2]]);
      layer.ellipse(x + dx - 1.5, y + dy - 1.2, rx * 0.45, ry * 0.35, B.leaves[0], [B.leaves[1]]);
    }
  });
  // the fusuma, sliding doors painted with waves and gold clouds
  const F = J.fusuma;
  fillWall(grid, 'right', 54, 124, 0, 70, (a, z) => {
    const door = a < 77 ? 0 : a < 100 ? 1 : 2, a0 = [54, 77, 100][door], a1 = [77, 100, 124][door];
    if (a - a0 < 1 || a1 - a <= 1 || z < 2 || z > 67) return F.frame;
    if (z < 26) { const wave = Math.round(6 + 2 * Math.sin((a - 54) * 0.45 + Math.floor(z / 6) * 1.7)); if (z % 6 === wave % 6) return F.waves; }
    if (Math.hypot((a - (a0 + 11)) / 7, (z - 50) / 2.2) < 1 && door !== 1) return F.gold;
    if (Math.hypot((a - 88) / 8, (z - 44) / 2) < 1) return F.gold;
    return F.paper;
  });
  for (const a of [75, 79, 98, 102]) wallEllipse(grid, 'right', a + 0.5, 32, 1.2, 1.6, F.pull);
}

function paintWindow(grid: PixelGrid) {
  // the shoji, slid open on Mount Fuji and a cherry tree
  wallPatch(grid, 'left', 26, 92, 18, 66, J.shoji);
  fillWall(grid, 'left', 28, 58, 20, 64, (_, z) => G.sky[Math.min(3, Math.floor((64 - z) / 11))]);
  fillWall(grid, 'left', 28, 58, 20, 40, (a, z) => (Math.abs(a - 40) <= (40 - z) * 1.15 ? (z > 35 ? G.fujiSnow : G.fuji) : null));
  wallPatch(grid, 'left', 28, 58, 20, 24, G.hills);
  for (let index = 0; index <= 30; index++) {
    const a = Math.round(57 - index * 0.9), z = Math.round(22 + index * 1.2);
    wallPixel(grid, 'left', a, z, G.branch); wallPixel(grid, 'left', a + 1, z, G.branch);
  }
  for (let index = 0; index <= 14; index++) wallPixel(grid, 'left', Math.round(46 - index * 0.6), Math.round(37 + index * 1.1), G.branch);
  const P = G.blossom;
  for (const [ca, cz, r] of [[52, 34, 4], [44, 48, 5], [36, 56, 5], [30, 50, 3.5], [48, 58, 4], [40, 40, 3.5], [33, 62, 3]]) {
    wallEllipse(grid, 'left', ca, cz, r, r * 0.85, P[3], PANES); wallEllipse(grid, 'left', ca + 0.6, cz + 0.6, r - 1, r * 0.85 - 1, P[2], PANES);
    wallEllipse(grid, 'left', ca + 1, cz + 1.4, r * 0.5, r * 0.4, P[1], PANES);
    wallPixel(grid, 'left', Math.round(ca), Math.round(cz + r * 0.5), P[0]);
  }
  fillWall(grid, 'left', 58, 90, 20, 64, (a, z) => ((a - 58) % 8 === 7 || (z - 20) % 9 === 8 || a === 58 ? J.kumiko : G.paper));
  wallPatch(grid, 'left', 57, 59, 20, 64, J.shoji);
  art(grid, (layer) => box(layer, 0, 4, 25, 93, 15, 3, J.wood, J.woodEdge));
}

/** The laptop on the kotatsu: its lid and screen, its base (its keys are drawn on it after). */
function paintLaptop(grid: PixelGrid) {
  ob(grid, 52, 76, 48, 50, 14, 18, J.silver, J.silverEdge);
  patchOnLeftFace(grid, SCREEN.v, SCREEN.ua, SCREEN.ub, SCREEN.za, SCREEN.zb, H.screen);
  ob(grid, 52, 76, 50, 58, 13, 1, J.silver, J.silverEdge);
}

export const japonais: HomeDesign = {
  seat: SEAT,
  screens: [SCREEN],
  lighting: {
    ambient: [1, 0.985, 0.965],
    lamps: [lamp(22, 58, 0, [0.16, 0.1, 0.1], 64), lamp(9, 105, 14, [0.34, 0.24, 0.1], 36), lamp(104, 64, 30, [0.2, 0.14, 0.06], 34)],
  },
  outside: { mood: 'day', sky: G.sky, shade: [G.fuji, G.fujiSnow, G.hills, G.branch, ...G.blossom] },
  clock: { wall: 'right', a: 100, z: 87, radius: 6 },
  festiveSpot: { u: 112, v: 40 },
  glow: [...coloursOf(G), H.screen, H.webcam.on],
  masks: { screen: [H.screen], outside: [...G.sky, G.fuji, G.fujiSnow, G.branch, ...G.blossom] },
  petSpot: PET,
  computer: paintLaptop,
  back(grid, pet) {
    paintTatami(grid);
    paintWalls(grid);
    paintWindow(grid);
    // the andon, a paper floor lamp
    const D = J.wood;
    ob(grid, 3, 15, 99, 111, 0, 3, D);
    art(grid, (layer) => box(layer, 4, 14, 100, 110, 3, 24, G.andon));
    fillRightFace(grid, 14, 100, 110, 3, 27, (a, z) => (a === 100 || a === 109 || z === 14 || z === 26 ? D[1] : null));
    fillLeftFace(grid, 110, 4, 14, 3, 27, (a, z) => (a === 4 || a === 13 || z === 14 || z === 26 ? D[2] : null));
    ob(grid, 3, 15, 99, 111, 27, 1, D);
    // the kotatsu: an indigo futon under its board, a laptop, mikan and tea
    const U = J.futon;
    ob(grid, 37, 89, 31, 65, 0, 11, U, J.futonEdge);
    const dots = (a: number, z: number, shade: number) => ((a + (z >> 1) * 3) % 6 === 0 && z % 4 === 1 ? tint(J.futonDots, shade) : z === 0 ? tint(U[2], 0.9) : null);
    fillLeftFace(grid, 65, 37, 89, 0, 11, (a, z) => dots(a, z, 0.95)); fillRightFace(grid, 89, 31, 65, 0, 11, (a, z) => dots(a, z, 0.82));
    ob(grid, 39, 87, 33, 63, 11, 2, J.board, J.boardEdge);
    paintLaptop(grid);
    fillTop(grid, 54, 74, 51, 55, 14, (u, v) => (u % 2 === 0 && v % 2 === 0 ? J.laptopKeys : null));
    fillTop(grid, 60, 68, 55, 57, 14, () => J.laptopPad);
    const M = J.mikan;
    art(grid, (layer) => {
      const { x, y } = iso(44, 56, 13);
      layer.ellipse(x, y - 1, 5, 2.4, M.plate); layer.rect(x - 5, y - 2, 10, 2, M.plate); layer.rect(x - 4, y - 1, 8, 1, M.band);
      for (const [dx, dy] of [[-2, -3], [2, -3], [0, -5]]) { layer.ellipse(x + dx, y + dy, 2.2, 2, M.fruit); layer.set(x + dx - 1, y + dy - 1, M.light); layer.set(x + dx, y + dy - 2, M.leaf); }
    });
    const T = J.teapot;
    art(grid, (layer) => {
      const { x, y } = iso(80, 40, 13);
      layer.ellipse(x, y - 4, 4.5, 3.8, T.body); layer.ellipse(x - 1.4, y - 5, 2, 1.4, T.light, [T.body]); layer.rect(x - 1, y - 9, 2, 1, T.body);
      layer.line(x - 4, y - 7, x + 4, y - 7, T.lid); layer.points([[x + 5, y - 5], [x + 6, y - 6]], T.body);
    });
    const Q = J.cup;
    art(grid, (layer) => { layer.rect(CUP.x - 2, CUP.y - 4, 4, 4, Q.body); layer.rect(CUP.x + 1, CUP.y - 4, 1, 4, Q.shade); layer.rect(CUP.x - 2, CUP.y - 4, 4, 1, Q.tea); });
    // the zabuton the user sits on, and the pet's
    for (const [u0, v0] of [[54, 63], [CUSHION.u, CUSHION.v]]) {
      ob(grid, u0, u0 + 12, v0, v0 + 12, 0, 4, J.zabuton, J.zabutonEdge);
      for (const [u, v] of [[u0, v0], [u0 + 12, v0], [u0, v0 + 12], [u0 + 12, v0 + 12]]) { const { x, y } = iso(u, v, 4); grid.set(x, y, J.tassel); grid.set(x, y + 1, J.tasselShade); }
    }
    if (pet) paintPet(grid, pet, PET.x, PET.y);
  },
  front(grid) {
    // the paper lantern hanging from the ceiling
    const { x, y } = LANTERN, top = ceilingAt(x), L = G.lantern;
    grid.rect(x, top, 1, y - 8 - top, J.lanternCord);
    art(grid, (layer) => {
      layer.ellipse(x + 0.5, y, 6.5, 7, L[1]); layer.ellipse(x - 0.6, y - 0.8, 5, 5.6, L[0], [L[1]]);
      for (const dy of [-4, -1, 2, 5]) for (let dx = -6; dx <= 6; dx++) if (layer.get(x + dx, y + dy)) layer.set(x + dx, y + dy, L[2]);
      layer.rect(x - 3, y - 8, 7, 2, J.lanternCaps); layer.rect(x - 3, y + 7, 7, 2, J.lanternCaps);
      layer.points([[x - 1, y - 2], [x, y - 2], [x + 1, y - 2], [x, y - 1], [x, y], [x - 1, y + 1], [x + 1, y + 1]], J.lanternMark);
    });
  },
  animate(context, frame, { masks, faces }) {
    paintScreen(masked(context, masks.screen), SCREEN, frame, { ua: 66, columns: 1, rows: 2 }, faces);
    // petals falling past the window
    const outside = masked(context, masks.outside), P = G.blossom;
    for (let index = 0; index < 7; index++) {
      const age = (frame * 0.4 + index * 17) % 46, a = 30 + ((index * 9.1 + Math.sin((frame + index * 11) * 0.09) * 2) % 27), z = 64 - age;
      wallPixel(outside, 'left', Math.floor(a), Math.floor(z), P[index % 2 ? 2 : 1]);
    }
  },
  animateFront(context, frame) {
    // and a few drifting into the room
    const P = G.blossom;
    for (let index = 0; index < 4; index++) {
      const age = (frame + index * 45) % 180;
      if (age > 150) continue;
      const [x0, y0] = wallPoint('left', 40 + index * 4, 44 - index * 3);
      const x = Math.round(x0 + age * 0.55 + Math.sin(age * 0.12 + index) * 3), y = Math.round(y0 + age * 0.42);
      context.fillStyle = P[index % 2 ? 1 : 2]; context.fillRect(x, y, 2, 1); context.fillStyle = P[0]; context.fillRect(x, y, 1, 1);
    }
    steam(context, CUP.x, CUP.y - 6, frame);
  },
};
