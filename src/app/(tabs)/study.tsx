import React, { useState } from 'react';
import { IntroScreen } from '../../components/intro/IntroScreen';
import { QuizScreen } from '../../components/quiz/QuizScreen';
import { ELITE_QUIZ_12, MONOGRAPH_QUIZ_1 } from '../../data/questions';
import { useBrand } from '../../theme/brand-context';

type Step = 'intro' | 'quiz';

export default function Study() {
  const { brand } = useBrand();
  const [step, setStep] = useState<Step>('intro');

  const question = brand === 'elite' ? ELITE_QUIZ_12 : MONOGRAPH_QUIZ_1;

  if (step === 'intro') {
    return <IntroScreen onContinue={() => setStep('quiz')} />;
  }

  return <QuizScreen question={question} />;
}
