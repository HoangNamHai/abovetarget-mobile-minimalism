import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ConfidenceRating } from '../ConfidenceRating';
import { DomainPicker, lessonsForDomain } from '../DomainPicker';
import { TOKENS } from '../../../theme/tokens';

test('lessonsForDomain returns up to 3 lessons for a domain', () => {
  const lessons = lessonsForDomain('process', 3);
  expect(lessons.length).toBeGreaterThan(0);
  expect(lessons.length).toBeLessThanOrEqual(3);
});

test('DomainPicker shows the recommended badge and fires onSelect', async () => {
  const onSelect = jest.fn();
  const { getByText, getAllByText } = await render(
    <DomainPicker recommended="process" selected={null} onSelect={onSelect} />,
  );
  expect(getAllByText(/Recommended for you/i).length).toBeGreaterThan(0);
  fireEvent.press(getByText('People'));
  expect(onSelect).toHaveBeenCalledWith('people');
});

test('the selected card gets a highlighted background, others stay plain', async () => {
  const { getByTestId } = await render(
    <DomainPicker recommended="process" selected="people" onSelect={() => {}} />,
  );
  expect(getByTestId('domain-card-people').props.style.backgroundColor).toBe(TOKENS['surface-container-high']);
  expect(getByTestId('domain-card-process').props.style.backgroundColor).toBe(TOKENS['surface-container-lowest']);
});

test('ConfidenceRating fires onChange with the tapped value', async () => {
  const onChange = jest.fn();
  const { getByTestId } = await render(
    <ConfidenceRating value={{ people: 3, process: 3, business: 3 }} onChange={onChange} />,
  );
  fireEvent.press(getByTestId('confidence-process-5'));
  expect(onChange).toHaveBeenCalledWith('process', 5);
});
