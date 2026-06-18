import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KeyValueStore } from './key-value-store';

export class AsyncKeyValueStore implements KeyValueStore {
  async getString(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  async setString(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await this.getString(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setJSON<T>(key: string, value: T): Promise<void> {
    await this.setString(key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
}
