import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
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
});
