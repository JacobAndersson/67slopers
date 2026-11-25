import { router } from 'expo-router';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { View } from 'react-native';

import { Screen } from '@/components/screen';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

/**
 * The states nobody hopes to see (design: share-missing-workout, -missing-session, -bad-code,
 * -newer): an icon on an 80 pt Raised tile, a plain sentence set large, what to do, one quiet way
 * out.
 */
export function MissingScreen({
  icon,
  title,
  body,
  action = 'Back to home',
  onAction = () => router.dismissTo('/'),
  slashed,
}: {
  icon: PhosphorIcon;
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
  /** Strike the icon through (a code that isn't ours). */
  slashed?: boolean;
}) {
  return (
    <Screen
      header={<TopBar />}
      contentClassName="gap-0"
      footer={
        <Button size="lg" variant="outline" onPress={onAction}>
          <Text>{action}</Text>
        </Button>
      }>
      <View className="mt-24 size-20 items-center justify-center rounded-[26px] bg-raised">
        <Icon as={icon} size={36} />
        {slashed ? (
          <View
            className="absolute h-[3px] w-[52px] rounded-full bg-text"
            style={{
              transform: [{ rotate: '-45deg' }],
              borderWidth: 2,
              borderColor: 'transparent',
            }}
          />
        ) : null}
      </View>
      <Text className="type-hero mt-8" role="heading">
        {title}
      </Text>
      <Text className="type-body mt-3 text-muted">{body}</Text>
    </Screen>
  );
}
