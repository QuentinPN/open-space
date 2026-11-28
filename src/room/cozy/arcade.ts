// Who plays at the cozy break room's arcade cabinet (lounge.ts ARCADE): now and then someone of the crew without a
// session, like the office life's visits (visitors.ts, Preferences.officeLife) that bring the crew to a project room:
// they come in through the break room's door, play a while in front of the screen and leave. The sessions at rest keep
// their places on the sofas and beanbags; the arcade's free floor in front of it is no session's. Pure: tested without
// a DOM.
import type { Festival } from '../../../shared/festivals.ts';
import type { VisitSpot } from '../../../shared/room-layout.ts';
import type { VisitFloor } from '../visitors.ts';
import { CozyFloor, cozyFloorPlan, tileOf } from './floor.ts';
import { ARCADE_FRONT } from './lounge.ts';

/** In front of the screen, facing it (towards the right wall). */
export const ARCADE_SPOT: VisitSpot = { activity: 'arcade', at: tileOf(ARCADE_FRONT.u, ARCADE_FRONT.v), facing: 0 };

/**
 * The break room as the visits see it (visitors.ts VisitFloor), dressed for `festival` (its decoration in the way):
 * its door, the way round its furniture and its sessions' places, and the arcade for its only spot.
 */
export function loungeVisitFloor(festival: Festival | null): VisitFloor {
  const floor = new CozyFloor(cozyFloorPlan({ kind: 'lounge' }, festival));
  return {
    door: floor.door,
    layout: { visitSpots: [ARCADE_SPOT] },
    route: (from, to) => floor.route(from, to),
    pathToDoor: (from) => floor.pathToDoor(from),
  };
}
