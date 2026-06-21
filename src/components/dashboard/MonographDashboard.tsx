import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useProgress } from '../../contexts/progress-context';
import { useSubscription } from '../../contexts/subscription-context';
import { useLearningHome } from '../../hooks/use-learning-home';
import { getLessonThumbnail } from '../../data/lesson-images';
import { DOMAIN_ORDER } from '../../data/domains';
import { TOKENS, RADIUS } from '../../theme/tokens';
import type { Domain } from '../../types/progress';
import { Button } from '../primitives/Button';
import { Hairline } from '../primitives/Hairline';
import { PressableFeedback } from '../primitives/PressableFeedback';
import { Txt } from '../primitives/Txt';
import { UpgradeBlock } from './UpgradeBlock';

type Props = {
  /** Browse the full lessons list. */
  onStartStudy: () => void;
  /** Deep-link straight into a specific lesson. */
  onOpenLesson?: (lessonId: string) => void;
  /** Open the lessons list filtered to one domain. */
  onOpenDomain?: (domain: Domain) => void;
  /** Open the paywall; powers the free-tier upgrade CTA. */
  onUpgrade?: () => void;
};

const DOMAIN_LABELS: Record<Domain, { label: string; sub: string }> = {
  people: { label: '01. People', sub: 'Interpersonal Leadership' },
  process: { label: '02. Process', sub: 'Operational Optimization' },
  business: { label: '03. Business Env.', sub: 'Strategy, Compliance & Value' },
};

export function MonographDashboard({ onStartStudy, onOpenLesson, onOpenDomain, onUpgrade }: Props) {
  const { progress, getCurrentStreak, getCurrentMilestone } = useProgress();
  const { isPremium } = useSubscription();
  const { nextLesson, recentLesson, allCaughtUp, lessonsToday, dailyGoal, goalMet, lessonsCompleted, mastery, domainTotals } =
    useLearningHome();
  const streak = getCurrentStreak();
  const milestone = getCurrentMilestone();
  const insets = useSafeAreaInsets();

  const domains = DOMAIN_ORDER.map((key) => {
    const completed = progress.domainProgress[key].completed;
    const total = domainTotals[key];
    const bar = total > 0 ? Math.min(completed / total, 1) : 0;
    return {
      key,
      ...DOMAIN_LABELS[key],
      pct: `${Math.round(bar * 100)}%`,
      bar,
      count: `${completed}/${total}`,
    };
  });

  const handleContinue = () => {
    if (nextLesson && onOpenLesson) onOpenLesson(nextLesson.id);
    else onStartStudy();
  };

  const handleReview = () => {
    if (recentLesson && onOpenLesson) onOpenLesson(recentLesson.id);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: TOKENS.background }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: 80 }}
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
          marginBottom: 24,
        }}
      >
        <View>
          <Txt variant="label" style={{ fontSize: 11, letterSpacing: 4, color: TOKENS.outline, marginBottom: 4 }}>
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

      {/* Today's goal */}
      <TodayStrip lessonsToday={lessonsToday} dailyGoal={dailyGoal} goalMet={goalMet} />

      {/* Stats: lessons completed + mastery */}
      <View style={{ flexDirection: 'row', marginTop: 24, marginBottom: 24 }}>
        <Stat label="LESSONS DONE" value={`${lessonsCompleted}`} />
        <Stat label="MASTERY" value={`${mastery}%`} />
      </View>

      <Hairline />

      {/* Continue Learning — primary action */}
      <View
        style={{
          marginTop: 24,
          marginBottom: 24,
          backgroundColor: TOKENS.primary,
          borderRadius: RADIUS.card,
          overflow: 'hidden',
        }}
      >
        {!allCaughtUp && (
          <Image
            source={getLessonThumbnail(nextLesson!.thumbnail)}
            style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: TOKENS['surface-container'] }}
            contentFit="cover"
            transition={200}
          />
        )}
        <View style={{ padding: 28 }}>
          <Txt variant="label" style={{ fontSize: 11, letterSpacing: 3, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>
            {allCaughtUp ? 'ALL CAUGHT UP' : 'CONTINUE LEARNING'}
          </Txt>
          <Txt
            variant="display"
            style={{ fontSize: 26, lineHeight: 30, color: TOKENS['on-primary'], marginBottom: allCaughtUp ? 20 : 6 }}
          >
            {allCaughtUp ? "YOU'VE FINISHED EVERY LESSON." : nextLesson!.title}
          </Txt>
          {!allCaughtUp && (
            <Txt variant="label" style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>
              {nextLesson!.domain.toUpperCase()} · {nextLesson!.duration} MIN
            </Txt>
          )}
          <Button
            label={allCaughtUp ? 'Review Lessons' : 'Continue'}
            onPress={handleContinue}
            variant="secondary"
          />
        </View>
      </View>

      <Hairline />

      {/* Upgrade CTA — free users only; the single colored surface in the app */}
      {!isPremium && (
        <View style={{ marginTop: 24, marginBottom: 24 }}>
          <UpgradeBlock onPress={() => onUpgrade?.()} />
        </View>
      )}

      {/* Recently Learned — revisit the last lesson studied */}
      {recentLesson && (
        <>
          <PressableFeedback onPress={handleReview}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'stretch',
                borderWidth: 1,
                borderColor: TOKENS['outline-variant'],
                backgroundColor: TOKENS['surface-container-lowest'],
                borderRadius: RADIUS.card,
                overflow: 'hidden',
                marginTop: 24,
                marginBottom: 24,
              }}
            >
              {/* Full-height hero image flush to the left edge */}
              <Image
                source={getLessonThumbnail(recentLesson.thumbnail)}
                style={{ width: 110, alignSelf: 'stretch', backgroundColor: TOKENS['surface-container'] }}
                contentFit="cover"
                transition={200}
              />
              <View style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 16, justifyContent: 'center' }}>
                <Txt variant="label" style={{ fontSize: 11, letterSpacing: 3, color: TOKENS.outline, marginBottom: 8 }}>
                  RECENTLY LEARNED
                </Txt>
                <Txt variant="display" style={{ fontSize: 20, lineHeight: 26, color: TOKENS['on-background'], marginBottom: 6 }}>
                  {recentLesson.title}
                </Txt>
                <Txt variant="label" style={{ fontSize: 11, letterSpacing: 2, color: TOKENS.outline }}>
                  {recentLesson.domain.toUpperCase()} · REVIEW
                </Txt>
              </View>
              <View style={{ justifyContent: 'center', paddingRight: 16 }}>
                <Txt variant="label" style={{ fontSize: 22, color: TOKENS.outline }}>
                  ›
                </Txt>
              </View>
            </View>
          </PressableFeedback>

          <Hairline />
        </>
      )}

      {/* Next Milestone — now shows real progress to the next tier */}
      <View
        style={{
          borderWidth: 1,
          borderColor: TOKENS['outline-variant'],
          backgroundColor: TOKENS['surface-container-lowest'],
          borderRadius: RADIUS.card,
          padding: 24,
          marginTop: 24,
          marginBottom: 24,
        }}
      >
        <Txt variant="display" style={{ fontSize: 18, letterSpacing: -0.5, color: TOKENS['on-background'], marginBottom: 12 }}>
          NEXT MILESTONE: {milestone.name.toUpperCase()}
        </Txt>
        <View style={{ width: '100%', height: 6, backgroundColor: TOKENS['surface-container-highest'], borderRadius: RADIUS.track }}>
          <View
            style={{
              height: '100%',
              borderRadius: RADIUS.track,
              backgroundColor: TOKENS.primary,
              width: `${Math.round(milestone.progress)}%`,
            }}
          />
        </View>
        <Txt variant="body" style={{ fontSize: 13, lineHeight: 20, color: TOKENS.outline, marginTop: 12 }}>
          {Math.round(milestone.progress)}% of the way to {milestone.name}. Keep your scores up to get there.
        </Txt>
      </View>

      <Hairline />

      {/* Your Progress (domains) — tappable to jump into that domain */}
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
            marginBottom: 8,
          }}
        >
          YOUR PROGRESS
        </Txt>

        {domains.map((d) => (
          <PressableFeedback key={d.key} onPress={() => onOpenDomain?.(d.key)}>
            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: TOKENS['outline-variant'],
                paddingVertical: 16,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Txt variant="label" style={{ fontSize: 15, letterSpacing: 1, color: TOKENS['on-background'] }}>
                  {d.label}
                </Txt>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Txt variant="label" style={{ fontSize: 12, letterSpacing: 1, color: TOKENS['surface-dim'] }}>
                    {d.count}
                  </Txt>
                  <Txt variant="label" style={{ fontSize: 14, letterSpacing: 1, color: TOKENS.outline }}>
                    {d.pct}
                  </Txt>
                  <Txt variant="label" style={{ fontSize: 18, color: TOKENS.outline }}>›</Txt>
                </View>
              </View>
              <View style={{ width: '100%', height: 2, backgroundColor: TOKENS['surface-container-highest'] }}>
                <View style={{ height: '100%', backgroundColor: TOKENS.primary, width: `${Math.round(d.bar * 100)}%` }} />
              </View>
              <Txt variant="label" style={{ fontSize: 13, letterSpacing: 0.5, color: TOKENS.outline, marginTop: 8 }}>
                {d.sub}
              </Txt>
            </View>
          </PressableFeedback>
        ))}
      </View>

      {/* Browse all lessons */}
      <Button label="Browse All Lessons" onPress={onStartStudy} variant="secondary" />
    </ScrollView>
  );
}

// ─── Today strip ──────────────────────────────────────────────────────────────

function TodayStrip({
  lessonsToday,
  dailyGoal,
  goalMet,
}: {
  lessonsToday: number;
  dailyGoal: number;
  goalMet: boolean;
}) {
  const dots = Math.max(dailyGoal, 1);
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Txt variant="label" style={{ fontSize: 11, letterSpacing: 4, color: TOKENS.outline }}>
          TODAY
        </Txt>
        <Txt variant="label" style={{ fontSize: 12, letterSpacing: 1, color: goalMet ? TOKENS.primary : TOKENS.outline }}>
          {goalMet ? 'GOAL MET ✓' : `${Math.min(lessonsToday, dailyGoal)} / ${dailyGoal} LESSONS`}
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {Array.from({ length: dots }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 6,
              borderRadius: RADIUS.track,
              backgroundColor: i < lessonsToday ? TOKENS.primary : TOKENS['surface-container-highest'],
            }}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Stat ─────────────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Txt variant="label" style={{ fontSize: 11, letterSpacing: 3, color: TOKENS.outline, marginBottom: 4 }}>
        {label}
      </Txt>
      <Txt variant="display" style={{ fontSize: 40, lineHeight: 44, color: TOKENS['on-background'], letterSpacing: -1 }}>
        {value}
      </Txt>
    </View>
  );
}
