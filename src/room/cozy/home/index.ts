// The user's home in the middle of the cozy rooms (Preferences.homeTheme): which homes there are, where the user sits in
// each, what a click on their computer or a room's clock falls on, and who shows in the video call on their screen.
// Pure: tested without a DOM (the art is drawn in art.ts).
import { HOME_THEMES, type HomeTheme } from '../../../../shared/protocol.ts';
import type { Look } from '../../../../shared/look.ts';
import { insideConvex, type Point } from '../../geometry.ts';
import { clockAt, type WallClock } from '../clock.ts';
import { designOf } from '../ambiance/index.ts';
import { ROOM_CLOCK } from '../decor.ts';
import { iso, type Place } from '../geometry.ts';
import { wallPoint, type Painter } from '../pixels.ts';
import type { CozyRoom } from '../rooms.ts';
import { chalet } from './chalet.ts';
import { japonais } from './japonais.ts';
import { METRICS_SCREEN, paintMetricsScreen, type CallFace, type HomeDesign } from './kit.ts';
import { loft } from './loft.ts';
import { studio } from './studio.ts';

export const HOME_DESIGNS: Readonly<Record<HomeTheme, HomeDesign>> = { studio, loft, chalet, japonais };

/** A home theme as the settings hold it, the studio for none or one this version does not know. */
export const homeThemeOf = (value: unknown): HomeTheme => HOME_THEMES.find((theme) => theme === value) ?? 'studio';

/** Where the user sits at home: at their desk, seen from behind, facing its screen. */
export function homePlace(theme: HomeTheme): Place {
  const { u, v, z } = HOME_DESIGNS[theme].seat;
  return { u, v, direction: 'up-right', lift: z };
}

/** How far around a screen its monitor's frame goes, in units along it and pixels up and down. */
const BEZEL = { along: 2, up: 3 } as const;

/**
 * Whether a point of a home (in its room's pixels) falls on the user's computer: one of its screens, frame included.
 * A click there opens a terminal, like the user's screen in the classic office.
 */
export function pcAt(theme: HomeTheme, point: Point): boolean {
  return HOME_DESIGNS[theme].screens.some(({ v, ua, ub, za, zb }) => insideConvex(point, [
    iso(ua - BEZEL.along, v, zb + BEZEL.up), iso(ub + BEZEL.along, v, zb + BEZEL.up), iso(ub + BEZEL.along, v, za - BEZEL.up), iso(ua - BEZEL.along, v, za - BEZEL.up),
  ]));
}

const metricsPainters = new Map<HomeTheme, Painter>();
/** A home's numbers screen drawn alone, the same painter each time (its drawing and its outline are kept by it). */
export function metricsPainter(theme: HomeTheme): Painter {
  let paint = metricsPainters.get(theme);
  if (!paint) { paint = (grid) => paintMetricsScreen(grid, HOME_DESIGNS[theme].metrics); metricsPainters.set(theme, paint); }
  return paint;
}

/** Over the middle of a home's numbers screen, in its room's pixels: where the "!" of a mod's news points. */
export function metricsBadgeSpot(theme: HomeTheme): Point {
  const { wall, a, z } = HOME_DESIGNS[theme].metrics, [x, y] = wallPoint(wall, a + METRICS_SCREEN.width / 2, z + METRICS_SCREEN.height + 2);
  return { x, y };
}

/** The clock on a room's wall: the home's own, a project room's ambiance's, else the offices' (the break room's and the server room's). */
export function clockOf(room: CozyRoom): WallClock {
  if (room.kind === 'home') return HOME_DESIGNS[room.home ?? homeThemeOf(undefined)].clock;
  return room.kind === 'project' ? designOf(room).clock : ROOM_CLOCK;
}

/** Whether a point of a room (in its pixels) falls on its clock: a click there tells the time. */
export const roomClockAt = (room: CozyRoom, point: Point) => clockAt(clockOf(room), point);

/** Someone in the call, from their look: their hair (their skin when they have none), their top, their skin. */
export const callFace = (look: Look, speaking: boolean): CallFace => ({ hair: look.hair === 'none' ? look.skin : look.hairColor, top: look.topColor, skin: look.skin, speaking });

export type { CallFace };
