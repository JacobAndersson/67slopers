import { Component, type ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';

/** Optional media cannot take down the workout if the native decoder/module fails to mount. */
export class BrainrotBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <View className="flex-1 items-center justify-center bg-muted">
        <Text variant="muted">Video unavailable</Text>
      </View>
    ) : (
      this.props.children
    );
  }
}
