/**
 * Development-only timing marks for the budgets in docs/principles.md (cold start, and Start
 * to the first countdown). Every call is a no-op in release builds.
 */
const marks = new Map<string, number>();

export function mark(name: string): void {
  if (__DEV__) marks.set(name, performance.now());
}

/** Logs the milliseconds since `name` was marked, once, as "perf: <label> 42 ms". */
export function measure(name: string, label: string): void {
  if (!__DEV__) return;
  const start = marks.get(name);
  if (start === undefined) return;
  marks.delete(name);
  console.log(`perf: ${label} ${Math.round(performance.now() - start)} ms`);
}
