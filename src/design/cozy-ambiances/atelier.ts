// The creative studio's palette (ambiance 'atelier', src/room/cozy/ambiance/atelier.ts). Owned by this file alone.

/** The paints of the studio, light, base, dark: splashes, pots, cans, the rug, the pictures. */
const pink = ['#ff9ab4', '#ef6b8a', '#c94f6c'] as const;
const yellow = ['#ffe07a', '#f5c03a', '#d49a22'] as const;
const blue = ['#8ab4ff', '#5b8def', '#4470c8'] as const;
const green = ['#86e2b4', '#3dbb8c', '#2e9670'] as const;
const violet = ['#d2b4f6', '#b48ae8', '#8f68c8'] as const;
const orange = ['#ffb48a', '#ff8a5c', '#d96a3e'] as const;

export const atelier = {
  paints: [pink, yellow, blue, green, violet, orange],
  wall: { left: '#f8f4ec', right: '#ece6db', capTop: '#fffdf8', capLeft: '#dbd3c5', capRight: '#cec5b5', speck: '#efe9de', speckRight: '#e1dacd', crack: '#d3c9b8' },
  brick: { tones: ['#e59a74', '#d4825c', '#c27050'], mortar: '#f3e6d4', edge: '#cfc2ae' },
  baseboard: { face: '#e2d2b4', light: '#f2e6cc', shade: '#c8b38e' },
  planks: { tones: ['#eadbc0', '#e4d2b4', '#efe2ca', '#e0cdac'], seam: '#c4a77f', joint: '#cfb38c' },
  /** the big steel window: its frame and bars, the sill, its clouds by day, a glint on the glass */
  window: {
    frame: ['#6f828d', '#56666f', '#435059'], bar: '#4c5b64', barLight: '#7a8e99', sill: ['#fbf7ef', '#e6dfd2', '#cfc6b6'], sillEdge: '#ffffff',
    cloud: '#ffffff', cloudShade: '#e3f2f8', glint: '#f4fbff',
  },
  door: {
    frame: '#cdb894', frameLight: '#e6d6b6', leaf: '#86cbbd', leafLight: '#ade0d4', leafShade: '#63ad9e', panel: '#73bcad', panelLight: '#a2dacd',
    knob: '#f5c84a', knobShade: '#c99a2a', sign: '#fffaf0', mat: ['#f2d9a8', '#e3c68e', '#c9a66c'],
  },
  /** the cork board: its frame, the cork, what is pinned on it */
  board: {
    frame: '#b98a58', frameLight: '#d9aa76', cork: '#d8a66a', corkLight: '#e5b97f', corkDark: '#c0905a', paper: '#fffdf6', paperShade: '#e9e2d2',
    pencil: '#7d6c60', note: ['#fff0a6', '#ffd3e1', '#c9e7f7'], photo: '#fbf8f1', tray: ['#d9aa76', '#b98a58', '#9c7044'],
  },
  clock: { rim: '#5b8def', rimShade: '#4470c8', face: '#fffdf7', tick: '#8a7a6a' },
  /** the easel and the canvases: the wood, the linen, the stretcher */
  easel: ['#dfa96c', '#c68f55', '#a5703e'],
  canvas: ['#fffdf6', '#f0eadc', '#dcd3c1'],
  stretcher: ['#e9cfa4', '#d4b585', '#b9986a'],
  /** the workbench where the coffee is: birch, its shelf, its cans */
  bench: { body: ['#ead1a6', '#d8b98a', '#bf9d6c'], top: ['#f4e1bf', '#e5cb9f', '#cdae7d'], edge: '#fff2d8', can: ['#eef1f4', '#c9cfd6', '#9ea6ae'] },
  kettle: { body: ['#ff9a8a', '#ef6f60', '#c9564a'], lid: '#fde4dc', handle: '#3b2620', press: '#e6f4f6', coffee: '#6a3c22', metal: '#c9cfd6' },
  mugs: ['#fffdf8', '#c9e7f7', '#fff0a6'],
  jar: { glass: '#dceff3', glassShade: '#b9dbe3', water: '#c8e3ef', handle: '#dfa96c', bristle: '#5a4038' },
  paper: ['#fffdf6', '#ece6d8', '#d8d0bf'],
  /** the jug of water on its crate */
  water: { crate: ['#e2bb84', '#c99f66', '#a8804c'], slat: '#b38a55', glass: '#dff2f6', glassShade: '#bfe0e8', water: '#bfe6f2', cap: '#5b8def', cups: '#fffdf8' },
  taboret: ['#cfe4f6', '#a8cbe8', '#86acd0'],
  flatFile: ['#f7d9c4', '#ebbea0', '#d49e7e'],
  books: ['#ef6b8a', '#5b8def', '#f5c03a', '#3dbb8c', '#b48ae8'],
  couch: { body: ['#f8cf72', '#e8b04a', '#c99232'], edge: '#ffe39e', cushion: ['#ffdc90', '#f4c062', '#dba446'], cushionEdge: '#fff1c8' },
  pillow: ['#9adfcf', '#68c2ae', '#4aa08e'],
  pillowStripe: '#fffaf0',
  /** the architect's lamp: its foot and arms, its red shade, its bulb */
  lamp: { base: ['#6f828d', '#56666f', '#435059'], shade: ['#ff8f86', '#ef5f56', '#c84840'], bulb: '#fff4c4', inside: '#ffe6a0' },
  plant: { leaves: ['#9be27a', '#5fae4b', '#3e8a3a'], edge: '#d9ec84', pot: ['#ef9e72', '#d8805a', '#b86444'], potRim: '#f8b48c', soil: '#6b4a33' },
  rug: { edge: '#8a6a9a', fringe: '#fff4e0', stripes: ['#f7a8bc', '#ffd98a', '#a8d4f6', '#b4e6b0', '#d6c0f4', '#ffc09c'], fleck: '#fffaf0' },
  pegboard: { board: '#ecd7ae', hole: '#c9ad80', frame: '#d4b98a', metal: '#b9c2cc', metalShade: '#8a96a0', ruler: '#f5d76a', rulerTick: '#a88a3a' },
  line: { string: '#a08870', clip: '#dfa96c' },
  poster: { mat: '#fffaf0', frame: '#3b3438', sky: '#fde7c9', sun: '#ff8a5c', hill: '#3dbb8c', hillFar: '#86c9a8' },
  desk: {
    top: ['#f6e6c8', '#e6cfa6', '#ccb282'], edge: '#fff6e2', leg: ['#9aa8b2', '#7e8c96', '#66737c'],
    monitor: ['#f6f2ea', '#e9e3d7', '#d2cabb'], monitorEdge: '#fffdf8', stand: ['#cfc8ba', '#b9b1a3', '#a39b8d'], vents: '#bdb4a5',
    keyboard: ['#f2eee6', '#d8d2c6', '#c4bdaf'], key: '#cfc8ba',
  },
  chair: { base: ['#8a96a0', '#6e7a84', '#5a656e'], pole: ['#a8b4bc', '#8a96a0', '#6e7a84'] },
  seats: [['#ffb0a0', '#f48a78', '#d86e5c'], ['#9adfcf', '#68c2ae', '#4aa08e'], ['#ffe08a', '#f5c03a', '#d49a22'], ['#d2b4f6', '#b48ae8', '#8f68c8']],
  palette: { wood: ['#f0c78e', '#dca66a', '#bd8a52'] },
  light: {
    on: { day: [1.02, 1.01, 1], dusk: [0.93, 0.82, 0.8], night: [0.58, 0.55, 0.72] },
    off: { day: [0.87, 0.86, 0.9], dusk: [0.68, 0.6, 0.66], night: [0.42, 0.4, 0.58] },
    lamp: { dusk: [0.38, 0.26, 0.12], night: [0.76, 0.52, 0.24] },
  },
} as const;
