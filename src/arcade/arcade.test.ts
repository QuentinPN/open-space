import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BUG, CLEARED_MS, FIELD, HIT_MS, LIFE_EVERY, LIVES, MARCH, POINTS, POT, SHROOM_CELL, SHROOM_SHAPE, SKY_TOP, bugAt, newGame, step, stepWait, togglePause, type Controls, type Game } from './game.ts';

const IDLE: Controls = { left: false, right: false, fire: false };
const FIRE: Controls = { ...IDLE, fire: true };

/** A game started (a press on fire), nothing else having moved. */
function started(seed = 7): Game {
  const game = newGame(seed);
  step(game, 0, FIRE);
  step(game, 0, IDLE);
  return game;
}

/** No seed falls: the swarm only marches. */
const noSeeds = (game: Game) => { game.seedWait = Number.POSITIVE_INFINITY; return game; };

describe('Petal Patrol, the cozy arcade game', () => {
  it('waits for a press on fire to start, then plays', () => {
    const game = newGame();
    step(game, 1000, IDLE);
    assert.equal(game.phase, 'ready');
    step(game, 16, FIRE);
    assert.equal(game.phase, 'playing');
  });

  it('marches the swarm sideways, then a step down and back the other way at a side', () => {
    const game = noSeeds(started());
    const { x, y } = game.swarm;
    step(game, game.swarm.wait, IDLE);
    assert.deepEqual([game.swarm.x, game.swarm.y], [x + MARCH.across, y], 'one step right');
    let steps = 0;
    while (game.swarm.y === y && steps++ < 100) step(game, game.swarm.wait, IDLE);
    const right = Math.max(...game.bugs.map((bug) => bugAt(game, bug).x)) + BUG.width;
    assert.ok(right <= FIELD.width, 'it stayed inside the field');
    assert.equal(game.swarm.y, y + MARCH.down, 'down at the side');
    const atSide = game.swarm.x;
    step(game, game.swarm.wait, IDLE);
    assert.equal(game.swarm.x, atSide - MARCH.across, 'then back the other way');
  });

  it('marches faster as the swarm thins out and from one level to the next', () => {
    const total = 40;
    assert.ok(stepWait(1, total / 2, total) < stepWait(1, total, total));
    assert.ok(stepWait(1, 1, total) < stepWait(1, 2, total));
    assert.ok(stepWait(2, total, total) < stepWait(1, total, total));
  });

  it("scores a bug hit by the pot's drop by its kind, and the bug is gone", () => {
    const game = noSeeds(started());
    game.shrooms = [];
    // the lowest bug of the column above the pot
    const target = game.bugs.filter((bug) => bug.column === 3).at(-1)!;
    game.pot.x = bugAt(game, target).x + BUG.width / 2 - POT.width / 2;
    game.swarm.wait = Number.POSITIVE_INFINITY;
    step(game, 16, FIRE);
    for (let ms = 0; ms < 2000 && target.alive; ms += 16) step(game, 16, IDLE);
    assert.equal(target.alive, false);
    assert.equal(game.score, POINTS[target.kind]);
    assert.equal(game.bugs.filter((bug) => !bug.alive).length, 1, 'one drop, one bug');
    assert.equal(game.drop, null);
  });

  it('lets a mushroom soak up a drop, a bite taken out of it', () => {
    const game = noSeeds(started());
    const shroom = game.shrooms[0], before = shroom.cells.filter(Boolean).length;
    game.pot.x = shroom.x + (SHROOM_SHAPE[0].length * SHROOM_CELL) / 2 - POT.width / 2;
    game.swarm.wait = Number.POSITIVE_INFINITY;
    step(game, 16, FIRE);
    for (let ms = 0; ms < 500 && game.drop; ms += 16) step(game, 16, IDLE);
    assert.equal(game.drop, null, 'the drop stopped');
    assert.ok(shroom.cells.filter(Boolean).length < before, 'the mushroom lost a cell');
    assert.ok(game.bugs.every((bug) => bug.alive), 'it went no further');
  });

  it('takes a life when a seed falls on the pot, the pot out for a while, and ends the game with the last one', () => {
    const game = noSeeds(started());
    game.swarm.wait = Number.POSITIVE_INFINITY;
    const hit = () => { game.seeds = [{ x: game.pot.x + 4, y: POT.y - 2 }]; step(game, 16, IDLE); };
    hit();
    assert.equal(game.lives, LIVES - 1);
    const x = game.pot.x;
    step(game, HIT_MS / 2, { ...IDLE, right: true });
    assert.equal(game.pot.x, x, 'the pot does not move while out');
    for (let life = game.lives; life > 0; life--) { step(game, HIT_MS, IDLE); hit(); }
    assert.equal(game.phase, 'over');
  });

  it('ends the game when the swarm comes down to the pot', () => {
    const game = noSeeds(started());
    game.swarm.y = POT.y - 4 * 13 - BUG.height + 1;
    step(game, 16, IDLE);
    assert.equal(game.phase, 'over');
  });

  it('brings the next swarm, faster, once one is cleared', () => {
    const game = noSeeds(started());
    const last = game.bugs[0];
    for (const bug of game.bugs) bug.alive = bug === last;
    game.drop = { ...bugAt(game, last), x: bugAt(game, last).x + 4, y: bugAt(game, last).y + BUG.height };
    step(game, 16, IDLE);
    assert.equal(game.phase, 'cleared');
    step(game, CLEARED_MS, IDLE);
    assert.equal(game.phase, 'playing');
    assert.equal(game.level, 2);
    assert.ok(game.bugs.every((bug) => bug.alive), 'a whole new swarm');
    assert.ok(game.swarm.wait < stepWait(1, game.bugs.length), 'that marches faster');
  });

  it('gives a life more each time the score passes a multiple of LIFE_EVERY', () => {
    const game = noSeeds(started());
    game.score = LIFE_EVERY - POINTS.beetle;
    const beetle = game.bugs.at(-1)!;
    game.drop = { x: bugAt(game, beetle).x + 4, y: bugAt(game, beetle).y + BUG.height };
    step(game, 16, IDLE);
    assert.equal(game.lives, LIVES + 1);
  });

  it('freezes while paused, and keeps the drops in the field', () => {
    const game = started();
    const before = JSON.stringify(togglePause(game));
    step(game, 5000, { ...FIRE, left: true });
    assert.equal(JSON.stringify({ ...game, fireDown: false }), JSON.stringify({ ...JSON.parse(before), fireDown: false }));
    togglePause(game);
    step(game, 16, FIRE);
    assert.ok(game.drop && game.drop.y > SKY_TOP);
  });
});
