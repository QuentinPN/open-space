import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { describe, it } from 'node:test';
import { HOME_THEMES, type HomeTheme, type SessionInfo, type SessionState } from '../../shared/protocol.ts';
import { earlySpeech, pauseSpeech, speechOf, USER_SPEAKER } from '../state/speech.ts';
import { VISIBLE_ROWS, bubbleText, earlyBubbleText, pruneBubbles, pushBubble, type Bubble } from './bubbles.ts';
import type { SeenSequences } from '../state/queue.ts';
import { decorOf, planRoom, roleTitle, roomSessions } from './cast.ts';
import { OFFICE_PORTAL, SERVER_PORTAL, LOUNGE, METRICS_KINDS, METRICS_OBJECT, METRICS_PIECES, OFFICE, ORB, ROOM, SERVER_ROOM, blockedTiles, festivalVisits, isMetricsPiece, podFacing, layoutOn, type MetricsKind } from '../../shared/room-layout.ts';
import { FESTIVALS, easterSunday, festivalDay, festivalOn, type Festival } from '../../shared/festivals.ts';
import { outfitFor } from './outfits.ts';
import { Floor } from './floor.ts';
import { boxOutline, depthOf, distance, facingVector, insideConvex, isInRoom, tileCenter, toScreen, toTile, type Point } from './geometry.ts';
import { PLAYER_ID, Scene, directionOf, type Character } from './scene.ts';
import { Visits, birthdayWishOf, visitorId } from './visitors.ts';
import { createPet, isSpeaking, petBeam, petWords, stepPet, type Pet } from './pet.ts';
import { assignSeats, keepSeats, savedSeats } from './seats.ts';
import { NO_GEAR, parseLook, randomLook } from '../../shared/look.ts';
import { AUTOMATON_LOOK, DEFAULT_LOOK, ROBOT_ACCENTS } from '../design/people-palette.ts';
import { furnitureDepth } from './pixel-furniture.ts';
import { chestOf, cordEnd, cordPath, isOrbAt, orbCenter, orbFloorY, packetsOn, pulseRings, waitingSign } from './server-room.ts';
import { packetShare, skyLinks, skyNodes, skyTowers } from './themes/servers-sky.ts';
import { ORB_SHAPE } from './server-furniture.ts';
import { robotHeight, robotLook, robotRows, withRobots } from './robot.ts';
import type { SpriteSource } from './sprites.ts';
import { ART_SCALE } from './pixel-art.ts';
import { automatonAgentPersonId, automatonPersonId, type AutomataState, type AutomatonRun } from '../../shared/automata.ts';
import { appendRunEvents, seatedRuns } from '../state/automata.ts';
import { lookOfStranger } from './chibi.ts';
import { metricsBadgeAt, showsMetricsBadge } from './metrics.ts';
import { BOARD, DOODLES, LINE_HEIGHT, birthdayLines, boardContent, doodlesWidth, lettersPerLine, textWidth } from './whiteboard.ts';
import { stackLabels } from './labels.ts';
import { BEAM_MS, beamGlow, beamProgress, ellipseDistance, hiddenInBeam, portalMotes, portalParticles, vortex } from './portal.ts';
import { advanceTrip, exitsOf, pickExit, startTrip, through } from './pet-trip.ts';
import { PORTAL, pieceHeight, portalPoint } from './pixel-furniture.ts';
import { WALL_EFFECT } from './themes/kit.ts';
import { ROOM_THEMES } from '../../shared/room-themes.ts';
import { DESK_COUNT, PERSON_SPACING, ROOM_BOX, ROOM_OUTLINE, ROOM_UNITS, couchArmDepth, couchDepth, deskPlace, feetOf, figureAt, fitOverview, iso, overviewLayout, roomAt } from './cozy/geometry.ts';
import { AMBIANCES, AMBIANCE_IDS, ambianceFor, pickAmbiance, type AmbianceChoice, type AmbianceMotion } from './cozy/ambiance/index.ts';
import { MotionLayer, colourMask, type Pen } from './cozy/motion.ts';
import { placeSitters } from './cozy/people.ts';
import { hdArt, hdHeight } from './chibi-hd.ts';
import { PixelGrid, box, onLeftFace, onRightFace, wallPatch, wallPoint } from './cozy/pixels.ts';
import { LOUNGE_ID, callers, cozyRooms, cozySeatsKey, projectRoom, recentFolders, shownProjects, type CozyRoom } from './cozy/rooms.ts';
import { COZY_VIEW, CozyFloor, cozyFloorPlan, hides, tileOf } from './cozy/floor.ts';
import { HOME_DESIGNS, clockOf, pcAt, roomClockAt } from './cozy/home/index.ts';
import { METRICS_SCREEN } from './cozy/home/kit.ts';
import { cozyPetOf, petZzzAt, type PetPixels } from './cozy/pet.ts';
import { homeErrand, homePet, stepHomePet } from './cozy/home-pet.ts';
import { ARCADE, ARCADE_FRONT, LOUNGE_PLACES } from './cozy/lounge.ts';
import { LOUNGE_MOTION, loungeLayout } from './cozy/lounge-art.ts';
import { DOOR as COZY_DOOR, newGrid, roomLayout } from './cozy/decor.ts';
import { targetAt, thingAt } from './cozy/things.ts';
import { COZY_TIMES, clockMinute, cozyTimeOf, sceneKey, type CozyTime } from './cozy/time.ts';
import { paintFestiveWalls } from './cozy/festive.ts';
import { homeLightAt, outsideAt } from './cozy/light.ts';
import { VISIT_UNIT, cozyVisitFloor, visitSpotsIn, visitedRoom, visitorFeet } from './cozy/visits.ts';
import { COZY_PALETTE } from '../design/room-palette.ts';
import { projectsOf } from '../state/projects.ts';
import type { ConversationSpan } from '../../shared/usage.ts';

const session = (id: string, state: SessionState, extra: Partial<SessionInfo> = {}): SessionInfo => ({
  id, name: id, cwd: `/work/${id}`, model: '', activeModel: '', permissionMode: 'auto', state, stateSince: 1000, createdAt: 0, turns: 1, permissions: [],
  subagents: [], command: '', lastMessage: '', resumable: true, lastSeq: 5, ...extra,
});
const NOBODY = new Map<string, number>();
const close = (a: Point, b: Point) => distance(a, b) < 1e-6;
const OFFICE_FLOOR = new Floor(OFFICE);
const LOUNGE_FLOOR = new Floor(LOUNGE);
const SEAT_COUNT = OFFICE_FLOOR.seatCount;
const DOOR = OFFICE_FLOOR.door;
const BLOCKED = blockedTiles(OFFICE_FLOOR.layout.furniture);
const planOffice = (sessions: readonly SessionInfo[], seen: SeenSequences, previous: ReadonlyMap<string, number>) => planRoom(sessions, seen, previous, SEAT_COUNT);
const officeScene = () => {
  const scene = new Scene(OFFICE_FLOOR);
  scene.bringPet(null, Infinity, []);
  return scene;
};
/** No step lands on furniture (the doorway, outside the grid, is the only point off a tile). */
const offFurniture = (path: readonly Point[]) => path.every((point) => !BLOCKED.has(`${Math.floor(point.x)},${Math.floor(point.y)}`));

describe('isometric grid', () => {
  it('turns tiles into canvas pixels and back', () => {
    for (const tile of [{ x: 0, y: 0 }, { x: 3.5, y: 7.25 }, DOOR]) assert.ok(close(toTile(toScreen(tile)), tile));
  });

  it('lets the player walk on the floor, not on furniture or into the walls', () => {
    assert.equal(OFFICE_FLOOR.isWalkable({ x: 6.5, y: 9.5 }), true);
    assert.equal(OFFICE_FLOOR.isWalkable({ x: 3.5, y: 3.5 }), false, 'a desk');
    assert.equal(OFFICE_FLOOR.isWalkable({ x: 0.1, y: 5 }), false);
    assert.equal(OFFICE_FLOOR.isWalkable({ x: ROOM.width + 1, y: 5 }), false);
    assert.equal(OFFICE_FLOOR.isWalkable({ x: 11.5, y: 0.5 }), false, 'the whiteboard against the wall');
    assert.equal(OFFICE_FLOOR.isWalkable({ x: 3.5, y: 2.5 }), true, 'a chair can be walked to');
  });
});

describe('walking routes', () => {
  it('goes from the door to a chair and back out, tile by tile and never over furniture', () => {
    for (let seat = 0; seat < SEAT_COUNT; seat++) {
      const inward = OFFICE_FLOOR.pathToSeat(DOOR, seat);
      assert.ok(close(inward.at(-1)!, OFFICE_FLOOR.seatPosition(seat)));
      assert.ok(offFurniture(inward));
      const outward = OFFICE_FLOOR.pathToDoor(OFFICE_FLOOR.seatPosition(seat));
      assert.ok(close(outward.at(-1)!, DOOR));
      assert.ok(offFurniture(outward));
    }
  });

  it('walks the player to the centre of a tile, around the desks, without cutting their corners', () => {
    assert.deepEqual(OFFICE_FLOOR.route({ x: 4.5, y: 9.5 }, { x: 5.2, y: 9.9 }), [{ x: 5.5, y: 9.5 }]);
    const around = OFFICE_FLOOR.route({ x: 4.5, y: 2.5 }, { x: 4.5, y: 4.5 });
    assert.ok(offFurniture(around));
    for (let index = 1; index < around.length; index++) {
      const from = around[index - 1];
      const to = around[index];
      if (from.x !== to.x && from.y !== to.y) {
        assert.ok(!BLOCKED.has(`${Math.floor(to.x)},${Math.floor(from.y)}`) && !BLOCKED.has(`${Math.floor(from.x)},${Math.floor(to.y)}`), 'no corner cut');
      }
    }
  });
});

describe('the break room', () => {
  it('sits everyone on a sofa against its back, reachable from the door without crossing furniture', () => {
    const blocked = blockedTiles(LOUNGE_FLOOR.layout.furniture);
    assert.ok(LOUNGE_FLOOR.seatCount >= 20);
    for (let seat = 0; seat < LOUNGE_FLOOR.seatCount; seat++) {
      const inward = LOUNGE_FLOOR.pathToSeat(LOUNGE_FLOOR.door, seat);
      assert.ok(close(inward.at(-1)!, LOUNGE_FLOOR.seatPosition(seat)));
      assert.ok(inward.every((point) => !blocked.has(`${Math.floor(point.x)},${Math.floor(point.y)}`)));
      assert.ok(LOUNGE_FLOOR.seatLift(seat) > 0, 'on cushions');
    }
  });

  it('lets the user sit on any sofa, and keeps their seat free of sessions', () => {
    assert.equal(LOUNGE_FLOOR.layout.playerSpots.length, LOUNGE_FLOOR.seatCount);
    const scene = new Scene(LOUNGE_FLOOR, {});
    const first = LOUNGE_FLOOR.layout.seats[0];
    scene.sitPlayerAt(LOUNGE_FLOOR.spotAt({ x: first.x + 0.5, y: first.y + 0.5 })!);
    assert.deepEqual([...scene.playerSeats()], [0]);
    const plan = planRoom([session('a', 'closed', { resting: true })], {}, NOBODY, LOUNGE_FLOOR.seatCount, 'lounge', scene.playerSeats());
    assert.equal(plan.seats.get('a'), 1);
  });

  it('holds the resting and closed sessions; the office holds the others', () => {
    const sessions = [session('rests', 'closed', { resting: true }), session('gone', 'closed'), session('idle', 'wait', { turns: 0 }), session('broken', 'error', { lastSeq: 9 })];
    assert.deepEqual(roomSessions(sessions, {}, 'lounge').flat().map(({ id }) => id), ['rests', 'gone']);
    assert.deepEqual(roomSessions(sessions, {}, 'office').flat().map(({ id }) => id), ['broken', 'idle'], 'an unseen error waits for the user at work');
    assert.deepEqual(roomSessions(sessions, { broken: 9 }, 'lounge').flat().map(({ id }) => id), ['rests', 'gone', 'broken']);
  });

  it('puts carved pumpkins in both rooms for Halloween only', () => {
    const pumpkins = (floor: Floor) => floor.layout.furniture.filter((piece) => piece.kind === 'pumpkin').length;
    assert.equal(pumpkins(OFFICE_FLOOR), 0);
    assert.ok(pumpkins(new Floor(OFFICE, 'halloween')) > 0);
    assert.ok(pumpkins(new Floor(LOUNGE, 'halloween')) > 0);
  });
});

describe('festivals', () => {
  it('knows the day of each one, the one-day ones first', () => {
    const on = (month: number, day: number, year = 2026) => festivalOn(new Date(year, month - 1, day));
    assert.equal(festivalOn(new Date(2026, 9, 20), ['10-20']), 'birthday', 'a birthday of the crew, over Halloween');
    assert.equal(on(10, 20), 'halloween', 'nobody born that day');
    assert.equal(on(10, 19), 'halloween');
    assert.equal(on(11, 3), null);
    assert.equal(on(12, 24), 'christmas');
    assert.equal(on(12, 31), 'newYear');
    assert.equal(on(1, 2, 2027), 'newYear');
    assert.equal(on(1, 6), 'epiphany');
    assert.equal(on(2, 2), 'candlemas');
    assert.equal(on(2, 17), 'chineseNewYear');
    assert.equal(on(2, 14, 2029), 'valentine', 'over the Chinese New Year of 2029');
    assert.equal(on(4, 14), 'songkran');
    assert.deepEqual(easterSunday(2026), [4, 5]);
    assert.deepEqual(easterSunday(2027), [3, 28]);
    assert.equal(on(4, 6), 'easter');
    assert.equal(on(5, 1), 'mayDay');
    assert.equal(on(6, 21), 'music');
    assert.equal(on(7, 14), 'bastille');
    assert.equal(on(8, 15), 'summer');
    assert.equal(on(6, 10), null);
  });

  it('dresses people for the day: crowns for the guests only, a water gun for the user only', () => {
    assert.equal(outfitFor('epiphany', 'Lina', false, ['Max', 'Lina']).hat, 'crown');
    assert.equal(outfitFor('epiphany', 'Tom', false, ['Max', 'Lina']).hat, undefined);
    assert.equal(outfitFor('birthday', 'Max', true, ['Max']).hat, 'crown');
    assert.equal(outfitFor('birthday', 'Tom', false, ['Max']).hat, 'party');
    assert.equal(outfitFor('christmas', 'Tom', false).hat, 'santa');
    assert.deepEqual(outfitFor('songkran', 'Max', true), { swimwear: true, sunglasses: true, waterGun: true });
    assert.equal(outfitFor('songkran', 'Tom', false).waterGun, undefined);
    assert.deepEqual(outfitFor(null, 'Tom', false), {});
  });

  it('says who a day is for: the crew born that day, the user and one drawn for the year at Epiphany', () => {
    const crew = [{ name: 'Max', self: true, birthday: '03-12' }, { name: 'Lina', birthday: '10-20' }, { name: 'Tom' }];
    assert.deepEqual(festivalDay(new Date(2026, 9, 20), crew), { festival: 'birthday', guests: ['Lina'] });
    assert.deepEqual(festivalDay(new Date(2026, 5, 10), crew, 'birthday'), { festival: 'birthday', guests: ['Max'] }, 'previewed: the user');
    const epiphany = festivalDay(new Date(2027, 0, 6), crew);
    assert.equal(epiphany.guests[0], 'Max');
    assert.ok(['Lina', 'Tom'].includes(epiphany.guests[1]));
    assert.deepEqual(festivalDay(new Date(2026, 5, 10), []), { festival: null, guests: [] });
  });

  it('dresses both rooms without blocking a seat, a spot of the user or the way to them', () => {
    for (const festival of FESTIVALS) {
      for (const layout of [OFFICE, LOUNGE]) {
        const floor = new Floor(layout, festival);
        const blocked = blockedTiles(floor.layout.furniture);
        const where = `${festival} in the ${layout === OFFICE ? 'office' : 'break room'}`;
        for (const piece of floor.layout.furniture) assert.ok(piece.x >= 0 && piece.y >= 0 && piece.x + piece.width <= ROOM.width && piece.y + piece.depth <= ROOM.depth, `${piece.kind} inside, ${where}`);
        const before = blockedTiles(layout.furniture);
        const added = blockedTiles(floor.layout.furniture.slice(layout.furniture.length));
        for (const tile of added) assert.ok(!before.has(tile), `nothing under the ${festival} pieces at ${tile}, ${where}`);
        for (const seat of layout.seats) assert.ok(!added.has(`${seat.x},${seat.y}`), `seat ${seat.x},${seat.y} free, ${where}`);
        for (let seat = 0; seat < floor.seatCount; seat++) {
          const path = floor.pathToSeat(floor.door, seat);
          assert.ok(close(path.at(-1)!, floor.seatPosition(seat)), `seat ${seat} reachable, ${where}`);
          assert.ok(path.every((point) => !blocked.has(`${Math.floor(point.x)},${Math.floor(point.y)}`)), `seat ${seat}, ${where}`);
        }
        for (const spot of floor.layout.playerSpots) assert.ok(!added.has(`${Math.floor(spot.at.x)},${Math.floor(spot.at.y)}`), `the user's spot free, ${where}`);
      }
    }
  });
});

describe('seats', () => {
  it('keeps people in their chair and gives newcomers the first free seats', () => {
    const seats = assignSeats([{ id: 'a' }, { id: 'b' }, { id: 'c' }], new Map([['a', 0]]), 12);
    assert.equal(seats.get('a'), 0);
    assert.deepEqual([seats.get('b'), seats.get('c')], [1, 2]);
  });

  it('never gives more seats than the room has, nor the same seat twice', () => {
    const seats = assignSeats(Array.from({ length: SEAT_COUNT + 2 }, (_, index) => ({ id: `s${index}` })), NOBODY, SEAT_COUNT);
    assert.equal(seats.size, SEAT_COUNT);
    assert.equal(new Set(seats.values()).size, SEAT_COUNT);
    assert.equal(seats.has(`s${SEAT_COUNT}`), false);
  });
});

describe('who is in the room', () => {
  it('names the role of a kit command, and nothing else', () => {
    assert.equal(roleTitle('kit:screenshots'), 'Screenshots');
    assert.equal(roleTitle('kit:aso'), 'ASO');
    assert.equal(roleTitle('superpowers:brainstorming'), 'Brainstorming', 'any plugin');
    assert.equal(roleTitle('compact'), null);
    assert.equal(roleTitle(''), null);
  });

  it('seats the sessions waiting for the user first, then the working ones; closed ones are not there', () => {
    const idle = Array.from({ length: SEAT_COUNT + 1 }, (_, index) => session(`idle${index}`, 'wait', { turns: 0 }));
    const sessions = [...idle, session('busy', 'work'), session('asks', 'perm', { permissions: [{ requestId: 'r', who: 'chef', tool: 'Bash', detail: 'ls', canAlways: false }] }), session('gone', 'closed')];
    const plan = planOffice(sessions, {}, NOBODY);
    const ids = plan.people.map((person) => person.id);
    assert.equal(ids.length, SEAT_COUNT);
    assert.deepEqual(ids.slice(0, 2), ['asks', 'busy']);
    assert.equal(ids.includes('gone'), false);
    assert.equal(plan.hiddenSessions, sessions.length - 1 - SEAT_COUNT, 'all but the closed one want a seat');
    assert.equal(plan.people[0].status, 'permission');
    assert.equal(plan.people[1].status, 'working');
  });

  it('keeps seated idle sessions over newcomers of the same group (no musical chairs)', () => {
    const last = SEAT_COUNT + 2;
    const sessions = Array.from({ length: last + 1 }, (_, index) => session(`s${index}`, 'wait', { turns: 0, createdAt: index }));
    const plan = planOffice(sessions, {}, new Map([[`s${last}`, 3]]));
    assert.equal(plan.seats.get(`s${last}`), 3);
    assert.equal(plan.seats.has(`s${last - 1}`), false);
  });

  it('keeps sub-agents with their session instead of giving them a chair', () => {
    const sessions = [session('a', 'work', { command: 'kit:design', subagents: [{ id: 't1', name: 'Bob', type: 'Explore' }, { id: 't2', name: 'Eve', type: '' }] })];
    const plan = planOffice(sessions, {}, NOBODY);
    assert.equal(plan.people.length, 1);
    assert.equal(plan.people[0].title, 'Design');
    assert.deepEqual(plan.people[0].agents, [{ id: 't1', name: 'Bob', type: 'Explore' }, { id: 't2', name: 'Eve', type: 'Sous-agent' }]);
  });

  it('shows a finished turn until it is seen', () => {
    const finished = session('a', 'wait', { lastSeq: 9 });
    assert.equal(planOffice([finished], {}, NOBODY).people[0].status, 'finished');
    assert.equal(planOffice([finished], { a: 9 }, NOBODY).people[0].status, null);
  });
});

describe('scene', () => {
  const walkFor = (scene: Scene, ms: number) => { for (let elapsed = 0; elapsed < ms; elapsed += 66) scene.step(66); };

  it('seats the people already there at once, and newcomers walk in from the door', () => {
    const scene = officeScene();
    scene.sync(planOffice([session('a', 'wait')], {}, scene.seats()), true);
    assert.equal(scene.characters.get('a')!.phase, 'seated');
    scene.sync(planOffice([session('a', 'wait'), session('b', 'work')], {}, scene.seats()), false);
    const newcomer = scene.characters.get('b')!;
    assert.equal(newcomer.phase, 'entering');
    assert.ok(close(newcomer.position, DOOR));
    walkFor(scene, 15_000);
    assert.equal(newcomer.phase, 'seated');
    assert.ok(close(newcomer.position, OFFICE_FLOOR.seatPosition(newcomer.seat)));
  });

  it('walks out whoever left the plan, then forgets them; someone called back turns around', () => {
    const scene = officeScene();
    scene.sync(planOffice([session('a', 'wait'), session('b', 'wait')], {}, scene.seats()), true);
    scene.sync(planOffice([session('a', 'wait')], {}, scene.seats()), false);
    assert.equal(scene.characters.get('b')!.phase, 'leaving');
    assert.equal(scene.seats().has('b'), false);
    scene.step(300);
    scene.sync(planOffice([session('a', 'wait'), session('b', 'wait')], {}, scene.seats()), false);
    assert.equal(scene.characters.get('b')!.phase, 'entering');
    scene.sync(planOffice([session('a', 'wait')], {}, scene.seats()), false);
    walkFor(scene, 15_000);
    assert.equal(scene.characters.has('b'), false);
  });

  it('lets the user carry someone to a free seat or swap seats, and back to theirs when let go elsewhere', () => {
    const scene = officeScene();
    scene.sync(planOffice([session('a', 'wait'), session('b', 'wait')], {}, scene.seats()), true);
    const a = scene.characters.get('a')!, b = scene.characters.get('b')!;
    const before = a.seat;
    assert.ok(scene.pickUp(a));
    assert.ok(scene.freeSeats().includes(before));
    assert.ok(!scene.freeSeats().includes(b.seat));
    const free = scene.freeSeats().find((seat) => seat !== before)!;
    const target = scene.seatScreenPosition(free);
    scene.carryTo({ x: target.x, y: target.y - 22 });
    assert.equal(scene.dropSeat(), free);
    assert.equal(scene.drop(), true);
    assert.equal(a.phase, 'seated');
    assert.equal(a.seat, free);
    assert.ok(close(a.position, OFFICE_FLOOR.seatPosition(free)));
    // the plan made from the scene keeps the new seat: no walking back
    scene.sync(planOffice([session('a', 'wait'), session('b', 'wait')], {}, scene.seats()), false);
    assert.equal(a.phase, 'seated');
    // onto someone else's seat: they swap, the other one walking over
    const theirs = b.seat;
    scene.pickUp(a);
    const taken = scene.seatScreenPosition(theirs);
    scene.carryTo({ x: taken.x, y: taken.y - 22 });
    assert.equal(scene.drop(), true);
    assert.equal(a.seat, theirs);
    assert.equal(b.seat, free);
    assert.equal(b.phase, 'entering');
    walkFor(scene, 15_000);
    assert.equal(b.phase, 'seated');
    // let go away from any seat: back to their own
    scene.pickUp(a);
    scene.carryTo({ x: 5, y: 5 });
    assert.equal(scene.drop(), false);
    assert.equal(a.seat, theirs);
  });

  it('lets go of someone carried whose session left', () => {
    const scene = officeScene();
    scene.sync(planOffice([session('a', 'wait')], {}, scene.seats()), true);
    scene.pickUp(scene.characters.get('a')!);
    scene.sync(planOffice([], {}, scene.seats()), false);
    assert.equal(scene.carried, null);
    assert.equal(scene.characters.get('a')!.phase, 'leaving');
  });

  it('finds who is under a click', () => {
    const scene = officeScene();
    scene.sync(planOffice([session('a', 'wait')], {}, scene.seats()), true);
    const feet = toScreen(scene.characters.get('a')!.position);
    assert.equal(scene.characterAt({ x: feet.x, y: feet.y - 20 })?.person.id, 'a');
    assert.equal(scene.characterAt({ x: feet.x + 40, y: feet.y - 20 }), null);
  });

  it('seats the player at the boss desk, lets them walk off, and sits them where they click a seat', () => {
    const scene = officeScene();
    assert.equal(scene.playerSpot?.atDesk, true);
    scene.walkPlayerTo({ x: 6.5, y: 9.5 });
    assert.equal(scene.playerSpot, null);
    walkFor(scene, 10_000);
    const sofa = OFFICE_FLOOR.spotAt({ x: 0.5, y: 13.5 })!;
    assert.equal(sofa.atDesk, false);
    scene.sitPlayerAt(sofa);
    walkFor(scene, 10_000);
    assert.equal(scene.playerSpot, sofa);
    assert.deepEqual(scene.player.position, { x: 0.62, y: 13.5 });
    scene.sitPlayerAt(OFFICE_FLOOR.spotAt({ x: 9.5, y: 6.5 })!);
    walkFor(scene, 10_000);
    assert.deepEqual(scene.player.position, { x: 9.5, y: 5.5 });
  });

  it('lets the pet wander on free tiles, rest, and speak in its own way when poked', () => {
    const pet = createPet(OFFICE_FLOOR);
    let seed = 1;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let elapsed = 0; elapsed < 120_000; elapsed += 66) {
      stepPet(pet, 66, OFFICE_FLOOR, [], random);
      assert.ok(OFFICE_FLOOR.isWalkable(pet.position), 'never on furniture');
    }
    assert.match(petWords(pet, 'cat'), /Miaou|Mrr|Mraou/);
    assert.match(petWords(pet, 'dog'), /Ouaf|Wouf/);
    assert.match(petWords(pet, 'rocky'), /♫/, 'Rocky speaks in chords');
    assert.match(petWords(pet, 'duck'), /Coin|bug/);
    assert.match(petWords(pet, 'owl'), /Hou/);
    const scene = officeScene();
    const paws = toScreen(scene.pet!.position);
    assert.equal(scene.pokePet({ x: paws.x, y: paws.y - 10 }), true);
    assert.equal(isSpeaking(scene.pet!), true);
    assert.equal(scene.pokePet({ x: paws.x + 60, y: paws.y }), false);
  });

  it('gives a click to whoever stands in front: a session before the pet behind it, up to the top of their hat', () => {
    const scene = officeScene();
    const pet = scene.pet!;
    const position = { x: pet.position.x + 0.5, y: pet.position.y + 0.5 };
    const person = { id: 'front', sessionId: 'front' } as Character['person'];
    scene.characters.set('front', { person, seat: 0, phase: 'entering', position, heading: { x: 1, y: 0 }, path: [], blinkOffset: 0 });
    const paws = toScreen(pet.position);
    assert.equal(scene.pokePet({ x: paws.x, y: paws.y - 10 }), false, 'the session in front takes it');
    const feet = toScreen(position);
    const hat = { x: feet.x, y: feet.y - 64 };
    assert.equal(scene.characterAt(hat), null, 'above the head');
    scene.heightOf = () => 70;
    assert.equal(scene.characterAt(hat)?.person.id, 'front', 'on the party hat');
  });

  it('walks the user out through the door when it is clicked, and brings them in through it in the other room', () => {
    const door = OFFICE_FLOOR.layout.door;
    const base = toScreen({ x: 0, y: door.y + 0.6 });
    assert.equal(OFFICE_FLOOR.isDoorAt({ x: base.x, y: base.y - 30 }), true);
    assert.equal(OFFICE_FLOOR.isDoorAt({ x: base.x, y: base.y - 200 }), false, 'the wall above it');
    assert.equal(OFFICE_FLOOR.isDoorAt(toScreen({ x: 0, y: door.y + 4 })), false, 'further along the wall');
    const scene = officeScene();
    scene.walkPlayerOut();
    walkFor(scene, 15_000);
    assert.equal(scene.playerWentOut, true);
    assert.ok(close(scene.player.position, OFFICE_FLOOR.door));
    const arriving = new Scene(LOUNGE_FLOOR, { atDoor: true });
    assert.equal(arriving.playerSpot, null);
    walkFor(arriving, 3_000);
    assert.ok(close(arriving.player.position, LOUNGE_FLOOR.inside));
    assert.equal(arriving.playerWentOut, false);
  });

  it('finds the user’s laptop under the pointer, on their desk in the office only', () => {
    const laptop = OFFICE_FLOOR.userScreen!;
    const at = (x: number, y: number, height: number) => { const base = toScreen({ x, y }); return { x: base.x, y: base.y - height }; };
    const middleX = (laptop.fromX + laptop.toX) / 2;
    assert.equal(OFFICE_FLOOR.isUserScreenAt(at(middleX, laptop.toY, (laptop.low + laptop.high) / 2)), true, 'the lid');
    assert.equal(OFFICE_FLOOR.isUserScreenAt(at(middleX, (laptop.fromY + laptop.toY) / 2, laptop.low)), true, 'the keyboard');
    assert.equal(OFFICE_FLOOR.isUserScreenAt(at(middleX, laptop.toY, 2)), false, 'the desk under it');
    assert.equal(OFFICE_FLOOR.isUserScreenAt(at(laptop.fromX - 1, laptop.toY, laptop.low)), false, 'the rest of the desk');
    assert.equal(LOUNGE_FLOOR.userScreen, null);
  });

  it('has no cat in the break room', () => {
    const scene = new Scene(LOUNGE_FLOOR, {});
    assert.equal(scene.pet, null);
    assert.equal(scene.pokePet({ x: 100, y: 300 }), false);
  });

  it('faces the four screen diagonals', () => {
    assert.equal(directionOf({ x: 1, y: 0 }), 'down-right');
    assert.equal(directionOf({ x: 0, y: 1 }), 'down-left');
    assert.equal(directionOf({ x: 0, y: -1 }), 'up-right');
    assert.equal(directionOf({ x: -1, y: 0 }), 'up-left');
  });
});

describe('speech bubbles', () => {
  const bubble = (id: number, bornAt: number) => ({ id, sessionId: 's', label: 'Iris', text: 'Salut', x: 100, fromUser: false, head: '', bornAt });

  it('keeps the first sentence of a message, without markdown, shortened', () => {
    assert.equal(bubbleText('**Fait.** Les tests passent.'), 'Fait.');
    assert.equal(bubbleText('Voici le plan :\n\n1. un\n2. deux'), 'Voici le plan :');
    assert.equal(bubbleText('`npm test` est vert'), 'npm test est vert');
    assert.equal(bubbleText('a'.repeat(200)).length, 150);
    assert.equal(bubbleText('```\ncode\n```'), '');
  });

  it('gives the bubble of a message being written once its first sentence is over, the same as the whole message', () => {
    assert.equal(earlyBubbleText('Je regarde le code'), null);
    assert.equal(earlyBubbleText('Je regarde le code.'), null, 'the sentence may go on (1.5, …)');
    assert.equal(earlyBubbleText('Je regarde le code. Puis'), 'Je regarde le code.');
    assert.equal(earlyBubbleText('Voici le plan :\n\n1.'), bubbleText('Voici le plan :\n\n1. un'));
    assert.equal(earlyBubbleText('a'.repeat(151)), bubbleText('a'.repeat(400)), 'too long: cut as the whole one will be');
    assert.equal(earlyBubbleText('```\ncode\n```\n\n'), null, 'nothing to say in a bubble');
  });

  it('makes one bubble per message: early from its draft, then none from the whole message', () => {
    assert.equal(earlySpeech('e', 'chef', 'Je regarde'), null);
    assert.deepEqual(earlySpeech('e', 'chef', 'Je regarde. Le'), { sessionId: 'e', speaker: 'chef', text: 'Je regarde.' });
    assert.equal(earlySpeech('e', 'chef', 'Je regarde. Le code'), null, 'already said');
    assert.equal(speechOf('e', { k: 'state', state: 'work' }), null);
    assert.equal(speechOf('e', { k: 'say', who: 'chef', text: 'Je regarde. Le code est propre.' }), null);
    assert.equal(speechOf('e', { k: 'say', who: 'chef', text: 'Fini.' })?.text, 'Fini.', 'the next message has its own bubble');
    assert.equal(earlySpeech('e', 'toolu_1', 'Je liste. Puis'), null, 'never for a sub-agent');
  });

  it('says once in a bubble that the usage limit paused a session, and again only if the pause moves', () => {
    const now = new Date(2026, 10, 13, 15, 0);
    const until = new Date(2026, 10, 13, 19, 0).getTime();
    const before = { id: 'p', state: 'work' } as SessionInfo;
    const paused = { id: 'p', state: 'wait', pausedUntil: until } as SessionInfo;
    assert.deepEqual(pauseSpeech(before, paused, now), { sessionId: 'p', speaker: 'chef', text: 'Limite d’usage atteinte : en pause jusqu’à 19:00, puis je reprends.' });
    assert.equal(pauseSpeech(paused, { ...paused }, now), null);
    assert.equal(pauseSpeech(paused, { ...paused, pausedUntil: undefined }, now), null, 'resuming says nothing');
    assert.equal(pauseSpeech(paused, { ...paused, pausedUntil: until + 3_600_000 }, now)?.text, 'Limite d’usage atteinte : en pause jusqu’à 20:00, puis je reprends.');
    assert.equal(pauseSpeech(undefined, paused, now), null, 'a session already paused when the page loads');
  });

  it('pushes older bubbles up, fades those pushed past the top, then drops them', () => {
    let stack: readonly Bubble[] = [];
    for (let id = 1; id <= VISIBLE_ROWS + 1; id++) stack = pushBubble(stack, bubble(id, 1000));
    assert.deepEqual(stack.map((item) => item.row), Array.from({ length: VISIBLE_ROWS + 1 }, (_, index) => VISIBLE_ROWS - index));
    assert.deepEqual(stack.map((item) => item.fadingSince !== null), [true, ...Array(VISIBLE_ROWS).fill(false)]);
    stack = pruneBubbles(stack, 1700);
    assert.equal(stack.length, VISIBLE_ROWS);
    assert.equal(pruneBubbles(stack, 1800), stack);
    stack = pruneBubbles(stack, 10_000);
    assert.ok(stack.every((item) => item.fadingSince === 10_000));
    assert.equal(pruneBubbles(stack, 10_700).length, 0);
  });

  it('hears what the assistant says and what the user sends, not tool calls', () => {
    assert.deepEqual(speechOf('s', { k: 'say', who: 'chef', text: 'Bonjour' }), { sessionId: 's', speaker: 'chef', text: 'Bonjour' });
    assert.equal(speechOf('s', { k: 'start', text: '/kit:new' })?.speaker, USER_SPEAKER);
    assert.equal(speechOf('s', { k: 'say', who: 'toolu_1', text: 'Je regarde' }), null, 'a sub-agent speaks in its tab only');
    assert.equal(speechOf('s', { k: 'act', who: 'chef', id: 'c', tool: 'Read', detail: '/a' }), null);
  });
});

describe('light of the day', () => {
  it('is neutral at midday with the sun in, dark and starry at night, warm at dusk', async () => {
    const { lightingAt } = await import('./lighting.ts');
    const noon = lightingAt(13);
    assert.deepEqual(noon.tint, [255, 255, 255]);
    assert.ok(noon.beam > 0.9 && noon.stars === 0);
    const night = lightingAt(2);
    assert.ok(night.stars === 1 && night.glow === 1);
    assert.ok(night.tint[2] > night.tint[0], 'blue at night');
    const dusk = lightingAt(19.5);
    assert.ok(dusk.tint[0] > dusk.tint[2], 'warm at dusk');
    assert.ok(lightingAt(18).reach > noon.reach, 'a low sun throws the light further');
    assert.ok(lightingAt(9).slant < 0 && lightingAt(17).slant > 0, 'morning and evening light come from opposite sides');
  });
});

describe('looks', () => {
  const look = { ...lookOfStranger('someone') };

  it('gives a stranger the same look every time', () => {
    assert.deepEqual(lookOfStranger('session-a'), lookOfStranger('session-a'));
    assert.ok(parseLook(lookOfStranger('session-b')), 'a look the server would accept');
  });

  it('accepts only a complete look with known traits and #rrggbb colours', () => {
    assert.deepEqual(parseLook(look), look);
    assert.equal(parseLook({ ...look, hair: 'beehive' }), null);
    const { sunglasses: _sun, headphones: _phones, hat: _hat, hatColor: _hatColor, eyes: _eyes, eyeGear: _eyeGear, faceGear: _faceGear, neckGear: _neckGear,
      shoulderGear: _shoulderGear, backGear: _backGear, waistGear: _waistGear, handGear: _handGear, backColor: _backColor, ...older } = look;
    assert.deepEqual(parseLook(older), { ...look, eyes: 'round', sunglasses: false, headphones: false, hat: 'none', hatColor: DEFAULT_LOOK.hatColor, ...NO_GEAR, backColor: DEFAULT_LOOK.backColor }, 'a look saved before them keeps everything else');
    assert.equal(parseLook({ ...older, accessory: 'parrot' })?.shoulderGear, 'parrot', 'the single accessory of an older look goes where it is worn now');
    assert.deepEqual(parseLook({ ...older, accessory: 'none' }), parseLook(older));
    const anime = { ...look, top: 'narutoJacket', bottom: 'luffyShorts', shoes: 'zoroBoots', hat: 'strawHat', faceGear: 'mask', waistGear: 'swords' } as const;
    assert.deepEqual(parseLook(anime), anime, 'anime pieces mix like any other');
    assert.equal(parseLook({ ...look, backGear: 'cape' }), null);
    assert.equal(parseLook({ ...look, backGear: 'parrot' }), null, 'each accessory only in its own place');
    const dressedUp = { ...look, hair: 'dreadlocks', eyes: 'starry', top: 'kimono', bottom: 'hakama', shoes: 'geta', hat: 'hachimaki', waistGear: 'katana', backGear: 'shell', shoulderGear: 'parrot' } as const;
    assert.deepEqual(parseLook(dressedUp), dressedUp, 'the dress-up wardrobe mixes like any other');
    assert.equal(parseLook({ ...look, eyes: 'narrow' })?.eyes, 'round', 'eyes no longer offered: round ones, the rest kept');
    assert.equal(parseLook({ ...look, hat: 'sombrero' }), null);
    assert.equal(parseLook({ ...look, topColor: 'red' }), null);
    assert.equal(parseLook({ ...look, glasses: '#121419' })?.glasses, '#121419');
    const { watch: _watch, ...missing } = look;
    assert.equal(parseLook(missing), null);
  });
});

describe('random looks', () => {
  it('draws only valid looks, with variety in every trait', () => {
    const seen = new Map<string, Set<unknown>>();
    for (let draw = 0; draw < 200; draw++) {
      const look = randomLook();
      assert.deepEqual(parseLook(look), look, 'a look the server would accept');
      for (const [trait, value] of Object.entries(look)) seen.set(trait, (seen.get(trait) ?? new Set()).add(value));
    }
    for (const [trait, values] of seen) assert.ok(values.size >= 2, `${trait} varies`);
    assert.ok(seen.get('hat')?.has('none') && seen.get('backGear')?.has('none') && seen.get('beard')?.has('none'), 'optional pieces sometimes stay empty');
  });

  it('is decided by the random source alone', () => {
    assert.deepEqual(randomLook(() => 0), randomLook(() => 0));
    assert.deepEqual(parseLook(randomLook(() => 0.999999)), randomLook(() => 0.999999));
  });
});

describe('aisles', () => {
  it('reaches every seat from the door without walking over another chair or sofa, festivals included', () => {
    for (const [layout, name] of [[OFFICE, 'office'], [LOUNGE, 'lounge']] as const) {
      for (const festival of [null, ...FESTIVALS]) {
        const floor = new Floor(layout, festival);
        const seatTiles = new Set(floor.layout.furniture.filter((piece) => !piece.blocks && piece.top === undefined)
          .flatMap((piece) => { const tiles: string[] = []; for (let x = Math.floor(piece.x); x < Math.ceil(piece.x + piece.width); x++) for (let y = Math.floor(piece.y); y < Math.ceil(piece.y + piece.depth); y++) tiles.push(`${x},${y}`); return tiles; }));
        floor.layout.seats.forEach((seat, index) => {
          const path = floor.pathToSeat(floor.door, index);
          const goal = `${seat.x},${seat.y}`;
          const crossed = path.map((point) => `${Math.floor(point.x)},${Math.floor(point.y)}`).filter((tile) => tile !== goal && seatTiles.has(tile));
          assert.deepEqual(crossed, [], `${name} ${festival} seat ${goal}`);
          const end = path.at(-1)!;
          assert.equal(`${Math.floor(end.x)},${Math.floor(end.y)}`, goal, `${name} ${festival} seat ${goal} reached`);
        });
      }
    }
  });
});

describe('office life', () => {
  /** A visit stepped until it is over: `ms` at a time, with everyone free and the morning's rhythm. */
  const stepVisits = (visits: Visits, ms: number, options: Partial<Parameters<Visits['step']>[1]> = {}) => {
    for (let elapsed = 0; elapsed < ms; elapsed += 100) visits.step(100, { free: ['Ana', 'Bo', 'Cy'], hour: 9, enabled: true, blocked: null, ...options });
  };

  it('has its places to drop by on free tiles the door leads to, festivals included', () => {
    for (const festival of [null, ...FESTIVALS]) {
      const floor = new Floor(OFFICE, festival);
      for (const spot of floor.layout.visitSpots ?? []) {
        const tile = { x: Math.floor(spot.at.x), y: Math.floor(spot.at.y) };
        assert.ok(spot.lift !== undefined || floor.isFreeTile(tile.x, tile.y), `${festival} ${spot.activity} at ${tile.x},${tile.y}`);
        const path = floor.route(floor.door, spot.at);
        assert.ok(close(tileCenter(path.at(-1)!), tileCenter(spot.at)), `${festival} ${spot.activity} reachable`);
      }
    }
    assert.ok(new Floor(OFFICE, 'birthday').layout.visitSpots!.some((spot) => spot.activity === 'party'));
    assert.equal(LOUNGE_FLOOR.layout.visitSpots, undefined);
  });

  it('brings two people for a coffee, one behind the other, side by side and turned to each other, then lets them go', () => {
    const visits = new Visits(OFFICE_FLOOR, () => 0);
    assert.equal(visits.start('coffee', ['Ana', 'Bo'], { together: true }).length, 2);
    // they never walk on each other: coming in, standing there, going out
    let closest = Infinity;
    for (let elapsed = 0; elapsed < 60_000 && visits.visitors.size; elapsed += 100) {
      visits.step(100, { free: ['Ana', 'Bo'], hour: 3, enabled: true, blocked: null });
      const inside = [...visits.visitors.values()].filter((visitor) => visitor.outside <= 0 && distance(visitor.position, OFFICE_FLOOR.door) > 1);
      if (inside.length === 2) closest = Math.min(closest, distance(inside[0].position, inside[1].position));
      if (elapsed === 15_000) {
        const [left, right] = [...visits.visitors.values()].sort((a, b) => a.position.x - b.position.x);
        assert.deepEqual([left.phase, right.phase], ['staying', 'staying']);
        assert.deepEqual([directionOf(left.heading), directionOf(right.heading)], ['down-right', 'down-left'], 'turned to each other, both faces showing');
      }
    }
    assert.ok(closest >= 1.2, `${closest} tiles apart at the closest`);
    assert.equal(visits.visitors.size, 0, 'gone through the door');
  });

  it('has those at a birthday party wish it out loud in turn, to everyone it is for but themselves', () => {
    const visits = new Visits(new Floor(OFFICE, 'birthday'), () => 0);
    assert.equal(visits.start('party', ['Ana', 'Bo'], { together: true }).length, 2);
    const guests = ['Ana', 'Lou'];
    const wishes = new Map<string, Set<string>>();
    for (let elapsed = 0; elapsed < 20_000; elapsed += 100) {
      visits.step(100, { free: ['Ana', 'Bo'], hour: 9, enabled: true, blocked: null });
      const wishing = [...visits.visitors.values()].filter((visitor) => birthdayWishOf(visitor, 'birthday', guests));
      assert.ok(wishing.length <= 1, 'one at a time');
      for (const visitor of wishing) wishes.set(visitor.name, new Set(birthdayWishOf(visitor, 'birthday', guests)));
      for (const visitor of visits.visitors.values()) assert.equal(birthdayWishOf(visitor, 'christmas', guests), null, 'only on a birthday');
    }
    assert.deepEqual(wishes, new Map([['Ana', new Set(['Lou'])], ['Bo', new Set(['Ana', 'Lou'])]]));
  });

  it('never has more than two visitors, and sends away one who got a session, or everyone when it is off', () => {
    const visits = new Visits(OFFICE_FLOOR, () => 0);
    visits.start('water', ['Ana']);
    visits.start('window', ['Bo']);
    assert.deepEqual(visits.start('books', ['Cy']), []);
    stepVisits(visits, 200, { free: ['Bo', 'Cy'], hour: 3 });
    assert.notEqual(visits.visitors.get(visitorId('Ana'))?.phase ?? 'gone', 'coming', 'on her way out (or already gone, from the door)');
    assert.equal(visits.visitors.get(visitorId('Bo'))?.phase, 'coming');
    stepVisits(visits, 200, { enabled: false });
    assert.ok([...visits.visitors.values()].every((visitor) => visitor.phase === 'leaving'));
  });

  it('keeps the sofa the user sits on for them', () => {
    const visits = new Visits(OFFICE_FLOOR, () => 0);
    const [first, second] = OFFICE_FLOOR.layout.visitSpots!.filter((spot) => spot.activity === 'sofa');
    visits.start('sofa', ['Ana'], { blocked: first.at });
    assert.equal(visits.visitors.get(visitorId('Ana'))?.spot, second);
  });

  it('comes now and then in the morning, rarely in the evening, never at night', () => {
    /** How many people came in during an hour. */
    const visitsIn = (hour: number) => {
      const visits = new Visits(OFFICE_FLOOR, () => 0.5);
      const seen = new Set<object>();
      for (let elapsed = 0; elapsed < 60 * 60_000; elapsed += 100) {
        visits.step(100, { free: ['Ana', 'Bo', 'Cy'], hour, enabled: true, blocked: null });
        for (const visitor of visits.visitors.values()) seen.add(visitor);
      }
      return seen.size;
    };
    const morning = visitsIn(9), evening = visitsIn(20);
    assert.ok(morning >= 15 && morning <= 30, `${morning} in a morning hour`);
    assert.ok(evening >= 3 && evening <= 6, `${evening} in an evening hour`);
    assert.equal(visitsIn(2), 0);
  });
});

describe('the room on screen', () => {
  it('tells the room (floor, walls, their top) from the dark around it', () => {
    assert.ok(isInRoom(toScreen({ x: ROOM.width / 2, y: ROOM.depth / 2 })), 'the middle of the floor');
    assert.ok(isInRoom({ x: toScreen({ x: 0, y: 0 }).x, y: toScreen({ x: 0, y: 0 }).y - 90 }), 'high on the back corner');
    assert.ok(!isInRoom({ x: 5, y: 470 }), 'the bottom left corner of the canvas');
    assert.ok(!isInRoom({ x: 635, y: 10 }), 'the top right corner');
    const front = toScreen({ x: ROOM.width, y: ROOM.depth });
    assert.ok(!isInRoom({ x: front.x, y: front.y + 6 }), 'just under the front corner of the floor');
  });
});

describe('the whiteboard', () => {
  it('stands in the office only, and the pointer finds it', () => {
    const board = OFFICE_FLOOR.board!;
    // the middle of the board, not a point on its outline, where rounding decides
    const foot = toScreen({ x: (board.fromX + board.toX) / 2, y: (board.fromY + board.toY) / 2 });
    assert.ok(OFFICE_FLOOR.isBoardAt({ x: foot.x, y: foot.y - board.high / 2 }));
    assert.equal(OFFICE_FLOOR.isBoardAt(toScreen({ x: 5, y: 9 })), false);
    assert.equal(LOUNGE_FLOOR.board, null);
    assert.ok(!OFFICE.furniture.some((piece) => piece.kind === ('printer' as string) || piece.kind === ('server' as string)), 'no printer nor server rack any more');
    for (const spot of OFFICE.visitSpots!.filter((spot) => spot.activity === 'window')) assert.ok(spot.at.x < board.fromX - 1 || spot.at.x > board.toX + 1, `the window at ${spot.at.x} is away from the whiteboard`);
    const cooler = OFFICE.furniture.find((piece) => piece.kind === 'cooler')!;
    const water = OFFICE.visitSpots!.find((spot) => spot.activity === 'water')!;
    assert.ok(distance(water.at, { x: cooler.x + 0.5, y: cooler.y + 0.5 }) < 1.5, 'a glass of water at the cooler, by the coffee machine');
  });

  it('shows notes on an ordinary day, doodles for a festival, and wishes a happy birthday to whoever it is', () => {
    assert.deepEqual(boardContent(null, []), { kind: 'notes' });
    assert.deepEqual(boardContent('birthday', ['Lina']), { kind: 'birthday', lines: ['HBD', 'LINA !!'] });
    assert.deepEqual(boardContent('birthday', ['Hélène']), { kind: 'birthday', lines: ['HBD', 'HELENE', '!!'] }, 'capitals without accents, "!!" below when it does not fit');
    assert.deepEqual(birthdayLines(['Maximilien']), ['HBD', 'MAXIMIL', '!!'], 'cut to the board');
    assert.deepEqual(birthdayLines([]), ['HBD !!']);
    const halloween = boardContent('halloween', []);
    assert.ok(halloween.kind === 'doodles' && halloween.doodles.includes('pumpkin'));
    const christmas = boardContent('christmas', []);
    assert.ok(christmas.kind === 'doodles' && christmas.doodles.includes('tree'));
  });

  it('fits what it shows on its surface, every festival included', () => {
    for (const festival of FESTIVALS) {
      const content = boardContent(festival, ['Christophe']);
      if (content.kind === 'birthday') {
        assert.ok(content.lines.every((line) => line.length <= lettersPerLine && textWidth(line) <= BOARD.columns), festival);
        assert.ok(content.lines.length * LINE_HEIGHT - 2 <= BOARD.rows, festival);
      } else if (content.kind === 'doodles') {
        assert.ok(doodlesWidth(content.doodles) <= BOARD.columns, `${festival} wide`);
        for (const doodle of content.doodles) assert.ok(DOODLES[doodle].length <= BOARD.rows && DOODLES[doodle].every((row) => row.length === DOODLES[doodle][0].length), `${festival} ${doodle}`);
      }
    }
  });
});

describe('the numbers object', () => {
  /** The office with one draft of the numbers object. */
  const officeWith = (kind: MetricsKind) => new Floor({ ...OFFICE, furniture: [...OFFICE.furniture, METRICS_PIECES[kind]] });
  const at = (x: number, y: number, height: number) => { const base = toScreen({ x, y }); return { x: base.x, y: base.y - height }; };

  it('is in the office only once the settings name a numbers file', () => {
    assert.equal(OFFICE_FLOOR.metrics, null);
    assert.ok(!OFFICE_FLOOR.layout.furniture.some(isMetricsPiece));
    const floor = new Floor(OFFICE, null, true);
    assert.deepEqual(floor.layout.furniture.filter(isMetricsPiece).map((piece) => piece.kind), [METRICS_OBJECT]);
    assert.ok(floor.metrics);
    assert.equal(new Floor(LOUNGE, null, true).metrics, null, 'not in the break room');
  });

  it('stands on a wall, a desk or a shelf without taking a tile, and the pointer finds it, each draft', () => {
    for (const kind of METRICS_KINDS) {
      const floor = officeWith(kind);
      const piece = METRICS_PIECES[kind];
      const box = floor.metrics!;
      assert.equal(piece.blocks, false, kind);
      assert.ok(piece.wall || piece.top !== undefined, `${kind} hangs or stands on something`);
      if (piece.wall) {
        assert.equal(piece.x, 0, `${kind} on the left wall`);
        assert.ok(piece.y + piece.depth < OFFICE.door.y - 0.5, `${kind} clear of the door`);
        assert.ok(box.high <= 100, `${kind} under the top of the wall`);
      } else {
        const support = OFFICE.furniture.find((other) => other !== piece && other.x === piece.x && other.y === piece.y && other.width === piece.width)!;
        assert.ok(support && support.kind !== piece.kind, `${kind} on its desk or shelf`);
      }
      assert.ok(floor.isMetricsAt(at((box.fromX + box.toX) / 2, box.toY, (box.low + box.high) / 2)), `${kind} under the pointer`);
      assert.equal(floor.isMetricsAt(toScreen({ x: 10, y: 10 })), false, kind);
      assert.deepEqual(blockedTiles(floor.layout.furniture), BLOCKED, `${kind} blocks nothing`);
    }
    const laptop = OFFICE_FLOOR.userScreen!;
    assert.ok(officeWith('cash').metrics!.toX < laptop.fromX, 'the banknotes and the notepad left of the laptop');
  });

  it('keeps every seat and every place to drop by reachable', () => {
    for (const kind of METRICS_KINDS) {
      const floor = officeWith(kind);
      floor.layout.seats.forEach((seat, index) => {
        const end = floor.pathToSeat(floor.door, index).at(-1)!;
        assert.equal(`${Math.floor(end.x)},${Math.floor(end.y)}`, `${seat.x},${seat.y}`, `${kind} seat ${seat.x},${seat.y}`);
      });
      for (const spot of floor.layout.visitSpots ?? []) assert.ok(close(tileCenter(floor.route(floor.door, spot.at).at(-1)!), tileCenter(spot.at)), `${kind} ${spot.activity}`);
    }
  });

  it('shows its badge while something new waits and the panel is closed, above the object, in the room', () => {
    assert.equal(showsMetricsBadge(true, false), true);
    assert.equal(showsMetricsBadge(true, true), false, 'opening the panel clears it at once');
    assert.equal(showsMetricsBadge(false, false), false);
    for (const kind of METRICS_KINDS) {
      const box = officeWith(kind).metrics!;
      const badge = metricsBadgeAt(METRICS_PIECES[kind]);
      assert.ok(isInRoom(badge), `${kind} badge in the room`);
      assert.ok(badge.y < at(box.fromX, box.toY, box.high).y + 4, `${kind} badge above the object`);
    }
  });
});

describe('name tags', () => {
  const box = (left: number, top: number, width = 40) => ({ left, top, width, height: 13 });

  it('leaves tags that do not touch where they are', () => {
    assert.deepEqual(stackLabels([box(0, 100), box(60, 100), box(0, 50)]), [100, 100, 50]);
  });

  it('moves the tag further back above the one in front, and again above a third', () => {
    const tops = stackLabels([box(20, 95), box(0, 100), box(10, 90)]);
    assert.equal(tops[1], 100, 'the front one keeps its place');
    assert.equal(tops[0], 100 - 1 - 13);
    assert.equal(tops[2], tops[0] - 1 - 13);
  });
});

describe('automatons in the room', () => {
  const bot = (id: string, extra: Partial<AutomatonRun> = {}): AutomatonRun => ({
    id, role: 'code-reviewer', task: '', sessionId: '', cwd: '', startedAt: 1, endedAt: null, status: 'running', pid: 1, ...extra,
  });
  const state = (running: AutomatonRun[], agents: AutomataState['agents'] = {}): AutomataState => ({ folder: 'ok', running, recent: [], roles: [], agents });

  it('seats the automatons in their own room only: never at a session\'s desk, never in the break room', () => {
    const sessions = Array.from({ length: SEAT_COUNT - 2 }, (_, index) => session(`s${index}`, 'work'));
    const bots = seatedRuns(state([bot('a'), bot('b'), bot('c')]));
    // the office keeps every desk for the sessions, the automatons' waiting or not
    const office = planRoom(sessions, {}, NOBODY, SEAT_COUNT, 'office', new Set([0]), bots);
    assert.equal(office.people.filter((person) => person.automaton).length, 0);
    assert.equal(office.people.length, SEAT_COUNT - 2);
    assert.deepEqual(planRoom([], {}, NOBODY, LOUNGE_FLOOR.seatCount, 'lounge', new Set(), bots).people, []);
    // their room holds no session, whatever the sessions do
    const room = planRoom(sessions, {}, NOBODY, SEAT_COUNT, 'automata', new Set([0]), bots);
    assert.deepEqual(room.people.map((person) => person.id), ['a', 'b', 'c'].map(automatonPersonId));
    assert.equal(room.people[0].name, 'Code reviewer');
    assert.equal(room.people[0].status, 'working');
    assert.equal(room.seats.size, 3);
    assert.ok(![...room.seats.values()].includes(0), 'the user\'s seat stays theirs');
    assert.equal(room.hiddenSessions, 0);
    assert.deepEqual(roomSessions(sessions, {}, 'automata').flat(), []);
    // more automatons than desks: the oldest sit
    const many = seatedRuns(state(Array.from({ length: SEAT_COUNT + 2 }, (_, index) => bot(`r${index}`))));
    assert.equal(planRoom([], {}, NOBODY, SEAT_COUNT, 'automata', new Set([0]), many).people.length, SEAT_COUNT - 1);
  });

  it('counts the automatons\' room as the office for the festivals\' decorations (it never has any)', () => {
    assert.equal(decorOf('automata'), 'office');
    assert.equal(decorOf('office'), 'office');
    assert.equal(decorOf('lounge'), 'lounge');
  });

  it('puts the sessions a trigger started in the server room, as robots, before the external runs', () => {
    const fromTrigger = { ...session('t1', 'work'), trigger: { id: 'abcdef12', name: 'Morning recap' } };
    const withRole = { ...session('t2', 'wait'), trigger: { id: 'abcdef13', name: 'Watch', role: 'security-reviewer' } };
    const plain = session('s1', 'work');
    const all = [fromTrigger, withRole, plain];
    assert.deepEqual(roomSessions(all, {}, 'office').flat().map((each) => each.id), ['s1']);
    // waiting for the user first, like in the office
    assert.deepEqual(roomSessions(all, {}, 'automata').flat().map((each) => each.id), ['t2', 't1']);
    const plan = planRoom(all, {}, NOBODY, SEAT_COUNT, 'automata', new Set(), seatedRuns(state([bot('ext')])));
    assert.deepEqual(plan.people.map((person) => [person.sessionId, person.automatonRole, person.automaton]), [
      ['t2', 'security-reviewer', undefined], ['t1', 'Morning recap', undefined], [automatonPersonId('ext'), 'code-reviewer', 'ext'],
    ]);
    // once seen and closed, a trigger's run is in no room: not among the sessions resting in the break room
    const ended = { ...fromTrigger, state: 'closed' as const, resting: true };
    assert.deepEqual(roomSessions([ended], {}, 'lounge').flat(), []);
    assert.deepEqual(roomSessions([ended], {}, 'automata').flat(), []);
  });

  it('seats each sub-agent at work at a desk of its own, after its run, named after its role', () => {
    const agents = { lead: [{ id: 'call-1', role: 'test-writer', task: 'Write the tests' }, { id: 'call-2', role: 'code-reviewer', task: 'Review the diff' }] };
    const plan = planRoom([], {}, NOBODY, SEAT_COUNT, 'automata', new Set(), seatedRuns(state([bot('lead', { role: 'planner' })], agents)));
    assert.deepEqual(plan.people.map((person) => [person.id, person.name, person.automaton, person.automatonAgent]), [
      [automatonPersonId('lead'), 'Planner', 'lead', undefined],
      [automatonAgentPersonId('lead', 'call-1'), 'Test writer', 'lead', 'call-1'],
      [automatonAgentPersonId('lead', 'call-2'), 'Code reviewer', 'lead', 'call-2'],
    ]);
    assert.equal(plan.seats.size, 3);
    // they keep their seats when one of them is back
    const after = planRoom([], {}, NOBODY, SEAT_COUNT, 'automata', new Set(), seatedRuns(state([bot('lead', { role: 'planner' })], { lead: [agents.lead[1]] })));
    const before = new Map([...plan.seats]);
    const kept = planRoom([], {}, before, SEAT_COUNT, 'automata', new Set(), seatedRuns(state([bot('lead', { role: 'planner' })], { lead: [agents.lead[1]] })));
    assert.equal(after.people.length, 2);
    assert.equal(kept.seats.get(automatonAgentPersonId('lead', 'call-2')), plan.seats.get(automatonAgentPersonId('lead', 'call-2')));
  });

  it('dresses every automaton alike, unlike a session', () => {
    assert.notEqual(AUTOMATON_LOOK.skin, DEFAULT_LOOK.skin);
    assert.deepEqual(parseLook(AUTOMATON_LOOK), AUTOMATON_LOOK);
  });

  it('adds what the server sends to a run\'s thread once, the last ones kept', () => {
    const event = (seq: number) => ({ seq, at: seq, ev: { k: 'say' as const, who: 'chef', text: `${seq}` } });
    const log = appendRunEvents({ events: [event(1), event(2)], truncated: false }, [event(2), event(3)]);
    assert.deepEqual(log.events.map((e) => e.seq), [1, 2, 3]);
    const short = appendRunEvents(log, [event(4), event(5)], 3);
    assert.deepEqual(short.events.map((e) => e.seq), [3, 4, 5]);
    assert.equal(short.truncated, true);
    assert.equal(appendRunEvents(log, [event(1)]), log);
  });
});

describe('the teleporter, in every theme and festival', () => {
  const overlaps = (a: { x: number; y: number; width: number; depth: number }, b: { x: number; y: number; width: number; depth: number }) =>
    a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.depth && b.y < a.y + a.depth;
  /** Points of the ring and its inside, on screen: what must never be hidden. */
  const ringPoints = (portal: typeof OFFICE_PORTAL) => {
    const points: Point[] = [];
    for (let across = -PORTAL.across; across <= PORTAL.across; across += 2) for (let high = -PORTAL.up; high <= PORTAL.up; high += 2) {
      if (ellipseDistance(across, high, PORTAL.across, PORTAL.up) > 1) continue;
      const floor = toScreen(portalPoint(portal, across / 8, 0));
      points.push({ x: floor.x, y: floor.y - (PORTAL.plinth + PORTAL.up + high) * ART_SCALE });
    }
    return points;
  };

  for (const [room, layout, portal, automata] of [['office', OFFICE, OFFICE_PORTAL, true], ['server room', SERVER_ROOM, SERVER_PORTAL, false]] as const) {
    it(`stands in the ${room}, clear of every piece, seat and passage, nothing drawn over it, whatever the festival`, () => {
      for (const festival of room === 'office' ? [null, ...FESTIVALS] : [null]) {
        const floor = new Floor(layout, festival, true, automata);
        assert.ok(floor.layout.furniture.includes(portal));
        for (const piece of floor.layout.furniture) {
          if (piece === portal) continue;
          assert.ok(piece.wall || !overlaps(piece, portal), `${festival}: ${piece.kind} on the teleporter`);
          // drawn after it (in front), its box must not cover the ring
          if (furnitureDepth(piece) <= furnitureDepth(portal)) continue;
          const box = { fromX: piece.x, toX: piece.x + piece.width, fromY: piece.y, toY: piece.y + piece.depth, low: (piece.top ?? 0) * ART_SCALE, high: pieceHeight(piece.kind) * ART_SCALE };
          for (const point of ringPoints(portal)) assert.ok(!insideConvex(point, boxOutline(box)), `${festival}: ${piece.kind} at ${piece.x},${piece.y} hides the ring`);
        }
        for (const seat of floor.layout.seats) assert.ok(!overlaps({ x: Math.floor(seat.x), y: Math.floor(seat.y), width: 1, depth: 1 }, portal), `${festival}: a seat on it`);
        for (const spot of floor.layout.visitSpots ?? []) assert.ok(!overlaps({ x: spot.at.x, y: spot.at.y, width: 0.01, depth: 0.01 }, portal), `${festival}: a visit on it`);
        // everyone still reaches their seat, and the way into its ring is free
        for (const [index] of floor.layout.seats.entries()) assert.ok(floor.pathToSeat(floor.inside, index).length > 0, `${festival}: seat ${index}`);
        for (const spot of floor.layout.visitSpots ?? []) assert.ok(floor.route(floor.inside, spot.at).length > 0, `${festival}: the ${spot.activity} visit`);
        assert.ok(floor.isWalkable(floor.portalFront!), `${festival}: the spot before it`);
        assert.ok(floor.pathIntoPortal(floor.inside).length > 1, `${festival}: the way in`);
      }
    });
  }

  it('is drawn over the walls\' art and what moves on them, in every theme: it stands on the floor', () => {
    // a theme or a festival paints its walls in the backdrop, then what moves on them at WALL_EFFECT (-1): a piece on
    // the floor comes after both, so no theme's decoration covers it
    assert.ok(ROOM_THEMES.length >= 8);
    assert.ok(furnitureDepth(OFFICE_PORTAL) > WALL_EFFECT);
    assert.ok(furnitureDepth(SERVER_PORTAL) > WALL_EFFECT);
    assert.equal(OFFICE_PORTAL.wall, undefined);
    // taller than the user (52 room pixels), and under the top of the wall
    const top = (PORTAL.plinth + PORTAL.up * 2) * ART_SCALE;
    assert.ok(top > 52 && top < 100, `${top}`);
    assert.equal(new Floor(OFFICE).portal, null, 'not in the office without the automatons');
    const floor = new Floor(OFFICE, null, false, true);
    for (const point of ringPoints(OFFICE_PORTAL)) assert.ok(floor.isPortalAt(point));
    assert.equal(floor.isPortalAt(toScreen({ x: 10, y: 10 })), false);
  });

  it('turns a vortex inside its ring, and lets motes out into the room', () => {
    const [wide, high] = [PORTAL.across - PORTAL.band, PORTAL.up - PORTAL.band];
    const inside = vortex(0, wide, high);
    assert.ok(inside.every((pixel) => ellipseDistance(pixel.across, pixel.up, wide, high) <= 1));
    assert.ok(inside.some((pixel) => pixel.tone === 2) && inside.some((pixel) => pixel.tone === 1) && inside.some((pixel) => pixel.tone === 0));
    const later = vortex(500, wide, high);
    assert.notDeepEqual(later.filter((pixel) => pixel.tone > 0), inside.filter((pixel) => pixel.tone > 0), 'it turns');
    assert.ok(portalMotes(800, PORTAL.up).every((mote) => mote.out >= 0 && mote.out <= 1.3 && mote.alpha >= 0 && mote.alpha <= 1));
  });

  it('turns something of its own in each theme, inside the ring, and moving', () => {
    const [wide, high] = [PORTAL.across - PORTAL.band, PORTAL.up - PORTAL.band];
    for (const form of ['spiral', 'ripple', 'tunnel', 'rain', 'warp'] as const) {
      const now = vortex(1000, wide, high, form);
      assert.ok(now.every((pixel) => ellipseDistance(pixel.across, pixel.up, wide, high) <= 1 && pixel.alpha > 0 && pixel.alpha <= 1), form);
      assert.ok(now.some((pixel) => pixel.tone === 0) && now.some((pixel) => pixel.tone > 0), `${form}: its deep and what moves in it`);
      assert.notDeepEqual(vortex(1700, wide, high, form).filter((pixel) => pixel.tone > 0), now.filter((pixel) => pixel.tone > 0), `${form} moves`);
    }
  });

  it('lets its theme\'s particles out before it, never behind it nor under the floor', () => {
    const ring = { wide: PORTAL.across, high: PORTAL.up, floor: -(PORTAL.plinth + PORTAL.up) };
    for (const kind of ['motes', 'stars', 'leaves', 'bubbles', 'spray', 'sparks', 'fireflies'] as const) {
      const seen = new Set<string>();
      for (let time = 0; time < 12000; time += 250) for (const particle of portalParticles(kind, time, ring)) {
        assert.ok(particle.out >= 0 && particle.alpha >= 0 && particle.alpha <= 1, `${kind} at ${time}`);
        assert.ok(particle.up >= ring.floor - 2, `${kind} under the floor at ${time}`);
        seen.add(`${particle.across},${particle.up}`);
      }
      assert.ok(seen.size > 10, `${kind} moves`);
    }
    // the leaves fall from over the ring down to the floor
    const leaves = Array.from({ length: 40 }, (_, step) => portalParticles('leaves', step * 140, ring)).flat();
    assert.ok(leaves.some((leaf) => leaf.up > PORTAL.up) && leaves.some((leaf) => leaf.up <= ring.floor + 1));
  });
});

describe('going through the teleporter', () => {
  it('lights a column that hides the user half way, then takes them to the other room', () => {
    assert.equal(beamProgress(0, BEAM_MS / 2), 0.5);
    assert.equal(hiddenInBeam('out', 0.4), false);
    assert.equal(hiddenInBeam('out', 0.6), true);
    assert.equal(hiddenInBeam('in', 0.4), true);
    assert.equal(beamGlow(0.5), 1);
    const scene = new Scene(new Floor(OFFICE, null, false, true), {});
    scene.walkPlayerToPortal();
    assert.ok(scene.player.path.length > 0);
    for (let step = 0; step < 400 && !scene.playerTeleported; step++) scene.step(50);
    assert.equal(scene.playerTeleported, true);
    assert.deepEqual(scene.player.position, new Floor(OFFICE, null, false, true).portal, 'in the ring');
    assert.equal(scene.playerBeam(), null, 'gone at once, like by the door');
  });

  it('brings them in on the twin, walking out of it at once in its light', () => {
    const floor = new Floor(SERVER_ROOM);
    const scene = new Scene(floor, { atPortal: true });
    assert.deepEqual(scene.player.position, floor.portal);
    assert.deepEqual(scene.player.path, [floor.portalFront], 'no standing still in the ring');
    assert.ok(scene.playerBeam());
    scene.step(BEAM_MS + 50);
    assert.equal(scene.playerBeam(), null);
    assert.equal(scene.playerTeleported, false);
    for (let step = 0; step < 40; step++) scene.step(50);
    assert.deepEqual(scene.player.position, floor.portalFront);
  });
});

describe('the pet, from room to room', () => {
  const office = new Floor(OFFICE, null, false, true);
  const run = (pet: Pet, floor: Floor, exits: Parameters<typeof stepPet>[3], ms = 120_000) => {
    let random = 0.37;
    const next = () => { random = (random * 9301 + 49297) % 233280 / 233280; return random; };
    for (let time = 0; time < ms; time += 50) { const left = stepPet(pet, 50, floor, exits, next); if (left) return left; }
    return null;
  };

  it('comes in through the door, the teleporter, or is already there', () => {
    const byDoor = createPet(office, 'door', 60_000, () => 0.5);
    assert.deepEqual(byDoor.position, office.door);
    assert.equal(byDoor.activity, 'walk');
    const byPortal = createPet(office, 'portal', 60_000, () => 0.5);
    assert.deepEqual(byPortal.position, office.portal);
    assert.equal(petBeam(byPortal)?.kind, 'in');
    const there = createPet(office, null, 60_000, () => 0.5);
    assert.equal(there.passing, null);
    assert.ok(office.isWalkable(there.position));
  });

  it('wanders about, then goes out by the way it picked, once', () => {
    const byDoor = createPet(office, null, 8000, () => 0.3);
    assert.equal(run(byDoor, office, ['door']), 'door');
    assert.equal(byDoor.passing, 'gone');
    assert.equal(stepPet(byDoor, 50, office, ['door']), null, 'told once');
    const byPortal = createPet(office, null, 8000, () => 0.3);
    assert.equal(run(byPortal, office, ['portal']), 'portal');
    assert.deepEqual(byPortal.position, office.portal);
    // never out by the teleporter of a room without one
    const lounge = new Floor(LOUNGE);
    assert.equal(run(createPet(lounge, null, 8000, () => 0.3), lounge, ['portal'], 40_000), null);
  });

  it('goes from room to room: the door to the break room, the teleporter to the automatons\' room', () => {
    assert.deepEqual(exitsOf('office').map((exit) => [exit.via, exit.to]), [['door', 'lounge'], ['portal', 'automata']]);
    assert.deepEqual(exitsOf('lounge').map((exit) => exit.to), ['office']);
    assert.deepEqual(exitsOf('automata').map((exit) => [exit.via, exit.to]), [['portal', 'office']]);
    const trip = startTrip(1000, () => 0);
    assert.equal(trip.room, 'office');
    assert.equal(trip.via, null);
    assert.deepEqual(through(trip, 'portal', 5000, () => 0), { room: 'automata', via: 'portal', since: 5000, stay: trip.stay });
    assert.equal(through(trip, 'door', 5000).room, 'lounge');
    assert.equal(pickExit('lounge', () => 0.99), 'door');
    // while its room is shown, the room steps it; elsewhere the clock moves it on once its stay is over
    assert.equal(advanceTrip(trip, trip.since + trip.stay + 1, 'office'), trip);
    assert.equal(advanceTrip(trip, trip.since + 10, 'lounge'), trip);
    const moved = advanceTrip(trip, trip.since + trip.stay + 1, 'lounge', () => 0);
    assert.equal(moved.room, 'lounge');
    assert.equal(moved.via, 'door');
  });
});

describe('the automatons\' server room', () => {
  const floor = new Floor(SERVER_ROOM);
  const pieces = (kind: string) => SERVER_ROOM.furniture.filter((piece) => piece.kind === kind);

  it('has a capsule for every place, where the automaton stands facing the viewer, its glass drawn over it', () => {
    assert.ok(SERVER_ROOM.seats.length >= 8);
    for (const seat of SERVER_ROOM.seats) {
      assert.equal(seat.standing, true);
      assert.equal(seat.facing, podFacing(seat));
      // never its back to the viewer, turned to the side of the orb on screen
      const direction = directionOf(facingVector(seat.facing));
      assert.ok(direction.startsWith('down'), `${seat.x},${seat.y} faces ${direction}`);
      const orbOnTheLeft = ORB.x - ORB.y < seat.x - seat.y;
      assert.equal(direction, orbOnTheLeft ? 'down-left' : 'down-right');
      const back = pieces('pod').find((piece) => piece.x === seat.x && piece.y === seat.y)!;
      const glass = pieces('podGlass').find((piece) => piece.x === seat.x && piece.y === seat.y)!;
      assert.ok(back && glass, `a capsule at ${seat.x},${seat.y}`);
      // the shell behind, the automaton, its glass, then whoever stands on the tile in front
      const standing = depthOf(floor.seatPosition(SERVER_ROOM.seats.indexOf(seat)));
      assert.ok(furnitureDepth(back) < standing && standing < furnitureDepth(glass));
      assert.ok(furnitureDepth(glass) < depthOf({ x: seat.x + 1.5, y: seat.y + 0.5 }));
    }
    assert.equal(pieces('orb').length, 1);
    assert.ok(pieces('serverRack').length > 10);
  });

  it('has no door: everyone comes out of the teleporter to a capsule, and goes back into it', () => {
    assert.deepEqual(floor.door, floor.portal);
    assert.deepEqual(floor.inside, floor.portalFront);
    for (let seat = 0; seat < floor.seatCount; seat++) {
      const path = floor.pathToSeat(floor.door, seat);
      assert.deepEqual(path[0], floor.portalFront, `capsule ${seat}`);
      assert.deepEqual(floor.pathToDoor(floor.seatPosition(seat)).at(-1), floor.portal);
    }
    assert.equal(floor.isDoorAt(toScreen({ x: 0, y: SERVER_ROOM.door.y + 0.5 })), false);
    assert.ok(!floor.isFreeTile(ORB.x, ORB.y));
  });

  it('keeps its look whatever the festival', () => {
    assert.equal(layoutOn(SERVER_ROOM, 'christmas'), SERVER_ROOM);
    assert.equal(new Floor(SERVER_ROOM, 'halloween').layout, SERVER_ROOM);
  });

  it('takes the click over an automaton behind the orb, not over one in front of it', () => {
    const orb = orbCenter();
    assert.ok(isOrbAt(orb));
    assert.ok(isOrbAt(orb, { x: ORB.x - 1, y: ORB.y - 1 }), 'behind');
    assert.ok(!isOrbAt(orb, { x: ORB.x + 1, y: ORB.y + 1 }), 'in front');
    assert.ok(!isOrbAt({ x: orb.x + 200, y: orb.y }));
  });

  it('draws a cord from the orb\'s edge to each automaton\'s chest, sagging a little, one anchor per capsule', () => {
    const orb = orbCenter();
    const chests = SERVER_ROOM.seats.map((_seat, index) => chestOf(toScreen(floor.seatPosition(index)), 52));
    assert.equal(new Set(chests.map(({ x, y }) => `${x},${y}`)).size, chests.length);
    for (const chest of chests) {
      const path = cordPath(orb, chest, ORB_SHAPE.radius * ART_SCALE);
      assert.ok(path.length > 5);
      const first = path[0], last = path.at(-1)!;
      assert.ok(Math.abs(distance(first, orb) - ORB_SHAPE.radius * ART_SCALE) <= ART_SCALE * 1.5, 'from the orb\'s edge');
      assert.ok(distance(last, chest) <= ART_SCALE, 'to the chest');
      assert.equal(new Set(path.map(({ x, y }) => `${x},${y}`)).size, path.length, 'each pixel once');
      // on the art grid, and lower in its middle than the straight line
      assert.ok(path.every(({ x, y }) => x % ART_SCALE === 0 && y % ART_SCALE === 0));
      const middle = path[Math.floor(path.length / 2)];
      assert.ok(middle.y >= (first.y + last.y) / 2 - ART_SCALE);
    }
    assert.deepEqual(cordPath(orb, orb, 10), []);
  });

  it('plugs the cord into the nape of an automaton in front of the orb, drawn under it, and the chest of the others', () => {
    const under = orbFloorY();
    const ends = SERVER_ROOM.seats.map((_seat, index) => cordEnd(toScreen(floor.seatPosition(index)), 52, under));
    assert.ok(ends.some((end) => end.fromBehind) && ends.some((end) => !end.fromBehind), 'capsules on both sides of the orb');
    for (const [index, end] of ends.entries()) {
      const feet = toScreen(floor.seatPosition(index));
      assert.equal(end.fromBehind, feet.y > under);
      // the nape is higher on the body than the chest
      assert.ok(end.at.y < feet.y && (end.fromBehind ? end.at.y < chestOf(feet, 52).y : end.at.y === chestOf(feet, 52).y));
    }
  });

  it('shows over the door how many automatons wait without a capsule, and seats them as soon as one is free', () => {
    assert.deepEqual(waitingSign(0), []);
    const sign = waitingSign(3);
    assert.ok(sign.length >= 9);
    assert.ok(sign.every((row) => row.length === sign[0].length), 'a rectangle');
    assert.ok(sign.every((row) => row[0] === 'f' && row.at(-1) === 'f') && /^f+$/.test(sign[0]) && /^f+$/.test(sign.at(-1)!), 'framed');
    assert.ok(sign.some((row) => row.includes('g')) && sign.some((row) => row.includes('#')), 'a robot and the digits');
    assert.ok(waitingSign(12)[0].length > sign[0].length, 'two digits are wider');
    const run = (id: string): AutomatonRun => ({ id, role: 'planner', task: '', project: '', sessionId: '', cwd: '', startedAt: 1, endedAt: null, status: 'running', pid: 1, parent: null });
    const agents = (count: number, from = 0) => Array.from({ length: count }, (_, index) => ({ id: `c${from + index}`, role: 'test-writer', task: '' }));
    const state = (count: number, from = 0): AutomataState => ({ folder: 'ok', running: [run('lead')], recent: [], tasks: [], roles: [], agents: { lead: agents(count, from) } });
    const seats = SERVER_ROOM.seats.length;
    const full = planRoom([], {}, NOBODY, seats, 'automata', new Set(), seatedRuns(state(seats + 1)));
    assert.equal(full.people.length, seats);
    assert.equal(full.waitingAutomata, 2);
    assert.equal(planRoom([], {}, NOBODY, seats, 'office', new Set(), seatedRuns(state(seats + 1))).waitingAutomata, 0);
    // one leaves: the first who waited takes its capsule, the others keep theirs
    const after = planRoom([], {}, full.seats, seats, 'automata', new Set(), seatedRuns(state(seats, 1)));
    assert.equal(after.waitingAutomata, 1);
    for (const person of after.people) if (full.seats.has(person.id)) assert.equal(after.seats.get(person.id), full.seats.get(person.id));
  });

  it('paints its own sky: a network of nodes and links, server towers along the bottom, packets on their way', () => {
    const nodes = skyNodes(500, 300);
    assert.ok(nodes.length > 5);
    assert.deepEqual(skyNodes(500, 300), nodes, 'the same every time');
    assert.ok(nodes.every((node) => node.x >= 0 && node.x < 500 && node.y >= 0 && node.y < 300 * 0.66));
    const links = skyLinks(nodes);
    assert.ok(links.length >= nodes.length / 2);
    assert.equal(new Set(links.map((link) => link.join())).size, links.length, 'each link once');
    assert.ok(links.every(([a, b]) => a < b && b < nodes.length));
    const towers = skyTowers(500, 300);
    assert.ok(towers[0].x === 0 && towers.at(-1)!.x + towers.at(-1)!.width >= 500 - 4, 'across the page');
    assert.ok(towers.every((tower) => tower.height > 0 && tower.height < 300 * 0.25));
    for (const seconds of [0, 1.3, 7]) assert.ok(packetShare(2, seconds) >= 0 && packetShare(2, seconds) < 1);
  });

  it('runs the packets from the orb towards the automaton, and the orb\'s pulses spread as they fade', () => {
    const at = (time: number) => packetsOn(40, time);
    assert.equal(at(0).length, 3);
    assert.ok(at(0).every((index) => index >= 0 && index < 40));
    assert.ok(at(400)[0] > at(0)[0], 'a packet moves away from the orb');
    assert.deepEqual(packetsOn(1, 0), []);
    const rings = pulseRings(300);
    for (const ring of rings) assert.ok(ring.alpha >= 0 && ring.alpha <= 0.6);
    const [a, b] = [...rings].sort((x, y) => x.radius - y.radius);
    assert.ok(a.alpha >= b.alpha, 'the wider, the fainter');
  });
});

describe('the automatons as robots', () => {
  it('gives each role its accent, the same every time, and a lead its crown whatever its role', () => {
    const roles = ['planner', 'code-reviewer', 'test-writer', 'doc-writer'];
    const looks = roles.map((role) => robotLook(role));
    assert.deepEqual(roles.map((role) => robotLook(role)), looks);
    assert.ok(looks.every((look) => (ROBOT_ACCENTS as readonly string[]).includes(look.accent)));
    // from a hash on a short palette: two roles may share an accent, but the roles do not all look alike
    assert.ok(new Set(looks.map((look) => look.accent)).size > 1);
    assert.ok(looks.every((look) => !look.lead));
    // a run of the orchestrator is a lead, its sub-agents are not: the crown says who launched whom, not a role's name
    assert.deepEqual(robotLook('code-reviewer', true), { accent: robotLook('code-reviewer').accent, lead: true });
    // the same robot whether the role is read from its file or as people read it (a sub-agent's name in a thread)
    assert.deepEqual(robotLook('Test writer'), robotLook('test-writer'));
    assert.deepEqual(robotLook('doc_writer'), robotLook('doc-writer'));
  });

  it('draws them a pixel a letter, the same width, a lead two rows taller', () => {
    for (const look of [robotLook('planner', true), robotLook('code-reviewer')]) for (const back of [false, true]) for (const step of [false, true]) {
      const rows = robotRows(look, back, step);
      assert.ok(rows.every((row) => row.length === 16), rows.find((row) => row.length !== 16));
      assert.equal(rows.length * ART_SCALE, robotHeight(look));
    }
    assert.equal(robotHeight(robotLook('test-writer', true)) - robotHeight(robotLook('test-writer')), 2 * ART_SCALE);
    // the face (visor, eyes) only from the front, the core on the chest too
    assert.ok(robotRows(robotLook('x'), false, false).some((row) => row.includes('e')));
    assert.ok(!robotRows(robotLook('x'), true, false).some((row) => row.includes('e') || row.includes('c')));
  });

  it('draws only the automatons as robots, everyone else as before', () => {
    const calls: string[] = [];
    const people: SpriteSource = {
      height: () => 50, draw: (_c, id) => { calls.push(id); }, drawTypingHand: (_c, id) => { calls.push(`hand:${id}`); }, drawHead: (_c, id) => { calls.push(`head:${id}`); },
    };
    const sprites = withRobots(people, (id) => (id === 'bot' ? robotLook('planner', true) : undefined));
    const pose = { direction: 'down-right', posture: 'stand', step: 0, blinking: false, smiling: false, gesture: 'none' } as const;
    assert.equal(sprites.height(pose, 'bot'), robotHeight(robotLook('planner', true)));
    assert.equal(sprites.height(pose, 'someone'), 50);
    assert.equal(sprites.height(pose), 50);
    sprites.draw(null as never, 'someone', pose, 0, 0);
    sprites.drawTypingHand(null as never, 'bot', { x: 0, y: 0 }, { x: 0, y: 0 }, 0);
    sprites.drawTypingHand(null as never, 'someone', { x: 0, y: 0 }, { x: 0, y: 0 }, 0);
    assert.deepEqual(calls, ['someone', 'hand:someone']);
  });

  it('tells the room each automaton\'s role, its run\'s or its sub-agent\'s', () => {
    const run: AutomatonRun = { id: 'lead', role: 'planner', task: '', project: '', sessionId: '', cwd: '', startedAt: 1, endedAt: null, status: 'running', pid: 1, parent: null };
    const state: AutomataState = { folder: 'ok', running: [run], recent: [], tasks: [], roles: [], agents: { lead: [{ id: 'c1', role: 'code-reviewer', task: '' }] } };
    const plan = planRoom([], {}, NOBODY, SERVER_ROOM.seats.length, 'automata', new Set(), seatedRuns(state));
    assert.deepEqual(plan.people.map((person) => person.automatonRole), ['planner', 'code-reviewer']);
  });
});

/** Every registered ambiance of the cozy project rooms, and a project room in it: each one is checked the same way. */
const DESIGNS = Object.values(AMBIANCES);
const roomIn = (ambiance: string, folder = '/work/a'): CozyRoom => ({ ...projectRoom(folder, 'a', { sessions: [], seen: {}, pinned: [], previous: () => NOBODY }), ambiance: ambiance as CozyRoom['ambiance'] });

describe('cozy rooms', () => {
  const inProject = (folder: string, id: string, state: SessionState, extra: Partial<SessionInfo> = {}) => session(id, state, { cwd: folder, ...extra });
  const roomOf = (folder: string, sessions: readonly SessionInfo[]) => projectRoom(folder, 'app', { sessions, seen: {}, pinned: [], previous: () => NOBODY });

  it('puts the flat in the middle of the overview, with rooms on every side', () => {
    const { slots } = overviewLayout(9);
    const [home, ...others] = slots;
    assert.ok(others.some((slot) => slot.x < home.x) && others.some((slot) => slot.x > home.x), 'rooms left and right');
    assert.ok(others.some((slot) => slot.y < home.y) && others.some((slot) => slot.y > home.y), 'rooms above and below');
  });

  it('keeps every room inside the overview', () => {
    for (let count = 1; count <= 12; count++) {
      const { width, height, slots } = overviewLayout(count);
      assert.equal(slots.length, count);
      for (const slot of slots) {
        assert.ok(slot.x >= 0 && slot.x + ROOM_BOX.width <= width, `${count} rooms: inside across`);
        assert.ok(slot.y >= 0 && slot.y + ROOM_BOX.height <= height, `${count} rooms: inside down`);
      }
    }
  });

  it('seats four sessions at work at their own desks and counts the fifth', () => {
    const room = roomOf('/work/app', Array.from({ length: 5 }, (_, index) => inProject('/work/app', `s${index}`, 'work', { createdAt: index })));
    assert.equal(room.desks.people.length, 4);
    assert.equal(new Set(room.desks.people.map(({ id }) => room.desks.seats.get(id))).size, 4, 'one desk each');
    assert.equal(room.desks.hiddenSessions, 1);
  });

  it('lists in "+N" only the sessions at work without a desk, not those stopped', () => {
    const working = Array.from({ length: 5 }, (_, index) => inProject('/work/app', `w${index}`, 'work', { createdAt: index }));
    const room = roomOf('/work/app', [...working, inProject('/work/app', 'stopped', 'closed', { createdAt: 9 })]);
    assert.deepEqual(room.unseated.map(({ id }) => id), ['w4']);
    assert.equal(room.unseated.length, room.desks.hiddenSessions);
  });

  it('names each room like its project in the header, a recent one with its parent beside another of its name', () => {
    const sessions = [inProject('/work/one/app', 'a', 'work')];
    const rooms = cozyRooms({ sessions, seen: {}, projects: ['/work/one/app', '/work/two/app'], pinned: [], automata: false, previous: () => NOBODY });
    const pill = projectsOf(sessions, {}).find(({ folder }) => folder === '/work/one/app')!.name;
    assert.equal(rooms.find(({ id }) => id === '/work/one/app')!.name, pill);
    assert.equal(rooms.find(({ id }) => id === '/work/two/app')!.name, 'two/app');
  });

  it('fits the overview in the largest part of the stage the status card leaves, never under it', () => {
    const stage = { x: 0, y: 0, width: 1000, height: 800 }, card = { x: 0, y: 500, width: 340, height: 300 };
    const fit = fitOverview(stage, [card], { width: 100, height: 100 });
    assert.equal(fit.scale, 6.6, 'the 660 x 800 strip right of the card holds a larger overview than the 1000 x 500 one above it');
    assert.ok(fit.left >= card.x + card.width, 'beside the card');
    assert.equal(fit.top, (800 - 660) / 2, 'centred in that strip');
    assert.equal(fitOverview(stage, [], { width: 100, height: 100 }).scale, 8, 'the whole stage without a card');
  });

  it("seats nobody where their head would hide another one's, in a project room or in the break room", () => {
    // the cozy rooms' people are the HD ones (chibi-hd.ts), drawn one room pixel an art pixel: their head is the rows
    // above the neck (hd/face.ts HEAD), and PERSON_SPACING must be at least as wide as it
    const seated = { direction: 'down-right', posture: 'sit', step: 0, blinking: false, smiling: false, gesture: 'none' } as const;
    const seatedHeight = hdHeight(DEFAULT_LOOK, seated);
    const art = hdArt(DEFAULT_LOOK, seated);
    const headColumns = art.cells.flatMap((cell, index) => (cell && art.y0 + Math.floor(index / art.width) < 18 ? [index % art.width] : []));
    assert.ok(PERSON_SPACING >= Math.max(...headColumns) - Math.min(...headColumns) + 1, 'two heads PERSON_SPACING apart do not overlap');
    for (const places of [...DESIGNS.map((design) => [...design.desks.map(deskPlace), ...design.couchPlaces]), LOUNGE_PLACES]) {
      const feet = places.map(feetOf);
      for (const [index, a] of feet.entries()) for (const b of feet.slice(index + 1)) {
        assert.ok(Math.abs(a.x - b.x) >= PERSON_SPACING || Math.abs(a.y - b.y) >= seatedHeight, `${JSON.stringify(a)} and ${JSON.stringify(b)}`);
      }
    }
  });

  it('puts every session at rest or stopped in the break room, whatever its project, and none at a desk', () => {
    const sessions = [
      inProject('/work/a', 'resting', 'wait', { resting: true, createdAt: 1 }), inProject('/work/b', 'stopped', 'closed', { createdAt: 2 }), inProject('/work/a', 'busy', 'work'),
    ];
    const rooms = cozyRooms({ sessions, seen: {}, projects: ['/work/a', '/work/b'], pinned: [], automata: false, previous: () => NOBODY });
    const lounge = rooms.find(({ id }) => id === LOUNGE_ID)!;
    assert.deepEqual(lounge.resting.people.map(({ id }) => id), ['resting', 'stopped']);
    assert.deepEqual(rooms.filter(({ kind }) => kind === 'project').flatMap((room) => room.desks.people.map(({ id }) => id)), ['busy']);
  });

  it('seats as many at rest as the break room has places, and lists the others in its "+N", as the classic break room orders them', () => {
    const resting = Array.from({ length: LOUNGE_PLACES.length + 2 }, (_, index) => inProject(`/work/p${index}`, `r${index}`, 'closed', { resting: true, createdAt: index }));
    const lounge = cozyRooms({ sessions: resting, seen: {}, projects: [], pinned: [], automata: false, previous: () => NOBODY }).find(({ id }) => id === LOUNGE_ID)!;
    assert.equal(lounge.resting.people.length, LOUNGE_PLACES.length);
    assert.equal(new Set(lounge.resting.seats.values()).size, LOUNGE_PLACES.length, 'one place each');
    const classicOrder = roomSessions(resting, {}, 'lounge').flat().map(({ id }) => id);
    assert.deepEqual(lounge.unseated.map(({ id }) => id), classicOrder.slice(LOUNGE_PLACES.length));
    assert.equal(lounge.unseated.length, lounge.resting.hiddenSessions);
  });

  it("turns a project room's lights off when nobody works there, and the break room's on while someone naps there", () => {
    const nap = [inProject('/work/app', 'r', 'closed', { resting: true })];
    assert.equal(roomOf('/work/app', []).lit, false);
    assert.equal(roomOf('/work/app', nap).lit, false, 'its session at rest naps in the break room');
    assert.equal(roomOf('/work/app', [inProject('/work/other', 'w', 'work')]).lit, false, "another project's session is not in it");
    const loungeOf = (sessions: SessionInfo[]) => cozyRooms({ sessions, seen: {}, projects: [], pinned: [], automata: false, previous: () => NOBODY }).find(({ id }) => id === LOUNGE_ID)!;
    assert.equal(loungeOf([]).lit, false);
    assert.equal(loungeOf(nap).lit, true);
  });

  it('has the break room always and the server room only when there are automatons, the flat always first', () => {
    const input = { sessions: [], seen: {}, projects: ['/work/app'], pinned: [], previous: () => NOBODY };
    assert.deepEqual(cozyRooms({ ...input, automata: false }).map(({ kind }) => kind), ['home', 'project', 'lounge']);
    assert.deepEqual(cozyRooms({ ...input, automata: true }).map(({ kind }) => kind), ['home', 'project', 'lounge', 'servers']);
  });

  it('shows the active projects, or also the recent and pinned ones, each once', () => {
    const sessions = [inProject('/work/beta', 'b', 'work'), inProject('/work/alpha', 'a', 'closed', { resting: true }), { ...inProject('/work/cron', 'c', 'work'), trigger: { id: 'abcdef12', name: 'Recap' } }];
    assert.deepEqual(shownProjects('active', sessions, {}, ['/work/gamma'], ['/work/delta']), ['/work/alpha', '/work/beta'], "a trigger's run has no project room");
    assert.deepEqual(shownProjects('recent', sessions, {}, ['/work/gamma', '/work/beta'], ['/work/delta']), ['/work/alpha', '/work/beta', '/work/delta', '/work/gamma']);
  });

  it('takes the recent projects from the last two weeks of conversations, within the roots, a worktree as its project', () => {
    const now = 100 * 86_400_000;
    const talk = (project: string, daysAgo: number): ConversationSpan => ({ id: project, project, start: 0, end: now - daysAgo * 86_400_000, minutes: 1, days: [] });
    const conversations = [
      talk('/work/old', 15), talk('/elsewhere/app', 1), talk('/work/app/.claude/worktrees/fix', 3), talk('/work/app', 5), talk('/work/new', 0.5),
    ];
    assert.deepEqual(recentFolders(conversations, ['/work'], now), ['/work/new', '/work/app']);
  });

  it('finds the room a click falls in, the front one where two overlap', () => {
    const middle = iso(64, 64);
    const side = [{ x: 0, y: 0 }, { x: 300, y: 0 }];
    assert.equal(roomAt({ x: middle.x + 300, y: middle.y }, side), 1);
    assert.equal(roomAt({ x: 0, y: 0 }, side), -1, 'the corner of the box is outside the room');
    const front = { x: 0, y: 40 }, behind = { x: 0, y: 0 }, both = { x: middle.x, y: middle.y + 40 };
    assert.equal(roomAt(both, [behind, front]), 1);
    assert.equal(roomAt(both, [front, behind]), 0);
  });

  it('finds who a click falls on, the one in front where two overlap', () => {
    const figures = [{ id: 'front', feet: { x: 50, y: 110 }, top: 30 }, { id: 'back', feet: { x: 50, y: 100 }, top: 30 }];
    assert.equal(figureAt({ x: 52, y: 95 }, figures), 'front');
    assert.equal(figureAt({ x: 52, y: 75 }, figures), 'back', 'over the front one\'s head');
    assert.equal(figureAt({ x: 80, y: 95 }, figures), null);
  });
});

describe('the cozy home', () => {
  const homeOf = (homeTheme: unknown) => cozyRooms({ sessions: [], seen: {}, projects: [], pinned: [], automata: false, homeTheme, previous: () => NOBODY })[0];

  it('is the studio for a settings file without a home, or with one this version does not know', () => {
    assert.equal(homeOf(undefined).home, 'studio');
    assert.equal(homeOf('igloo').home, 'studio');
    assert.equal(homeOf('chalet').home, 'chalet');
  });

  it('seats the user at their own desk in every home, on the floor, facing a screen, where a click finds them', () => {
    for (const theme of HOME_THEMES) {
      const [user] = placeSitters(homeOf(theme), { x: 0, y: 0 }, { height: () => 30 }, 0, true);
      const { u, v } = user.sitter.place;
      assert.equal(user.id, PLAYER_ID, theme);
      assert.deepEqual({ u, v }, { u: HOME_DESIGNS[theme].seat.u, v: HOME_DESIGNS[theme].seat.v }, `${theme}: at its own desk`);
      assert.ok(u >= 0 && u < ROOM_UNITS && v >= 0 && v < ROOM_UNITS, `${theme}: on the floor`);
      assert.ok(HOME_DESIGNS[theme].screens.some((screen) => screen.v < v && Math.abs((screen.ua + screen.ub) / 2 - u) < screen.ub - screen.ua), `${theme}: a screen in front`);
      assert.equal(figureAt({ x: user.feet.x, y: user.feet.y - 10 }, [user]), PLAYER_ID, theme);
    }
  });

  it('puts the sessions at work first in the video call, as many as it has tiles', () => {
    const sessions = [inFolder('/work/a', 'waits', 'wait', 0), inFolder('/work/b', 'works', 'work', 1), inFolder('/work/a', 'also', 'work', 2)];
    const rooms = cozyRooms({ sessions, seen: {}, projects: ['/work/a', '/work/b'], pinned: [], automata: false, previous: () => NOBODY });
    assert.deepEqual(callers(rooms, 2).map(({ id }) => id).sort(), ['also', 'works']);
    assert.equal(callers(rooms, 4).at(-1)!.id, 'waits');
  });
});

const inFolder = (folder: string, id: string, state: SessionState, createdAt: number) => session(id, state, { cwd: folder, createdAt });

describe('cozy pixel art', () => {
  // the lavender nightstand: 12 units along u (its face to the bottom left), 14 along v (its face to the bottom right)
  const [u0, u1, v0, v1, height] = [2, 14, 106, 120, 18];
  const drawn = () => { const grid = new PixelGrid(0, 0, ROOM_BOX.width, ROOM_BOX.height); box(grid, u0, u1, v0, v1, 0, height, ['top', 'left', 'right']); return grid; };
  const columnsWith = (grid: PixelGrid, colour: string) => {
    const columns: number[] = [];
    for (let x = 0; x < grid.width; x++) for (let y = 0; y < grid.height; y++) if (grid.get(x, y) === colour) { columns.push(x); break; }
    return columns;
  };
  /** How many columns in a row share the same value, left to right. */
  const runs = (values: readonly number[]) => values.reduce<number[]>((lengths, value, index) => {
    if (index > 0 && value === values[index - 1]) lengths[lengths.length - 1]++;
    else lengths.push(1);
    return lengths;
  }, []);

  it('draws a box with each face as wide as its side', () => {
    const grid = drawn();
    assert.equal(columnsWith(grid, 'left').length, u1 - u0);
    assert.equal(columnsWith(grid, 'right').length, v1 - v0);
    assert.equal(columnsWith(grid, 'top').length, u1 - u0 + v1 - v0);
  });

  it('draws a box whose edges drop one pixel every two across, but where two edges meet at its far and near corners', () => {
    const grid = drawn(), columns = columnsWith(grid, 'top');
    const firstRow = (x: number) => { let y = 0; while (!grid.get(x, y)) y++; return y; };
    const lastRow = (x: number) => { let y = grid.height - 1; while (!grid.get(x, y)) y--; return y; };
    for (const edge of [columns.map(firstRow), columns.map(lastRow)]) {
      const lengths = runs(edge);
      assert.deepEqual(lengths.filter((length) => length !== 2), [4], `${edge}`);
      for (let index = 1; index < edge.length; index++) assert.ok(Math.abs(edge[index] - edge[index - 1]) <= 1, `${edge}`);
    }
  });

  it('keeps a line drawn along a face on that face, from one end of it to the other', () => {
    const grid = drawn(), lines = new PixelGrid(0, 0, ROOM_BOX.width, ROOM_BOX.height);
    onLeftFace(lines, v1, u0, u1, 9, 'left');
    onRightFace(lines, u1, v0, v1, 9, 'right');
    for (const face of ['left', 'right']) {
      const columns = columnsWith(lines, face);
      assert.deepEqual(columns, columnsWith(grid, face));
      for (const x of columns) for (let y = 0; y < lines.height; y++) if (lines.get(x, y) === face) assert.equal(grid.get(x, y), face, `${face} face at ${x}, ${y}`);
    }
  });
});

describe('the cozy rooms, like the classic one', () => {
  const projectRooms = (sessions: SessionInfo[], folders: string[]) => cozyRooms({ sessions, seen: {}, projects: folders, pinned: [], automata: false, previous: () => NOBODY }).filter((room) => room.kind === 'project');

  it('opens a terminal from the middle of each screen of the user\'s computer, in every home, and not from the floor', () => {
    for (const theme of HOME_THEMES) {
      for (const { v, ua, ub, za, zb } of HOME_DESIGNS[theme].screens) assert.ok(pcAt(theme, iso((ua + ub) / 2, v, (za + zb) / 2)), `${theme}: its screen`);
      const spot = HOME_DESIGNS[theme].festiveSpot;
      assert.ok(!pcAt(theme, iso(spot.u, spot.v)), `${theme}: a corner of its floor`);
      assert.ok(!pcAt(theme, iso(ROOM_UNITS - 4, ROOM_UNITS - 4)), `${theme}: the front of its floor`);
    }
  });

  it('moves the clocks\' hands once a minute: the same minute within it, the next one after, midnight back to the first', () => {
    assert.equal(clockMinute(14 + 30 / 60), clockMinute(14 + 30.9 / 60));
    assert.equal(clockMinute(14 + 31 / 60), clockMinute(14 + 30 / 60) + 1);
    assert.equal(clockMinute(23 + 59 / 60), 1439);
    assert.equal(clockMinute(24), 0);
  });

  it('follows the hour in three moods, and draws its rooms again only when the mood or the festival changes', () => {
    assert.deepEqual([cozyTimeOf(12), cozyTimeOf(19.5), cozyTimeOf(0)], ['day', 'dusk', 'night']);
    assert.equal(sceneKey(10, null), sceneKey(16.75, null), 'the minutes of a day go by on the same art');
    assert.notEqual(sceneKey(12, null), sceneKey(23, null));
    assert.notEqual(sceneKey(12, null), sceneKey(12, 'christmas'));
    assert.notEqual(sceneKey(12, 'christmas'), sceneKey(12, 'halloween'));
  });

  it('dresses its walls for every festival', () => {
    const bare = new PixelGrid(0, 0, ROOM_BOX.width, ROOM_BOX.height);
    for (const festival of FESTIVALS) {
      const grid = new PixelGrid(0, 0, ROOM_BOX.width, ROOM_BOX.height);
      paintFestiveWalls(grid, festival);
      assert.ok(grid.cells.some((cell, index) => cell !== bare.cells[index]), festival);
    }
  });

  it('shows a window drawn at dusk under the night sky and its moon at night, without stars by day, unchanged at dusk', () => {
    const outside = { mood: 'dusk' as const, sky: ['#000001', '#000002'], body: ['#000003', '#000004'] as const, stars: ['#000005'] };
    const night = outsideAt(outside, 'night'), day = outsideAt(outside, 'day');
    assert.equal(outsideAt(outside, 'dusk').size, 0);
    assert.ok(outside.sky.every((colour) => COZY_PALETTE.sky.night.includes(night.get(colour) as never)));
    assert.equal(night.get('#000003'), COZY_PALETTE.sky.moon);
    assert.ok(!night.has('#000005'), 'the stars stay at night');
    assert.equal(day.get('#000005'), null, 'a star by day takes the sky beside it');
    assert.equal(day.get('#000003'), COZY_PALETTE.sky.sun);
  });

  it('keeps a home\'s own light at its own hour, its lamps brighter at night than by day', () => {
    for (const theme of HOME_THEMES) {
      const { lighting, outside } = HOME_DESIGNS[theme];
      assert.equal(homeLightAt(lighting, outside.mood, outside.mood), lighting, theme);
      const strength = (time: 'day' | 'night') => homeLightAt(lighting, outside.mood, time).lamps.reduce((sum, lamp) => sum + lamp.colour[0], 0);
      assert.ok(strength('night') > strength('day'), theme);
    }
  });

  it('has the crew drop by the project room opened big, else the first one lit', () => {
    const rooms = projectRooms([inFolder('/work/b', 'busy', 'work', 0)], ['/work/a', '/work/b']);
    assert.equal(visitedRoom(rooms, null)?.id, '/work/b');
    assert.equal(visitedRoom(rooms, '/work/a')?.id, '/work/a');
    assert.equal(visitedRoom([], null), null);
  });

  it('walks a visitor in from the front of a cozy room to what they came for, and out again once they have a session, in every ambiance', () => {
    for (const design of DESIGNS) {
    const visits = new Visits(cozyVisitFloor(() => null, design), () => 0);
    const floor = cozyVisitFloor(() => null, design);
    for (const activity of new Set(visitSpotsIn(null, design).map((spot) => spot.activity))) {
      assert.deepEqual(visits.start(activity, ['Ana']), ['Ana'], activity);
      const visitor = visits.visitors.get(visitorId('Ana'))!;
      for (let elapsed = 0; elapsed < 15_000 && visitor.phase === 'coming'; elapsed += 100) visits.step(100, { free: ['Ana'], hour: 3, enabled: true, blocked: null });
      assert.equal(visitor.phase, 'staying', activity);
      assert.ok(distance(visitor.position, visitor.spot.at) < 1e-6 && visitor.spot.activity === activity, activity);
      const { x, y } = visitor.position;
      assert.ok(x * VISIT_UNIT >= 0 && x * VISIT_UNIT < ROOM_UNITS && y * VISIT_UNIT >= 0 && y * VISIT_UNIT < ROOM_UNITS, `${activity}: on the floor`);
      for (let elapsed = 0; elapsed < 15_000 && visits.visitors.size; elapsed += 100) visits.step(100, { free: [], hour: 3, enabled: true, blocked: null });
      assert.equal(visits.visitors.size, 0, `${activity}: gone`);
    }
    assert.ok(distance(floor.door, floor.pathToDoor({ x: 3, y: 3 }).at(-1)!) < 1e-6, `${design.id}: out by where they came in`);
    }
  });

  it("puts every visitor's spot on free floor, the party's beside the festival's tree, in every ambiance", () => {
    for (const design of DESIGNS) {
      const floor = new CozyFloor(cozyFloorPlan({ kind: 'project', ambiance: design.id }, 'christmas'));
      for (const spot of visitSpotsIn('birthday', design)) {
        if (spot.activity === 'sofa') continue;
        assert.ok(floor.isWalkable(spot.at), `${design.id}: ${spot.activity} at (${spot.at.x}, ${spot.at.y})`);
      }
    }
  });

});

describe("the cozy rooms' life, pet and clocks", () => {
  it('draws a visitor on the couch over its seat and back but under its front arm, in every ambiance', () => {
    for (const { id, couch, couchPlaces } of DESIGNS) {
      const visitors = couchPlaces.map((place) => visitorFeet({ x: place.u / VISIT_UNIT, y: place.v / VISIT_UNIT }, place.lift, couch).depth);
      // what is laid over a visitor (decor.ts frontLayers) is what is deeper than them: not the couch itself
      for (const depth of visitors) assert.ok(depth > couchDepth(couch) && depth < couchArmDepth(couch), `${id}, ${depth}: after the couch, before its arm`);
    }
  });

  it("gathers the crew for a festival's party where the classic office does, as many at a time, and walks them there", () => {
    for (const design of DESIGNS) for (const festival of [null, ...FESTIVALS]) {
      const party = visitSpotsIn(festival, design).filter((spot) => spot.activity === 'party');
      assert.equal(party.length, festivalVisits(festival).length, `${design.id}: ${festival ?? 'a plain day'}`);
      assert.deepEqual(party.map((spot) => spot.together !== undefined), festivalVisits(festival).map((spot) => spot.together !== undefined), `${design.id}: ${festival ?? 'a plain day'}`);
    }
    const visits = new Visits(cozyVisitFloor(() => 'birthday'), () => 0);
    assert.equal(visits.start('party', ['Ana', 'Bo'], { together: true }).length, 2);
    for (let elapsed = 0; elapsed < 20_000; elapsed += 100) visits.step(100, { free: ['Ana', 'Bo'], hour: 3, enabled: true, blocked: null });
    for (const visitor of visits.visitors.values()) assert.ok(visitor.phase === 'staying' && distance(visitor.position, visitor.spot.at) < 1e-6, visitor.name);
  });

  it('tells the time from a click on the clock of every room and home, and not from beside it', () => {
    const lounge = cozyRooms({ sessions: [], seen: {}, projects: [], pinned: [], automata: false, previous: () => NOBODY }).find(({ kind }) => kind === 'lounge')!;
    const rooms = [...AMBIANCE_IDS.map((id) => roomIn(id)), lounge, ...HOME_THEMES.map((theme) => cozyRooms({ sessions: [], seen: {}, projects: [], pinned: [], automata: false, homeTheme: theme, previous: () => NOBODY })[0])];
    for (const room of rooms) {
      const { wall, a, z, radius } = clockOf(room), name = room.home ?? room.ambiance ?? room.kind;
      const [x, y] = wallPoint(wall, a, z);
      assert.ok(roomClockAt(room, { x: x + 0.5, y: y + 0.5 }), `${name}: its middle`);
      const [bx, by] = wallPoint(wall, a, z + radius + 12);
      assert.ok(!roomClockAt(room, { x: bx + 0.5, y: by + 0.5 }), `${name}: the wall above it`);
      assert.ok(!roomClockAt(room, iso(ROOM_UNITS / 2, ROOM_UNITS / 2)), `${name}: the floor`);
    }
  });

  it('draws the pet the user chose, in their colours, a droid as their droid, and none for none', () => {
    assert.equal(cozyPetOf({ kind: 'none' }), null);
    assert.deepEqual(cozyPetOf({ kind: 'droid', variant: 'sphere', colors: { fur: '#123456' } }), { kind: 'droid', droid: { model: 'sphere', color: '#123456' } });
    const dog = { kind: 'dog', variant: 'husky', colors: { fur: '#abcdef' } } as const;
    assert.deepEqual(cozyPetOf(dog), { kind: 'animal', animal: dog });
  });

  it("has Z's rise over an animal asleep, none over it awake, and none over a droid standing by", () => {
    const pixels: PetPixels = { width: 1, height: 1, cells: ['#000000'], feet: { x: 0, y: 0 }, top: 0 };
    const cat = cozyPetOf({ kind: 'cat', variant: 'plain' })!;
    assert.ok(petZzzAt(cat, 'sleep', pixels, 0, 0));
    assert.equal(petZzzAt(cat, 'sit', pixels, 0, 0), null);
    assert.equal(petZzzAt(cozyPetOf({ kind: 'droid', variant: 'dome' })!, 'sleep', pixels, 0, 0), null);
  });

});

describe("the cozy rooms' doors, boards, numbers and pet", () => {
  const roomsWith = (sessions: SessionInfo[], folders: string[], homeTheme?: string) => cozyRooms({ sessions, seen: {}, projects: folders, pinned: [], automata: false, homeTheme, previous: () => NOBODY });
  const [, project, lounge] = roomsWith([], ['/work/a']);
  const point = ([x, y]: [number, number]): Point => ({ x: x + 0.5, y: y + 0.5 });
  const doorPoint = (door: { a0: number; a1: number; height: number }) => point(wallPoint('left', (door.a0 + door.a1) / 2, door.height / 2));
  const doorMiddle = doorPoint(COZY_DOOR);
  const boardMiddle = point(wallPoint('right', 98, 66));
  /** Every shown room at its slot of the overview, its people placed: what a click there sees. */
  const overview = (rooms: CozyRoom[]) => {
    const { slots } = overviewLayout(rooms.length);
    return rooms.map((room, index) => ({ room, at: slots[index], people: placeSitters(room, slots[index], { height: () => 30 }, 0, true) }));
  };

  it('goes through the door of a project room and of the break room, opens the board from a project room\'s whiteboard only, and nothing from the floor', () => {
    assert.equal(thingAt(project, doorMiddle), 'door');
    assert.equal(thingAt(lounge, doorMiddle), 'door');
    assert.equal(thingAt(project, boardMiddle), 'board');
    assert.notEqual(thingAt(lounge, boardMiddle), 'board', 'the break room has no whiteboard');
    for (const room of [project, lounge]) assert.equal(thingAt(room, iso(ROOM_UNITS / 2, ROOM_UNITS / 2)), null);
  });

  /** The painted pixels of what `paint` draws alone, and the one nearest their middle. */
  const pixelsOf = (paint: (grid: ReturnType<typeof newGrid>) => void) => {
    const grid = newGrid();
    paint(grid);
    const cells = grid.cells.flatMap((cell, index): Point[] => (cell ? [{ x: index % grid.width + 0.5, y: Math.floor(index / grid.width) + 0.5 }] : []));
    const mean = { x: cells.reduce((sum, cell) => sum + cell.x, 0) / cells.length, y: cells.reduce((sum, cell) => sum + cell.y, 0) / cells.length };
    return { cells, middle: cells.reduce((best, cell) => (distance(cell, mean) < distance(best, mean) ? cell : best)) };
  };

  it('finds the door, the board and the clock of a project room in every ambiance where they are drawn, inside the room, and nothing on its floor', () => {
    for (const design of DESIGNS) {
      const room = roomIn(design.id);
      const { wall, a, z } = design.clock, [cx, cy] = wallPoint(wall, a, z);
      for (const [thing, { cells, middle }] of [['door', pixelsOf(design.paintDoor)], ['board', pixelsOf(design.paintBoard)], ['clock', { cells: [], middle: { x: cx + 0.5, y: cy + 0.5 } }]] as const) {
        assert.equal(thingAt(room, middle), thing, `${design.id}: its ${thing}`);
        assert.ok(cells.every((cell) => insideConvex(cell, ROOM_OUTLINE)), `${design.id}: its ${thing} inside the room`);
      }
      assert.ok(insideConvex(doorPoint(design.door), ROOM_OUTLINE) && thingAt(room, doorPoint(design.door)) === 'door', `${design.id}: its door where people come in`);
      assert.equal(thingAt(room, iso(ROOM_UNITS / 2, ROOM_UNITS / 2)), null, `${design.id}: its floor`);
    }
  });

  it('opens the mods from the numbers screen of every home, and not from the middle of its floor', () => {
    for (const theme of HOME_THEMES) {
      const [home] = roomsWith([], [], theme);
      const { wall, a, z } = HOME_DESIGNS[theme].metrics;
      assert.equal(thingAt(home, point(wallPoint(wall, a + METRICS_SCREEN.width / 2, z + METRICS_SCREEN.height / 2))), 'metrics', theme);
      assert.notEqual(thingAt(home, iso(ROOM_UNITS - 10, ROOM_UNITS - 10)), 'metrics', theme);
    }
  });

  it('opens the session of someone clicked among all the rooms, and the room itself from anywhere else on it', () => {
    const rooms = overview(roomsWith([session('busy', 'work', { cwd: '/work/a' })], ['/work/a']));
    const at = rooms.findIndex(({ room }) => room.kind === 'project');
    const [busy] = rooms[at].people;
    assert.equal(targetAt({ x: busy.feet.x, y: busy.feet.y - busy.top / 2 }, rooms, { zoomed: false, pet: null }).person, 'busy');
    const floor = iso(ROOM_UNITS - 20, ROOM_UNITS - 20);
    assert.deepEqual(targetAt({ x: rooms[at].at.x + floor.x, y: rooms[at].at.y + floor.y }, rooms, { zoomed: false, pet: null }), { index: at, person: null, pet: false, thing: null });
  });

  it("leads back from the break room's door only once it is opened big: among all the rooms, a click there opens it", () => {
    const loungeDoor = (zoomed: boolean) => {
      const rooms = overview(zoomed ? [lounge] : roomsWith([], ['/work/a']));
      const { at } = rooms.find(({ room }) => room.kind === 'lounge')!;
      return targetAt({ x: at.x + doorMiddle.x, y: at.y + doorMiddle.y }, rooms, { zoomed, pet: null }).thing;
    };
    assert.equal(loungeDoor(true), 'door');
    assert.equal(loungeDoor(false), null);
  });

  it('pokes the pet at home only: the same point of a project room or the break room is no pet, nor anywhere when the user has none', () => {
    const paws = iso(64, 90), onIt = (at: Point) => ({ x: at.x + paws.x, y: at.y + paws.y - 8 });
    const rooms = overview(roomsWith([], ['/work/a']));
    for (const { room, at } of rooms) {
      assert.equal(targetAt(onIt(at), rooms, { zoomed: false, pet: paws }).pet, room.kind === 'home', room.kind);
      assert.equal(targetAt(onIt(at), rooms, { zoomed: false, pet: null }).pet, false, room.kind);
    }
  });
});

describe("the user's pet at home", () => {
  const seeded = (start: number) => { let seed = start; return () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; };
  const tileAt = (point: Point) => ({ x: Math.floor(point.x), y: Math.floor(point.y) });
  const deskOf = (theme: HomeTheme) => tileOf(HOME_DESIGNS[theme].seat.u, HOME_DESIGNS[theme].seat.v);

  it('walks only over free tiles to an aisle tile, or hops onto its bed to sleep, in every theme and festival', () => {
    for (const theme of HOME_THEMES) for (const festival of [null, 'christmas'] as const) {
      const random = seeded(7), home = homePet(theme, festival, random);
      const errand = homeErrand(home, deskOf(theme));
      const starts = [home.bed, ...Array.from({ length: 30 }, () => ({ x: 0.5 + Math.floor(random() * 16), y: 0.5 + Math.floor(random() * 16) }))
        .filter(({ x, y }) => home.floor.isAisle(Math.floor(x), Math.floor(y)))];
      for (const start of starts) for (let walk = 0; walk < 12; walk++) {
        const { path, doing } = errand({ ...home.pet, position: { ...start }, path: [] }, random);
        const label = `${theme} ${festival ?? ''} from ${start.x},${start.y} (${doing})`;
        const end = path.at(-1)!, onBed = doing === 'sleep';
        assert.ok(path.length > 0, label);
        if (onBed) assert.deepEqual(end, home.bed, label);
        else assert.ok(home.floor.isAisle(tileAt(end).x, tileAt(end).y), `${label}: stops on an aisle`);
        const way = onBed ? path.slice(0, -1) : path;
        for (const point of way) assert.ok(home.floor.isFreeTile(tileAt(point).x, tileAt(point).y), `${label}: over ${point.x},${point.y}`);
        // tile by tile, but the hops down from its bed and onto it
        const steps = [start, ...path].slice(1).map((point, index) => Math.hypot(point.x - [start, ...path][index].x, point.y - [start, ...path][index].y));
        steps.forEach((step, index) => {
          const hop = (index === 0 && start === home.bed) || (onBed && index === steps.length - 1);
          assert.ok(step <= (hop ? 2.5 : 1.5), `${label}: a step of ${step.toFixed(2)}`);
        });
      }
    }
  });

  it('lives like the classic pet: sleeps on its bed only, sits by the user now and then, wanders and stops on aisles, in every theme', () => {
    for (const theme of HOME_THEMES) {
      const random = seeded(11), home = homePet(theme, null, random), user = deskOf(theme);
      let byUser = 0, elsewhere = 0;
      for (let time = 0; time < 30 * 60_000; time += 100) {
        stepHomePet(home, 100, user, random);
        const { pet } = home;
        if (pet.activity === 'walk') continue;
        if (pet.activity === 'sleep') { assert.deepEqual(pet.position, home.bed, `${theme}: asleep away from its bed`); continue; }
        if (pet.position.x === home.bed.x && pet.position.y === home.bed.y) continue;
        assert.ok(home.floor.isAisle(Math.floor(pet.position.x), Math.floor(pet.position.y)), `${theme}: stopped on ${pet.position.x},${pet.position.y}`);
        if (Math.max(Math.abs(pet.position.x - user.x), Math.abs(pet.position.y - user.y)) <= 2.5) byUser++;
        else elsewhere++;
      }
      assert.ok(byUser > 0 && elsewhere > 0, `${theme}: by the user ${byUser}, elsewhere ${elsewhere}`);
    }
  });

  it('is not covered by the bed it sleeps on, in every theme; in the loft, the coffee table covers it behind the table, not on its kilim', () => {
    for (const theme of HOME_THEMES) {
      const { furniture, petBed } = HOME_DESIGNS[theme];
      const under = furniture.filter(({ u0, u1, v0, v1 }) => petBed.u >= u0 && petBed.u < u1 && petBed.v >= v0 && petBed.v < v1);
      for (const bed of under) assert.equal(hides(bed, petBed.u, petBed.v), false, theme);
    }
    const { furniture, petBed } = HOME_DESIGNS.loft, table = furniture.find(({ u0, v0 }) => u0 === 30 && v0 === 86)!;
    assert.equal(hides(table, petBed.u, petBed.v), false, 'on its kilim, in front of the table');
    assert.equal(hides(table, 42, 80), true, 'behind the table');
  });
});

describe('walking the cozy rooms, like the classic one', () => {
  const floorOf = (room: Pick<CozyRoom, 'kind' | 'home'>) => new CozyFloor(cozyFloorPlan(room));
  const homeFloor = (home: CozyRoom['home']) => floorOf({ kind: 'home', home });
  const PROJECT = floorOf({ kind: 'project', home: undefined }), BREAK_ROOM = floorOf({ kind: 'lounge', home: undefined });
  const projectFloor = (ambiance: string, festival: Festival | null = null) => new CozyFloor(cozyFloorPlan({ kind: 'project', ambiance: ambiance as CozyRoom['ambiance'] }, festival));
  const walkFor = (scene: Scene<CozyFloor>, ms: number) => { for (let elapsed = 0; elapsed < ms; elapsed += 66) scene.step(66); };
  const onFloor = (floor: CozyFloor, point: Point) => floor.isFreeTile(Math.floor(point.x), Math.floor(point.y));

  it('has the user seated at their computer when their home opens, in every theme', () => {
    for (const theme of HOME_THEMES) assert.equal(new Scene(homeFloor(theme), { view: COZY_VIEW }).playerSpot?.atDesk, true, theme);
  });

  it('walks the user to a free floor point clicked at home round the furniture, in every theme', () => {
    for (const theme of HOME_THEMES) {
      const floor = homeFloor(theme), desk = floor.layout.playerSpots[0].at;
      for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
        const target = { x: x + 0.5, y: y + 0.5 };
        if (!floor.isWalkable(target)) continue;
        const path = floor.route(desk, target);
        assert.ok(path.length > 0, `${theme}: (${x}, ${y}) reached`);
        assert.ok(path.every((point) => onFloor(floor, point)), `${theme}: (${x}, ${y}) through no furniture`);
      }
    }
  });

  it('seats the user on the place to sit clicked at home, besides their desk, in every theme', () => {
    for (const theme of HOME_THEMES) {
      const floor = homeFloor(theme), others = floor.layout.playerSpots.filter((spot) => !spot.atDesk);
      assert.ok(others.length > 0, `${theme}: somewhere else to sit`);
      for (const spot of others) {
        const scene = new Scene(floor, { view: COZY_VIEW });
        scene.sitPlayerAt(floor.spotAt(spot.at)!);
        walkFor(scene, 30_000);
        assert.equal(scene.playerSpot, spot, theme);
      }
    }
  });

  it('brings the user into a project room of every ambiance and the break room through the door on the left wall', () => {
    for (const [floor, door] of [...DESIGNS.map((design) => [projectFloor(design.id), design.door] as const), [BREAK_ROOM, COZY_DOOR] as const]) {
      const scene = new Scene(floor, { atDoor: true, view: COZY_VIEW });
      const { x, y } = scene.player.position;
      assert.ok(x < 1, 'at the left wall');
      assert.ok(y >= door.a0 / 8 && y <= door.a1 / 8, 'in the doorway');
      assert.equal(scene.playerSpot, null);
      assert.ok(onFloor(floor, floor.inside), 'one step in, on the floor');
    }
  });

  /** Whether `path`, tile centres from `from`, goes tile to tile (neighbours only) without passing through anything. */
  const walksFrom = (from: Point, path: readonly Point[]) => {
    const tiles = [from, ...path].map(({ x, y }) => ({ x: Math.floor(x), y: Math.floor(y) }));
    return tiles.every((tile, index) => index === 0 || (Math.abs(tile.x - tiles[index - 1].x) <= 1 && Math.abs(tile.y - tiles[index - 1].y) <= 1));
  };

  it('keeps the break room door clear, with a way from it to every place and to the arcade', () => {
    const doorTiles = { from: Math.floor(COZY_DOOR.a0 / 8), to: Math.floor((COZY_DOOR.a1 - 1) / 8) };
    for (let y = doorTiles.from; y <= doorTiles.to; y++) for (const x of [0, 1]) assert.ok(BREAK_ROOM.isFreeTile(x, y), `in front of the door: (${x}, ${y})`);
    assert.ok(BREAK_ROOM.isWalkable(BREAK_ROOM.door), 'the user comes in on the floor');
    for (let seat = 0; seat < LOUNGE_PLACES.length; seat++) {
      const path = BREAK_ROOM.pathToSeat(BREAK_ROOM.inside, seat);
      assert.ok(close(path.at(-1)!, BREAK_ROOM.seatPosition(seat)), `place ${seat} reached`);
      assert.ok(walksFrom(BREAK_ROOM.inside, path.slice(0, -1)), `place ${seat}: no way through`);
    }
    const toArcade = BREAK_ROOM.route(BREAK_ROOM.inside, tileOf(ARCADE_FRONT.u, ARCADE_FRONT.v));
    assert.ok(walksFrom(BREAK_ROOM.inside, toArcade), 'a way to the arcade');
  });

  it('leaves free floor in front of the arcade cabinet, inside the room, with its back to the wall', () => {
    const front = tileOf(ARCADE_FRONT.u, ARCADE_FRONT.v);
    assert.ok(BREAK_ROOM.isWalkable(front), 'someone can stand there');
    assert.ok(front.y > ARCADE.v1 / 8, 'on the screen side of the cabinet');
    assert.equal(ARCADE.v0, 0, 'its back against the right wall, so its screen looks into the room');
    assert.ok(!BREAK_ROOM.isFreeTile(Math.floor(front.x), Math.floor(ARCADE.v1 / 8) - 1), 'the cabinet itself is in the way');
  });

  it('walks the user from the door to every session and to the couch of a project room through no furniture, in every ambiance, on a festival too', () => {
    for (const design of DESIGNS) for (const festival of [null, 'christmas'] as const) {
      const floor = projectFloor(design.id, festival), name = `${design.id}${festival ? `, ${festival}` : ''}`;
      assert.equal(design.desks.length, DESK_COUNT, `${name}: its desks`);
      for (let seat = 0; seat < DESK_COUNT; seat++) {
        const path = floor.pathToSeat(floor.inside, seat);
        assert.ok(close(path.at(-1)!, floor.seatPosition(seat)), `${name}: desk ${seat} reached`);
        assert.ok(path.slice(0, -1).every((point) => onFloor(floor, point)), `${name}: desk ${seat} through no furniture`);
      }
      for (const spot of floor.layout.playerSpots) {
        const path = floor.route(floor.inside, spot.at);
        assert.ok(walksFrom(floor.inside, path), `${name}: a way to the couch`);
      }
    }
  });

  it('keeps the door of a project room clear in every ambiance, on a festival too', () => {
    for (const design of DESIGNS) for (const festival of [null, 'christmas'] as const) {
      // along the wall the whole doorway, and one step in at its middle, where people come in
      const floor = projectFloor(design.id, festival), { a0, a1 } = design.door, middle = Math.floor((a0 + a1) / 16);
      for (let y = Math.floor(a0 / 8); y <= Math.floor((a1 - 1) / 8); y++) assert.ok(floor.isFreeTile(0, y), `${design.id}: in the doorway, (0, ${y})`);
      assert.ok(floor.isFreeTile(1, middle), `${design.id}: one step in, (1, ${middle})`);
      assert.ok(floor.isWalkable(floor.door) && floor.isWalkable(floor.inside), `${design.id}: in on the floor`);
    }
  });

  it("does not seat the user on a break room sofa place a session has", () => {
    const [first] = BREAK_ROOM.layout.playerSpots;
    assert.equal(BREAK_ROOM.spotAt(first.at), first);
    assert.notEqual(BREAK_ROOM.spotAt(first.at, new Set([0])), first);
  });

  describe('moving sessions by hand', () => {
    const projectScene = () => {
      const scene = new Scene(PROJECT, { atDoor: true, view: COZY_VIEW });
      scene.sync(planRoom([session('a', 'wait'), session('b', 'wait')], {}, new Map([['a', 0], ['b', 1]]), DESK_COUNT), true);
      return scene;
    };
    const carryOver = (scene: Scene<CozyFloor>, seat: number) => {
      const target = scene.seatScreenPosition(seat);
      scene.carryTo({ x: target.x, y: target.y - COZY_VIEW.carryHang });
    };

    it('puts a session carried over a free desk on it', () => {
      const scene = projectScene(), a = scene.characters.get('a')!;
      scene.pickUp(a);
      carryOver(scene, 3);
      assert.equal(scene.drop(), true);
      assert.equal(a.seat, 3);
    });

    it("swaps two sessions when one is let go over the other's desk", () => {
      const scene = projectScene(), a = scene.characters.get('a')!, b = scene.characters.get('b')!;
      scene.pickUp(a);
      carryOver(scene, 1);
      scene.drop();
      assert.deepEqual([a.seat, b.seat], [1, 0]);
    });

    it('keeps the seats moved by hand under a key of their own for each project folder and for the break room', () => {
      const keys = [cozySeatsKey({ kind: 'project', folder: '/work/a' }), cozySeatsKey({ kind: 'project', folder: '/work/b' }), cozySeatsKey({ kind: 'lounge', folder: '' })];
      assert.equal(new Set(keys).size, 3);
      assert.ok(keys.every((key) => key?.startsWith('cozy:')), 'apart from the classic room\'s');
      assert.equal(cozySeatsKey({ kind: 'home', folder: '' }), null);
    });

    it('reads back the seats saved, leaving out those the room does not have and broken values', () => {
      assert.deepEqual(savedSeats({ a: 1, b: 9, c: 'x', d: -1, e: 1.5 }, 4), new Map([['a', 1]]));
      assert.deepEqual(savedSeats('broken', 4), new Map());
    });

    it('gives a seat to one person only: someone kept on a seat another is moved to loses it', () => {
      assert.deepEqual(keepSeats(new Map([['a', 0], ['z', 2]]), new Map([['b', 0], ['a', 1]])), new Map([['b', 0], ['a', 1], ['z', 2]]));
    });
  });
});

describe('the ambiance of a cozy project room', () => {
  const FOLDERS = Array.from({ length: 40 }, (_, index) => `/work/project-${index}`);
  const MODES = ['same', 'random', 'manual'] as const;

  it('is the offices for a settings file without one, or with one this version does not draw', () => {
    assert.equal(ambianceFor('/work/a', {}), 'office');
    assert.equal(ambianceFor('/work/a', { mode: 'same', theme: 'igloo' }), 'office');
    assert.equal(ambianceFor('/work/a', { mode: 'manual', theme: 'tokyo', projects: { '/work/a': 'igloo' } }), 'tokyo', 'an unknown pick: the theme ambiance');
  });

  it('is the same for every room, or each room\'s pick and the default for the others', () => {
    assert.ok(FOLDERS.every((folder) => ambianceFor(folder, { mode: 'same', theme: 'space', projects: { [folder]: 'cafe' } }) === 'space'), 'the picks wait for the manual mode');
    const manual: AmbianceChoice = { mode: 'manual', theme: 'space', projects: { '/work/project-1': 'cafe' } };
    assert.equal(ambianceFor('/work/project-1', manual), 'cafe');
    assert.equal(ambianceFor('/work/project-2', manual), 'space');
  });

  it('gives each folder at random always the same ambiance, among those there are, and not one for all', () => {
    const random: AmbianceChoice = { mode: 'random' };
    const picks = FOLDERS.map((folder) => ambianceFor(folder, random));
    assert.deepEqual(FOLDERS.map((folder) => ambianceFor(folder, random)), picks);
    assert.ok(picks.every((id) => AMBIANCE_IDS.includes(id)));
    assert.ok(new Set(picks).size > 1);
  });

  it('changes only the room an ambiance is picked for, in every mode, and that room shows it', () => {
    for (const mode of MODES) for (const id of AMBIANCE_IDS) {
      const before: AmbianceChoice = { mode, theme: 'space', projects: { '/work/project-3': 'cafe' } };
      const changes = pickAmbiance(before, '/work/project-0', id, FOLDERS);
      const after: AmbianceChoice = changes ? { mode: changes.cozyAmbianceMode, theme: 'space', projects: changes.projectAmbiances } : before;
      assert.equal(ambianceFor('/work/project-0', after), id, `${mode} → ${id}`);
      for (const folder of FOLDERS.slice(1)) assert.equal(ambianceFor(folder, after), ambianceFor(folder, before), `${mode} → ${id}: ${folder}`);
    }
  });

  it('changes nothing when the room already has the ambiance picked', () => {
    for (const mode of MODES) assert.equal(pickAmbiance({ mode, theme: 'cafe' }, '/work/a', ambianceFor('/work/a', { mode, theme: 'cafe' }), FOLDERS), null, mode);
  });
});

describe('what moves in a cozy project room, and in the break room', () => {
  /** A room whose decor moves: a project room of an ambiance that has motion, or the break room (its arcade's screen). */
  interface Moving { id: string; motion: AmbianceMotion; layout: (lit: boolean, time: CozyTime) => Pick<ReturnType<typeof roomLayout>, 'back' | 'light' | 'masks'> }
  const MOVING: Moving[] = [
    ...DESIGNS.flatMap((design) => (design.motion ? [{ id: design.id, motion: design.motion, layout: (lit: boolean, time: CozyTime) => roomLayout('project', design, lit, time, null) }] : [])),
    { id: 'lounge', motion: LOUNGE_MOTION, layout: (lit, time) => loungeLayout(lit, time, null) },
  ];
  /** What a room's motion paints over its art at `frame`, through the layers its art gives it (decor.ts roomLayout, lounge-art.ts loungeLayout). */
  type Layout = ReturnType<Moving['layout']>;
  const layouts = new Map<string, Layout>();
  const painted = (room: Moving, lit: boolean, time: CozyTime, frame: number, masks: (layout: Layout) => Layout['masks'] = () => ({})) => {
    const key = `${room.id} ${lit} ${time}`, layout = layouts.get(key) ?? room.layout(lit, time);
    layouts.set(key, layout);
    const strokes: { layer: string; x: number; y: number; colour: string }[] = [];
    const layers = Object.fromEntries(Object.entries({ ...layout.masks, ...masks(layout) }).map(([name, { mask, colours }]) => {
      const layer = new MotionLayer(mask, colours);
      const pen = { fillStyle: '' as unknown, fillRect(x: number, y: number) { strokes.push({ layer: name, x, y, colour: String(pen.fillStyle) }); } };
      layer.pen = pen as unknown as Pen;
      return [name, layer];
    }));
    room.motion.paint(layers, frame, { time, lit, festival: null });
    return { strokes, layout };
  };
  const SCENES = COZY_TIMES.flatMap((time) => [true, false].map((lit) => ({ time, lit })));

  it('draws the same pixels for the same frame, and something else a moment later', () => {
    for (const room of MOVING) {
      for (const { time, lit } of SCENES) assert.deepEqual(painted(room, lit, time, 37).strokes, painted(room, lit, time, 37).strokes, `${room.id} ${time} ${lit}`);
      const moves = SCENES.some(({ time, lit }) => [5, 23, 61].some((frame) => !isDeepStrictEqual(painted(room, lit, time, 0).strokes, painted(room, lit, time, frame).strokes)));
      assert.ok(moves, `${room.id}: its layers find their colours in its art`);
    }
  });

  it('paints only what the room\'s light leaves as it is, or something see-through, so it matches the art at every hour', () => {
    for (const room of MOVING) for (const { time, lit } of SCENES) for (const frame of [0, 9, 40]) {
      const { strokes, layout } = painted(room, lit, time, frame);
      for (const { x, y, colour } of strokes) {
        if (colour.startsWith('rgba') || !layout.light) continue;
        assert.equal(layout.light(colour, x, y), colour, `${room.id} ${time} lit ${lit}: ${colour} at ${x},${y}`);
      }
    }
  });

  it('moves a room\'s view inside its window only, even where its colours show elsewhere in the room', () => {
    for (const design of DESIGNS) {
      if (!design.motion || !design.glass) continue;
      const inside = new Set<string>();
      wallPatch({ set: (x, y) => inside.add(`${Math.floor(x)},${Math.floor(y)}`) }, design.glass.wall, design.glass.a0, design.glass.a1, design.glass.z0, design.glass.z1, '');
      for (const { time, lit } of SCENES) for (const frame of [0, 6, 37, 113, 245]) {
        // the view's colours wherever they are in the art, the window's glass not cut out of them
        const room = MOVING.find(({ id }) => id === design.id)!;
        const { strokes } = painted(room, lit, time, frame, (layout) => ({ view: { mask: colourMask(layout.back, design.light.sky), colours: design.light.sky } }));
        for (const { x, y, layer } of strokes) if (layer === 'view') assert.ok(inside.has(`${x},${y}`), `${design.id} ${time} frame ${frame}: ${x},${y} is outside its glass`);
      }
    }
  });
});
