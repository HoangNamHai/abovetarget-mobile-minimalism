import { maybeAskForReview, __resetReviewAskForTests } from '../review-ask';

const mockIsAvailableAsync = jest.fn(async () => true);
const mockRequestReview = jest.fn(async () => {});
jest.mock('expo-store-review', () => ({
  isAvailableAsync: () => mockIsAvailableAsync(),
  requestReview: () => mockRequestReview(),
}));

const store: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: async (k: string) => store[k] ?? null,
  setItem: async (k: string, v: string) => { store[k] = v; },
}));

beforeEach(() => {
  jest.clearAllMocks();
  for (const k of Object.keys(store)) delete store[k];
  __resetReviewAskForTests();
});

test('requests a review when available and not yet asked', async () => {
  await maybeAskForReview();
  expect(mockRequestReview).toHaveBeenCalledTimes(1);
});

test('never asks twice', async () => {
  await maybeAskForReview();
  await maybeAskForReview();
  expect(mockRequestReview).toHaveBeenCalledTimes(1);
});

test('no-ops when the API is unavailable', async () => {
  mockIsAvailableAsync.mockResolvedValueOnce(false);
  await maybeAskForReview();
  expect(mockRequestReview).not.toHaveBeenCalled();
});

test('swallows errors', async () => {
  mockRequestReview.mockRejectedValueOnce(new Error('nope'));
  await expect(maybeAskForReview()).resolves.toBeUndefined();
});
