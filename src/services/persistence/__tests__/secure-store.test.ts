import { InMemorySecureStore } from '../in-memory-secure-store';
import { ExpoSecureStore } from '../secure-store-impl';

test('in-memory secure store round-trips and removes', async () => {
  const s = new InMemorySecureStore();
  await s.setItem('subscription_isPremium', 'true');
  expect(await s.getItem('subscription_isPremium')).toBe('true');
  await s.removeItem('subscription_isPremium');
  expect(await s.getItem('subscription_isPremium')).toBeNull();
});

test('expo secure store round-trips via the SDK', async () => {
  const s = new ExpoSecureStore();
  await s.setItem('token', 'abc');
  expect(await s.getItem('token')).toBe('abc');
  await s.removeItem('token');
  expect(await s.getItem('token')).toBeNull();
});
