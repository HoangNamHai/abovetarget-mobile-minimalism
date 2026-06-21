import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Txt } from '../primitives/Txt';
import { TOKENS, RADIUS } from '../../theme/tokens';
import { getLessonThumbnail } from '../../data/lesson-images';
import type { Lesson } from '../../types/lesson';

export function OnboardingLessonCard({ lesson }: { lesson: Lesson }) {
  return (
    <View style={{
      width: 160, borderRadius: RADIUS.media, overflow: 'hidden',
      borderWidth: 1, borderColor: TOKENS['outline-variant'],
      backgroundColor: TOKENS['surface-container-lowest'],
    }}>
      <Image
        source={getLessonThumbnail(lesson.thumbnail)}
        style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: TOKENS['surface-container'] }}
        contentFit="cover"
        transition={150}
      />
      <View style={{ padding: 10, gap: 4 }}>
        <Txt variant="label" style={{ fontSize: 13, fontWeight: '700', color: TOKENS['on-background'] }} numberOfLines={2}>
          {lesson.title}
        </Txt>
        <Txt variant="label" style={{ fontSize: 11, color: TOKENS.outline }}>{lesson.duration} min</Txt>
      </View>
    </View>
  );
}
