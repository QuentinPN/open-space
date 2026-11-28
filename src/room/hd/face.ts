// The HD people's faces (src/room/chibi-hd.ts): seen three-quarters, turned to the right, the face is an oval a little
// right of the head's middle; big eyes with a dark lid, a glint and a two-tone iris (x 10-11 and 16-17, rows 12-14),
// rosy cheeks, a small mouth; every eye style, beard and pair of glasses of shared/look.ts. From behind, only what
// shows past the head: an ear, a beard's edge, the arm of the glasses.
import { HD_INK, WARDROBE_COLORS as W } from '../../design/people-palette.ts';
import { ROOM_PALETTE } from '../../design/room-palette.ts';
import { OUTLINE, hdTones, mixHex, type Art, type Body, type Tones } from './kit.ts';

const F = ROOM_PALETTE.festive;

/** The head and the face, in art pixels. */
export const HEAD = { cx: 12, cy: 10.5, rx: 10.5, ry: 9.8 } as const;
export const FACE = { cx: 13.5, cy: 13.7, rx: 7.4, ry: 6.5 } as const;
/** The left column of each eye (the near one first). */
export const EYES_X = [10, 16] as const;

export const inHead = (x: number, y: number) => ((x + 0.5 - HEAD.cx) / HEAD.rx) ** 2 + ((y + 0.5 - HEAD.cy) / HEAD.ry) ** 2 <= 1;
export const inFace = (x: number, y: number) => ((x + 0.5 - FACE.cx) / FACE.rx) ** 2 + ((y + 0.5 - FACE.cy) / FACE.ry) ** 2 <= 1;

/** The iris: the hair's colour leaning to a warm brown, so a pink-haired person gets rosy eyes and a dark-haired one dark eyes. */
export const irisOf = (hairColor: string): Tones => hdTones(mixHex(hairColor, HD_INK.iris, 0.55));

/** The face's oval over the head, its edge shaded at the jaw, the near cheek lit. */
export function paintFaceSkin(art: Art, skin: Tones) {
  art.ellipse(FACE.cx, FACE.cy, FACE.rx, FACE.ry, skin.shade);
  art.ellipse(FACE.cx - 0.3, FACE.cy - 0.4, FACE.rx - 0.3, FACE.ry - 0.3, skin.base, [skin.shade]);
  art.points([[7, 15], [7, 16], [8, 17]], skin.light, [skin.base]);
}

/** The ear on the back side of the face (from the front), or on the right of the head (from behind). */
export function paintEar(art: Art, skin: Tones, front: boolean) {
  if (front) { art.rect(4, 13, 2, 3, skin.base); art.set(5, 14, skin.shade); art.set(4, 13, skin.light); art.set(5, 16, skin.shade); }
  else { art.rect(20, 12, 2, 3, skin.base); art.set(21, 14, skin.shade); art.set(20, 12, skin.shade); }
}

/** The eyes in their style (blinking: shut, except a cyborg's lamp), the cheeks and the mouth, smiling or not. */
export function paintFeatures(b: Body) {
  const { art, look, frame } = b;
  const iris = irisOf(look.hair === 'none' ? HD_INK.iris : look.hairColor);
  const lid = OUTLINE;
  // each eye 2 x 3 under its lid: a glint at the top, the iris dark above and lit below
  const eye = (x: number) => {
    art.points([[x, 11], [x + 1, 11]], lid); art.set(x, 12, HD_INK.glint); art.set(x + 1, 12, iris.dark);
    art.set(x, 13, iris.dark); art.set(x + 1, 13, iris.dark); art.set(x, 14, iris.base); art.set(x + 1, 14, iris.light);
  };
  const outer = (x: number) => (x === EYES_X[0] ? x - 1 : x + 2);
  const shut = (x: number) => { art.points([[x, 13], [x + 1, 13]], lid); art.set(outer(x), 12, lid); };
  const arch = (x: number) => { art.points([[x, 12], [x + 1, 12]], lid); art.points([[x - 1, 13], [x + 2, 13]], lid); };
  const corners = () => { art.set(9, 11, lid); art.set(18, 11, lid); };
  const cyborg = look.eyes === 'cyborg';
  if (frame.blinking) {
    for (const x of EYES_X) if (!(cyborg && x === EYES_X[1])) shut(x);
  } else switch (look.eyes) {
    case 'round': for (const x of EYES_X) eye(x); corners(); break;
    // wide open: the white showing round the iris
    case 'wide':
      for (const x of EYES_X) {
        art.points([[x, 10], [x + 1, 10]], lid); art.points([[x, 11], [outer(x), 11], [outer(x), 12], [outer(x), 13]], HD_INK.glint);
        art.set(x + 1, 11, HD_INK.glint); art.set(x, 12, iris.dark); art.set(x + 1, 12, iris.dark); art.set(x, 13, iris.base); art.set(x + 1, 13, iris.light); art.points([[x, 14], [x + 1, 14]], HD_INK.glint);
        art.set(outer(x), 10, lid);
      }
      break;
    case 'sleepy': for (const x of EYES_X) { art.points([[x, 12], [x + 1, 12]], b.skin.shade); art.points([[x, 13], [x + 1, 13]], lid); art.set(x, 14, iris.dark); art.set(x + 1, 14, iris.light); art.set(outer(x), 13, lid); } break;
    // the lashes flick out at the corner, under the fringe's reach (row 10 is the hair's)
    case 'lashes': for (const x of EYES_X) { eye(x); art.points([[outer(x), 11], [outer(x), 12], [outer(x) + (x === EYES_X[0] ? -1 : 1), 11]], lid); } break;
    case 'happy': for (const x of EYES_X) arch(x); break;
    case 'angry':
      for (const x of EYES_X) { art.points([[x, 12], [x + 1, 12]], lid); art.set(x, 13, iris.dark); art.set(x + 1, 13, iris.dark); art.set(x, 14, iris.light); art.set(x + 1, 14, iris.base); }
      break;
    case 'wink': eye(EYES_X[0]); art.set(9, 11, lid); arch(EYES_X[1]); break;
    case 'tired': for (const x of EYES_X) { art.points([[x, 11], [x + 1, 11]], b.skin.shade); art.points([[x, 12], [x + 1, 12]], lid); art.set(x, 13, iris.dark); art.set(x + 1, 13, iris.dark); art.set(x, 14, iris.base); art.set(x + 1, 14, iris.light); art.points([[x, 15], [x + 1, 15]], W.eyeBag); } break;
    case 'starry':
      for (const x of EYES_X) { const cx = x === EYES_X[0] ? x : x + 1; art.points([[cx, 11], [cx - 1, 13], [cx + 1, 13], [cx, 15]], W.star); art.points([[cx, 12], [cx, 14]], W.star); art.set(cx, 13, W.starLight); }
      break;
    // big anime eyes: a heavy lid, a bright iris, two glints
    case 'sparkly':
      for (const x of EYES_X) {
        art.points([[x - 1, 10], [x, 10], [x + 1, 10], [x + 2, 10]], lid); art.set(outer(x), 11, lid);
        art.set(x, 11, HD_INK.glint); art.set(x + 1, 11, W.iris); art.set(x, 12, W.iris); art.set(x + 1, 12, W.iris);
        art.set(x, 13, W.iris); art.set(x + 1, 13, W.irisLight); art.set(x, 14, W.irisLight); art.set(x + 1, 14, HD_INK.glint);
      }
      break;
    case 'cyborg': eye(EYES_X[0]); art.set(9, 11, lid); break;
    case 'laughing':
      for (const x of EYES_X) arch(x);
      art.points([[8, 14], [7, 15], [19, 14], [20, 15]], W.tear); art.points([[7, 16], [20, 16]], hdTones(W.tear).light);
      break;
  }
  if (cyborg) {
    // a steel plate over the far eye, its red lamp lit even when the other eye blinks
    art.rect(15, 10, 4, 5, W.steel); art.rect(15, 10, 4, 1, W.steelLight); art.points([[15, 14], [18, 14]], W.rivet);
    art.rect(16, 11, 2, 2, W.led); art.set(16, 11, W.ledGlow);
  }
  if (look.eyes === 'angry' && !frame.blinking) art.points([[9, 9], [10, 9], [11, 10], [12, 11], [18, 9], [17, 9], [16, 10], [15, 11]], lid);
  // the cheeks, the mouth
  art.points([[8, 15], [9, 15], [18, 15], [19, 15]], HD_INK.blush, [b.skin.base, b.skin.light, b.skin.shade]);
  if (frame.smiling) { art.points([[12, 15], [15, 15]], HD_INK.mouth); art.points([[13, 16], [14, 16]], HD_INK.mouth); }
  else art.points([[13, 16], [14, 16]], HD_INK.mouth);
}

/** Whether a cell of the face is around the mouth, which a beard leaves bare. */
const aroundMouth = (x: number, y: number) => x >= 12 && x <= 15 && y >= 15 && y <= 17;

/** A beard, over the face from the front; its edge past the jaw from behind. */
export function paintBeard(b: Body) {
  const { art, look, frame } = b;
  if (look.beard === 'none') return;
  const beard = hdTones(look.beardColor);
  const mouth = () => (frame.smiling ? art.points([[12, 16], [13, 17], [14, 17], [15, 16]], HD_INK.mouth) : art.points([[13, 17], [14, 17]], HD_INK.mouth));
  const lower = (from: number, colour: (x: number, y: number) => string | null) => {
    for (let y = from; y <= 21; y++) for (let x = 5; x <= 22; x++) if (inFace(x, y)) { const c = colour(x, y); if (c) art.set(x, y, c); }
  };
  const shaded = (x: number, y: number) => (x > 17 || y > 19 ? beard.shade : x < 9 ? beard.light : beard.base);
  if (!b.front) {
    // what shows past the right of the head
    const edge = look.beard === 'goatee' || look.beard === 'mustache' || look.beard === 'stubble' ? null : beard;
    if (edge) for (const [x, y] of [[19, 16], [20, 16], [19, 17], [20, 17], [18, 18], [19, 18], [17, 19], [18, 19]] as const) art.set(x, y, edge.shade);
    if (look.beard === 'long') for (let y = 19; y <= 24; y++) art.rect(17 - Math.floor((y - 19) / 2), y, 2, 1, beard.shade);
    if (look.beard === 'handlebar') art.points([[21, 15], [22, 14], [22, 13]], beard.base);
    if (look.beard === 'stubble') art.points([[19, 16], [20, 17], [18, 18]], mixHex(b.skin.shade, look.beardColor, 0.4));
    return;
  }
  switch (look.beard) {
    case 'stubble': lower(15, (x, y) => ((x + y) % 2 === 0 && !aroundMouth(x, y) && y >= 16 ? mixHex(b.skin.base, look.beardColor, 0.45) : null)); break;
    case 'mustache': art.rect(11, 15, 6, 1, beard.base); art.set(12, 15, beard.light); art.points([[11, 16], [16, 16]], beard.shade); mouth(); break;
    case 'short':
      lower(17, (x, y) => (aroundMouth(x, y) ? null : shaded(x, y)));
      for (let y = 13; y <= 17; y++) art.set(6, y, beard.base);
      art.rect(12, 15, 4, 1, beard.base); mouth();
      break;
    case 'chinstrap':
      lower(13, (x, y) => (!inFace(x - 1, y + 1) || !inFace(x + 1, y + 1) || !inFace(x, y + 1) ? beard.base : null));
      mouth();
      break;
    case 'full': case 'long':
      lower(15, (x, y) => shaded(x, y));
      art.ellipse(13.5, 20, 5.6, 2.4, beard.base); art.ellipse(14.5, 20.6, 4, 1.4, beard.shade, [beard.base]);
      if (look.beard === 'long') for (let y = 21; y <= 27; y++) { const half = 5 - (y - 21) * 0.7; art.rect(Math.round(13.5 - half), y, Math.max(1, Math.round(half * 2)), 1, y > 25 ? beard.shade : beard.base); art.set(Math.round(13.5 - half), y, beard.light); }
      art.points([[10, 17], [16, 19]], beard.light); art.points([[12, 16], [15, 16]], beard.shade);
      mouth();
      break;
    case 'handlebar':
      art.rect(10, 15, 8, 1, beard.base); art.set(11, 15, beard.light); art.points([[9, 14], [8, 13], [8, 12], [18, 14], [19, 13], [19, 12]], beard.base);
      art.rect(12, 19, 4, 2, beard.base); art.rect(13, 21, 2, 1, beard.shade);
      mouth();
      break;
    case 'goatee': art.rect(12, 15, 4, 1, beard.base); art.rect(12, 18, 4, 2, beard.base); art.rect(13, 20, 2, 1, beard.shade); art.set(12, 18, beard.light); mouth(); break;
  }
}

/** Glasses (their frames in the look's colour) or sunglasses, over the eyes; from behind, the arm over the ear. */
export function paintGlasses(b: Body, sunglasses: boolean) {
  const { art, look } = b;
  if (!b.front) {
    if (look.glasses) art.rect(19, 12, 3, 1, look.glasses);
    if (sunglasses) art.rect(19, 12, 3, 1, F.shades);
    return;
  }
  if (sunglasses) {
    for (const x of [9, 15]) { art.rect(x, 11, 4, 4, F.shades); art.set(x + 1, 11, F.shadesShine); art.set(x, 12, F.shadesShine); }
    art.points([[13, 12], [14, 12]], F.shades); art.rect(5, 12, 4, 1, F.shades);
    return;
  }
  if (!look.glasses) return;
  const frame = look.glasses;
  for (const x of [9, 15]) {
    art.rect(x, 10, 4, 1, frame); art.rect(x, 15, 4, 1, frame); art.rect(x, 11, 1, 4, frame); art.rect(x + 3, 11, 1, 4, frame);
    // a hint of glass where the eye leaves room
    for (const [gx, gy] of [[x + 1, 11], [x + 2, 11]]) if (art.get(gx, gy) === b.skin.base) art.set(gx, gy, HD_INK.lens);
  }
  art.points([[13, 12], [14, 12]], frame); art.rect(5, 12, 4, 1, frame);
}
