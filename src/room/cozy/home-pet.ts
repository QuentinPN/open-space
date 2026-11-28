// The user's pet in the cozy rooms (Preferences.pet) lives at home, never in the offices nor the break room: it is the
// user's, not the sessions'. It lives there like the classic room's pet (pet.ts stepPet): it strolls round the
// furniture on the home's floor (the user's, floor.ts), sits, washes, says something now and then, a poke gets a cuddle;
// sometimes it goes to its bed (the theme's petBed: the quilt, the kilim, the rug, its zabuton) and sleeps there (a droid
// stands by), sometimes it comes to sit by the user. Pure: tested without a DOM.
import type { Festival } from '../../../shared/festivals.ts';
import type { HomeTheme } from '../../../shared/protocol.ts';
import { tileCenter, type Point } from '../geometry.ts';
import { createPet, somewhereFree, stepPet, type Pet, type PetErrand, type PetFloor } from '../pet.ts';
import { CozyFloor, cozyFloorPlan, tileOf, unitsOf } from './floor.ts';
import { HOME_DESIGNS } from './home/index.ts';

/** The pet at home: the home's floor as it walks it, its bed (a floor point, in tiles), and the classic pet (pet.ts). */
export interface HomePet { theme: HomeTheme; festival: Festival | null; floor: CozyFloor; bed: Point; pet: Pet }

/** Of its walks, how many lead to its bed (to sleep) and how many to the user (to sit by them); the others, anywhere free. */
const ODDS = { bed: 0.25, user: 0.35 } as const;
/** How far from the user it sits down, in tiles at most. */
const NEAR = 2;

const key = (point: Point) => `${Math.floor(point.x)},${Math.floor(point.y)}`;
const gap = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** The floor as the pet walks it: it stops on no seat's tile (the desk's chair, a sofa's places), only on the aisles. */
const petFloorOf = (floor: CozyFloor): PetFloor => ({
  layout: floor.layout, extent: floor.extent, inside: floor.inside, door: floor.door, portal: null, portalFront: null, isFreeTile: floor.isAisle,
  route: (from, to) => floor.route(from, to), pathToDoor: (from) => floor.pathToDoor(from), pathIntoPortal: () => [],
});

/** Every aisle tile of a floor (floor.ts isAisle), as their centres. */
const aisles = (floor: CozyFloor): Point[] =>
  Array.from({ length: floor.extent.width * floor.extent.depth }, (_, index) => ({ x: index % floor.extent.width, y: Math.floor(index / floor.extent.width) }))
    .filter(({ x, y }) => floor.isAisle(x, y)).map(tileCenter);

/** The aisle tile nearest its bed, which it climbs onto its bed from (its bed's own when nothing stands there). */
const bedside = (home: Pick<HomePet, 'floor' | 'bed'>): Point => aisles(home.floor).sort((a, b) => gap(a, home.bed) - gap(b, home.bed))[0];

/** Whether the pet is up on something (its bed, a cushion): its tile is under the furniture. */
const upOnFurniture = (home: Pick<HomePet, 'floor'>, at: Point) => !home.floor.isFreeTile(Math.floor(at.x), Math.floor(at.y));

/** An aisle tile by the user standing or seated at `user` (tiles), not theirs, or null when there is none. */
function byUser(floor: CozyFloor, user: Point, random: () => number): Point | null {
  const near = aisles(floor).filter((tile) => key(tile) !== key(user) && Math.max(Math.abs(tile.x - user.x), Math.abs(tile.y - user.y)) <= NEAR + 0.5)
    .sort((a, b) => gap(a, user) - gap(b, user)).slice(0, 3);
  return near.length ? near[Math.min(near.length - 1, Math.floor(random() * near.length))] : null;
}

/**
 * Where it goes next, from where it is (down off its bed first, when it is up on it): to its bed to sleep, by the user
 * at `user` (tiles) to sit, or somewhere free to sit or wash.
 */
export function homeErrand(home: Pick<HomePet, 'floor' | 'bed'>, user: Point): PetErrand {
  const floor = petFloorOf(home.floor);
  return (pet, random) => {
    const down = upOnFurniture(home, pet.position) ? [bedside(home)] : [];
    const from = down[0] ?? pet.position;
    const to = (target: Point) => [...down, ...floor.route(from, target)];
    const roll = random();
    if (roll < ODDS.bed) return { path: [...to(bedside(home)), { ...home.bed }], doing: 'sleep' };
    const near = roll < ODDS.bed + ODDS.user ? byUser(home.floor, user, random) : null;
    if (near) return { path: to(near), doing: 'sit' };
    return { path: to(somewhereFree(floor, random)), doing: random() < 0.7 ? 'sit' : 'wash' };
  };
}

/** The pet at home as a home of `theme` opens (dressed for `festival`): asleep on its bed. */
export function homePet(theme: HomeTheme, festival: Festival | null, random: () => number = Math.random): HomePet {
  const floor = new CozyFloor(cozyFloorPlan({ kind: 'home', home: theme }, festival));
  const { u, v } = HOME_DESIGNS[theme].petBed, bed = tileOf(u, v);
  const pet = createPet(petFloorOf(floor), null, Number.POSITIVE_INFINITY, random);
  Object.assign(pet, { position: { ...bed }, activity: 'sleep', until: 8000 + random() * 16000 });
  return { theme, festival, floor, bed, pet };
}

/** Steps the pet at home, the user at `user` (tiles): the classic pet's life, its walks the home's (homeErrand). */
export function stepHomePet(home: HomePet, ms: number, user: Point, random: () => number = Math.random) {
  stepPet(home.pet, ms, petFloorOf(home.floor), [], random, homeErrand(home, user));
}

/** Where the pet's paws are on the home's floor (u, v) and how high (z): up on its bed while there, else on the floor. */
export function homePetAt(home: HomePet): { u: number; v: number; z: number } {
  const { u, v } = unitsOf(home.pet.position);
  return { u, v, z: upOnFurniture(home, home.pet.position) ? HOME_DESIGNS[home.theme].petBed.z : 0 };
}
