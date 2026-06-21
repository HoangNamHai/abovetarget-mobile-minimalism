import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { RevealScreen } from '../../components/onboarding/RevealScreen';
import { useOnboarding } from '../../contexts/onboarding-context';
import { buildPlan } from '../../lib/onboarding/onboarding-plan';
import { getAllLessons } from '../../data/lessons-data';
import { REVENUECAT_ENABLED } from '../../config/env';
import type { Domain } from '../../types/progress';

export default function Reveal() {
  const { confidence, examDate, experience, dailyMinutes, focusDomain, setDailyGoal, completeOnboarding } = useOnboarding();
  const [preparing, setPreparing] = useState(true);

  const plan = useMemo(
    () => buildPlan({
      confidence, examDate, experience, dailyMinutes,
      chosenDomain: (focusDomain as Domain) || 'process',
      totalLessons: getAllLessons().length, now: Date.now(),
    }),
    [confidence, examDate, experience, dailyMinutes, focusDomain],
  );

  useEffect(() => {
    setDailyGoal(plan.dailyGoal);
    const t = setTimeout(() => setPreparing(false), 2000);
    return () => clearTimeout(t);
  }, [plan.dailyGoal, setDailyGoal]);

  const readyByLabel = plan.readyByDate
    ? new Date(plan.readyByDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;

  async function onContinue() {
    await completeOnboarding();
    if (REVENUECAT_ENABLED) router.push('/paywall');
    else router.replace('/');
  }

  return (
    <RevealScreen
      preparing={preparing}
      plan={plan}
      readyByLabel={readyByLabel}
      ctaLabel="Unlock my plan"
      onContinue={onContinue}
    />
  );
}
