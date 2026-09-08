import * as React from 'react';
// CardHeader only reads correctly inside a Card, so every cell composes the parent.
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Text } from 'hangboard-ui';

export const TitleAndDescription = () => (
  <Card>
    <CardHeader>
      <CardTitle>Density hangs</CardTitle>
      <CardDescription>4 sets, 30s hang, 2 min rest</CardDescription>
    </CardHeader>
    <CardContent>
      <Text variant="muted">Header groups the title and its supporting line.</Text>
    </CardContent>
  </Card>
);

export const TitleOnly = () => (
  <Card>
    <CardHeader>
      <CardTitle>Warm-up</CardTitle>
    </CardHeader>
    <CardContent>
      <Text variant="muted">A description is optional.</Text>
    </CardContent>
  </Card>
);
