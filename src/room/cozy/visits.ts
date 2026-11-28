// Life in the cozy offices (Preferences.officeLife): the classic room's visits (visitors.ts: who comes, when, for how
// long, by the hour's rhythm) walked in a project room of the cozy style, to the spots of its ambiance
// (ambiance/index.ts AmbianceVisits): in the offices a coffee at the counter, a glass at the water cooler, a look out
// of the window, a book from the drawers; a moment on the couch in every one (the sessions at rest nap in the break
// room, not there), and on a festival the classic office gathers for, a party by its tree or balloons. They come in
// from the front of the room.
// Visitors walk in tiles: here a tile is VISIT_UNIT room units. Pure: tested without a DOM.
import type { Festival } from '../../../shared/festivals.ts';
import { festivalVisits, type VisitSpot } from '../../../shared/room-layout.ts';
import { distance, type Point } from '../geometry.ts';
import type { VisitFloor } from '../visitors.ts';
import { designOf, type AmbianceDesign, type AmbianceSpot, type FloorPoint } from './ambiance/index.ts';
import { feetOf, personDepth, type Couch } from './geometry.ts';
import type { CozyRoom } from './rooms.ts';

/** Room units in a tile of the visits: they walk at the classic room's pace across a cozy room in a few seconds. */
export const VISIT_UNIT = 8;

/** A floor point (u, v) of a cozy room, in the visits' tiles. */
const tile = ([u, v]: FloorPoint): Point => ({ x: u / VISIT_UNIT, y: v / VISIT_UNIT });

/** A cozy spot: the classic spot, and the floor points walked through to reach it from the middle of the room, in tiles. */
interface CozySpot extends VisitSpot { via: readonly Point[] }

const spotOf = ({ at, via, ...spot }: AmbianceSpot): CozySpot => ({ ...spot, at: tile(at), via: via.map(tile) });

/** What visitors come for in a room of an ambiance, its couch's places included, and its party's places: the same ones each time. */
interface RoomVisits { spots: readonly CozySpot[]; party: readonly CozySpot[]; parties: Map<Festival | null, readonly CozySpot[]> }
const visitsOf = new WeakMap<AmbianceDesign, RoomVisits>();

function roomVisits(design: AmbianceDesign): RoomVisits {
  let found = visitsOf.get(design);
  if (!found) {
    const { couch } = design;
    // onto the couch from right in front of it
    const sofa = design.couchPlaces.map((place): AmbianceSpot => ({
      activity: 'sofa', at: [place.u, place.v], facing: 2, lift: place.lift, via: [couch.alongU ? [place.u, place.v + 18] : [place.u + 18, place.v]],
    }));
    found = { spots: [...design.visits.spots, ...sofa].map(spotOf), party: design.visits.party.map(spotOf), parties: new Map() };
    visitsOf.set(design, found);
  }
  return found;
}

/**
 * The party's places on a festival: as many as the classic office has for it (none on most), coming two by two there
 * too. The same spots each time: a visitor keeps theirs only while the room still offers it, so the party breaks up
 * when the festival ends (visitors.ts Visits.step).
 */
function partyOn(design: AmbianceDesign, festival: Festival | null): readonly CozySpot[] {
  const visits = roomVisits(design);
  let spots = visits.parties.get(festival);
  if (!spots) {
    const classic = festivalVisits(festival);
    spots = visits.party.slice(0, classic.length).map(({ together, ...spot }, index) => (classic[index].together === undefined ? spot : { ...spot, together }));
    visits.parties.set(festival, spots);
  }
  return spots;
}

/** The spots a visitor may go to in a project room of an ambiance (the offices by default): the room's own and, on a festival, the party's. */
export const visitSpotsIn = (festival: Festival | null = null, design: AmbianceDesign = designOf({ kind: 'project' })): readonly VisitSpot[] =>
  [...roomVisits(design).spots, ...partyOn(design, festival)];

/**
 * A cozy project room as the visits see it (visitors.ts VisitFloor), in its ambiance (the offices by default):
 * `festival()` is the festival it is dressed for, read at each step.
 */
export function cozyVisitFloor(festival: () => Festival | null = () => null, design: AmbianceDesign = designOf({ kind: 'project' })): VisitFloor {
  const door = tile(design.visits.entry), middle = tile(design.visits.middle), { spots, party } = roomVisits(design);
  const viaOf = (to: Point) => [...spots, ...party].reduce((best, spot) => (distance(spot.at, to) < distance(best.at, to) ? spot : best)).via;
  return {
    door,
    layout: { get visitSpots() { return visitSpotsIn(festival(), design); } },
    route: (_from, to) => [middle, ...viaOf(to)],
    pathToDoor: (from) => [...viaOf(from).toReversed(), middle, { ...door }],
  };
}

/** The room the crew drops by: the project room opened big, else the first with its lights on, else the first one. */
export function visitedRoom(rooms: readonly CozyRoom[], zoomed: string | null): CozyRoom | null {
  const projects = rooms.filter((room) => room.kind === 'project');
  return projects.find((room) => room.id === zoomed) ?? projects.find((room) => room.lit) ?? projects[0] ?? null;
}

/** A visitor's place in a room with `couch`: their feet (raised on the couch), their draw order, from their position in tiles. */
export function visitorFeet(position: Point, lift: number, couch: Couch): { u: number; v: number; feet: Point; depth: number } {
  const u = position.x * VISIT_UNIT, v = position.y * VISIT_UNIT;
  return { u, v, feet: feetOf({ u, v, direction: 'down-right', lift }), depth: personDepth(u, v, lift > 0, couch) };
}
