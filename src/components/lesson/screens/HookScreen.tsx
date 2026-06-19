import { Image } from 'expo-image';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useLesson } from '../../../contexts/lesson-context';
import { getLessonImage, hasLessonImage } from '../../../data/lesson-images';
import { TOKENS } from '../../../theme/tokens';
import type { CharacterQuote, HookScreen as HookScreenType } from '../../../types/lesson';
import { Appear } from '../../primitives/Appear';
import { Button } from '../../primitives/Button';
import { Hairline } from '../../primitives/Hairline';
import { RichText } from '../../primitives/RichText';
import { Txt } from '../../primitives/Txt';
import { FailureCarousel } from '../FailureCarousel';

type Props = {
  screen: HookScreenType;
};

export function HookScreen({ screen }: Props) {
  const { nextScreen } = useLesson();
  const { headline, intro, failure_cards, carousel, character_quote, learning_hook } = screen.content;

  // Build the ordered list of sections so the stagger index stays correct even
  // when optional blocks (cards, quote) are absent.
  let step = 0;

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
      <Appear index={step++}>
        <Txt variant="display" className="text-3xl text-on-surface mb-4" style={{ lineHeight: 42 }}>
          {headline}
        </Txt>
        <Hairline />
      </Appear>

      <Appear index={step++}>
        <View className="mt-4 mb-4">
          <RichText className="text-on-surface text-lg leading-relaxed">{intro}</RichText>
        </View>
      </Appear>

      {failure_cards && failure_cards.length > 0 && (
        <Appear index={step++}>
          <View className="mb-6">
            <FailureCarousel
              cards={failure_cards}
              showIndicators={carousel?.showIndicators ?? true}
            />
          </View>
        </Appear>
      )}

      {character_quote && (
        <Appear index={step++}>
          <View className="mb-6">
            <CharacterQuoteCard quote={character_quote} />
          </View>
        </Appear>
      )}

      <Appear index={step++}>
        <Hairline />
        <View className="mt-4 mb-8">
          <Txt variant="label" className="text-primary uppercase tracking-widest mb-2 text-xs">
            Learning Hook
          </Txt>
          <RichText className="text-on-surface text-lg leading-relaxed">{learning_hook}</RichText>
        </View>
      </Appear>

      <Appear index={step++}>
        <Button label="Continue" onPress={nextScreen} />
      </Appear>
    </ScrollView>
  );
}

// ─── Character quote ──────────────────────────────────────────────────────────

function CharacterQuoteCard({ quote }: { quote: CharacterQuote }) {
  const avatarPath = `/images/char_${quote.character}.webp`;
  const hasAvatar = hasLessonImage(avatarPath);

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        borderRadius: 4,
        backgroundColor: TOKENS['surface-container-low'],
        borderLeftWidth: 3,
        borderLeftColor: TOKENS.primary,
      }}
    >
      {hasAvatar && (
        <Image
          source={getLessonImage(avatarPath)}
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            backgroundColor: TOKENS['surface-container'],
          }}
          contentFit="cover"
          transition={200}
        />
      )}
      <View style={{ flex: 1 }}>
        <RichText className="text-on-surface text-base leading-relaxed" style={{ fontStyle: 'italic' }}>
          {`"${quote.quote}"`}
        </RichText>
        <Txt variant="label" style={{ marginTop: 8, color: TOKENS['on-background'] }}>
          {quote.name}
        </Txt>
        {quote.role ? (
          <Txt variant="label" style={{ color: TOKENS.outline, fontSize: 12 }}>
            {quote.role}
          </Txt>
        ) : null}
      </View>
    </View>
  );
}
