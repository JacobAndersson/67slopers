/** Local-only ids: time-ordered prefix plus a random suffix. No dependency needed. */
export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
