import React from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { lessonsIndex } from '../../data/lessons-data';
import { getLessonThumbnail } from '../../data/lesson-images';
import { useProgress } from '../../contexts/progress-context';
import { Txt } from '../primitives/Txt';
import { Hairline } from '../primitives/Hairline';
import { PressableFeedback } from '../primitives/PressableFeedback';
import { TOKENS, RADIUS } from '../../theme/tokens';
import { ACCENTS } from '../../theme/accents';
import type { Domain } from '../../types/progress';
import type { Lesson } from '../../types/lesson';
import { DOMAIN_OF, DOMAIN_TITLE } from '../../data/domains';

type Props = {
  domainFilter?: Domain;
};

export function LessonsList({ domainFilter }: Props) {
  const { progress } = useProgress();
  const insets = useSafeAreaInsets();
  const completedIds = new Set(progress.recentAttempts.map((a) => a.lessonId));

  const matches = (lesson: Lesson) =>
    !domainFilter || DOMAIN_OF[lesson.domain] === domainFilter;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: TOKENS.background }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {domainFilter && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: TOKENS['surface-container'],
          }}
        >
          <Txt variant="label" style={{ fontSize: 12, letterSpacing: 1, color: TOKENS['on-background'] }}>
            FILTERED: {DOMAIN_TITLE[domainFilter].toUpperCase()}
          </Txt>
          <PressableFeedback onPress={() => router.replace('/(tabs)/lessons')}>
            <Txt variant="label" style={{ fontSize: 12, letterSpacing: 1, color: TOKENS.primary }}>
              SHOW ALL ›
            </Txt>
          </PressableFeedback>
        </View>
      )}
      {lessonsIndex
        .map((module) => ({ ...module, lessons: module.lessons.filter(matches) }))
        .filter((module) => module.lessons.length > 0)
        .map((module) => (
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

          {/* Lesson cards */}
          {module.lessons.map((lesson) => {
            const done = completedIds.has(lesson.id);
            return (
              <PressableFeedback key={lesson.id} onPress={() => router.push(`/lesson/${lesson.id}`)}>
                <View
                  style={{
                    marginHorizontal: 16,
                    marginTop: 16,
                    height: 280,
                    borderRadius: RADIUS.media,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: TOKENS['outline-variant'],
                    backgroundColor: TOKENS['surface-container'],
                  }}
                >
                  {/* Full-bleed illustration */}
                  <Image
                    source={getLessonThumbnail(lesson.thumbnail)}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    transition={200}
                  />
                  {/* Gradient fade so the overlaid text stays legible — kept to the
                      bottom band only so the illustration above stays bright. */}
                  <LinearGradient
                    colors={['transparent', 'transparent', 'rgba(0,0,0,0.85)']}
                    locations={[0, 0.55, 1]}
                    style={StyleSheet.absoluteFill}
                  />

                  {/* Done badge — overlaid top-right */}
                  {done && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: RADIUS.pill,
                        backgroundColor: ACCENTS.success,
                      }}
                    >
                      <Txt
                        variant="label"
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: TOKENS['on-primary'],
                          letterSpacing: 0.5,
                          textTransform: 'uppercase',
                        }}
                      >
                        Done
                      </Txt>
                    </View>
                  )}

                  {/* Text overlaid at the bottom */}
                  <View style={{ flex: 1, padding: 16, justifyContent: 'flex-end' }}>
                    <Txt
                      variant="label"
                      style={{ fontSize: 19, fontWeight: '700', color: '#ffffff', marginBottom: 6 }}
                      numberOfLines={2}
                    >
                      {lesson.title}
                    </Txt>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Txt variant="label" style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                        {lesson.domain}
                      </Txt>
                      <Txt variant="label" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                        •
                      </Txt>
                      <Txt variant="label" style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                        {lesson.duration} min
                      </Txt>
                      {/* Dev-only lesson ID for testing/navigation. */}
                      {__DEV__ ? (
                        <>
                          <Txt variant="label" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                            •
                          </Txt>
                          <Txt variant="label" style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                            {lesson.id}
                          </Txt>
                        </>
                      ) : null}
                    </View>
                  </View>
                </View>
              </PressableFeedback>
            );
          })}
          <View style={{ height: 8 }} />
        </View>
      ))}
    </ScrollView>
  );
}
