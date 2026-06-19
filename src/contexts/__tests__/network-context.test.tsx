import { render, screen, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { NetworkProvider, useNetwork } from '../network-context';
import { createFakeNetworkService } from '../../services/infra/network';

function Probe() {
  const { isConnected } = useNetwork();
  return <Text>{isConnected ? 'online' : 'offline'}</Text>;
}

test('NetworkProvider reflects fake service connectivity changes', async () => {
  const fake = createFakeNetworkService(true);
  await render(
    <NetworkProvider service={fake}>
      <Probe />
    </NetworkProvider>,
  );
  expect(screen.getByText('online')).toBeTruthy();
  await act(async () => fake.emit(false));
  expect(screen.getByText('offline')).toBeTruthy();
});
