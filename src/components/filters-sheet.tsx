import { useMemo } from 'react';
import { View } from 'react-native';

import { ButtonLabel } from '@/components/button-label';
import { Chip } from '@/components/chip';
import { GradeRange } from '@/components/grade-range';
import { SettingRow } from '@/components/setting-row';
import { Sheet } from '@/components/sheet';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { getLayout } from '@/lib/moonboard/boards';
import { DEFAULT_FILTER, SORTS, gradeHistogram, gradeRange } from '@/lib/moonboard/filter';
import { gradeRangeLabel, type GradeScale } from '@/lib/moonboard/grades';
import type { MoonSetup, Problem } from '@/lib/moonboard/types';
import { useClimbSession } from '@/lib/store/climb';

type FiltersSheetProps = {
  open: boolean;
  onClose: () => void;
  problems: Problem[];
  setup: MoonSetup;
  scale: GradeScale;
  /** How many problems the current filters leave. */
  count: number;
};

/** Grade range over the real spread of problems, sort order, and two switches. */
export function FiltersSheet({ open, onClose, problems, setup, scale, count }: FiltersSheetProps) {
  const filter = useClimbSession((s) => s.filter);
  const setFilter = useClimbSession((s) => s.setFilter);
  const bounds = useMemo(() => gradeRange(problems), [problems]);
  const histogram = useMemo(() => gradeHistogram(problems), [problems]);
  const min = Math.max(filter.gradeMin, bounds[0]);
  const max = Math.min(filter.gradeMax, bounds[1]);
  const all = getLayout(setup.layout).holdSets.length;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filters"
      action={{
        label: 'Reset',
        onPress: () => setFilter({ ...DEFAULT_FILTER, tab: filter.tab, query: filter.query }),
      }}>
      <View className="flex-row items-center justify-between">
        <Text className="font-medium">Grade</Text>
        <Text className="font-semibold">{gradeRangeLabel(min, max, scale)}</Text>
      </View>
      <GradeRange
        histogram={histogram}
        bounds={bounds}
        min={min}
        max={max}
        scale={scale}
        onChange={(gradeMin, gradeMax) =>
          setFilter({
            // An end left at the edge of the scale means "no limit", so own open problems
            // and any later additions are not cut off.
            gradeMin: gradeMin === bounds[0] ? DEFAULT_FILTER.gradeMin : gradeMin,
            gradeMax: gradeMax === bounds[1] ? DEFAULT_FILTER.gradeMax : gradeMax,
          })
        }
      />
      <Text className="font-medium">Sort by</Text>
      <View className="flex-row flex-wrap gap-2">
        {SORTS.map((sort) => (
          <Chip
            key={sort.id}
            label={sort.label}
            selected={filter.sort === sort.id}
            onPress={() => setFilter({ sort: sort.id })}
          />
        ))}
      </View>
      <View>
        <SettingRow
          title="Hide what I have sent"
          checked={filter.hideSent}
          onCheckedChange={(hideSent) => setFilter({ hideSent })}
        />
        <SettingRow
          title="Only my hold sets"
          description={`${setup.holdSets.length} of ${all} sets`}
          checked={filter.onlyMyHolds}
          onCheckedChange={(onlyMyHolds) => setFilter({ onlyMyHolds })}
        />
      </View>
      <Button size="lg" onPress={onClose}>
        <ButtonLabel>
          Show {count} {count === 1 ? 'problem' : 'problems'}
        </ButtonLabel>
      </Button>
    </Sheet>
  );
}
