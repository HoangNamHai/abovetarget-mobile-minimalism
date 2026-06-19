import React, { type ReactNode } from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../../services/persistence';
import { PersistenceProvider } from '../../../../contexts/persistence-context';
import { ProgressProvider } from '../../../../contexts/progress-context';
import { SubscriptionProvider } from '../../../../contexts/subscription-context';
import { LessonProvider, useLesson } from '../../../../contexts/lesson-context';
import { WrapScreen } from '../WrapScreen';

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
