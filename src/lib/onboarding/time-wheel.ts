export type Period = 'AM' | 'PM';

// Wheel option lists. Minutes step by 5 for a friendlier dial.
export const HOURS12: number[] = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
export const MINUTES: number[] = Array.from({ length: 12 }, (_, i) => i * 5);
export const PERIODS: Period[] = ['AM', 'PM'];

export function to24h(hour12: number, period: Period): number {
  const base = hour12 % 12; // 12 -> 0
  return period === 'PM' ? base + 12 : base;
}

export function from24h(hour24: number): { hour12: number; period: Period } {
  const period: Period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour12, period };
}

// Maps a scroll offset to the nearest wheel item index, clamped to [0, count-1].
export function indexFromOffset(offsetY: number, itemHeight: number, count: number): number {
  const raw = Math.round(offsetY / itemHeight);
  return Math.max(0, Math.min(count - 1, raw));
}
