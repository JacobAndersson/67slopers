import { SettingGroup, SettingRow } from '@/components/setting-row';
import { useClimb } from '@/lib/store/climb';

/**
 * What the lights can be told (design: climb-lights, climb-connect-done): also light above each
 * hold, follow browsing, and connect by themselves when Climb opens.
 */
export function LightSettings({ className }: { className?: string }) {
  const lights = useClimb((s) => s.lights);
  const setLights = useClimb((s) => s.setLights);
  return (
    <SettingGroup className={className}>
      <SettingRow
        title="Light above holds too"
        description="LED kit V2 and newer"
        checked={lights.above}
        onCheckedChange={(above) => setLights({ above })}
      />
      <SettingRow
        title="Light as I browse"
        description={
          lights.browse
            ? 'Swiping problems changes the wall'
            : 'Off: the wall waits for Light it up'
        }
        checked={lights.browse}
        onCheckedChange={(browse) => setLights({ browse })}
      />
      <SettingRow
        title="Connect automatically"
        description="When Climb opens near the board"
        checked={lights.autoConnect}
        onCheckedChange={(autoConnect) => setLights({ autoConnect })}
      />
    </SettingGroup>
  );
}
