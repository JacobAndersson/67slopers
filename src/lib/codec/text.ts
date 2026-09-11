import { uniformModel, type Decoder, type Encoder, type Model } from './arith';
import { needsUpdate } from './errors';
import { CHARS, M } from './models';
import { PHRASES, WORDS } from './vocab';

/** Longest name or label a code carries; longer text is cut when encoding. */
export const MAX_TEXT = 100;

const DICTIONARY = 0;
const DICTIONARY_CAPITALIZED = 1;
const NUMBER = 2;
const SPELLED = 3;
const SPELLED_CAPITALIZED = 4;

const WORD_INDEX = new Map(WORDS.map((word, i) => [word, i]));
const PHRASE_INDEX = new Map(PHRASES.map((phrase, i) => [phrase, i]));
const WORDS_TEXT = 0;
const PHRASE = 1;
const PHRASE_LOWERCASE = 2;
const NUMBER_PATTERN = /^([+-]?)(0|[1-9]\d{0,3})(?:\.(\d{1,2}))?(mm|kg|lbs|lb|%|s|x|min|°)?$/;
const INTEGER_FLOOR = [0, 10, 100, 1000];
const INTEGER_SPAN = [10, 90, 900, 9000].map(uniformModel);
/** Fraction digits other than the common ".5", ".25" and ".75". */
const FRACTIONS = ['', '5', '25', '75'];
const ONE_DIGIT = uniformModel(9);
const TWO_DIGITS = uniformModel(98);

/** Whitespace collapsed, trimmed and cut to `MAX_TEXT`: the text a code round-trips. */
export function normalizeText(text: string): string {
  const collapsed = text.replace(/\s+/g, ' ').trim();
  return collapsed.length > MAX_TEXT ? collapsed.slice(0, MAX_TEXT).trim() : collapsed;
}

const firstCodePoint = (s: string) => String.fromCodePoint(s.codePointAt(0) ?? 0);

function capitalize(word: string): string {
  const first = firstCodePoint(word);
  return first.toUpperCase() + word.slice(first.length);
}

/** The word with its first letter lowercased, when `capitalize` exactly undoes that. */
function decapitalize(word: string): string | null {
  const first = firstCodePoint(word);
  const lower = first.toLowerCase();
  if (lower === first || lower.toUpperCase() !== first) return null;
  return lower + word.slice(first.length);
}

const LOWERCASE_PHRASE_INDEX = new Map(
  PHRASES.flatMap((phrase, i) => {
    const lowercase = decapitalize(phrase);
    return lowercase === null ? [] : [[lowercase, i] as const];
  })
);

/**
 * A name or label: a listed phrase, or words. A word is a dictionary entry (lowercase or capitalised, with an
 * optional trailing comma or full stop), a number such as "+12.5kg", or spelled out character
 * by character with a letter-frequency model.
 */
export function writeText(enc: Encoder, text: string): void {
  const normalized = normalizeText(text);
  if (!normalized) throw new RangeError('Nothing to write.');
  const phrase = PHRASE_INDEX.get(normalized);
  const lowercasePhrase = LOWERCASE_PHRASE_INDEX.get(normalized);
  if (phrase !== undefined) {
    enc.encode(M.text.textKind, PHRASE);
    enc.encode(M.text.phraseIndex, phrase);
    return;
  }
  if (lowercasePhrase !== undefined) {
    enc.encode(M.text.textKind, PHRASE_LOWERCASE);
    enc.encode(M.text.phraseIndex, lowercasePhrase);
    return;
  }
  enc.encode(M.text.textKind, WORDS_TEXT);
  const words = normalized.split(' ');
  M.text.wordCount.encode(enc, words.length);
  words.forEach((word, i) =>
    writeWord(enc, word, i === 0 ? M.text.wordKind.first : M.text.wordKind.next)
  );
}

export function readText(dec: Decoder): string {
  const kind = dec.decode(M.text.textKind);
  if (kind !== WORDS_TEXT) {
    const phrase = PHRASES[dec.decode(M.text.phraseIndex)] ?? needsUpdate();
    if (kind === PHRASE) return phrase;
    const lowercase = decapitalize(phrase);
    if (lowercase === null) throw new RangeError('That phrase has no lowercase form.');
    return lowercase;
  }
  const count = M.text.wordCount.decode(dec);
  let text = '';
  for (let i = 0; i < count; i++) {
    const word = readWord(dec, i === 0 ? M.text.wordKind.first : M.text.wordKind.next);
    text = i === 0 ? word : `${text} ${word}`;
    if (text.length > MAX_TEXT) throw new RangeError('Text too long.');
  }
  return text;
}

function writeWord(enc: Encoder, word: string, kinds: Model): void {
  const trail = M.text.trail.symbols.indexOf(word.slice(-1));
  const cores: [string, number][] = [[word, 0]];
  if (trail > 0 && word.length > 1) cores.push([word.slice(0, -1), trail]);
  for (const [core, trailIndex] of cores) {
    const index = WORD_INDEX.get(core);
    const lower = decapitalize(core);
    const capitalizedIndex = lower === null ? undefined : WORD_INDEX.get(lower);
    const number = NUMBER_PATTERN.exec(core);
    if (index !== undefined) {
      enc.encode(kinds, DICTIONARY);
      enc.encode(M.text.wordIndex, index);
    } else if (capitalizedIndex !== undefined) {
      enc.encode(kinds, DICTIONARY_CAPITALIZED);
      enc.encode(M.text.wordIndex, capitalizedIndex);
    } else if (number) {
      enc.encode(kinds, NUMBER);
      writeNumber(enc, number);
    } else {
      continue;
    }
    enc.encode(M.text.trail.model, trailIndex);
    return;
  }
  const lower = decapitalize(word);
  const lowerIndex = lower === null ? -1 : (CHARS.index.get(firstCodePoint(lower)) ?? -1);
  if (lower !== null && M.text.charShifted.weight(lowerIndex) > 0) {
    enc.encode(kinds, SPELLED_CAPITALIZED);
    spell(enc, lower);
  } else {
    enc.encode(kinds, SPELLED);
    spell(enc, word);
  }
}

function readWord(dec: Decoder, kinds: Model): string {
  const kind = dec.decode(kinds);
  if (kind === DICTIONARY || kind === DICTIONARY_CAPITALIZED) {
    const word = WORDS[dec.decode(M.text.wordIndex)] ?? needsUpdate();
    const trail = M.text.trail.symbols[dec.decode(M.text.trail.model)];
    return (kind === DICTIONARY ? word : capitalize(word)) + trail;
  }
  if (kind === NUMBER) {
    const number = readNumber(dec);
    return number + M.text.trail.symbols[dec.decode(M.text.trail.model)];
  }
  const content = unspell(dec);
  return kind === SPELLED ? content : capitalize(content);
}

function writeNumber(enc: Encoder, match: RegExpExecArray): void {
  const [, sign, integer, fraction = '', suffix = ''] = match;
  enc.encode(M.text.sign.model, M.text.sign.symbols.indexOf(sign));
  const length = integer.length - 1;
  enc.encode(M.text.integerDigits, length);
  enc.encode(INTEGER_SPAN[length], Number(integer) - INTEGER_FLOOR[length]);
  const common = FRACTIONS.indexOf(fraction);
  if (common >= 0) {
    enc.encode(M.text.fraction, common);
  } else if (fraction.length === 1) {
    enc.encode(M.text.fraction, 4);
    const digit = Number(fraction);
    enc.encode(ONE_DIGIT, digit > 5 ? digit - 1 : digit);
  } else {
    enc.encode(M.text.fraction, 5);
    const n = Number(fraction);
    enc.encode(TWO_DIGITS, n - (n > 25 ? 1 : 0) - (n > 75 ? 1 : 0));
  }
  enc.encode(M.text.suffix.model, M.text.suffix.symbols.indexOf(suffix));
}

function readNumber(dec: Decoder): string {
  const sign = M.text.sign.symbols[dec.decode(M.text.sign.model)];
  const length = dec.decode(M.text.integerDigits);
  const integer = INTEGER_FLOOR[length] + dec.decode(INTEGER_SPAN[length]);
  const kind = dec.decode(M.text.fraction);
  let fraction = FRACTIONS[kind] ?? '';
  if (kind === 4) {
    const digit = dec.decode(ONE_DIGIT);
    fraction = String(digit >= 5 ? digit + 1 : digit);
  } else if (kind === 5) {
    let n = dec.decode(TWO_DIGITS);
    if (n >= 25) n++;
    if (n >= 75) n++;
    fraction = String(n).padStart(2, '0');
  }
  const suffix = M.text.suffix.symbols[dec.decode(M.text.suffix.model)];
  return `${sign}${integer}${fraction ? `.${fraction}` : ''}${suffix}`;
}

function spell(enc: Encoder, word: string): void {
  let model = M.text.charFirst;
  for (const ch of word) {
    const index = CHARS.index.get(ch);
    const lower = ch.toLowerCase();
    const lowerIndex = CHARS.index.get(lower) ?? -1;
    if (index !== undefined) {
      enc.encode(model, index);
    } else if (
      lower !== ch &&
      lower.toUpperCase() === ch &&
      M.text.charShifted.weight(lowerIndex) > 0
    ) {
      enc.encode(model, CHARS.shift);
      enc.encode(M.text.charShifted, lowerIndex);
    } else {
      enc.encode(model, CHARS.escape);
      enc.encode(M.text.codePoint, ch.codePointAt(0) ?? 0);
    }
    model = M.text.charNext;
  }
  enc.encode(M.text.charNext, CHARS.end);
}

function unspell(dec: Decoder): string {
  let word = '';
  let model = M.text.charFirst;
  for (;;) {
    const symbol = dec.decode(model);
    model = M.text.charNext;
    if (symbol === CHARS.end) return word;
    if (symbol === CHARS.shift) {
      word += CHARS.symbols[dec.decode(M.text.charShifted)].toUpperCase();
    } else if (symbol === CHARS.escape) {
      word += String.fromCodePoint(dec.decode(M.text.codePoint));
    } else {
      word += CHARS.symbols[symbol];
    }
    if (word.length > MAX_TEXT) throw new RangeError('Word too long.');
  }
}
