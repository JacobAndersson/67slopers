/** The hold layouts Moon has published benchmark lists for. */
export type LayoutId = '2016' | '2017' | '2019' | 'mini2020';
export type Angle = 25 | 40;
/** One list of problems: a layout at an angle. */
export type BoardKey = `${LayoutId}-${Angle}`;

/** The climber's wall: which layout, how steep, and which hold sets are bolted on. */
export type MoonSetup = {
  layout: LayoutId;
  angle: Angle;
  /** Ids from `HOLD_SETS`. A problem is climbable when every set it needs is here. */
  holdSets: number[];
};

export type Role = 'start' | 'hold' | 'finish';
export const ROLES: Role[] = ['start', 'hold', 'finish'];

/** Holds as grid references, column letter A-K then row from the bottom, e.g. "E6". */
export type ProblemHolds = Record<Role, string[]>;

export type Problem = ProblemHolds & {
  /** `b<number>` for a benchmark, `c<id>` for one set in the app. */
  id: string;
  name: string;
  setter: string;
  /** Index into `GRADES`; absent on an own problem left open. */
  grade?: number;
  /** Community figures from the benchmark list; absent on own problems. */
  sends?: number;
  stars?: number;
  tries?: number;
  holdSets: number[];
  custom?: boolean;
};

export type Feet = 'any' | 'follow' | 'footless';

/** A problem set in the app. Stored whole; benchmarks stay in the bundle. */
export type CustomProblem = ProblemHolds & {
  id: string;
  board: BoardKey;
  name: string;
  grade?: number;
  feet: Feet;
  note?: string;
  createdAt: string;
};

export type Felt = 'soft' | 'fair' | 'stiff';

/** One visit to a problem: how many goes, and whether it went. */
export type LogEntry = {
  id: string;
  problemId: string;
  board: BoardKey;
  /** ISO timestamp of the last go. */
  at: string;
  tries: number;
  sent: boolean;
  felt?: Felt;
  /** The climber's own 1-5 rating. */
  stars?: number;
  note?: string;
  /** Set when the entry came from climbing a circuit. */
  circuitId?: string;
  /** The problem as it was, so the log survives a deleted own problem. */
  name: string;
  grade?: number;
};

/** A playlist: problems climbed in order. */
export type Circuit = {
  id: string;
  board: BoardKey;
  name: string;
  problemIds: string[];
  createdAt: string;
};

/** The LED kit on one wall, and how its strip turned out to be wired. */
export type WallLights = {
  deviceId?: string;
  deviceName?: string;
  /** Also light the LED above each hold (`~D*`, LED kit V2 and newer). */
  above: boolean;
  /** Corrections for a strip that was wired the other way round. */
  mirror: boolean;
  reverse: boolean;
};

/** The current wall's lights, with the two preferences that apply to every wall. */
export type LightsSettings = WallLights & {
  autoConnect: boolean;
  /** Relight the wall while swiping through problems. Off: only on "Light up". */
  browse: boolean;
};

export const DEFAULT_WALL_LIGHTS: WallLights = { above: false, mirror: false, reverse: false };

export const DEFAULT_LIGHTS: LightsSettings = {
  ...DEFAULT_WALL_LIGHTS,
  autoConnect: true,
  browse: false,
};
