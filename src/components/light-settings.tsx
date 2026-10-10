import type { ReactNode } from 'react';

import { SettingGroup, SettingRow } from '@/components/setting-row';
import { useClimb } from '@/lib/store/climb';

/**
 * The two things the lights can be told: also light above each hold, and follow browsing.
 * More rows can be passed in to sit in the same card.
 */
export function LightSettings({ children }: { children?: ReactNode }) {
  const lights = useClimb((s) => s.lights);
  const setLights = useClimb((s) => s.setLights);
  return (
    <SettingGroup>
      <SettingRow
        title="Light above holds too"
        description="LED kit V2 and newer"
        checked={lights.above}
        onCheckedChange={(above) => setLights({ above })}
      />
      <SettingRow
        title="Light as I browse"
        description={
          lights.browse ? 'Swiping problems changes the wall' : 'Off: the wall waits for Light up'
        }
        checked={lights.browse}
        onCheckedChange={(browse) => setLights({ browse })}
      />
      {children}
    </SettingGroup>
  );
}
