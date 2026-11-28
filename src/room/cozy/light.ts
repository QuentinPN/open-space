// The light of the cozy rooms (src/room/cozy/), baked into each pixel of their cached art: an ambient light multiplied
// over everything, lamps whose pools fall off in bands with a light ordered dither, and what shines by itself (the
// sky, the screens, the bulbs) left as it is. It follows the mood of the hour (time.ts): a project room by its lights
// on or off, a home from the mood it was drawn at, its lamps stronger at night, faint by day; and the windows' skies
// with it (outsideAt).
import { COZY_PALETTE as C } from '../../design/room-palette.ts';
import { iso } from './geometry.ts';
import { tint } from './pixels.ts';
import type { CozyTime } from './time.ts';

export type Rgb = readonly [number, number, number];

/** A lamp: where its light falls on screen, its colour (added, per channel), how far it reaches. */
export interface Lamp { x: number; y: number; colour: Rgb; reach: number; flat: number; steps: number }
/** A room's light: the ambient one (multiplied, per channel) and its lamps. */
export interface Lighting { ambient: Rgb; lamps: readonly Lamp[] }

/** A lamp at (u, v), `z` up: `flat` how much flatter its pool is than wide, `steps` how many bands it falls off in. */
export function lamp(u: number, v: number, z: number, colour: Rgb, reach: number, flat = 0.6, steps = 4): Lamp {
  const { x, y } = iso(u, v, z);
  return { x, y, colour, reach, flat, steps };
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const channels = (hex: string) => { const value = Number.parseInt(hex.slice(1), 16); return [(value >> 16) & 255, (value >> 8) & 255, value & 255]; };
const hexOf = (value: number) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');

/** What a colour becomes at (x, y) under a light; `glow`: the colours left as they are. */
export function lightingOf({ ambient, lamps }: Lighting, glow: ReadonlySet<string>): (colour: string, x: number, y: number) => string {
  const cache = new Map<string, string>();
  return (colour, x, y) => {
    if (glow.has(colour)) return colour;
    const threshold = 0.25 + BAYER[(y & 3) * 4 + (x & 3)] / 32;
    const bands = lamps.map((light) => {
      const dx = (x - light.x) / light.reach, dy = (y - light.y) / (light.reach * light.flat), distance = Math.sqrt(dx * dx + dy * dy);
      return distance >= 1 ? 0 : Math.floor((1 - distance) ** 1.3 * light.steps + threshold) / light.steps;
    });
    const key = colour + bands.join();
    let lit = cache.get(key);
    if (!lit) {
      const rgb = channels(colour);
      lit = `#${rgb.map((channel, index) => hexOf(lamps.reduce((sum, light, which) => sum + channel * light.colour[index] * bands[which], channel * ambient[index]))).join('')}`;
      cache.set(key, lit);
    }
    return lit;
  };
}

/** How strong the lamps shine at each mood: faint by day, full at night. */
const LAMP_STRENGTH: Readonly<Record<CozyTime, number>> = { day: 0.25, dusk: 0.7, night: 1 };

/**
 * A home's light at `time`, from its own light, drawn at `mood`: the ambient light of that time, tinted like the
 * home's own (a warm home stays warm), and its lamps as strong as that time wants. Its own light at its own mood.
 */
export function homeLightAt(own: Lighting, mood: CozyTime, time: CozyTime): Lighting {
  if (time === mood) return own;
  const base = C.homeLight[mood], target = C.homeLight[time];
  const ambient = target.map((channel, index) => channel * Math.min(1.08, Math.max(0.92, own.ambient[index] / base[index]))) as unknown as Rgb;
  const factor = LAMP_STRENGTH[time] / LAMP_STRENGTH[mood];
  return { ambient, lamps: own.lamps.map((light) => ({ ...light, colour: light.colour.map((channel) => channel * factor) as unknown as Rgb })) };
}

/* The windows: their sky, what shines in it and the lit windows beyond follow the hour */

/** What a window shows, as drawn at its mood: its sky top to bottom, the sun or the moon (disc, light), stars, lit windows. */
export interface Outside {
  mood: CozyTime;
  sky: readonly string[];
  body?: readonly [string, string];
  stars?: readonly string[];
  /** a lit window of the city beyond, and the same window unlit (by day) */
  lights?: { on: string; off: string };
  /** what stands outside (a city, a mountain, a tree): darker as the sun goes down */
  shade?: readonly string[];
}

/** How bright what stands outside is at each mood (Outside.shade), besides the room's light. */
const OUTSIDE_BRIGHTNESS: Readonly<Record<CozyTime, number>> = { day: 1, dusk: 0.8, night: 0.55 };

/** What becomes of each colour of a window at `time` (a star: null, the sky beside it); nothing to change at its own mood. */
export function outsideAt(outside: Outside, time: CozyTime): Map<string, string | null> {
  const changes = new Map<string, string | null>();
  if (time === outside.mood) return changes;
  const sky = C.sky[time], last = outside.sky.length - 1;
  outside.sky.forEach((colour, index) => { changes.set(colour, sky[last ? Math.round(index * (sky.length - 1) / last) : 0]); });
  if (outside.body) {
    const [disc, light] = time === 'night' ? [C.sky.moon, C.sky.moonShade] : time === 'dusk' ? [C.sky.sunLow, C.sky.sunLowLight] : [C.sky.sun, C.sky.sunLight];
    changes.set(outside.body[0], disc); changes.set(outside.body[1], light);
  }
  if (time !== 'night') for (const star of outside.stars ?? []) changes.set(star, null);
  if (outside.lights) changes.set(outside.lights.on, time === 'day' ? outside.lights.off : outside.lights.on);
  const brightness = Math.min(1.3, OUTSIDE_BRIGHTNESS[time] / OUTSIDE_BRIGHTNESS[outside.mood]);
  for (const colour of outside.shade ?? []) changes.set(colour, tint(colour, brightness));
  return changes;
}

/** The sky's colours at every mood, and what shines in it: never darkened by a room's light. */
export const SKY_GLOW: readonly string[] = [...C.sky.day, ...C.sky.dusk, ...C.sky.night, C.sky.sun, C.sky.sunLight, C.sky.sunLow, C.sky.sunLowLight, C.sky.moon, C.sky.moonShade, C.sky.star];
