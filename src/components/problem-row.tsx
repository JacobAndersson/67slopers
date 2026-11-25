import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { StarIcon } from 'phosphor-react-native/src/icons/Star';
import { memo } from 'react';
import { View } from 'react-native';

import { ProblemThumb } from '@/components/moon-board';
import { ScalePressable } from '@/components/scale-pressable';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { DOT } from '@/lib/copy';
import { gradeLabel, type GradeScale } from '@/lib/moonboard/grades';
import { statusLabel, type ProblemStatus } from '@/lib/moonboard/logbook';
import { displayName } from '@/lib/moonboard/names';
import type { Problem } from '@/lib/moonboard/types';
import { cn } from '@/lib/utils';

/** "23.9k" above a thousand. */
export function formatSends(sends: number): string {
  return sends >= 1000 ? `${(sends / 1000).toFixed(1)}k` : String(sends);
}

/** The project mark: an open ring, the sent mark's empty twin. */
export function ProjectRing({ size = 12 }: { size?: number }) {
  return (
    <View
      className="rounded-full border-[1.5px] border-text"
      style={{ width: size, height: size, margin: (15 - size) / 2 }}
    />
  );
}

/** "Sent · flash" with a filled check, "Project · 3 tries" with an open ring. */
export function StatusLine({ status, className }: { status?: ProblemStatus; className?: string }) {
  const state = statusLabel(status);
  if (!state) return null;
  return (
    <View className={cn('flex-row items-center gap-[5px]', className)}>
      {status?.sent ? (
        <Icon as={CheckCircleIcon} size={15} weight="fill" className="text-text" />
      ) : (
        <ProjectRing />
      )}
      <Text className="type-caption">{state.replace(' · ', DOT)}</Text>
    </View>
  );
}

type ProblemRowProps = {
  problem: Problem;
  rows: number;
  scale: GradeScale;
  status?: ProblemStatus;
  /** Replaces the status line, for lists that say something else about the problem. */
  detail?: string;
  /** Replaces the grade on the right with a short word ("Flash", "3 tries · no send"). */
  right?: string;
  /** The position in an ordered list, shown before the thumbnail. */
  index?: number;
  /** Called with the row's own problem, so a list can pass one handler to every row. */
  onPress?: (problem: Problem) => void;
};

/**
 * One problem in a list (design/rivet/app/screens_climb.py `problem_row`, 88 pt): the line on
 * the wall as a mini MoonBoard, name, setter and sends, how it went for you, the grade large on
 * the right. A hairline runs under the text.
 */
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
  const setter =
    problem.sends !== undefined
      ? `${problem.setter}${DOT}${formatSends(problem.sends)} sends`
      : problem.setter;
  const grade = gradeLabel(problem.grade, scale);
  const name = displayName(problem.name);
  const spoken = [
    name,
    grade,
    problem.sends !== undefined
      ? `set by ${problem.setter}, ${formatSends(problem.sends)} sends`
      : problem.setter,
    right ??
      detail ??
      statusLabel(status) ??
      (problem.stars !== undefined ? `${problem.stars.toFixed(1)} stars` : null),
  ]
    .filter(Boolean)
    .join(', ');
  return (
    <ScalePressable
      feedback="dim"
      onPress={onPress ? () => onPress(problem) : undefined}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={spoken}
      className="min-h-[88px] flex-row items-center">
      {index !== undefined ? (
        <Text className="type-num w-[30px] text-muted">{index + 1}</Text>
      ) : null}
      <ProblemThumb holds={problem} rows={rows} height={60} />
      <View className="ml-[17px] min-h-[88px] flex-1 flex-row items-center self-stretch border-b border-line py-2">
        <View className="flex-1 gap-[3px]">
          <Text className="type-row" numberOfLines={1}>
            {name}
          </Text>
          <Text className="type-caption text-muted" numberOfLines={1}>
            {right ? `${grade}${DOT}${problem.setter}` : setter}
          </Text>
          {right ? null : detail ? (
            <Text className="type-caption text-muted">{detail}</Text>
          ) : statusLabel(status) ? (
            <StatusLine status={status} />
          ) : problem.stars !== undefined ? (
            <View className="flex-row items-center gap-[5px]">
              <Icon as={StarIcon} size={14} weight="fill" className="text-muted" />
              <Text className="type-caption text-muted">{problem.stars.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
        {right ? (
          <Text
            className="type-caption ml-2 max-w-[130px] text-right font-extrabold"
            numberOfLines={2}>
            {right}
          </Text>
        ) : (
          <Text className="type-num ml-2">{grade}</Text>
        )}
      </View>
    </ScalePressable>
  );
});
