import React from 'react';
import { render } from '@testing-library/react-native';
import { Txt } from '../Txt';
import { FadeInView } from '../FadeInView';

test('FadeInView renders its children', async () => {
  const { getByText } = await render(
    <FadeInView>
      <Txt>Hello</Txt>
    </FadeInView>,
  );
  expect(getByText('Hello')).toBeTruthy();
});
