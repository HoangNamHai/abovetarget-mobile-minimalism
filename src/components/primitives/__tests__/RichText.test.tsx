import { parseBlocks } from '../RichText';

test('parses a pipe table into header + body rows without delimiters', () => {
  const md = [
    '| Predictive Status Meeting | Agile Daily Standup |',
    '|---------------------------|--------------------|',
    '| Team reports TO PM | Team talks TO EACH OTHER |',
  ].join('\n');

  const blocks = parseBlocks(md);
  expect(blocks).toHaveLength(1);
  expect(blocks[0]).toEqual({
    type: 'table',
    rows: [
      ['Predictive Status Meeting', 'Agile Daily Standup'],
      ['Team reports TO PM', 'Team talks TO EACH OTHER'],
    ],
  });
});

test('parses bullet lists, stripping the dash marker', () => {
  const blocks = parseBlocks('- First item\n- **Bold** item');
  expect(blocks).toEqual([{ type: 'ul', items: ['First item', '**Bold** item'] }]);
});

test('parses numbered lists preserving authored numbers', () => {
  const blocks = parseBlocks('1. Alpha\n2. Beta');
  expect(blocks).toEqual([
    {
      type: 'ol',
      items: [
        { n: '1', text: 'Alpha' },
        { n: '2', text: 'Beta' },
      ],
    },
  ]);
});

test('separates blocks on blank lines and mixes types', () => {
  const md = ['Intro paragraph.', '', '- one', '- two', '', 'Outro.'].join('\n');
  const blocks = parseBlocks(md);
  expect(blocks.map((b) => b.type)).toEqual(['p', 'ul', 'p']);
});

test('a plain string is a single paragraph block (fast path)', () => {
  const blocks = parseBlocks('Hello **world**');
  expect(blocks).toEqual([{ type: 'p', text: 'Hello **world**' }]);
});

test('does not treat a lone pipe line without a separator as a table', () => {
  const blocks = parseBlocks('| not a table row');
  expect(blocks).toEqual([{ type: 'p', text: '| not a table row' }]);
});
