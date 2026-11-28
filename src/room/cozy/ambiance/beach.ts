// The 'beach' ambiance. Owned by this file and src/design/cozy-ambiances/beach.ts alone.
// TODO: a stub that is the offices' room. Override the painters (see space.ts) or give its own positions and footprints
// (see cafe.ts), and take its colours from COZY_AMBIANCE_PALETTE.beach.
import type { AmbianceDesign } from './index.ts';
import { office } from './office.ts';

export const beach: AmbianceDesign = { ...office, id: 'beach' };
