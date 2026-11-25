import { MissingScreen } from '@/components/missing-screen';
import { Screen } from '@/components/screen';
import { TopBar } from '@/components/top-bar';
import { HangboardIcon } from '@/components/training-icons';
import { useStore } from '@/lib/store/store';

/**
 * A workout link that leads nowhere (design: share-missing-workout): it was deleted, and the
 * sessions done with it keep their own copy. Before storage is read it says nothing.
 */
export function MissingWorkout() {
  const hydrated = useStore((s) => s.hydrated);
  return hydrated ? (
    <MissingScreen
      icon={HangboardIcon}
      title={'This workout is\nno longer here.'}
      body="It was deleted. Sessions you did with it keep their own copy."
    />
  ) : (
    <Screen header={<TopBar />}>{null}</Screen>
  );
}
