import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Field } from '@/components/field';
import { Screen } from '@/components/screen';
import { Label, LargeTitle } from '@/components/section-header';
import { Segmented } from '@/components/segmented';
import { SettingGroup, SettingRow } from '@/components/setting-row';
import { Stepper } from '@/components/stepper';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { getLayout } from '@/lib/moonboard/boards';
import { useClimb } from '@/lib/store/climb';
import { KIND_LABEL, formatAngle, newId } from '@/lib/wall-photos/meta';
import { getWall, saveWall } from '@/lib/wall-photos/storage';
import type { Wall, WallKind } from '@/lib/wall-photos/types';

const KINDS: WallKind[] = ['moonboard', 'board', 'gym'];

/**
 * Labels a wall before it is photographed: what it is and the angle it is said to be. The
 * measured angle is added on the wall's screen. `?id=` edits one.
 */
export default function NewWallScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const setup = useClimb((s) => s.setup);
  const [initial] = useState(() => (id ? getWall(id) : null));

  const [kind, setKind] = useState<WallKind>(initial?.kind ?? (setup ? 'moonboard' : 'gym'));
  const [name, setName] = useState(
    initial?.name ?? (setup ? `${getLayout(setup.layout).name} ${setup.angle}°` : '')
  );
  const [angle, setAngle] = useState(initial?.statedAngle ?? setup?.angle ?? 30);
  const [angleKnown, setAngleKnown] = useState(initial ? initial.statedAngle !== null : true);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  const onSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give the wall a name.');
      return;
    }
    const wall: Wall = {
      id: initial?.id ?? newId(),
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      name: trimmed,
      kind,
      board: kind === 'moonboard' && setup ? { layout: setup.layout, angle: setup.angle } : null,
      statedAngle: angleKnown ? angle : null,
      measured: initial?.measured ?? null,
      notes: notes.trim(),
    };
    saveWall(wall);
    if (initial) router.back();
    else router.replace({ pathname: '/walls/[id]', params: { id: wall.id } });
  };

  return (
    <Screen
      header={<TopBar left={initial ? 'close' : 'back'} />}
      contentClassName="gap-7"
      footer={
        <Button size="lg" onPress={onSave}>
          <Text>{initial ? 'Save' : 'Next'}</Text>
        </Button>
      }>
      <LargeTitle title={initial ? 'Edit wall' : 'New wall'} />

      <View className="gap-3">
        <Label>What it is</Label>
        <Segmented
          options={KINDS.map((value) => ({ value, label: KIND_LABEL[value] }))}
          value={kind}
          onChange={setKind}
        />
      </View>

      <Field
        label="Name"
        value={name}
        onChangeText={(text) => {
          setName(text);
          setError(null);
        }}
        placeholder="Cave, left side"
        error={error}
        returnKeyType="done"
      />

      <View className="gap-4">
        <SettingGroup title="Angle">
          <SettingRow
            title="I know the angle"
            description="As the gym or the board says"
            checked={angleKnown}
            onCheckedChange={setAngleKnown}
          />
        </SettingGroup>
        {angleKnown ? (
          <Stepper
            label="Angle past vertical"
            value={angle}
            onChange={setAngle}
            min={-30}
            max={90}
            step={5}
            format={(v) => formatAngle(v)}
            hint="Negative for a slab."
          />
        ) : null}
      </View>

      <Field
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Lighting, volumes, anything unusual"
        multiline
      />
    </Screen>
  );
}
