import type { KeyValueStore } from './key-value-store';

export class InMemoryKeyValueStore implements KeyValueStore {
  private store = new Map<string, string>();

  /** Test helper: preload raw string values. */
  seed(record: Record<string, string>): void {
    for (const [k, v] of Object.entries(record)) this.store.set(k, v);
  }

  async getString(key: string): Promise<string | null> {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  async setString(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await this.getString(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  }

  async setJSON<T>(key: string, value: T): Promise<void> {
    await this.setString(key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key);
  }
}
