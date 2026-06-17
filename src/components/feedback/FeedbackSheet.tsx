import BottomSheet, {
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSession } from '../../contexts/session-context';
import { questionById } from '../../data/questions';
import { Brand } from '../../theme/brand-context';
import { TOKENS } from '../../theme/tokens';
import { Button } from '../primitives/Button';
import { Hairline } from '../primitives/Hairline';
import { Icon } from '../primitives/Icon';
import { Txt } from '../primitives/Txt';

// ─── Presentational bodies ───────────────────────────────────────────────────

export type FeedbackBodyProps = {
  explanation: string;
  onDismiss: () => void;
  brand: Brand;
};

export function CorrectBody({ explanation, onDismiss, brand }: FeedbackBodyProps) {
  const isElite = brand === 'elite';
  return (
    <View style={[styles.body, { backgroundColor: TOKENS['surface-container-lowest'] }]}>
      {/* Label row */}
      <View style={styles.labelRow}>
        <Icon symbol="check_circle" size={20} color={TOKENS.primary} />
        <Txt
          variant="label"
          style={[styles.label, { color: TOKENS['on-background'] }]}
        >
          CORRECT RESPONSE
        </Txt>
      </View>

      {/* Display headline */}
      <Txt
        variant="display"
        style={[
          styles.headline,
          { color: TOKENS['on-background'] },
          isElite && styles.headlineElite,
        ]}
      >
        EXCELLENT WORK.
      </Txt>

      <Hairline />

      {/* Explanation */}
      <Txt
        variant="body"
        style={[styles.explanation, { color: TOKENS['on-background'] }]}
      >
        {explanation}
      </Txt>

      {/* Action */}
      <View style={styles.footer}>
        <Button label="CONTINUE" onPress={onDismiss} />
      </View>
    </View>
  );
}

export function IncorrectBody({ explanation, onDismiss, brand }: FeedbackBodyProps) {
  const isElite = brand === 'elite';
  return (
    <View style={[styles.body, { backgroundColor: '#DC2626' }]}>
      {/* Label row */}
      <View style={styles.labelRow}>
        <Icon symbol="cancel" size={20} color="#ffffff" />
        <Txt
          variant="label"
          style={[styles.label, { color: '#ffffff' }]}
        >
          INCORRECT CHOICE
        </Txt>
      </View>

      {/* Display headline */}
      <Txt
        variant="display"
        style={[
          styles.headline,
          { color: '#ffffff' },
          isElite && styles.headlineElite,
        ]}
      >
        NOT QUITE.
      </Txt>

      <View style={styles.whiteDivider} />

      {/* Explanation */}
      <Txt
        variant="body"
        style={[styles.explanation, { color: 'rgba(255,255,255,0.9)' }]}
      >
        {explanation}
      </Txt>

      {/* Action */}
      <View style={styles.footer}>
        <Button label="TRY AGAIN" onPress={onDismiss} />
      </View>
    </View>
  );
}

// ─── Container sheet ──────────────────────────────────────────────────────────

export function FeedbackSheet() {
  const { state, dispatch } = useSession();
  const sheetRef = useRef<BottomSheetModal>(null);

  const dismiss = useCallback(() => {
    dispatch({ type: 'DISMISS_RESULT' });
    sheetRef.current?.dismiss();
  }, [dispatch]);

  useEffect(() => {
    if (state.result === 'correct') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      sheetRef.current?.present();
    } else if (state.result === 'incorrect') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [state.result]);

  const explanation =
    state.activeQuestionId != null
      ? (questionById(state.activeQuestionId)?.explanation ?? '')
      : '';

  // Infer brand from the active question; fall back to 'monograph'
  const brand: Brand =
    state.activeQuestionId != null
      ? (questionById(state.activeQuestionId)?.brand ?? 'monograph')
      : 'monograph';

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['75%']}
      enableDynamicSizing={false}
      onDismiss={() => dispatch({ type: 'DISMISS_RESULT' })}
    >
      <BottomSheetView style={styles.sheetView}>
        {state.result === 'correct' ? (
          <CorrectBody explanation={explanation} onDismiss={dismiss} brand={brand} />
        ) : (
          <IncorrectBody explanation={explanation} onDismiss={dismiss} brand={brand} />
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheetView: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 48,
    lineHeight: 52,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  headlineElite: {
    letterSpacing: -1,
  },
  whiteDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 16,
  },
  explanation: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
    marginBottom: 24,
  },
  footer: {
    marginTop: 'auto',
  },
});
