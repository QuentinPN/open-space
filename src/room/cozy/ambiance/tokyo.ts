// The 'tokyo' ambiance. Owned by this file and src/design/cozy-ambiances/tokyo.ts alone.
// TODO: a stub that is the offices' room. Override the painters (see space.ts) or give its own positions and footprints
// (see cafe.ts), and take its colours from COZY_AMBIANCE_PALETTE.tokyo.
import type { AmbianceDesign } from './index.ts';
import { office } from './office.ts';

export const tokyo: AmbianceDesign = { ...office, id: 'tokyo' };
