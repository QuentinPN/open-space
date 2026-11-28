// The offices' palette (ambiance 'office', and the cozy rooms in general: the server room, the break room, the home). Owned by this file alone.

/**
 * The cozy rooms (src/room/cozy/): a little room per project, cream walls and honey planks, pastel furniture. Tones go
 * light, base, dark. Hex only: the room's art lights them for the hour and its lamps (cozy/light.ts).
 */
export const office = {
  outline: '#3b2620',
  wall: { left: '#f9efda', right: '#f0e1c3', capTop: '#fff7e6', capLeft: '#dcc6a0', capRight: '#cfb68e', topLeft: '#efdfc0', topRight: '#e5d2ad' },
  wainscot: {
    left: '#ebd3a8', right: '#dfc495', panelLeft: '#dcc296', panelRight: '#d0b483', lightLeft: '#f6e5c4', lightRight: '#eed9b3',
    rail: '#c99a68', railLight: '#e5bd8c', base: '#a46d47', baseLight: '#c0865a',
  },
  planks: ['#e3ab6a', '#d99f5d', '#e8b677', '#dda463'],
  plankSeam: '#b97b42',
  plankJoint: '#c08348',
  window: {
    frame: '#d7c9b4', pane: '#fbf7ef', sunGlint: '#fff6c8',
    cloud: '#ffffff', cloudShade: '#e3f2f8', mullionShade: '#e4dacb', sill: ['#fffaf0', '#e9dcc6', '#d6c5aa'], sillEdge: '#fffdf8',
  },
  sunflower: { pot: '#f2b25c', potShade: '#d48a3a', potRim: '#ffcd7a', stem: '#5a9a45', leaf: '#7cc463', petals: '#ffc93c', heart: '#8a5a2b', petalLight: '#ffe58a' },
  curtain: ['#ece3fb', '#d4c3f2', '#b9a3e3'],
  curtainTie: '#f7a8bc',
  curtainRod: '#b9895a',
  whiteboard: {
    frame: '#9aa6b8', frameLight: '#c9d1dd', surface: '#fdfdfa', surfaceTop: '#eef0f2', grey: '#7b8494',
    ink: ['#5b8def', '#ef6b8a', '#3dbb8c', '#f5b84a'], inkShade: ['#4d78cb', '#cb5b75', '#349f77', '#d09c3f'], tray: ['#e4e8ee', '#b9c2cf', '#a3adbc'],
    star: '#ffd23f', starLight: '#fff0a0', heart: '#ef4f6a', heartLight: '#ff9aa8',
  },
  macrame: { cord: '#efe2c4', knot: '#d8c69f', hook: '#b9895a', outline: '#8a6a4a', pot: ['#fffdf8', '#f5d9c4', '#e6c2a8'], potRim: '#fff4ea', potBand: '#e7a98a' },
  leaves: ['#9be27a', '#62b24d', '#3e8a3a'],
  rug: { edgeShade: '#c9708a', edge: '#d88199', base: '#f3a2b6', ring: '#f8bccb', middle: '#fad0db', dots: '#fde4ec', heart: '#ef8aa5' },
  desk: ['#fdfcf8', '#e8e3da', '#d3ccc0'],
  deskEdge: '#ffffff',
  leg: ['#e8e3da', '#d3ccc0', '#bfb7aa'],
  drawer: { mint: ['#c4f0e0', '#a0ddc8', '#7ec5ad'], pink: ['#ffd3e1', '#f4b3c8', '#df93ab'], lemon: ['#fff0a6', '#f7d65e', '#dcb340'], lilac: ['#e6dafa', '#cbb8f0', '#ab96dc'] },
  monitor: ['#f6f2ea', '#e9e3d7', '#d2cabb'],
  monitorEdge: '#fffdf8',
  stand: ['#cfc8ba', '#b9b1a3', '#a39b8d'],
  screen: '#27304d',
  screenTop: '#303b5c',
  screenGlow: '#3a4a78',
  vents: '#bdb4a5',
  led: '#7cdb8f',
  keyboard: ['#f2eee6', '#d8d2c6', '#c4bdaf'],
  key: '#cfc8ba',
  code: ['#c792ea', '#82aaff', '#f78c6c', '#c3e88d', '#89ddff', '#ffcb6b'],
  cursor: '#ffffff',
  mug: { body: '#f7a8bc', shade: '#e1869d', rim: '#fde4ec', coffee: '#5a3424' },
  succulentPot: ['#fbf3e4', '#dfd3bd'],
  chair: { base: ['#9a92a0', '#7d7584', '#6a6370'], pole: ['#b0a8b6', '#8a8290', '#6a6370'], seats: [['#bcd6f6', '#98bbe9', '#7a9fd6'], ['#ffd3e1', '#f4b3c8', '#df93ab'], ['#c4f0e0', '#a0ddc8', '#7ec5ad'], ['#e6dafa', '#cbb8f0', '#ab96dc']] },
  counter: {
    body: ['#d8a26a', '#c88f55', '#ad7642'], panel: '#a36c3c', panelLight: '#dcaa74', knob: '#fbe3a8', top: ['#f1c38a', '#d9a26a', '#c08a55'], topEdge: '#ffd9a6',
    machine: ['#6b6b78', '#4c4c58', '#3a3a44'], machineEdge: '#8a8a98', machineFace: '#2c2c34', red: '#ff6b6b', green: '#7cdb8f', nozzle: '#9a9aa8',
    cup: '#ffffff', cupShade: '#dcd6cb', coffee: '#7a4a2e', plate: '#fffdf8', plateShade: '#efe6da', donut: '#d7924f', icing: ['#f7a8bc', '#c9a7f2'],
    donutHole: '#a0602e', sprinkles: ['#ffffff', '#ffe58a', '#7cdbe0'],
  },
  cooler: { body: ['#f7f4ee', '#e4ded2', '#cbc3b5'], edge: '#ffffff', slot: '#cbc3b5', slotShade: '#a39b8d', hot: '#ef5b5b', cold: '#5b8def', neck: '#9fb6c9', water: '#5fb2e3', waterLight: '#8fd0f2', cap: '#4a90c8', glint: '#d8f2fc' },
  cactus: { pot: '#c9e7f7', potShade: '#9ccbe6', body: '#62b24d', light: '#9be27a', flower: '#ff8fb1', flowerLight: '#ffc2d4' },
  books: { blue: '#5b8def', blueShade: '#4470c8', red: '#ef6b8a', redShade: '#c94f6c', yellow: '#ffd23f', yellowShade: '#d9a72a', page: '#ffffff' },
  clock: { body: '#ff9aa8', face: '#fffdf7', feet: '#e1869d' },
  couch: { body: ['#e2d4f8', '#c4b1ee', '#a691da'], edge: '#efe6fc', cushion: ['#f0e8fd', '#d5c6f3', '#b7a4e2'], cushionEdge: '#faf6ff', star: '#ffd23f', starLight: '#fff0a0', starShade: '#e8b52a', pillow: '#f7a8bc', pillowLight: '#fbc6d4' },
  monstera: { leaves: ['#8fd36a', '#5fae4b', '#3f8a3c'], leavesLight: ['#a6e07a', '#72bf55', '#4a9440'], stem: '#4e8a3a', pot: '#f6f2ea', potLight: '#ffffff', potShade: '#ddd6ca', soil: '#6b4a33', potRim: '#e6dfd2', eye: '#7a6a6a' },
  blush: '#f7909a',
  lamp: { base: '#8a7a6a', baseLight: '#a8988a', pole: '#6b5a4a', shade: '#ffd968', shadeLight: '#fff0b0', shadeDark: '#e8b84a', shadeRim: '#d9a63a' },
  cat: { zzz: '#8f7fc0', zzzFading: '#c4b8e6' },
  rack: { body: ['#6a7182', '#525868', '#3e4350'], face: '#2c303a', on: '#7cdb8f', busy: '#f5b84a', link: '#5fb2e3', off: '#4a4e5a' },
  /** the door of a project room to the break room, and of the break room back (cozy/decor.ts) */
  door: {
    frame: '#9a6640', frameLight: '#c0865a', leaf: '#d9a066', leafLight: '#e8b77e', leafShade: '#c08a52', panel: '#c48f58', panelLight: '#f0c690',
    knob: '#ffd968', knobShade: '#d9a63a', sign: '#fff7e6', signInk: '#8f7fc0', mat: ['#c4b1ee', '#a691da', '#8f7fc0'],
  },
  /** the break room (cozy/lounge-art.ts): its two sofas, the bookshelf, the coffee table and its console, the tea corner, the arcade */
  lounge: {
    sage: { body: ['#cfe8d8', '#a9d3bb', '#86b99c'], edge: '#e6f5ec', cushion: ['#e2f3e9', '#bfe0cc', '#9cc8ae'], cushionEdge: '#f3fbf6' },
    peach: { body: ['#ffe0c7', '#f7c39c', '#e2a274'], edge: '#fff0e2', cushion: ['#fff0e2', '#fbd3b3', '#eab48a'], cushionEdge: '#fff8f0' },
    shelf: ['#c98f5a', '#b07a4c', '#94633a'], shelfBack: '#7f5232', shelfEdge: '#ddaa76',
    table: ['#f1c38a', '#d9a26a', '#c08a55'], tableEdge: '#ffd9a6', tableLeg: ['#c08a55', '#a87440', '#8a5f34'],
    console: ['#f6f2ea', '#e9e3d7', '#d2cabb'], padLeft: '#5b8def', padRight: '#ef6b8a', padButton: '#ffd23f',
    rug: { edgeShade: '#86b99c', edge: '#a9d3bb', base: '#cfe8d8', ring: '#e2f3e9', middle: '#f3fbf6', dots: '#ffffff', leaf: '#86b99c' },
    tea: { kettle: ['#f7f4ee', '#e4ded2', '#cbc3b5'], spout: '#a39b8d', teapot: '#f7a8bc', teapotShade: '#e1869d', lid: '#fde4ec', jar: '#c9e7f7', cookie: '#d7924f', steam: '#ffffff' },
    arcade: { body: ['#b9a3e3', '#9a86d0', '#7c68b8'], edge: '#d4c3f2', marquee: '#ffd23f', marqueeLight: '#fff0a0', screen: '#27304d', pixel: ['#7cdb8f', '#ef6b8a', '#5fb2e3', '#ffd23f'], stick: '#3b2620', buttons: ['#ef6b8a', '#7cdb8f', '#5fb2e3'] },
    picture: { frame: '#b07a4c', frameLight: '#d9a066', sky: '#bce6f6', hill: '#9be27a', hillShade: '#62b24d', sun: '#ffcf4d', mat: '#fffaf0', heart: '#f7a8bc' },
  },
  /** the numbers screen on a wall at home (cozy/home/kit.ts): a click opens the mods, like the classic office's TV */
  metricsScreen: { body: ['#5a5a66', '#46464f', '#34343c'], edge: '#7a7a88', screen: '#27304d', grid: '#33406a', bars: ['#7cdb8f', '#5fb2e3', '#f5b84a', '#ef6b8a'], line: '#ffffff', led: '#7cdb8f' },
  shadow: 'rgba(120, 64, 30, 0.22)',
  /** the room's plate under it in the overview (HTML, cozy/CozyView.tsx), and its "+N" */
  plate: 'rgba(59, 38, 32, 0.86)',
  plateText: '#fff7e6',
  plateDim: 'rgba(40, 36, 70, 0.86)',
  plateHover: '#ffd23f',
  /** the sky of every cozy window at each mood of the hour (cozy/time.ts), top to bottom, and what shines in it */
  sky: {
    day: ['#7cc4ec', '#92d0f0', '#a5dbf1', '#bce6f6', '#d3f0f9', '#e6f7fb'],
    dusk: ['#5a4f9c', '#8a5fa8', '#c46f9e', '#ec8f86', '#f9b276', '#ffd58a'],
    night: ['#1e2250', '#262b5e', '#30356c', '#3c4180', '#4a4f8c', '#585d98'],
    sun: '#ffcf4d', sunLight: '#ffe58a', sunLow: '#ff9d5c', sunLowLight: '#ffc48a', moon: '#fff4c8', moonShade: '#e8dca0', star: '#fffbe8',
    duskCloud: '#ffd6cc', duskCloudShade: '#f2aab4',
  },
  /**
   * The light of a project room (cozy/decor.ts), multiplied per channel: lights on (someone works there) or off, at
   * each mood of the hour; at dusk and at night the floor lamp and the screens shine (added, per channel).
   */
  light: {
    on: { day: [1, 1, 1], dusk: [0.92, 0.8, 0.8], night: [0.56, 0.55, 0.74] },
    off: { day: [0.86, 0.86, 0.92], dusk: [0.68, 0.6, 0.68], night: [0.42, 0.39, 0.59] },
    lamp: { dusk: [0.36, 0.26, 0.1], night: [0.72, 0.52, 0.22] },
    screen: [0.1, 0.16, 0.34],
  },
  /** a home's light at the other moods than the one it was drawn at (cozy/light.ts), multiplied per channel */
  homeLight: { day: [1, 0.99, 0.97], dusk: [0.9, 0.78, 0.76], night: [0.5, 0.5, 0.68] },
  /** the clock on a wall of every cozy room (cozy/clock.ts) */
  wallClock: { rim: '#ff9aa8', rimShade: '#e1869d', face: '#fffdf7', tick: '#c9b8a8', hands: '#3b2620', minute: '#5a4038', pin: '#ef4f6a' },
  /** what the cozy rooms add for a festival (cozy/festive.ts), beside the classic rooms' colours (ROOM_PALETTE.festive) */
  festive: {
    basket: ['#e0b27a', '#c8945a', '#a87440'], grass: '#7cc463', pumpkinGlow: '#ffd36a', treePot: ['#f7a8bc', '#e1869d', '#c96c84'],
    string: '#8a6a4a', balloonShine: '#ffffff',
  },
} as const;
