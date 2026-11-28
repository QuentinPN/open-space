// Petal Patrol drawn (src/arcade/game.ts for the game itself): on a canvas `scale` device pixels a field pixel, the
// garden at dusk, the swarm of bugs beating its wings at each step, the mushrooms as eaten as they are, the pot, the
// drops and the seeds, the puffs, the score line, and what the screen says between two games. Pixel art drawn in code,
// in the arcade's own colours (src/design/arcade-palette.ts).
import { ARCADE_PALETTE as A } from '../design/arcade-palette.ts';
import { BUG, DROP, FIELD, POT, SEED, SHROOM_CELL, SHROOM_SHAPE, SKY_TOP, bugAt, type BugKind, type Game } from './game.ts';

/** Half of each bug, left side, for each of its two wing beats (the right side is the left one mirrored); a dot is nothing. */
const HALVES: Readonly<Record<BugKind, readonly [readonly string[], readonly string[]]>> = {
  moth: [
    ['..b...', '...b..', 'aa..bb', 'aaaabc', 'aaaabb', '.aaabb', '..aa.b', '..a..b', '.....b'],
    ['...b..', '....b.', '....bb', '.aaabc', 'aaaabb', 'aaaabb', 'aaa..b', '.aa..b', '.....b'],
  ],
  ladybird: [
    ['..b...', '...bbb', '...bcb', '.aaaab', 'aabaab', 'aaaaab', 'abaaab', '.aaaab', 'b.b...'],
    ['..b...', '...bbb', '...bcb', '.aaaab', 'aabaab', 'aaaaab', 'abaaab', '.aaaab', '.b.b..'],
  ],
  beetle: [
    ['.b....', '..b.bb', '....bb', 'b.acab', '.aaaab', 'baacab', '.aaaab', 'b.aaab', '...bb.'],
    ['.b....', '..b.bb', '....bb', '.bacab', 'baaaab', '.aacab', 'baaaab', '.baaab', '..b...'],
  ],
};
const mirrored = (half: readonly string[]) => half.map((row) => row + [...row].reverse().join(''));
const BUGS: Readonly<Record<BugKind, readonly (readonly string[])[]>> = {
  moth: HALVES.moth.map(mirrored), ladybird: HALVES.ladybird.map(mirrored), beetle: HALVES.beetle.map(mirrored),
};

const POT_ART = ['......g......', '....g.g.g....', '.....ggg.....', '..rrrrrrrrr..', '..rpppppppr..', '...ppppppp...', '...ppppppp...', '....ppppp....'];

/** A few stars over the garden, the same ones each time: x, y, how bright (0 to 2). */
const STARS: readonly (readonly [number, number, number])[] = Array.from({ length: 34 }, (_, index) => [
  (index * 53 + 17) % FIELD.width, SKY_TOP + 4 + ((index * 37) % 120), index % 7 === 0 ? 2 : index % 3,
]);

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

/** The words the screen shows (i18n), handed in. */
export interface ScreenWords { title: string; start: string; again: string; paused: string; over: string; best: string; level: (level: number) => string }

interface Line { text: string; colour: string; size: number }

/** Lines of text centred across the field from `y` down (field pixels), drawn in the canvas's own pixels so they stay sharp. */
function caption(context: Context, scale: number, lines: readonly Line[], y: number) {
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  let at = y * scale;
  for (const { text, colour, size } of lines) {
    context.font = `700 ${Math.round(size * scale)}px ${FONT}`;
    context.fillStyle = colour;
    context.fillText(text, (FIELD.width / 2) * scale, at);
    at += size * scale * 1.6;
  }
  context.restore();
}

/** The score line: the score, the best so far, a little pot a life. */
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
  for (let life = 0; life < game.lives; life++) {
    const x = FIELD.width - 8 - life * 7;
    context.fillStyle = A.pot.r; context.fillRect(x, 5, 5, 1);
    context.fillStyle = A.pot.p; context.fillRect(x + 1, 6, 3, 3);
    context.fillStyle = A.pot.g; context.fillRect(x + 2, 3, 1, 2);
  }
}

/** The whole screen for `game` at `time` (ms, for what twinkles and blinks), with the best score so far. */
export function paintGame(context: Context, game: Game, scale: number, best: number, words: ScreenWords, time: number) {
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.imageSmoothingEnabled = false;
  // the sky, the stars, the grass
  context.fillStyle = A.sky;
  context.fillRect(0, 0, FIELD.width, FIELD.height);
  context.fillStyle = A.skyLow;
  context.fillRect(0, Math.round(FIELD.height * 0.62), FIELD.width, FIELD.height);
  for (const [x, y, bright] of STARS) {
    context.fillStyle = A.stars[bright === 2 && Math.floor((time + x * 40) / 700) % 3 === 0 ? 1 : bright];
    context.fillRect(x, y, 1, 1);
  }
  const ground = POT.y + POT.height;
  context.fillStyle = A.grassDark;
  context.fillRect(0, ground, FIELD.width, FIELD.height - ground);
  context.fillStyle = A.grass;
  for (let x = 0; x < FIELD.width; x += 3) context.fillRect(x, ground - (x % 2), 2, 2);
  // the mushrooms, as eaten as they are: a pink cap with pale dots over a cream stem
  const columns = SHROOM_SHAPE[0].length, capRows = 4;
  for (const shroom of game.shrooms) shroom.cells.forEach((cell, index) => {
    if (!cell) return;
    const column = index % columns, row = Math.floor(index / columns);
    context.fillStyle = row >= capRows ? A.stem : row > 0 && (row * 3 + column) % 5 === 1 ? A.capDot : A.cap;
    context.fillRect(shroom.x + column * SHROOM_CELL, shroom.y + row * SHROOM_CELL, SHROOM_CELL, SHROOM_CELL);
  });
  const ready = game.phase === 'ready';
  if (!ready) for (const bug of game.bugs) if (bug.alive) {
    const { x, y } = bugAt(game, bug);
    sprite(context, BUGS[bug.kind][game.swarm.beat], x, y, A[bug.kind]);
  }
  for (const puff of game.puffs) {
    context.fillStyle = Math.floor(puff.left / 60) % 2 ? A.puff : A.puffDim;
    const cx = Math.round(puff.x + BUG.width / 2), cy = Math.round(puff.y + BUG.height / 2);
    for (const [dx, dy] of [[-5, 0], [4, 0], [0, -4], [0, 3], [-3, -3], [3, -3], [-3, 3], [3, 3]]) context.fillRect(cx + dx, cy + dy, 1, 1);
  }
  if (game.drop) {
    const x = Math.round(game.drop.x), y = Math.round(game.drop.y);
    context.fillStyle = A.drop; context.fillRect(x, y, DROP.width, DROP.height);
    context.fillStyle = A.dropLight; context.fillRect(x, y, 1, 1);
  }
  for (const seed of game.seeds) {
    const x = Math.round(seed.x), y = Math.round(seed.y);
    context.fillStyle = A.seed; context.fillRect(x, y, SEED.width, SEED.height - 1);
    context.fillStyle = A.seedDark; context.fillRect(x, y + SEED.height - 1, SEED.width, 1);
  }
  // the pot, blinking while it is out
  const out = game.pot.out > 0;
  if (ready || (game.lives > 0 && (!out || Math.floor(game.pot.out / 120) % 2 === 0))) sprite(context, POT_ART, game.pot.x, POT.y, A.pot);
  paintScores(context, game, scale, best, words);
  // between two games, between two swarms, paused
  const veil = () => { context.fillStyle = A.veil; context.fillRect(0, SKY_TOP, FIELD.width, FIELD.height - SKY_TOP); };
  if (ready) {
    for (const [index, kind] of (['moth', 'ladybird', 'beetle'] as const).entries()) sprite(context, BUGS[kind][Math.floor(time / 500) % 2], FIELD.width / 2 - 30 + index * 24, 98, A[kind]);
    caption(context, scale, [{ text: words.title.toUpperCase(), colour: A.accent, size: 14 }], 70);
    if (Math.floor(time / 650) % 3 !== 2) caption(context, scale, [{ text: words.start, colour: A.text, size: 7 }], 128);
  } else if (game.phase === 'over') {
    veil();
    caption(context, scale, [{ text: words.over, colour: A.accent, size: 12 }, { text: words.again, colour: A.text, size: 7 }], 86);
  } else if (game.paused) {
    veil();
    caption(context, scale, [{ text: words.paused, colour: A.text, size: 11 }], 96);
  } else if (game.phase === 'cleared') {
    caption(context, scale, [{ text: words.level(game.level + 1), colour: A.accent, size: 11 }], 96);
  }
}
