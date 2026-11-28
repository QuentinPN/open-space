// Who plays at the cozy break room's arcade cabinet (lounge.ts ARCADE): a session at rest on its place (ARCADE_SEAT,
// the last one taken, or where the user put it), else now and then someone of the crew without a session, like the
// office life's visits (visitors.ts, Preferences.officeLife) that bring the crew to a project room: they come in
// through the break room's door, play a while in front of the screen and leave. A session comes first: a visitor
// leaves the arcade to it, and none comes while it plays. Pure: tested without a DOM.
import type { Festival } from '../../../shared/festivals.ts';
import type { VisitSpot } from '../../../shared/room-layout.ts';
import type { VisitFloor } from '../visitors.ts';
import { CozyFloor, cozyFloorPlan, tileOf } from './floor.ts';
import { ARCADE_FRONT, ARCADE_SEAT } from './lounge.ts';
import type { CozyRoom } from './rooms.ts';

/** In front of the screen, facing it (towards the right wall). */
export const ARCADE_SPOT: VisitSpot = { activity: 'arcade', at: tileOf(ARCADE_FRONT.u, ARCADE_FRONT.v), facing: 0 };

/** Whether a session of the break room `room` has the arcade's place (its plan's seats). */
export const sessionPlays = (room: Pick<CozyRoom, 'resting'>) => [...room.resting.seats.values()].includes(ARCADE_SEAT);

/**
 * The break room as the visits see it (visitors.ts VisitFloor), dressed for `festival` (its decoration in the way):
 * its door, the way round its furniture and its sessions' places, and the arcade for its only spot while no session
 * plays there (`taken()`, read at each step): a visitor there leaves once one does (Visits.step).
 */
export function loungeVisitFloor(festival: Festival | null, taken: () => boolean = () => false): VisitFloor {
  const floor = new CozyFloor(cozyFloorPlan({ kind: 'lounge' }, festival));
  return {
    door: floor.door,
    layout: { get visitSpots() { return taken() ? [] : [ARCADE_SPOT]; } },
    route: (from, to) => floor.route(from, to),
    pathToDoor: (from) => floor.pathToDoor(from),
  };
}
