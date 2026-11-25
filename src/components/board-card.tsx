import { useRouter } from 'expo-router';
import { ArrowRightIcon } from 'phosphor-react-native/src/icons/ArrowRight';
import { LightbulbFilamentIcon } from 'phosphor-react-native/src/icons/LightbulbFilament';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { useLargeText } from '@/hooks/use-large-text';
import { Card } from '@/components/card';
import { ScalePressable } from '@/components/scale-pressable';
import { ProblemThumb } from '@/components/moon-board';
import { Label } from '@/components/section-header';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { DOT, LABEL_DOT, plural, shortDay } from '@/lib/copy';
import { boardKey, getLayout } from '@/lib/moonboard/boards';
import { gradeLabel } from '@/lib/moonboard/grades';
import { light, useLights } from '@/lib/moonboard/lights';
import { lastProblemId, statusByProblem } from '@/lib/moonboard/logbook';
import { displayName } from '@/lib/moonboard/names';
import { findProblem } from '@/lib/moonboard/problems';
import { useClimb } from '@/lib/store/climb';
import { cn } from '@/lib/utils';

/** The board's name as the eyebrow says it: "Masters 2019 · 40°". */
export function boardName(
  setup: { layout: Parameters<typeof getLayout>[0]; angle: number },
  dot = DOT
) {
  return `${getLayout(setup.layout).name}${dot}${setup.angle}°`;
}

/**
 * Home's way back to the wall (design: home-home, card "on the board"): the problem last worked
 * on, one tap from lit. Before a board is set up it asks once ("Got a MoonBoard?") and can be
 * left alone; before anything is logged it does not show.
 */
export function BoardCard({ top }: { top: boolean }) {
  const router = useRouter();
  const setup = useClimb((s) => s.setup);
  const custom = useClimb((s) => s.custom);
  const log = useClimb((s) => s.log);
  const scale = useClimb((s) => s.gradeScale);
  const connected = useLights((s) => s.status === 'connected');
  const large = useLargeText();
  // Home is on the launch path: look up the one problem, never the whole board.
  const last = useMemo(() => {
    if (!setup) return null;
    const board = boardKey(setup);
    const id = lastProblemId(log, board);
    const problem = id ? findProblem(board, custom, id) : undefined;
    if (!problem) return null;
    const status = statusByProblem(log.filter((entry) => entry.problemId === id)).get(problem.id);
    return { problem, rows: getLayout(setup.layout).rows, status };
  }, [setup, custom, log]);

  if (!setup) {
    return (
      <ScalePressable
        onPress={() => router.push('/climb')}
        accessibilityRole="button"
        className="flex-row items-center gap-4 rounded-card border border-line bg-surface p-6">
        <View className="flex-1 gap-2">
          <Label>Got a MoonBoard?</Label>
          <Text className="type-title">Climb problems and{'\n'}circuits on your wall</Text>
        </View>
        {/* Drawn like the ghost icon button; the whole card is the control. */}
        <View className="size-12 items-center justify-center rounded-full border border-line-strong bg-surface">
          <Icon as={ArrowRightIcon} size={22} />
        </View>
      </ScalePressable>
    );
  }
  if (!last) return null;

  const { problem, rows, status } = last;
  const name = displayName(problem.name);
  const open = () => router.push(`/climb/problem/${problem.id}`);
  const meta = [
    gradeLabel(problem.grade, scale),
    status ? (status.sent ? 'sent' : 'project') : null,
    status?.tries ? plural(status.tries, 'try', 'tries') : null,
    status?.lastAt ? shortDay(status.lastAt) : null,
  ]
    .filter(Boolean)
    .join(DOT);
  return (
    <Card className="p-6">
      <Pressable onPress={open} accessibilityRole="button" accessibilityHint="Opens the problem">
        <Label>{`On the board${LABEL_DOT}${boardName(setup, LABEL_DOT)}`}</Label>
        {/* A long name steps down to the section size rather than wrapping at hero size. */}
        <Text
          className={cn('mt-1.5', name.length > 18 ? 'type-title' : 'type-hero')}
          numberOfLines={2}>
          {name}
        </Text>
        <Text className="type-sub mt-1 text-muted" numberOfLines={1}>
          {meta}
        </Text>
      </Pressable>
      <View className="mt-3 flex-row items-end justify-between">
        <Button
          variant={top ? 'default' : 'outline'}
          className={large ? 'flex-1 px-4' : 'w-[156px] px-0'}
          accessibilityHint={connected ? 'Lights the problem on the wall' : 'Opens the problem'}
          onPress={() => {
            if (connected) light(problem, problem.id);
            open();
          }}>
          <Icon
            as={LightbulbFilamentIcon}
            size={20}
            className={cn(top ? 'text-on-action' : 'text-text')}
          />
          <Text>Light it up</Text>
        </Button>
        <View className="-mb-0.5">
          <ProblemThumb holds={problem} rows={rows} height={72} />
        </View>
      </View>
    </Card>
  );
}
