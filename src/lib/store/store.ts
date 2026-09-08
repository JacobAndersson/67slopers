import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { newId } from './ids';
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
      version: 2,
      // v1 persisted cue settings that no longer exist.
      migrate: (persisted) => {
        const state = { ...(persisted as Record<string, unknown>) };
        delete state.settings;
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
