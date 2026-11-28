// The user's home drawn (src/room/cozy/home/): its back layer, lit, and what stands in front of the user, each drawn
// once per theme, pet, mood of the hour and festival on a canvas of its own; each frame, its animations over them (the
// screens, the fire, the snow...), its clock's hands, the pet's Z's, and a white line around the computer or the clock
// under the pointer.
import type { Festival } from '../../../../shared/festivals.ts';
import type { HomeTheme } from '../../../../shared/protocol.ts';
import { COZY_HOME_PALETTE } from '../../../design/room-palette.ts';
import { clockHands, clockOutline, paintClockFace } from '../clock.ts';
import { paintZzzAt } from '../decor.ts';
import { FESTIVE_GLOW, paintFestiveFloor, paintFestiveWalls } from '../festive.ts';
import { ROOM_BOX, iso } from '../geometry.ts';
import { SKY_GLOW, homeLightAt, lightingOf, outsideAt } from '../light.ts';
import { hoverOutline, type PixelGrid } from '../pixels.ts';
import { petKey, petPixels, petZzzAt, type CozyPet } from '../pet.ts';
import { cozyTimeOf, sceneKey, type CozyTime } from '../time.ts';
import { HOME_DESIGNS } from './index.ts';
import { newGrid, type CallFace } from './kit.ts';

interface HomeArt {
  back: HTMLCanvasElement;
  front: HTMLCanvasElement;
  /** for each animation, the cells of the back layer it is drawn over */
  masks: Record<string, Uint8Array>;
  /** how bright the light is where the user sits (1: daylight): the user is drawn through it, like the rest of the room */
  userLight: number;
}

function toCanvas(grid: PixelGrid, light: (colour: string, x: number, y: number) => string): HTMLCanvasElement {
  grid.recolour(light);
  const canvas = document.createElement('canvas');
  canvas.width = ROOM_BOX.width;
  canvas.height = ROOM_BOX.height;
  grid.paint(canvas.getContext('2d')!);
  return canvas;
}

/** The window's sky, sun or moon, stars and the city's lit windows at `time`; a star by day takes the sky beside it. */
function showOutside(grid: PixelGrid, changes: ReadonlyMap<string, string | null>) {
  if (!changes.size) return;
  const before = grid.cells.slice();
  grid.recolour((colour, x, y) => {
    if (!changes.has(colour)) return colour;
    const next = changes.get(colour);
    if (next) return next;
    for (const dx of [-1, 1, -2, 2]) {
      const beside = before[(y - grid.y0) * grid.width + (x - grid.x0 + dx)];
      if (beside && changes.get(beside)) return changes.get(beside)!;
    }
    return colour;
  });
}

function build(theme: HomeTheme, pet: CozyPet | null, time: CozyTime, festival: Festival | null): HomeArt {
  const design = HOME_DESIGNS[theme];
  const back = newGrid();
  design.back(back, pet && petPixels(pet));
  paintClockFace(back, design.clock);
  if (festival) {
    paintFestiveWalls(back, festival);
    paintFestiveFloor(back, festival, design.festiveSpot.u, design.festiveSpot.v);
  }
  // the masks are taken before the light changes the colours
  const masks = Object.fromEntries(Object.entries(design.masks).map(([name, colours]) => {
    const over = new Set<string>(colours), mask = new Uint8Array(back.cells.length);
    back.cells.forEach((colour, index) => { if (colour && over.has(colour)) mask[index] = 1; });
    return [name, mask];
  }));
  showOutside(back, outsideAt(design.outside, time));
  const light = lightingOf(homeLightAt(design.lighting, design.outside.mood, time), new Set([...design.glow, ...SKY_GLOW, ...FESTIVE_GLOW]));
  const front = newGrid();
  design.front?.(front);
  // the probe's white seen around the user's head, its channels averaged over a few pixels (the light's bands are dithered)
  const head = iso(design.seat.u, design.seat.v, design.seat.z + 20);
  let sum = 0;
  for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 4; dx++) {
    const value = Number.parseInt(light(COZY_HOME_PALETTE.lightProbe, head.x + dx, head.y + dy).slice(1), 16);
    sum += (((value >> 16) & 255) + ((value >> 8) & 255) + (value & 255)) / 3 / 255;
  }
  return {
    back: toCanvas(back, light), front: toCanvas(front, light), masks,
    userLight: Math.min(1, sum / 16),
  };
}

const built = new Map<string, HomeArt>();
let builtFor = '';
/** A home drawn the first time it is asked for, kept until the mood of the hour or the festival changes (time.ts sceneKey). */
const artOf = (theme: HomeTheme, pet: CozyPet | null, hour: number, festival: Festival | null) => {
  const scene = sceneKey(hour, festival);
  if (scene !== builtFor) { built.clear(); builtFor = scene; }
  const key = `${theme}:${petKey(pet)}`;
  let art = built.get(key);
  if (!art) { art = build(theme, pet, cozyTimeOf(hour), festival); built.set(key, art); }
  return art;
};

/** The user's computer alone, outlined: the same line around it for a theme, drawn once. */
const computers = new Map<HomeTheme, HTMLCanvasElement>();
const computerOutline = (theme: HomeTheme) => {
  let canvas = computers.get(theme);
  if (!canvas) { canvas = hoverOutline((grid) => HOME_DESIGNS[theme].computer(grid)); computers.set(theme, canvas); }
  return canvas;
};

/** What is outlined under the pointer in a home: the user's computer (a click opens a terminal) or its clock (the time). */
export type HomeThing = 'computer' | 'clock';

/**
 * What a frame of the home reads beyond its theme: the user's pet or none, the hour (its light, its clock), the
 * festival, the call on its screen, what is under the pointer.
 */
export interface HomeFrame { pet: CozyPet | null; frame: number; hour: number; festival: Festival | null; faces: readonly CallFace[]; hovered: HomeThing | null }

/** The home on the room's canvas (its transform set by the caller): `paintUser` draws the user at their desk. */
export function paintHome(context: CanvasRenderingContext2D, theme: HomeTheme, { pet, frame, hour, festival, faces, hovered }: HomeFrame, paintUser: () => void) {
  const design = HOME_DESIGNS[theme], art = artOf(theme, pet, hour, festival);
  context.drawImage(art.back, 0, 0);
  context.drawImage(clockHands(design.clock, hour), 0, 0);
  if (hovered === 'clock') context.drawImage(clockOutline(design.clock), 0, 0);
  design.animate(context, frame, { masks: art.masks, faces, time: cozyTimeOf(hour) });
  // the line around the computer goes behind the user, who sits in front of it
  if (hovered === 'computer') context.drawImage(computerOutline(theme), 0, 0);
  // where the canvas has no filters (an older Safari), the user is drawn as they are
  context.save();
  if (art.userLight < 0.97) context.filter = `brightness(${art.userLight.toFixed(2)})`;
  paintUser();
  context.restore();
  context.drawImage(art.front, 0, 0);
  design.animateFront?.(context, frame);
  const zzz = pet && petZzzAt(pet, petPixels(pet), design.petSpot.x, design.petSpot.y);
  if (zzz) paintZzzAt(context, ...zzz, frame);
}
