import { tv } from 'tailwind-variants';

// cardVariants: wired into QuizOption.tsx — drives border-radius and border-width per brand.
export const cardVariants = tv({
  base: 'bg-surface-container-lowest border-outline-variant',
  variants: {
    brand: {
      monograph: 'rounded-sm border',
      elite: 'rounded-none border-2 border-primary',
    },
  },
  defaultVariants: { brand: 'monograph' },
});
