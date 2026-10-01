import { useRouter } from 'expo-router';
import { PlayIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatClock, relativeDay } from '@/lib/dates';
import { mark } from '@/lib/perf';
import type { Session, Workout } from '@/lib/store/types';
import { estimateDuration, setsLine, summaryLine } from '@/lib/workout-summary';

/**
 * The workout to do next, the main thing on Home: what it is, how it went last time, and a
 * Start that opens the timer already counting down. Tapping the card opens its overview.
 */
export function WorkoutHero({ workout, last }: { workout: Workout; last?: Session }) {
  const router = useRouter();
  return (
    <Card className="border-0 bg-secondary">
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Opens the workout"
        onPress={() => router.push(`/workout/${workout.id}`)}
        className="gap-3 active:opacity-80">
        <CardHeader>
          <View className="flex-row items-center justify-between gap-2">
            <Text className="font-medium">Next up</Text>
            <Text variant="small">{formatClock(estimateDuration(workout))}</Text>
          </View>
          <CardTitle className="text-4xl font-extrabold">{workout.name}</CardTitle>
          <CardDescription>{summaryLine(workout)}</CardDescription>
        </CardHeader>
        <CardContent>
          <Text variant="muted">
            {last
              ? `Last done ${relativeDay(last.completedAt)} · ${setsLine(last.completedSets, last.totalSets)}`
              : 'Not done yet'}
          </Text>
        </CardContent>
      </Pressable>
      <CardContent>
        <Button
          size="lg"
          accessibilityLabel={`Start ${workout.name}`}
          onPress={() => {
            mark('start');
            router.push({
              pathname: '/workout/[id]/run',
              params: { id: workout.id, autostart: '1' },
            });
          }}>
          <Icon as={PlayIcon} className="size-5 text-primary-foreground" />
          <Text className="text-lg">Start workout</Text>
        </Button>
      </CardContent>
    </Card>
  );
}
