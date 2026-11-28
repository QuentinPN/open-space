// The hour in the cozy rooms (src/room/cozy/): the classic room's light of the hour (lighting.ts lightingAt, the same
// hour as its windows and clock: the "try an hour" preview, else now) cut into three moods the cozy art is drawn in,
// day, dusk (dawn too) and night, and the keys their cached art is kept under. Pure: tested without a DOM.
import type { Festival } from '../../../shared/festivals.ts';
import { lightingAt } from '../lighting.ts';

export type CozyTime = 'day' | 'dusk' | 'night';
export const COZY_TIMES: readonly CozyTime[] = ['day', 'dusk', 'night'];

/** The stars of the classic sky above which it is night, and below which it is full day. */
const NIGHT_STARS = 0.5;
const DAY_STARS = 0.05;

/** The mood of an hour (a fractional one: 14.5 is 14:30), from the classic sky's stars at that hour. */
export function cozyTimeOf(hour: number): CozyTime {
  const { stars } = lightingAt(hour);
  return stars >= NIGHT_STARS ? 'night' : stars >= DAY_STARS ? 'dusk' : 'day';
}

/** The minute of the day an hour falls in (0 to 1439): the clocks' hands are drawn again when it changes. */
export const clockMinute = (hour: number) => Math.floor((((hour % 24) + 24) % 24) * 60 + 1e-6) % 1440;

/**
 * What a room's cached art depends on beyond its own kind: the mood of the hour and the festival. The art is drawn
 * again only when this changes, not as the minutes go by.
 */
export const sceneKey = (hour: number, festival: Festival | null) => `${cozyTimeOf(hour)}|${festival ?? ''}`;
