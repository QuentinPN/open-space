// The furry HD pets (pet-hd.ts): cats in their patterns, dogs in their breeds, a fox, a red panda, a maneki-neko, a
// robot dog and a pocket dragon on the four-legged body plan (quad.ts); a rabbit, a hedgehog, a capybara and a ghost
// cat each in their own way.
import { PET_HD_PALETTE as H, ROOM_PALETTE } from '../../design/room-palette.ts';
import type { CatPattern, DogBreed } from '../../../shared/pets.ts';
import type { PixelGrid } from '../cozy/pixels.ts';
import { type Fur, type Look, type Pose, ball, blush, eyes, eyesOf, furCells, furTones, mix, part, patch, pointedEar } from './kit.ts';
import { type Head, type Quad, type Tail, quadruped } from './quad.ts';

const C = ROOM_PALETTE.pet;
const WHITE = () => furTones(C.white);
const BLACK = () => furTones(C.black);
/** The fur as it is, its paws lit. */
const pawsOf = (fur: Fur): Fur => ({ ...fur, base: fur.light, shade: fur.base });

/* Cats */

/** A small mouth under the nose: a cat's ω, or a tongue out licking. */
function catMouth(layer: PixelGrid, cx: number, y: number, licking = false) {
  layer.rect(cx, y, 2, 1, H.nose);
  if (licking) layer.rect(cx, y + 1, 2, 1, H.tongue);
  else { layer.set(cx - 1, y + 1, H.mouth); layer.set(cx + 2, y + 1, H.mouth); }
}

function catHead(pattern: CatPattern, fur: Fur, iris: string): Head {
  const white = WHITE();
  return (grid, cx, y, state, { flat, licking }) => part(grid, (layer) => {
    const earTop = flat ? y - 1 : y - 3, earHeight = flat ? 3 : 5;
    const calico = pattern === 'calico';
    pointedEar(layer, cx - 4, earTop, earHeight, 1, calico ? { ...fur, base: C.cats.patchA, light: C.cats.patchA } : fur, H.earInside);
    pointedEar(layer, cx + 5, earTop, earHeight, -1, calico ? { ...fur, base: C.cats.patchB, light: C.cats.patchB } : fur, H.earInside);
    ball(layer, cx + 1, y + 5, 7, 5.2, fur);
    const over = furCells(fur);
    if (pattern === 'tabby') { layer.rect(cx, y + 1, 2, 2, fur.dark, over); layer.set(cx - 2, y + 1, fur.dark); layer.set(cx + 3, y + 1, fur.dark); layer.set(cx - 5, y + 5, fur.dark); layer.set(cx + 6, y + 5, fur.dark); }
    if (calico) { patch(layer, cx - 2.5, y + 2.5, 3, 2.6, C.cats.patchA, over); patch(layer, cx + 5, y + 2, 2.2, 2, C.cats.patchB, over); }
    layer.ellipse(cx + 1, y + 8, 2.2, 1.5, pattern === 'tuxedo' || calico ? white.base : fur.light);
    if (pattern === 'tuxedo') layer.rect(cx, y + 5, 2, 2, white.base);
    eyes(layer, cx - 3, cx + 3, y + 4, state, iris);
    catMouth(layer, cx, y + 7, licking);
    blush(layer, cx - 5, y + 7); blush(layer, cx + 5, y + 7);
  });
}

/** A cat's tail: round its paws sitting (its tip flicking), up walking, wrapped round the front asleep. */
function catTail(fur: Fur, { tip, rings }: { tip?: string; rings?: string } = {}): Tail {
  return (grid, { activity, frame }, x, y) => part(grid, (layer) => {
    if (activity === 'sleep') {
      layer.rect(x, -2, 13, 2, fur.base); layer.rect(x, -2, 12, 1, fur.light); layer.rect(x - 1, -3, 2, 2, fur.base);
      if (rings) for (const ring of [x + 2, x + 6, x + 10]) layer.rect(ring, -2, 1, 2, rings);
      if (tip) layer.rect(x - 1, -3, 2, 1, tip);
    } else if (activity === 'walk') {
      layer.rect(x - 1, y - 1, 2, 3, fur.base); layer.rect(x - 2, y - 4, 2, 4, fur.base);
      const tx = x - 2 - frame, ty = y - 8 - frame;
      layer.rect(tx, ty, 2, 5, fur.base); layer.set(tx, ty, fur.light);
      if (rings) { layer.rect(x - 2, y - 3, 2, 1, rings); layer.rect(tx, ty + 2, 2, 1, rings); }
      if (tip) layer.rect(tx, ty, 2, 2, tip);
    } else {
      layer.rect(x - 7, -2, 8, 2, fur.base); layer.rect(x - 7, -2, 7, 1, fur.light);
      const up = frame && activity === 'sit';
      const tx = x - (up ? 9 : 8), ty = up ? -6 : -5;
      layer.rect(tx, ty, 2, up ? 5 : 4, fur.base);
      if (rings) for (const ring of [x - 5, x - 2]) layer.rect(ring, -2, 1, 2, rings);
      if (tip) layer.rect(tx, ty, 2, 2, tip);
    }
  });
}

/** The tabby's stripes, the calico's patches, over the body's fur in the box. */
const catMarks = (pattern: CatPattern, fur: Fur) => (layer: PixelGrid, x: number, y: number, width: number, height: number) => {
  const over = furCells(fur);
  if (pattern === 'tabby') for (let column = x + 2; column < x + width - 1; column += 3) layer.rect(column, y, 1, Math.max(1, height), fur.dark, over);
  if (pattern === 'calico') {
    patch(layer, x + width * 0.3, y + height * 0.6, width * 0.22, height * 0.55, C.cats.patchA, over);
    patch(layer, x + width * 0.75, y + height * 0.3, width * 0.16, height * 0.45, C.cats.patchB, over);
  }
};

function catQuad(pattern: CatPattern, look: Look): Quad {
  const { fur, iris } = look;
  const white = WHITE();
  const whiteFront = pattern === 'tuxedo' || pattern === 'calico';
  return {
    fur, legs: fur, paws: pattern === 'tuxedo' ? white : pawsOf(fur), chest: whiteFront ? white.base : null, long: 0, short: false,
    marks: catMarks(pattern, fur), head: catHead(pattern, fur, iris), licks: true,
    tail: catTail(fur, { tip: whiteFront ? white.light : undefined, rings: pattern === 'tabby' ? fur.dark : undefined }),
  };
}

export const paintCat = (grid: PixelGrid, pattern: CatPattern, look: Look, pose: Pose) => quadruped(grid, catQuad(pattern, look), pose);

/* Dogs */

type Markings = 'none' | 'spots' | 'mask' | 'blaze' | 'black';
/** Each breed's shape and markings: ears that stand (big ones, a corgi's) or hang, a long body, short legs, its tail. */
const BREEDS: Readonly<Record<DogBreed, { pointy: boolean; bigEars?: boolean; long: number; short: boolean; tail: 'straight' | 'curled' | 'stub'; markings: Markings }>> = {
  labrador: { pointy: false, long: 0, short: false, tail: 'straight', markings: 'none' },
  dalmatian: { pointy: false, long: 0, short: false, tail: 'straight', markings: 'spots' },
  husky: { pointy: true, long: 0, short: false, tail: 'curled', markings: 'mask' },
  shiba: { pointy: true, long: 0, short: false, tail: 'curled', markings: 'blaze' },
  corgi: { pointy: true, bigEars: true, long: 4, short: true, tail: 'stub', markings: 'blaze' },
  dachshund: { pointy: false, long: 6, short: true, tail: 'straight', markings: 'none' },
  pug: { pointy: false, long: 0, short: false, tail: 'curled', markings: 'black' },
};

function dogHead(breed: DogBreed, fur: Fur): Head {
  const { pointy, bigEars, markings } = BREEDS[breed];
  const white = WHITE().base, black = C.black;
  return (grid, cx, y, state, { flat, panting }) => {
    part(grid, (layer) => {
      if (pointy) {
        const height = flat ? 3 : bigEars ? 6 : 5, top = flat ? y - 1 : y - height + 2;
        pointedEar(layer, cx - 4 - (bigEars ? 1 : 0), top, height, 1, fur, H.earInside, bigEars ? 0.6 : 0.5);
        pointedEar(layer, cx + 5 + (bigEars ? 1 : 0), top, height, -1, fur, H.earInside, bigEars ? 0.6 : 0.5);
      }
      ball(layer, cx + 1, y + 5, 7, 5.2, fur);
      const over = furCells(fur);
      if (markings === 'mask') { layer.ellipse(cx + 1, y + 8, 6, 3.6, white, over); layer.rect(cx - 3, y + 2, 2, 1, white); layer.rect(cx + 3, y + 2, 2, 1, white); layer.rect(cx, y + 4, 2, 2, fur.base); }
      else if (markings === 'blaze') {
        layer.ellipse(cx + 1, y + 8.5, 4.8, 2.5, white, over);
        if (breed === 'corgi') layer.rect(cx, y + 1, 2, 6, white, over); else { layer.set(cx - 3, y + 2, white); layer.set(cx + 4, y + 2, white); }
      } else if (markings === 'black') { layer.ellipse(cx + 1, y + 8, 3.8, 2.4, black, over); layer.rect(cx, y + 2, 2, 1, fur.shade); }
      else layer.ellipse(cx + 1, y + 8, 3, 1.9, fur.light, over);
      if (markings === 'spots') for (const [x, dy] of [[cx - 3, 1], [cx - 2, 1], [cx + 5, 2], [cx + 6, 7], [cx - 4, 8]] as const) layer.set(x, y + dy, black);
      eyes(layer, cx - 3, cx + 3, y + 4, state);
      layer.rect(cx, y + 7, 2, 1, H.eye);
      if (panting) { layer.rect(cx, y + 8, 2, 1, H.mouth); layer.rect(cx, y + 9, 2, 3, H.tongue); layer.set(cx + 1, y + 11, mix(H.tongue, H.mouth, 0.4)); }
      else { layer.set(cx - 1, y + 8, H.mouth); layer.set(cx + 2, y + 8, H.mouth); }
      blush(layer, cx - 5, y + 7); blush(layer, cx + 5, y + 7);
    });
    if (!pointy) part(grid, (layer) => {
      const ear = markings === 'black' || markings === 'spots' ? furTones(black) : { ...fur, base: fur.shade, light: fur.base };
      const length = breed === 'dachshund' ? 4 : breed === 'pug' ? 2.2 : 3.4;
      for (const ex of [cx - 5, cx + 7]) {
        const top = y + (breed === 'pug' ? 1 : 2);
        layer.ellipse(ex, top + (flat ? 2.4 : length), 1.6, flat ? 2.4 : length, ear.base);
        layer.set(Math.floor(ex), top + 1, ear.light);
      }
    });
  };
}

function dogTail(breed: DogBreed, fur: Fur): Tail {
  const { tail } = BREEDS[breed];
  return (grid, { activity, frame }, x, y) => part(grid, (layer) => {
    if (tail === 'stub') {
      if (activity === 'walk') ball(layer, x + 1, y - 1, 2, 1.8, fur);
      else if (activity !== 'sleep') ball(layer, x - 1, -3, 2, 1.8, fur);
      return;
    }
    if (tail === 'curled') {
      const [cx, cy] = activity === 'walk' ? [x + 2, y - 4] : activity === 'sleep' ? [x + 1, -3] : [x - 3, -6];
      ball(layer, cx, cy, 2.8, 2.6, fur);
      layer.set(Math.floor(cx), Math.floor(cy), fur.shade);
      return;
    }
    if (activity === 'sleep') { layer.rect(x, -2, 7, 2, fur.base); layer.rect(x, -2, 6, 1, fur.light); }
    else if (activity === 'walk') {
      // wagging
      const tip = frame ? [x - 5, y - 4] : [x - 3, y - 7];
      for (const dx of [0, 1]) layer.line(x + dx, y, tip[0] + dx, tip[1], fur.base);
      layer.set(tip[0], tip[1], fur.light);
    } else { layer.rect(x - 6 - frame, -2, 7 + frame, 2, fur.base); layer.rect(x - 6 - frame, -2, 6, 1, fur.light); }
  });
}

export function paintDog(grid: PixelGrid, breed: DogBreed, look: Look, pose: Pose) {
  const { fur } = look;
  const { long, short, markings } = BREEDS[breed];
  const whiteFront = markings === 'mask' || markings === 'blaze';
  quadruped(grid, {
    fur, legs: fur, paws: whiteFront ? WHITE() : pawsOf(fur), chest: whiteFront ? WHITE().base : null, long, short, licks: false,
    marks: markings === 'spots' ? (layer, x, y, width) => { for (let column = x + 2; column < x + width - 1; column += 3) for (const row of [y, y + 2]) layer.rect(column + (row > y ? 1 : 0), row + (column % 2), 1, 1, C.black, furCells(fur)); } : undefined,
    head: dogHead(breed, fur), tail: dogTail(breed, fur), collar: { band: C.collar, tag: C.tag },
  }, pose);
}

/* A fox, a red panda, a maneki-neko */

function foxHead(fur: Fur): Head {
  const white = WHITE().base, black = C.black;
  return (grid, cx, y, state, { flat, licking }) => part(grid, (layer) => {
    const height = flat ? 3 : 6, top = flat ? y - 1 : y - 4;
    pointedEar(layer, cx - 4, top, height, 1, fur, H.earInside, 0.6);
    pointedEar(layer, cx + 5, top, height, -1, fur, H.earInside, 0.6);
    if (!flat) { layer.rect(cx - 5, top, 3, 2, black, furCells(fur)); layer.rect(cx + 4, top, 3, 2, black, furCells(fur)); }
    ball(layer, cx + 1, y + 5, 7, 5.2, fur);
    layer.ellipse(cx + 1, y + 8.6, 6.4, 2.8, white, furCells(fur));
    layer.rect(cx, y + 6, 2, 1, fur.base);
    eyes(layer, cx - 3, cx + 3, y + 4, state);
    layer.rect(cx, y + 7, 2, 1, H.eye);
    if (licking) layer.rect(cx, y + 8, 2, 1, H.tongue); else { layer.set(cx - 1, y + 8, H.mouth); layer.set(cx + 2, y + 8, H.mouth); }
    blush(layer, cx - 5, y + 7); blush(layer, cx + 5, y + 7);
  });
}

/** A fox's brush: lying round its paws, out behind walking, over its nose asleep; tipped white. */
function foxTail(fur: Fur): Tail {
  const white = WHITE().base;
  return (grid, { activity, frame }, x, y) => part(grid, (layer) => {
    if (activity === 'sleep') { layer.turnedEllipse(x + 8, -2.5, 9, 2.4, 0, fur.base); layer.rect(x + 1, -4, 12, 1, fur.light, furCells(fur)); layer.ellipse(x + 16, -2.5, 2.4, 2.2, white, furCells(fur)); }
    else if (activity === 'walk') {
      layer.turnedEllipse(x - 3, y - 2 - frame, 5.5, 2.8, -0.5 - frame * 0.15, fur.base);
      layer.turnedEllipse(x - 4, y - 3 - frame, 3.4, 1.2, -0.5, fur.light, [fur.base]);
      layer.ellipse(x - 7.5, y - 4.5 - frame * 1.5, 2.4, 2.2, white, furCells(fur));
    } else {
      layer.turnedEllipse(x - 4, -3, 6, 2.8, 0.25 - frame * 0.2 * (activity === 'sit' ? 1 : 0), fur.base);
      layer.rect(x - 8, -5, 6, 1, fur.light, furCells(fur));
      layer.ellipse(x - 9.5, -4 - (activity === 'sit' ? frame : 0), 2.2, 2.2, white, furCells(fur));
    }
  });
}

function redPandaHead(fur: Fur): Head {
  const white = WHITE().base;
  return (grid, cx, y, state, { flat, licking }) => part(grid, (layer) => {
    for (const ex of [cx - 4, cx + 6]) { layer.ellipse(ex, y + (flat ? 2 : 0.8), 2.6, 2.4, white); layer.ellipse(ex, y + (flat ? 2.4 : 1.2), 1.4, 1.3, C.pandaDark); }
    ball(layer, cx + 1, y + 5, 7, 5.2, fur);
    layer.ellipse(cx + 1, y + 8.4, 3.2, 2, white, furCells(fur));
    for (const ex of [cx - 5, cx + 6]) layer.ellipse(ex + 0.5, y + 7, 1.5, 1.6, white, furCells(fur));
    layer.rect(cx - 3, y + 2, 2, 1, white); layer.rect(cx + 3, y + 2, 2, 1, white);
    eyes(layer, cx - 3, cx + 3, y + 4, state);
    layer.rect(cx, y + 7, 2, 1, H.eye);
    if (licking) layer.rect(cx, y + 8, 2, 1, H.tongue); else { layer.set(cx - 1, y + 8, H.mouth); layer.set(cx + 2, y + 8, H.mouth); }
    blush(layer, cx - 6, y + 8); blush(layer, cx + 6, y + 8);
  });
}

export function paintFox(grid: PixelGrid, look: Look, pose: Pose) {
  const black = BLACK();
  quadruped(grid, { fur: look.fur, legs: black, paws: black, chest: WHITE().base, long: 0, short: false, licks: true, head: foxHead(look.fur), tail: foxTail(look.fur) }, pose);
}

export function paintRedPanda(grid: PixelGrid, look: Look, pose: Pose) {
  const dark = furTones(C.pandaDark), { fur } = look;
  quadruped(grid, {
    fur, legs: dark, paws: dark, chest: null, long: 0, short: false, licks: true, head: redPandaHead(fur),
    tail: catTail({ ...fur, base: fur.base, light: fur.light }, { rings: fur.dark }),
  }, pose);
}

export function paintManeki(grid: PixelGrid, look: Look, pose: Pose) {
  const { fur } = look;
  const quad = { ...catQuad('calico', { ...look, iris: C.black }), collar: { band: C.collar, tag: C.coin } };
  quadruped(grid, quad, pose);
  if (pose.activity !== 'sit' && pose.activity !== 'wash') return;
  // a gold coin held to its chest, and a paw beckoning: raised high, then folded (both when it washes)
  part(grid, (layer) => { ball(layer, -1.5, -5, 2.2, 2.6, furTones(C.coin)); layer.set(-2, -6, H.glint); });
  const paw = (x: number, up: boolean) => part(grid, (layer) => {
    if (up) { layer.rect(x, -12, 3, 5, fur.base); layer.ellipse(x + 1.5, -13, 1.9, 1.8, fur.light); layer.set(x + 1, -13, H.earInside); }
    else { layer.ellipse(x + 1.5, -9, 1.9, 1.8, fur.light); layer.set(x + 1, -9, H.earInside); }
  });
  paw(6, pose.frame === 0);
  if (pose.activity === 'wash') paw(-8, pose.frame === 1);
}

/* A robot dog */

function robotHead(fur: Fur): Head {
  const eye = C.robotEye;
  return (grid, cx, y, state, { flat, panting }) => part(grid, (layer) => {
    if (!flat) { layer.rect(cx - 3, y - 3, 1, 3, fur.dark); layer.rect(cx - 4, y - 4, 2, 2, C.tag); }
    layer.rect(cx - 5, y + 1, 12, 9, fur.base); layer.rect(cx - 5, y + 1, 12, 1, fur.light); layer.rect(cx - 5, y + 1, 1, 8, fur.light);
    layer.rect(cx + 6, y + 2, 1, 8, fur.shade); layer.rect(cx - 4, y + 9, 11, 1, fur.shade);
    for (const ex of [cx - 7, cx + 7]) layer.rect(ex, y + 3, 2, 4, fur.shade);
    layer.rect(cx - 4, y + 3, 10, 4, C.black);
    for (const ex of [cx - 3, cx + 3]) {
      if (state === 'open') { layer.rect(ex, y + 4, 2, 2, eye); layer.set(ex, y + 4, H.glint); }
      else if (state === 'shut') layer.rect(ex, y + 5, 2, 1, mix(eye, C.black, 0.5));
      else { layer.rect(ex, y + 4, 2, 1, eye); layer.set(ex - (ex < cx ? 1 : -2), y + 5, eye); }
    }
    if (panting || state === 'happy') layer.rect(cx, y + 6, 2, 1, eye);
    layer.rect(cx - 1, y + 8, 4, 1, fur.dark);
    blush(layer, cx - 4, y + 7); blush(layer, cx + 4, y + 7);
  });
}

export function paintRobotDog(grid: PixelGrid, look: Look, pose: Pose) {
  const { fur } = look;
  const metal = { ...fur, base: fur.dark, light: fur.shade, shade: fur.dark };
  quadruped(grid, {
    fur, legs: metal, paws: metal, chest: null, long: 0, short: false, licks: false, head: robotHead(fur),
    marks: (layer, x, y, width) => { layer.rect(x + Math.floor(width / 2), y + 1, 1, 3, fur.shade, furCells(fur)); },
    tail: (layer, { activity, frame }, x, y) => part(layer, (tail) => {
      if (activity === 'sleep') { tail.rect(x, -2, 4, 1, fur.dark); return; }
      const tip = activity === 'walk' ? [x - 2, y - 5 + frame] : [x - 5 - frame, -4];
      tail.line(activity === 'walk' ? x : x - 1, activity === 'walk' ? y : -2, tip[0], tip[1], fur.dark);
      tail.set(tip[0], tip[1], C.tag);
    }),
  }, pose);
}

/* A pocket dragon */

function dragonHead(fur: Fur): Head {
  const horn = C.dragonBelly;
  return (grid, cx, y, state, { flat, panting }) => {
    part(grid, (layer) => {
      for (const [hx, step] of [[cx - 3, -1], [cx + 4, 1]] as const) { layer.rect(hx, y - (flat ? 0 : 2), 2, 3, horn); layer.set(hx + (step > 0 ? 1 : 0), y - (flat ? 1 : 3), horn); }
      ball(layer, cx + 1, y + 5, 7, 5.2, fur);
      layer.ellipse(cx + 1, y + 8.4, 3.6, 2, mix(fur.light, horn, 0.5), furCells(fur));
      eyes(layer, cx - 3, cx + 3, y + 4, state);
      layer.set(cx, y + 7, fur.dark); layer.set(cx + 1, y + 7, fur.dark);
      if (panting) layer.rect(cx, y + 9, 2, 1, H.mouth); else { layer.set(cx - 1, y + 9, H.mouth); layer.set(cx + 2, y + 9, H.mouth); }
      blush(layer, cx - 5, y + 7); blush(layer, cx + 5, y + 7);
      for (const x of [cx - 1, cx + 2]) layer.set(x, y + 1, fur.dark);
    });
    if (panting) part(grid, (layer) => { layer.ellipse(cx + 10, y + 9, 2.6, 1.8, C.flame); layer.ellipse(cx + 9.5, y + 9, 1.4, 1, C.flameCore); });
  };
}

export function paintDragon(grid: PixelGrid, look: Look, pose: Pose) {
  const { fur } = look;
  const wing = (layer: PixelGrid, x: number, y: number, up: boolean) => {
    const top = up ? y - 6 : y - 3;
    layer.rect(x - 1, top, 7, 2, fur.dark); layer.rect(x - 2, top + 2, 6, 2, fur.light); layer.rect(x - 2, top + 4, 4, 2, fur.light);
    layer.set(x + 5, top - 1, fur.dark); layer.set(x - 2, top + 2, fur.shade); layer.set(x, top + 3, fur.shade);
  };
  quadruped(grid, {
    fur, legs: fur, paws: pawsOf(fur), chest: C.dragonBelly, long: 0, short: false, licks: false, head: dragonHead(fur),
    marks: (layer, x, y, width) => { for (let column = x + 3; column < x + width - 2; column += 3) layer.set(column, y, fur.dark, furCells(fur)); },
    back: (layer, { activity, frame }, x, y) => part(layer, (wings) => wing(wings, x - 3, y, activity === 'walk' ? frame === 1 : activity !== 'sleep')),
    tail: (layer, { activity, frame }, x, y) => part(layer, (tail) => {
      const spade = (sx: number, sy: number) => { tail.rect(sx - 1, sy - 1, 3, 2, fur.dark); tail.set(sx, sy - 2, fur.dark); tail.set(sx, sy + 1, fur.dark); };
      if (activity === 'sleep') { tail.rect(x, -2, 11, 2, fur.base); tail.rect(x, -2, 10, 1, fur.light); spade(x - 1, -2); }
      else if (activity === 'walk') { tail.rect(x - 3, y, 4, 2, fur.base); tail.rect(x - 5, y - 1 - frame, 3, 2, fur.base); spade(x - 6, y - 2 - frame); }
      else { tail.rect(x - 6, -2, 7, 2, fur.base); tail.rect(x - 6, -2, 6, 1, fur.light); spade(x - 7, -3 - (activity === 'sit' ? frame : 0)); }
    }),
  }, pose);
}

/* A rabbit */

export function paintRabbit(grid: PixelGrid, look: Look, pose: Pose) {
  const { fur } = look, white = WHITE();
  const { activity, frame } = pose;
  const state = eyesOf(pose);
  const head = (cx: number, y: number, down = false, washing = false) => {
    part(grid, (layer) => {
      if (down) { layer.ellipse(cx - 4, y + 2, 4.5, 1.5, fur.base); layer.rect(cx - 7, y + 2, 5, 1, H.earInside); }
      else for (const ex of [cx - 2.5, cx + 4.5]) { layer.ellipse(ex, y - 2.5, 1.7, 4.2, fur.base); layer.rect(Math.floor(ex), y - 5, 1, 5, H.earInside); layer.set(Math.floor(ex) - 1, y - 6, fur.light); }
      ball(layer, cx + 1, y + 5, 6.6, 5, fur);
      layer.ellipse(cx + 1, y + 8, 2.4, 1.6, fur.light);
      eyes(layer, cx - 3, cx + 3, y + 4, state);
      layer.rect(cx, y + 7, 2, 1, H.nose);
      layer.set(cx, y + 8, H.mouth); layer.set(cx + 1, y + 8, H.mouth);
      blush(layer, cx - 5, y + 7); blush(layer, cx + 5, y + 7);
    });
    if (washing) part(grid, (layer) => { for (const px of [cx - 2, cx + 3]) { layer.ellipse(px + 0.5, y + 9 - frame, 1.6, 1.6, fur.light); } });
  };
  const cotton = (x: number, y: number) => part(grid, (layer) => { ball(layer, x, y, 2.3, 2.1, white); });
  if (activity === 'sleep') {
    cotton(-10, -4);
    part(grid, (layer) => ball(layer, -1.5, -4, 9.5, 4.4, fur));
    head(4, -10, true);
    part(grid, (layer) => { layer.rect(1, -2, 3, 2, fur.light); layer.rect(6, -2, 3, 2, fur.light); });
    return;
  }
  if (activity === 'walk') {
    // a hop: crouched, then stretched out, a hind foot still pushing off the floor
    const stretched = frame === 1;
    cotton(stretched ? -9 : -8, stretched ? -8 : -6);
    part(grid, (layer) => {
      if (stretched) { layer.rect(-11, -2, 5, 2, fur.light); layer.rect(-8, -4, 3, 2, fur.base); }
      else layer.rect(-7, -2, 6, 2, fur.light);
      ball(layer, -1.5, stretched ? -6 : -5, stretched ? 7.6 : 7, stretched ? 3.8 : 4.4, fur);
      layer.rect(stretched ? 5 : 3, stretched ? -3 : -2, 3, stretched ? 3 : 2, fur.light);
    });
    head(stretched ? 5 : 4, stretched ? -17 : -16);
    return;
  }
  cotton(-5, -3);
  part(grid, (layer) => { ball(layer, 0.5, -5, 5.6, 5.2, fur); layer.ellipse(1, -4.5, 2.4, 3.4, fur.light, furCells(fur)); });
  part(grid, (layer) => { layer.rect(-4, -2, 4, 2, fur.light); layer.rect(2, -2, 4, 2, fur.light); layer.set(-1, -1, fur.base); layer.set(5, -1, fur.base); });
  head(0, -18, false, activity === 'wash');
}

/* A hedgehog */

/** A dome of spines over (cx, cy), its jagged edge and darker streaks. */
function spines(layer: PixelGrid, cx: number, cy: number, rx: number, ry: number, fur: Fur) {
  ball(layer, cx, cy, rx, ry, fur);
  for (let x = Math.ceil(cx - rx); x <= Math.floor(cx + rx); x += 2) {
    const dx = (x + 0.5 - cx) / rx;
    if (Math.abs(dx) > 0.98) continue;
    const top = Math.floor(cy - ry * Math.sqrt(1 - dx * dx));
    layer.set(x, top - 1 + ((x & 2) ? 1 : 0), fur.base);
  }
  for (let x = Math.ceil(cx - rx) + 2; x < cx + rx - 1; x += 3) for (let y = Math.floor(cy - ry) + 2; y < cy + ry - 1; y += 3) {
    if (layer.get(x, y) && layer.get(x + 1, y - 1)) { layer.set(x, y, fur.dark); layer.set(x + 1, y - 1, fur.dark); }
  }
}

export function paintHedgehog(grid: PixelGrid, look: Look, pose: Pose) {
  const { fur } = look, face = furTones(C.hedgehogFace);
  const { activity, frame } = pose;
  const state = eyesOf(pose, true);
  if (activity === 'sleep') {
    part(grid, (layer) => spines(layer, -0.5, -4.6, 8, 4.6, fur));
    part(grid, (layer) => { layer.ellipse(5, -3, 3, 2.2, face.base); layer.rect(7, -3, 2, 1, H.eye); layer.set(8, -2, C.black); blush(layer, 4, -2); });
    return;
  }
  const sniff = activity === 'wash' ? 1 - frame : 0;
  const step = activity === 'walk' ? frame : 0;
  part(grid, (layer) => { for (const x of step ? [-5, 2] : [-4, 3]) layer.rect(x, -1, 2, 1, C.black); });
  part(grid, (layer) => spines(layer, -1.5, -5, 8.5, 5.2, fur));
  part(grid, (layer) => {
    ball(layer, 5.5, -5, 4.4, 3.6, face);
    layer.ellipse(9.5, -4.5 - sniff, 2.2, 1.5, face.base);
    layer.rect(11, -5 - sniff, 1, 1, C.black);
    layer.ellipse(3, -8.5, 1.4, 1.2, face.shade);
    const ey = -7;
    if (state === 'open') { layer.rect(6, ey, 2, 1, H.eye); layer.set(6, ey + 1, H.glint); layer.set(7, ey + 1, H.eye); layer.rect(6, ey + 2, 2, 1, H.eye); }
    else if (state === 'shut') { layer.rect(6, ey + 2, 2, 1, H.eye); layer.set(5, ey + 1, H.eye); }
    else { layer.rect(6, ey + 1, 2, 1, H.eye); layer.set(5, ey + 2, H.eye); layer.set(8, ey + 2, H.eye); }
    blush(layer, 5, -4);
    layer.set(9, -3, H.mouth);
  });
}

/* A capybara */

export function paintCapybara(grid: PixelGrid, look: Look, pose: Pose) {
  const { fur } = look, citrus = furTones(C.citrus);
  const { activity, frame } = pose;
  const state = eyesOf(pose, true);
  const low = activity === 'sleep' ? 2 : activity === 'walk' ? 0 : 1;
  part(grid, (layer) => {
    if (activity === 'walk') for (const x of frame ? [-8, -4, 2, 5] : [-7, -5, 3, 4]) layer.rect(x, -3, 2, 3, fur.dark);
    ball(layer, -2, -6 + low, 9, 5 - (activity === 'sleep' ? 1 : 0), fur);
    if (activity === 'sit' || activity === 'wash') layer.rect(3, -2, 3, 2, fur.shade);
  });
  const hy = -10 + low + (activity === 'sleep' ? 1 : 0);
  part(grid, (layer) => {
    layer.ellipse(3.5, hy - 4, 1.4, 1.3, fur.dark);
    ball(layer, 6, hy, 5.4, 4.4, fur);
    layer.ellipse(10.5, hy + 1, 3.2, 3.2, fur.base);
    layer.rect(9, hy - 2, 3, 1, fur.light);
    layer.set(13, hy - 1, fur.dark); layer.rect(11, hy + 3, 2, 1, H.mouth);
    const ey = hy - 2;
    if (state === 'open') { layer.rect(6, ey, 2, 1, H.eye); layer.set(6, ey + 1, H.glint); layer.set(7, ey + 1, H.eye); }
    else if (state === 'shut') { layer.rect(6, ey + 1, 2, 1, H.eye); layer.set(5, ey, H.eye); }
    else { layer.rect(6, ey, 2, 1, H.eye); layer.set(5, ey + 1, H.eye); layer.set(8, ey + 1, H.eye); }
    blush(layer, 7, hy + 2);
  });
  if (activity === 'wash') part(grid, (layer) => { layer.rect(13, hy + 3, 3, 1, C.leaf); layer.set(15, hy + 2 + frame, C.leaf); });
  part(grid, (layer) => { ball(layer, 5.5, hy - 6, 2.4, 2.1, citrus); layer.set(6, hy - 9, C.leaf); layer.set(7, hy - 9, C.leaf); });
}

/* A ghost cat */

/** Floats and bobs (asleep, it drifts down to the floor); its sheet trails into a wisp. */
export function paintGhostCat(grid: PixelGrid, look: Look, pose: Pose) {
  const { fur } = look;
  const { activity, frame } = pose;
  const ghost = { ...catQuad('plain', { ...look, iris: C.ghostEyes }) };
  const wisp: typeof ghost.tail = (layer, { activity: now }, x) => part(layer, (tail) => {
    if (now === 'sleep') { tail.rect(x, -2, 6, 2, fur.base); tail.rect(x - 2, -3, 3, 1, fur.light); tail.set(x - 3, -4, fur.light); }
  });
  if (activity === 'sleep') { quadruped(grid, { ...ghost, tail: wisp, legs: fur, paws: fur }, pose); return; }
  const up = 3 + (activity === 'wash' ? 0 : frame);
  const head = catHead('plain', fur, C.ghostEyes);
  if (activity === 'walk') {
    part(grid, (layer) => {
      ball(layer, -1.5, -7 - up, 7, 3.6, fur);
      layer.rect(-11, -6 - up, 4, 2, fur.base); layer.rect(-13, -7 - up - frame, 3, 1, fur.light); layer.set(-14, -8 - up - frame, fur.light);
    });
    head(grid, 3, -16 - up, eyesOf(pose, true), {});
    return;
  }
  part(grid, (layer) => {
    ball(layer, 0.5, -5 - up, 6, 4.6, fur);
    for (let x = -5; x <= 6; x += 3) layer.rect(x, -1 - up, 2, 1, fur.shade);
    layer.rect(-8, -3 - up, 3, 1, fur.light); layer.set(-9, -4 - up - frame, fur.light);
  });
  head(grid, 0, -17 - up, eyesOf(pose, true), {});
  if (activity === 'wash') part(grid, (layer) => { layer.ellipse(-6.5, -9 - up, 1.8, 1.8, fur.light); layer.ellipse(8.5, -9 - up, 1.8, 1.8, fur.light); });
}

