/**
 * Exact arithmetic coding into a decimal number.
 *
 * Each symbol narrows an interval inside [0, 1) to its share of a static model's weight. The
 * bounds are BigInt fractions, so nothing is lost to rounding and no renormalisation is
 * needed. `finish` returns the shortest digit string whose value lies in the final interval:
 * a message the model gives probability p costs at most log10(1/p) + 1 digits. Decoding
 * replays the same narrowing around that point, so the message structure has to tell the
 * reader when to stop.
 */

export type Model = {
  readonly total: number;
  /** Weight of every symbol before `symbol`. */
  cum(symbol: number): number;
  weight(symbol: number): number;
  /** The symbol whose share holds `value`, for 0 <= value < total. */
  find(value: number): number;
};

export function tableModel(weights: readonly number[]): Model {
  const starts: number[] = [];
  let total = 0;
  for (const w of weights) {
    if (!Number.isInteger(w) || w < 0) throw new RangeError('Model weights must be whole numbers.');
    starts.push(total);
    total += w;
  }
  if (total === 0) throw new RangeError('A model needs some weight.');
  return {
    total,
    cum: (symbol) => starts[symbol],
    weight: (symbol) => weights[symbol] ?? 0,
    find: (value) => {
      // The last symbol starting at or before `value`. A zero-weight symbol shares its start
      // with the next one, so it is never picked.
      let lo = 0;
      let hi = weights.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (starts[mid] <= value) lo = mid;
        else hi = mid - 1;
      }
      return lo;
    },
  };
}

/** `size` equally likely symbols. */
export function uniformModel(size: number): Model {
  if (!Number.isInteger(size) || size < 1) throw new RangeError('A uniform model needs a size.');
  return {
    total: size,
    cum: (symbol) => symbol,
    weight: (symbol) => (Number.isInteger(symbol) && symbol >= 0 && symbol < size ? 1 : 0),
    find: (value) => value,
  };
}

export class Encoder {
  private low = 0n;
  private range = 1n;
  private scale = 1n;

  encode(model: Model, symbol: number): void {
    const weight = model.weight(symbol);
    if (!(weight > 0)) throw new RangeError(`Symbol ${symbol} has no weight in this model.`);
    const total = BigInt(model.total);
    this.low = this.low * total + this.range * BigInt(model.cum(symbol));
    this.range *= BigInt(weight);
    this.scale *= total;
  }

  /** The shortest digit string (at least one digit) whose value lies in the interval. */
  finish(): string {
    const high = this.low + this.range;
    let unit = 10n;
    for (let digits = 1; ; digits++, unit *= 10n) {
      const point = (this.low * unit + this.scale - 1n) / this.scale;
      if (point * this.scale < high * unit) return point.toString().padStart(digits, '0');
    }
  }
}

export class Decoder {
  private low = 0n;
  private range = 1n;
  private scale = 1n;
  private readonly point: bigint;
  private readonly unit: bigint;
  private symbols = 0;

  /** `maxSymbols` bounds the work spent on digits that are not a code. */
  constructor(
    digits: string,
    private readonly maxSymbols = 5000
  ) {
    if (!/^\d+$/.test(digits)) throw new RangeError('Not a number.');
    this.point = BigInt(digits);
    let unit = 1n;
    for (let i = 0; i < digits.length; i++) unit *= 10n;
    this.unit = unit;
  }

  decode(model: Model): number {
    if (++this.symbols > this.maxSymbols) throw new RangeError('The code runs on too long.');
    const total = BigInt(model.total);
    const offset = this.point * this.scale - this.low * this.unit;
    const symbol = model.find(Number((offset * total) / (this.range * this.unit)));
    this.low = this.low * total + this.range * BigInt(model.cum(symbol));
    this.range *= BigInt(model.weight(symbol));
    this.scale *= total;
    return symbol;
  }
}
