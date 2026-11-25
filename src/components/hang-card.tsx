import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { PlayIcon } from 'phosphor-react-native/src/icons/Play';

import { useLargeText } from '@/hooks/use-large-text';
import { Card } from '@/components/card';
import { Label } from '@/components/section-header';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { LABEL_DOT, shortDay, workoutMeta } from '@/lib/copy';
import { mark } from '@/lib/perf';
import type { Session, Workout } from '@/lib/store/types';
import { cn } from '@/lib/utils';

/**
 * The first grip's name, loaded after the first frame: naming it needs the board manifests,
 * which stay off Home's launch path (AGENTS.md).
 */
function useFirstGrip(workout: Workout): string | undefined {
  const [grip, setGrip] = useState<{ id: string; name?: string }>();
  useEffect(() => {
    let live = true;
    void import('@/lib/workout-grip').then(({ firstGrip }) => {
      if (live) setGrip({ id: workout.id, name: firstGrip(workout) });
    });
    return () => {
      live = false;
    };
  }, [workout]);
  return grip?.id === workout.id ? grip.name : undefined;
}

/**
 * Home's way back to the hangboard (design: home-home, card "last workout"): the workout used
 * last, with Start (the timer opens already counting down) and Details. Solid Start when this
 * card leads, the hairline pill when the board leads.
 */
export function HangCard({
  workout,
  last,
  top,
  first,
}: {
  workout: Workout;
  last?: Session;
  /** This card leads Home: its action is the solid pill. */
  top: boolean;
  /** Nothing trained yet: "Ready to go", a classic to start with. */
  first?: boolean;
}) {
  const router = useRouter();
  // Large text: one full-width Start, Details under it, and the meta without the grip.
  const large = useLargeText();
  const grip = useFirstGrip(workout);
  const tail = large ? undefined : first ? 'a classic to start with' : grip;
  const meta = useMemo(() => workoutMeta(workout, tail), [workout, tail]);
  const eyebrow = last
    ? `Last workout${LABEL_DOT}${shortDay(last.completedAt)}`
    : first
      ? 'Ready to go'
      : 'Your workout';
  return (
    <Card className="gap-0 p-6">
      <Label>{eyebrow}</Label>
      <Text className="type-hero mt-1.5" numberOfLines={1}>
        {workout.name}
      </Text>
      <Text className="type-sub mt-1 text-muted" numberOfLines={1}>
        {meta}
      </Text>
      <View className={large ? 'mt-3 gap-3' : 'mt-3 flex-row gap-3'}>
        <Button
          variant={top ? 'default' : 'outline'}
          className={large ? undefined : 'w-[132px]'}
          accessibilityHint="Opens the timer counting down"
          onPress={() => {
            mark('start');
            router.push({
              pathname: '/workout/[id]/run',
              params: { id: workout.id, autostart: '1' },
            });
          }}>
          <Icon
            as={PlayIcon}
            weight={top ? 'fill' : 'regular'}
            size={20}
            className={cn(top ? 'text-on-action' : 'text-text')}
          />
          <Text>Start</Text>
        </Button>
        <Button
          variant="outline"
          className={large ? undefined : 'w-28'}
          onPress={() => router.push(`/workout/${workout.id}`)}>
          <Text>Details</Text>
        </Button>
      </View>
    </Card>
  );
}
