import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));

import Splash from '../splash';
import StoryConcept from '../story-concept';
import StoryCast from '../story-cast';
import Belief from '../belief';

test('splash shows the learn-by-doing headline', async () => {
  const { getByText } = await render(<Splash />);
  expect(getByText(/Learn by doing/i)).toBeTruthy();
});
test('story-concept renders', async () => {
  const { getByText } = await render(<StoryConcept />);
  expect(getByText(/one story/i)).toBeTruthy();
});
test('story-cast renders the cast intro', async () => {
  const { getByText } = await render(<StoryCast />);
  expect(getByText(/Savory/i)).toBeTruthy();
});
test('belief option names the concrete cost of quitting (loss-framing)', async () => {
  const { getByText } = await render(<Belief />);
  expect(getByText(/retake/i)).toBeTruthy();
});
