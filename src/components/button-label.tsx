import type { ReactNode } from 'react';

import { Text } from '@/components/ui/text';

/**
 * The label of a large button. One line that shrinks to fit: a tall button beside another
 * must not wrap its label when the system font is set large.
 */
export function ButtonLabel({ children }: { children: ReactNode }) {
  return (
    <Text className="text-lg" numberOfLines={1} adjustsFontSizeToFit>
      {children}
    </Text>
  );
}
