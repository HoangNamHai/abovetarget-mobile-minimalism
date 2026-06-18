import { InMemoryKeyValueStore } from '../in-memory-key-value-store';

test('setString then getString round-trips', async () => {
  const kv = new InMemoryKeyValueStore();
  await kv.setString('@app/theme', 'dark');
  expect(await kv.getString('@app/theme')).toBe('dark');
});

test('getString returns null for missing key', async () => {
  const kv = new InMemoryKeyValueStore();
  expect(await kv.getString('missing')).toBeNull();
});

test('setJSON then getJSON round-trips objects', async () => {
  const kv = new InMemoryKeyValueStore();
  await kv.setJSON('prefs', { dailyGoal: 2 });
  expect(await kv.getJSON<{ dailyGoal: number }>('prefs')).toEqual({ dailyGoal: 2 });
});

test('getJSON returns null for missing key', async () => {
  const kv = new InMemoryKeyValueStore();
  expect(await kv.getJSON('missing')).toBeNull();
});

test('remove deletes a key', async () => {
  const kv = new InMemoryKeyValueStore();
  await kv.setString('k', 'v');
  await kv.remove('k');
  expect(await kv.getString('k')).toBeNull();
});
