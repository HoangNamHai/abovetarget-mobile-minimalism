import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ConfidenceRating } from '../ConfidenceRating';
import { DomainPicker, lessonsForDomain } from '../DomainPicker';
import { TOKENS } from '../../../theme/tokens';
import { ACCENTS } from '../../../theme/accents';

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

test('the selected card gets a highlighted accent border, others stay plain', async () => {
  const { getByTestId } = await render(
    <DomainPicker recommended="process" selected="people" onSelect={() => {}} />,
  );
  expect(getByTestId('domain-card-people').props.style.borderColor).toBe(ACCENTS.selection);
  expect(getByTestId('domain-card-process').props.style.borderColor).toBe(TOKENS['outline-variant']);
});

test('the recommended domain is listed first', async () => {
  const { getAllByTestId } = await render(
    <DomainPicker recommended="business" selected={null} onSelect={() => {}} />,
  );
  const cards = getAllByTestId(/^domain-card-/);
  expect(cards[0].props.testID).toBe('domain-card-business');
});

test('ConfidenceRating fires onChange with the tapped value', async () => {
  const onChange = jest.fn();
  const { getByTestId } = await render(
    <ConfidenceRating value={{ people: 3, process: 3, business: 3 }} onChange={onChange} />,
  );
  fireEvent.press(getByTestId('confidence-process-5'));
  expect(onChange).toHaveBeenCalledWith('process', 5);
});

test('only the exact selected number is highlighted; the rest are white', async () => {
  const { getByTestId } = await render(
    <ConfidenceRating value={{ people: 1, process: 3, business: 1 }} onChange={() => {}} />,
  );
  expect(getByTestId('confidence-process-3').props.style.backgroundColor).toBe(TOKENS.primary);
  // a lower number is NOT filled (no cumulative fill) and stays white
  expect(getByTestId('confidence-process-2').props.style.backgroundColor).toBe(TOKENS['surface-container-lowest']);
});
