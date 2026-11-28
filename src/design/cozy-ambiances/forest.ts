// The forest cabin's palette (ambiance 'forest', src/room/cozy/ambiance/forest.ts). Owned by this file alone.
export const forest = {
  wall: { left: '#b07444', right: '#9a6238', capTop: '#e2b27a', capLeft: '#8a5630', capRight: '#7a4a28' },
  /** the logs of the two walls, light to dark, the dark gap between two logs, a knot, and the rings of their sawn ends */
  logs: {
    left: ['#c88a52', '#b07444', '#8e5a32'], right: ['#b37848', '#9a6238', '#7c4c2a'], chink: '#5a3620', knot: '#6e4226',
    end: '#e8c28a', ring: '#c8965a', heart: '#a8743e',
  },
  planks: { tones: ['#a8703f', '#9c673a', '#b07846', '#a26b3c'], seam: '#6e4426', joint: '#7e4e2c' },
  window: { frame: ['#a06a3c', '#7a4a28', '#5e3a22'], glint: '#f4fbff', sill: ['#c08a54', '#a0703e', '#7e5430'], sillEdge: '#d8a46a' },
  curtain: { cream: '#f6ead2', creamShade: '#e2cfae', red: '#d65a48', redShade: '#b04434', tie: '#6aa048', rod: '#5e3a22' },
  /** what the window shows: never darkened by the room's light */
  view: {
    day: ['#86c8ec', '#98d2ef', '#acdcf2', '#c0e6f4', '#d6eff6', '#e8f7f2'],
    dusk: ['#5a4892', '#875aa2', '#c26c96', '#ea8c7e', '#f6ae72', '#ffd288'],
    night: ['#121a3a', '#172044', '#1d284e', '#233058', '#293862', '#2f406c'],
    pines: {
      day: { far: ['#9cc4b0', '#86b49e'], mid: ['#5c9c6e', '#46845a'], near: ['#3c7a4e', '#2c6240'], trunk: '#6a4630' },
      dusk: { far: ['#9a7896', '#866684'], mid: ['#664e74', '#523e62'], near: ['#3e3252', '#302642'], trunk: '#3a2838' },
      night: { far: ['#2a3c58', '#24344e'], mid: ['#1c2a42', '#172338'], near: ['#111a2c', '#0d1424'], trunk: '#0c1220' },
    },
    sun: '#ffdc7a', sunLight: '#fff2bc', sunLow: '#ff9858', sunLowLight: '#ffc68c', moon: '#fff2c6', moonShade: '#e2d49c', star: '#fffae4',
    cloud: '#fffefa', cloudShade: '#dff0f4', duskCloud: '#ffd0c2', duskCloudShade: '#eea6ae',
    bird: '#3c3a4a', firefly: '#eaff8c', fireflyGlow: '#6e9a52',
  },
  door: {
    frame: '#6e4226', frameLight: '#8e5a32', leaf: '#a06a3c', leafLight: '#bc8650', leafShade: '#7e5030', seam: '#5e3a22',
    iron: '#463c3c', ironLight: '#6e6262', knob: '#e0b04c', knobShade: '#a87a2a',
    wreath: ['#86c460', '#5a9c46', '#3e7636'], berry: '#e0443a', bow: '#d65a48', mat: ['#c8a468', '#a8864e', '#86683a'],
  },
  board: {
    frame: ['#8e6444', '#6e4a32', '#523624'], cork: '#d8ae78', corkDot: '#c2985e', papers: ['#fff6e0', '#fbe6ae', '#e4f2d4', '#fde0d6'],
    pins: ['#e0503e', '#4a8ad8', '#f0c040', '#5ab05a'], ink: '#6a5040', inkSoft: '#a8927e', leaf: ['#9ad070', '#6aac4a', '#468a38'], string: '#c84a3a',
  },
  clock: { rim: '#c8965a', rimShade: '#7e4e2c', face: '#fff4dc', tick: '#8e5a32' },
  counter: {
    body: ['#b07846', '#946238', '#784c2c'], plank: '#5e3a22', plankLight: '#c08a54', top: ['#d09a64', '#b4804c', '#946438'], topEdge: '#e6b47c',
    kettle: ['#ee7a62', '#cc5440', '#a43c2e'], iron: '#463c3c', ironLight: '#6e6262', steam: '#fff8ee', cup: '#f6ecd8', cupShade: '#dccbb0', tea: '#9a5a2a',
    honey: '#f0b440', honeyLight: '#ffd870', jar: '#f4f0e4', cloth: '#d65a48', clothLight: '#f6ead2',
    basket: ['#dcae64', '#bc8e4a', '#986e36'], apples: ['#e8503e', '#c43a2e'], appleLeaf: '#5a9c46',
  },
  barrel: { staves: ['#c08650', '#a06c3e', '#7e522e'], seam: '#6a4428', hoop: ['#7e7680', '#5e5660', '#46404a'], lid: ['#c89660', '#a87a4a'], tap: '#d8a84a', tapShade: '#a87a2a', cup: ['#dfe4ea', '#b8c0ca'] },
  fern: { fronds: ['#a2dc74', '#6cb44e', '#3e8238'], bucket: ['#c89258', '#a6743e', '#80562e'], hoop: '#5e5660', soil: '#4e3424' },
  mushroom: { cap: ['#f2826a', '#dc4a3c', '#ae3028'], spot: '#fff6e8', stem: ['#fbf0dc', '#e2ceac'], brown: ['#d8a468', '#b8824a', '#90602e'] },
  rug: { edge: '#4e8236', dark: '#62983e', base: '#7cb050', light: '#98c868', flowers: ['#fff6f0', '#f6c84a', '#ee8eac'] },
  chest: ['#c08a54', '#a0703e', '#7e5430'],
  jar: { glass: '#d6ecec', glassShade: '#b6d4d6', lid: '#c8964a', glow: '#f4fa8a', glowSoft: '#d8ea7a' },
  logStack: { frame: ['#8e5a32', '#74482a', '#5a3820'], bark: '#6a4228', end: '#e6c088', ring: '#c8965a', heart: '#a8743e', moss: '#7cb050' },
  lantern: { post: ['#9a6238', '#7a4a28', '#5e3a22'], iron: '#463c3c', ironLight: '#6e6262', glass: '#ffd878', glassLight: '#fff2b4', flame: '#ff9a3a' },
  garland: { leaves: ['#9ad86e', '#62ac4a', '#3e8038'], vine: '#5a7a34', bulb: '#ffe08a', bulbShade: '#f0b050', berry: '#e0443a' },
  birdhouse: { body: ['#8ad0c4', '#62b0a4', '#468e84'], roof: ['#e06c52', '#bc4e3a', '#94382a'], hole: '#3a2418', perch: '#6e4426', bird: '#8a6a52', breast: '#f08a50', beak: '#f0c040', eye: '#2a1a12' },
  shelf: { board: ['#c08a54', '#a0703e', '#7e5430'], jars: ['#f0b440', '#d65a48', '#86c460'], lid: '#f6ead2', herbs: ['#8ab85a', '#6a9a44'], twine: '#c8a468' },
  couch: { body: ['#b07846', '#946238', '#784c2c'], edge: '#c8925a', cushion: ['#a8d07c', '#86b45e', '#689646'], cushionEdge: '#c2e29c' },
  plaid: { red: '#d65a48', redShade: '#b04434', cream: '#f6ead2', dark: '#8a3428' },
  desk: {
    top: ['#d09a64', '#b4804c', '#946438'], edge: '#e6b47c', leg: ['#8e5a32', '#74482a', '#5a3820'], drawers: [['#c08a54', '#a0703e', '#7e5430'], ['#b07846', '#946238', '#784c2c']],
    monitor: ['#6a5446', '#54423a', '#40322a'], monitorEdge: '#806858', stand: ['#8e5a32', '#74482a', '#5a3820'], vents: '#2e221a',
    keyboard: ['#f2e8d2', '#dacbaa', '#c0b08c'], key: '#cbbb98',
  },
  seats: [['#a8d07c', '#86b45e', '#689646'], ['#f0966a', '#d4744a', '#ae5834'], ['#f6cc5c', '#deae3e', '#ba8e2c'], ['#d88a98', '#bc6c7e', '#985266']],
  chair: { base: ['#8e5a32', '#74482a', '#5a3820'], pole: ['#a06a3c', '#8e5a32', '#74482a'] },
  mug: { body: '#f6ecd8', shade: '#dccbb0', leaf: '#6aac4a', tea: '#9a5a2a' },
  pinecone: ['#b07846', '#8a5630', '#5e3a22'],
  light: {
    on: { day: [1, 0.98, 0.94], dusk: [0.94, 0.8, 0.72], night: [0.6, 0.53, 0.6] },
    off: { day: [0.84, 0.83, 0.84], dusk: [0.66, 0.56, 0.6], night: [0.4, 0.38, 0.52] },
    lamp: { dusk: [0.44, 0.29, 0.1], night: [0.84, 0.55, 0.2] },
  },
} as const;
