import { useCallback, useEffect, useMemo, useState } from 'react';

import { ApiError } from '@/api/client';
import {
  mapPayments,
  mapPayouts,
  mapShifts,
  mapSupportTickets,
  type MarketplaceRecords,
} from '@/api/marketplaceMappers';
import { loadMarketplaceRecords, type MarketplaceTotals } from '@/api/marketplaceRecords';
import { getMetricsOverview, type AdminMetricsOverview } from '@/api/metrics';
import { setSupportTicketStatus } from '@/api/supportTickets';
import { ALL_STATUSES } from '@/constants/quickFilters';
import { getAdminUserStatus, setAdminUserActive } from '@/api/adminUsers';
import {
  getBusinesses,
  mapBusinessProfile,
  verifyBusiness,
} from '@/api/businesses';
import { getWorkers, mapWorkerProfile, verifyWorker } from '@/api/workers';
import type { SelectedRecord } from '@/pages/ManagementPage';
import type { AdminVerificationRequest, Business, Worker } from '@/types';

function requireUserActiveStatus(statuses: Map<string, boolean>, userId: string) {
  const isActive = statuses.get(userId);
  if (isActive === undefined) {
    throw new Error('Could not determine the active status for every profile.');
  }
  return isActive;
}

export function useAdminDashboard(accessToken: string, onSessionExpired: () => void) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workersLoading, setWorkersLoading] = useState(true);
  const [workersError, setWorkersError] = useState('');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessesLoading, setBusinessesLoading] = useState(true);
  const [businessesError, setBusinessesError] = useState('');
  const [directoryActionError, setDirectoryActionError] = useState('');
  const [busyDirectoryId, setBusyDirectoryId] = useState('');
  const [busyVerificationDecision, setBusyVerificationDecision] = useState<'verified' | 'rejected' | ''>('');
  const [records, setRecords] = useState<MarketplaceRecords | null>(null);
  const [recordTotals, setRecordTotals] = useState<MarketplaceTotals | null>(null);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState('');
  const [metrics, setMetrics] = useState<AdminMetricsOverview | null>(null);
  const [metricsError, setMetricsError] = useState('');
  const [busyTicketId, setBusyTicketId] = useState('');
  const [ticketError, setTicketError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<SelectedRecord | null>(null);
  const [toast, setToast] = useState('');

  const loadDirectory = useCallback(async () => {
    setWorkersLoading(true);
    setBusinessesLoading(true);
    setWorkersError('');
    setBusinessesError('');
    setDirectoryActionError('');
    try {
      const [workerProfiles, businessProfiles, userStatuses] = await Promise.all([
        getWorkers(accessToken),
        getBusinesses(accessToken),
        getAdminUserStatus(accessToken),
      ]);
      const nextWorkers = workerProfiles.map(worker => ({
        ...worker,
        isActive: requireUserActiveStatus(userStatuses, worker.userId),
      }));
      const nextBusinesses = businessProfiles.map(business => ({
        ...business,
        isActive: requireUserActiveStatus(userStatuses, business.userId),
      }));
      setWorkers(nextWorkers);
      setBusinesses(nextBusinesses);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        onSessionExpired();
      } else {
        const message = cause instanceof Error ? cause.message : 'Could not load marketplace profiles.';
        setWorkers([]);
        setBusinesses([]);
        setWorkersError(message);
        setBusinessesError(message);
      }
    } finally {
      setWorkersLoading(false);
      setBusinessesLoading(false);
    }
  }, [accessToken, onSessionExpired]);

  const loadRecords = useCallback(async () => {
    setRecordsLoading(true);
    setRecordsError('');
    setMetricsError('');
    const failureMessage = (cause: unknown, fallback: string) => {
      if (cause instanceof ApiError && cause.status === 401) {
        onSessionExpired();
        return '';
      }
      return cause instanceof Error ? cause.message : fallback;
    };
    const [loaded, overview] = await Promise.allSettled([
      loadMarketplaceRecords(accessToken),
      getMetricsOverview(accessToken),
    ]);
    if (loaded.status === 'fulfilled') {
      setRecords(loaded.value.records);
      setRecordTotals(loaded.value.totals);
    } else {
      setRecords(null);
      setRecordTotals(null);
      setRecordsError(failureMessage(loaded.reason, 'Could not load marketplace records.'));
    }
    if (overview.status === 'fulfilled') {
      setMetrics(overview.value);
    } else {
      setMetrics(null);
      setMetricsError(failureMessage(overview.reason, 'Could not load dashboard metrics.'));
    }
    setRecordsLoading(false);
  }, [accessToken, onSessionExpired]);

  const shifts = useMemo(
    () => (records ? mapShifts(records.shifts, records.assignments, businesses) : []),
    [records, businesses],
  );
  const paymentRows = useMemo(
    () => (records ? mapPayments(records.payments, records.invoices, businesses) : []),
    [records, businesses],
  );
  const payoutRows = useMemo(
    () => (records ? mapPayouts(records.withdrawals, records.payoutAccounts, workers) : []),
    [records, workers],
  );
  const supportTickets = useMemo(
    () => (records ? mapSupportTickets(records.supportTickets, records.users) : []),
    [records],
  );

  const pendingApprovals = useMemo<AdminVerificationRequest[]>(() => [
    ...workers
      .filter(worker => worker.verificationStatus === 'pending')
      .map(worker => ({
        id: worker.id,
        subject: 'worker' as const,
        name: worker.name,
        phone: worker.phone,
        area: worker.locality || worker.address,
        imageUrl: worker.photoUrl,
        status: worker.verificationStatus,
        details: [
          { label: 'Phone', value: worker.phone },
          { label: 'Email', value: worker.email ?? 'Not provided' },
          { label: 'Age', value: worker.age === null ? 'Not provided' : String(worker.age) },
          { label: 'Address', value: worker.address },
          { label: 'Work categories', value: worker.categories.join(', ') || 'Not provided' },
          { label: 'Account status', value: worker.isActive ? 'Active' : 'Suspended' },
          { label: 'Availability', value: worker.isAvailable ? 'Online' : 'Offline' },
          { label: 'Rating', value: worker.ratingCount ? `${worker.rating.toFixed(1)} (${worker.ratingCount})` : 'No reviews' },
          { label: 'Completed shifts', value: String(worker.completedShifts) },
          { label: 'Verification note', value: worker.verificationNote ?? 'None' },
        ],
      })),
    ...businesses
      .filter(business => business.verificationStatus === 'pending')
      .map(business => ({
        id: business.id,
        subject: 'business' as const,
        name: business.name,
        phone: business.phone,
        area: business.locality || business.address,
        imageUrl: business.logoUrl,
        status: business.verificationStatus,
        details: [
          { label: 'Owner', value: business.ownerName },
          { label: 'Primary contact', value: business.contactName },
          { label: 'Phone', value: business.phone },
          { label: 'Email', value: business.email ?? 'Not provided' },
          { label: 'Business category', value: business.category ?? 'Not provided' },
          { label: 'Business types', value: business.businessTypes.join(', ') || 'Not provided' },
          { label: 'Address', value: business.address },
          { label: 'Account status', value: business.isActive ? 'Active' : 'Suspended' },
          { label: 'Rating', value: business.ratingCount ? `${business.rating.toFixed(1)} (${business.ratingCount})` : 'No reviews' },
          { label: 'Verification note', value: business.verificationNote ?? 'None' },
        ],
      })),
  ], [businesses, workers]);

  useEffect(() => {
    void loadDirectory();
  }, [loadDirectory]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const verifyProfile = useCallback(async (
    type: 'worker' | 'business',
    profileId: string,
    status: 'verified' | 'rejected',
  ) => {
    setBusyDirectoryId(profileId);
    setBusyVerificationDecision(status);
    setDirectoryActionError('');
    try {
      if (type === 'worker') {
        const profile = await verifyWorker(accessToken, profileId, status);
        setWorkers(current => current.map(worker =>
          worker.id === profile.id
            ? mapWorkerProfile(profile, worker.isActive)
            : worker,
        ));
      } else {
        const profile = await verifyBusiness(accessToken, profileId, status);
        setBusinesses(current => current.map(business =>
          business.id === profile.id
            ? mapBusinessProfile(profile, business.isActive)
            : business,
        ));
      }
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        onSessionExpired();
      } else {
        setDirectoryActionError(cause instanceof Error ? cause.message : 'Could not verify profile.');
      }
    } finally {
      setBusyDirectoryId('');
      setBusyVerificationDecision('');
    }
  }, [accessToken, onSessionExpired]);

  const setUserSuspended = useCallback(async (userId: string, suspended: boolean) => {
    setBusyDirectoryId(userId);
    setDirectoryActionError('');
    try {
      const updatedUser = await setAdminUserActive(accessToken, userId, !suspended);
      setWorkers(current => current.map(worker =>
        worker.userId === userId ? { ...worker, isActive: updatedUser.is_active } : worker,
      ));
      setBusinesses(current => current.map(business =>
        business.userId === userId
          ? { ...business, isActive: updatedUser.is_active }
          : business,
      ));
      setSelectedRecord(current => {
        if (!current || current.userId !== userId) return current;
        return {
          ...current,
          accountIsActive: updatedUser.is_active,
          details: current.details.map(item =>
            item.label === 'Account status'
              ? { ...item, value: updatedUser.is_active ? 'Active' : 'Suspended' }
              : item,
          ),
        };
      });
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        onSessionExpired();
      } else {
        setDirectoryActionError(cause instanceof Error ? cause.message : 'Could not update account status.');
      }
    } finally {
      setBusyDirectoryId('');
    }
  }, [accessToken, onSessionExpired]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  };

  const resolveTicket = async (ticketId: string) => {
    const ticket = records?.supportTickets.find(item => item.id === ticketId);
    if (!ticket || ticket.status === 'closed' || busyTicketId) return;
    setBusyTicketId(ticketId);
    setTicketError('');
    try {
      const saved = await setSupportTicketStatus(accessToken, ticketId, { status: 'closed' });
      setRecords(current => current && {
        ...current,
        supportTickets: current.supportTickets.map(item => (item.id === saved.id ? saved : item)),
      });
      showToast('Support ticket closed.');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        onSessionExpired();
      } else {
        setTicketError(cause instanceof Error ? cause.message : 'Could not close the support ticket.');
      }
    } finally {
      setBusyTicketId('');
    }
  };

  const resetSelection = () => {
    setSearch('');
    setStatusFilter(ALL_STATUSES);
    setSelectedRecord(null);
  };

  return {
    approvalRows: pendingApprovals,
    businesses,
    businessesError,
    directoryActionError,
    businessesLoading,
    busyDirectoryId,
    busyVerificationDecision,
    resetSelection,
    paymentRows,
    pendingApprovals: pendingApprovals.length,
    payoutRows,
    resolveTicket,
    busyTicketId,
    ticketError,
    metrics,
    metricsError,
    recordTotals,
    recordsError,
    recordsLoading,
    reloadRecords: loadRecords,
    directoryLoading: workersLoading || businessesLoading,
    verifyProfile,
    search,
    statusFilter,
    setStatusFilter,
    selectedRecord,
    setSearch,
    setSelectedRecord,
    setToast,
    supportTickets,
    toast,
    workers,
    workersError,
    workersLoading,
    reloadWorkers: loadDirectory,
    reloadBusinesses: loadDirectory,
    reloadDirectory: loadDirectory,
    setUserSuspended,
    shifts,
  };
}
