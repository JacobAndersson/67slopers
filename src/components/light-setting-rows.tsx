import { SettingRow } from '@/components/setting-row';
import { useClimb } from '@/lib/store/climb';

/** The two things the lights can be told: also light above each hold, and follow browsing. */
export function LightSettingRows() {
  const lights = useClimb((s) => s.lights);
  const setLights = useClimb((s) => s.setLights);
  return [
    <SettingRow
      key="above"
      title="Light above holds too"
      description="LED kit V2 and newer"
      checked={lights.above}
      onCheckedChange={(above) => setLights({ above })}
    />,
    <SettingRow
      key="browse"
      title="Light as I browse"
      description={
        lights.browse ? 'Swiping problems changes the wall' : 'Off: the wall waits for Light up'
      }
      checked={lights.browse}
      onCheckedChange={(browse) => setLights({ browse })}
    />,
  ];
}
