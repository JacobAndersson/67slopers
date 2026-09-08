import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

export default function TrainScreen() {
  return (
    <Screen title="Train">
      <Text variant="lead">Pick a workout and run a timed hangboard session.</Text>

      <Card>
        <CardHeader>
          <CardTitle>No workout selected</CardTitle>
          <CardDescription>Create a workout in the Workouts tab to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button>
            <Text>Start session</Text>
          </Button>
        </CardContent>
      </Card>
    </Screen>
  );
}
