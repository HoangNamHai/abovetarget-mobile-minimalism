import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DayOfWeekPicker } from '../DayOfWeekPicker';
import { TimeWheel } from '../TimeWheel';

test('DayOfWeekPicker toggles a day off when already selected', async () => {
  const onChange = jest.fn();
  const { getByTestId } = await render(
    <DayOfWeekPicker value={[2, 3, 4, 5, 6]} onChange={onChange} />,
  );
  fireEvent.press(getByTestId('day-2')); // Monday is on -> toggling removes it
  expect(onChange).toHaveBeenCalledWith([3, 4, 5, 6]);
});

test('DayOfWeekPicker adds a day when not selected', async () => {
  const onChange = jest.fn();
  const { getByTestId } = await render(
    <DayOfWeekPicker value={[2]} onChange={onChange} />,
  );
  fireEvent.press(getByTestId('day-7')); // Saturday on
  expect(onChange).toHaveBeenCalledWith([2, 7]);
});

test('TimeWheel reports a new time when the hour column settles', async () => {
  const onChange = jest.fn();
  const { getByTestId } = await render(
    <TimeWheel hour={20} minute={0} onChange={onChange} />, // 8:00 PM
  );
  // Scroll the hour column to the top (index 0 -> hour "12"), period stays PM.
  fireEvent(getByTestId('wheel-hour'), 'momentumScrollEnd', {
    nativeEvent: { contentOffset: { x: 0, y: 0 } },
  });
  expect(onChange).toHaveBeenCalledWith({ hour: 12, minute: 0 });
});
