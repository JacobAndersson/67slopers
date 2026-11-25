/**
 * Rivet colour roles, mirrored in src/global.css (change both together). Use the classes
 * (`bg-canvas`, `bg-surface`, `text-text`, `text-muted`, `border-line`, `bg-action`, ...) unless
 * an inline colour is required: SVG, navigation, animation. Pure data, so tests can import it.
 */
export const LIGHT_THEME = {
  canvas: '#F8F6F3',
  surface: '#FFFFFF',
  raised: '#E4E0DA',
  text: '#141A2E',
  muted: '#6B6E73',
  muted2: '#4A4F5C',
  track: '#E4E0DA',
  bar: '#E4E0DA',
  action: '#141A2E',
  onAction: '#F8F6F3',
  board: '#6E66B2',
  boardSoft: '#DEDBF3',
  dock: '#141A2E',
  dockFg: '#F8F6F3',
  dockDim: '#8C92A6',
  disabledBg: '#E4E0DA',
  disabledFg: '#6B6E73',
  segmentTile: '#FFFFFF',
  menu: '#FFFFFF',
  restRail: '#C3DCE5',
  recoverRail: '#DDECF1',
  heat0: '#F0F7F9',
  heat1: '#DDECF1',
  heat2: '#C3DCE5',
  heat3: '#9CC3D1',
  heat4: '#6C9FB2',
  heat5: '#467B8F',
  heat6: '#2B5161',
  line: 'rgba(20, 26, 46, 0.08)',
  line2: 'rgba(20, 26, 46, 0.16)',
  scrim: 'rgba(20, 26, 46, 0.38)',
  selectedTile: 'rgba(255, 255, 255, 0.12)',
} as const;

export const DARK_THEME = {
  canvas: '#0B0F1C',
  surface: '#141A2E',
  raised: '#2E3650',
  text: '#F8F6F3',
  muted: '#8C92A6',
  muted2: '#A9AEBF',
  track: '#1F2640',
  bar: '#3A4363',
  action: '#F8F6F3',
  onAction: '#141A2E',
  board: '#BDB7E6',
  boardSoft: '#363062',
  dock: '#F8F6F3',
  dockFg: '#141A2E',
  dockDim: '#555D78',
  disabledBg: '#1F2640',
  disabledFg: '#8C92A6',
  segmentTile: '#555D78',
  menu: '#2E3650',
  restRail: '#9CC3D1',
  recoverRail: '#DDECF1',
  heat0: '#1C2440',
  heat1: '#1C3140',
  heat2: '#24485A',
  heat3: '#2B5161',
  heat4: '#467B8F',
  heat5: '#6C9FB2',
  heat6: '#9CC3D1',
  line: 'rgba(255, 255, 255, 0.1)',
  line2: 'rgba(255, 255, 255, 0.2)',
  scrim: 'rgba(0, 0, 0, 0.6)',
  selectedTile: 'rgba(20, 26, 46, 0.1)',
} as const;

export type AppTheme = { [K in keyof typeof LIGHT_THEME]: string };

/** The brand palette (design/rivet/kit/tokens). Same in both modes. */
export const PALETTE = {
  snow: '#F8F6F3',
  paper: '#F2ECE3',
  night: '#141A2E',
  nightDeep: '#0B0F1C',
  glow: '#F28C6E',
  glacier: '#C3DCE5',
  dusk: '#8F88CC',
  granite: '#6B6E73',
  stone: '#E4E0DA',
} as const;

/**
 * The session colours: the whole timer becomes the colour of the moment, in both modes.
 * `ground` fills the screen, `elapsed` (a narrow step deeper, so the ground still reads as its
 * colour at every second; brand review) rises from the bottom as the interval runs, stopping under
 * the header, `edge` is the
 * 3 pt line on top of it, `fg` is the ink on top (design/rivet/app/screens_timer.py).
 */
export const SESSION = {
  ready: { ground: '#E4E0DA', elapsed: '#D7D1C8', edge: '#6B6E73', fg: '#141A2E' },
  hang: { ground: '#F28C6E', elapsed: '#EF724D', edge: '#7E3324', fg: '#141A2E' },
  rest: { ground: '#C3DCE5', elapsed: '#AACDDA', edge: '#467B8F', fg: '#141A2E' },
  recover: { ground: '#DDECF1', elapsed: '#C7E0E8', edge: '#467B8F', fg: '#141A2E' },
  done: { ground: '#141A2E', elapsed: '#141A2E', edge: '#141A2E', fg: '#F8F6F3' },
} as const;

/**
 * MoonBoard LED colours: hardware, not brand. They match the lights on the wall and appear only
 * on the wall drawing and its legend, always paired with a ring weight and a word.
 */
export const WALL = {
  start: '#2E9E6B',
  hold: '#3D6FD6',
  finish: '#D9483B',
  foot: '#E0A030',
} as const;
