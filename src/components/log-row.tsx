import { DotsNineIcon } from 'phosphor-react-native/src/icons/DotsNine';
import { TimerIcon } from 'phosphor-react-native/src/icons/Timer';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatTime, relativeDay } from '@/lib/dates';
import { gradeLabel, type GradeScale } from '@/lib/moonboard/grades';
import type { LogItem } from '@/lib/training-log';
import { cn } from '@/lib/utils';
import { setsLine, summaryLine } from '@/lib/workout-summary';

type LogRowProps = {
  item: LogItem;
  scale: GradeScale;
  /** "Today" / "3 days ago", or the clock time for a list within one day. */
  dateStyle?: 'relative' | 'time';
  onPress?: () => void;
};

/** One session of either kind: a timer workout or time on the board. */
export function LogRow({ item, scale, dateStyle = 'relative', onPress }: LogRowProps) {
  const climb = item.kind === 'climb';
  const problems = climb ? new Set(item.session.entries.map((e) => e.problemId)).size : 0;
  const title = climb ? 'MoonBoard session' : item.session.workoutName;
  const detail = climb
    ? `${problems} ${problems === 1 ? 'problem' : 'problems'}${
        item.session.hardest !== undefined
          ? ` · hardest ${gradeLabel(item.session.hardest, scale)}`
          : ''
      }`
    : summaryLine(item.session.snapshot);
  const result = climb
    ? `${item.session.sends} ${item.session.sends === 1 ? 'send' : 'sends'}`
    : setsLine(item.session.completedSets, item.session.totalSets);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      className="flex-row items-center gap-3 border-b border-border py-3 active:bg-accent">
      <View
        className={cn(
          'size-10 items-center justify-center rounded-xl',
          climb ? 'bg-muted' : 'bg-secondary'
        )}>
        <Icon as={climb ? DotsNineIcon : TimerIcon} size={22} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-semibold" numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-xs text-muted-foreground font-medium" numberOfLines={1}>
          {detail}
        </Text>
      </View>
      <View className="items-end gap-0.5">
        <Text className="text-xs font-medium">
          {dateStyle === 'time' ? formatTime(item.at) : relativeDay(item.at)}
        </Text>
        <Text
          variant="muted"
          className={!climb && !item.session.completed ? 'text-destructive' : undefined}>
          {result}
        </Text>
      </View>
    </Pressable>
  );
}
