import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Train</TabButton>
          </TabTrigger>
          <TabTrigger name="workouts" href="/workouts" asChild>
            <TabButton>Workouts</TabButton>
          </TabTrigger>
          <TabTrigger name="history" href="/history" asChild>
            <TabButton>History</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, className, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable
      {...props}
      className={cn(
        'rounded-md px-3 py-1 hover:bg-accent/60 active:opacity-70',
        isFocused && 'bg-accent',
        className
      )}>
      <Text variant="small" className={isFocused ? 'text-foreground' : 'text-muted-foreground'}>
        {children}
      </Text>
    </Pressable>
  );
}

function CustomTabList({ className, ...props }: TabListProps) {
  return (
    <View
      {...props}
      className={cn('absolute w-full flex-row items-center justify-center p-4', className)}>
      <View className="w-full max-w-3xl flex-row items-center gap-2 rounded-xl border border-border bg-card px-6 py-2 shadow-sm shadow-black/5">
        <Text variant="small" className="mr-auto font-semibold">
          Hangboard
        </Text>
        {props.children}
      </View>
    </View>
  );
}
