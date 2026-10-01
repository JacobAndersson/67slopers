import { useMemo } from 'react';

import { MetricGrid } from '@/components/metric-grid';
import { formatClock } from '@/lib/dates';
import type { WorkoutTimings } from '@/lib/store/types';
import { workoutFacts } from '@/lib/workout-summary';

export function WorkoutFacts({ timings }: { timings: WorkoutTimings }) {
  const facts = useMemo(() => workoutFacts(timings), [timings]);
  return (
    <MetricGrid
      items={[
        { label: 'Total time', value: formatClock(facts.seconds) },
        { label: 'Time hanging', value: formatClock(facts.hangSeconds) },
        { label: 'Sets', value: String(facts.sets) },
        { label: 'Hangs', value: String(facts.hangs) },
      ]}
    />
  );
}
