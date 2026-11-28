// The offices (ambiance 'office', the first cozy look): cream walls with a wainscot, honey planks, a window with
// lavender curtains, hanging plants, a monstera with a little face, the couch with its star pillow, the coffee counter
// and its donuts, the water cooler, the whiteboard, a pink rug, pastel drawers, white desks with their screens. The
// server room is this room with racks for desks (decor.ts).
import { COZY_PALETTE as C } from '../../../design/room-palette.ts';
import {
  DOOR, OFFICE_POT, ROOM_CLOCK, mug, paintCouch, paintCouchArm, paintDoor, paintDoormat, paintDrawers, paintFloor, paintHangingPlant, paintLamp, paintMonstera, paintWalls,
  paintWindow, standing, succulent, type Drawers, type Topper,
} from '../decor.ts';
import { around, iso, type Couch, type Desk, type Place } from '../geometry.ts';
import { onLeftFace, outlined, outlinedBox, patchOnLeftFace, wallPatch, wallPoint, type Painter, type PixelGrid, type Tones, type Wall } from '../pixels.ts';
import type { AmbianceDesign } from './index.ts';

const O = C.outline;
const ob = (grid: PixelGrid, u0: number, u1: number, v0: number, v1: number, z: number, height: number, tones: Tones, edge?: string) => outlinedBox(grid, u0, u1, v0, v1, z, height, tones, O, edge);
const art = (draw: (layer: PixelGrid) => void, grid: PixelGrid) => outlined(grid, draw, O);

/** The whiteboard on the right wall, its tray and its pens: a click opens the board and its notes, like the classic one. */
const paintWhiteboard: Painter = (grid) => {
  const wall: Wall = 'right', B = C.whiteboard;
  wallPatch(grid, wall, 74, 122, 46, 86, B.frame); wallPatch(grid, wall, 75, 121, 47, 85, B.frameLight); wallPatch(grid, wall, 77, 119, 49, 83, B.surface);
  wallPatch(grid, wall, 77, 119, 49, 50, B.surfaceTop);
  for (const [a0, a1, z, ink] of [[80, 96, 78, 0], [80, 104, 75, 0], [80, 90, 72, 1], [92, 100, 72, 2], [80, 94, 69, 2]] as const) wallPatch(grid, wall, a0, a1, z, z + 1, B.ink[ink]);
  for (const [a, height, ink] of [[100, 6, 0], [104, 10, 1], [108, 14, 3], [112, 9, 2]] as const) wallPatch(grid, wall, a, a + 3, 54, 54 + height, B.ink[ink]);
  wallPatch(grid, wall, 98, 117, 53, 54, B.grey);
  wallPatch(grid, wall, 80, 88, 58, 59, B.grey); wallPatch(grid, wall, 80, 92, 61, 62, B.grey);
  ob(grid, 76, 120, 0, 4, 44, 2, B.tray);
  for (const [a, ink] of [[86, 1], [90, 0], [94, 2]] as const) ob(grid, a, a + 3, 0, 3, 46, 1, [B.ink[ink], B.inkShade[ink], B.inkShade[ink]]);
  const [x, y] = wallPoint(wall, 114, 82);
  art((layer) => {
    layer.pattern(x - 4, y - 4, ['....y....', '...yyy...', 'yyyyyyyyy', '.yyyyyyy.', '..yyyyy..', '.yyy.yyy.', '.yy...yy.'], { y: B.star });
    layer.points([[x, y - 2], [x - 1, y - 1], [x - 2, y]], B.starLight);
  }, grid);
  art((layer) => { layer.pattern(x + 7, y - 2, ['.rr.rr', 'rrrrrr', 'rrrrrr', '.rrrr.', '..rr..'], { r: B.heart }); layer.set(x + 8, y - 1, B.heartLight); }, grid);
};


function paintRug(grid: PixelGrid) {
  const R = C.rug, { x, y } = iso(52, 96);
  grid.ellipse(x, y + 1, 31, 15.5, R.edgeShade); grid.ellipse(x, y, 31, 15.5, R.edge);
  grid.ellipse(x, y, 30, 14.6, R.base); grid.ellipse(x, y, 25, 12, R.ring); grid.ellipse(x, y, 18, 8.6, R.middle);
  for (let index = 0; index < 28; index++) { const angle = index / 28 * Math.PI * 2; grid.set(Math.round(x + Math.cos(angle) * 27.5), Math.round(y + Math.sin(angle) * 13.2), R.dots); }
  for (let index = 0; index < 20; index++) { const angle = index / 20 * Math.PI * 2; grid.set(Math.round(x + Math.cos(angle) * 18.5), Math.round(y + Math.sin(angle) * 8.9), R.base); }
  grid.pattern(x - 3, y - 2, ['.p.p.', 'ppppp', '.ppp.', '..p..'], { p: R.heart });
}


function paintCounter(grid: PixelGrid) {
  const K = C.counter;
  ob(grid, 34, 70, 0, 14, 0, 20, K.body);
  for (const [a0, a1] of [[36, 51], [53, 68]]) {
    patchOnLeftFace(grid, 14, a0, a1, 3, 4, K.panel); patchOnLeftFace(grid, 14, a0, a1, 17, 18, K.panel);
    patchOnLeftFace(grid, 14, a0, a0 + 1, 3, 18, K.panel); patchOnLeftFace(grid, 14, a1 - 1, a1, 3, 18, K.panel);
    patchOnLeftFace(grid, 14, a0 + 1, a1 - 1, 16, 17, K.panelLight);
  }
  patchOnLeftFace(grid, 14, 48, 50, 9, 11, K.knob); patchOnLeftFace(grid, 14, 55, 57, 9, 11, K.knob);
  ob(grid, 33, 71, 0, 15, 20, 2, K.top, K.topEdge);
  ob(grid, 38, 48, 2, 10, 22, 16, K.machine, K.machineEdge);
  patchOnLeftFace(grid, 10, 40, 46, 26, 34, K.machineFace); onLeftFace(grid, 10, 44, 45, 35, K.red); onLeftFace(grid, 10, 41, 42, 35, K.green);
  patchOnLeftFace(grid, 10, 42, 44, 31, 33, K.nozzle);
  art((layer) => { const { x, y } = iso(44, 12, 22); layer.rect(x - 2, y - 4, 4, 4, K.cup); layer.rect(x + 1, y - 4, 1, 4, K.cupShade); layer.rect(x - 2, y - 4, 4, 1, K.coffee); }, grid);
  art((layer) => {
    const { x, y } = iso(61, 7, 22);
    layer.ellipse(x, y - 1, 9, 3.4, K.plate); layer.ellipse(x, y - 1, 7, 2.4, K.plateShade);
    for (const [dx, dy, icing] of [[-4, -3, 0], [3, -3, 1], [0, -6, 0]] as const) {
      layer.ellipse(x + dx, y + dy, 3.2, 2.2, K.donut); layer.ellipse(x + dx, y + dy - 0.6, 2.8, 1.6, K.icing[icing]); layer.set(x + dx, y + dy - 1, K.donutHole);
      layer.set(x + dx - 2, y + dy - 1, K.sprinkles[0]); layer.set(x + dx + 1, y + dy - 2, K.sprinkles[1]); layer.set(x + dx + 2, y + dy - 1, K.sprinkles[2]);
    }
  }, grid);
}

/** The water cooler, in the back right corner: clear of the desks, its taps on the face towards the room. */
export const COOLER = { u: 114, v: 2, width: 12 } as const;

function paintCooler(grid: PixelGrid) {
  const K = C.cooler, { u, v, width } = COOLER, front = v + width;
  ob(grid, u, u + width, v, front, 0, 22, K.body, K.edge);
  patchOnLeftFace(grid, front, u + 2, u + 10, 8, 9, K.slot); patchOnLeftFace(grid, front, u + 2, u + 10, 9, 10, K.slotShade);
  patchOnLeftFace(grid, front, u + 3, u + 5, 13, 15, K.hot); patchOnLeftFace(grid, front, u + 7, u + 9, 13, 15, K.cold);
  art((layer) => {
    const { x, y } = iso(u + 6, v + 6, 22);
    layer.rect(x - 2, y - 3, 5, 3, K.neck);
    layer.ellipse(x + 0.5, y - 9, 6, 6.5, K.water); layer.ellipse(x - 0.2, y - 9.8, 5, 5.4, K.waterLight, [K.water]);
    layer.rect(x - 3, y - 15, 7, 3, K.waterLight); layer.rect(x + 2, y - 15, 2, 3, K.water);
    layer.rect(x - 1, y - 18, 3, 3, K.cap);
    layer.points([[x - 3, y - 12], [x - 3, y - 11], [x - 4, y - 10], [x - 4, y - 9], [x - 4, y - 8]], K.glint);
    layer.rect(x - 5, y - 8, 11, 1, K.cap);
  }, grid);
}


const cactus: Topper = (layer, x, y) => {
  const K = C.cactus;
  layer.rect(x - 3, y - 4, 7, 4, K.pot); layer.rect(x + 2, y - 4, 2, 4, K.potShade);
  layer.ellipse(x + 0.5, y - 7, 2.6, 3.4, K.body); layer.ellipse(x, y - 8, 1.4, 2.2, K.light, [K.body]);
  layer.set(x + 1, y - 11, K.flower); layer.set(x, y - 11, K.flower); layer.set(x + 1, y - 12, K.flowerLight);
};
const books: Topper = (layer, x, y) => {
  const B = C.books;
  layer.rect(x - 5, y - 3, 10, 3, B.blue); layer.rect(x - 5, y - 1, 10, 1, B.blueShade); layer.rect(x - 4, y - 6, 9, 3, B.red); layer.rect(x - 4, y - 4, 9, 1, B.redShade);
  layer.set(x - 4, y - 5, B.page); layer.set(x - 5, y - 2, B.page); layer.rect(x - 3, y - 9, 6, 3, B.yellow); layer.rect(x - 3, y - 7, 6, 1, B.yellowShade);
};
/** Where the monstera's pot and the floor lamp stand. */
export const MONSTERA = { u: 12, v: 12 } as const;
export const LAMP = { u: 10, v: 100 } as const;

/** The drawers of a project room; the front of the left wall is the door's. */
export const DRAWERS: readonly Drawers[] = [
  { u0: 78, u1: 90, v0: 2, v1: 12, height: 22, tones: C.drawer.lemon, face: 'left', topper: cactus },
  { u0: 2, u1: 14, v0: 82, v1: 96, height: 18, tones: C.drawer.mint, face: 'right', topper: books },
];


/** Where a festival's tree, pumpkins or balloons stand: by the water cooler, under the whiteboard. */
const FESTIVE_SPOT = { u: 100, v: 8 } as const;

/** The coffee counter along the right wall, between the back desks and the wall. */
export const COUNTER = { u0: 33, u1: 71, v0: 0, v1: 15 } as const;

/**
 * The four desks. The two at the back face the right wall (their people are seen from behind, their screens towards
 * us); the two on the right face the left wall (their people are seen from the front, behind the desk).
 */
const DESKS: readonly Desk[] = [
  { kind: 'back', u: 30, v: 24, length: 36 },
  { kind: 'back', u: 70, v: 24, length: 36 },
  { kind: 'side', u: 104, v: 57, length: 30 },
  { kind: 'side', u: 104, v: 90, length: 30 },
];

/** The couch along the left wall, under the window: two places at its two ends, facing the room. */
const COUCH: Couch = { u: 0, v: 34, depth: 18, length: 44 };
const COUCH_PLACES: readonly Place[] = [
  { u: 12, v: 42, direction: 'down-right', lift: 9 },
  { u: 12, v: 66, direction: 'down-right', lift: 9 },
];

/** Past the second back desk's chair and along the side desks' far end: the way to the room's back right corner. */
export const BACK_RIGHT = [[96, 50], [116, 40]] as const;

export const office: AmbianceDesign = {
  id: 'office',
  desks: DESKS,
  deskStyle: {
    top: C.desk, topEdge: C.deskEdge, leg: C.leg, drawers: [C.drawer.mint, C.drawer.pink],
    monitor: C.monitor, monitorEdge: C.monitorEdge, stand: C.stand, vents: C.vents, keyboard: C.keyboard, key: C.key,
    seats: C.chair.seats, chairBase: C.chair.base, chairPole: C.chair.pole, backThing: mug, sideThing: succulent,
  },
  couch: COUCH,
  couchPlaces: COUCH_PLACES,
  paintCouch: (grid) => paintCouch(grid, COUCH),
  paintCouchArm: (grid) => paintCouchArm(grid, COUCH),
  door: DOOR,
  paintDoor,
  paintBoard: paintWhiteboard,
  clock: ROOM_CLOCK,
  footprints: [
    around(MONSTERA.u, MONSTERA.v, 6, 40),
    { ...COUNTER, height: 38 },
    { u0: COOLER.u, u1: COOLER.u + COOLER.width, v0: COOLER.v, v1: COOLER.v + COOLER.width, height: 40 },
    ...DRAWERS.map(({ u0, u1, v0, v1, height }) => ({ u0, u1, v0, v1, height: height + 12 })),
    around(LAMP.u, LAMP.v, 3, 50),
  ],
  festiveSpot: FESTIVE_SPOT,
  // the counter stands behind the desks: only the gap between the two back desks gets a coffee; the water cooler
  // stands in the back right corner, clear of them
  visits: {
    entry: [50, 124], middle: [50, 84],
    spots: [
      { activity: 'coffee', at: [60, 19], facing: 0, via: [[64, 62], [65, 42]] },
      // in front of the cooler's taps, turned to them
      { activity: 'water', at: [120, 24], facing: 0, via: BACK_RIGHT },
      { activity: 'window', at: [28, 58], facing: 6, via: [[36, 66]] },
      { activity: 'books', at: [24, 92], facing: 6, via: [[34, 94]] },
    ],
    // between the drawers and the cooler, by the festival's tree or balloons
    party: [
      { activity: 'party', at: [104, 18], facing: 7, together: 3, via: BACK_RIGHT },
      { activity: 'party', at: [112, 30], facing: 7, together: 7, via: BACK_RIGHT },
    ],
  },
  paintRoom(grid, time) {
    paintFloor(grid);
    paintWalls(grid);
    paintWindow(grid, time);
  },
  dress(grid) {
    paintHangingPlant(grid, wallPoint('right', 22, 100), 26, 6);
    paintHangingPlant(grid, wallPoint('left', 121, 100), 16, -2);
    paintRug(grid);
    paintDoormat(grid);
  },
  standing: [
    standing(MONSTERA.u, MONSTERA.u, MONSTERA.v, MONSTERA.v, (grid) => paintMonstera(grid, MONSTERA.u, MONSTERA.v, OFFICE_POT)),
    standing(COUNTER.u0, COUNTER.u1, COUNTER.v0, COUNTER.v1, paintCounter),
    standing(COOLER.u, COOLER.u + COOLER.width, COOLER.v, COOLER.v + COOLER.width, paintCooler),
    ...DRAWERS.map((drawers) => standing(drawers.u0, drawers.u1, drawers.v0, drawers.v1, (grid) => paintDrawers(grid, drawers))),
    standing(LAMP.u, LAMP.u, LAMP.v, LAMP.v, (grid) => paintLamp(grid, LAMP)),
  ],
  light: { lamp: LAMP, glow: [C.counter.red, C.counter.green], sky: [] },
};
