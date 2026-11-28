// The colours of Nebula Raid, the cozy break room's arcade game (src/arcade/): a black starfield, neon aliens (a green
// one-eyed blob, a pink jelly, a cyan drone), a white and red rocket, glowing bolts, orange and yellow blasts, brown
// asteroid chunks. Its own colours, drawn in code (src/arcade/paint.ts).
export const ARCADE_PALETTE = {
  space: '#04050b',
  /** the stars, from the faintest to the brightest, and the few coloured ones that twinkle */
  stars: ['#1e2440', '#3d4775', '#8390c4', '#e6ecff'],
  twinkle: ['#5ee7ff', '#ffcf6e', '#c58cff'],
  text: '#f2f5ff',
  textDim: '#7f8ab8',
  /** the title's two lines: their light top, their body, the glow round them */
  title: [
    { light: '#c8ffb8', body: '#4dff5e', glow: '#0f4a1a' },
    { light: '#ffc2c2', body: '#ff3f4f', glow: '#4f0f17' },
  ],
  /** what the screen says between two fleets, and once the game is over */
  level: '#4ef0ff',
  over: '#ff4f5e',
  /** a one-eyed blob: its body, its shade and feet, its eye, its pupil */
  cyclops: { a: '#5df26a', b: '#1c8a35', c: '#f4fff4', d: '#0b1020' },
  /** a jelly: its bell and tentacles, its rim, its glowing spots */
  jelly: { a: '#ff5c8d', b: '#a3214c', c: '#ffd3e1' },
  /** a drone: its body, its frame and rotors, its visor and thrusters, its eyes */
  drone: { a: '#43d9ff', b: '#1f5f8a', c: '#ff9f2e', d: '#0b1020' },
  /** the rocket: its hull, its shade, its fins and nose, its window, its nozzles */
  ship: { w: '#f4f6ff', s: '#a9b2cc', r: '#ff3b47', c: '#5fd8ff', k: '#3a4058' },
  /** the rocket's flame, from its hot heart out */
  flame: ['#fff3a6', '#ffb02e', '#ff4f24'],
  /** the rocket's bolt: its core, its colour, its glow */
  bolt: ['#f2ffff', '#4ef0ff', '#0f4f6a'],
  /** an alien's spark: its core, its colour, its glow */
  spark: ['#fff0a0', '#ff6a2e', '#5a1a10'],
  /** an asteroid chunk: lit, its body, in shade, a crater */
  rock: ['#b8a089', '#857060', '#55463d', '#3b302a'],
  /** a blast, from its white heart to its last red embers */
  blast: ['#ffffff', '#fff27a', '#ffb12e', '#ff5a1f', '#a12a12'],
  veil: 'rgba(2, 3, 10, 0.74)',
} as const;
