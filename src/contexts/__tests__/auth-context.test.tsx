import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAppAuth, ClerkGate } from '../auth-context';

function Probe() {
  const { isSignedIn, isLoading } = useAppAuth();
  return <Text>{`${isSignedIn ? 'in' : 'out'}:${isLoading ? 'loading' : 'ready'}`}</Text>;
}

test('without a Clerk key, ClerkGate is a passthrough and auth is the signed-out stub', async () => {
  await render(
    <ClerkGate>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </ClerkGate>,
  );
  expect(screen.getByText('out:ready')).toBeTruthy();
});
