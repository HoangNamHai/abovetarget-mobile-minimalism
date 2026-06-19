import React from 'react';
import { Appear } from '../../primitives/Appear';
import { parseInlineMarkdown } from '../../primitives/RichText';
import { Txt } from '../../primitives/Txt';
import { ACCENTS } from '../../../theme/accents';

// The question prompt is a display (Anton) heading. Anton has no bold weight, so
// **emphasis** is rendered by coloring the span with the selection accent rather
// than swapping fonts. Wrapped in Appear so it shares the screen entrance.
export function QuestionPrompt({ children }: { children: string }) {
  return (
    <Appear index={0}>
      <Txt variant="display" style={{ fontSize: 24, lineHeight: 33 }}>
        {parseInlineMarkdown(children, { color: ACCENTS.selection })}
      </Txt>
    </Appear>
  );
}
