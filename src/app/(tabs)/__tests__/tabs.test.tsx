import { render, screen } from '@testing-library/react-native';
import { BrandProvider } from '../../../theme/brand-context';
import Home from '../home';

test('home stub renders', async () => {
  await render(
    <BrandProvider>
      <Home />
    </BrandProvider>,
  );
  expect(screen.getByText(/home/i)).toBeTruthy();
});
