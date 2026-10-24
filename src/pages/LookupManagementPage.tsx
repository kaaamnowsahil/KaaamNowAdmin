import { Check, Pencil, Plus, RefreshCw, RotateCcw, Trash2, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { LoadingIndicator } from '@/components/LoadingIndicator';
import { StatusBadge } from '@/components/StatusBadge';
import { useLookupItems } from '@/features/work-categories/useLookupItems';
import type { LookupCollection } from '@/api/workCategories';

type LookupManagementPageProps = {
  token: string;
  collection: LookupCollection;
  onSessionExpired: () => void;
};

function slugFromName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export function LookupManagementPage({ token, collection, onSessionExpired }: LookupManagementPageProps) {
  const { busyId, categories, create, error, load, loading, notice, remove, restore, saving, update } =
    useLookupItems({ token, collection, onSessionExpired });
  const title = collection === 'work-categories' ? 'Work categories' : 'Business / work types';
  const subject = collection === 'work-categories' ? 'work category' : 'business / work type';
  const plural = collection === 'work-categories' ? 'work categories' : 'business / work types';
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [icon, setIcon] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editSortOrder, setEditSortOrder] = useState(0);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugEdited) setSlug(slugFromName(value));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const created = await create({ name: name.trim(), slug: slug.trim(), icon: icon.trim() });
    if (!created) return;
    setName('');
    setSlug('');
    setSlugEdited(false);
    setIcon('');
  };

  const beginEdit = (item: (typeof categories)[number]) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditSlug(item.slug);
    setEditIcon(item.icon);
    setEditSortOrder(item.sort_order);
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>, item: (typeof categories)[number]) => {
    event.preventDefault();
    if (await update(item, {
      name: editName.trim(),
      slug: editSlug.trim(),
      icon: editIcon.trim(),
      sort_order: editSortOrder,
    })) {
      setEditingId('');
    }
  };

  return (
    <div className="page-stack">
      <section className="page-title-row">
        <div>
          <div className="eyebrow-row">
            <span className="eyebrow">MARKETPLACE CONFIGURATION</span>
            <span className="title-divider">/</span>
            <span className="eyebrow-sub">{title}</span>
          </div>
          <h1>{title}</h1>
          <p className="page-description">{`Add, edit, and remove ${plural} used across the marketplace.`}</p>
        </div>
        <button className="button button-secondary" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={15} />
          Refresh
        </button>
      </section>

      <form className="panel work-category-form" onSubmit={event => void handleSubmit(event)}>
        <div className="panel-heading">
          <div><h2>{`Add a ${subject}`}</h2><p>New items are enabled immediately.</p></div>
        </div>
        <div className="work-category-fields">
          <label>
            Name
            <input required maxLength={120} value={name} onChange={event => handleNameChange(event.target.value)} placeholder="e.g. Barista" />
          </label>
          <label>
            Slug
            <input
              required
              maxLength={64}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              title="Use lowercase letters, numbers, and single hyphens."
              value={slug}
              onChange={event => {
                setSlugEdited(true);
                setSlug(event.target.value);
              }}
              placeholder="e.g. barista"
            />
          </label>
          <label>
            Icon name <span className="field-hint">(optional)</span>
            <input maxLength={64} value={icon} onChange={event => setIcon(event.target.value)} placeholder="e.g. coffee" />
          </label>
          <button className="button button-primary" type="submit" disabled={saving || !name.trim() || !slug.trim()}>
            <Plus size={16} />
            {saving ? <LoadingIndicator label="Adding…" className="loading-indicator-compact" /> : `Add ${collection === 'work-categories' ? 'category' : 'type'}`}
          </button>
        </div>
        {error ? <div className="inline-error" role="alert">{error}</div> : null}
        {notice ? <div className="inline-notice" role="status">{notice}</div> : null}
      </form>

      <section className="panel work-category-list">
        <div className="panel-heading">
          <div><h2>{`All ${plural}`}</h2><p>{categories.length} items</p></div>
        </div>
        {loading ? (
          <div className="work-category-loading"><LoadingIndicator label={`Loading ${plural}…`} /></div>
        ) : categories.length === 0 ? (
          <div className="empty-state">{`No ${plural} found.`}</div>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Slug</th><th>Icon</th><th>Order</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {categories.map(category => editingId === category.id ? (
                  <tr key={category.id}>
                    <td colSpan={6}>
                      <form className="work-category-edit" onSubmit={event => void handleUpdate(event, category)}>
                        <label>
                          Name
                          <input required maxLength={120} value={editName} onChange={event => setEditName(event.target.value)} />
                        </label>
                        <label>
                          Slug
                          <input
                            required
                            maxLength={64}
                            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                            title="Use lowercase letters, numbers, and single hyphens."
                            value={editSlug}
                            onChange={event => setEditSlug(event.target.value)}
                          />
                        </label>
                        <label>
                          Icon
                          <input maxLength={64} value={editIcon} onChange={event => setEditIcon(event.target.value)} />
                        </label>
                        <label>
                          Order
                          <input min={0} required type="number" value={editSortOrder} onChange={event => setEditSortOrder(Number(event.target.value))} />
                        </label>
                        <button className="text-button" disabled={busyId === category.id} type="submit">
                          {busyId === category.id ? <LoadingIndicator label="Saving…" className="loading-indicator-compact" /> : <><Check size={14} /> Save</>}
                        </button>
                        <button className="text-button" onClick={() => setEditingId('')} type="button"><X size={14} /> Cancel</button>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={category.id}>
                    <td className="table-primary-cell">{category.name}</td>
                    <td>{category.slug}</td>
                    <td>{category.icon || '—'}</td>
                    <td>{category.sort_order}</td>
                    <td><StatusBadge tone={category.is_active ? 'success' : 'neutral'}>{category.is_active ? 'Active' : 'Inactive'}</StatusBadge></td>
                    <td>
                      {category.is_active ? (
                        <>
                          <button className="text-button" disabled={busyId === category.id} onClick={() => beginEdit(category)} type="button">
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            className="text-button danger-text"
                            disabled={busyId === category.id}
                            onClick={() => {
                              if (window.confirm(`Delete "${category.name}"?`)) {
                                void remove(category);
                              }
                            }}
                            type="button"
                          >
                            {busyId === category.id ? (
                              <LoadingIndicator label="Deleting…" className="loading-indicator-compact" />
                            ) : <><Trash2 size={14} /> Delete</>}
                          </button>
                        </>
                      ) : (
                        <button className="text-button" disabled={busyId === category.id} onClick={() => void restore(category)} type="button">
                          {busyId === category.id ? (
                            <LoadingIndicator label="Restoring…" className="loading-indicator-compact" />
                          ) : <><RotateCcw size={14} /> Restore</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
