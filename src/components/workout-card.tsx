import { useRouter } from 'expo-router';
import { PlayIcon } from 'phosphor-react-native/src/icons/Play';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { WorkoutTimeline } from '@/components/data-bars';
import { IconButton } from '@/components/icon-button';
import { usePressFeedback } from '@/components/scale-pressable';
import { Text } from '@/components/ui/text';
import { shortDay, workoutMeta } from '@/lib/copy';
import { mark } from '@/lib/perf';
import type { Session, Workout } from '@/lib/store/types';
import { workoutShape } from '@/lib/workout-shape';

/**
 * A saved workout in the Hang library (design: home-hang): name, "6 sets · 20:52 · Yesterday",
 * a round Start that opens the timer counting down, and the workout's shape as bars. Tapping
 * the card opens its overview, and the whole card dips under the finger like every other card.
 * The workout up next carries the solid Start.
 */
export function WorkoutCard({
  workout,
  last,
  next,
}: {
  workout: Workout;
  last?: Session;
  /** The workout used last: its Start is the solid pill. */
  next?: boolean;
}) {
  const router = useRouter();
  const shape = useMemo(() => workoutShape(workout), [workout]);
  const meta = useMemo(
    () => workoutMeta(workout, last ? shortDay(last.completedAt) : 'not done yet'),
    [workout, last]
  );
  const press = usePressFeedback();
  return (
    <Animated.View
      className="rounded-card border border-line bg-surface px-6 pb-[26px] pt-5"
      style={press.style}>
      {/* The card opens the overview; Start sits above it as its own button, not inside it. */}
      <Pressable
        onPress={() => router.push(`/workout/${workout.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`${workout.name}, ${meta.replace(/ {2}·  /g, ', ')}`}
        accessibilityHint="Opens the workout"
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        className="absolute inset-0 rounded-card"
      />
      <View className="flex-row items-start gap-3" pointerEvents="box-none">
        <View className="flex-1 pt-0.5" pointerEvents="none">
          <Text className="type-title" numberOfLines={1}>
            {workout.name}
          </Text>
          <Text className="type-sub mt-1.5 text-muted" numberOfLines={1}>
            {meta}
          </Text>
        </View>
        <IconButton
          icon={PlayIcon}
          variant={next ? 'primary' : 'ghost'}
          label={`Start ${workout.name}`}
          accessibilityHint="Opens the timer counting down"
          onPress={() => {
            mark('start');
            router.push({
              pathname: '/workout/[id]/run',
              params: { id: workout.id, autostart: '1' },
            });
          }}
        />
      </View>
      <View pointerEvents="none">
        <WorkoutTimeline pieces={shape} className="mt-7" />
      </View>
    </Animated.View>
  );
}
