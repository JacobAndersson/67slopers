import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { BluetoothIcon } from 'phosphor-react-native/src/icons/Bluetooth';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { ButtonLabel } from '@/components/button-label';
import { CheckBox } from '@/components/check-box';
import { MoonBoard } from '@/components/moon-board';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  LAYOUTS,
  boardKey,
  defaultSetup,
  getHoldSet,
  getLayout,
  normalizeSetup,
} from '@/lib/moonboard/boards';
import {
  benchmarkCount,
  countClimbable,
  countUsing,
  sampleProblem,
} from '@/lib/moonboard/problems';
import type { Angle, MoonSetup } from '@/lib/moonboard/types';
import { useClimb } from '@/lib/store/climb';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';

type StepId = 'layout' | 'angle' | 'holds' | 'lights';

function Progress({ step, total }: { step: number; total: number }) {
  return (
    <View className="gap-3">
      <View className="flex-row gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            className={cn('h-1 flex-1 rounded-full', i < step ? 'bg-foreground' : 'bg-border')}
          />
        ))}
      </View>
      <Text className="text-xs uppercase text-muted-foreground font-medium">
        Step {step} of {total}
      </Text>
    </View>
  );
}

function Choice({
  selected,
  onPress,
  children,
}: {
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      className={cn(
        'rounded-2xl bg-card p-4 active:opacity-80',
        selected ? 'border-2 border-foreground' : 'm-px border border-border'
      )}>
      {children}
    </Pressable>
  );
}

/** The wall seen from the side: floor, kicker, and the board leaning over. */
function Profile({ angle }: { angle: Angle }) {
  const length = 104;
  const rad = (angle * Math.PI) / 180;
  const x = 28 + length * Math.sin(rad);
  const y = 130 - length * Math.cos(rad);
  return (
    <Svg width={125} height={150}>
      <Line x1={0} y1={148} x2={125} y2={148} stroke={THEME.border} strokeWidth={2} />
      <Line x1={28} y1={130} x2={28} y2={y} stroke={THEME.border} strokeWidth={1.5} />
      <Line
        x1={28}
        y1={148}
        x2={28}
        y2={130}
        stroke={THEME.foreground}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Line
        x1={28}
        y1={130}
        x2={x}
        y2={y}
        stroke={THEME.foreground}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </Svg>
  );
}

const SWATCH: Record<string, string> = {
  white: 'bg-card',
  black: 'bg-foreground',
  yellow: 'bg-chart-1',
  red: 'bg-hold-finish',
  wood: 'bg-hold-wood',
};

/**
 * Three questions about the wall: which board, how steep, which hold sets. Then whether it
 * has lights. Nothing is saved until the last answer. It also edits the current board, and
 * with `?add=1` sets up another one.
 */
export default function SetupScreen() {
  const router = useRouter();
  // `?add=1` sets up one more wall instead of changing the current one.
  const { add } = useLocalSearchParams<{ add?: string }>();
  const current = useClimb((s) => s.setup);
  const addBoard = useClimb((s) => s.addBoard);
  const saved = add ? undefined : current;
  const setSetup = useClimb((s) => s.setSetup);
  const [draft, setDraft] = useState<MoonSetup>(() => saved ?? defaultSetup('2019'));
  const [step, setStep] = useState<StepId>('layout');
  const layout = getLayout(draft.layout);
  const board = boardKey(draft);
  // The angle is only a question when the layout was built at two.
  const steps = useMemo<StepId[]>(
    () => (layout.angles.length > 1 ? ['layout', 'angle', 'holds'] : ['layout', 'holds']),
    [layout]
  );
  const position = steps.indexOf(step);
  const fitting = useMemo(() => countClimbable(board, draft.holdSets), [board, draft.holdSets]);

  const next = () => {
    if (position < steps.length - 1) return setStep(steps[position + 1]);
    if (add) addBoard(draft);
    else setSetup(draft);
    if (saved || add) router.back();
    else setStep('lights');
  };

  if (step === 'lights') {
    return (
      <>
        <Stack.Screen options={{ title: '', headerBackVisible: false }} />
        <Screen
          footer={
            <View className="gap-2">
              <Button size="lg" onPress={() => router.replace('/climb/connect')}>
                <Icon as={BluetoothIcon} className="size-5 text-primary-foreground" />
                <ButtonLabel>Connect lights</ButtonLabel>
              </Button>
              <Button variant="ghost" onPress={() => router.back()}>
                <Text>Not now</Text>
              </Button>
            </View>
          }>
          <View className="items-center gap-4 pt-2">
            <MoonBoard
              width={170}
              rows={layout.rows}
              holds={sampleProblem(board)}
              labels={false}
              lit
            />
            <Text className="text-center text-2xl font-bold">Got lights on it?</Text>
            <Text variant="muted" className="max-w-xs text-center">
              With the MoonBoard LED kit, the app shows every problem on the wall itself. You can
              connect later from the Climb tab.
            </Text>
          </View>
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: saved ? 'Your MoonBoard' : 'Set up board' }} />
      <Screen
        footer={
          <View className="gap-2">
            {step === 'holds' ? (
              <Text className="text-center text-sm font-medium">
                {fitting} of {benchmarkCount(board)} benchmarks fit your holds
              </Text>
            ) : null}
            <View className="flex-row gap-3">
              {position > 0 ? (
                <Button variant="outline" size="lg" onPress={() => setStep(steps[position - 1])}>
                  <ButtonLabel>Back</ButtonLabel>
                </Button>
              ) : null}
              <Button
                size="lg"
                className="flex-1"
                disabled={step === 'holds' && draft.holdSets.length === 0}
                onPress={next}>
                <ButtonLabel>
                  {position < steps.length - 1 ? 'Continue' : saved ? 'Save' : 'Finish setup'}
                </ButtonLabel>
              </Button>
            </View>
          </View>
        }>
        <Progress step={position + 1} total={steps.length} />

        {step === 'layout' ? (
          <>
            <Text className="text-2xl font-bold">Which MoonBoard is on your wall?</Text>
            <View accessibilityRole="radiogroup" className="gap-3">
              {LAYOUTS.map((option) => {
                const total = option.angles.reduce(
                  (n, angle) => n + benchmarkCount(boardKey({ layout: option.id, angle })),
                  0
                );
                const on = option.id === draft.layout;
                return (
                  <Choice
                    key={option.id}
                    selected={on}
                    onPress={() =>
                      setDraft(normalizeSetup({ ...defaultSetup(option.id), angle: draft.angle }))
                    }>
                    <View className="flex-row items-center gap-4">
                      <View className="h-16 w-11 justify-end rounded-lg border border-border bg-background p-1">
                        <Svg
                          width={36}
                          height={(option.rows / 18) * 56}
                          viewBox={`0 0 11 ${option.rows}`}>
                          {Array.from({ length: 11 * option.rows }, (_, i) => (
                            <Circle
                              key={i}
                              cx={(i % 11) + 0.5}
                              cy={Math.floor(i / 11) + 0.5}
                              r={0.28}
                              fill={THEME.input}
                            />
                          ))}
                        </Svg>
                      </View>
                      <View className="flex-1 gap-0.5">
                        <Text className="font-semibold">{option.name}</Text>
                        <Text variant="muted">
                          11 × {option.rows} · {option.angles.map((a) => `${a}°`).join(' or ')}
                        </Text>
                        <Text className="text-xs text-muted-foreground font-medium">
                          {total} benchmarks
                        </Text>
                      </View>
                      {on ? <Icon as={CheckCircleIcon} size={24} weight="fill" /> : null}
                    </View>
                  </Choice>
                );
              })}
            </View>
          </>
        ) : null}

        {step === 'angle' ? (
          <>
            <Text className="text-2xl font-bold">How steep is it?</Text>
            <Text variant="muted">
              {layout.name} is built at two angles. Problems and grades are different on each.
            </Text>
            <View accessibilityRole="radiogroup" className="flex-row gap-3">
              {layout.angles.map((angle) => (
                <View key={angle} className="flex-1">
                  <Choice
                    selected={draft.angle === angle}
                    onPress={() => setDraft({ ...draft, angle })}>
                    <View className="items-center">
                      <Profile angle={angle} />
                    </View>
                    <Text className="pt-3 text-2xl font-bold">{angle}°</Text>
                    <Text className="text-xs text-muted-foreground font-medium">
                      {benchmarkCount(boardKey({ layout: draft.layout, angle }))} benchmarks
                    </Text>
                  </Choice>
                </View>
              ))}
            </View>
            <Text className="text-xs text-muted-foreground font-medium">
              Not sure? Measure from vertical: 40° leans much further over you.
            </Text>
          </>
        ) : null}

        {step === 'holds' ? (
          <>
            <Text className="text-2xl font-bold">Which hold sets are on it?</Text>
            <Text variant="muted">You only see problems you can climb.</Text>
            <View className="rounded-2xl border border-border bg-card px-4">
              {layout.holdSets.map((id, index) => {
                const set = getHoldSet(id);
                const on = draft.holdSets.includes(id);
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    onPress={() =>
                      setDraft({
                        ...draft,
                        holdSets: on
                          ? draft.holdSets.filter((x) => x !== id)
                          : [...draft.holdSets, id],
                      })
                    }
                    className={cn(
                      'min-h-[60px] flex-row items-center gap-3 active:opacity-70',
                      index > 0 && 'border-t border-border'
                    )}>
                    <View
                      className={cn(
                        'size-7 items-center justify-center rounded-full border border-input',
                        SWATCH[set.swatch]
                      )}>
                      {set.swatch === 'wood' ? (
                        <Text className="text-xs font-semibold">{set.name.slice(-1)}</Text>
                      ) : null}
                    </View>
                    <View className="flex-1 gap-0.5">
                      <Text className="font-medium">{set.name}</Text>
                      <Text className="text-xs text-muted-foreground font-medium">
                        {countUsing(board, id)} benchmarks use it
                      </Text>
                    </View>
                    <CheckBox checked={on} />
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}
      </Screen>
    </>
  );
}
