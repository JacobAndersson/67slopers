/** Thrown while decoding a code that uses a format or vocabulary entry this build lacks. */
export const NEEDS_UPDATE = 'This workout needs a newer version of 67slopers.';

export function needsUpdate(): never {
  throw new Error(NEEDS_UPDATE);
}

export function isNeedsUpdate(error: unknown): boolean {
  return error instanceof Error && error.message === NEEDS_UPDATE;
}
