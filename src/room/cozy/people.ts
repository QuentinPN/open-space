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
import { DESKS, deskPlace, feetOf, personDepth, type Desk, type Figure, type Place } from './geometry.ts';
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

/** Someone on their seat of a room's plan: at a desk of a project room, on a place of the break room (napping). */
const seated = (room: CozyRoom, person: Person, seat: number): Sitter => (room.kind === 'lounge'
  ? { id: person.id, person, place: LOUNGE_PLACES[seat], desk: null, napping: true }
  : { id: person.id, person, place: deskPlace(DESKS[seat]), desk: DESKS[seat], napping: false });

/** Everyone seated in a room: the desks' people on the seat their plan gave them, the break room's on their place. */
export function sittersOf(room: CozyRoom): Sitter[] {
  if (room.kind === 'home') return [{ id: PLAYER_ID, person: null, place: homePlace(room.home ?? homeThemeOf(undefined)), desk: null, napping: false }];
  const atDesks = room.desks.people.map((person) => seated(room, person, room.desks.seats.get(person.id)!));
  const resting = room.resting.people.map((person) => seated(room, person, room.resting.seats.get(person.id)!));
  return [...atDesks, ...resting];
}

/**
 * The cozy rooms are drawn finer than the classic office: its people, drawn as they are, would be as tall as half a
 * wall and wider than a desk. They are drawn at this share of their size there (about 30 room pixels tall seated), so
 * four of them fit at the desks of a room; the HD people of step 2 (24 x 36) are about that size.
 */
export const PERSON_SCALE = 0.6;

/** The office's people at the cozy rooms' size: drawn and measured smaller, so the places and tags follow. */
export function cozySprites(source: SpriteSource, factor = PERSON_SCALE): SpriteSource {
  const scaled = (context: CanvasRenderingContext2D, x: number, y: number, paint: () => void) => {
    context.save();
    context.translate(x, y);
    context.scale(factor, factor);
    paint();
    context.restore();
  };
  return {
    height: (pose, personId) => source.height(pose, personId) * factor,
    draw: (context, personId, pose, x, y) => scaled(context, x, y, () => source.draw(context, personId, pose, 0, 0)),
    drawTypingHand: (context, personId, feet, hand, step) =>
      scaled(context, feet.x, feet.y, () => source.drawTypingHand(context, personId, { x: 0, y: 0 }, { x: (hand.x - feet.x) / factor, y: (hand.y - feet.y) / factor }, step)),
    // the heads on the tags and in the bubbles keep their size: the tags are drawn at the screen's size
    drawHead: (context, personId, x, y, size) => source.drawHead(context, personId, x, y, size),
  };
}

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

/** Someone's draw order on their place: the break room's sofas, the couch, or the floor. */
const depthIn = (room: CozyRoom, place: Place, sitting: boolean) =>
  (room.kind === 'lounge' && sitting ? loungeDepth(place) : personDepth(place.u, place.v, sitting));

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
