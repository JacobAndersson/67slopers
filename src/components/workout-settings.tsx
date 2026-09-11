import { Settings2Icon } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useStore } from '@/lib/store/store';

export function WorkoutSettings() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" accessibilityLabel="Workout settings">
          <Icon as={Settings2Icon} className="size-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuCheckboxItem
          className="min-h-12"
          checked={settings.sound}
          onCheckedChange={(sound) => setSettings({ sound })}>
          <Text>Sound</Text>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          className="min-h-12"
          checked={settings.vibration}
          onCheckedChange={(vibration) => setSettings({ vibration })}>
          <Text>Vibration</Text>
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          className="min-h-12"
          checked={settings.genZMode}
          onCheckedChange={(genZMode) => setSettings({ genZMode })}>
          <Text>Gen Z mode</Text>
        </DropdownMenuCheckboxItem>
        {settings.genZMode ? (
          <DropdownMenuLabel>
            <Text className="text-xs text-muted-foreground">Gameplay: OrbitalNCG+</Text>
          </DropdownMenuLabel>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
