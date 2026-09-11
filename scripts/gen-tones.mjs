// Writes the timer's cue sound with nothing but Node: assets/sounds/beep.wav, an 880 Hz sine of
// 150 ms with 5 ms fades so it never clicks. Mono, 16-bit, 44.1 kHz.
//
//   npm run tones
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const RATE = 44100;
const FREQ = 880;
const MS = 150;
const FADE_MS = 5;
const AMPLITUDE = 0.6;

function tone() {
  const n = Math.round((RATE * MS) / 1000);
  const fade = Math.round((RATE * FADE_MS) / 1000);
  const samples = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const env = Math.min(1, i / fade, (n - 1 - i) / fade);
    const v = Math.sin((2 * Math.PI * FREQ * i) / RATE) * AMPLITUDE * env;
    samples[i] = Math.round(v * 32767);
  }
  return samples;
}

function wav(samples) {
  const data = Buffer.from(samples.buffer);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

const out = resolve(root, 'assets/sounds/beep.wav');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, wav(tone()));
console.log('wrote assets/sounds/beep.wav');
