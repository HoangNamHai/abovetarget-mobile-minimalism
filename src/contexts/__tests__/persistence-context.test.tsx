import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { createInMemoryPersistence } from '../../services/persistence';
import { PersistenceProvider, usePersistence } from '../persistence-context';

function Probe() {
  const p = usePersistence();
  return <Text>{p.attempts ? 'ready' : 'no'}</Text>;
}

test('usePersistence exposes the injected persistence', async () => {
  await render(
    <PersistenceProvider value={createInMemoryPersistence()}>
      <Probe />
    </PersistenceProvider>,
  );
  expect(screen.getByText('ready')).toBeTruthy();
});

test('usePersistence throws outside the provider', async () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  await expect(render(<Probe />)).rejects.toThrow(/usePersistence/);
  spy.mockRestore();
});
