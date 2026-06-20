export interface KeyValueStore {
  getString(key: string): Promise<string | null>;
  setString(key: string, value: string): Promise<void>;
  getJSON<T>(key: string): Promise<T | null>;
  setJSON<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  /** Wipe every key in the store. Dev/reset use only. */
  clear(): Promise<void>;
}
