// The beach hut's palette (ambiance 'beach', src/room/cozy/ambiance/beach.ts). Owned by this file alone.
// Tones go light, base, dark. Hex only: the room's art lights them for the hour and its lamps (cozy/light.ts), but the
// window's view (`view`), which is never darkened: its colours are its own.
export const beach = {
  wall: { left: '#ecd39e', right: '#dfc38a', capTop: '#f2d98a', capLeft: '#cfa64e', capRight: '#b8913f' },
  bamboo: { light: '#f2d896', base: '#e2bc72', shade: '#cda059', seam: '#94672f', node: '#a87a3c' },
  rattan: { light: '#d9a861', base: '#c08a48', dark: '#94622e', gap: '#6e4422' },
  rail: ['#ecc77e', '#cc9c52', '#a0743a'],
  skirting: '#6e4422',
  thatch: { tones: ['#efd27c', '#ddb75c', '#c99f48', '#e6c76c'], tip: '#94702c', rope: '#8a6a3a', ropeLight: '#b08a52' },
  deck: { tones: ['#f0d6aa', '#e9cc9d', '#f4dcb4', '#ecd2a4'], light: '#fbe9c8', gap: '#b88f62', joint: '#cfa97c', nail: '#a88660', grain: '#e0c394' },
  sand: ['#f6e2b0', '#e8cc94'],
  window: {
    frame: ['#f3e2c0', '#dcc49a', '#bfa274'], mullion: '#cfb487', mullionLight: '#efdcb4',
    blind: ['#efd79a', '#d9b96e', '#b8964e'], cord: '#8a6a3a', sill: ['#f3e2c0', '#dcc49a', '#bfa274'], sillEdge: '#fbf0d8',
  },
  /** what the window shows at each mood of the hour: never darkened by the room's light, so used nowhere else */
  view: {
    day: {
      sky: ['#5cbfee', '#72c9f0', '#8ad3f2', '#a2ddf4', '#bae6f5', '#d0eef6'], sea: ['#62d7d5', '#30b4c5', '#2090b0'], foam: '#f1fffa',
      sand: ['#fbe6b4', '#f1d494', '#dbbb79'], frond: ['#7fd46b', '#50ad4f', '#308945'], trunk: ['#c18b53', '#9b6b3d'], umbrella: ['#ff7a7c', '#fff7ed'], pole: '#a17b59',
      cloud: '#fdfffe', cloudShade: '#dff3fa', sail: '#fffbf3', hull: '#e8706a',
    },
    dusk: {
      sky: ['#6b5ba9', '#9b65ad', '#d1759d', '#f39585', '#fbb579', '#ffd991'], sea: ['#e99b9b', '#b1719d', '#6f5b97'], foam: '#ffe7d9',
      sand: ['#f5c89d', '#e5ac85', '#c98d71'], frond: ['#7b8b5b', '#5b6b49', '#3f4b39'], trunk: ['#8b5b49', '#6b4539'], umbrella: ['#e96b7b', '#f9ddcd'], pole: '#7d5a52',
      cloud: '#ffd8ce', cloudShade: '#f3abb5', sail: '#fff0e4', hull: '#a85a66',
    },
    night: {
      sky: ['#151b45', '#1b2253', '#222b63', '#293473', '#313d81', '#39478d'], sea: ['#3b5b9b', '#25417b', '#172b5b'], foam: '#9bb5e9',
      sand: ['#5b6391', '#4b5381', '#3b4371'], frond: ['#2b4b5b', '#1f3b4d', '#152b3b'], trunk: ['#3b3b5b', '#2b2b49'], umbrella: ['#6b4b7b', '#8b8ba9'], pole: '#4a4a6a',
      cloud: '#4b5591', cloudShade: '#3d4783', sail: '#8c94c4', hull: '#4c3e6c',
    },
    sun: '#ffe067', sunLight: '#fff5b1', sunLow: '#ff9b5b', sunLowLight: '#ffc37b', glare: '#fff1c9',
    moon: '#fff7d1', moonShade: '#e7dda9', moonGlint: '#d9e5ff', star: '#fffbeb',
  },
  door: {
    frame: ['#f4ead6', '#ddd0b4', '#bfae8e'], leaf: '#5cc4c0', leafLight: '#7cd8d2', leafShade: '#3fa4a4', seam: '#2f8a8c',
    glass: '#cfeef4', glassLight: '#f2fbfc', knob: '#f2c14e', knobShade: '#c9952e', star: '#ff9a6a', starShade: '#e07a4a',
    mat: ['#d9b77a', '#c49d5c', '#a07c40'], flipflops: ['#ff8f70', '#4ec3c8'], strap: '#fffaf0',
  },
  board: {
    frame: ['#e2d2b2', '#c8b08a', '#a08a66'], cork: '#d9a86a', corkDot: '#c48f52', corkLight: '#e6ba7e',
    notes: ['#fff3a8', '#bdeee6', '#ffd0d8', '#d6e8ff'], noteShade: ['#e8d884', '#98d4ca', '#eeaab6', '#b0cbee'], ink: '#6a5a8a', tick: '#3faa7a', heart: '#ef5f7a',
    pins: ['#ff6b6b', '#4ec3c8', '#f2c14e'], photo: '#fffaf0', photoSky: '#94d6ef', photoSea: '#44b8c9', photoSand: '#f0d699', photoSun: '#ffd84a',
    shell: '#ffd9c8', shellShade: '#e8b4a0', tray: ['#e2d2b2', '#c8b08a', '#a08a66'], pens: ['#4ec3c8', '#ff8f70'],
  },
  clock: { rim: '#e0a85a', rimShade: '#b07a3a', face: '#fff8e8', tick: '#a07040' },
  clockRays: ['#b87a34', '#7e4c20', '#e8b25e'],
  bar: {
    body: ['#e8c47a', '#d4a95e', '#b88a44'], pole: '#d8b064', poleLight: '#f2d896', poleDark: '#a0743a',
    top: ['#c88a52', '#ad7242', '#8f5a32'], topEdge: '#e0a468', skirt: ['#efd27e', '#d9b45c', '#b8953f'],
  },
  coconut: { shell: ['#a86f42', '#7d4c2b', '#5c351f'], flesh: '#fffaf0', straw: '#ff7b9c', strawLight: '#ffd0dc', umbrellas: ['#ffd23f', '#4ec3c8', '#ff8f70'], stick: '#c9a46a' },
  pineapple: { body: '#f2c14e', shade: '#d49a2e', dot: '#b07a24', leaves: ['#9be27a', '#62b24d', '#3e8a3a'] },
  limes: { fruit: '#9be05a', shade: '#6ab83a', bowl: ['#c88a52', '#ad7242', '#8f5a32'] },
  juice: {
    stand: ['#e8c47a', '#d4a95e', '#b88a44'], standEdge: '#f4dc9c', glass: '#e6f7f8', glassShade: '#c4e4e8', juice: '#ff8a9a', juiceLight: '#ffb4bc',
    seed: '#4a2e24', rind: '#7cc463', rindLight: '#b4e88a', lid: '#c99a52', tap: '#c9a24a', cups: '#fffaf0',
  },
  palm: {
    basket: ['#e4bb78', '#cc9e58', '#a87a3c'], rim: '#f2d496', soil: '#6b4a33',
    trunk: ['#dcae6e', '#bb894c', '#926536'], ring: '#7a5230',
    fronds: [['#a6e07a', '#72bf55', '#4a9440'], ['#8fd36a', '#5fae4b', '#3f8a3c']], coconut: ['#a86f42', '#7d4c2b'],
  },
  chests: { natural: ['#e4bb78', '#cc9e58', '#a87a3c'], coral: ['#ffc2ac', '#f49f84', '#d77c62'] },
  conch: { shell: '#ffe0d2', shade: '#f0b49c', inside: '#ff9aa8' },
  starfish: ['#ffb08a', '#ff9a6a', '#e07a4a'],
  sandcastle: { sand: ['#f6dfa4', '#e8c884', '#cfa964'], flag: '#ff6b6b', pole: '#8a6a4a', shell: '#fff0e6' },
  lamp: { pole: ['#e6c47a', '#c99a52', '#a0743a'], node: '#8f6234', shade: ['#e4bb78', '#cc9e58', '#a87a3c'], glow: '#fff0b8', glowWarm: '#ffd77a' },
  couch: { body: ['#d6a05a', '#b98040', '#94622e'], edge: '#ebbf7c', cushion: ['#c6efe6', '#9edbd0', '#72bdb2'], cushionEdge: '#e2fbf6', weave: '#8a5a2a' },
  pillows: [['#8fe2dc', '#4ec3c8', '#2fa0a8'], ['#ffb8a6', '#ff8f70', '#e06a50']],
  flower: { petal: '#fffaf0', heart: '#ffd23f' },
  rug: { edge: '#94703e', rings: ['#efd9a8', '#d6b47a', '#bf9a5e'], stitch: '#a8844e', wave: '#2fa8b0', waveLight: '#7fd8d4', middle: '#fff0b8', sun: '#f2b83e' },
  surfboard: {
    board: ['#fff4d8', '#f6e2b8', '#dcc294'], stripe: ['#6ad6d0', '#3fb0b0'], band: '#ff8f70', stringer: '#d8b884',
    peg: ['#b8864a', '#7a5230'], hibiscus: '#ff6b8a', hibiscusLight: '#ffa0b4', hibiscusHeart: '#ffd23f',
  },
  lifeRing: { white: ['#fffaf2', '#f2e6d6', '#d9c8b2'], band: ['#ff8a76', '#ef6a58', '#c84e40'], rope: '#7a5a36', peg: '#a0743a' },
  /** the string of lights under the thatch: they shine while someone is there */
  lights: { string: '#5a4030', bulbs: ['#ffe08a', '#ffb4a0', '#9ee8e0', '#fff0b0'] },
  desk: {
    top: ['#f2dca6', '#e2c486', '#c9a466'], edge: '#fbeac0', leg: ['#d8b070', '#bf9454', '#a07a40'],
    monitor: ['#fbf8f0', '#ece6da', '#d6cebe'], monitorEdge: '#fffef9', stand: ['#d8b070', '#bf9454', '#a07a40'], vents: '#c4bba8',
    keyboard: ['#fbf8f0', '#e6dfd0', '#cfc6b4'], key: '#d6cebe',
  },
  seats: [['#8fe2dc', '#4ec3c8', '#2fa0a8'], ['#ffb8a6', '#ff8f70', '#e06a50'], ['#ffe48a', '#f2c14e', '#d49a2e'], ['#c4f0d8', '#98dcb8', '#70c096']],
  chair: { base: ['#d8b070', '#bf9454', '#a07a40'], pole: ['#e6c47a', '#c99a52', '#a0743a'] },
  aloe: { pot: ['#8fe2dc', '#4ec3c8', '#2fa0a8'], leaves: ['#a6e07a', '#72bf55', '#4a9440'] },
  light: {
    on: { day: [1, 1, 0.97], dusk: [0.96, 0.8, 0.74], night: [0.52, 0.54, 0.74] },
    off: { day: [0.86, 0.86, 0.9], dusk: [0.68, 0.58, 0.64], night: [0.38, 0.39, 0.57] },
    lamp: { dusk: [0.4, 0.28, 0.12], night: [0.78, 0.54, 0.24] },
  },
} as const;
