// Who sits where in a cozy room and how they look there (src/room/cozy/): the user alone at their computer in the flat,
// a project's sessions at its desks or napping on its couch. Their feet come from the places (geometry.ts) and their
// height from the sprites (SpriteSource.height), so taller people fit without moving anything. Pure: tested without a DOM.
import type { Person } from '../cast.ts';
import { PLAYER_ID } from '../scene.ts';
import { blinkOffsetOf, type Gesture, type Pose, type SpriteSource } from '../sprites.ts';
import type { CozyRoom } from './rooms.ts';
import { homePlace, homeThemeOf } from './home/index.ts';
import { COUCH_PLACES, DESKS, deskPlace, feetOf, personDepth, type Desk, type Figure, type Place } from './geometry.ts';
import type { Point } from '../geometry.ts';

export interface Sitter {
  /** a session's id, or PLAYER_ID for the user */
  id: string;
  /** the session's person in the room (cast.ts); null for the user */
  person: Person | null;
  place: Place;
  /** the desk of a project room they work at; null on the couch and at home */
  desk: Desk | null;
  napping: boolean;
}

/** Everyone seated in a room: the desks' people on the seat their plan gave them, then the couch's. */
export function sittersOf(room: CozyRoom): Sitter[] {
  if (room.kind === 'home') return [{ id: PLAYER_ID, person: null, place: homePlace(room.home ?? homeThemeOf(undefined)), desk: null, napping: false }];
  const atDesks = room.desks.people.map((person): Sitter => {
    const desk = DESKS[room.desks.seats.get(person.id)!];
    return { id: person.id, person, place: deskPlace(desk), desk, napping: false };
  });
  const onCouch = room.couch.people.map((person): Sitter => ({ id: person.id, person, place: COUCH_PLACES[room.couch.seats.get(person.id)!], desk: null, napping: true }));
  return [...atDesks, ...onCouch];
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

/** Seated: typing while their session works, an arm up while it waits for a permission or an answer, eyes closed on the couch. */
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

/** Someone in the overview: where their feet are (the room's corner `at` added), how tall they are, their draw order. */
export interface PlacedSitter extends Figure { sitter: Sitter; pose: Pose; depth: number }

export function placeSitters(room: CozyRoom, at: Point, sprites: Pick<SpriteSource, 'height'>, time: number, reducedMotion: boolean): PlacedSitter[] {
  return sittersOf(room).map((sitter) => {
    const pose = sitterPose(sitter, time, reducedMotion);
    const feet = feetOf(sitter.place);
    return { id: sitter.id, sitter, pose, feet: { x: feet.x + at.x, y: feet.y + at.y }, top: sprites.height(pose, sitter.id), depth: personDepth(sitter.place.u, sitter.place.v, true) };
  });
}
