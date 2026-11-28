// The floor of a cozy room as people walk it (src/room/cozy/): the classic room's scene (scene.ts) walks, seats and
// carries the people of the room opened big on it, as the classic Floor (floor.ts) has it walk the office. Its tiles
// are the visits' (visits.ts VISIT_UNIT room units a side); what stands on the floor (Footprint) blocks them, but a
// seat's own tile, walked onto last. A project room's seats are its desks' chairs, the break room's its sofas' and
// beanbags' places; where the user may sit: at home, their desk's chair (where they start) and the theme's other spots
// (its bed, sofa, armchair or cushion); in a project room, the visitors' couch; in the break room, a free place.
// People come in through the door on the left wall (decor.ts DOOR). Pure: tested without a DOM.
import type { Festival } from '../../../shared/festivals.ts';
import type { PlayerSpot, Seat } from '../../../shared/room-layout.ts';
import type { Point } from '../geometry.ts';
import { aisleRoute } from '../paths.ts';
import type { SceneFloor, SceneView } from '../scene.ts';
import type { Direction } from '../sprites.ts';
import { DOOR, FESTIVE_SPOT, ROOM_FOOTPRINTS } from './decor.ts';
import { FESTIVE_DECOR } from './festive.ts';
import { COUCH_PLACES, DESKS, ORIGIN, ROOM_UNITS, around, deskPlace, iso, type Footprint, type Place } from './geometry.ts';
import { HOME_DESIGNS, homePlace, homeThemeOf } from './home/index.ts';
import { LOUNGE_FESTIVE_SPOT, LOUNGE_FOOTPRINTS, LOUNGE_PLACES } from './lounge.ts';
import type { CozyRoom } from './rooms.ts';
import { VISIT_UNIT } from './visits.ts';

/** Room units a tile's side: the visits' tiles, so a visitor's spot and the user's are the same floor points. */
export const TILE_UNITS = VISIT_UNIT;
/** Tiles along each side of the floor. */
export const FLOOR_TILES = ROOM_UNITS / TILE_UNITS;
/** Clicks closer than this to the walls are ignored (tiles), as in the classic room. */
const WALL_MARGIN = 0.2;

/** A room's floor point (u, v) in tiles, and back. */
export const tileOf = (u: number, v: number): Point => ({ x: u / TILE_UNITS, y: v / TILE_UNITS });
export const unitsOf = (tile: Point) => ({ u: tile.x * TILE_UNITS, v: tile.y * TILE_UNITS });

/**
 * A cozy room's floor as its canvas shows it, in the room's own pixels (its box's top left corner at 0, 0): the people
 * are drawn PERSON_SCALE (people.ts) the classic office's size, so someone carried hangs and lands nearer.
 */
export const COZY_VIEW: SceneView = {
  toScreen: (tile) => iso(tile.x * TILE_UNITS, tile.y * TILE_UNITS),
  toTile: (screen) => {
    const across = screen.x - ORIGIN.x, down = screen.y - ORIGIN.y;
    return tileOf(down + across / 2, down - across / 2);
  },
  carryHang: 13,
  dropReach: 16,
};

/** The classic facing (shared/room-layout.ts Seat) that looks the way a cozy place does. */
const FACING: Readonly<Record<Direction, number>> = { 'up-right': 0, 'down-right': 2, 'down-left': 4, 'up-left': 6 };

/** A cozy place as a classic seat: its tile, the way it faces, the point one sits at and how high. */
export const seatOf = (place: Place): Seat => {
  const at = tileOf(place.u, place.v);
  return { x: Math.floor(at.x), y: Math.floor(at.y), facing: FACING[place.direction], at, lift: place.lift };
};

/**
 * Where the user may sit, on `seat`: a click on the seat or on whoever would sit there (the floor behind the seat, as
 * the click falls through to it, the higher the seat the further back) sends them there.
 */
function spotOf(seat: Seat, atDesk: boolean): PlayerSpot {
  const { at } = seat, lift = seat.lift ?? 0, back = (lift + 10) / TILE_UNITS, front = 7 / TILE_UNITS;
  return { seat, at: at!, lift, atDesk, area: { fromX: at!.x - back, toX: at!.x + front, fromY: at!.y - back, toY: at!.y + front } };
}

/** Whether a floor point is under a footprint. */
const under = (box: Footprint, u: number, v: number) => u >= box.u0 && u < box.u1 && v >= box.v0 && v < box.v1;

/**
 * Whether what stands on `box` hides someone at (u, v), standing or seated: it does when they are behind it along
 * one side of the floor and not in front of it along the other; never when they sit on it.
 */
export const hides = (box: Footprint, u: number, v: number) => u < box.u1 && v < box.v1 && !under(box, u, v);

export interface CozyFloorPlan {
  /** what stands on the floor */
  furniture: readonly Footprint[];
  /** the sessions' seats, in the order their room's plan numbers them (rooms.ts) */
  seats: readonly Place[];
  /** where the user may sit, the first one where they start without coming in through a door; `atDesk`: at their computer */
  spots: readonly { place: Place; atDesk: boolean }[];
  /** a sessions' seat the user may sit on too (the break room's): kept free of sessions while they do */
  sharedSeats: boolean;
  /** the room has the door on its left wall people come in by */
  door: boolean;
}

export class CozyFloor implements SceneFloor {
  readonly layout: { seats: readonly Seat[]; playerSpots: readonly PlayerSpot[]; visitSpots?: undefined };
  readonly door: Point;
  readonly inside: Point;
  readonly portal = null;
  readonly portalFront = null;
  readonly furniture: readonly Footprint[];
  /** its size in tiles, for the pet (pet.ts PetFloor) */
  readonly extent = { width: FLOOR_TILES, depth: FLOOR_TILES };
  private readonly blocked = new Set<string>();
  private readonly avoided = new Set<string>();

  constructor(plan: CozyFloorPlan) {
    this.furniture = plan.furniture;
    const seats = plan.seats.map(seatOf);
    const spots = plan.spots.map(({ place, atDesk }) => {
      const shared = plan.sharedSeats ? plan.seats.indexOf(place) : -1;
      return spotOf(shared >= 0 ? seats[shared] : seatOf(place), atDesk);
    });
    this.layout = { seats, playerSpots: spots };
    // a seat's tile is walked onto last, even where its sofa or chair stands
    for (const { seat } of [...seats.map((seat) => ({ seat })), ...spots]) this.avoided.add(`${seat.x},${seat.y}`);
    for (let x = 0; x < FLOOR_TILES; x++) for (let y = 0; y < FLOOR_TILES; y++) {
      const u = (x + 0.5) * TILE_UNITS, v = (y + 0.5) * TILE_UNITS;
      if (!this.avoided.has(`${x},${y}`) && plan.furniture.some((box) => under(box, u, v))) this.blocked.add(`${x},${y}`);
    }
    // in through the door on the left wall, one step inside; a room without one is come into at its first spot
    const doorway = tileOf(0, (DOOR.a0 + DOOR.a1) / 2);
    this.door = plan.door ? { x: 0.3, y: doorway.y } : { ...spots[0].at };
    this.inside = plan.door ? { x: 1.5, y: doorway.y } : { ...spots[0].at };
  }

  isFreeTile = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < FLOOR_TILES && y < FLOOR_TILES && !this.blocked.has(`${x},${y}`);

  /** A free tile that is no seat's: walked through, stopped on by the pet. */
  isAisle = (x: number, y: number): boolean => this.isFreeTile(x, y) && !this.avoided.has(`${x},${y}`);

  /** True for a floor point the user can walk to: inside the walls, nothing standing there. */
  isWalkable(tile: Point): boolean {
    const inside = tile.x >= WALL_MARGIN && tile.y >= WALL_MARGIN && tile.x <= FLOOR_TILES - WALL_MARGIN && tile.y <= FLOOR_TILES - WALL_MARGIN;
    return inside && this.isFreeTile(Math.floor(tile.x), Math.floor(tile.y));
  }

  route(from: Point, to: Point): Point[] { return aisleRoute(from, to, this.isFreeTile, this.avoided); }
  pathToSeat(from: Point, seat: number): Point[] {
    const place = this.layout.seats[seat];
    return [...this.route(from, place), { ...place.at! }];
  }
  pathToDoor(from: Point): Point[] { return [...this.route(from, this.door), { ...this.door }]; }
  pathIntoPortal(): Point[] { return []; }

  seatPosition(seat: number): Point { return { ...this.layout.seats[seat].at! }; }
  seatFacing(seat: number): Point {
    const { facing } = this.layout.seats[seat], angle = (facing - 2) * Math.PI / 4;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  }
  seatLift(seat: number): number { return this.layout.seats[seat].lift ?? 0; }

  /**
   * The spot a click on the floor point `tile` sends the user to sit at: the nearest one whose area holds it, but a
   * sessions' seat one of them has (`taken`, by seat).
   */
  spotAt(tile: Point, taken: ReadonlySet<number> = new Set()): PlayerSpot | null {
    const near = this.layout.playerSpots.filter(({ area, seat }) =>
      tile.x >= area.fromX && tile.x < area.toX && tile.y >= area.fromY && tile.y < area.toY && !taken.has(this.layout.seats.indexOf(seat)));
    return near.sort((a, b) => Math.hypot(a.at.x - tile.x, a.at.y - tile.y) - Math.hypot(b.at.x - tile.x, b.at.y - tile.y))[0] ?? null;
  }
}

/** A festival's tree, pumpkins or balloons stand at `spot` too, on the festivals that have one. */
export const festiveFootprints = (festival: Festival | null, spot: { u: number; v: number }): Footprint[] =>
  (festival && FESTIVE_DECOR[festival].floor ? [around(spot.u, spot.v, 6, 30)] : []);

/** What a room's floor is made of: its furniture, its seats and its spots, by its kind (and the home's theme). */
export function cozyFloorPlan(room: Pick<CozyRoom, 'kind' | 'home'>, festival: Festival | null = null): CozyFloorPlan {
  if (room.kind === 'home') {
    const theme = room.home ?? homeThemeOf(undefined), design = HOME_DESIGNS[theme];
    return {
      furniture: [...design.furniture, ...festiveFootprints(festival, design.festiveSpot)], seats: [],
      spots: [{ place: homePlace(theme), atDesk: true }, ...design.spots.map((place) => ({ place, atDesk: false }))], sharedSeats: false, door: false,
    };
  }
  if (room.kind === 'lounge') {
    return { furniture: [...LOUNGE_FOOTPRINTS, ...festiveFootprints(festival, LOUNGE_FESTIVE_SPOT)], seats: LOUNGE_PLACES, spots: LOUNGE_PLACES.map((place) => ({ place, atDesk: false })), sharedSeats: true, door: true };
  }
  return {
    furniture: [...ROOM_FOOTPRINTS, ...festiveFootprints(festival, FESTIVE_SPOT)], seats: DESKS.map(deskPlace),
    spots: COUCH_PLACES.map((place) => ({ place, atDesk: false })), sharedSeats: false, door: true,
  };
}

/** Whether a room opened big is walked in: the user's home, a project room, the break room (the server room is the automatons'). */
export const walkable = (room: Pick<CozyRoom, 'kind'>) => room.kind !== 'servers';

