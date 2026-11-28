// The wine and cheese cellar's palette (ambiance 'cellar', src/room/cozy/ambiance/cellar.ts). Owned by this file alone.
export const cellar = {
  wall: { left: '#b06a4c', right: '#9c5c42', capTop: '#e2d2b4', capLeft: '#b8a07e', capRight: '#a48c6c' },
  /** the walls' bricks, their mortar, the arches' stones and the stone plinth along the floor */
  brick: { tones: ['#b8694a', '#ac6044', '#c0744f', '#a45a40'], light: '#cf8a62', mortar: '#7c4a38', recess: 0.84 },
  arch: { stones: ['#e4cfa6', '#d2ba8e'], keystone: '#f0dfb8', joint: '#9a8262', shade: '#b49c74' },
  pier: { stones: ['#dcc6a0', '#cdb68e', '#c2aa82'], joint: '#9a8262', light: '#eee0c0', shade: '#aa9270', cap: '#f0e2c4', capShade: '#bca47e' },
  plinth: { stones: ['#8e8070', '#9a8c7a', '#857766'], joint: '#5e5248', light: '#ab9e8c' },
  floor: { tones: ['#a99a88', '#a09180', '#b3a492', '#978877'], seam: '#6c5f53', light: '#c3b5a2', speckle: '#8b7d6e', crack: '#7c6e61' },
  /** the high window: its stone surround, its iron bars, its sill */
  window: { frame: ['#e6d2aa', '#cdb68e'], reveal: '#7a6a58', bar: '#3e3230', barLight: '#6a5a54', sill: ['#d8c49e', '#c2aa82', '#a8916c'], sillEdge: '#eee0c0' },
  /** what the window shows, at ground level: never darkened by the room's light */
  view: {
    day: ['#9fd4ee', '#b5def2', '#cbe9f7'], dusk: ['#e98f86', '#f3ad8c', '#f9cf9c'], night: ['#1b2246', '#232d56', '#2d3866'],
    grass: { day: ['#86c95e', '#5ea549'], dusk: ['#8f9a4c', '#6c7a3e'], night: ['#2e4c3c', '#223b31'] },
    sun: '#fff3b4', sunLow: '#ff9e5e', sunLowLight: '#ffc27c', cloud: '#fdfeff', moon: '#f5f0d4', moonShade: '#d9d2ae', star: '#fffbe6',
    flower: '#ffd54e', flowerHeart: '#f08a3c', firefly: '#eaff8a',
  },
  door: {
    leaf: ['#a8703f', '#93603a', '#7e5030'], seam: '#5c3824', strap: '#3e3430', strapLight: '#6c5e56', rivet: '#9a8a7e', ring: '#d0a44a', ringShade: '#9c7a2e',
    grille: '#2a201c', stone: ['#dcc6a0', '#c8b088'], step: ['#bcab92', '#a8977e', '#8f7f68'], mat: ['#c9a06a', '#b08850', '#8f6a3a'],
  },
  board: {
    frame: '#6e4428', frameLight: '#946038', cork: '#c99a62', corkDot: '#b3844e', corkLight: '#d8ac74',
    paper: '#fbf1d6', paperShade: '#eadcb8', pink: '#f6d6d6', ink: '#6a4228', inkFaint: '#b89a7a', label: '#8c2a3e', gold: '#d6a84a',
    pins: ['#d04a3a', '#4f7a8c', '#e0b84a'], cheese: '#f4d06a', cheeseShade: '#d8ac44', grape: '#7e3c8a', leaf: '#6a9a44',
  },
  clock: { rim: '#4a3c36', rimShade: '#2c221e', face: '#f7ecd2', tick: '#5a463c' },
  /** the cheese counter: its open shelves of wheels, its butcher's block, what lies on it */
  counter: {
    body: ['#a8744a', '#8f5f3a', '#74482c'], back: '#4a2e20', plank: '#b8845a', top: ['#dcad70', '#c6955c', '#a87a46'], topEdge: '#e8c08a',
    knife: '#dfe3e6', knifeShade: '#a8aeb4', handle: '#5e3a24', board: ['#c4935a', '#a87a46', '#8c6438'],
  },
  /** the cheeses: their tones (light, base, dark) and their rind */
  cheese: {
    gold: { tones: ['#fbe08a', '#f2c95a', '#d6a63c'], rind: '#c98a34' },
    orange: { tones: ['#fbb46a', '#f0954a', '#cf7734'], rind: '#b2602a' },
    white: { tones: ['#fbf6ea', '#ece2cc', '#d4c6a8'], rind: '#cdbf9e' },
    wax: { tones: ['#e0645a', '#c8463e', '#a2362f'], rind: '#8a2a26' },
    blue: { tones: ['#f2eee2', '#ddd6c4', '#c2b9a4'], rind: '#7a8cb2' },
  },
  hole: '#d0a040',
  grapes: ['#a463b4', '#80448e', '#5e2e6c'], grapeStem: '#6c8a3c',
  shelf: ['#a8744a', '#8f5f3a', '#74482c'], shelfEdge: '#c08c5c',
  /** the casks: their staves, their iron hoops, their heads, their brass tap */
  cask: {
    staves: ['#c48a56', '#a87244', '#8a5a34'], seam: '#724a2c', hoop: ['#7a6c66', '#5a4e4a', '#40363a'], head: '#d29c66', headRing: '#a8763e', grain: '#bc8854',
    cradle: ['#8f5f3a', '#74482c', '#5e3a24'], tap: '#e0b04a', tapShade: '#a87c2c', drip: '#8c1e3a',
  },
  crate: { wood: ['#dcb47c', '#c49862', '#a87c4a'], edge: '#ecc896', gap: '#7a5434', stamp: '#8a4a3a', inside: '#5a3a24' },
  rack: { wood: ['#9a6440', '#84542f', '#6b4226'], edge: '#b07a4e', lattice: '#a26c46', back: '#2e1e18' },
  bottles: ['#2f5a3c', '#5a2632', '#3c3046', '#6a4a24'], bottleShine: '#9cc4a6', foil: ['#d6a84a', '#b03a3a', '#ece2c4'], label: '#f4ead0', wine: '#9a2444',
  glass: { bowl: '#eef4f6', shade: '#c8d4da', wine: '#a02848' },
  /** a candle's wax and its flame (they shine), its iron holder */
  candle: { wax: '#fff6de', waxShade: '#ecdcb6', flame: '#ffc84a', flameCore: '#fff7c2', iron: ['#6a5c56', '#4e4440', '#3a3230'] },
  /** the bulbs strung along the arches and over the counter (they shine), their cords and caps */
  bulb: { glass: '#ffe9a0', filament: '#ffb64a', cap: '#b8923c', cord: '#2e2420' },
  couch: { body: ['#a8484a', '#8c3a3e', '#702e34'], edge: '#c25e5c', cushion: ['#b45454', '#983f44', '#7c3238'], cushionEdge: '#ca6c68', button: '#5a2028' },
  pillow: ['#f2c95c', '#dcaa3a', '#b98a28'],
  throw: ['#f0e4c8', '#d8c8a4', '#6b8f5a', '#4f7046'],
  rug: { edge: '#4a2626', base: '#8a3434', border: '#c46a46', field: '#76302e', motif: '#e2a65e', teal: '#4f8a84', light: '#f0d6a4', fringe: '#eee0c0' },
  mouse: { hole: '#2a1c18', fur: '#b8aaa4', ear: '#f2b6b6', eye: '#1a1210' },
  desk: {
    top: ['#c69060', '#ad7a4e', '#93643e'], edge: '#d8a470', leg: ['#6e4428', '#5a3622', '#46281a'], monitor: ['#4c4246', '#3c3438', '#2e282a'], monitorEdge: '#605458',
    stand: ['#5c5250', '#4a423f', '#383130'], vents: '#26222a', keyboard: ['#f0e8d6', '#d9ceb8', '#c2b49c'], key: '#cabea6',
  },
  seats: [['#c4686c', '#a85257', '#8c3f45'], ['#dcae50', '#c49438', '#a47a2c'], ['#7e9e5e', '#66864c', '#4e6c3c'], ['#b8845a', '#9c6a44', '#7e5234']],
  chair: { base: ['#5a4e4a', '#463c3a', '#342c2a'], pole: ['#6a5e5a', '#524846', '#3c3432'] },
  light: {
    on: { day: [0.97, 0.92, 0.86], dusk: [0.86, 0.74, 0.66], night: [0.6, 0.5, 0.5] },
    off: { day: [0.72, 0.7, 0.74], dusk: [0.56, 0.5, 0.56], night: [0.38, 0.34, 0.44] },
    lamp: { dusk: [0.44, 0.28, 0.1], night: [0.82, 0.52, 0.2] },
  },
} as const;
