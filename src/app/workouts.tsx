import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function WorkoutsScreen() {
  return (
    <Screen title="Workouts">
      <Text variant="lead">
        Build and manage hangboard protocols: hangs, rests, sets and grips.
      </Text>
      <Button variant="outline" className="self-start">
        <Text>New workout</Text>
      </Button>
    </Screen>
  );
}
