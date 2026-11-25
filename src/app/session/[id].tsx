import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarXIcon } from 'phosphor-react-native/src/icons/CalendarX';
import { DotsThreeVerticalIcon } from 'phosphor-react-native/src/icons/DotsThreeVertical';
import { PlayIcon } from 'phosphor-react-native/src/icons/Play';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { ConfirmSheet } from '@/components/confirm-sheet';
import { Field } from '@/components/field';
import { IconButton } from '@/components/icon-button';
import { Progress } from '@/components/data-bars';
import { MetricGrid } from '@/components/metric-grid';
import { MissingScreen } from '@/components/missing-screen';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Segmented } from '@/components/segmented';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { DOT } from '@/lib/copy';
import { formatClock, formatTime } from '@/lib/dates';
import { sessionVerdict, setResults } from '@/lib/session-sets';
import { useStore } from '@/lib/store/store';
import { FEELS, FEEL_LABELS, type Session } from '@/lib/store/types';
import { hangOutcomes } from '@/lib/workout-summary';
import { sameTimings } from '@/lib/workout-steps';

/** "Thu, 12 Nov · 09:05". */
function when(iso: string) {
  const date = new Date(iso);
  const day = date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return `${day}${DOT}${formatTime(iso)}`;
}

/** One session (design: log-session, log-session-changed, share-delete-session). */
export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const session = useStore((s) => s.sessions.find((x) => x.id === id));
  const hydrated = useStore((s) => s.hydrated);
  const workout = useStore((s) => s.workouts.find((w) => w.id === session?.workoutId));
  const setDraft = useStore((s) => s.setDraft);
  const updateSession = useStore((s) => s.updateSession);
  const deleteSession = useStore((s) => s.deleteSession);
  const [confirm, setConfirm] = useState(false);

  if (!session) {
    return hydrated ? (
      <MissingScreen
        icon={CalendarXIcon}
        title={'This session is\nno longer here.'}
        body="It was deleted from your history."
      />
    ) : (
      <Screen header={<TopBar />}>{null}</Screen>
    );
  }

  const changed = !!workout && !sameTimings(workout, session.snapshot);
  const again = () => {
    if (workout && !changed) {
      router.push(`/workout/${workout.id}/run`);
    } else {
      // Run exactly what this session ran. It still counts for the workout, if any.
      setDraft({
        name: session.workoutName,
        timings: session.snapshot,
        ...(workout ? { workoutId: workout.id } : {}),
      });
      router.push('/workout/run');
    }
  };

  return (
    <Screen
      header={
        <TopBar
          right={
            <IconButton
              icon={DotsThreeVerticalIcon}
              label="Delete session"
              onPress={() => setConfirm(true)}
            />
          }
        />
      }
      contentClassName="gap-0"
      footer={
        <View className="gap-3">
          {changed ? (
            <Text className="type-caption text-center text-muted">
              This workout has changed since.
            </Text>
          ) : null}
          <Button size="lg" onPress={again}>
            <Icon as={PlayIcon} weight="fill" size={20} className="text-on-action" />
            <Text>Do it again</Text>
          </Button>
          {workout && changed ? (
            <Button
              size="lg"
              variant="outline"
              onPress={() => router.push(`/workout/${workout.id}/run`)}>
              <Text>Run the current version</Text>
            </Button>
          ) : null}
        </View>
      }>
      <Text className="type-sub text-muted">{when(session.startedAt)}</Text>
      <Text selectable className="type-large mt-1" role="heading">
        {session.workoutName}
      </Text>
      <Text className="type-sub mt-1.5 text-muted">
        {sessionVerdict(session.completed, session.totalSets)}
      </Text>

      <Facts session={session} />

      {session.hangs ? (
        <>
          <SectionHeader title="Hangs, as done" className="mt-8" />
          <HangsAsDone session={session} />
        </>
      ) : null}

      <Text className="type-body-b mt-8">How did it feel?</Text>
      <Segmented
        className="mt-3"
        height={64}
        value={session.feel ?? null}
        options={FEELS.map((feel) => ({ value: feel, label: FEEL_LABELS[feel] }))}
        onChange={(feel) =>
          // Tap the chosen one again to clear it.
          updateSession(session.id, { feel: session.feel === feel ? undefined : feel })
        }
      />

      <Text className="type-body-b mt-8">Note</Text>
      <NoteField
        key={session.id}
        value={session.note}
        onSave={(note) => updateSession(session.id, { note })}
      />

      <ConfirmSheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Delete this session?"
        body={'It leaves your history and streak.\nThe workout itself stays.'}
        safe={{ label: 'Keep it', onPress: () => setConfirm(false) }}
        destructive={{
          label: 'Delete session',
          onPress: () => {
            setConfirm(false);
            deleteSession(session.id);
            if (router.canGoBack()) router.back();
            else router.replace('/');
          },
        }}
      />
    </Screen>
  );
}

/** Time, sets, time hanging and full hangs in a 2 × 2 card with hairlines between. */
function Facts({ session }: { session: Session }) {
  const seconds = (Date.parse(session.completedAt) - Date.parse(session.startedAt)) / 1000;
  const outcomes = session.hangs ? hangOutcomes(session.snapshot, session.hangs) : undefined;
  const cells: [string, string][] = [
    ['Time', formatClock(seconds)],
    ['Sets', `${session.completedSets} of ${session.totalSets}`],
    ...(session.hangs && outcomes
      ? ([
          ['Time hanging', formatClock(session.hangs.reduce((n, h) => n + h.actual, 0))],
          ['Full hangs', `${outcomes.done} of ${outcomes.planned}`],
        ] as [string, string][])
      : []),
  ];
  return <MetricGrid className="mt-6" items={cells.map(([label, value]) => ({ label, value }))} />;
}

/** One bar per set: seconds hung against seconds planned, "not run" for sets never reached. */
function HangsAsDone({ session }: { session: Session }) {
  const sets = setResults(session.snapshot, session.hangs);
  return (
    <View className="mt-4 gap-3">
      {sets.map((set, i) => (
        <View
          key={i}
          className="flex-row items-center"
          accessible
          accessibilityLabel={`Set ${i + 1}: ${
            set.ran ? `${set.actual} of ${set.planned} seconds` : 'not run'
          }`}>
          <Text className="type-caption min-w-16 pr-2 text-muted">Set {i + 1}</Text>
          <Progress value={set.actual / set.planned} height={12} className="flex-1" />
          <Text
            className={
              set.ran
                ? 'type-caption min-w-16 pl-2 text-right'
                : 'type-caption min-w-16 pl-2 text-right text-muted'
            }>
            {set.ran ? `${set.actual} / ${set.planned} s` : 'not run'}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** The note saves itself as you type (a moment after the last key) and when you leave. */
function NoteField({
  value,
  onSave,
}: {
  value?: string;
  onSave: (note: string | undefined) => void;
}) {
  const [text, setText] = useState(value ?? '');
  const pending = useRef<string | null>(null);
  const save = useRef(onSave);
  useEffect(() => {
    save.current = onSave;
  });
  const flush = useCallback(() => {
    if (pending.current === null) return;
    save.current(pending.current.trim() || undefined);
    pending.current = null;
  }, []);
  useEffect(() => {
    if (pending.current === null) return;
    const timer = setTimeout(flush, 500);
    return () => clearTimeout(timer);
  }, [text, flush]);
  useEffect(() => flush, [flush]);
  return (
    <Field
      className="mt-2.5"
      multiline
      accessibilityLabel="Note"
      value={text}
      placeholder="Holds, load, or something to remember"
      onChangeText={(next) => {
        pending.current = next;
        setText(next);
      }}
      onBlur={flush}
    />
  );
}
