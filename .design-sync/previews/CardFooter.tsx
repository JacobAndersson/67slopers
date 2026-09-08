import * as React from 'react';
// CardFooter lays its children out in a row; shown as the action slot of a Card.
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

export const SingleAction = () => (
  <Card>
    <CardHeader>
      <CardTitle>Repeaters 7:3</CardTitle>
      <CardDescription>6 sets, 18 minutes</CardDescription>
    </CardHeader>
    <CardFooter>
      <Button>
        <Text>Start session</Text>
      </Button>
    </CardFooter>
  </Card>
);

export const TwoActions = () => (
  <Card>
    <CardHeader>
      <CardTitle>Max hangs</CardTitle>
    </CardHeader>
    <CardContent>
      <Text variant="muted">Last run 4 days ago.</Text>
    </CardContent>
    <CardFooter>
      <Button>
        <Text>Start</Text>
      </Button>
      <Button variant="ghost">
        <Text>Edit</Text>
      </Button>
    </CardFooter>
  </Card>
);
