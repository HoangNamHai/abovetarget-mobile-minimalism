import React, { type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { SoundProvider, useSoundContext } from '../sound-context';

const wrapper = ({ children }: { children: ReactNode }) => <SoundProvider>{children}</SoundProvider>;

test('initializes a sound state and reports availability', async () => {
  const { result } = await renderHook(() => useSoundContext(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.soundState).not.toBeNull();
  // Audio playback deferred to Phase 5 — nothing is "available" yet.
  expect(result.current.isSoundAvailable('ui-tap')).toBe(false);
});
