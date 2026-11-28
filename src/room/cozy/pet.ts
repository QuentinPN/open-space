// The user's pet in the cozy rooms (Preferences.pet), drawn: the classic room's own drawing of it, in its colours
// (pet.ts petSprite, droid-art.ts drawDroid), at PET_SCALE room pixels to an art pixel, as in the classic room. It lives
// at home (home-pet.ts): it walks there, its legs going, sits, washes, sleeps with Z's rising over it, a droid stands
// by. Which drawing is pure (tested without a DOM); drawPetSprite is the one call that draws it.
import type { PetChoice } from '../../../shared/pets.ts';
import { drawDroid, droidHeight, droidPreview, type DroidLook } from '../droid-art.ts';
import { PET_FEET, PET_HEIGHT, droidOf, facesBack, facesLeft, petFrame, petSprite, type Pet, type PetActivity } from '../pet.ts';
import { ART_SCALE } from '../pixel-art.ts';

type Animal = Exclude<PetChoice, { kind: 'none' | 'droid' }>;

/** What the cozy rooms draw of the pet: an animal, or a droid. */
export type CozyPet = { kind: 'animal'; animal: Animal } | { kind: 'droid'; droid: DroidLook };

/** The pet the user chose as the cozy rooms draw it; none for 'none'. */
export function cozyPetOf(choice: PetChoice): CozyPet | null {
  if (choice.kind === 'none') return null;
  if (choice.kind === 'droid') return { kind: 'droid', droid: droidOf(choice) };
  return { kind: 'animal', animal: choice };
}

/**
 * How the pet is drawn in a frame: what it does (a droid rolls while it walks and stands by otherwise), which of its two
 * drawings (its legs, its tail; a droid's wheels), and which way it faces on the screen.
 */
export interface PetPose { activity: PetActivity; frame: 0 | 1; left: boolean; back: boolean }

/** The pose of the pet living at home (pet.ts Pet) at `time`, the room's clock, as the classic room draws it (pet.ts drawPet). */
export const petPose = (pet: Pick<Pet, 'activity' | 'heading'>, time: number): PetPose =>
  ({ activity: pet.activity, frame: petFrame(pet, time), left: facesLeft(pet.heading), back: facesBack(pet.heading) });

/** How long a droid's wheel turn lasts (droid-art.ts drawDroid): its second drawing is shown at that time. */
const DROID_TURN_MS = 140;

/** The pet in `pose`, its paws (a droid's wheels) at (x, y) in the room's pixels. */
export function drawPetSprite(context: CanvasRenderingContext2D, pet: CozyPet, pose: PetPose, x: number, y: number) {
  if (pet.kind === 'droid') {
    drawDroid(context, pet.droid, x, y, { moving: pose.activity === 'walk', back: pose.back, left: pose.left, time: pose.frame * DROID_TURN_MS });
    return;
  }
  const sprite = petSprite(pet.animal, pose.activity, pose.frame, pose.left);
  context.drawImage(sprite, Math.round(x - PET_FEET.x * PET_SCALE), Math.round(y - PET_FEET.y * PET_SCALE), sprite.width * PET_SCALE, sprite.height * PET_SCALE);
}

/**
 * Room pixels to an art pixel of the pet: the classic room's own (pixel-art.ts ART_SCALE), so it is about as big as
 * the cozy rooms' pets were (a curled-up cat some 25 pixels long) and as crisp as the art around it.
 */
export const PET_SCALE = ART_SCALE;

/** How far above its paws the top of the pet is, in the room's pixels (its hearts and words go above), as in the classic room (pet.ts petHeight). */
export const petTop = (pet: CozyPet) => (pet.kind === 'droid' ? droidHeight(pet.droid.model) : PET_HEIGHT);

/** What a room's cached art with the pet asleep in it is kept under. */
export const petKey = (pet: CozyPet | null) => (pet ? JSON.stringify(pet) : '');

/** The pet's pixels, a colour or null each, row by row, and where its paws (a droid's wheels) are among them. */
export interface PetPixels { width: number; height: number; cells: readonly (string | null)[]; feet: { x: number; y: number }; top: number }

const hex = (red: number, green: number, blue: number) => `#${((red << 16) | (green << 8) | blue).toString(16).padStart(6, '0')}`;

const read = new Map<string, PetPixels>();

/** The pet's pixels asleep, facing right (`left`: mirrored), read from the classic room's drawing of it the first time. */
export function petPixels(pet: CozyPet, left = false): PetPixels {
  const key = `${petKey(pet)}|${left}`;
  let pixels = read.get(key);
  if (pixels) return pixels;
  const canvas = pet.kind === 'droid' ? droidPreview(pet.droid, false) : petSprite(pet.animal, 'sleep', 0, left);
  const { width, height } = canvas;
  const data = canvas.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, width, height).data;
  const cells = Array.from({ length: width * height }, (_, index) => (data[index * 4 + 3] > 40 ? hex(data[index * 4], data[index * 4 + 1], data[index * 4 + 2]) : null));
  const firstRow = Math.floor(cells.findIndex((cell) => cell !== null) / width);
  const feet = pet.kind === 'droid' ? { x: Math.floor(width / 2), y: height - 2 } : { x: left ? width - 1 - PET_FEET.x : PET_FEET.x, y: PET_FEET.y };
  pixels = { width, height, cells, feet, top: feet.y - Math.max(0, firstRow) };
  read.set(key, pixels);
  return pixels;
}

/**
 * Where the Z's of the pet doing `activity` with its paws at (x, y) rise from: just over its head while it sleeps. None
 * for a droid: it stands by, its eye lit, as the classic room draws it (pet.ts drawPet), it does not sleep; none awake.
 */
export const petZzzAt = (pet: CozyPet, activity: PetActivity, pixels: PetPixels, x: number, y: number): [number, number] | null =>
  (pet.kind === 'droid' || activity !== 'sleep' ? null : [x + 3 * PET_SCALE, y - pixels.top * PET_SCALE - 3]);
