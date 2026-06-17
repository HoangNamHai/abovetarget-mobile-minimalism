export interface MonographTakeaway {
  icon: string;
  title: string;
  description: string;
}

export interface EliteTakeaway {
  num: string;
  title: string;
  description: string;
  image?: ReturnType<typeof require>;
  dark?: boolean;
}

export const MONOGRAPH_TAKEAWAYS: MonographTakeaway[] = [
  {
    icon: 'hourglass_empty',
    title: 'Projects are Temporary',
    description:
      'Defined beginning and end dates. Aimed at creating a unique product, service, or result within a fixed timeline.',
  },
  {
    icon: 'sync',
    title: 'Operations are Ongoing',
    description:
      'Repetitive activities that sustain the business. Focus on efficiency and long-term sustainability of resources.',
  },
  {
    icon: 'trending_up',
    title: 'Change vs Stability',
    description:
      'Projects disrupt to innovate; operations maintain to stabilize. Balancing this tension is critical for growth.',
  },
  {
    icon: 'pie_chart',
    title: 'Resource Allocation',
    description:
      'Strategic distribution of talent and capital between tactical project goals and functional daily tasks.',
  },
];

export const ELITE_TAKEAWAYS: EliteTakeaway[] = [
  {
    num: '01',
    title: 'Structural Brutalism',
    description:
      'Design as architecture. Every element serves a load-bearing purpose. Remove the ornamental to reveal the essential strength of the message.',
    image: require('../../assets/placeholders/elite-01.jpg'),
  },
  {
    num: '02',
    title: 'Visual Gravity',
    description:
      "Hierarchy is established through scale, not color. Larger blocks exert more pull on the user's attention.",
    dark: true,
  },
  {
    num: '03',
    title: 'Linear Order',
    description:
      'The eye follows the grid. Deviations must be intentional and serve as a focal point for high-priority insights.',
  },
  {
    num: '04',
    title: 'Silent Interaction',
    description:
      'Micro-interactions should be felt, not seen. Subtle opacity shifts replace loud hover states.',
  },
];
