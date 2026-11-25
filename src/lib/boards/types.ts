/** A rectangle as fractions of the board's width and height, so it scales with any render. */
export type Fraction = { x: number; y: number; w: number; h: number };

export type HoldSide = 'left' | 'right' | 'center';

export type HoldManifest = {
  id: string;
  /** The layout's display label, e.g. "Medium edge". */
  label: string;
  side: HoldSide;
  /** 1 is the top strip (jugs and slopers), then rows down the board. */
  row: number;
  /** The mirrored hold, or null for a centre hold used by both hands. */
  pair: string | null;
  type: string;
  fingers: number | null;
  /** Community-measured depth in mm, or null for slopers and jugs. */
  depth: number | null;
  angle: number | null;
  box: Fraction;
  /** Where the highlight image sits on the board; the image itself is in `generated/images`. */
  overlay: Fraction;
};

export type BoardManifest = {
  id: string;
  name: string;
  /** Millimetres, for the aspect ratio. */
  width: number;
  height: number;
  holds: HoldManifest[];
};

/**
 * A hangboard as a diagram (scripts/gen-board-diagrams.mjs): every path is in board millimetres,
 * viewBox 0 0 width height.
 */
export type BoardDiagram = {
  width: number;
  height: number;
  /** The board's silhouette. */
  plate: string;
  /** The lower tier's step, a hairline across the board. */
  ledge: { x: number; y: number; w: number } | null;
  /** One shape per hold; `faint` rails sit on a shaped top and get a whisper of fill. */
  holds: { id: string; d: string; faint?: boolean }[];
};
