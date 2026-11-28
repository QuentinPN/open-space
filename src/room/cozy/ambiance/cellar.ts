// The 'cellar' ambiance. Owned by this file and src/design/cozy-ambiances/cellar.ts alone.
// TODO: a stub that is the offices' room. Override the painters (see space.ts) or give its own positions and footprints
// (see cafe.ts), and take its colours from COZY_AMBIANCE_PALETTE.cellar.
import type { AmbianceDesign } from './index.ts';
import { office } from './office.ts';

export const cellar: AmbianceDesign = { ...office, id: 'cellar' };
