import React from 'react';
import { View, type ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../primitives/Button';
import { Txt } from '../primitives/Txt';
import { TOKENS, RADIUS } from '../../theme/tokens';
import { OnboardingProgress } from './OnboardingProgress';

type Props = {
  eyebrow?: string;
  title: string;
  body?: string;
  ctaLabel?: string;
  onContinue: () => void;
  progress?: number | null;
  /** Optional illustration shown above the copy, filling the upper space. */
  image?: ImageSourcePropType;
};

export function ValueScreen({ eyebrow, title, body, ctaLabel = 'Continue', onContinue, progress, image }: Props) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 48, gap: 24 }}>
        {progress != null && <OnboardingProgress progress={progress} />}
        {image && (
          <View
            style={{
              borderRadius: RADIUS.media,
              overflow: 'hidden',
              backgroundColor: TOKENS['surface-container'],
              aspectRatio: 4 / 3,
              width: '100%',
            }}
          >
            <Image source={image} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={250} />
          </View>
        )}
        <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
          {eyebrow ? (
            <Txt variant="label" style={{ fontSize: 11, letterSpacing: 4, color: TOKENS.outline, textTransform: 'uppercase' }}>
              {eyebrow}
            </Txt>
          ) : null}
          <Txt variant="display" style={{ fontSize: 40, lineHeight: 44, letterSpacing: -1, color: TOKENS.primary }}>
            {title}
          </Txt>
          {body ? (
            <Txt variant="body" style={{ fontSize: 16, lineHeight: 24, color: TOKENS.outline }}>
              {body}
            </Txt>
          ) : null}
        </View>
        <Button label={ctaLabel} onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}
