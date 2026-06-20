import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useLesson } from '../../contexts/lesson-context';
import { PressableFeedback } from '../primitives/PressableFeedback';
import { Txt } from '../primitives/Txt';
import { TOKENS, RADIUS } from '../../theme/tokens';
import type { QuickNavConfig, QuickNavTarget, ScreenType } from '../../types/lesson';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

// Quick-jump targets → the lesson stage (screen_type) each maps to, plus a
// monochrome MaterialIcon (matches the app's icon tokens; no emojis). "Theory"
// is the Reason stage. Mirrors QUICK_NAV_TO_SCREEN_TYPE in lesson-context.
const LINKS: { target: QuickNavTarget; screenType: ScreenType; label: string; icon: IconName }[] = [
  { target: 'challenge', screenType: 'challenge', label: 'Challenge', icon: 'sports-esports' },
  { target: 'theory', screenType: 'reason', label: 'Theory', icon: 'menu-book' },
  { target: 'transfer', screenType: 'transfer', label: 'Transfer', icon: 'swap-horiz' },
  { target: 'practice', screenType: 'practice', label: 'Practice', icon: 'edit' },
];

const GAP = 12;

// "Quick Jump" — a 2-column grid of shortcuts to jump between lesson stages.
// Shows only stages present in the current lesson, never the stage you're on,
// and honors an optional per-screen `quick_nav` config (enabled / links).
export function QuickJump({ config }: { config?: QuickNavConfig }) {
  const { goToStage, screenType, state } = useLesson();
  const [colW, setColW] = useState(0);

  if (config?.enabled === false) return null;

  const present = new Set((state.lessonData?.screens ?? []).map((s) => s.screen_type));
  const links = LINKS.filter(
    (l) =>
      present.has(l.screenType) &&
      l.screenType !== screenType &&
      (!config?.links || config.links.includes(l.target)),
  );
  if (links.length === 0) return null;

  // Measure the row to size two equal columns (padding-agnostic).
  const onLayout = (e: LayoutChangeEvent) => setColW((e.nativeEvent.layout.width - GAP) / 2);

  return (
    <View style={{ marginTop: 16, gap: 16 }}>
      {/* Divider with centered label */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={styles.rule} />
        <Txt variant="label" style={styles.label}>
          Quick Jump
        </Txt>
        <View style={styles.rule} />
      </View>

      {/* 2-column grid of big buttons */}
      <View style={styles.grid} onLayout={onLayout}>
        {links.map((l) => (
          <PressableFeedback key={l.target} onPress={() => goToStage(l.target)}>
            <View style={[styles.tile, { width: colW || undefined }]}>
              <MaterialIcons name={l.icon} size={22} color={TOKENS['on-background']} />
              <Txt variant="label" style={styles.tileLabel}>
                {l.label}
              </Txt>
            </View>
          </PressableFeedback>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: TOKENS['outline-variant'] },
  label: { fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: TOKENS.outline },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: TOKENS['outline-variant'],
    backgroundColor: TOKENS['surface-container-lowest'],
  },
  tileLabel: { fontSize: 15, color: TOKENS['on-background'] },
});
