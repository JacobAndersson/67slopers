import { Pressable, View } from 'react-native';

import { FEEL_ICONS } from '@/components/feel';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatTime } from '@/lib/dates';
import type { Session } from '@/lib/store/types';
import { setsLine, summaryLine } from '@/lib/workout-summary';

type SessionRowProps = {
  session: Session;
  onPress?: () => void;
};

/** One completed session, as listed under the week strip. */
export function SessionRow({ session, onPress }: SessionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      className="flex-row items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 active:bg-accent">
      <View className="flex-1 gap-0.5">
        <Text className="font-semibold">{session.workoutName}</Text>
        <Text variant="muted">{summaryLine(session.snapshot)}</Text>
      </View>
      {session.feel ? <Icon as={FEEL_ICONS[session.feel]} className="size-6" /> : null}
      <View className="items-end gap-0.5">
        <Text variant="small">{formatTime(session.completedAt)}</Text>
        <Text variant="muted" className={session.completed ? undefined : 'text-destructive'}>
          {setsLine(session.completedSets, session.totalSets)}
        </Text>
      </View>
    </Pressable>
  );
}
