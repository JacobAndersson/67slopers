import { useRouter } from 'expo-router';
import { BooksIcon } from 'phosphor-react-native/src/icons/Books';
import { PlayIcon } from 'phosphor-react-native/src/icons/Play';
import { TimerIcon } from 'phosphor-react-native/src/icons/Timer';

import { HomeCard, HomeCardTile } from '@/components/home-card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { relativeDay } from '@/lib/dates';
import { mark } from '@/lib/perf';
import type { Session, Workout } from '@/lib/store/types';
import { estimateDuration } from '@/lib/workout-summary';

/**
 * Home's way back to the hangboard: the workout used last, with a Start that opens the timer
 * already counting down. Tapping the card opens its overview. With no workouts left it points
 * at the classic ones.
 */
export function HangCard({ workout, last }: { workout?: Workout; last?: Session }) {
  const router = useRouter();
  if (!workout) {
    return (
      <HomeCard
        quiet
        label="Hangboard"
        title="No workouts yet"
        detail="Start from a classic protocol"
        leading={
          <HomeCardTile quiet>
            <Icon as={BooksIcon} size={24} className="text-muted-foreground" />
          </HomeCardTile>
        }
        onPress={() => router.push('/presets')}
      />
    );
  }
  const minutes = Math.max(1, Math.round(estimateDuration(workout) / 60));
  return (
    <HomeCard
      label="Hangboard"
      title={workout.name}
      detail={`${minutes} min · ${last ? relativeDay(last.completedAt).toLowerCase() : 'not done yet'}`}
      leading={
        <HomeCardTile>
          <Icon as={TimerIcon} size={24} />
        </HomeCardTile>
      }
      onPress={() => router.push(`/workout/${workout.id}`)}
      accessibilityHint="Opens the workout"
      action={
        <Button
          size="icon"
          className="size-11 rounded-xl"
          accessibilityLabel={`Start ${workout.name}`}
          onPress={() => {
            mark('start');
            router.push({
              pathname: '/workout/[id]/run',
              params: { id: workout.id, autostart: '1' },
            });
          }}>
          <Icon as={PlayIcon} weight="bold" className="size-5 text-primary-foreground" />
        </Button>
      }
    />
  );
}
