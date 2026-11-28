// The people of the cozy rooms in "HD" chibi pixel art: about 24 x 36 art pixels drawn one room pixel each, a big head
// (some 60% of them), big shiny eyes, rosy cheeks, a warm outline and three tones of shading, from the same Look and
// Outfit as the classic room's people (chibi.ts): every trait drawn again at this size (hd/*.ts). Seen three-quarters
// from the front (down-right) or from behind (up-right); the left-facing poses are those, mirrored. Each pose is
// painted once on a grid (pure, tested without a DOM), laid on its own little canvas, and kept.
import type { Look } from '../../shared/look.ts';
import { DEFAULT_LOOK } from '../design/people-palette.ts';
import { paintFeet, paintLegs, paintRaisedArm, paintTop } from './hd/body.ts';
import { HEAD, paintBeard, paintEar, paintFaceSkin, paintFeatures, paintGlasses } from './hd/face.ts';
import { paintGear, paintGearBehind, paintGlow, paintWaterGun } from './hd/gear.ts';
import { paintFringe, paintHairBehind, paintHairCap, paintHairOver, paintHairOverBack, showsEar, type HairPaint } from './hd/hair.ts';
import { coversHead, paintEyeGear, paintFaceGear, paintHat, paintHeadphones, paintSmoke } from './hd/headwear.ts';
import { ANCHOR, BOX, OUTLINE, ball, hdTones, layer, newArt, type Arm, type Art, type Body, type Frame, type Leg } from './hd/kit.ts';
import { NO_OUTFIT, outfitKey, wornOutfit, type Outfit } from './outfits.ts';
import { artCanvas } from './pixel-art.ts';
import type { Pose, SpriteSource } from './sprites.ts';

export { ANCHOR as HD_ANCHOR, BOX as HD_BOX } from './hd/kit.ts';

/** The legs of a frame: standing, a step (one leg lifted and forward), or the shins under the lap, seated from the front. */
function legsOf(frame: Frame): Leg[] {
  if (frame.posture === 'sit') return frame.back ? [] : [{ x: 11, last: 32, shoeX: 10, shoeY: 33, side: 0 }, { x: 15, last: 32, shoeX: 15, shoeY: 33, side: 1 }];
  let near: Leg = { x: 9, last: 33, shoeX: 8, shoeY: 34, side: 0 };
  let far: Leg = { x: 13, last: 33, shoeX: 13, shoeY: 34, side: 1 };
  if (frame.posture === 'walk' && frame.step === 0) far = { x: 14, last: 32, shoeX: 14, shoeY: 33, side: 1 };
  if (frame.posture === 'walk' && frame.step === 1) near = { x: 8, last: 32, shoeX: 7, shoeY: 33, side: 0 };
  return [near, far];
}

/** The arms of a frame: hanging and swinging, or bent forward to the keys (the hands taking turns while typing). */
function armsOf(frame: Frame): Arm[] {
  const typing = frame.gesture === 'typing';
  const lifted = (side: 0 | 1) => (typing && frame.step === side ? -1 : 0);
  if (frame.posture === 'sit' && !frame.back) return [
    { x: 5, from: 21, to: 24, hand: { x: 11, y: 25 + lifted(0) }, side: 0, forearm: { x: 5, y: 25, width: 6 } },
    { x: 17, from: 21, to: 23, hand: { x: 20, y: 24 + lifted(1) }, side: 1, forearm: { x: 17, y: 24, width: 3 } },
  ];
  if (frame.posture === 'sit') return [
    { x: 5, from: 21, to: 23, hand: { x: 4, y: 24 + lifted(0) }, side: 0 },
    { x: 17, from: 21, to: 23, hand: { x: 18, y: 24 + lifted(1) }, side: 1 },
  ];
  const swing = frame.posture === 'walk' ? frame.step : -1;
  return [
    { x: 5, from: 21, to: swing === 0 ? 25 : 26, hand: { x: 5, y: swing === 0 ? 26 : 27 }, side: 0 },
    { x: 17, from: 21, to: swing === 1 ? 25 : 26, hand: { x: 17, y: swing === 1 ? 26 : 27 }, side: 1 },
  ];
}

/** The highest row of the head under its hair, and with what stands up from it (a bun, spikes), from the front. */
const tops = new Map<string, number>();
function headTop(look: Look, hatted: boolean): number {
  const key = `${look.hair}|${hatted}`;
  let top = tops.get(key);
  if (top === undefined) {
    const art = newArt();
    const h: HairPaint = { art, look, hair: hdTones(look.hairColor), skin: hdTones(look.skin), front: true, hatted };
    ball(art, HEAD.cx, HEAD.cy, HEAD.rx, HEAD.ry, h.skin);
    paintHairCap(h);
    paintHairOver(h);
    top = topRow(art, 4, 20);
    tops.set(key, top);
  }
  return top;
}

/** The first row with something drawn on it, between two columns (all of them by default). */
function topRow(art: Art, from: number = BOX.x0, to: number = BOX.x0 + BOX.width - 1): number {
  for (let row = 0; row < BOX.height; row++) for (let x = from; x <= to; x++) if (art.cells[row * BOX.width + x - BOX.x0]) return row + BOX.y0;
  return ANCHOR.stand;
}

/** The head: the neck, the head ball, the hair, the face and its features (from the front), what is worn on it. */
function paintHead(art: Art, b: Body) {
  const { skin, look } = b;
  const hat = b.outfit.hat;
  const hatted = coversHead(hat);
  const h: HairPaint = { art, look, hair: b.hair, skin, front: b.front, hatted };
  art.rect(10, 18, 4, 3, skin.shade);
  ball(art, HEAD.cx, HEAD.cy, HEAD.rx, HEAD.ry, skin);
  paintHairCap(h);
  if (b.front) {
    paintFaceSkin(art, skin);
    paintFeatures(b);
    paintBeard(b);
    paintFringe(h);
    paintHairOver(h);
    if (showsEar(look, true)) paintEar(art, skin, true);
  } else {
    paintHairOver(h);
    if (showsEar(look, false)) paintEar(art, skin, false);
    paintBeard(b);
  }
  paintFaceGear(art, b);
  paintEyeGear(art, b);
  paintGlasses(b, b.outfit.sunglasses === true);
  if (b.outfit.headphones) layer(art, (part) => paintHeadphones(part, b, headTop(look, false)));
  if (hat) layer(art, (part) => paintHat(part, b, hat, b.outfit.hatColor, headTop(look, hatted)));
}

/** A frame of a look in an outfit, facing right (down-right, or up-right from behind), on its grid. */
function paint(worn: Look, frame: Frame, outfit: Outfit): Art {
  // in swimwear the blanket comes off: a tank top in the top's colour, swim shorts, flip-flops
  const swim = outfit.swimwear === true;
  const look: Look = swim ? { ...worn, top: worn.top === 'none' ? 'none' : 'tank', bottom: 'shorts', shoes: 'flipflops' } : worn;
  const art = newArt();
  const front = !frame.back;
  const b: Body = {
    art, look, worn: look, outfit, front, sit: frame.posture === 'sit', walk: frame.posture === 'walk', step: frame.step, frame,
    bob: frame.posture === 'walk' && frame.step === 1 ? -1 : 0, swim, skin: hdTones(look.skin), hair: hdTones(look.hairColor),
    legs: legsOf(frame), arms: armsOf(frame), raising: frame.gesture === 'raising', typing: frame.gesture === 'typing' && frame.posture === 'sit',
  };
  const h: HairPaint = { art, look, hair: b.hair, skin: b.skin, front, hatted: coversHead(outfit.hat) };
  art.dy = b.bob;
  paintGearBehind(art, b, outfit.hat === 'spaceHelmet');
  paintHairBehind(h);
  art.dy = 0;
  if (look.top !== 'blanket') { paintLegs(b); paintFeet(b); }
  art.dy = b.bob;
  paintTop(b);
  if (!front) paintHairOverBack(h);
  paintGear(art, b);
  paintHead(art, b);
  paintWaterGun(art, b);
  if (b.raising) layer(art, (part) => paintRaisedArm(part, b));
  art.dy = 0;
  art.outline(OUTLINE);
  art.dy = b.bob;
  paintSmoke(art, b);
  paintGlow(art, b);
  art.dy = 0;
  return art;
}

/** The frame a pose needs: what does not show is left out, so the same picture is kept once. */
function frameOf(pose: Pose): Frame {
  const back = pose.direction.startsWith('up');
  const moving = pose.posture === 'walk' || pose.gesture === 'raising' || (pose.gesture === 'typing' && pose.posture === 'sit');
  return {
    back, posture: pose.posture, step: moving ? pose.step : 0, blinking: !back && pose.blinking, smiling: !back && pose.smiling,
    gesture: pose.gesture === 'typing' && pose.posture !== 'sit' ? 'none' : pose.gesture,
  };
}

/** A look's traits in a fixed order, whatever order its fields came in. */
const lookKey = (look: Look) => JSON.stringify(Object.keys(look).sort().map((key) => [key, look[key as keyof Look]]));

/** What a sprite is kept under: the look, the frame its pose needs, the side it faces, what the festival adds. */
export function hdKey(look: Look, pose: Pose, festive: Outfit = NO_OUTFIT): string {
  const frame = frameOf(pose);
  return `${lookKey(look)}|${frame.back}|${frame.posture}|${frame.step}|${frame.blinking}|${frame.smiling}|${frame.gesture}|${pose.direction.endsWith('left')}|${outfitKey(wornOutfit(look, festive))}`;
}

/** A look in a pose (and a festival's outfit) on its grid, facing right. Pure. */
export const hdArt = (look: Look, pose: Pose, festive: Outfit = NO_OUTFIT): Art => paint(look, frameOf(pose), wornOutfit(look, festive));

/** Where a pose's anchor is: under the soles standing, under the hips seated. */
const anchorRow = (pose: Pose) => (pose.posture === 'sit' ? ANCHOR.sit : ANCHOR.stand);

interface Kept { art: Art; top: number; canvas?: HTMLCanvasElement }
const kept = new Map<string, Kept>();
function keptFor(look: Look, pose: Pose, festive: Outfit): Kept {
  const key = hdKey(look, pose, festive);
  let found = kept.get(key);
  if (!found) {
    const art = hdArt(look, pose, festive);
    found = { art, top: topRow(art) };
    kept.set(key, found);
  }
  return found;
}

/** How far above the anchor the top of the person (hat included) is, in art pixels. Pure. */
export const hdHeight = (look: Look, pose: Pose, festive: Outfit = NO_OUTFIT) => anchorRow(pose) - keptFor(look, pose, festive).top;

/** The canvas of a look in a pose, BOX.width x BOX.height, drawn the first time it is needed (mirrored facing left). */
export function hdSprite(look: Look, pose: Pose, festive: Outfit = NO_OUTFIT): HTMLCanvasElement {
  const found = keptFor(look, pose, festive);
  if (!found.canvas) {
    const { canvas, context } = artCanvas(BOX.width, BOX.height);
    if (pose.direction.endsWith('left')) { context.translate(BOX.width, 0); context.scale(-1, 1); }
    found.art.paint(context, 0, 0);
    found.canvas = canvas;
  }
  return found.canvas;
}

/** The square of the sprite holding the head, in art pixels. */
const HEAD_BOX = { x: 0, y: -2, size: 24 };

/** The crew editor's preview: the part of the sprite shown (hats and gear included), in art pixels, four screen pixels each (the classic 26x36 at six). */
export const HD_PREVIEW = { x: -7, y: -17, width: 39, height: 54, scale: 4 } as const;
/**
 * The editor's tabs are found by the classic preview's rows (CrewDialog TAB_AT: the head to row 21, the top to 27, the
 * bottom to 31, the shoes below): the row of the HD preview at `fraction` of its height, told in those rows.
 */
export function hdPreviewRow(fraction: number): number {
  const y = HD_PREVIEW.y + fraction * HD_PREVIEW.height;
  return y <= 20 ? 10 : y <= 27 ? 24 : y <= 32 ? 29 : 34;
}

/** HD people drawn one room pixel per art pixel; `outfitFor`: what a festival puts on them. Typing hands are in the sprite. */
export function hdSprites(lookFor: (personId: string) => Look, outfitFor: (personId: string) => Outfit = () => NO_OUTFIT): SpriteSource {
  return {
    height: (pose, personId) => (personId === undefined ? hdHeight(DEFAULT_LOOK, pose) : hdHeight(lookFor(personId), pose, outfitFor(personId))),
    draw(context, personId, pose, x, y) {
      const sprite = hdSprite(lookFor(personId), pose, outfitFor(personId));
      const previous = context.imageSmoothingEnabled;
      context.imageSmoothingEnabled = false;
      context.drawImage(sprite, Math.round(x - (ANCHOR.x - BOX.x0)), Math.round(y - (anchorRow(pose) - BOX.y0)));
      context.imageSmoothingEnabled = previous;
    },
    drawTypingHand() { /* the HD sprite's hands are on the keys already */ },
    drawHead(context, personId, x, y, size) {
      const sprite = hdSprite(lookFor(personId), { direction: 'down-right', posture: 'stand', step: 0, blinking: false, smiling: false, gesture: 'none' });
      context.drawImage(sprite, HEAD_BOX.x - BOX.x0, HEAD_BOX.y - BOX.y0, HEAD_BOX.size, HEAD_BOX.size, Math.round(x), Math.round(y), size, size);
    },
  };
}
