import { useMemo } from 'react';

import { MetricGrid } from '@/components/metric-grid';
import { Text } from '@/components/ui/text';
import { formatClock } from '@/lib/dates';
import type { HangResult, WorkoutTimings } from '@/lib/store/types';
import { hangOutcomes, hangsLine } from '@/lib/workout-summary';

type SessionFactsProps = {
  snapshot: WorkoutTimings;
  elapsedSeconds: number;
  completedSets: number;
  totalSets: number;
  /** Older sessions do not have per-hang tracking. */
  hangs?: HangResult[];
};

/** The same recorded results on the finish screen and in session history. */
export function SessionFacts({
  snapshot,
  elapsedSeconds,
  completedSets,
  totalSets,
  hangs,
}: SessionFactsProps) {
  const outcomes = useMemo(
    () => (hangs ? hangOutcomes(snapshot, hangs) : undefined),
    [snapshot, hangs]
  );

  return (
    <>
      <MetricGrid
        items={[
          { label: 'Elapsed time', value: formatClock(elapsedSeconds) },
          { label: 'Completed sets', value: `${completedSets}/${totalSets}` },
          ...(hangs && outcomes
            ? [
                {
                  label: 'Time hanging',
                  value: formatClock(hangs.reduce((seconds, hang) => seconds + hang.actual, 0)),
                },
                { label: 'Full hangs', value: `${outcomes.done}/${outcomes.planned}` },
              ]
            : []),
        ]}
      />
      {outcomes ? <Text variant="muted">{hangsLine(outcomes)}</Text> : null}
    </>
  );
}
