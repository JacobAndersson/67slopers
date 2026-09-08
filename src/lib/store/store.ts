import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { newId } from './ids';
import { makePresetWorkouts } from './presets';
import type { Session, Settings, Workout, WorkoutTimings } from './types';

type WorkoutInput = { name: string } & WorkoutTimings;

type StoreState = {
  workouts: Workout[];
  sessions: Session[];
  settings: Settings;
  /** True once presets have been seeded, so deleting them all does not bring them back. */
  seeded: boolean;
  /** True once persisted state has been read from disk (not persisted itself). */
  hydrated: boolean;

  addWorkout: (input: WorkoutInput) => Workout;
  updateWorkout: (id: string, patch: Partial<WorkoutInput>) => void;
  deleteWorkout: (id: string) => void;
  addSession: (input: Omit<Session, 'id'>) => Session;
  setSettings: (patch: Partial<Settings>) => void;
  finishHydration: () => void;
};

const DEFAULT_SETTINGS: Settings = { soundEnabled: true, vibrationEnabled: true };

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      workouts: [],
      sessions: [],
      settings: DEFAULT_SETTINGS,
      seeded: false,
      hydrated: false,

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

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

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
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        workouts: s.workouts,
        sessions: s.sessions,
        settings: s.settings,
        seeded: s.seeded,
      }),
      onRehydrateStorage: () => (state) => {
        state?.finishHydration();
      },
    }
  )
);

export const selectWorkout = (id: string) => (s: StoreState) => s.workouts.find((w) => w.id === id);
