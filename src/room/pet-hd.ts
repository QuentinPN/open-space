// The pet as the cozy rooms draw it (src/room/cozy/): in "HD", one room pixel an art pixel like the HD people, a warm
// dark outline round each part, its fur lit at the top left and shaded at the bottom right, big shiny eyes and a touch
// of blush. Every kind, pattern, breed and model the classic room draws (pet.ts), in the colours chosen, in each of its
// activities (walking on two frames), and happy when cuddled (the classic hearts still rise, pet.ts drawHearts). A
// droid does not sleep: at rest its eye stays lit; walking, it rolls. The drawing is pure, a PixelGrid of colour cells
// (tested without a DOM, pet-hd/*.ts paint each family); hdPetSprite turns it into a canvas once, mirrored to face left.
import { ROOM_PALETTE } from '../design/room-palette.ts';
import type { PetChoice } from '../../shared/pets.ts';
import { droidColour } from './droid-art.ts';
import { PixelGrid } from './cozy/pixels.ts';
import { droidOf, furOf, type PetActivity } from './pet.ts';
import { paintAlien, paintAxolotl, paintClawd, paintCrab, paintDuck, paintFirefly, paintGolem, paintOctopus, paintOwl, paintParrot, paintPenguin, paintRocky, paintSlime, paintTurtle } from './pet-hd/critters.ts';
import { paintDroid } from './pet-hd/droid.ts';
import { type Look, type Pose, furTones } from './pet-hd/kit.ts';
import { paintCapybara, paintCat, paintDog, paintDragon, paintFox, paintGhostCat, paintHedgehog, paintManeki, paintRabbit, paintRedPanda, paintRobotDog } from './pet-hd/mammals.ts';

type Drawn = Exclude<PetChoice, { kind: 'none' }>;
type Animal = Exclude<Drawn, { kind: 'cat' | 'dog' | 'droid' }>;

/** The size of every HD pet's grid, in art pixels (one a room pixel). */
export const HD_PET_SIZE = { width: 40, height: 30 } as const;
/** Where its paws (a droid's wheels) stand in its grid facing right: the bottom row, the outline under them. */
export const HD_PET_FEET = { x: 20, y: 29 } as const;
/** Where its paws stand in its grid facing right, or mirrored to face left. */
export const hdPetFeet = (left = false) => ({ x: left ? HD_PET_SIZE.width - 1 - HD_PET_FEET.x : HD_PET_FEET.x, y: HD_PET_FEET.y });

const PAINTERS: Readonly<Record<Animal['kind'], (grid: PixelGrid, look: Look, pose: Pose) => void>> = {
  duck: paintDuck, capybara: paintCapybara, axolotl: paintAxolotl, rocky: paintRocky, clawd: paintClawd, fox: paintFox, redPanda: paintRedPanda,
  rabbit: paintRabbit, hedgehog: paintHedgehog, owl: paintOwl, parrot: paintParrot, penguin: paintPenguin, turtle: paintTurtle, crab: paintCrab,
  octopus: paintOctopus, firefly: paintFirefly, ghostCat: paintGhostCat, manekiNeko: paintManeki, robotDog: paintRobotDog, alien: paintAlien,
  dragon: paintDragon, slime: paintSlime, golem: paintGolem,
};

/**
 * The pet drawn facing right in an activity (`frame`: walking's two steps, a tail's flick), its paws at HD_PET_FEET.
 * `cuddled`: its happy face.
 */
export function hdPetGrid(choice: Drawn, activity: PetActivity, frame: 0 | 1, { cuddled = false }: { cuddled?: boolean } = {}): PixelGrid {
  // drawn around its paws, (0, 0) the cell they stand on (their outline), up negative
  const grid = new PixelGrid(-HD_PET_FEET.x, -HD_PET_FEET.y, HD_PET_SIZE.width, HD_PET_SIZE.height);
  const pose: Pose = { activity, frame, cuddled };
  if (choice.kind === 'droid') paintDroid(grid, choice.variant, droidColour(droidOf(choice)), pose);
  else {
    const look: Look = { choice, fur: furTones(furOf(choice)), iris: choice.kind === 'cat' ? choice.colors?.eyes ?? ROOM_PALETTE.pet.cats.eyes : ROOM_PALETTE.pet.black };
    if (choice.kind === 'cat') paintCat(grid, choice.variant, look, pose);
    else if (choice.kind === 'dog') paintDog(grid, choice.variant, look, pose);
    else PAINTERS[choice.kind](grid, look, pose);
  }
  const cells = new PixelGrid(0, 0, HD_PET_SIZE.width, HD_PET_SIZE.height);
  cells.cells = grid.cells;
  return cells;
}

/** How far above its paws the top of a pet's grid is, in art pixels (its Z's, its bubble go above). */
export function hdPetHeight(grid: PixelGrid): number {
  const first = grid.cells.findIndex((cell) => cell !== null);
  return first < 0 ? 0 : HD_PET_FEET.y - Math.floor(first / grid.width);
}

/** The grid mirrored: the pet facing left. */
export function mirroredGrid(grid: PixelGrid): PixelGrid {
  const mirrored = new PixelGrid(grid.x0, grid.y0, grid.width, grid.height);
  mirrored.cells = grid.cells.map((_, index) => grid.cells[index - (index % grid.width) + grid.width - 1 - (index % grid.width)]);
  return mirrored;
}

/** What a pet's picture is kept under: the same pet in the same pose is drawn once. */
const hdPetKey = (choice: Drawn, activity: PetActivity, frame: 0 | 1, left: boolean, cuddled: boolean) =>
  `${JSON.stringify(choice)}|${activity}|${frame}|${left}|${cuddled}`;

const sprites = new Map<string, HTMLCanvasElement>();

/** The pet's HD picture, drawn once and kept; `left`: facing left (its paws then at hdPetFeet(true)). */
export function hdPetSprite(choice: Drawn, activity: PetActivity, frame: 0 | 1, left = false, cuddled = false): HTMLCanvasElement {
  const key = hdPetKey(choice, activity, frame, left, cuddled);
  let canvas = sprites.get(key);
  if (canvas) return canvas;
  const right = hdPetGrid(choice, activity, frame, { cuddled });
  const grid = left ? mirroredGrid(right) : right;
  canvas = document.createElement('canvas');
  canvas.width = grid.width;
  canvas.height = grid.height;
  grid.paint(canvas.getContext('2d')!, 0, 0);
  sprites.set(key, canvas);
  return canvas;
}
