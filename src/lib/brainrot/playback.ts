/** A single source per controller. Disposing invalidates any in-flight load or play. */
export type PlaybackPort = {
  load: () => Promise<void>;
  play: () => void | Promise<void>;
  pause: () => void;
};

export function createPlayback(port: PlaybackPort, onFailure: () => void) {
  let disposed = false;
  let ready = false;
  let playing = false;
  let failed = false;
  let generation = 0;
  const fail = () => {
    if (disposed || failed) return;
    failed = true;
    try {
      port.pause();
    } catch {
      /* Released native player. */
    }
    onFailure();
  };
  const sync = () => {
    const request = ++generation;
    if (disposed || failed || !ready) return;
    try {
      if (playing)
        void Promise.resolve(port.play()).catch(() => {
          // A browser can reject a pending play when Pause interrupts it.
          if (playing && request === generation) fail();
        });
      else port.pause();
    } catch {
      fail();
    }
  };
  return {
    async load() {
      try {
        await port.load();
        if (disposed) return;
        ready = true;
        sync();
      } catch {
        fail();
      }
    },
    setPlaying(value: boolean) {
      playing = value;
      sync();
    },
    fail,
    dispose() {
      disposed = true;
      generation++;
      try {
        port.pause();
      } catch {
        /* Hook may already have released the player. */
      }
    },
  };
}
