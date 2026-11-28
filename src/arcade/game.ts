// Nebula Raid, the game of the cozy break room's arcade cabinet (src/room/cozy/lounge.ts ARCADE): a little rocket at
// the bottom of the starfield slides left and right and fires laser bolts up at a fleet of aliens (one-eyed blobs,
// jellies, robot drones) that marches across the sky in rows, a step down each time it reaches a side, faster as it
// thins out and from one level to the next. The aliens fire plasma sparks; asteroid chunks between them and the rocket
// soak up bolts and sparks alike, a bite at a time. A spark on the rocket costs a life; a fleet cleared brings the
// next, a fleet down to the rocket ends the game. Everything is in the field's own pixels (FIELD), time in ms. Pure:
// arcade.test.ts runs it without a DOM, paint.ts draws it, ArcadeWindow.tsx plays it.

/** The field, in its own pixels: the score line at the top, the rocket at the bottom. */
export const FIELD = { width: 168, height: 192 } as const;
/** Under this line is the sky the aliens and the bolts fly in; above it, the score. */
export const SKY_TOP = 12;
/** Room kept between the fleet and the sides. */
const SIDE = 4;

export type AlienKind = 'cyclops' | 'jelly' | 'drone';
/** The fleet: so many columns of so many rows, one-eyed blobs at the top, drones at the bottom. */
export const COLUMNS = 8;
export const ROW_KINDS: readonly AlienKind[] = ['cyclops', 'jelly', 'jelly', 'drone', 'drone'];
/** An alien's box, and how far apart the fleet holds them. */
export const ALIEN = { width: 12, height: 9 } as const;
const SPACING = { x: 16, y: 13 } as const;
export const POINTS: Readonly<Record<AlienKind, number>> = { cyclops: 30, jelly: 20, drone: 10 };

/** How far the fleet goes at each step: sideways, and down at a side. */
export const MARCH = { across: 3, down: 6 } as const;
/** A step's wait at the first level with the whole fleet, how much shorter each level makes it, and the shortest. */
const STEP_MS = 600, LEVEL_PACE = 0.85, FASTEST_STEP_MS = 24;
/** Where the fleet starts: lower at each level, up to a point. */
const START_Y = 28, LOWER_PER_LEVEL = 6, LOWEST_LEVEL_START = 5;

/** The rocket: its box, where it flies, how fast it slides (pixels a second). */
export const SHIP = { width: 13, height: 10, y: 176, speed: 72 } as const;
/** A laser bolt and a plasma spark: their boxes and speeds (pixels a second). */
export const BOLT = { width: 2, height: 4, speed: 170 } as const;
export const SPARK = { width: 2, height: 4 } as const;
const COOLDOWN_MS = 250;
/** How long the rocket is out after a spark hit it (nothing moves meanwhile), the pause between two fleets. */
export const HIT_MS = 1500;
export const CLEARED_MS = 1600;
/** After the game ends, a press only starts a new one past this. */
const OVER_MS = 800;
export const LIVES = 3;
const MOST_LIVES = 5;
/** A life more each time the score passes a multiple of this. */
export const LIFE_EVERY = 1500;
/** How long an alien's blast lasts where it was hit (the rocket's, BLAST_MS * 3). */
const BLAST_MS = 400;

/** An asteroid chunk, in cells of ROCK_CELL pixels ('#' is rock). */
export const ROCK_CELL = 2;
export const ROCK_SHAPE: readonly string[] = [
  '...#####...',
  '.########..',
  '##########.',
  '###########',
  '###########',
  '.#########.',
  '...#####...',
];
const ROCK_Y = 150;
const ROCKS = 4;

export interface Alien { kind: AlienKind; column: number; row: number; alive: boolean }
/** A bolt or a spark: its top left corner. */
export interface Shot { x: number; y: number }
/** An explosion where something was hit: its top left corner (an alien's box), the ms it has left of its `ms`. */
export interface Blast { x: number; y: number; left: number; ms: number }
/** An asteroid chunk where it floats (its top left corner), its cells row by row: true while not blasted off. */
export interface Rock { x: number; y: number; cells: boolean[] }

export type Phase = 'ready' | 'playing' | 'cleared' | 'over';

export interface Game {
  phase: Phase;
  paused: boolean;
  level: number;
  score: number;
  lives: number;
  /** the rocket's left side; `out`: ms it stays out after a hit; `cooldown`: ms before it fires again */
  ship: { x: number; out: number; cooldown: number };
  /** the rocket's bolt in flight (one at a time) */
  bolt: Shot | null;
  sparks: Shot[];
  /** the fleet's top left corner (its first column and row), its way (1: right), the ms to its next step, its beat */
  swarm: { x: number; y: number; way: 1 | -1; wait: number; beat: 0 | 1 };
  aliens: Alien[];
  rocks: Rock[];
  blasts: Blast[];
  /** ms to the next spark */
  sparkWait: number;
  /** ms in the phase (cleared: before the next fleet; over: since it ended) */
  timer: number;
  /** the score that brings the next life */
  nextLife: number;
  /** the random generator's state */
  random: number;
  /** the fire button was down at the last step: a press is its going down */
  fireDown: boolean;
}

/** What the player holds down. */
export interface Controls { left: boolean; right: boolean; fire: boolean }

/** A small seeded generator (mulberry32): a game plays the same from the same seed. */
function nextRandom(game: Game): number {
  game.random = (game.random + 0x6d2b79f5) | 0;
  let t = game.random;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
}

const swarmWidth = () => (COLUMNS - 1) * SPACING.x + ALIEN.width;

function freshSwarm(level: number): Pick<Game, 'swarm' | 'aliens'> {
  const aliens = ROW_KINDS.flatMap((kind, row) => Array.from({ length: COLUMNS }, (_, column): Alien => ({ kind, column, row, alive: true })));
  const y = START_Y + Math.min(level - 1, LOWEST_LEVEL_START) * LOWER_PER_LEVEL;
  return { aliens, swarm: { x: Math.round((FIELD.width - swarmWidth()) / 2), y, way: 1, wait: stepWait(level, aliens.length, aliens.length), beat: 0 } };
}

const freshRocks = (): Rock[] => {
  const width = ROCK_SHAPE[0].length * ROCK_CELL, gap = (FIELD.width - ROCKS * width) / (ROCKS + 1);
  return Array.from({ length: ROCKS }, (_, index) => ({
    x: Math.round(gap + index * (width + gap)), y: ROCK_Y, cells: ROCK_SHAPE.join('').split('').map((cell) => cell === '#'),
  }));
};

/** A new game, waiting for a press to start. */
export function newGame(seed = 1): Game {
  return {
    phase: 'ready', paused: false, level: 1, score: 0, lives: LIVES,
    ship: { x: Math.round((FIELD.width - SHIP.width) / 2), out: 0, cooldown: 0 }, bolt: null, sparks: [],
    ...freshSwarm(1), rocks: freshRocks(), blasts: [], sparkWait: 1200, timer: 0, nextLife: LIFE_EVERY, random: seed, fireDown: false,
  };
}

/** The ms between two steps of the fleet: shorter at each level, and the fewer aliens are left. */
export function stepWait(level: number, alive: number, total: number = COLUMNS * ROW_KINDS.length): number {
  return Math.max(FASTEST_STEP_MS, STEP_MS * LEVEL_PACE ** (level - 1) * (0.08 + 0.92 * alive / total));
}

/** Where an alien of the fleet is, its top left corner. */
export const alienAt = (game: Pick<Game, 'swarm'>, alien: Alien) => ({ x: game.swarm.x + alien.column * SPACING.x, y: game.swarm.y + alien.row * SPACING.y });

interface Box { x: number; y: number; width: number; height: number }
const overlaps = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const alienBox = (game: Game, alien: Alien): Box => ({ ...alienAt(game, alien), ...ALIEN });

/** Takes the cells of the rocks under `box` away (`around`: and those round the first one hit); whether any was there. */
function bite(game: Game, box: Box, around: boolean): boolean {
  const columns = ROCK_SHAPE[0].length;
  for (const rock of game.rocks) {
    const hit: number[] = [];
    rock.cells.forEach((cell, index) => {
      if (!cell) return;
      const cellBox = { x: rock.x + (index % columns) * ROCK_CELL, y: rock.y + Math.floor(index / columns) * ROCK_CELL, width: ROCK_CELL, height: ROCK_CELL };
      if (overlaps(box, cellBox)) hit.push(index);
    });
    if (!hit.length) continue;
    if (!around) { for (const index of hit) rock.cells[index] = false; return true; }
    const first = hit[0], row = Math.floor(first / columns), column = first % columns;
    for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, 1], [0, -1]]) {
      const x = column + dx, y = row + dy;
      if (x >= 0 && x < columns && y >= 0 && y < ROCK_SHAPE.length) rock.cells[y * columns + x] = false;
    }
    return true;
  }
  return false;
}

const aliveAliens = (game: Game) => game.aliens.filter((alien) => alien.alive);

/** One step of the fleet: sideways, or down and back the other way when its next step would take it past a side. */
function march(game: Game) {
  const alive = aliveAliens(game);
  const left = Math.min(...alive.map((alien) => alienAt(game, alien).x)), right = Math.max(...alive.map((alien) => alienAt(game, alien).x)) + ALIEN.width;
  const { swarm } = game;
  if ((swarm.way === 1 && right + MARCH.across > FIELD.width - SIDE) || (swarm.way === -1 && left - MARCH.across < SIDE)) {
    swarm.y += MARCH.down;
    swarm.way = swarm.way === 1 ? -1 : 1;
  } else swarm.x += swarm.way * MARCH.across;
  swarm.beat = swarm.beat ? 0 : 1;
}

/** A spark from the lowest alien of a column picked at random among those with aliens left. */
function fireSpark(game: Game) {
  const alive = aliveAliens(game);
  const columns = [...new Set(alive.map((alien) => alien.column))];
  const column = columns[Math.floor(nextRandom(game) * columns.length)];
  const lowest = alive.filter((alien) => alien.column === column).reduce((low, alien) => (alien.row > low.row ? alien : low));
  const { x, y } = alienAt(game, lowest);
  game.sparks.push({ x: x + ALIEN.width / 2 - SPARK.width / 2, y: y + ALIEN.height });
}

const mostSparks = (level: number) => Math.min(2 + level, 6);
const sparkSpeed = (level: number) => 60 + 6 * Math.min(level, 10);
const sparkPause = (game: Game) => Math.max(280, (800 + nextRandom(game) * 1000) * 0.88 ** (game.level - 1));

function startLevel(game: Game, level: number) {
  Object.assign(game, freshSwarm(level), { level, bolt: null, sparks: [], rocks: freshRocks(), blasts: [], sparkWait: 1200, phase: 'playing', timer: 0 });
  game.ship.out = 0;
}

function start(game: Game) {
  const seed = game.random;
  Object.assign(game, newGame(seed));
  startLevel(game, 1);
}

function score(game: Game, points: number) {
  game.score += points;
  while (game.score >= game.nextLife) {
    game.lives = Math.min(MOST_LIVES, game.lives + 1);
    game.nextLife += LIFE_EVERY;
  }
}

/** A slice of play, short enough that nothing flies through anything. */
function play(game: Game, ms: number, controls: Controls) {
  const seconds = ms / 1000;
  for (const blast of game.blasts) blast.left -= ms;
  game.blasts = game.blasts.filter((blast) => blast.left > 0);
  const { ship } = game;
  ship.cooldown = Math.max(0, ship.cooldown - ms);
  // the bolt in flight goes on, even while the rocket is out
  if (game.bolt) {
    game.bolt.y -= BOLT.speed * seconds;
    const box = { ...game.bolt, ...BOLT };
    const alien = aliveAliens(game).find((each) => overlaps(box, alienBox(game, each)));
    const spark = game.sparks.findIndex((each) => overlaps(box, { ...each, ...SPARK }));
    if (alien) {
      alien.alive = false;
      game.blasts.push({ ...alienAt(game, alien), left: BLAST_MS, ms: BLAST_MS });
      score(game, POINTS[alien.kind]);
      game.bolt = null;
    } else if (spark >= 0) { game.sparks.splice(spark, 1); game.bolt = null; } else if (bite(game, box, false) || game.bolt.y + BOLT.height < SKY_TOP) game.bolt = null;
  }
  if (!aliveAliens(game).length) { game.phase = 'cleared'; game.timer = CLEARED_MS; game.sparks = []; return; }
  // knocked out by a spark: nothing else moves until the rocket is back
  if (ship.out > 0) { ship.out -= ms; return; }
  ship.x = Math.min(FIELD.width - 2 - SHIP.width, Math.max(2, ship.x + ((controls.right ? 1 : 0) - (controls.left ? 1 : 0)) * SHIP.speed * seconds));
  if (controls.fire && !game.bolt && ship.cooldown <= 0) {
    game.bolt = { x: Math.round(ship.x + SHIP.width / 2 - BOLT.width / 2), y: SHIP.y - BOLT.height };
    ship.cooldown = COOLDOWN_MS;
  }
  const swarm = game.swarm;
  swarm.wait -= ms;
  while (swarm.wait <= 0) {
    march(game);
    swarm.wait += stepWait(game.level, aliveAliens(game).length);
  }
  for (const alien of aliveAliens(game)) {
    const box = alienBox(game, alien);
    bite(game, box, false);
    if (box.y + box.height >= SHIP.y) { game.phase = 'over'; game.timer = 0; game.lives = 0; return; }
  }
  game.sparkWait -= ms;
  if (game.sparkWait <= 0 && game.sparks.length < mostSparks(game.level)) { fireSpark(game); game.sparkWait = sparkPause(game); }
  const shipBox = { x: ship.x, y: SHIP.y, width: SHIP.width, height: SHIP.height };
  const speed = sparkSpeed(game.level) * seconds;
  game.sparks = game.sparks.filter((spark) => {
    spark.y += speed;
    const box = { ...spark, ...SPARK };
    if (bite(game, box, true)) return false;
    if (overlaps(box, shipBox)) { hitShip(game); return false; }
    return spark.y < FIELD.height;
  });
}

function hitShip(game: Game) {
  game.lives -= 1;
  game.blasts.push({ x: game.ship.x, y: SHIP.y, left: BLAST_MS * 3, ms: BLAST_MS * 3 });
  game.sparks = [];
  if (game.lives <= 0) { game.phase = 'over'; game.timer = 0; return; }
  game.ship.out = HIT_MS;
}

/** The longest slice step plays at once: a bolt goes some 3 pixels in it, less than an alien or a rock's cell is tall. */
const SLICE_MS = 16;

/**
 * Plays `ms` of the game with what the player holds (changing `game`, returned): a press on fire starts a game (and
 * one more once it is over); paused, nothing moves.
 */
export function step(game: Game, ms: number, controls: Controls): Game {
  const pressed = controls.fire && !game.fireDown;
  game.fireDown = controls.fire;
  if (game.paused) return game;
  if (game.phase === 'ready') { if (pressed) start(game); return game; }
  if (game.phase === 'over') { game.timer += ms; if (pressed && game.timer >= OVER_MS) start(game); return game; }
  if (game.phase === 'cleared') {
    game.timer -= ms;
    if (game.timer <= 0) startLevel(game, game.level + 1);
    return game;
  }
  for (let left = ms; left > 0 && game.phase === 'playing'; left -= SLICE_MS) play(game, Math.min(SLICE_MS, left), controls);
  return game;
}

/** P: paused or back, while a game goes on. */
export function togglePause(game: Game, paused = !game.paused): Game {
  game.paused = (game.phase === 'playing' || game.phase === 'cleared') && paused;
  return game;
}
