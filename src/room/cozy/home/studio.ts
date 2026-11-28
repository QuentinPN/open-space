// The cosy studio (Preferences.homeTheme 'studio'), an evening: a bed and its patchwork quilt with the user's pet
// asleep on it, a gaming desk with two screens, its LED strip and its tower's fans cycling through the colours, a bean
// bag, fairy lights along the walls, the city at sunset through the window.
import { COZY_HOME_PALETTE as H, COZY_PALETTE as C, hueColour } from '../../../design/room-palette.ts';
import { paintPlanks, shadeAlongWalls } from '../decor.ts';
import { ROOM_UNITS as ROOM, WALL_HEIGHT, around, iso } from '../geometry.ts';
import { box, fillLeftFace, fillRightFace, fillTop, fillWall, onLeftFace, patchOnLeftFace, tint, wallEllipse, wallPatch, wallPixel, wallPoint, type PixelGrid, type Tones } from '../pixels.ts';
import {
  art, cabinet, chairBack, chairSeat, coloursOf, desk, hash, lamp, masked, monitor, monstera, ob, paintScreen, roundRug, screenOf, walls, webcam, type HomeDesign,
} from './kit.ts';

const S = H.studio, G = S.glow;
const SEAT = { u: 68, v: 28, z: 11 } as const;
const SCREENS = [screenOf(46, 69, 11, 17, 18), screenOf(71, 94, 11, 17, 18)] as const;
/** Where the pet sleeps, on the quilt. */
const CAT = { u: 42, v: 90, z: 14 } as const;
/** The garland along the top of both walls, sagging between its hooks every 30 units; a bulb every 6. */
const garlandAt = (a: number) => Math.round(WALL_HEIGHT - 3 - 5 * Math.sin(Math.PI * (((a - 2) % 30) / 30)));
const BULBS = (['left', 'right'] as const).flatMap((wall) => Array.from({ length: ROOM - 4 }, (_, index) => index + 2).filter((a) => a % 6 === 3).map((a) => wallPoint(wall, a, garlandAt(a) - 1)));
/** The city's buildings in the window: from a0 to a1 along the wall, their tops. */
const CITY = [[23, 27, 40], [27, 32, 45], [32, 36, 38], [36, 41, 48], [41, 45, 42], [45, 50, 46], [50, 54, 39], [54, 57, 44]] as const;

function beanBag(grid: PixelGrid, u: number, v: number, P: Tones) {
  const { x, y } = iso(u, v);
  art(grid, (layer) => {
    layer.ellipse(x + 4, y - 13, 10, 8, P[2]); layer.ellipse(x + 3.4, y - 13.6, 9, 7, P[1], [P[2]]); layer.ellipse(x + 1, y - 16.5, 4, 2.2, P[0], [P[1]]);
    layer.ellipse(x, y - 6, 15, 7.5, P[2]); layer.ellipse(x - 0.6, y - 6.8, 14, 6.5, P[1], [P[2]]); layer.ellipse(x - 6, y - 9, 5, 2, P[0], [P[1]]);
    layer.ellipse(x + 2, y - 8.4, 7, 2.6, P[2], [P[1], P[0]]); layer.ellipse(x + 2.4, y - 8, 5.6, 1.6, P[1], [P[2]]);
    layer.rect(x - 14, y - 3, 3, 1, P[2]); layer.set(x + 9, y - 2, P[2]);
  });
}

function paintWindow(grid: PixelGrid) {
  const wall = 'left', W = S.window;
  wallPatch(grid, wall, 20, 60, 28, 72, W.frame); wallPatch(grid, wall, 21, 59, 29, 71, W.pane);
  fillWall(grid, wall, 23, 57, 31, 69, (a, z) => G.sky[Math.min(6, Math.floor(((69 - z) + ((a + z) & 1) * 0.9) / (38 / 7)))]);
  wallEllipse(grid, wall, 45, 40, 6, 6, G.sun); wallEllipse(grid, wall, 45.6, 40.6, 4, 4, G.sunLight);
  for (const [a, z] of [[28, 66], [51, 63], [34, 60], [47, 67]]) wallPixel(grid, wall, a, z, G.star);
  for (const [a0, a1, top] of CITY) {
    wallPatch(grid, wall, a0, a1, 31, top, G.city);
    for (let a = a0 + 1; a < a1 - 1; a += 2) for (let z = 33; z < top - 1; z += 3) if (hash(a, z) > 0.5) wallPixel(grid, wall, a, z, G.cityWindow);
  }
  wallPatch(grid, wall, 39, 41, 31, 69, W.pane); wallPatch(grid, wall, 23, 57, 49, 51, W.pane); wallPatch(grid, wall, 23, 57, 48, 49, W.mullionShade);
  const curtain = S.curtain;
  for (const [a0, a1] of [[15, 25], [55, 65]]) for (let a = a0; a < a1; a++) {
    const tone = curtain[(a - a0) % 3 === 2 ? 2 : (a - a0) % 3 === 0 ? 0 : 1], bottom = Math.round(27 + Math.abs(a - (a0 + a1) / 2) * 0.6);
    wallPatch(grid, wall, a, a + 1, bottom, 76, tone); wallPixel(grid, wall, a, bottom, curtain[2]);
  }
  wallPatch(grid, wall, 15, 25, 46, 48, S.curtainTie); wallPatch(grid, wall, 55, 65, 46, 48, S.curtainTie);
  wallPatch(grid, wall, 13, 67, 76, 78, S.rod); wallPatch(grid, wall, 13, 67, 77, 78, S.rodLight);
  art(grid, (layer) => box(layer, 0, 6, 19, 61, 26, 3, W.sill, W.sillEdge));
}

function paintBed(grid: PixelGrid) {
  const B = S.bed, Q = S.quilt;
  ob(grid, 0, 4, 70, 106, 0, 26, B.wood, B.woodEdge);
  ob(grid, 4, 52, 70, 106, 0, 7, B.wood);
  ob(grid, 4, 51, 71, 105, 7, 5, B.sheet, B.sheetEdge);
  ob(grid, 6, 17, 73, 87, 12, 3, B.pillow, B.sheetEdge);
  ob(grid, 6, 17, 89, 103, 12, 3, B.pillow, B.sheetEdge);
  const patch = (i: number, j: number) => Q.patches[(i * 3 + j * 2 + ((i * j) % 3)) % 5];
  ob(grid, 19, 53, 69, 107, 5, 9, Q.sides);
  fillTop(grid, 19, 53, 69, 107, 14, (u, v) => ((u - 19) % 8 === 0 || (v - 69) % 8 === 0 ? Q.seam : patch((u - 19) >> 3, (v - 69) >> 3)));
  fillTop(grid, 19, 22, 69, 107, 14, () => Q.fold);
  fillLeftFace(grid, 107, 19, 53, 5, 14, (a, z) => ((a - 19) % 8 === 0 || z === 9 ? Q.seamLeft : tint(patch((a - 19) >> 3, 5), 0.9)));
  fillRightFace(grid, 53, 69, 107, 5, 14, (a, z) => ((a - 69) % 8 === 0 || z === 9 ? Q.seamRight : tint(patch(5, (a - 69) >> 3), 0.8)));
}

/** Its two screens and the webcam on them. */
function paintComputer(grid: PixelGrid) {
  monitor(grid, 46, 69, 11, 17, 18, S.monitor, S.stand);
  monitor(grid, 71, 94, 11, 17, 18, S.monitor, S.stand);
  webcam(grid, 82, 11, 39);
}

function paintDesk(grid: PixelGrid) {
  desk(grid, 38, 108, 2, 22, 17, S.desk, S.legs);
  onLeftFace(grid, 22, 38, 108, 14, G.led);
  art(grid, (layer) => {
    const K = C.cactus, { x, y } = iso(42, 7, 17);
    layer.rect(x - 3, y - 4, 7, 4, K.pot); layer.rect(x + 2, y - 4, 2, 4, K.potShade);
    layer.ellipse(x + 0.5, y - 6.5, 3, 2.4, K.body); layer.ellipse(x, y - 7, 1.6, 1.2, K.light, [K.body]); layer.set(x - 1, y - 9, K.flower);
  });
  paintComputer(grid);
  ob(grid, 97, 107, 4, 16, 17, 24, S.tower, S.towerEdge);
  patchOnLeftFace(grid, 16, 98, 106, 19, 39, G.fan);
  ob(grid, 52, 68, 14, 19, 17, 1, S.keyboard);
  fillTop(grid, 52, 68, 14, 19, 18, (u, v) => (u % 2 === 0 && v % 2 === 1 ? S.keycaps[(u >> 1) % 5] : null));
  fillTop(grid, 72, 86, 13, 20, 17, () => S.mousePad);
  ob(grid, 78, 81, 15, 18, 17, 1, S.mouse);
  art(grid, (layer) => {
    const T = S.tea, { x, y } = iso(41, 17, 17);
    layer.rect(x - 2, y - 7, 5, 7, T.cup); layer.rect(x + 2, y - 7, 1, 7, T.shade); layer.rect(x - 2, y - 3, 5, 3, T.tea);
    layer.points([[x - 1, y - 2], [x + 1, y - 1]], T.pearls); layer.rect(x - 2, y - 8, 5, 1, T.lid); layer.line(x + 1, y - 8, x + 2, y - 12, T.straw);
  });
}

export const studio: HomeDesign = {
  seat: SEAT,
  screens: SCREENS,
  lighting: {
    ambient: [0.76, 0.68, 0.8],
    lamps: [
      lamp(7, 62, 20, [0.62, 0.4, 0.18], 52, 0.6, 3), lamp(70, 11, 30, [0.16, 0.24, 0.48], 48, 0.6, 3),
      lamp(58, 0, 44, [0.26, 0.06, 0.24], 22, 0.7, 2), lamp(88, 0, 44, [0.06, 0.2, 0.26], 22, 0.7, 2),
      lamp(18, 40, 0, [0.3, 0.16, 0.12], 46, 0.6, 3),
    ],
  },
  outside: { mood: 'dusk', sky: G.sky, body: [G.sun, G.sunLight], stars: [G.star], lights: { on: G.cityWindow, off: G.city }, shade: [G.city] },
  clock: { wall: 'right', a: 30, z: 68, radius: 6 },
  metrics: { wall: 'right', a: 50, z: 58 },
  festiveSpot: { u: 118, v: 30 },
  glow: [...coloursOf(G), H.screen, H.webcam.on],
  masks: { screen: [H.screen], led: [G.led], fan: [G.fan] },
  petBed: CAT,
  furniture: [
    around(12, 12, 6, 40), { u0: 0, u1: 6, v0: 19, v1: 61, height: 29 }, { u0: 38, u1: 108, v0: 2, v1: 22, height: 41 }, { u0: 2, u1: 13, v0: 57, v1: 67, height: 30 },
    { u0: 0, u1: 4, v0: 70, v1: 106, height: 26 }, { u0: 4, u1: 53, v0: 69, v1: 107, height: 14 }, { u0: 92, u1: 112, v0: 86, v1: 102, height: 20 },
  ],
  // the bed's edge by its pillows (the pet sleeps at its foot), facing the room, and the bean bag, its back to the right wall
  spots: [{ u: 48, v: 76, direction: 'down-right', lift: 14 }, { u: 100, v: 94, direction: 'down-left', lift: 8 }],
  computer: paintComputer,
  back(grid) {
    paintPlanks(grid, { tones: S.planks, seam: S.plankSeam, joint: S.plankJoint, width: 4, length: 52 });
    shadeAlongWalls(grid);
    roundRug(grid, 64, 72, 34, 17, S.rug, S.rugDots);
    const W = S.wall;
    walls(grid, W.left, W.right, W.cap);
    for (const wall of ['left', 'right'] as const) {
      const dot = wall === 'left' ? W.dotLeft : W.dotRight;
      fillWall(grid, wall, 0, ROOM, 6, WALL_HEIGHT - 3, (a, z) => ((((a % 14 === 4 || a % 14 === 5) && z % 14 === 6) || ((a % 14 === 11 || a % 14 === 12) && z % 14 === 13)) ? dot : null));
      wallPatch(grid, wall, 0, ROOM, 0, 5, W.skirting); wallPatch(grid, wall, 0, ROOM, 4, 5, W.skirtingTop); wallPatch(grid, wall, 0, ROOM, 0, 1, W.skirtingFoot);
    }
    paintWindow(grid);
    // the fairy lights' wire (their bulbs are drawn each frame)
    for (const wall of ['left', 'right'] as const) for (let a = 2; a < ROOM - 2; a++) {
      const z = garlandAt(a);
      wallPixel(grid, wall, a, z, S.garland);
      if ((a - 2) % 30 === 0) wallPixel(grid, wall, a, z + 1, S.garlandKnot);
    }
    // a poster of a ringed planet
    const P = S.poster;
    wallPatch(grid, 'right', 110, 126, 42, 68, P.frame); wallPatch(grid, 'right', 111, 125, 43, 67, P.sky);
    wallEllipse(grid, 'right', 118, 56, 4.5, 4.5, P.planet); wallEllipse(grid, 'right', 117.3, 56.8, 3, 3, P.planetLight);
    for (let a = 112; a < 125; a++) { const z = Math.round(56 - (a - 118) * 0.3); if (Math.abs(a - 118) > 3) wallPixel(grid, 'right', a, z, P.ring); }
    for (const [a, z] of [[113, 64], [122, 62], [114, 49], [123, 47], [120, 65]]) wallPixel(grid, 'right', a, z, P.stars);
    wallPatch(grid, 'right', 113, 123, 45, 46, P.band);
    monstera(grid, 12, 12, S.pot);
    paintDesk(grid);
    // the nightstand and its mushroom lamp
    cabinet(grid, 2, 13, 57, 67, 14, S.nightstand);
    const { x, y } = iso(7, 62, 14);
    art(grid, (layer) => { layer.ellipse(x, y - 1, 4, 1.5, S.lampFoot); layer.rect(x - 1, y - 9, 2, 8, S.lampStem); });
    art(grid, (layer) => {
      layer.ellipse(x, y - 11, 6.5, 5.5, G.lamp[1]); layer.ellipse(x - 1.5, y - 12.5, 4, 3, G.lamp[0], [G.lamp[1]]);
      layer.rect(x - 8, y - 10, 16, 5, null); layer.rect(x - 6, y - 10, 13, 1, G.lamp[2]);
    });
    paintBed(grid);
    art(grid, (layer) => {
      const at = iso(60, 106);
      layer.ellipse(at.x - 3, at.y, 3.2, 1.6, S.slippers); layer.ellipse(at.x + 4, at.y + 2, 3.2, 1.6, S.slippers);
      layer.set(at.x - 4, at.y - 1, S.slippersLight); layer.set(at.x + 3, at.y + 1, S.slippersLight);
    });
    chairSeat(grid, SEAT, S.chair, S.chairBase);
    beanBag(grid, 102, 94, S.beanBag);
    art(grid, (layer) => {
      const at = iso(100, 92);
      layer.rect(at.x - 2, at.y - 11, 7, 2, S.pad); layer.set(at.x - 3, at.y - 10, S.pad); layer.set(at.x + 5, at.y - 10, S.pad);
      layer.set(at.x - 1, at.y - 11, S.padButtons[0]); layer.set(at.x + 3, at.y - 11, S.padButtons[1]);
    });
  },
  front(grid) { chairBack(grid, SEAT, S.chairBack, S.chairBase); },
  animate(context, frame, { masks, faces, time }) {
    const screens = masked(context, masks.screen);
    paintScreen(screens, SCREENS[0], frame, null, faces);
    paintScreen(screens, SCREENS[1], frame + 30, { ua: SCREENS[1].ua, columns: 2, rows: 2 }, faces);
    const strip = masked(context, masks.led);
    for (let a = 38; a < 108; a++) onLeftFace(strip, 22, a, a + 1, 14, hueColour(a * 6 + frame * 14, S.rgbStrip));
    const fans = masked(context, masks.fan);
    for (const cz of [34, 25]) for (let a = 98; a < 106; a++) for (let z = cz - 4; z <= cz + 4; z++) {
      const da = a + 0.5 - 102, dz = z + 0.5 - cz, distance = Math.hypot(da, dz);
      if (Math.abs(distance - 2.9) < 0.75) onLeftFace(fans, 16, a, a + 1, z, hueColour(Math.atan2(dz, da) * 57 + frame * 24 + cz * 5, S.rgbFans));
      else if (distance < 1) onLeftFace(fans, 16, a, a + 1, z, S.fanHub);
    }
    BULBS.forEach(([x, y], index) => {
      const dim = ((frame >> 2) + index * 3) % 9 === 0, colour = S.bulbs[index % 5];
      context.fillStyle = dim ? tint(colour, 0.55) : colour; context.fillRect(x, y, 2, 2);
      if (!dim) { context.fillStyle = S.bulbCore; context.fillRect(x, y, 1, 1); }
    });
    // a star twinkling over the city, once the sun is down
    if (time !== 'day' && (frame >> 3) % 3 === 0) { const [x, y] = wallPoint('left', 28, 66); context.fillStyle = G.star; context.fillRect(x - 1, y, 3, 1); context.fillRect(x, y - 1, 1, 3); }
  },
};
