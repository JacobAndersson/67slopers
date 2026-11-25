import { useRef, useState } from 'react';
import { View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';

import { Text } from '@/components/ui/text';
import { gradeLabel, type GradeScale } from '@/lib/moonboard/grades';
import { cn } from '@/lib/utils';

type GradeRangeProps = {
  /** Problems per grade index, for the bars. */
  histogram: number[];
  /** The grades that exist on this board: the ends of the track. */
  bounds: [number, number];
  min: number;
  max: number;
  scale: GradeScale;
  onChange: (min: number, max: number) => void;
};

const BAR_HEIGHT = 72;

/**
 * A grade range with the real spread of problems above it. Touch anywhere on the bars or
 * the track and the nearer end follows the finger.
 */
export function GradeRange({ histogram, bounds, min, max, scale, onChange }: GradeRangeProps) {
  const [width, setWidth] = useState(0);
  const dragging = useRef<'min' | 'max'>('min');
  const grades = Array.from({ length: bounds[1] - bounds[0] + 1 }, (_, i) => bounds[0] + i);
  const peak = Math.max(1, ...grades.map((g) => histogram[g] ?? 0));
  const step = width / grades.length;
  const low = Math.max(min, bounds[0]);
  const high = Math.min(max, bounds[1]);

  const gradeAt = (event: GestureResponderEvent) =>
    bounds[0] +
    Math.min(grades.length - 1, Math.max(0, Math.floor(event.nativeEvent.locationX / step)));
  const move = (grade: number) => {
    if (dragging.current === 'min') onChange(Math.min(grade, high), high);
    else onChange(low, Math.max(grade, low));
  };

  return (
    <View
      accessible={false}
      className="gap-3"
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(event) => {
        const grade = gradeAt(event);
        dragging.current = Math.abs(grade - low) <= Math.abs(grade - high) ? 'min' : 'max';
        move(grade);
      }}
      onResponderMove={(event) => move(gradeAt(event))}>
      <View
        pointerEvents="none"
        className="flex-row items-end gap-1.5"
        style={{ height: BAR_HEIGHT }}>
        {grades.map((grade) => (
          <View
            key={grade}
            className={cn(
              'flex-1 rounded-full',
              grade >= low && grade <= high ? 'bg-text' : 'bg-track'
            )}
            style={{ height: Math.max(6, ((histogram[grade] ?? 0) / peak) * BAR_HEIGHT) }}
          />
        ))}
      </View>
      <View pointerEvents="box-none" className="h-7 justify-center">
        <View className="h-1.5 rounded-full bg-track" />
        {width > 0 ? (
          <>
            <View
              className="absolute h-1.5 rounded-full bg-text"
              style={{ left: (low - bounds[0] + 0.5) * step, width: (high - low) * step }}
            />
            {[low, high].map((grade, index) => {
              const end = index === 0 ? 'min' : 'max';
              // Each end is its own slider for a screen reader: swipe up or down to move it.
              const nudge = (by: 1 | -1) => {
                const next = Math.min(bounds[1], Math.max(bounds[0], grade + by));
                if (end === 'min') onChange(Math.min(next, high), high);
                else onChange(low, Math.max(next, low));
              };
              return (
                <View
                  key={index}
                  accessible
                  accessibilityRole="adjustable"
                  accessibilityLabel={index === 0 ? 'Easiest grade' : 'Hardest grade'}
                  accessibilityValue={{ text: gradeLabel(grade, scale) }}
                  accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
                  onAccessibilityAction={(event) =>
                    nudge(event.nativeEvent.actionName === 'increment' ? 1 : -1)
                  }
                  className="absolute size-7 rounded-full border-2 border-text bg-surface"
                  style={{ left: (grade - bounds[0] + 0.5) * step - 14 }}
                />
              );
            })}
          </>
        ) : null}
      </View>
      <View pointerEvents="none" className="flex-row justify-between">
        <Text className="type-caption text-muted">{gradeLabel(bounds[0], scale)}</Text>
        <Text className="type-caption text-muted">{gradeLabel(bounds[1], scale)}</Text>
      </View>
    </View>
  );
}
