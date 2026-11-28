// The pirate ship cabin's palette (ambiance 'pirate', src/room/cozy/ambiance/pirate.ts). Owned by this file alone.
export const pirate = {
  wall: { left: '#8c5b3b', right: '#7b4f34', capTop: '#c08b58', capLeft: '#6c442b', capRight: '#5d3a25' },
  /** the hull's planks on the walls, bowed with the ship, its ribs, the beam under the ceiling */
  hull: {
    planksLeft: ['#946240', '#8c5b3b', '#9a6845', '#87573a'], planksRight: ['#83553a', '#7b4f34', '#885a3c', '#764b32'],
    seam: '#4f3020', plankLight: '#a87650', grain: '#6e4529', knot: '#5a3822',
    rib: ['#a06a44', '#7e4e30', '#5e3a24'], beam: ['#6e4529', '#5a3822', '#4a2e1e'], skirting: '#4a2e1e', peg: '#c9a06a',
  },
  deck: { tones: ['#c99a62', '#be8f58', '#d2a46c', '#c4945c'], seam: '#7e5232', joint: '#93623c', nail: '#5e3a24', light: '#dcb07a' },
  porthole: { brass: ['#f6d886', '#dcac4e', '#a8782a'], bolt: '#7c5418', glint: '#f2fbff', hinge: '#5a5250', hingeLight: '#7a7270' },
  /** what the porthole shows: never darkened by the room's light */
  view: {
    day: ['#86c8ee', '#9bd3f2', '#b0def5', '#c6e9f8'], dusk: ['#6656a6', '#a4659e', '#e2868a', '#fbbc86'], night: ['#181e4c', '#20275a', '#2a3268', '#333b74'],
    sea: { day: ['#45a6d6', '#3790c4', '#2a7ab0', '#21679c'], dusk: ['#9a6690', '#7a5492', '#5e4682', '#4a3a72'], night: ['#1e2c5c', '#19254f', '#141e44', '#10183a'] },
    crest: { day: '#8ad2f0', dusk: '#e8a2a2', night: '#3e4f8c' }, foam: { day: '#f6fcff', dusk: '#ffe0cc', night: '#9aa8d8' },
    sun: '#ffd25a', sunLight: '#fff0a6', sunLow: '#ff9858', sunLowLight: '#ffc890', glitter: '#fff6c4', moon: '#fff2c6', moonShade: '#e6d89e', star: '#fffae6',
    cloud: '#fdfeff', cloudShade: '#e2f2fa', island: '#f2d69c', palm: '#4c9a46', trunk: '#8e5e3a', gull: '#fefefe', silhouette: '#5a3e6e', nightIsland: '#26305e',
  },
  /** the cabin door: oak planks, iron straps, a brass ring, a little round window; the rope mat in front of it */
  door: {
    frame: ['#7a4e32', '#5e3a24', '#4a2e1e'], leaf: '#a8723f', leafLight: '#c08a52', leafShade: '#8a5c32', seam: '#6a4426', iron: '#4a4448', ironLight: '#6e686c', rivet: '#8a8488',
    ring: '#e0b44a', ringShade: '#a8822a', glass: '#bfe2ee', glassLight: '#eef8fb', mat: ['#e8cc94', '#d0aa6a', '#a8844a'],
  },
  /** the treasure map, the board: a click opens it and its notes */
  map: {
    parchment: ['#f8e8bc', '#efd8a0', '#dcbc80'], burnt: '#b88850', ink: '#6a4228', inkFaint: '#a07a50', land: '#e2c98c', green: '#8cbc66', greenDark: '#5e9448',
    sea: '#c9e2d6', x: '#d0342c', path: '#c0503a', pin: '#c9cfd6', pinShade: '#8a9098',
  },
  /** the ship's wheel round the clock, its handles; the clock's face in its hub */
  wheel: { wood: ['#e6b474', '#c48a4a', '#8e5a2e'], handle: ['#f2c88a', '#d29a5a', '#9e6838'] },
  clock: { rim: '#e0b44a', rimShade: '#a8822a', face: '#fff6dc', tick: '#7a4e32' },
  banner: { cloth: ['#3a3640', '#2a2630', '#1e1b24'], bone: '#f6efe0', boneShade: '#d6cbb6', pole: '#c9a06a', poleShade: '#8a6440', gold: '#f2c94c', cord: '#d8394a' },
  net: { cord: '#d8c090', knot: '#b89a68', float: ['#9fe0d8', '#5ab8b0', '#3a8a86'], floatLight: '#e6fbf8', star: '#f59a6a', starShade: '#d8764a' },
  anchor: { iron: ['#7a7480', '#5a5462', '#423e4a'], rope: '#d0aa6a' },
  cutlass: { blade: '#e6ebf0', bladeShade: '#aab2bc', hilt: '#e0b44a', grip: '#6a2e2a' },
  wallLantern: { iron: '#3e3a40', ironLight: '#5e585e', glass: '#ffd970', glassLight: '#fff2b8', glassShade: '#f0b84a' },
  /** the galley along the right wall, where the offices' counter is */
  galley: {
    body: ['#b07a4e', '#97643e', '#7c4f30'], slat: '#6a4228', slatLight: '#c08a5a', top: ['#d0a06a', '#b8864f', '#9a6c3c'], topEdge: '#e6bc84',
    kettle: ['#f6b27a', '#d8844e', '#a8602e'], kettleLight: '#ffd6aa', bottle: ['#7cc48a', '#4e9a62', '#357048'], cork: '#c9a06a', rum: ['#c8783a', '#a85a28', '#7e401c'], label: '#f6ecd2',
    bowl: ['#e0b07a', '#c08a52', '#9a6838'], orange: '#f5963a', orangeLight: '#ffbe6a', apple: '#d8483a', banana: '#f4d44a', leaf: '#6ab04e',
  },
  /** the water cask where the offices' cooler is */
  cask: { staves: ['#c99662', '#ad7a4a', '#8c5c36'], hoop: '#5a5250', hoopLight: '#7e7674', tap: '#e0b44a', tapShade: '#a8822a', stand: ['#8a5a3a', '#6e4529', '#5a3822'], drip: '#9fd8f0' },
  barrel: { staves: ['#c08a55', '#a4724a', '#84583a'], hoop: '#5a5250', hoopLight: '#7e7674', lid: ['#d0a06a', '#b08050', '#8c6440'] },
  parrot: { red: '#e8483a', redShade: '#b83228', yellow: '#f6cc4a', blue: '#4a8ed8', green: '#5abd5a', beak: '#f2d27a', eye: '#fffaf0' },
  chest: { wood: ['#b8804e', '#94603a', '#70452a'], band: ['#6e686c', '#4a4448', '#36323a'], lock: '#f2c94c', coins: ['#fff0a0', '#f6cc4a', '#cc962a'], gems: ['#ef4f6a', '#4ab4ef', '#5ad88a'], pearl: '#fff8f0', lining: '#a23e3e' },
  crate: { wood: ['#d0a46c', '#b48a54', '#94703e'], brace: '#8a6438', rope: ['#eed29c', '#d4ae70', '#a8844a'] },
  lamp: { post: ['#8a5a3a', '#6e4529', '#4a2e1e'], iron: '#3e3a40', ironLight: '#5e585e', glass: '#ffd96a', glassLight: '#fff0b0', glassShade: '#f2b24a' },
  couch: { body: ['#c0524a', '#a23e3e', '#802e32'], edge: '#d86e62', cushion: ['#d2625a', '#b44a46', '#903638'], cushionEdge: '#ea8c7c', button: '#f2c94c' },
  pillow: ['#5a7cb2', '#46649c', '#344c7e'], pillowAnchor: '#f2c94c',
  rug: { edge: '#1e2a4a', base: '#2e3e6a', field: '#34487a', border: '#c9963a', borderLight: '#f0c860', star: '#f6e2a8', starShade: '#d8b870', north: '#e0503e', northShade: '#a8302c', fringe: '#efe2c4' },
  desk: {
    top: ['#a8623e', '#8a4c30', '#6c3822'], edge: '#c07a50', leg: ['#6e4529', '#5a3822', '#4a2e1e'], drawers: ['#9a5c3a', '#7e482c', '#643822'],
    monitor: ['#5e4c44', '#4a3c38', '#382c2a'], monitorEdge: '#76625a', stand: ['#6e686c', '#4a4448', '#36323a'], vents: '#2a2224', keyboard: ['#f2e4c4', '#dac69e', '#c2ab80'], key: '#a8906a',
  },
  chair: { base: ['#6e686c', '#4a4448', '#36323a'], pole: ['#7e7880', '#5e585e', '#46404a'] },
  seats: [['#d2625a', '#b44a46', '#903638'], ['#5a7cb2', '#46649c', '#344c7e'], ['#f2c95c', '#dcaa3a', '#b98a28'], ['#5aa89a', '#468a7e', '#346e64']],
  tankard: { body: '#bcc0c8', shade: '#8c909a', band: '#6a6e78', foam: '#fff8e6' },
  bottle: { glass: '#cdeaf2', glassShade: '#9fcad8', cork: '#c9a06a', hull: '#8a5a36', sail: '#fffaf0', sea: '#5aa6d6' },
  light: {
    on: { day: [1, 0.97, 0.92], dusk: [0.9, 0.76, 0.7], night: [0.56, 0.5, 0.62] },
    off: { day: [0.8, 0.78, 0.8], dusk: [0.62, 0.53, 0.58], night: [0.38, 0.35, 0.5] },
    lamp: { dusk: [0.46, 0.3, 0.1], night: [0.86, 0.56, 0.2] },
  },
} as const;
