import { describe, it, expect } from 'vitest';
import { generateJoinCode } from './joinCode';

describe('joinCode', () => {
  it('generates a code with default length of 6', () => {
    const code = generateJoinCode();
    expect(code).toHaveLength(6);
  });

  it('generates a code with custom length', () => {
    const code4 = generateJoinCode(4);
    expect(code4).toHaveLength(4);

    const code8 = generateJoinCode(8);
    expect(code8).toHaveLength(8);

    const code12 = generateJoinCode(12);
    expect(code12).toHaveLength(12);
  });

  it('only uses allowed characters (A-Z without I/O, digits 2-9)', () => {
    const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const allowedSet = new Set(allowedChars.split(''));

    // Generate multiple codes to increase coverage
    for (let i = 0; i < 100; i++) {
      const code = generateJoinCode();
      for (const char of code) {
        expect(allowedSet.has(char)).toBe(true);
      }
    }
  });

  it('does not contain excluded characters (I, O, 0, 1)', () => {
    const excludedChars = ['I', 'O', '0', '1'];

    // Generate multiple codes to increase coverage
    for (let i = 0; i < 100; i++) {
      const code = generateJoinCode();
      for (const char of code) {
        expect(excludedChars).not.toContain(char);
      }
    }
  });

  it('generates different codes on subsequent calls', () => {
    const code1 = generateJoinCode();
    const code2 = generateJoinCode();
    const code3 = generateJoinCode();

    // Very unlikely all three are the same
    const allSame = code1 === code2 && code2 === code3;
    expect(allSame).toBe(false);
  });
});

