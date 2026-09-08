import * as React from 'react';
// CardDescription is the muted supporting line under a CardTitle.
import { Card, CardDescription, CardHeader, CardTitle } from 'hangboard-ui';

export const UnderTitle = () => (
  <Card>
    <CardHeader>
      <CardTitle>Max hangs</CardTitle>
      <CardDescription>5 sets, 10s hang, 3 min rest, added weight</CardDescription>
    </CardHeader>
  </Card>
);

export const TwoLines = () => (
  <Card>
    <CardHeader>
      <CardTitle>Repeaters 7:3</CardTitle>
      <CardDescription>
        Six reps to a set on a 20 mm edge. Stop the set if form breaks down or you cannot hold the
        grip for the full seven seconds.
      </CardDescription>
    </CardHeader>
  </Card>
);
