// What a point of the cozy rooms falls on (src/room/cozy/), as a click in the classic room does: someone (a session,
// the user, a visitor), the user's pet at home, or a thing that does something: the user's computer at home (a
// terminal), its numbers screen (the mods), a project room's whiteboard (the board and its notes), the door between the
// offices and the break room, the break room's arcade cabinet (its game), a clock (the time). In the overview as in a
// room opened big. Pure: tested without a DOM.
import type { Point } from '../geometry.ts';
import { isOnPet } from '../pet.ts';
import { PLAYER_ID } from '../scene.ts';
import { designOf } from './ambiance/index.ts';
import { paintDoor } from './decor.ts';
import { figureAt, roomAt, type Figure } from './geometry.ts';
import { homeThemeOf, metricsPainter, pcAt, roomClockAt } from './home/index.ts';
import { paintArcade } from './lounge-art.ts';
import { paintedAt } from './pixels.ts';
import type { CozyRoom } from './rooms.ts';

export type CozyThing = 'computer' | 'metrics' | 'board' | 'door' | 'arcade' | 'clock';

/** The thing a point of a room (in its pixels) falls on: the home's computer and numbers screen, a project room's board (its ambiance's), the doors, the break room's arcade, the clocks. */
export function thingAt(room: CozyRoom, point: Point): CozyThing | null {
  if (room.kind === 'home') {
    const theme = room.home ?? homeThemeOf(undefined);
    if (pcAt(theme, point)) return 'computer';
    if (paintedAt(metricsPainter(theme), point)) return 'metrics';
  }
  if (room.kind === 'lounge' && paintedAt(paintDoor, point)) return 'door';
  if (room.kind === 'lounge' && paintedAt(paintArcade, point)) return 'arcade';
  if (room.kind === 'project') {
    const design = designOf(room);
    if (paintedAt(design.paintDoor, point)) return 'door';
    if (paintedAt(design.paintBoard, point)) return 'board';
  }
  return roomClockAt(room, point) ? 'clock' : null;
}

/** A room as a click sees it: where it is in the overview (its box's top left corner), and who is drawn in it. */
export interface PlacedRoom { room: CozyRoom; at: Point; people: readonly Figure[] }

/** What a point falls on: the room (its index among those shown, -1 for none), and in it someone, the pet or a thing. */
export interface CozyTarget { index: number; person: string | null; pet: boolean; thing: CozyThing | null }

/**
 * What a point of the overview, or of a room opened big (`zoomed`), falls on, the nearest first: someone (the user at
 * their computer is the computer), the pet (its paws at `pet` in the home's pixels; null: the user has none), then a
 * thing. The pet lives at home only (home-pet.ts). In the overview the break room's door, which leads back among the
 * rooms, is just part of the room, like the rest of it.
 */
export function targetAt(point: Point, rooms: readonly PlacedRoom[], { zoomed, pet }: { zoomed: boolean; pet: Point | null }): CozyTarget {
  const index = roomAt(point, rooms.map(({ at }) => at));
  const none: CozyTarget = { index, person: null, pet: false, thing: null };
  if (index < 0) return none;
  const person = figureAt(point, rooms.flatMap(({ people }) => people));
  if (person === PLAYER_ID) return { ...none, thing: 'computer' };
  if (person) return { ...none, person };
  const { room, at } = rooms[index], inRoom = { x: point.x - at.x, y: point.y - at.y };
  if (pet && room.kind === 'home' && isOnPet(pet, inRoom)) return { ...none, pet: true };
  const thing = thingAt(room, inRoom);
  return { ...none, thing: thing === 'door' && room.kind === 'lounge' && !zoomed ? null : thing };
}
