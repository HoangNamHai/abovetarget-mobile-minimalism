import { Image } from 'expo-image';
import React from 'react';
import { ScrollView, View } from 'react-native';

import { TOKENS } from '../../theme/tokens';
import type { Domain } from '../../types/progress';
import { Button } from '../primitives/Button';
import { Hairline } from '../primitives/Hairline';
import { Txt } from '../primitives/Txt';

type Props = {
  onStartStudy: () => void;
  onOpenLesson?: (lessonId: string) => void;
  onOpenDomain?: (domain: Domain) => void;
};

const PROGRESS_RINGS = [
  { pct: 75, label: 'STRATEGIC DESIGN', sub: 'Professional Certification' },
  { pct: 60, label: 'SYSTEM ARCHITECTURE', sub: 'Advanced Level' },
  { pct: 40, label: 'BEHAVIORAL PSYCHOLOGY', sub: 'Theory & Practice' },
];

const ARENAS = [
  { label: 'QUANTUM COMPUTING FUNDAMENTALS', modules: '8/12 MODULES', pct: 66 },
  { label: 'NEURAL INTERFACE DESIGN', modules: '3/15 MODULES', pct: 20 },
  { label: 'ALGORITHMIC ETHICS', modules: '14/20 MODULES', pct: 70 },
  { label: 'VENTURE CAPITAL DYNAMICS', modules: '1/5 MODULES', pct: 20 },
];

// SessionContext removed — Elite brand not shipped yet; stub with zeros.
const ELITE_SESSION_STUB = { streak: 0, points: 0 };

export function EliteDashboard({ onStartStudy }: Props) {
  const state = ELITE_SESSION_STUB;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: TOKENS.background }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 40, paddingBottom: 80 }}
    >
      {/* Continuous Mastery Streak */}
      <View style={{ marginBottom: 32 }}>
        <Txt
          variant="label"
          style={{ fontSize: 12, letterSpacing: 4, color: TOKENS.outline, marginBottom: 4 }}
        >
          CONTINUOUS MASTERY
        </Txt>
        <Txt
          variant="display"
          style={{ fontSize: 72, lineHeight: 72, color: TOKENS['on-background'], letterSpacing: -2 }}
        >
          {state.streak} DAYS
        </Txt>
        <View
          style={{ height: 1, backgroundColor: TOKENS.primary, marginTop: 16, marginBottom: 16 }}
        />
        <Txt
          variant="body"
          style={{ fontSize: 14, lineHeight: 22, color: TOKENS.outline }}
        >
          Your professional momentum is at its peak. Consistency is the architect of excellence.
        </Txt>
      </View>

      {/* Points row */}
      <View style={{ marginBottom: 32 }}>
        <Txt
          variant="label"
          style={{ fontSize: 11, letterSpacing: 4, color: TOKENS.outline, marginBottom: 4 }}
        >
          MASTERY POINTS
        </Txt>
        <Txt
          variant="display"
          style={{ fontSize: 40, lineHeight: 40, color: TOKENS['on-background'], letterSpacing: -1 }}
        >
          {state.points} PTS
        </Txt>
      </View>

      <Hairline />

      {/* Progress Cards */}
      <View style={{ marginTop: 24, marginBottom: 24 }}>
        {PROGRESS_RINGS.map((ring) => (
          <View
            key={ring.label}
            style={{
              borderWidth: 1,
              borderColor: TOKENS['outline-variant'],
              backgroundColor: TOKENS['surface-container-lowest'],
              padding: 20,
              marginBottom: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 20,
            }}
          >
            {/* Progress indicator */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                borderWidth: 2,
                borderColor: TOKENS['surface-container-highest'],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Txt
                variant="body"
                style={{ fontSize: 14, fontWeight: '700', color: TOKENS['on-background'] }}
              >
                {ring.pct}%
              </Txt>
            </View>
            <View style={{ flex: 1 }}>
              <Txt
                variant="label"
                style={{ fontSize: 11, letterSpacing: 2, color: TOKENS['on-background'], marginBottom: 4 }}
              >
                {ring.label}
              </Txt>
              <Txt
                variant="label"
                style={{ fontSize: 10, letterSpacing: 1, color: TOKENS.outline }}
              >
                {ring.sub}
              </Txt>
              {/* mini bar */}
              <View
                style={{
                  marginTop: 8,
                  height: 2,
                  backgroundColor: TOKENS['surface-container-highest'],
                }}
              >
                <View
                  style={{
                    height: '100%',
                    backgroundColor: TOKENS.primary,
                    width: `${ring.pct}%`,
                  }}
                />
              </View>
            </View>
          </View>
        ))}
      </View>

      <Hairline />

      {/* Challenge Arenas */}
      <View style={{ marginTop: 24, marginBottom: 24 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderBottomWidth: 1,
            borderBottomColor: TOKENS.primary,
            paddingBottom: 8,
            marginBottom: 16,
          }}
        >
          <Txt
            variant="display"
            style={{ fontSize: 24, letterSpacing: -0.5, color: TOKENS['on-background'] }}
          >
            CHALLENGE ARENAS
          </Txt>
          <Txt
            variant="label"
            style={{ fontSize: 10, letterSpacing: 2, color: TOKENS.outline, paddingBottom: 2 }}
          >
            VIEW ALL ARENAS
          </Txt>
        </View>

        {ARENAS.map((arena) => (
          <View
            key={arena.label}
            style={{ paddingVertical: 12 }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <Txt
                variant="body"
                style={{ fontSize: 13, fontWeight: '700', color: TOKENS['on-background'] }}
              >
                {arena.label}
              </Txt>
              <Txt
                variant="label"
                style={{ fontSize: 10, letterSpacing: 2, color: TOKENS.outline }}
              >
                {arena.modules}
              </Txt>
            </View>
            <View
              style={{ height: 2, backgroundColor: TOKENS['surface-container-highest'] }}
            >
              <View
                style={{ height: '100%', backgroundColor: TOKENS.primary, width: `${arena.pct}%` }}
              />
            </View>
          </View>
        ))}
      </View>

      <Hairline />

      {/* Featured Resource / CTA */}
      <View
        style={{
          marginTop: 24,
          borderWidth: 1,
          borderColor: TOKENS['outline-variant'],
          backgroundColor: TOKENS['surface-container-lowest'],
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        {/* Image placeholder */}
        <Image
          source={require('../../../assets/placeholders/elite-01.jpg')}
          style={{ width: '100%', aspectRatio: 4 / 3 }}
          contentFit="cover"
        />
        <View style={{ padding: 24 }}>
          <Txt
            variant="label"
            style={{ fontSize: 10, letterSpacing: 3, color: TOKENS.outline, marginBottom: 8 }}
          >
            UP NEXT
          </Txt>
          <Txt
            variant="display"
            style={{ fontSize: 22, lineHeight: 26, color: TOKENS['on-background'], marginBottom: 12 }}
          >
            BEYOND DATA: THE INTUITION FRAMEWORK
          </Txt>
          <Txt
            variant="body"
            style={{ fontSize: 13, lineHeight: 20, color: TOKENS.outline, marginBottom: 20 }}
          >
            Master the art of decision-making in high-uncertainty environments. This curated masterclass
            explores the intersection of cognitive science and professional leadership.
          </Txt>
          <Button label="Start Study" onPress={onStartStudy} />
        </View>
      </View>

      {/* Keep-going CTA */}
      <View
        style={{
          marginTop: 32,
          backgroundColor: TOKENS.primary,
          padding: 32,
          borderRadius: 4,
        }}
      >
        <Txt
          variant="display"
          style={{ fontSize: 28, lineHeight: 32, color: TOKENS['on-primary'], marginBottom: 12 }}
        >
          KEEP THE MOMENTUM.
        </Txt>
        <Txt
          variant="label"
          style={{ fontSize: 11, letterSpacing: 3, color: 'rgba(255,255,255,0.8)', marginBottom: 24 }}
        >
          ONE LESSON A DAY COMPOUNDS INTO MASTERY. PICK UP WHERE YOU LEFT OFF.
        </Txt>
        <Button label="Browse Lessons" onPress={onStartStudy} variant="secondary" />
      </View>
    </ScrollView>
  );
}
