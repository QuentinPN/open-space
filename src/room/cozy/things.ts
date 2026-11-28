// What a point of the cozy rooms falls on (src/room/cozy/), as a click in the classic room does: someone (a session,
// the user, a visitor), the user's pet, or a thing that does something: the user's computer at home (a terminal), its
// numbers screen (the mods), a project room's whiteboard (the board and its notes), the door between the offices and
// the break room, a clock (the time). In the overview as in a room opened big. Pure: tested without a DOM.
import type { Point } from '../geometry.ts';
import { isOnPet } from '../pet.ts';
import { PLAYER_ID } from '../scene.ts';
import { paintDoor, paintWhiteboard } from './decor.ts';
import { CAT_SPOT, figureAt, iso, roomAt, type Figure } from './geometry.ts';
import { HOME_DESIGNS, homeThemeOf, metricsPainter, pcAt, roomClockAt } from './home/index.ts';
import { LOUNGE_PET } from './lounge.ts';
import { paintedAt } from './pixels.ts';
import type { CozyRoom } from './rooms.ts';

export type CozyThing = 'computer' | 'metrics' | 'board' | 'door' | 'clock';

/** The thing a point of a room (in its pixels) falls on: the home's computer and numbers screen, a project room's whiteboard, the doors, the clocks. */
export function thingAt(room: CozyRoom, point: Point): CozyThing | null {
  if (room.kind === 'home') {
    const theme = room.home ?? homeThemeOf(undefined);
    if (pcAt(theme, point)) return 'computer';
    if (paintedAt(metricsPainter(theme), point)) return 'metrics';
  }
  if ((room.kind === 'project' || room.kind === 'lounge') && paintedAt(paintDoor, point)) return 'door';
  if (room.kind === 'project' && paintedAt(paintWhiteboard, point)) return 'board';
  return roomClockAt(room, point) ? 'clock' : null;
}

/**
 * Where the user's pet lies in a room, its paws in the room's pixels: at home always, else in the room it sleeps in
 * (`petRoom`, rooms.ts catRoom); null elsewhere.
 */
export function petPawsIn(room: CozyRoom, petRoom: string): Point | null {
  if (room.kind === 'home') return HOME_DESIGNS[room.home ?? homeThemeOf(undefined)].petSpot;
  if (room.id !== petRoom) return null;
  if (room.kind === 'lounge') return iso(LOUNGE_PET.u, LOUNGE_PET.v);
  return room.kind === 'project' ? iso(CAT_SPOT.u, CAT_SPOT.v) : null;
}

/** A room as a click sees it: where it is in the overview (its box's top left corner), and who is drawn in it. */
export interface PlacedRoom { room: CozyRoom; at: Point; people: readonly Figure[] }

/** What a point falls on: the room (its index among those shown, -1 for none), and in it someone, the pet or a thing. */
export interface CozyTarget { index: number; person: string | null; pet: boolean; thing: CozyThing | null }

/**
 * What a point of the overview, or of a room opened big (`zoomed`), falls on, the nearest first: someone (the user at
 * their computer is the computer), the pet (none when `petRoom` is null: the user has none), then a thing. In the
 * overview the break room's door, which leads back among the rooms, is just part of the room, like the rest of it.
 */
export function targetAt(point: Point, rooms: readonly PlacedRoom[], { zoomed, petRoom }: { zoomed: boolean; petRoom: string | null }): CozyTarget {
  const index = roomAt(point, rooms.map(({ at }) => at));
  const none: CozyTarget = { index, person: null, pet: false, thing: null };
  if (index < 0) return none;
  const person = figureAt(point, rooms.flatMap(({ people }) => people));
  if (person === PLAYER_ID) return { ...none, thing: 'computer' };
  if (person) return { ...none, person };
  const { room, at } = rooms[index], inRoom = { x: point.x - at.x, y: point.y - at.y };
  const paws = petRoom === null ? null : petPawsIn(room, petRoom);
  if (paws && isOnPet(paws, inRoom)) return { ...none, pet: true };
  const thing = thingAt(room, inRoom);
  return { ...none, thing: thing === 'door' && room.kind === 'lounge' && !zoomed ? null : thing };
}
