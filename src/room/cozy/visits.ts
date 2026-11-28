// Life in the cozy offices (Preferences.officeLife): the classic room's visits (visitors.ts: who comes, when, for how
// long, by the hour's rhythm) walked in a project room of the cozy style: a coffee at the counter, a glass at the water
// cooler, a look out of the window, a book from the drawers, a moment on the couch (the sessions at rest nap in the
// break room, not there), and on a festival the classic office gathers for, a party by its tree or balloons. They come
// in from the front of the room.
// Visitors walk in tiles: here a tile is VISIT_UNIT room units. Pure: tested without a DOM.
import type { Festival } from '../../../shared/festivals.ts';
import { festivalVisits, type VisitSpot } from '../../../shared/room-layout.ts';
import { distance, type Point } from '../geometry.ts';
import type { VisitFloor } from '../visitors.ts';
import { COUCH_PLACES, feetOf, personDepth } from './geometry.ts';
import type { CozyRoom } from './rooms.ts';

/** Room units in a tile of the visits: they walk at the classic room's pace across a cozy room in a few seconds. */
export const VISIT_UNIT = 8;

/** A floor point (u, v) of a cozy room, in the visits' tiles. */
const tile = (u: number, v: number): Point => ({ x: u / VISIT_UNIT, y: v / VISIT_UNIT });

/** A cozy spot: the classic spot, and the floor points (u, v) walked through to reach it from the middle of the room. */
interface CozySpot extends VisitSpot { via: readonly (readonly [number, number])[] }

/** Where they come in (the front of the floor) and the open middle they cross (the rug). */
const DOOR = [50, 124] as const;
const MIDDLE = [50, 84] as const;

/** Past the second back desk's chair and along the side desks' far end: the way to the room's back right corner. */
const BACK_RIGHT = [[96, 50], [116, 40]] as const;

/**
 * The spots, each where nothing of the room hides the visitor (the counter stands behind the desks: only the gap
 * between the two back desks gets a coffee; the water cooler stands in the back right corner, clear of them).
 * Facing: classic directions (geometry.ts facingVector), 0 towards the right wall, 6 towards the left one, 2 towards
 * the front, 3 straight down the screen, 7 straight up it.
 */
const SPOTS: readonly CozySpot[] = [
  { activity: 'coffee', at: tile(60, 19), facing: 0, via: [[64, 62], [65, 42]] },
  // in front of the cooler's taps, turned to them
  { activity: 'water', at: tile(120, 24), facing: 0, via: BACK_RIGHT },
  { activity: 'window', at: tile(28, 58), facing: 6, via: [[36, 66]] },
  { activity: 'books', at: tile(24, 92), facing: 6, via: [[34, 94]] },
  ...COUCH_PLACES.map((place): CozySpot => ({ activity: 'sofa', at: tile(place.u, place.v), facing: 2, lift: place.lift, via: [[place.u + 18, place.v]] })),
];

/**
 * A festival's party, by its tree, pumpkins or balloons (decor.ts FESTIVE_SPOT, between the drawers and the cooler):
 * alone, turned to them; two, turned to each other.
 */
const PARTY: readonly CozySpot[] = [
  { activity: 'party', at: tile(104, 18), facing: 7, together: 3, via: BACK_RIGHT },
  { activity: 'party', at: tile(112, 30), facing: 7, together: 7, via: BACK_RIGHT },
];

const parties = new Map<Festival | null, readonly CozySpot[]>();
/**
 * The party's places on a festival: as many as the classic office has for it (none on most), coming two by two there
 * too. The same spots each time: a visitor keeps theirs only while the room still offers it, so the party breaks up
 * when the festival ends (visitors.ts Visits.step).
 */
function partyOn(festival: Festival | null): readonly CozySpot[] {
  let spots = parties.get(festival);
  if (!spots) {
    const classic = festivalVisits(festival);
    spots = PARTY.slice(0, classic.length).map(({ together, ...spot }, index) => (classic[index].together === undefined ? spot : { ...spot, together }));
    parties.set(festival, spots);
  }
  return spots;
}

/** The spots a visitor may go to in a project room: the room's own and, on a festival, the party's. */
export const visitSpotsIn = (festival: Festival | null = null): readonly VisitSpot[] => [...SPOTS, ...partyOn(festival)];

const viaOf = (to: Point) => [...SPOTS, ...PARTY].reduce((best, spot) => (distance(spot.at, to) < distance(best.at, to) ? spot : best)).via.map(([u, v]) => tile(u, v));

/** A cozy project room as the visits see it (visitors.ts VisitFloor): `festival()` is the festival it is dressed for, read at each step. */
export function cozyVisitFloor(festival: () => Festival | null = () => null): VisitFloor {
  const door = tile(...DOOR), middle = tile(...MIDDLE);
  return {
    door,
    layout: { get visitSpots() { return visitSpotsIn(festival()); } },
    route: (_from, to) => [middle, ...viaOf(to)],
    pathToDoor: (from) => [...viaOf(from).reverse(), middle, { ...door }],
  };
}

/** The room the crew drops by: the project room opened big, else the first with its lights on, else the first one. */
export function visitedRoom(rooms: readonly CozyRoom[], zoomed: string | null): CozyRoom | null {
  const projects = rooms.filter((room) => room.kind === 'project');
  return projects.find((room) => room.id === zoomed) ?? projects.find((room) => room.lit) ?? projects[0] ?? null;
}

/** A visitor's place in a room: their feet (raised on the couch), their draw order, from their position in tiles. */
export function visitorFeet(position: Point, lift: number): { u: number; v: number; feet: Point; depth: number } {
  const u = position.x * VISIT_UNIT, v = position.y * VISIT_UNIT;
  return { u, v, feet: feetOf({ u, v, direction: 'down-right', lift }), depth: personDepth(u, v, lift > 0) };
}
