// The HD people's hair (src/room/chibi-hd.ts): every hairstyle of shared/look.ts, the everyday ones and the wardrobe's,
// from the front (three-quarters, the face turned right) and from behind. Hair is a cap over the head ball, a fringe
// cut into the face column by column, and what each style adds: locks, tails, a bun, spikes, a crest. What stands up
// from the head (a bun, a crest, spikes) is left out under a hat that covers the head, which sits on it instead.
import { PEOPLE_INK as INK, WARDROBE_COLORS as W } from '../../design/people-palette.ts';
import type { HairStyle, Look } from '../../../shared/look.ts';
import { HEAD, inFace, inHead } from './face.ts';
import { ball, hdTones, mixHex, type Art, type Tones } from './kit.ts';

/** What the hair painters need. `hatted`: a hat covers the head, so nothing stands up from it. */
export interface HairPaint { art: Art; look: Look; hair: Tones; skin: Tones; front: boolean; hatted: boolean }

interface Style {
  /** what covers the head: hair, close-cropped fuzz, shaved stubble, or nothing */
  cap: 'hair' | 'fuzz' | 'shaved' | 'none';
  /** how much bigger the cap is than the head, and how much higher */
  grow?: number;
  lift?: number;
  /** the fringe: for each column 6 to 20, how many rows below row 8 it comes down the face */
  tips?: readonly number[];
  /** the fringe comes down over an eye */
  overEyes?: boolean;
  /** the ear shows from the front (`ear`) and from behind (`backEar`) */
  ear: boolean;
  backEar: boolean;
  /** behind the body (painted first): tails hanging, the back of a mullet */
  behind?: (h: HairPaint) => void;
  /** over the face and the cap, from the front */
  front?: (h: HairPaint) => void;
  /** over the cap, from behind */
  back?: (h: HairPaint) => void;
  /** over the back, between the arms, from behind (after the top) */
  overBack?: (h: HairPaint) => void;
  /** what stands up from the head, both ways, unless a hat covers it */
  crest?: (h: HairPaint) => void;
}

/** A lock of hair `width` columns wide from `from` to `to`, lit on its left column, shaded on its right one. */
function lock(h: HairPaint, x: number, from: number, to: number, width = 3, wave: (y: number) => number = () => 0) {
  for (let y = from; y <= to; y++) for (let column = 0; column < width; column++) {
    h.art.set(x + column + wave(y), y, column === 0 ? h.hair.light : column === width - 1 ? h.hair.shade : h.hair.base);
  }
  h.art.set(x + Math.floor(width / 2) + wave(to + 1), to + 1, h.hair.shade);
}

/** A plait: strands crossing row by row in chevrons, `width` columns wide, tied at the end. */
function plait(h: HairPaint, x: number, from: number, to: number, width: number, tie: string | null = INK.band) {
  for (let y = from; y <= to; y++) for (let column = 0; column < width; column++) {
    const half = column < width / 2 ? 0 : 1;
    h.art.set(x + column, y, (y + half) % 2 ? (column === 0 ? h.hair.light : h.hair.base) : column === width - 1 ? h.hair.dark : h.hair.shade);
  }
  if (tie) h.art.rect(x, to + 1, width, 1, tie);
  if (tie) h.art.rect(x + Math.floor((width - 1) / 2), to + 2, Math.min(2, width), 1, h.hair.base);
}

/** A spike from its base (width 3) to its tip, lit on the left. */
function spike(h: HairPaint, baseX: number, baseY: number, tipX: number, tipY: number) {
  const steps = Math.max(1, Math.round(Math.hypot(tipX - baseX, tipY - baseY)));
  for (let t = 0; t <= steps; t++) {
    const x = baseX + ((tipX - baseX) * t) / steps, y = baseY + ((tipY - baseY) * t) / steps;
    const half = 1.6 * (1 - t / (steps + 1));
    for (let dx = -Math.ceil(half); dx <= Math.ceil(half); dx++) if (Math.abs(dx) <= half + 0.2) h.art.set(Math.round(x + dx), Math.round(y), dx < 0 ? h.hair.light : dx > 0 ? h.hair.shade : h.hair.base);
  }
}

/** A few lit pixels: the shine of hair. */
const shine = (h: HairPaint, points: readonly (readonly [number, number])[]) => h.art.points(points, h.hair.light, [h.hair.base, h.hair.shade]);

/** The strands of hair seen from behind: darker lines down the head, two lit streaks on top. */
function strands(h: HairPaint, to = 18) {
  for (const x of [6, 9, 13, 17]) for (let y = 7 + (x % 3); y < to; y++) h.art.set(x, y, h.hair.shade, [h.hair.base]);
  for (const x of [7, 10]) for (let y = 3; y < 6; y++) h.art.set(x, y, h.hair.light, [h.hair.base]);
}

/** The nape under short hair, seen from behind: a ragged edge. */
const nape = (h: HairPaint) => h.art.pattern(7, 18, ['o.o.oo.o.o'], { o: h.hair.shade });

/** Shaved hair: stubble, the hair's colour halfway to the skin, dotted. */
export const stubbleOf = (look: Look) => hdTones(mixHex(look.skin, look.hairColor, 0.35));
export const fuzzOf = (look: Look) => hdTones(mixHex(look.skin, look.hairColor, 0.62));

/** Long hair down the back, between the arms, its ends uneven. */
function longBack(h: HairPaint, to = 27, wave: (y: number) => number = () => 0) {
  for (let y = 12; y <= to; y++) {
    const [from, end] = y < 19 ? [3, 20] : [7, 16];
    for (let x = from + wave(y); x <= end + wave(y); x++) {
      if (y >= to - 1 && (x % 3 === 0) === (y === to)) continue;
      if (y < 19 && inHead(x, y)) continue;
      h.art.set(x, y, x <= from + wave(y) ? h.hair.light : (x - 1) % 4 === 0 ? h.hair.shade : h.hair.base);
    }
  }
}

/** The locks of long hair in front of the shoulders, from the front. */
function longFront(h: HairPaint, wave: (y: number) => number = () => 0, to = 27) {
  for (let y = 12; y <= to; y++) { const x0 = y < to - 3 ? 2 : 3, x1 = y < to - 1 ? 7 : 6; for (let x = x0; x < x1; x++) h.art.set(x + wave(y), y, x === x0 ? h.hair.light : x === x1 - 1 ? h.hair.shade : h.hair.base); }
  for (let y = 14; y <= to - 2; y++) { const x0 = 19, x1 = y < to - 5 ? 23 : 22; for (let x = x0; x < x1; x++) h.art.set(x - wave(y), y, x === x1 - 1 ? h.hair.shade : x === x0 ? h.hair.base : h.hair.base); }
  h.art.points([[3, to + 1], [5, to], [20, to - 1]], h.hair.shade);
}

/** The columns of the eyes and their corners, which a fringe stays above. */
const EYE_COLUMNS: ReadonlySet<number> = new Set([9, 10, 11, 12, 15, 16, 17, 18]);

const wavy = (y: number) => [0, 0, 1, 1, 0, 0, -1, -1][(y + 16) % 8];

const STYLES: Readonly<Record<HairStyle, Style>> = {
  none: { cap: 'none', ear: true, backEar: true, front: (h) => h.art.points([[6, 4], [7, 3], [8, 3]], h.skin.light), back: (h) => h.art.points([[7, 3], [8, 3], [7, 4]], h.skin.light) },
  buzz: { cap: 'fuzz', tips: [3, 2, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2], ear: true, backEar: true },
  short: {
    cap: 'hair', tips: [6, 5, 2, 1, 2, 3, 1, 0, 1, 2, 3, 1, 0, 2, 5], ear: true, backEar: true,
    front: (h) => { shine(h, [[9, 8], [10, 8], [11, 7], [15, 7], [16, 8]]); h.art.points([[13, 0], [14, -1]], h.hair.base); },
    back: (h) => { strands(h); nape(h); h.art.points([[11, 0], [12, -1]], h.hair.base); },
  },
  sidePart: {
    cap: 'hair', tips: [7, 6, 5, 4, 3, 3, 2, 1, 1, 0, 0, 0, 0, 1, 3], ear: true, backEar: true,
    front: (h) => { h.art.points([[16, 1], [16, 2], [15, 3], [15, 4], [15, 5]], h.hair.dark); shine(h, [[9, 7], [10, 6], [11, 6], [12, 5]]); },
    back: (h) => { strands(h); nape(h); h.art.points([[16, 1], [16, 2], [17, 3]], h.hair.dark); },
  },
  sweep: {
    cap: 'hair', overEyes: true, tips: [6, 4, 1, 0, 0, 1, 1, 2, 3, 4, 4, 5, 5, 5, 5], ear: true, backEar: true,
    front: (h) => { shine(h, [[11, 6], [12, 7], [13, 7], [14, 8], [15, 9], [16, 10]]); for (let x = 13; x <= 20; x++) h.art.set(x, 8 + Math.floor((x - 13) * 0.6), h.hair.shade, [h.hair.base]); },
    back: (h) => { strands(h); nape(h); },
  },
  curly: {
    cap: 'hair', grow: 0.7, tips: [6, 4, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 4, 6], ear: true, backEar: true,
    front: (h) => curls(h), back: (h) => { curls(h); h.art.points([[6, 9], [10, 12], [14, 9], [17, 13], [8, 15], [13, 16]], h.hair.light, [h.hair.base, h.hair.shade]); },
  },
  quiff: {
    cap: 'hair', tips: [5, 3, 1, 0, 0, -1, -1, -1, -1, -1, 0, 0, 0, 1, 3], ear: true, backEar: true,
    crest: (h) => {
      h.art.turnedEllipse(h.front ? 14 : 11, -0.5, 7.5, 3.2, -0.25, h.hair.base);
      h.art.turnedEllipse(h.front ? 13 : 10, -1, 5.5, 1.6, -0.25, h.hair.light);
      h.art.ellipse(h.front ? 20 : 17, -2.5, 1.8, 1.4, h.hair.base);
      h.art.points(h.front ? [[19, 1], [20, 0], [21, -1]] : [[15, 1], [16, 0]], h.hair.shade);
    },
    front: (h) => shine(h, [[10, 6], [11, 6]]), back: (h) => { strands(h); nape(h); },
  },
  spiky: {
    cap: 'hair', tips: [6, 4, 1, 3, 0, 3, 0, 3, 0, 3, 0, 2, 0, 3, 5], ear: true, backEar: true,
    crest: (h) => { for (const [bx, by, tx, ty] of [[4, 4, 1, 0], [7, 2, 5, -3], [11, 1, 10, -5], [15, 1, 16, -5], [19, 2, 21, -3], [21, 5, 24, 2]] as const) spike(h, bx, by, tx, ty); },
    front: (h) => shine(h, [[9, 8], [11, 7], [15, 7]]), back: (h) => { strands(h); nape(h); },
  },
  mohawk: {
    cap: 'shaved', ear: true, backEar: true,
    crest: (h) => {
      const x = h.front ? 10 : 9;
      for (let y = -5; y <= 11; y++) {
        if (y > 2 && !inHead(x + 2, y)) continue;
        const top = y < 0 ? 1 : 0;
        h.art.set(x + top, y, h.hair.light); h.art.rect(x + 1 + top, y, 3 - top * 2, 1, h.hair.base); h.art.set(x + 4 - top, y, h.hair.shade);
      }
      h.art.points([[x + 1, -6], [x + 2, -6], [x + 3, -7]], h.hair.base);
    },
  },
  afro: {
    cap: 'hair', grow: 2.4, lift: 2, tips: [4, 2, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 1, 3], ear: true, backEar: true,
    front: (h) => { bumps(h, 2.6, 2); h.art.points([[5, 1], [8, -2], [9, -2], [4, 3]], h.hair.light, [h.hair.base, h.hair.shade]); },
    back: (h) => { bumps(h, 2.6, 2); h.art.points([[6, 0], [9, -2], [12, 3], [6, 9]], h.hair.light, [h.hair.base, h.hair.shade]); },
  },
  pigtails: {
    cap: 'hair', tips: [6, 5, 3, 2, 3, 2, 2, 1, 2, 3, 2, 2, 1, 3, 5], ear: true, backEar: true,
    behind: (h) => { for (const x of [-0.6, 24.6]) ball(h.art, x, 11, 3.1, 4.6, h.hair); },
    front: (h) => { h.art.points([[1, 5], [2, 5], [2, 6], [22, 5], [23, 5], [22, 6]], INK.band); shine(h, [[9, 8], [10, 8], [15, 7], [16, 7]]); },
    back: (h) => { strands(h); h.art.points([[1, 5], [2, 5], [2, 6], [22, 5], [23, 5], [22, 6]], INK.band); },
  },
  bob: {
    cap: 'hair', grow: 0.4, tips: [7, 6, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 6, 9], ear: false, backEar: false,
    front: (h) => { lock(h, 1, 10, 20, 5); lock(h, 20, 11, 20, 3); h.art.rect(2, 21, 4, 1, h.hair.shade); shine(h, [[9, 8], [10, 8], [11, 8], [16, 8], [17, 8]]); },
    back: (h) => { for (let y = 11; y <= 21; y++) for (let x = 1; x <= 22; x++) if (!inHead(x, y) || y > 17) h.art.set(x, y, y === 21 ? h.hair.shade : x < 4 ? h.hair.light : x > 19 ? h.hair.shade : h.hair.base); strands(h, 21); },
  },
  ponytail: {
    cap: 'hair', tips: [6, 4, 2, 1, 1, 2, 1, 0, 1, 1, 2, 1, 0, 2, 5], ear: true, backEar: true,
    behind: (h) => { if (!h.front) return; lock(h, -2, 9, 23, 3, (y) => (y > 16 ? 1 : 0)); h.art.rect(0, 8, 2, 2, INK.band); },
    front: (h) => shine(h, [[9, 8], [10, 8], [11, 7], [15, 7], [16, 8]]),
    back: (h) => { strands(h); h.art.rect(10, 12, 4, 2, INK.band); },
    overBack: (h) => { lock(h, 10, 14, 26, 4); h.art.points([[11, 27], [12, 27]], h.hair.shade); },
  },
  bun: {
    cap: 'hair', tips: [6, 4, 2, 1, 1, 2, 1, 0, 1, 1, 2, 1, 0, 2, 5], ear: true, backEar: true,
    crest: (h) => { ball(h.art, 12, -0.6, 4.6, 3.9, h.hair); h.art.rect(9, 2, 7, 1, h.hair.dark); h.art.points([[10, 1], [14, 1]], INK.band); },
    front: (h) => shine(h, [[9, 8], [10, 8], [11, 7], [15, 7], [16, 8]]), back: (h) => { strands(h); nape(h); },
  },
  braids: {
    cap: 'hair', tips: [6, 5, 3, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 4, 6], ear: false, backEar: false,
    front: (h) => { plait(h, 2, 13, 27, 3); plait(h, 20, 15, 26, 3); shine(h, [[9, 8], [10, 8], [15, 7], [16, 7]]); },
    back: (h) => strands(h), overBack: (h) => { plait(h, 7, 15, 27, 3); plait(h, 14, 15, 27, 3); },
  },
  long: {
    cap: 'hair', grow: 0.2, tips: [7, 6, 4, 3, 2, 1, 0, -1, 0, 1, 2, 3, 4, 6, 8], ear: false, backEar: false,
    front: (h) => { longFront(h); shine(h, [[8, 9], [9, 8], [10, 7], [16, 7], [17, 8]]); h.art.points([[13, 1], [13, 2], [13, 3]], h.hair.dark); },
    back: (h) => strands(h, 19), overBack: (h) => longBack(h),
  },
  bangs: {
    cap: 'hair', grow: 0.2, tips: [8, 7, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 7, 9], ear: false, backEar: false,
    front: (h) => { longFront(h); shine(h, [[9, 9], [10, 9], [11, 9], [16, 9], [17, 9]]); },
    back: (h) => strands(h, 19), overBack: (h) => longBack(h),
  },
  topknot: {
    cap: 'hair', tips: [5, 3, 1, 0, -1, -1, -1, -1, -1, -1, -1, 0, 0, 1, 3], ear: true, backEar: true,
    crest: (h) => { ball(h.art, 12, -1.6, 2.8, 2.5, h.hair); h.art.rect(10, 0, 4, 1, INK.band); ball(h.art, 12.4, -4.6, 1.7, 1.7, h.hair); h.art.set(12, -6, h.hair.light); },
    front: (h) => { for (const x of [9, 12, 15, 18]) for (let y = 2; y <= 6; y++) h.art.set(x - Math.floor((y - 2) / 3), y, h.hair.shade, [h.hair.base, h.hair.light]); },
    back: (h) => { strands(h); nape(h); },
  },
  dreadlocks: {
    cap: 'hair', tips: [6, 5, 3, 4, 2, 4, 2, 4, 2, 4, 2, 4, 3, 5, 7], ear: false, backEar: false,
    front: (h) => { partings(h); for (const [x, to] of [[0, 22], [3, 24], [20, 22]] as const) rope(h, x, 10, to); },
    back: (h) => { partings(h); for (const [x, to] of [[1, 20], [4, 23], [19, 23], [22, 20]] as const) rope(h, x, 9, to); },
    overBack: (h) => { for (const [x, to] of [[7, 25], [10, 26], [13, 25]] as const) rope(h, x, 14, to); },
  },
  mullet: {
    cap: 'hair', tips: [6, 4, 1, 2, 0, 2, 0, 2, 0, 2, 0, 1, 0, 2, 4], ear: true, backEar: true,
    behind: (h) => { if (h.front) lock(h, -1, 12, 24, 5, (y) => (y > 20 ? 1 : 0)); },
    crest: (h) => { for (const [bx, by, tx, ty] of [[7, 2, 6, -2], [12, 1, 12, -3], [17, 2, 18, -2]] as const) spike(h, bx, by, tx, ty); },
    back: (h) => strands(h, 19), overBack: (h) => { for (let y = 17; y <= 25; y++) for (let x = 7; x <= 16; x++) if (!(y === 25 && x % 2)) h.art.set(x, y, x === 7 ? h.hair.light : x > 14 ? h.hair.shade : (x - 1) % 4 === 0 ? h.hair.shade : h.hair.base); },
  },
  punkSpikes: {
    cap: 'shaved', ear: true, backEar: true,
    crest: (h) => {
      for (let y = -1; y <= (h.front ? 6 : 14); y++) if (inHead(11, y) || y < 2) { h.art.set(10, y, h.hair.light); h.art.rect(11, y, 2, 1, h.hair.base); h.art.set(13, y, h.hair.shade); }
      for (const [bx, by, tx, ty] of [[8, 1, 3, -5], [10, 0, 7, -8], [12, 0, 12, -10], [14, 0, 17, -8], [16, 1, 21, -5]] as const) spike(h, bx, by, tx, ty);
    },
  },
  wavy: {
    cap: 'hair', grow: 0.3, tips: [7, 6, 4, 3, 2, 1, 0, -1, 0, 1, 2, 3, 4, 6, 8], ear: false, backEar: false,
    front: (h) => { longFront(h, wavy, 28); shine(h, [[8, 9], [9, 8], [10, 7], [16, 7], [17, 8]]); h.art.points([[13, 1], [13, 2], [13, 3]], h.hair.dark); },
    back: (h) => strands(h, 19), overBack: (h) => { longBack(h, 28, wavy); for (let y = 15; y <= 26; y++) h.art.set(11 + wavy(y), y, h.hair.dark); },
  },
  coils: {
    cap: 'hair', grow: 0.9, tips: [5, 3, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 3, 5], ear: true, backEar: true,
    front: (h) => coilTexture(h), back: (h) => coilTexture(h),
  },
  undercut: {
    cap: 'shaved', overEyes: true, ear: true, backEar: true, tips: [2, 1, 0, 0, 1, 2, 3, 4, 5, 5, 4, 3, 1, 0, 0],
    front: (h) => { ball(h.art, 13, 3.2, 9.8, 5.4, h.hair, [stubbleOf(h.look).base, stubbleOf(h.look).shade, stubbleOf(h.look).light]); shine(h, [[12, 5], [13, 6], [14, 7], [15, 8]]); for (let x = 14; x <= 18; x++) h.art.set(x, 8 + Math.floor((x - 14) * 0.8), h.hair.shade, [h.hair.base]); },
    back: (h) => { for (let y = -1; y <= 8; y++) for (let x = 1; x <= 23; x++) if (inHead(x, y + 1.5) && inHead(x, y)) h.art.set(x, y, x < 6 ? h.hair.light : x > 18 ? h.hair.shade : h.hair.base); h.art.pattern(4, 9, ['o.o.o.o.o.o.o.o.o'], { o: h.hair.shade }); },
  },
  geisha: {
    cap: 'hair', grow: 0.3, tips: [5, 3, 1, 0, -1, -1, -1, -1, -1, -1, -1, 0, 1, 3, 5], ear: false, backEar: false,
    crest: (h) => {
      ball(h.art, 12, -3.6, 5.8, 4, h.hair); h.art.rect(7, 0, 11, 1, INK.band); h.art.points([[8, -1], [16, -1]], INK.band);
      for (let i = 0; i < 6; i++) h.art.set(15 + i, -3 - Math.floor(i / 2), W.gold);
      h.art.points([[20, -7], [21, -6], [19, -6]], W.petalRed); h.art.set(20, -6, W.petalPink);
      for (let i = 0; i < 4; i++) h.art.set(6 - i, -2 - i, W.gold);
    },
    front: (h) => { ball(h.art, 1.6, 10.5, 3, 4.2, h.hair); h.art.turnedEllipse(13, 2.8, 8.4, 2.4, -0.05, h.hair.base, [h.hair.base, h.hair.shade, h.hair.light]); shine(h, [[9, 3], [10, 2], [11, 2], [12, 2], [17, 4]]); },
    back: (h) => { ball(h.art, 1.6, 10.5, 3, 4.2, h.hair); ball(h.art, 22.4, 10.5, 3, 4.2, h.hair); strands(h, 19); },
  },
  twinTails: {
    cap: 'hair', tips: [6, 5, 2, 4, 1, 3, 1, 4, 1, 3, 1, 4, 2, 4, 6], ear: true, backEar: true,
    behind: (h) => { for (const [x, lean] of [[-3, -1], [24, 1]] as const) for (let y = 4; y <= 30; y++) { const sway = Math.round(Math.sin(y / 4) * 0.8) + (y > 12 ? lean : 0); const width = y > 26 ? 2 : 3; for (let c = 0; c < width; c++) h.art.set(x + sway + c, y, c === 0 ? h.hair.light : c === width - 1 ? h.hair.shade : y % 6 === 0 ? h.hair.shade : h.hair.base); } },
    front: (h) => { h.art.rect(0, 3, 2, 2, W.neonPink); h.art.rect(22, 3, 2, 2, W.neonPink); shine(h, [[9, 8], [10, 8], [15, 7], [16, 7]]); },
    back: (h) => { strands(h); h.art.rect(0, 3, 2, 2, W.neonPink); h.art.rect(22, 3, 2, 2, W.neonPink); },
  },
  vikingBraids: {
    cap: 'shaved', ear: true, backEar: true,
    crest: (h) => {
      if (h.front) { plait(h, 10, -1, 6, 4, null); return; }
      plait(h, 10, -1, 14, 4, null); h.art.rect(10, 15, 4, 1, W.steel);
    },
    behind: (h) => { if (!h.front) return; plait(h, -1, 9, 22, 2); h.art.rect(-1, 13, 2, 1, W.steel); h.art.rect(-1, 19, 2, 1, W.steel); },
    overBack: (h) => { plait(h, 11, 16, 27, 2); h.art.rect(11, 21, 2, 1, W.steel); },
  },
  emo: {
    cap: 'hair', overEyes: true, tips: [4, 3, 1, 0, 0, 1, 2, 3, 5, 7, 8, 8, 8, 7, 6], ear: true, backEar: true,
    front: (h) => { shine(h, [[11, 6], [12, 7], [13, 8], [14, 9], [15, 10]]); h.art.points([[16, 17], [18, 17], [20, 15]], h.hair.shade); for (let y = 9; y <= 16; y++) h.art.set(14 + Math.floor((y - 9) * 0.5), y, h.hair.shade, [h.hair.base]); },
    back: (h) => { strands(h); h.art.pattern(5, 18, ['o..o..o..o..o'], { o: h.hair.base }); h.art.pattern(6, 19, ['o..o..o..o'], { o: h.hair.shade }); },
  },
  tonsure: {
    cap: 'hair', tips: [3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3], ear: true, backEar: true,
    front: (h) => { ball(h.art, 13, 3.6, 7.6, 4.2, h.skin, [h.hair.base, h.hair.light, h.hair.shade]); h.art.points([[10, 2], [11, 2]], h.skin.light); },
    back: (h) => { ball(h.art, 12, 3.8, 7.8, 4.4, h.skin, [h.hair.base, h.hair.light, h.hair.shade]); strands(h); },
  },
};

/** Little bumps round the edge of big hair. */
function bumps(h: HairPaint, radius: number, lift: number) {
  for (let angle = Math.PI * 0.85; angle <= Math.PI * 2.15; angle += Math.PI / 6) {
    const x = HEAD.cx + Math.cos(angle) * (HEAD.rx + 1.6), y = HEAD.cy - lift + Math.sin(angle) * (HEAD.ry + 1.4);
    if (y > 13) continue;
    ball(h.art, x, y, radius, radius, h.hair, undefined, false);
  }
}

/** Curls: bumps round the edge, a curl here and there lit. */
function curls(h: HairPaint) {
  bumps(h, 2.1, 0);
  h.art.points([[5, 4], [9, 1], [10, 1], [15, 1], [19, 4], [3, 9]], h.hair.light, [h.hair.base, h.hair.shade]);
  h.art.points([[7, 5], [12, 3], [17, 6]], h.hair.shade, [h.hair.base]);
}

/** Tight coils: the cap dotted with little lit and dark curls in staggered rows, its edge bumpy. */
function coilTexture(h: HairPaint) {
  for (let y = -2; y <= 20; y++) for (let x = 0; x <= 24; x++) {
    const cell = h.art.get(x, y);
    if (cell !== h.hair.base && cell !== h.hair.shade && cell !== h.hair.light) continue;
    const curl = (x + (Math.floor((y + 8) / 2) % 2) * 2) % 4;
    if ((y + 8) % 2 === 0 && curl === 0) h.art.set(x, y, h.hair.light);
    else if ((y + 8) % 2 === 1 && curl === 2) h.art.set(x, y, h.hair.dark);
  }
  bumps(h, 1.6, 0);
}

/** The partings between dreadlocks, rows of darker dots. */
function partings(h: HairPaint) {
  for (let y = 1; y <= 9; y += 3) for (let x = 3 + (y % 2) * 2; x <= 21; x += 4) h.art.set(x, y, h.hair.dark, [h.hair.base, h.hair.light, h.hair.shade]);
}

/** A rope of hair two columns wide, banded every third row, its tip lit. */
function rope(h: HairPaint, x: number, from: number, to: number) {
  for (let y = from; y <= to; y++) { h.art.set(x, y, y % 3 === 0 ? h.hair.dark : h.hair.base); h.art.set(x + 1, y, y % 3 === 0 ? h.hair.dark : h.hair.shade); }
  h.art.set(x, to + 1, h.hair.light);
}

/** Whether a style shows the ear from this side. */
export const showsEar = (look: Look, front: boolean) => (front ? STYLES[look.hair].ear : STYLES[look.hair].backEar);

/** Behind the body: the hair that hangs at its back or its sides. */
export function paintHairBehind(h: HairPaint) { STYLES[h.look.hair].behind?.(h); }

/** The cap over the head ball, drawn before the face (from the front) or over the whole head (from behind). */
export function paintHairCap(h: HairPaint) {
  const style = STYLES[h.look.hair];
  const grow = style.grow ?? 0, lift = style.lift ?? 0;
  if (style.cap === 'none') return;
  const tones = style.cap === 'hair' ? h.hair : style.cap === 'fuzz' ? fuzzOf(h.look) : stubbleOf(h.look);
  ball(h.art, HEAD.cx, HEAD.cy - lift, HEAD.rx + grow, HEAD.ry + grow, tones, undefined, style.cap !== 'hair');
  if (style.cap === 'hair') {
    // the shine of hair: a lit band round the top left of the cap
    for (let angle = Math.PI * 1.12; angle <= Math.PI * 1.42; angle += 0.04) for (const reach of [0.7, 0.78]) {
      h.art.set(Math.round(HEAD.cx + Math.cos(angle) * (HEAD.rx + grow) * reach), Math.round(HEAD.cy - lift + Math.sin(angle) * (HEAD.ry + grow) * reach), tones.light, [tones.base]);
    }
  } else for (let y = 0; y <= 20; y++) for (let x = 1; x <= 23; x++) if ((x * 7 + y * 13 + ((x * y) % 3)) % 9 === 0) h.art.set(x, y, tones.shade, [tones.base]);
}

/** The fringe, column by column, its tips darker and their shadow on the forehead. */
export function paintFringe(h: HairPaint) {
  const style = STYLES[h.look.hair];
  if (!style.tips) return;
  const tones = style.cap === 'fuzz' ? fuzzOf(h.look) : h.hair;
  style.tips.forEach((tip, index) => {
    const x = 6 + index;
    // the fringe stops above the eyes, unless the style is meant to hide one
    const bottom = style.overEyes || !EYE_COLUMNS.has(x) ? 8 + tip : Math.min(8 + tip, 10);
    for (let y = 3; y <= bottom; y++) if (inFace(x, y)) h.art.set(x, y, y === bottom ? tones.shade : tones.base);
    if (inFace(x, bottom + 1)) h.art.set(x, bottom + 1, h.skin.shade, [h.skin.base, h.skin.light]);
  });
}

/** What the style adds over the head, from the side being drawn; then what stands up from it, unless hidden under a hat. */
export function paintHairOver(h: HairPaint) {
  const style = STYLES[h.look.hair];
  (h.front ? style.front : style.back)?.(h);
  if (!h.hatted) style.crest?.(h);
}

/** From behind, the hair over the back (after the top). */
export function paintHairOverBack(h: HairPaint) { STYLES[h.look.hair].overBack?.(h); }
