// The user's pet in the cozy rooms (Preferences.pet), drawn: its HD drawing (pet-hd.ts), in its colours, one room pixel
// an art pixel like the HD people. It lives at home (home-pet.ts): it walks there, its legs going, sits, washes, sleeps
// with Z's rising over it, a droid stands by, its eye lit; cuddled, it shows its happy face. Which drawing is pure
// (tested without a DOM); drawPetSprite is the one call that draws it.
import type { PetChoice } from '../../../shared/pets.ts';
import type { DroidLook } from '../droid-art.ts';
import { HEART_MS, droidOf, facesLeft, petFrame, type Pet, type PetActivity } from '../pet.ts';
import { hdPetFeet, hdPetGrid, hdPetHeight, hdPetSprite, mirroredGrid } from '../pet-hd.ts';
import type { PixelGrid } from './pixels.ts';

type Animal = Exclude<PetChoice, { kind: 'none' | 'droid' }>;

/** What the cozy rooms draw of the pet: an animal, or a droid. */
export type CozyPet = { kind: 'animal'; animal: Animal } | { kind: 'droid'; droid: DroidLook };

/** The pet the user chose as the cozy rooms draw it; none for 'none'. */
export function cozyPetOf(choice: PetChoice): CozyPet | null {
  if (choice.kind === 'none') return null;
  if (choice.kind === 'droid') return { kind: 'droid', droid: droidOf(choice) };
  return { kind: 'animal', animal: choice };
}

/** The pet as the HD drawing takes it: the animal chosen, or the droid's model in its colour. */
const hdChoice = (pet: CozyPet) => (pet.kind === 'droid'
  ? { kind: 'droid' as const, variant: pet.droid.model, ...(pet.droid.color ? { colors: { fur: pet.droid.color } } : {}) }
  : pet.animal);

/**
 * How the pet is drawn in a frame: what it does (a droid rolls while it walks and stands by otherwise), which of its two
 * drawings (its legs, its tail; a droid's wheels), which way it faces on the screen, and whether it is being cuddled.
 */
export interface PetPose { activity: PetActivity; frame: 0 | 1; left: boolean; cuddled: boolean }

/** The pose of the pet living at home (pet.ts Pet) at `time`, the room's clock: happy while a cuddle's hearts rise. */
export const petPose = (pet: Pick<Pet, 'activity' | 'heading' | 'hearts' | 'time'>, time: number): PetPose => ({
  activity: pet.activity, frame: petFrame(pet, time), left: facesLeft(pet.heading),
  cuddled: pet.hearts.some((born) => pet.time >= born && pet.time - born < HEART_MS),
});

/** Room pixels to an art pixel of the pet: one, its HD art drawn at the room's own size, like the HD people. */
export const PET_SCALE = 1;

/** The pet in `pose`, its paws (a droid's wheels) at (x, y) in the room's pixels. */
export function drawPetSprite(context: CanvasRenderingContext2D, pet: CozyPet, pose: PetPose, x: number, y: number) {
  const sprite = hdPetSprite(hdChoice(pet), pose.activity, pose.frame, pose.left, pose.cuddled);
  const feet = hdPetFeet(pose.left);
  context.drawImage(sprite, Math.round(x - feet.x * PET_SCALE), Math.round(y - feet.y * PET_SCALE), sprite.width * PET_SCALE, sprite.height * PET_SCALE);
}

const tops = new Map<string, number>();

/** How far above its paws the top of the pet is, sitting up, in the room's pixels (its hearts and words go above). */
export function petTop(pet: CozyPet): number {
  const key = petKey(pet);
  let top = tops.get(key);
  if (top === undefined) {
    top = hdPetHeight(hdPetGrid(hdChoice(pet), 'sit', 0)) * PET_SCALE;
    tops.set(key, top);
  }
  return top;
}

/** What a pet's cached drawings are kept under. */
export const petKey = (pet: CozyPet | null) => (pet ? JSON.stringify(pet) : '');

/** The pet's pixels, a colour or null each, row by row, and where its paws (a droid's wheels) are among them. */
export interface PetPixels { width: number; height: number; cells: readonly (string | null)[]; feet: { x: number; y: number }; top: number }

const drawn = new Map<string, PetPixels>();

/** The pet's pixels, facing right (`left`: mirrored): an animal asleep, a droid at rest, its eye lit. */
export function petPixels(pet: CozyPet, left = false): PetPixels {
  const key = `${petKey(pet)}|${left}`;
  let pixels = drawn.get(key);
  if (pixels) return pixels;
  const right = hdPetGrid(hdChoice(pet), pet.kind === 'droid' ? 'sit' : 'sleep', 0);
  const grid: PixelGrid = left ? mirroredGrid(right) : right;
  pixels = { width: grid.width, height: grid.height, cells: grid.cells, feet: hdPetFeet(left), top: hdPetHeight(grid) };
  drawn.set(key, pixels);
  return pixels;
}

/**
 * Where the Z's of the pet doing `activity` with its paws at (x, y) rise from: just over its head while it sleeps, which
 * rests at the front of its curl. None for a droid: it stands by, its eye lit, it does not sleep; none awake.
 */
export const petZzzAt = (pet: CozyPet, activity: PetActivity, pixels: PetPixels, x: number, y: number): [number, number] | null =>
  (pet.kind === 'droid' || activity !== 'sleep' ? null : [x + 5 * PET_SCALE, y - pixels.top * PET_SCALE - 3]);
