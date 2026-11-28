// The user's pet in the cozy rooms (Preferences.pet): the classic room's own drawing of it, in its colours (pet.ts
// petSprite, droid-art.ts droidPreview), asleep, or at rest for a droid, laid into a room's pixels (PET_SCALE room
// pixels to an art pixel, as in the classic room), so the room's light falls on it like on the rest; an animal's Z's
// rise over it, a droid has none. A poke is the classic room's cuddle (pet.ts cuddle): it speaks, hearts float up,
// and an animal sits up a while before it falls asleep again. Which drawing and the poke are pure (tested without a
// DOM); its pixels are read once from the classic canvas.
import type { PetChoice } from '../../../shared/pets.ts';
import { droidPreview, type DroidLook } from '../droid-art.ts';
import { HEART_MS, PET_FEET, droidOf, petSprite, type Pet } from '../pet.ts';
import { ART_SCALE } from '../pixel-art.ts';
import type { PixelGrid } from './pixels.ts';

type Animal = Exclude<PetChoice, { kind: 'none' | 'droid' }>;

/** What the cozy rooms draw of the pet: an animal curled up asleep (or sitting up, `awake`), a droid front on, its wheels still. */
export type CozyPet = { kind: 'animal'; animal: Animal; awake?: true } | { kind: 'droid'; droid: DroidLook };

/** The pet the user chose as the cozy rooms draw it, asleep or `awake`; none for 'none'. A droid looks the same either way. */
export function cozyPetOf(choice: PetChoice, awake = false): CozyPet | null {
  if (choice.kind === 'none') return null;
  if (choice.kind === 'droid') return { kind: 'droid', droid: droidOf(choice) };
  return awake ? { kind: 'animal', animal: choice, awake: true } : { kind: 'animal', animal: choice };
}

/**
 * The pet lying in a cozy room as the classic room's cuddles see it (pet.ts Pet): asleep where it lies, going nowhere.
 * A poke is pet.ts cuddle (it speaks, hearts float up, it sits up a while).
 */
export function sleepingPet(): Pet {
  return {
    position: { x: 0, y: 0 }, heading: { x: 1, y: 0 }, path: [], activity: 'sleep', time: 0, until: Number.POSITIVE_INFINITY, speakUntil: 0,
    nextSpeech: Number.POSITIVE_INFINITY, line: 0, hearts: [], passing: null, leaveAt: Number.POSITIVE_INFINITY, exit: null, beamAt: 0,
  };
}

/** The pet's clock goes on `ms`: its hearts fade, and once its cuddle is over it falls asleep again where it lies. */
export function restPet(pet: Pet, ms: number) {
  pet.time += ms;
  pet.hearts = pet.hearts.filter((born) => pet.time - born < HEART_MS);
  if (pet.activity !== 'sleep' && pet.time >= pet.until) { pet.activity = 'sleep'; pet.until = Number.POSITIVE_INFINITY; }
}

/** Woken by a poke, not asleep yet again. */
export const isAwake = (pet: Pet) => pet.activity !== 'sleep';

/**
 * Room pixels to an art pixel of the pet: the classic room's own (pixel-art.ts ART_SCALE), so it is about as big as
 * the cozy rooms' pets were (a curled-up cat some 25 pixels long) and as crisp as the art around it.
 */
export const PET_SCALE = ART_SCALE;

/** What a room's cached art with the pet in it is kept under. */
export const petKey = (pet: CozyPet | null) => (pet ? JSON.stringify(pet) : '');

/** The pet's pixels, a colour or null each, row by row, and where its paws (a droid's wheels) are among them. */
export interface PetPixels { width: number; height: number; cells: readonly (string | null)[]; feet: { x: number; y: number }; top: number }

const hex = (red: number, green: number, blue: number) => `#${((red << 16) | (green << 8) | blue).toString(16).padStart(6, '0')}`;

const read = new Map<string, PetPixels>();

/** The pet's pixels, facing right (`left`: mirrored), read from the classic room's drawing of it the first time. */
export function petPixels(pet: CozyPet, left = false): PetPixels {
  const key = `${petKey(pet)}|${left}`;
  let pixels = read.get(key);
  if (pixels) return pixels;
  const canvas = pet.kind === 'droid' ? droidPreview(pet.droid, false) : petSprite(pet.animal, pet.awake ? 'sit' : 'sleep', 0, left);
  const { width, height } = canvas;
  const data = canvas.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, width, height).data;
  const cells = Array.from({ length: width * height }, (_, index) => (data[index * 4 + 3] > 40 ? hex(data[index * 4], data[index * 4 + 1], data[index * 4 + 2]) : null));
  const firstRow = Math.floor(cells.findIndex((cell) => cell !== null) / width);
  const feet = pet.kind === 'droid' ? { x: Math.floor(width / 2), y: height - 2 } : { x: left ? width - 1 - PET_FEET.x : PET_FEET.x, y: PET_FEET.y };
  pixels = { width, height, cells, feet, top: feet.y - Math.max(0, firstRow) };
  read.set(key, pixels);
  return pixels;
}

/** The pet on a room's grid, its paws at (x, y) in the room's pixels. */
export function paintPet(grid: PixelGrid, pixels: PetPixels, x: number, y: number) {
  pixels.cells.forEach((colour, index) => {
    if (colour) grid.rect(x + ((index % pixels.width) - pixels.feet.x) * PET_SCALE, y + (Math.floor(index / pixels.width) - pixels.feet.y) * PET_SCALE, PET_SCALE, PET_SCALE, colour);
  });
}

/**
 * Where the Z's of the pet asleep with its paws at (x, y) rise from: just over its head. None for a droid: at rest it
 * stands still, its eye lit, as the classic room draws it (pet.ts drawPet), it does not sleep; none for an animal awake.
 */
export const petZzzAt = (pet: CozyPet, pixels: PetPixels, x: number, y: number): [number, number] | null =>
  (pet.kind === 'droid' || pet.awake ? null : [x + 3 * PET_SCALE, y - pixels.top * PET_SCALE - 3]);
