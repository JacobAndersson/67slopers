import { useRouter } from 'expo-router';
import { LibraryIcon, PlusIcon, RepeatIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { BoardPicker } from '@/components/board-picker';
import { HoldPicker } from '@/components/hold-picker';
import { Screen } from '@/components/screen';
import {
  StepEditorProvider,
  StepList,
  StepListBoardProvider,
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
import { getBoard, type BoardId } from '@/lib/boards';
import { formatClock } from '@/lib/dates';
import { templateSteps } from '@/lib/store/presets';
import type { Step, Workout } from '@/lib/store/types';
import { validateWorkout } from '@/lib/workout-board';
import {
  appendTo,
  clearHolds,
  findStep,
  holdsInWorkout,
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
  withIds,
  type EditableStep,
} from '@/lib/workout-steps';
import { estimateDuration } from '@/lib/workout-summary';

export type WorkoutFormValues = { name: string; board?: BoardId; steps: Step[] };

type WorkoutFormProps = {
  initial?: Workout;
  /** Prefill a new workout, e.g. from the presets library. Ignored when `initial` is set. */
  template?: { name: string; board?: BoardId; steps: Step[] };
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
  template,
  submitLabel,
  onSubmit,
  onStart,
  onDelete,
}: WorkoutFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? template?.name ?? '');
  const [steps, setSteps] = useState<EditableStep[]>(() =>
    withIds(initial?.steps ?? template?.steps ?? templateSteps())
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reorderTarget, setReorderTarget] = useState<ReorderTarget | undefined>(undefined);
  const [boardId, setBoardId] = useState<BoardId | undefined>(initial?.board ?? template?.board);
  /** A board change that would drop hold choices waits for confirmation here. */
  const [pendingBoard, setPendingBoard] = useState<BoardId | undefined | null>(null);
  const [pickingId, setPickingId] = useState<string | null>(null);
  const board = getBoard(boardId);

  const plain = useMemo(() => stripIds(steps), [steps]);
  const usedHolds = useMemo(() => holdsInWorkout(plain), [plain]);
  const total = estimateDuration({ steps: plain });
  const errors = validateWorkout({ board: boardId, steps: plain });
  const valid = errors.length === 0;
  const canSave = valid && name.trim().length > 0;
  const values = (): WorkoutFormValues => ({
    name: name.trim(),
    ...(boardId ? { board: boardId } : {}),
    steps: plain,
  });

  const applyBoard = (next: BoardId | undefined) => {
    setBoardId(next);
    if (next !== boardId) setSteps((s) => clearHolds(s));
    setPendingBoard(null);
  };
  const requestBoard = (next: BoardId | undefined) => {
    if (next === boardId) return;
    if (usedHolds.length > 0) setPendingBoard(next);
    else applyBoard(next);
  };
  const picking = pickingId ? findStep(steps, pickingId) : undefined;
  const pickingHolds = picking && picking.kind !== 'repeat' ? picking.holds : undefined;
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
        // Swap this screen for the library so picking a preset does not stack two builders.
        <Button variant="outline" className="self-start" onPress={() => router.replace('/presets')}>
          <Icon as={LibraryIcon} className="size-4" />
          <Text>Start from a classic workout</Text>
        </Button>
      )}

      <Separator />

      <View className="gap-2">
        <Text variant="muted">Hangboard</Text>
        <BoardPicker value={boardId} onChange={requestBoard} />
      </View>

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

      <StepListBoardProvider board={board}>
        <StepEditorProvider
          value={{
            steps,
            actions,
            openHoldPicker: setPickingId,
            expandedId,
            setExpandedId,
            reorderTarget,
            setReorderTarget,
          }}>
          <StepList steps={steps} parentId={null} depth={0} />
        </StepEditorProvider>
      </StepListBoardProvider>

      {board ? (
        <HoldPicker
          board={board}
          visible={pickingId !== null}
          initial={pickingHolds}
          onClose={() => setPickingId(null)}
          onDone={(holds) => {
            if (pickingId) actions.update(pickingId, { holds });
            setPickingId(null);
          }}
        />
      ) : null}

      <AlertDialog
        open={pendingBoard !== null}
        onOpenChange={(open) => !open && setPendingBoard(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear hold choices?</AlertDialogTitle>
            <AlertDialogDescription>
              Holds belong to a board, so changing it forgets which holds each hang uses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Keep board</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={() => applyBoard(pendingBoard ?? undefined)}>
              <Text>Change board</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
