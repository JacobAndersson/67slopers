import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { createPlayback } from '@/lib/brainrot/playback';
import { coverFrame } from '@/lib/brainrot/rotation';
import type { BrainrotClip } from '@/lib/brainrot/types';

type Props = { clip: BrainrotClip; playing: boolean; onFailure: () => void };

/** Keyed by hang/restart: late results can never replace the next hang's source. */
export default function BrainrotVideo({ clip, playing, onFailure }: Props) {
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [size, setSize] = useState({ width: 0, height: 0 });
  const frame = coverFrame(size.width, size.height, clip.width, clip.height, clip.focalY);
  const [ready, setReady] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [failed, setFailed] = useState(false);
  const failure = useRef(onFailure);
  useEffect(() => {
    failure.current = onFailure;
  }, [onFailure]);
  const player = useVideoPlayer(null, (p) => {
    p.muted = true;
    p.loop = true;
    p.audioMixingMode = 'mixWithOthers';
    p.staysActiveInBackground = false;
    p.showNowPlayingNotification = false;
    p.allowsExternalPlayback = false;
  });
  const controller = useRef<ReturnType<typeof createPlayback> | null>(null);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => sub.remove();
  }, []);
  useEffect(() => {
    const control = createPlayback(
      {
        load: () => player.replaceAsync(clip.source),
        play: () => player.play(),
        pause: () => player.pause(),
      },
      () => {
        setFailed(true);
        failure.current();
      }
    );
    controller.current = control;
    const sub = player.addListener('statusChange', (event) => {
      if (event.status === 'error') control.fail();
    });
    const playbackSub = player.addListener('playingChange', ({ isPlaying }) => {
      if (isPlaying) setHasPlayed(true);
    });
    void control.load();
    return () => {
      sub.remove();
      playbackSub.remove();
      control.dispose();
      controller.current = null;
    };
  }, [player, clip.source]);
  useEffect(() => {
    controller.current?.setPlaying(playing && active);
  }, [playing, active]);
  return (
    <View
      className="flex-1 overflow-hidden bg-muted"
      onLayout={(event) => setSize(event.nativeEvent.layout)}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <VideoView
        player={player}
        style={{ position: 'absolute', ...frame }}
        contentFit="fill"
        surfaceType="textureView"
        nativeControls={false}
        playsInline
        allowsPictureInPicture={false}
        fullscreenOptions={{ enable: false }}
        onFirstFrameRender={() => setReady(true)}
      />
      {!ready || !hasPlayed || failed ? (
        <Image
          source={clip.poster}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition={{ top: `${clip.focalY * 100}%`, left: '50%' }}
        />
      ) : null}
      {failed ? (
        <View className="absolute bottom-2 self-center rounded-md bg-background/90 px-3 py-1">
          <Text className="text-xs text-muted-foreground">Video unavailable</Text>
        </View>
      ) : null}
    </View>
  );
}
