// The loft (Preferences.homeTheme 'loft'), a late afternoon: a brick wall and a concrete one, a big steel-framed window
// on the city, an oak and black steel desk, a record shelf and its turntable spinning, a leather couch on a kilim,
// bulbs hanging from the ceiling, dust floating in the sun.
import { COZY_HOME_PALETTE as H } from '../../../design/room-palette.ts';
import { paintPlanks, shadeAlongWalls } from '../decor.ts';
import { ROOM_UNITS as ROOM, WALL_HEIGHT, around, iso } from '../geometry.ts';
import { paintPet } from '../pet.ts';
import { box, fillLeftFace, fillRightFace, fillTop, fillWall, patchOnRightFace, tint, wallPatch, wallPixel, type PixelGrid } from '../pixels.ts';
import {
  art, ceilingAt, chairBack, chairSeat, coloursOf, desk, hash, lamp, masked, monitor, monstera, ob, paintScreen, screenOf, steam, walls, webcam, type HomeDesign,
} from './kit.ts';

const L = H.loft, G = L.glow;
const SEAT = { u: 92, v: 28, z: 11 } as const;
const SCREEN = screenOf(74, 110, 11, 17, 20);
const DISC = iso(7.5, 38, 31);
const MUG = iso(70, 15, 22);
/** The pet asleep on the kilim, at the couch's end, in front of the coffee table. */
const PET = iso(31, 113);
/** The bulbs hanging from the ceiling: (u, v) and how high. */
const HANGING = [[32, 98, 58], [44, 92, 50], [56, 88, 58]] as const;

/** Its screen and the webcam on it. */
function paintComputer(grid: PixelGrid) {
  monitor(grid, 74, 110, 11, 17, 20, L.black, L.black);
  webcam(grid, 92, 11, 41);
}

export const loft: HomeDesign = {
  seat: SEAT,
  screens: [SCREEN],
  lighting: {
    ambient: [0.97, 0.95, 0.93],
    lamps: [
      lamp(36, 30, 0, [0.3, 0.24, 0.1], 72, 0.5), lamp(30, 0, 40, [0.14, 0.12, 0.06], 50),
      lamp(112, 12, 30, [0.32, 0.26, 0.12], 30), ...HANGING.map(([u, v, z]) => lamp(u, v, z - 6, [0.2, 0.15, 0.06], 30)),
    ],
  },
  outside: { mood: 'day', sky: G.sky, shade: [G.far, G.near, G.tower] },
  clock: { wall: 'right', a: 96, z: 62, radius: 7 },
  metrics: { wall: 'right', a: 106, z: 46 },
  festiveSpot: { u: 122, v: 60 },
  glow: [...coloursOf(G), H.screen, H.webcam.on],
  masks: { screen: [H.screen] },
  petSpot: PET,
  furniture: [
    around(12, 13, 6, 40), { u0: 5, u1: 67, v0: 0, v1: 5, height: 8 }, { u0: 0, u1: 15, v0: 17, v1: 61, height: 40 }, { u0: 68, u1: 120, v0: 2, v1: 22, height: 40 },
    { u0: 0, u1: 8, v0: 74, v1: 122, height: 26 }, { u0: 4, u1: 20, v0: 74, v1: 81, height: 16 }, { u0: 7, u1: 20, v0: 80, v1: 116, height: 13 }, { u0: 4, u1: 20, v0: 115, v1: 122, height: 16 },
    { u0: 30, u1: 54, v0: 86, v1: 106, height: 14 },
  ],
  // the sofa's two cushions
  spots: [{ u: 14, v: 90, direction: 'down-right', lift: 13 }, { u: 14, v: 107, direction: 'down-right', lift: 13 }],
  computer: paintComputer,
  back(grid, pet) {
    paintPlanks(grid, { tones: L.planks, seam: L.plankSeam, joint: L.plankJoint, width: 5, length: 60, alongV: true });
    shadeAlongWalls(grid);
    // the kilim
    const K = L.kilim;
    fillTop(grid, 24, 62, 72, 120, 0, (u, v) => {
      const edge = Math.min(u - 24, 61 - u, v - 72, 119 - v);
      if (edge < 1) return K.edge;
      if (edge < 3) return K.border;
      if (edge < 4) return K.cream;
      return K.motif[Math.floor((Math.abs(u - 43) + Math.abs(v - 96) * 0.7) / 3) % 6];
    });
    fillTop(grid, 24, 62, 70, 72, 0, (u) => (u % 2 ? K.fringe : null)); fillTop(grid, 24, 62, 120, 122, 0, (u) => (u % 2 ? K.fringe : null));
    const W = L.wall;
    walls(grid, W.left, W.right, W.cap);
    fillWall(grid, 'left', 0, ROOM, 0, WALL_HEIGHT, (a, z) => {
      const row = Math.floor(z / 5), offset = (row & 1) * 6, brick = Math.floor((a + offset) / 12);
      if (z % 5 === 4 || (a + offset) % 12 === 11) return L.mortar;
      const colour = L.bricks[Math.floor(hash(row, brick) * 4)];
      return z % 5 === 3 ? tint(colour, 1.07) : z % 5 === 0 ? tint(colour, 0.92) : colour;
    });
    fillWall(grid, 'right', 0, ROOM, 0, WALL_HEIGHT, (a, z) => {
      if (a % 32 === 0 || z === 44) return W.seam;
      if ((a % 32 === 8 || a % 32 === 24) && (z === 22 || z === 66)) return W.hole;
      return hash(a >> 1, z >> 1) > 0.92 ? W.speck : null;
    });
    wallPatch(grid, 'right', 0, ROOM, 0, 3, W.skirting); wallPatch(grid, 'right', 0, ROOM, 2, 3, W.skirtingTop);
    // the steel-framed window and the city beyond
    wallPatch(grid, 'right', 6, 66, 8, 86, L.window.frame);
    fillWall(grid, 'right', 8, 64, 10, 84, (a, z) => G.sky[Math.min(5, Math.floor(((84 - z) + ((a + z) & 1) * 0.8) / (74 / 6)))]);
    for (const [a0, a1, top] of [[8, 14, 30], [14, 22, 38], [22, 30, 27], [30, 40, 45], [40, 46, 33], [46, 56, 41], [56, 64, 29]]) wallPatch(grid, 'right', a0, a1, 10, top, G.far);
    wallPatch(grid, 'right', 31, 37, 46, 50, G.far); wallPatch(grid, 'right', 33, 35, 50, 54, G.far);
    for (const [a0, a1, top] of [[8, 18, 20], [18, 26, 25], [26, 38, 18], [38, 48, 26], [48, 58, 16], [58, 64, 23]]) {
      wallPatch(grid, 'right', a0, a1, 10, top, G.near);
      for (let a = a0 + 1; a < a1 - 1; a += 3) for (let z = 12; z < top - 2; z += 4) if (hash(a, z + 3) > 0.45) wallPatch(grid, 'right', a, a + 2, z, z + 2, G.nearWindow);
    }
    wallPatch(grid, 'right', 28, 35, 22, 28, G.tower); wallPatch(grid, 'right', 29, 34, 28, 29, G.tower); wallPatch(grid, 'right', 30, 33, 29, 30, G.tower);
    wallPatch(grid, 'right', 28, 29, 18, 22, G.tower); wallPatch(grid, 'right', 34, 35, 18, 22, G.tower);
    for (const a of [21, 35, 49]) wallPatch(grid, 'right', a, a + 2, 10, 84, L.window.frame);
    for (const z of [22, 34, 46, 58, 70]) wallPatch(grid, 'right', 8, 64, z, z + 2, L.window.frame);
    for (const [a, z] of [[10, 80], [11, 79], [12, 78], [24, 68], [25, 67], [39, 44], [40, 43], [41, 42], [53, 81], [54, 80]]) wallPixel(grid, 'right', a, z, G.glint);
    art(grid, (layer) => box(layer, 5, 67, 0, 5, 5, 3, L.window.sill, L.window.sillEdge));
    // album covers on the bricks
    const V = L.covers;
    const covers = [
      [20, V.sun, (a: number, z: number, colour: string) => (Math.hypot(a - 26, z - 50) < 4 ? (Math.hypot(a - 26, z - 50) < 1.5 ? V.disc : V.frame) : colour)],
      [36, V.stripes, (a: number, z: number, colour: string) => ((z + a) % 4 < 2 ? V.disc : colour)],
      [52, V.peak, (a: number, z: number, colour: string) => (Math.abs(a - 58) < (z - 45) * 0.6 && z < 55 ? V.snow : colour)],
    ] as const;
    for (const [a0, colour, motif] of covers) { wallPatch(grid, 'left', a0, a0 + 12, 44, 56, V.frame); fillWall(grid, 'left', a0 + 1, a0 + 11, 45, 55, (a, z) => motif(a, z, colour)); }
    monstera(grid, 12, 13, L.pot);
    // the record shelf, the turntable and a speaker
    ob(grid, 0, 14, 18, 60, 0, 26, L.black, L.blackEdge);
    for (const [va, vb] of [[20, 32], [34, 46], [48, 58]]) for (const [z0, z1] of [[2, 12], [14, 24]]) {
      patchOnRightFace(grid, 14, va, vb, z0, z1, L.shelfInside);
      for (let v = va; v < vb; v++) {
        if (hash(v, z0) < 0.16) continue;
        patchOnRightFace(grid, 14, v, v + 1, z0, z1 - 1 - Math.floor(hash(v, z0 + 7) * 2), L.spines[Math.floor(hash(v * 3, z0) * L.spines.length)]);
      }
    }
    ob(grid, 0, 15, 17, 61, 26, 2, L.oak, L.oakEdge);
    ob(grid, 2, 11, 19, 27, 28, 10, L.black, L.blackEdge);
    const P = L.speaker;
    fillRightFace(grid, 11, 19, 27, 28, 38, (a, z) => {
      const cone = Math.hypot(a + 0.5 - 23, z + 0.5 - 32), tweeter = Math.hypot(a + 0.5 - 23, z + 0.5 - 36);
      return cone < 1.2 ? P.cone : cone < 2.6 ? P.ring : tweeter < 1 ? P.tweeter : null;
    });
    ob(grid, 2, 13, 30, 46, 28, 3, L.turntable, L.turntableEdge);
    const R = L.record;
    art(grid, (layer) => {
      const { x, y } = DISC;
      layer.ellipse(x, y, 6.5, 3.4, R.vinyl); layer.ellipse(x, y, 4.6, 2.4, R.groove, [R.vinyl]); layer.ellipse(x, y, 3.6, 1.8, R.vinyl, [R.groove]);
      layer.ellipse(x, y, 1.8, 1, R.label); layer.set(x, y, R.spindle);
    });
    art(grid, (layer) => { const { x, y } = iso(3, 44, 31); layer.rect(x - 1, y - 2, 2, 2, R.arm); layer.line(x, y - 2, x + 6, y - 3, R.armLight); }, R.armOutline);
    const Z = L.sleeves;
    ob(grid, 3, 13, 50, 51, 28, 11, Z.orange);
    fillLeftFace(grid, 51, 3, 13, 28, 39, (a, z) => (Math.hypot(a + 0.5 - 8, z + 0.5 - 33.5) < 3 ? Z.hole : null));
    ob(grid, 3, 13, 54, 55, 28, 10, Z.teal);
    fillLeftFace(grid, 55, 3, 13, 28, 38, (_, z) => (z === 31 || z === 34 ? Z.lines : null));
    // the leather couch and its pillows
    ob(grid, 0, 8, 74, 122, 0, 26, L.couch, L.couchEdge);
    fillRightFace(grid, 8, 76, 120, 12, 26, (a, z) => (a % 8 === 3 && (z === 16 || z === 22) ? L.tufts : null));
    ob(grid, 4, 20, 74, 81, 0, 16, L.couch, L.couchEdge);
    ob(grid, 7, 20, 80, 116, 0, 9, L.couch);
    ob(grid, 8, 20, 81, 98, 9, 4, L.cushion, L.cushionEdge); ob(grid, 8, 20, 99, 115, 9, 4, L.cushion, L.cushionEdge);
    for (const [u, v, tones] of [[11, 89, L.pillows[0]], [11, 108, L.pillows[1]]] as const) {
      art(grid, (layer) => { const { x, y } = iso(u, v, 13); layer.ellipse(x, y - 4, 5.5, 4, tones[1]); layer.ellipse(x - 1, y - 5, 4, 2.6, tones[0], [tones[1]]); });
    }
    ob(grid, 4, 20, 115, 122, 0, 16, L.couch, L.couchEdge);
    // the coffee table on the kilim
    desk(grid, 30, 54, 86, 106, 10, L.oak, L.black);
    const B = L.tableBooks, T = L.tablePlant;
    art(grid, (layer) => { const { x, y } = iso(38, 94, 10); layer.rect(x - 5, y - 3, 10, 3, B.teal); layer.rect(x - 4, y - 5, 8, 2, B.yellow); layer.rect(x - 4, y - 1, 8, 1, B.shade); });
    art(grid, (layer) => { const { x, y } = iso(48, 100, 10); layer.rect(x - 2, y - 4, 5, 4, T.pot); layer.ellipse(x + 0.5, y - 6, 2.6, 2, T.leaves); layer.set(x - 1, y - 8, T.light); });
    if (pet) paintPet(grid, pet, PET.x, PET.y);
    // the desk: an oak top on black steel
    desk(grid, 68, 120, 2, 22, 17, L.oak, L.black);
    paintComputer(grid);
    const M = L.mug;
    art(grid, (layer) => {
      const { x, y } = iso(70, 15, 17);
      layer.rect(x - 2, y - 5, 5, 5, M.body); layer.rect(x + 2, y - 5, 1, 5, M.shade); layer.rect(x - 2, y - 5, 5, 1, M.coffee);
      layer.points([[x + 3, y - 3], [x + 4, y - 3], [x + 4, y - 2]], M.body);
    });
    ob(grid, 82, 98, 14, 19, 17, 1, L.keyboard);
    fillTop(grid, 83, 97, 15, 18, 18, (u, v) => (u % 2 === 0 && v % 2 === 1 ? L.keys : null));
    ob(grid, 101, 110, 13, 20, 17, 1, L.pad, L.padEdge);
    const { x, y } = iso(115, 8, 17);
    art(grid, (layer) => { layer.ellipse(x, y - 1, 3.5, 1.6, L.lamp); layer.line(x, y - 2, x - 1, y - 15, L.lamp); layer.line(x - 1, y - 15, x - 8, y - 21, L.lamp); layer.set(x, y - 2, L.lamp); });
    art(grid, (layer) => {
      layer.pattern(x - 13, y - 25, ['...kkk', '..kkkkk', '.kkkkkk.', 'kkkkkkk.', '.bbbb...'], { k: L.lampShade, b: G.bulb[0] });
      layer.set(x - 9, y - 24, L.lampShine);
    });
    chairSeat(grid, SEAT, L.chair, L.black);
  },
  front(grid) { chairBack(grid, SEAT, L.chair, L.black); },
  overhead(grid) {
    for (const [u, v, z] of HANGING) {
      const { x, y } = iso(u, v, z), top = ceilingAt(x);
      grid.rect(x, top, 1, y - 6 - top, L.cord);
      art(grid, (layer) => {
        layer.rect(x - 1, y - 7, 3, 2, L.socket); layer.set(x, y - 7, L.socketLight);
        layer.ellipse(x + 0.5, y - 1.5, 2.8, 3.6, G.bulb[2]); layer.ellipse(x + 0.2, y - 2, 2, 2.8, G.bulb[1], [G.bulb[2]]); layer.rect(x, y - 3, 1, 3, G.bulb[0]);
      });
    }
  },
  animate(context, frame, { masks, faces }) {
    paintScreen(masked(context, masks.screen), SCREEN, frame, { ua: 93, columns: 2, rows: 2 }, faces);
    // the record turning: two glints going round
    const angle = frame * 0.55, R = L.record;
    context.fillStyle = R.glint; context.fillRect(Math.round(DISC.x + Math.cos(angle) * 4.6), Math.round(DISC.y + Math.sin(angle) * 2.3), 1, 1);
    context.fillStyle = R.glintDark; context.fillRect(Math.round(DISC.x + Math.cos(angle + Math.PI) * 4.6), Math.round(DISC.y + Math.sin(angle + Math.PI) * 2.3), 1, 1);
  },
  animateFront(context, frame) {
    // dust floating up in the sun
    for (let index = 0; index < 7; index++) {
      const age = (frame * 0.25 + index * 37) % 60, at = iso(22 + index * 6, 26 + ((index * 13) % 20), 14 + ((index * 11) % 34));
      context.fillStyle = L.dust[age < 45 ? 0 : 1];
      context.fillRect(Math.round(at.x + Math.sin((frame + index * 20) * 0.05) * 3), Math.round(at.y - age * 0.3), 1, 1);
    }
    steam(context, MUG.x, MUG.y, frame);
  },
};
