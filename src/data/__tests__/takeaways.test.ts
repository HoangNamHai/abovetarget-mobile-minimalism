import { MONOGRAPH_TAKEAWAYS, ELITE_TAKEAWAYS } from '../takeaways';

// ── MONOGRAPH_TAKEAWAYS ───────────────────────────────────────────────────────

test('MONOGRAPH_TAKEAWAYS has four items', () => {
  expect(MONOGRAPH_TAKEAWAYS).toHaveLength(4);
});

test('MONOGRAPH_TAKEAWAYS item 0 is correct', () => {
  expect(MONOGRAPH_TAKEAWAYS[0]).toEqual({
    icon: 'hourglass_empty',
    title: 'Projects are Temporary',
    description:
      'Defined beginning and end dates. Aimed at creating a unique product, service, or result within a fixed timeline.',
  });
});

test('MONOGRAPH_TAKEAWAYS item 1 is correct', () => {
  expect(MONOGRAPH_TAKEAWAYS[1]).toEqual({
    icon: 'sync',
    title: 'Operations are Ongoing',
    description:
      'Repetitive activities that sustain the business. Focus on efficiency and long-term sustainability of resources.',
  });
});

test('MONOGRAPH_TAKEAWAYS item 2 is correct', () => {
  expect(MONOGRAPH_TAKEAWAYS[2]).toEqual({
    icon: 'trending_up',
    title: 'Change vs Stability',
    description:
      'Projects disrupt to innovate; operations maintain to stabilize. Balancing this tension is critical for growth.',
  });
});

test('MONOGRAPH_TAKEAWAYS item 3 is correct', () => {
  expect(MONOGRAPH_TAKEAWAYS[3]).toEqual({
    icon: 'pie_chart',
    title: 'Resource Allocation',
    description:
      'Strategic distribution of talent and capital between tactical project goals and functional daily tasks.',
  });
});

// ── ELITE_TAKEAWAYS ───────────────────────────────────────────────────────────

test('ELITE_TAKEAWAYS has four items', () => {
  expect(ELITE_TAKEAWAYS).toHaveLength(4);
});

test('ELITE_TAKEAWAYS item 01 has image require and no dark flag', () => {
  const item = ELITE_TAKEAWAYS[0];
  expect(item.num).toBe('01');
  expect(item.title).toBe('Structural Brutalism');
  expect(item.description).toBe(
    'Design as architecture. Every element serves a load-bearing purpose. Remove the ornamental to reveal the essential strength of the message.'
  );
  // image should be a local require (truthy, not a remote URL string)
  expect(item.image).toBeTruthy();
  expect(typeof item.image).not.toBe('string');
  expect(item).not.toHaveProperty('dark');
});

test('ELITE_TAKEAWAYS item 02 has dark flag and no image', () => {
  const item = ELITE_TAKEAWAYS[1];
  expect(item.num).toBe('02');
  expect(item.title).toBe('Visual Gravity');
  expect(item.description).toBe(
    "Hierarchy is established through scale, not color. Larger blocks exert more pull on the user's attention."
  );
  expect(item.dark).toBe(true);
  expect(item).not.toHaveProperty('image');
});

test('ELITE_TAKEAWAYS item 03 has no image and no dark flag', () => {
  const item = ELITE_TAKEAWAYS[2];
  expect(item.num).toBe('03');
  expect(item.title).toBe('Linear Order');
  expect(item.description).toBe(
    'The eye follows the grid. Deviations must be intentional and serve as a focal point for high-priority insights.'
  );
  expect(item).not.toHaveProperty('image');
  expect(item).not.toHaveProperty('dark');
});

test('ELITE_TAKEAWAYS item 04 has no image and no dark flag', () => {
  const item = ELITE_TAKEAWAYS[3];
  expect(item.num).toBe('04');
  expect(item.title).toBe('Silent Interaction');
  expect(item.description).toBe(
    'Micro-interactions should be felt, not seen. Subtle opacity shifts replace loud hover states.'
  );
  expect(item).not.toHaveProperty('image');
  expect(item).not.toHaveProperty('dark');
});
