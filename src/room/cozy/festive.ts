// What the cozy rooms put up for a festival (shared/festivals.ts, the same day as the classic rooms: useFestival, and
// the "try a festival" preview), in their own pixels: along the top of both walls bunting, a pine garland with its
// bulbs, red lanterns or a string of hearts, a cobweb in the corner at Halloween; and in a free corner of the floor a
// tree, pumpkins, balloons or a basket of eggs. Drawn once, with the room's art (decor.ts, home/art.ts). Pure: no DOM.
import type { Festival } from '../../../shared/festivals.ts';
import { COZY_PALETTE as C, ROOM_PALETTE } from '../../design/room-palette.ts';
import { ROOM_UNITS, WALL_HEIGHT, iso } from './geometry.ts';
import { outlined, wallEllipse, wallPatch, wallPixel, type PixelGrid, type Wall } from './pixels.ts';

const F = ROOM_PALETTE.festive, Y = ROOM_PALETTE.halloween, K = C.festive;

type WallDecor = { kind: 'bunting'; flags: readonly string[]; string: string } | { kind: 'pine' } | { kind: 'lanterns' } | { kind: 'hearts' };
type FloorDecor = { kind: 'tree' } | { kind: 'pumpkins' } | { kind: 'balloons'; colours: readonly string[] } | { kind: 'eggs' };

/** What each festival puts up in a cozy room: on its walls, on its floor, a cobweb. */
export interface FestiveDecor { walls: WallDecor; floor?: FloorDecor; cobweb?: boolean }

const bunting = (flags: readonly string[], string: string = F.white): WallDecor => ({ kind: 'bunting', flags, string });

export const FESTIVE_DECOR: Readonly<Record<Festival, FestiveDecor>> = {
  newYear: { walls: bunting([F.gold, F.silver, F.black], F.goldDark), floor: { kind: 'balloons', colours: [F.gold, F.silver, F.gold] } },
  epiphany: { walls: bunting([F.gold, F.blue, F.white], F.goldDark) },
  chineseNewYear: { walls: { kind: 'lanterns' } },
  candlemas: { walls: bunting([F.crepe, F.gold, F.crepeDark], F.trunk) },
  valentine: { walls: { kind: 'hearts' } },
  songkran: { walls: bunting([F.red, F.gold, F.blue, F.green, F.pink]) },
  easter: { walls: bunting(F.eggs), floor: { kind: 'eggs' } },
  mayDay: { walls: bunting([F.lily, F.leaf], F.leaf) },
  music: { walls: bunting([F.black, F.red, F.white], F.black) },
  bastille: { walls: bunting(F.tricolor) },
  summer: { walls: bunting([F.gold, F.blue, F.white, F.kumquat]) },
  birthday: { walls: bunting(F.balloons), floor: { kind: 'balloons', colours: F.balloons } },
  halloween: { walls: bunting([Y.pumpkin, F.black, Y.bulbPurple], Y.wire), floor: { kind: 'pumpkins' }, cobweb: true },
  christmas: { walls: { kind: 'pine' }, floor: { kind: 'tree' } },
};

/** What a festival's decorations shine with: their colours are never darkened by the room's light. */
export const FESTIVE_GLOW: readonly string[] = [...F.bulbs, K.pumpkinGlow, F.lanternGlow];

const WALLS: readonly Wall[] = ['left', 'right'];
/** The string along the top of the walls: hooked every SPAN units, sagging between. */
const SPAN = 30;
const stringAt = (a: number, top: number, sag: number) => Math.round(top - sag * Math.sin(Math.PI * (((a - 2) % SPAN) / SPAN)));

function paintBunting(grid: PixelGrid, flags: readonly string[], string: string) {
  const top = WALL_HEIGHT - 5;
  for (const wall of WALLS) {
    for (let a = 2; a < ROOM_UNITS - 2; a++) wallPixel(grid, wall, a, stringAt(a, top, 4), string);
    for (let a = 6, index = 0; a < ROOM_UNITS - 4; a += 6, index++) {
      const z = stringAt(a, top, 4), colour = flags[index % flags.length];
      [2, 2, 1, 1, 0].forEach((half, down) => { wallPatch(grid, wall, a - half, a + half + 1, z - 1 - down, z - down, colour); });
    }
  }
}

function paintPine(grid: PixelGrid) {
  const top = WALL_HEIGHT - 4;
  for (const wall of WALLS) {
    for (let a = 2; a < ROOM_UNITS - 2; a++) {
      const z = stringAt(a, top, 5);
      for (let dz = -2; dz <= 1; dz++) wallPixel(grid, wall, a, z + dz, (a * 3 + dz * 5 + 70) % 7 < 3 ? F.pineDark : F.pine);
    }
    for (let a = 5, index = 0; a < ROOM_UNITS - 3; a += 7, index++) {
      const z = stringAt(a, top, 5) - 3;
      wallPatch(grid, wall, a, a + 2, z - 1, z + 1, F.bulbs[index % F.bulbs.length]);
    }
  }
}

function paintLanterns(grid: PixelGrid) {
  for (const wall of WALLS) for (const a of [26, 64, 102]) {
    wallPatch(grid, wall, a, a + 1, 82, WALL_HEIGHT, F.gold);
    wallEllipse(grid, wall, a + 0.5, 76, 5, 6, F.lantern);
    wallEllipse(grid, wall, a - 0.8, 77, 2, 3, F.lanternGlow);
    wallPatch(grid, wall, a - 3, a + 4, 81, 83, F.gold); wallPatch(grid, wall, a - 3, a + 4, 69, 71, F.gold);
    wallPatch(grid, wall, a, a + 1, 63, 69, F.gold);
  }
}

const HEART = ['.h.h.', 'hhhhh', 'hhhhh', '.hhh.', '..h..'];

function paintHearts(grid: PixelGrid) {
  const top = WALL_HEIGHT - 5;
  for (const wall of WALLS) {
    for (let a = 2; a < ROOM_UNITS - 2; a++) wallPixel(grid, wall, a, stringAt(a, top, 4), F.rose);
    for (let a = 8, index = 0; a < ROOM_UNITS - 6; a += 10, index++) {
      const z = stringAt(a, top, 4) - 1, colour = index % 2 ? F.pink : F.heart;
      HEART.forEach((row, down) => { [...row].forEach((letter, across) => { if (letter === 'h') wallPixel(grid, wall, a - 2 + across, z - down, colour); }); });
    }
  }
}

/** A cobweb in the corner where the two walls meet, under the ceiling. */
function paintCobweb(grid: PixelGrid) {
  for (const wall of WALLS) {
    for (const slope of [0.35, 1, 2.6]) for (let step = 0; step < 16; step++) {
      const a = Math.round(step / Math.sqrt(1 + slope * slope)), z = WALL_HEIGHT - 1 - Math.round(step * slope / Math.sqrt(1 + slope * slope));
      wallPixel(grid, wall, a, z, Y.web);
    }
    for (const radius of [6, 11]) for (let angle = 0; angle <= 90; angle += 9) {
      const turn = angle * Math.PI / 180;
      wallPixel(grid, wall, Math.round(Math.sin(turn) * radius), WALL_HEIGHT - 1 - Math.round(Math.cos(turn) * radius), Y.web);
    }
  }
}

/** The festival's decorations on the walls (with a cobweb at Halloween). */
export function paintFestiveWalls(grid: PixelGrid, festival: Festival) {
  const { walls, cobweb } = FESTIVE_DECOR[festival];
  if (walls.kind === 'bunting') paintBunting(grid, walls.flags, walls.string);
  else if (walls.kind === 'pine') paintPine(grid);
  else if (walls.kind === 'lanterns') paintLanterns(grid);
  else paintHearts(grid);
  if (cobweb) paintCobweb(grid);
}

/* On the floor, at (u, v), each thing outlined like the rest of the room */

const art = (grid: PixelGrid, draw: (layer: PixelGrid) => void) => outlined(grid, draw, C.outline);

function paintTree(grid: PixelGrid, x: number, y: number) {
  const P = K.treePot;
  art(grid, (layer) => { layer.rect(x - 5, y - 7, 11, 7, P[1]); layer.rect(x - 5, y - 7, 3, 7, P[0]); layer.rect(x + 3, y - 7, 3, 7, P[2]); layer.rect(x - 6, y - 8, 13, 2, P[0]); });
  art(grid, (layer) => {
    layer.rect(x - 1, y - 12, 3, 5, F.trunk);
    for (const [bottom, half, height] of [[11, 13, 10], [18, 11, 10], [25, 8, 9], [31, 5, 8]] as const) {
      for (let row = 0; row < height; row++) {
        const width = Math.round(half * (row + 1) / height);
        for (let dx = -width; dx <= width; dx++) layer.set(x + dx, y - bottom - height + 1 + row, dx > width / 3 ? F.pineDark : F.pine);
      }
    }
  });
  F.bulbs.forEach((colour, index) => { const [dx, dy] = [[-6, 14], [5, 16], [-3, 22], [3, 25], [0, 31]][index]; grid.set(x + dx, y - dy, colour); grid.set(x + dx + 1, y - dy, colour); });
  art(grid, (layer) => layer.pattern(x - 2, y - 42, ['..g..', '.ggg.', 'ggggg', '.g.g.'], { g: F.gold }));
}

function paintPumpkin(grid: PixelGrid, x: number, y: number, size: number) {
  art(grid, (layer) => {
    layer.ellipse(x, y - size, size * 1.4, size, Y.pumpkinDark);
    layer.ellipse(x - 0.6, y - size - 0.4, size * 1.2, size * 0.85, Y.pumpkin, [Y.pumpkinDark]);
    layer.rect(x - 1, y - size * 2 - 2, 2, 3, Y.stem);
  });
  // a carved face, glowing
  const eyes = Math.round(y - size - 1), mouth = Math.round(y - size + 1);
  grid.points([[x - 3, eyes], [x + 2, eyes], [x - 2, mouth], [x - 1, mouth], [x, mouth], [x + 1, mouth]], K.pumpkinGlow);
}

function paintBalloons(grid: PixelGrid, x: number, y: number, colours: readonly string[]) {
  art(grid, (layer) => { layer.rect(x - 2, y - 3, 5, 3, F.gold); layer.rect(x - 2, y - 3, 5, 1, F.goldDark); });
  const tops = [[-6, 40], [5, 44], [0, 33]] as const;
  for (const [dx, dy] of tops) grid.line(x, y - 3, x + dx, y - dy + 6, K.string);
  tops.forEach(([dx, dy], index) => {
    const colour = colours[index % colours.length];
    art(grid, (layer) => { layer.ellipse(x + dx, y - dy, 4.5, 5.5, colour); layer.set(x + dx, y - dy + 6, colour); });
    grid.set(x + dx - 2, y - dy - 2, K.balloonShine);
  });
}

function paintEggs(grid: PixelGrid, x: number, y: number) {
  const B = K.basket;
  art(grid, (layer) => { for (let dx = -9; dx <= 9; dx++) layer.set(x + dx, y - 12 - Math.round(Math.sqrt(Math.max(0, 81 - dx * dx)) / 2), B[0]); });
  F.eggs.slice(0, 4).forEach((colour, index) => { art(grid, (layer) => { layer.ellipse(x - 6 + index * 4, y - 8 - (index % 2), 2, 2.8, colour); }); });
  art(grid, (layer) => {
    layer.ellipse(x, y - 3, 9, 4, B[1]); layer.rect(x - 9, y - 6, 19, 3, B[1]);
    for (let dx = -8; dx <= 8; dx += 3) layer.set(x + dx, y - 4, B[2]);
    layer.rect(x - 8, y - 7, 17, 1, K.grass);
  });
}

/** The festival's thing on the floor at (u, v), if it has one: true when it had. */
export function paintFestiveFloor(grid: PixelGrid, festival: Festival, u: number, v: number): boolean {
  const floor = FESTIVE_DECOR[festival].floor;
  if (!floor) return false;
  const { x, y } = iso(u, v);
  if (floor.kind === 'tree') paintTree(grid, x, y);
  else if (floor.kind === 'pumpkins') { paintPumpkin(grid, x - 7, y - 2, 4); paintPumpkin(grid, x + 6, y - 1, 3); paintPumpkin(grid, x, y + 3, 5); }
  else if (floor.kind === 'balloons') paintBalloons(grid, x, y, floor.colours);
  else paintEggs(grid, x, y);
  return true;
}
