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

const BAR_HEIGHT = 64;

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
      accessibilityRole="adjustable"
      accessibilityLabel={`Grade range, ${gradeLabel(low, scale)} to ${gradeLabel(high, scale)}`}
      className="gap-2"
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(event) => {
        const grade = gradeAt(event);
        dragging.current = Math.abs(grade - low) <= Math.abs(grade - high) ? 'min' : 'max';
        move(grade);
      }}
      onResponderMove={(event) => move(gradeAt(event))}>
      <View pointerEvents="none" className="flex-row items-end" style={{ height: BAR_HEIGHT }}>
        {grades.map((grade) => (
          <View key={grade} className="flex-1 px-0.5">
            <View
              className={cn('rounded', grade >= low && grade <= high ? 'bg-chart-1' : 'bg-border')}
              style={{ height: Math.max(3, ((histogram[grade] ?? 0) / peak) * BAR_HEIGHT) }}
            />
          </View>
        ))}
      </View>
      <View pointerEvents="none" className="h-6 justify-center">
        <View className="h-1 rounded-full bg-border" />
        {width > 0 ? (
          <>
            <View
              className="absolute h-1 rounded-full bg-foreground"
              style={{ left: (low - bounds[0] + 0.5) * step, width: (high - low) * step }}
            />
            {[low, high].map((grade, index) => (
              <View
                key={index}
                className="absolute size-6 rounded-full border-2 border-foreground bg-card"
                style={{ left: (grade - bounds[0] + 0.5) * step - 12 }}
              />
            ))}
          </>
        ) : null}
      </View>
      <View pointerEvents="none" className="flex-row justify-between">
        <Text className="text-xs text-muted-foreground font-medium">
          {gradeLabel(bounds[0], scale)}
        </Text>
        <Text className="text-xs text-muted-foreground font-medium">
          {gradeLabel(bounds[1], scale)}
        </Text>
      </View>
    </View>
  );
}
