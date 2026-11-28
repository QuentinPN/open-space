// The space station's palette (ambiance 'space', src/room/cozy/ambiance/space.ts). Owned by this file alone.
export const space = {
  wall: { left: '#e6e9f2', right: '#d6dbe8', capTop: '#f4f6fb', capLeft: '#b8bfd0', capRight: '#a9b1c4' },
  hull: { seam: '#b3bacd', seamLight: '#f7f9fd', lower: '#a9b2c8', lowerRight: '#9aa3bb', vent: '#6f7893', rivet: '#c4cad8', strip: '#8ff0f6', stripDim: '#5fc8d6', decal: '#f59ac8' },
  deck: { tones: ['#b9c0d4', '#b2b9ce', '#c0c6d8', '#adb4ca'], seam: '#8a92aa', light: '#d4d9e6', rivet: '#e0e4ee', hazard: '#f2c94c', hazardDark: '#4a4e62' },
  porthole: { frame: ['#f4f6fb', '#c4cad8', '#9aa2b8'], bolt: '#8a92aa', glass: '#9fb3ff' },
  /** what the porthole shows: never darkened by the room's light */
  view: {
    day: ['#141a44', '#1a2152', '#212a62', '#283372'], dusk: ['#2a1a48', '#3a2058', '#4c2a68', '#5e3474'], night: ['#090b22', '#0d1030', '#111640', '#151b4c'],
    star: '#fffff2', starBlue: '#bfe8ff', nebula: '#c97ac8', nebulaDeep: '#7d5cc2',
    planet: '#7fc8e8', planetLight: '#b8e6f6', planetShade: '#3f7fae', planetNight: '#1e3a62', band: '#f0c39a', ring: '#f6dca8', ringShade: '#c9a878', sun: '#ffd27a', sunGlow: '#ff9d6a',
  },
  door: { frame: ['#c4cad8', '#a9b1c4', '#8a92aa'], leaf: '#d6dbe8', leafLight: '#eef1f8', leafShade: '#b3bacd', seam: '#5a6280', slit: '#8ff0f6', hazard: '#f2c94c', hazardDark: '#4a4e62', light: '#7cff9b', mat: ['#6f7893', '#5a6280', '#4a4e62'] },
  board: { frame: '#4a4e62', frameLight: '#6f7893', screen: '#1b2140', grid: '#2a3462', line: '#8ff0f6', orbit: '#5fb2e3', dots: ['#f59ac8', '#ffd23f', '#7cdb8f'], sun: '#ffd27a' },
  clock: { rim: '#8ff0f6', rimShade: '#5a6280', face: '#eef1f8', tick: '#6f7893' },
  galley: {
    body: ['#f4f6fb', '#dfe3ee', '#c4cad8'], edge: '#ffffff', panel: '#b3bacd', top: ['#c4cad8', '#a9b1c4', '#8a92aa'], topEdge: '#dfe3ee',
    unit: ['#5a6280', '#454c68', '#353b54'], unitEdge: '#6f7893', screen: '#1b2140', text: '#8ff0f6', led: '#7cff9b', nozzle: '#c4cad8', cup: '#ffffff', cupShade: '#c4cad8',
    pouches: ['#f59ac8', '#7cdb8f', '#ffd23f'],
  },
  tank: { base: ['#c4cad8', '#a9b1c4', '#8a92aa'], baseEdge: '#dfe3ee', glass: '#d4f1fb', water: '#5fb2e3', waterLight: '#8fd0f2', bubble: '#e8f8ff', cap: '#6f7893', tap: '#f59ac8' },
  pot: { light: '#ffffff', base: '#e6e9f2', shade: '#c4cad8', rim: '#dfe3ee', led: '#8ff0f6' },
  lockers: { lavender: ['#cfc6f4', '#b3a6e8', '#9686d6'], mint: ['#c4f0e0', '#a0ddc8', '#7ec5ad'] },
  rocket: { body: '#f4f6fb', shade: '#c4cad8', fin: '#f59ac8', window: '#5fb2e3', flame: '#ffd27a' },
  pads: ['#5a6280', '#8ff0f6', '#454c68'],
  couch: { body: ['#d4c8f4', '#b8a8e8', '#9c8cd6'], edge: '#e6defa', cushion: ['#c4f0e0', '#a0ddc8', '#7ec5ad'], cushionEdge: '#e2f8f0' },
  lamp: { base: ['#6f7893', '#5a6280', '#454c68'], tube: '#d4fafc', tubeLight: '#ffffff', tubeShade: '#8ff0f6', cap: '#c4cad8' },
  hatch: { rim: '#8a92aa', rimLight: '#c4cad8', plate: '#a3abc2', ring: '#949db6', middle: '#bcc3d6', bolt: '#e0e4ee', hazard: '#f2c94c', hazardDark: '#4a4e62' },
  desk: { top: ['#f4f6fb', '#dfe3ee', '#c4cad8'], edge: '#ffffff', leg: ['#9aa2b8', '#7f88a0', '#6a7290'], monitor: ['#5a6280', '#454c68', '#353b54'], monitorEdge: '#6f7893', stand: ['#9aa2b8', '#7f88a0', '#6a7290'], vents: '#2c3044', keyboard: ['#e6e9f2', '#c4cad8', '#a9b1c4'], key: '#9aa2b8' },
  chair: { base: ['#9aa2b8', '#7f88a0', '#6a7290'], pole: ['#b3bacd', '#9aa2b8', '#7f88a0'] },
  seats: [['#cfc6f4', '#b3a6e8', '#9686d6'], ['#c4f0e0', '#a0ddc8', '#7ec5ad'], ['#fbc4de', '#f59ac8', '#d87aac'], ['#ffe7a0', '#f6d06a', '#d8b04a']],
  mug: { body: '#f4f6fb', shade: '#c4cad8', band: '#7fc8e8', coffee: '#5a3424' },
  orb: { base: '#5a6280', glass: '#d4f1fb', glow: '#8ff0f6' },
  light: {
    on: { day: [0.98, 0.99, 1.03], dusk: [0.86, 0.82, 0.94], night: [0.55, 0.58, 0.8] },
    off: { day: [0.8, 0.83, 0.93], dusk: [0.62, 0.6, 0.76], night: [0.4, 0.42, 0.64] },
    lamp: { dusk: [0.18, 0.3, 0.38], night: [0.34, 0.56, 0.72] },
  },
} as const;
