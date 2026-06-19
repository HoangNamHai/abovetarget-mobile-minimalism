import React, { type ReactNode } from 'react';
import { render, renderHook } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../services/persistence';
import { PersistenceProvider, usePersistence } from '../persistence-context';

function Probe() {
  usePersistence();
  return null;
}

// React 19 surfaces render-time throws through the scheduler (not synchronously
// at the render() callsite), so an error boundary is the reliable way to assert
// them. RNTL's render/renderHook are async here and must be awaited.
let captured: Error | null = null as Error | null;
class Boundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError(error: Error) {
    captured = error;
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

test('usePersistence exposes the injected persistence', async () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PersistenceProvider value={createInMemoryPersistence()}>{children}</PersistenceProvider>
  );
  const { result } = await renderHook(() => usePersistence(), { wrapper });
  expect(result.current.attempts).toBeDefined();
  expect(result.current.kv).toBeDefined();
});

test('usePersistence throws outside the provider', async () => {
  captured = null;
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  await render(
    <Boundary>
      <Probe />
    </Boundary>,
  );
  expect(captured).not.toBeNull();
  expect((captured as Error | null)?.message).toMatch(/usePersistence/);
  spy.mockRestore();
});
