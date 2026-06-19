import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SubscriptionProvider, useSubscription } from '../subscription-context';
import { REVENUECAT_DISABLED } from '../../config/revenuecat';

function Probe() {
  const { isPremium, isInitialized } = useSubscription();
  return <Text>{`${isPremium ? 'premium' : 'free'}:${isInitialized ? 'init' : 'pending'}`}</Text>;
}

test('while REVENUECAT_DISABLED, everyone is premium and initialized', async () => {
  expect(REVENUECAT_DISABLED).toBe(true);
  await render(
    <SubscriptionProvider>
      <Probe />
    </SubscriptionProvider>,
  );
  expect(screen.getByText('premium:init')).toBeTruthy();
});
