import { Image } from 'expo-image';
import { Asset } from 'expo-asset';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import type { BrainrotClip } from '@/lib/brainrot/types';
import { createPlayback } from '@/lib/brainrot/playback';

export default function BrainrotVideo({
  clip,
  playing,
  onFailure,
}: {
  clip: BrainrotClip;
  playing: boolean;
  onFailure: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const controller = useRef<ReturnType<typeof createPlayback> | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const failure = useRef(onFailure);
  const wantsPlayback = useRef(playing);
  useEffect(() => {
    failure.current = onFailure;
  }, [onFailure]);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const control = createPlayback(
      {
        load: async () => {},
        play: () => element.play(),
        pause: () => element.pause(),
      },
      () => {
        setFailed(true);
        failure.current();
      }
    );
    controller.current = control;
    const visibility = () => control.setPlaying(wantsPlayback.current && !document.hidden);
    document.addEventListener('visibilitychange', visibility);
    void control.load();
    visibility();
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      control.dispose();
      controller.current = null;
      element.removeAttribute('src');
      element.load();
    };
  }, [clip.source]);
  useEffect(() => {
    wantsPlayback.current = playing;
    controller.current?.setPlaying(playing && !document.hidden);
  }, [playing]);
  return (
    <View className="flex-1 overflow-hidden bg-muted" pointerEvents="none" aria-hidden>
      <video
        ref={video}
        src={Asset.fromModule(clip.source).uri}
        muted
        loop
        playsInline
        controls={false}
        disablePictureInPicture
        preload="auto"
        onLoadedData={() => setReady(true)}
        onError={() => controller.current?.fail()}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: `50% ${clip.focalY * 100}%`,
        }}
      />
      {!ready || failed ? (
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
