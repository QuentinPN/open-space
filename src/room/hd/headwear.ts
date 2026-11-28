// What the HD people wear on the head (src/room/chibi-hd.ts): every hat of shared/look.ts (the look's own, a
// festival's, the anime ones, the wardrobe's), headphones, and the gear worn on the eyes and the face. A hat that covers
// the head sits on its top (`top`, the head's highest row without what stands up from the hair); a band goes round it.
import { COSTUME_COLORS as C, WARDROBE_COLORS as W } from '../../design/people-palette.ts';
import { ROOM_PALETTE } from '../../design/room-palette.ts';
import type { Hat } from '../outfits.ts';
import { hash } from '../sprites.ts';
import { HEAD, inFace, inHead } from './face.ts';
import { ball, band, flipRows, hdTones, type Art, type Body, type Tones } from './kit.ts';

const F = ROOM_PALETTE.festive;

/** The hats worn round the head rather than over it: what stands up from the hair stays out (a bun, a crest). */
const BANDS: ReadonlySet<Hat> = new Set(['leafBand', 'leafBandTilted', 'hachimaki', 'catEars', 'flowerCrown', 'party', 'gold', 'crown', 'bunny']);
export const coversHead = (hat: Hat | undefined) => hat !== undefined && !BANDS.has(hat);

/** A cone from a base `width` wide on row `base` to its tip, leaning right, striped every fourth row. */
function cone(art: Art, base: number, width: number, height: number, body: Tones, stripe: string, lean = 2) {
  for (let row = 0; row <= height; row++) {
    const t = row / height, half = (width / 2) * (1 - t), centre = 12.5 + lean * t;
    for (let x = Math.round(centre - half); x < Math.round(centre + half); x++) {
      const striped = row % 4 === 2 && row < height - 1;
      art.set(x, base - row, striped ? stripe : x < centre - half + 1.5 ? body.light : x > centre + half - 2 ? body.shade : body.base);
    }
  }
}

/** A hat on the head; `top`: the head's top row, `colour`: the look's hat colour (or the festival's). */
export function paintHat(art: Art, b: Body, hat: Hat, colour: string | undefined, top: number) {
  const own = hdTones(colour ?? F.beret);
  const t = top, front = b.front;
  const dome = (cy: number, rx: number, ry: number, tones: Tones, last: number) => {
    art.ellipse(HEAD.cx, cy, rx, ry, tones.shade);
    art.ellipse(HEAD.cx - 0.6, cy - 0.7, rx - 0.8, ry - 0.8, tones.base, [tones.shade]);
    art.ellipse(HEAD.cx - rx * 0.4, cy - ry * 0.55, rx * 0.3, ry * 0.2, tones.light, [tones.base]);
    for (let y = Math.ceil(last) + 1; y <= cy + ry + 1; y++) for (let x = -8; x <= 31; x++) {
      const cell = art.get(x, y);
      if (cell === tones.shade || cell === tones.base || cell === tones.light) art.set(x, y, null);
    }
  };
  switch (hat) {
    case 'cap':
      dome(t + 6, 10.9, 6.6, own, t + 6);
      art.rect(2, t + 6, 20, 1, own.shade);
      if (front) { art.rect(14, t + 6, 12, 1, own.dark); art.rect(15, t + 5, 10, 1, own.shade); art.set(25, t + 5, own.dark); }
      else { art.rect(20, t + 6, 4, 1, own.dark); art.rect(10, t + 5, 4, 1, own.dark); }
      art.set(12, t, own.light);
      break;
    case 'beanie':
      dome(t + 7, 11.2, 7.8, own, t + 7);
      for (let x = 1; x <= 23; x++) for (let y = t + 6; y <= t + 8; y++) if (inHead(x, y) || y === t + 6) art.set(x, y, x % 2 ? own.shade : own.dark);
      for (const x of [6, 10, 14, 18]) for (let y = t + 1; y <= t + 5; y++) art.set(x, y, own.shade, [own.base]);
      ball(art, 12.4, t - 1.4, 2.8, 2.6, hdTones(own.light));
      break;
    case 'beret':
      art.turnedEllipse(13, t + 2.2, 12, 3.6, -0.12, own.shade);
      art.turnedEllipse(12.4, t + 1.6, 11.2, 2.8, -0.12, own.base, [own.shade]);
      art.turnedEllipse(9, t + 0.6, 5, 1.2, -0.12, own.light, [own.base]);
      art.rect(13, t - 2, 1, 2, own.dark);
      break;
    case 'tophat':
      art.ellipse(12, t + 3.5, 13.4, 2.2, own.shade); art.ellipse(11.6, t + 3, 12.6, 1.5, own.base, [own.shade]);
      art.rect(5, t - 9, 14, 11, own.base); art.rect(5, t - 9, 2, 11, own.light); art.rect(16, t - 9, 3, 11, own.shade);
      art.rect(5, t - 1, 14, 2, F.red); art.rect(16, t - 1, 3, 2, hdTones(F.red).shade); art.rect(6, t - 10, 12, 1, own.light);
      break;
    case 'party': {
      const body = hdTones(colour ?? F.balloons[hash(JSON.stringify(b.look)) % F.balloons.length]);
      cone(art, t + 2, 13, 13, body, F.hatStripe);
      ball(art, 15, t - 12, 2.4, 2.2, hdTones(F.gold));
      break;
    }
    case 'gold': cone(art, t + 2, 13, 13, hdTones(F.gold), F.silver); ball(art, 15, t - 12, 2.4, 2.2, hdTones(F.silver)); break;
    case 'santa': {
      const red = hdTones(F.red), fur = hdTones(F.fur);
      band(art, t - 6, t + 3, (row) => { const k = (row - (t - 6)) / 9; return [3 + (1 - k) * 9, 21 + (1 - k) * 1 - (1 - k) * 2]; }, (x, row) => (x < 7 ? red.light : x > 18 || row < t - 3 ? red.shade : red.base));
      for (let i = 0; i <= 6; i++) art.rect(14 + i, t - 6 + Math.floor(i * 0.9), 3, 2, i > 3 ? red.shade : red.base);
      for (let x = 1; x <= 23; x++) for (let y = t + 3; y <= t + 5; y++) if (inHead(x, y + 1) || y === t + 3) art.set(x, y, y === t + 5 ? fur.shade : x < 5 ? fur.light : fur.base);
      ball(art, 22.4, t + 1, 2.6, 2.5, fur);
      break;
    }
    case 'crown': {
      const gold = hdTones(F.gold);
      art.rect(5, t - 1, 15, 3, gold.base); art.rect(5, t - 1, 15, 1, gold.light); art.rect(5, t + 1, 15, 1, gold.shade);
      for (const x of [6, 12, 18]) for (let row = 1; row <= 4; row++) { const half = Math.floor((4 - row) / 2); art.rect(x - half, t - 1 - row, half * 2 + 1, 1, row === 4 ? gold.light : gold.base); }
      art.points([[9, t], [15, t]], F.jewel); art.set(12, t, F.jewelBlue); art.points([[6, t - 5], [12, t - 5], [18, t - 5]], F.silver);
      break;
    }
    case 'bunny': {
      const fur = hdTones(F.fur);
      for (const [x, angle] of [[8, -0.22], [17, 0.22]] as const) {
        art.turnedEllipse(x, t - 6, 2.8, 6.8, angle, fur.shade);
        art.turnedEllipse(x - 0.4, t - 6.4, 2.2, 6.1, angle, fur.base, [fur.shade]);
        art.turnedEllipse(x + (front ? 0.2 : 0), t - 5.6, 1, 4.4, angle, front ? F.earInside : fur.shade, [fur.base]);
      }
      for (let x = 3; x <= 21; x++) for (let y = t + 1; y <= t + 2; y++) if (inHead(x, y + 1)) art.set(x, y, F.headphones);
      break;
    }
    case 'leafBand': case 'leafBandTilted': {
      const navy = hdTones(C.band);
      const slant = hat === 'leafBandTilted' ? 0.28 : 0;
      for (let x = 1; x <= 23; x++) for (let k = 0; k < 3; k++) { const y = Math.round(7 + k + (x - 12) * slant); if (inHead(x, y)) art.set(x, y, k === 2 ? navy.shade : navy.base); }
      if (front) {
        const plate = (x: number) => Math.round(7 + (x - 12) * slant);
        for (let x = 10; x <= 18; x++) for (let k = 0; k < 3; k++) art.set(x, plate(x) + k, x === 10 || k === 0 ? C.metalLight : x === 18 || k === 2 ? C.metalDark : C.metal);
        art.points([[13, plate(13) + 1], [14, plate(14) + 1], [15, plate(15) + 1]], C.metalDark); art.set(14, plate(14), C.metalDark);
        for (let y = 9; y <= 16; y++) art.set(1 - Math.floor((y - 9) / 3), y + Math.round((1 - 12) * slant), navy.base);
      } else {
        art.rect(11, 9, 3, 2, navy.base); art.rect(11, 11, 1, 5, navy.base); art.rect(13, 11, 1, 4, navy.shade);
      }
      break;
    }
    case 'bandana': {
      const black = hdTones(C.black);
      dome(t + 6.5, 11, 7.4, black, t + 7);
      for (let x = 1; x <= 23; x++) if (inHead(x, t + 7)) art.set(x, t + 7, black.shade);
      if (front) { art.points([[1, t + 8], [0, t + 9], [0, t + 10], [-1, t + 11], [1, t + 9]], black.base); }
      else { art.rect(11, t + 7, 3, 2, black.base); art.rect(11, t + 9, 1, 3, black.base); art.rect(13, t + 9, 1, 2, black.shade); }
      break;
    }
    case 'strawHat': {
      const straw = hdTones(C.straw);
      art.ellipse(12, t + 4.8, 17, 2.9, straw.shade); art.ellipse(11.4, t + 4.2, 16.2, 2.2, straw.base, [straw.shade]);
      dome(t + 3, 8.4, 4.8, straw, t + 3);
      art.rect(4, t + 2, 17, 2, C.hatBand); art.rect(18, t + 2, 3, 2, hdTones(C.hatBand).shade);
      art.points([[-3, t + 4], [-2, t + 4], [26, t + 5], [27, t + 4]], straw.light);
      break;
    }
    case 'spaceHelmet': {
      for (let y = -5; y <= 21; y++) for (let x = -3; x <= 27; x++) {
        const distance = Math.hypot(x + 0.5 - 12, (y + 0.5 - 9.5) * 1.02);
        if (distance <= 14.6 && distance > 13.4) art.set(x, y, x + y < 12 ? W.white : W.whiteShade);
      }
      art.points([[2, 0], [3, -1], [4, -2], [5, -3], [1, 2], [1, 3]], W.lensShine);
      art.rect(1, 20, 23, 2, W.steel); art.rect(1, 20, 23, 1, W.steelLight); art.rect(18, 20, 6, 2, W.steelDark);
      break;
    }
    case 'tricorne':
      band(art, t - 3, t + 3, (row) => { const k = row - (t - 3); return [[2, 23], [0, 25], [-1, 26], [0, 25], [1, 24], [4, 21], [9, 17]][k] as [number, number]; }, (x, row) => (row === t + 1 || row === t - 3 ? F.gold : x < 5 ? own.light : x > 19 ? own.shade : row > t + 1 ? own.shade : own.base));
      art.rect(-2, t - 5, 3, 2, own.light); art.rect(23, t - 5, 3, 2, own.shade); art.points([[-2, t - 6], [25, t - 6]], F.gold);
      ball(art, 12, t - 4, 6, 3, own);
      break;
    case 'wizardHat':
      art.ellipse(12, t + 3.5, 14.5, 2.4, own.shade); art.ellipse(11.4, t + 3, 13.6, 1.7, own.base, [own.shade]);
      for (let row = 0; row <= 13; row++) {
        const k = row / 13, half = 7.5 * (1 - k) + 0.6, centre = 12 + k * k * 6;
        for (let x = Math.round(centre - half); x < Math.round(centre + half); x++) art.set(x, t + 2 - row, x < centre - half + 2 ? own.light : x > centre + half - 2 ? own.shade : own.base);
      }
      art.rect(19, t - 12, 3, 1, own.shade); art.rect(21, t - 11, 2, 2, own.shade);
      art.rect(5, t, 15, 2, F.gold); art.rect(16, t, 4, 2, hdTones(F.gold).shade);
      art.points([[12, t - 5], [11, t - 4], [13, t - 4], [12, t - 3]], W.star); art.set(12, t - 4, W.starLight);
      break;
    case 'greatHelm': {
      const steel = hdTones(W.steel);
      for (let y = -1; y <= 21; y++) {
        const inset = y === -1 ? 3 : y === 0 ? 1 : 0;
        for (let x = 1 + inset; x <= 23 - inset; x++) art.set(x, y, x < 4 ? W.steelLight : x > 20 ? W.steelDark : x === 13 ? W.steelLight : steel.base);
      }
      art.rect(1, 21, 23, 1, W.steelDark);
      if (front) {
        art.rect(4, 12, 18, 1, W.rivet); art.rect(4, 13, 18, 1, W.steelDark);
        for (const [x, y] of [[17, 16], [19, 16], [18, 17], [17, 18], [19, 18]]) art.set(x, y, W.rivet);
      } else art.rect(12, -1, 1, 22, W.steelDark);
      break;
    }
    case 'hachimaki': {
      const white = hdTones(W.white);
      for (let x = 1; x <= 23; x++) for (const [y, tone] of [[7, white.base], [8, white.shade]] as const) if (inHead(x, y)) art.set(x, y, tone);
      if (front) { art.rect(14, 6, 3, 3, W.red); art.points([[14, 6], [16, 8]], white.base); for (const [x, y] of [[1, 8], [0, 9], [-1, 9], [-2, 10], [-3, 10], [0, 10], [-1, 11], [-2, 12]]) art.set(x, y, white.base); }
      else { art.rect(11, 8, 3, 2, white.base); for (const [x, y] of [[10, 10], [9, 11], [8, 12], [14, 10], [15, 11], [16, 12]]) art.set(x, y, white.shade); }
      break;
    }
    case 'sunHat': {
      const straw = hdTones(W.straw);
      art.ellipse(12, t + 4.5, 18.6, 3.4, straw.shade); art.ellipse(11.4, t + 3.9, 17.8, 2.6, straw.base, [straw.shade]);
      for (const x of [-5, -4, 28, 29]) art.set(x, t + 6, straw.shade);
      dome(t + 2.6, 8.8, 4.8, straw, t + 3);
      art.rect(4, t + 2, 17, 2, own.base); art.rect(4, t + 2, 2, 2, own.light); art.rect(18, t + 2, 3, 2, own.shade);
      art.points([[19, t], [21, t], [20, t - 1], [20, t + 1]], W.petalPink); art.set(20, t, W.petalYellow);
      break;
    }
    case 'catEars': {
      const ear = ['p...', 'pp..', 'pcp.', 'pccp', 'pppp'];
      art.pattern(4, t - 3, ear, { p: W.neonPink, c: W.neonCyan });
      art.pattern(17, t - 3, flipRows(ear), { p: W.neonPink, c: W.neonCyan });
      for (let x = 3; x <= 21; x++) if (inHead(x, t + 2)) art.set(x, t + 1, W.neonPink);
      break;
    }
    case 'flowerCrown': {
      const petals = [W.petalPink, W.petalWhite, W.petalYellow, W.petalPurple, W.petalRed];
      for (let x = 2; x <= 22; x++) art.set(x, t + 2 + Math.round(Math.abs(x - 12) / 6), W.leaf);
      for (let x = 3, index = 0; x <= 20; x += 4, index++) {
        const y = t + 1 + Math.round(Math.abs(x - 12) / 6);
        art.rect(x, y, 3, 2, petals[index % petals.length]); art.set(x + 1, y, W.petalYellow); art.set(x + 3, y + 1, W.leaf);
      }
      break;
    }
    case 'cowboyHat':
      art.ellipse(12, t + 3.8, 16.4, 2.3, own.shade); art.ellipse(11.6, t + 3.2, 15.6, 1.6, own.base, [own.shade]);
      art.rect(-4, t + 1, 2, 2, own.base); art.rect(26, t + 1, 2, 2, own.shade); art.points([[-5, t], [28, t]], own.base);
      ball(art, 12, t - 1, 6.6, 4.4, own);
      art.rect(11, t - 5, 2, 2, own.shade); art.set(12, t - 4, own.dark);
      art.rect(6, t + 1, 13, 2, own.dark); art.rect(6, t + 1, 13, 1, own.shade);
      break;
  }
}

/** Headphones: a band over the head, a cup on each ear, the near one the bigger. */
export function paintHeadphones(art: Art, b: Body, top: number) {
  const shell = hdTones(F.headphonesShell);
  for (let angle = Math.PI * 1.08; angle <= Math.PI * 1.92; angle += 0.03) {
    const x = Math.round(HEAD.cx + Math.cos(angle) * (HEAD.rx + 0.6)), y = Math.round(HEAD.cy + Math.sin(angle) * (HEAD.ry + 0.6) + Math.min(0, top - 1));
    art.set(x, y, angle < Math.PI * 1.3 ? F.headphonesShine : F.headphonesShell); art.set(x, y + 1, shell.shade);
  }
  const cup = (cx: number, rx: number, near: boolean) => {
    ball(art, cx, 13.5, rx, 3.8, { light: F.headphonesShine, base: F.headphonesShell, shade: F.headphones, dark: F.headphones });
    if (near) art.rect(Math.round(cx) - 1, 12, 2, 4, F.headphonesPad);
  };
  if (b.front) { cup(22.2, 1.6, false); cup(2.6, 2.8, true); }
  else { cup(1.4, 1.6, false); cup(21.6, 2.8, true); }
}

/** What is worn on the eyes: a visor, a diving mask, an eye patch, a monocle. */
export function paintEyeGear(art: Art, b: Body) {
  const front = b.front;
  switch (b.look.eyeGear) {
    case 'visor':
      if (!front) { art.rect(1, 12, 23, 2, W.rubber); break; }
      art.rect(4, 10, 19, 5, W.rubber); art.rect(5, 11, 17, 3, hdTones(W.neonCyan).shade); art.rect(5, 11, 17, 1, W.neonCyan); art.points([[8, 11], [9, 11]], W.lensShine);
      break;
    case 'goggles':
      if (!front) { art.rect(1, 12, 23, 2, W.rubber); art.rect(2, 1, 1, 12, W.snorkel); break; }
      art.rect(8, 9, 12, 7, W.rubber); art.rect(9, 10, 10, 5, W.lens); art.points([[10, 10], [11, 10], [10, 11]], W.lensShine); art.rect(13, 15, 2, 2, W.rubber);
      art.rect(3, 12, 5, 2, W.rubber);
      art.rect(21, 2, 1, 15, W.snorkel); art.rect(17, 17, 5, 1, W.snorkel);
      break;
    case 'eyePatch':
      if (!front) { for (let x = 1; x <= 23; x++) art.set(x, 9 - Math.floor((x - 1) / 12), W.strap); break; }
      art.rect(9, 10, 4, 6, W.strap); art.points([[9, 10], [12, 15]], b.skin.shade);
      for (const [x, y] of [[8, 11], [7, 10], [6, 10], [5, 9], [13, 11], [14, 10], [15, 10], [16, 9], [17, 9], [18, 8], [19, 8], [20, 8]]) art.set(x, y, W.strap);
      break;
    case 'monocle':
      if (!front) break;
      for (const [x, y] of [[16, 9], [17, 9], [15, 10], [18, 10], [15, 11], [18, 11], [15, 12], [18, 12], [15, 13], [18, 13], [15, 14], [18, 14], [16, 15], [17, 15]]) art.set(x, y, W.gold);
      for (const [x, y] of [[18, 16], [19, 17], [19, 18], [18, 19], [18, 20]]) art.set(x, y, W.goldDark);
      break;
  }
}

/** What is worn on the face: whiskers, a scar, a mask, a cigarette, earbuds. */
export function paintFaceGear(art: Art, b: Body) {
  const front = b.front, skin = b.skin;
  switch (b.look.faceGear) {
    case 'whiskers': if (front) for (const y of [15, 17]) { art.rect(5, y, 3, 1, skin.dark); art.rect(19, y, 3, 1, skin.dark); } break;
    case 'scar': if (front) { art.rect(9, 16, 4, 1, C.scar); art.points([[10, 15], [11, 17]], C.scar); } break;
    case 'cigarette': if (front) { art.rect(15, 17, 4, 1, C.paper); art.set(19, 17, C.ember); } break;
    case 'mask': {
      const navy = hdTones(C.navy);
      if (front) {
        for (let y = 15; y <= 22; y++) for (let x = 5; x <= 22; x++) if (inFace(x, y) || (y >= 19 && y <= 21 && x >= 8 && x <= 17)) art.set(x, y, x > 18 || y > 20 ? navy.shade : x < 9 ? navy.light : navy.base);
        art.points([[14, 15], [15, 16]], navy.light);
      } else for (let y = 15; y <= 21; y++) for (let x = 15; x <= 22; x++) if (inHead(x, y) && !inHead(x - 3, y - 2)) art.set(x, y, navy.shade);
      break;
    }
    case 'earbuds':
      if (front) { art.rect(4, 14, 2, 2, W.neonPink); art.set(5, 14, W.neonCyan); }
      else { art.rect(20, 13, 2, 2, W.neonPink); art.set(20, 13, W.neonCyan); }
      break;
  }
}

/** The smoke of a cigarette, over the outline. */
export function paintSmoke(art: Art, b: Body) {
  if (b.look.faceGear !== 'cigarette' || !b.front) return;
  for (const [x, y] of [[20, 16], [20, 15], [21, 14], [21, 13], [20, 12], [21, 11]]) art.set(x, y, C.smoke);
}
