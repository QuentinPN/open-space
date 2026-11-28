// One frame of the cozy rooms (src/room/cozy/): each room's art (drawn once per mood of the hour and festival,
// decor.ts), its clock's hands (outlined under the pointer), its screens at work, its people and visitors and what
// stands in front of them in depth order, the pet's Z's and the nappers'; the user's home its own way (home/art.ts);
// then everyone's name tag on top, and what the visitors came for (or their birthday wish).
import type { Festival } from '../../../shared/festivals.ts';
import { ROOM_PALETTE as P } from '../../design/room-palette.ts';
import { t } from '../../i18n/index.ts';
import { paintActivity } from '../activity-icons.ts';
import { paintNameTags, paintSpeech, paintZzz, personTag, TAG_FONT, TAG_LIFT, type FrameOptions, type PlacedTag } from '../draw.ts';
import type { Point } from '../geometry.ts';
import { PLAYER_ID } from '../scene.ts';
import type { Pose, SpriteSource } from '../sprites.ts';
import type { Activity } from '../visitors.ts';
import { clockHands, clockOutline } from './clock.ts';
import { ROOM_CLOCK, paintCode, paintIdleScreen, paintZzzAt, roomArt } from './decor.ts';
import { CAT_SPOT, iso, type Figure } from './geometry.ts';
import { paintHome, type HomeThing } from './home/art.ts';
import { petPixels, petZzzAt, type CozyPet } from './pet.ts';
import { homeThemeOf, type CallFace } from './home/index.ts';
import type { PlacedSitter } from './people.ts';
import { occluderDepth } from './visits.ts';
import type { CozyRoom } from './rooms.ts';

/**
 * Someone of the crew dropping by (visits.ts): where their feet are in the overview, their pose, what they came for once
 * there, and whose birthday they wish out loud now (visitors.ts birthdayWishOf), if they do.
 */
export interface PlacedVisitor extends Figure { name: string; pose: Pose; depth: number; activity: Activity | null; wish: readonly string[] | null; blinkOffset: number }

/** A room of the frame: where it is (its box's top left corner), who sits in it, placed (people.ts placeSitters), who drops by. */
export interface FrameRoom { room: CozyRoom; at: Point; sitters: readonly PlacedSitter[]; visitors: readonly PlacedVisitor[] }

export interface CozyFrameOptions extends Pick<FrameOptions, 'hideNames' | 'tagColors' | 'hoveredId' | 'openSessionIds' | 'reducedMotion'> {
  time: number;
  /** the hour shown (the "try an hour" preview, else now): the light, the windows and the clocks */
  hour: number;
  /** the festival the rooms are dressed for */
  festival: Festival | null;
  /** the room pixels' size on the canvas */
  scale: number;
  /** a name tag's pixels' size on the canvas: the tags keep about the office's size on screen as the rooms grow */
  tagScale: number;
  /** the room the pet sleeps in, in an office */
  catRoom: string;
  /** the user's pet (pet.ts), or none: asleep in `catRoom`, and in the homes that have a place for it */
  pet: CozyPet | null;
  /** what is outlined under the pointer, in which room: the user's computer at home, a clock */
  hovered: { room: string; thing: HomeThing } | null;
  /** the user's first name, on their tag */
  playerName: string;
  /** who shows in the video call on the user's screen at home (home/index.ts callFace) */
  callFaces: readonly CallFace[];
}

/** About 15 a second: what the screens and the pet's Z's count by. */
const frameOf = (time: number) => Math.floor(time / (1000 / 15));

/** Someone seated, drawn in their room's pixels (`at`: the room's corner), with a ring under them while their session is open. */
function paintSitter(context: CanvasRenderingContext2D, sprites: SpriteSource, placed: PlacedSitter, at: Point, options: CozyFrameOptions) {
  const feet = { x: placed.feet.x - at.x, y: placed.feet.y - at.y };
  if (options.openSessionIds.includes(placed.id)) {
    context.strokeStyle = P.selection;
    context.lineWidth = 1;
    context.beginPath();
    context.ellipse(feet.x, feet.y + placed.sitter.place.lift, 10, 4, 0, 0, Math.PI * 2);
    context.stroke();
  }
  sprites.draw(context, placed.id, placed.pose, feet.x, feet.y);
}

function paintRoom(context: CanvasRenderingContext2D, sprites: SpriteSource, { room, at, sitters, visitors }: FrameRoom, options: CozyFrameOptions) {
  const frame = options.reducedMotion ? 0 : frameOf(options.time);
  context.setTransform(options.scale, 0, 0, options.scale, at.x * options.scale, at.y * options.scale);
  const hovered = options.hovered?.room === room.id ? options.hovered.thing : null;
  if (room.kind === 'home') {
    const home = { pet: options.pet, frame, hour: options.hour, festival: options.festival, faces: options.callFaces, hovered };
    paintHome(context, room.home ?? homeThemeOf(undefined), home, () => { for (const placed of sitters) paintSitter(context, sprites, placed, at, options); });
    return;
  }
  const pet = options.catRoom === room.id ? options.pet : null;
  const art = roomArt(room.kind, room.lit, options.hour, options.festival, pet);
  context.drawImage(art.back, 0, 0);
  context.drawImage(clockHands(ROOM_CLOCK, options.hour), 0, 0);
  if (hovered === 'clock') context.drawImage(clockOutline(ROOM_CLOCK), 0, 0);
  // the screens of the back desks, towards us: code going by while their session works
  for (const { sitter } of sitters) {
    if (sitter.desk?.kind !== 'back') continue;
    if (sitter.person?.status === 'working') paintCode(context, sitter.desk, frame);
    else paintIdleScreen(context, sitter.desk);
  }
  if (pet && art.pet) {
    const paws = iso(CAT_SPOT.u, CAT_SPOT.v);
    context.drawImage(art.pet, 0, 0);
    const zzz = petZzzAt(pet, petPixels(pet), paws.x, paws.y);
    if (zzz) paintZzzAt(context, ...zzz, frame);
  }
  const layers = [
    ...art.pieces.map((piece) => ({ depth: piece.depth, paint: () => context.drawImage(piece.canvas, 0, 0) })),
    ...sitters.map((placed) => ({ depth: placed.depth, paint: () => paintSitter(context, sprites, placed, at, options) })),
    // a visitor, then what stands in front of them in the room's art
    ...visitors.map((visitor) => ({ depth: visitor.depth, paint: () => {
      sprites.draw(context, visitor.id, visitor.pose, visitor.feet.x - at.x, visitor.feet.y - at.y);
      const depth = occluderDepth(visitor.depth), front = art.occluders.find((occluder) => occluder.depth === depth);
      if (front) context.drawImage(front.canvas, 0, 0);
    } })),
  ];
  for (const layer of layers.sort((a, b) => a.depth - b.depth)) layer.paint();
  context.font = TAG_FONT;
  for (const placed of sitters) {
    if (placed.sitter.napping) paintZzz(context, placed.feet.x - at.x, placed.feet.y - at.y - placed.top - 4, options.reducedMotion ? 0 : options.time, 0);
  }
}

/** The whole frame: `rooms` at their places, the canvas cleared first. */
export function paintCozy(context: CanvasRenderingContext2D, sprites: SpriteSource, rooms: readonly FrameRoom[], options: CozyFrameOptions) {
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.imageSmoothingEnabled = false;
  for (const room of rooms) paintRoom(context, sprites, room, options);
  // the tags over every room, in their own pixels
  const tagPixel = options.scale / options.tagScale;
  context.setTransform(options.tagScale, 0, 0, options.tagScale, 0, 0);
  context.textAlign = 'center';
  const tags: PlacedTag[] = rooms.flatMap(({ sitters }) => sitters.map(({ sitter, feet: inRoom, top }): PlacedTag => {
    const feet = { x: inRoom.x * tagPixel, y: inRoom.y * tagPixel };
    const bottom = (inRoom.y - top) * tagPixel - TAG_LIFT;
    if (!sitter.person) return { x: feet.x, bottom, faint: options.hoveredId !== PLAYER_ID, tag: { name: options.playerName, colour: P.playerTagText, status: null, tags: [], moreTags: 0, sessionId: PLAYER_ID, agents: [], framed: false } };
    const { tag, faint } = personTag(sitter.person, true, options);
    return { x: feet.x, bottom, faint, tag };
  }));
  // a visitor's name only under the pointer: they are not sessions
  const visitors = rooms.flatMap((room) => room.visitors);
  for (const visitor of visitors) {
    if (visitor.id !== options.hoveredId) continue;
    const bottom = (visitor.feet.y - visitor.top) * tagPixel - TAG_LIFT;
    tags.push({ x: visitor.feet.x * tagPixel, bottom, faint: false, tag: { name: visitor.name, colour: P.tagText, status: null, tags: [], moreTags: 0, sessionId: visitor.id, agents: [], framed: false } });
  }
  paintNameTags(context, sprites, tags, options.time, options.reducedMotion);
  // what each visitor came for, in a bubble over their head once there (over their name when it shows); at a birthday
  // party, first the wish, said out loud, as in the classic room
  context.font = TAG_FONT;
  for (const visitor of visitors) {
    if (!visitor.activity) continue;
    const head = (visitor.feet.y - visitor.top) * tagPixel - (visitor.id === options.hoveredId ? TAG_LIFT + VISITOR_TAG_HEIGHT : 0);
    if (visitor.wish) { paintSpeech(context, t.room.birthdayWish(visitor.wish), visitor.feet.x * tagPixel, head + 4); continue; }
    const bob = options.reducedMotion ? 0 : Math.round(Math.sin((options.time + visitor.blinkOffset) / 500));
    paintActivity(context, visitor.activity, visitor.feet.x * tagPixel, head - 1 + bob);
  }
}

/** A name tag's height (draw.ts), the activity's bubble goes over it. */
const VISITOR_TAG_HEIGHT = 14;
