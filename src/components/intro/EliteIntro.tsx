import { Image } from 'expo-image';
import { Grayscale } from 'react-native-color-matrix-image-filters';
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { TOKENS } from '../../theme/tokens';
import { Button } from '../primitives/Button';
import { Hairline } from '../primitives/Hairline';
import { Icon } from '../primitives/Icon';
import { Txt } from '../primitives/Txt';

type Props = {
  onContinue: () => void;
};

export function EliteIntro({ onContinue }: Props) {
  const [revealed, setRevealed] = useState(false);

  const figureImage = (
    <Image
      source={require('../../../assets/placeholders/hero-elite.jpg')}
      style={{ width: '100%', aspectRatio: 4 / 3 }}
      contentFit="cover"
    />
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9f9f9' }} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: 24, paddingTop: 40, paddingBottom: 80 }}>

        {/* Hero text: asymmetric two-part heading */}
        <View style={{ marginBottom: 32 }}>
          <View style={{ marginBottom: 16 }}>
            <Txt
              variant="label"
              style={{ fontSize: 12, letterSpacing: 2, color: '#5d5f5f', marginBottom: 4 }}
            >
              LESSON 01
            </Txt>
            <Txt
              variant="display"
              style={{ fontSize: 44, lineHeight: 46, letterSpacing: -1, color: '#000000' }}
            >
              What is Project Management?
            </Txt>
          </View>
          <View style={{ alignSelf: 'flex-end', maxWidth: 260 }}>
            <Txt
              variant="body"
              style={{ fontSize: 15, lineHeight: 22, color: '#1a1c1c', textAlign: 'right' }}
            >
              The structural discipline of leading a team to achieve all project goals within given constraints.
            </Txt>
          </View>
        </View>

        <Hairline />

        <View style={{ marginTop: 32, gap: 24 }}>
          {/* Asymmetric illustration card: tap to reveal color */}
          <View>
            <View style={{ borderWidth: 1, borderColor: '#000000', padding: 2, backgroundColor: '#ffffff' }}>
              <Pressable
                onPress={() => setRevealed((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={revealed ? 'Show grayscale' : 'Reveal color'}
              >
                {revealed ? (
                  figureImage
                ) : (
                  <Grayscale>
                    {figureImage}
                  </Grayscale>
                )}
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Txt variant="label" style={{ fontSize: 10, letterSpacing: 3, color: '#5d5f5f' }}>
                FIG. 01 — THE STRATEGIC OVERVIEW
              </Txt>
              <Txt variant="label" style={{ fontSize: 10, letterSpacing: 3, color: '#5d5f5f' }}>
                [01 — 48]
              </Txt>
            </View>
          </View>

          {/* Core definition blocks */}
          <View style={{ gap: 24 }}>
            {/* CORE DEFINITION */}
            <View style={{ borderLeftWidth: 1, borderLeftColor: TOKENS['outline-variant'], paddingLeft: 20, paddingVertical: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Icon symbol="architecture" size={20} color="#000000" />
                <Txt
                  variant="body"
                  style={{ fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: '#000000' }}
                >
                  CORE DEFINITION
                </Txt>
              </View>
              <Txt variant="body" style={{ fontSize: 13, lineHeight: 20, color: '#5d5f5f' }}>
                Project management is the application of processes, methods, skills, knowledge, and experience to achieve specific objectives according to the project acceptance criteria within agreed parameters. It has final deliverables that are constrained to a finite timescale and budget.
              </Txt>
            </View>

            <Hairline />

            {/* FINITE NATURE */}
            <View style={{ borderLeftWidth: 1, borderLeftColor: TOKENS['outline-variant'], paddingLeft: 20, paddingVertical: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Icon symbol="schedule" size={20} color="#000000" />
                <Txt
                  variant="body"
                  style={{ fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: '#000000' }}
                >
                  FINITE NATURE
                </Txt>
              </View>
              <Txt variant="body" style={{ fontSize: 13, lineHeight: 20, color: '#5d5f5f' }}>
                A key factor that distinguishes project management from just 'management' is that it has this final deliverable and a finite timespan, unlike management which is an ongoing process.
              </Txt>
            </View>

            <Hairline />

            {/* START MODULE button */}
            <Button label="START MODULE" onPress={onContinue} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
