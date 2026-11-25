import { StarIcon } from 'phosphor-react-native/src/icons/Star';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Field } from '@/components/field';
import { Label } from '@/components/section-header';
import { Segmented } from '@/components/segmented';
import { Sheet } from '@/components/sheet';
import { Stepper } from '@/components/stepper';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Felt, LogEntry } from '@/lib/moonboard/types';
import { cn } from '@/lib/utils';

type Result = Pick<LogEntry, 'tries' | 'sent' | 'felt' | 'stars' | 'note'>;

type LogSendSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Goes already counted on the problem; prefills the tries. */
  tries: number;
  /** Opened from "Sent it": the answer starts at Sent. From "Log a go" it starts open. */
  sent?: boolean;
  onSave: (result: Result) => void;
};

/**
 * Log this go (design: climb-log-send): sent or not yet, the tries (prefilled from the counter),
 * how the grade felt and a rating, both optional, and a note. One tap to save after Sent it.
 */
export function LogSendSheet({ open, onClose, tries, sent = true, onSave }: LogSendSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Log this go">
      {/* Mounted with the sheet, so every opening starts from the counter again. */}
      <Form tries={tries} sent={sent} onSave={onSave} />
    </Sheet>
  );
}

function Form({
  tries,
  sent: sentFirst,
  onSave,
}: Pick<LogSendSheetProps, 'tries' | 'sent' | 'onSave'>) {
  const [sent, setSent] = useState<'sent' | 'not'>(sentFirst ? 'sent' : 'not');
  const [count, setCount] = useState(Math.max(1, tries));
  const [felt, setFelt] = useState<Felt | null>(null);
  const [stars, setStars] = useState<number | undefined>();
  const [note, setNote] = useState('');

  return (
    <>
      <Segmented
        height={56}
        options={[
          { value: 'sent', label: 'Sent' },
          { value: 'not', label: 'Not yet' },
        ]}
        value={sent}
        onChange={setSent}
      />
      <View className="gap-2.5">
        <Label>Tries</Label>
        <Stepper
          label="Tries"
          showLabel={false}
          value={count}
          onChange={setCount}
          min={1}
          max={99}
        />
      </View>
      <View className="gap-2.5">
        <Label>The grade felt</Label>
        <Segmented
          options={[
            { value: 'soft', label: 'Soft' },
            { value: 'fair', label: 'Fair' },
            { value: 'stiff', label: 'Stiff' },
          ]}
          value={felt}
          onChange={(value) => setFelt(value === felt ? null : value)}
        />
      </View>
      <View className="gap-2.5">
        <Label>Your rating · optional</Label>
        <View className="flex-row gap-3.5">
          {[1, 2, 3, 4, 5].map((n) => {
            const on = !!stars && n <= stars;
            return (
              <Pressable
                key={n}
                onPress={() => setStars(stars === n ? undefined : n)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${n} ${n === 1 ? 'star' : 'stars'}`}
                className="active:opacity-70">
                <Icon
                  as={StarIcon}
                  size={44}
                  weight={on ? 'fill' : 'regular'}
                  className={cn(on ? 'text-text' : 'text-muted2')}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
      <Field
        value={note}
        onChangeText={setNote}
        placeholder="Add a note"
        accessibilityLabel="Note"
      />
      <Button
        size="lg"
        onPress={() =>
          onSave({
            tries: count,
            sent: sent === 'sent',
            felt: felt ?? undefined,
            stars,
            note: note.trim() || undefined,
          })
        }>
        <Text>Save</Text>
      </Button>
    </>
  );
}
