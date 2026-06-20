// Mock expo-router so router.replace()/back() don't crash in tests
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));

// Mock expo-image (WrapScreen renders the next-lesson thumbnail)
jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { Image: ({ testID }: { testID?: string }) => React.createElement(View, { testID }) };
});

// Mock @expo/vector-icons (ReasonScreen renders accordion chevrons)
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { MaterialIcons: ({ name }: { name: string }) => React.createElement(Text, null, name) };
});

import React, { type ReactNode } from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../../services/persistence';
import { PersistenceProvider } from '../../../../contexts/persistence-context';
import { ProgressProvider } from '../../../../contexts/progress-context';
import { SubscriptionProvider } from '../../../../contexts/subscription-context';
import { LessonProvider, useLesson } from '../../../../contexts/lesson-context';
import { WrapScreen } from '../WrapScreen';
import { ReasonScreen } from '../ReasonScreen';
import { PracticeScreen } from '../PracticeScreen';

function providers(persistence = createInMemoryPersistence()) {
  return ({ children }: { children: ReactNode }) => (
    <PersistenceProvider value={persistence}>
      <SubscriptionProvider>
        <ProgressProvider>
          <LessonProvider>{children}</LessonProvider>
        </ProgressProvider>
      </SubscriptionProvider>
    </PersistenceProvider>
  );
}

// Loads a real lesson, jumps to wrap, asserts the attempt is recorded.
function WrapHarness({ onReady }: { onReady: (count: () => Promise<number>) => void }) {
  const { loadLesson, state } = useLesson();
  React.useEffect(() => { loadLesson('A1L1'); }, [loadLesson]);
  if (!state.lessonData) return null;
  const wrap = state.lessonData.screens.find((s) => s.screen_type === 'wrap')!;
  return <WrapScreen screen={wrap} onFinish={() => {}} />;
}

test('wrap screen records a progress attempt on mount', async () => {
  const persistence = createInMemoryPersistence();
  await render(<WrapHarness onReady={() => {}} />, { wrapper: providers(persistence) });
  await waitFor(async () => expect(await persistence.attempts.count()).toBe(1));
});

// Loads a real multi-tab lesson and renders its reason (Theory) screen.
function ReasonHarness({ lessonId }: { lessonId: string }) {
  const { loadLesson, state } = useLesson();
  React.useEffect(() => { loadLesson(lessonId); }, [loadLesson, lessonId]);
  if (!state.lessonData) return null;
  const reason = state.lessonData.screens.find((s) => s.screen_type === 'reason')!;
  return <ReasonScreen screen={reason as never} />;
}

test('reason screen renders ALL concept tabs, not just the first', async () => {
  const { findByText, getByText } = await render(<ReasonHarness lessonId="B1L4" />, {
    wrapper: providers(),
  });
  // B1L4 has 5 reason tabs — every header must render (accordion shows all).
  await findByText('Communication Channels Formula');
  expect(getByText("Brooks's Law")).toBeTruthy();
  expect(getByText('Synchronous vs Asynchronous')).toBeTruthy();
  expect(getByText('Rich vs Lean Channels')).toBeTruthy();
  expect(getByText('Communication Barriers')).toBeTruthy();
});

// Renders a lesson's practice screen (first question shown).
function PracticeHarness({ lessonId }: { lessonId: string }) {
  const { loadLesson, state } = useLesson();
  React.useEffect(() => { loadLesson(lessonId); }, [loadLesson, lessonId]);
  if (!state.lessonData) return null;
  const practice = state.lessonData.screens.find((s) => s.screen_type === 'practice')!;
  return <PracticeScreen screen={practice as never} />;
}

test('a scenario question renders its situation/context, not just the prompt', async () => {
  const { findByText } = await render(<PracticeHarness lessonId="B2L3" />, { wrapper: providers() });
  // The B2L3 practice question is unanswerable without its situation paragraph.
  await findByText(/facilitating a meeting between two team members/i);
});
