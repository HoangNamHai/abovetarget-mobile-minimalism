import { renderHook, act } from '@testing-library/react-native';
import { BrandProvider, useBrand } from '../brand-context';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrandProvider>{children}</BrandProvider>
);

test('defaults to monograph and toggles', async () => {
  const { result } = await renderHook(() => useBrand(), { wrapper });
  expect(result.current.brand).toBe('monograph');
  await act(async () => result.current.toggleBrand());
  expect(result.current.brand).toBe('elite');
  await act(async () => result.current.setBrand('monograph'));
  expect(result.current.brand).toBe('monograph');
});
