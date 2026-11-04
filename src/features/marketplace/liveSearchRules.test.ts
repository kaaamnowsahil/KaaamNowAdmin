import { describe, expect, it } from 'vitest';

import { parseBoostRupees, wholeNumberError } from './livePricingMath';

describe('wholeNumberError', () => {
  it('accepts whole numbers in range', () => {
    expect(wholeNumberError('30', 5, 120)).toBe('');
    expect(wholeNumberError(' 5 ', 5, 120)).toBe('');
  });

  it('rejects blanks, decimals and out-of-range values', () => {
    expect(wholeNumberError('', 5, 120)).toBe('Required.');
    expect(wholeNumberError('2.5', 1, 5)).toBe('Enter a whole number.');
    expect(wholeNumberError('121', 5, 120)).toBe('Must be between 5 and 120.');
  });
});

describe('parseBoostRupees', () => {
  it('turns rupees into sorted paise', () => {
    expect(parseBoostRupees('30, 10,20')).toEqual({ minor: [1000, 2000, 3000], error: '' });
  });

  it('rejects empty lists, too many, bad amounts and duplicates', () => {
    expect(parseBoostRupees(' , ').error).toMatch(/1 to 5 amounts/);
    expect(parseBoostRupees('1,2,3,4,5,6').error).toMatch(/1 to 5 amounts/);
    expect(parseBoostRupees('10.5').error).toMatch(/whole rupees/);
    expect(parseBoostRupees('0').error).toMatch(/whole rupees/);
    expect(parseBoostRupees('1001').error).toMatch(/whole rupees/);
    expect(parseBoostRupees('10, 10').error).toBe('Each amount can appear only once.');
  });
});
