// The cozy break room drawn (src/room/cozy/lounge.ts for where its places are): the project rooms' walls, floor, window,
// door and clock (decor.ts), a sage sofa under the window and a peach one along the right wall, a bookshelf in the back
// corner by a floor lamp, a coffee table with a game console on a mint rug, two beanbags, a tea corner with its kettle
// and teapot, an arcade cabinet, pictures and hanging plants. Drawn once per mood of the hour and festival, lights on
// while someone naps there, like the other rooms.
import type { Festival } from '../../../shared/festivals.ts';
import { COZY_PALETTE as C } from '../../design/room-palette.ts';
import { paintClockFace } from './clock.ts';
import {
  ROOM_CLOCK, newGrid, paintCouch, paintCouchArm, paintDoor, paintDoormat, paintFloor, paintHangingPlant, paintLamp, paintWalls, paintWindow,
  frontLayers, petLayers, pieceGrid, roomLight, standing, toCanvas, type RoomArt, type Standing,
} from './decor.ts';
import { FESTIVE_DECOR, paintFestiveFloor, paintFestiveWalls } from './festive.ts';
import { couchArmDepth, iso } from './geometry.ts';
import { ARCADE, BOOKSHELF, COFFEE_TABLE, LOUNGE_BEANBAGS, LOUNGE_COUCHES, LOUNGE_FESTIVE_SPOT, LOUNGE_PET, READING_LAMP, TEA_CORNER } from './lounge.ts';
import { onRightFace, outlined, outlinedBox, patchOnLeftFace, patchOnRightFace, tint, wallPatch, wallPixel, wallPoint, type PixelGrid, type Tones } from './pixels.ts';
import { cozyTimeOf, sceneCache, sceneKey, type CozyTime } from './time.ts';

const O = C.outline, L = C.lounge;
const ob = (grid: PixelGrid, u0: number, u1: number, v0: number, v1: number, z: number, height: number, tones: Tones, edge?: string) => outlinedBox(grid, u0, u1, v0, v1, z, height, tones, O, edge);
const art = (grid: PixelGrid, draw: (layer: PixelGrid) => void) => outlined(grid, draw, O);

const LAMP = READING_LAMP, TABLE = COFFEE_TABLE, TEA = TEA_CORNER, FESTIVE_SPOT = LOUNGE_FESTIVE_SPOT;

/** The bookshelf against the left wall in the back corner: its shelves face the room, full of books. */
function paintBookshelf(grid: PixelGrid) {
  const { u0, u1, v0, v1, height } = BOOKSHELF, B = C.books;
  ob(grid, u0, u1, v0, v1, 0, height, L.shelf, L.shelfEdge);
  const colours = [B.blue, B.red, B.yellow, C.drawer.mint[1], C.drawer.lilac[1], B.blueShade, C.drawer.pink[1]];
  for (let shelf = 0; shelf < 4; shelf++) {
    const z0 = 3 + shelf * 13;
    patchOnRightFace(grid, u1, v0 + 2, v1 - 2, z0, z0 + 10, L.shelfBack);
    for (let v = v0 + 2, index = shelf * 3; v < v1 - 2; index++) {
      const width = 1 + ((index * 5) % 3), tall = 6 + ((index * 7) % 4);
      if ((index * 11) % 9 === 4) { v += 2; continue; }
      patchOnRightFace(grid, u1, v, Math.min(v1 - 2, v + width), z0, z0 + tall, colours[index % colours.length]);
      v += width + 1;
    }
    onRightFace(grid, u1, v0 + 1, v1 - 1, z0 - 1, L.shelf[2]);
  }
}

/** The low table in the middle, a game console and its two pads on it, and a cup of tea. */
function paintCoffeeTable(grid: PixelGrid) {
  const { u0, u1, v0, v1 } = TABLE;
  for (const [u, v] of [[u0 + 1, v0 + 1], [u1 - 3, v0 + 1], [u0 + 1, v1 - 3], [u1 - 3, v1 - 3]]) ob(grid, u, u + 2, v, v + 2, 0, 9, L.tableLeg);
  ob(grid, u0, u1, v0, v1, 9, 3, L.table, L.tableEdge);
  ob(grid, u0 + 6, u0 + 14, v0 + 5, v0 + 11, 12, 3, L.console);
  patchOnLeftFace(grid, v0 + 11, u0 + 8, u0 + 10, 13, 14, C.led);
  art(grid, (layer) => {
    for (const [du, dv, colour] of [[2, 14, L.padLeft], [14, 13, L.padRight]] as const) {
      const { x, y } = iso(u0 + du, v0 + dv, 12);
      layer.rect(x - 3, y - 2, 7, 3, colour); layer.set(x - 3, y - 2, null); layer.set(x + 3, y - 2, null);
      layer.set(x + 1, y - 1, L.padButton); layer.set(x - 2, y - 1, tint(colour, 0.8));
    }
  });
  art(grid, (layer) => {
    const { x, y } = iso(u1 - 4, v0 + 4, 12);
    layer.rect(x - 2, y - 4, 4, 4, C.counter.cup); layer.rect(x + 1, y - 4, 1, 4, C.counter.cupShade); layer.rect(x - 2, y - 4, 4, 1, L.tea.teapotShade);
  });
}

/** A beanbag on the floor, (u, v) its middle: a soft blob, a dent where one sinks in. */
function paintBeanbag(grid: PixelGrid, u: number, v: number, tones: Tones) {
  const { x, y } = iso(u, v);
  art(grid, (layer) => {
    layer.ellipse(x, y - 4, 11, 7, tones[2]);
    layer.ellipse(x - 1, y - 6, 10, 6, tones[1], [tones[2]]);
    layer.ellipse(x - 3, y - 8, 5, 3, tones[0], [tones[1]]);
    layer.ellipse(x + 1, y - 6, 5, 2.4, tint(tones[1], 0.92), [tones[1], tones[0]]);
  });
}

/** The tea corner in the back right corner: a counter, a kettle, a teapot and its cups, a jar of cookies, a shelf of mugs. */
function paintTeaCorner(grid: PixelGrid) {
  const { u0, u1, v0, v1 } = TEA, K = C.counter, T = L.tea;
  ob(grid, u0, u1, v0, v1, 0, 20, K.body);
  for (const [a0, a1] of [[u0 + 2, u0 + 11], [u0 + 13, u1 - 2]]) {
    patchOnLeftFace(grid, v1, a0, a1, 3, 4, K.panel); patchOnLeftFace(grid, v1, a0, a1, 17, 18, K.panel);
    patchOnLeftFace(grid, v1, a0, a0 + 1, 3, 18, K.panel); patchOnLeftFace(grid, v1, a1 - 1, a1, 3, 18, K.panel);
  }
  ob(grid, u0 - 1, u1, v0, v1 + 1, 20, 2, K.top, K.topEdge);
  // the kettle, its spout towards the room
  ob(grid, u0 + 3, u0 + 9, v0 + 3, v0 + 9, 22, 8, T.kettle);
  art(grid, (layer) => {
    const { x, y } = iso(u0 + 6, v0 + 9, 26);
    layer.points([[x - 1, y], [x - 2, y + 1], [x - 3, y + 1]], T.spout);
    const top = iso(u0 + 6, v0 + 6, 30);
    layer.rect(top.x - 2, top.y - 2, 4, 1, T.spout); layer.rect(top.x - 3, top.y - 1, 1, 2, T.spout); layer.rect(top.x + 2, top.y - 1, 1, 2, T.spout);
  });
  // the teapot and two cups
  art(grid, (layer) => {
    const { x, y } = iso(u0 + 15, v0 + 7, 22);
    layer.ellipse(x, y - 3, 4.5, 3.4, T.teapot); layer.ellipse(x + 1, y - 2, 3, 2, T.teapotShade, [T.teapot]);
    layer.rect(x - 2, y - 7, 4, 1, T.lid); layer.set(x, y - 8, T.lid);
    layer.points([[x - 5, y - 3], [x - 6, y - 4], [x - 7, y - 5]], T.teapot); layer.points([[x + 5, y - 4], [x + 6, y - 3], [x + 5, y - 2]], T.teapotShade);
  });
  for (const [du, dv] of [[19, 10], [22, 6]] as const) {
    art(grid, (layer) => { const { x, y } = iso(u0 + du, v0 + dv, 22); layer.rect(x - 1, y - 3, 3, 3, C.counter.cup); layer.set(x + 1, y - 3, C.counter.cupShade); layer.set(x, y - 3, C.mug.coffee); });
  }
  // a jar of cookies on the far end
  art(grid, (layer) => {
    const { x, y } = iso(u1 - 3, v0 + 3, 22);
    layer.rect(x - 2, y - 6, 5, 6, T.jar); layer.rect(x - 2, y - 7, 5, 1, C.counter.knob);
    layer.set(x - 1, y - 3, T.cookie); layer.set(x + 1, y - 2, T.cookie); layer.set(x, y - 5, T.cookie);
  });
  // a shelf of mugs on the wall above
  wallPatch(grid, 'right', u0 + 2, u1 - 2, 50, 52, L.shelf[1]); wallPatch(grid, 'right', u0 + 2, u1 - 2, 51, 52, L.shelfEdge);
  for (const [a, colour] of [[u0 + 5, C.mug.body], [u0 + 11, C.drawer.mint[1]], [u0 + 17, C.drawer.lemon[1]]] as const) {
    wallPatch(grid, 'right', a, a + 4, 52, 56, colour); wallPixel(grid, 'right', a + 4, 54, colour);
  }
}

/** The arcade cabinet at the front left, by the door, its screen and its buttons towards the room's front. */
function paintArcade(grid: PixelGrid) {
  const { u0, u1, v0, v1, height } = ARCADE, A = L.arcade;
  ob(grid, u0, u1, v0, v1, 0, height, A.body, A.edge);
  ob(grid, u0, u1, v1, v1 + 4, 18, 3, A.body, A.edge);
  patchOnLeftFace(grid, v1, u0 + 2, u1 - 2, 26, 38, A.screen);
  for (const [a, z, index] of [[u0 + 4, 34, 0], [u0 + 7, 31, 1], [u0 + 9, 34, 3], [u0 + 5, 29, 2], [u0 + 10, 29, 0]] as const) patchOnLeftFace(grid, v1, a, a + 1, z, z + 1, A.pixel[index]);
  patchOnLeftFace(grid, v1, u0 + 1, u1 - 1, 40, 44, A.marquee); patchOnLeftFace(grid, v1, u0 + 2, u1 - 2, 42, 43, A.marqueeLight);
  art(grid, (layer) => {
    const { x, y } = iso(u0 + 4, v1 + 2, 21);
    layer.set(x, y - 2, A.stick); layer.set(x, y - 1, A.stick);
    A.buttons.forEach((colour, index) => { layer.set(x + 3 + index * 2, y - 1 + index, colour); });
  });
}

/** Two pictures above the peach sofa, on either side of the clock: hills under a sun, a heart. */
function paintPictures(grid: PixelGrid) {
  const P = L.picture, wall = 'right' as const;
  wallPatch(grid, wall, 34, 48, 44, 60, O); wallPatch(grid, wall, 35, 47, 45, 59, P.frame); wallPatch(grid, wall, 36, 46, 46, 58, P.sky);
  wallPatch(grid, wall, 36, 46, 46, 50, P.hill); wallPatch(grid, wall, 40, 46, 46, 52, P.hillShade); wallPatch(grid, wall, 37, 39, 54, 56, P.sun);
  wallPatch(grid, wall, 66, 80, 44, 58, O); wallPatch(grid, wall, 67, 79, 45, 57, P.frameLight); wallPatch(grid, wall, 68, 78, 46, 56, P.mat);
  const [x, y] = wallPoint(wall, 73, 53);
  art(grid, (layer) => layer.pattern(x - 2, y - 1, ['hh.hh', 'hhhhh', '.hhh.', '..h..'], { h: P.heart }));
}

/** The mint rug in the middle, a ring of leaves on it. */
function paintRug(grid: PixelGrid) {
  const R = L.rug, { x, y } = iso(58, 58);
  grid.ellipse(x, y + 1, 36, 18, R.edgeShade); grid.ellipse(x, y, 36, 18, R.edge);
  grid.ellipse(x, y, 35, 17, R.base); grid.ellipse(x, y, 28, 13.6, R.ring); grid.ellipse(x, y, 20, 9.6, R.middle);
  for (let index = 0; index < 24; index++) { const angle = index / 24 * Math.PI * 2; grid.set(Math.round(x + Math.cos(angle) * 31.5), Math.round(y + Math.sin(angle) * 15.2), index % 2 ? R.dots : R.leaf); }
}

function build(lit: boolean, time: CozyTime, festival: Festival | null): RoomArt {
  const back = newGrid();
  paintFloor(back);
  paintWalls(back);
  paintWindow(back, time);
  paintDoor(back);
  paintPictures(back);
  paintClockFace(back, ROOM_CLOCK);
  if (festival) paintFestiveWalls(back, festival);
  paintHangingPlant(back, wallPoint('right', 96, 100), 24, 4);
  paintHangingPlant(back, wallPoint('left', 121, 100), 16, -2);
  paintRug(back);
  paintDoormat(back);
  const [left, right] = LOUNGE_COUCHES;
  const [nearDoor, nearTea] = LOUNGE_BEANBAGS;
  const floor: Standing[] = [
    standing(BOOKSHELF.u0, BOOKSHELF.u1, BOOKSHELF.v0, BOOKSHELF.v1, paintBookshelf),
    standing(LAMP.u, LAMP.u, LAMP.v, LAMP.v, (grid) => paintLamp(grid, LAMP)),
    standing(left.u, left.u + left.depth, left.v, left.v + left.length, (grid) => paintCouch(grid, left, L.sage, 3, 23)),
    standing(right.u, right.u + right.length, right.v, right.v + right.depth, (grid) => paintCouch(grid, right, L.peach, 3, 41)),
    standing(TABLE.u0, TABLE.u1, TABLE.v0, TABLE.v1, paintCoffeeTable),
    standing(TEA.u0, TEA.u1, TEA.v0, TEA.v1, paintTeaCorner),
    standing(nearDoor.u, nearDoor.u, nearDoor.v, nearDoor.v, (grid) => paintBeanbag(grid, nearDoor.u, nearDoor.v, C.chair.seats[0])),
    standing(nearTea.u, nearTea.u, nearTea.v, nearTea.v, (grid) => paintBeanbag(grid, nearTea.u, nearTea.v, C.chair.seats[1])),
    standing(ARCADE.u0, ARCADE.u1, ARCADE.v0, ARCADE.v1, paintArcade),
  ];
  if (festival && FESTIVE_DECOR[festival].floor) floor.push(standing(FESTIVE_SPOT.u, FESTIVE_SPOT.u, FESTIVE_SPOT.v, FESTIVE_SPOT.v, (grid) => paintFestiveFloor(grid, festival, FESTIVE_SPOT.u, FESTIVE_SPOT.v)));
  floor.sort((a, b) => a.depth - b.depth);
  for (const { paint } of floor) paint(back);
  const A = L.arcade;
  const light = roomLight(lit, time, LAMP, [{ u: (ARCADE.u0 + ARCADE.u1) / 2, v: ARCADE.v1 + 4 }], [A.screen, ...A.pixel, A.marquee, A.marqueeLight, C.led]);
  // the sofas' front arms stand in front of whoever naps at that end
  const pieces = [
    { depth: couchArmDepth(left), paint: (grid: PixelGrid) => paintCouchArm(grid, left, L.sage) },
    { depth: couchArmDepth(right), paint: (grid: PixelGrid) => paintCouchArm(grid, right, L.peach) },
  ];
  return {
    back: toCanvas(back, light),
    pieces: pieces.map(({ depth, paint }) => ({ depth, canvas: toCanvas(pieceGrid(depth, paint, floor), light) })),
    petLayer: petLayers(floor, light, LOUNGE_PET),
    frontOf: frontLayers(floor, light),
  };
}

const built = sceneCache<RoomArt>();
/** The break room with its lights on (someone naps there) or off at an hour (its mood) and on a festival, drawn once for each. */
export function loungeArt(lit: boolean, hour: number, festival: Festival | null): RoomArt {
  return built(sceneKey(hour, festival), `${lit}`, () => build(lit, cozyTimeOf(hour), festival));
}

