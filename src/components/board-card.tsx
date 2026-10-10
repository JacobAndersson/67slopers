import { useRouter } from 'expo-router';
import { DotsNineIcon } from 'phosphor-react-native/src/icons/DotsNine';
import { LightbulbIcon } from 'phosphor-react-native/src/icons/Lightbulb';
import { useMemo } from 'react';

import { HomeCard, HomeCardTile } from '@/components/home-card';
import { ProblemThumb } from '@/components/moon-board';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { boardKey, getLayout } from '@/lib/moonboard/boards';
import { gradeLabel } from '@/lib/moonboard/grades';
import { light, useLights } from '@/lib/moonboard/lights';
import { lastProblemId, statusByProblem, statusLabel } from '@/lib/moonboard/logbook';
import { findProblem } from '@/lib/moonboard/problems';
import { useClimb } from '@/lib/store/climb';

/**
 * Home's way back to the wall: the problem last worked on, one tap from lit when the lights
 * are connected. Before anything is logged it points at the problems; before a board is set
 * up it is an outline that asks once and can be left alone.
 */
export function BoardCard() {
  const router = useRouter();
  const setup = useClimb((s) => s.setup);
  const custom = useClimb((s) => s.custom);
  const log = useClimb((s) => s.log);
  const scale = useClimb((s) => s.gradeScale);
  const connected = useLights((s) => s.status === 'connected');
  // Home is on the launch path: look up the one problem, never the whole board.
  const last = useMemo(() => {
    if (!setup) return null;
    const board = boardKey(setup);
    const id = lastProblemId(log, board);
    const problem = id ? findProblem(board, custom, id) : undefined;
    if (!problem) return null;
    const status = statusByProblem(log.filter((entry) => entry.problemId === id)).get(problem.id);
    return { problem, rows: getLayout(setup.layout).rows, state: statusLabel(status) };
  }, [setup, custom, log]);

  if (!setup || !last) {
    return (
      <HomeCard
        quiet
        label="MoonBoard"
        title={setup ? 'Pick a problem' : 'Got a MoonBoard?'}
        detail={setup ? getLayout(setup.layout).name : 'Set it up to light problems'}
        leading={
          <HomeCardTile quiet>
            <Icon as={DotsNineIcon} size={24} className="text-muted-foreground" />
          </HomeCardTile>
        }
        onPress={() => router.push(setup ? '/climb' : '/climb/setup')}
      />
    );
  }

  const { problem, rows, state } = last;
  const open = () => router.push(`/climb/problem/${problem.id}`);
  return (
    <HomeCard
      label="MoonBoard"
      title={problem.name}
      detail={[gradeLabel(problem.grade, scale), state?.toLowerCase()].filter(Boolean).join(' · ')}
      leading={<ProblemThumb holds={problem} rows={rows} width={52} />}
      onPress={open}
      accessibilityHint="Opens the problem"
      action={
        connected ? (
          <Button
            variant="secondary"
            size="icon"
            className="size-11 rounded-xl"
            accessibilityLabel={`Light up ${problem.name}`}
            onPress={() => {
              light(problem, problem.id);
              open();
            }}>
            <Icon as={LightbulbIcon} className="size-5" />
          </Button>
        ) : undefined
      }
    />
  );
}
