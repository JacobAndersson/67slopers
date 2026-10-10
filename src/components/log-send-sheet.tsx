import { StarIcon } from 'phosphor-react-native/src/icons/Star';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { ButtonLabel } from '@/components/button-label';
import { Segmented } from '@/components/segmented';
import { Sheet } from '@/components/sheet';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import type { Felt, LogEntry } from '@/lib/moonboard/types';

type Result = Pick<LogEntry, 'tries' | 'sent' | 'felt' | 'stars' | 'note'>;

type LogSendSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Goes already counted on the problem; preselects the answer. */
  tries: number;
  onSave: (result: Result) => void;
};

const TRIES = ['Flash', '2', '3', '4+'] as const;

/**
 * Logging a send takes one tap when the counter was used: tries are prefilled and everything
 * else is optional. The same sheet logs a visit that did not end in a send.
 */
export function LogSendSheet({ open, onClose, tries, onSave }: LogSendSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Sent! How did it go?">
      {/* Mounted with the sheet, so every opening starts from the counter again. */}
      <Form tries={tries} onSave={onSave} />
    </Sheet>
  );
}

function Form({ tries, onSave }: Pick<LogSendSheetProps, 'tries' | 'onSave'>) {
  const [choice, setChoice] = useState<(typeof TRIES)[number]>(
    TRIES[Math.min(3, Math.max(0, tries - 1))]
  );
  const [felt, setFelt] = useState<Felt | undefined>();
  const [stars, setStars] = useState<number | undefined>();
  const [note, setNote] = useState('');

  const count = choice === '4+' ? Math.max(4, tries) : TRIES.indexOf(choice) + 1;
  const save = (sent: boolean) =>
    onSave({
      tries: sent ? count : Math.max(1, tries),
      sent,
      felt,
      stars,
      note: note.trim() || undefined,
    });

  return (
    <>
      <View className="gap-2">
        <Text variant="muted">Tries</Text>
        <Segmented
          options={TRIES.map((value) => ({ value, label: value }))}
          value={choice}
          onChange={setChoice}
        />
      </View>
      <View className="gap-2">
        <Text variant="muted">The grade felt</Text>
        <Segmented
          options={[
            { value: 'soft', label: 'Soft' },
            { value: 'fair', label: 'Fair' },
            { value: 'stiff', label: 'Stiff' },
          ]}
          value={felt ?? ('' as Felt)}
          onChange={(value) => setFelt(value === felt ? undefined : value)}
        />
      </View>
      <View className="gap-2">
        <Text variant="muted">Your rating</Text>
        <View className="flex-row gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              onPress={() => setStars(stars === n ? undefined : n)}
              accessibilityRole="button"
              accessibilityLabel={`${n} ${n === 1 ? 'star' : 'stars'}`}
              hitSlop={4}>
              <Icon
                as={StarIcon}
                size={32}
                weight={stars && n <= stars ? 'fill' : 'regular'}
                className={stars && n <= stars ? 'text-ring' : 'text-border'}
              />
            </Pressable>
          ))}
        </View>
      </View>
      <Input
        value={note}
        onChangeText={setNote}
        placeholder="Add a note"
        className="h-12 sm:h-12"
      />
      <View className="gap-2">
        <Button size="lg" onPress={() => save(true)}>
          <ButtonLabel>Save send</ButtonLabel>
        </Button>
        <Button variant="ghost" onPress={() => save(false)}>
          <Text>Not sent this time</Text>
        </Button>
      </View>
    </>
  );
}
