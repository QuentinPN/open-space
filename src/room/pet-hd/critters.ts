// The other HD pets (pet-hd.ts), each its own shape: a rubber duck, an axolotl, Rocky, Clawd, a parrot, an owl, a
// penguin, a crab, an octopus, a firefly, an alien, a slime, a golem and a turtle.
import { PET_HD_PALETTE as H, ROOM_PALETTE } from '../../design/room-palette.ts';
import type { PixelGrid } from '../cozy/pixels.ts';
import { type Eyes, type Look, type Pose, ball, blush, eyes, eyesOf, furCells, furTones, mix, part, pointedEar } from './kit.ts';

const C = ROOM_PALETTE.pet;

/** One eye seen from the side, its columns x and x + 1, its top row y. */
function sideEye(layer: PixelGrid, x: number, y: number, state: Eyes, iris: string = H.eye) {
  if (state === 'open') { layer.rect(x, y, 2, 1, H.eye); layer.set(x, y + 1, H.glint); layer.set(x + 1, y + 1, iris); layer.rect(x, y + 2, 2, 1, iris); }
  else if (state === 'shut') { layer.rect(x, y + 2, 2, 1, H.eye); layer.set(x - 1, y + 1, H.eye); layer.set(x + 2, y + 1, H.eye); }
  else { layer.rect(x, y + 1, 2, 1, H.eye); layer.set(x - 1, y + 2, H.eye); layer.set(x + 2, y + 2, H.eye); }
}

/** A little smile, its corners at x and x + width - 1, its middle a row lower. */
function smile(layer: PixelGrid, x: number, y: number, width = 4) {
  layer.set(x, y, H.mouth); layer.set(x + width - 1, y, H.mouth); layer.rect(x + 1, y + 1, width - 2, 1, H.mouth);
}

/** A rubber duck: it slides along bobbing its head, preens its wing to wash, tucks its head in to sleep. */
export function paintDuck(grid: PixelGrid, { fur }: Look, pose: Pose) {
  const { activity, frame } = pose;
  const beak = furTones(C.beak);
  const low = activity === 'sleep' ? 3 : activity === 'wash' ? 2 : activity === 'walk' ? frame : 0;
  part(grid, (layer) => {
    layer.rect(-10, -9, 3, 3, fur.base); layer.set(-10, -10, fur.base); layer.set(-10, -9, fur.light);
    ball(layer, -1, -5, 8.5, 5, fur);
    layer.ellipse(-2.5, -5, 3.6, 2.2, fur.shade, furCells(fur)); layer.rect(-5, -7, 5, 1, fur.light, furCells(fur));
  });
  const hy = -13 + low;
  part(grid, (layer) => {
    ball(layer, 3.5, hy, 5, 4.6, fur);
    sideEye(layer, 4, hy - 2, eyesOf(pose));
    blush(layer, 3, hy + 2);
  });
  part(grid, (layer) => {
    const bx = activity === 'wash' ? 7 : 8;
    layer.ellipse(bx + 1.5, hy + 1.5, 2.6, 1.5, beak.base); layer.rect(bx, hy + 2, 4, 1, beak.shade); layer.set(bx + 1, hy + 1, beak.light);
  });
}

/** An axolotl: a pink salamander, feathery gills either side of a wide smiling face, a fin along its tail. */
export function paintAxolotl(grid: PixelGrid, { fur }: Look, pose: Pose) {
  const { activity, frame } = pose;
  const asleep = activity === 'sleep';
  const sway = activity === 'walk' ? frame : 0;
  part(grid, (layer) => {
    layer.turnedEllipse(-10, -4 - sway, 4.4, 1.8, 0.2 - sway * 0.3, fur.light);
    if (!asleep) for (const [index, x] of [-7, -4, 1, 4].entries()) layer.rect(x, activity === 'walk' && (index + frame) % 2 ? -2 : -1, 2, 1, fur.base);
    ball(layer, -2, asleep ? -3 : -4, 8, asleep ? 3 : 3.4, fur);
    if (!asleep) for (const [index, x] of [-7, -4, 1, 4].entries()) layer.rect(x, -3, 2, activity === 'walk' && (index + frame) % 2 ? 1 : 2, fur.base);
  });
  const cx = 5, y = asleep ? -10 : -12;
  part(grid, (layer) => {
    for (const [from, to] of [[[cx - 5, y + 1], [cx - 8, y - 1]], [[cx - 5, y + 3], [cx - 9, y + 3]], [[cx - 5, y + 5], [cx - 8, y + 7]]] as const) {
      layer.line(from[0], from[1], to[0], to[1], C.gills); layer.line(2 * cx + 1 - from[0], from[1], 2 * cx + 1 - to[0], to[1], C.gills);
      layer.set(to[0], to[1], mix(C.gills, H.glint, 0.35)); layer.set(2 * cx + 1 - to[0], to[1], mix(C.gills, H.glint, 0.35));
    }
    ball(layer, cx + 1, y + 4, 6.4, 4.2, fur);
    eyes(layer, cx - 4, cx + 4, y + 3, eyesOf(pose), H.eye, true);
    smile(layer, cx - 1, y + 5);
    blush(layer, cx - 5, y + 5); blush(layer, cx + 5, y + 5);
  });
  if (activity === 'wash') part(grid, (layer) => { layer.ellipse(cx + 9, y - 2 - frame, 1.6, 1.6, mix(C.white, C.robotEye, 0.3)); layer.set(cx + 8, y - 3 - frame, H.glint); });
}

/** Rocky: a ridged stone shell on five jointed legs, no eyes; folded down asleep. */
export function paintRocky(grid: PixelGrid, { fur }: Look, pose: Pose) {
  const { activity, frame } = pose;
  const asleep = activity === 'sleep';
  const shellY = asleep ? -5 : -12;
  part(grid, (layer) => {
    [-12, -7, 0, 8, 13].forEach((foot, leg) => {
      const lifted = activity === 'walk' && (leg + frame) % 2 === 0 ? 1 : 0;
      if (asleep) { layer.rect(foot - 1, -2, 3, 2, fur.shade); return; }
      if (activity === 'wash' && leg === 3) { layer.line(4, shellY + 2, 9, shellY - 3, fur.base); layer.line(5, shellY + 2, 10, shellY - 3, fur.base); layer.rect(9, shellY - 5, 2, 2, fur.light); return; }
      const knee = [Math.round(foot * 0.8), shellY - 4];
      layer.line(Math.round(foot * 0.4), shellY + 1, knee[0], knee[1], fur.base); layer.line(Math.round(foot * 0.4) + 1, shellY + 1, knee[0] + 1, knee[1], fur.base);
      layer.line(knee[0], knee[1], foot, -1 - lifted, fur.base); layer.line(knee[0] + 1, knee[1], foot + 1, -1 - lifted, fur.shade);
      layer.rect(foot, -1 - lifted, 2, 1, fur.dark);
    });
  });
  part(grid, (layer) => {
    ball(layer, 0.5, shellY, 8, 5, fur);
    for (const [x, y, height] of [[-3, -3, 4], [2, -4, 5], [5, -2, 3]] as const) layer.rect(x, shellY + y, 1, height, fur.dark, furCells(fur));
    layer.rect(-5, shellY + 3, 11, 1, fur.dark, furCells(fur));
    if (pose.cuddled) { layer.set(-2, shellY - 2, H.glint); layer.set(3, shellY - 3, H.glint); }
  });
}

/** Clawd, Claude Code's mascot: a clay-orange block, two tall eyes, a stub of an arm each side, four little legs. */
export function paintClawd(grid: PixelGrid, { fur }: Look, pose: Pose) {
  const { activity, frame } = pose;
  const asleep = activity === 'sleep';
  const top = asleep ? -10 : -13 + (activity === 'walk' ? frame : 0);
  part(grid, (layer) => {
    if (!asleep) for (const [leg, x] of [-7, -4, 3, 6].entries()) layer.rect(x, top + 10, 2, activity === 'walk' && (leg + frame) % 2 === 0 ? -top - 11 : -top - 10, fur.shade);
    layer.rect(-8, top, 17, 10, fur.base); layer.rect(-8, top, 17, 1, fur.light); layer.rect(-8, top, 1, 9, fur.light);
    layer.rect(8, top + 1, 1, 9, fur.shade); layer.rect(-7, top + 9, 16, 1, fur.shade);
    layer.rect(-10, top + 4, 2, 3, fur.base);
    if (activity === 'wash') layer.rect(9, top - 2 + frame, 2, 4, fur.base); else layer.rect(9, top + 4, 2, 3, fur.shade);
    const state = eyesOf(pose, true);
    for (const x of [-4, 3]) {
      if (state === 'open') { layer.rect(x, top + 2, 2, 4, H.eye); layer.set(x, top + 2, H.glint); }
      else if (state === 'shut') { layer.rect(x, top + 5, 2, 1, H.eye); }
      else { layer.rect(x, top + 3, 2, 1, H.eye); layer.set(x - 1, top + 4, H.eye); layer.set(x + 2, top + 4, H.eye); }
    }
    blush(layer, -6, top + 6); blush(layer, 5, top + 6);
  });
}

/** A parrot, upright: a pale hooked beak, a blue wing with a yellow band, a long tail; it preens to wash. */
export function paintParrot(grid: PixelGrid, { fur }: Look, pose: Pose) {
  const { activity, frame } = pose;
  const wing = furTones(C.parrotWing), beak = furTones(C.parrotBeak);
  const asleep = activity === 'sleep';
  const bob = activity === 'walk' ? frame : 0;
  part(grid, (layer) => { for (const dx of [0, 1, 2]) layer.line(-4 + dx, -6, -9 + dx, -1, dx === 2 ? wing.shade : wing.base); });
  part(grid, (layer) => { if (!asleep) { layer.rect(activity === 'walk' && frame ? -2 : -1, -1, 2, 1, C.parrotFeet); layer.rect(2, -1, 2, 1, C.parrotFeet); } });
  part(grid, (layer) => {
    ball(layer, 0.5, asleep ? -6 : -7 + bob, asleep ? 5.4 : 4.6, asleep ? 5 : 6, fur);
    layer.ellipse(-1, asleep ? -6 : -7 + bob, 3, 4, wing.base);
    layer.rect(-3, asleep ? -9 : -10 + bob, 5, 1, C.parrotBand, [wing.base]);
    layer.rect(-2, asleep ? -4 : -5 + bob, 2, 1, wing.shade, [wing.base]);
  });
  const preen = activity === 'wash' ? 3 : 0;
  const hy = (asleep ? -12 : -15 + bob) + preen;
  part(grid, (layer) => {
    ball(layer, 1.5, hy, 4.8, 4.2, fur);
    layer.ellipse(3, hy - 0.5, 1.8, 1.6, fur.light);
    sideEye(layer, 2, hy - 2, eyesOf(pose));
    blush(layer, 1, hy + 2);
    layer.rect(6, hy - 2, 3, 2, beak.base); layer.rect(6, hy, 2, 1, beak.shade); layer.set(9, hy - 1, beak.base); layer.set(9, hy, beak.dark); layer.set(6, hy - 2, beak.light);
  });
}

/** An owl, its round face to us: big yellow eyes in pale discs, ear tufts, a speckled breast; it winks to wash. */
export function paintOwl(grid: PixelGrid, { fur }: Look, pose: Pose) {
  const { activity, frame } = pose;
  const asleep = activity === 'sleep';
  const tilt = activity === 'walk' ? frame : 0;
  const state = eyesOf(pose, true);
  part(grid, (layer) => { if (!asleep) for (const x of activity === 'walk' && frame ? [-3, 3] : [-2, 2]) layer.rect(x, -1, 2, 1, C.owlBeak); });
  part(grid, (layer) => {
    const height = asleep ? 7 : 8;
    pointedEar(layer, -4 + tilt, -2 * height - 1, 3, 1, fur, null);
    pointedEar(layer, 5 + tilt, -2 * height - 1, 3, -1, fur, null);
    ball(layer, 0.5 + tilt * 0.5, -height, 7, height, fur);
    for (const [x, y] of [[-1, 4], [2, 4], [0, 2], [3, 2], [-2, 2]] as const) { layer.set(x + tilt, -y, fur.shade); layer.set(x + tilt + 1, -y - 1, fur.shade); }
    for (const side of [-1, 1] as const) {
      const dx = side < 0 ? -2.5 : 3.5;
      layer.ellipse(dx + tilt, -2 * height + 6.5, 3, 2.8, mix(fur.light, H.cream, 0.55));
    }
    for (const [x, outer] of [[-4 + tilt, -5 + tilt], [3 + tilt, 6 + tilt]] as const) {
      const y = -2 * height + 5;
      const wink = activity === 'wash' && frame === 1 && x > 0;
      if (state === 'open' && !wink) { const pupil = x < tilt ? x + 1 : x; layer.rect(x, y, 3, 3, C.owlEyes); layer.rect(pupil, y + 1, 2, 2, H.eye); layer.set(pupil, y + 1, H.glint); }
      else if (state === 'happy') { layer.rect(x, y + 1, 3, 1, H.eye); layer.set(outer < x ? x - 1 : x + 3, y + 2, H.eye); }
      else layer.rect(x, y + 2, 3, 1, H.eye);
    }
    layer.rect(0 + tilt, -2 * height + 8, 2, 1, C.owlBeak); layer.set(0 + tilt, -2 * height + 9, mix(C.owlBeak, H.mouth, 0.4));
    blush(layer, -5 + tilt, -2 * height + 9); blush(layer, 5 + tilt, -2 * height + 9);
  });
  part(grid, (layer) => {
    const height = asleep ? 7 : 8;
    const up = activity === 'wash' && frame === 0;
    layer.turnedEllipse(-5 + tilt, -height + (up ? 0 : 3.5), 1.5, 3, up ? 0.6 : 0.15, fur.shade);
    layer.turnedEllipse(6 + tilt, -height + 3.5, 1.5, 3, -0.15, fur.shade);
  });
}

/** A penguin facing us: a dark back (the colour chosen), a white front and face, an orange beak and feet; it waddles and flaps. */
export function paintPenguin(grid: PixelGrid, { fur }: Look, pose: Pose) {
  const { activity, frame } = pose;
  const asleep = activity === 'sleep';
  const beak = furTones(C.beak), white = furTones(C.white);
  const height = asleep ? 7.5 : 8.5;
  const lean = activity === 'walk' ? (frame ? 1 : -1) * 0.5 : 0;
  part(grid, (layer) => { layer.rect(-3, -1, 3, 1, beak.base); layer.rect(2, activity === 'walk' && frame ? -2 : -1, 3, 1, beak.base); });
  part(grid, (layer) => {
    const flap = activity === 'wash' && frame === 1;
    layer.turnedEllipse(-5.5 + lean, -height + 1 - (flap ? 3 : 0), 1.5, 3.8, flap ? -0.9 : 0.25, fur.shade);
    layer.turnedEllipse(6.5 + lean, -height + 1 - (flap ? 3 : 0), 1.5, 3.8, flap ? 0.9 : -0.25, fur.shade);
  });
  part(grid, (layer) => {
    ball(layer, 0.5 + lean, -height, 6, height, fur);
    layer.ellipse(0.5 + lean, -height + 2, 4.4, height - 1.6, white.base, furCells(fur));
    layer.ellipse(-1.5 + lean, -2 * height + 6, 2.2, 2.2, white.base, furCells(fur));
    layer.ellipse(2.5 + lean, -2 * height + 6, 2.2, 2.2, white.base, furCells(fur));
    layer.rect(3 + Math.round(lean), -height, 2, 5, white.shade, [white.base]);
    const ey = Math.round(-2 * height + 5);
    eyes(layer, -2 + Math.round(lean), 2 + Math.round(lean), ey, eyesOf(pose, true), H.eye, true);
    layer.rect(0 + Math.round(lean), ey + 2, 2, 1, beak.base); layer.set(1 + Math.round(lean), ey + 3, beak.shade);
    blush(layer, -4 + Math.round(lean), ey + 3); blush(layer, 4 + Math.round(lean), ey + 3);
  });
}

/** A crab facing us: eyes on stalks, two claws that snap open, three legs a side that scuttle. */
export function paintCrab(grid: PixelGrid, { fur }: Look, pose: Pose) {
  const { activity, frame } = pose;
  const asleep = activity === 'sleep';
  const state = eyesOf(pose, true);
  const bodyY = asleep ? -4 : -6;
  part(grid, (layer) => {
    for (const [index, foot] of [-7, -9, -11].entries()) {
      const lift = activity === 'walk' && (index + frame) % 2 ? 1 : 0;
      for (const side of [-1, 1] as const) {
        const x = side < 0 ? foot : 1 - foot;
        if (asleep) { layer.rect(Math.min(x, x + side * 2), -1, 2, 1, fur.shade); continue; }
        layer.line(side < 0 ? -4 : 5, bodyY + 1, x, -1 - lift, fur.shade);
      }
    }
  });
  part(grid, (layer) => {
    if (!asleep) for (const x of [-2, 3]) layer.rect(x, bodyY - 6, 1, 3, fur.shade);
    for (const x of [-3, 3]) {
      const ey = asleep ? bodyY - 4 : bodyY - 8;
      layer.rect(x, ey, 2, 2, C.white);
      if (state === 'open') { layer.set(x + (x < 0 ? 1 : 0), ey + 1, H.eye); layer.set(x + (x < 0 ? 0 : 1), ey, H.glint); }
      else if (state === 'shut') layer.rect(x, ey + 1, 2, 1, H.eye);
      else layer.rect(x, ey, 2, 1, H.eye);
    }
  });
  part(grid, (layer) => {
    ball(layer, 0.5, bodyY, 7, asleep ? 3.6 : 4.2, fur);
    smile(layer, -1, bodyY + 1);
    blush(layer, -4, bodyY + 1); blush(layer, 4, bodyY + 1);
  });
  part(grid, (layer) => {
    const snapping = activity === 'walk' || activity === 'wash';
    for (const side of [-1, 1] as const) {
      const cx = side < 0 ? -10 : 11, cy = asleep ? -2.5 : bodyY - 4;
      if (!asleep) layer.line(side < 0 ? -6 : 7, bodyY - 1, side < 0 ? -9 : 10, Math.round(cy) + 2, fur.base);
      ball(layer, cx, cy, 2.8, 2.6, fur);
      const open = snapping ? frame === 1 : activity === 'sit' && frame === 1 && side > 0;
      if (open && !asleep) { layer.set(Math.floor(cx) + side, Math.floor(cy) - 2, null); layer.set(Math.floor(cx) + side, Math.floor(cy) - 1, null); layer.set(Math.floor(cx) + side * 2, Math.floor(cy) - 2, null); }
    }
  });
}

/** An octopus facing us: a round mantle, big eyes, four arms curling out at the floor; it waves one more to wash. */
export function paintOctopus(grid: PixelGrid, { fur }: Look, pose: Pose) {
  const { activity, frame } = pose;
  const asleep = activity === 'sleep';
  const mantleY = asleep ? -7 : -10;
  part(grid, (layer) => {
    if (asleep) { layer.rect(-9, -2, 20, 2, fur.base); layer.rect(-9, -2, 19, 1, fur.light); return; }
    [[-5, -1], [-2, -1], [2, 1], [5, 1]].forEach(([x, curl], index) => {
      const lift = activity === 'walk' && (index + frame) % 2 ? 1 : 0;
      layer.rect(x, mantleY + 4, 2, -mantleY - 4 - lift, fur.base);
      layer.rect(x + curl, -1 - lift, 2, 1, fur.base);
      layer.set(x + (curl > 0 ? 1 : 0), -2 - lift, fur.shade);
    });
    if (activity === 'wash') { layer.rect(8, mantleY - 1 + frame, 2, 6, fur.base); layer.set(10, mantleY - 2 + frame, fur.base); }
  });
  part(grid, (layer) => {
    ball(layer, 0.5, mantleY, 7, asleep ? 5 : 6.4, fur);
    for (const [x, y] of [[-4, -4], [4, -3], [-1, -5]] as const) layer.set(x, mantleY + y, fur.light);
    eyes(layer, -3, 3, mantleY, eyesOf(pose, true));
    smile(layer, -1, mantleY + 3);
    blush(layer, -5, mantleY + 3); blush(layer, 5, mantleY + 3);
  });
}

/** A giant firefly: a dark beetle on fluttering wings, hovering, its tail glowing (the colour chosen); it lands to sleep. */
export function paintFirefly(grid: PixelGrid, { fur }: Look, pose: Pose) {
  const { activity, frame } = pose;
  const body = furTones(C.fireflyBody), wing = C.fireflyWing;
  const landed = activity === 'sleep';
  const up = landed ? 0 : 3 + (activity === 'wash' ? 0 : frame);
  const glow = landed ? { ...fur, light: fur.base, base: fur.shade } : activity === 'wash' && frame ? { ...fur, base: fur.light, light: C.white } : fur;
  part(grid, (layer) => { if (landed) for (const x of [-2, 1, 4]) layer.rect(x, -2, 1, 2, body.shade); });
  part(grid, (layer) => { ball(layer, -6, -6 - up, 4.6, 3.6, glow); layer.set(-8, -8 - up, C.white); });
  part(grid, (layer) => ball(layer, 0.5, -6 - up, 4, 3.6, body));
  part(grid, (layer) => {
    for (const side of [-1, 1] as const) { layer.line(5 + side, -12 - up, 5 + side * 3, -15 - up, body.base); layer.set(5 + side * 3, -16 - up, fur.light); }
    const head = furTones(mix(C.fireflyBody, H.cream, 0.4));
    ball(layer, 5.5, -9 - up, 4.4, 4, head);
    eyes(layer, 3, 7, -11 - up, eyesOf(pose, true), H.eye, true);
    layer.rect(5, -8 - up, 2, 1, H.mouth);
    blush(layer, 2, -8 - up); blush(layer, 8, -8 - up);
  });
  part(grid, (layer) => {
    if (!landed && frame) layer.turnedEllipse(-2, -13 - up, 4, 2, -0.5, wing);
    else layer.turnedEllipse(-2.5, -10 - up, 4.2, 1.9, -0.15, wing);
  });
}

/** A little alien: a big green head, black almond eyes, antennae tipped pink; it waves to wash, curls up to sleep. */
export function paintAlien(grid: PixelGrid, { fur }: Look, pose: Pose) {
  const { activity, frame } = pose;
  const asleep = activity === 'sleep';
  const state = eyesOf(pose, true);
  const tip = C.alienTip;
  const head = (cx: number, y: number, droop: boolean) => part(grid, (layer) => {
    for (const side of [-1, 1] as const) {
      const base = side < 0 ? cx - 2 : cx + 3;
      const end = droop ? [base + side * 5, y + 2] : [base + side * 2, y - 4];
      layer.line(base, y + 1, end[0], end[1], fur.shade);
      layer.ellipse(end[0] + 0.5, end[1] + 0.5, 1.4, 1.4, tip);
    }
    ball(layer, cx + 1, y + 5, 7.2, 5.6, fur);
    for (const [x, angle] of [[cx - 2.5, 0.45], [cx + 4.5, -0.45]] as const) {
      if (state === 'open') { layer.turnedEllipse(x, y + 6, 2.3, 1.5, angle, H.eye); layer.set(Math.floor(x) - (x < cx ? 1 : 0), y + 5, H.glint); }
      else if (state === 'shut') { layer.rect(Math.floor(x) - 1, y + 6, 3, 1, H.eye); }
      else { layer.rect(Math.floor(x) - 1, y + 5, 3, 1, H.eye); layer.set(Math.floor(x) - 2, y + 6, H.eye); layer.set(Math.floor(x) + 2, y + 6, H.eye); }
    }
    layer.rect(cx, y + 9, 2, 1, H.mouth);
    blush(layer, cx - 5, y + 8); blush(layer, cx + 5, y + 8);
  });
  if (asleep) {
    part(grid, (layer) => ball(layer, -7, -3.5, 4.4, 3.4, fur));
    head(2, -11, true);
    return;
  }
  const bob = activity === 'walk' ? frame : 0;
  part(grid, (layer) => {
    if (activity === 'walk') { layer.rect(frame ? -3 : -2, -3, 2, 3, fur.shade); layer.rect(frame ? 3 : 2, -3, 2, 3, fur.base); }
    else { layer.rect(-3, -1, 3, 1, fur.shade); layer.rect(2, -1, 3, 1, fur.base); }
    ball(layer, 0.5, activity === 'walk' ? -5 : -4, 3.6, 3.4, fur);
    layer.rect(-4, -6, 1, 3, fur.shade);
    if (activity === 'wash') layer.rect(5, -12 + frame, 1, 6, fur.base); else layer.rect(4, -6, 1, 3, fur.base);
  });
  head(0, (activity === 'walk' ? -17 : -16) + bob, false);
}

/** A slime: a glossy dome with eyes; it bounces to move (squashed, then stretched), jiggles to wash, melts flat to sleep. */
export function paintSlime(grid: PixelGrid, { fur }: Look, pose: Pose) {
  const { activity, frame } = pose;
  const shapes = { walk: frame ? [7.5, 15] : [11, 9], sit: frame ? [9.5, 12] : [9, 13], wash: frame ? [10.5, 11] : [8.5, 13], sleep: [13, 6] } as const;
  const [half, height] = shapes[activity];
  part(grid, (layer) => {
    for (let row = 0; row < height; row++) {
      const width = half * Math.sqrt(1 - (row / height) ** 1.6);
      const left = Math.round(0.5 - width), right = Math.round(0.5 + width) - 1;
      for (let x = left; x <= right; x++) layer.set(x, -row - 1, row === 0 ? fur.shade : x === left || x === left + 1 && row > height * 0.4 ? fur.light : x >= right - 1 ? fur.shade : fur.base);
    }
    const top = -height;
    layer.rect(Math.round(0.5 - half * 0.55), top + 2, 2, 1, H.glint); layer.set(Math.round(0.5 - half * 0.55), top + 3, H.glint);
    const ey = activity === 'sleep' ? -5 : -Math.round(height * 0.55) - 2;
    eyes(layer, -3, 3, ey, eyesOf(pose, true), H.eye, activity === 'sleep');
    smile(layer, -1, ey + (activity === 'sleep' ? 2 : 3));
    blush(layer, -5, ey + 3); blush(layer, 5, ey + 3);
  });
}

/** A mini golem: stone blocks with moss on top, glowing eyes and a rune; heavy arms that swing as it lumbers. */
export function paintGolem(grid: PixelGrid, { fur }: Look, pose: Pose) {
  const { activity, frame } = pose;
  const glow = C.golemGlow, moss = furTones(C.leaf);
  const state = eyesOf(pose, true);
  const face = (layer: PixelGrid, x: number, y: number) => {
    for (const ex of [x, x + 4]) {
      if (state === 'open') { layer.rect(ex, y, 2, 2, glow); layer.set(ex, y, H.glint); }
      else if (state === 'shut') layer.rect(ex, y + 1, 2, 1, mix(glow, fur.dark, 0.6));
      else { layer.rect(ex, y, 2, 1, glow); layer.set(ex === x ? ex - 1 : ex + 2, y + 1, glow); }
    }
  };
  if (activity === 'sleep') {
    part(grid, (layer) => { ball(layer, -1, -5, 10, 5, fur); layer.rect(-4, -7, 1, 3, fur.dark); layer.rect(3, -8, 1, 4, fur.dark); });
    part(grid, (layer) => { layer.rect(4, -9, 8, 7, fur.base); layer.rect(4, -9, 8, 1, fur.light); layer.rect(11, -8, 1, 6, fur.shade); layer.rect(4, -10, 8, 2, moss.base); layer.set(5, -11, moss.light); face(layer, 5, -6); });
    return;
  }
  const step = activity === 'walk' ? frame : 0;
  part(grid, (layer) => { layer.rect(-4, -4, 3, 4 - step, fur.shade); layer.rect(2, -4, 3, 3 + step, fur.shade); });
  part(grid, (layer) => {
    layer.rect(-6, -13, 13, 9, fur.base); layer.rect(-6, -13, 13, 1, fur.light); layer.rect(-6, -13, 1, 8, fur.light);
    layer.rect(6, -12, 1, 8, fur.shade); layer.rect(-5, -5, 12, 1, fur.shade);
    layer.rect(-1, -12, 1, 3, fur.dark); layer.rect(3, -7, 2, 1, fur.dark);
    for (const [x, y] of [[1, -10], [0, -9], [2, -9], [1, -8]] as const) layer.set(x, y, glow);
  });
  part(grid, (layer) => {
    if (activity === 'wash') { layer.rect(-10, -20 + frame, 3, 8, fur.base); layer.rect(8, -20 + frame, 3, 8, fur.base); layer.rect(-10, -20 + frame, 3, 1, fur.light); layer.rect(8, -20 + frame, 3, 1, fur.light); return; }
    layer.rect(-10, -12 + step, 3, 9, fur.base); layer.rect(-10, -12 + step, 1, 9, fur.light); layer.rect(-10, -4 + step, 3, 1, fur.shade);
    layer.rect(8, -12 - step, 3, 9, fur.base); layer.rect(10, -12 - step, 1, 9, fur.shade);
  });
  part(grid, (layer) => {
    layer.rect(-3, -19, 8, 6, fur.base); layer.rect(-3, -19, 8, 1, fur.light); layer.rect(4, -18, 1, 5, fur.shade);
    layer.rect(-3, -20, 8, 2, moss.base); layer.rect(-2, -21, 3, 1, moss.base); layer.set(3, -21, moss.light); layer.set(-1, -20, moss.light);
    face(layer, -2, -17);
    blush(layer, -3, -15); blush(layer, 4, -15);
  });
}

/** A turtle: a domed shell (the colour chosen) with darker plates, a green head and stubby legs; it hides in to sleep. */
export function paintTurtle(grid: PixelGrid, { fur }: Look, pose: Pose) {
  const { activity, frame } = pose;
  const skin = furTones(C.turtleSkin);
  const asleep = activity === 'sleep';
  part(grid, (layer) => {
    if (!asleep) for (const [leg, x] of [-6, -3, 3, 6].entries()) layer.rect(x, -3, 2, activity === 'walk' && (leg + frame) % 2 ? 2 : 3, skin.base);
    layer.rect(-10, -4 + (asleep ? 2 : 0), 3, 1, skin.base);
  });
  const up = activity === 'walk' ? frame : 0;
  const hx = asleep ? 8 : 10, hy = asleep ? -3 : -8 - up;
  part(grid, (layer) => {
    if (!asleep) layer.rect(6, hy, 3, 4, skin.base);
    ball(layer, hx, hy, asleep ? 2.6 : 3.8, asleep ? 2.2 : 3.4, skin);
    sideEye(layer, hx, hy - (asleep ? 1 : 2), asleep ? 'shut' : eyesOf(pose, true));
    if (!asleep) { layer.set(hx + 3, hy + 1, H.mouth); blush(layer, hx - 1, hy + 1); }
    if (activity === 'wash') { layer.rect(hx + 3, hy + 2, 3, 1, C.leaf); layer.set(hx + 5, hy + 1 + frame, C.leaf); }
  });
  const shellY = asleep ? -6 : -7;
  part(grid, (layer) => {
    ball(layer, -0.5, shellY, 8.5, 5.5, fur);
    layer.rect(-9, shellY + 4, 18, 2, C.turtleRim); layer.rect(-9, shellY + 5, 18, 1, mix(C.turtleRim, fur.dark, 0.3));
    for (const [x, y] of [[-4, -3], [1, -4], [-6, 0], [-1, -1], [4, 0]] as const) { layer.rect(x, shellY + y, 3, 1, fur.dark, furCells(fur)); layer.set(x, shellY + y + 1, fur.dark, furCells(fur)); }
  });
}
