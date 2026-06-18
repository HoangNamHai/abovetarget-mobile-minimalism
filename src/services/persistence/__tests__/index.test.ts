import {
  createInMemoryPersistence,
  createPersistence,
  InMemoryKeyValueStore,
  InMemoryAttemptRepository,
} from '../index';

test('createInMemoryPersistence wires fakes that satisfy the interfaces', async () => {
  const p = createInMemoryPersistence();
  expect(p.kv).toBeInstanceOf(InMemoryKeyValueStore);
  expect(p.attempts).toBeInstanceOf(InMemoryAttemptRepository);
  await p.kv.setString('k', 'v');
  expect(await p.kv.getString('k')).toBe('v');
});

test('createPersistence boots against mocked native modules', async () => {
  const p = await createPersistence();
  await p.attempts.record({
    id: 'a', lessonId: 'A1L1', lessonTitle: 'Intro', questionCount: 5,
    score: 80, completedAt: '2026-06-19T10:00:00.000Z', domain: 'process',
  });
  expect(await p.attempts.count()).toBe(1);
});
