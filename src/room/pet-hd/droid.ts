// The HD droids (pet-hd.ts), front on like the classic room's (droid-art.ts): a dome on a barrel between two legs (an
// astromech), a square head on a barrel, or a ball rolling under a little dome. Its panels take the colour chosen; its
// eye stays lit at rest (a droid does not sleep), happy arcs when cuddled; rolling, its wheels turn (or its ball rolls).
import { DROID_PARTS as D } from '../../design/people-palette.ts';
import type { DroidModel } from '../../../shared/pets.ts';
import type { PixelGrid } from '../cozy/pixels.ts';
import { type Fur, type Pose, ball, blush, furTones, part } from './kit.ts';

const WHITE = () => furTones(D.white);

/** Its lens, 3 by 3 at (x, y): the eye lit with a glint, or happy arcs. */
function lens(layer: PixelGrid, x: number, y: number, happy: boolean) {
  layer.rect(x, y, 3, 3, D.lens);
  if (happy) { layer.rect(x, y + 1, 3, 1, D.eye); layer.set(x, y + 2, D.eye); layer.set(x + 2, y + 2, D.eye); return; }
  layer.rect(x + 1, y + 1, 2, 2, D.eye); layer.set(x + 1, y + 1, D.glint);
}

/** A wheel `width` wide at (x, row -1 to 0), its spokes at one turn or the next. */
function wheel(layer: PixelGrid, x: number, width: number, turned: boolean) {
  layer.rect(x, -2, width, 2, D.wheel);
  for (let column = x + (turned ? 1 : 0); column < x + width; column += 2) layer.set(column, -2, D.dark);
}

/** A white plate shaded on its right and its bottom. */
function plate(layer: PixelGrid, x: number, y: number, width: number, height: number) {
  const white = WHITE();
  layer.rect(x, y, width, height, white.base); layer.rect(x + width - 2, y, 2, height, D.shade); layer.rect(x, y + height - 1, width, 1, D.shade);
  layer.rect(x, y, width - 2, 1, white.light);
}

function barrel(grid: PixelGrid, panel: Fur, top: number, turned: boolean, legs: boolean) {
  if (legs) part(grid, (layer) => {
    for (const x of [-9, 7]) { plate(layer, x, top + 1, 3, -top - 3); layer.rect(x, top + 3, 3, 2, panel.base); }
    wheel(layer, -10, 5, turned); wheel(layer, 6, 5, turned);
  });
  part(grid, (layer) => {
    plate(layer, -5, top, 11, -top - 2);
    layer.rect(-3, top + 2, 3, 3, panel.base); layer.set(-3, top + 2, panel.light);
    layer.rect(2, top + 2, 2, 2, panel.base); layer.rect(2, top + 5, 2, 2, panel.shade);
    layer.rect(-3, top + 6, 3, 1, D.dark);
    layer.rect(-1, -2, 3, 2, D.wheel); layer.set(turned ? 0 : 1, -2, D.dark);
  });
}

export function paintDroid(grid: PixelGrid, model: DroidModel, colour: string, pose: Pose) {
  const panel = furTones(colour);
  const turned = pose.activity === 'walk' && pose.frame === 1;
  const happy = pose.cuddled;
  if (model === 'sphere') {
    part(grid, (layer) => {
      ball(layer, 0.5, -7, 7, 7, WHITE());
      // its panels, rolled round on the other turn
      const rings = turned ? [[-3, -9], [3, -4], [4, -11]] : [[-2, -5], [3, -9], [-4, -10]];
      for (const [x, y] of rings) { layer.ellipse(x + 0.5, y + 0.5, 1.9, 1.9, panel.base); layer.set(x, y, panel.light); }
      layer.rect(-6, -7 + (turned ? 1 : 0), 13, 1, D.shade, [WHITE().base, WHITE().light, WHITE().shade]);
    });
    part(grid, (layer) => {
      layer.ellipse(0.5, -14.5, 4.5, 3.2, D.white); layer.rect(-4, -14, 9, 1, panel.base); layer.rect(-4, -13, 9, 1, D.shade);
      lens(layer, -1, -18, happy);
      if (happy) blush(layer, -4, -15);
    });
    return;
  }
  barrel(grid, panel, -13, turned, true);
  part(grid, (layer) => {
    if (model === 'dome') {
      layer.ellipse(0.5, -13.5, 6.5, 6, D.white, undefined);
      for (let y = -12; y <= -6; y++) for (let x = -7; x <= 8; x++) layer.set(x, y, null);
      layer.rect(-6, -13, 13, 1, D.shade);
      layer.rect(-5, -16, 11, 1, panel.base); layer.rect(-3, -19, 2, 2, panel.base); layer.rect(3, -18, 2, 2, panel.base);
      layer.rect(-3, -18, 1, 1, panel.light);
      lens(layer, 0, -17 + 1, happy);
      if (happy) blush(layer, -4, -14);
    } else {
      layer.rect(-1, -14, 3, 1, D.shade);
      plate(layer, -5, -22, 11, 8);
      layer.rect(-5, -22, 11, 2, panel.base); layer.rect(-5, -22, 9, 1, panel.light);
      lens(layer, -3, -19, happy);
      layer.rect(2, -18, 3, 1, panel.base); layer.rect(2, -16, 2, 1, D.dark);
      if (happy) blush(layer, 2, -17);
    }
  });
}
