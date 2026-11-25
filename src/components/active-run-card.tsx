import { useFocusEffect, useRouter } from 'expo-router';
import { PlayIcon } from 'phosphor-react-native/src/icons/Play';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  ReduceMotion,
  useReducedMotion,
} from 'react-native-reanimated';

import { ConfirmSheet } from '@/components/confirm-sheet';
import { SetBars } from '@/components/data-bars';
import { Label } from '@/components/section-header';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { countWord, LABEL_DOT, plural } from '@/lib/copy';
import { timeAgo } from '@/lib/dates';
import { LIFT, REDUCED_FADE_MS, SPRING_SETTLE } from '@/lib/motion';
import { clearActiveRun, loadActiveRun } from '@/lib/store/active-run';
import { useStore } from '@/lib/store/store';
import { sessionFromCheckpoint, type ActiveRun } from '@/lib/timer/checkpoint';
import { expandWorkout } from '@/lib/timer/intervals';

// Rivet's arrival: lift 8 pt on the spring; under reduced motion a 120 ms crossfade instead.
const CARD_ENTER = FadeInDown.springify()
  .stiffness(SPRING_SETTLE.stiffness)
  .damping(SPRING_SETTLE.damping)
  .withInitialValues({ transform: [{ translateY: LIFT }] })
  .reduceMotion(ReduceMotion.Never);
const CARD_ENTER_REDUCED = FadeIn.duration(REDUCED_FADE_MS).reduceMotion(ReduceMotion.Never);
const CARD_EXIT = FadeOut.duration(REDUCED_FADE_MS * 1.5).reduceMotion(ReduceMotion.Never);

/** The checkpointed run, read on focus after the first frame so it never delays startup. */
export function useActiveRun() {
  const [run, setRun] = useState<ActiveRun | null>(null);
  useFocusEffect(
    useCallback(() => {
      let focused = true;
      void loadActiveRun().then((found) => {
        if (!focused) return;
        // Already in history: the app closed between saving the session and clearing this.
        if (found && useStore.getState().sessions.some((s) => s.startedAt === found.startedAt)) {
          void clearActiveRun();
          setRun(null);
          return;
        }
        setRun(found);
      });
      return () => {
        focused = false;
      };
    }, [])
  );
  return [run, setRun] as const;
}

/**
 * A workout that was still going when the app closed (design: home-home-unfinished). Outlined
 * in Ink because it needs an answer: Continue picks it up paused where it stood, Save as ended
 * keeps what was done, Discard drops it after a confirm sheet.
 */
export function ActiveRunCard({ run, onGone }: { run: ActiveRun; onGone: () => void }) {
  const router = useRouter();
  const addSession = useStore((s) => s.addSession);
  const setResume = useStore((s) => s.setResume);
  const [confirm, setConfirm] = useState(false);
  const reduced = useReducedMotion();

  const { interval, done } = useMemo(
    () => ({
      interval: expandWorkout(run.timings)[run.index],
      done: sessionFromCheckpoint(run).completedSets,
    }),
    [run]
  );
  const total = interval?.setCount ?? 0;
  const where =
    interval && interval.phase !== 'done'
      ? `Set ${interval.setIndex + 1} of ${interval.setCount}${
          interval.repCount > 1 ? `, rep ${interval.repIndex + 1}` : ''
        }. `
      : '';
  const kept =
    done === 0
      ? 'Nothing is in yet.'
      : `${countWord(done, true)} ${done === 1 ? 'set is' : 'sets are'} in.`;
  const drop = () => {
    void clearActiveRun();
    setConfirm(false);
    onGone();
  };

  return (
    <Animated.View entering={reduced ? CARD_ENTER_REDUCED : CARD_ENTER} exiting={CARD_EXIT}>
      <View className="rounded-card border-[1.5px] border-text bg-surface p-6">
        <Label>{`Unfinished${LABEL_DOT}stopped ${timeAgo(run.savedAt)}`}</Label>
        <Text className="type-title mt-1.5" numberOfLines={1}>
          {run.name}
        </Text>
        <Text className="type-sub mt-1 text-muted">
          {where}
          {kept}
        </Text>
        {total > 0 ? <SetBars done={done} total={total} height={8} className="mt-3" /> : null}
        <Button
          className="mt-4"
          accessibilityHint="Opens the timer paused where it stopped"
          onPress={() => {
            setResume(run);
            onGone();
            router.push('/workout/run');
          }}>
          <Icon as={PlayIcon} weight="fill" size={20} className="text-on-action" />
          <Text>Continue</Text>
        </Button>
        <View className="mt-2.5 flex-row gap-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 px-2"
            accessibilityHint={`Keeps ${plural(done, 'full set')} in your history`}
            onPress={() => {
              addSession(sessionFromCheckpoint(run));
              void clearActiveRun();
              onGone();
            }}>
            <Text>Save as ended</Text>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 px-2"
            onPress={() => setConfirm(true)}>
            <Icon as={TrashIcon} size={18} />
            <Text>Discard</Text>
          </Button>
        </View>
      </View>
      <ConfirmSheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Discard this run?"
        body="Nothing from it is kept in your history."
        safe={{ label: 'Keep it', onPress: () => setConfirm(false) }}
        destructive={{ label: 'Discard', onPress: drop }}
      />
    </Animated.View>
  );
}
