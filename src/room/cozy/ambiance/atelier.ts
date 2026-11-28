// The 'atelier' ambiance. Owned by this file and src/design/cozy-ambiances/atelier.ts alone.
// TODO: a stub that is the offices' room. Override the painters (see space.ts) or give its own positions and footprints
// (see cafe.ts), and take its colours from COZY_AMBIANCE_PALETTE.atelier.
import type { AmbianceDesign } from './index.ts';
import { office } from './office.ts';

export const atelier: AmbianceDesign = { ...office, id: 'atelier' };
