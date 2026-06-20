import React from 'react';
import { Appear } from '../../primitives/Appear';
import { parseInlineMarkdown, RichText } from '../../primitives/RichText';
import { Txt } from '../../primitives/Txt';
import { ACCENTS } from '../../../theme/accents';
import { TOKENS } from '../../../theme/tokens';

// The question prompt. When the question carries a scenario, render its name
// (eyebrow) and situation (the context paragraph) above the prompt — without
// them, scenario questions like "What outcome has been achieved?" are
// unanswerable. The prompt itself is a display (Anton) heading; Anton has no
// bold weight, so **emphasis** is colored with the selection accent instead of
// swapping fonts. Wrapped in Appear so it shares the screen entrance.
export function QuestionPrompt({
  children,
  situation,
  scenarioName,
}: {
  children: string;
  situation?: string;
  scenarioName?: string;
}) {
  return (
    <Appear index={0}>
      {scenarioName ? (
        <Txt
          variant="label"
          style={{
            fontSize: 11,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: TOKENS.outline,
            marginBottom: 8,
          }}
        >
          {scenarioName}
        </Txt>
      ) : null}
      {situation ? (
        <RichText
          className="text-on-surface text-base leading-relaxed"
          style={{ marginBottom: 16 }}
        >
          {situation}
        </RichText>
      ) : null}
      <Txt variant="display" style={{ fontSize: 24, lineHeight: 33 }}>
        {parseInlineMarkdown(children, { color: ACCENTS.selection })}
      </Txt>
    </Appear>
  );
}
