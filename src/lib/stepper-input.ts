type Entry = { value: string } | { minutes: string; seconds: string };

/** The same bounded value is used while typing, on Done, and when leaving a field. */
export function parseStepperInput(entry: Entry, min: number, max: number): number {
  const parse = (text: string) => {
    const value = parseInt(text.replace(/\D/g, ''), 10);
    return Number.isFinite(value) ? value : 0;
  };
  const typed =
    'value' in entry
      ? parse(entry.value)
      : parse(entry.minutes) * 60 + Math.min(59, parse(entry.seconds));
  return Math.min(max, Math.max(min, typed));
}
