import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';

export function SessionNote({
  value,
  onSave,
}: {
  value?: string;
  onSave: (note: string | undefined) => void;
}) {
  const [note, setNote] = useState(value ?? '');
  const dirty = note.trim() !== (value ?? '');
  return (
    <View className="gap-3">
      <Label nativeID="session-note">Session note</Label>
      <Textarea
        aria-labelledby="session-note"
        value={note}
        onChangeText={setNote}
        placeholder="How did it go? Holds, load, or something to remember."
        numberOfLines={3}
      />
      <Button
        variant="outline"
        className="self-start"
        disabled={!dirty}
        onPress={() => onSave(note.trim() || undefined)}>
        <Text>Save note</Text>
      </Button>
    </View>
  );
}
