// Generates the timer cue sounds as 16-bit mono PCM WAV files using only Node's
// standard library. Run with `node scripts/gen-tones.mjs`; the outputs are
// committed under assets/sounds so the app never generates audio at runtime.
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 44100;
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/sounds');

/** One or more sine segments, played back to back. */
function tone(segments, { gain = 0.6, fadeMs = 6 } = {}) {
  const total = segments.reduce((n, s) => n + Math.round((s.ms / 1000) * SAMPLE_RATE), 0);
  const samples = new Int16Array(total);
  let offset = 0;
  for (const { hz, ms } of segments) {
    const n = Math.round((ms / 1000) * SAMPLE_RATE);
    const fade = Math.round((fadeMs / 1000) * SAMPLE_RATE);
    for (let i = 0; i < n; i++) {
      const env = Math.min(1, i / fade, (n - 1 - i) / fade);
      const v = Math.sin((2 * Math.PI * hz * i) / SAMPLE_RATE) * gain * Math.max(0, env);
      samples[offset + i] = Math.round(v * 32767);
    }
    offset += n;
  }
  return samples;
}

function wav(samples) {
  const dataBytes = samples.length * 2;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); // PCM chunk size
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32); // block align
  buf.writeUInt16LE(16, 34); // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(dataBytes, 40);
  for (let i = 0; i < samples.length; i++) buf.writeInt16LE(samples[i], 44 + i * 2);
  return buf;
}

mkdirSync(OUT, { recursive: true });
const files = {
  'beep-short.wav': tone([{ hz: 500, ms: 120 }]),
  'beep-long.wav': tone([{ hz: 500, ms: 500 }]),
  'done.wav': tone([
    { hz: 500, ms: 150 },
    { hz: 700, ms: 350 },
  ]),
};
for (const [name, samples] of Object.entries(files)) {
  writeFileSync(path.join(OUT, name), wav(samples));
  console.log(`${name}: ${(samples.length / SAMPLE_RATE).toFixed(2)}s`);
}
