import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSession } from '../../contexts/session-context';
import { TOKENS } from '../../theme/tokens';
import { Button } from '../primitives/Button';
import { Hairline } from '../primitives/Hairline';
import { Txt } from '../primitives/Txt';

type Props = {
  onStartStudy: () => void;
  onJoinArena: () => void;
};

const ARENAS = [
  { label: '01. People', pct: '72%', bar: 0.72, sub: 'Interpersonal Leadership' },
  { label: '02. Process', pct: '45%', bar: 0.45, sub: 'Operational Optimization' },
  { label: '03. Business', pct: '18%', bar: 0.18, sub: 'Strategic Market Growth' },
];

export function MonographDashboard({ onStartStudy, onJoinArena }: Props) {
  const { state } = useSession();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: TOKENS.background }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 40, paddingBottom: 80 }}
    >
      {/* Header: Streak */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderBottomWidth: 1,
          borderBottomColor: TOKENS.primary,
          paddingBottom: 16,
          marginBottom: 32,
        }}
      >
        <View>
          <Txt
            variant="label"
            style={{ fontSize: 11, letterSpacing: 4, color: TOKENS.outline, marginBottom: 4 }}
          >
            CURRENT STREAK
          </Txt>
          <Txt
            variant="display"
            style={{ fontSize: 64, lineHeight: 64, color: TOKENS['on-background'], letterSpacing: -2 }}
          >
            {state.streak} DAYS
          </Txt>
        </View>
        <View style={{ alignItems: 'flex-end', paddingBottom: 8 }}>
          <Txt
            variant="label"
            style={{ fontSize: 10, letterSpacing: 2, color: TOKENS['on-background'], textAlign: 'right', lineHeight: 16 }}
          >
            {'CONSISTENCY IS THE\nHIGHEST FORM OF MASTERY'}
          </Txt>
        </View>
      </View>

      {/* Points */}
      <View style={{ marginBottom: 32 }}>
        <Txt
          variant="label"
          style={{ fontSize: 11, letterSpacing: 4, color: TOKENS.outline, marginBottom: 4 }}
        >
          TOTAL POINTS
        </Txt>
        <Txt
          variant="display"
          style={{ fontSize: 40, lineHeight: 40, color: TOKENS['on-background'], letterSpacing: -1 }}
        >
          {state.points} PTS
        </Txt>
      </View>

      <Hairline />

      {/* Next Milestone */}
      <View
        style={{
          borderWidth: 1,
          borderColor: TOKENS['outline-variant'],
          backgroundColor: TOKENS['surface-container-lowest'],
          borderRadius: 2,
          padding: 24,
          marginTop: 24,
          marginBottom: 24,
        }}
      >
        <Txt
          variant="display"
          style={{ fontSize: 20, letterSpacing: -0.5, color: TOKENS['on-background'], marginBottom: 8 }}
        >
          NEXT MILESTONE: ARCHITECT
        </Txt>
        <Txt
          variant="body"
          style={{ fontSize: 13, lineHeight: 20, color: TOKENS.outline, marginBottom: 20 }}
        >
          You are nearing the professional tier. 14 more strategic completions required to unlock the
          exclusive 'Founder's Circle'.
        </Txt>
        <Button label="Start Study" onPress={onStartStudy} />
      </View>

      <Hairline />

      {/* Challenge Arenas */}
      <View style={{ marginTop: 24, marginBottom: 24 }}>
        <Txt
          variant="display"
          style={{
            fontSize: 18,
            letterSpacing: -0.5,
            color: TOKENS['on-background'],
            borderBottomWidth: 1,
            borderBottomColor: TOKENS.primary,
            paddingBottom: 12,
            marginBottom: 16,
          }}
        >
          CHALLENGE ARENAS
        </Txt>

        {ARENAS.map((arena) => (
          <View
            key={arena.label}
            style={{
              borderBottomWidth: 1,
              borderBottomColor: TOKENS['outline-variant'],
              paddingVertical: 16,
            }}
          >
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}
            >
              <Txt
                variant="label"
                style={{ fontSize: 11, letterSpacing: 2, color: TOKENS['on-background'] }}
              >
                {arena.label}
              </Txt>
              <Txt
                variant="label"
                style={{ fontSize: 11, letterSpacing: 2, color: TOKENS.outline }}
              >
                {arena.pct}
              </Txt>
            </View>
            {/* Progress bar */}
            <View
              style={{
                width: '100%',
                height: 2,
                backgroundColor: TOKENS['surface-container-highest'],
              }}
            >
              <View
                style={{
                  height: '100%',
                  backgroundColor: TOKENS.primary,
                  width: `${Math.round(arena.bar * 100)}%`,
                }}
              />
            </View>
            <Txt
              variant="label"
              style={{ fontSize: 9, letterSpacing: 2, color: TOKENS.outline, marginTop: 8 }}
            >
              {arena.sub}
            </Txt>
          </View>
        ))}
      </View>

      <Hairline />

      {/* Join Arena CTA */}
      <View
        style={{
          marginTop: 32,
          backgroundColor: TOKENS.primary,
          padding: 32,
          borderRadius: 2,
        }}
      >
        <Txt
          variant="display"
          style={{ fontSize: 28, lineHeight: 32, color: TOKENS['on-primary'], marginBottom: 8 }}
        >
          ELEVATE YOUR POSITION.
        </Txt>
        <Txt
          variant="label"
          style={{
            fontSize: 11,
            letterSpacing: 3,
            color: 'rgba(255,255,255,0.8)',
            marginBottom: 24,
          }}
        >
          JOIN THE GLOBAL ARENA. COMPETE WITH TOP-TIER MONOGRAPHS FOR INDUSTRY DOMINANCE.
        </Txt>
        <Button label="Join Arena" onPress={onJoinArena} variant="secondary" />
      </View>
    </ScrollView>
  );
}
