import React from 'react';
import { StyleSheet, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';
import { Txt } from './Txt';

const BORDER = '#9ca3af';
const BOLD = 'Hanken Grotesk Bold';

// Lesson content is authored in lightweight markdown. We render a small subset
// natively: **bold** emphasis (inline), bullet/numbered lists, pipe tables, and
// blank-line separated paragraphs. Anything else falls through as plain text.

// ─── Inline ─────────────────────────────────────────────────────────────────

// Renders **bold** spans. By default emphasis swaps to the bold face (body text);
// pass an `emphasis` style to instead highlight (e.g. color) — used by display
// headings, where the Anton face has no heavier weight to switch to.
export function parseInlineMarkdown(
  text: string,
  emphasis: TextStyle = { fontFamily: BOLD },
): React.ReactNode {
  if (!text.includes('**')) return text;
  const parts = text.split('**');
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <Text key={i} style={emphasis}>
        {part}
      </Text>
    ) : (
      <Text key={i}>{part}</Text>
    ),
  );
}

// ─── Block parsing ────────────────────────────────────────────────────────────

type Block =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: { n: string; text: string }[] }
  | { type: 'table'; rows: string[][] };

const UL_RE = /^\s*[-*]\s+/;
const OL_RE = /^\s*\d+\.\s+/;

const isRow = (l: string) => l.trim().startsWith('|');
const isSeparator = (l: string) => {
  const t = l.trim();
  return t.includes('-') && /^[|:\-\s]+$/.test(t);
};

function tableCells(line: string): string[] {
  let t = line.trim();
  if (t.startsWith('|')) t = t.slice(1);
  if (t.endsWith('|')) t = t.slice(0, -1);
  return t.split('|').map((c) => c.trim());
}

export function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r/g, '').split('\n');
  const blocks: Block[] = [];
  const isTableStart = (idx: number) =>
    idx + 1 < lines.length && isRow(lines[idx]) && isSeparator(lines[idx + 1]);

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      i++;
      continue;
    }

    if (isTableStart(i)) {
      const rows = [tableCells(line)];
      i += 2; // header + separator
      while (i < lines.length && isRow(lines[i])) {
        rows.push(tableCells(lines[i]));
        i++;
      }
      blocks.push({ type: 'table', rows });
      continue;
    }

    if (UL_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && UL_RE.test(lines[i])) {
        items.push(lines[i].replace(UL_RE, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (OL_RE.test(line)) {
      const items: { n: string; text: string }[] = [];
      while (i < lines.length && OL_RE.test(lines[i])) {
        const m = lines[i].match(/^\s*(\d+)\.\s+(.*)$/);
        items.push({ n: m ? m[1] : '', text: m ? m[2] : lines[i].trim() });
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !isTableStart(i) &&
      !UL_RE.test(lines[i]) &&
      !OL_RE.test(lines[i])
    ) {
      para.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: 'p', text: para.join('\n') });
  }

  return blocks;
}

// ─── Style splitting ──────────────────────────────────────────────────────────
//
// Typography (color/size/font/leading) must reach every inner Text; layout
// (margins/padding) belongs on the block container so it isn't applied per line.

const TEXT_STYLE_KEYS = [
  'color',
  'fontSize',
  'lineHeight',
  'fontFamily',
  'fontWeight',
  'fontStyle',
  'letterSpacing',
  'textAlign',
  'textTransform',
  'textDecorationLine',
];

function splitStyle(style: TextProps['style']): { text: TextStyle; view: ViewStyle } {
  const flat = (StyleSheet.flatten(style) || {}) as Record<string, unknown>;
  const text: Record<string, unknown> = {};
  const view: Record<string, unknown> = {};
  for (const key of Object.keys(flat)) {
    if (TEXT_STYLE_KEYS.includes(key)) text[key] = flat[key];
    else view[key] = flat[key];
  }
  return { text: text as TextStyle, view: view as ViewStyle };
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = TextProps & {
  children?: React.ReactNode;
  className?: string;
};

export function RichText({ children, className, style }: Props) {
  if (typeof children !== 'string') {
    return (
      <Txt variant="body" className={className} style={style}>
        {children}
      </Txt>
    );
  }

  const blocks = parseBlocks(children);

  // Fast path: a single paragraph behaves exactly like before (style, including
  // any margins, stays on the Text).
  if (blocks.length === 1 && blocks[0].type === 'p') {
    return (
      <Txt variant="body" className={className} style={style}>
        {parseInlineMarkdown(blocks[0].text)}
      </Txt>
    );
  }

  const { text: textStyle, view: viewStyle } = splitStyle(style);

  const renderText = (content: React.ReactNode, extra?: TextStyle) => (
    <Txt variant="body" className={className} style={extra ? [textStyle, extra] : textStyle}>
      {content}
    </Txt>
  );

  return (
    <View style={[viewStyle, { gap: 12 }]}>
      {blocks.map((block, idx) => {
        if (block.type === 'p') {
          return <View key={idx}>{renderText(parseInlineMarkdown(block.text))}</View>;
        }

        if (block.type === 'ul') {
          return (
            <View key={idx} style={{ gap: 6 }}>
              {block.items.map((item, j) => (
                <View key={j} style={{ flexDirection: 'row' }}>
                  {renderText('•', { marginRight: 8 })}
                  {renderText(parseInlineMarkdown(item), { flex: 1 })}
                </View>
              ))}
            </View>
          );
        }

        if (block.type === 'ol') {
          return (
            <View key={idx} style={{ gap: 6 }}>
              {block.items.map((item, j) => (
                <View key={j} style={{ flexDirection: 'row' }}>
                  {renderText(`${item.n}.`, { marginRight: 8, minWidth: 22 })}
                  {renderText(parseInlineMarkdown(item.text), { flex: 1 })}
                </View>
              ))}
            </View>
          );
        }

        // table
        return (
          <View key={idx} style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 8, overflow: 'hidden' }}>
            {block.rows.map((row, ri) => (
              <View
                key={ri}
                style={{
                  flexDirection: 'row',
                  backgroundColor: ri === 0 ? 'rgba(127,127,127,0.12)' : undefined,
                }}
              >
                {row.map((cell, ci) => (
                  <View
                    key={ci}
                    style={{
                      flex: 1,
                      padding: 8,
                      borderLeftWidth: ci === 0 ? 0 : 1,
                      borderTopWidth: ri === 0 ? 0 : 1,
                      borderColor: BORDER,
                    }}
                  >
                    {renderText(parseInlineMarkdown(cell), ri === 0 ? { fontFamily: BOLD } : undefined)}
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}
