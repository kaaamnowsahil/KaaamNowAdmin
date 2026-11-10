import { describe, expect, it } from 'vitest';

import { refundable, rupeesToMinor, statusTone, transferActions } from './routeMath';

describe('rupeesToMinor', () => {
  it('converts rupees to paise without floating point error', () => {
    expect(rupeesToMinor('123.45')).toBe(12345);
    expect(rupeesToMinor('0.1')).toBe(10);
    expect(rupeesToMinor('1,000')).toBe(100000);
    expect(rupeesToMinor(' 19.99 ')).toBe(1999);
  });

  it('rejects zero, negatives, extra decimals and text', () => {
    for (const value of ['', '0', '0.00', '-5', '1.234', 'abc', '1e3']) {
      expect(rupeesToMinor(value)).toBeNull();
    }
  });
});

describe('refundable', () => {
  it('separates what needs a transfer reversal', () => {
    expect(refundable({ amount_minor: 36000, refunded_minor: 500, transferred_minor: 34560 })).toEqual({
      left: 35500,
      withoutReversal: 940,
    });
    expect(refundable({ amount_minor: 1000, refunded_minor: 1000, transferred_minor: 0 })).toEqual({
      left: 0,
      withoutReversal: 0,
    });
  });
});

describe('transferActions', () => {
  it('never offers approve on anything but a pending transfer', () => {
    expect(transferActions('pending')).toEqual(['approve', 'release']);
    expect(transferActions('failed')).toEqual(['retry', 'release', 'sync']);
    expect(transferActions('processing')).toEqual(['sync']);
    expect(transferActions('processed')).toEqual(['sync']);
    expect(transferActions('not_eligible')).toEqual([]);
  });

  it('maps statuses to badge tones', () => {
    expect(statusTone('processed')).toBe('success');
    expect(statusTone('failed')).toBe('danger');
    expect(statusTone('something_new')).toBe('neutral');
    expect(statusTone(null)).toBe('neutral');
  });
});
