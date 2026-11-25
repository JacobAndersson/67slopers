import { Directory, File, Paths } from 'expo-file-system';

import type { PhotoMeta, Wall } from './types';

/**
 * Wall photos live as plain files under Documents/walls, one folder per wall:
 *
 *   walls/<wallId>/wall.json
 *   walls/<wallId>/<photoId>.jpg
 *   walls/<wallId>/<photoId>.json
 *
 * On iOS the Documents folder shows in the Files app (app.json `UIFileSharingEnabled`); on
 * Android `exportWalls` copies the tree into a folder the user picks. Nothing leaves the
 * phone any other way.
 */

const WALL_FILE = 'wall.json';

function root(): Directory {
  const dir = new Directory(Paths.document, 'walls');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

function wallDir(id: string): Directory {
  return new Directory(root(), id);
}

/** Photo ids start with the time they were taken, so they sort by it. */
export type StoredPhoto = { id: string; uri: string };

function readJson<T>(file: File): T | null {
  try {
    return JSON.parse(file.textSync()) as T;
  } catch {
    return null;
  }
}

export function listWalls(): Wall[] {
  return root()
    .list()
    .filter((entry): entry is Directory => entry instanceof Directory)
    .map((dir) => readJson<Wall>(new File(dir, WALL_FILE)))
    .filter((wall): wall is Wall => wall !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getWall(id: string): Wall | null {
  const file = new File(wallDir(id), WALL_FILE);
  return file.exists ? readJson<Wall>(file) : null;
}

export function saveWall(wall: Wall) {
  const dir = wallDir(wall.id);
  if (!dir.exists) dir.create({ intermediates: true });
  const file = new File(dir, WALL_FILE);
  if (!file.exists) file.create();
  file.write(JSON.stringify(wall, null, 2));
}

export function deleteWall(id: string) {
  const dir = wallDir(id);
  if (dir.exists) dir.delete();
}

/** A wall's photos, newest first. */
export function listPhotos(wallId: string): StoredPhoto[] {
  const dir = wallDir(wallId);
  if (!dir.exists) return [];
  return dir
    .list()
    .filter((entry): entry is File => entry instanceof File && entry.uri.endsWith('.jpg'))
    .map((file) => ({ id: file.name.replace(/\.jpg$/, ''), uri: file.uri }))
    .sort((a, b) => b.id.localeCompare(a.id));
}

export function countPhotos(wallId: string): number {
  return listPhotos(wallId).length;
}

export function getPhotoMeta(wallId: string, photoId: string): PhotoMeta | null {
  const file = new File(wallDir(wallId), `${photoId}.json`);
  return file.exists ? readJson<PhotoMeta>(file) : null;
}

/** Moves the camera's temporary photo into the wall's folder and writes its sidecar. */
export function savePhoto(tempUri: string, meta: PhotoMeta): StoredPhoto {
  const dir = wallDir(meta.wallId);
  if (!dir.exists) dir.create({ intermediates: true });
  const photo = new File(dir, meta.file);
  new File(tempUri).moveSync(photo);
  const sidecar = new File(dir, `${meta.id}.json`);
  sidecar.create();
  sidecar.write(JSON.stringify(meta));
  return { id: meta.id, uri: photo.uri };
}

export function deletePhoto(wallId: string, photoId: string) {
  for (const name of [`${photoId}.jpg`, `${photoId}.json`]) {
    const file = new File(wallDir(wallId), name);
    if (file.exists) file.delete();
  }
}

/**
 * Copies every wall into a folder the user picks (Android's folder picker), as
 * `rivet-walls/<wallId>/…`. Photos already there are skipped and the JSON is rewritten, so
 * exporting again adds new photos and brings the labels up to date. Returns the new photos.
 */
export async function exportWalls(): Promise<number> {
  const target = await Directory.pickDirectoryAsync();
  const into = (parent: Directory, name: string) =>
    parent.list().find((e): e is Directory => e instanceof Directory && e.name === name) ??
    parent.createDirectory(name);
  const out = into(target, 'rivet-walls');
  let written = 0;
  for (const dir of root().list()) {
    if (!(dir instanceof Directory)) continue;
    const dest = into(out, dir.name);
    const there = new Map(
      dest.list().flatMap((e) => (e instanceof File ? [[e.name, e] as const] : []))
    );
    for (const file of dir.list()) {
      if (!(file instanceof File)) continue;
      const photo = file.name.endsWith('.jpg');
      // Photos never change once taken; the labels in the JSON can, so those are rewritten.
      if (photo && there.has(file.name)) continue;
      const copy =
        there.get(file.name) ??
        dest.createFile(file.name, photo ? 'image/jpeg' : 'application/json');
      copy.write(file.bytesSync());
      if (photo) written += 1;
    }
  }
  return written;
}
