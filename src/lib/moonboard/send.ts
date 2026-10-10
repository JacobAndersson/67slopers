import { CHUNK_GAP_MS, chunks } from './protocol';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Sends one message in BLE-sized writes with a short pause between them. Calls made while
 * another message is going out wait their turn, and only the newest waiting one is sent:
 * the wall shows one problem, so the ones in between do not matter.
 */
export function createSender(
  write: (chunk: string) => Promise<void>,
  gapMs = CHUNK_GAP_MS,
  /** Called when a write is refused: the link is gone even if nothing has said so yet. */
  onFailure?: () => void
) {
  let busy = false;
  let waiting: { message: string; done: (sent: boolean) => void } | null = null;

  async function run(message: string): Promise<boolean> {
    busy = true;
    let ok = true;
    try {
      const parts = chunks(message);
      for (let i = 0; i < parts.length; i += 1) {
        await write(parts[i]);
        if (i < parts.length - 1 && gapMs > 0) await wait(gapMs);
      }
    } catch {
      ok = false;
      onFailure?.();
    }
    busy = false;
    const next = waiting;
    waiting = null;
    if (next) run(next.message).then(next.done);
    return ok;
  }

  /** Resolves true once the message is on its way, false if it failed or was overtaken. */
  return (message: string): Promise<boolean> => {
    if (!busy) return run(message);
    waiting?.done(false);
    return new Promise((done) => {
      waiting = { message, done };
    });
  };
}
