import type { KeyValueStore } from './key-value-store';
import type { SecureKeyValueStore } from './secure-key-value-store';
import type { AttemptRepository } from './attempt-repository';
import { AsyncKeyValueStore } from './async-key-value-store';
import { InMemoryKeyValueStore } from './in-memory-key-value-store';
import { ExpoSecureStore } from './secure-store-impl';
import { InMemorySecureStore } from './in-memory-secure-store';
import { SqliteAttemptRepository } from './sqlite-attempt-repository';
import { InMemoryAttemptRepository } from './in-memory-attempt-repository';
import { openDatabase } from './database';
import { runLegacyMigration } from './legacy-migration';

export interface Persistence {
  kv: KeyValueStore;
  secure: SecureKeyValueStore;
  attempts: AttemptRepository;
}

export async function createPersistence(): Promise<Persistence> {
  const kv = new AsyncKeyValueStore();
  const secure = new ExpoSecureStore();
  const db = await openDatabase();
  const attempts = new SqliteAttemptRepository(db);
  await runLegacyMigration({ kv, attempts });
  return { kv, secure, attempts };
}

export function createInMemoryPersistence(): Persistence {
  return {
    kv: new InMemoryKeyValueStore(),
    secure: new InMemorySecureStore(),
    attempts: new InMemoryAttemptRepository(),
  };
}

export type { KeyValueStore } from './key-value-store';
export type { SecureKeyValueStore } from './secure-key-value-store';
export type { AttemptRepository } from './attempt-repository';
export { InMemoryKeyValueStore } from './in-memory-key-value-store';
export { InMemorySecureStore } from './in-memory-secure-store';
export { InMemoryAttemptRepository } from './in-memory-attempt-repository';
export { transformLegacyProgress, runLegacyMigration } from './legacy-migration';
export {
  deriveActiveDays,
  deriveDomainCompletion,
  deriveOverall,
} from './attempt-derivations';
