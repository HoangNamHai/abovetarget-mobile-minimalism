import React from 'react';
import { PressableFeedback } from '../primitives/PressableFeedback';
import { Txt } from '../primitives/Txt';
import { TOKENS } from '../../theme/tokens';

type Props = {
  /** Leading muted text, e.g. "No account? ". */
  prefix?: string;
  /** The tappable, inked portion, e.g. "Sign up". */
  action: string;
  onPress: () => void;
};

// Footer text link for auth screens: muted prefix + inked tappable action.
export function AuthLink({ prefix, action, onPress }: Props) {
  return (
    <PressableFeedback onPress={onPress}>
      <Txt variant="body" style={{ fontSize: 15, color: TOKENS.outline, textAlign: 'center' }}>
        {prefix}
        <Txt variant="body" style={{ fontSize: 15, color: TOKENS['on-background'], fontFamily: 'Hanken Grotesk Bold' }}>
          {action}
        </Txt>
      </Txt>
    </PressableFeedback>
  );
}
