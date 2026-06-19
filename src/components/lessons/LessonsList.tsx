import React from 'react';
import { Image } from 'expo-image';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { lessonsIndex } from '../../data/lessons-data';
import { getLessonThumbnail } from '../../data/lesson-images';
import { useProgress } from '../../contexts/progress-context';
import { Txt } from '../primitives/Txt';
import { Hairline } from '../primitives/Hairline';
import { PressableFeedback } from '../primitives/PressableFeedback';
import { TOKENS } from '../../theme/tokens';

export function LessonsList() {
  const { progress } = useProgress();
  const completedIds = new Set(progress.recentAttempts.map((a) => a.lessonId));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: TOKENS.background }}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {lessonsIndex.map((module) => (
        <View key={module.moduleName}>
          {/* Module header */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 24,
              paddingBottom: 8,
              backgroundColor: TOKENS['surface-container-low'],
            }}
          >
            <Txt
              variant="label"
              style={{
                fontSize: 11,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: TOKENS.outline,
                marginBottom: 2,
              }}
            >
              {module.pathName}
            </Txt>
            <Txt
              variant="display"
              style={{
                fontSize: 18,
                color: TOKENS['on-background'],
              }}
            >
              {module.moduleName}
            </Txt>
          </View>
          <Hairline />

          {/* Lesson rows */}
          {module.lessons.map((lesson, index) => {
            const done = completedIds.has(lesson.id);
            return (
              <React.Fragment key={lesson.id}>
                <PressableFeedback onPress={() => router.push(`/lesson/${lesson.id}`)}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      backgroundColor: TOKENS['surface-container-lowest'],
                    }}
                  >
                    {/* Thumbnail */}
                    <Image
                      source={getLessonThumbnail(lesson.thumbnail)}
                      style={{
                        width: 72,
                        height: 52,
                        borderRadius: 6,
                        backgroundColor: TOKENS['surface-container'],
                      }}
                      contentFit="cover"
                    />

                    {/* Text content */}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Txt
                        variant="label"
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: TOKENS['on-background'],
                          marginBottom: 2,
                        }}
                        numberOfLines={2}
                      >
                        {lesson.title}
                      </Txt>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Txt
                          variant="label"
                          style={{
                            fontSize: 11,
                            color: TOKENS.outline,
                          }}
                        >
                          {lesson.domain}
                        </Txt>
                        <Txt
                          variant="label"
                          style={{
                            fontSize: 11,
                            color: TOKENS['surface-dim'],
                          }}
                        >
                          •
                        </Txt>
                        <Txt
                          variant="label"
                          style={{
                            fontSize: 11,
                            color: TOKENS.outline,
                          }}
                        >
                          {lesson.duration} min
                        </Txt>
                      </View>
                    </View>

                    {/* Done badge */}
                    {done && (
                      <View
                        style={{
                          marginLeft: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 12,
                          backgroundColor: TOKENS.primary,
                        }}
                      >
                        <Txt
                          variant="label"
                          style={{
                            fontSize: 10,
                            fontWeight: '700',
                            color: TOKENS['on-primary'],
                            letterSpacing: 0.5,
                          }}
                        >
                          Done
                        </Txt>
                      </View>
                    )}
                  </View>
                </PressableFeedback>
                {index < module.lessons.length - 1 && <Hairline />}
              </React.Fragment>
            );
          })}
          <Hairline />
        </View>
      ))}
    </ScrollView>
  );
}
