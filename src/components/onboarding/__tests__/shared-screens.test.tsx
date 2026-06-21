import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ValueScreen } from '../ValueScreen';
import { FactScreen } from '../FactScreen';
import { ChoiceScreen } from '../ChoiceScreen';

test('ValueScreen renders title and fires onContinue', async () => {
  const onContinue = jest.fn();
  const { getByText } = await render(
    <ValueScreen title="Learn by doing" ctaLabel="Get Started" onContinue={onContinue} />,
  );
  fireEvent.press(getByText('Get Started'));
  expect(onContinue).toHaveBeenCalled();
});

test('FactScreen renders the fact text', async () => {
  const { getByText } = await render(
    <FactScreen fact={{ id: 'x', text: '180 questions' }} onContinue={() => {}} progress={0.2} />,
  );
  expect(getByText(/180 questions/)).toBeTruthy();
});

test('ChoiceScreen single-select toggles selection and continues', async () => {
  const onChange = jest.fn();
  const onContinue = jest.fn();
  const { getByText } = await render(
    <ChoiceScreen
      title="Why certified?"
      mode="single"
      options={[{ value: 'a', label: 'Promotion' }, { value: 'b', label: 'Raise' }]}
      value={['a']}
      onChange={onChange}
      onContinue={onContinue}
      ctaLabel="Continue"
    />,
  );
  fireEvent.press(getByText('Raise'));
  expect(onChange).toHaveBeenCalledWith(['b']);
  fireEvent.press(getByText('Continue'));
  expect(onContinue).toHaveBeenCalled();
});
