import type { RepeatStep, Step, StepKind } from './store/types';
import { LIMITS, validate } from './workout-steps';

/**
 * Compact, human-readable text form of a workout for sharing by link or QR code.
 *
 *   v1 "Repeaters 7:3" p10 6(6(h7 r3) r180)
 *
 * Tokens: `p`/`h`/`r` + seconds for a get-ready, hang or rest step, optionally followed by a
 * quoted label (`h10"20 mm half crimp"`); `N(` … `)` for a repeat, `N*(` when the last rest is
 * kept. Whitespace is optional except between two numbers. Percent-encode the whole string when
 * putting it in a URL.
 */
const VERSION = 'v1';

const KIND_CODE: Record<StepKind, string> = { prep: 'p', hang: 'h', rest: 'r' };
const CODE_KIND: Record<string, StepKind> = { p: 'prep', h: 'hang', r: 'rest' };

export type DecodedWorkout =
  { ok: true; name?: string; steps: Step[] } | { ok: false; error: string };

export function encodeWorkout(workout: { name?: string; steps: Step[] }): string {
  const parts = [VERSION];
  if (workout.name?.trim()) parts.push(quote(workout.name.trim()));
  parts.push(...workout.steps.map(encodeStep));
  return parts.join(' ');
}

function encodeStep(step: Step): string {
  if (step.kind === 'repeat') {
    return `${step.times}${step.skipLastRest ? '' : '*'}(${step.steps.map(encodeStep).join(' ')})`;
  }
  return `${KIND_CODE[step.kind]}${step.seconds}${step.label ? quote(step.label) : ''}`;
}

/** Labels cannot contain double quotes or line breaks; both are replaced rather than escaped. */
function quote(text: string): string {
  return `"${text.replace(/"/g, "'").replace(/\s+/g, ' ')}"`;
}

export function decodeWorkout(text: string): DecodedWorkout {
  try {
    const parser = new Parser(text);
    parser.expectVersion();
    const name = parser.peek() === '"' ? parser.readQuoted() : undefined;
    const steps = parser.readSteps(0, null);
    const errors = validate(steps);
    if (errors.length) return { ok: false, error: errors[0] };
    return name ? { ok: true, name, steps } : { ok: true, steps };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not read the workout.' };
  }
}

class Parser {
  private pos = 0;

  constructor(private readonly src: string) {}

  peek(): string {
    this.skipWs();
    return this.src[this.pos] ?? '';
  }

  private skipWs() {
    while (/\s/.test(this.src[this.pos] ?? '')) this.pos++;
  }

  expectVersion() {
    this.skipWs();
    if (!this.src.startsWith(VERSION, this.pos)) throw new Error('Unknown workout format.');
    this.pos += VERSION.length;
  }

  readQuoted(): string {
    this.skipWs();
    const end = this.src.indexOf('"', this.pos + 1);
    if (this.src[this.pos] !== '"' || end < 0) throw new Error('Unterminated label.');
    const text = this.src.slice(this.pos + 1, end).trim();
    this.pos = end + 1;
    return text;
  }

  private readInt(): number {
    this.skipWs();
    const m = /^\d+/.exec(this.src.slice(this.pos));
    if (!m) throw new Error('Expected a number.');
    this.pos += m[0].length;
    return Number(m[0]);
  }

  /** Reads steps until the closing bracket (`close`) or the end of input. */
  readSteps(depth: number, close: ')' | null): Step[] {
    const steps: Step[] = [];
    for (;;) {
      const c = this.peek();
      if (c === '') {
        if (close) throw new Error('Missing closing bracket.');
        return steps;
      }
      if (c === ')') {
        if (!close) throw new Error('Unexpected closing bracket.');
        this.pos++;
        return steps;
      }
      steps.push(this.readStep(depth));
    }
  }

  private readStep(depth: number): Step {
    const c = this.peek();
    if (CODE_KIND[c]) {
      this.pos++;
      const seconds = this.readInt();
      const label = this.peek() === '"' ? this.readQuoted() : undefined;
      return label ? { kind: CODE_KIND[c], seconds, label } : { kind: CODE_KIND[c], seconds };
    }
    if (/\d/.test(c)) {
      if (depth + 1 > LIMITS.maxDepth)
        throw new Error('Repeats can only be nested one level deep.');
      const times = this.readInt();
      let skipLastRest = true;
      if (this.peek() === '*') {
        skipLastRest = false;
        this.pos++;
      }
      if (this.peek() !== '(') throw new Error('Expected "(" after a repeat count.');
      this.pos++;
      const repeat: RepeatStep = {
        kind: 'repeat',
        times,
        skipLastRest,
        steps: this.readSteps(depth + 1, ')'),
      };
      return repeat;
    }
    throw new Error(`Unexpected "${c}".`);
  }
}
