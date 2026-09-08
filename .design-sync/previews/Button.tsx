import * as React from 'react';
import { Button, Text } from 'hangboard-ui';

const row: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: 12,
  flexWrap: 'wrap',
  padding: 4,
};
const col: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 4,
  alignItems: 'flex-start',
};

export const Variants = () => (
  <div style={row}>
    <Button>
      <Text>Start session</Text>
    </Button>
    <Button variant="secondary">
      <Text>Edit workout</Text>
    </Button>
    <Button variant="outline">
      <Text>New workout</Text>
    </Button>
  </div>
);

export const QuietAndDestructive = () => (
  <div style={row}>
    <Button variant="ghost">
      <Text>Skip set</Text>
    </Button>
    <Button variant="link">
      <Text>View history</Text>
    </Button>
    <Button variant="destructive">
      <Text>Delete workout</Text>
    </Button>
  </div>
);

export const Sizes = () => (
  <div style={col}>
    <Button size="sm">
      <Text>Small</Text>
    </Button>
    <Button size="default">
      <Text>Default</Text>
    </Button>
    <Button size="lg">
      <Text>Large</Text>
    </Button>
  </div>
);

export const Disabled = () => (
  <div style={row}>
    <Button disabled>
      <Text>Start session</Text>
    </Button>
    <Button variant="outline" disabled>
      <Text>New workout</Text>
    </Button>
  </div>
);
