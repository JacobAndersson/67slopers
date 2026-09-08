import * as React from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Text,
} from 'hangboard-ui';

export const WorkoutCard = () => (
  <Card>
    <CardHeader>
      <CardTitle>Repeaters 7:3</CardTitle>
      <CardDescription>6 sets, 6 reps, 7s hang, 3s rest</CardDescription>
    </CardHeader>
    <CardContent>
      <Text variant="muted">20 mm edge, half crimp. Estimated 18 minutes.</Text>
    </CardContent>
    <CardFooter>
      <Button>
        <Text>Start session</Text>
      </Button>
    </CardFooter>
  </Card>
);

export const EmptyState = () => (
  <Card>
    <CardHeader>
      <CardTitle>No workout selected</CardTitle>
      <CardDescription>Create a workout in the Workouts tab to get started.</CardDescription>
    </CardHeader>
    <CardContent>
      <Button variant="outline">
        <Text>New workout</Text>
      </Button>
    </CardContent>
  </Card>
);

export const SessionSummary = () => (
  <Card>
    <CardHeader>
      <CardTitle>Max hangs</CardTitle>
      <CardDescription>Completed today</CardDescription>
    </CardHeader>
    <CardContent>
      <Text variant="small">5 sets of 10s at +12 kg</Text>
      <Text variant="muted">Felt strong on the last two sets.</Text>
    </CardContent>
  </Card>
);
