// The space station (ambiance 'space'), furnished where the offices are (office.ts: the same desks, couch, door and
// walks): white hull panels with a cyan light strip, a deck of riveted plates, a porthole on the stars and a ringed
// planet (the view of the hour), an airlock with its hazard stripes, a holo screen of the mission, a galley with its
// food unit, a hydro tank, a plant in a white pod, lavender and mint lockers, a light column, a lavender pod couch,
// a floor hatch, white consoles.
import { COZY_AMBIANCE_PALETTE, COZY_PALETTE as C } from '../../../design/room-palette.ts';
import type { WallClock } from '../clock.ts';
import { DOOR, paintCouch, paintCouchArm, paintDrawers, paintMonstera, paintWallBoxes, shadeAlongWalls, standing, type Drawers, type Topper } from '../decor.ts';
import { ROOM_UNITS as ROOM, WALL_HEIGHT, iso } from '../geometry.ts';
import {
  fillTop, fillWall, onLeftFace, outlined, outlinedBox, patchOnLeftFace, tint, wallEllipse, wallPatch, wallPixel,
  type Painter, type PixelGrid, type Tones, type Wall,
} from '../pixels.ts';
import type { CozyTime } from '../time.ts';
import type { AmbianceDesign } from './index.ts';
import { COOLER, COUNTER, DRAWERS, LAMP, MONSTERA, office } from './office.ts';

const P = COZY_AMBIANCE_PALETTE.space, O = C.outline, V = P.view;
const ob = (grid: PixelGrid, u0: number, u1: number, v0: number, v1: number, z: number, height: number, tones: Tones, edge?: string) => outlinedBox(grid, u0, u1, v0, v1, z, height, tones, O, edge);
const art = (grid: PixelGrid, draw: (layer: PixelGrid) => void) => outlined(grid, draw, O);

/** The porthole on the left wall, where the offices' window is: its middle, the radius of its glass. */
const PORTHOLE = { a: 56, z: 65, glass: 17 } as const;
/** The hatch in the floor, in the middle of the room. */
const HATCH = { u: 52, v: 94, radius: 14 } as const;

/* The room */

function paintDeck(grid: PixelGrid) {
  const D = P.deck;
  fillTop(grid, 0, ROOM, 0, ROOM, 0, (u, v) => {
    const pu = u % 16, pv = v % 16;
    if (pu === 15 || pv === 15) return D.seam;
    if ((pu === 2 || pu === 12) && (pv === 2 || pv === 12)) return D.rivet;
    if (pu === 0 || pv === 0) return D.light;
    return D.tones[(Math.floor(u / 16) * 3 + Math.floor(v / 16)) % D.tones.length];
  });
  shadeAlongWalls(grid);
}

function paintHull(grid: PixelGrid) {
  const W = P.wall, H = P.hull;
  paintWallBoxes(grid, W);
  for (const [wall, lower] of [['left', H.lower], ['right', H.lowerRight]] as const) {
    // the lower panels and their vents, a light strip along them, the upper panels and their seams
    wallPatch(grid, wall, 0, ROOM, 0, 34, lower);
    for (let a = 0; a < ROOM; a += 20) {
      wallPatch(grid, wall, a, a + 1, 0, WALL_HEIGHT, H.seam); wallPatch(grid, wall, a + 1, a + 2, 0, WALL_HEIGHT, H.seamLight);
      for (const z of [40, 68, 92]) { wallPixel(grid, wall, a + 4, z, H.rivet); wallPixel(grid, wall, a + 16, z, H.rivet); }
      if ((a / 20) % 2 === 0) for (let z = 10; z < 24; z += 3) wallPatch(grid, wall, a + 6, a + 15, z, z + 1, H.vent);
    }
    wallPatch(grid, wall, 0, ROOM, 33, 34, H.seam);
    wallPatch(grid, wall, 0, ROOM, 34, 37, H.strip); wallPatch(grid, wall, 0, ROOM, 37, 38, H.stripDim);
    wallPatch(grid, wall, 0, ROOM, 70, 71, H.seam); wallPatch(grid, wall, 0, ROOM, 71, 72, H.seamLight);
    wallPatch(grid, wall, 0, ROOM, WALL_HEIGHT - 4, WALL_HEIGHT - 3, H.seam);
    wallPatch(grid, wall, 0, ROOM, 0, 3, H.vent);
  }
  // a pink chevron and a stripe on the right wall, by the galley
  for (let step = 0; step < 4; step++) { wallPixel(grid, 'right', 10 + step, 56 + step, H.decal); wallPixel(grid, 'right', 17 - step, 56 + step, H.decal); }
  wallPatch(grid, 'right', 4, 26, 52, 54, H.decal);
}

/** The view through the porthole at `time`: deep space, its stars and its nebula, a ringed planet, the sun low at dusk. */
function paintView(grid: PixelGrid, time: CozyTime) {
  const wall: Wall = 'left', { a, z, glass } = PORTHOLE, sky = V[time], night = time === 'night';
  const inGlass = (pa: number, pz: number) => (pa + 0.5 - a) ** 2 + (pz + 0.5 - z) ** 2 < glass * glass;
  const within = (paint: (pa: number, pz: number) => string | null) => fillWall(grid, wall, a - glass, a + glass, z - glass, z + glass, (pa, pz) => (inGlass(pa, pz) ? paint(pa, pz) : null));
  within((_, pz) => sky[Math.min(sky.length - 1, Math.max(0, Math.floor((z + glass - pz) / ((2 * glass) / sky.length))))]);
  // a nebula across the upper half, brighter at night
  within((pa, pz) => {
    const d = ((pa - (a + 6)) / 11) ** 2 + ((pz - (z + 7)) / 4) ** 2;
    return d < 0.35 && night ? V.nebula : d < 1 && (pa + pz) % 2 === 0 ? V.nebulaDeep : null;
  });
  const stars = [[a + 12, z + 10], [a + 3, z + 13], [a - 9, z + 11], [a - 13, z + 2], [a + 9, z - 4], [a - 4, z + 5], [a + 14, z - 2], [a - 6, z - 11]];
  const more = night ? [[a + 7, z + 2], [a - 1, z + 9], [a + 11, z + 5], [a - 11, z - 5], [a + 2, z - 13], [a + 13, z - 8]] : [];
  for (const [index, [pa, pz]] of [...stars, ...more].entries()) if (inGlass(pa, pz)) wallPixel(grid, wall, pa, pz, index % 3 ? V.star : V.starBlue);
  if (time === 'dusk') { wallEllipse(grid, wall, a + 9, z - 9, 5.5, 5.5, V.sunGlow); wallEllipse(grid, wall, a + 9, z - 9, 3.6, 3.6, V.sun); }
  else if (!night) { wallEllipse(grid, wall, a + 11, z + 9, 2.6, 2.6, V.sunGlow); wallEllipse(grid, wall, a + 11, z + 9, 1.4, 1.4, V.sun); }
  // the planet, lower in the glass, its ring round it: the back of the ring, the planet, the front of the ring
  const pa = a - 5, pz = z - 5, radius = 7;
  const ring = (front: boolean) => within((ra, rz) => {
    const d = ((ra + 0.5 - pa) / 12) ** 2 + ((rz + 0.5 - pz) / 3) ** 2;
    return d < 1 && d > 0.55 && (rz < pz) === front ? (rz < pz - 1 ? V.ringShade : V.ring) : null;
  });
  ring(false);
  within((ra, rz) => {
    const da = ra + 0.5 - pa, dz = rz + 0.5 - pz, d = da * da + dz * dz;
    if (d >= radius * radius) return null;
    // lit from the sun's side, along the wall: the left wall runs to the screen's left as `a` grows
    const lit = da * 0.7 + dz * 0.7;
    if (night) return lit > radius * 0.75 ? V.planetShade : V.planetNight;
    if (Math.abs(dz - 1) < 1) return V.band;
    return lit > radius * 0.45 ? V.planetLight : lit < -radius * 0.4 ? V.planetShade : V.planet;
  });
  ring(true);
}

/** The porthole: its white rim and its bolts round the view of the hour, a glint on the glass. */
function paintPorthole(grid: PixelGrid, time: CozyTime) {
  const wall: Wall = 'left', R = P.porthole, { a, z, glass } = PORTHOLE;
  wallEllipse(grid, wall, a + 0.5, z + 0.5, glass + 5.6, glass + 5.6, O);
  wallEllipse(grid, wall, a + 0.5, z + 0.5, glass + 4.8, glass + 4.8, R.frame[2]);
  wallEllipse(grid, wall, a + 0.5, z + 1, glass + 4.2, glass + 4.2, R.frame[1]);
  wallEllipse(grid, wall, a + 0.5, z + 1.6, glass + 3.2, glass + 3.2, R.frame[0]);
  wallEllipse(grid, wall, a + 0.5, z + 0.5, glass + 1.2, glass + 1.2, R.frame[2]);
  for (let index = 0; index < 8; index++) {
    const angle = (index * Math.PI) / 4 + Math.PI / 8;
    wallPixel(grid, wall, Math.round(a + Math.cos(angle) * (glass + 3)), Math.round(z + Math.sin(angle) * (glass + 3)), R.bolt);
  }
  paintView(grid, time);
  for (let step = 0; step < 5; step++) wallPixel(grid, wall, a + 8 + step, z + 12 - step, R.glass);
  for (let step = 0; step < 3; step++) wallPixel(grid, wall, a + 12 + step, z + 6 - step, R.glass);
}

/** The airlock: its frame, two leaves with their slits, hazard stripes at their feet, its panel and its green light. */
const paintAirlock: Painter = (grid) => {
  const D = P.door, { a0, a1, height } = DOOR, wall: Wall = 'left', middle = (a0 + a1) >> 1;
  wallPatch(grid, wall, a0 - 3, a1 + 3, 0, height + 4, O);
  wallPatch(grid, wall, a0 - 2, a1 + 2, 0, height + 3, D.frame[1]); wallPatch(grid, wall, a0 - 2, a1 + 2, height + 2, height + 3, D.frame[0]);
  wallPatch(grid, wall, a0 - 1, a1 + 1, 0, height + 1, D.frame[2]);
  wallPatch(grid, wall, a0, a1, 0, height, D.leaf);
  wallPatch(grid, wall, a0, a0 + 1, 0, height, D.leafLight); wallPatch(grid, wall, a1 - 1, a1, 0, height, D.leafShade);
  wallPatch(grid, wall, middle, middle + 1, 0, height, D.seam);
  fillWall(grid, wall, a0, a1, 0, 7, (a, z) => (Math.floor((a + z) / 3) % 2 ? D.hazard : D.hazardDark));
  wallPatch(grid, wall, a0, a1, 7, 8, D.seam);
  for (const [s0, s1] of [[a0 + 3, middle - 3], [middle + 4, a1 - 3]]) {
    wallPatch(grid, wall, s0, s1, 34, 52, D.seam); wallPatch(grid, wall, s0 + 1, s1 - 1, 35, 51, D.slit); wallPatch(grid, wall, s0 + 1, s0 + 2, 46, 51, D.leafLight);
    wallPatch(grid, wall, s0, s1, 24, 25, D.leafShade); wallPatch(grid, wall, s0, s1, 25, 26, D.leafLight);
  }
  wallPatch(grid, wall, middle - 3, middle + 4, height + 5, height + 9, O); wallPatch(grid, wall, middle - 2, middle + 3, height + 6, height + 8, D.light);
  // the panel beside it, towards the back
  wallPatch(grid, wall, a0 - 10, a0 - 4, 26, 40, O); wallPatch(grid, wall, a0 - 9, a0 - 5, 27, 39, D.seam);
  wallPatch(grid, wall, a0 - 8, a0 - 6, 34, 37, D.slit); wallPixel(grid, wall, a0 - 7, 30, D.light);
};

/** The hazard plate in front of the airlock. */
function paintAirlockPlate(grid: PixelGrid) {
  const { a0, a1 } = DOOR, D = P.door;
  fillTop(grid, 1, 12, a0 + 1, a1 - 1, 0, (u, v) => {
    if (u === 1 || u === 11 || v === a0 + 1 || v === a1 - 2) return D.mat[2];
    return Math.floor((u + v) / 3) % 2 ? D.mat[0] : D.mat[1];
  });
}

/** The holo screen of the mission on the right wall: its grid, the orbits round a sun, a chart: a click opens the board and its notes. */
const paintHoloBoard: Painter = (grid) => {
  const wall: Wall = 'right', B = P.board;
  wallPatch(grid, wall, 73, 123, 45, 87, O);
  wallPatch(grid, wall, 74, 122, 46, 86, B.frame); wallPatch(grid, wall, 74, 122, 85, 86, B.frameLight); wallPatch(grid, wall, 74, 75, 46, 86, B.frameLight);
  wallPatch(grid, wall, 77, 119, 49, 83, B.screen);
  fillWall(grid, wall, 77, 119, 49, 83, (a, z) => ((a - 77) % 6 === 0 || (z - 49) % 6 === 0 ? B.grid : null));
  const ca = 91, cz = 67;
  fillWall(grid, wall, 77, 106, 52, 82, (a, z) => {
    const d = Math.sqrt(((a + 0.5 - ca) / 12) ** 2 + ((z + 0.5 - cz) / 8) ** 2), inner = Math.sqrt(((a + 0.5 - ca) / 7) ** 2 + ((z + 0.5 - cz) / 4.5) ** 2);
    return Math.abs(d - 1) < 0.08 || Math.abs(inner - 1) < 0.12 ? B.orbit : null;
  });
  wallEllipse(grid, wall, ca + 0.5, cz + 0.5, 2.4, 2.4, B.sun);
  for (const [index, [a, z]] of [[ca + 11, cz + 3], [ca - 6, cz + 2], [ca + 3, cz - 8]].entries()) wallPatch(grid, wall, a, a + 2, z, z + 2, B.dots[index]);
  // a chart going up on the right, three lines of text under it
  let z = 58;
  for (let a = 108; a < 118; a++) { wallPixel(grid, wall, a, z, B.line); z += [1, 2, -1, 2, 1, -1, 2, 1, 1, 0][a - 108]; }
  for (const [row, length] of [[54, 9], [52, 6], [50, 8]] as const) wallPatch(grid, wall, 108, 108 + length, row, row + 1, B.orbit);
  wallPatch(grid, wall, 80, 92, 80, 81, B.line);
};

/** Above the airlock, its clock. */
const CLOCK: WallClock = { wall: 'left', a: 112, z: 80, radius: 6, tones: P.clock };

/* What stands on the floor */

/** The galley where the offices' counter is: white cupboards, the food unit with its screen and its cup, pouches. */
function paintGalley(grid: PixelGrid) {
  const G = P.galley, { u0, u1, v0, v1 } = COUNTER, front = v1 - 1;
  ob(grid, u0 + 1, u1 - 1, v0, front, 0, 22, G.body, G.edge);
  for (let a = u0 + 13; a < u1 - 2; a += 12) patchOnLeftFace(grid, front, a, a + 1, 2, 21, G.panel);
  for (let a = u0 + 5; a < u1 - 2; a += 12) patchOnLeftFace(grid, front, a, a + 4, 17, 18, G.panel);
  patchOnLeftFace(grid, front, u0 + 1, u1 - 1, 0, 2, G.panel);
  ob(grid, u0, u1, v0, v1, 22, 2, G.top, G.topEdge);
  // the food unit: its screen, its lights, its nozzle and the cup under it
  ob(grid, u0 + 3, u0 + 17, v0 + 1, v0 + 9, 24, 13, G.unit, G.unitEdge);
  const face = v0 + 9;
  patchOnLeftFace(grid, face, u0 + 5, u0 + 15, 30, 35, G.screen);
  onLeftFace(grid, face, u0 + 6, u0 + 11, 33, G.text); onLeftFace(grid, face, u0 + 6, u0 + 13, 31, G.text);
  onLeftFace(grid, face, u0 + 13, u0 + 14, 33, G.led);
  patchOnLeftFace(grid, face, u0 + 8, u0 + 11, 26, 28, G.nozzle);
  art(grid, (layer) => { const { x, y } = iso(u0 + 10, face + 2, 24); layer.rect(x - 1, y - 3, 3, 3, G.cup); layer.set(x + 1, y - 3, G.cupShade); });
  G.pouches.forEach((colour, index) => { const a = u0 + 22 + index * 5; ob(grid, a, a + 3, v0 + 4, v0 + 9, 24, 5, [colour, tint(colour, 0.9), tint(colour, 0.8)]); });
}

/** The hydro tank where the offices' cooler is: its base and its tap, the water and its bubbles in the glass. */
function paintTank(grid: PixelGrid) {
  const K = P.tank, { u, v, width } = COOLER, front = v + width;
  ob(grid, u, u + width, v, front, 0, 16, K.base, K.baseEdge);
  patchOnLeftFace(grid, front, u + 4, u + 8, 9, 12, K.tap); patchOnLeftFace(grid, front, u + 2, u + 10, 4, 5, K.cap);
  art(grid, (layer) => {
    const { x, y } = iso(u + 6, v + 6, 16);
    layer.rect(x - 5, y - 24, 11, 23, K.glass);
    layer.rect(x - 4, y - 17, 9, 16, K.water); layer.rect(x - 4, y - 17, 9, 1, K.waterLight); layer.rect(x - 4, y - 16, 2, 15, K.waterLight);
    layer.points([[x + 1, y - 4], [x + 2, y - 8], [x, y - 11], [x + 2, y - 14], [x - 1, y - 6]], K.bubble);
    layer.rect(x - 5, y - 26, 11, 2, K.cap); layer.rect(x - 2, y - 28, 5, 2, K.cap);
  });
}

/** A little rocket on the lavender locker. */
const rocket: Topper = (layer, x, y) => {
  const R = P.rocket;
  layer.rect(x - 1, y - 11, 3, 9, R.body); layer.set(x, y - 12, R.body); layer.rect(x + 1, y - 10, 1, 8, R.shade);
  layer.set(x, y - 8, R.window); layer.rect(x - 2, y - 4, 1, 3, R.fin); layer.rect(x + 2, y - 4, 1, 3, R.fin); layer.set(x, y - 1, R.flame);
};
/** Two datapads on the mint locker. */
const datapads: Topper = (layer, x, y) => {
  const [case_, glow, shade] = P.pads;
  layer.rect(x - 4, y - 2, 8, 2, case_); layer.rect(x - 3, y - 2, 6, 1, glow); layer.rect(x - 3, y - 4, 7, 2, shade); layer.rect(x - 2, y - 4, 5, 1, glow);
};

const LOCKERS: readonly Drawers[] = DRAWERS.map((drawers, index) => ({ ...drawers, tones: index ? P.lockers.mint : P.lockers.lavender, topper: index ? datapads : rocket }));

/** The plant in its white pod, a cyan light round it. */
function paintPlantPod(grid: PixelGrid) {
  paintMonstera(grid, MONSTERA.u, MONSTERA.v, { ...P.pot, face: false });
  const { x, y } = iso(MONSTERA.u, MONSTERA.v);
  grid.rect(x - 10, y - 9, 20, 1, P.pot.led);
}

/** The light column where the offices' lamp stands: a glowing tube between two caps. */
function paintLightColumn(grid: PixelGrid) {
  const L = P.lamp, { x, y } = iso(LAMP.u, LAMP.v);
  art(grid, (layer) => {
    layer.ellipse(x, y - 1, 5, 2, L.base[1]); layer.ellipse(x - 1, y - 2, 3, 1, L.base[0]); layer.rect(x - 3, y - 6, 7, 4, L.base[1]); layer.rect(x + 2, y - 6, 2, 4, L.base[2]);
    layer.rect(x - 2, y - 44, 5, 38, L.tube); layer.rect(x - 2, y - 44, 1, 38, L.tubeLight); layer.rect(x + 2, y - 44, 1, 38, L.tubeShade);
    layer.rect(x - 3, y - 48, 7, 4, L.cap); layer.rect(x + 2, y - 48, 2, 4, L.base[0]);
  });
}

/* Hung on the walls, lying on the floor */

/** The hatch in the deck: its rim, its hazard ring, its bolts. */
function paintHatch(grid: PixelGrid) {
  const H = P.hatch, { u: cu, v: cv, radius } = HATCH;
  fillTop(grid, cu - radius, cu + radius, cv - radius, cv + radius, 0, (u, v) => {
    const du = u + 0.5 - cu, dv = v + 0.5 - cv, d = Math.sqrt(du * du + dv * dv), angle = Math.atan2(dv, du);
    if (d >= radius) return null;
    if (d >= radius - 1) return H.rim;
    if (d >= radius - 3.5) return Math.floor(((angle + Math.PI) * 10) / Math.PI) % 2 ? H.hazard : H.hazardDark;
    if (d >= radius - 4.5) return H.rimLight;
    if (Math.abs(d - (radius - 6)) < 0.7 && Math.abs(((angle + Math.PI) * 4) / Math.PI - Math.round(((angle + Math.PI) * 4) / Math.PI)) < 0.12) return H.bolt;
    if (Math.abs(d - 5) < 0.6) return H.ring;
    return d < 2.5 ? H.middle : H.plate;
  });
}

/** The consoles' things: a mug with its band, a glowing orb. */
const mug: Topper = (layer, x, y) => {
  const M = P.mug;
  layer.rect(x - 2, y - 5, 5, 5, M.body); layer.rect(x + 2, y - 5, 1, 5, M.shade); layer.rect(x - 2, y - 3, 5, 1, M.band); layer.rect(x - 1, y - 5, 3, 1, M.coffee); layer.rect(x + 3, y - 4, 1, 2, M.body);
};
const orb: Topper = (layer, x, y) => {
  const B = P.orb;
  layer.rect(x - 3, y - 2, 7, 2, B.base); layer.ellipse(x + 0.5, y - 5, 3, 3, B.glass); layer.ellipse(x + 0.5, y - 5, 1.6, 1.6, B.glow);
};

const GLOW: readonly string[] = [P.hull.strip, P.hull.stripDim, P.galley.text, P.galley.led, P.door.light, P.door.slit, P.board.line, P.board.orbit, P.board.sun, ...P.board.dots, P.orb.glow, P.pot.led];
const VIEW: readonly string[] = [...V.day, ...V.dusk, ...V.night, V.star, V.starBlue, V.nebula, V.nebulaDeep, V.planet, V.planetLight, V.planetShade, V.planetNight, V.band, V.ring, V.ringShade, V.sun, V.sunGlow];

export const space: AmbianceDesign = {
  ...office,
  id: 'space',
  deskStyle: {
    top: P.desk.top, topEdge: P.desk.edge, leg: P.desk.leg, drawers: [P.lockers.lavender, P.lockers.mint], monitor: P.desk.monitor, monitorEdge: P.desk.monitorEdge, stand: P.desk.stand,
    vents: P.desk.vents, keyboard: P.desk.keyboard, key: P.desk.key, seats: P.seats, chairBase: P.chair.base, chairPole: P.chair.pole, backThing: mug, sideThing: orb,
  },
  paintCouch: (grid) => paintCouch(grid, office.couch, P.couch),
  paintCouchArm: (grid) => paintCouchArm(grid, office.couch, P.couch),
  paintDoor: paintAirlock,
  paintBoard: paintHoloBoard,
  clock: CLOCK,
  paintRoom(grid, time) {
    paintDeck(grid);
    paintHull(grid);
    paintPorthole(grid, time);
  },
  dress(grid) {
    paintHatch(grid);
    paintAirlockPlate(grid);
  },
  standing: [
    standing(MONSTERA.u, MONSTERA.u, MONSTERA.v, MONSTERA.v, paintPlantPod),
    standing(COUNTER.u0, COUNTER.u1, COUNTER.v0, COUNTER.v1, paintGalley),
    standing(COOLER.u, COOLER.u + COOLER.width, COOLER.v, COOLER.v + COOLER.width, paintTank),
    ...LOCKERS.map((lockers) => standing(lockers.u0, lockers.u1, lockers.v0, lockers.v1, (grid) => paintDrawers(grid, lockers))),
    standing(LAMP.u, LAMP.u, LAMP.v, LAMP.v, paintLightColumn),
  ],
  light: { lamp: LAMP, lampColour: P.light.lamp, ambient: P.light, lampGlow: [P.lamp.tube, P.lamp.tubeLight, P.lamp.tubeShade], glow: GLOW, sky: VIEW },
};
