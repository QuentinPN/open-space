// The cozy rooms (Preferences.roomStyle 'cozy'): a little isometric room per project around the user's flat, and the
// break room where every session at rest naps, on one canvas. A click on a room opens it big (the header's project
// filter does too, and the header's break room tab opens the break room: the view 'repos', like the classic one);
// Escape or the back button goes back to all of them. As in the classic room, opened big or not: a click on someone
// opens their session (on a visitor, a new one with them), a poke on the pet gets a cuddle, the user's computer at home
// opens a terminal and its numbers screen the mods, a project room's whiteboard the board, a door goes to the break
// room and back, a clock tells the time; each is outlined under the pointer with what a click does. Each room's art is
// drawn once per mood of the hour and festival (decor.ts, lounge-art.ts, home/art.ts); each frame only paints the
// people, the visitors, the clocks' hands, the screens and the Z's over it (paint.ts). The hour, the festival, the
// office life, the pet and the hidden names are the classic room's settings.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import type { Festival, FestivalDay } from '../../../shared/festivals.ts';
import { COZY_PALETTE, ROOM_PALETTE } from '../../design/room-palette.ts';
import { t } from '../../i18n/index.ts';
import { formatClock } from '../../lib/format.ts';
import { readPreference, writePreference } from '../../lib/preferences.ts';
import { useReducedMotion } from '../../lib/motion.ts';
import { hasAutomata } from '../../state/automata.ts';
import { availability } from '../../state/availability.ts';
import { sessionsIn } from '../../state/docking.ts';
import { useSessions } from '../../state/sessions.ts';
import { useProjects } from '../../state/useProjects.ts';
import { USER_SPEAKER, onSpeech } from '../../state/speech.ts';
import { BackIcon, PinIcon, UnpinIcon } from '../../command/Icons.tsx';
import { bubbleText, pruneBubbles, pushBubble, type Bubble } from '../bubbles.ts';
import { chibiHead, chibiSprites } from '../chibi.ts';
import { TAG_FONT, visitorPose } from '../draw.ts';
import { runFrames } from '../frame-loop.ts';
import type { Point } from '../geometry.ts';
import { currentHour, lightingAt } from '../lighting.ts';
import { crewLook } from '../looks.ts';
import { modsNews, showsMetricsBadge } from '../metrics.ts';
import { outfitFor } from '../outfits.ts';
import { cuddle, isSpeaking, petWords, type Pet } from '../pet.ts';
import { PLAYER_ID, selfName } from '../scene.ts';
import { Visits, birthdayWishOf, visitorId } from '../visitors.ts';
import { ArrangeHint } from '../ArrangeHint.tsx';
import { STANDING, SpeechBubble, placeHintCard, showSky } from '../RoomView.tsx';
import { Scene, type SceneFloor } from '../scene.ts';
import { keepSeats, savedSeats } from '../seats.ts';
import { useCarry } from '../useCarry.ts';
import { COZY_VIEW, CozyFloor, cozyFloorPlan, walkable } from './floor.ts';
import { DESKS } from './geometry.ts';
import { LOUNGE_PLACES } from './lounge.ts';
import { useRoomFrame, type HomeOf } from '../useRoomFrame.ts';
import { BUBBLE_BAND, ROOM_BOX, fitOverview, overviewLayout, type Box, type Overview } from './geometry.ts';
import { cozySprites, placeSitters, scenePeople } from './people.ts';
import { paintCozy, type CozyFrameOptions, type FrameRoom, type PetPoke, type PlacedVisitor } from './paint.ts';
import { callFace, clockOf } from './home/index.ts';
import { wallPoint } from './pixels.ts';
import { cozyPetOf, isAwake, restPet, sleepingPet } from './pet.ts';
import { clockMinute } from './time.ts';
import { targetAt, type CozyTarget, type CozyThing } from './things.ts';
import { cozyVisitFloor, visitedRoom, visitorFeet } from './visits.ts';
import { COZY_SHOWS, LOUNGE_ID, callers, catRoom, cozyRooms, cozySeatsKey, nameIn, recentFolders, shownProjects, type CozyRoom, type CozyShow } from './rooms.ts';

const PRUNE_EVERY_MS = 250;
/** The canvas has at most this many pixels per room pixel (a big screen, a single room). */
const MAX_PIXELS_PER_ROOM_PIXEL = 8;
/** Where a room's plate goes: on the front of its floor, in the room's pixels. */
const PLATE_Y = ROOM_BOX.height - 26;
/** CSS pixels per pixel of a name tag at most, about the classic office's: the tags do not grow with a room opened big. */
const TAG_SCREEN_SCALE = 1.6;
/** The video call on the user's screen at home has at most this many tiles. */
const CALL_TILES = 4;

const PALETTE_VARIABLES = {
  '--room-bubble': ROOM_PALETTE.bubble,
  '--room-bubble-from-user': ROOM_PALETTE.bubbleFromUser,
  '--room-bubble-ink': ROOM_PALETTE.bubbleInk,
  '--room-bubble-shadow': ROOM_PALETTE.bubbleShadow,
  '--room-more': ROOM_PALETTE.more,
  '--room-more-text': ROOM_PALETTE.moreText,
  '--cozy-plate': COZY_PALETTE.plate,
  '--cozy-plate-dim': COZY_PALETTE.plateDim,
  '--cozy-plate-text': COZY_PALETTE.plateText,
  '--cozy-plate-hover': COZY_PALETTE.plateHover,
} as CSSProperties;

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/** The stage's size, and what lies over it (the status card, with a gutter around), in the stage's CSS pixels. */
interface StageBox { width: number; height: number; covers: Box[] }

function measureStage(element: HTMLElement): { box: StageBox; card: Element | null } {
  const card = document.querySelector('.cp-status');
  const area = element.getBoundingClientRect();
  const over = card?.getBoundingClientRect();
  const gutter = Number.parseFloat(getComputedStyle(element).getPropertyValue('--gutter')) * 16 || 12;
  const covers = over && over.width > 0 && over.height > 0
    ? [{ x: Math.round(over.left - area.left - gutter), y: Math.round(over.top - area.top - gutter), width: Math.round(over.width + 2 * gutter), height: Math.round(over.height + 2 * gutter) }]
    : [];
  return { box: { width: element.clientWidth, height: element.clientHeight, covers }, card };
}

/** The board in its own place: where fitOverview put it in the stage, whatever frame (move, zoom) it carries (useRoomFrame.ts). */
const boardHome: HomeOf = (element) => {
  const area = element.parentElement!.getBoundingClientRect();
  return { left: area.left + element.offsetLeft, top: area.top + element.offsetTop, width: element.offsetWidth, height: element.offsetHeight };
};

/** The room's words on its plate: the project's name, the flat's, the break room's, the server room's. */
const roomName = (room: CozyRoom) => (room.kind === 'home' ? t.room.cozy.home : room.kind === 'lounge' ? t.room.cozy.lounge : room.kind === 'servers' ? t.room.cozy.servers : room.name);

/** What a click on a thing does, in the card that follows the pointer (the classic room's words); null for none. */
function hintOf(thing: CozyThing | null, room: CozyRoom | undefined): string | null {
  const words = t.room.hint;
  switch (thing) {
    case 'computer': return words.openTerminal;
    case 'metrics': return modsNews(useSessions.getState()) ? words.newMods : words.openMods;
    case 'board': return words.openBoard;
    case 'door': return room?.kind === 'lounge' ? words.toOffice : words.toLounge;
    case 'clock': return t.room.cozy.clock.hint;
    default: return null;
  }
}

/** The visitors' ids carry their name (visitors.ts visitorId): they wear their crew member's look. */
const VISITOR_PREFIX = visitorId('');

/**
 * The room opened big as it is walked (scene.ts on its floor, floor.ts): its scene, set out for a festival and a home,
 * synced with its people once the sessions are known; where the seats its people are moved to are kept (rooms.ts cozySeatsKey).
 */
interface Walk { id: string; kind: CozyRoom['kind']; festival: Festival | null; home: CozyRoom['home']; scene: Scene<CozyFloor>; synced: boolean; seatsKey: string | null }

/**
 * A click on the floor of a room opened big (`point`, in its pixels): the user sits on the free seat there, or walks
 * there round the furniture, like in the classic room.
 */
function sendUser(scene: Scene<CozyFloor>, point: Point) {
  const tile = COZY_VIEW.toTile(point);
  const spot = scene.floor.spotAt(tile, new Set(scene.seats().values()));
  if (spot) scene.sitPlayerAt(spot);
  else if (scene.floor.isWalkable(tile)) scene.walkPlayerTo(tile);
}

/** `day`: the festival the rooms are dressed for and who it is for (useFestival), like the classic room's. */
export function CozyView({ day }: { day: FestivalDay }) {
  const reducedMotion = useReducedMotion(useSessions((s) => s.preferences.reduceMotion));
  const sessions = useSessions((s) => s.sessions);
  const seen = useSessions((s) => s.seen);
  const crew = useSessions((s) => s.crew);
  const openIds = useSessions((s) => s.openIds);
  const show = useSessions((s) => s.show);
  const pinned = useSessions((s) => s.preferences.pinnedProjects);
  const homeTheme = useSessions((s) => s.preferences.homeTheme);
  // the header's break room tab, the search's "break room": the break room opened big, like the classic one
  const inLounge = useSessions((s) => s.view === 'repos');
  const automata = useSessions(hasAutomata);
  const costs = useSessions((s) => s.costs);
  const roots = useSessions((s) => s.roots);
  const ready = useSessions((s) => s.claude !== null);
  const { projects: headerProjects, project } = useProjects();
  const [showing, setShowing] = useState<CozyShow>(() => readPreference<CozyShow>('cozy:show', 'active'));
  const [zoomed, setZoomed] = useState<string | null>(null);
  const [bubbles, setBubbles] = useState<readonly Bubble[]>([]);
  const [openList, setOpenList] = useState<string | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [stageBox, setStageBox] = useState<StageBox>({ width: 0, height: 0, covers: [] });
  const stage = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const crewRef = useRef(crew);
  crewRef.current = crew;
  // the rooms the frames and the looks read (set below, once planned)
  const roomsRef = useRef<readonly CozyRoom[]>([]);

  const dayRef = useRef(day);
  dayRef.current = day;

  // the user wears their own look; a session or a visitor named like a crew member wears that member's look, as in the classic room
  const [nameOf] = useState(() => (personId: string) => (personId.startsWith(VISITOR_PREFIX) ? personId.slice(VISITOR_PREFIX.length) : nameIn(roomsRef.current, personId)));
  const [lookFor] = useState(() => (personId: string) => crewLook(personId, nameOf(personId), crewRef.current));
  // and what the festival puts on everyone, as in the classic room (outfits.ts)
  const [sprites] = useState(() => cozySprites(chibiSprites(lookFor, (personId) => {
    const { festival, guests } = dayRef.current;
    return personId === PLAYER_ID ? outfitFor(festival, selfName(crewRef.current), true, guests) : outfitFor(festival, nameOf(personId), false, guests);
  })));

  // the recent projects come from the usage report (the conversations of the last days): asked for once, when needed
  useEffect(() => { if (showing === 'recent' && !costs) useSessions.getState().loadCosts(); }, [showing, costs]);
  const list = useMemo(() => Object.values(sessions), [sessions]);
  const pins = useMemo(() => pinned ?? [], [pinned]);
  const recent = useMemo(() => recentFolders(costs?.conversations ?? [], roots, Date.now()), [costs, roots]);
  const folders = useMemo(() => shownProjects(showing, list, seen, recent, pins), [showing, list, seen, recent, pins]);
  // who sat where, so nobody changes seats as others come and go
  const seats = useRef(new Map<string, ReadonlyMap<string, number>>());
  // the room opened big, walked like the classic room: the user, come in through its door (at home, at their computer),
  // and its sessions; once all the rooms show again, the user is back home at their computer
  const walk = useRef<Walk | null>(null);
  // the seats the user put people on by hand, by room, kept across reloads like the classic room's
  const kept = useRef(new Map<string, Map<string, number>>());
  const [keptIn] = useState(() => (roomId: string) => {
    const lounge = roomId === LOUNGE_ID, key = cozySeatsKey({ kind: lounge ? 'lounge' : 'project', folder: roomId })!;
    let saved = kept.current.get(key);
    if (!saved) { saved = savedSeats(readPreference<unknown>(key, {}), lounge ? LOUNGE_PLACES.length : DESKS.length); kept.current.set(key, saved); }
    return saved;
  });
  // counts the moves by hand: the rooms are planned again from the seats they leave
  const [moves, setMoves] = useState(0);
  const rooms = useMemo(() => cozyRooms({
    sessions: list, seen, projects: folders, pinned: pins, automata, homeTheme,
    // kept by hand, then who sat where until now, then where the room opened big has them now (a move just made)
    previous: (roomId, part) => {
      const walked = walk.current?.id === roomId ? walk.current.scene.seats() : [];
      return new Map([...keptIn(roomId), ...(seats.current.get(`${roomId}:${part}`) ?? []), ...walked]);
    },
    playerSeats: walk.current?.id === LOUNGE_ID ? walk.current.scene.playerSeats() : undefined,
  }), [list, seen, folders, pins, automata, homeTheme, keptIn, moves]);
  roomsRef.current = rooms;
  // the crew without a session, who may drop by an office (Preferences.officeLife), as in the classic room
  const free = useMemo(() => availability(crew, list).filter((person) => person.place === 'free').map((person) => person.member.name), [crew, list]);
  const freeRef = useRef(free);
  freeRef.current = free;
  // the sessions on the user's screen at home, in their own colours
  const callFaces = useMemo(() => callers(rooms, CALL_TILES).map((person) => callFace(lookFor(person.id), person.status === 'working')), [rooms, crew, lookFor]);
  useEffect(() => {
    for (const room of rooms) { seats.current.set(`${room.id}:desks`, room.desks.seats); seats.current.set(`${room.id}:resting`, room.resting.seats); }
  }, [rooms]);

  // the room opened big: the break room while its view is on (the room opened before stays behind it, for the way
  // back through its door); a room gone (its last session forgotten), all of them again
  const zoomedRoom = inLounge ? rooms.find((room) => room.kind === 'lounge') ?? null : zoomed === null ? null : rooms.find((room) => room.id === zoomed) ?? null;
  const shown = useMemo(() => (zoomedRoom ? [zoomedRoom] : rooms), [zoomedRoom, rooms]);
  const layout: Overview = useMemo(() => overviewLayout(shown.length), [shown.length]);

  // the room opened big gets its scene (the same while it stays open), its people seated at once the first time
  const { festival } = day;
  useLayoutEffect(() => {
    if (!zoomedRoom || !walkable(zoomedRoom)) { walk.current = null; return; }
    let current = walk.current;
    if (current?.id !== zoomedRoom.id || current.festival !== festival || current.home !== zoomedRoom.home) {
      const scene = new Scene(new CozyFloor(cozyFloorPlan(zoomedRoom, festival)), { atDoor: zoomedRoom.kind !== 'home', view: COZY_VIEW });
      scene.heightOf = (personId) => sprites.height(STANDING, personId);
      current = { id: zoomedRoom.id, kind: zoomedRoom.kind, festival, home: zoomedRoom.home, scene, synced: false, seatsKey: cozySeatsKey(zoomedRoom) };
      walk.current = current;
    }
    if (!ready) return;
    current.scene.sync(zoomedRoom.kind === 'lounge' ? zoomedRoom.resting : zoomedRoom.desks, !current.synced);
    current.synced = true;
  }, [zoomedRoom, festival, sprites, ready]);

  // the header's project filter opens that project's room (out of the break room); picking "all" again goes back to all of them
  const followed = useRef(project);
  useEffect(() => {
    if (project) {
      setZoomed(project);
      if (useSessions.getState().view === 'repos') useSessions.getState().setView('salle');
    } else if (followed.current) setZoomed((current) => (current === followed.current ? null : current));
    followed.current = project;
  }, [project]);

  const open = (room: CozyRoom) => {
    setOpenList(null);
    // the server room is the automatons' own: their room and its robots; the break room is the view of its own
    if (room.kind === 'servers') { useSessions.getState().setView('automates'); return; }
    if (room.kind === 'lounge') { useSessions.getState().setView('repos'); return; }
    setZoomed(room.id);
    if (headerProjects.some(({ folder }) => folder === room.id)) useSessions.getState().setProject(room.id);
  };
  const back = () => {
    setZoomed(null);
    setOpenList(null);
    if (useSessions.getState().project) useSessions.getState().setProject('');
    if (useSessions.getState().view === 'repos') useSessions.getState().setView('salle');
  };
  // through a door, like the classic room's: from a project room to the break room, from the break room back to where the user was
  const goThrough = (room: CozyRoom) => {
    setOpenList(null);
    useSessions.getState().setView(room.kind === 'lounge' ? 'salle' : 'repos');
  };
  const backRef = useRef(back);
  backRef.current = back;

  // Escape goes back to all the rooms; not while typing, in a dialog, or with a session open (it is theirs then, App.tsx)
  const zoomedNow = zoomedRoom !== null;
  useEffect(() => {
    if (!zoomedNow) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.isComposing || event.defaultPrevented || isTyping(event.target) || document.querySelector('dialog[open]')) return;
      if (useSessions.getState().openIds.length) return;
      event.preventDefault();
      backRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomedNow]);

  const choose = (next: CozyShow) => { setShowing(next); writePreference('cozy:show', next); };
  const togglePin = (folder: string) => {
    const next = pins.includes(folder) ? pins.filter((pin) => pin !== folder) : [...pins, folder];
    useSessions.getState().setPreferences({ pinnedProjects: next });
  };

  // the canvas takes the largest size that fits beside the status card; its pixels follow the screen's, so the tags stay sharp
  useLayoutEffect(() => {
    const element = stage.current!;
    const resize = new ResizeObserver(() => measure());
    let watched: Element | null = null;
    const measure = () => {
      const next = measureStage(element);
      if (next.card !== watched) {
        if (watched) resize.unobserve(watched);
        if (next.card) resize.observe(next.card);
        watched = next.card;
      }
      setStageBox((current) => (JSON.stringify(current) === JSON.stringify(next.box) ? current : next.box));
    };
    resize.observe(element);
    // the status card comes and goes with the sessions (StatusPanel.tsx), next to the main area
    const parent = element.closest('.cp-main')?.parentElement;
    const mutations = new MutationObserver(measure);
    if (parent) mutations.observe(parent, { childList: true });
    measure();
    return () => { resize.disconnect(); mutations.disconnect(); };
  }, []);
  const fit = useMemo(
    () => (stageBox.width && stageBox.height ? fitOverview({ x: 0, y: 0, width: stageBox.width, height: stageBox.height }, stageBox.covers, layout) : { scale: 0, left: 0, top: 0 }),
    [stageBox, layout],
  );
  const scale = fit.scale;
  const pixels = Math.max(1, Math.min(MAX_PIXELS_PER_ROOM_PIXEL, Math.round(scale * (window.devicePixelRatio || 1))));
  const tagScale = scale ? Math.min(pixels, TAG_SCREEN_SCALE * pixels / scale) : 1;

  // what the frames read: the latest rooms, where they are, what is under the pointer
  const scene = useRef({
    rooms, shown, layout, pixels, tagScale, callFaces, zoomed: zoomedRoom?.id ?? null, hoveredId: null as string | null, placed: [] as FrameRoom[],
    hovered: null as CozyFrameOptions['hovered'],
  });
  scene.current.zoomed = zoomedRoom?.id ?? null;
  scene.current.rooms = rooms;
  scene.current.callFaces = callFaces;
  scene.current.shown = shown;
  scene.current.layout = layout;
  scene.current.pixels = pixels;
  scene.current.tagScale = tagScale;
  const selected = useRef(openIds);
  selected.current = openIds;
  // the office life: one project room at a time is visited, the one opened big, else the first with its lights on
  const visiting = useRef<{ id: string | null; visits: Visits | null }>({ id: null, visits: null });
  // the pet just poked, in the room it lies in: the classic cuddle (pet.ts), until it is asleep again and its hearts are gone
  const poked = useRef<{ room: string; pet: Pet } | null>(null);
  const visitorsIn = (room: CozyRoom, at: Point, time: number): PlacedVisitor[] => {
    const { id, visits } = visiting.current;
    if (!visits || room.id !== id) return [];
    return [...visits.visitors.values()].filter((visitor) => visitor.outside <= 0).map((visitor) => {
      const { pose, lift } = visitorPose(visitor, { time, reducedMotion });
      const { feet, depth } = visitorFeet(visitor.position, lift);
      return {
        id: visitor.id, name: visitor.name, pose, depth, feet: { x: feet.x + at.x, y: feet.y + at.y }, top: sprites.height(pose, visitor.id),
        activity: visitor.phase === 'staying' ? visitor.spot.activity : null, blinkOffset: visitor.blinkOffset,
        wish: birthdayWishOf(visitor, dayRef.current.festival, dayRef.current.guests),
      };
    });
  };
  // the people of the room opened big as its scene has them, walking or seated; elsewhere, on their seats
  const placedOf = (time: number): FrameRoom[] => {
    const { shown: now, layout: where } = scene.current, walked = walk.current;
    return now.map((room, index) => {
      const at = where.slots[index], walking = walked?.id === room.id ? walked.scene : null;
      const sitters = walking ? scenePeople(room, walking, at, sprites, time, reducedMotion) : placeSitters(room, at, sprites, time, reducedMotion);
      return { room, at, sitters, visitors: visitorsIn(room, at, time), carrying: walking?.carried ? walking : null };
    });
  };
  const placedRef = useRef(placedOf);
  placedRef.current = placedOf;

  useEffect(() => {
    const context = canvas.current!.getContext('2d')!;
    void document.fonts.load(TAG_FONT);
    let last = performance.now();
    return runFrames(() => {
      const state = useSessions.getState();
      const time = performance.now();
      const elapsed = Math.min(100, time - last);
      last = time;
      // the hour of the classic room: the "try an hour" preview, else now; the page behind the rooms takes its sky
      const hour = state.preview.hour ?? currentHour();
      showSky(document, lightingAt(hour));
      const walked = walk.current;
      walked?.scene.step(elapsed);
      // through a door: the other room opens, the user coming in at its door
      if (walked?.scene.playerWentOut) { walked.scene.playerWentOut = false; state.setView(walked.kind === 'lounge' ? 'salle' : 'repos'); }
      const visited = visitedRoom(scene.current.rooms, scene.current.zoomed);
      const visit = visiting.current;
      if ((visited?.id ?? null) !== visit.id) {
        visit.id = visited?.id ?? null;
        visit.visits = visited ? new Visits(cozyVisitFloor(() => dayRef.current.festival)) : null;
      }
      // a visitor does not sit where the user does
      const blocked = walked && walked.id === visit.id ? walked.scene.playerSpot?.at ?? null : null;
      visit.visits?.step(elapsed, { free: freeRef.current, hour, enabled: state.preferences.officeLife, blocked });
      const placed = placedRef.current(time);
      scene.current.placed = placed;
      const { festival } = dayRef.current;
      const choice = state.preferences.pet;
      const cuddled = poked.current;
      if (cuddled) restPet(cuddled.pet, elapsed);
      if (cuddled && !isAwake(cuddled.pet) && !isSpeaking(cuddled.pet) && !cuddled.pet.hearts.length) poked.current = null;
      const poke: PetPoke | null = cuddled && choice.kind !== 'none' && poked.current
        ? { room: cuddled.room, pet: cuddled.pet, awake: isAwake(cuddled.pet) ? cozyPetOf(choice, true) : null, words: isSpeaking(cuddled.pet) ? petWords(cuddled.pet, choice.kind) : null }
        : null;
      paintCozy(context, sprites, placed, {
        time, hour, festival, scale: scene.current.pixels, tagScale: scene.current.tagScale, reducedMotion, hideNames: state.preferences.hideNames === true, tagColors: state.preferences.tagColors,
        hoveredId: scene.current.hoveredId, openSessionIds: selected.current, playerName: selfName(crewRef.current), callFaces: scene.current.callFaces,
        hovered: scene.current.hovered, metricsBadge: showsMetricsBadge(modsNews(state), state.modsOpen),
        // the pet sleeps in one room of all of them, the same whether that one is opened big or not
        catRoom: choice.kind === 'none' ? '' : catRoom(scene.current.rooms), pet: cozyPetOf(choice), poke,
      });
    }, () => { last = performance.now(); });
  }, [sprites, reducedMotion]);

  // what is said rises over the speaker, wherever they are in sight
  useEffect(() => {
    let lastId = 0;
    return onSpeech(({ sessionId, speaker, text }) => {
      const personId = speaker === USER_SPEAKER ? PLAYER_ID : sessionId;
      const sitter = scene.current.placed.flatMap((room) => room.sitters).find((placed) => placed.id === personId);
      const words = bubbleText(text);
      if (!sitter || !words) return;
      const label = personId === PLAYER_ID ? selfName(crewRef.current) : sitter.sitter.person?.title ?? '';
      const head = chibiHead(lookFor(personId));
      setBubbles((stack) => pushBubble(stack, { id: ++lastId, sessionId, label, text: words, x: sitter.feet.x, fromUser: personId === PLAYER_ID, head, bornAt: Date.now() }));
    });
  }, [lookFor]);
  // a room opened or closed: the bubbles' speakers moved
  useEffect(() => setBubbles([]), [zoomed]);
  const hasBubbles = bubbles.length > 0;
  useEffect(() => {
    if (!hasBubbles) return;
    const timer = window.setInterval(() => setBubbles((stack) => pruneBubbles(stack, Date.now())), PRUNE_EVERY_MS);
    return () => window.clearInterval(timer);
  }, [hasBubbles]);

  // the camera of the classic room: the overview and each room opened big keep their own frame
  useRoomFrame(board, zoomedRoom ? `cozy:${zoomedRoom.id}` : 'cozy', boardHome);

  // the canvas's own box already carries the frame (its scale and move), so the pointer is mapped through it
  const pointOf = (event: MouseEvent<HTMLCanvasElement>): Point => {
    const box = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - box.left) * layout.width / box.width, y: (event.clientY - box.top) * layout.height / box.height };
  };
  // several sessions docked are a layout the user built: a stray click must not close them all (each has its cross)
  const leave = () => { if (sessionsIn(useSessions.getState().columns).length <= 1) useSessions.getState().clearDesk(); };
  const visitorsHere = () => scene.current.placed.flatMap((room) => room.visitors);
  /**
   * What is under the pointer, in the rooms as last drawn (things.ts targetAt): someone, the pet, a thing. The user is
   * their computer while seated at it; walking or seated elsewhere, a click on them falls on the floor they stand on.
   */
  const targetHere = (point: Point): CozyTarget => {
    const walked = walk.current;
    const atComputer = (room: CozyRoom) => walked?.id !== room.id || walked.scene.playerSpot?.atDesk === true;
    const placed = scene.current.placed.map(({ room, at, sitters, visitors }) => ({ room, at, people: [...sitters.filter(({ id }) => id !== PLAYER_ID || atComputer(room)), ...visitors] }));
    const { pet } = useSessions.getState().preferences;
    return targetAt(point, placed, { zoomed: zoomedRoom !== null, petRoom: pet.kind === 'none' ? null : catRoom(scene.current.rooms) });
  };
  // a poke on the pet: the classic room's cuddle, the same pet poked again while it is still awake
  const pokePet = (room: string) => {
    const pet = poked.current?.room === room ? poked.current.pet : sleepingPet();
    cuddle(pet);
    poked.current = { room, pet };
  };
  // the time a room's clock tells, in a card over it: the room, and where its clock is on the board
  const [clockCard, setClockCard] = useState<{ room: string; x: number; y: number } | null>(null);
  const showTime = (index: number) => {
    const room = shown[index], { wall, a, z, radius } = clockOf(room), [x, y] = wallPoint(wall, a, z + radius + 2);
    setClockCard({ room: room.id, x: (layout.slots[index].x + x) * scale, y: (layout.slots[index].y + y) * scale });
  };
  // a room opened or closed, the rooms moved: the card goes
  useEffect(() => setClockCard(null), [zoomed, layout, scale]);

  // a long press on a session of the room opened big picks them up, to put them on another seat, like in the classic room
  const roomPointOf = (event: MouseEvent<HTMLCanvasElement>): Point => {
    const point = pointOf(event), at = layout.slots[0];
    return { x: point.x - at.x, y: point.y - at.y };
  };
  const { carrying, handlers, consumeDrop } = useCarry(() => walk.current?.scene ?? null, roomPointOf, {
    onPickUp: () => { scene.current.hoveredId = null; scene.current.hovered = null; setHintText(null); },
    onDrop: (moved: Scene<SceneFloor>) => {
      const walked = walk.current;
      if (!walked?.seatsKey) return;
      // one person per seat: whoever was kept on a seat someone now sits on loses it
      const next = keepSeats(keptIn(walked.id), moved.seats());
      kept.current.set(walked.seatsKey, next);
      writePreference(walked.seatsKey, Object.fromEntries(next));
      setMoves((count) => count + 1);
    },
  });

  const onClick = (event: MouseEvent<HTMLCanvasElement>) => {
    // the click that ends a drop must not open the session
    if (consumeDrop()) return;
    const point = pointOf(event);
    const { index, person, pet, thing } = targetHere(point);
    if (index < 0) { if (zoomedRoom) back(); else leave(); return; }
    const room = shown[index];
    // someone opens their session, in a room opened big or among all of them, like in the classic office; a visitor
    // of the crew, a new session with them
    const visitor = visitorsHere().find((placed) => placed.id === person);
    if (visitor) { useSessions.getState().openNewSession({ person: visitor.name }); return; }
    if (person) { show(person); return; }
    if (pet) { pokePet(room.id); return; }
    const state = useSessions.getState();
    switch (thing) {
      case 'computer': state.send({ t: 'openTerminal' }); return;
      case 'metrics': state.openModsPanel(true); return;
      case 'board': state.openBoard(true); return;
      // the user walks out through it first, in a room opened big
      case 'door': if (walk.current?.id === room.id) walk.current.scene.walkPlayerOut(); else goThrough(room); return;
      case 'clock': showTime(index); return;
    }
    if (!zoomedRoom) { open(room); return; }
    const walked = walk.current;
    if (walked?.id === room.id) sendUser(walked.scene, { x: point.x - layout.slots[index].x, y: point.y - layout.slots[index].y });
  };
  // what a click on the thing under the pointer does, in a card that follows the pointer (the classic room's)
  const hint = useRef<HTMLDivElement>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const onMouseMove = (event: MouseEvent<HTMLCanvasElement>) => {
    if (walk.current?.scene.carried) return;
    const { index, person, thing } = targetHere(pointOf(event));
    scene.current.hoveredId = person;
    scene.current.hovered = thing ? { room: shown[index].id, thing } : null;
    setHoveredRoom(index < 0 || zoomedRoom ? null : shown[index].id);
    const visitor = visitorsHere().find((placed) => placed.id === person);
    const text = visitor ? t.room.hint.startWith(visitor.name) : hintOf(thing, shown[index]);
    setHintText(text);
    if (hint.current && text) placeHintCard(hint.current, stage.current!, event);
  };
  const onMouseLeave = () => { scene.current.hoveredId = null; scene.current.hovered = null; setHoveredRoom(null); setHintText(null); };

  const width = layout.width * scale, height = layout.height * scale;
  const seated = shown.reduce((sum, room) => sum + room.desks.people.length + room.resting.people.length, 0);
  const words = t.room.cozy;
  return (
    <div className="cp-room cp-cozy" style={PALETTE_VARIABLES}>
      <div className="cp-cozy__bar">
        {zoomedRoom ? (
          <button type="button" className="cp-button cp-cozy__back" onClick={back}><BackIcon />{words.back}</button>
        ) : (
          <div className="cp-segmented" role="group" aria-label={words.show.label}>
            {COZY_SHOWS.map((option) => <button key={option} type="button" aria-pressed={showing === option} onClick={() => choose(option)}>{words.show[option]}</button>)}
          </div>
        )}
      </div>
      <div className="cp-cozy__stage" ref={stage}>
        <div
          className="cp-cozy__board" ref={board} style={{ width, height, left: fit.left, top: fit.top, '--cozy-band': `${Math.min(BUBBLE_BAND * scale, fit.top)}px` } as CSSProperties}
          data-hovering={hoveredRoom !== null || hintText !== null || undefined} data-carrying={carrying || undefined}
        >
          <canvas
            ref={canvas} className="cp-cozy__canvas" width={Math.round(layout.width * pixels)} height={Math.round(layout.height * pixels)}
            onClick={onClick} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} {...handlers}
            role="img" aria-label={words.description(shown.length, seated)}
          />
          {shown.map((room, index) => (
            <RoomPlate
              key={room.id} room={room} at={layout.slots[index]} scale={scale} hovered={hoveredRoom === room.id} zoomed={zoomedRoom !== null}
              listOpen={openList === room.id} onOpen={() => open(room)} onPin={() => togglePin(room.folder)}
              onList={() => setOpenList((current) => (current === room.id ? null : room.id))} onShow={(id) => { show(id); setOpenList(null); }}
            />
          ))}
          <div className="cp-room__bubbles" aria-hidden="true">
            {bubbles.map((bubble) => <SpeechBubble key={bubble.id} bubble={bubble} layout={{ width, scale, offset: 0 }} onOpen={() => show(bubble.sessionId)} />)}
          </div>
          {clockCard && <ClockCard key={clockCard.room} x={clockCard.x} y={clockCard.y} onClose={() => setClockCard(null)} />}
        </div>
        <div ref={hint} className="cp-room__hint-card" hidden={!hintText} aria-hidden="true">{hintText}</div>
      </div>
      <ArrangeHint />
    </div>
  );
}

/** "13:21": the time of the rooms' clocks (the "try an hour" preview, else now), as the user writes the time. */
const clockText = (hour: number) => {
  const minute = clockMinute(hour), at = new Date();
  at.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
  return formatClock(at.getTime());
};

/** The time a clock tells, in a card over it: it follows the minutes and the preview, and goes on Escape or a click elsewhere. */
function ClockCard({ x, y, onClose }: { x: number; y: number; onClose: () => void }) {
  const previewHour = useSessions((s) => s.preview.hour);
  const [now, setNow] = useState(currentHour);
  const card = useRef<HTMLOutputElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const timer = window.setInterval(() => setNow(currentHour()), 1000);
    // before the room's own Escape (back to all the rooms) and before a click elsewhere does what it does
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && !event.isComposing) { event.preventDefault(); close.current(); } };
    const onPointer = (event: PointerEvent) => { if (!card.current?.contains(event.target as Node)) close.current(); };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('pointerdown', onPointer, true);
    return () => { window.clearInterval(timer); window.removeEventListener('keydown', onKey, true); window.removeEventListener('pointerdown', onPointer, true); };
  }, []);
  const time = clockText(previewHour ?? now);
  const position = { '--clock-x': `${Math.round(x)}px`, '--clock-y': `${Math.round(y)}px` } as CSSProperties;
  return <output ref={card} className="cp-cozy__clock" style={position} aria-live="polite" aria-label={t.room.cozy.clock.time(time)}>{time}</output>;
}

interface PlateProps {
  room: CozyRoom; at: Point; scale: number; hovered: boolean; zoomed: boolean; listOpen: boolean;
  onOpen: () => void; onPin: () => void; onList: () => void; onShow: (sessionId: string) => void;
}

/** Under each room: its name (a click opens it), the pin of a project, and "+N" for the sessions without a desk (a click lists them). */
function RoomPlate({ room, at, scale, hovered, zoomed, listOpen, onOpen, onPin, onList, onShow }: PlateProps) {
  const words = t.room.cozy;
  const name = roomName(room);
  const hidden = room.unseated.length;
  const position = { '--plate-x': `${Math.round((at.x + ROOM_BOX.width / 2) * scale)}px`, '--plate-y': `${Math.round((at.y + PLATE_Y) * scale)}px` } as CSSProperties;
  return (
    <div className="cp-cozy__plate" style={position} data-lit={room.lit} data-hovered={hovered || undefined}>
      {zoomed ? <span className="cp-cozy__name">{name}</span> : <button type="button" className="cp-cozy__name" onClick={onOpen}>{name}</button>}
      {room.kind === 'project' && (
        <button type="button" className="cp-cozy__pin" aria-pressed={room.pinned} title={room.pinned ? words.unpin(name) : words.pin(name)} aria-label={room.pinned ? words.unpin(name) : words.pin(name)} onClick={onPin}>
          {room.pinned ? <UnpinIcon /> : <PinIcon />}
        </button>
      )}
      {hidden > 0 && (
        <button type="button" className="cp-cozy__more" aria-expanded={listOpen} title={t.room.hidden.more(hidden)} onClick={onList}>+{hidden}</button>
      )}

      {listOpen && (
        <ul className="cp-cozy__list" aria-label={t.room.hidden.list}>
          {room.unseated.map((session) => <li key={session.id}><button type="button" onClick={() => onShow(session.id)}>{session.name}</button></li>)}
        </ul>
      )}
    </div>
  );
}


