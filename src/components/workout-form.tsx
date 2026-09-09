import { PlusIcon, RepeatIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/screen';
import {
  StepEditorProvider,
  StepList,
  type ReorderTarget,
  type StepListActions,
} from '@/components/step-list';
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
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { formatClock } from '@/lib/dates';
import { PRESETS, templateSteps } from '@/lib/store/presets';
import type { Step, Workout } from '@/lib/store/types';
import {
  appendTo,
  duplicateStep,
  moveIntoRepeat,
  moveOutOfRepeat,
  moveStep,
  newRepeat,
  newTimedStep,
  removeStep,
  reorderWithin,
  stripIds,
  updateStep,
  validate,
  withIds,
  type EditableStep,
} from '@/lib/workout-steps';
import { estimateDuration } from '@/lib/workout-summary';

export type WorkoutFormValues = { name: string; steps: Step[] };

type WorkoutFormProps = {
  initial?: Workout;
  submitLabel: string;
  /** Save. Needs a name. */
  onSubmit: (values: WorkoutFormValues) => void;
  /** Run without saving. Offered on the create screen only; the name is optional there. */
  onStart?: (values: WorkoutFormValues) => void;
  onDelete?: () => void;
};

/** Garmin-style builder: an ordered list of steps and repeat groups. */
export function WorkoutForm({
  initial,
  submitLabel,
  onSubmit,
  onStart,
  onDelete,
}: WorkoutFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [steps, setSteps] = useState<EditableStep[]>(() =>
    withIds(initial ? initial.steps : templateSteps())
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reorderTarget, setReorderTarget] = useState<ReorderTarget | undefined>(undefined);

  const plain = useMemo(() => stripIds(steps), [steps]);
  const total = estimateDuration({ steps: plain });
  const errors = validate(plain);
  const valid = errors.length === 0;
  const canSave = valid && name.trim().length > 0;
  const values = (): WorkoutFormValues => ({ name: name.trim(), steps: plain });
  const reordering = reorderTarget !== undefined;

  const actions = useMemo<StepListActions>(
    () => ({
      update: (id, patch) => setSteps((s) => updateStep(s, id, patch)),
      remove: (id) => setSteps((s) => removeStep(s, id)),
      duplicate: (id) => setSteps((s) => duplicateStep(s, id)),
      move: (id, direction) => setSteps((s) => moveStep(s, id, direction)),
      moveOut: (id) => setSteps((s) => moveOutOfRepeat(s, id)),
      moveInto: (id, repeatId) => setSteps((s) => moveIntoRepeat(s, id, repeatId)),
      addStep: (parentId) => {
        const step = newTimedStep('hang');
        setSteps((s) => appendTo(s, parentId, step));
        setExpandedId(step.id);
      },
      addRepeat: (parentId) => setSteps((s) => appendTo(s, parentId, newRepeat())),
      reorder: (parentId, ids) => setSteps((s) => reorderWithin(s, parentId, ids)),
    }),
    []
  );

  const applyPreset = (index: number) => {
    const preset = PRESETS[index];
    if (!name.trim() || PRESETS.some((p) => p.name === name)) setName(preset.name);
    setSteps(withIds(preset.steps));
    setExpandedId(null);
  };

  return (
    <Screen
      footer={
        onStart ? (
          <View className="flex-row gap-3">
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              disabled={!canSave}
              onPress={() => onSubmit(values())}>
              <Text>{submitLabel}</Text>
            </Button>
            <Button
              size="lg"
              className="flex-1"
              disabled={!valid}
              onPress={() => onStart(values())}>
              <Text>Start</Text>
            </Button>
          </View>
        ) : (
          <Button size="lg" disabled={!canSave} onPress={() => onSubmit(values())}>
            <Text>{submitLabel}</Text>
          </Button>
        )
      }>
      <View className="gap-2">
        <Label nativeID="workout-name">Name</Label>
        <Input
          aria-labelledby="workout-name"
          value={name}
          onChangeText={setName}
          placeholder={onStart ? 'Optional. Needed to save.' : 'Repeaters 7:3'}
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

      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-semibold">Steps</Text>
        <Button
          variant="ghost"
          size="sm"
          disabled={!reordering && steps.length < 2}
          onPress={() => setReorderTarget(reordering ? undefined : null)}>
          <Text>{reordering ? 'Done' : 'Reorder'}</Text>
        </Button>
      </View>

      <StepEditorProvider
        value={{ steps, actions, expandedId, setExpandedId, reorderTarget, setReorderTarget }}>
        <StepList steps={steps} parentId={null} depth={0} />
      </StepEditorProvider>

      {reordering ? null : (
        <View className="flex-row gap-3">
          <Button variant="secondary" className="flex-1" onPress={() => actions.addStep(null)}>
            <Icon as={PlusIcon} className="size-4" />
            <Text>Add step</Text>
          </Button>
          <Button variant="secondary" className="flex-1" onPress={() => actions.addRepeat(null)}>
            <Icon as={RepeatIcon} className="size-4" />
            <Text>Add repeat</Text>
          </Button>
        </View>
      )}

      <Separator />

      {errors.length ? <Text className="text-destructive">{errors[0]}</Text> : null}
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
