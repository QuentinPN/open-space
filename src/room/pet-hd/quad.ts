// The four-legged HD pets' body plan (pet-hd.ts): a pear of a body sitting up, a bean on four legs walking, a loaf
// curled up asleep, each with its own head turned to us and its own tail. The kinds (mammals.ts) give the parts.
import type { PixelGrid } from '../cozy/pixels.ts';
import { type Eyes, type Fur, type Pose, ball, eyesOf, part } from './kit.ts';

/** How a head is drawn: its face's middle between the columns cx and cx + 1, its top (ears aside) at y. */
export interface HeadOptions { flat?: boolean; licking?: boolean; panting?: boolean }
export type Head = (grid: PixelGrid, cx: number, y: number, state: Eyes, options: HeadOptions) => void;

/** Where a tail leaves the body: sitting, the back of its base; walking, the rump; asleep, the back of the loaf. */
export type Tail = (grid: PixelGrid, pose: Pose, x: number, y: number) => void;

export interface Quad {
  fur: Fur;
  /** the legs' colour (a fox's socks), and the paws' */
  legs: Fur;
  paws: Fur;
  /** a white chest, or none */
  chest: string | null;
  /** cells longer (a corgi, a dachshund) */
  long: number;
  /** short legs */
  short: boolean;
  /** stripes, spots, patches over the body's fur, in the box (x, y, width, height) */
  marks?: (layer: PixelGrid, x: number, y: number, width: number, height: number) => void;
  tail: Tail;
  head: Head;
  /** washes by licking a raised paw (a cat), else pants (a dog) */
  licks: boolean;
  /** a collar under the chin, its tag hanging */
  collar?: { band: string; tag: string };
  /** drawn behind the body (a dragon's wings), at the top of its back */
  back?: (grid: PixelGrid, pose: Pose, x: number, y: number) => void;
}

/** The pet's body, its tail and its head, in the pose; facing right, its paws on row 0. */
export function quadruped(grid: PixelGrid, q: Quad, pose: Pose) {
  const { fur, long } = q;
  const { activity, frame } = pose;
  const state = eyesOf(pose, !q.licks);
  const half = long / 2;
  if (activity === 'sleep') {
    // curled up, its head on its front paws, the tail wrapped round the front
    q.back?.(grid, pose, -3, -8);
    part(grid, (layer) => {
      ball(layer, -2 - half * 0.4, -4, 10 + half, 4.4, fur);
      q.marks?.(layer, -11 - half, -8, 13 + long, 3);
    });
    q.head(grid, 4 + Math.round(half * 0.6), -10, state, { flat: true });
    q.tail(grid, pose, -11 - Math.round(half), 0);
    return;
  }
  if (activity === 'walk') {
    const rise = q.short ? 2 : 0;
    const bodyY = -6.5 + rise;
    q.tail(grid, pose, -9 - Math.round(half), -7 + rise);
    q.back?.(grid, pose, -2, bodyY - 3);
    part(grid, (layer) => {
      const back = (x: number) => x - Math.round(half), front = (x: number) => x + Math.round(half);
      const far = frame ? [back(-7), front(3)] : [back(-5), front(1)], near = frame ? [back(-5), front(1)] : [back(-8), front(4)];
      const top = q.short ? -2 : -4;
      for (const x of far) layer.rect(x, top, 2, -top, q.legs.shade);
      ball(layer, -1.5, bodyY, 8 + half, 3.8, fur);
      q.marks?.(layer, -8 - long, bodyY - 3.5, 12 + long, 3);
      if (q.chest) layer.rect(-6 - long, bodyY + 2.5, 10 + long, 1, q.chest, [fur.light, fur.base, fur.shade]);
      for (const x of near) { layer.rect(x, top, 2, -top, q.legs.base); layer.rect(x, -1, 2, 1, q.paws.base); }
    });
    const cx = 3 + Math.round(half * 1.2), y = -16 + rise;
    q.head(grid, cx, y, state, {});
    if (q.collar) collar(grid, q.collar, cx, y);
    return;
  }
  // sitting up, the tail round its paws (flicking its tip); washing a paw raised to its mouth, or panting
  q.tail(grid, pose, -3, 0);
  q.back?.(grid, pose, 0, -9);
  part(grid, (layer) => {
    ball(layer, 0.5, -4.6, 5.6, 4.6, fur);
    q.marks?.(layer, -5, -9, 11, 4);
    if (q.chest) layer.ellipse(1, -4.5, 2.6, 3.6, q.chest, [fur.light, fur.base, fur.shade]);
  });
  part(grid, (layer) => {
    const { paws } = q;
    layer.rect(-3, -2, 3, 2, paws.base); layer.set(-3, -2, paws.light);
    layer.rect(2, -2, 3, 2, paws.base); if (!(activity === 'wash' && q.licks)) layer.set(2, -2, paws.light);
    layer.set(-2, -1, paws.shade); layer.set(3, -1, paws.shade);
  });
  const licking = activity === 'wash' && q.licks;
  const y = licking ? -17 : -18;
  q.head(grid, 0, y, state, { licking, panting: activity === 'wash' && !q.licks });
  if (q.collar) collar(grid, q.collar, 0, y);
  if (licking) part(grid, (layer) => { layer.ellipse(4.5, y + 8.5, 1.8, 2.4, q.paws.base); layer.set(4, y + 7, q.paws.light); });
}

/** A collar under the chin of a head at (cx, y), its tag hanging. */
function collar(grid: PixelGrid, { band, tag }: { band: string; tag: string }, cx: number, y: number) {
  grid.rect(cx - 2, y + 11, 6, 1, band);
  grid.set(cx + 1, y + 12, tag);
}
