import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_LOOK } from '../../design/people-palette.ts';
import { hdArt } from '../chibi-hd.ts';
import { visitorPose } from '../draw.ts';
import { distance } from '../geometry.ts';
import { directionOf } from '../scene.ts';
import { Visits } from '../visitors.ts';
import { ARCADE_SPOT, loungeVisitFloor } from './arcade.ts';
import { CozyFloor, cozyFloorPlan } from './floor.ts';
import { ROOM_BOX, iso } from './geometry.ts';
import { ARCADE } from './lounge.ts';
import { loungeRoom, projectRoom, type CozyRoom } from './rooms.ts';
import { targetAt, thingAt } from './things.ts';

const LOUNGE: CozyRoom = loungeRoom({ sessions: [], seen: {}, previous: () => new Map() });
const PROJECT: CozyRoom = projectRoom('/work/a', 'a', { sessions: [], seen: {}, pinned: [], previous: () => new Map() });
/** A point on the cabinet's screen, in the room's pixels. */
const SCREEN = iso((ARCADE.u0 + ARCADE.u1) / 2, ARCADE.v1, 32);

describe("the cozy break room's arcade", () => {
  it('is what a click on its cabinet falls on, in the break room opened big or among all the rooms', () => {
    assert.equal(thingAt(LOUNGE, SCREEN), 'arcade');
    assert.notEqual(thingAt(PROJECT, SCREEN), 'arcade', 'a project room has no arcade');
    const at = { x: ROOM_BOX.width, y: 0 };
    const rooms = [{ room: PROJECT, at: { x: 0, y: 0 }, people: [] }, { room: LOUNGE, at, people: [] }];
    const overview = targetAt({ x: at.x + SCREEN.x, y: at.y + SCREEN.y }, rooms, { zoomed: false, pet: null });
    assert.deepEqual([overview.index, overview.thing], [1, 'arcade']);
  });

  it('brings someone of the crew in through the door to play, round the furniture, facing the screen with their hands going', () => {
    let seed = 3;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const visits = new Visits(loungeVisitFloor(null), random);
    const floor = new CozyFloor(cozyFloorPlan({ kind: 'lounge' }));
    const free = ['Alex'];
    let walked = 0;
    for (let ms = 0; ms < 120_000; ms += 50) {
      visits.step(50, { free, hour: 13, enabled: true, blocked: null });
      const visitor = visits.visitors.get('visitor:Alex');
      if (visitor?.phase === 'coming') { walked++; assert.ok(floor.isFreeTile(Math.floor(visitor.position.x), Math.floor(visitor.position.y)), `through no furniture at ${JSON.stringify(visitor.position)}`); }
      if (visitor?.phase === 'staying') break;
    }
    const visitor = visits.visitors.get('visitor:Alex');
    assert.equal(visitor?.phase, 'staying', 'they came');
    assert.ok(walked > 0, 'walking in');
    assert.ok(distance(visitor.position, ARCADE_SPOT.at) < 1e-6, 'in front of the cabinet');
    assert.equal(directionOf(visitor.heading), 'up-right', 'facing its screen');
    const beats = [0, 170].map((time) => visitorPose(visitor, { time, reducedMotion: false }).pose);
    assert.equal(beats[0].gesture, 'typing');
    assert.notDeepEqual(hdArt(DEFAULT_LOOK, beats[0]).cells, hdArt(DEFAULT_LOOK, beats[1]).cells, 'their hands move from one beat to the next');
  });
});
