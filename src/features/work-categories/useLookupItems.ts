import { useCallback, useEffect, useState } from 'react';

import {
  createLookupItem,
  deleteLookupItem,
  getLookupItems,
  restoreLookupItem,
  updateLookupItem,
  type LookupCollection,
  type LookupItem,
} from '@/api/workCategories';
import { ApiError } from '@/api/client';

type UseWorkCategoriesOptions = {
  token: string;
  collection: LookupCollection;
  onSessionExpired: () => void;
};

export function useLookupItems({ token, collection, onSessionExpired }: UseWorkCategoriesOptions) {
  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCategories(await getLookupItems(token, collection));
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
      else setError(cause instanceof Error ? cause.message : 'Could not load work categories.');
    } finally {
      setLoading(false);
    }
  }, [collection, onSessionExpired, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (input: {
    slug: string;
    name: string;
    icon: string;
  }) => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const category = await createLookupItem(token, collection, {
        slug: input.slug,
        name: input.name,
        icon: input.icon,
        sort_order: categories.length,
        is_active: true,
      });
      setCategories(current => [...current, category].sort((a, b) => a.sort_order - b.sort_order));
      setNotice(`${category.name} added.`);
      return true;
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
      else setError(cause instanceof Error ? cause.message : 'Could not create work category.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const update = async (
    item: LookupItem,
    changes: { slug: string; name: string; icon: string; sort_order: number },
  ) => {
    setBusyId(item.id);
    setError('');
    setNotice('');
    try {
      const updated = await updateLookupItem(token, collection, item.id, changes);
      setCategories(current =>
        current
          .map(existing => existing.id === updated.id ? updated : existing)
          .sort((a, b) => a.sort_order - b.sort_order),
      );
      setNotice(`${updated.name} updated.`);
      return true;
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
      else setError(cause instanceof Error ? cause.message : 'Could not update item.');
      return false;
    } finally {
      setBusyId('');
    }
  };

  const remove = async (category: LookupItem) => {
    setBusyId(category.id);
    setError('');
    setNotice('');
    try {
      await deleteLookupItem(token, collection, category.id);
      setCategories(current => current.map(item =>
        item.id === category.id ? { ...item, is_active: false } : item,
      ));
      setNotice(`${category.name} deleted.`);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
      else setError(cause instanceof Error ? cause.message : 'Could not delete work category.');
    } finally {
      setBusyId('');
    }
  };

  const restore = async (category: LookupItem) => {
    setBusyId(category.id);
    setError('');
    setNotice('');
    try {
      const updated = await restoreLookupItem(token, collection, category.id);
      setCategories(current => current.map(item => item.id === updated.id ? updated : item));
      setNotice(`${category.name} restored.`);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
      else setError(cause instanceof Error ? cause.message : 'Could not restore work category.');
    } finally {
      setBusyId('');
    }
  };

  return { busyId, categories, create, error, load, loading, notice, remove, restore, saving, update };
}
