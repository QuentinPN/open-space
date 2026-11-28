// The user's pet in the cozy rooms (Preferences.pet): its HD drawing (pet-hd.ts), in its colours, asleep, or at rest
// for a droid, laid into a room's pixels (one room pixel an art pixel, like the HD people), so the room's light falls
// on it like on the rest; an animal's Z's rise over it, a droid has none. All of it is pure (tested without a DOM).
import type { PetChoice } from '../../../shared/pets.ts';
import type { DroidLook } from '../droid-art.ts';
import { droidOf } from '../pet.ts';
import { hdPetFeet, hdPetGrid, hdPetHeight, mirroredGrid } from '../pet-hd.ts';
import type { PixelGrid } from './pixels.ts';

type Animal = Exclude<PetChoice, { kind: 'none' | 'droid' }>;

/** What the cozy rooms draw of the pet: an animal curled up asleep, a droid front on, its wheels still. */
export type CozyPet = { kind: 'animal'; animal: Animal } | { kind: 'droid'; droid: DroidLook };

/** The pet the user chose as the cozy rooms draw it; none for 'none'. */
export function cozyPetOf(choice: PetChoice): CozyPet | null {
  if (choice.kind === 'none') return null;
  if (choice.kind === 'droid') return { kind: 'droid', droid: droidOf(choice) };
  return { kind: 'animal', animal: choice };
}

/** Room pixels to an art pixel of the pet: one, its HD art drawn at the room's own size, like the HD people. */
export const PET_SCALE = 1;

/** What a room's cached art with the pet in it is kept under. */
export const petKey = (pet: CozyPet | null) => (pet ? JSON.stringify(pet) : '');

/** The pet's pixels, a colour or null each, row by row, and where its paws (a droid's wheels) are among them. */
export interface PetPixels { width: number; height: number; cells: readonly (string | null)[]; feet: { x: number; y: number }; top: number }

const drawn = new Map<string, PetPixels>();

/** The pet's pixels, facing right (`left`: mirrored): an animal asleep, a droid at rest, its eye lit. */
export function petPixels(pet: CozyPet, left = false): PetPixels {
  const key = `${petKey(pet)}|${left}`;
  let pixels = drawn.get(key);
  if (pixels) return pixels;
  const right = pet.kind === 'droid'
    ? hdPetGrid({ kind: 'droid', variant: pet.droid.model, ...(pet.droid.color ? { colors: { fur: pet.droid.color } } : {}) }, 'sit', 0)
    : hdPetGrid(pet.animal, 'sleep', 0);
  const grid: PixelGrid = left ? mirroredGrid(right) : right;
  pixels = { width: grid.width, height: grid.height, cells: grid.cells, feet: hdPetFeet(left), top: hdPetHeight(grid) };
  drawn.set(key, pixels);
  return pixels;
}

/** The pet on a room's grid, its paws at (x, y) in the room's pixels. */
export function paintPet(grid: PixelGrid, pixels: PetPixels, x: number, y: number) {
  pixels.cells.forEach((colour, index) => {
    if (colour) grid.rect(x + ((index % pixels.width) - pixels.feet.x) * PET_SCALE, y + (Math.floor(index / pixels.width) - pixels.feet.y) * PET_SCALE, PET_SCALE, PET_SCALE, colour);
  });
}

/**
 * Where the Z's of the pet asleep with its paws at (x, y) rise from: just over its head, which rests at the front of
 * its curl. None for a droid: at rest it stands still, its eye lit, as the classic room draws it (pet.ts drawPet), it
 * does not sleep.
 */
export const petZzzAt = (pet: CozyPet, pixels: PetPixels, x: number, y: number): [number, number] | null =>
  (pet.kind === 'droid' ? null : [x + 5 * PET_SCALE, y - pixels.top * PET_SCALE - 3]);
