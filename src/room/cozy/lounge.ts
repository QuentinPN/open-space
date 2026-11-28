// The cozy break room (src/room/cozy/): where every session put to rest or stopped naps, whatever its project, like the
// classic break room (cast.ts roomSessions 'lounge'). Everything stands against the two back walls or round the rug: a
// sofa under the window on the left wall, a loveseat on the right wall, the arcade cabinet and the tea corner beside it,
// the bookshelf in the back corner, three beanbags on and round the rug. The door back to the offices is on the left
// wall, where the project rooms have theirs, and nothing stands in front of it. Its places are taken in an order that
// spreads the first nappers over the room, as the classic one does. Pure: tested without a DOM.
import { around, cozyDepth, onCouchAt, type Couch, type Footprint, type Place } from './geometry.ts';

/** The sofa under the window, along the left wall (three places), and the loveseat along the right wall (two). */
export const LOUNGE_COUCHES: readonly Couch[] = [
  { u: 0, v: 16, depth: 18, length: 84 },
  { u: 24, v: 0, depth: 18, length: 60, alongU: true },
];
/** How many people each of them seats: its cushions (decor.ts paintCouch). */
export const LOUNGE_COUCH_SEATS = [3, 2] as const;

/** Where on a sofa its people sit, along it from its far end: the middle of each of its cushions (decor.ts paintCouch). */
const sofaSeats = ({ length }: Couch, cushions: number) =>
  Array.from({ length: cushions }, (_, cushion) => 7 + (Math.floor((length - 12) / cushions) * (2 * cushion + 1)) / 2);
const SOFA_LIFT = 9;

const sofaPlace = (couch: Couch, along: number): Place => {
  const [u, v] = onCouchAt(couch, 12, along);
  return { u, v, direction: couch.alongU ? 'down-left' : 'down-right', lift: SOFA_LIFT };
};

/** The beanbags on and round the rug, each turned to the table: their middle, and how deep one sinks in. */
export const LOUNGE_BEANBAGS = [
  { u: 50, v: 78, direction: 'down-right' },
  { u: 80, v: 52, direction: 'down-left' },
  { u: 76, v: 80, direction: 'down-left' },
] as const;
const BEANBAG_LIFT = 5;

const [left, right] = LOUNGE_COUCHES;
const [leftSeats, rightSeats] = LOUNGE_COUCHES.map((couch, index) => sofaSeats(couch, LOUNGE_COUCH_SEATS[index]));
const [nearDoor, nearTea, nearPet] = LOUNGE_BEANBAGS.map(({ u, v, direction }): Place => ({ u, v, direction, lift: BEANBAG_LIFT }));

/**
 * The break room's places, in the order they are taken: an end of each sofa and a beanbag first, then the other ends,
 * the sofa's middle last, so the first people to come to rest do not sit elbow to elbow.
 */
export const LOUNGE_PLACES: readonly Place[] = [
  sofaPlace(left, leftSeats[0]), sofaPlace(right, rightSeats[1]), nearDoor,
  sofaPlace(left, leftSeats[2]), nearTea, sofaPlace(right, rightSeats[0]),
  nearPet, sofaPlace(left, leftSeats[1]),
];

/** Someone at a place of the break room is drawn in its depth order: in front of their sofa, behind its front arm. */
export const loungeDepth = (place: Place) => cozyDepth(place.u, place.v);

/**
 * Its furniture (lounge-art.ts draws it there): the bookshelf in the back corner by the reading lamp, the coffee table
 * on the rug, the tea corner and the arcade cabinet on the right wall.
 */
export const BOOKSHELF = { u0: 0, u1: 11, v0: 2, v1: 16, height: 54 } as const;
export const READING_LAMP = { u: 18, v: 9 } as const;
export const RUG = { u: 52, v: 54 } as const;
export const COFFEE_TABLE = { u0: 42, u1: 62, v0: 45, v1: 63 } as const;
export const TEA_CORNER = { u0: 102, u1: 126, v0: 0, v1: 14 } as const;
/** The cabinet's back is against the right wall: its screen and its buttons (v1 side) look into the room. */
export const ARCADE = { u0: 87, u1: 99, v0: 0, v1: 12, height: 46 } as const;
/** How far its control panel juts out in front of it (lounge-art.ts paintArcade). */
const ARCADE_PANEL = 4;
/** Where whoever plays stands, a step in front of its screen (the floor point; they face the cabinet): kept clear. */
export const ARCADE_FRONT = { u: (ARCADE.u0 + ARCADE.u1) / 2, v: ARCADE.v1 + ARCADE_PANEL + 6 } as const;
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
  { ...ARCADE, v1: ARCADE.v1 + ARCADE_PANEL },
];
