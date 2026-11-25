import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { SetBars } from '@/components/data-bars';
import { MetricGrid } from '@/components/metric-grid';
import { Screen } from '@/components/screen';
import { LargeTitle } from '@/components/section-header';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useMotionSamples } from '@/hooks/use-motion-samples';
import { backElevation, wallAngle } from '@/lib/wall-photos/geometry';
import { formatAngle, steadyReading } from '@/lib/wall-photos/meta';
import { getWall, saveWall } from '@/lib/wall-photos/storage';
import type { WallReading } from '@/lib/wall-photos/types';

type Step = 'topUp' | 'topDown' | 'done';

const ASK: Record<Exclude<Step, 'done'>, { title: string; body: string }> = {
  topUp: {
    title: 'Top up',
    body: 'Lay the back of the phone flat on a smooth patch of the wall, top pointing up, and hold it still.',
  },
  topDown: {
    title: 'Now upside down',
    body: 'Same spot, top pointing down. This cancels the tilt of the camera bump.',
  },
};

/**
 * The reference angle for a wall's photos: the phone laid on the wall twice, top up and top
 * down, each reading taken by itself once the phone has been still for a second.
 */
export default function MeasureScreen() {
  useKeepAwake();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [step, setStep] = useState<Step>('topUp');
  const [topUp, setTopUp] = useState<WallReading | null>(null);
  const [topDown, setTopDown] = useState<WallReading | null>(null);
  // Each reading is taken once the phone is still and held the right way up: top up reads
  // gravity towards the bottom of the screen (y < 0), top down towards the top.
  const { latest, available } = useMotionSamples(step !== 'done', (samples, now) => {
    const last = samples.at(-1);
    if (!last || step === 'done') return;
    if ((step === 'topUp') !== last.gravity.y < 0) return;
    const reading = steadyReading(samples, now);
    if (!reading) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (step === 'topUp') {
      setTopUp(reading);
      setStep('topDown');
    } else {
      setTopDown(reading);
      setStep('done');
    }
  });

  const live = latest ? backElevation(latest.gravity) : null;
  const result = topUp && topDown ? wallAngle(topUp.gravity, topDown.gravity) : null;

  const onSave = () => {
    const wall = getWall(id);
    if (!wall || !topUp || !topDown || result === null) return;
    saveWall({
      ...wall,
      measured: { angle: result, topUp, topDown, at: new Date().toISOString() },
    });
    router.back();
  };

  const onRedo = () => {
    setTopUp(null);
    setTopDown(null);
    setStep('topUp');
  };

  return (
    <Screen
      header={<TopBar left="close" />}
      contentClassName="gap-7"
      footer={
        step === 'done' ? (
          <View className="gap-3">
            <Button size="lg" onPress={onSave}>
              <Text>Save {result !== null ? formatAngle(result, 1) : ''}</Text>
            </Button>
            <Button size="lg" variant="outline" onPress={onRedo}>
              <Text>Measure again</Text>
            </Button>
          </View>
        ) : undefined
      }>
      <View className="gap-4">
        <SetBars done={step === 'topUp' ? 0 : step === 'topDown' ? 1 : 2} total={2} height={8} />
        <LargeTitle
          title={step === 'done' ? 'Measured' : ASK[step].title}
          sub={
            step === 'done'
              ? 'The mean of the two readings.'
              : available === false
                ? 'This phone has no motion sensor.'
                : ASK[step].body
          }
        />
      </View>

      <View className="items-center py-6" accessibilityLiveRegion="polite">
        <Text
          className="type-timer text-[112px] leading-[116px] tracking-[-3px]"
          accessibilityLabel={`Angle ${result ?? live ?? 0} degrees`}>
          {step === 'done' && result !== null
            ? formatAngle(result, 1)
            : live !== null
              ? formatAngle(live, 1)
              : '–'}
        </Text>
        <Text className="type-caption mt-2 text-muted">past vertical</Text>
      </View>

      {topUp ? (
        <MetricGrid
          items={[
            { label: 'Top up', value: formatAngle(topUp.angle, 1) },
            { label: 'Top down', value: topDown ? formatAngle(topDown.angle, 1) : '–' },
          ]}
        />
      ) : null}
    </Screen>
  );
}
