// The cozy rooms' geometry (src/room/cozy/): one small isometric room per project, drawn one art pixel to one room
// pixel, the rooms of the overview tiled like a honeycomb, and what a click falls on. Pure: tested without a DOM.
//
// A room's floor runs 0 to ROOM_UNITS along u (towards the bottom right) and along v (towards the bottom left); its far
// corner is at the back, where its two walls meet. Two units across are one pixel down (a 2:1 isometric grid).
import { insideConvex, onFigure, type Point } from '../geometry.ts';
import type { Direction } from '../sprites.ts';

/** The floor's side, in units. */
export const ROOM_UNITS = 128;
/** The walls' height and thickness, in units (pixels up for the height). */
export const WALL_HEIGHT = 100;
export const WALL_THICKNESS = 6;
/** Where the far corner of the floor lands in the room's box. */
export const ORIGIN: Point = { x: 136, y: 110 };
/** A room's box, walls included: the size of its canvas. */
export const ROOM_BOX = { width: 272, height: 242 } as const;
/** Between two rooms of the overview, in room pixels. */
export const ROOM_GAP = 10;
/**
 * The band above the rooms where the speech bubbles go (like the classic room's, see bubbles.ts BUBBLE_LANE), in room
 * pixels: in the stage above the overview where there is room for it, over the top of the walls where there is not.
 */
export const BUBBLE_BAND = 80;

/** A floor point (u, v), `z` pixels up, in the room's box. */
export function iso(u: number, v: number, z = 0): Point {
  return { x: ORIGIN.x + u - v, y: ORIGIN.y + Math.floor((u + v) / 2) - z };
}

/** Draw order of what stands on a room's floor: the further back, the earlier. */
export const cozyDepth = (u: number, v: number) => u + v;

/** The room as drawn, walls and floor, clockwise from the top of the back corner: what a click on the room falls in. */
export const ROOM_OUTLINE: readonly Point[] = [
  iso(-WALL_THICKNESS, -WALL_THICKNESS, WALL_HEIGHT),
  iso(ROOM_UNITS, -WALL_THICKNESS, WALL_HEIGHT),
  iso(ROOM_UNITS, -WALL_THICKNESS),
  iso(ROOM_UNITS, ROOM_UNITS),
  iso(-WALL_THICKNESS, ROOM_UNITS),
  iso(-WALL_THICKNESS, ROOM_UNITS, WALL_HEIGHT),
];

/**
 * What stands on a room's floor, as people walk round it and are hidden by it: from (u0, v0) to (u1, v1), `height`
 * pixels up (cozy/floor.ts).
 */
export interface Footprint { u0: number; u1: number; v0: number; v1: number; height: number }

/** What stands on a footprint as drawn, as tall as it is, clockwise from the top of its back corner (like ROOM_OUTLINE). */
export const footprintOutline = ({ u0, u1, v0, v1, height }: Footprint): Point[] =>
  [iso(u0, v0, height), iso(u1, v0, height), iso(u1, v0), iso(u1, v1), iso(u0, v1), iso(u0, v1, height)];

/** A footprint around a floor point: `half` units each way. */
export const around = (u: number, v: number, half: number, height: number): Footprint => ({ u0: u - half, u1: u + half, v0: v - half, v1: v + half, height });

/** A place in a room: on a desk's chair or on the couch, facing its desk or the room. `lift`: the seat's height, in pixels. */
export interface Place { u: number; v: number; direction: Direction; lift: number }

/**
 * A desk of a project room: at the back ('back', facing the right wall, from (u, v) `length` units along u, its person
 * seen from behind, their screen towards us) or on the right ('side', facing the left wall, from (u, v) `length` units
 * along v, its person seen from the front, behind the desk). Each ambiance places four (ambiance/index.ts): no head may
 * hide another, PERSON_SPACING apart across the screen at least, or one a whole seated person lower than the other.
 */
export interface Desk { kind: 'back' | 'side'; u: number; v: number; length: number }

/** A project room has this many desks, whatever its ambiance: its sessions at work beyond them are its "+N". */
export const DESK_COUNT = 4;

/**
 * Where whoever works at a desk sits: in front of it, a chair's height up. At a back desk, left of their screen (it
 * stays in sight); at a side desk, at the front end of the desk, beside its screen rather than behind it, like the
 * prototype's (.cozy-proto), so their head and shoulders show.
 */
export function deskPlace(desk: Desk): Place {
  return desk.kind === 'back'
    ? { u: desk.u + 14, v: desk.v + 26, direction: 'up-right', lift: 11 }
    : { u: desk.u - 12, v: desk.v + 25, direction: 'down-right', lift: 11 };
}

/** Two people seated side by side are at least this far apart across the screen, in room pixels: an HD head's width (chibi-hd.ts). */
export const PERSON_SPACING = 24;

/**
 * A couch, its back against a back wall: (u, v) its far corner, `depth` from the wall, `length` along it; along the
 * left wall (v) unless `alongU`, along the right one.
 */
export interface Couch { u: number; v: number; depth: number; length: number; alongU?: boolean }

/** A couch's floor point `across` from the wall and `along` it, from its far corner. */
export const onCouchAt = (couch: Couch, across: number, along: number): [number, number] =>
  (couch.alongU ? [couch.u + along, couch.v + across] : [couch.u + across, couch.v + along]);

/** The draw order of a couch's front arm, a piece of its own in front of whoever sits at that end. */
export const couchArmDepth = (couch: Couch) => cozyDepth(...onCouchAt(couch, 11, couch.length - 3));

/** A couch's draw order, by its footprint's middle (decor.ts paints it there). */
export const couchDepth = (couch: Couch) => cozyDepth(couch.u + (couch.alongU ? couch.length : couch.depth) / 2, couch.v + (couch.alongU ? couch.depth : couch.length) / 2);

/** Whether a floor point is on a couch's footprint. */
const onCouch = (couch: Couch, u: number, v: number) => {
  const [u1, v1] = onCouchAt(couch, couch.depth, couch.length);
  return u >= couch.u && u <= u1 && v >= couch.v && v <= v1;
};

/**
 * Draw order of someone at (u, v), `seated` or standing, in a room with `couch`: on it, they sit on its seat in front
 * of its back, so they come after the couch (not before it, as the place's own depth at the couch's far end would
 * say), but before its front arm.
 */
export const personDepth = (u: number, v: number, seated: boolean, couch: Couch | null) =>
  seated && couch && onCouch(couch, u, v) ? Math.max(cozyDepth(u, v), couchDepth(couch) + 1) : cozyDepth(u, v);

/** Someone's feet in the room's box: the place on the floor, raised by the seat. */
export const feetOf = (place: Place): Point => iso(place.u, place.v, place.lift);

/** Where each room of the overview goes (its box's top left corner), and the whole overview's size. */
export interface Overview { width: number; height: number; slots: Point[] }

/**
 * The rooms of the overview, tiled like a honeycomb: rows of rooms, every other row shifted by half a room, so a room
 * of the next row fits between the floors of two rooms above it. `count` rooms, the first one (the user's flat) in the
 * slot nearest the middle, the others in reading order around it.
 */
export function overviewLayout(count: number): Overview {
  const columns = Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = Math.max(1, Math.ceil(count / columns));
  const stepX = ROOM_BOX.width + ROOM_GAP;
  // the next row's back corner reaches up between two floors: the floor's side corners are this far below the wall tops
  const stepY = iso(ROOM_UNITS, 0).y - iso(-WALL_THICKNESS, -WALL_THICKNESS, WALL_HEIGHT).y + ROOM_GAP;
  const staggered = rows > 1 && count > columns;
  const cells: Point[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns && cells.length < count; column++) {
      cells.push({ x: column * stepX + (staggered && row % 2 === 1 ? stepX / 2 : 0), y: row * stepY });
    }
  }
  const middle = {
    x: cells.reduce((sum, cell) => sum + cell.x, 0) / cells.length,
    y: cells.reduce((sum, cell) => sum + cell.y, 0) / cells.length,
  };
  const home = cells.reduce((best, cell, index) => (Math.hypot(cell.x - middle.x, cell.y - middle.y) < Math.hypot(cells[best].x - middle.x, cells[best].y - middle.y) ? index : best), 0);
  const ordered = [cells[home], ...cells.filter((_, index) => index !== home)];
  const width = Math.max(...cells.map((cell) => cell.x)) + ROOM_BOX.width;
  const height = Math.max(...cells.map((cell) => cell.y)) + ROOM_BOX.height;
  return { width, height, slots: ordered };
}

/** A rectangle on screen, in CSS pixels. */
export interface Box { x: number; y: number; width: number; height: number }

/** Where the overview goes in the stage: its CSS pixels per room pixel, and its top left corner in the stage. */
export interface Fit { scale: number; left: number; top: number }

/**
 * The overview (`size`, in room pixels) as large as it fits in the stage (`area`), centred. `covers`: what lies over
 * the stage (the status card): the overview goes in the largest part of the stage beside, above or below them, so it
 * never passes under one.
 */
export function fitOverview(area: Box, covers: readonly Box[], size: { width: number; height: number }): Fit {
  let parts: Box[] = [area];
  for (const cover of covers) {
    parts = parts.flatMap((part) => {
      const left = Math.max(part.x, cover.x), right = Math.min(part.x + part.width, cover.x + cover.width);
      const top = Math.max(part.y, cover.y), bottom = Math.min(part.y + part.height, cover.y + cover.height);
      if (left >= right || top >= bottom) return [part];
      return [
        { ...part, width: left - part.x },
        { ...part, x: right, width: part.x + part.width - right },
        { ...part, height: top - part.y },
        { ...part, y: bottom, height: part.y + part.height - bottom },
      ].filter((free) => free.width > 0 && free.height > 0);
    });
  }
  const scaleIn = (part: Box) => Math.max(0, Math.min(part.width / size.width, part.height / size.height));
  const best = parts.reduce((most, part) => (scaleIn(part) > scaleIn(most) ? part : most), parts[0] ?? area);
  const scale = scaleIn(best);
  const width = size.width * scale, height = size.height * scale;
  return { scale, left: best.x + (best.width - width) / 2, top: best.y + (best.height - height) / 2 };
}

/** The room a point of the overview falls in (its index in `slots`), the front one where two overlap, or -1. */
export function roomAt(point: Point, slots: readonly Point[]): number {
  let found = -1;
  slots.forEach((slot, index) => {
    if (!insideConvex({ x: point.x - slot.x, y: point.y - slot.y }, ROOM_OUTLINE)) return;
    if (found < 0 || slot.y > slots[found].y) found = index;
  });
  return found;
}

/** Someone a click may fall on: their id, their feet in the overview, and how tall they are drawn (SpriteSource.height). */
export interface Figure { id: string; feet: Point; top: number }

/** Who a point falls on, the one in front (the lowest feet on screen) where two overlap, or null. */
export function figureAt(point: Point, figures: readonly Figure[]): string | null {
  let found: Figure | null = null;
  for (const figure of figures) {
    if (!onFigure(figure.feet, point, figure.top)) continue;
    if (!found || figure.feet.y > found.feet.y) found = figure;
  }
  return found?.id ?? null;
}
