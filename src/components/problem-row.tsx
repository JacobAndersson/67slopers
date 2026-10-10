import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { StarIcon } from 'phosphor-react-native/src/icons/Star';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { ProblemThumb } from '@/components/moon-board';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { gradeAlt, gradeLabel, type GradeScale } from '@/lib/moonboard/grades';
import { statusLabel, type ProblemStatus } from '@/lib/moonboard/logbook';
import type { Problem } from '@/lib/moonboard/types';
import { cn } from '@/lib/utils';

/** "23.9k" above a thousand. */
export function formatSends(sends: number): string {
  return sends >= 1000 ? `${(sends / 1000).toFixed(1)}k` : String(sends);
}

type ProblemRowProps = {
  problem: Problem;
  rows: number;
  scale: GradeScale;
  status?: ProblemStatus;
  /** Replaces the status line, for lists that say something else about the problem. */
  detail?: string;
  /** Replaces the grade on the right. */
  right?: string;
  /** The position in an ordered list, shown before the thumbnail. */
  index?: number;
  /** Called with the row's own problem, so a list can pass one handler to every row. */
  onPress?: (problem: Problem) => void;
};

/** One problem in a list: the line on the wall, who set it, how it went for you, the grade. */
export const ProblemRow = memo(function ProblemRow({
  problem,
  rows,
  scale,
  status,
  detail,
  right,
  index,
  onPress,
}: ProblemRowProps) {
  const state = statusLabel(status);
  return (
    <Pressable
      onPress={onPress ? () => onPress(problem) : undefined}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      className="flex-row items-center gap-3 py-2 active:opacity-70">
      {index !== undefined ? (
        <Text className="w-5 text-sm text-muted-foreground font-semibold">{index + 1}</Text>
      ) : null}
      <ProblemThumb holds={problem} rows={rows} />
      <View className="flex-1 gap-0.5 self-stretch border-b border-border pb-2">
        <View className="flex-row items-start justify-between gap-2">
          <Text className="flex-1 font-semibold" numberOfLines={1}>
            {problem.name}
          </Text>
          {right ? (
            <Text className="text-sm font-medium">{right}</Text>
          ) : (
            <View className="items-end">
              <Text className="text-lg leading-6 font-bold">
                {gradeLabel(problem.grade, scale)}
              </Text>
              <Text className="text-xs text-muted-foreground font-medium">
                {gradeAlt(problem.grade, scale)}
              </Text>
            </View>
          )}
        </View>
        <Text className="text-xs text-muted-foreground font-medium" numberOfLines={1}>
          {problem.sends !== undefined
            ? `${problem.setter} · ${formatSends(problem.sends)} sends`
            : problem.setter}
        </Text>
        {detail ? (
          <Text className="text-xs text-muted-foreground font-medium">{detail}</Text>
        ) : state ? (
          <View className="flex-row items-center gap-1.5">
            {status?.sent ? (
              <Icon as={CheckCircleIcon} size={14} weight="fill" className="text-hold-start" />
            ) : (
              <View className="size-2.5 rounded-full border-2 border-ring" />
            )}
            <Text className={cn('text-xs font-medium', !status?.sent && 'text-ring')}>{state}</Text>
          </View>
        ) : problem.stars !== undefined ? (
          <View className="flex-row items-center gap-1.5">
            <Icon as={StarIcon} size={14} weight="fill" className="text-ring" />
            <Text className="text-xs text-muted-foreground font-medium">
              {problem.stars.toFixed(1)}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});
