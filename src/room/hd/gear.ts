// The gear the HD people wear on the body (src/room/chibi-hd.ts): round the neck, on a shoulder, on the back, at the
// waist, in the hand, and a festival's water gun; what hangs behind the body (a cape, wings, a shell's rim) is painted
// before it, the rest after. In the look's colours where the classic room uses them (wardrobe.ts), their own otherwise.
import { COSTUME_COLORS as C, PEOPLE_INK as INK, WARDROBE_COLORS as W } from '../../design/people-palette.ts';
import { ROOM_PALETTE } from '../../design/room-palette.ts';
import { cape } from './body.ts';
import { ball, flipRows, hdTones, type Art, type Body } from './kit.ts';

const F = ROOM_PALETTE.festive;

/** Feathered wings, the left one from this grid, the right one mirrored; their inner columns join the back. */
const WING = [
  'll..........',
  'lhl.........',
  'lhbl........',
  'lhbbll......',
  '.lhbbbbll...',
  '.lhbbbbbbbl.',
  '.lbbbbbbbbbs',
  '..sbbsbbbbs.',
  '..sbsbbbbs..',
  '...sbsbbs...',
  '...s.sbs....',
  '......s.....',
];

function wings(art: Art, colour: string, y: number) {
  const feathers = hdTones(colour), shine = hdTones(feathers.light).light;
  art.pattern(-6, y, WING, { h: shine, l: feathers.light, b: feathers.base, s: feathers.shade });
  art.pattern(18, y, flipRows(WING), { h: feathers.light, l: feathers.base, b: feathers.shade, s: feathers.dark });
}

/** A round shield: painted quarters, a wooden rim, an iron boss; `rim`: only the rim showing round the body. */
function shield(art: Art, colour: string, rim: boolean) {
  const paint = hdTones(colour);
  for (let y = 16; y <= 34; y++) for (let x = 2; x <= 22; x++) {
    const d = Math.hypot(x + 0.5 - 12, y + 0.5 - 25);
    if (d > 9 || (rim && d <= 7.6)) continue;
    const quarter = (x < 12) === (y < 25);
    art.set(x, y, d > 7.8 ? ((x + y) % 3 ? W.wood : W.woodDark) : d < 1.6 ? (x < 12 && y < 25 ? W.steelLight : W.steelDark) : d < 2.5 ? W.steel : quarter ? (x < 12 ? paint.light : paint.base) : x < 12 ? W.white : W.whiteShade);
  }
}

/** A turtle's shell: a dome of plates lit from the top left, a notched rim; `rim`: only its edge round the body. */
function shell(art: Art, colour: string, rim: boolean) {
  const plates = hdTones(colour);
  const inside = (x: number, y: number) => ((x + 0.5 - 12) / 10) ** 2 + ((y + 0.5 - 25) / 8.5) ** 2 <= 1;
  for (let y = 16; y <= 34; y++) for (let x = 1; x <= 23; x++) {
    if (!inside(x, y)) continue;
    const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1) || !inside(x - 1, y - 1) || !inside(x + 1, y + 1);
    if (rim && !edge && !(!inside(x - 2, y) || !inside(x + 2, y))) continue;
    const seam = !rim && ((y === 22 || y === 28) || (x === 9 && y < 31) || (x === 15 && y < 31));
    art.set(x, y, edge ? ((x + y) % 2 ? W.shellRim : W.shellRimDark) : seam ? plates.dark : x < 8 ? plates.light : x > 16 ? plates.shade : plates.base);
  }
}

/** What hangs behind the body, painted before it: a cape, the back gear's edges, a space helmet's glass. */
export function paintGearBehind(art: Art, b: Body, helmet: boolean) {
  const look = b.worn;
  if (helmet) art.ellipse(12, 9.5, 13.6, 13.3, W.glass);
  if (b.front && look.top === 'wizardCape') cape(b, hdTones(look.topColor), false);
  if (look.top === 'blanket') return;
  switch (look.backGear) {
    case 'jetpack': if (b.front) for (const [x, tone] of [[2, W.steel], [20, W.steelDark]] as const) { art.rect(x, 19, 3, 9, tone); art.rect(x, 19, 3, 2, W.red); art.rect(x + 1, 28, 1, 1, W.rubber); } break;
    case 'backpack': if (b.front) { const bag = hdTones(W.bag); art.rect(2, 21, 3, 8, bag.shade); art.rect(2, 21, 3, 1, bag.base); art.rect(19, 21, 3, 8, bag.dark); } break;
    case 'backSword':
      if (!b.front) break;
      for (const [x, y] of [[19, 19], [20, 18], [21, 17], [22, 16]]) { art.set(x, y, (x + y) % 2 ? W.leather : W.leatherDark); art.set(x + 1, y, W.leatherDark); }
      art.points([[23, 15], [24, 14]], W.gold); art.points([[17, 19], [18, 20], [19, 21]], W.gold); art.rect(3, 29, 1, 4, W.steel);
      break;
    case 'guitar': if (b.front) { art.rect(19, 13, 2, 7, W.fret); art.rect(19, 10, 3, 3, W.guitarDark); art.points([[19, 11], [21, 11]], W.steelLight); } break;
    case 'shell': if (b.front) shell(art, look.backColor, true); break;
    case 'wings': if (b.front) wings(art, look.backColor, 14); break;
    case 'quiver': if (b.front) { for (const [x, y] of [[2, 15], [4, 14]]) { art.rect(x, y, 1, 3, W.red); art.rect(x + 1, y + 2, 1, 4, W.fret); } art.set(3, 15, W.white); } break;
    case 'shield': if (b.front) shield(art, look.backColor, true); break;
  }
}

/** The gear worn over the body, after the top: round the neck, on the shoulders, on the back, at the waist, in hand. */
export function paintGear(art: Art, b: Body) {
  const look = b.worn, front = b.front;
  const covered = look.top === 'blanket';
  // a knitted scarf in the accent colour, striped, one end hanging down
  if (look.neckGear === 'scarf') {
    const wool = hdTones(look.accentColor);
    art.rect(6, 19, 12, 3, wool.base); art.rect(6, 21, 12, 1, wool.shade); art.set(6, 19, wool.light);
    for (let x = 7; x < 18; x += 3) art.set(x, 20, wool.light);
    const end = front ? 13 : 9;
    for (let row = 22; row <= 27; row++) art.rect(end, row, 3, 1, row % 2 ? W.white : wool.base);
    art.rect(end, 28, 3, 1, wool.shade); art.set(end + 2, 22, wool.shade);
  }
  if (look.neckGear === 'lei') {
    const petals = [W.petalPink, W.petalYellow, W.petalWhite, W.petalRed, W.petalPurple];
    const spots = front ? [[6, 20], [8, 22], [10, 23], [13, 23], [15, 22], [17, 20]] : [[6, 20], [9, 20], [12, 20], [15, 20], [17, 20]];
    spots.forEach(([x, y], index) => { art.rect(x, y, 2, 2, petals[index % petals.length]); art.set(x + (index % 2), y, W.petalYellow); art.set(x + 1 - (index % 2), y + 1, petals[(index + 2) % petals.length]); });
  }
  if (!covered) switch (look.backGear) {
    case 'jetpack':
      if (front) { art.rect(9, 21, 1, 7, W.strap); art.rect(14, 21, 1, 7, W.strap); art.rect(9, 24, 6, 1, W.strap); break; }
      for (const x of [7, 13]) { art.rect(x, 19, 4, 10, W.steel); art.rect(x, 19, 1, 10, W.steelLight); art.rect(x + 3, 19, 1, 10, W.steelDark); art.rect(x, 19, 4, 2, W.red); art.rect(x + 1, 29, 2, 1, W.rubber); }
      art.rect(11, 22, 2, 4, W.steelDark); art.set(11, 23, W.neonLime);
      break;
    case 'backpack': {
      const bag = hdTones(W.bag);
      if (front) { art.rect(9, 21, 1, 6, W.strap); art.rect(14, 21, 1, 6, W.strap); break; }
      art.rect(7, 20, 10, 9, bag.base); art.rect(7, 20, 2, 9, bag.light); art.rect(15, 20, 2, 9, bag.shade); art.rect(7, 20, 10, 2, bag.shade);
      art.rect(9, 24, 6, 4, bag.light); art.rect(9, 24, 6, 1, W.strap); art.set(12, 22, W.steelLight);
      break;
    }
    case 'backSword':
      if (front) { for (let i = 0; i < 8; i++) art.set(8 + i, 20 + i, W.leather); break; }
      for (let i = 0; i < 16; i++) { const x = 19 - i, y = 15 + i; art.set(x, y, i < 4 ? W.leather : i === 4 ? W.gold : i % 2 ? W.steel : W.steelLight); if (i >= 5) art.set(x + 1, y, W.steelDark); }
      art.rect(13, 19, 4, 1, W.gold); art.set(20, 14, W.gold);
      break;
    case 'guitar': {
      const wood = hdTones(W.guitar);
      if (front) {
        for (let i = 0; i < 9; i++) art.set(8 + Math.floor(i * 0.9), 20 + i, W.strap);
        for (let i = 0; i < 8; i++) art.set(13 + i, 25 - i, W.fret);
        ball(art, 10, 27, 4.4, 3.4, wood); art.rect(9, 27, 2, 1, W.guitarDark); art.set(8, 28, W.fret);
      } else {
        for (let i = 0; i < 10; i++) art.set(16 - i, 24 - i, W.fret);
        ball(art, 14, 26.5, 4.6, 3.6, { light: wood.shade, base: wood.shade, shade: wood.dark, dark: wood.dark });
        art.rect(4, 12, 3, 3, W.guitarDark);
        for (let i = 0; i < 9; i++) art.set(8 + Math.floor(i * 0.9), 20 + i, W.strap);
      }
      break;
    }
    case 'shell': if (!front) shell(art, look.backColor, false); break;
    case 'wings': if (!front) wings(art, look.backColor, 14); break;
    case 'quiver':
      if (front) { for (let i = 0; i < 8; i++) art.set(8 + i, 20 + i, W.leather); break; }
      for (let t = 0; t < 13; t++) { const x = 17 - Math.floor(t * 0.8); art.rect(x - 1, 17 + t, 3, 1, t === 0 ? W.gold : t % 3 ? W.leather : W.leatherDark); }
      for (const [x, y] of [[18, 13], [20, 14], [16, 14]]) { art.rect(x, y, 1, 2, W.red); art.rect(x - 1, y + 2, 1, 2, W.fret); }
      art.set(19, 14, W.white);
      break;
    case 'shield': if (front) { for (let i = 0; i < 8; i++) art.set(15 - i, 20 + i, W.leather); break; } shield(art, look.backColor, false); break;
  }
  // a parrot on the shoulder: the near one from the front, the far one from behind
  if (look.shoulderGear === 'parrot') {
    const rows = front ? ['.rr..', 'rwrry', 'rkrr.', 'grrr.', 'ggrr.', 'ggrr.', '.bb..', '.b...'] : ['.rr..', 'rrrr.', 'rrrr.', 'grrr.', 'gggr.', 'gggr.', '.bb..', '..b..'];
    art.pattern(front ? 2 : 18, 11, rows, { r: W.red, w: INK.eyeWhite, k: INK.pupil, y: W.yellow, g: W.green, b: W.blue });
  }
  if (look.shoulderGear === 'cat') {
    const fur = hdTones(W.orange);
    const rows = front
      ? ['o...o.', 'oo.oo.', 'oosoo.', 'okook.', 'owpwo.', '.www..', 'ooooo.', 'soooo.', 's.....', 's.....', '.s....']
      : ['.o...o', '.oo.oo', '.ooooo', '.ososo', '.ooooo', '..ooo.', '.ooooo', '.oooos', '.....s', '.....s', '....s.'];
    art.pattern(front ? 1 : 17, 9, rows, { o: fur.base, s: fur.shade, w: W.white, k: INK.pupil, p: W.petalPink });
  }
  // swords at the hip: the far side from the front, the near one from behind; an earring each for their swordsman
  if (!covered && (look.waistGear === 'swords' || look.waistGear === 'katana')) {
    const blades = look.waistGear === 'swords' ? [[C.wado, C.wado], [C.kitetsu, C.kitetsuSheath], [C.shusui, C.shusui]] as const : [[W.strap, W.sheath]] as const;
    blades.forEach(([hilt, sheath], index) => {
      for (let t = 0; t < 11; t++) {
        const dx = index + Math.floor(t * 0.6);
        art.set(front ? 15 + dx : 8 - dx, 23 + t, t < 3 ? hilt : t === 3 ? C.gold : sheath);
      }
    });
    if (look.waistGear === 'swords' && front) art.points([[4, 16], [5, 16], [4, 17]], C.gold);
  }
  // a staff in the far hand, a glowing orb on top; a lantern on a short pole; put down while the hand is raised or typing
  if (!covered && !b.typing && !b.raising && !b.sit && look.handGear === 'staff') {
    const x = front ? 19 : 4, shift = b.walk ? (b.step ? -1 : 0) : 0;
    art.rect(x, 3 + shift, 1, 33 - shift, W.wood); art.rect(x, 30, 1, 6, W.woodDark);
    ball(art, x + 0.5, 1.5 + shift, 2.4, 2.4, hdTones(W.neonCyan)); art.set(x - 1, 0 + shift, W.lensShine);
  }
  if (!covered && !b.typing && !b.raising && look.handGear === 'lantern') {
    const hand = b.arms.find((arm) => arm.side === (front ? 1 : 0));
    if (hand) {
      const side = front ? 1 : -1, x0 = hand.hand.x + (front ? 1 : 0), y0 = hand.hand.y;
      [[0, 0], [1, -1], [1, -2], [2, -3], [2, -4], [3, -5]].forEach(([dx, dy], index) => { art.set(x0 + side * dx, y0 + dy, index % 2 ? W.woodDark : W.wood); });
      const x = x0 + side * 4;
      art.set(x, y0 - 5, W.strap); art.rect(x - 1, y0 - 4, 3, 1, W.steelDark); art.rect(x - 1, y0 - 3, 3, 3, W.flameCore); art.set(x, y0 - 2, W.flame); art.rect(x - 1, y0, 3, 1, W.steelDark);
    }
  }
}

/** A water gun in the near hand, pointing ahead, its tank on top. */
export function paintWaterGun(art: Art, b: Body) {
  if (!b.outfit.waterGun || !b.front || b.typing || b.look.top === 'blanket') return;
  const near = b.arms.find((arm) => arm.side === 0);
  if (!near) return;
  const { x, y } = near.hand;
  const gun = hdTones(F.waterGun);
  art.rect(x - 4, y - 1, 6, 2, gun.base); art.rect(x - 4, y - 1, 6, 1, gun.light); art.rect(x, y + 1, 2, 2, gun.shade);
  art.rect(x - 3, y - 3, 3, 2, F.waterGunTank); art.set(x - 3, y - 3, hdTones(F.waterGunTank).light); art.set(x - 5, y - 1, gun.dark);
}

/** The flames under a jetpack, flickering with the step, over the outline. */
export function paintGlow(art: Art, b: Body) {
  if (b.worn.backGear !== 'jetpack' || b.worn.top === 'blanket') return;
  const flame = b.step ? [[0, W.flameCore], [1, W.flame], [2, W.flame]] as const : [[0, W.flameCore], [1, W.flame]] as const;
  const nozzles = b.front ? [3, 21] : [8, 9, 14, 15];
  for (const x of nozzles) for (const [dy, colour] of flame) art.set(x, (b.front ? 29 : 30) + dy, colour);
}
