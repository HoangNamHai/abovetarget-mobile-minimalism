import React from 'react';
import { ScrollView, View } from 'react-native';
import { useProgress } from '../../contexts/progress-context';
import { TOKENS } from '../../theme/tokens';
import { Button } from '../primitives/Button';
import { Hairline } from '../primitives/Hairline';
import { Txt } from '../primitives/Txt';

type Props = {
  onStartStudy: () => void;
  onJoinArena?: () => void;
};

const DOMAIN_LABELS = {
  people: { label: '01. People', sub: 'Interpersonal Leadership' },
  process: { label: '02. Process', sub: 'Operational Optimization' },
  business: { label: '03. Business', sub: 'Strategic Market Growth' },
} as const;

type DomainKey = keyof typeof DOMAIN_LABELS;

export function MonographDashboard({ onStartStudy, onJoinArena }: Props) {
  const { progress, getCurrentStreak, getCurrentMilestone } = useProgress();
  const streak = getCurrentStreak();
  const milestone = getCurrentMilestone();

  const domains: Array<{ key: DomainKey; label: string; pct: string; bar: number; sub: string }> = (
    ['people', 'process', 'business'] as DomainKey[]
  ).map((key) => {
    const dp = progress.domainProgress[key];
    const bar = dp.total > 0 ? dp.completed / dp.total : 0;
    const pct = `${Math.round(bar * 100)}%`;
    return { key, label: DOMAIN_LABELS[key].label, pct, bar, sub: DOMAIN_LABELS[key].sub };
  });

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
            {streak} DAYS
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
          {progress.totalLessonsCompleted} PTS
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
          NEXT MILESTONE: {milestone.name.toUpperCase()}
        </Txt>
        <Txt
          variant="body"
          style={{ fontSize: 13, lineHeight: 20, color: TOKENS.outline, marginBottom: 20 }}
        >
          You are nearing the professional tier. Keep completing lessons to unlock the next milestone.
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

        {domains.map((arena) => (
          <View
            key={arena.key}
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
        {onJoinArena && <Button label="Join Arena" onPress={onJoinArena} variant="secondary" />}
      </View>
    </ScrollView>
  );
}
