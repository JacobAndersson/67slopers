import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { DotsThreeVerticalIcon } from 'phosphor-react-native/src/icons/DotsThreeVertical';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { RepeatIcon } from 'phosphor-react-native/src/icons/Repeat';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Pressable, View, type AccessibilityActionEvent } from 'react-native';

import { useLargeText } from '@/hooks/use-large-text';
import { EditorReveal } from '@/components/disclosure-motion';
import { DragHandle, DragList } from '@/components/drag-list';
import { Field } from '@/components/field';
import { HangboardDiagram } from '@/components/hangboard-diagram';
import { IconButton } from '@/components/icon-button';
import { useScreenScroll } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { Stepper } from '@/components/stepper';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { DOT, plural } from '@/lib/copy';
import { gripName, gripShortName, shortGripName, type Board } from '@/lib/boards';
import type { StepKind } from '@/lib/store/types';
import { cn } from '@/lib/utils';
import {
  LIMITS,
  STEP_NAMES,
  findStep,
  stepMoves,
  type EditableRepeatStep,
  type EditableStep,
  type EditableTimedStep,
  type StepPatch,
} from '@/lib/workout-steps';
import { flattenSteps, slotsFor } from '@/lib/workout-rows';
import { seconds } from '@/lib/workout-words';

export type StepListActions = {
  update: (id: string, patch: StepPatch) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  move: (id: string, direction: -1 | 1) => void;
  moveOut: (id: string) => void;
  moveInto: (id: string, repeatId: string) => void;
  addStep: (parentId: string | null, kind?: StepKind) => void;
  addRepeat: (parentId: string | null) => void;
  /** Puts a step, or a repeat with its steps, at a place in the tree. */
  moveTo: (id: string, parentId: string | null, index: number) => void;
};

type EditorState = {
  steps: EditableStep[];
  actions: StepListActions;
  /** Opens the hold picker for a hang step; only offered when the workout has a board. */
  openHoldPicker: (stepId: string) => void;
  /** Opens the ⋮ sheet for a step or repeat. */
  openMenu: (stepId: string) => void;
  /** Opens "Add a step" for a repeat, or the top level. */
  openAdd: (parentId: string | null) => void;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
};

/** Absent below a read-only list; present in the builder. */
const EditorContext = createContext<EditorState | null>(null);

/** The workout's board, so hang steps can name their grip. Provided by the builder and overview. */
const BoardContext = createContext<Board | undefined>(undefined);

export function StepListBoardProvider({
  board,
  children,
}: {
  board: Board | undefined;
  children: ReactNode;
}) {
  return <BoardContext.Provider value={board}>{children}</BoardContext.Provider>;
}

export function StepEditorProvider({
  value,
  children,
}: {
  value: EditorState;
  children: ReactNode;
}) {
  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

const KINDS: StepKind[] = ['prep', 'hang', 'rest'];

/** What a step is called on its card: a rest closing a set is Recover. */
export type StepLook = 'prep' | 'hang' | 'rest' | 'recover';

export function stepLook(step: Pick<EditableTimedStep, 'kind'>, depth: number): StepLook {
  return step.kind === 'rest' && depth === 1 ? 'recover' : step.kind;
}

/** Each kind carries a rail in its own colour: Hang ink, Rest Glacier, Recover and Get ready pale. */
export const RAIL: Record<StepLook, string> = {
  prep: 'bg-bar',
  hang: 'bg-text',
  rest: 'bg-rest-rail',
  recover: 'bg-recover-rail',
};

const TITLE: Record<StepLook, string> = { ...STEP_NAMES, recover: 'Recover' };

/** The grip as the step card names it: "Medium edges". */
function gripWords(board: Board | undefined, step: EditableTimedStep) {
  return board && step.kind === 'hang' && step.holds?.length
    ? gripShortName(board, step.holds)
    : '';
}

/** "7 s · Medium edges", "3:00 · rest between sets". */
function stepSub(step: EditableTimedStep, look: StepLook, board: Board | undefined) {
  return [
    step.label ? TITLE[look] : null,
    seconds(step.seconds),
    gripWords(board, step) || null,
    look === 'recover' && !step.label ? 'rest between sets' : null,
  ]
    .filter(Boolean)
    .join(DOT);
}

/** "6 sets" for a top-level repeat, "6 reps" inside one. */
export function repeatWords(times: number, depth: number) {
  return plural(times, depth === 0 ? 'set' : 'rep');
}

type StepListProps = {
  steps: EditableStep[];
  depth: number;
};

/**
 * Renders steps and repeats (design: builder-*, page 04). A repeat is a soft rail down its left
 * side, not a box; its steps sit one inset in. Without an editor provider it is read-only. In the
 * builder the same picture is drawn as one flat column of rows (see `src/lib/workout-rows.ts`),
 * so a step can be held and dragged anywhere: among its neighbours, out of its repeat, into
 * another. A repeat is held by its header and travels whole.
 */
export function StepList({ steps, depth }: StepListProps) {
  const editor = useContext(EditorContext);
  if (steps.length === 0) {
    return <Text className="type-sub text-muted">No steps yet.</Text>;
  }
  if (editor) return <EditorRows steps={steps} />;
  return (
    <DepthContext.Provider value={depth}>
      <View className="gap-2">
        {steps.map((step) =>
          step.kind === 'repeat' ? (
            <RepeatGroup key={step.id} step={step} />
          ) : (
            <StepCard key={step.id} step={step} />
          )
        )}
      </View>
    </DepthContext.Provider>
  );
}

/** How deep the list being rendered is: 0 at the top, 1 inside a repeat, 2 inside its repeat. */
const DepthContext = createContext(0);

/** The soft rail down a repeat's left side. */
function TrayLine({ className }: { className?: string }) {
  return (
    <View pointerEvents="none" className={cn('absolute left-1 w-1 bg-line-strong', className)} />
  );
}

/**
 * The repeats a row is inside, one inset layer per level with the repeat's rail, so stacked
 * rows read as the groups the read-only list draws. `clear` layers keep the inset without the
 * rail: a row in the air takes the width of the place it is over, not the rails of the one it
 * left.
 */
function Rails({
  depth,
  clear = 0,
  children,
}: {
  depth: number;
  clear?: number;
  children: ReactNode;
}) {
  // Always the same nesting, whatever the depth: a row in the air changes depth as it crosses
  // a repeat, and a change of nesting would remount it and drop the gesture holding it.
  const layer = (level: number) => (level >= depth ? 'flex-1' : 'flex-1 px-3');
  const line = (level: number) =>
    level < depth && level >= clear ? <TrayLine className="inset-y-0" /> : null;
  return (
    <View className={layer(0)}>
      {line(0)}
      <View className={layer(1)}>
        {line(1)}
        {children}
      </View>
    </View>
  );
}

function EditorRows({ steps }: { steps: EditableStep[] }) {
  const editor = useContext(EditorContext)!;
  const screen = useScreenScroll();
  const rows = useMemo(() => flattenSteps(steps), [steps]);
  const byKey = useMemo(() => new Map(rows.map((row) => [row.key, row])), [rows]);
  const slots = useMemo(
    () =>
      Object.fromEntries(
        rows
          .filter((row) => row.size > 0)
          .map((row) => [
            row.key,
            slotsFor(steps, row.key).map(({ valid, depth }) => ({ valid, depth })),
          ])
      ),
    [steps, rows]
  );
  const { moveTo } = editor.actions;
  const onDrop = useCallback(
    (key: string, slot: number) => {
      const target = slotsFor(steps, key)[slot];
      if (target?.valid) moveTo(key, target.parentId, target.index);
    },
    [steps, moveTo]
  );
  return (
    <DragList
      rows={rows}
      slots={slots}
      onDrop={onDrop}
      onTouch={blockPress}
      scrollRef={screen?.scrollableRef}
      renderGap={(depth) => (
        <Rails depth={depth}>
          <View className="mb-2 flex-1 rounded-[24px] border border-dashed border-line-strong" />
        </Rails>
      )}
      renderRow={(key, air) => {
        const row = byKey.get(key);
        const step = row ? findStep(steps, row.id) : undefined;
        if (!row || !step) return null;
        // In the air a row keeps the rails of the group travelling with it, and takes the
        // inset of where it would land in place of the rails of where it was.
        const held = air ? byKey.get(air.heldBy) : undefined;
        const rails = air
          ? { depth: air.landing + row.depth - (held?.depth ?? 0), clear: air.landing }
          : { depth: row.depth };
        return (
          <DepthContext.Provider value={row.depth}>
            {row.kind === 'step' && step.kind !== 'repeat' ? (
              <Rails {...rails}>
                <View className="pb-2">
                  <StepCard step={step} />
                </View>
              </Rails>
            ) : step.kind === 'repeat' ? (
              <Rails {...rails}>
                {row.kind === 'head' ? <RepeatHead step={step} /> : <RepeatFoot step={step} />}
              </Rails>
            ) : null}
          </DepthContext.Provider>
        );
      }}
    />
  );
}

/**
 * The ⋮ menu's moves as screen-reader actions on the card itself, so a step can be moved without
 * dragging: Options, Move up, Move down, Move into the repeat above or below, Move out, Delete.
 */
function useStepA11yActions(id: string) {
  const editor = useContext(EditorContext);
  if (!editor) return {};
  const { steps, actions } = editor;
  const moves = stepMoves(steps, id);
  const list: { name: string; label: string; run: () => void }[] = [
    { name: 'options', label: 'Options', run: () => editor.openMenu(id) },
  ];
  if (moves.up) list.push({ name: 'up', label: 'Move up', run: () => actions.move(id, -1) });
  if (moves.down) list.push({ name: 'down', label: 'Move down', run: () => actions.move(id, 1) });
  const { intoAbove, intoBelow } = moves;
  if (intoAbove)
    list.push({
      name: 'into-above',
      label: 'Move into repeat above',
      run: () => actions.moveInto(id, intoAbove.id),
    });
  if (intoBelow)
    list.push({
      name: 'into-below',
      label: 'Move into repeat below',
      run: () => actions.moveInto(id, intoBelow.id),
    });
  if (moves.out)
    list.push({ name: 'out', label: 'Move out of repeat', run: () => actions.moveOut(id) });
  list.push({ name: 'delete', label: 'Delete', run: () => actions.remove(id) });
  return {
    accessibilityActions: list.map(({ name, label }) => ({ name, label })),
    onAccessibilityAction: (event: AccessibilityActionEvent) =>
      list.find((a) => a.name === event.nativeEvent.actionName)?.run(),
  };
}

/**
 * When a drag last ended. Native cancels the press under a drag; a browser still delivers it
 * on release, and a step must not open its editor because it was just moved.
 */
let lastPressBlockedAt = 0;
const blockPress = () => {
  lastPressBlockedAt = Date.now();
};
const justDragged = () => Date.now() - lastPressBlockedAt < 400;

/** The card a step is drawn as: rail, name, length and grip. Also the ⋮ sheet's preview. */
export function StepFace({
  step,
  depth,
  board,
  open,
  trailing,
}: {
  step: EditableTimedStep;
  depth: number;
  board: Board | undefined;
  open?: boolean;
  trailing?: ReactNode;
}) {
  const look = stepLook(step, depth);
  // At large text sizes the length and grip wrap instead of being cut off.
  const lines = useLargeText() ? 2 : 1;
  return (
    <View
      className={cn(
        'min-h-[72px] flex-row items-center rounded-[24px] bg-surface pl-4',
        open ? 'border-[1.5px] border-text' : 'border border-line',
        trailing ? 'pr-3' : 'pr-4'
      )}>
      <View className={cn('h-9 w-1.5 rounded-full', RAIL[look])} />
      <View className="ml-3.5 flex-1 py-3">
        <Text className="type-row" numberOfLines={lines}>
          {step.label || TITLE[look]}
        </Text>
        <Text className="type-caption mt-0.5 text-muted" numberOfLines={lines}>
          {stepSub(step, look, board)}
        </Text>
      </View>
      {trailing}
    </View>
  );
}

function StepCard({ step }: { step: EditableTimedStep }) {
  const editor = useContext(EditorContext);
  const depth = useContext(DepthContext);
  const board = useContext(BoardContext);
  const expanded = editor?.expandedId === step.id;
  const look = stepLook(step, depth);
  const grip = gripWords(board, step);
  const label = `${step.label || TITLE[look]}, ${seconds(step.seconds)}${grip ? `, ${grip}` : ''}`;
  const a11y = useStepA11yActions(step.id);

  if (!editor) {
    return (
      <View accessible accessibilityLabel={label}>
        <StepFace step={step} depth={depth} board={board} />
      </View>
    );
  }
  return (
    <View className="gap-2">
      <DragHandle radius={24}>
        <View>
          <Pressable
            onPress={() => {
              if (!justDragged()) editor.setExpandedId(expanded ? null : step.id);
            }}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityHint="Opens its editor. Hold and drag to move it"
            accessibilityLabel={`Edit ${label}`}
            {...a11y}
            className="select-none active:opacity-80">
            <StepFace
              step={step}
              depth={depth}
              board={board}
              open={expanded}
              trailing={<View className="size-12" />}
            />
          </Pressable>
          {/* A sibling of the card, not inside it: one control per button. */}
          <View className="absolute right-3 top-3">
            <IconButton
              icon={DotsThreeVerticalIcon}
              variant="plain"
              label={`Options for ${step.label || TITLE[look]}`}
              onPress={() => editor.openMenu(step.id)}
            />
          </View>
        </View>
      </DragHandle>
      {expanded ? <StepEditor step={step} depth={depth} /> : null}
    </View>
  );
}

/** Inline editor under an open step (design: builder-step-open): kind, length, grip and label. */
function StepEditor({ step, depth }: { step: EditableTimedStep; depth: number }) {
  const { actions, openHoldPicker } = useContext(EditorContext)!;
  const board = useContext(BoardContext);
  const range = LIMITS.seconds[step.kind];
  const setKind = (kind: StepKind) => {
    const next = LIMITS.seconds[kind];
    actions.update(step.id, {
      kind,
      seconds: Math.min(next.max, Math.max(next.min, step.seconds)),
    });
  };
  // Rests between sets move in 10 s steps as m:ss; pauses between reps and hangs in seconds.
  const coarse = step.kind === 'rest' && depth < 2;
  const grip =
    board && step.kind === 'hang' && step.holds?.length ? gripName(board, step.holds) : '';

  return (
    <EditorReveal className="gap-4 rounded-[24px] border border-line bg-surface p-4">
      <Segmented
        options={KINDS.map((kind) => ({ value: kind, label: STEP_NAMES[kind] }))}
        value={step.kind}
        onChange={setKind}
      />
      <Stepper
        label="Length"
        value={step.seconds}
        onChange={(v) => actions.update(step.id, { seconds: v })}
        min={range.min}
        max={range.max}
        step={coarse ? 10 : 1}
        format={seconds}
        inputMode={coarse ? 'clock' : 'number'}
      />
      {board && step.kind === 'hang' ? (
        <Pressable
          onPress={() => openHoldPicker(step.id)}
          accessibilityRole="button"
          accessibilityLabel={grip ? `Grip: ${grip}` : 'Choose a grip'}
          accessibilityHint="Opens the board to choose holds"
          className="min-h-14 flex-row items-center gap-3 rounded-input border border-line bg-canvas px-3 py-2 active:opacity-80">
          <HangboardDiagram
            board={board.id}
            active={step.holds ?? []}
            width={80}
            strokeWidth={0.7}
          />
          <Text className="type-row flex-1" numberOfLines={2}>
            {grip ? shortGripName(grip) : 'Choose a grip'}
          </Text>
          <Icon as={CaretRightIcon} size={20} className="text-muted" />
        </Pressable>
      ) : null}
      <Field
        accessibilityLabel="Step label"
        value={step.label ?? ''}
        onChangeText={(text) => actions.update(step.id, { label: text || undefined })}
        placeholder="Label, e.g. 20 mm half crimp"
        autoCapitalize="sentences"
        returnKeyType="done"
      />
    </EditorReveal>
  );
}

/** A repeat in a read-only list: its count, then its steps one inset in along a rail. */
function RepeatGroup({ step }: { step: EditableRepeatStep }) {
  const depth = useContext(DepthContext);
  return (
    <View
      accessible={false}
      accessibilityLabel={`Repeat ${repeatWords(step.times, depth)}`}
      className="pb-1">
      <TrayLine className="bottom-2 top-11 rounded-full" />
      <View className="h-14 flex-row items-center gap-2.5 pl-[18px]">
        <Icon as={RepeatIcon} size={22} />
        <Text className="type-body-b">{repeatWords(step.times, depth)}</Text>
      </View>
      <View className="px-3">
        <StepList steps={step.steps} depth={depth + 1} />
      </View>
    </View>
  );
}

/** The top of a repeat in the builder: its count, its menu, and where the group is held. */
function RepeatHead({ step }: { step: EditableRepeatStep }) {
  const editor = useContext(EditorContext)!;
  const depth = useContext(DepthContext);
  const [editingCount, setEditingCount] = useState(false);
  const words = repeatWords(step.times, depth);
  const a11y = useStepA11yActions(step.id);
  return (
    <View>
      <TrayLine className="bottom-0 top-11 rounded-t-full" />
      <DragHandle radius={24}>
        <View className="h-14 select-none flex-row items-center pr-0">
          <Pressable
            onPress={() => {
              if (!justDragged()) setEditingCount((v) => !v);
            }}
            accessibilityRole="button"
            accessibilityState={{ expanded: editingCount }}
            accessibilityLabel={`Repeat, ${words}`}
            accessibilityHint="Changes the count. Hold and drag to move the group"
            {...a11y}
            className="h-14 flex-1 flex-row items-center gap-2.5 pl-[18px]">
            <Icon as={RepeatIcon} size={22} />
            <Text className="type-body-b">{words}</Text>
          </Pressable>
          <IconButton
            icon={DotsThreeVerticalIcon}
            variant="plain"
            label={`Options for the repeat, ${words}`}
            onPress={() => editor.openMenu(step.id)}
          />
        </View>
      </DragHandle>
      {editingCount ? (
        <EditorReveal className="gap-3 px-4 pb-4 pt-1">
          <Stepper
            label="Rounds"
            showLabel={false}
            value={step.times}
            onChange={(v) => editor.actions.update(step.id, { times: v })}
            min={LIMITS.times.min}
            max={LIMITS.times.max}
          />
          <Text className="type-caption ml-0.5 text-muted">
            {depth === 0
              ? 'Rounds of this repeat are its sets.'
              : 'Rounds inside a set are its reps.'}
          </Text>
        </EditorReveal>
      ) : null}
      {step.steps.length === 0 ? (
        <Text className="type-sub px-3 pb-2 text-muted">No steps yet.</Text>
      ) : null}
    </View>
  );
}

/**
 * The bottom of a repeat in the builder. The innermost repeat offers Add step here; a repeat
 * holding another adds through its ⋮ menu, which keeps the list from stacking buttons.
 */
function RepeatFoot({ step }: { step: EditableRepeatStep }) {
  const editor = useContext(EditorContext)!;
  const innermost = !step.steps.some((s) => s.kind === 'repeat');
  return (
    <View className="pb-2">
      <TrayLine className="bottom-2 top-0 rounded-b-full" />
      {innermost ? (
        <Button
          variant="ghost"
          size="sm"
          className="mx-3 mb-1"
          onPress={() => editor.openAdd(step.id)}>
          <Icon as={PlusIcon} size={18} />
          <Text>Add step</Text>
        </Button>
      ) : (
        <View className="h-1" />
      )}
    </View>
  );
}
