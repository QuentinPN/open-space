// The cozy rooms (Preferences.roomStyle 'cozy'): a little isometric room per project around the user's flat, on one
// canvas. A click on a room opens it big (the header's project filter does too); Escape or the back button goes back
// to all of them. In a room opened big, a click on someone opens their session, like in the classic office; the user's
// computer at home opens a terminal, opened big or not, and a room's clock tells the time; both are outlined under the
// pointer, like the classic room's clickable things. Each room's art is drawn once per mood of the hour and festival
// (decor.ts, home/art.ts); each frame only paints the people, the visitors, the clocks' hands, the screens and the Z's
// over it (paint.ts). The hour, the festival, the office life and the hidden names are the classic room's settings.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import type { FestivalDay } from '../../../shared/festivals.ts';
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
import { chibiHead } from '../chibi.ts';
import { hdSprites } from '../chibi-hd.ts';
import { TAG_FONT, visitorPose } from '../draw.ts';
import { runFrames } from '../frame-loop.ts';
import type { Point } from '../geometry.ts';
import { currentHour, lightingAt } from '../lighting.ts';
import { crewLook } from '../looks.ts';
import { outfitFor } from '../outfits.ts';
import { PLAYER_ID, selfName } from '../scene.ts';
import { Visits, birthdayWishOf, visitorId } from '../visitors.ts';
import { ArrangeHint } from '../ArrangeHint.tsx';
import { SpeechBubble, placeHintCard, showSky } from '../RoomView.tsx';
import { useRoomFrame, type HomeOf } from '../useRoomFrame.ts';
import { BUBBLE_BAND, ROOM_BOX, figureAt, fitOverview, overviewLayout, roomAt, type Box, type Overview } from './geometry.ts';
import { placeSitters, type PlacedSitter } from './people.ts';
import { paintCozy, type CozyFrameOptions, type FrameRoom, type PlacedVisitor } from './paint.ts';
import { callFace, clockOf, homeThemeOf, pcAt, roomClockAt } from './home/index.ts';
import { wallPoint } from './pixels.ts';
import { cozyPetOf } from './pet.ts';
import { clockMinute } from './time.ts';
import { cozyVisitFloor, visitedRoom, visitorFeet } from './visits.ts';
import { COZY_SHOWS, callers, catRoom, cozyRooms, nameIn, recentFolders, shownProjects, type CozyRoom, type CozyShow } from './rooms.ts';

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

/** The room's words on its plate: the project's name, the flat's, the server room's. */
const roomName = (room: CozyRoom) => (room.kind === 'home' ? t.room.cozy.home : room.kind === 'servers' ? t.room.cozy.servers : room.name);

/** The visitors' ids carry their name (visitors.ts visitorId): they wear their crew member's look. */
const VISITOR_PREFIX = visitorId('');

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
  const automata = useSessions(hasAutomata);
  const costs = useSessions((s) => s.costs);
  const roots = useSessions((s) => s.roots);
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
  const [sprites] = useState(() => hdSprites(lookFor, (personId) => {
    const { festival, guests } = dayRef.current;
    return personId === PLAYER_ID ? outfitFor(festival, selfName(crewRef.current), true, guests) : outfitFor(festival, nameOf(personId), false, guests);
  }));

  // the recent projects come from the usage report (the conversations of the last days): asked for once, when needed
  useEffect(() => { if (showing === 'recent' && !costs) useSessions.getState().loadCosts(); }, [showing, costs]);
  const list = useMemo(() => Object.values(sessions), [sessions]);
  const pins = useMemo(() => pinned ?? [], [pinned]);
  const recent = useMemo(() => recentFolders(costs?.conversations ?? [], roots, Date.now()), [costs, roots]);
  const folders = useMemo(() => shownProjects(showing, list, seen, recent, pins), [showing, list, seen, recent, pins]);
  // who sat where, so nobody changes seats as others come and go
  const seats = useRef(new Map<string, ReadonlyMap<string, number>>());
  const rooms = useMemo(() => cozyRooms({
    sessions: list, seen, projects: folders, pinned: pins, automata, homeTheme,
    previous: (roomId, part) => seats.current.get(`${roomId}:${part}`) ?? new Map(),
  }), [list, seen, folders, pins, automata, homeTheme]);
  roomsRef.current = rooms;
  // the crew without a session, who may drop by an office (Preferences.officeLife), as in the classic room
  const free = useMemo(() => availability(crew, list).filter((person) => person.place === 'free').map((person) => person.member.name), [crew, list]);
  const freeRef = useRef(free);
  freeRef.current = free;
  // the sessions on the user's screen at home, in their own colours
  const callFaces = useMemo(() => callers(rooms, CALL_TILES).map((person) => callFace(lookFor(person.id), person.status === 'working')), [rooms, crew, lookFor]);
  useEffect(() => {
    for (const room of rooms) { seats.current.set(`${room.id}:desks`, room.desks.seats); seats.current.set(`${room.id}:couch`, room.couch.seats); }
  }, [rooms]);

  // the room opened big; gone (its last session forgotten), all of them again
  const zoomedRoom = zoomed === null ? null : rooms.find((room) => room.id === zoomed) ?? null;
  const shown = useMemo(() => (zoomedRoom ? [zoomedRoom] : rooms), [zoomedRoom, rooms]);
  const layout: Overview = useMemo(() => overviewLayout(shown.length), [shown.length]);

  // the header's project filter opens that project's room; picking "all" again goes back to all of them
  const followed = useRef(project);
  useEffect(() => {
    if (project) setZoomed(project);
    else if (followed.current) setZoomed((current) => (current === followed.current ? null : current));
    followed.current = project;
  }, [project]);

  const open = (room: CozyRoom) => {
    setOpenList(null);
    // the server room is the automatons' own: their room and its robots
    if (room.kind === 'servers') { useSessions.getState().setView('automates'); return; }
    setZoomed(room.id);
    if (headerProjects.some(({ folder }) => folder === room.id)) useSessions.getState().setProject(room.id);
  };
  const back = () => {
    setZoomed(null);
    setOpenList(null);
    if (useSessions.getState().project) useSessions.getState().setProject('');
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
  const visiting = useRef<{ id: string | null; room: CozyRoom | null; visits: Visits | null }>({ id: null, room: null, visits: null });
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
  const placedOf = (time: number): FrameRoom[] => {
    const { shown: now, layout: where } = scene.current;
    return now.map((room, index) => ({ room, at: where.slots[index], sitters: placeSitters(room, where.slots[index], sprites, time, reducedMotion), visitors: visitorsIn(room, where.slots[index], time) }));
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
      const visited = visitedRoom(scene.current.rooms, scene.current.zoomed);
      const visit = visiting.current;
      if ((visited?.id ?? null) !== visit.id) {
        visit.id = visited?.id ?? null;
        visit.visits = visited ? new Visits(cozyVisitFloor(() => visiting.current.room, () => dayRef.current.festival)) : null;
      }
      visit.room = visited;
      visit.visits?.step(elapsed, { free: freeRef.current, hour, enabled: state.preferences.officeLife, blocked: null });
      const placed = placedRef.current(time);
      scene.current.placed = placed;
      const { festival } = dayRef.current;
      paintCozy(context, sprites, placed, {
        time, hour, festival, scale: scene.current.pixels, tagScale: scene.current.tagScale, reducedMotion, hideNames: state.preferences.hideNames === true, tagColors: state.preferences.tagColors,
        hoveredId: scene.current.hoveredId, openSessionIds: selected.current, playerName: selfName(crewRef.current), callFaces: scene.current.callFaces,
        hovered: scene.current.hovered,
        // the pet sleeps in one room of all of them, the same whether that one is opened big or not
        catRoom: state.preferences.pet.kind === 'none' ? '' : catRoom(scene.current.rooms), pet: cozyPetOf(state.preferences.pet),
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
  const sittersHere = () => scene.current.placed.flatMap((room) => room.sitters as PlacedSitter[]);
  const visitorsHere = () => scene.current.placed.flatMap((room) => room.visitors);
  // a point of the overview in the room it falls in, by its index in the slots
  const inRoom = (point: Point, index: number): Point => ({ x: point.x - layout.slots[index].x, y: point.y - layout.slots[index].y });
  // the user's computer at home, under a point of the room it falls in (opened big or not)
  const onComputer = (point: Point, index: number) => {
    const room = shown[index];
    return room?.kind === 'home' && pcAt(room.home ?? homeThemeOf(undefined), inRoom(point, index));
  };
  /**
   * What is under the pointer: someone (a session, the user, a visitor) in a room opened big, else the user's computer,
   * else a room's clock.
   */
  const targetAt = (point: Point, index: number): { person: string | null; computer: boolean; clock: boolean } => {
    const person = zoomedRoom ? figureAt(point, [...sittersHere(), ...visitorsHere()]) : null;
    const computer = index >= 0 && (person === PLAYER_ID || (!person && onComputer(point, index)));
    return { person, computer, clock: index >= 0 && !person && !computer && roomClockAt(shown[index], inRoom(point, index)) };
  };
  // the time a room's clock tells, in a card over it: the room, and where its clock is on the board
  const [clockCard, setClockCard] = useState<{ room: string; x: number; y: number } | null>(null);
  const showTime = (index: number) => {
    const room = shown[index], { wall, a, z, radius } = clockOf(room), [x, y] = wallPoint(wall, a, z + radius + 2);
    setClockCard({ room: room.id, x: (layout.slots[index].x + x) * scale, y: (layout.slots[index].y + y) * scale });
  };
  // a room opened or closed, the rooms moved: the card goes
  useEffect(() => setClockCard(null), [zoomed, layout, scale]);

  const onClick = (event: MouseEvent<HTMLCanvasElement>) => {
    const point = pointOf(event);
    const index = roomAt(point, layout.slots);
    if (index < 0) { if (zoomedRoom) back(); else leave(); return; }
    // the user's computer (or the user at it) opens a terminal, like the user's screen in the classic office
    const { person, computer, clock } = targetAt(point, index);
    if (computer) { useSessions.getState().send({ t: 'openTerminal' }); return; }
    if (clock) { showTime(index); return; }
    if (!zoomedRoom) { open(shown[index]); return; }
    // in a room opened big, someone opens their session; a visitor of the crew, a new session with them
    const visitor = visitorsHere().find((placed) => placed.id === person);
    if (visitor) { useSessions.getState().openNewSession({ person: visitor.name }); return; }
    if (person) show(person);
  };
  // what a click on the thing under the pointer does, in a card that follows the pointer (the classic room's)
  const hint = useRef<HTMLDivElement>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const onMouseMove = (event: MouseEvent<HTMLCanvasElement>) => {
    const point = pointOf(event);
    const index = roomAt(point, layout.slots);
    const { person, computer, clock } = targetAt(point, index);
    scene.current.hoveredId = person;
    scene.current.hovered = computer || clock ? { room: shown[index].id, thing: computer ? 'computer' : 'clock' } : null;
    setHoveredRoom(index < 0 || zoomedRoom ? null : shown[index].id);
    const visitor = visitorsHere().find((placed) => placed.id === person);
    const text = computer ? t.room.hint.openTerminal : clock ? t.room.cozy.clock.hint : visitor ? t.room.hint.startWith(visitor.name) : null;
    setHintText(text);
    if (hint.current && text) placeHintCard(hint.current, stage.current!, event);
  };
  const onMouseLeave = () => { scene.current.hoveredId = null; scene.current.hovered = null; setHoveredRoom(null); setHintText(null); };

  const width = layout.width * scale, height = layout.height * scale;
  const seated = shown.reduce((sum, room) => sum + room.desks.people.length + room.couch.people.length, 0);
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
          data-hovering={hoveredRoom !== null || hintText !== null || undefined}
        >
          <canvas
            ref={canvas} className="cp-cozy__canvas" width={Math.round(layout.width * pixels)} height={Math.round(layout.height * pixels)}
            onClick={onClick} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
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
  const asleep = room.couch.hiddenSessions;
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
      {asleep > 0 && <span className="cp-cozy__asleep" title={words.asleep(asleep)}>z +{asleep}</span>}
      {listOpen && (
        <ul className="cp-cozy__list" aria-label={t.room.hidden.list}>
          {room.unseated.map((session) => <li key={session.id}><button type="button" onClick={() => onShow(session.id)}>{session.name}</button></li>)}
        </ul>
      )}
    </div>
  );
}


