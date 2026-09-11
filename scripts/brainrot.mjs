/** Offline asset preparation; network access happens only in the explicit download command. */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { format, resolveConfig } from 'prettier';

const root = path.resolve(import.meta.dirname, '..');
const assets = path.join(root, 'assets/brainrot');
const work = path.join(root, '.media-work');
const masters = path.join(work, 'masters');
const json = (file) => JSON.parse(readFileSync(file, 'utf8'));
const writeJSON = (file, data) => writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
const run = (cmd, args, options = {}) => {
  const result = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', ...options });
  if (result.status !== 0)
    throw new Error(`${cmd}: ${result.stderr || result.error || result.status}`);
  return result.stdout;
};
const probe = (file) =>
  JSON.parse(run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]));
const sources = json(path.join(assets, 'sources.json'));
const sourceFile = (id) => {
  const name = readdirSync(masters).find(
    (f) => f === `${id}.mp4` || f === `${id}.webm` || f === `${id}.mkv`
  );
  if (!name) throw new Error(`Missing downloaded master: ${id}`);
  return path.join(masters, name);
};
mkdirSync(masters, { recursive: true });
const command = process.argv[2];
if (command === 'download') {
  const failures = [];
  for (const source of sources.filter((s) => s.selectedForDownload)) {
    const localTools = path.join(work, 'tools');
    const local = existsSync(path.join(localTools, 'yt_dlp'));
    const args = [
      '--no-playlist',
      '--js-runtimes',
      'node',
      '--no-progress',
      '--retries',
      '2',
      '--fragment-retries',
      '2',
      '-f',
      'bv[height<=1080]/b[height<=1080]',
      '--write-info-json',
      '--download-archive',
      path.join(work, 'download-archive.txt'),
      '-o',
      path.join(masters, '%(id)s.%(ext)s'),
      source.youtube,
    ];
    try {
      console.log(`Downloading ${source.game}: ${source.videoId}`);
      run(local ? 'python' : 'yt-dlp', local ? ['-m', 'yt_dlp', ...args] : args, {
        env: local ? { ...process.env, PYTHONPATH: localTools } : process.env,
        stdio: 'inherit',
      });
    } catch (error) {
      failures.push({ videoId: source.videoId, error: String(error) });
    }
  }
  writeJSON(path.join(work, 'download-failures.json'), failures);
  if (failures.length) process.exitCode = 1;
} else if (command === 'catalog') {
  const candidates = [];
  for (const source of sources.filter((s) => s.selectedForDownload)) {
    const media = probe(sourceFile(source.videoId));
    const duration = Number(media.format.duration);
    for (let i = 0; i < 10; i++) {
      const start = Math.floor(25 + (i * (duration - 70)) / 10);
      candidates.push({
        id: `${source.videoId}-${i + 1}`,
        videoId: source.videoId,
        game: source.game,
        start,
        seconds: 20,
        selected: false,
        review: 'pending',
      });
    }
  }
  writeJSON(path.join(assets, 'catalog.json'), candidates);
  console.log(`${candidates.length} candidate excerpts`);
} else if (command === 'posters') {
  mkdirSync(path.join(work, 'candidates'), { recursive: true });
  for (const clip of json(path.join(assets, 'catalog.json'))) {
    const output = path.join(work, 'candidates', `${clip.id}.jpg`);
    if (existsSync(output)) continue;
    run('ffmpeg', [
      '-v',
      'error',
      '-y',
      '-ss',
      String(clip.start + 5),
      '-i',
      sourceFile(clip.videoId),
      '-frames:v',
      '1',
      '-vf',
      'scale=240:240:force_original_aspect_ratio=decrease',
      output,
    ]);
  }
} else if (command === 'build') {
  const selected = json(path.join(assets, 'catalog.json')).filter((c) => c.selected);
  if (selected.length !== 48) throw new Error(`Select exactly 48 clips; got ${selected.length}`);
  const previous = existsSync(path.join(assets, 'manifest.json'))
    ? json(path.join(assets, 'manifest.json'))
    : [];
  const manifest = [];
  for (const clip of selected) {
    const output = path.join(assets, `${clip.id}.mp4`);
    let complete = false;
    const recorded = previous.find((entry) => entry.id === clip.id);
    if (
      existsSync(output) &&
      recorded?.videoId === clip.videoId &&
      recorded.start === clip.start &&
      recorded.seconds === clip.seconds
    ) {
      try {
        complete = Math.abs(Number(probe(output).format.duration) - clip.seconds) < 0.15;
      } catch {
        /* Resume an interrupted encode. */
      }
    }
    if (!complete) {
      console.log(`Encoding ${clip.id}`);
      run('ffmpeg', [
        '-v',
        'error',
        '-y',
        '-ss',
        String(clip.start),
        '-i',
        sourceFile(clip.videoId),
        '-t',
        String(clip.seconds),
        '-map',
        '0:v:0',
        '-an',
        '-vf',
        'scale=720:720:force_original_aspect_ratio=decrease:force_divisible_by=2,fps=30',
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-threads',
        '2',
        '-b:v',
        '650k',
        '-maxrate',
        '800k',
        '-bufsize',
        '1300k',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        output + '.tmp.mp4',
      ]);
      renameSync(output + '.tmp.mp4', output);
    }
    const poster = path.join(assets, `${clip.id}.jpg`);
    run('ffmpeg', [
      '-v',
      'error',
      '-y',
      '-i',
      output,
      '-frames:v',
      '1',
      '-vf',
      'scale=360:360:force_original_aspect_ratio=decrease',
      poster,
    ]);
    const track = probe(output).streams.find((stream) => stream.codec_type === 'video');
    manifest.push({
      ...clip,
      width: track.width,
      height: track.height,
      focalY: track.height > track.width ? 0.65 : 0.5,
      bytes: statSync(output).size,
      sha256: createHash('sha256').update(readFileSync(output)).digest('hex'),
    });
  }
  writeJSON(path.join(assets, 'manifest.json'), manifest);
  const entries = manifest.map(
    (c) =>
      `  { id: ${JSON.stringify(c.id)}, game: ${JSON.stringify(c.game)}, seconds: ${c.seconds}, width: ${c.width}, height: ${c.height}, focalY: ${c.focalY}, source: require('../../../assets/brainrot/${c.id}.mp4'), poster: require('../../../assets/brainrot/${c.id}.jpg') }`
  );
  writeFileSync(
    path.join(root, 'src/lib/brainrot/generated.ts'),
    await format(
      `// Generated by scripts/brainrot.mjs. Do not edit.\nimport type { BrainrotClip } from './types';\nexport const CLIPS: BrainrotClip[] = [\n${entries.join(',\n')}\n];\n`,
      {
        ...(await resolveConfig(path.join(root, 'src/lib/brainrot/generated.ts'))),
        parser: 'typescript',
      }
    )
  );
  const used = sources.filter((s) => manifest.some((c) => c.videoId === s.videoId));
  writeFileSync(
    path.join(assets, 'CREDITS.md'),
    '# Gameplay credits\n\nRecordings by OrbitalNCG+. Downloaded from public YouTube embeds on the creator’s Ko-fi listings. Original game rights remain with their respective owners.\n\n' +
      used
        .map((s) => `- ${s.game}: [YouTube](${s.youtube}) · [Creator listing](${s.listing})`)
        .join('\n') +
      '\n'
  );
  console.log(`Built ${manifest.length} clips`);
} else if (command === 'verify') {
  const manifest = json(path.join(assets, 'manifest.json'));
  let bytes = 0;
  for (const clip of manifest) {
    const file = path.join(assets, `${clip.id}.mp4`);
    const media = probe(file);
    const video = media.streams.find((s) => s.codec_type === 'video');
    if (
      media.streams.some((s) => s.codec_type === 'audio') ||
      video?.codec_name !== 'h264' ||
      video.pix_fmt !== 'yuv420p' ||
      Math.max(video.width, video.height) > 720 ||
      video.avg_frame_rate !== '30/1' ||
      Math.abs(Number(media.format.duration) - clip.seconds) > 0.15
    )
      throw new Error(`Invalid media: ${clip.id}`);
    if (createHash('sha256').update(readFileSync(file)).digest('hex') !== clip.sha256)
      throw new Error(`Hash mismatch: ${clip.id}`);
    run('ffmpeg', ['-v', 'error', '-xerror', '-i', file, '-f', 'null', '-']);
    bytes += statSync(file).size + statSync(path.join(assets, `${clip.id}.jpg`)).size;
  }
  if (manifest.length !== 48 || bytes > 100_000_000)
    throw new Error(`Pack budget: ${manifest.length} clips, ${bytes} bytes`);
  console.log(
    `Verified ${manifest.length} clips, ${bytes.toLocaleString()} bytes, full decode successful`
  );
} else {
  throw new Error('Usage: node scripts/brainrot.mjs download|catalog|posters|build|verify');
}
