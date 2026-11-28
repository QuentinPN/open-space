import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CAT_PATTERNS, DOG_BREEDS, DROID_MODELS, PLAIN_PET_KINDS, type PetChoice } from '../../shared/pets.ts';
import { cozyPetOf, petPixels } from './cozy/pet.ts';
import type { PixelGrid } from './cozy/pixels.ts';
import type { PetActivity } from './pet.ts';
import { HD_PET_FEET, hdPetGrid, hdPetHeight } from './pet-hd.ts';

type Drawn = Exclude<PetChoice, { kind: 'none' }>;

const PETS: readonly Drawn[] = [
  ...CAT_PATTERNS.map((variant) => ({ kind: 'cat', variant }) as const),
  ...DOG_BREEDS.map((variant) => ({ kind: 'dog', variant }) as const),
  ...DROID_MODELS.map((variant) => ({ kind: 'droid', variant }) as const),
  ...PLAIN_PET_KINDS.map((kind) => ({ kind })),
];
const POSES: readonly (readonly [PetActivity, 0 | 1])[] = (['sleep', 'sit', 'wash', 'walk'] as const).flatMap((activity) => [[activity, 0], [activity, 1]] as const);
/** The pets that float above the floor while awake. */
const FLOATING = new Set<string>(['ghostCat', 'firefly']);
/** The tallest a pet sitting up or walking may be: three quarters of an HD person (36 rows), ears and all. */
const TALLEST = 27;

const nameOf = (pet: Drawn) => ('variant' in pet ? `${pet.kind} ${pet.variant}` : pet.kind);

function bounds(grid: PixelGrid) {
  let top = Infinity, bottom = -1, left = Infinity, right = -1;
  grid.cells.forEach((cell, index) => {
    if (!cell) return;
    const x = index % grid.width, y = Math.floor(index / grid.width);
    top = Math.min(top, y); bottom = Math.max(bottom, y); left = Math.min(left, x); right = Math.max(right, x);
  });
  return { top, bottom, left, right, width: right - left + 1 };
}

describe('the HD pets of the cozy rooms', () => {
  it('draws every pet in every activity whole, on its paws, a floating one above them', () => {
    for (const pet of PETS) for (const [activity, frame] of POSES) for (const cuddled of [false, true]) {
      const grid = hdPetGrid(pet, activity, frame, { cuddled });
      const { top, bottom, left, right } = bounds(grid);
      const name = `${nameOf(pet)} ${activity} ${frame}${cuddled ? ' cuddled' : ''}`;
      assert.ok(bottom >= 0, `${name}: drawn`);
      assert.ok(top > 0 && left > 0 && right < grid.width - 1, `${name}: nothing cut off at the edges`);
      assert.ok(left <= HD_PET_FEET.x && HD_PET_FEET.x <= right, `${name}: over its paws`);
      if (FLOATING.has(pet.kind) && activity !== 'sleep') assert.ok(bottom < HD_PET_FEET.y, `${name}: floats`);
      else assert.equal(bottom, HD_PET_FEET.y, `${name}: its paws on the floor`);
    }
  });

  it('keeps a pet smaller than a person, and lower and longer asleep than sitting up', () => {
    for (const pet of PETS) {
      const sitting = hdPetGrid(pet, 'sit', 0), asleep = hdPetGrid(pet, 'sleep', 0);
      for (const [activity, frame] of POSES) {
        const height = hdPetHeight(hdPetGrid(pet, activity, frame));
        assert.ok(height >= 7 && height <= TALLEST, `${nameOf(pet)} ${activity} ${frame}: ${height} rows tall`);
      }
      if (pet.kind === 'droid') continue;
      assert.ok(hdPetHeight(asleep) < hdPetHeight(sitting), `${nameOf(pet)}: lower asleep`);
      assert.ok(bounds(asleep).width > hdPetHeight(asleep), `${nameOf(pet)}: longer than tall asleep`);
    }
  });

  it('draws each pet in the colour chosen, and a cat with the eyes chosen', () => {
    const fur = '#123456';
    for (const pet of PETS) for (const activity of ['sleep', 'sit', 'walk'] as const) {
      const cells = hdPetGrid({ ...pet, colors: { fur } } as Drawn, activity, 0).cells;
      assert.ok(cells.includes(fur), `${nameOf(pet)} ${activity}`);
    }
    const eyes = '#4d8dff';
    assert.ok(hdPetGrid({ kind: 'cat', variant: 'tabby', colors: { eyes } }, 'sit', 0).cells.includes(eyes));
    assert.ok(!hdPetGrid({ kind: 'cat', variant: 'tabby' }, 'sit', 0).cells.includes(eyes));
  });

  it('shows how happy a pet is when cuddled', () => {
    for (const pet of PETS) for (const activity of ['sit', 'walk'] as const) {
      assert.notDeepEqual(hdPetGrid(pet, activity, 0, { cuddled: true }).cells, hdPetGrid(pet, activity, 0).cells, `${nameOf(pet)} ${activity}`);
    }
  });

  it('never puts a droid to sleep: at rest, its eye lit, it stands as when it sits', () => {
    for (const variant of DROID_MODELS) assert.deepEqual(hdPetGrid({ kind: 'droid', variant }, 'sleep', 0).cells, hdPetGrid({ kind: 'droid', variant }, 'sit', 0).cells);
  });

  it('lays the pet into a cozy room on its paws, facing either way', () => {
    for (const choice of [{ kind: 'cat', variant: 'calico' }, { kind: 'droid', variant: 'dome' }, { kind: 'fox' }] as const) {
      const pet = cozyPetOf(choice)!;
      const right = petPixels(pet), left = petPixels(pet, true);
      // the paws' row, as columns from the paws: mirrored when it faces left
      const paws = (pixels: typeof right) => pixels.cells.flatMap((cell, index) =>
        (cell && Math.floor(index / pixels.width) === pixels.feet.y ? [(index % pixels.width) - pixels.feet.x] : [])).sort((a, b) => a - b);
      assert.ok(paws(right).length > 0, `${choice.kind}: on its paws`);
      assert.deepEqual(paws(left), paws(right).map((x) => 0 - x || 0).sort((a, b) => a - b), `${choice.kind}: mirrored round its paws`);
      assert.equal(right.top, hdPetHeight(hdPetGrid(choice, choice.kind === 'droid' ? 'sit' : 'sleep', 0)), `${choice.kind}: its height above its paws`);
    }
  });
});
