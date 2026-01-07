import { describe, it, expect } from 'vitest';
import { generateId, isToday, isTomorrow, addDays } from './utils';

describe('utils', () => {
  it('generates unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^\d+-[a-z0-9]+$/);
  });

  it('checks if date is today', () => {
    const today = new Date();
    expect(isToday(today)).toBe(true);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday)).toBe(false);
  });

  it('checks if date is tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isTomorrow(tomorrow)).toBe(true);

    const today = new Date();
    expect(isTomorrow(today)).toBe(false);
  });

  it('adds days to date', () => {
    const date = new Date('2024-01-01');
    const result = addDays(date, 5);
    expect(result.getDate()).toBe(6);
  });
});

