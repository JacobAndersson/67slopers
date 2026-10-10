/** Font grades of the benchmark list, by its grade index. */
export const GRADES = [
  '5+',
  '6A',
  '6A+',
  '6B',
  '6B+',
  '6C',
  '6C+',
  '7A',
  '7A+',
  '7B',
  '7B+',
  '7C',
  '7C+',
  '8A',
  '8A+',
  '8B',
  '8B+',
] as const;

const V_GRADES = [
  'V1',
  'V2',
  'V3',
  'V4',
  'V4',
  'V5',
  'V5',
  'V6',
  'V7',
  'V8',
  'V8',
  'V9',
  'V10',
  'V11',
  'V12',
  'V13',
  'V14',
] as const;

export type GradeScale = 'font' | 'v';

export const MIN_GRADE = 0;
export const MAX_GRADE = GRADES.length - 1;

export function gradeLabel(grade: number | undefined, scale: GradeScale = 'font'): string {
  if (grade === undefined) return 'Open';
  return (scale === 'v' ? V_GRADES : GRADES)[grade] ?? '?';
}

/** The other scale, shown small beside the chosen one. */
export function gradeAlt(grade: number | undefined, scale: GradeScale = 'font'): string {
  return grade === undefined ? '' : gradeLabel(grade, scale === 'v' ? 'font' : 'v');
}

/** "6A+ to 7A", or one grade when the range is a single step. */
export function gradeRangeLabel(min: number, max: number, scale: GradeScale = 'font'): string {
  return min === max
    ? gradeLabel(min, scale)
    : `${gradeLabel(min, scale)} to ${gradeLabel(max, scale)}`;
}
