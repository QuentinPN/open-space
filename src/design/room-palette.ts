// Every colour of the meeting room (the people's are in people-palette.ts). This is the one exception to the design
// tokens: the room is pixel art with a single look of its own, so it does not follow the light/dark theme. Change the
// room's colours here only (src/room/room.css reads the bubble colours from this file through CSS variables).

export const ROOM_PALETTE = {
  /** around the room: clear, the page's backdrop shows through */
  backdrop: 'transparent',
  /** the floor, the walls and what hangs on them */
  room: {
    planks: ['#9a6a40', '#a5744a', '#8f6138', '#a06e44'],
    plankSeam: '#6e4627',
    plankLight: '#b98652',
    floorEdge: '#5a3a22',
    floorEdgeDark: '#46301c',
    /** the stone slab the room stands on, floating in the sky: its two faces, the lit lip, the joints, the stepped underside */
    slab: '#8a849e',
    slabDark: '#6a6482',
    slabLight: '#b2acc6',
    slabSeam: '#5a5470',
    slabUnder: '#4a4560',
    wall: '#3f3a5a',
    wallStripe: '#38344f',
    wallSide: '#353049',
    wallSideStripe: '#2f2b42',
    wainscot: '#5a3f33',
    wainscotSide: '#4c352b',
    wainscotLine: '#43302a',
    rail: '#8a6a52',
    baseboard: '#2a2030',
    wallTop: '#6c6690',
    wallTopSide: '#5a547a',
    /** the cut end of a wall at the front of the room, and the lit edge of its top */
    wallEnd: '#2e2a44',
    wallTopEdge: '#8a84ae',
    doorFrame: '#7a5236',
    doorway: '#120d0b',
    doorLight: '#ffcf8a',
    windowFrame: '#2b2840',
    windowSill: '#6c6690',
    city: '#1d1631',
    cityFar: '#2a2040',
    cityLit: '#ffcf6b',
    clock: '#eef0f4',
    tvFrame: '#16141f',
    tvScreen: '#2b4a7a',
    clockHands: '#1b1f2c',
    rugs: { blue: '#2f4f86', green: '#2f6b55', purple: '#5a3f7a', amber: '#8a5a2a' },
  },
  /** the furniture (src/room/pixel-furniture.ts) */
  furniture: {
    wood: '#9a6a40',
    darkWood: '#5e3d26',
    metal: '#3b404e',
    lightMetal: '#8b919c',
    monitor: '#262a35',
    paper: '#f3f4f7',
    mug: '#e5534b',
    chair: '#2f3442',
    leaves: '#3f9a4a',
    trunk: '#6a4428',
    soil: '#3a2a1e',
    shadow: 'rgba(10, 6, 4, 0.14)',
    steam: '#e9edf5',
    darkLeaves: '#2c7236',
    pot: '#c0643a',
    books: ['#e5534b', '#4d8dff', '#e8c547', '#45c46b', '#7a5cc4', '#e8833a'],
    sofa: '#e8833a',
    couch: '#5a6fb0',
    lampShade: '#f4e3c0',
    cooler: '#d5d8de',
    water: '#6fb6f0',
    ledRed: '#e5534b',
    ledBlue: '#4d8dff',
    counter: '#e9e6df',
    coffee: '#2b2f3a',
    boss: '#3a2a20',
    bossStripe: '#ff8a3d',
    outline: '#0a0b0f',
    /** the whiteboard on wheels: its board, aluminium frame, stand, casters, and the markers it is written with (src/room/whiteboard.ts) */
    whiteboard: '#f7f8fa', boardFrame: '#b9bec8', caster: '#22252e',
    markers: { k: '#2b2f3a', b: '#2f6fd8', r: '#d8343f', g: '#2f8a4a', y: '#f2b822', o: '#e8833a', t: '#7a4a28' },
    /** the drafts of the numbers object (METRICS_OBJECT in shared/room-layout.ts): banknotes and a notepad, a dashboard screen, a stock ticker, a piggy bank */
    cash: '#5fae6a', cashBand: '#f3e9c6', notepad: '#f6f1dc', spiral: '#3b404e', rising: '#2f8a4a',
    screenBezel: '#16141f', screenFace: '#11243c', screenGrid: '#24466e', bars: ['#45c46b', '#7fd3ff'], trend: '#ffb866',
    ticker: '#0d0e13', tickerGreen: '#62f08e', tickerRed: '#ff6a6a', tickerAmber: '#ffc44a',
    piggy: '#f49ac1', piggyShade: '#d86f9c', piggySnout: '#ff8fbd', coin: '#f2c14e',
    /** around what a click opens (the user's laptop, the whiteboard, the numbers), under the pointer, like the door */
    highlight: '#ffffff',
    // the server room's console: a dark frame, a deep teal screen, its teal line, the keys' glow
    // the teleporter: its plinth and steps of dark stone, its ring of metal plates, its chevrons lit (the orb's colours)
    portalStone: '#3a4356', portalStoneLight: '#56627a', portalRing: '#6f7a90', portalRingLight: '#a9b3c6', portalRingDark: '#2c3342', portalChevron: '#5ad1ff', portalChevronCore: '#f2fdff',
  },
  /** the mods object of each theme (src/room/themes/mods-object.ts) */
  mods: {
    space: { metal: '#3b4256', metalTop: '#59627a', beam: '#4fd8ff', holo: '#1f6f8f', holoEdge: '#8ff3ff', text: '#d8fbff', bars: '#5fe1ff' },
    tokyo: { cabinet: '#1a1430', neon: '#ff3fa4', marquee: '#3a1430', panel: '#2a2236', panelTop: '#463a5a', screen: '#0e0b1e', alien: '#5dff8a', ship: '#ff8a3d', score: '#ffe14a', button: '#ff4a5a', buttonBlue: '#4ac8ff' },
    dungeon: { bracket: '#3a2a1c', shelf: '#6b4a2b', shelfTop: '#8a6440', cover: '#7a2a26', page: '#efe2bc', pageShade: '#c9b88f', wax: '#efe6d0', flame: '#ffb347' },
    beach: { peg: '#8a5a30', teal: '#2fb5c8', tealTop: '#6fdbe8', coral: '#ff7a6a', coralTop: '#ffa999', white: '#ffffff', sun: '#ffd84a' },
    pirate: { edge: '#8a5a2b', parchment: '#ecd9a8', island: '#5f9a35', path: '#c8342f', blade: '#c9ced8', hilt: '#5a3a1e', hiltTop: '#8a5a2b' },
    forest: { wood: '#9a6e42', woodTop: '#b98a55', roof: '#8a3a28', roofTop: '#a8442f', hole: '#2a1a10', perch: '#6b4a2b', note: '#f4eed8', writing: '#8a7a5a' },
    cellar: { casing: '#3a3f3b', casingTop: '#565c57', casingDark: '#232724', screen: '#0b2a14', text: '#5ff08f', cursor: '#d6f5df', led: '#ff5a5a' },
  },
  /** Halloween's decorations (src/room/halloween.ts, and the pumpkins of pixel-furniture.ts) */
  halloween: {
    pumpkin: '#e8833a', pumpkinDark: '#b85a1e', stem: '#4a7a2a', stalk: '#6b4a2b', stalkLight: '#8a6440', leaf: '#5f9a35', carved: '#2a1a10', ghost: '#eef0f6', web: '#b9bccb',
    wire: '#2a2433', bulbOrange: '#ffa94d', bulbPurple: '#b07cff', glow: '#ffb347',
  },
  /** the other festivals (shared/festivals.ts): their furniture, walls, outfits and effects (src/room/festivals.ts) */
  festive: {
    gold: '#f2c14e', goldDark: '#b8862a', silver: '#d3d9e6', red: '#d8343f', green: '#2f8a4a', pine: '#2a7a44', pineDark: '#1c5a33', trunk: '#6a4428',
    white: '#f4f6fa', pink: '#ff8ab4', rose: '#e0304e', blue: '#3a6fd8', black: '#1a1b22',
    bulbs: ['#ff5a5a', '#ffd84a', '#5ad1ff', '#7dff6a', '#ff8af0'],
    gifts: ['#d8343f', '#3a6fd8', '#2f8a4a', '#9a6ad8'],
    balloons: ['#ff5a6e', '#ffd84a', '#5ab8ff', '#7ad97a', '#c88aff'],
    confetti: ['#ff5a5a', '#ffd84a', '#5ad1ff', '#7dff6a', '#ff8af0', '#ffffff'],
    eggs: ['#ff9ccf', '#9fd8ff', '#fff07a', '#b6ff9c', '#d0a8ff'],
    tablecloth: '#ffd1e3', plate: '#eef0f4', crepe: '#f1c27d', crepeDark: '#d79a52', jam: '#b4233a', galette: '#e2a640', cake: '#f6e1c8', icing: '#ff9ccf',
    candle: '#8ad1ff', flame: '#ffcf4a', chocolate: '#6b3f22', glass: '#bfe3f2', bubbly: '#f6e08a', bottle: '#1f5a3a',
    water: '#5ec8f2', waterLight: '#c2f0ff', poolRim: '#ff8a3d', poolStripe: '#ffffff', duck: '#ffd84a', duckBeak: '#ff8a3d', squirt: '#7fd8ff',
    envelope: '#c8202c', kumquat: '#ff9a1f', potRed: '#b8242c', lily: '#fbfbf2', leaf: '#3f9a4a',
    speaker: '#23252e', speakerCone: '#3b3f4c', fan: '#d5d8de', fanBlade: '#9aa3b4',
    tricolor: ['#2b4fb3', '#f4f6fa', '#d8343f'], lantern: '#d8202c', lanternGlow: '#ff6a3d', note: '#f4f1e8', heart: '#ff5a7a', heartDark: '#c2305a', snow: '#f4f8ff',
    hatStripe: '#ffffff', fur: '#f4f6fa', jewel: '#d8343f', jewelBlue: '#3a6fd8', ear: '#f4f6fa', earInside: '#ffb3c8', headphones: '#2a2d36', headphonesShell: '#434a5a', headphonesShine: '#7a849c', headphonesPad: '#e5534b',
    shades: '#121419', shadesShine: '#5a6a8a', waterGun: '#ff8a3d', waterGunTank: '#5ad1ff', beret: '#2b4fb3',
  },
  /** the office pet (src/room/pet.ts): its hearts and speech bubble, each cat coat, each dog breed, and Rocky */
  pet: {
    heart: '#ff6b9a', bubble: '#ffffff', bubbleInk: '#1b1b22', nose: '#e86f8a', earInside: '#f2a0b0', tongue: '#ff7a8a', black: '#1b1b22', white: '#f4f4f6',
    collar: '#d8343f', tag: '#f2c14e', beak: '#ff9a2a', citrus: '#ffb02e', leaf: '#3f9a4a', gills: '#e8608a',
    /** each cat pattern's fur, before the user picks another; the patches of a calico */
    cats: { plain: '#e08a3c', tabby: '#9a7a52', calico: '#f4efe6', tuxedo: '#26262d', eyes: '#3f9a4a', patchA: '#e08a3c', patchB: '#2a2a33' },
    /** each breed's fur, before the user picks another */
    dogs: { labrador: '#e3b56a', dalmatian: '#f4f4f6', husky: '#7d8696', shiba: '#d9813a', corgi: '#e0903f', dachshund: '#8a4a26', pug: '#e3c89a' },
    duck: '#ffd84a', capybara: '#9a6a3c', axolotl: '#ffb3c8',
    /** Claude Code's mascot, in its clay orange */
    clawd: '#d97757',
    rocky: { shell: '#8a5a2c', light: '#c08a4a', dark: '#5a3a1c' },
    /** the later pets' own colour (src/room/pet-species.ts), before the user picks another */
    species: {
      robotDog: '#a9b4c6', alien: '#7fd36a', dragon: '#4fae6a', ghostCat: '#e4e8fb', parrot: '#e8443a', crab: '#e8604a', turtle: '#7a8a3a',
      owl: '#9a7a52', fox: '#e0702a', redPanda: '#c4502a', slime: '#6aa8ff', octopus: '#e86a8a', manekiNeko: '#f4f4f6', golem: '#8b919c',
      firefly: '#e8f56a', penguin: '#2a2d36', rabbit: '#c9a07a', hedgehog: '#8a5a3a',
    },
    /** what the later pets wear whatever their colour: a robot's visor, a dragon's belly and flame, a parrot's wing… */
    robotEye: '#5ff0ff', alienTip: '#ff8ab4', dragonBelly: '#f2d48a', flame: '#ff8a3d', flameCore: '#ffe27a', ghostEyes: '#7fe8ff',
    parrotWing: '#3a7ae0', parrotBand: '#f2c14e', parrotBeak: '#e8e2d0', parrotFeet: '#8b919c', clawGap: '#5a1f1a',
    turtleSkin: '#9ac46a', turtleRim: '#e3c89a', owlEyes: '#f2c14e', owlBeak: '#e3a04a', pandaDark: '#3a2620',
    manekiPatch: '#e08a3c', coin: '#f2c14e', golemGlow: '#7fe8ff', fireflyBody: '#3a3540', fireflyWing: '#cfe3f2', hedgehogFace: '#e8cfa8',
  },

  /** the day cycle (src/room/lighting.ts): tints multiplied over the room, sky colours, and the light sources */
  light: {
    night: '#2c3466',
    dawn: '#f2b9a0',
    day: '#ffffff',
    dusk: '#d98a6c',
    skyNightTop: '#0b1430',
    skyNightBottom: '#24366e',
    skyDawnTop: '#5b6fb8',
    skyDawnBottom: '#f6b48c',
    skyDayTop: '#5f9be3',
    skyDayBottom: '#bfe0fb',
    skyDuskTop: '#3d3f8f',
    skyDuskBottom: '#f08a5d',
    sun: '#fff1c9',
    sunLow: '#ffb46b',
    moon: '#9fb7ff',
    /** the sky behind the page (src/room/sky.ts) */
    moonDisk: '#eef2ff',
    cloud: '#f7f9ff',
    cloudShade: '#d3ddf2',
    lamp: '#ffc46b',
    screen: '#7fd3ff',
    screenIdle: '#5a7bd0',
    corridor: '#ffb86b',
    city: '#7a6cff',
    boss: '#ff8a3d',
    coffee: '#ff9a5a',
  },
  /** behind the user's bust in the app icon and the favicon (src/room/chibi.ts, scripts/macos-app.py): the room at night */
  icon: { top: '#3a4170', bottom: '#252a48' },
  star: '#e8eefc',
  shadow: 'rgba(10, 8, 20, 0.35)',
  white: '#ffffff',
  outline: '#1b1f2c',
  /** the badge above the numbers object while something new waits in its file (src/room/metrics.ts) */
  metricsBadge: '#ffd43b',
  /** the round icon at the start of a name tag, in the page's session tones (--tone-* in tokens.css) */
  status: {
    permission: '#ffb866',
    question: '#ffb866',
    working: '#8cc2ff',
    finished: '#6fdc9b',
    error: '#ff8f8a',
    compacting: '#c9a6ff',
  },
  /** the glyph in that icon */
  statusInk: '#141826',
  /** a name tag that waits for the user: amber through the glass, an amber edge and a soft halo */
  askingTag: 'rgba(78, 58, 38, 0.9)',
  askingTagEdge: 'rgba(255, 184, 102, 0.7)',
  askingTagHalo: 'rgba(255, 184, 102, 0.16)',
  errorTagEdge: 'rgba(255, 143, 138, 0.55)',
  /** a name tag with nothing going on */
  quietTagText: '#c3c9d8',
  /** what a visitor of the crew is doing, in a thought bubble above their head (src/room/activity-icons.ts) */
  activity: {
    bubble: '#ffffff', ink: '#1b1f2c', mug: '#e2774a', coffee: '#5a3420', steam: '#a9afc0', water: '#4d9dff', waterLight: '#b9dcff',
    bird: '#4d8dff', beak: '#f4a72a', cover: '#d8454b', pages: '#fbf3df', screen: '#7cc6ff', balloon: '#ff5f7e', shine: '#ffd0da',
  },
  tag: 'rgba(15, 20, 35, 0.8)',
  tagText: '#f4f1e8',
  /** the word the user put on a session, after its name */
  sessionTag: '#9aa8ff',
  /** the little branch after the name of a session on a branch of its own (the page's accent, like its branch pill) */
  branch: '#9aa8ff',
  playerTagText: '#ffd6e2',
  /** an automaton's tag (shared/automata.ts): a teal pill and edge, a little robot before its role, so none passes for a session */
  automatonTag: 'rgba(10, 42, 48, 0.86)',
  automatonTagEdge: '#5fd3c4',
  automatonGlyph: '#5fd3c4',
  /** the hairline around a name tag, like the edge of the glass panels */
  tagEdge: 'rgba(255, 255, 255, 0.18)',
  /** the outline of the door under the pointer */
  doorHover: '#ffffff',
  selection: '#ffffff',
  bubble: '#ffffff',
  bubbleFromUser: '#ffe3ec',
  bubbleInk: '#1b1f2c',
  bubbleShadow: 'rgba(0, 0, 0, 0.35)',
  more: 'rgba(15, 20, 35, 0.78)',
  moreText: '#f4f1e8',
} as const;

/**
 * The cozy rooms (src/room/cozy/): a little room per project, cream walls and honey planks, pastel furniture. Tones go
 * light, base, dark. Hex only: the room's art lights them for the hour and its lamps (cozy/light.ts).
 */
export const COZY_PALETTE = {
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

/**
 * The user's home in the cozy rooms (src/room/cozy/home/), one look per Preferences.homeTheme. Tones go light, base,
 * dark. Each theme's `glow`: what shines by itself (the sky, the screens, the bulbs), never darkened by its light.
 */
export const COZY_HOME_PALETTE = {
  /** the white the light where the user sits is measured on (cozy/home/art.ts) */
  lightProbe: '#ffffff',
  screen: '#141a2c',
  webcam: { body: ['#4a4658', '#36334a', '#28253a'], lens: '#9fb3ff', on: '#7cff9b' },
  /** the team in a video call on the screen: a tile per session, the one speaking framed */
  call: {
    tile: '#2c3658', speaking: '#7cdb8f', eyes: '#2a1c18', mouth: '#c8524f',
    /** the faces when there is no session yet: hair (or hood), top, skin */
    standIns: [['#f07c3c', '#f07c3c', '#fcd5b4'], ['#7cc463', '#7cc463', '#fcd5b4'], ['#f5c85a', '#e4484d', '#fcd5b4'], ['#7a4a2e', '#fbd54a', '#e0a174']],
  },
  steam: ['rgba(255, 255, 255, 0.75)', 'rgba(255, 255, 255, 0.4)'],
  studio: {
    glow: {
      sky: ['#3d3672', '#584383', '#80508d', '#ad5c8b', '#d77080', '#ef9572', '#f7b676'], city: '#33284c', cityWindow: '#ffcd72', sun: '#ffd88e', sunLight: '#ffeec0', star: '#fff3c4',
      led: '#ff2bd7', fan: '#19132e', lamp: ['#fff2cc', '#ffdb8f', '#f2b45e'],
    },
    /** the gaming lights cycling through the colours, at this saturation and lightness (hueColour) */
    rgbStrip: { saturation: 95, lightness: 64 }, rgbFans: { saturation: 90, lightness: 62 },
    fanHub: '#3a3058',
    bulbs: ['#ffd36e', '#ff9db8', '#9ff0c9', '#ffb36b', '#c3b2ff'], bulbCore: '#fffbe8',
    planks: ['#d6a06c', '#cc9562', '#ddaa77', '#d29b67'], plankSeam: '#a7724a', plankJoint: '#b68155',
    rug: ['#a87fb6', '#c79bd0', '#e2bde6', '#f0d4f1'], rugDots: '#fbe8fb',
    wall: { left: '#efdbe7', right: '#e2c9da', cap: '#fbeff6', dotLeft: '#f9eaf3', dotRight: '#eed9e7', skirting: '#fff6fa', skirtingTop: '#ffffff', skirtingFoot: '#d9bfd0' },
    window: { frame: '#d9c2d2', pane: '#fffaf6', mullionShade: '#eadbe4', sill: ['#fffaf6', '#eadbe4', '#d7c3d0'], sillEdge: '#ffffff' },
    curtain: ['#fff0d8', '#f8d49e', '#e3ae6e'], curtainTie: '#f7a8bc', rod: '#c99a68', rodLight: '#e5bd8c',
    garland: '#5e4b45', garlandKnot: '#8a6a5a',
    poster: { frame: '#fffaf6', sky: '#2e2d63', planet: '#f7a35c', planetLight: '#ffc27a', ring: '#f2e3ff', stars: '#fff3c4', band: '#f7a8bc' },
    pot: ['#fff1f7', '#f7cfe0', '#e3a9c3'],
    desk: ['#5a5470', '#423d55', '#302c40'], legs: ['#4a4658', '#353244', '#262333'],
    monitor: ['#4c4860', '#38344a', '#28253a'], stand: ['#5a556c', '#433f55', '#312e40'],
    tower: ['#45405a', '#332f45', '#26233a'], towerEdge: '#5a5470',
    keyboard: ['#3c3850', '#2e2b3e', '#24212f'], keycaps: ['#ff9db8', '#ffd36e', '#9ff0c9', '#9fd0ff', '#c3b2ff'], mousePad: '#3a3550', mouse: ['#f4f0fa', '#d8d2e4', '#bdb5cc'],
    tea: { cup: '#ffe4ef', shade: '#f3b6cc', tea: '#c79a7a', pearls: '#4a3028', lid: '#ffffff', straw: '#7cdbe0' },
    nightstand: ['#fff3f8', '#e8d3e0', '#d2b9c9'], lampFoot: '#e0cbb8', lampStem: '#f3e6d8',
    bed: { wood: ['#dcaa7a', '#c08b5b', '#a06f45'], woodEdge: '#eabd8e', sheet: ['#fffaf4', '#eee2d6', '#d9c8b7'], sheetEdge: '#ffffff', pillow: ['#ffffff', '#ece6f2', '#d6cde0'] },
    quilt: { sides: ['#f7b6c8', '#e89cb2', '#d0839b'], patches: ['#f7b6c8', '#ffe0a3', '#bfe3d0', '#c9b8f0', '#fff3e6'], seam: '#fff6ee', fold: '#fff4f8', seamLeft: '#f3e4dc', seamRight: '#e4d2ca' },
    slippers: '#f7a8bc', slippersLight: '#fde4ec',
    chair: ['#5c566f', '#454058', '#34303f'], chairBase: ['#6e6880', '#555067', '#403b4e'], chairBack: ['#ff9ec6', '#f276a8', '#c9508a'],
    beanBag: ['#a6e3d8', '#62c0b2', '#3a958a'], pad: '#ece8f4', padButtons: ['#f272a6', '#62c0b2'],
  },
  loft: {
    glow: {
      sky: ['#8cc3e8', '#a1cdea', '#b8d8ea', '#cfe0e4', '#e6ddc8', '#f4d4a6'], far: '#a9b9ce', near: '#8698b3', nearWindow: '#dbe6f0', tower: '#6c7c99', glint: '#eaf5fb',
      bulb: ['#fff4cf', '#ffd88a', '#f2b25c'],
    },
    black: ['#4d4d55', '#37373e', '#27272d'], blackEdge: '#5a5a62', oak: ['#e4b67e', '#cf9a5e', '#b07d47'], oakEdge: '#f3cd98',
    planks: ['#9b6c4a', '#8f6243', '#a67552', '#946747'], plankSeam: '#6c4830', plankJoint: '#77503a',
    kilim: { edge: '#8f3b2e', border: '#c9573f', cream: '#f2e2c4', motif: ['#d9744f', '#f2e2c4', '#3f8f8a', '#f2e2c4', '#e8b04a', '#f2e2c4'], fringe: '#f6ead2' },
    wall: { left: '#b8664a', right: '#d1cbc3', cap: '#e9e4dc', seam: '#bfb8af', hole: '#a39c94', speck: '#cbc5bc', skirting: '#55524d', skirtingTop: '#6e6a64' },
    bricks: ['#b8664a', '#a95b41', '#c27156', '#9e523b'], mortar: '#d8c6b2',
    window: { frame: '#26262b', sill: ['#e4ded5', '#c9c2b8', '#b0a99f'], sillEdge: '#f2ede6' },
    covers: { frame: '#26262b', sun: '#f08a4b', disc: '#f4d35e', stripes: '#3f8f8a', peak: '#f3b0c3', snow: '#ffffff' },
    pot: ['#e7a17a', '#cf7f55', '#a85f3c'],
    shelfInside: '#1d1a19', spines: ['#e4484d', '#f4d35e', '#5b8def', '#efe6d6', '#3dbb8c', '#f08a4b', '#c792ea', '#2b2b30'],
    speaker: { cone: '#6a6a72', ring: '#1a1a1e', tweeter: '#8a8a94' },
    turntable: ['#e7c08e', '#c99a62', '#a87a46'], turntableEdge: '#f3d3a6',
    record: { vinyl: '#2a2a30', groove: '#3e3e46', label: '#e8584f', spindle: '#f4d35e', arm: '#c9c9d2', armLight: '#e0e0e8', armOutline: '#55555e', glint: '#8a8a96', glintDark: '#5e5e68' },
    sleeves: { orange: ['#f08a4b', '#e07040', '#c75a30'], hole: '#26262b', teal: ['#5fb7b0', '#3f8f8a', '#2f716d'], lines: '#f4d35e' },
    couch: ['#e3a271', '#c47c47', '#9c5a31'], couchEdge: '#efb586', cushion: ['#eeb486', '#d08b58', '#ab693d'], cushionEdge: '#f6c49a', tufts: '#8f4f28',
    pillows: [['#f6d06a', '#e2b440'], ['#7fc8c0', '#58a8a0']],
    tableBooks: { teal: '#3f8f8a', yellow: '#f4d35e', shade: '#2f716d' }, tablePlant: { pot: '#efe6d6', leaves: '#62b24d', light: '#9be27a' },
    mug: { body: '#ffffff', shade: '#d8d2c6', coffee: '#6b4a33' },
    keyboard: ['#f2eee6', '#d8d2c6', '#c4bdaf'], keys: '#cfc8ba', pad: ['#3f8f8a', '#2f716d', '#245854'], padEdge: '#5fb7b0',
    lamp: '#3a3a40', lampShade: '#2d2d33', lampShine: '#55555e',
    chair: ['#d89a66', '#bd7c47', '#965b30'],
    cord: '#2a2a2e', socket: '#9a7a44', socketLight: '#c9a35e',
    dust: ['rgba(255, 244, 214, 0.85)', 'rgba(255, 244, 214, 0.4)'],
  },
  chalet: {
    glow: {
      night: ['#141b38', '#1a2346', '#212c54', '#283563', '#304072'], pine: '#1b2a42', pineLight: '#223350', snow: '#e3ebf7', snowShade: '#b9c9e0',
      moon: '#f6f1d6', moonShade: '#e0dcc0', star: '#e9eefc', ember: '#ff8a3c', lampGlow: '#fff0b8', candle: ['#fff6c8', '#ffb347'],
    },
    fireBack: '#1c110d', flames: ['#fff3b0', '#ffc04d', '#ff7a2f', '#d9442b'], spark: '#ffb347', snowflakes: ['#ffffff', '#cfdcf0'],
    stone: ['#b9b3aa', '#a39d94', '#8d877e'], stoneJoint: '#6f6a63', wood: ['#b07a48', '#97653a', '#7a502c'], woodEdge: '#c48a56', darkWood: ['#8a5a34', '#6e4526', '#55341c'], darkWoodEdge: '#a06c42',
    tartan: { light: '#f4e6c8', stripe: '#e3cfa8', line: '#7a2a26', red: '#bf463c' },
    planks: ['#c08a56', '#b5804e', '#c9935f', '#ba8551'], plankSeam: '#87562f', plankJoint: '#97623a',
    rug: { edge: '#8e3a33', rings: ['#b5473f', '#ead9b8', '#5f8a5a', '#d98b4a', '#ead9b8', '#b5473f'], dots: '#f3e6cc' },
    wall: { left: '#c4894f', right: '#b47c46', cap: '#d9a46e', logsLeft: ['#c98f58', '#c08650', '#cf975f'], logsRight: ['#b9814b', '#b07844', '#bf8851'], gap: '#5e3820', knot: '#6e4426', knotRing: '#8f5a33' },
    cuckoo: { frame: '#6e4426', body: '#a8703f', roofEdge: '#5e3820', roof: '#7a4a2a', face: '#f6eedc', door: '#3a2414', chain: '#c9a24a', bob: '#e8c46a' },
    picture: { frame: '#6e4426', sky: '#bcd7ea', meadow: '#5f8a5a', snow: '#ffffff', mountain: '#8a9ab8', snowFar: '#f4f6fa', mountainFar: '#a6b3cc' },
    window: { frame: '#5e3820', bars: '#8f5a34' },
    basket: ['#d9b07a', '#bf9058', '#9e7240'], basketEdge: '#e8c494', weave: '#a37a48', weaveLight: '#c49a62', logBark: '#7a4a2a', logEnd: '#d8ac78', logRing: '#a87a4a',
    hearth: ['#a8a198', '#8f8880', '#78726a'], hearthEdge: '#bdb7ae', fireRim: '#3a2a22', logTop: '#8a5a34', logInside: '#6b4226', logLow: '#5a3620', logEndLow: '#c79a6a',
    garland: { berry: '#e0473d', leaf: '#3f7a3a', leafLight: '#5f9a4a' }, stockings: ['#d9463b', '#4f8a4a'], cuff: '#e4dccb', cuffLight: '#fbf7ee',
    candle: '#f6eedc', candleShade: '#ddd2bc', wick: '#3a2a22',
    armchair: ['#86b07c', '#5f8d5a', '#456d43'], armchairEdge: '#9cc493', seat: ['#9cc493', '#74a26e', '#57854f'], seatEdge: '#acd2a2',
    chest: { band: '#5e3820', iron: '#4a4a52', lock: '#e0b050' }, blanket: ['#bf463c', '#a83a32', '#8a2e28'],
    skis: [['#e8584f', '#c94238', '#a8322a'], ['#5b8def', '#4470c8', '#3458a8']], skiBand: '#ffffff',
    monitor: ['#4a4440', '#36312d', '#272320'], stand: ['#5a524c', '#433c37', '#302a26'], keyboard: ['#f2eee6', '#d8d2c6', '#c4bdaf'], keys: '#cfc8ba',
    lamp: { brass: '#c9a24a', brassLight: '#e8c46a', shade: '#2f7a4a', shadeLight: '#4fae6e', shine: '#9be2b4' },
    cocoa: { mug: '#d9534f', shade: '#b03d3a', cocoa: '#7a4a2e', marshmallow: '#ffffff', glint: '#ffd2cc' },
    chair: ['#c48a56', '#a8703f', '#8a5a34'],
  },
  japonais: {
    glow: {
      sky: ['#9fd2f0', '#b0daf2', '#c3e3f4', '#d6ecf6'], fuji: '#8ea6c9', fujiSnow: '#f4f8fc', branch: '#6e4a3c', blossom: ['#fde3ec', '#f9c6d8', '#f4a6c2', '#e584aa'],
      paper: '#fbf5e8', andon: ['#fff3d4', '#ffe3a8', '#f6cf8a'], lantern: ['#ffe0a6', '#f7b968', '#e0903e'], hills: '#b9d6a8',
    },
    kumiko: '#b08657', wood: ['#a87a50', '#8a603c', '#6e4a2c'], woodEdge: '#c08a5a', silver: ['#e6e9ef', '#c8ccd5', '#a9aeba'], silverEdge: '#f2f4f8',
    tatami: { border: '#b3a56a', edge: '#3f4a38', edgeDot: '#7d8a6a', weave: '#c8bd80', light: '#dbd39a', base: '#d2c98d' },
    wall: { left: '#f1e8d6', right: '#e7ddc8', cap: '#f6efe2' },
    alcove: '#e1d4bb', scroll: { mount: '#5f6f8f', paper: '#f6efdc', rod: '#3a2a22', sun: '#e0574f', ink: '#3a3a40', inkLight: '#8a8a90' },
    dais: ['#6b4a34', '#553a28', '#43301f'], daisEdge: '#8a6448',
    bonsai: { pot: '#4d6b8a', potLight: '#7a9ab8', potShade: '#3b556f', feet: '#2f4459', trunk: '#7a5238', trunkShade: '#5e3e2a', leaves: ['#8fcf6e', '#5f9a4a', '#3f7a3a'] },
    fusuma: { frame: '#4a3a30', waves: '#9fbad0', gold: '#e6cc8a', paper: '#efe2c2', pull: '#3a2c24' },
    shoji: '#7a5436',
    futon: ['#5a76ad', '#3f5a8f', '#2f4474'], futonEdge: '#6f8cc4', futonDots: '#e8eef8',
    board: ['#d6a46c', '#b98650', '#9a6c3e'], boardEdge: '#e8bb84', laptopKeys: '#9aa0ac', laptopPad: '#d6dae2',
    mikan: { plate: '#e8eef8', band: '#5a76ad', fruit: '#f39a2b', light: '#ffc062', leaf: '#5a8a3a' },
    teapot: { body: '#3a3a42', light: '#5a5a66', lid: '#2a2a30' }, cup: { body: '#efe3c6', shade: '#cdbd98', tea: '#8fae6a' },
    zabuton: ['#e8806a', '#c95a45', '#a04436'], zabutonEdge: '#f39a84', tassel: '#f5c04a', tasselShade: '#d99a2a',
    lanternCord: '#3a2a22', lanternCaps: '#2a2220', lanternMark: '#d0443a',
  },
} as const;

/** A colour of the rainbow, `hue` in degrees: the cozy home's gaming lights. */
export const hueColour = (hue: number, { saturation, lightness }: { saturation: number; lightness: number }) => `hsl(${((hue % 360) + 360) % 360}, ${saturation}%, ${lightness}%)`;

/** A colour made darker (factor below 1) or lighter (above 1). */
export function shade(hex: string, factor: number): string {
  const value = parseInt(hex.slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) =>
    Math.round(factor > 1 ? channel + (255 - channel) * (factor - 1) : channel * factor));
  return `rgb(${channels.join(',')})`;
}
