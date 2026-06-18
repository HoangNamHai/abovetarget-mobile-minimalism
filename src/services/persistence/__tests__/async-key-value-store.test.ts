import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncKeyValueStore } from '../async-key-value-store';

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('setString persists through AsyncStorage', async () => {
  const kv = new AsyncKeyValueStore();
  await kv.setString('@app/theme', 'dark');
  expect(await AsyncStorage.getItem('@app/theme')).toBe('dark');
  expect(await kv.getString('@app/theme')).toBe('dark');
});

test('getJSON parses stored JSON, null when absent', async () => {
  const kv = new AsyncKeyValueStore();
  await kv.setJSON('prefs', { dailyGoal: 3 });
  expect(await kv.getJSON('prefs')).toEqual({ dailyGoal: 3 });
  expect(await kv.getJSON('missing')).toBeNull();
});

test('remove deletes the key', async () => {
  const kv = new AsyncKeyValueStore();
  await kv.setString('k', 'v');
  await kv.remove('k');
  expect(await kv.getString('k')).toBeNull();
});

test('getJSON returns null for corrupt JSON', async () => {
  await AsyncStorage.setItem('bad', 'not-json{');
  expect(await new AsyncKeyValueStore().getJSON('bad')).toBeNull();
});
