import { describe, expect, it } from 'vitest';

import { validateMinWithdrawal } from './WithdrawalSettingsTab';

describe('validateMinWithdrawal', () => {
  it('accepts ₹1 up to ₹1,00,000 with a reason', () => {
    expect(validateMinWithdrawal({ rupees: '1', notes: 'Launch' })).toEqual({});
    expect(validateMinWithdrawal({ rupees: '5000.50', notes: 'Fewer small payouts' })).toEqual({});
    expect(validateMinWithdrawal({ rupees: '100000', notes: 'Cap' })).toEqual({});
  });

  it('rejects amounts outside the range, bad formats and a missing reason', () => {
    expect(validateMinWithdrawal({ rupees: '0.5', notes: 'x' }).rupees).toMatch(/Between/);
    expect(validateMinWithdrawal({ rupees: '100001', notes: 'x' }).rupees).toMatch(/Between/);
    expect(validateMinWithdrawal({ rupees: '1.234', notes: 'x' }).rupees).toMatch(/Enter rupees/);
    expect(validateMinWithdrawal({ rupees: '10', notes: ' ' }).notes).toBeTruthy();
  });
});
