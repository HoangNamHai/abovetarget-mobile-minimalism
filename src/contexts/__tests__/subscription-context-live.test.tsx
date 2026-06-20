import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, Pressable } from 'react-native';
import Purchases from 'react-native-purchases';
import { SubscriptionProviderLive, useSubscription } from '../subscription-context';

// `Purchases` is the jest mock from jest-setup-mocks.js; cast its methods.
const mockPurchases = Purchases as unknown as {
  configure: jest.Mock;
  setLogLevel: jest.Mock;
  getCustomerInfo: jest.Mock;
  getOfferings: jest.Mock;
  purchasePackage: jest.Mock;
  restorePurchases: jest.Mock;
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
  mockPurchases.getCustomerInfo.mockResolvedValue(proInactive);
  mockPurchases.getOfferings.mockResolvedValue(offeringWithPackages);
  mockPurchases.restorePurchases.mockResolvedValue(proInactive);
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
