import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../primitives/Button';
import { Hairline } from '../primitives/Hairline';
import { PressableFeedback } from '../primitives/PressableFeedback';
import { Txt } from '../primitives/Txt';
import { TOKENS } from '../../theme/tokens';
import { OnboardingProgress } from './OnboardingProgress';

export type ChoiceOption = { value: string; label: string; description?: string };

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  options: ChoiceOption[];
  mode: 'single' | 'multi';
  value: string[];
  onChange: (next: string[]) => void;
  onContinue: () => void;
  ctaLabel?: string;
  progress?: number | null;
  requireSelection?: boolean;
};

export function ChoiceScreen({
  eyebrow, title, subtitle, options, mode, value, onChange, onContinue,
  ctaLabel = 'Continue', progress, requireSelection = false,
}: Props) {
  function toggle(v: string) {
    if (mode === 'single') { onChange([v]); return; }
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }
  const disabled = requireSelection && value.length === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 48, gap: 32 }}>
        {progress != null && <OnboardingProgress progress={progress} />}
        <View style={{ gap: 8 }}>
          {eyebrow ? (
            <Txt variant="label" style={{ fontSize: 11, letterSpacing: 4, color: TOKENS.outline, textTransform: 'uppercase' }}>
              {eyebrow}
            </Txt>
          ) : null}
          <Txt variant="display" style={{ fontSize: 32, lineHeight: 36, letterSpacing: -0.5, color: TOKENS.primary }}>
            {title}
          </Txt>
          {subtitle ? (
            <Txt variant="body" style={{ fontSize: 14, lineHeight: 20, color: TOKENS.outline }}>{subtitle}</Txt>
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          {options.map((opt, i) => {
            const selected = value.includes(opt.value);
            return (
              <View key={opt.value}>
                <PressableFeedback onPress={() => toggle(opt.value)}>
                  <View style={{
                    paddingVertical: 20, paddingHorizontal: 16,
                    backgroundColor: selected ? TOKENS.primary : 'transparent',
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Txt variant="body" style={{ fontSize: 17, fontWeight: '700', color: selected ? TOKENS['on-primary'] : TOKENS.primary }}>
                        {opt.label}
                      </Txt>
                      {opt.description ? (
                        <Txt variant="body" style={{ fontSize: 13, color: selected ? 'rgba(255,255,255,0.7)' : TOKENS.outline }}>
                          {opt.description}
                        </Txt>
                      ) : null}
                    </View>
                    {selected && (
                      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: TOKENS['on-primary'], marginLeft: 12 }} />
                    )}
                  </View>
                </PressableFeedback>
                {i < options.length - 1 && <Hairline />}
              </View>
            );
          })}
        </View>
        <Button label={ctaLabel} onPress={onContinue} disabled={disabled} />
      </View>
    </SafeAreaView>
  );
}
