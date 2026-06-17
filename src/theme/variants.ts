import { tv } from 'tailwind-variants';

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

export const displayTextVariants = tv({
  base: 'text-on-background uppercase',
  variants: {
    brand: {
      monograph: 'tracking-tight',
      elite: 'tracking-tighter',
    },
  },
  defaultVariants: { brand: 'monograph' },
});

export const labelVariants = tv({
  base: 'uppercase font-bold tracking-widest text-outline',
  variants: { brand: { monograph: 'text-[11px]', elite: 'text-[12px]' } },
  defaultVariants: { brand: 'monograph' },
});

export const dividerVariants = tv({
  base: 'bg-outline-variant w-full',
  variants: { brand: { monograph: 'h-px', elite: 'h-px' } },
  defaultVariants: { brand: 'monograph' },
});
