import * as React from 'react';
import { Text } from 'hangboard-ui';

const stack: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 4,
};

export const TypeScale = () => (
  <div style={stack}>
    <Text variant="h1">Repeaters</Text>
    <Text variant="h2">Max hangs</Text>
    <Text variant="h3">Density hangs</Text>
    <Text variant="h4">Warm-up</Text>
  </div>
);

export const BodyAndSupporting = () => (
  <div style={stack}>
    <Text variant="lead">Pick a workout and run a timed hangboard session.</Text>
    <Text>
      Seven seconds on, three seconds off, six reps to a set. Rest three minutes between sets.
    </Text>
    <Text variant="muted">Last completed 2 days ago</Text>
  </div>
);

export const Emphasis = () => (
  <div style={stack}>
    <Text variant="large">20 mm edge</Text>
    <Text variant="small">Half crimp, both hands</Text>
    <Text variant="code">07:00</Text>
  </div>
);

export const Quote = () => (
  <div style={stack}>
    <Text variant="blockquote">
      Hangboarding is not for beginners. Build a base of climbing first.
    </Text>
  </div>
);
