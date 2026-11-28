// Which rooms the cozy overview shows and who is in each (src/room/cozy/): the user's flat, a room per project, and the
// server room when there are automatons. A project room has four desks and a couch: its sessions at work or waiting
// sit at the desks (the office's order, src/room/cast.ts), those put to rest or stopped nap on the couch (what goes to
// the break room in the classic office). Pure: tested without a DOM.
import { isInside, WORKTREES_FOLDER } from '../../../shared/worktrees.ts';
import type { HomeTheme, SessionInfo } from '../../../shared/protocol.ts';
import type { ConversationSpan } from '../../../shared/usage.ts';
import { projectNames, projectOf, projectsOf } from '../../state/projects.ts';
import type { SeenSequences } from '../../state/queue.ts';
import { planRoom, roomSessions, unseatedSessions, type Person, type RoomPlan } from '../cast.ts';
import { DESKS, COUCH_PLACES } from './geometry.ts';
import { homeThemeOf } from './home/index.ts';

export type CozyRoomKind = 'home' | 'project' | 'servers';

/** Which projects get a room: those with sessions, or also the recent and pinned ones (their lights off when empty). */
export type CozyShow = 'active' | 'recent';
export const COZY_SHOWS: readonly CozyShow[] = ['active', 'recent'];

export interface CozyRoom {
  /** 'home', 'servers', or the project's folder */
  id: string;
  kind: CozyRoomKind;
  /** the project's folder ('' for the flat and the server room) */
  folder: string;
  /** the project's name, as the header's filter shows it ('' for the flat and the server room: their own words) */
  name: string;
  /** who sits at the desks; `hiddenSessions`: those without one ("+N" on the room) */
  desks: RoomPlan;
  /** the sessions without a desk, in the room's order: the "+N" list (as many as `desks.hiddenSessions`) */
  unseated: readonly SessionInfo[];
  /** who naps on the couch; `hiddenSessions`: those without a place on it */
  couch: RoomPlan;
  /** the lights are on: someone is there (the flat always is) */
  lit: boolean;
  pinned: boolean;
  /** the flat's look (Preferences.homeTheme); only on the flat */
  home?: HomeTheme;
}

export const HOME_ID = 'home';
export const SERVERS_ID = 'servers';
/** A conversation this recent makes its project a recent one; at most this many of them. */
const RECENT_DAYS = 14;
const RECENT_LIMIT = 8;

const EMPTY_PLAN: RoomPlan = { people: [], seats: new Map(), hiddenSessions: 0, waitingAutomata: 0 };

/** The sessions of the desks and of the couch: never a trigger's run (those are the server room's). */
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
 * The projects that get a room, by name: those with a session at a desk or on the couch; for 'recent', also the
 * recent ones (`recent`, see recentFolders) and the pinned ones.
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
  /** who sat where in each room until now, so nobody changes seats as others come and go */
  previous: (roomId: string, part: 'desks' | 'couch') => ReadonlyMap<string, number>;
}

/** A project's room: its sessions at the desks by the office's order, the resting and stopped ones on the couch. */
export function projectRoom(folder: string, name: string, input: Omit<CozyInput, 'projects' | 'automata'>): CozyRoom {
  const own = input.sessions.filter((session) => projectOf(session) === folder);
  const desks = planRoom(own, input.seen, input.previous(folder, 'desks'), DESKS.length, 'office');
  const couch = planRoom(own, input.seen, input.previous(folder, 'couch'), COUCH_PLACES.length, 'lounge');
  const unseated = unseatedSessions(own, input.seen, 'office', desks);
  const someone = desks.people.length + desks.hiddenSessions + couch.people.length + couch.hiddenSessions > 0;
  return { id: folder, kind: 'project', folder, name, desks, unseated, couch, lit: someone, pinned: input.pinned.includes(folder) };
}

/** The rooms of the overview: the flat first (it goes in the middle), then the projects by name, then the server room. */
export function cozyRooms(input: CozyInput): CozyRoom[] {
  const names = roomNames(input.sessions, input.seen, input.projects);
  const home: CozyRoom = { id: HOME_ID, kind: 'home', folder: '', name: '', desks: EMPTY_PLAN, unseated: [], couch: EMPTY_PLAN, lit: true, pinned: false, home: homeThemeOf(input.homeTheme) };
  const projects = input.projects.map((folder) => projectRoom(folder, names.get(folder)!, input));
  const servers: CozyRoom[] = input.automata
    ? [{ id: SERVERS_ID, kind: 'servers', folder: '', name: '', desks: EMPTY_PLAN, unseated: [], couch: EMPTY_PLAN, lit: roomSessions(input.sessions, input.seen, 'automata').flat().length > 0, pinned: false }]
    : [];
  return [home, ...projects, ...servers];
}

/**
 * The first name of whoever a person id is in the rooms (a session's, at a desk or on the couch), '' for anyone else:
 * what the classic room's scene.nameOf gives, so both styles dress the same people alike (looks.ts crewLook).
 */
export function nameIn(rooms: readonly CozyRoom[], personId: string): string {
  for (const room of rooms) {
    const person = room.desks.people.find(({ id }) => id === personId) ?? room.couch.people.find(({ id }) => id === personId);
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

/** The room the cat sleeps in: the first lit project room, else the flat. */
export const catRoom = (rooms: readonly CozyRoom[]) => (rooms.find((room) => room.kind === 'project' && room.lit) ?? rooms[0]).id;
