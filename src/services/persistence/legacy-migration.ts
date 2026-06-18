import type { LessonAttempt } from '../../types/progress';
import type { KeyValueStore } from './key-value-store';
import type { AttemptRepository } from './attempt-repository';

const LEGACY_PROGRESS_KEY = '@pmp/user-progress';
const CARRY_OVER_KEY = '@pmp/v2/carry-over';
const MIGRATED_KEY = '@pmp/v2/migrated';

export interface LegacyProgressBlob {
  recentAttempts?: LessonAttempt[];
  streakFreeze?: unknown;
  activeDays?: string[];
  bestStreak?: number;
}

export function transformLegacyProgress(blob: LegacyProgressBlob): {
  attempts: LessonAttempt[];
  carryOver: { streakFreeze: unknown; bestStreak: number; activeDays: string[] };
} {
  return {
    attempts: blob.recentAttempts ?? [],
    carryOver: {
      streakFreeze: blob.streakFreeze ?? null,
      bestStreak: blob.bestStreak ?? 0,
      activeDays: blob.activeDays ?? [],
    },
  };
}

export async function runLegacyMigration(deps: {
  kv: KeyValueStore;
  attempts: AttemptRepository;
}): Promise<boolean> {
  const { kv, attempts } = deps;
  if ((await kv.getString(MIGRATED_KEY)) === 'true') return false;
  const blob = await kv.getJSON<LegacyProgressBlob>(LEGACY_PROGRESS_KEY);
  if (blob === null) return false;

  const { attempts: legacyAttempts, carryOver } = transformLegacyProgress(blob);
  for (const a of legacyAttempts) {
    await attempts.record(a);
  }
  await kv.setJSON(CARRY_OVER_KEY, carryOver);
  await kv.setString(MIGRATED_KEY, 'true');
  return true;
}
