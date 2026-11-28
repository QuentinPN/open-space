// Who sits where in a cozy room and how they look there (src/room/cozy/): the user alone at their computer in the flat,
// a project's sessions at its desks, the sessions at rest napping in the break room. Their feet come from the places
// (geometry.ts, lounge.ts) and their height from the sprites (SpriteSource.height), so taller people fit without moving
// anything. Pure: tested without a DOM.
import type { Person } from '../cast.ts';
import { characterPose, poseOf } from '../draw.ts';
import { PLAYER_ID, directionOf, type Scene } from '../scene.ts';
import { unitsOf, type CozyFloor } from './floor.ts';
import { blinkOffsetOf, type Gesture, type Pose, type SpriteSource } from '../sprites.ts';
import type { CozyRoom } from './rooms.ts';
import { homePlace, homeThemeOf } from './home/index.ts';
import { deskPlace, feetOf, personDepth, type Desk, type Figure, type Place } from './geometry.ts';
import { designOf } from './ambiance/index.ts';
import { LOUNGE_PLACES, loungeDepth } from './lounge.ts';
import type { Point } from '../geometry.ts';

export interface Sitter {
  /** a session's id, or PLAYER_ID for the user */
  id: string;
  /** the session's person in the room (cast.ts); null for the user */
  person: Person | null;
  place: Place;
  /** the desk of a project room they work at; null in the break room and at home */
  desk: Desk | null;
  napping: boolean;
}

/** Someone on their seat of a room's plan: at a desk of a project room (its ambiance's), on a place of the break room (napping). */
function seated(room: CozyRoom, person: Person, seat: number): Sitter {
  if (room.kind === 'lounge') return { id: person.id, person, place: LOUNGE_PLACES[seat], desk: null, napping: true };
  const desk = designOf(room).desks[seat];
  return { id: person.id, person, place: deskPlace(desk), desk, napping: false };
}

/** Everyone seated in a room: the desks' people on the seat their plan gave them, the break room's on their place. */
export function sittersOf(room: CozyRoom): Sitter[] {
  if (room.kind === 'home') return [{ id: PLAYER_ID, person: null, place: homePlace(room.home ?? homeThemeOf(undefined)), desk: null, napping: false }];
  const atDesks = room.desks.people.map((person) => seated(room, person, room.desks.seats.get(person.id)!));
  const resting = room.resting.people.map((person) => seated(room, person, room.resting.seats.get(person.id)!));
  return [...atDesks, ...resting];
}

/**
 * The cozy rooms are drawn finer than the classic office: their people are the HD ones (chibi-hd.ts), one room pixel an
 * art pixel, about this share of the classic people's size (36 pixels tall standing, against some 60), so what is sized
 * for the classic people (the drop rings, draw.ts paintDropSeats) is drawn at this share.
 */
export const PERSON_SCALE = 0.6;

/** How long a frame of typing or waving lasts, like in the classic room (draw.ts poseOf). */
const BEAT_MS: Record<Gesture, number> = { typing: 170, raising: 380, none: 120 };

/** Seated: typing while their session works, an arm up while it waits for a permission or an answer, eyes closed at rest. */
export function sitterPose(sitter: Sitter, time: number, reducedMotion: boolean): Pose {
  const status = sitter.person?.status ?? null;
  const gesture: Gesture = sitter.napping ? 'none' : status === 'working' ? 'typing' : status === 'permission' || status === 'question' ? 'raising' : 'none';
  const offset = blinkOffsetOf(sitter.id);
  return {
    direction: sitter.place.direction,
    posture: 'sit',
    step: gesture !== 'none' && !reducedMotion && Math.floor((time + offset) / BEAT_MS[gesture]) % 2 === 1 ? 1 : 0,
    blinking: sitter.napping || (!reducedMotion && (time + offset) % 3800 < 140),
    smiling: !sitter.napping && status === 'finished',
    gesture,
  };
}

/**
 * Someone in the overview: where their feet are (the room's corner `at` added), how tall they are, their draw order;
 * `free`: standing, walking or seated off the room's seats (the user), so what stands in front of them is laid over
 * them (decor.ts frontLayers), as over a visitor.
 */
export interface PlacedSitter extends Figure { sitter: Sitter; pose: Pose; depth: number; free?: boolean }

/** Someone's draw order on their place: the break room's sofas, a project room's couch, or the floor. */
const depthIn = (room: CozyRoom, place: Place, sitting: boolean) =>
  (room.kind === 'lounge' && sitting ? loungeDepth(place) : personDepth(place.u, place.v, sitting, room.kind === 'project' ? designOf(room).couch : null));

export function placeSitters(room: CozyRoom, at: Point, sprites: Pick<SpriteSource, 'height'>, time: number, reducedMotion: boolean): PlacedSitter[] {
  return sittersOf(room).map((sitter) => {
    const pose = sitterPose(sitter, time, reducedMotion);
    const feet = feetOf(sitter.place);
    return { id: sitter.id, sitter, pose, feet: { x: feet.x + at.x, y: feet.y + at.y }, top: sprites.height(pose, sitter.id), depth: depthIn(room, sitter.place, true) };
  });
}

/**
 * The people of a room opened big, as its scene walks them (scene.ts on a cozy floor, floor.ts): the sessions on their
 * seats as in placeSitters, or walking in, out or to the seat they were put on, and the user, walking or seated where
 * they were sent. Someone carried is drawn over everything.
 */
export function scenePeople(room: CozyRoom, scene: Scene<CozyFloor>, at: Point, sprites: Pick<SpriteSource, 'height'>, time: number, reducedMotion: boolean): PlacedSitter[] {
  const options = { time, reducedMotion, dozing: false };
  const placed = (sitter: Sitter, pose: Pose, depth: number, free: boolean, feet = feetOf(sitter.place)): PlacedSitter =>
    ({ id: sitter.id, sitter, pose, feet: { x: Math.round(feet.x) + at.x, y: feet.y + at.y }, top: sprites.height(pose, sitter.id), depth, free });
  const people = [...scene.characters.values()].map((character) => {
    if (character.phase === 'seated') {
      const sitter = seated(room, character.person, character.seat);
      return placed(sitter, sitterPose(sitter, time, reducedMotion), depthIn(room, sitter.place, true), false);
    }
    const pose = characterPose(character, options), { u, v } = unitsOf(character.position);
    const sitter: Sitter = { id: character.person.id, person: character.person, place: { u, v, direction: pose.direction, lift: 0 }, desk: null, napping: false };
    return placed(sitter, pose, character === scene.carried ? Number.POSITIVE_INFINITY : depthIn(room, sitter.place, false), character !== scene.carried);
  });
  const { player, playerSpot } = scene, { u, v } = unitsOf(player.position), lift = playerSpot?.lift ?? 0;
  const user: Sitter = { id: PLAYER_ID, person: null, place: { u, v, direction: directionOf(player.heading), lift }, desk: null, napping: false };
  const pose = playerSpot ? sitterPose(user, time, reducedMotion) : poseOf(player, false, false, 'none', options);
  // seated on a sessions' seat (the break room's sofas), the user is drawn like the sessions seated there
  const onTheirSeat = playerSpot !== null && scene.floor.layout.seats.includes(playerSpot.seat);
  return [...people, placed(user, pose, depthIn(room, user.place, playerSpot !== null), !onTheirSeat)];
}
