import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { createInMemoryPersistence } from '../../services/persistence';
import { PersistenceProvider, usePersistence } from '../persistence-context';

function Probe() {
  const p = usePersistence();
  return <Text>{p.attempts ? 'ready' : 'no'}</Text>;
}

test('usePersistence exposes the injected persistence', () => {
  render(
    <PersistenceProvider value={createInMemoryPersistence()}>
      <Probe />
    </PersistenceProvider>,
  );
});

test('usePersistence throws outside the provider', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  expect(() => render(<Probe />)).toThrow(/usePersistence/);
  spy.mockRestore();
});
