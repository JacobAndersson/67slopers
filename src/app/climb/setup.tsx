import { useLocalSearchParams, useRouter } from 'expo-router';
import { BluetoothIcon } from 'phosphor-react-native/src/icons/Bluetooth';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { CircleIcon } from 'phosphor-react-native/src/icons/Circle';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { CheckBox } from '@/components/check-box';
import { SetBars } from '@/components/data-bars';
import { MoonBoard } from '@/components/moon-board';
import { Screen } from '@/components/screen';
import { Label } from '@/components/section-header';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { DOT } from '@/lib/copy';
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
import { useAppTheme } from '@/lib/use-theme';
import { cn } from '@/lib/utils';

type StepId = 'layout' | 'angle' | 'holds' | 'lights';

function Progress({ step, total }: { step: number; total: number }) {
  return (
    <View className="gap-3">
      <SetBars done={step} total={total} height={8} />
      <Label>
        Step {step} of {total}
      </Label>
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
        'rounded-3xl bg-surface active:opacity-80',
        selected ? 'border-2 border-text' : 'm-px border border-line'
      )}>
      {children}
    </Pressable>
  );
}

/** The wall seen from the side: the floor, a plumb line, and the board leaning over it. */
function Profile({ angle, width }: { angle: Angle; width: number }) {
  const { theme } = useAppTheme();
  const length = 110;
  const rad = (angle * Math.PI) / 180;
  const x0 = 20;
  const y0 = 128;
  return (
    <Svg width={width} height={136}>
      <Line x1={x0} y1={y0} x2={x0} y2={y0 - 120} stroke={theme.line2} strokeWidth={1.5} />
      <Line x1={x0 - 10} y1={y0} x2={width - 50} y2={y0} stroke={theme.muted} strokeWidth={2} />
      <Line
        x1={x0}
        y1={y0}
        x2={x0 + length * Math.sin(rad)}
        y2={y0 - length * Math.cos(rad)}
        stroke={theme.text}
        strokeWidth={6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * The real colours of the hold sets: the one other place, after the wall's LEDs, where colours
 * outside the palette appear (design/rivet/app/README.md).
 */
const SWATCH: Record<number, string> = {
  0: '#FFFFFF',
  1: '#141A2E',
  2: '#E9C64A',
  3: '#D9483B',
  4: '#C9A27A',
  5: '#B48B5E',
  6: '#9C7447',
};

/**
 * Three questions about the wall: which board, how steep, which hold sets. Then whether it
 * has lights. Nothing is saved until the last answer. It also edits the current board, and
 * with `?add=1` sets up another one.
 */
export default function SetupScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  // `?add=1` sets up one more wall instead of changing the current one.
  const params = useLocalSearchParams<{ add?: string; layout?: string; angle?: string }>();
  const { add } = params;
  const current = useClimb((s) => s.setup);
  const addBoard = useClimb((s) => s.addBoard);
  const saved = add ? undefined : current;
  const setSetup = useClimb((s) => s.setSetup);
  // A shared problem for another board opens this with that board's layout and angle.
  const [draft, setDraft] = useState<MoonSetup>(() => {
    if (saved) return saved;
    const layout = LAYOUTS.find((l) => l.id === params.layout)?.id ?? '2019';
    const angle = Number(params.angle);
    return normalizeSetup({
      ...defaultSetup(layout),
      ...(angle === 25 || angle === 40 ? { angle } : {}),
    });
  });
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
      <Screen header={<TopBar left={null} />} scroll={false} contentClassName="gap-0 pt-0">
        <MoonBoard
          width={222}
          rows={layout.rows}
          holds={sampleProblem(board)}
          labels={false}
          radius={20}
        />
        <Text className="type-hero mt-10">Got lights on it?</Text>
        <Text className="type-body mt-3 text-muted">
          With the MoonBoard LED kit, every problem shows on the wall itself. You can connect later
          from Climb.
        </Text>
        <View className="flex-1" />
        <Button size="lg" onPress={() => router.replace('/climb/connect')}>
          <Icon as={BluetoothIcon} size={20} className="text-on-action" />
          <Text>Connect lights</Text>
        </Button>
        <Button variant="ghost" className="mt-3" onPress={() => router.back()}>
          <Text>Not now</Text>
        </Button>
      </Screen>
    );
  }

  return (
    <Screen
      header={
        <TopBar
          left={position > 0 ? 'back' : 'close'}
          onLeft={position > 0 ? () => setStep(steps[position - 1]) : undefined}
          title="Set up board"
        />
      }
      contentClassName="gap-0 pt-4"
      footer={
        <View className="gap-3">
          {step === 'holds' ? (
            <Text className="type-caption text-center text-muted">
              {fitting} of {benchmarkCount(board)} benchmarks fit your holds
            </Text>
          ) : null}
          <View className="flex-row gap-3">
            {position > 0 ? (
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onPress={() => setStep(steps[position - 1])}>
                <Text>Back</Text>
              </Button>
            ) : null}
            <Button
              size="lg"
              className="flex-1 px-0"
              disabled={step === 'holds' && draft.holdSets.length === 0}
              onPress={next}>
              <Text>
                {position < steps.length - 1 ? 'Continue' : saved ? 'Save' : 'Finish setup'}
              </Text>
            </Button>
          </View>
        </View>
      }>
      <Progress step={position + 1} total={steps.length} />

      {step === 'layout' ? (
        <>
          <Text className="type-hero mt-4">Which MoonBoard is{'\n'}on your wall?</Text>
          <View accessibilityRole="radiogroup" className="mt-5 gap-3">
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
                  <View className="h-[90px] flex-row items-center pl-5 pr-4">
                    <Svg width={34} height={48}>
                      {Array.from({ length: 20 }, (_, i) => (
                        <Circle
                          key={i}
                          cx={2 + (i % 4) * 9}
                          cy={2 + Math.floor(i / 4) * 10}
                          r={2}
                          fill={theme.muted}
                        />
                      ))}
                    </Svg>
                    <View className="ml-5 flex-1 gap-0.5">
                      <Text className="type-row">{option.name}</Text>
                      <Text className="type-caption text-muted">
                        {`11 × ${option.rows}${DOT}${option.angles.map((a) => `${a}°`).join(' or ')}`}
                      </Text>
                      <Text className="type-caption">{total} benchmarks</Text>
                    </View>
                    <Icon
                      as={on ? CheckCircleIcon : CircleIcon}
                      size={24}
                      weight={on ? 'fill' : 'regular'}
                      className={on ? 'text-text' : 'text-line-strong'}
                    />
                  </View>
                </Choice>
              );
            })}
          </View>
        </>
      ) : null}

      {step === 'angle' ? (
        <>
          <Text className="type-hero mt-4">How steep is it?</Text>
          <Text className="type-sub mt-2 text-muted">
            {layout.name} is built at two angles. Problems and grades differ on each.
          </Text>
          <View accessibilityRole="radiogroup" className="mt-6 flex-row gap-3">
            {layout.angles.map((angle) => (
              <View key={angle} className="flex-1">
                <Choice
                  selected={draft.angle === angle}
                  onPress={() => setDraft({ ...draft, angle })}>
                  <View className="h-[226px] justify-between p-5">
                    <Text className="type-bignum">{angle}°</Text>
                    <View className="-mx-5">
                      <Profile angle={angle} width={150} />
                    </View>
                    <Text className="type-caption text-muted">
                      {benchmarkCount(boardKey({ layout: draft.layout, angle }))} benchmarks
                    </Text>
                  </View>
                </Choice>
              </View>
            ))}
          </View>
          <Text className="type-caption mt-6 text-muted">
            Not sure? Measure from vertical: 40° leans much further over you.
          </Text>
        </>
      ) : null}

      {step === 'holds' ? (
        <>
          <Text className="type-hero mt-4">Which hold sets{'\n'}are on it?</Text>
          <Text className="type-sub mt-2 text-muted">You only see problems you can climb.</Text>
          <View className="mt-6 rounded-3xl border border-line bg-surface">
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
                  className="h-16 flex-row items-center pl-[18px] pr-[18px] active:opacity-70">
                  <View
                    className="size-7 rounded-full border border-text/35"
                    style={{ backgroundColor: SWATCH[id] }}
                  />
                  <View
                    className={cn(
                      'ml-3.5 h-full flex-1 flex-row items-center',
                      index < layout.holdSets.length - 1 && 'border-b border-line'
                    )}>
                    <View className="flex-1 gap-0.5">
                      <Text className="type-row">{set.name}</Text>
                      <Text className="type-caption text-muted">
                        {countUsing(board, id)} benchmarks use it
                      </Text>
                    </View>
                    <CheckBox checked={on} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
    </Screen>
  );
}
