// The user's home drawn (src/room/cozy/home/): its back layer, lit, and what stands in front of the user, each drawn
// once per theme, mood of the hour and festival on a canvas of its own; each frame, its animations over them (the
// screens, the fire, the snow...), its clock's hands, a white line around the computer or the clock under the pointer,
// and the user and their pet, each behind what stands in front of them.
import type { Festival } from '../../../../shared/festivals.ts';
import type { HomeTheme } from '../../../../shared/protocol.ts';
import { COZY_HOME_PALETTE } from '../../../design/room-palette.ts';
import { clockHands, clockOutline, paintClockFace } from '../clock.ts';
import { FESTIVE_GLOW, paintFestiveFloor, paintFestiveWalls } from '../festive.ts';
import { insideConvex, type Point } from '../../geometry.ts';
import { festiveFootprints, hides } from '../floor.ts';
import { ROOM_BOX, cozyDepth, footprintOutline, iso, type Footprint } from '../geometry.ts';
import { SKY_GLOW, homeLightAt, lightingOf, outsideAt } from '../light.ts';
import { outlineOf, type PixelGrid } from '../pixels.ts';
import { cozyTimeOf, sceneCache, sceneKey, type CozyTime } from '../time.ts';
import { HOME_DESIGNS, metricsPainter } from './index.ts';
import { METRICS_GLOW, chairBackOf, newGrid, paintMetricsScreen, type CallFace } from './kit.ts';

interface HomeArt {
  back: HTMLCanvasElement;
  /** the back of the desk's chair */
  front: HTMLCanvasElement;
  /** what hangs from the ceiling */
  overhead: HTMLCanvasElement;
  /**
   * What of the back layer stands in front of the user at (u, v): its furniture hiding them there (floor.ts hides),
   * cut out of it, each such layer drawn the first time it is asked for (null: nothing hides them).
   */
  frontOf: (u: number, v: number) => HTMLCanvasElement | null;
  /** for each animation, the cells of the back layer it is drawn over */
  masks: Record<string, Uint8Array>;
  /** how bright the light is where the user sits (1: daylight): the user is drawn through it, like the rest of the room */
  userLight: number;
  /** how bright the light is at a point of the room's pixels: the pet is drawn through it where it is */
  brightness: (point: Point) => number;
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

/** The cells of the room's box `box`'s outline (footprintOutline) covers, by a pixel's corners: its outline's pixels too. */
function coveredBy(box: Footprint): Uint8Array {
  const outline = footprintOutline(box), cells = new Uint8Array(ROOM_BOX.width * ROOM_BOX.height);
  const xs = outline.map(({ x }) => x), ys = outline.map(({ y }) => y);
  for (let y = Math.max(0, Math.floor(Math.min(...ys)) - 1); y < Math.min(ROOM_BOX.height, Math.ceil(Math.max(...ys)) + 1); y++) {
    for (let x = Math.max(0, Math.floor(Math.min(...xs)) - 1); x < Math.min(ROOM_BOX.width, Math.ceil(Math.max(...xs)) + 1); x++) {
      if ([[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]].some(([px, py]) => insideConvex({ x: px, y: py }, outline))) cells[y * ROOM_BOX.width + x] = 1;
    }
  }
  return cells;
}

/** For someone at (u, v), the furniture of the lit back layer `back` that hides them, cut out of it (floor.ts hides). */
function cutOuts(back: PixelGrid, furniture: readonly Footprint[]): (u: number, v: number) => HTMLCanvasElement | null {
  const covered = new Map<number, Uint8Array>(), made = new Map<string, HTMLCanvasElement>();
  return (u, v) => {
    const hiding = furniture.flatMap((box, index) => (hides(box, u, v) ? [index] : []));
    if (!hiding.length) return null;
    const key = hiding.join(',');
    let canvas = made.get(key);
    if (!canvas) {
      const masks = hiding.map((index) => {
        let mask = covered.get(index);
        if (!mask) { mask = coveredBy(furniture[index]); covered.set(index, mask); }
        return mask;
      });
      const cut = newGrid();
      back.cells.forEach((colour, index) => { if (colour && masks.some((mask) => mask[index])) cut.cells[index] = colour; });
      canvas = toCanvas(cut, (colour) => colour);
      made.set(key, canvas);
    }
    return canvas;
  };
}

function build(theme: HomeTheme, time: CozyTime, festival: Festival | null): HomeArt {
  const design = HOME_DESIGNS[theme];
  const back = newGrid();
  design.back(back);
  paintClockFace(back, design.clock);
  paintMetricsScreen(back, design.metrics);
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
  const light = lightingOf(homeLightAt(design.lighting, design.outside.mood, time), new Set([...design.glow, ...SKY_GLOW, ...FESTIVE_GLOW, ...METRICS_GLOW]));
  const front = newGrid(), overhead = newGrid();
  design.front?.(front);
  design.overhead?.(overhead);
  // the probe's white seen at a point, its channels averaged over a few pixels (the light's bands are dithered)
  const brightness = ({ x, y }: Point) => {
    let sum = 0;
    for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 4; dx++) {
      const value = Number.parseInt(light(COZY_HOME_PALETTE.lightProbe, Math.round(x) + dx, Math.round(y) + dy).slice(1), 16);
      sum += (((value >> 16) & 255) + ((value >> 8) & 255) + (value & 255)) / 3 / 255;
    }
    return Math.min(1, sum / 16);
  };
  const backCanvas = toCanvas(back, light);
  return {
    back: backCanvas, front: toCanvas(front, light), overhead: toCanvas(overhead, light), masks,
    frontOf: cutOuts(back, [...design.furniture, ...festiveFootprints(festival, design.festiveSpot)]),
    // around the user's head
    userLight: brightness(iso(design.seat.u, design.seat.v, design.seat.z + 20)), brightness,
  };
}

const built = sceneCache<HomeArt>();
/** A home drawn the first time it is asked for, kept until the mood of the hour or the festival changes (time.ts sceneKey). */
const artOf = (theme: HomeTheme, hour: number, festival: Festival | null) =>
  built(sceneKey(hour, festival), theme, () => build(theme, cozyTimeOf(hour), festival));

/** What is outlined under the pointer in a home: the user's computer (a click opens a terminal), its numbers screen (the mods) or its clock (the time). */
export type HomeThing = 'computer' | 'metrics' | 'clock';

/**
 * What a frame of the home reads beyond its theme: the hour (its light, its clock), the festival, the call on its
 * screen, what is under the pointer.
 */
export interface HomeFrame { frame: number; hour: number; festival: Festival | null; faces: readonly CallFace[]; hovered: HomeThing | null }

/**
 * Someone at home, the user or their pet: where they stand or sit on the floor, how they are drawn there, and where the
 * light falling on them is read (in the room's pixels; null: the user's seat).
 */
export interface HomeFigure { u: number; v: number; paint: () => void; lightAt: Point | null }

/**
 * The home on the room's canvas (its transform set by the caller), the user and their pet in it, the one further back
 * first: in front of the desk's chair once in front of it, each behind the furniture that stands in front of them.
 */
export function paintHome(context: CanvasRenderingContext2D, theme: HomeTheme, { frame, hour, festival, faces, hovered }: HomeFrame, figures: readonly HomeFigure[]) {
  const design = HOME_DESIGNS[theme], art = artOf(theme, hour, festival);
  context.drawImage(art.back, 0, 0);
  context.drawImage(clockHands(design.clock, hour), 0, 0);
  if (hovered === 'clock') context.drawImage(clockOutline(design.clock), 0, 0);
  design.animate(context, frame, { masks: art.masks, faces, time: cozyTimeOf(hour) });
  // the line around the computer goes behind the user, who sits in front of it
  if (hovered === 'computer') context.drawImage(outlineOf(design.computer), 0, 0);
  if (hovered === 'metrics') context.drawImage(outlineOf(metricsPainter(theme)), 0, 0);
  const draw = (figure: HomeFigure) => {
    const light = figure.lightAt ? art.brightness(figure.lightAt) : art.userLight;
    // where the canvas has no filters (an older Safari), they are drawn as they are
    context.save();
    if (light < 0.97) context.filter = `brightness(${light.toFixed(2)})`;
    figure.paint();
    context.restore();
    const hiding = art.frontOf(figure.u, figure.v);
    if (hiding) context.drawImage(hiding, 0, 0);
  };
  const ordered = [...figures].sort((a, b) => cozyDepth(a.u, a.v) - cozyDepth(b.u, b.v)), chair = chairBackOf(design.seat);
  const behindChair = ordered.filter(({ u, v }) => hides(chair, u, v));
  behindChair.forEach(draw);
  context.drawImage(art.front, 0, 0);
  for (const figure of ordered) if (!behindChair.includes(figure)) draw(figure);
  context.drawImage(art.overhead, 0, 0);
  design.animateFront?.(context, frame);
}
