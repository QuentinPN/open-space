// The cozy dungeon's palette (ambiance 'dungeon', src/room/cozy/ambiance/dungeon.ts). Owned by this file alone.
// Tones go light, base, dark. What shines by itself (the flames and their halo, the brew, the runes, the crystal) and
// what the arrow slit shows are colours used nowhere else: the room's light leaves them as they are.
export const dungeon = {
  /** the dark, warm line round every piece */
  outline: '#2a1c18',
  wall: { left: '#8c8079', right: '#796e69', capTop: '#b9ab9e', capLeft: '#6f655f', capRight: '#635a55' },
  /** the stone bricks of the two walls: their tones on the left wall and on the right one, the mortar, the plinth, the beam under the ceiling */
  bricks: {
    left: ['#a39589', '#8c8079', '#7a6f69'], right: ['#8f8279', '#796e69', '#695f5a'], mortarLeft: '#5f5550', mortarRight: '#534a46',
    moss: ['#8fa864', '#6f8a4c'], plinth: ['#6e645e', '#5d544f'], plinthEdge: '#857a72',
    beam: ['#8a5e3a', '#6e4a2c', '#553820'], peg: '#3e2a1c',
  },
  floor: { tones: ['#9d9288', '#a69a8e', '#91877e', '#aa9f92', '#968b82'], seam: '#615851', light: '#b9ad9f', crack: '#776d65', moss: '#86a05e' },
  /** the arrow slit: its dressed stones, its splay, its sill */
  slit: { stone: ['#c2b5a7', '#a99b8e', '#8e8177'], splayLit: '#9a8d82', splayShade: '#5a504a', sill: ['#b3a597', '#988a7e', '#7c7067'], sillEdge: '#cdbfb0' },
  /** what the arrow slit shows: never darkened by the room's light */
  view: {
    day: ['#cfeaf6', '#b6def1', '#9dd0ea', '#86c2e3'], dusk: ['#fbd3a0', '#f5ae8a', '#d98b92', '#9a74a4'], night: ['#2f3462', '#282c58', '#20244c', '#191d40'],
    sun: '#fff3b4', cloud: '#fdfdfb', star: '#fff7dc', moon: '#f6eecb', hill: '#7fae6c', hillDusk: '#8a6a7a', hillNight: '#232a44',
  },
  /**
   * a torch: its iron bracket, its wooden handle, its flame from the outside in, and the warm halo it throws on the
   * bricks of either wall: its bright middle (never darkened) and its rim (darkened with the room, so it fades out)
   */
  torch: {
    iron: ['#77737d', '#57535d', '#3e3a44'], handle: ['#a6713f', '#83562f', '#633f21'],
    flame: ['#ef5f2c', '#fe9a3b', '#ffd36a', '#fff5c8'], halo: ['#c9a47c', '#a88f78'], haloRight: ['#b8956f', '#968069'],
  },
  banner: { rod: ['#9c6a3e', '#7c5230', '#5e3c22'], knob: '#e8b84a', cloth: ['#d45663', '#b63f4c', '#8f2e3c'], trim: '#e9b64c', emblem: '#f5cf62', emblemShade: '#c99a38' },
  shield: { wood: ['#b8834e', '#9a6a3c', '#7a502c'], rim: ['#8a8692', '#6a6672', '#4e4a56'], boss: '#d9d4de', blade: ['#e6e3ea', '#b9b5c2'], hilt: '#7c5230', guard: '#d2a33e' },
  door: {
    arch: ['#c2b5a7', '#a99b8e', '#8e8177'], planks: ['#a26f44', '#8b5d38', '#744c2c'], seam: '#55371f', plankLight: '#b98352',
    iron: '#4e4a54', ironLight: '#7d7884', stud: '#b4aebb', ring: '#d6a83e', ringShade: '#9c7628', grate: '#2e2628', mat: ['#c4a06c', '#a98654', '#8a6a3e'],
  },
  /** the quest board: its timber, its planks, the notes pinned on it, their ink, the wax seals and the pins */
  board: {
    frame: '#6e4628', frameLight: '#9a6a3e', planks: ['#b88a58', '#a87c4c'], plankSeam: '#7e5734',
    note: '#f4e6c4', noteShade: '#dcc79e', ink: '#5e3e2c', inkFaint: '#a08466', seal: '#c8423e', sealLight: '#e86a5c', pins: ['#e8b84a', '#6aa8d8', '#7cc48a'],
    tray: ['#9a6a3e', '#7c5230', '#5e3c22'], quill: '#f7f2e6', quillShade: '#c9c0ae',
  },
  clock: { rim: '#d2a33e', rimShade: '#8f6a26', face: '#f4e6c4', tick: '#5e3e2c' },
  /** the alchemist's bench where the offices' counter is: its wood, its top, the cauldron and its brew, the bottles */
  bench: {
    body: ['#9c6a40', '#835634', '#6a4428'], top: ['#b98454', '#9e6c40', '#80542f'], topEdge: '#cc9a66', plank: '#5e3c22',
    cauldron: ['#615c68', '#4a4652', '#35323c'], cauldronRim: '#8a8592', brew: '#7ee38c', brewLight: '#c4f7b2', bubble: '#e8ffd8', fire: '#ff8a3a',
    mortar: ['#b3aab6', '#8f8698', '#6e6678'], book: ['#7a4fb0', '#5e3a8e'], page: '#f4e6c4', candle: '#f6ecd2', candleShade: '#d8caa6',
  },
  /** the bottles of potion, on the bench and on the shelf over it: their liquids, the glass's glint, the corks */
  potions: ['#e8586e', '#5aa6ea', '#b27ce6', '#62d08e', '#f2c14e'],
  potionGlint: '#fdfbff', cork: '#c9a06a',
  wallShelf: ['#a8744a', '#8a5a36', '#6a4428'], bracket: '#4e4a54',
  /** the ale barrel where the offices' water cooler is, on its stand, a tankard on it */
  barrel: { staves: ['#bc8450', '#9e6a3e', '#7e522e'], hoop: ['#87838f', '#625e6a'], stand: ['#7e522e', '#633f21', '#4c2f18'], tap: '#d6a83e', tankard: ['#a8744a', '#8a5a36'], foam: '#fbf6e8' },
  /** the open treasure chest by the door: its wood, its iron, its lock, the gold and a gem */
  chest: { wood: ['#c07c42', '#a26434', '#824e28'], iron: ['#6c6874', '#504c58', '#3a3640'], lock: '#f2c14e', gold: ['#ffe27a', '#f2c14e', '#c9962e'], gem: '#e8586e', gemLight: '#ffb0bc' },
  /** the bookcase of spellbooks under the quest board, a crystal ball on it */
  bookcase: { wood: ['#9c6a40', '#835634', '#6a4428'], edge: '#b98454', back: '#4a3020', books: ['#b04a4a', '#4f6fa8', '#d6a83e', '#5e9a5a', '#8a5aa0', '#e8dcc0', '#3f5a6b'] },
  crystal: { glass: '#c9ecff', glow: '#a98cf0', light: '#f2fbff', stand: ['#d6a83e', '#a67c24'] },
  /** the suit of armour in the back corner */
  armour: { steel: ['#dfe2ea', '#adb2c0', '#7e8494'], visor: '#2e2a36', plume: ['#e86a74', '#c44a56'], plinth: ['#a99b8e', '#8e8177', '#74685f'], plinthEdge: '#c2b5a7' },
  /** the brazier where the offices' floor lamp stands: its iron, its coals, its fire (the same flame as the torches) */
  brazier: { iron: ['#6c6874', '#504c58', '#3a3640'], coal: '#ff6a2a', ember: '#8a2e1e' },
  /** the rug of runes in the middle */
  rug: { edge: '#3e2c52', base: '#5c4378', field: '#523a6c', ring: '#e0b04a', ringShade: '#b08430', rune: '#7ff0de', fringe: '#dcc8a0' },
  /** the red velvet couch, its gold cushions, a little pillow */
  couch: { body: ['#b44858', '#953848', '#762a3a'], edge: '#cc6270', cushion: ['#e8b858', '#cc9a3a', '#a87a28'], cushionEdge: '#f6d27a' },
  pillow: ['#8a6ac8', '#6e50ac', '#543a8c'],
  cobweb: '#e2dbd0',
  chain: ['#8a8592', '#5e5a66'],
  desk: {
    top: ['#a8743f', '#8c5e32', '#6e4826'], edge: '#c08a54', leg: ['#7a5030', '#5e3c22', '#462c18'], drawers: [['#a26f44', '#8b5d38', '#744c2c'], ['#9c6a40', '#835634', '#6a4428']],
    monitor: ['#5e5a64', '#47434e', '#35323b'], monitorEdge: '#76717e', stand: ['#6c6874', '#504c58', '#3a3640'], vents: '#26222a', keyboard: ['#e6d6b2', '#cbb88e', '#ab9870'], key: '#8a6a42',
  },
  chair: { base: ['#6c6874', '#504c58', '#3a3640'], pole: ['#7a5030', '#5e3c22', '#462c18'] },
  seats: [['#d45663', '#b63f4c', '#8f2e3c'], ['#6aaa6e', '#4f8c56', '#3a7044'], ['#6a8ad8', '#4f6cb8', '#3c5494'], ['#b27ce6', '#9260c8', '#7448a8']],
  candle: { wax: '#f6ecd2', shade: '#d8caa6', dish: ['#d6a83e', '#a67c24'] },
  flask: { glass: '#d6f0f6', liquid: '#e8586e', cork: '#c9a06a' },
  light: {
    on: { day: [0.98, 0.94, 0.9], dusk: [0.86, 0.72, 0.68], night: [0.56, 0.48, 0.56] },
    off: { day: [0.78, 0.76, 0.8], dusk: [0.6, 0.52, 0.58], night: [0.38, 0.34, 0.46] },
    lamp: { dusk: [0.44, 0.27, 0.1], night: [0.86, 0.52, 0.2] },
  },
} as const;
