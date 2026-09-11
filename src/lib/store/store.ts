import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { cloneSteps } from '../workout-steps';
import { newId } from './ids';
import { migrateSessionRecord, migrateWorkoutRecord } from './migrate';
import { makePresetWorkouts } from './presets';
import type { Draft, Session, Workout, WorkoutTimings } from './types';

type WorkoutInput = { name: string } & WorkoutTimings;

type StoreState = {
  workouts: Workout[];
  sessions: Session[];
  /** True once presets have been seeded, so deleting them all does not bring them back. */
  seeded: boolean;
  /** True once persisted state has been read from disk (not persisted itself). */
  hydrated: boolean;
  /** An unsaved workout about to run (not persisted). */
  draft: Draft | null;

  addWorkout: (input: WorkoutInput) => Workout;
  updateWorkout: (id: string, patch: Partial<WorkoutInput>) => void;
  deleteWorkout: (id: string) => void;
  /** Copies a workout as a new, non-preset entry named "<name> copy". */
  duplicateWorkout: (id: string) => Workout | undefined;
  addSession: (input: Omit<Session, 'id'>) => Session;
  updateSession: (id: string, patch: Partial<Pick<Session, 'feel'>>) => void;
  deleteSession: (id: string) => void;
  setDraft: (draft: Draft | null) => void;
  finishHydration: () => void;
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      workouts: [],
      sessions: [],
      seeded: false,
      hydrated: false,
      draft: null,

      addWorkout: (input) => {
        const now = new Date().toISOString();
        const workout: Workout = {
          ...input,
          id: newId(),
          isPreset: false,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ workouts: [workout, ...s.workouts] }));
        return workout;
      },

      updateWorkout: (id, patch) =>
        set((s) => ({
          workouts: s.workouts.map((w) =>
            w.id === id ? { ...w, ...patch, updatedAt: new Date().toISOString() } : w
          ),
        })),

      deleteWorkout: (id) => set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) })),

      duplicateWorkout: (id) => {
        const source = get().workouts.find((w) => w.id === id);
        if (!source) return undefined;
        const now = new Date().toISOString();
        const copy: Workout = {
          ...source,
          steps: cloneSteps(source.steps),
          id: newId(),
          name: `${source.name} copy`,
          isPreset: false,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ workouts: [copy, ...s.workouts] }));
        return copy;
      },

      addSession: (input) => {
        const session: Session = { ...input, id: newId() };
        set((s) => ({ sessions: [session, ...s.sessions] }));
        return session;
      },

      updateSession: (id, patch) =>
        set((s) => ({ sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),

      deleteSession: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),

      setDraft: (draft) => set({ draft }),

      finishHydration: () => {
        const { seeded, workouts } = get();
        if (!seeded && workouts.length === 0) {
          set({ workouts: makePresetWorkouts(), seeded: true, hydrated: true });
        } else {
          set({ seeded: true, hydrated: true });
        }
      },
    }),
    {
      name: 'hangboard',
      version: 4,
      migrate: (persisted, version) => {
        const state = { ...(persisted as Record<string, unknown>) };
        // v1 persisted cue settings that no longer exist.
        delete state.settings;
        // v2 stored workouts as prep + blocks; v3 stores steps; v4 dropped repeats' skipLastRest.
        if (version < 4) {
          const records = (key: string) =>
            Array.isArray(state[key]) ? (state[key] as Record<string, unknown>[]) : [];
          state.workouts = records('workouts').map(migrateWorkoutRecord);
          state.sessions = records('sessions').map(migrateSessionRecord);
        }
        return state;
      },
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        workouts: s.workouts,
        sessions: s.sessions,
        seeded: s.seeded,
      }),
      onRehydrateStorage: () => (state) => {
        state?.finishHydration();
      },
    }
  )
);

export const selectWorkout = (id: string) => (s: StoreState) => s.workouts.find((w) => w.id === id);
