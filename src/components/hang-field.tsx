import { Canvas, Fill, Shader, Skia } from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';
import { useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';

import { FLAT, STILL, stepField, swell, type Energy } from '@/lib/timer/energy';

/**
 * The field is smooth, so it is drawn this many times smaller and scaled up by the view: the
 * same picture for a thirty-sixth of the pixels.
 */
const DOWNSCALE = 6;

/**
 * How far the field's tones reach at full energy, toward the ground's deepest step and toward
 * light. Low enough that Glow stays Glow and the digits and the board keep their contrast.
 */
const DEEP_MAX = 0.16;
const LIGHT_MAX = 0.16;

/**
 * Smoke: fractal noise warped by noise, drifting along a heading that turns over minutes. Its
 * greyscale value runs through the ground's own tones (one colour in many tones): the deepest
 * step at 0, the ground itself at 0.5 (transparent), light at 1, as far as the energy allows.
 */
const SHADER = `
uniform float2 size;
uniform float drift;
uniform float amp;
uniform float seed;
uniform float3 deep;

// Dave Hoskins' hash without sine: stable far from the origin, where the drift takes it.
float hash(float2 p) {
  float3 p3 = fract(float3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  float2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + float2(1.0, 0.0)), u.x),
             mix(hash(i + float2(0.0, 1.0)), hash(i + float2(1.0, 1.0)), u.x), u.y);
}

float fbm(float2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.02 + float2(13.7, 7.3);
    a *= 0.5;
  }
  return v / 0.9375;
}

half4 main(float2 xy) {
  float2 uv = xy / size.x;
  float turn = drift * 0.05;
  float2 dir = float2(sin(turn), -cos(turn));
  float2 p = uv * 1.8 + seed;
  float2 q = float2(fbm(p + dir * drift), fbm(p + float2(5.2, 1.3) - dir * drift * 0.6));
  float n = smoothstep(0.15, 0.85, fbm(p + 1.4 * q + dir * drift * 0.4));
  float s = clamp((n - 0.5) * 2.0, -1.0, 1.0) * amp;
  float a = s > 0.0 ? s * ${LIGHT_MAX} : -s * ${DEEP_MAX};
  float3 c = s > 0.0 ? float3(1.0) : deep;
  return half4(half3(c * a), half(a));
}`;

const EFFECT = Skia.RuntimeEffect.Make(SHADER);

function rgb(hex: string): number[] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((c) => c / 255);
}

/**
 * The living field on the session ground, drawn with Skia on the UI thread. It chases `target`
 * (src/lib/timer/energy.ts) every frame, so a phase change retargets it and nothing restarts:
 * a hang lifts it in under 300 ms, a rest or a pause lets it decay. Its tones are the ground's
 * own (`deep` is the ground's deepest step), so it is Glow only on the Glow of a hang. Lazy
 * loaded by the runner, so Skia never loads on the way to Home; never mounted under reduced
 * motion, where the ground stays still.
 */
export default function HangField({
  width,
  height,
  target,
  deep,
}: {
  width: number;
  height: number;
  target: Energy;
  deep: string;
}) {
  const [seed] = useState(() => Math.random() * 40);
  const goal = useSharedValue(target);
  const tone = useSharedValue(rgb(deep));
  useEffect(() => {
    goal.set(target);
  }, [goal, target]);
  useEffect(() => {
    tone.set(rgb(deep));
  }, [tone, deep]);

  const field = useSharedValue(FLAT);
  const amp = useSharedValue(0);
  useFrameCallback((frame) => {
    const dt = frame.timeSincePreviousFrame ?? 0;
    const current = field.get();
    const aim = goal.get();
    // A settled, still field draws nothing new: no frames spent while paused or before Start.
    if (aim.amplitude === STILL.amplitude && current.energy.amplitude < 1e-3) {
      if (amp.get() !== 0) amp.set(0);
      return;
    }
    const next = stepField(current, aim, dt);
    field.set(next);
    amp.set(swell(next.energy, frame.timeSinceFirstFrame));
  });

  const w = width / DOWNSCALE;
  const h = height / DOWNSCALE;
  const uniforms = useDerivedValue(() => ({
    size: [w, h],
    drift: field.get().drift,
    amp: amp.get(),
    seed,
    deep: tone.get(),
  }));

  if (!EFFECT) return null;
  return (
    <Canvas
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: w,
        height: h,
        transformOrigin: 'top left',
        transform: [{ scale: DOWNSCALE }],
      }}>
      <Fill>
        <Shader source={EFFECT} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );
}
