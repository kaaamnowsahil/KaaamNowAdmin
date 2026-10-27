import { describe, expect, it } from 'vitest';

import type { Business, Worker } from '@/types';
import {
  UNKNOWN_BUSINESS,
  UNKNOWN_USER,
  UNKNOWN_WORKER,
  mapPayments,
  mapPayouts,
  mapShifts,
  mapSupportTickets,
  payoutDestination,
  type PaymentRecord,
  type PayoutAccountRecord,
  type ShiftRecord,
  type WithdrawalRecord,
} from './marketplaceMappers';
import type { SupportTicketRecord } from './supportTickets';

const business = { id: 'b1', name: 'Cafe One', locality: 'Indiranagar' } as Business;
const worker = { id: 'w1', name: 'Asha K' } as Worker;

const shift = (over: Partial<ShiftRecord> = {}): ShiftRecord => ({
  id: 's1',
  business_profile_id: 'b1',
  shift_type: 'scheduled',
  status: 'open',
  job_title: 'Barista',
  responsibilities: 'Brew',
  requirements: 'Apron',
  workers_required: 3,
  hourly_rate_minor: 15050,
  starts_at: '2026-10-28T04:30:00Z',
  ends_at: '2026-10-28T12:30:00Z',
  workplace_name: 'Site name',
  address_text: '12 Main Rd',
  search_radius_km: '5.50',
  created_at: '2026-10-27T10:00:00Z',
  cancel_reason: null,
  ...over,
});

describe('mapShifts', () => {
  it('joins the business and counts only seats still held', () => {
    const [row] = mapShifts(
      [shift()],
      [
        { id: 'a1', shift_id: 's1', status: 'confirmed' },
        { id: 'a2', shift_id: 's1', status: 'checked_in' },
        { id: 'a3', shift_id: 's1', status: 'cancelled' },
        { id: 'a4', shift_id: 's1', status: 'no_show' },
        { id: 'a5', shift_id: 'other', status: 'confirmed' },
      ],
      [business],
    );
    expect(row).toMatchObject({
      businessName: 'Cafe One',
      area: 'Indiranagar',
      assignedCount: 2,
      workersNeeded: 3,
      hourlyRateMinor: 15050,
      searchRadiusKm: 5.5,
      status: 'open',
    });
  });

  it('never invents a business name or radius', () => {
    const [named] = mapShifts([shift({ business_profile_id: 'x' })], [], []);
    expect(named?.businessName).toBe('Site name');
    expect(named?.area).toBe('12 Main Rd');
    const [unnamed] = mapShifts(
      [shift({ business_profile_id: 'x', workplace_name: '', search_radius_km: null })],
      [],
      [],
    );
    expect(unnamed?.businessName).toBe(UNKNOWN_BUSINESS);
    expect(unnamed?.searchRadiusKm).toBeNull();
    expect(unnamed?.assignedCount).toBe(0);
    const [bad] = mapShifts([shift({ search_radius_km: 'abc' })], [], []);
    expect(bad?.searchRadiusKm).toBeNull();
    const [empty] = mapShifts([shift({ search_radius_km: '' })], [], []);
    expect(empty?.searchRadiusKm).toBeNull();
  });
});

const payment = (over: Partial<PaymentRecord> = {}): PaymentRecord => ({
  id: 'p1',
  invoice_id: 'i1',
  business_profile_id: 'b1',
  method: 'upi_qr',
  provider: 'razorpay',
  status: 'succeeded',
  amount_minor: 118000,
  reference: 'PAY-1',
  paid_at: '2026-10-27T10:00:00Z',
  failure_reason: null,
  created_at: '2026-10-27T09:00:00Z',
  ...over,
});

describe('mapPayments', () => {
  it('uses the server status and invoice split as-is', () => {
    const [row] = mapPayments(
      [payment()],
      [{ id: 'i1', reference: 'INV-1', worker_subtotal_minor: 100000, platform_fee_minor: 18000 }],
      [business],
    );
    expect(row).toMatchObject({
      status: 'succeeded',
      amountMinor: 118000,
      subtotalMinor: 100000,
      platformFeeMinor: 18000,
      invoiceReference: 'INV-1',
      businessName: 'Cafe One',
    });
  });

  it('reports a missing invoice as unavailable rather than zero', () => {
    const [row] = mapPayments([payment({ status: 'pending', business_profile_id: 'x' })], [], []);
    expect(row?.subtotalMinor).toBeNull();
    expect(row?.platformFeeMinor).toBeNull();
    expect(row?.invoiceReference).toBeNull();
    expect(row?.status).toBe('pending');
    expect(row?.businessName).toBe(UNKNOWN_BUSINESS);
  });
});

const account = (over: Partial<PayoutAccountRecord>): PayoutAccountRecord => ({
  id: 'acc',
  account_type: 'upi',
  upi_id: null,
  paytm_phone: null,
  bank_account_number: null,
  bank_ifsc: null,
  ...over,
});

describe('payoutDestination', () => {
  it('masks bank accounts and shows UPI / wallet ids', () => {
    expect(payoutDestination(undefined)).toBe('');
    expect(payoutDestination(account({ upi_id: 'asha@upi' }))).toBe('asha@upi');
    expect(payoutDestination(account({ account_type: 'upi' }))).toBe('');
    expect(payoutDestination(account({ account_type: 'paytm', paytm_phone: '9876543210' }))).toBe('9876543210');
    expect(payoutDestination(account({ account_type: 'paytm' }))).toBe('');
    expect(
      payoutDestination(
        account({ account_type: 'bank', bank_account_number: '123456789012', bank_ifsc: 'HDFC0001' }),
      ),
    ).toBe('•••• 9012 · HDFC0001');
    expect(payoutDestination(account({ account_type: 'bank' }))).toBe('');
  });
});

describe('mapPayouts', () => {
  const withdrawal = (over: Partial<WithdrawalRecord> = {}): WithdrawalRecord => ({
    id: 'wd1',
    worker_profile_id: 'w1',
    payout_account_id: 'acc',
    amount_minor: 50000,
    status: 'processing',
    reference: 'WD-1',
    provider: 'razorpayx',
    failure_reason: null,
    initiated_at: '2026-10-27T09:00:00Z',
    completed_at: null,
    ...over,
  });

  it('keeps the provider-driven status and joins worker + account', () => {
    const [row] = mapPayouts(
      [withdrawal()],
      [account({ account_type: 'bank', bank_account_number: '000011112222', bank_ifsc: 'SBIN0001' })],
      [worker],
    );
    expect(row).toMatchObject({
      status: 'processing',
      workerName: 'Asha K',
      method: 'Bank',
      destination: '•••• 2222 · SBIN0001',
      amountMinor: 50000,
      completedAt: null,
    });
  });

  it('marks unknown workers and accounts honestly', () => {
    const [row] = mapPayouts([withdrawal({ status: 'failed', failure_reason: 'IFSC invalid' })], [], []);
    expect(row).toMatchObject({
      workerName: UNKNOWN_WORKER,
      method: 'Unknown',
      destination: '',
      status: 'failed',
      failureReason: 'IFSC invalid',
    });
  });
});

describe('mapSupportTickets', () => {
  const ticket: SupportTicketRecord = {
    id: 't1',
    user_id: 'u1',
    topic: 'payout',
    subject: 'Missing payout',
    message: 'Not received',
    shift_id: null,
    assignment_id: null,
    status: 'open',
    priority: 'urgent',
    resolution_note: null,
    resolved_by_user_id: null,
    resolved_at: null,
    created_at: '2026-10-27T09:00:00Z',
    updated_at: '2026-10-27T09:00:00Z',
  };

  it('joins the raising user', () => {
    const [row] = mapSupportTickets(
      [ticket],
      new Map([['u1', { id: 'u1', full_name: 'Ravi', phone: '+919999999999' }]]),
    );
    expect(row?.raisedBy).toEqual({ id: 'u1', name: 'Ravi', phone: '+919999999999' });
    expect(row?.status).toBe('open');
    expect(row?.priority).toBe('urgent');
  });

  it('falls back to an unknown user without a phone', () => {
    const [row] = mapSupportTickets([ticket], new Map());
    expect(row?.raisedBy).toEqual({ id: 'u1', name: UNKNOWN_USER, phone: null });
    const [nameless] = mapSupportTickets(
      [ticket],
      new Map([['u1', { id: 'u1', full_name: null, phone: '+91' }]]),
    );
    expect(nameless?.raisedBy.name).toBe(UNKNOWN_USER);
  });
});
