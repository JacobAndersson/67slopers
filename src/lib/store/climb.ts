import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { normalizeSetup } from '../moonboard/boards';
import type { CircuitRun } from '../moonboard/circuits';
import { DEFAULT_FILTER, type ProblemFilter } from '../moonboard/filter';
import type { GradeScale } from '../moonboard/grades';
import {
  DEFAULT_LIGHTS,
  DEFAULT_WALL_LIGHTS,
  type Circuit,
  type CustomProblem,
  type LightsSettings,
  type LogEntry,
  type MoonSetup,
  type WallLights,
} from '../moonboard/types';
import { newId } from './ids';

/** A wall that is set up but not the current one, with the lights that belong to it. */
export type ParkedBoard = { setup: MoonSetup; lights: WallLights };

type ClimbState = {
  /** The wall being climbed on; absent until one is set up. */
  setup?: MoonSetup;
  /** Other walls the climber has set up, to switch to. */
  others: ParkedBoard[];
  /** The current wall's LED kit and wiring, plus the two app-wide light preferences. */
  lights: LightsSettings;
  /** Problems set in the app. */
  custom: CustomProblem[];
  /** Every visit to a problem, newest first. */
  log: LogEntry[];
  circuits: Circuit[];
  /** Hearted problem ids. */
  saved: string[];
  gradeScale: GradeScale;
  hydrated: boolean;

  /** Changes the current wall in place. */
  setSetup: (setup: MoonSetup) => void;
  /** Sets up one more wall and switches to it. */
  addBoard: (setup: MoonSetup) => void;
  /** Makes another wall the current one. */
  switchBoard: (index: number) => void;
  /** Takes the current wall out; the next one, if any, becomes current. */
  removeBoard: () => void;
  setLights: (patch: Partial<LightsSettings>) => void;
  setGradeScale: (scale: GradeScale) => void;
  addCustom: (input: Omit<CustomProblem, 'id' | 'createdAt'>) => CustomProblem;
  /** Changes an own problem in place: its holds, name, grade, feet or note. */
  updateCustom: (
    id: string,
    patch: Partial<Omit<CustomProblem, 'id' | 'createdAt' | 'board'>>
  ) => void;
  deleteCustom: (id: string) => void;
  addEntry: (input: Omit<LogEntry, 'id' | 'at'>) => LogEntry;
  deleteEntry: (id: string) => void;
  addCircuit: (input: Pick<Circuit, 'board' | 'name' | 'problemIds'>) => Circuit;
  updateCircuit: (id: string, patch: Partial<Pick<Circuit, 'name' | 'problemIds'>>) => void;
  deleteCircuit: (id: string) => void;
  toggleSaved: (problemId: string) => void;
  finishHydration: () => void;
};

/** The part of the lights that stays with a wall when another becomes current. */
const wallOf = ({ autoConnect, browse, ...wall }: LightsSettings): WallLights => wall;
const withWall = (lights: LightsSettings, wall: WallLights): LightsSettings => ({
  autoConnect: lights.autoConnect,
  browse: lights.browse,
  ...wall,
});
const park = (s: ClimbState): ParkedBoard[] =>
  s.setup ? [{ setup: s.setup, lights: wallOf(s.lights) }] : [];

/**
 * Everything about board climbing that is kept, apart from the timer's store under its own
 * key so the launch path reads nothing it does not need.
 */
export const useClimb = create<ClimbState>()(
  persist(
    (set) => ({
      setup: undefined,
      others: [],
      lights: DEFAULT_LIGHTS,
      custom: [],
      log: [],
      circuits: [],
      saved: [],
      gradeScale: 'font',
      hydrated: false,

      setSetup: (setup) => {
        set({ setup: normalizeSetup(setup) });
        resetFilter();
      },
      addBoard: (setup) => {
        set((s) => ({
          setup: normalizeSetup(setup),
          others: [...park(s), ...s.others],
          lights: withWall(s.lights, DEFAULT_WALL_LIGHTS),
        }));
        resetFilter();
      },
      switchBoard: (index) => {
        set((s) => {
          const next = s.others[index];
          if (!next) return s;
          return {
            setup: next.setup,
            others: [...park(s), ...s.others.filter((_, i) => i !== index)],
            lights: withWall(s.lights, next.lights),
          };
        });
        resetFilter();
      },
      removeBoard: () => {
        set((s) => ({
          setup: s.others[0]?.setup,
          others: s.others.slice(1),
          lights: withWall(s.lights, s.others[0]?.lights ?? DEFAULT_WALL_LIGHTS),
        }));
        resetFilter();
      },
      setLights: (patch) => set((s) => ({ lights: { ...s.lights, ...patch } })),
      setGradeScale: (gradeScale) => set({ gradeScale }),

      addCustom: (input) => {
        const problem: CustomProblem = {
          ...input,
          id: `c${newId()}`,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ custom: [problem, ...s.custom] }));
        return problem;
      },
      updateCustom: (id, patch) =>
        set((s) => ({ custom: s.custom.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      deleteCustom: (id) =>
        set((s) => ({
          custom: s.custom.filter((p) => p.id !== id),
          saved: s.saved.filter((x) => x !== id),
          circuits: s.circuits.map((c) => ({
            ...c,
            problemIds: c.problemIds.filter((x) => x !== id),
          })),
        })),

      addEntry: (input) => {
        const entry: LogEntry = { ...input, id: newId(), at: new Date().toISOString() };
        set((s) => ({ log: [entry, ...s.log] }));
        useClimbSession.getState().setTries(entry.problemId, 0);
        return entry;
      },
      deleteEntry: (id) => set((s) => ({ log: s.log.filter((e) => e.id !== id) })),

      addCircuit: (input) => {
        const circuit: Circuit = { ...input, id: newId(), createdAt: new Date().toISOString() };
        set((s) => ({ circuits: [circuit, ...s.circuits] }));
        return circuit;
      },
      updateCircuit: (id, patch) =>
        set((s) => ({ circuits: s.circuits.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteCircuit: (id) => set((s) => ({ circuits: s.circuits.filter((c) => c.id !== id) })),

      toggleSaved: (problemId) =>
        set((s) => ({
          saved: s.saved.includes(problemId)
            ? s.saved.filter((id) => id !== problemId)
            : [problemId, ...s.saved],
        })),

      finishHydration: () => set({ hydrated: true }),
    }),
    {
      name: 'moonboard',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persisted, current) => {
        const saved = persisted as Partial<ClimbState> | undefined;
        return {
          ...current,
          ...saved,
          others: saved?.others ?? [],
          lights: { ...DEFAULT_LIGHTS, ...saved?.lights },
        };
      },
      partialize: (s) => ({
        setup: s.setup,
        others: s.others,
        lights: s.lights,
        custom: s.custom,
        log: s.log,
        circuits: s.circuits,
        saved: s.saved,
        gradeScale: s.gradeScale,
      }),
      onRehydrateStorage: () => (state) => {
        state?.finishHydration();
      },
    }
  )
);

type ClimbSession = {
  /** The list's filters; they reset with the app, like a search box. */
  filter: ProblemFilter;
  /** Goes counted on a problem but not logged yet, by problem id. */
  tries: Record<string, number>;
  /** The circuit being climbed. */
  run: CircuitRun | null;
  setFilter: (patch: Partial<ProblemFilter>) => void;
  setTries: (problemId: string, tries: number) => void;
  setRun: (run: CircuitRun | null) => void;
};

/**
 * What changes on every keystroke and tap while climbing, and is gone when the app closes.
 * Kept out of the persisted store: that one rewrites its whole blob, log included, on any
 * change.
 */
export const useClimbSession = create<ClimbSession>()((set) => ({
  filter: DEFAULT_FILTER,
  tries: {},
  run: null,
  setFilter: (patch) => set((s) => ({ filter: { ...s.filter, ...patch } })),
  setTries: (problemId, tries) =>
    set((s) => ({ tries: { ...s.tries, [problemId]: Math.max(0, tries) } })),
  setRun: (run) => set({ run }),
}));

const resetFilter = () => useClimbSession.setState({ filter: DEFAULT_FILTER });
