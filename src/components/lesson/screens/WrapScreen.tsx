import React, { useEffect, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import type { WrapScreen as WrapScreenType } from '../../../types/lesson';
import type { Domain } from '../../../types/progress';
import { useLesson } from '../../../contexts/lesson-context';
import { useProgress } from '../../../contexts/progress-context';
import { useLessonLimit } from '../../../hooks/use-lesson-limit';
import { Txt } from '../../primitives/Txt';
import { Button } from '../../primitives/Button';
import { Hairline } from '../../primitives/Hairline';

// Maps lesson domain strings to progress Domain type
const DOMAIN_MAP: Record<string, Domain> = {
  People: 'people',
  Process: 'process',
  Business: 'business',
  'Business Environment': 'business',
};

type Props = {
  screen: WrapScreenType;
  onFinish: () => void;
};

export function WrapScreen({ screen, onFinish }: Props) {
  const { state } = useLesson();
  const { recordLessonAttempt } = useProgress();
  const { consumeLesson } = useLessonLimit();
  const recordedRef = useRef(false);

  const { lessonData, questionScores } = state;

  useEffect(() => {
    // Guard: only fire once
    if (recordedRef.current) return;
    if (!lessonData) return;

    recordedRef.current = true;

    const totalPoints = lessonData.scoring.totalPoints || 1;
    const scoreSum = Object.values(questionScores).reduce((acc, pts) => acc + pts, 0);
    const score = Math.min(100, Math.round((scoreSum / totalPoints) * 100));
    const questionCount = Object.keys(questionScores).length;
    const domain: Domain = DOMAIN_MAP[lessonData.domain] ?? 'process';

    recordLessonAttempt({
      lessonId: lessonData.lessonId,
      lessonTitle: lessonData.lessonTitle,
      questionCount,
      score,
      domain,
    });

    consumeLesson();
  }, [lessonData, questionScores, recordLessonAttempt, consumeLesson]);

  const { title, summary, key_takeaways } = screen.content;

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 24 }}>
      <Txt variant="display" className="text-3xl text-on-surface mb-4">
        {title}
      </Txt>
      <Hairline />
      <View className="mt-4 mb-6">
        <Txt variant="body" className="text-on-surface text-base leading-relaxed">
          {summary}
        </Txt>
      </View>
      {key_takeaways && key_takeaways.length > 0 ? (
        <View className="mb-8">
          <Txt variant="label" className="text-primary uppercase tracking-widest mb-4 text-xs">
            Key Takeaways
          </Txt>
          {key_takeaways.map((takeaway, index) => (
            <View key={index}>
              <View className="py-3">
                <Txt variant="body" className="text-on-surface text-base leading-relaxed">
                  {takeaway}
                </Txt>
              </View>
              {index < key_takeaways.length - 1 ? <Hairline /> : null}
            </View>
          ))}
        </View>
      ) : null}
      <Button label="Finish" onPress={onFinish} />
    </ScrollView>
  );
}
