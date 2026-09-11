import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import path from 'node:path';

const dir = path.resolve('assets/brainrot');
const read = (name: string) => readFileSync(path.join(dir, name));

test('the bundled pack has 48 local, traceable clips within 100 MB', () => {
  const manifest = JSON.parse(read('manifest.json').toString()) as {
    id: string;
    videoId: string;
    bytes: number;
    sha256: string;
    width: number;
    height: number;
  }[];
  const sources = JSON.parse(read('sources.json').toString()) as {
    videoId: string;
    listing: string;
  }[];
  const catalog = JSON.parse(read('catalog.json').toString()) as {
    id: string;
    selected: boolean;
  }[];
  assert.equal(manifest.length, 48);
  assert.equal(new Set(manifest.map((c) => c.id)).size, 48);
  assert.ok(catalog.length >= 100);
  assert.deepEqual(
    catalog
      .filter((c) => c.selected)
      .map((c) => c.id)
      .sort(),
    manifest.map((c) => c.id).sort()
  );
  assert.equal(readdirSync(dir).filter((name) => name.endsWith('.mp4')).length, 48);
  let bytes = 0;
  for (const clip of manifest) {
    assert.ok(
      sources.some(
        (s) => s.videoId === clip.videoId && s.listing.startsWith('https://ko-fi.com/s/')
      )
    );
    const video = read(`${clip.id}.mp4`);
    assert.ok(
      !video.subarray(0, 80).toString().includes('git-lfs'),
      'Fetch gameplay with git lfs pull'
    );
    assert.equal(video.length, clip.bytes);
    assert.equal(createHash('sha256').update(video).digest('hex'), clip.sha256);
    assert.ok(video.indexOf('moov') < video.indexOf('mdat'), `${clip.id} must support fast start`);
    assert.ok(clip.width > 0 && clip.height > 0 && Math.max(clip.width, clip.height) <= 720);
    const poster = read(`${clip.id}.jpg`);
    assert.equal(poster.readUInt16BE(0), 0xffd8);
    bytes += video.length + poster.length;
  }
  assert.ok(bytes <= 100_000_000, `Pack is ${bytes} bytes`);
});
