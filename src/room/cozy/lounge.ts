// The cozy break room (src/room/cozy/): where every session put to rest or stopped naps, whatever its project, like the
// classic break room (cast.ts roomSessions 'lounge'). Two sofas against its back walls, two beanbags on the rug in front
// of them, the door back to the offices on the left wall, where the project rooms have theirs. Its places are taken in
// an order that spreads the first nappers over the room, as the classic one does. Pure: tested without a DOM.
import { around, cozyDepth, onCouchAt, type Couch, type Footprint, type Place } from './geometry.ts';

/** The sofa under the window, along the left wall, and the one along the right wall: three places each. */
export const LOUNGE_COUCHES: readonly Couch[] = [
  { u: 0, v: 24, depth: 18, length: 68 },
  { u: 30, v: 0, depth: 18, length: 68, alongU: true },
];

/** Where on a sofa its three people sit, along it from its far end: one on each cushion. */
const SOFA_SEATS = [14, 32, 50] as const;
const SOFA_LIFT = 9;

const sofaPlace = (couch: Couch, along: number): Place => {
  const [u, v] = onCouchAt(couch, 12, along);
  return { u, v, direction: couch.alongU ? 'down-left' : 'down-right', lift: SOFA_LIFT };
};

/** The beanbags on the rug, each turned to the room's front: their middle, and how deep one sinks in. */
export const LOUNGE_BEANBAGS = [
  { u: 50, v: 78, direction: 'down-right' },
  { u: 80, v: 52, direction: 'down-left' },
] as const;
const BEANBAG_LIFT = 5;

const [left, right] = LOUNGE_COUCHES;
const [nearDoor, nearTea] = LOUNGE_BEANBAGS.map(({ u, v, direction }): Place => ({ u, v, direction, lift: BEANBAG_LIFT }));

/**
 * The break room's places, in the order they are taken: an end of each sofa and a beanbag first, then the other ends,
 * the sofas' middles last, so the first people to come to rest do not sit elbow to elbow.
 */
export const LOUNGE_PLACES: readonly Place[] = [
  sofaPlace(left, SOFA_SEATS[0]), sofaPlace(right, SOFA_SEATS[2]), nearDoor,
  sofaPlace(left, SOFA_SEATS[2]), sofaPlace(right, SOFA_SEATS[0]), nearTea,
  sofaPlace(left, SOFA_SEATS[1]), sofaPlace(right, SOFA_SEATS[1]),
];

/** Someone at a place of the break room is drawn in its depth order: in front of their sofa, behind its front arm. */
export const loungeDepth = (place: Place) => cozyDepth(place.u, place.v);

/** Where the pet sleeps in the break room: on the floor at the front, clear of the sofas and the beanbags. */
export const LOUNGE_PET = { u: 90, v: 94 } as const;

/** Its furniture (lounge-art.ts draws it there): the bookshelf and the reading lamp in the back corner, the coffee table, the tea corner, the arcade cabinet. */
export const BOOKSHELF = { u0: 0, u1: 11, v0: 2, v1: 22, height: 54 } as const;
export const READING_LAMP = { u: 22, v: 12 } as const;
export const COFFEE_TABLE = { u0: 32, u1: 52, v0: 32, v1: 50 } as const;
export const TEA_CORNER = { u0: 102, u1: 126, v0: 0, v1: 14 } as const;
export const ARCADE = { u0: 30, u1: 42, v0: 112, v1: 124, height: 46 } as const;
/** Where a festival's tree, pumpkins or balloons stand. */
export const LOUNGE_FESTIVE_SPOT = { u: 118, v: 84 } as const;

/** What people walk round in the break room (cozy/floor.ts), its festival's decoration aside. */
export const LOUNGE_FOOTPRINTS: readonly Footprint[] = [
  BOOKSHELF,
  around(READING_LAMP.u, READING_LAMP.v, 3, 50),
  ...LOUNGE_COUCHES.map((couch): Footprint => (couch.alongU
    ? { u0: couch.u, u1: couch.u + couch.length, v0: couch.v, v1: couch.v + couch.depth, height: 20 }
    : { u0: couch.u, u1: couch.u + couch.depth, v0: couch.v, v1: couch.v + couch.length, height: 20 })),
  { ...COFFEE_TABLE, height: 15 },
  { ...TEA_CORNER, height: 30 },
  ...LOUNGE_BEANBAGS.map(({ u, v }) => around(u, v, 8, 12)),
  { ...ARCADE, v1: ARCADE.v1 + 4 },
];
