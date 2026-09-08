import { Pressable, View } from 'react-native';

import { FEEL_ICONS } from '@/components/feel';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatTime, relativeDay } from '@/lib/dates';
import type { Session } from '@/lib/store/types';
import { setsLine, summaryLine } from '@/lib/workout-summary';

type SessionRowProps = {
  session: Session;
  onPress?: () => void;
  /** "Today" / "3 days ago" (lists spanning days) or the clock time (lists within a day). */
  dateStyle?: 'relative' | 'time';
  /** Show the grade icon. Off on the home screen by design. */
  showFeel?: boolean;
};

/** One completed session in a list. */
export function SessionRow({
  session,
  onPress,
  dateStyle = 'relative',
  showFeel = false,
}: SessionRowProps) {
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
      {showFeel && session.feel ? <Icon as={FEEL_ICONS[session.feel]} className="size-6" /> : null}
      <View className="items-end gap-0.5">
        <Text variant="small">
          {dateStyle === 'time'
            ? formatTime(session.completedAt)
            : relativeDay(session.completedAt)}
        </Text>
        <Text variant="muted" className={session.completed ? undefined : 'text-destructive'}>
          {setsLine(session.completedSets, session.totalSets)}
        </Text>
      </View>
    </Pressable>
  );
}
