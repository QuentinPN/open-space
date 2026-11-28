import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ALIEN, CLEARED_MS, FIELD, HIT_MS, LIFE_EVERY, LIVES, MARCH, POINTS, ROCK_CELL, ROCK_SHAPE, SHIP, SKY_TOP, alienAt, newGame, step, stepWait, togglePause, type Controls, type Game } from './game.ts';

const IDLE: Controls = { left: false, right: false, fire: false };
const FIRE: Controls = { ...IDLE, fire: true };

/** A game started (a press on fire), nothing else having moved. */
function started(seed = 7): Game {
  const game = newGame(seed);
  step(game, 0, FIRE);
  step(game, 0, IDLE);
  return game;
}

/** No spark falls: the fleet only marches. */
const noSparks = (game: Game) => { game.sparkWait = Number.POSITIVE_INFINITY; return game; };

describe('Nebula Raid, the cozy arcade game', () => {
  it('waits for a press on fire to start, then plays', () => {
    const game = newGame();
    step(game, 1000, IDLE);
    assert.equal(game.phase, 'ready');
    step(game, 16, FIRE);
    assert.equal(game.phase, 'playing');
  });

  it('marches the fleet sideways, then a step down and back the other way at a side', () => {
    const game = noSparks(started());
    const { x, y } = game.swarm;
    step(game, game.swarm.wait, IDLE);
    assert.deepEqual([game.swarm.x, game.swarm.y], [x + MARCH.across, y], 'one step right');
    let steps = 0;
    while (game.swarm.y === y && steps++ < 100) step(game, game.swarm.wait, IDLE);
    const right = Math.max(...game.aliens.map((alien) => alienAt(game, alien).x)) + ALIEN.width;
    assert.ok(right <= FIELD.width, 'it stayed inside the field');
    assert.equal(game.swarm.y, y + MARCH.down, 'down at the side');
    const atSide = game.swarm.x;
    step(game, game.swarm.wait, IDLE);
    assert.equal(game.swarm.x, atSide - MARCH.across, 'then back the other way');
  });

  it('marches faster as the fleet thins out and from one level to the next', () => {
    const total = 40;
    assert.ok(stepWait(1, total / 2, total) < stepWait(1, total, total));
    assert.ok(stepWait(1, 1, total) < stepWait(1, 2, total));
    assert.ok(stepWait(2, total, total) < stepWait(1, total, total));
  });

  it("scores an alien hit by the rocket's bolt by its kind, and the alien is gone", () => {
    const game = noSparks(started());
    game.rocks = [];
    // the lowest alien of the column above the rocket
    const target = game.aliens.filter((alien) => alien.column === 3).at(-1)!;
    game.ship.x = alienAt(game, target).x + ALIEN.width / 2 - SHIP.width / 2;
    game.swarm.wait = Number.POSITIVE_INFINITY;
    step(game, 16, FIRE);
    for (let ms = 0; ms < 2000 && target.alive; ms += 16) step(game, 16, IDLE);
    assert.equal(target.alive, false);
    assert.equal(game.score, POINTS[target.kind]);
    assert.equal(game.aliens.filter((alien) => !alien.alive).length, 1, 'one bolt, one alien');
    assert.equal(game.bolt, null);
  });

  it('lets an asteroid chunk soak up a bolt, a bite taken out of it', () => {
    const game = noSparks(started());
    const rock = game.rocks[0], before = rock.cells.filter(Boolean).length;
    game.ship.x = rock.x + (ROCK_SHAPE[0].length * ROCK_CELL) / 2 - SHIP.width / 2;
    game.swarm.wait = Number.POSITIVE_INFINITY;
    step(game, 16, FIRE);
    for (let ms = 0; ms < 500 && game.bolt; ms += 16) step(game, 16, IDLE);
    assert.equal(game.bolt, null, 'the bolt stopped');
    assert.ok(rock.cells.filter(Boolean).length < before, 'the rock lost a cell');
    assert.ok(game.aliens.every((alien) => alien.alive), 'it went no further');
  });

  it('takes a life when a spark hits the rocket, the rocket out for a while, and ends the game with the last one', () => {
    const game = noSparks(started());
    game.swarm.wait = Number.POSITIVE_INFINITY;
    const hit = () => { game.sparks = [{ x: game.ship.x + 4, y: SHIP.y - 2 }]; step(game, 16, IDLE); };
    hit();
    assert.equal(game.lives, LIVES - 1);
    const x = game.ship.x;
    step(game, HIT_MS / 2, { ...IDLE, right: true });
    assert.equal(game.ship.x, x, 'the rocket does not move while out');
    for (let life = game.lives; life > 0; life--) { step(game, HIT_MS, IDLE); hit(); }
    assert.equal(game.phase, 'over');
  });

  it('ends the game when the fleet comes down to the rocket', () => {
    const game = noSparks(started());
    game.swarm.y = SHIP.y - 4 * 13 - ALIEN.height + 1;
    step(game, 16, IDLE);
    assert.equal(game.phase, 'over');
  });

  it('brings the next fleet, faster, once one is cleared', () => {
    const game = noSparks(started());
    const last = game.aliens[0];
    for (const alien of game.aliens) alien.alive = alien === last;
    game.bolt = { ...alienAt(game, last), x: alienAt(game, last).x + 4, y: alienAt(game, last).y + ALIEN.height };
    step(game, 16, IDLE);
    assert.equal(game.phase, 'cleared');
    step(game, CLEARED_MS, IDLE);
    assert.equal(game.phase, 'playing');
    assert.equal(game.level, 2);
    assert.ok(game.aliens.every((alien) => alien.alive), 'a whole new fleet');
    assert.ok(game.swarm.wait < stepWait(1, game.aliens.length), 'that marches faster');
  });

  it('gives a life more each time the score passes a multiple of LIFE_EVERY', () => {
    const game = noSparks(started());
    game.score = LIFE_EVERY - POINTS.drone;
    const drone = game.aliens.at(-1)!;
    game.bolt = { x: alienAt(game, drone).x + 4, y: alienAt(game, drone).y + ALIEN.height };
    step(game, 16, IDLE);
    assert.equal(game.lives, LIVES + 1);
  });

  it('freezes while paused, and keeps the bolts in the field', () => {
    const game = started();
    const before = JSON.stringify(togglePause(game));
    step(game, 5000, { ...FIRE, left: true });
    assert.equal(JSON.stringify({ ...game, fireDown: false }), JSON.stringify({ ...JSON.parse(before), fireDown: false }));
    togglePause(game);
    step(game, 16, FIRE);
    assert.ok(game.bolt && game.bolt.y > SKY_TOP);
  });
});
