import { describe, expect, it } from 'vitest';
import { formatYearMonthLocal } from './dates';

describe('date helpers', () => {
  it('formats year-month in local time', () => {
    expect(formatYearMonthLocal(new Date(2024, 0, 15))).toBe('2024-01');
    expect(formatYearMonthLocal(new Date(2024, 10, 5))).toBe('2024-11');
  });
});
