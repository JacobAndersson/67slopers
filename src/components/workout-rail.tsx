import type { PropsWithChildren } from 'react';
import { ScrollView } from 'react-native';

/** A finite, manually browsed rail. Native scrolling keeps its usual touch behavior. */
export function WorkoutRail({ children }: PropsWithChildren) {
  return (
    <ScrollView
      horizontal
      className="grow-0"
      contentContainerClassName="gap-3"
      showsHorizontalScrollIndicator={false}
      accessibilityLabel="Saved workouts">
      {children}
    </ScrollView>
  );
}
