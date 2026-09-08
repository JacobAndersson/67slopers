import * as React from 'react';
// CardContent is the body slot of a Card; shown with its header for context.
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Text } from 'hangboard-ui';

export const WithHeader = () => (
  <Card>
    <CardHeader>
      <CardTitle>Session notes</CardTitle>
      <CardDescription>Repeaters, 20 mm edge</CardDescription>
    </CardHeader>
    <CardContent>
      <Text>Held all six reps on the first four sets.</Text>
      <Text variant="muted">Dropped to five reps on set five.</Text>
    </CardContent>
  </Card>
);

export const ContentOnly = () => (
  <Card>
    <CardContent>
      <Text variant="large">18:42</Text>
      <Text variant="muted">Total time under tension</Text>
    </CardContent>
  </Card>
);
