import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { NetworkProvider } from '../../contexts/network-context';
import { ClerkGate, AuthProvider } from '../../contexts/auth-context';
import { SubscriptionProvider } from '../../contexts/subscription-context';
import { createFakeNetworkService } from '../../services/infra/network';

// Smoke: the infra providers compose and render children with all flags dormant.
test('infra providers compose and render children (all dormant)', async () => {
  const net = createFakeNetworkService(true);
  const tree = await render(
    <NetworkProvider service={net}>
      <ClerkGate>
        <AuthProvider>
          <SubscriptionProvider>
            <Text>booted</Text>
          </SubscriptionProvider>
        </AuthProvider>
      </ClerkGate>
    </NetworkProvider>,
  );
  expect(tree.getByText('booted')).toBeTruthy();
});
