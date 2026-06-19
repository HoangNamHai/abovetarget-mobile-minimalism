import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import type { WrapScreen as WrapScreenType } from '../../../types/lesson';
import type { Domain } from '../../../types/progress';
import { useLesson } from '../../../contexts/lesson-context';
import { useProgress } from '../../../contexts/progress-context';
import { useLessonLimit } from '../../../hooks/use-lesson-limit';
import { getAllLessons } from '../../../data/lessons-data';
import { getLessonThumbnail } from '../../../data/lesson-images';
import { TOKENS } from '../../../theme/tokens';
import { Txt } from '../../primitives/Txt';
import { RichText } from '../../primitives/RichText';
import { Appear } from '../../primitives/Appear';
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
  const hasTakeaways = !!key_takeaways && key_takeaways.length > 0;

  // Lesson score (same formula used to record the attempt).
  const totalPoints = lessonData?.scoring.totalPoints || 1;
  const scoreSum = Object.values(questionScores).reduce((acc, pts) => acc + pts, 0);
  const scorePct = Math.min(100, Math.round((scoreSum / totalPoints) * 100));

  // Next lesson in curriculum order (null when this was the last one).
  const allLessons = getAllLessons();
  const currentIdx = allLessons.findIndex((l) => l.id === lessonData?.lessonId);
  const nextLesson = currentIdx >= 0 ? allLessons[currentIdx + 1] ?? null : null;

  let step = 0;

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 24 }}>
      <Appear index={step++}>
        <Txt variant="label" className="text-primary uppercase tracking-widest mb-2 text-xs">
          Lesson Complete
        </Txt>
        <Txt variant="display" className="text-3xl text-on-surface mb-4" style={{ lineHeight: 42 }}>
          {title}
        </Txt>
        <Hairline />
      </Appear>

      {/* Score */}
      <Appear index={step++}>
        <View
          style={{
            marginTop: 24,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: TOKENS['outline-variant'],
            backgroundColor: TOKENS['surface-container-lowest'],
            borderRadius: 4,
            padding: 24,
            alignItems: 'center',
          }}
        >
          <Txt variant="label" style={{ fontSize: 11, letterSpacing: 4, color: TOKENS.outline, marginBottom: 4 }}>
            YOUR SCORE
          </Txt>
          <Txt variant="display" style={{ fontSize: 64, lineHeight: 72, color: TOKENS['on-background'], letterSpacing: -2 }}>
            {scorePct}%
          </Txt>
          <Txt variant="label" style={{ fontSize: 13, letterSpacing: 1, color: TOKENS.outline }}>
            {scoreSum} OF {totalPoints} POINTS
          </Txt>
        </View>
      </Appear>

      <Appear index={step++}>
        <View className="mb-6">
          <RichText className="text-on-surface text-lg leading-relaxed">{summary}</RichText>
        </View>
      </Appear>

      {hasTakeaways ? (
        <View className="mb-8">
          <Appear index={step++}>
            <Txt variant="label" className="text-primary uppercase tracking-widest mb-4 text-xs">
              Key Takeaways
            </Txt>
          </Appear>
          {key_takeaways!.map((takeaway, index) => (
            <Appear key={index} index={step++}>
              <View>
                <View className="py-3">
                  <RichText className="text-on-surface text-lg leading-relaxed">{takeaway}</RichText>
                </View>
                {index < key_takeaways!.length - 1 ? <Hairline /> : null}
              </View>
            </Appear>
          ))}
        </View>
      ) : null}

      {/* Next lesson */}
      {nextLesson ? (
        <Appear index={step++}>
          <Txt variant="label" className="text-primary uppercase tracking-widest mb-3 text-xs">
            Up Next
          </Txt>
          <View
            style={{
              borderWidth: 1,
              borderColor: TOKENS['outline-variant'],
              backgroundColor: TOKENS['surface-container-lowest'],
              borderRadius: 8,
              overflow: 'hidden',
              marginBottom: 16,
            }}
          >
            <Image
              source={getLessonThumbnail(nextLesson.thumbnail)}
              style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: TOKENS['surface-container'] }}
              contentFit="cover"
              transition={200}
            />
            <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
              <Txt variant="label" style={{ fontSize: 17, fontWeight: '700', color: TOKENS['on-background'], marginBottom: 6 }}>
                {nextLesson.title}
              </Txt>
              <Txt variant="label" style={{ fontSize: 12, letterSpacing: 1, color: TOKENS.outline }}>
                {nextLesson.domain.toUpperCase()} · {nextLesson.duration} MIN
              </Txt>
            </View>
          </View>
          <Button label="Next Lesson" onPress={() => router.replace(`/lesson/${nextLesson.id}`)} />
          <View style={{ height: 12 }} />
          <Button label="Back to Lessons" onPress={onFinish} variant="secondary" />
        </Appear>
      ) : (
        <Appear index={step++}>
          <View style={{ marginBottom: 12 }}>
            <Txt variant="display" style={{ fontSize: 20, color: TOKENS['on-background'], marginBottom: 12 }}>
              COURSE COMPLETE.
            </Txt>
          </View>
          <Button label="Back to Lessons" onPress={onFinish} />
        </Appear>
      )}
    </ScrollView>
  );
}
