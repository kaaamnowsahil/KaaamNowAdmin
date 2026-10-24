import { Check, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { LoadingIndicator } from '@/components/LoadingIndicator';
import { StatusBadge } from '@/components/StatusBadge';
import type {
  ShiftFilterOption,
  ShiftFilterOptionInput,
  ShiftFilterType,
} from '@/api/shiftFilters';

type ShiftFilterGroupProps = {
  type: ShiftFilterType;
  title: string;
  description: string;
  options: ShiftFilterOption[];
  busyId: string;
  saving: boolean;
  onCreate: (input: ShiftFilterOptionInput) => Promise<boolean>;
  onUpdate: (
    option: ShiftFilterOption,
    input: ShiftFilterOptionInput,
  ) => Promise<boolean>;
  onDeactivate: (option: ShiftFilterOption) => Promise<void>;
  onRestore: (option: ShiftFilterOption) => Promise<void>;
};

function slugFromLabel(label: string) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function valueFields(type: ShiftFilterType, min: string, max: string) {
  return {
    min_value: type === 'distance' || min === '' ? null : Number(min),
    max_value:
      type === 'distance' || (type === 'shift_length' && max !== '')
        ? Number(max)
        : null,
  };
}

function displayRange(option: ShiftFilterOption, type: ShiftFilterType) {
  if (type === 'distance') return `${option.max_value} km`;
  if (type === 'minimum_pay') return `₹${option.min_value}/hr`;
  return `${option.min_value}–${option.max_value ?? '∞'} hours`;
}

export function ShiftFilterGroup({
  type,
  title,
  description,
  options,
  busyId,
  saving,
  onCreate,
  onUpdate,
  onDeactivate,
  onRestore,
}: ShiftFilterGroupProps) {
  const [label, setLabel] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [sortOrder, setSortOrder] = useState(
    () => Math.max(0, ...options.map(option => option.sort_order)) + 1,
  );
  const [editing, setEditing] = useState<ShiftFilterOption | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editMin, setEditMin] = useState('');
  const [editMax, setEditMax] = useState('');
  const [editSortOrder, setEditSortOrder] = useState(0);

  const setNewLabel = (nextLabel: string) => {
    setLabel(nextLabel);
    if (!slugEdited) setSlug(slugFromLabel(nextLabel));
  };

  const submitCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const created = await onCreate({
      filter_type: type,
      slug: slug.trim(),
      label: label.trim(),
      ...valueFields(type, min, max),
      sort_order: sortOrder,
      is_active: true,
    });
    if (created) {
      setLabel('');
      setSlug('');
      setSlugEdited(false);
      setMin('');
      setMax('');
      setSortOrder(current => current + 1);
    }
  };

  const beginEdit = (option: ShiftFilterOption) => {
    setEditing(option);
    setEditLabel(option.label);
    setEditSlug(option.slug);
    setEditMin(option.min_value?.toString() ?? '');
    setEditMax(option.max_value?.toString() ?? '');
    setEditSortOrder(option.sort_order);
  };

  const submitEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    const updated = await onUpdate(editing, {
      filter_type: type,
      slug: editSlug.trim(),
      label: editLabel.trim(),
      ...valueFields(type, editMin, editMax),
      sort_order: editSortOrder,
      is_active: editing.is_active,
    });
    if (updated) setEditing(null);
  };

  const optionsByOrder = [...options].sort(
    (a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label),
  );
  const minLabel = type === 'minimum_pay' ? 'Minimum pay (₹/hour)' : 'Minimum hours';
  const maxLabel = type === 'distance' ? 'Maximum distance (km)' : 'Maximum hours';

  return (
    <section className="panel work-category-list shift-filter-group">
      <div className="panel-heading">
        <div><h2>{title}</h2><p>{description}</p></div>
      </div>
      <form className="shift-filter-create" onSubmit={event => void submitCreate(event)}>
        <label>
          Label
          <input
            maxLength={120}
            onChange={event => setNewLabel(event.target.value)}
            placeholder="e.g. Within 3 km"
            required
            value={label}
          />
        </label>
        <label>
          Slug
          <input
            maxLength={64}
            onChange={event => {
              setSlugEdited(true);
              setSlug(event.target.value);
            }}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            required
            title="Use lowercase letters, numbers, and single hyphens."
            value={slug}
          />
        </label>
        {type !== 'distance' ? (
          <label>
            {minLabel}
            <input
              min={type === 'minimum_pay' ? '0.01' : '0'}
              onChange={event => setMin(event.target.value)}
              required
              step="0.01"
              type="number"
              value={min}
            />
          </label>
        ) : null}
        {type !== 'minimum_pay' ? (
          <label>
            {maxLabel}
            <input
              min={type === 'distance' ? '0.01' : '0'}
              onChange={event => setMax(event.target.value)}
              required={type === 'distance'}
              step="0.01"
              type="number"
              value={max}
            />
          </label>
        ) : null}
        <label>
          Order
          <input
            min={0}
            onChange={event => setSortOrder(Number(event.target.value))}
            required
            type="number"
            value={sortOrder}
          />
        </label>
        <button className="button button-primary" disabled={saving} type="submit">
          <Plus size={15} />
          {saving ? <LoadingIndicator label="Adding…" className="loading-indicator-compact" /> : 'Add option'}
        </button>
      </form>
      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr><th>Label</th><th>Slug</th><th>Value</th><th>Order</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {optionsByOrder.map(option => editing?.id === option.id ? (
              <tr key={option.id}>
                <td colSpan={6}>
                  <form className="shift-filter-edit" onSubmit={event => void submitEdit(event)}>
                    <label>Label<input maxLength={120} onChange={event => setEditLabel(event.target.value)} required value={editLabel} /></label>
                    <label>Slug<input maxLength={64} onChange={event => setEditSlug(event.target.value)} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required value={editSlug} /></label>
                    {type !== 'distance' ? <label>{minLabel}<input min={type === 'minimum_pay' ? '0.01' : '0'} onChange={event => setEditMin(event.target.value)} required step="0.01" type="number" value={editMin} /></label> : null}
                    {type !== 'minimum_pay' ? <label>{maxLabel}<input min={type === 'distance' ? '0.01' : '0'} onChange={event => setEditMax(event.target.value)} required={type === 'distance'} step="0.01" type="number" value={editMax} /></label> : null}
                    <label>Order<input min={0} onChange={event => setEditSortOrder(Number(event.target.value))} required type="number" value={editSortOrder} /></label>
                    <button className="text-button" disabled={busyId === option.id} type="submit">
                      {busyId === option.id ? <LoadingIndicator label="Saving…" className="loading-indicator-compact" /> : <><Check size={14} /> Save</>}
                    </button>
                    <button className="text-button" onClick={() => setEditing(null)} type="button"><X size={14} /> Cancel</button>
                  </form>
                </td>
              </tr>
            ) : (
              <tr key={option.id}>
                <td className="table-primary-cell">{option.label}</td>
                <td>{option.slug}</td>
                <td>{displayRange(option, type)}</td>
                <td>{option.sort_order}</td>
                <td><StatusBadge tone={option.is_active ? 'success' : 'neutral'}>{option.is_active ? 'Active' : 'Inactive'}</StatusBadge></td>
                <td className="shift-filter-actions">
                  <button className="text-button" disabled={busyId === option.id} onClick={() => beginEdit(option)} type="button" aria-label={`Edit ${option.label}`}><Pencil size={14} /> Edit</button>
                  {option.is_active ? (
                    <button className="text-button danger-text" disabled={busyId === option.id} onClick={() => void onDeactivate(option)} type="button" aria-label={`Deactivate ${option.label}`}><Trash2 size={14} /> Deactivate</button>
                  ) : (
                    <button className="text-button" disabled={busyId === option.id} onClick={() => void onRestore(option)} type="button" aria-label={`Restore ${option.label}`}><RotateCcw size={14} /> Restore</button>
                  )}
                </td>
              </tr>
            ))}
            {optionsByOrder.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state">No {title.toLowerCase()} options yet.</div></td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
