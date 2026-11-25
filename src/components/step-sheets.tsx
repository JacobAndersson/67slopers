import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { ArrowDownIcon } from 'phosphor-react-native/src/icons/ArrowDown';
import { ArrowElbowLeftUpIcon } from 'phosphor-react-native/src/icons/ArrowElbowLeftUp';
import { ArrowSquareInIcon } from 'phosphor-react-native/src/icons/ArrowSquareIn';
import { ArrowUpIcon } from 'phosphor-react-native/src/icons/ArrowUp';
import { CopyIcon } from 'phosphor-react-native/src/icons/Copy';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { RepeatIcon } from 'phosphor-react-native/src/icons/Repeat';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Sheet } from '@/components/sheet';
import { RAIL, StepFace, repeatWords, type StepListActions } from '@/components/step-list';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Board } from '@/lib/boards';
import type { StepKind } from '@/lib/store/types';
import { cn } from '@/lib/utils';
import { canNest, depthOf, findStep, stepMoves, type EditableStep } from '@/lib/workout-steps';

type Item = { icon: PhosphorIcon; label: string; onPress: () => void; disabled?: boolean };

function MenuRow({ item, last }: { item: Item; last?: boolean }) {
  return (
    <Pressable
      disabled={item.disabled}
      onPress={item.onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!item.disabled }}
      className="h-[52px] flex-row items-center active:opacity-70">
      <Icon as={item.icon} size={24} className={item.disabled ? 'text-muted' : 'text-text'} />
      <View className={cn('ml-4 h-full flex-1 justify-center', !last && 'border-b border-line')}>
        <Text className={cn('type-body-b', item.disabled && 'text-muted')}>{item.label}</Text>
      </View>
    </Pressable>
  );
}

/**
 * The ⋮ sheet on a step or repeat (design: builder-menu): every move the drag can do, for screen
 * readers and switch control too. Moves that cannot happen here stay, muted. Delete is set apart
 * by space, never by colour.
 */
export function StepMenuSheet({
  stepId,
  steps,
  board,
  actions,
  onClose,
}: {
  stepId: string | null;
  steps: EditableStep[];
  board: Board | undefined;
  actions: StepListActions;
  onClose: () => void;
}) {
  // Keep the last step while the sheet slides away.
  const [kept, setKept] = useState(stepId);
  if (stepId && stepId !== kept) setKept(stepId);
  const id = stepId ?? kept;
  const step = id ? findStep(steps, id) : undefined;

  let body = null;
  if (step) {
    const moves = stepMoves(steps, step.id);
    const { intoAbove, intoBelow } = moves;
    const depth = depthOf(steps, step.id);
    const run = (fn: () => void) => () => {
      fn();
      onClose();
    };
    const items: Item[] = [];
    if (step.kind === 'repeat') {
      items.push({
        icon: PlusIcon,
        label: 'Add step',
        onPress: run(() => actions.addStep(step.id)),
      });
      if (canNest(steps, step.id, { kind: 'repeat', times: 1, steps: [] }))
        items.push({
          icon: RepeatIcon,
          label: 'Add repeat',
          onPress: run(() => actions.addRepeat(step.id)),
        });
    }
    items.push(
      { icon: CopyIcon, label: 'Duplicate', onPress: run(() => actions.duplicate(step.id)) },
      {
        icon: ArrowUpIcon,
        label: 'Move up',
        disabled: !moves.up,
        onPress: run(() => actions.move(step.id, -1)),
      },
      {
        icon: ArrowDownIcon,
        label: 'Move down',
        disabled: !moves.down,
        onPress: run(() => actions.move(step.id, 1)),
      },
      {
        icon: ArrowSquareInIcon,
        label: 'Move into repeat above',
        disabled: !intoAbove,
        onPress: run(() => intoAbove && actions.moveInto(step.id, intoAbove.id)),
      }
    );
    if (intoBelow)
      items.push({
        icon: ArrowSquareInIcon,
        label: 'Move into repeat below',
        onPress: run(() => actions.moveInto(step.id, intoBelow.id)),
      });
    items.push({
      icon: ArrowElbowLeftUpIcon,
      label: 'Move out of repeat',
      disabled: !moves.out,
      onPress: run(() => actions.moveOut(step.id)),
    });

    body = (
      <>
        {step.kind === 'repeat' ? (
          <View className="h-[72px] flex-row items-center gap-2.5 rounded-[24px] border border-line bg-surface pl-[18px]">
            <Icon as={RepeatIcon} size={22} />
            <Text className="type-body-b">Repeat, {repeatWords(step.times, depth)}</Text>
          </View>
        ) : (
          <StepFace step={step} depth={depth} board={board} />
        )}
        <View>
          {items.map((item, i) => (
            <MenuRow key={item.label} item={item} />
          ))}
        </View>
        {/* Delete stands apart: a hairline and a little space, never a colour. */}
        <MenuRow
          item={{
            icon: TrashIcon,
            label: step.kind === 'repeat' ? 'Delete repeat' : 'Delete step',
            onPress: run(() => actions.remove(step.id)),
          }}
          last
        />
        <Button size="lg" variant="outline" onPress={onClose}>
          <Text>Cancel</Text>
        </Button>
      </>
    );
  }

  return (
    <Sheet open={!!stepId} onClose={onClose}>
      {body}
    </Sheet>
  );
}

const ADD: { kind: StepKind; title: string; sub: string }[] = [
  { kind: 'prep', title: 'Get ready', sub: 'A countdown before the first hang' },
  { kind: 'hang', title: 'Hang', sub: 'Time on the board' },
  { kind: 'rest', title: 'Rest', sub: 'Between hangs, or between sets' },
];

/** "Add a step" (design: builder-add): the three kinds, each with its rail. */
export function AddStepSheet({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (kind: StepKind) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Add a step">
      <View className="gap-3 pb-4">
        {ADD.map((option) => (
          <Pressable
            key={option.kind}
            onPress={() => {
              onAdd(option.kind);
              onClose();
            }}
            accessibilityRole="button"
            accessibilityLabel={`Add ${option.title}`}
            accessibilityHint={option.sub}
            className="h-[72px] flex-row items-center rounded-[24px] border border-line bg-canvas pl-4 pr-4 active:opacity-80">
            <View className={cn('h-9 w-1.5 rounded-full', RAIL[option.kind])} />
            <View className="ml-3.5 flex-1">
              <Text className="type-body-b">{option.title}</Text>
              <Text className="type-caption mt-0.5 text-muted">{option.sub}</Text>
            </View>
            <Icon as={PlusIcon} size={22} />
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}
