import { formatText } from '@/utils/text';
import {
  ArrowDownToLine,
  Check,
  ChevronDown,
  Eye,
  MoreHorizontal,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { StatusBadge } from '@/components/StatusBadge';
import { ALL_STATUSES } from '@/constants/quickFilters';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ManagementMetrics, type ManagementMetric } from '@/components/ManagementMetrics';
import type {
  AdminShift,
  Business,
  Payment,
  Payout,
  SupportTicket,
  AdminVerificationRequest,
  Worker,
} from '@/types';
import { downloadCsv } from '@/utils/csv';
import { formatMinorRupees, initialsOf } from '@/utils/format';

export type AdminSection =
  | 'workers'
  | 'businesses'
  | 'shifts'
  | 'payments'
  | 'payouts'
  | 'approvals'
  | 'support';

export type DetailItem = { label: string; value: string };
export type SelectedRecord = {
  title: string;
  subtitle: string;
  details: DetailItem[];
  type: 'worker' | 'business' | 'record';
  userId?: string;
  accountIsActive?: boolean;
  imageUrl?: string | null;
};

type ManagementPageProps = {
  section: AdminSection;
  workers?: Worker[];
  businesses: Business[];
  shifts: AdminShift[];
  payments: Payment[];
  payouts: Payout[];
  supportTickets: SupportTicket[];
  approvals: AdminVerificationRequest[];
  search: string;
  onSearch: (value: string) => void;
  /** Controlled by the top-bar quick filters when provided. */
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  onSelect: (record: SelectedRecord) => void;
  onResolveTicket?: (ticketId: string) => void;
  busyTicketId?: string;
  /** Rows that exist server-side; shown when only the newest records were loaded. */
  serverTotal?: number;
  onVerifyProfile?: (
    type: 'worker' | 'business',
    profileId: string,
    status: 'verified' | 'rejected',
  ) => void;
  busyDirectoryId?: string;
  busyVerificationDecision?: 'verified' | 'rejected' | '';
};

type Row = {
  id: string;
  userId?: string;
  accountIsActive?: boolean;
  title: string;
  subtitle: string;
  avatar: string;
  avatarTone: number;
  imageUrl?: string | null;
  cells: string[];
  status: string;
  statusTone: 'success' | 'warning' | 'danger' | 'neutral' | 'purple' | 'blue';
  secondaryStatuses?: { label: string; tone: Row['statusTone'] }[];
  verificationType?: 'worker' | 'business';
  details: DetailItem[];
  detailType: SelectedRecord['type'];
};

const sectionMeta: Record<AdminSection, { title: string; description: string; label: string; action: string; columns: string[] }> = {
  workers: { title: 'Workers', description: 'Manage worker profiles, verification and availability.', label: 'ALL WORKERS', action: 'Export workers', columns: ['Worker', 'Work category', 'Location', 'Rating', 'Completed shifts', 'Status'] },
  businesses: { title: 'Businesses', description: 'Manage business profiles, verification and marketplace activity.', label: 'ALL BUSINESSES', action: 'Export businesses', columns: ['Business', 'Business type', 'Location', 'Rating', 'Reviews', 'Status'] },
  shifts: { title: 'Shifts', description: 'Monitor live requests and scheduled work across the city.', label: 'ALL SHIFTS', action: 'Export shifts', columns: ['Shift', 'Business', 'Schedule', 'Workers', 'Pay rate', 'Status'] },
  payments: { title: 'Payments', description: 'Track business charges, platform fees and transaction status.', label: 'TRANSACTION LEDGER', action: 'Export ledger', columns: ['Transaction', 'Business', 'Date', 'Method', 'Amount', 'Status'] },
  payouts: { title: 'Payouts', description: 'Worker withdrawals. Status is updated by the payout provider, not from this dashboard.', label: 'PAYOUT QUEUE', action: 'Export payouts', columns: ['Worker', 'Method', 'Requested', 'Amount', 'Status'] },
  approvals: { title: 'Approvals', description: 'Review and verify pending worker and business profiles.', label: 'REVIEW QUEUE', action: 'Export queue', columns: ['Applicant', 'Profile type', 'Phone', 'Location', 'Status'] },
  support: { title: 'Support', description: 'Track critical issues raised by workers and businesses across the platform.', label: 'SUPPORT TICKETS', action: 'Export tickets', columns: ['Subject', 'Raised by', 'Topic', 'Priority', 'Status'] },
};

const PAGE_SIZE = 25;

const dateLabel = (value: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));

const statusTone = (status: string): Row['statusTone'] => {
  const normalized = normalizeStatus(status);
  if (['active', 'verified', 'paid', 'succeeded', 'completed', 'approved', 'filled', 'closed'].includes(normalized)) return 'success';
  if (['pending', 'processing', 'initiated', 'searching', 'awaiting payment', 'open', 'in progress'].includes(normalized)) return 'warning';
  if (['blocked', 'rejected', 'failed', 'cancelled', 'expired'].includes(normalized)) return 'danger';
  if (['live'].includes(normalized)) return 'purple';
  return 'neutral';
};

const normalizeStatus = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();

const matchesStatus = (value: string, ...allowed: string[]) =>
  allowed.some(status => normalizeStatus(value) === normalizeStatus(status));

export function ManagementPage({
  section,
  workers = [],
  businesses,
  shifts,
  payments,
  payouts,
  supportTickets,
  approvals,
  search,
  onSearch,
  statusFilter: controlledStatus,
  onStatusFilterChange,
  onSelect,
  onResolveTicket,
  busyTicketId,
  serverTotal,
  onVerifyProfile,
  busyDirectoryId,
  busyVerificationDecision,
}: ManagementPageProps) {
  const locale = 'en-IN';
  const meta = sectionMeta[section];
  const [localStatus, setLocalStatus] = useState(ALL_STATUSES);
  const statusFilter = controlledStatus ?? localStatus;
  const setStatusFilter = onStatusFilterChange ?? setLocalStatus;
  const [attributeFilter, setAttributeFilter] = useState('All categories');
  const [page, setPage] = useState(0);
  useEffect(() => {
    setLocalStatus(ALL_STATUSES);
    setAttributeFilter('All categories');
  }, [section]);
  useEffect(() => {
    setPage(0);
  }, [section, search, statusFilter, attributeFilter]);
  const rows = useMemo(
    () =>
      getRows(
        section,
        workers,
        businesses,
        shifts,
        payments,
        payouts,
        supportTickets,
        approvals,
        locale,
      ),
    [section, workers, businesses, shifts, payments, payouts, supportTickets, approvals, locale],
  );
  const matchingRows = rows.filter(row => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [row.id, row.title, row.subtitle, row.status, ...row.cells]
        .join(' ')
        .toLowerCase()
        .includes(query);
    return (
      matchesSearch &&
      (statusFilter === ALL_STATUSES ||
        normalizeStatus(row.status) === normalizeStatus(statusFilter))
      &&
      (attributeFilter === 'All categories' ||
        row.cells.some(
          cell => normalizeStatus(cell) === normalizeStatus(attributeFilter),
        ))
    );
  });
  const pageCount = Math.max(1, Math.ceil(matchingRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageStart = currentPage * PAGE_SIZE;
  const pageRows = matchingRows.slice(pageStart, pageStart + PAGE_SIZE);
  const pendingApprovals = approvals.filter(approval => approval.status === 'pending');
  const filterOptions = [...new Set(rows.flatMap(row => row.cells))]
    .filter(value => value.length > 0)
    .sort((left, right) => left.localeCompare(right));

  const exportRows = (rowsToExport: Row[]) => {
    downloadCsv(
      `kaaamnow-${section}`,
      [...meta.columns.map(column => column), 'Record ID'],
      rowsToExport.map(row => [row.title, ...row.cells, row.status, row.id]),
    );
  };

  const metrics = getSectionMetrics(section, rows);
  const isDirectory = section === 'workers' || section === 'businesses';
  const selectRow = (row: Row) => {
    onSelect({
      title: row.title,
      subtitle: row.id,
      details: row.details,
      type: row.detailType,
      userId: row.userId,
      accountIsActive: row.accountIsActive,
      imageUrl: row.imageUrl,
    });
  };

  return (
    <div className="page-stack">
      <section className="page-title-row">
        <div>
          <div className="eyebrow-row">
            <span className="eyebrow">{meta.label}</span>
          </div>
          <h1>{meta.title}</h1>
          <p className="page-description">{meta.description}</p>
        </div>
        <button className="button button-secondary" onClick={() => exportRows(rows)}>
          <ArrowDownToLine size={16} />
          {meta.action}
        </button>
      </section>

      {section === 'approvals' ? (
        <div className="approval-summary">
          <div className="approval-summary-icon"><ShieldCheck size={20} /></div>
          <div><strong>{formatText('{{count}} profiles need review', { count: pendingApprovals.length })}</strong><span>{'Review profile details and verification status.'}</span></div>
        </div>
      ) : (
        <ManagementMetrics metrics={metrics} />
      )}

      <section className="panel data-panel">
        <div className="data-toolbar">
          <div className="data-heading">
            <h2>{section === 'approvals' ? 'Requests to review' : meta.title}</h2>
            <span className="data-count">{matchingRows.length}</span>
          </div>
          <div className="table-actions">
            <label className="table-search">
              <Search size={16} />
              <input
                aria-label={formatText('Search {{section}}', { section: meta.title.toLowerCase() })}
                placeholder={formatText('Search {{section}}...', { section: meta.title.toLowerCase() })}
                value={search}
                onChange={event => onSearch(event.target.value)}
              />
            </label>
            <label className="filter-select">
              <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} aria-label={'Filter by status'}>
                <option value={ALL_STATUSES}>{'All statuses'}</option>
                {[...new Set([...rows.map(row => row.status), ...(statusFilter === ALL_STATUSES ? [] : [statusFilter])])].map(status => <option key={status} value={status}>{status}</option>)}
              </select>
              <ChevronDown size={15} />
            </label>
            <label className="filter-select">
              <select value={attributeFilter} onChange={event => setAttributeFilter(event.target.value)} aria-label={'Filter by category or field'}>
                <option value="All categories">{'All categories'}</option>
                {filterOptions.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
              <ChevronDown size={15} />
            </label>
            <button className="button button-secondary table-export" onClick={() => exportRows(matchingRows)}><ArrowDownToLine size={15} /> {'Export'}</button>
          </div>
        </div>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                {meta.columns.map((column, index) => (
                  <th
                    key={column}
                    className={isDirectory && index === meta.columns.length - 1 ? 'directory-status-heading' : undefined}
                  >
                    {column}
                  </th>
                ))}
                {!isDirectory ? <th><span className="sr-only">{'Actions'}</span></th> : null}
              </tr>
            </thead>
            <tbody>
              {pageRows.map(row => (
                <tr
                  key={row.id}
                  className={isDirectory ? 'clickable-row' : undefined}
                  tabIndex={isDirectory ? 0 : undefined}
                  aria-label={isDirectory ? formatText('View {{name}} details', { name: row.title }) : undefined}
                  onClick={isDirectory ? () => selectRow(row) : undefined}
                  onKeyDown={isDirectory ? event => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      selectRow(row);
                    }
                  } : undefined}
                >
                  <td>
                    <div className="identity-cell">
                      <ProfileAvatar
                        className={`user-avatar avatar-${row.avatarTone}`}
                        imageUrl={row.imageUrl}
                        name={row.title}
                      />
                      <span><strong>{row.title}</strong><small>{row.id} · {row.subtitle}</small></span>
                    </div>
                  </td>
                  {row.cells.map((cell, index) => (
                    <td key={`${row.id}-${index}`} className={index === 0 ? 'table-primary-cell' : ''}>
                      {(section === 'workers' || section === 'businesses') && index === 0 ? (
                        <span
                          className="category-summary"
                          title={
                            row.details.find(item =>
                              item.label === 'Work categories' || item.label === 'Business types',
                            )?.value ?? cell
                          }
                        >
                          {cell}
                        </span>
                      ) : cell}
                    </td>
                  ))}
                  <td className={isDirectory ? 'directory-status-cell' : undefined}>
                    <div className="directory-statuses">
                      <StatusBadge tone={row.statusTone}>{row.status}</StatusBadge>
                      {row.secondaryStatuses?.map(status => (
                        <StatusBadge key={status.label} tone={status.tone}>{status.label}</StatusBadge>
                      ))}
                    </div>
                  </td>
                  {!isDirectory ? <td>
                    {section === 'approvals' && matchesStatus(row.status, 'pending') ? (
                      <div className="approval-row-actions">
                        <button className="icon-button row-view" aria-label={formatText('View {{name}}', { name: row.title })} onClick={() => onSelect({ title: row.title, subtitle: row.id, details: row.details, type: row.detailType, imageUrl: row.imageUrl })}><Eye size={16} /></button>
                        {onVerifyProfile && row.verificationType ? (
                          <>
                            <button className="approval-action approve-action" disabled={busyDirectoryId === row.id} aria-label={formatText('Verify {{name}}', { name: row.title })} onClick={() => row.verificationType && onVerifyProfile(row.verificationType, row.id, 'verified')}>
                              {busyDirectoryId === row.id && busyVerificationDecision === 'verified' ? <LoadingIndicator label="Verifying…" className="loading-indicator-compact" /> : <Check size={15} />}
                            </button>
                            <button className="approval-action reject-action" disabled={busyDirectoryId === row.id} aria-label={formatText('Reject {{name}}', { name: row.title })} onClick={() => row.verificationType && onVerifyProfile(row.verificationType, row.id, 'rejected')}>
                              {busyDirectoryId === row.id && busyVerificationDecision === 'rejected' ? <LoadingIndicator label="Rejecting…" className="loading-indicator-compact" /> : <X size={15} />}
                            </button>
                          </>
                        ) : null}
                      </div>
                    ) : section === 'support' && onResolveTicket && !matchesStatus(row.status, 'closed') ? (
                      <div className="approval-row-actions">
                        <button className="icon-button row-view" aria-label={formatText('View {{name}}', { name: row.title })} onClick={() => onSelect({ title: row.title, subtitle: row.id, details: row.details, type: row.detailType, imageUrl: row.imageUrl })}><Eye size={16} /></button>
                        <button className="approval-action approve-action" disabled={Boolean(busyTicketId)} aria-label={formatText('Close ticket {{name}}', { name: row.title })} onClick={() => onResolveTicket(row.id)}>
                          {busyTicketId === row.id ? <LoadingIndicator label="Closing…" className="loading-indicator-compact" /> : <Check size={15} />}
                        </button>
                      </div>
                    ) : (
                      <div className="last-cell-actions">
                        <button className="icon-button row-view" aria-label={formatText('View {{name}}', { name: row.title })} onClick={() => onSelect({ title: row.title, subtitle: row.id, details: row.details, type: row.detailType })}><MoreHorizontal size={17} /></button>
                      </div>
                    )}
                  </td> : null}
                </tr>
              ))}
              {matchingRows.length === 0 ? (
                <tr><td colSpan={meta.columns.length + (isDirectory ? 0 : 1)}><div className="empty-table"><Search size={22} /><strong>{'No matching records'}</strong><span>{'Try another search or clear the selected status filter.'}</span></div></td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="table-pagination">
          <span>{formatText('Showing {{start}}–{{end}} of {{total}} results', { start: pageRows.length ? pageStart + 1 : 0, end: pageStart + pageRows.length, total: matchingRows.length })}</span>
          <div>
            <button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>{'Previous'}</button>
            <button className="page-current">{currentPage + 1}</button>
            <button disabled={currentPage >= pageCount - 1} onClick={() => setPage(currentPage + 1)}>{'Next'}</button>
          </div>
        </div>
      </section>
      {serverTotal !== undefined && serverTotal > rows.length ? (
        <div className="table-footnote"><span>{formatText('Showing the newest {{loaded}} of {{total}} records. Use the generic admin export for the full table.', { loaded: rows.length, total: serverTotal })}</span></div>
      ) : null}

      {section === 'approvals' && pendingApprovals.length === 0 ? (
        <div className="all-reviewed"><Check size={16} /> {'All verification requests have been reviewed.'}</div>
      ) : null}

      {section === 'support' && supportTickets.filter(ticket => ticket.status !== 'closed').length === 0 ? (
        <div className="all-reviewed"><Check size={16} /> {'All support tickets have been resolved.'}</div>
      ) : null}
    </div>
  );
}

function getSectionMetrics(section: AdminSection, rows: Row[]): ManagementMetric[] {
  const count = (...statuses: string[]) =>
    rows.filter(row => matchesStatus(row.status, ...statuses)).length;
  const countSecondary = (status: string) =>
    rows.filter(row =>
      row.secondaryStatuses?.some(item => matchesStatus(item.label, status)),
    ).length;

  switch (section) {
    case 'workers':
      return [
        { label: 'Total workers', value: String(rows.length), attention: false },
        { label: 'Active accounts', value: String(countSecondary('active')), attention: false },
        { label: 'Verification pending', value: String(count('pending')), attention: true },
        { label: 'Suspended accounts', value: String(countSecondary('suspended')), attention: false },
      ];
    case 'businesses':
      return [
        { label: 'Total businesses', value: String(rows.length), attention: false },
        { label: 'Verified', value: String(count('verified')), attention: false },
        { label: 'Pending', value: String(count('pending')), attention: true },
        { label: 'Suspended', value: String(countSecondary('suspended')), attention: false },
      ];
    case 'shifts':
      return [
        { label: 'Total shifts', value: String(rows.length), attention: false },
        { label: 'Live requests active', value: String(rows.filter(row => row.subtitle.startsWith('Live') && matchesStatus(row.status, 'searching', 'open', 'filled', 'in progress')).length), attention: false },
        { label: 'Finding workers', value: String(count('searching', 'open')), attention: true },
        { label: 'Completed', value: String(count('completed')), attention: false },
      ];
    case 'payments':
      return [
        { label: 'Transactions', value: String(rows.length), attention: false },
        { label: 'Succeeded', value: String(count('succeeded')), attention: false },
        { label: 'Pending', value: String(count('pending')), attention: true },
        { label: 'Failed / expired / cancelled', value: String(count('failed', 'expired', 'cancelled')), attention: false },
      ];
    case 'payouts':
      return [
        { label: 'Withdrawal requests', value: String(rows.length), attention: false },
        { label: 'Paid', value: String(count('paid')), attention: false },
        { label: 'In flight', value: String(count('initiated', 'processing')), attention: true },
        { label: 'Failed', value: String(count('failed')), attention: false },
      ];
    case 'support':
      return [
        { label: 'Total tickets', value: String(rows.length), attention: false },
        { label: 'Open', value: String(count('open')), attention: true },
        { label: 'In progress', value: String(count('in progress')), attention: false },
        { label: 'Closed', value: String(count('closed')), attention: false },
      ];
    case 'approvals':
      return [];
  }
}

function getRows(
  section: AdminSection,
  workers: Worker[],
  businesses: Business[],
  shifts: AdminShift[],
  payments: Payment[],
  payouts: Payout[],
  supportTickets: SupportTicket[],
  approvals: AdminVerificationRequest[],
  locale: string,
): Row[] {
  if (section === 'workers') {
    return workers.map((worker, index) => ({
      id: worker.id,
      userId: worker.userId,
      accountIsActive: worker.isActive,
      imageUrl: worker.photoUrl,
      title: worker.name,
      subtitle: worker.phone.replace(/(\+91)\d{5}(\d{5})/, '$1 ••••• $2'),
      avatar: initialsOf(worker.name),
      avatarTone: index % 5,
      cells: [
        categorySummary(worker.categories),
        worker.locality || worker.address,
        worker.ratingCount ? `★ ${worker.rating.toFixed(1)}` : '—',
        String(worker.completedShifts),
      ],
      status: titleCase(worker.verificationStatus),
      statusTone: statusTone(worker.verificationStatus),
      secondaryStatuses: [
        {
          label: worker.isActive ? 'Active' : 'Suspended',
          tone: worker.isActive ? 'success' : 'danger',
        },
        {
          label: worker.isAvailable ? 'Online' : 'Offline',
          tone: worker.isAvailable ? 'blue' : 'neutral',
        },
      ],
      detailType: 'worker',
      details: [
        { label: 'Phone', value: worker.phone },
        { label: 'Email', value: worker.email ?? 'Not provided' },
        { label: 'Age', value: worker.age === null ? 'Not provided' : String(worker.age) },
        { label: 'Address', value: worker.address },
        { label: 'Work categories', value: worker.categories.map(titleCase).join(', ') || 'Not provided' },
        { label: 'Verification status', value: titleCase(worker.verificationStatus) },
        { label: 'Account status', value: worker.isActive ? 'Active' : 'Suspended' },
        { label: 'Availability', value: worker.isAvailable ? 'Available' : 'Unavailable' },
        { label: 'Rating count', value: String(worker.ratingCount) },
        { label: 'Completed shifts', value: String(worker.completedShifts) },
        { label: 'Verification note', value: worker.verificationNote ?? 'None' },
        { label: 'Verified at', value: worker.verifiedAt ? dateLabel(worker.verifiedAt, locale) : 'Not verified' },
      ],
    }));
  }

  if (section === 'businesses') {
    return businesses.map((business, index) => ({
      id: business.id,
      userId: business.userId,
      accountIsActive: business.isActive,
      imageUrl: business.logoUrl,
      title: business.name,
      subtitle: business.phone,
      avatar: initialsOf(business.name),
      avatarTone: index % 5,
      cells: [
        categorySummary(business.businessTypes),
        business.locality || business.address,
        business.ratingCount ? `★ ${business.rating.toFixed(1)}` : '—',
        String(business.ratingCount),
      ],
      status: titleCase(business.verificationStatus),
      statusTone: statusTone(business.verificationStatus),
      secondaryStatuses: [{
        label: business.isActive ? 'Active' : 'Suspended',
        tone: business.isActive ? 'success' : 'danger',
      }],
      detailType: 'business',
      details: [
        { label: 'Owner', value: business.ownerName },
        { label: 'Primary contact', value: business.contactName },
        { label: 'Phone', value: business.phone },
        { label: 'Email', value: business.email ?? 'Not provided' },
        { label: 'Business category', value: business.category ? titleCase(business.category) : 'Not provided' },
        { label: 'Business types', value: business.businessTypes.map(titleCase).join(', ') || 'Not provided' },
        { label: 'Address', value: business.address },
        { label: 'Verification status', value: titleCase(business.verificationStatus) },
        { label: 'Account status', value: business.isActive ? 'Active' : 'Suspended' },
        { label: 'Verification note', value: business.verificationNote ?? 'None' },
        { label: 'Verified at', value: business.verifiedAt ? dateLabel(business.verifiedAt, locale) : 'Not verified' },
        { label: 'Rating', value: business.ratingCount ? `${business.rating.toFixed(1)} (${business.ratingCount} reviews)` : 'No reviews' },
      ],
    }));
  }

  const dateTime = (value: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  const timeOnly = (value: string) =>
    new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(new Date(value));

  const shiftPay = (shift: AdminShift) =>
    shift.pricingMode === 'task'
      ? `${formatMinorRupees(shift.taskPriceMinor ?? 0)} fixed`
      : `${formatMinorRupees(shift.hourlyRateMinor)} / hr`;

  if (section === 'shifts') {
    return shifts.map((shift, index) => ({
      id: shift.id,
      title: shift.role,
      subtitle: `${titleCase(shift.kind)} · ${shift.area}`,
      avatar: initialsOf(shift.businessName),
      avatarTone: index % 5,
      cells: [shift.businessName, `${dateLabel(shift.startsAt, locale)} · ${timeOnly(shift.startsAt)}`, `${shift.assignedCount} / ${shift.workersNeeded}`, shiftPay(shift)],
      status: titleCase(shift.status),
      statusTone: statusTone(titleCase(shift.status)),
      detailType: 'record',
      details: [
        { label: 'Business', value: shift.businessName },
        { label: 'Type', value: titleCase(shift.kind) },
        { label: 'Location', value: shift.area },
        { label: 'Starts', value: dateTime(shift.startsAt) },
        { label: 'Ends', value: dateTime(shift.endsAt) },
        { label: 'Workers', value: `${shift.assignedCount} assigned of ${shift.workersNeeded}` },
        { label: 'Pricing', value: shift.pricingMode === 'task' ? 'Task (fixed price, completion code)' : 'Hourly' },
        { label: shift.pricingMode === 'task' ? 'Task price per worker' : 'Hourly rate', value: shiftPay(shift) },
        ...(shift.searchRadiusKm === null ? [] : [{ label: 'Search radius', value: `${shift.searchRadiusKm} km` }]),
        { label: 'Requirements', value: shift.requirement || 'None' },
        { label: 'Responsibilities', value: shift.responsibilities || 'None' },
        { label: 'Created', value: dateTime(shift.createdAt) },
        ...(shift.cancelReason ? [{ label: 'Cancel reason', value: shift.cancelReason }] : []),
      ],
    }));
  }

  if (section === 'payments') {
    return payments.map((payment, index) => ({
      id: payment.id,
      title: payment.reference,
      subtitle: payment.invoiceReference ? `Invoice ${payment.invoiceReference}` : payment.provider,
      avatar: '₹',
      avatarTone: index % 5,
      cells: [payment.businessName, dateLabel(payment.createdAt, locale), titleCase(payment.method), formatMinorRupees(payment.amountMinor)],
      status: titleCase(payment.status),
      statusTone: statusTone(payment.status),
      detailType: 'record',
      details: [
        { label: 'Business', value: payment.businessName },
        { label: 'Invoice', value: payment.invoiceReference ?? payment.invoiceId },
        { label: 'Worker subtotal', value: payment.subtotalMinor === null ? 'Unavailable' : formatMinorRupees(payment.subtotalMinor) },
        { label: 'Platform fee', value: payment.platformFeeMinor === null ? 'Unavailable' : formatMinorRupees(payment.platformFeeMinor) },
        { label: 'Amount charged', value: formatMinorRupees(payment.amountMinor) },
        { label: 'Method', value: titleCase(payment.method) },
        { label: 'Provider', value: payment.provider },
        { label: 'Created', value: dateTime(payment.createdAt) },
        { label: 'Paid at', value: payment.paidAt ? dateTime(payment.paidAt) : 'Not paid' },
        { label: 'Status', value: titleCase(payment.status) },
        ...(payment.failureReason ? [{ label: 'Failure reason', value: payment.failureReason }] : []),
      ],
    }));
  }

  if (section === 'payouts') {
    return payouts.map((payout, index) => ({
      id: payout.id,
      title: payout.workerName,
      subtitle: payout.reference,
      avatar: initialsOf(payout.workerName),
      avatarTone: index % 5,
      cells: [payout.method, dateLabel(payout.requestedAt, locale), formatMinorRupees(payout.amountMinor)],
      status: titleCase(payout.status),
      statusTone: statusTone(payout.status),
      detailType: 'record',
      details: [
        { label: 'Worker', value: `${payout.workerName} (${payout.workerId})` },
        { label: 'Reference', value: payout.reference },
        { label: 'Method', value: payout.method },
        { label: 'Destination', value: payout.destination || 'Unavailable' },
        { label: 'Provider', value: payout.provider },
        { label: 'Requested at', value: dateTime(payout.requestedAt) },
        { label: 'Completed at', value: payout.completedAt ? dateTime(payout.completedAt) : 'Not completed' },
        { label: 'Amount', value: formatMinorRupees(payout.amountMinor) },
        { label: 'Status', value: titleCase(payout.status) },
        ...(payout.failureReason ? [{ label: 'Failure reason', value: payout.failureReason }] : []),
      ],
    }));
  }

  if (section === 'support') {
    return supportTickets.map((ticket, index) => ({
      id: ticket.id,
      title: ticket.subject,
      subtitle: `${ticket.raisedBy.name} · ${titleCase(ticket.topic)}`,
      avatar: initialsOf(ticket.raisedBy.name),
      avatarTone: index % 5,
      cells: [ticket.raisedBy.name, titleCase(ticket.topic), titleCase(ticket.priority)],
      status: titleCase(ticket.status),
      statusTone: statusTone(titleCase(ticket.status)),
      detailType: 'record',
      details: [
        { label: 'Raised by', value: ticket.raisedBy.phone ? `${ticket.raisedBy.name} (${ticket.raisedBy.phone})` : ticket.raisedBy.name },
        { label: 'Topic', value: titleCase(ticket.topic) },
        { label: 'Priority', value: titleCase(ticket.priority) },
        { label: 'Status', value: titleCase(ticket.status) },
        { label: 'Created', value: dateTime(ticket.createdAt) },
        { label: 'Updated', value: dateTime(ticket.updatedAt) },
        { label: 'Message', value: ticket.message },
        { label: 'Shift', value: ticket.shiftId ?? 'Not linked' },
        ...(ticket.resolutionNote ? [{ label: 'Resolution note', value: ticket.resolutionNote }] : []),
      ],
    }));
  }

  return approvals.map((approval, index) => ({
    id: approval.id,
    title: approval.name,
    subtitle: approval.phone,
    avatar: initialsOf(approval.name),
    avatarTone: index % 5,
    cells: [
      titleCase(approval.subject),
      approval.phone,
      approval.area,
    ],
    status: titleCase(approval.status),
    statusTone: statusTone(approval.status),
    imageUrl: approval.imageUrl,
    detailType: approval.subject,
    verificationType: approval.subject,
    details: approval.details,
  }));
}

function titleCase(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
}

function categorySummary(categories: string[]) {
  const names = categories.map(titleCase);
  return names.length > 3
    ? `${names.slice(0, 3).join(', ')}, …`
    : names.join(', ');
}
