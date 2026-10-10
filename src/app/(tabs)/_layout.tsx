import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';

import { DOCK_TABS, Dock } from '@/components/dock';

/** The five dock-level places. Everything else is pushed on the root stack, above the dock. */
export default function TabsLayout() {
  return (
    <Tabs>
      <TabSlot />
      <Dock />
      <TabList style={{ display: 'none' }}>
        {DOCK_TABS.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} />
        ))}
      </TabList>
    </Tabs>
  );
}
