import React, { createContext, useContext, useMemo, useState } from 'react';

export type Brand = 'monograph' | 'elite';

type BrandContextValue = {
  brand: Brand;
  setBrand: (b: Brand) => void;
  toggleBrand: () => void;
};

const BrandContext = createContext<BrandContextValue | null>(null);

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrand] = useState<Brand>('monograph');
  const value = useMemo(
    () => ({
      brand,
      setBrand,
      toggleBrand: () => setBrand((b) => (b === 'monograph' ? 'elite' : 'monograph')),
    }),
    [brand],
  );
  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandContextValue {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrand must be used within BrandProvider');
  return ctx;
}
