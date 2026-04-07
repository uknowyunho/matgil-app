export type MealType = 'morning' | 'lunch' | 'dinner' | 'late_night' | 'coffee' | 'snack';

export interface MealTypeConfig {
  type: MealType;
  label: string;
  color: string;
}

export const MEAL_TYPES: MealTypeConfig[] = [
  { type: 'morning', label: '아침', color: '#D4952B' }, // Amber
  { type: 'lunch', label: '점심', color: '#E8663D' },   // Tangerine
  { type: 'dinner', label: '저녁', color: '#3B7FC9' },  // Blue
  { type: 'late_night', label: '야식', color: '#C93B3B' }, // Red
  { type: 'coffee', label: '커피', color: '#8B6EC0' },  // Purple
  { type: 'snack', label: '간식', color: '#D46BA3' },   // Pink
];

export const MEAL_TYPE_COLOR_MAP: Record<string, string> = Object.fromEntries(
  MEAL_TYPES.map((mt) => [mt.type, mt.color]),
);
