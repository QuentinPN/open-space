// Which rooms the cozy overview shows and who is in each (src/room/cozy/): the user's flat, a room per project, the
// break room, and the server room when there are automatons. A project room has four desks: its sessions at work or
// waiting sit there (the office's order, src/room/cast.ts); its couch is the visitors'. Every session put to rest or
// stopped, whatever its project, naps in the break room, as in the classic office (cast.ts roomSessions 'lounge').
// Pure: tested without a DOM.
import { isInside, WORKTREES_FOLDER } from '../../../shared/worktrees.ts';
import type { CozyAmbiance, HomeTheme, SessionInfo } from '../../../shared/protocol.ts';
import type { ConversationSpan } from '../../../shared/usage.ts';
import { projectNames, projectOf, projectsOf } from '../../state/projects.ts';
import type { SeenSequences } from '../../state/queue.ts';
import { planRoom, roomSessions, unseatedSessions, type Person, type RoomPlan } from '../cast.ts';
import { ambianceFor, type AmbianceChoice } from './ambiance/index.ts';
import { DESK_COUNT } from './geometry.ts';
import { homeThemeOf } from './home/index.ts';
import { LOUNGE_PLACES } from './lounge.ts';

export type CozyRoomKind = 'home' | 'project' | 'lounge' | 'servers';

/** Which projects get a room: those with sessions, or also the recent and pinned ones (their lights off when empty). */
export type CozyShow = 'active' | 'recent';
export const COZY_SHOWS: readonly CozyShow[] = ['active', 'recent'];

export interface CozyRoom {
  /** 'home', 'lounge', 'servers', or the project's folder */
  id: string;
  kind: CozyRoomKind;
  /** the project's folder ('' for the other rooms) */
  folder: string;
  /** the project's name, as the header's filter shows it ('' for the other rooms: their own words) */
  name: string;
  /** who sits at the desks of a project room; `hiddenSessions`: those without one ("+N" on the room) */
  desks: RoomPlan;
  /** who has no place, in the room's order: the "+N" list (as many as the hidden sessions of `desks` or of `resting`) */
  unseated: readonly SessionInfo[];
  /** who naps in the break room, on its sofas and beanbags; `hiddenSessions`: those without a place */
  resting: RoomPlan;
  /** the lights are on: someone is there (the flat always is) */
  lit: boolean;
  pinned: boolean;
  /** the flat's look (Preferences.homeTheme); only on the flat */
  home?: HomeTheme;
  /** a project room's look and furniture (ambiance/index.ts ambianceFor); only on a project room */
  ambiance?: CozyAmbiance;
}

export const HOME_ID = 'home';
export const LOUNGE_ID = 'lounge';
export const SERVERS_ID = 'servers';
/** A conversation this recent makes its project a recent one; at most this many of them. */
const RECENT_DAYS = 14;
const RECENT_LIMIT = 8;

const EMPTY_PLAN: RoomPlan = { people: [], seats: new Map(), hiddenSessions: 0, waitingAutomata: 0 };

/** The sessions of the desks and of the break room: never a trigger's run (those are the server room's). */
const placed = (sessions: readonly SessionInfo[], seen: SeenSequences) =>
  [...roomSessions(sessions, seen, 'office').flat(), ...roomSessions(sessions, seen, 'lounge').flat()];

/**
 * Each room's name: the header pill's for a project with sessions (projectsOf), so the room and its pill read the same;
 * a recent or pinned project without any is named among the other rooms (with its parent when two share a name).
 */
export function roomNames(sessions: readonly SessionInfo[], seen: SeenSequences, folders: readonly string[]): Map<string, string> {
  const pills = new Map(projectsOf(sessions, seen).map(({ folder, name }) => [folder, name]));
  const others = projectNames(folders);
  return new Map(folders.map((folder) => [folder, pills.get(folder) ?? others.get(folder)!]));
}

/**
 * The projects that get a room, by name: those with a session at work or at rest, like the header's pills; for
 * 'recent', also the recent ones (`recent`, see recentFolders) and the pinned ones.
 */
export function shownProjects(show: CozyShow, sessions: readonly SessionInfo[], seen: SeenSequences, recent: readonly string[], pinned: readonly string[]): string[] {
  const active = placed(sessions, seen).map(projectOf);
  const folders = [...new Set(show === 'active' ? active : [...active, ...recent, ...pinned])];
  const names = roomNames(sessions, seen, folders);
  return folders.sort((a, b) => names.get(a)!.localeCompare(names.get(b)!));
}

/** The project a Claude Code conversation worked for: its folder, or the main checkout of a worktree of it. */
const homeOf = (folder: string) => {
  const cut = folder.replace(/\\/g, '/').indexOf(`/${WORKTREES_FOLDER}/`);
  return cut < 0 ? folder : folder.slice(0, cut);
};

/**
 * The projects of the latest Claude Code conversations (the usage report's, server/usage.ts), most recent first: the
 * last RECENT_DAYS days, in the folders sessions may work in (`roots`), RECENT_LIMIT at most.
 */
export function recentFolders(conversations: readonly ConversationSpan[], roots: readonly string[], now: number): string[] {
  const since = now - RECENT_DAYS * 86_400_000;
  const folders = [...conversations]
    .filter((conversation) => conversation.project && conversation.end >= since)
    .sort((a, b) => b.end - a.end)
    .map((conversation) => homeOf(conversation.project))
    .filter((folder) => roots.some((root) => isInside(folder, root)));
  return [...new Set(folders)].slice(0, RECENT_LIMIT);
}

export interface CozyInput {
  sessions: readonly SessionInfo[];
  seen: SeenSequences;
  /** the projects that get a room (shownProjects) */
  projects: readonly string[];
  pinned: readonly string[];
  /** the user has automatons (src/state/automata.ts hasAutomata): the server room is there */
  automata: boolean;
  /** Preferences.homeTheme: how the flat looks (the studio when absent or unknown) */
  homeTheme?: unknown;
  /** the settings that give each project room its ambiance (the offices for none) */
  ambiances?: AmbianceChoice;
  /** who sat where in each room until now, so nobody changes seats as others come and go */
  previous: (roomId: string, part: 'desks' | 'resting') => ReadonlyMap<string, number>;
  /** the break room's places the user sits on or walks to (scene.ts playerSeats), kept free of sessions */
  playerSeats?: ReadonlySet<number>;
}

/** A project's room in its ambiance: its sessions at work or waiting at the desks by the office's order; its lights on while one is there. */
export function projectRoom(folder: string, name: string, input: Omit<CozyInput, 'projects' | 'automata'>): CozyRoom {
  const own = input.sessions.filter((session) => projectOf(session) === folder);
  const desks = planRoom(own, input.seen, input.previous(folder, 'desks'), DESK_COUNT, 'office');
  const unseated = unseatedSessions(own, input.seen, 'office', desks);
  const lit = desks.people.length + desks.hiddenSessions > 0;
  return { id: folder, kind: 'project', folder, name, desks, unseated, resting: EMPTY_PLAN, lit, pinned: input.pinned.includes(folder), ambiance: ambianceFor(folder, input.ambiances ?? {}) };
}

/**
 * The break room: every session put to rest or stopped, of every project, as many as it has places (the classic break
 * room's order and its "+N" for the others), its lights on while someone naps there.
 */
export function loungeRoom(input: Pick<CozyInput, 'sessions' | 'seen' | 'previous' | 'playerSeats'>): CozyRoom {
  const resting = planRoom(input.sessions, input.seen, input.previous(LOUNGE_ID, 'resting'), LOUNGE_PLACES.length, 'lounge', input.playerSeats);
  const unseated = unseatedSessions(input.sessions, input.seen, 'lounge', resting);
  return { id: LOUNGE_ID, kind: 'lounge', folder: '', name: '', desks: EMPTY_PLAN, unseated, resting, lit: resting.people.length > 0, pinned: false };
}

/** The rooms of the overview: the flat first (it goes in the middle), the projects by name, the break room, then the server room. */
export function cozyRooms(input: CozyInput): CozyRoom[] {
  const names = roomNames(input.sessions, input.seen, input.projects);
  const home: CozyRoom = { id: HOME_ID, kind: 'home', folder: '', name: '', desks: EMPTY_PLAN, unseated: [], resting: EMPTY_PLAN, lit: true, pinned: false, home: homeThemeOf(input.homeTheme) };
  const projects = input.projects.map((folder) => projectRoom(folder, names.get(folder)!, input));
  const servers: CozyRoom[] = input.automata
    ? [{ id: SERVERS_ID, kind: 'servers', folder: '', name: '', desks: EMPTY_PLAN, unseated: [], resting: EMPTY_PLAN, lit: roomSessions(input.sessions, input.seen, 'automata').flat().length > 0, pinned: false }]
    : [];
  return [home, ...projects, loungeRoom(input), ...servers];
}

/**
 * The first name of whoever a person id is in the rooms (a session's, at a desk or napping), '' for anyone else: what
 * the classic room's scene.nameOf gives, so both styles dress the same people alike (looks.ts crewLook).
 */
export function nameIn(rooms: readonly CozyRoom[], personId: string): string {
  for (const room of rooms) {
    const person = room.desks.people.find(({ id }) => id === personId) ?? room.resting.people.find(({ id }) => id === personId);
    if (person) return person.name;
  }
  return '';
}

/**
 * Who shows in the video call on the user's screen at home: the sessions at the desks of every room, those at work
 * first (the one speaking is one of them), `limit` at most.
 */
export function callers(rooms: readonly CozyRoom[], limit: number): Person[] {
  const people = rooms.flatMap((room) => room.desks.people);
  return [...people.filter(({ status }) => status === 'working'), ...people.filter(({ status }) => status !== 'working')].slice(0, limit);
}

/**
 * Where the seats the user put people on in a room are kept (localStorage), like the classic room's `seats:office`:
 * a project room's desks by its folder, the break room's places; null for the rooms nobody is moved in.
 */
export function cozySeatsKey(room: Pick<CozyRoom, 'kind' | 'folder'>): string | null {
  if (room.kind === 'project') return `cozy:seats:${room.folder}`;
  return room.kind === 'lounge' ? 'cozy:seats:lounge' : null;
}
