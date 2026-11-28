// The 'forest' ambiance. Owned by this file and src/design/cozy-ambiances/forest.ts alone.
// TODO: a stub that is the offices' room. Override the painters (see space.ts) or give its own positions and footprints
// (see cafe.ts), and take its colours from COZY_AMBIANCE_PALETTE.forest.
import type { AmbianceDesign } from './index.ts';
import { office } from './office.ts';

export const forest: AmbianceDesign = { ...office, id: 'forest' };
