import { useNavigation, useRouter } from 'expo-router';
import { BooksIcon } from 'phosphor-react-native/src/icons/Books';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { PlayIcon } from 'phosphor-react-native/src/icons/Play';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { RepeatIcon } from 'phosphor-react-native/src/icons/Repeat';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, View, type TextInput } from 'react-native';

import { useLargeText } from '@/hooks/use-large-text';
import { BoardPicker } from '@/components/board-picker';
import { Card } from '@/components/card';
import { ConfirmSheet } from '@/components/confirm-sheet';
import { EditorReveal } from '@/components/disclosure-motion';
import { Field } from '@/components/field';
import { Glide, GlideContainer } from '@/components/glide';
import { HangboardDiagram } from '@/components/hangboard-diagram';
import { HoldPicker } from '@/components/hold-picker';
import { Screen } from '@/components/screen';
import { Label, SectionHeader } from '@/components/section-header';
import {
  StepEditorProvider,
  StepList,
  StepListBoardProvider,
  type StepListActions,
} from '@/components/step-list';
import { AddStepSheet, StepMenuSheet } from '@/components/step-sheets';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { getBoard, type BoardId } from '@/lib/boards';
import { formatClock } from '@/lib/dates';
import { templateSteps } from '@/lib/store/presets';
import { useStore } from '@/lib/store/store';
import type { Step, Workout } from '@/lib/store/types';
import { validateWorkout } from '@/lib/workout-board';
import { moveStepTo } from '@/lib/workout-rows';
import {
  appendTo,
  clearHolds,
  duplicateStep,
  findStep,
  holdsInWorkout,
  moveIntoRepeat,
  moveOutOfRepeat,
  moveStep,
  newRepeat,
  newTimedStep,
  removeStep,
  stripIds,
  updateStep,
  withIds,
  type EditableStep,
} from '@/lib/workout-steps';
import { estimateDuration } from '@/lib/workout-summary';

export type WorkoutFormValues = {
  name: string;
  description?: string;
  board?: BoardId;
  steps: Step[];
};

type WorkoutFormProps = {
  initial?: Workout;
  /** Prefill a new workout, e.g. from the presets library. Ignored when `initial` is set. */
  template?: { name: string; description?: string; board?: BoardId; steps: Step[] };
  submitLabel: string;
  /** Save. Needs a name. */
  onSubmit: (values: WorkoutFormValues) => void;
  /** Run without saving. Offered on the create screen only; the name is optional there. */
  onStart?: (values: WorkoutFormValues) => void;
  onDelete?: () => void;
};

/**
 * The builder (design: builder-new, builder-*; page 04): name, description, the board, then the
 * steps as cards with rails, repeats as a soft rail down their side. Garmin-style: tap a step
 * to edit it in place, hold and drag to move it, ⋮ for every move as a list. Leaving with
 * changes asks first.
 */
export function WorkoutForm({
  initial,
  template,
  submitLabel,
  onSubmit,
  onStart,
  onDelete,
}: WorkoutFormProps) {
  const router = useRouter();
  const navigation = useNavigation();
  const preferredBoard = useStore((s) => s.preferredBoard);
  const hydrated = useStore((s) => s.hydrated);
  const defaultsApplied = useRef(hydrated);
  const boardEdited = useRef(false);
  const nameRef = useRef<TextInput>(null);
  const [name, setName] = useState(initial?.name ?? template?.name ?? '');
  const [nameError, setNameError] = useState(false);
  const [description, setDescription] = useState(
    initial?.description ?? template?.description ?? ''
  );
  const [showDescription, setShowDescription] = useState(!!initial);
  const [showBoards, setShowBoards] = useState(false);
  const [steps, setSteps] = useState<EditableStep[]>(() =>
    withIds(initial?.steps ?? template?.steps ?? templateSteps())
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  /** Where "Add a step" adds: a repeat's id, `null` for the top level, `false` when closed. */
  const [addTo, setAddTo] = useState<string | null | false>(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [boardId, setBoardId] = useState<BoardId | undefined>(
    initial ? initial.board : (template?.board ?? preferredBoard)
  );
  /** A board change that would drop hold choices waits for confirmation here. */
  const [pendingBoard, setPendingBoard] = useState<BoardId | undefined | null>(null);
  const [pickingId, setPickingId] = useState<string | null>(null);
  const board = getBoard(boardId);
  const large = useLargeText();

  // Direct web links can mount before storage finishes. Apply the saved default once;
  // never replace an edited choice or change an already-open builder after board setup.
  useEffect(() => {
    if (defaultsApplied.current || !hydrated) return;
    defaultsApplied.current = true;
    if (!initial && !template?.board && !boardEdited.current) setBoardId(preferredBoard);
  }, [hydrated, initial, template?.board, preferredBoard]);

  const plain = useMemo(() => stripIds(steps), [steps]);
  const usedHolds = useMemo(() => holdsInWorkout(plain), [plain]);
  const total = useMemo(() => estimateDuration({ steps: plain }), [plain]);
  const errors = validateWorkout({ board: boardId, steps: plain });
  const valid = errors.length === 0;
  // Every key is present, even when empty, so saving an edit can also clear a field.
  const values = (): WorkoutFormValues => ({
    name: name.trim(),
    description: description.trim() || undefined,
    board: boardId,
    steps: plain,
  });

  // Leaving with changes asks first (design: builder-discard). Saving and starting leave freely.
  const snapshot = JSON.stringify({ name, description, boardId, plain });
  const [startState] = useState(snapshot);
  const dirty = snapshot !== startState;
  const leaving = useRef(false);
  const [discardAction, setDiscardAction] = useState<unknown>(null);
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (!dirty || leaving.current) return;
        e.preventDefault();
        setDiscardAction(e.data.action);
      }),
    [navigation, dirty]
  );
  const leave = (go: () => void) => {
    leaving.current = true;
    go();
  };

  const applyBoard = (next: BoardId | undefined) => {
    setBoardId(next);
    if (next !== boardId) setSteps((s) => clearHolds(s));
    setPendingBoard(null);
  };
  const requestBoard = (next: BoardId | undefined) => {
    boardEdited.current = true;
    if (next === boardId) return;
    if (usedHolds.length > 0) setPendingBoard(next);
    else applyBoard(next);
  };
  const picking = pickingId ? findStep(steps, pickingId) : undefined;
  const pickingHolds = picking && picking.kind !== 'repeat' ? picking.holds : undefined;

  const actions = useMemo<StepListActions>(
    () => ({
      update: (id, patch) => setSteps((s) => updateStep(s, id, patch)),
      remove: (id) => setSteps((s) => removeStep(s, id)),
      duplicate: (id) => setSteps((s) => duplicateStep(s, id)),
      move: (id, direction) => setSteps((s) => moveStep(s, id, direction)),
      moveOut: (id) => setSteps((s) => moveOutOfRepeat(s, id)),
      moveInto: (id, repeatId) => setSteps((s) => moveIntoRepeat(s, id, repeatId)),
      addStep: (parentId, kind = 'hang') => {
        const step = newTimedStep(kind);
        setSteps((s) => appendTo(s, parentId, step));
        setExpandedId(step.id);
      },
      addRepeat: (parentId) => setSteps((s) => appendTo(s, parentId, newRepeat())),
      moveTo: (id, parentId, index) => setSteps((s) => moveStepTo(s, id, parentId, index)),
    }),
    []
  );

  const save = () => {
    if (!name.trim()) {
      setNameError(true);
      nameRef.current?.focus();
      return;
    }
    leave(() => onSubmit(values()));
  };

  return (
    <Screen
      header={
        <TopBar
          left={initial ? 'back' : 'close'}
          title={initial ? 'Edit workout' : 'New workout'}
        />
      }
      contentClassName="gap-0"
      footer={
        onStart ? (
          // At large text sizes the two pills go one per row (design: found-a11y-steps).
          <View className={large ? 'flex-col gap-3' : 'flex-row gap-3'}>
            <Button
              size="lg"
              variant="outline"
              className={large ? 'w-full flex-none' : 'flex-1'}
              disabled={!valid}
              onPress={save}>
              <Text>{submitLabel}</Text>
            </Button>
            <Button
              size="lg"
              className={large ? 'w-full flex-none' : 'flex-1'}
              disabled={!valid}
              onPress={() => leave(() => onStart(values()))}>
              <Icon
                as={PlayIcon}
                weight="fill"
                size={20}
                className={valid ? 'text-on-action' : 'text-disabled-fg'}
              />
              <Text>Start</Text>
            </Button>
          </View>
        ) : (
          <Button size="lg" disabled={!valid} onPress={save}>
            <Text>{submitLabel}</Text>
          </Button>
        )
      }>
      <Field
        ref={nameRef}
        label="Name"
        value={name}
        onChangeText={(text) => {
          setName(text);
          if (text.trim()) setNameError(false);
        }}
        placeholder="Name"
        error={nameError ? 'Add a name to save. Start works without one.' : null}
        autoCapitalize="sentences"
        returnKeyType="done"
      />

      {showDescription ? (
        <EditorReveal className="mt-4">
          <Field
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="What it trains, which hold or load to pick"
            multiline
            autoFocus={!initial}
          />
        </EditorReveal>
      ) : (
        <Pressable
          onPress={() => setShowDescription(true)}
          accessibilityRole="button"
          className="mt-2 h-12 flex-row items-center gap-2.5 self-start active:opacity-70">
          <Icon as={PlusIcon} size={20} />
          <Text className="type-body-b">Add description</Text>
        </Pressable>
      )}

      {initial ? null : (
        // Swap this screen for the library so picking a preset does not stack two builders.
        <Button
          variant="outline"
          className={large ? 'mt-2 h-auto min-h-[52px] py-3' : 'mt-2'}
          onPress={() => leave(() => router.replace('/presets'))}>
          <Icon as={BooksIcon} size={20} />
          <Text className="shrink text-center">Start from a classic workout</Text>
        </Button>
      )}

      <View className="mb-6 mt-6 h-px bg-line" />

      <Card className="p-6">
        {/* At large text sizes the button goes under the name instead of squeezing it. */}
        <View className={large ? 'gap-3' : 'flex-row items-start gap-3'}>
          <View className={large ? 'gap-1.5' : 'flex-1 gap-1.5'}>
            <Label>Hangboard</Label>
            {/* Shrinks to one line where the platform can; a browser wraps it instead. */}
            <Text
              className="type-title"
              numberOfLines={large || Platform.OS === 'web' ? 2 : 1}
              adjustsFontSizeToFit={!large}>
              {board?.name ?? 'No board'}
            </Text>
          </View>
          <Button
            variant="outline"
            size="sm"
            className={large ? 'h-auto min-h-12 self-start px-5 py-2' : 'w-[100px] px-0'}
            accessibilityState={{ expanded: showBoards }}
            onPress={() => setShowBoards((v) => !v)}>
            <Text>{showBoards ? 'Done' : 'Change'}</Text>
          </Button>
        </View>
        {showBoards ? (
          <EditorReveal className="mt-4">
            <BoardPicker value={boardId} onChange={requestBoard} />
            <Pressable
              onPress={() => router.push('/board-setup')}
              accessibilityRole="button"
              className="-mx-3 mt-3 h-14 flex-row items-center px-3 active:opacity-70">
              <Text className="type-row flex-1">See all boards</Text>
              <Icon as={CaretRightIcon} size={20} className="text-muted" />
            </Pressable>
          </EditorReveal>
        ) : board ? (
          <HangboardDiagram
            board={board.id}
            active={usedHolds}
            style={{ marginTop: 16 }}
            accessibilityLabel={`${board.name}, the grips this workout uses`}
          />
        ) : (
          <Text className="type-sub mt-2 text-muted">
            Choose a board to name the grip on each hang.
          </Text>
        )}
      </Card>

      <SectionHeader title="Steps" className="mt-8">
        <Text className="type-sub text-muted">{formatClock(total)} total</Text>
      </SectionHeader>
      <Text className="type-caption mt-1.5 text-muted">
        Tap a step to edit it. Hold and drag to move it.
      </Text>

      <GlideContainer className="mt-4 gap-0">
        {errors.length ? (
          <View
            className="mb-4 min-h-14 flex-row items-center gap-3 rounded-input bg-raised px-4 py-3"
            accessibilityLiveRegion="polite">
            <Icon as={WarningCircleIcon} weight="fill" size={22} />
            <Text className="type-body-b flex-1">{errors[0]}</Text>
          </View>
        ) : null}

        <StepListBoardProvider board={board}>
          <StepEditorProvider
            value={{
              steps,
              actions,
              openHoldPicker: setPickingId,
              openMenu: setMenuId,
              openAdd: setAddTo,
              expandedId,
              setExpandedId,
            }}>
            <StepList steps={steps} depth={0} />
          </StepEditorProvider>
        </StepListBoardProvider>

        <Glide active watch={steps} still={expandedId} className="gap-0">
          <View className={large ? 'mt-2 gap-3' : 'mt-2 flex-row gap-3'}>
            <Button
              variant="outline"
              size="sm"
              className={large ? 'w-full flex-none' : 'flex-1 px-2'}
              onPress={() => setAddTo(null)}>
              <Icon as={PlusIcon} size={18} />
              <Text>Add step</Text>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={large ? 'w-full flex-none' : 'flex-1 px-2'}
              onPress={() => actions.addRepeat(null)}>
              <Icon as={RepeatIcon} size={18} />
              <Text>Add repeat</Text>
            </Button>
          </View>

          {onDelete ? (
            <Button variant="ghost" className="mt-5" onPress={() => setConfirmDelete(true)}>
              <Icon as={TrashIcon} size={20} />
              <Text>Delete workout</Text>
            </Button>
          ) : null}
        </Glide>
      </GlideContainer>

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

      <StepMenuSheet
        stepId={menuId}
        steps={steps}
        board={board}
        actions={actions}
        onClose={() => setMenuId(null)}
      />
      <AddStepSheet
        open={addTo !== false}
        onClose={() => setAddTo(false)}
        onAdd={(kind) => addTo !== false && actions.addStep(addTo, kind)}
      />
      <ConfirmSheet
        open={pendingBoard !== null}
        onClose={() => setPendingBoard(null)}
        title="Change the board?"
        body="Grips belong to a board, so a new board forgets each hang’s grip."
        safe={{ label: 'Keep this board', onPress: () => setPendingBoard(null) }}
        destructive={{
          label: 'Change board',
          plain: true,
          onPress: () => applyBoard(pendingBoard ?? undefined),
        }}
      />
      {onDelete ? (
        <ConfirmSheet
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title="Delete this workout?"
          body="Past sessions keep their own copy of the timings, so your history stays."
          safe={{ label: 'Keep it', onPress: () => setConfirmDelete(false) }}
          destructive={{
            label: 'Delete workout',
            onPress: () => {
              setConfirmDelete(false);
              leave(onDelete);
            },
          }}
        />
      ) : null}
      <ConfirmSheet
        open={discardAction !== null}
        onClose={() => setDiscardAction(null)}
        title="Discard your changes?"
        body={
          initial
            ? 'The workout stays as it was before you started editing.'
            : 'This workout has not been saved.'
        }
        safe={{ label: 'Keep editing', onPress: () => setDiscardAction(null) }}
        destructive={{
          label: 'Discard changes',
          onPress: () => {
            const action = discardAction;
            setDiscardAction(null);
            leave(() => navigation.dispatch(action as never));
          },
        }}
      />
    </Screen>
  );
}
