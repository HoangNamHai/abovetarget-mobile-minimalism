import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, Pressable } from 'react-native';
import Purchases from 'react-native-purchases';
import { SubscriptionProviderLive, useSubscription } from '../subscription-context';

// The live provider reads the auth session to identify the RevenueCat user.
let mockAuth: { isSignedIn: boolean; isLoading: boolean; user: { id: string; email: string | null } | null };
jest.mock('../auth-context', () => ({ useAppAuth: () => mockAuth }));

// `Purchases` is the jest mock from jest-setup-mocks.js; cast its methods.
const mockPurchases = Purchases as unknown as {
  configure: jest.Mock;
  setLogLevel: jest.Mock;
  getCustomerInfo: jest.Mock;
  getOfferings: jest.Mock;
  purchasePackage: jest.Mock;
  restorePurchases: jest.Mock;
  logIn: jest.Mock;
  logOut: jest.Mock;
  isAnonymous: jest.Mock;
  addCustomerInfoUpdateListener: jest.Mock;
  removeCustomerInfoUpdateListener: jest.Mock;
};

const proActive = { entitlements: { active: { pro: { identifier: 'pro' } } } };
const proInactive = { entitlements: { active: {} } };

function makePackage(id: string) {
  return {
    identifier: id,
    packageType: 'MONTHLY',
    product: { identifier: `pmp_${id}`, title: id, description: id, price: 9.99, priceString: '$9.99' },
  };
}

const offeringWithPackages = {
  current: {
    identifier: 'default',
    availablePackages: [makePackage('monthly'), makePackage('annual')],
    monthly: makePackage('monthly'),
    annual: makePackage('annual'),
    lifetime: null,
  },
};

function Probe() {
  const { isPremium, isInitialized, error, packages, purchasePackage, restorePurchases, clearError } =
    useSubscription();
  return (
    <>
      <Text testID="state">{`${isPremium ? 'premium' : 'free'}:${isInitialized ? 'init' : 'pending'}:pkgs=${packages.length}:err=${error ?? 'none'}`}</Text>
      <Pressable testID="buy" onPress={() => purchasePackage(packages[0])}>
        <Text>buy</Text>
      </Pressable>
      <Pressable testID="restore" onPress={() => restorePurchases()}>
        <Text>restore</Text>
      </Pressable>
      <Pressable testID="clear" onPress={() => clearError()}>
        <Text>clear</Text>
      </Pressable>
    </>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth = { isSignedIn: false, isLoading: false, user: null };
  mockPurchases.getCustomerInfo.mockResolvedValue(proInactive);
  mockPurchases.getOfferings.mockResolvedValue(offeringWithPackages);
  mockPurchases.restorePurchases.mockResolvedValue(proInactive);
  mockPurchases.logIn.mockResolvedValue({ customerInfo: proInactive, created: false });
  mockPurchases.logOut.mockResolvedValue(proInactive);
  mockPurchases.isAnonymous.mockResolvedValue(true);
});

test('live provider configures, fetches offerings, exposes packages, reflects entitlement', async () => {
  await render(
    <SubscriptionProviderLive>
      <Probe />
    </SubscriptionProviderLive>,
  );
  await waitFor(() => expect(screen.getByTestId('state').props.children).toContain('init'));
  expect(mockPurchases.configure).toHaveBeenCalled();
  expect(screen.getByTestId('state').props.children).toBe('free:init:pkgs=2:err=none');
});

test('purchasePackage success makes the user premium', async () => {
  mockPurchases.purchasePackage.mockResolvedValue({ customerInfo: proActive });
  await render(
    <SubscriptionProviderLive>
      <Probe />
    </SubscriptionProviderLive>,
  );
  await waitFor(() => expect(screen.getByTestId('state').props.children).toContain('init'));
  fireEvent.press(screen.getByTestId('buy'));
  await waitFor(() => expect(screen.getByTestId('state').props.children).toContain('premium'));
  expect(screen.getByTestId('state').props.children).toContain('err=none');
});

test('user-cancelled purchase does not set an error', async () => {
  mockPurchases.purchasePackage.mockRejectedValue({ userCancelled: true, message: 'cancelled' });
  await render(
    <SubscriptionProviderLive>
      <Probe />
    </SubscriptionProviderLive>,
  );
  await waitFor(() => expect(screen.getByTestId('state').props.children).toContain('init'));
  fireEvent.press(screen.getByTestId('buy'));
  await waitFor(() => expect(mockPurchases.purchasePackage).toHaveBeenCalled());
  expect(screen.getByTestId('state').props.children).toBe('free:init:pkgs=2:err=none');
});

test('failed purchase sets an error which clearError resets', async () => {
  mockPurchases.purchasePackage.mockRejectedValue({ userCancelled: false, message: 'network down' });
  await render(
    <SubscriptionProviderLive>
      <Probe />
    </SubscriptionProviderLive>,
  );
  await waitFor(() => expect(screen.getByTestId('state').props.children).toContain('init'));
  fireEvent.press(screen.getByTestId('buy'));
  await waitFor(() => expect(screen.getByTestId('state').props.children).toContain('err=network down'));
  fireEvent.press(screen.getByTestId('clear'));
  await waitFor(() => expect(screen.getByTestId('state').props.children).toContain('err=none'));
});

test('restorePurchases reflects a restored entitlement', async () => {
  mockPurchases.restorePurchases.mockResolvedValue(proActive);
  await render(
    <SubscriptionProviderLive>
      <Probe />
    </SubscriptionProviderLive>,
  );
  await waitFor(() => expect(screen.getByTestId('state').props.children).toContain('init'));
  fireEvent.press(screen.getByTestId('restore'));
  await waitFor(() => expect(screen.getByTestId('state').props.children).toContain('premium'));
});

test('signing in identifies the RevenueCat user with the Clerk id and applies its entitlement', async () => {
  mockAuth = { isSignedIn: true, isLoading: false, user: { id: 'user_clerk_123', email: 'a@b.com' } };
  mockPurchases.logIn.mockResolvedValue({ customerInfo: proActive, created: false });
  await render(
    <SubscriptionProviderLive>
      <Probe />
    </SubscriptionProviderLive>,
  );
  await waitFor(() => expect(mockPurchases.logIn).toHaveBeenCalledWith('user_clerk_123'));
  await waitFor(() => expect(screen.getByTestId('state').props.children).toContain('premium'));
});

test('signing out (while identified) logs out of RevenueCat and drops premium', async () => {
  // Identified (not anonymous) user with an active entitlement, now signed out.
  mockAuth = { isSignedIn: false, isLoading: false, user: null };
  mockPurchases.isAnonymous.mockResolvedValue(false);
  mockPurchases.getCustomerInfo.mockResolvedValue(proActive); // device user still premium at first
  mockPurchases.logOut.mockResolvedValue(proInactive); // logOut → fresh anonymous, no entitlement
  await render(
    <SubscriptionProviderLive>
      <Probe />
    </SubscriptionProviderLive>,
  );
  await waitFor(() => expect(mockPurchases.logOut).toHaveBeenCalled());
  await waitFor(() => expect(screen.getByTestId('state').props.children).toContain('free'));
});

test('does not call logOut when already anonymous', async () => {
  mockAuth = { isSignedIn: false, isLoading: false, user: null };
  mockPurchases.isAnonymous.mockResolvedValue(true);
  await render(
    <SubscriptionProviderLive>
      <Probe />
    </SubscriptionProviderLive>,
  );
  await waitFor(() => expect(screen.getByTestId('state').props.children).toContain('init'));
  expect(mockPurchases.logOut).not.toHaveBeenCalled();
});

test('refreshes the entitlement on auth resolution even when already anonymous', async () => {
  // Signed out with a restorable device purchase (e.g. an anonymous lifetime).
  // We must NOT force "free" — we re-fetch so the Plan reflects the current
  // customer. Mount sees nothing; the auth-driven refresh surfaces the purchase.
  mockAuth = { isSignedIn: false, isLoading: false, user: null };
  mockPurchases.isAnonymous.mockResolvedValue(true);
  mockPurchases.getCustomerInfo.mockResolvedValueOnce(proInactive).mockResolvedValue(proActive);
  await render(
    <SubscriptionProviderLive>
      <Probe />
    </SubscriptionProviderLive>,
  );
  await waitFor(() => expect(screen.getByTestId('state').props.children).toContain('premium'));
  expect(mockPurchases.logOut).not.toHaveBeenCalled();
});
