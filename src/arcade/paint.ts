// Nebula Raid drawn (src/arcade/game.ts for the game itself): on a canvas `scale` device pixels a field pixel, a black
// starfield drifting down and twinkling, the fleet of aliens moving its feet, tentacles or rotors at each step, the
// asteroid chunks as blasted as they are, the rocket and its flame, the bolts and the sparks glowing, the blasts, the
// score line, and between two games a neon title in big pixels. Pixel art drawn in code, in the arcade's own colours
// (src/design/arcade-palette.ts).
import { ARCADE_PALETTE as A } from '../design/arcade-palette.ts';
import { ALIEN, BOLT, FIELD, ROCK_CELL, ROCK_SHAPE, SHIP, SKY_TOP, SPARK, alienAt, type AlienKind, type Blast, type Game } from './game.ts';

/** Each alien, for each of its two beats, row by row; a dot is nothing (A[kind] gives each letter its colour). */
const ALIENS: Readonly<Record<AlienKind, readonly [readonly string[], readonly string[]]>> = {
  // a one-eyed blob, its antenna and its stubby feet wiggling
  cyclops: [
    ['.....bb.....', '...aaaaaa...', '..aaccccaa..', '.aaccddccaa.', 'aaaccddccaaa', 'aaaaccccaaaa', '.aaaaaaaaaa.', '..bb.bb.bb..', '.bb......bb.'],
    ['....b..b....', '...aaaaaa...', '..aaccccaa..', '.aaccddccaa.', 'aaaccddccaaa', 'aaaaccccaaaa', '.aaaaaaaaaa.', '.bb.b..b.bb.', '..b......b..'],
  ],
  // a jelly: a dome with glowing spots, its tentacles swaying
  jelly: [
    ['....aaaa....', '..aaaaaaaa..', '.aacaaaacaa.', '.aaaaaaaaaa.', 'bbbbbbbbbbbb', '.b.a.aa.a.b.', 'b..a.aa.a..b', '.b.a....a.b.', '..a.a..a.a..'],
    ['....aaaa....', '..aaaaaaaa..', '.aacaaaacaa.', '.aaaaaaaaaa.', 'bbbbbbbbbbbb', 'b.a..aa..a.b', '.b.a.aa.a.b.', '..a.a..a.a..', '.a..a..a..a.'],
  ],
  // a robot drone: two rotors, a visor with two eyes, its thrusters firing
  drone: [
    ['bbb......bbb', '..b......b..', '..bbaaaabb..', '.aaaaaaaaaa.', '.accdccdcca.', '.aaaaaaaaaa.', '..bbbbbbbb..', '...c....c...', '...c....c...'],
    ['.bbb....bbb.', '..b......b..', '..bbaaaabb..', '.aaaaaaaaaa.', '.accdccdcca.', '.aaaaaaaaaa.', '..bbbbbbbb..', '...c....c...', '............'],
  ],
};

const SHIP_ART = [
  '......r......',
  '.....rrr.....',
  '.....wcw.....',
  '....wwcww....',
  '....wwwww....',
  '...swwwwws...',
  '..rswwwwwsr..',
  '.rrswwwwwsrr.',
  '.rr.swwws.rr.',
  '.....k.k.....',
];
/** A life: a little rocket on the score line. */
const LIFE_ART = ['..r..', '.rwr.', '.www.', 'rwwwr', 'r.k.r'];

/** A blocky 5 by 7 letter for the title ('#' lit), A to Z. */
const LETTERS: Readonly<Record<string, readonly string[]>> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
};

/**
 * The stars, the same ones each time: x, y, their layer (0 far and faint, slow, to 2 near and bright, faster), and
 * whether they twinkle in a colour of their own.
 */
const STARS: readonly (readonly [number, number, number, boolean])[] = Array.from({ length: 90 }, (_, index) => [
  (index * 53 + 17 + ((index * index) % 7)) % FIELD.width, (index * 89 + 31) % FIELD.height, index % 9 === 0 ? 2 : index % 3 === 0 ? 1 : 0, index % 13 === 5,
]);
/** How fast each layer of stars drifts down, in field pixels a second. */
const DRIFT = [3, 6, 11] as const;

const FONT = '"SFMono-Regular", ui-monospace, Menlo, Consolas, monospace';

type Context = CanvasRenderingContext2D;

function sprite(context: Context, rows: readonly string[], x: number, y: number, colours: Readonly<Record<string, string>>) {
  rows.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      const colour = colours[row[dx]];
      if (!colour) continue;
      context.fillStyle = colour;
      context.fillRect(Math.round(x) + dx, Math.round(y) + dy, 1, 1);
    }
  });
}

/** The one starfield over the whole screen: three layers drifting down, the near stars and the coloured ones twinkling. */
function paintStars(context: Context, time: number) {
  context.fillStyle = A.space;
  context.fillRect(0, 0, FIELD.width, FIELD.height);
  for (const [x, y0, layer, coloured] of STARS) {
    const y = Math.floor(y0 + (time / 1000) * DRIFT[layer]) % FIELD.height;
    const beat = Math.floor((time + x * 97) / 400) % 6;
    if (coloured) {
      // a little cross that flares now and then
      context.fillStyle = A.twinkle[x % A.twinkle.length];
      context.fillRect(x, y, 1, 1);
      if (beat === 0) { context.fillRect(x - 1, y, 3, 1); context.fillRect(x, y - 1, 1, 3); }
      continue;
    }
    context.fillStyle = A.stars[layer === 2 ? (beat === 3 ? 2 : 3) : layer + (beat === 1 ? 1 : 0)];
    context.fillRect(x, y, 1, 1);
  }
}

/** A word of the title in big blocky letters, each pixel `size` field pixels, centred across the field from `y` down. */
function paintTitle(context: Context, text: string, y: number, size: number, tones: (typeof A.title)[number]) {
  const letters = [...text.toUpperCase()];
  const width = letters.length * 6 * size - size, x0 = Math.round((FIELD.width - width) / 2);
  for (const glow of [true, false]) letters.forEach((letter, index) => {
    (LETTERS[letter] ?? []).forEach((row, dy) => {
      for (let dx = 0; dx < row.length; dx++) {
        if (row[dx] !== '#') continue;
        const x = x0 + (index * 6 + dx) * size, top = y + dy * size;
        if (glow) { context.fillStyle = tones.glow; context.fillRect(x - 1, top - 1, size + 2, size + 2); continue; }
        context.fillStyle = dy < 2 ? tones.light : tones.body;
        context.fillRect(x, top, size, size);
      }
    });
  });
}

/**
 * A bolt or a spark: a bright core in its colour, a glow either side and a trail behind it (`way`: 1 going down, -1
 * going up), the core flickering from side to side.
 */
function paintShot(context: Context, x: number, y: number, height: number, [core, colour, glow]: readonly [string, string, string], way: 1 | -1, flip: boolean) {
  const trail = way === -1 ? y + height : y - 3;
  context.fillStyle = glow; context.fillRect(x - 1, y, 4, height); context.fillRect(x, trail, 2, 3);
  context.fillStyle = colour; context.fillRect(x, y, 2, height); context.fillRect(x + (flip ? 1 : 0), way === -1 ? trail : trail + 2, 1, 1);
  context.fillStyle = core; context.fillRect(x + (flip ? 1 : 0), y + 1, 1, height - 2);
}

/** A number in [0, 1) that stays the same for (a, b, c): the ragged edge of a blast, which of its chunks go first. */
function noise(a: number, b: number, c: number): number {
  let value = Math.imul(a * 73856093 ^ b * 19349663 ^ c * 83492791, 0x27d4eb2d);
  value ^= value >>> 15;
  return ((Math.imul(value, 0x165667b1) ^ (value >>> 13)) >>> 0) / 4294967296;
}

/**
 * A blast in chunky blocks of 2 pixels: a white and yellow heart swelling into orange and red, its edge ragged, then
 * breaking up into embers that go dark. The rocket's is bigger.
 */
function paintBlast(context: Context, blast: Blast, ship: boolean) {
  const done = 1 - blast.left / blast.ms, big = ship ? 1.6 : 1, last = A.blast.length - 1;
  const cx = Math.round(blast.x + (ship ? SHIP.width : ALIEN.width) / 2), cy = Math.round(blast.y + (ship ? SHIP.height : ALIEN.height) / 2);
  const reach = (4 + Math.min(1, done * 2.5) * 5) * big, cells = Math.ceil(reach / 2) + 1;
  for (let gy = -cells; gy <= cells; gy++) for (let gx = -cells; gx <= cells; gx++) {
    const ragged = noise(gx, gy, blast.x * 31 + blast.y), far = Math.hypot(gx * 2 + 1, gy * 2 + 1) + ragged * 2.5;
    if (far > reach) continue;
    // past its middle, the blast breaks up from the inside out
    if (done > 0.45 && noise(gy, gx, blast.y) < (done - 0.45) * 1.9 + (1 - far / reach) * 0.3) continue;
    const tone = Math.min(last, Math.floor((far / reach) * 2.2 + done * 2.6));
    context.fillStyle = A.blast[tone];
    context.fillRect(cx + gx * 2, cy + gy * 2, 2, 2);
  }
}

/** The words the screen shows (i18n), handed in. */
export interface ScreenWords { title: string; start: string; again: string; paused: string; over: string; best: string; level: (level: number) => string }

interface Line { text: string; colour: string; size: number }

/** Lines of text centred across the field from `y` down (field pixels), drawn in the canvas's own pixels so they stay sharp, glowing in their colour. */
function caption(context: Context, scale: number, lines: readonly Line[], y: number) {
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  let at = y * scale;
  for (const { text, colour, size } of lines) {
    context.font = `700 ${Math.round(size * scale)}px ${FONT}`;
    context.fillStyle = colour;
    context.shadowColor = colour;
    context.shadowBlur = size >= 10 ? 3 * scale : 0;
    context.fillText(text, (FIELD.width / 2) * scale, at);
    at += size * scale * 1.6;
  }
  context.restore();
}

/** The score line: the score, the best so far, a little rocket a life. */
function paintScores(context: Context, game: Game, scale: number, best: number, words: ScreenWords) {
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.textBaseline = 'middle';
  context.font = `700 ${Math.round(7 * scale)}px ${FONT}`;
  context.fillStyle = A.text;
  context.textAlign = 'left';
  context.fillText(String(game.score).padStart(5, '0'), 3 * scale, (SKY_TOP / 2) * scale);
  context.fillStyle = A.textDim;
  context.textAlign = 'center';
  context.fillText(`${words.best} ${String(Math.max(best, game.score)).padStart(5, '0')}`, (FIELD.width / 2) * scale, (SKY_TOP / 2) * scale);
  context.restore();
  for (let life = 0; life < game.lives; life++) sprite(context, LIFE_ART, FIELD.width - 8 - life * 7, 3, A.ship);
}

/** The whole screen for `game` at `time` (ms, for what drifts, twinkles and blinks), with the best score so far. */
export function paintGame(context: Context, game: Game, scale: number, best: number, words: ScreenWords, time: number) {
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.imageSmoothingEnabled = false;
  paintStars(context, time);
  // the asteroid chunks, as blasted as they are: lit on their top left, in shade on their bottom right, a crater or two
  const columns = ROCK_SHAPE[0].length, rows = ROCK_SHAPE.length;
  for (const rock of game.rocks) rock.cells.forEach((cell, index) => {
    if (!cell) return;
    const column = index % columns, row = Math.floor(index / columns), light = column + row;
    context.fillStyle = (row * 7 + column * 3) % 11 === 4 ? A.rock[3] : light < 5 ? A.rock[0] : light > columns + rows - 6 ? A.rock[2] : A.rock[1];
    context.fillRect(rock.x + column * ROCK_CELL, rock.y + row * ROCK_CELL, ROCK_CELL, ROCK_CELL);
  });
  const ready = game.phase === 'ready';
  if (!ready) for (const alien of game.aliens) if (alien.alive) {
    const { x, y } = alienAt(game, alien);
    sprite(context, ALIENS[alien.kind][game.swarm.beat], x, y, A[alien.kind]);
  }
  for (const blast of game.blasts) paintBlast(context, blast, blast.y >= SHIP.y);
  const flip = Math.floor(time / 80) % 2 === 0;
  if (game.bolt) paintShot(context, Math.round(game.bolt.x), Math.round(game.bolt.y), BOLT.height, A.bolt, -1, flip);
  for (const spark of game.sparks) paintShot(context, Math.round(spark.x), Math.round(spark.y), SPARK.height, A.spark, 1, !flip);
  // the rocket and its flame, blinking while it is out
  const out = game.ship.out > 0;
  if (ready || (game.lives > 0 && (!out || Math.floor(game.ship.out / 120) % 2 === 0))) {
    const x = Math.round(game.ship.x);
    sprite(context, SHIP_ART, x, SHIP.y, A.ship);
    const flicker = Math.floor(time / 70) % 3;
    context.fillStyle = A.flame[2]; context.fillRect(x + 5, SHIP.y + SHIP.height, 3, 1 + (flicker === 1 ? 1 : 0));
    context.fillStyle = A.flame[1]; context.fillRect(x + 6, SHIP.y + SHIP.height, 1, 2 + (flicker === 2 ? 1 : 0));
    context.fillStyle = A.flame[0]; context.fillRect(x + 6, SHIP.y + SHIP.height, 1, 1);
  }
  paintScores(context, game, scale, best, words);
  // between two games, between two fleets, paused
  const veil = () => { context.fillStyle = A.veil; context.fillRect(0, SKY_TOP, FIELD.width, FIELD.height - SKY_TOP); };
  if (ready) {
    const [first, ...rest] = words.title.split(' ');
    paintTitle(context, first, 34, 3, A.title[0]);
    if (rest.length) paintTitle(context, rest.join(' '), 62, 3, A.title[1]);
    const beat = Math.floor(time / 500) % 2;
    for (const [index, kind] of (['cyclops', 'jelly', 'drone'] as const).entries()) {
      sprite(context, ALIENS[kind][beat], FIELD.width / 2 - 30 + index * 24, 100 + (index % 2 ? beat : 1 - beat), A[kind]);
    }
    if (Math.floor(time / 650) % 3 !== 2) caption(context, scale, [{ text: words.start, colour: A.text, size: 7 }], 128);
  } else if (game.phase === 'over') {
    veil();
    caption(context, scale, [{ text: words.over, colour: A.over, size: 12 }, { text: words.again, colour: A.text, size: 7 }], 86);
  } else if (game.paused) {
    veil();
    caption(context, scale, [{ text: words.paused, colour: A.text, size: 11 }], 96);
  } else if (game.phase === 'cleared') {
    caption(context, scale, [{ text: words.level(game.level + 1), colour: A.level, size: 11 }], 96);
  }
}
