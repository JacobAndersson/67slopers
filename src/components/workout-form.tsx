import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/screen';
import { Stepper } from '@/components/stepper';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { formatClock, formatShort } from '@/lib/dates';
import { PRESETS } from '@/lib/store/presets';
import type { Block, Workout, WorkoutTimings } from '@/lib/store/types';
import { estimateDuration } from '@/lib/workout-summary';

export type WorkoutFormValues = { name: string } & WorkoutTimings;

type WorkoutFormProps = {
  initial?: Workout;
  submitLabel: string;
  onSubmit: (values: WorkoutFormValues) => void;
  onDelete?: () => void;
};

const DEFAULT_BLOCK: Block = {
  hangSeconds: 7,
  pauseSeconds: 3,
  reps: 6,
  restSeconds: 180,
  sets: 6,
};

/** Simple-mode editor: one block of identical sets. Multi-set editing reuses `blocks` later. */
export function WorkoutForm({ initial, submitLabel, onSubmit, onDelete }: WorkoutFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [prep, setPrep] = useState(initial?.prepSeconds ?? 10);
  const [block, setBlock] = useState<Block>(initial?.blocks[0] ?? DEFAULT_BLOCK);

  const timings: WorkoutTimings = useMemo(
    () => ({ prepSeconds: prep, blocks: [block] }),
    [prep, block]
  );
  const total = estimateDuration(timings);
  const canSave = name.trim().length > 0;

  const patch = (p: Partial<Block>) => setBlock((b) => ({ ...b, ...p }));
  const applyPreset = (index: number) => {
    const preset = PRESETS[index];
    if (!name.trim() || PRESETS.some((p) => p.name === name)) setName(preset.name);
    setPrep(preset.prepSeconds);
    setBlock(preset.blocks[0]);
  };

  return (
    <Screen
      footer={
        <Button
          size="lg"
          disabled={!canSave}
          onPress={() => onSubmit({ name: name.trim(), ...timings })}>
          <Text>{submitLabel}</Text>
        </Button>
      }>
      <View className="gap-2">
        <Label nativeID="workout-name">Name</Label>
        <Input
          aria-labelledby="workout-name"
          value={name}
          onChangeText={setName}
          placeholder="Repeaters 7:3"
          autoCapitalize="sentences"
          returnKeyType="done"
        />
      </View>

      {initial ? null : (
        <View className="gap-2">
          <Text variant="muted">Start from a preset</Text>
          <View className="flex-row flex-wrap gap-2">
            {PRESETS.map((preset, i) => (
              <Button
                key={preset.name}
                variant="secondary"
                size="sm"
                onPress={() => applyPreset(i)}>
                <Text>{preset.name}</Text>
              </Button>
            ))}
          </View>
        </View>
      )}

      <Separator />

      <Stepper
        label="Prep"
        hint="Before the first hang"
        value={prep}
        onChange={setPrep}
        min={0}
        max={60}
        format={formatShort}
      />
      <Stepper
        label="Hang"
        value={block.hangSeconds}
        onChange={(v) => patch({ hangSeconds: v })}
        min={1}
        max={120}
        format={formatShort}
      />
      <Stepper
        label="Reps"
        hint="Hangs per set"
        value={block.reps}
        onChange={(v) => patch({ reps: v })}
        min={1}
        max={30}
      />
      <Stepper
        label="Pause"
        hint={block.reps > 1 ? 'Between reps' : 'Not used with one rep'}
        value={block.pauseSeconds}
        onChange={(v) => patch({ pauseSeconds: v })}
        min={0}
        max={60}
        format={formatShort}
      />
      <Stepper
        label="Sets"
        value={block.sets}
        onChange={(v) => patch({ sets: v })}
        min={1}
        max={30}
      />
      <Stepper
        label="Rest"
        hint="Between sets"
        value={block.restSeconds}
        onChange={(v) => patch({ restSeconds: v })}
        min={0}
        max={600}
        step={5}
        format={formatClock}
      />

      <Separator />

      <View className="flex-row items-center justify-between">
        <Text variant="muted">Total</Text>
        <Text className="text-xl font-semibold">≈ {formatClock(total)}</Text>
      </View>

      {onDelete ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="mt-4 self-start">
              <Text className="text-destructive">Delete workout</Text>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this workout?</AlertDialogTitle>
              <AlertDialogDescription>
                Past sessions keep their own copy of the timings, so history is not affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                <Text>Cancel</Text>
              </AlertDialogCancel>
              <AlertDialogAction onPress={onDelete}>
                <Text>Delete</Text>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </Screen>
  );
}
