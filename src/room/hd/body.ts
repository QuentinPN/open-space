// The HD people's bodies (src/room/chibi-hd.ts): legs and shoes, what is worn on the hips, the torso and the arms,
// every top, bottom and pair of shoes of shared/look.ts (the everyday ones, the anime costumes, the wardrobe's), in the
// look's colours where the classic room uses them (chibi.ts, costumes.ts, wardrobe.ts) and their own otherwise.
// Coordinates (kit.ts): the torso x 8-15 from row 19, the arms x 5-6 and 17-18, the legs x 9-10 and 13-14, the soles on
// row 35; seated, the lap on rows 28-30 and, from the front, the shins under it.
import { COSTUME_COLORS as C, HD_INK, PEOPLE_INK as INK, WARDROBE_COLORS as W } from '../../design/people-palette.ts';
import type { Look } from '../../../shared/look.ts';
import { ball, band, hdTones, type Arm, type Art, type Body, type Leg, type Tones } from './kit.ts';

type Cut = 'pants' | 'shorts' | 'skirt' | 'wide' | 'none';

/** What is worn on the hips and the legs: its cut, its cloth, what it adds over the legs. */
interface Bottom { cut: Cut; cloth: Tones; detail?: (b: Body, cloth: Tones) => void }

/** The bottom as worn: a dress or a blanket stands for it, dungarees bring trousers in the top's colour. */
function bottomOf(look: Look): Bottom {
  const cloth = hdTones(look.bottomColor);
  if (look.top === 'dress') return { cut: 'none', cloth };
  if (look.top === 'overalls') return { cut: 'pants', cloth: hdTones(look.topColor) };
  switch (look.bottom) {
    case 'pants': return { cut: 'pants', cloth };
    case 'shorts': return { cut: 'shorts', cloth };
    case 'skirt': return { cut: 'skirt', cloth };
    case 'tracksuit': return { cut: 'pants', cloth, detail: (b) => stripe(b, look.accentColor) };
    case 'narutoPants': return { cut: 'pants', cloth: hdTones(C.orange), detail: (b) => { wraps(b, C.bandage); thighBand(b, C.band); } };
    case 'zoroPants': return { cut: 'pants', cloth: hdTones(C.trousers) };
    case 'luffyShorts': return { cut: 'shorts', cloth: hdTones(C.shorts), detail: (b) => cuffs(b, C.cuff) };
    case 'sanjiPants': return { cut: 'pants', cloth: hdTones(C.suit), detail: (b) => crease(b, hdTones(C.suit).light) };
    case 'kakashiPants': return { cut: 'pants', cloth: hdTones(C.navy), detail: (b) => { wraps(b, C.bandage); thighBand(b, C.bandage); } };
    case 'hakama': return { cut: 'wide', cloth, detail: (b, tones) => pleats(b, tones) };
    case 'pleatedSkirt': return { cut: 'skirt', cloth, detail: (b, tones) => skirtPleats(b, tones) };
    case 'cargo': return { cut: 'pants', cloth, detail: (b, tones) => pockets(b, tones) };
    case 'swimShorts': return { cut: 'shorts', cloth, detail: (b) => { stripe(b, W.white, true); if (b.front && !b.sit) b.art.points([[12, 28], [12, 29]], W.white); } };
    case 'greaves': return { cut: 'pants', cloth: hdTones(W.steel), detail: (b) => kneePlates(b) };
    case 'kilt': return { cut: 'skirt', cloth, detail: (b, tones) => tartan(b, tones) };
    case 'joggers': return { cut: 'pants', cloth, detail: (b) => { stripe(b, W.neonLime); wraps(b, W.neonLime); } };
  }
}

/** The first row of the legs under the hips: under the lap when seated. */
const legsFrom = (b: Body) => (b.sit ? 31 : 29);

/** A stripe down the outer side of each leg (and of the lap, seated). */
function stripe(b: Body, colour: string, short = false) {
  if (b.sit) { b.art.rect(b.front ? 8 : 8, 29, b.front ? 10 : 8, 1, colour); return; }
  for (const leg of b.legs) for (let row = 28; row <= (short ? 30 : leg.last); row++) b.art.set(leg.side ? leg.x + 1 : leg.x, row, colour);
}
/** Bandage or cuffs round the ankles. */
function wraps(b: Body, colour: string) { for (const leg of b.legs) { b.art.rect(leg.x, leg.last, 2, 1, colour); b.art.set(leg.x + (leg.side ? 1 : 0), leg.last - 1, colour); } }
function thighBand(b: Body, colour: string) { if (!b.sit && b.front) b.art.rect(b.legs[0].x - 1, 30, 3, 1, colour); }
function cuffs(b: Body, colour: string) {
  if (b.sit) { b.art.rect(8, 30, b.front ? 10 : 8, 1, colour); return; }
  for (const leg of b.legs) b.art.rect(leg.x - (leg.side ? 0 : 1), 31, 3, 1, colour);
}
function crease(b: Body, colour: string) { if (!b.sit) for (const leg of b.legs) for (let row = 29; row < leg.last; row++) b.art.set(leg.x + (leg.side ? 0 : 1), row, colour); }
function pleats(b: Body, tones: Tones) {
  if (b.sit) { for (const x of [10, 13, 16]) b.art.rect(x, 28, 1, 3, tones.dark); return; }
  for (const leg of b.legs) for (let row = 30; row <= leg.last; row++) b.art.set(leg.x + (leg.side ? 1 : 0), row, tones.dark);
  if (b.front) b.art.rect(10, 28, 4, 1, tones.light);
}
function skirtPleats(b: Body, tones: Tones) {
  const [from, to] = b.sit ? [28, 31] : [28, 31];
  for (let row = from; row <= to; row++) for (let x = 5; x <= 18; x++) if (b.art.get(x, row) && (x + (row > 29 ? 0 : 1)) % 2 === 0 && b.art.get(x, row) !== b.skin.base) b.art.set(x, row, x > 14 ? tones.dark : tones.shade, [tones.light, tones.base, tones.shade]);
}
function pockets(b: Body, tones: Tones) {
  if (b.sit) { b.art.rect(8, 28, 2, 2, tones.shade); b.art.set(8, 28, tones.light); return; }
  for (const leg of b.legs) { const x = leg.side ? leg.x + 1 : leg.x - 1; b.art.rect(x, 30, 2, 2, leg.side ? tones.dark : tones.shade); b.art.rect(x, 30, 2, 1, tones.light); }
}
function kneePlates(b: Body) {
  if (b.sit) { b.art.rect(9, 29, 2, 1, W.steelLight); b.art.rect(14, 29, 2, 1, W.steelLight); return; }
  for (const leg of b.legs) { b.art.rect(leg.x, 30, 2, 1, W.steelLight); b.art.rect(leg.x, 29, 2, 1, W.leather); b.art.set(leg.x + 1, leg.last, W.steelDark); }
}
function tartan(b: Body, tones: Tones) {
  for (let row = 28; row <= 31; row++) for (let x = 5; x <= 18; x++) {
    if (!b.art.get(x, row) || b.art.get(x, row) === b.skin.base || b.art.get(x, row) === b.skin.light) continue;
    if (x % 3 === 0) b.art.set(x, row, tones.dark); else if (row === 29) b.art.set(x, row, tones.light);
  }
  if (b.front && !b.sit) { b.art.rect(11, 28, 2, 2, W.sporran); b.art.set(11, 29, W.white); }
  if (!b.sit) for (const leg of b.legs) b.art.rect(leg.x, leg.last - 1, 2, 2, W.sock);
}

/** The legs, the hips and the lap: the cloth of the bottom, bare skin where it ends. */
export function paintLegs(b: Body) {
  const { art, skin } = b;
  const bottom = bottomOf(b.look);
  const { cut, cloth } = bottom;
  const covered = (row: number) => cut === 'pants' || cut === 'wide' || (cut === 'shorts' && row <= 30);
  for (const leg of b.legs) {
    for (let row = legsFrom(b); row <= leg.last; row++) {
      const tones = covered(row) ? cloth : skin;
      art.set(leg.x, row, leg.side ? tones.base : tones.light); art.set(leg.x + 1, row, leg.side ? tones.shade : tones.base);
      if (cut === 'wide' && !b.sit) art.set(leg.side ? leg.x + 2 : leg.x - 1, row, leg.side ? cloth.shade : cloth.base);
    }
  }
  // the hips go up and down with the upper body
  art.dy = b.bob;
  if (b.sit) {
    // the lap: towards us from the front, the thighs flat on the seat from behind
    const [from, width] = b.front ? [8, 10] : [8, 8];
    const tones = cut === 'none' || cut === 'skirt' ? cloth : cloth;
    if (cut === 'none') { /* the dress draws the lap */ }
    else {
      art.rect(from, 28, width, 2, tones.base); art.rect(from, 30, width, 1, tones.shade); art.set(from, 28, tones.light); art.set(from, 29, tones.light);
      if (b.front) art.set(13, 29, tones.shade);
      if (cut === 'shorts' && b.front) art.rect(from, 30, width, 1, skin.base);
      if (cut === 'skirt') { art.rect(from - 1, 30, width + 2, 1, cloth.shade); art.set(from - 1, 30, cloth.base); }
    }
  } else if (cut !== 'none') {
    // the hips, the crotch between the legs
    art.rect(8, 28, 8, 3, cloth.base);
    for (let row = 28; row <= 30; row++) { art.set(8, row, cloth.light); art.set(15, row, cloth.shade); }
    if (cut === 'skirt') {
      band(art, 28, 31, (row) => [[8, 16], [7, 17], [6, 18], [6, 18]][row - 28] as [number, number], (x, row) => (row === 31 ? cloth.shade : x < 8 ? cloth.light : x > 15 ? cloth.shade : cloth.base));
      art.points([[10, 30], [13, 30]], cloth.shade);
    } else { art.set(11, 30, null); art.set(12, 30, null); art.set(11, 29, cloth.shade); }
    if (cut === 'wide') { art.rect(7, 28, 10, 1, cloth.base); art.set(7, 28, cloth.light); }
  }
  bottom.detail?.(b, cloth);
  art.dy = 0;
}

/** One shoe on the foot of `leg`: 4 columns from shoeX, 2 rows from shoeY, the toe on the right from the front. */
function paintShoe(b: Body, leg: Leg) {
  const { art, skin, look } = b;
  const x = leg.shoeX, y = leg.shoeY, front = b.front;
  const own = hdTones(look.shoesColor);
  const toe = front ? x + 3 : x, heel = front ? x : x + 3;
  /** the plain foot of a shoe: lit on top, its sole darker, the toe catching the light */
  const plain = (tones: Tones, sole = tones.dark) => { art.rect(x, y, 4, 1, tones.base); art.rect(x, y + 1, 4, 1, sole); art.set(toe, y, tones.light); if (front) art.set(x + 2, y, tones.light); };
  const shaft = (tones: Tones, rows: number) => { for (let row = 1; row <= rows; row++) { art.set(leg.x, y - row, tones.light); art.set(leg.x + 1, y - row, tones.base); } art.set(leg.x + (front ? 2 : -1), y - 1, tones.shade); };
  const bare = () => { art.rect(x, y, 4, 2, skin.base); art.rect(x, y + 1, 4, 1, skin.shade); art.set(toe, y, skin.light); };
  switch (look.shoes) {
    case 'shoes': plain(own); break;
    case 'sneakers': art.rect(x, y, 4, 1, own.base); art.set(toe, y, own.light); art.set(x + 1, y, HD_INK.sole); art.rect(x, y + 1, 4, 1, HD_INK.sole); art.set(heel, y + 1, INK.sole); break;
    case 'boots': shaft(own, 2); plain(own); break;
    case 'heels': art.rect(x + (front ? 1 : 0), y, 3, 1, own.base); art.set(toe, y + 1, own.base); art.set(front ? x + 2 : x + 1, y + 1, own.shade); art.set(heel, y + 1, own.dark); art.set(front ? x + 3 : x, y, own.light); break;
    case 'sandals': bare(); art.set(x + 1, y, own.base); art.set(x + 2, y, own.base); art.rect(x, y + 1, 4, 1, own.shade); break;
    case 'flipflops': bare(); art.set(front ? x + 2 : x + 1, y, own.base); art.rect(x, y + 1, 4, 1, own.base); break;
    case 'barefoot': bare(); if (front) art.set(x + 3, y + 1, skin.base); break;
    case 'narutoSandals': case 'kakashiSandals': {
      const sandal = hdTones(look.shoes === 'narutoSandals' ? C.sandal : C.kakashiSandal);
      art.rect(x, y, 4, 1, sandal.base); art.set(toe, y, skin.base); art.set(front ? x + 2 : x + 1, y, skin.light); art.rect(x, y + 1, 4, 1, sandal.dark);
      art.rect(leg.x, y - 1, 2, 1, sandal.light);
      break;
    }
    case 'zoroBoots': { const boot = hdTones(C.boots); shaft(boot, 3); plain(boot); art.rect(leg.x, y - 3, 2, 1, boot.light); break; }
    case 'luffySandals': bare(); art.points([[x + 1, y], [x + 2, y]], C.strap); art.rect(x, y + 1, 4, 1, C.sole); break;
    case 'sanjiShoes': plain(hdTones(C.shoe)); art.set(toe, y, C.shine); break;
    case 'geta': art.rect(x, y, 4, 1, skin.base); art.set(front ? x + 2 : x + 1, y, W.strap); art.rect(x, y + 1, 4, 1, W.wood); art.set(heel, y + 1, W.woodDark); break;
    case 'pirateBoots': shaft(own, 3); art.rect(leg.x - 1, y - 4, 4, 1, own.light); art.set(leg.x + 2, y - 4, own.base); plain(own); art.set(leg.x + (front ? 1 : 0), y - 2, W.gold); break;
    case 'spaceBoots': shaft(own, 2); art.rect(leg.x - 1, y - 2, 4, 1, W.steel); art.set(leg.x - 1, y - 2, W.steelLight); art.rect(x - (front ? 0 : 1), y, 5, 1, own.base); art.rect(x - (front ? 0 : 1), y + 1, 5, 1, W.whiteShade); art.set(toe, y, own.light); break;
    case 'clogs': art.rect(x, y, 4, 1, own.base); art.set(front ? x + 3 : x, y, own.light); art.set(front ? x + 4 : x - 1, y, own.shade); art.rect(x, y + 1, 4, 1, own.shade); art.set(front ? x + 1 : x + 2, y, own.light); break;
    case 'rollerSkates': shaft(own, 1); art.rect(x, y, 4, 1, own.base); art.set(toe, y, own.light); art.rect(x + 1, y + 1, 2, 1, W.steel); break;
    case 'flippers': art.rect(x, y, 4, 1, own.base); art.rect(front ? x : x - 3, y + 1, 7, 1, own.light); art.set(front ? x + 6 : x - 3, y + 1, own.shade); art.set(front ? x + 4 : x - 1, y, own.shade); break;
    case 'sabatons': art.rect(x, y, 4, 1, W.steel); art.set(x + 1, y, W.steelLight); art.rect(x, y + 1, 4, 1, W.steelDark); art.set(front ? x + 4 : x - 1, y + 1, W.steelDark); art.set(leg.x, y - 1, W.steel); art.set(leg.x + 1, y - 1, W.steelDark); break;
  }
}

/** Roller skates' wheels, either side of their plate (on the soles' row: a skater stands on the floor too). */
function underSole(b: Body, leg: Leg) {
  if (b.look.shoes === 'rollerSkates') for (const dx of [0, 3]) b.art.set(leg.shoeX + dx, leg.shoeY + 1, W.rubber);
}

export function paintFeet(b: Body) {
  if (b.sit && !b.front) return;
  for (const leg of b.legs) { paintShoe(b, leg); underSole(b, leg); }
}

/** What a top is made of: the cloth of the torso (null: bare), its sleeves' cloth and length, a cuff, what it adds. */
interface Top { cloth: Tones | null; sleeve: Tones | null; length: 'none' | 'short' | 'long'; cuff?: string; shoulders?: Tones; detail?: (b: Body) => void }

const SHORT = 'short' as const, LONG = 'long' as const, NONE = 'none' as const;

function topOf(look: Look, b: Body): Top {
  const top = hdTones(look.topColor), accent = hdTones(look.accentColor), skin = b.skin;
  const { art } = b;
  const front = b.front;
  switch (look.top) {
    case 'tshirt': return { cloth: top, sleeve: top, length: SHORT, detail: () => { if (front) art.rect(10, 21, 4, 1, top.shade); } };
    case 'tank': return { cloth: top, sleeve: null, length: NONE, shoulders: skin, detail: () => { if (front) { art.rect(10, 21, 4, 1, skin.base); art.set(11, 22, skin.shade); } art.points([[9, 20], [14, 20]], top.base); } };
    case 'vneck': return { cloth: top, sleeve: top, length: SHORT, detail: () => { if (front) { art.rect(10, 21, 4, 1, skin.base); art.rect(11, 22, 2, 1, skin.base); art.set(12, 23, skin.shade); art.points([[10, 22], [13, 22]], top.light); } } };
    case 'polo': return { cloth: top, sleeve: top, length: SHORT, detail: () => { if (front) { art.rect(9, 21, 2, 1, top.light); art.rect(13, 21, 2, 1, top.light); art.rect(11, 21, 2, 1, skin.shade); art.rect(12, 22, 1, 2, top.dark); art.set(12, 22, INK.shirt); } else art.rect(9, 21, 6, 1, top.light); } };
    case 'shirt': return { cloth: top, sleeve: top, length: LONG, cuff: top.light, detail: () => { if (front) { art.points([[10, 21], [13, 21]], top.light); art.set(11, 21, skin.shade); art.set(12, 21, skin.shade); for (let row = 22; row <= 27; row++) art.set(12, row, top.shade); art.points([[12, 23], [12, 25]], top.light); } else art.rect(9, 21, 6, 1, top.light); } };
    case 'hoodie': return { cloth: top, sleeve: top, length: LONG, cuff: top.shade, detail: () => {
      if (front) { art.rect(9, 21, 6, 1, top.shade); art.points([[10, 22], [10, 23], [13, 22], [13, 23]], INK.shirt); art.rect(9, 25, 6, 2, top.shade); art.rect(10, 25, 4, 1, top.base); }
      else { art.rect(9, 20, 6, 4, top.shade); art.rect(10, 21, 4, 2, top.dark); }
      art.rect(8, 27, 8, 1, top.dark);
    } };
    case 'sweater': return { cloth: top, sleeve: top, length: LONG, cuff: top.shade, detail: () => {
      art.rect(9, 20, 6, 2, top.light); art.rect(10, 21, 4, 1, top.base);
      for (let x = 8; x <= 15; x++) art.set(x, 27, x % 2 ? top.shade : top.dark);
      if (front) for (const [x, y] of [[10, 24], [12, 24], [11, 25]]) art.set(x, y, top.light);
    } };
    case 'jacket': return { cloth: top, sleeve: top, length: LONG, cuff: top.dark, detail: () => {
      if (front) { art.rect(10, 21, 4, 7, accent.base); art.rect(10, 21, 1, 7, accent.light); art.rect(9, 21, 1, 7, top.dark); art.rect(14, 21, 1, 7, top.dark); art.points([[10, 21], [13, 21]], top.light); }
      else art.rect(11, 21, 1, 6, top.shade);
    } };
    case 'suit': case 'threePiece': return { cloth: top, sleeve: top, length: LONG, cuff: INK.shirt, detail: () => {
      if (!front) { art.rect(11, 21, 1, 7, top.shade); return; }
      art.rect(10, 21, 4, 3, INK.shirt); art.set(13, 22, hdTones(INK.shirt).shade);
      if (look.top === 'threePiece') { art.rect(10, 23, 4, 4, top.dark); art.points([[11, 24], [11, 26]], top.light); }
      art.rect(11, 21, 2, 1, look.top === 'threePiece' ? accent.base : top.dark); art.rect(11, 22, 2, 3, look.top === 'threePiece' ? accent.base : top.dark); art.set(11, 25, look.top === 'threePiece' ? accent.shade : top.dark);
      art.points([[9, 21], [9, 22], [14, 21], [14, 22]], top.light); art.set(13, 26, top.light);
    } };
    case 'tracksuit': return { cloth: top, sleeve: top, length: LONG, cuff: accent.base, detail: () => {
      art.rect(8, 24, 8, 1, accent.base); art.rect(9, 20, 6, 1, accent.base);
      if (front) for (let row = 21; row <= 27; row++) art.set(12, row, top.dark);
      for (const arm of b.arms) if (!(b.raising && arm.side)) art.rect(arm.x + (arm.side ? 1 : 0), arm.from + 1, 1, Math.max(1, arm.to - arm.from - 1), accent.base);
    } };
    case 'dress': return { cloth: top, sleeve: top, length: SHORT, detail: () => dressSkirt(b, top) };
    case 'blanket': return { cloth: top, sleeve: null, length: NONE };
    case 'none': return { cloth: null, sleeve: null, length: NONE, detail: () => {
      if (b.swim) return;
      if (front) { art.rect(9, 23, 2, 1, skin.shade); art.rect(13, 23, 2, 1, skin.shade); art.set(12, 26, skin.shade); }
      else for (let row = 22; row <= 26; row++) art.set(12, row, skin.shade);
    } };
    case 'narutoJacket': {
      const orange = hdTones(C.orange), black = hdTones(C.black);
      return { cloth: orange, sleeve: orange, length: LONG, cuff: C.black, shoulders: black, detail: () => {
        art.rect(8, 20, 8, 3, black.base); art.rect(14, 20, 2, 3, black.shade);
        for (const arm of b.arms) if (!(b.raising && arm.side)) art.rect(arm.x, arm.from, 2, 2, arm.side ? black.shade : black.base);
        if (front) { for (let row = 21; row <= 27; row++) art.set(12, row, C.zipper); art.set(13, 21, C.zipper); }
        else { art.rect(11, 23, 3, 1, C.swirl); art.points([[11, 24], [13, 24]], C.swirl); art.rect(11, 25, 3, 1, C.swirl); }
      } };
    }
    case 'zoroShirt': {
      const tee = hdTones(C.tee), green = hdTones(C.haramaki);
      return { cloth: tee, sleeve: tee, length: SHORT, detail: () => {
        art.rect(8, 24, 8, 4, green.base); art.set(8, 24, green.light); art.rect(14, 24, 2, 4, green.shade); art.rect(8, 25, 8, 1, green.dark);
        if (front) art.rect(10, 21, 4, 1, tee.shade);
      } };
    }
    case 'luffyVest': {
      const red = hdTones(C.vest);
      return { cloth: front ? null : red, sleeve: null, length: NONE, shoulders: red, detail: () => {
        if (!front) return;
        art.rect(8, 20, 2, 8, red.light); art.rect(10, 21, 1, 7, red.base); art.rect(14, 21, 2, 7, red.shade); art.set(13, 21, red.base);
        art.points([[10, 23], [10, 25]], C.button);
        art.set(12, 24, skin.shade);
      } };
    }
    case 'sanjiSuit': {
      const suit = hdTones(C.suit), shirt = hdTones(C.shirt);
      return { cloth: suit, sleeve: suit, length: LONG, cuff: C.shirt, detail: () => {
        if (!front) { art.rect(11, 21, 1, 7, suit.shade); return; }
        art.rect(10, 21, 4, 3, shirt.base); art.set(13, 22, shirt.shade); art.rect(11, 21, 2, 4, C.tie); art.set(11, 25, C.tie);
        art.points([[9, 21], [9, 22], [14, 21], [14, 22]], suit.light); art.set(13, 26, C.shine);
      } };
    }
    case 'kakashiVest': {
      const flak = hdTones(C.flak), navy = hdTones(C.navy);
      return { cloth: flak, sleeve: navy, length: LONG, cuff: C.glove, detail: () => {
        for (const arm of b.arms) if (!(b.raising && arm.side)) art.set(arm.x + (arm.side ? 1 : 0), arm.from + 1, C.swirl);
        if (front) { for (let row = 21; row <= 27; row++) art.set(12, row, flak.dark); art.rect(9, 23, 2, 2, flak.light); art.rect(13, 23, 2, 2, flak.light); art.points([[9, 23], [13, 23]], flak.dark); art.rect(9, 20, 6, 1, flak.shade); }
        else { art.rect(9, 20, 6, 1, flak.shade); art.rect(11, 23, 3, 1, C.swirl); art.points([[11, 24], [13, 24]], C.swirl); art.rect(11, 25, 3, 1, C.swirl); }
      } };
    }
    case 'bomber': return { cloth: top, sleeve: top, length: LONG, cuff: W.neonCyan, detail: () => {
      art.rect(9, 20, 6, 1, W.neonCyan); art.rect(8, 27, 8, 1, W.neonCyan);
      if (front) { for (let row = 21; row <= 26; row++) art.set(12, row, top.dark); art.set(9, 23, W.neonPink); art.set(10, 23, W.neonPink); }
      else art.rect(8, 23, 8, 1, top.shade);
      for (const arm of b.arms) if (!(b.raising && arm.side) && !arm.side) art.set(arm.x, arm.from + 1, W.neonPink);
    } };
    case 'kimono': return { cloth: top, sleeve: top, length: LONG, detail: () => {
      for (const arm of b.arms) if (!(b.raising && arm.side) && !b.sit) art.rect(arm.side ? arm.x + 2 : arm.x - 1, arm.from + 2, 1, 3, arm.side ? top.shade : top.light);
      art.rect(8, 25, 8, 2, accent.base); art.rect(8, 26, 8, 1, accent.shade); art.set(8, 25, accent.light);
      if (front) { for (let i = 0; i < 4; i++) { art.set(10 + i, 21 + i, top.dark); art.set(9 + i, 21 + i, top.light); } art.rect(11, 21, 2, 1, skin.base); art.set(12, 22, skin.shade); }
      else { art.rect(10, 24, 4, 3, accent.light); art.rect(11, 25, 2, 1, accent.dark); }
    } };
    case 'spacesuit': return { cloth: top, sleeve: top, length: LONG, cuff: W.steel, detail: () => {
      art.rect(9, 20, 6, 1, W.steel); art.rect(8, 27, 8, 1, W.steelDark);
      if (front) { art.rect(9, 23, 5, 3, W.steelDark); art.rect(10, 23, 3, 1, W.steel); art.set(10, 24, W.led); art.set(11, 24, W.neonLime); art.set(12, 24, W.neonCyan); }
      else { art.rect(9, 22, 6, 4, W.steel); art.rect(9, 22, 6, 1, W.steelLight); }
    } };
    case 'armor': {
      const steel = hdTones(W.steel);
      return { cloth: steel, sleeve: steel, length: LONG, cuff: W.steelDark, detail: () => {
        art.rect(10, 22, 4, 6, top.base); art.rect(10, 22, 1, 6, top.light); art.rect(13, 22, 1, 6, top.shade); art.rect(11, 24, 2, 1, W.gold);
        art.rect(8, 26, 8, 1, W.leather);
        for (const arm of b.arms) if (!(b.raising && arm.side)) { const x = arm.side ? arm.x - 1 : arm.x - 1; art.rect(x, arm.from - 1, 4, 2, arm.side ? steel.shade : steel.light); art.set(x + 1, arm.from - 1, W.steelLight); }
      } };
    }
    case 'wizardCape': return { cloth: top, sleeve: top, length: LONG, cuff: top.dark, detail: () => {
      if (front) { art.set(9, 23, W.star); art.set(13, 25, W.star); art.set(10, 26, W.star); art.rect(8, 20, 2, 2, top.dark); art.rect(14, 20, 2, 2, top.dark); art.rect(11, 21, 2, 1, W.gold); }
      else cape(b, top, true);
    } };
    case 'pirateShirt': return { cloth: top, sleeve: top, length: LONG, cuff: top.light, detail: () => {
      for (const arm of b.arms) if (!(b.raising && arm.side) && !b.sit) art.rect(arm.side ? arm.x + 2 : arm.x - 1, arm.from + 2, 1, 2, arm.side ? top.shade : top.light);
      if (front) { art.rect(10, 21, 4, 3, skin.base); art.points([[11, 21], [12, 22], [11, 23]], W.strap); }
      art.rect(8, 26, 8, 2, accent.base); art.rect(8, 27, 8, 1, accent.shade);
      if (front && !b.sit) { art.set(9, 28, accent.base); art.set(9, 29, accent.shade); }
    } };
    case 'hawaiian': return { cloth: top, sleeve: top, length: SHORT, detail: () => {
      for (const [x, y] of front ? [[9, 22], [13, 23], [10, 26], [14, 26]] : [[9, 23], [12, 22], [14, 26], [10, 26]]) { art.set(x, y, accent.base); art.set(x + 1, y, accent.light); art.set(x, y + 1, accent.shade); art.set(x + 1, y + 1, W.petalYellow); }
      for (const arm of b.arms) if (!(b.raising && arm.side)) art.set(arm.x + 1, arm.from, accent.base);
      if (front) { art.rect(11, 21, 2, 1, skin.base); art.points([[10, 21], [13, 21]], top.light); }
    } };
    case 'sailor': return { cloth: top, sleeve: top, length: LONG, cuff: accent.base, detail: () => {
      if (front) {
        for (let i = 0; i < 3; i++) { art.rect(8 + i, 21 + i, 2, 1, accent.base); art.rect(14 - i, 21 + i, 2, 1, accent.base); }
        art.rect(11, 21, 2, 1, skin.base); art.set(12, 22, skin.shade);
        art.rect(10, 24, 4, 1, W.red); art.rect(11, 25, 2, 2, W.red); art.set(11, 24, hdTones(W.red).light);
      } else { art.rect(8, 20, 8, 4, accent.base); art.rect(8, 23, 8, 1, W.white); }
    } };
    case 'labCoat': {
      const coat = hdTones(W.white);
      return { cloth: coat, sleeve: coat, length: LONG, cuff: W.whiteShade, detail: () => {
        if (front) { art.rect(10, 21, 4, 7, accent.base); art.rect(11, 21, 2, 1, accent.light); art.rect(9, 21, 1, 7, W.whiteShade); art.rect(14, 21, 1, 7, W.whiteShade); art.set(9, 23, W.blue); art.set(9, 24, W.blue); }
        else for (let row = 23; row <= 27; row++) art.set(12, row, W.whiteShade);
        if (!b.sit) { art.rect(7, 28, 3, 3, coat.light); art.rect(14, 28, 3, 3, coat.shade); if (!front) art.rect(10, 28, 4, 3, coat.base); }
      } };
    }
    case 'chainmail': {
      const steel = hdTones(W.steel);
      return { cloth: steel, sleeve: steel, length: LONG, detail: () => {
        for (let row = 20; row <= 27; row++) for (let x = 7; x <= 16; x++) if ((x + row) % 2 && art.get(x, row) && art.get(x, row) !== b.skin.base) art.set(x, row, x > 14 ? W.steelDark : steel.shade);
        for (const arm of b.arms) if (!(b.raising && arm.side)) for (let row = arm.from; row <= arm.to; row++) if ((arm.x + row) % 2) art.set(arm.x, row, steel.shade);
        art.rect(8, 26, 8, 1, W.leather); art.set(11, 26, W.gold);
        if (!b.sit) for (let x = 8; x <= 15; x += 2) art.set(x, 28, steel.base);
      } };
    }
    case 'captainVest': return { cloth: top, sleeve: accent, length: LONG, cuff: accent.shade, detail: () => {
      if (front) { art.rect(10, 21, 4, 2, accent.base); art.set(11, 21, accent.light); for (const row of [23, 25]) art.points([[10, row], [13, row]], W.gold); for (let row = 23; row <= 27; row++) art.set(12, row, top.dark); }
      else art.rect(8, 26, 8, 1, top.dark);
      for (const arm of b.arms) if (!(b.raising && arm.side)) { art.rect(arm.x, arm.from, 2, 1, W.gold); art.set(arm.x + (arm.side ? 1 : 0), arm.from + 1, W.goldDark); }
    } };
    case 'cardigan': return { cloth: top, sleeve: top, length: LONG, cuff: top.shade, detail: () => {
      art.rect(8, 27, 8, 1, top.shade);
      if (front) { art.rect(10, 21, 4, 6, accent.base); art.rect(10, 21, 1, 6, accent.light); art.rect(9, 21, 1, 7, top.dark); art.points([[9, 23], [9, 25]], top.light); art.rect(14, 25, 1, 1, top.shade); }
    } };
    case 'apron': return { cloth: accent, sleeve: accent, length: LONG, detail: () => {
      if (front) {
        art.rect(9, 23, 6, 5, top.base); art.rect(9, 23, 1, 5, top.light); art.rect(14, 23, 1, 5, top.shade); art.rect(11, 25, 2, 1, top.shade);
        art.points([[9, 21], [9, 22], [14, 21], [14, 22]], top.base); art.rect(8, 24, 1, 1, top.shade); art.rect(15, 24, 1, 1, top.shade);
        if (!b.sit) { art.rect(9, 28, 6, 3, top.base); art.rect(14, 28, 1, 3, top.shade); art.rect(9, 30, 6, 1, top.shade); }
      } else { for (let i = 0; i < 5; i++) { art.set(8 + i, 21 + i, top.base); art.set(15 - i, 21 + i, top.base); } art.rect(10, 25, 4, 1, top.base); art.points([[11, 26], [12, 26]], top.shade); }
    } };
    case 'overalls': return { cloth: accent, sleeve: accent, length: SHORT, detail: () => {
      if (front) {
        art.rect(9, 23, 6, 5, top.base); art.rect(14, 23, 1, 5, top.shade); art.rect(9, 21, 1, 2, top.base); art.rect(14, 21, 1, 2, top.shade);
        art.points([[9, 23], [14, 23]], W.gold); art.rect(11, 24, 2, 2, top.shade);
      } else { for (let i = 0; i < 4; i++) { art.set(8 + i, 21 + i, top.base); art.set(15 - i, 21 + i, top.base); } art.rect(8, 25, 8, 3, top.base); }
    } };
    case 'jersey': return { cloth: top, sleeve: top, length: SHORT, cuff: accent.base, detail: () => {
      if (front) { for (const x of [9, 12, 15]) art.rect(x, 21, 1, 7, accent.base); art.rect(10, 21, 4, 1, accent.base); art.set(14, 23, W.gold); }
      else { art.rect(9, 21, 6, 1, accent.base); art.pattern(9, 22, ['.x.xxx', 'xx.x.x', '.x.x.x', '.x.x.x', '.x.xxx'], { x: accent.base }); }
    } };
    case 'bikerJacket': return { cloth: top, sleeve: top, length: LONG, cuff: W.steelDark, detail: () => {
      art.rect(8, 27, 8, 1, top.dark); art.set(13, 27, W.steel);
      if (front) { for (let i = 0; i < 7; i++) art.set(13 - Math.floor(i / 2), 21 + i, W.steel); art.rect(9, 21, 2, 2, top.light); art.rect(13, 21, 2, 2, top.shade); art.points([[9, 21], [14, 21]], W.steelLight); }
      else art.rect(9, 22, 6, 1, top.shade);
    } };
  }
}

/** The skirt of a dress, flaring from the waist: over the hips, the lap when seated. */
function dressSkirt(b: Body, cloth: Tones) {
  const { art } = b;
  art.rect(8, 25, 8, 1, cloth.shade);
  if (b.sit) {
    const width = b.front ? 11 : 9;
    art.rect(7, 27, width, 3, cloth.base); art.rect(7, 30, width, 1, cloth.shade); art.points([[7, 27], [7, 28]], cloth.light);
    if (b.front) art.points([[11, 29], [14, 29]], cloth.shade);
    return;
  }
  band(art, 26, 31, (row) => { const flare = (row - 26) / 5; return [8 - flare * 2.4, 16 + flare * 2.4]; }, (x, row) => (row === 31 ? cloth.shade : x < 9 ? cloth.light : x > 14 ? cloth.shade : (x === 11 && row > 28) ? cloth.shade : cloth.base));
}

/** A cape from the shoulders to the calves, flaring out: behind the body from the front (painted first), over the back. */
export function cape(b: Body, cloth: Tones, over: boolean) {
  const from = 20, to = b.sit ? 30 : 33;
  band(b.art, from, to, (row) => { const flare = (row - from) / (to - from); return [6.5 - flare * 4, 17.5 + flare * 4]; }, (x, row) => {
    if (!over) return x < 12 ? cloth.shade : cloth.dark;
    const fold = (x === 9 || x === 15) && row > from + 4;
    return fold ? cloth.shade : x < 8 ? cloth.light : x > 16 ? cloth.shade : cloth.base;
  });
}

/** The torso, the shoulders and the arms in the top's cloth (or bare), the hands; then what the top adds. */
export function paintTop(b: Body) {
  const { art, skin } = b;
  if (b.look.top === 'blanket') { paintBlanket(b); return; }
  const spec = topOf(b.look, b);
  const cloth = spec.cloth ?? skin;
  // the torso, lit from the left, its shoulders
  art.rect(8, 19, 8, 9, cloth.base);
  for (let row = 20; row <= 27; row++) { art.set(8, row, cloth.light); art.set(14, row, cloth.shade); art.set(15, row, cloth.shade); }
  art.rect(8, 27, 8, 1, cloth.shade);
  const shoulders = spec.shoulders ?? (spec.length === 'none' ? skin : spec.sleeve ?? cloth);
  art.rect(7, 20, 1, 3, shoulders.base); art.rect(16, 20, 1, 3, shoulders.shade);
  if (b.front) art.rect(10, 20, 5, 1, cloth.shade);
  for (const arm of b.arms) paintArm(b, arm, spec);
  spec.detail?.(b);
  if (b.look.watch && b.front && !b.typing) { const near = b.arms.find((arm) => arm.side === 0); if (near) { art.rect(near.x, near.to, 2, 1, HD_INK.watch); art.set(near.x + 1, near.to, HD_INK.watchFace); } }
}

/** An arm: the sleeve as far as it goes, then skin; seated from the front, the forearm forward; the hand. */
function paintArm(b: Body, arm: Arm, spec: Top) {
  const { art, skin } = b;
  if (b.raising && arm.side === 1) return;
  const sleeve = spec.sleeve ?? skin;
  const covered = (row: number) => spec.length === 'long' || (spec.length === 'short' && row <= arm.from + 2);
  for (let row = arm.from; row <= arm.to; row++) {
    const tones = covered(row) ? sleeve : skin;
    art.set(arm.x, row, arm.side ? tones.base : tones.light); art.set(arm.x + 1, row, arm.side ? tones.shade : tones.base);
  }
  if (spec.length === 'long' && spec.cuff && !arm.forearm) art.rect(arm.x, arm.to, 2, 1, spec.cuff);
  if (arm.forearm) {
    const { x, y, width } = arm.forearm;
    const tones = spec.length === 'long' ? sleeve : skin;
    art.rect(x, y, width, 2, tones.base); art.rect(x, y + 1, width, 1, tones.shade); art.rect(x + 1, y, Math.max(1, width - 2), 1, tones.light);
    if (spec.length === 'long' && spec.cuff) art.rect(x + width - 1, y, 1, 2, spec.cuff);
  }
  const hand = b.look.top === 'kakashiVest' ? hdTones(C.glove) : skin;
  art.rect(arm.hand.x, arm.hand.y, 2, 2, hand.base); art.set(arm.hand.x + 1, arm.hand.y + 1, hand.shade); art.set(arm.hand.x, arm.hand.y, hand.light);
}

/** The far arm raised beside the head, the hand waving (drawn after the head, on its own layer, so it reads over it). */
export function paintRaisedArm(art: Art, b: Body) {
  const spec = topOf(b.look, b);
  const skin = b.skin;
  const sleeve = b.look.top === 'blanket' ? hdTones(b.look.topColor) : spec.sleeve ?? skin;
  const long = b.look.top === 'blanket' || spec.length === 'long';
  for (let row = 14; row <= 21; row++) {
    const x = Math.round(17.4 + (21 - row) * 0.9);
    const tones = long || row >= 19 ? (spec.length === 'none' && b.look.top !== 'blanket' ? skin : sleeve) : skin;
    art.set(x, row, tones.light); art.set(x + 1, row, tones.base); art.set(x + 2, row, row > 18 ? tones.shade : tones.base);
  }
  const hand = b.look.top === 'kakashiVest' ? hdTones(C.glove) : skin;
  ball(art, 25.6 + b.step, 11.6 - b.step * 0.5, 1.9, 2, hand);
  // the thumb
  art.set(23 + b.step, 12, hand.base);
}

/** A blanket wrapped all round, the head poking out of it: a soft lump with a few folds. */
function paintBlanket(b: Body) {
  const { art } = b;
  const cloth = hdTones(b.look.topColor);
  const sway = b.walk ? (b.step ? 1 : -1) : 0;
  const bottom = b.sit ? 31 : 35;
  band(art, 17, bottom, (row) => { const t = (row - 17) / (bottom - 17); const half = 6 + Math.sin(Math.min(1, t * 1.3) * Math.PI * 0.6) * 4.5; return [12 - half + sway * t, 12 + half + sway * t]; }, (x, row) => (row >= bottom - 1 ? cloth.shade : x < 6 ? cloth.light : x > 17 ? cloth.shade : cloth.base));
  for (let row = 21; row < bottom - 1; row++) art.set(Math.round(14 + (row - 21) * 0.25 + sway * 0.5), row, cloth.shade);
  for (let row = 23; row < bottom - 2; row++) art.set(Math.round(8 - (row - 23) * 0.2), row, cloth.light);
  art.rect(9, 18, 6, 2, cloth.light);
  // the feet peeking out under it, when standing
  if (!b.sit) for (const leg of b.legs) { art.rect(leg.shoeX + 1, 34, 2, 2, b.skin.base); art.set(leg.shoeX + 1, 35, b.skin.shade); }
}
