// One frame of the cozy rooms (src/room/cozy/): each room's art (drawn once per mood of the hour and festival,
// decor.ts, lounge-art.ts), what moves in its decor (motion.ts), its clock's hands, the white line around what is
// under the pointer, its screens at work, its people and visitors and what stands in front of them in depth order,
// the nappers' Z's; the user's home its own way (home/art.ts), the user's pet living there (home-pet.ts) and its Z's;
// then everyone's name tag on top, what the visitors came for (or their birthday wish), the pet's hearts and words,
// and the "!" of a mod's news over the home's numbers screen.
import type { Festival } from '../../../shared/festivals.ts';
import { ROOM_PALETTE as P } from '../../design/room-palette.ts';
import { t } from '../../i18n/index.ts';
import { paintActivity } from '../activity-icons.ts';
import { paintDropSeats, paintMetricsBadge, paintNameTags, paintSpeech, paintZzz, personTag, TAG_FONT, TAG_LIFT, type FrameOptions, type PlacedTag } from '../draw.ts';
import type { Point } from '../geometry.ts';
import { drawHearts, type Pet } from '../pet.ts';
import { PLAYER_ID, type Scene, type SceneFloor } from '../scene.ts';
import type { Pose, SpriteSource } from '../sprites.ts';
import type { Activity } from '../visitors.ts';
import { clockHands, clockOutline } from './clock.ts';
import { designOf } from './ambiance/index.ts';
import { ROOM_CLOCK, paintCode, paintDoor, paintIdleScreen, paintZzzAt, roomArt } from './decor.ts';
import { iso, type Figure } from './geometry.ts';
import { paintHome } from './home/art.ts';
import { drawPetSprite, petPixels, petPose, petTop, petZzzAt, type CozyPet } from './pet.ts';
import { homeThemeOf, metricsBadgeSpot, type CallFace } from './home/index.ts';
import { loungeArt, paintArcade } from './lounge-art.ts';
import { PERSON_SCALE, type PlacedSitter } from './people.ts';
import { outlineOf } from './pixels.ts';
import type { CozyRoom } from './rooms.ts';
import type { CozyThing } from './things.ts';

/**
 * Someone of the crew dropping by (visits.ts): where their feet are in the overview, their pose, what they came for once
 * there, and whose birthday they wish out loud now (visitors.ts birthdayWishOf), if they do.
 */
export interface PlacedVisitor extends Figure { name: string; pose: Pose; depth: number; activity: Activity | null; wish: readonly string[] | null; blinkOffset: number }

/**
 * A room of the frame: where it is (its box's top left corner), who sits in it, placed (people.ts placeSitters,
 * scenePeople), who drops by; `carrying`: the scene of a room opened big while someone is carried in it, whose seats
 * they can be put on show.
 */
export interface FrameRoom { room: CozyRoom; at: Point; sitters: readonly PlacedSitter[]; visitors: readonly PlacedVisitor[]; carrying?: Scene<SceneFloor> | null }

/**
 * The user's pet at home (home-pet.ts): how it looks, how it lives (the classic pet: what it does, which way it heads,
 * its hearts), where its paws are on the home's floor and how high, and what it says, while it speaks.
 */
export interface HomePetFrame { look: CozyPet; pet: Pet; at: { u: number; v: number; z: number }; words: string | null }

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
  /** the user's pet, at home only, or none */
  pet: HomePetFrame | null;
  /** what is outlined under the pointer, in which room (things.ts) */
  hovered: { room: string; thing: CozyThing } | null;
  /** a mod has news and the mods are closed: a "!" over the home's numbers screen, like over the classic office's TV */
  metricsBadge: boolean;
  /** the user's first name, on their tag */
  playerName: string;
  /** who shows in the video call on the user's screen at home (home/index.ts callFace) */
  callFaces: readonly CallFace[];
}

/** About 15 a second: what the screens and the pet's Z's count by. */
const frameOf = (time: number) => Math.floor(time / (1000 / 15));

/** Someone seated, drawn in their room's pixels (`at`: the room's corner), with a ring under them while their session is open. */
let free: CanvasRenderingContext2D | null = null;
/**
 * A layer the size of the canvas `context` draws on, set like it, to draw someone off the seats on alone: what stands
 * in front of them is cut out of them there, so the furniture hides them and not the people drawn before them.
 */
function freeLayer(context: CanvasRenderingContext2D): CanvasRenderingContext2D {
  if (!free) free = document.createElement('canvas').getContext('2d')!;
  const { width, height } = context.canvas;
  if (free.canvas.width !== width || free.canvas.height !== height) Object.assign(free.canvas, { width, height });
  free.setTransform(1, 0, 0, 1, 0, 0);
  free.clearRect(0, 0, width, height);
  free.setTransform(context.getTransform());
  free.imageSmoothingEnabled = false;
  return free;
}

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

function paintRoom(context: CanvasRenderingContext2D, sprites: SpriteSource, { room, at, sitters, visitors, carrying }: FrameRoom, options: CozyFrameOptions) {
  const frame = options.reducedMotion ? 0 : frameOf(options.time);
  context.setTransform(options.scale, 0, 0, options.scale, at.x * options.scale, at.y * options.scale);
  const hovered = options.hovered?.room === room.id ? options.hovered.thing : null;
  if (room.kind === 'home') {
    const thing = hovered === 'computer' || hovered === 'metrics' || hovered === 'clock' ? hovered : null;
    const home = { frame, hour: options.hour, festival: options.festival, faces: options.callFaces, hovered: thing };
    const user = sitters.find((placed) => placed.id === PLAYER_ID);
    const { pet } = options, paws = pet && iso(pet.at.u, pet.at.v, pet.at.z);
    paintHome(context, room.home ?? homeThemeOf(undefined), home, [
      ...(user ? [{ u: user.sitter.place.u, v: user.sitter.place.v, paint: () => paintSitter(context, sprites, user, at, options), lightAt: null }] : []),
      ...(pet && paws ? [{ u: pet.at.u, v: pet.at.v, paint: () => drawPetSprite(context, pet.look, petPose(pet.pet, options.reducedMotion ? 0 : options.time), paws.x, paws.y), lightAt: { x: paws.x, y: paws.y - 8 } }] : []),
    ]);
    const zzz = pet && paws && petZzzAt(pet.look, pet.pet.activity, petPixels(pet.look), paws.x, paws.y);
    if (zzz) paintZzzAt(context, ...zzz, frame);
    return;
  }
  // the break room's own, else the room in its ambiance (the server room in the offices')
  const design = designOf(room), lounge = room.kind === 'lounge';
  const art = lounge ? loungeArt(room.lit, options.hour, options.festival) : roomArt(room.kind === 'servers' ? 'servers' : 'project', design, room.lit, options.hour, options.festival);
  const clock = lounge ? ROOM_CLOCK : design.clock;
  context.drawImage(art.back, 0, 0);
  // what moves in its decor, over its art and behind its people (ambiance/index.ts AmbianceMotion)
  if (art.motion && design.motion && !lounge) {
    for (const name in art.motion.layers) art.motion.layers[name].pen = context;
    design.motion.paint(art.motion.layers, frame, art.motion.scene);
  }
  context.drawImage(clockHands(clock, options.hour), 0, 0);
  // the white line around its things under the pointer: its clock, its door, its board, the arcade
  if (hovered === 'clock') context.drawImage(clockOutline(clock), 0, 0);
  if (hovered === 'door') context.drawImage(outlineOf(lounge ? paintDoor : design.paintDoor), 0, 0);
  if (hovered === 'board') context.drawImage(outlineOf(design.paintBoard), 0, 0);
  if (hovered === 'arcade') context.drawImage(outlineOf(paintArcade), 0, 0);
  // the screens of the back desks, towards us: code going by while their session works
  for (const { sitter } of sitters) {
    if (sitter.desk?.kind !== 'back') continue;
    if (sitter.person?.status === 'working') paintCode(context, sitter.desk, frame);
    else paintIdleScreen(context, sitter.desk);
  }
  // someone off the seats (walking, a visitor), with what stands in front of them in the room's art cut out of them
  const hidden = (depth: number, paint: (layer: CanvasRenderingContext2D) => void) => {
    const front = art.frontOf(depth);
    if (!front) { paint(context); return; }
    const layer = freeLayer(context);
    paint(layer);
    layer.globalCompositeOperation = 'destination-out';
    layer.drawImage(front, 0, 0);
    layer.globalCompositeOperation = 'source-over';
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.drawImage(layer.canvas, 0, 0);
    context.restore();
  };
  const layers = [
    ...art.pieces.map((piece) => ({ depth: piece.depth, paint: () => context.drawImage(piece.canvas, 0, 0) })),
    ...sitters.map((placed) => ({
      depth: placed.depth,
      paint: () => (placed.free ? hidden(placed.depth, (layer) => paintSitter(layer, sprites, placed, at, options)) : paintSitter(context, sprites, placed, at, options)),
    })),
    ...visitors.map((visitor) => ({ depth: visitor.depth, paint: () => hidden(visitor.depth, (layer) => sprites.draw(layer, visitor.id, visitor.pose, visitor.feet.x - at.x, visitor.feet.y - at.y)) })),
    // while someone is carried, the seats they can be put on, under them (they are drawn over everything)
    ...(carrying ? [{ depth: Number.MAX_VALUE, paint: () => paintDropSeats(context, carrying, options.reducedMotion ? 0 : options.time, PERSON_SCALE) }] : []),
  ];
  for (const layer of layers.sort((a, b) => a.depth - b.depth)) layer.paint();
  context.font = TAG_FONT;
  for (const placed of sitters) {
    if (placed.sitter.napping) paintZzz(context, placed.feet.x - at.x, placed.feet.y - at.y - placed.top - 4, options.reducedMotion ? 0 : options.time, 0);
  }
}

/** The pet's hearts after a cuddle and its words, over its head at home, in the tags' pixels (`tagPixel` of them to a room pixel). */
function paintPetTalk(context: CanvasRenderingContext2D, rooms: readonly FrameRoom[], pet: HomePetFrame | null, tagPixel: number) {
  const home = pet && rooms.find(({ room }) => room.kind === 'home');
  if (!pet || !home) return;
  const paws = iso(pet.at.u, pet.at.v, pet.at.z);
  const x = (home.at.x + paws.x) * tagPixel, head = (home.at.y + paws.y - petTop(pet.look)) * tagPixel;
  drawHearts(context, pet.pet, x, head);
  if (pet.words) paintSpeech(context, pet.words, x, head);
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
  paintPetTalk(context, rooms, options.pet, tagPixel);
  const home = options.metricsBadge ? rooms.find(({ room }) => room.kind === 'home') : undefined;
  if (home) {
    const spot = metricsBadgeSpot(home.room.home ?? homeThemeOf(undefined));
    paintMetricsBadge(context, { x: (home.at.x + spot.x) * tagPixel, y: (home.at.y + spot.y) * tagPixel }, options.reducedMotion ? 0 : options.time);
  }
}

/** A name tag's height (draw.ts), the activity's bubble goes over it. */
const VISITOR_TAG_HEIGHT = 14;
