// The ambiances of the cozy project rooms (Preferences.cozyAmbianceMode, projectAmbiances): each one a file of its own here, registered in
// AMBIANCES, that says what its room is made of and where (AmbianceDesign); the shared code (decor.ts, floor.ts,
// people.ts, visits.ts, things.ts) draws it, seats and walks its people, brings its visitors and finds its clicks from
// that alone. Which ambiance a project's room has (ambianceFor) and what picking one on its plate changes
// (pickAmbiance) are pure: tested without a DOM, as is every registered ambiance (room.test.ts).
import type { Festival } from '../../../../shared/festivals.ts';
import { COZY_AMBIANCE_MODES, type CozyAmbiance, type CozyAmbianceMode, type Preferences } from '../../../../shared/protocol.ts';
import type { Activity } from '../../../../shared/room-layout.ts';
import type { WallClock } from '../clock.ts';
import type { DeskStyle, DoorSpot, OwnLight, Standing } from '../decor.ts';
import type { Couch, Desk, Footprint, Place } from '../geometry.ts';
import type { MotionLayer, WallRect } from '../motion.ts';
import type { Painter, PixelGrid } from '../pixels.ts';
import type { CozyRoom } from '../rooms.ts';
import type { CozyTime } from '../time.ts';
import { atelier } from './atelier.ts';
import { beach } from './beach.ts';
import { cafe } from './cafe.ts';
import { cellar } from './cellar.ts';
import { dungeon } from './dungeon.ts';
import { forest } from './forest.ts';
import { office } from './office.ts';
import { pirate } from './pirate.ts';
import { space } from './space.ts';
import { tokyo } from './tokyo.ts';

/** A floor point of a room, (u, v) in its units (geometry.ts). */
export type FloorPoint = readonly [number, number];

/**
 * Where a visitor of the crew goes in a room (visitors.ts) and what for: on the floor at `at`, turned to `facing` (the
 * classic directions, geometry.ts facingVector: 0 towards the right wall, 6 towards the left one, 2 towards the front,
 * 3 straight down the screen, 7 straight up it); `via`: the floor points walked through from the middle of the room,
 * round the furniture; `together`: where the second of two comes along faces; `lift`: how high they sit there.
 */
export interface AmbianceSpot { activity: Activity; at: FloorPoint; facing: number; via: readonly FloorPoint[]; together?: number; lift?: number }

export interface AmbianceVisits {
  /** where the visitors come in (the front of the floor) and the open middle they cross */
  entry: FloorPoint;
  middle: FloorPoint;
  /** what they come for (the couch's two places are added: visits.ts) */
  spots: readonly AmbianceSpot[];
  /** a festival's party by `festiveSpot`: two places, used as many as the classic office has for that festival */
  party: readonly [AmbianceSpot, AmbianceSpot];
}

/** A room's light: its floor lamp (lit at dusk and at night), what shines while its lights are on, and what always does. */
export interface AmbianceLight extends Omit<OwnLight, 'lamp'> {
  /** where its floor lamp stands, and its light at dusk and at night (the offices' by default) */
  lamp: { u: number; v: number };
  lampColour?: OwnLight['lamp'];
  /** besides the screens: never darkened while someone is there (the leds, a lit sign) */
  glow: readonly string[];
  /** never darkened at all, beside the offices' sky (light.ts SKY_GLOW): its window's view */
  sky: readonly string[];
}

/** What a room's moving decor follows besides the frame: the mood of the hour shown (the "try an hour" preview's too), its lights on or off, the festival. */
export interface AmbianceScene { time: CozyTime; lit: boolean; festival: Festival | null }

/**
 * What moves in a room of an ambiance (the sea, a flame, a neon sign, fireflies), drawn each frame over its cached art
 * (paint.ts), behind its people and the pieces that stand in front of them. Each layer only takes the cells of the art
 * painted in its mask's colours, as drawn before the light (motion.ts MotionLayer): what stands in front keeps it out.
 * The layer `view` is the window's view (`light.sky`, inside `glass`). What it paints must be what the light leaves as
 * it is (`light.glow` while lit, `light.sky` always) or see-through, so it matches the art round it at every hour.
 */
export interface AmbianceMotion {
  /** the colours of the back layer each layer draws over, by name; `view` is there for a room with `glass` */
  masks: Readonly<Record<string, readonly string[]>>;
  /** each frame (about 15 a second, 0 with reduced motion): the same frame and scene draw the same pixels */
  paint(layers: Readonly<Record<string, MotionLayer>>, frame: number, scene: AmbianceScene): void;
}

/**
 * What a project room of an ambiance is made of. The room tests (room.test.ts) check every registered one: its seats
 * reached from its door through no furniture, its door kept clear, no head hiding another, its visitors' spots on the
 * floor and reached, its door, board and clock found by a click and inside the room.
 */
export interface AmbianceDesign {
  id: CozyAmbiance;
  /** the DESK_COUNT desks, in the order the room's plan numbers its seats (geometry.ts deskPlace: where their person sits) */
  desks: readonly Desk[];
  deskStyle: DeskStyle;
  /** the couch along a back wall, for the visitors and the user: its two places, its body, and its front arm (in front of whoever sits there) */
  couch: Couch;
  couchPlaces: readonly Place[];
  paintCouch: Painter;
  paintCouchArm: Painter;
  /** the door to the break room on the left wall, and the door drawn alone: a click goes through it */
  door: DoorSpot;
  paintDoor: Painter;
  /** the board on a wall, drawn alone: a click opens the board and its notes */
  paintBoard: Painter;
  clock: WallClock;
  /** what stands on the floor besides the desks, their chairs and the couch, as people walk round it (floor.ts) */
  footprints: readonly Footprint[];
  /** a free corner of the floor for a festival's tree, pumpkins or balloons (festive.ts) */
  festiveSpot: { u: number; v: number };
  visits: AmbianceVisits;
  /** the floor, the walls and the window at `time` (its sky following the hour) */
  paintRoom(grid: PixelGrid, time: CozyTime): void;
  /** once the board, the door, the clock and the festival's walls are up: what hangs in front of them, what lies flat on the floor */
  dress(grid: PixelGrid): void;
  /** what stands on the floor besides the desks, their chairs and the couch: painted from back to front (decor.ts standing) */
  standing: readonly Standing[];
  light: AmbianceLight;
  /** its window's glass, round its view (`light.sky`): the view's motion is drawn there only */
  glass?: WallRect;
  /** what moves in it, if anything does */
  motion?: AmbianceMotion;
}

/** The ambiances there are, by id, in the order the pickers offer them. An id the settings may hold but not here yet: the offices. */
export const AMBIANCES = { office, cafe, space, tokyo, dungeon, beach, pirate, forest, cellar, atelier } as const satisfies Partial<Record<CozyAmbiance, AmbianceDesign>>;
export type AmbianceId = keyof typeof AMBIANCES;
export const AMBIANCE_IDS = Object.keys(AMBIANCES) as AmbianceId[];

/** An ambiance as the settings hold it, if there is one by that id here; null for none (absent, unknown, or not drawn yet). */
export const registeredAmbiance = (value: unknown): AmbianceId | null => AMBIANCE_IDS.find((id) => id === value) ?? null;

/**
 * What decides a project room's ambiance: the settings' Preferences.cozyAmbianceMode and projectAmbiances, and the
 * office `theme` (Preferences.theme), whose ambiance is the default one: the ambiance with the theme's id.
 */
export interface AmbianceChoice { mode?: unknown; theme?: unknown; projects?: Readonly<Record<string, unknown>> }

export const ambianceChoiceOf = (preferences: Pick<Preferences, 'cozyAmbianceMode' | 'theme' | 'projectAmbiances'>): AmbianceChoice =>
  ({ mode: preferences.cozyAmbianceMode, theme: preferences.theme, projects: preferences.projectAmbiances });

/** The ambiance of every room without a pick of its own: the one with the office theme's id, the offices for none. */
const defaultAmbiance = (choice: AmbianceChoice): AmbianceId => registeredAmbiance(choice.theme) ?? 'office';

const modeOf = (value: unknown): CozyAmbianceMode => COZY_AMBIANCE_MODES.find((mode) => mode === value) ?? 'same';

/** A number that stays the same for a folder (FNV-1a): its ambiance in the 'random' mode. */
function hashOf(text: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 0x01000193);
  return hash >>> 0;
}

/**
 * The ambiance of a project's room (its folder): the office theme's ('same'), one of them by the folder ('random':
 * always the same for a folder, but registering a new ambiance may give some folders another one), or the one picked
 * for it ('manual'), the office theme's without a pick. The offices for none or one not drawn yet.
 */
export function ambianceFor(folder: string, choice: AmbianceChoice): AmbianceId {
  const fallback = defaultAmbiance(choice);
  switch (modeOf(choice.mode)) {
    case 'random': return AMBIANCE_IDS[hashOf(folder) % AMBIANCE_IDS.length];
    case 'manual': return registeredAmbiance(choice.projects?.[folder]) ?? fallback;
    default: return fallback;
  }
}

/** How a room is drawn and furnished: a project room in its ambiance, the other rooms (the server room's walls) the offices'. */
export const designOf = (room: Pick<CozyRoom, 'kind' | 'ambiance'>): AmbianceDesign =>
  (room.kind === 'project' ? AMBIANCES[registeredAmbiance(room.ambiance) ?? 'office'] : office);

/**
 * What the settings become once `id` is picked for the room of `folder` on its plate, so that this room alone
 * changes: in the 'manual' mode, its pick; from 'same', the 'manual' mode with this pick only (the others keep the
 * office theme's); from 'random', the 'manual' mode with each of the other rooms shown (`folders`) kept on the
 * ambiance it had. A pick of the office theme's ambiance is no pick. Null when the room already has it.
 */
export function pickAmbiance(choice: AmbianceChoice, folder: string, id: AmbianceId, folders: readonly string[]): Pick<Preferences, 'cozyAmbianceMode' | 'projectAmbiances'> | null {
  if (ambianceFor(folder, choice) === id) return null;
  const mode = modeOf(choice.mode), fallback = defaultAmbiance(choice);
  const kept: [string, unknown][] = mode === 'manual' ? Object.entries(choice.projects ?? {})
    : mode === 'random' ? folders.map((other) => [other, ambianceFor(other, choice)]) : [];
  const picks: Record<string, CozyAmbiance> = {};
  for (const [other, pick] of kept) if (other !== folder && typeof pick === 'string' && pick !== fallback) picks[other] = pick as CozyAmbiance;
  if (id !== fallback) picks[folder] = id;
  return { cozyAmbianceMode: 'manual', projectAmbiances: picks };
}
