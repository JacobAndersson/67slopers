import { ListRow } from '@/components/card';
import { BoardSprayIcon, HangboardIcon } from '@/components/training-icons';
import { sessionLine, sessionTitle } from '@/lib/copy';
import { formatTime } from '@/lib/dates';
import type { LogItem } from '@/lib/training-log';

/**
 * The one session row (Home, Log, Sessions; design/rivet/app/screens_log.py `log_row`): an icon
 * tile (Dusk for the board), the title, when and the result in words, a chevron.
 */
export function LogRow({
  item,
  dateStyle = 'relative',
  onPress,
}: {
  item: LogItem;
  /** "Yesterday" / "Mon", or the clock time for a list grouped by day. */
  dateStyle?: 'relative' | 'time';
  onPress?: () => void;
}) {
  const climb = item.kind === 'climb';
  return (
    <ListRow
      icon={climb ? BoardSprayIcon : HangboardIcon}
      board={climb}
      title={sessionTitle(item)}
      sub={sessionLine(item, new Date(), dateStyle === 'time' ? formatTime(item.at) : undefined)}
      chevron
      onPress={onPress}
    />
  );
}
