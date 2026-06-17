import { cardVariants } from '../variants';

test('elite card uses square hard border, monograph uses soft rounded', () => {
  const elite = cardVariants({ brand: 'elite' });
  const mono = cardVariants({ brand: 'monograph' });
  expect(elite).toContain('border-2');
  expect(elite).toContain('rounded-none');
  expect(mono).toContain('rounded-sm');
  expect(mono).not.toContain('border-2');
});
