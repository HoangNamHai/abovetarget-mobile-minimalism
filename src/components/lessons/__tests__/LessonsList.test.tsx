// Mock expo-image — just render a plain View (no native image decoding needed in tests)
jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: ({ testID }: any) => React.createElement(View, { testID }),
  };
});

// Mock expo-router so router.push() doesn't crash in tests
jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    navigate: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

import React, { type ReactNode } from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../services/persistence';
import { PersistenceProvider } from '../../../contexts/persistence-context';
import { ProgressProvider } from '../../../contexts/progress-context';
import { LessonsList } from '../LessonsList';

const wrap = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider value={createInMemoryPersistence()}>
    <ProgressProvider>{children}</ProgressProvider>
  </PersistenceProvider>
);

test('renders a known lesson title from the bundled index', async () => {
  const { getByText } = await render(<LessonsList />, { wrapper: wrap });
  await waitFor(() => expect(getByText('What is Project Management?')).toBeTruthy());
});
