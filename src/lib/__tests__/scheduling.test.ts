import { generateMonth, getMonthRange } from '../scheduling';

describe('generateMonth', () => {
  test('February non-leap year has 28 days', () => {
    const days = generateMonth(2025, 2); // 2025 is not a leap year
    expect(days.length).toBe(28);
    expect(days[0]).toBe('2025-02-01');
    expect(days[27]).toBe('2025-02-28');
  });

  test('February leap year has 29 days', () => {
    const days = generateMonth(2024, 2); // 2024 is a leap year
    expect(days.length).toBe(29);
    expect(days[28]).toBe('2024-02-29');
  });

  test('July has 31 days', () => {
    const days = generateMonth(2025, 7);
    expect(days.length).toBe(31);
    expect(days[0]).toBe('2025-07-01');
    expect(days[30]).toBe('2025-07-31');
  });

  test('invalid month throws', () => {
    expect(() => generateMonth(2025, 13)).toThrow(RangeError);
  });
});

describe('getMonthRange', () => {
  test('returns correct start and end for September 2025', () => {
    const { start, end, days } = getMonthRange(2025, 9);
    expect(start).toBe('2025-09-01');
    expect(end).toBe('2025-09-30');
    expect(days.length).toBe(30);
  });

  test('returns correct start and end for October 2025', () => {
    const { start, end, days } = getMonthRange(2025, 10);
    expect(start).toBe('2025-10-01');
    expect(end).toBe('2025-10-31');
    expect(days.length).toBe(31);
  });
});
