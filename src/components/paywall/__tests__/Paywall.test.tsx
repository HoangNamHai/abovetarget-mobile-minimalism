import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Paywall } from '../Paywall';
import type { SubscriptionValue } from '../../../contexts/subscription-context';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

const purchasePackage = jest.fn(async () => {});
const restorePurchases = jest.fn(async () => {});
const clearError = jest.fn();

let mockValue: SubscriptionValue;
let mockAuth: { isSignedIn: boolean };
let mockAuthRequired = true;

jest.mock('../../../contexts/subscription-context', () => ({
  useSubscription: () => mockValue,
}));
jest.mock('../../../contexts/auth-context', () => ({ useAppAuth: () => mockAuth }));
jest.mock('../../../config/env', () => ({ authRequired: () => mockAuthRequired }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

function pkg(identifier: string, packageType: string, priceString: string, introPrice: any = null) {
  return {
    identifier,
    packageType,
    product: {
      identifier: `prod_${identifier}`, title: identifier, description: '', price: 1, priceString,
      pricePerMonthString: packageType === 'ANNUAL' ? '$5.00' : null,
      currencyCode: 'USD', introPrice,
    },
  } as never;
}

const annual = pkg('annual', 'ANNUAL', '$59.99');
const monthly = pkg('monthly', 'MONTHLY', '$9.99');
// periodNumberOfUnits is 1 (one WEEK = 7 days) — keep this consistent with the
// Task 2 trial7 fixture; `periodNumberOfUnits: 7` here would mean a 49-day trial.
const trial7 = { price: 0, priceString: '$0.00', cycles: 1, period: 'P1W', periodUnit: 'WEEK', periodNumberOfUnits: 1 };
const annualTrial = pkg('annual', 'ANNUAL', '$59.99', trial7);

function baseValue(overrides: Partial<SubscriptionValue> = {}): SubscriptionValue {
  return {
    isPremium: false,
    planStatus: { label: 'Free', tone: 'free' },
    isLoading: false,
    isInitialized: true,
    error: null,
    packages: [annual, monthly],
    currentOffering: null,
    purchasePackage,
    restorePurchases,
    clearError,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockValue = baseValue();
  mockAuth = { isSignedIn: true };
  mockAuthRequired = true;
});

test('renders a row per package with its price', async () => {
  const { getByTestId, getByText } = await render(<Paywall onClose={jest.fn()} />);
  expect(getByTestId('pkg-annual')).toBeTruthy();
  expect(getByTestId('pkg-monthly')).toBeTruthy();
  expect(getByText('$59.99')).toBeTruthy();
  expect(getByText('$9.99')).toBeTruthy();
});

test('continue purchases the selected package', async () => {
  const { getByTestId } = await render(<Paywall onClose={jest.fn()} />);
  await fireEvent.press(getByTestId('pkg-monthly'));
  await fireEvent.press(getByTestId('paywall-continue'));
  await waitFor(() => expect(purchasePackage).toHaveBeenCalledWith(monthly));
});

test('restore calls restorePurchases', async () => {
  const { getByTestId } = await render(<Paywall onClose={jest.fn()} />);
  await fireEvent.press(getByTestId('paywall-restore'));
  expect(restorePurchases).toHaveBeenCalled();
});

test('close calls onClose', async () => {
  const onClose = jest.fn();
  const { getByTestId } = await render(<Paywall onClose={onClose} />);
  await fireEvent.press(getByTestId('paywall-close'));
  expect(onClose).toHaveBeenCalled();
});

test('shows the error message when present', async () => {
  mockValue = baseValue({ error: 'Payment failed' });
  const { getByText } = await render(<Paywall onClose={jest.fn()} />);
  expect(getByText('Payment failed')).toBeTruthy();
});

test('shows an unavailable state when there are no packages', async () => {
  mockValue = baseValue({ packages: [] });
  const { getByTestId } = await render(<Paywall onClose={jest.fn()} />);
  expect(getByTestId('paywall-unavailable')).toBeTruthy();
});

test('auto-closes once the user becomes premium', async () => {
  const onClose = jest.fn();
  mockValue = baseValue({ isPremium: true });
  await render(<Paywall onClose={onClose} />);
  await waitFor(() => expect(onClose).toHaveBeenCalled());
});

test('when signed out, continue routes to sign-in instead of purchasing', async () => {
  mockAuth = { isSignedIn: false };
  const { getByTestId } = await render(<Paywall onClose={jest.fn()} />);
  await fireEvent.press(getByTestId('pkg-monthly'));
  await fireEvent.press(getByTestId('paywall-continue'));
  expect(router.push).toHaveBeenCalledWith('/(auth)/sign-in');
  expect(purchasePackage).not.toHaveBeenCalled();
});

test('when signed out, restore routes to sign-in instead of restoring', async () => {
  mockAuth = { isSignedIn: false };
  const { getByTestId } = await render(<Paywall onClose={jest.fn()} />);
  await fireEvent.press(getByTestId('paywall-restore'));
  expect(router.push).toHaveBeenCalledWith('/(auth)/sign-in');
  expect(restorePurchases).not.toHaveBeenCalled();
});

test('renders the auto-renew disclosure for the selected plan', async () => {
  const { getByTestId } = await render(<Paywall onClose={jest.fn()} />);
  expect(getByTestId('paywall-disclosure')).toBeTruthy();
});

test('renders Terms and Privacy links', async () => {
  const { getByTestId } = await render(<Paywall onClose={jest.fn()} />);
  expect(getByTestId('paywall-terms')).toBeTruthy();
  expect(getByTestId('paywall-privacy')).toBeTruthy();
});

test('CTA shows the $0.00 trial label when the selected plan has a free trial', async () => {
  mockValue = baseValue({ packages: [annualTrial, monthly] });
  const { getByTestId, getByText } = await render(<Paywall onClose={jest.fn()} />);
  // annual is the default selection (defaultPackageId prefers ANNUAL)
  expect(getByText('Start — $0.00 today')).toBeTruthy();
  // selecting monthly (no trial) reverts the CTA
  await fireEvent.press(getByTestId('pkg-monthly'));
  expect(getByText('Continue')).toBeTruthy();
});

test('annual row shows the per-month anchor', async () => {
  const { getByText } = await render(<Paywall onClose={jest.fn()} />);
  expect(getByText('$5.00 / mo · billed yearly')).toBeTruthy();
});
