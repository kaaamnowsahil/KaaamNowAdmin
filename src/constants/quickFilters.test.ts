import { describe, expect, it } from 'vitest';

import { isSearchShortcut, quickFiltersFor, sectionSupportsSearch } from './quickFilters';

const key = (overrides: Partial<KeyboardEvent>) => ({
  key: 'k',
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  ...overrides,
});

describe('isSearchShortcut', () => {
  it('uses Command+K on Apple platforms only', () => {
    expect(isSearchShortcut(key({ metaKey: true }), true)).toBe(true);
    expect(isSearchShortcut(key({ key: 'K', metaKey: true }), true)).toBe(true);
    expect(isSearchShortcut(key({ ctrlKey: true }), true)).toBe(false);
  });

  it('uses Control+K elsewhere', () => {
    expect(isSearchShortcut(key({ ctrlKey: true }), false)).toBe(true);
    expect(isSearchShortcut(key({ metaKey: true }), false)).toBe(false);
  });

  it('ignores other keys and modifier combinations', () => {
    expect(isSearchShortcut(key({}), true)).toBe(false);
    expect(isSearchShortcut(key({ key: 'j', metaKey: true }), true)).toBe(false);
    expect(isSearchShortcut(key({ metaKey: true, shiftKey: true }), true)).toBe(false);
    expect(isSearchShortcut(key({ ctrlKey: true, altKey: true }), false)).toBe(false);
  });
});

describe('quick filters', () => {
  it('offers status presets matching the table badges on list pages', () => {
    expect(quickFiltersFor('support').map(filter => filter.status)).toEqual(['Open', 'In Progress', 'Closed']);
    expect(quickFiltersFor('payouts').map(filter => filter.status)).toContain('Processing');
    expect(quickFiltersFor('shifts').map(filter => filter.status)).toContain('Awaiting Payment');
  });

  it('offers nothing where no table consumes the filter', () => {
    expect(quickFiltersFor('overview')).toEqual([]);
    expect(quickFiltersFor('settings')).toEqual([]);
  });

  it('enables search only on pages whose table reads it', () => {
    expect(sectionSupportsSearch('workers')).toBe(true);
    expect(sectionSupportsSearch('approvals')).toBe(true);
    expect(sectionSupportsSearch('overview')).toBe(false);
    expect(sectionSupportsSearch('marketplace')).toBe(false);
  });
});
