import {
  ChevronDownIcon,
  EllipsisVerticalIcon,
  GripVerticalIcon,
  RepeatIcon,
} from 'lucide-react-native';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Sortable from 'react-native-sortables';

import { BoardView } from '@/components/board-view';
import { useScreenScroll } from '@/components/screen';
import { Stepper } from '@/components/stepper';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { gripName, type Board } from '@/lib/boards';
import { formatShort } from '@/lib/dates';
import type { StepKind } from '@/lib/store/types';
import { cn } from '@/lib/utils';
import {
  canNest,
  LIMITS,
  parentOf,
  STEP_NAMES,
  stripIds,
  type EditableRepeatStep,
  type EditableStep,
  type EditableTimedStep,
  type StepPatch,
} from '@/lib/workout-steps';
import { summaryLine } from '@/lib/workout-summary';

/** Which list is being reordered: `null` is the root list, a repeat id is that repeat's steps. */
export type ReorderTarget = null | string;

export type StepListActions = {
  update: (id: string, patch: StepPatch) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  move: (id: string, direction: -1 | 1) => void;
  moveOut: (id: string) => void;
  moveInto: (id: string, repeatId: string) => void;
  addStep: (parentId: string | null) => void;
  addRepeat: (parentId: string | null) => void;
  reorder: (parentId: string | null, ids: string[]) => void;
};

type EditorState = {
  steps: EditableStep[];
  actions: StepListActions;
  /** Opens the hold picker for a hang step; only offered when the workout has a board. */
  openHoldPicker: (stepId: string) => void;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  /** `undefined` when nothing is being reordered. */
  reorderTarget: ReorderTarget | undefined;
  setReorderTarget: (target: ReorderTarget | undefined) => void;
};

/** Absent below a read-only list; present in the builder. */
const EditorContext = createContext<EditorState | null>(null);

/** The workout's board, so hang cards can show their holds. Provided by the builder and overview. */
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

const BAR: Record<StepKind | 'repeat', string> = {
  prep: 'bg-accent',
  hang: 'bg-primary',
  rest: 'bg-muted-foreground',
  repeat: 'bg-chart-3',
};

const KINDS: StepKind[] = ['prep', 'hang', 'rest'];
/** Short names for the kind toggle, where "Get ready" would wrap. */
const KIND_SHORT: Record<StepKind, string> = { prep: 'Prep', hang: 'Hang', rest: 'Rest' };

const duration = (step: EditableTimedStep) => formatShort(step.seconds);

type StepListProps = {
  steps: EditableStep[];
  /** The repeat these steps belong to, `null` for the workout's top level. */
  parentId: string | null;
  depth: number;
};

/** Renders steps and repeat groups; without an editor provider it is read-only. */
export function StepList({ steps, parentId, depth }: StepListProps) {
  const editor = useContext(EditorContext);
  const screen = useScreenScroll();
  const reordering = editor !== null && editor.reorderTarget === parentId;

  const renderItem = useCallback(
    ({ item }: { item: EditableStep }) => <ReorderRow step={item} />,
    []
  );

  if (steps.length === 0) {
    return <Text variant="muted">No steps yet.</Text>;
  }

  if (reordering) {
    return (
      <Sortable.Grid
        columns={1}
        rowGap={12}
        data={steps}
        renderItem={renderItem}
        customHandle
        {...(screen ? { scrollableRef: screen.scrollableRef } : {})}
        onDragEnd={({ data }) =>
          editor.actions.reorder(
            parentId,
            data.map((s) => s.id)
          )
        }
      />
    );
  }

  return (
    <View className="gap-3">
      {steps.map((step) =>
        step.kind === 'repeat' ? (
          <RepeatGroup key={step.id} step={step} depth={depth} />
        ) : (
          <StepCard key={step.id} step={step} depth={depth} />
        )
      )}
    </View>
  );
}

/** Compact draggable row used while reordering; repeats travel as one unit. */
function ReorderRow({ step }: { step: EditableStep }) {
  const title = step.kind === 'repeat' ? 'Repeat' : step.label || STEP_NAMES[step.kind];
  const subtitle =
    step.kind === 'repeat' ? summaryLine({ steps: stripIds([step]) }) : duration(step);
  return (
    <View className="flex-row items-center overflow-hidden rounded-lg border border-border bg-card">
      <View className={cn('w-1.5 self-stretch', BAR[step.kind])} />
      <View className="flex-1 gap-0.5 px-3 py-3">
        <Text className="font-medium">{title}</Text>
        <Text variant="muted" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Sortable.Handle>
        <View
          className="h-full items-center justify-center px-4"
          accessibilityLabel="Drag to reorder">
          <Icon as={GripVerticalIcon} className="size-5 text-muted-foreground" />
        </View>
      </Sortable.Handle>
    </View>
  );
}

function StepCard({ step, depth }: { step: EditableTimedStep; depth: number }) {
  const editor = useContext(EditorContext);
  const board = useContext(BoardContext);
  const expanded = editor?.expandedId === step.id;
  const title = step.label || STEP_NAMES[step.kind];
  const grip = board && step.kind === 'hang' ? gripName(board, step.holds) : '';
  const subtitle = [step.label ? STEP_NAMES[step.kind] : null, duration(step), grip || null]
    .filter(Boolean)
    .join(' · ');
  const showBoard = board && step.kind === 'hang';

  return (
    <View className="gap-2">
      <Pressable
        disabled={!editor}
        onPress={() => editor?.setExpandedId(expanded ? null : step.id)}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${duration(step)}${grip ? `, ${grip}` : ''}`}
        className={cn(
          'flex-row overflow-hidden rounded-lg border bg-card',
          expanded ? 'border-foreground' : 'border-border',
          editor && 'active:bg-muted'
        )}>
        <View className={cn('w-1.5', BAR[step.kind])} />
        <View className="flex-1 gap-0.5 px-3 py-3">
          <Text className="font-medium">{title}</Text>
          <Text variant="muted">{subtitle}</Text>
        </View>
        {showBoard ? <HoldThumb board={board} step={step} /> : null}
        {editor ? <StepMenu step={step} /> : null}
      </Pressable>
      {expanded && editor ? <StepEditor step={step} depth={depth} /> : null}
    </View>
  );
}

/** Small board on a hang card: the step's grip, or a placeholder inviting a choice. */
function HoldThumb({ board, step }: { board: Board; step: EditableTimedStep }) {
  const editor = useContext(EditorContext);
  const content = step.holds?.length ? (
    <BoardView board={board} holds={step.holds} className="rounded-sm" />
  ) : (
    <View className="w-full items-center justify-center rounded-sm border border-dashed border-border py-1.5">
      <Text variant="small" className="text-xs text-muted-foreground" numberOfLines={1}>
        {editor ? 'Pick holds' : 'Any holds'}
      </Text>
    </View>
  );
  if (!editor) return <View className="w-24 justify-center py-2">{content}</View>;
  return (
    <Pressable
      onPress={() => editor.openHoldPicker(step.id)}
      accessibilityRole="button"
      accessibilityLabel="Choose holds"
      className="w-24 justify-center py-2 active:opacity-70">
      {content}
    </Pressable>
  );
}

/** Inline editor under an expanded step: kind, length, holds and label. */
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

  return (
    <View className="gap-3 rounded-lg border border-border bg-muted p-3">
      <ToggleGroup
        type="single"
        variant="outline"
        value={step.kind}
        onValueChange={(v) => {
          if (v) setKind(v as StepKind);
        }}
        className="w-full">
        {KINDS.map((kind, i) => (
          <ToggleGroupItem
            key={kind}
            value={kind}
            isFirst={i === 0}
            isLast={i === KINDS.length - 1}
            className="flex-1">
            <Text>{KIND_SHORT[kind]}</Text>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Stepper
        label="Length"
        value={step.seconds}
        onChange={(v) => actions.update(step.id, { seconds: v })}
        min={range.min}
        max={range.max}
        step={coarse ? 10 : 1}
        format={formatShort}
        inputMode={coarse ? 'clock' : 'number'}
      />
      {board && step.kind === 'hang' ? (
        <Pressable
          onPress={() => openHoldPicker(step.id)}
          accessibilityRole="button"
          className="flex-row items-center gap-3 rounded-md border border-border bg-background px-3 py-2 active:bg-accent">
          <View className="w-28">
            <BoardView board={board} holds={step.holds ?? []} className="rounded-sm" />
          </View>
          <View className="flex-1">
            <Text className="font-medium">
              {step.holds?.length ? gripName(board, step.holds) : 'Choose holds'}
            </Text>
            <Text variant="muted">{board.name}</Text>
          </View>
          <Icon as={ChevronDownIcon} className="size-4 -rotate-90 text-muted-foreground" />
        </Pressable>
      ) : null}
      <Input
        value={step.label ?? ''}
        onChangeText={(text) => actions.update(step.id, { label: text || undefined })}
        placeholder="Label, e.g. 20 mm half crimp"
        autoCapitalize="sentences"
        returnKeyType="done"
      />
    </View>
  );
}

function RepeatGroup({ step, depth }: { step: EditableRepeatStep; depth: number }) {
  const editor = useContext(EditorContext);
  const [editingCount, setEditingCount] = useState(false);
  const reorderingHere = editor?.reorderTarget === step.id;
  const lastIsRest = step.steps.at(-1)?.kind === 'rest';

  return (
    <View className="rounded-lg border-2 border-border">
      <View className="flex-row items-center py-1 pl-3 pr-1">
        <Pressable
          disabled={!editor}
          onPress={() => setEditingCount((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={`Repeat ${step.times} times`}
          className="flex-1 flex-row items-center gap-2 py-2">
          <Icon as={RepeatIcon} className="size-5 text-muted-foreground" />
          <Text className="text-lg font-semibold">
            {step.times} {step.times === 1 ? 'time' : 'times'}
          </Text>
          {editor ? (
            <Icon
              as={ChevronDownIcon}
              className="size-4 text-muted-foreground"
              style={{ transform: [{ rotate: editingCount ? '180deg' : '0deg' }] }}
            />
          ) : null}
        </Pressable>
        {editor ? (
          reorderingHere ? (
            <Button variant="ghost" size="sm" onPress={() => editor.setReorderTarget(undefined)}>
              <Text>Done</Text>
            </Button>
          ) : (
            <StepMenu step={step} />
          )
        ) : null}
      </View>

      {editingCount && editor ? (
        <View className="px-3 pb-2">
          <Stepper
            label="Rounds"
            value={step.times}
            onChange={(v) => editor.actions.update(step.id, { times: v })}
            min={LIMITS.times.min}
            max={LIMITS.times.max}
          />
        </View>
      ) : null}

      <View className="px-3 pb-3">
        <StepList steps={step.steps} parentId={step.id} depth={depth + 1} />
      </View>

      {lastIsRest ? (
        <View className="flex-row items-center justify-between border-t border-border px-3 py-2">
          <Text variant="muted">Skip last rest</Text>
          {editor ? (
            <Switch
              checked={step.skipLastRest}
              onCheckedChange={(v) => editor.actions.update(step.id, { skipLastRest: v })}
            />
          ) : (
            <Text variant="muted">{step.skipLastRest ? 'On' : 'Off'}</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

/** The ⋮ menu on a step or repeat. Hidden while any list is being reordered. */
function StepMenu({ step }: { step: EditableStep }) {
  const editor = useContext(EditorContext)!;
  const { steps, actions } = editor;
  if (editor.reorderTarget !== undefined) return null;

  const parent = parentOf(steps, step.id);
  const siblings = parent ? parent.steps : steps;
  const index = siblings.findIndex((s) => s.id === step.id);
  const above = siblings[index - 1];
  const below = siblings[index + 1];
  const intoAbove = above?.kind === 'repeat' && canNest(steps, above.id, step) ? above : null;
  const intoBelow = below?.kind === 'repeat' && canNest(steps, below.id, step) ? below : null;
  const canAddRepeat =
    step.kind === 'repeat' &&
    canNest(steps, step.id, { kind: 'repeat', times: 1, skipLastRest: true, steps: [] });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" accessibilityLabel="Step options">
          <Icon as={EllipsisVerticalIcon} className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        {step.kind === 'repeat' ? (
          <>
            <DropdownMenuItem onPress={() => actions.addStep(step.id)}>
              <Text>Add step</Text>
            </DropdownMenuItem>
            {canAddRepeat ? (
              <DropdownMenuItem onPress={() => actions.addRepeat(step.id)}>
                <Text>Add repeat</Text>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              disabled={step.steps.length < 2}
              onPress={() => editor.setReorderTarget(step.id)}>
              <Text>Reorder steps</Text>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem onPress={() => actions.duplicate(step.id)}>
          <Text>Duplicate</Text>
        </DropdownMenuItem>
        <DropdownMenuItem disabled={index <= 0} onPress={() => actions.move(step.id, -1)}>
          <Text>Move up</Text>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={index >= siblings.length - 1}
          onPress={() => actions.move(step.id, 1)}>
          <Text>Move down</Text>
        </DropdownMenuItem>
        {intoAbove ? (
          <DropdownMenuItem onPress={() => actions.moveInto(step.id, intoAbove.id)}>
            <Text>Move into repeat above</Text>
          </DropdownMenuItem>
        ) : null}
        {intoBelow ? (
          <DropdownMenuItem onPress={() => actions.moveInto(step.id, intoBelow.id)}>
            <Text>Move into repeat below</Text>
          </DropdownMenuItem>
        ) : null}
        {parent ? (
          <DropdownMenuItem onPress={() => actions.moveOut(step.id)}>
            <Text>Move out of repeat</Text>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onPress={() => actions.remove(step.id)}>
          <Text>{step.kind === 'repeat' ? 'Delete repeat' : 'Delete step'}</Text>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
