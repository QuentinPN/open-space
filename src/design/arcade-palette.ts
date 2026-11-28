// The colours of Petal Patrol, the cozy break room's arcade game (src/arcade/): a garden at dusk under a plum sky,
// soft bugs, a terracotta pot, pink mushrooms. Its own colours, drawn in code (src/arcade/paint.ts).
export const ARCADE_PALETTE = {
  sky: '#221a3a',
  skyLow: '#2c2348',
  stars: ['#4a3f72', '#6d5fa0', '#f7e9b8'],
  grass: '#4f8f5a',
  grassDark: '#356b44',
  text: '#fbefd5',
  textDim: '#b9a9d8',
  accent: '#ffb36b',
  /** a moth: its wings, its body, its eyes */
  moth: { a: '#cdb1f2', b: '#6f4f9e', c: '#fff6d8' },
  /** a ladybird: its shell, its spots and head, its eyes */
  ladybird: { a: '#ef6a5f', b: '#2b2233', c: '#fff6d8' },
  /** a beetle: its shell, its seam and head, its shine */
  beetle: { a: '#5cc4a0', b: '#24524a', c: '#b6f0d6' },
  /** the pot: its sprout, its rim, its body */
  pot: { g: '#8ad46f', r: '#f3a675', p: '#cf7448' },
  drop: '#9ad9ff',
  dropLight: '#e6f6ff',
  seed: '#e9c46a',
  seedDark: '#a7782f',
  /** a mushroom: its cap, the dots on it, its stem */
  cap: '#f09aaf',
  capDot: '#fff1f3',
  stem: '#f4e4c6',
  puff: '#fff3c4',
  puffDim: '#f5b8c9',
  veil: 'rgba(24, 17, 44, 0.72)',
} as const;
