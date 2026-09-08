import * as React from 'react';
// CardTitle is a heading styled for the card surface; shown in its parent.
import { Card, CardContent, CardHeader, CardTitle, Text } from 'hangboard-ui';

export const InCardHeader = () => (
  <Card>
    <CardHeader>
      <CardTitle>Repeaters 7:3</CardTitle>
    </CardHeader>
    <CardContent>
      <Text variant="muted">Renders as a level-3 heading.</Text>
    </CardContent>
  </Card>
);

export const LongTitle = () => (
  <Card>
    <CardHeader>
      <CardTitle>Minimum edge, half crimp progression</CardTitle>
    </CardHeader>
    <CardContent>
      <Text variant="muted">Longer titles wrap inside the card.</Text>
    </CardContent>
  </Card>
);
