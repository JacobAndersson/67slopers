import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { View } from 'react-native';

import { Sheet } from '@/components/sheet';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

type Action = { label: string; onPress: () => void; icon?: PhosphorIcon };

/**
 * Every confirmation is a bottom sheet (design/rivet/app/ui.py `dialog`): the buttons in the
 * thumb third, the safe choice first and solid, the destructive one the hairline pill with its
 * icon. Never red.
 */
export function ConfirmSheet({
  open,
  onClose,
  title,
  body,
  safe,
  destructive,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body?: string;
  /** The solid pill: keep, cancel, carry on. */
  safe: Action;
  /** The hairline pill under it: delete, discard, end. A trash icon unless another is given. */
  destructive: Action & { plain?: boolean };
}) {
  const destructiveIcon = destructive.plain ? undefined : (destructive.icon ?? TrashIcon);
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {body ? <Text className="type-body -mt-1 text-muted">{body}</Text> : null}
      <View className="gap-3 pt-1">
        <Button size="lg" onPress={safe.onPress}>
          {safe.icon ? (
            <Icon as={safe.icon} weight="fill" size={20} className="text-on-action" />
          ) : null}
          <Text>{safe.label}</Text>
        </Button>
        <Button size="lg" variant="outline" onPress={destructive.onPress}>
          {destructiveIcon ? <Icon as={destructiveIcon} size={20} /> : null}
          <Text>{destructive.label}</Text>
        </Button>
      </View>
    </Sheet>
  );
}
