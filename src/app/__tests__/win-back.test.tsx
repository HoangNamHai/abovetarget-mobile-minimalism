import { render, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import WinBack from '../win-back';
import type { SubscriptionValue } from '../../contexts/subscription-context';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: any) => React.createElement(View, null, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

const purchasePackage = jest.fn(async () => {});
const restorePurchases = jest.fn(async () => {});

let mockValue: SubscriptionValue;
let mockAuth: { isSignedIn: boolean };
let mockAuthRequired = true;

jest.mock('../../contexts/subscription-context', () => ({ useSubscription: () => mockValue }));
jest.mock('../../contexts/auth-context', () => ({ useAppAuth: () => mockAuth }));
jest.mock('../../config/env', () => ({ authRequired: () => mockAuthRequired }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({ next: '/lesson/intro' }),
}));

const intro1y = { price: 39.99, priceString: '$39.99', cycles: 1, period: 'P1Y', periodUnit: 'YEAR', periodNumberOfUnits: 1 };
const winbackAnnual = {
  identifier: '$rc_annual',
  packageType: 'ANNUAL',
  product: {
    identifier: 'pmp_pro_annual_winback',
    title: 'PMP Pro Yearly',
    priceString: '$59.99',
    pricePerMonthString: '$5.00',
    currencyCode: 'USD',
    price: 59.99,
    introPrice: intro1y,
  },
} as never;

function baseValue(overrides: Partial<SubscriptionValue> = {}): SubscriptionValue {
  return {
    isPremium: false,
    planStatus: { label: 'Free', tone: 'free' },
    isLoading: false,
    isInitialized: true,
    error: null,
    packages: [],
    winbackPackages: [winbackAnnual],
    currentOffering: null,
    purchasePackage,
    restorePurchases,
    clearError: jest.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockValue = baseValue();
  mockAuth = { isSignedIn: true };
  mockAuthRequired = true;
});

test('shows the discounted intro offer (genuinely different from the paywall)', async () => {
  const { getByTestId, getByText } = await render(<WinBack />);
  // The intro is a PAID offer, not a free trial — disclosure must name both prices.
  const disc = getByTestId('winback-disclosure');
  expect(disc).toBeTruthy();
  expect(getByText(/\$39\.99 for the first year/)).toBeTruthy();
  expect(getByText(/Get 1 year — \$39\.99/)).toBeTruthy();
});

test('renders Restore, Terms and Privacy (App Store 3.1.2)', async () => {
  const { getByTestId } = await render(<WinBack />);
  expect(getByTestId('winback-restore')).toBeTruthy();
  expect(getByTestId('winback-terms')).toBeTruthy();
  expect(getByTestId('winback-privacy')).toBeTruthy();
});

test('when signed out, accept routes to sign-in instead of purchasing', async () => {
  mockAuth = { isSignedIn: false };
  const { getByTestId } = await render(<WinBack />);
  await fireEvent.press(getByTestId('winback-accept'));
  expect(router.push).toHaveBeenCalledWith('/(auth)/sign-in');
  expect(purchasePackage).not.toHaveBeenCalled();
});

test('when signed in, accept purchases the discounted win-back package', async () => {
  const { getByTestId } = await render(<WinBack />);
  await fireEvent.press(getByTestId('winback-accept'));
  expect(purchasePackage).toHaveBeenCalledWith(winbackAnnual);
});

test('the skip / close control exits forward to next', async () => {
  const { getByTestId } = await render(<WinBack />);
  await fireEvent.press(getByTestId('winback-skip'));
  expect(router.replace).toHaveBeenCalledWith('/lesson/intro');
});
