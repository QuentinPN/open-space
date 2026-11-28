// Petal Patrol, the game of the cozy break room's arcade cabinet (src/room/cozy/lounge.ts ARCADE): a little flower pot
// at the bottom of the garden slides left and right and sprays drops of water up at a swarm of garden bugs (moths,
// ladybirds, beetles) that marches across the beds in rows, a step down each time it reaches a side, faster as it
// thins out and from one level to the next. The bugs drop seeds; mushrooms between them and the pot soak up drops and
// seeds alike, a bite at a time. A seed on the pot costs a life; a swarm cleared brings the next, a swarm down to the
// pot ends the game. Everything is in the field's own pixels (FIELD), time in ms. Pure: arcade.test.ts runs it
// without a DOM, paint.ts draws it, ArcadeWindow.tsx plays it.

/** The field, in its own pixels: the score line at the top, the pot at the bottom. */
export const FIELD = { width: 168, height: 192 } as const;
/** Under this line is the field the bugs and the drops fly in; above it, the score. */
export const SKY_TOP = 12;
/** Room kept between the swarm and the sides. */
const SIDE = 4;

export type BugKind = 'moth' | 'ladybird' | 'beetle';
/** The swarm: so many columns of so many rows, moths at the top, beetles at the bottom. */
export const COLUMNS = 8;
export const ROW_KINDS: readonly BugKind[] = ['moth', 'ladybird', 'ladybird', 'beetle', 'beetle'];
/** A bug's box, and how far apart the swarm holds them. */
export const BUG = { width: 12, height: 9 } as const;
const SPACING = { x: 16, y: 13 } as const;
export const POINTS: Readonly<Record<BugKind, number>> = { moth: 30, ladybird: 20, beetle: 10 };

/** How far the swarm goes at each step: sideways, and down at a side. */
export const MARCH = { across: 3, down: 6 } as const;
/** A step's wait at the first level with the whole swarm, how much shorter each level makes it, and the shortest. */
const STEP_MS = 600, LEVEL_PACE = 0.85, FASTEST_STEP_MS = 24;
/** Where the swarm starts: lower at each level, up to a point. */
const START_Y = 28, LOWER_PER_LEVEL = 6, LOWEST_LEVEL_START = 5;

/** The pot: its box, where it stands, how fast it slides (pixels a second). */
export const POT = { width: 13, height: 8, y: 178, speed: 72 } as const;
/** A drop of water and a seed: their boxes and speeds (pixels a second). */
export const DROP = { width: 2, height: 4, speed: 170 } as const;
export const SEED = { width: 2, height: 4 } as const;
const COOLDOWN_MS = 250;
/** How long the pot is out after a seed hit it (nothing moves meanwhile), the pause between two swarms. */
export const HIT_MS = 1500;
export const CLEARED_MS = 1600;
/** After the game ends, a press only starts a new one past this. */
const OVER_MS = 800;
export const LIVES = 3;
const MOST_LIVES = 5;
/** A life more each time the score passes a multiple of this. */
export const LIFE_EVERY = 1500;
/** How long a bug's puff stays where it was hit. */
const PUFF_MS = 220;

/** A mushroom: its cap over its stem, in cells of SHROOM_CELL pixels ('#' is mushroom). */
export const SHROOM_CELL = 2;
export const SHROOM_SHAPE: readonly string[] = [
  '..#######..',
  '.#########.',
  '###########',
  '###########',
  '...#####...',
  '...#####...',
  '...#####...',
];
const SHROOM_Y = 150;
const SHROOMS = 4;

export interface Bug { kind: BugKind; column: number; row: number; alive: boolean }
/** A drop or a seed: its top left corner. */
export interface Shot { x: number; y: number }
export interface Puff { x: number; y: number; left: number }
/** A mushroom where it stands (its top left corner), its cells row by row: true while not eaten. */
export interface Shroom { x: number; y: number; cells: boolean[] }

export type Phase = 'ready' | 'playing' | 'cleared' | 'over';

export interface Game {
  phase: Phase;
  paused: boolean;
  level: number;
  score: number;
  lives: number;
  /** the pot's left side; `out`: ms it stays out after a hit; `cooldown`: ms before it sprays again */
  pot: { x: number; out: number; cooldown: number };
  /** the pot's drop in flight (one at a time) */
  drop: Shot | null;
  seeds: Shot[];
  /** the swarm's top left corner (its first column and row), its way (1: right), the ms to its next step, its wing beat */
  swarm: { x: number; y: number; way: 1 | -1; wait: number; beat: 0 | 1 };
  bugs: Bug[];
  shrooms: Shroom[];
  puffs: Puff[];
  /** ms to the next seed */
  seedWait: number;
  /** ms in the phase (cleared: before the next swarm; over: since it ended) */
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

const swarmWidth = () => (COLUMNS - 1) * SPACING.x + BUG.width;

function freshSwarm(level: number): Pick<Game, 'swarm' | 'bugs'> {
  const bugs = ROW_KINDS.flatMap((kind, row) => Array.from({ length: COLUMNS }, (_, column): Bug => ({ kind, column, row, alive: true })));
  const y = START_Y + Math.min(level - 1, LOWEST_LEVEL_START) * LOWER_PER_LEVEL;
  return { bugs, swarm: { x: Math.round((FIELD.width - swarmWidth()) / 2), y, way: 1, wait: stepWait(level, bugs.length, bugs.length), beat: 0 } };
}

const freshShrooms = (): Shroom[] => {
  const width = SHROOM_SHAPE[0].length * SHROOM_CELL, gap = (FIELD.width - SHROOMS * width) / (SHROOMS + 1);
  return Array.from({ length: SHROOMS }, (_, index) => ({
    x: Math.round(gap + index * (width + gap)), y: SHROOM_Y, cells: SHROOM_SHAPE.join('').split('').map((cell) => cell === '#'),
  }));
};

/** A new game, waiting for a press to start. */
export function newGame(seed = 1): Game {
  return {
    phase: 'ready', paused: false, level: 1, score: 0, lives: LIVES,
    pot: { x: Math.round((FIELD.width - POT.width) / 2), out: 0, cooldown: 0 }, drop: null, seeds: [],
    ...freshSwarm(1), shrooms: freshShrooms(), puffs: [], seedWait: 1200, timer: 0, nextLife: LIFE_EVERY, random: seed, fireDown: false,
  };
}

/** The ms between two steps of the swarm: shorter at each level, and the fewer bugs are left. */
export function stepWait(level: number, alive: number, total: number = COLUMNS * ROW_KINDS.length): number {
  return Math.max(FASTEST_STEP_MS, STEP_MS * LEVEL_PACE ** (level - 1) * (0.08 + 0.92 * alive / total));
}

/** Where a bug of the swarm is, its top left corner. */
export const bugAt = (game: Pick<Game, 'swarm'>, bug: Bug) => ({ x: game.swarm.x + bug.column * SPACING.x, y: game.swarm.y + bug.row * SPACING.y });

interface Box { x: number; y: number; width: number; height: number }
const overlaps = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const bugBox = (game: Game, bug: Bug): Box => ({ ...bugAt(game, bug), ...BUG });

/** Takes the cells of the mushrooms under `box` away (`bite`: and those round the first one hit); whether any was there. */
function bite(game: Game, box: Box, around: boolean): boolean {
  const columns = SHROOM_SHAPE[0].length;
  for (const shroom of game.shrooms) {
    const hit: number[] = [];
    shroom.cells.forEach((cell, index) => {
      if (!cell) return;
      const cellBox = { x: shroom.x + (index % columns) * SHROOM_CELL, y: shroom.y + Math.floor(index / columns) * SHROOM_CELL, width: SHROOM_CELL, height: SHROOM_CELL };
      if (overlaps(box, cellBox)) hit.push(index);
    });
    if (!hit.length) continue;
    if (!around) { for (const index of hit) shroom.cells[index] = false; return true; }
    const first = hit[0], row = Math.floor(first / columns), column = first % columns;
    for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, 1], [0, -1]]) {
      const x = column + dx, y = row + dy;
      if (x >= 0 && x < columns && y >= 0 && y < SHROOM_SHAPE.length) shroom.cells[y * columns + x] = false;
    }
    return true;
  }
  return false;
}

const aliveBugs = (game: Game) => game.bugs.filter((bug) => bug.alive);

/** One step of the swarm: sideways, or down and back the other way when its next step would take it past a side. */
function march(game: Game) {
  const alive = aliveBugs(game);
  const left = Math.min(...alive.map((bug) => bugAt(game, bug).x)), right = Math.max(...alive.map((bug) => bugAt(game, bug).x)) + BUG.width;
  const { swarm } = game;
  if ((swarm.way === 1 && right + MARCH.across > FIELD.width - SIDE) || (swarm.way === -1 && left - MARCH.across < SIDE)) {
    swarm.y += MARCH.down;
    swarm.way = swarm.way === 1 ? -1 : 1;
  } else swarm.x += swarm.way * MARCH.across;
  swarm.beat = swarm.beat ? 0 : 1;
}

/** A seed from the lowest bug of a column picked at random among those with bugs left. */
function dropSeed(game: Game) {
  const alive = aliveBugs(game);
  const columns = [...new Set(alive.map((bug) => bug.column))];
  const column = columns[Math.floor(nextRandom(game) * columns.length)];
  const lowest = alive.filter((bug) => bug.column === column).reduce((low, bug) => (bug.row > low.row ? bug : low));
  const { x, y } = bugAt(game, lowest);
  game.seeds.push({ x: x + BUG.width / 2 - SEED.width / 2, y: y + BUG.height });
}

const mostSeeds = (level: number) => Math.min(2 + level, 6);
const seedSpeed = (level: number) => 60 + 6 * Math.min(level, 10);
const seedPause = (game: Game) => Math.max(280, (800 + nextRandom(game) * 1000) * 0.88 ** (game.level - 1));

function startLevel(game: Game, level: number) {
  Object.assign(game, freshSwarm(level), { level, drop: null, seeds: [], shrooms: freshShrooms(), puffs: [], seedWait: 1200, phase: 'playing', timer: 0 });
  game.pot.out = 0;
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
  for (const puff of game.puffs) puff.left -= ms;
  game.puffs = game.puffs.filter((puff) => puff.left > 0);
  const { pot } = game;
  pot.cooldown = Math.max(0, pot.cooldown - ms);
  // the drop in flight goes on, even while the pot is out
  if (game.drop) {
    game.drop.y -= DROP.speed * seconds;
    const box = { ...game.drop, ...DROP };
    const bug = aliveBugs(game).find((each) => overlaps(box, bugBox(game, each)));
    const seed = game.seeds.findIndex((each) => overlaps(box, { ...each, ...SEED }));
    if (bug) {
      bug.alive = false;
      game.puffs.push({ ...bugAt(game, bug), left: PUFF_MS });
      score(game, POINTS[bug.kind]);
      game.drop = null;
    } else if (seed >= 0) { game.seeds.splice(seed, 1); game.drop = null; } else if (bite(game, box, false) || game.drop.y + DROP.height < SKY_TOP) game.drop = null;
  }
  if (!aliveBugs(game).length) { game.phase = 'cleared'; game.timer = CLEARED_MS; game.seeds = []; return; }
  // knocked out by a seed: nothing else moves until the pot is back
  if (pot.out > 0) { pot.out -= ms; return; }
  pot.x = Math.min(FIELD.width - 2 - POT.width, Math.max(2, pot.x + ((controls.right ? 1 : 0) - (controls.left ? 1 : 0)) * POT.speed * seconds));
  if (controls.fire && !game.drop && pot.cooldown <= 0) {
    game.drop = { x: Math.round(pot.x + POT.width / 2 - DROP.width / 2), y: POT.y - DROP.height };
    pot.cooldown = COOLDOWN_MS;
  }
  const swarm = game.swarm;
  swarm.wait -= ms;
  while (swarm.wait <= 0) {
    march(game);
    swarm.wait += stepWait(game.level, aliveBugs(game).length);
  }
  for (const bug of aliveBugs(game)) {
    const box = bugBox(game, bug);
    bite(game, box, false);
    if (box.y + box.height >= POT.y) { game.phase = 'over'; game.timer = 0; game.lives = 0; return; }
  }
  game.seedWait -= ms;
  if (game.seedWait <= 0 && game.seeds.length < mostSeeds(game.level)) { dropSeed(game); game.seedWait = seedPause(game); }
  const potBox = { x: pot.x, y: POT.y, width: POT.width, height: POT.height };
  const speed = seedSpeed(game.level) * seconds;
  game.seeds = game.seeds.filter((seed) => {
    seed.y += speed;
    const box = { ...seed, ...SEED };
    if (bite(game, box, true)) return false;
    if (overlaps(box, potBox)) { hitPot(game); return false; }
    return seed.y < FIELD.height;
  });
}

function hitPot(game: Game) {
  game.lives -= 1;
  game.puffs.push({ x: game.pot.x, y: POT.y, left: PUFF_MS * 3 });
  game.seeds = [];
  if (game.lives <= 0) { game.phase = 'over'; game.timer = 0; return; }
  game.pot.out = HIT_MS;
}

/** The longest slice step plays at once: a drop goes some 3 pixels in it, less than a bug or a mushroom's cell is tall. */
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
