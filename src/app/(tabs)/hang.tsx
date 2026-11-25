import { useRouter } from 'expo-router';
import { BooksIcon } from 'phosphor-react-native/src/icons/Books';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { useMemo } from 'react';
import { View } from 'react-native';

import { Card, ListRow } from '@/components/card';
import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { Label } from '@/components/section-header';
import { TabHeader } from '@/components/tab-header';
import { HangboardIcon } from '@/components/training-icons';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { WorkoutCard } from '@/components/workout-card';
import { lastSessionForWorkout, sortWorkoutsByLastUsed } from '@/lib/store/selectors';
import { PRESETS } from '@/lib/store/presets';
import { useStore } from '@/lib/store/store';

/**
 * The workout library (design: home-hang, home-hang-empty): every saved workout as a card with
 * its shape and a one-tap Start, the one used last first; the classics below. New workout and
 * the classics are also up by the title.
 */
export default function HangScreen() {
  const router = useRouter();
  const workouts = useStore((s) => s.workouts);
  const sessions = useStore((s) => s.sessions);
  const sorted = useMemo(() => sortWorkoutsByLastUsed(workouts, sessions), [workouts, sessions]);

  return (
    <Screen tab contentClassName="gap-0">
      <TabHeader title="Hang">
        <IconButton
          icon={BooksIcon}
          label="Classic workouts"
          onPress={() => router.push('/presets')}
        />
        <IconButton
          icon={PlusIcon}
          variant="primary"
          label="New workout"
          onPress={() => router.push('/workout/new')}
        />
      </TabHeader>

      {sorted.length > 0 ? (
        <>
          <Label className="mt-6">Your workouts</Label>
          <View className="mt-3 gap-3">
            {sorted.map((workout, index) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                last={lastSessionForWorkout(sessions, workout.id)}
                next={index === 0}
              />
            ))}
          </View>
          <ListRow
            className="mt-5"
            height={76}
            icon={BooksIcon}
            title="Classic workouts"
            sub={`${PRESETS.length} protocols, beginner to advanced`}
            chevron
            onPress={() => router.push('/presets')}
          />
        </>
      ) : (
        <Card className="mt-6 p-6">
          <Icon as={HangboardIcon} size={40} className="mt-1" />
          <Text className="type-title mt-5">No workouts yet</Text>
          <Text className="type-sub mt-2 text-muted">
            Start from a classic protocol, or build{'\n'}your own step by step.
          </Text>
          <Button className="mt-6" onPress={() => router.push('/presets')}>
            <Text>Browse classics</Text>
          </Button>
          <Button variant="outline" className="mt-2.5" onPress={() => router.push('/workout/new')}>
            <Text>Build a workout</Text>
          </Button>
        </Card>
      )}
    </Screen>
  );
}
