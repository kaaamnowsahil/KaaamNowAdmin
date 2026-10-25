import { Pencil, Plus, Trash2 } from 'lucide-react';
import { type FormEvent, useCallback, useEffect, useState } from 'react';

import { ApiError } from '@/api/client';
import {
  createFaq,
  deleteFaq,
  getFaqs,
  updateFaq,
  type ContentAudience,
  type Faq,
  type FaqInput,
} from '@/api/content';
import { AppLoader } from '@/components/AppLoader';

import { AUDIENCE_LABELS, AUDIENCES } from './contentAudiences';

type FaqManagerProps = {
  token: string;
  onSessionExpired: () => void;
};

const EMPTY_FAQ: FaqInput = {
  audience: 'all',
  slug: null,
  question: '',
  answer: '',
  sort_order: 0,
  is_active: true,
};

export function FaqManager({ token, onSessionExpired }: FaqManagerProps) {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [filter, setFilter] = useState<ContentAudience | 'every'>('every');
  const [draft, setDraft] = useState<FaqInput>(EMPTY_FAQ);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fail = useCallback(
    (cause: unknown, fallback: string) => {
      if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
      else setError(cause instanceof Error ? cause.message : fallback);
    },
    [onSessionExpired],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setFaqs(await getFaqs(token));
    } catch (cause) {
      fail(cause, 'Could not load FAQs.');
    } finally {
      setLoading(false);
    }
  }, [fail, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (action: () => Promise<void>, fallback: string) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (cause) {
      fail(cause, fallback);
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const input = { ...draft, slug: draft.slug?.trim() || null };
    void run(async () => {
      if (editingId) {
        const updated = await updateFaq(token, editingId, input);
        setFaqs(current => current.map(item => (item.id === updated.id ? updated : item)));
        setNotice('FAQ updated.');
      } else {
        const created = await createFaq(token, input);
        setFaqs(current => [...current, created]);
        setNotice('FAQ added.');
      }
      setDraft(EMPTY_FAQ);
      setEditingId(null);
    }, 'Could not save the FAQ.');
  };

  const startEdit = (faq: Faq) => {
    setEditingId(faq.id);
    setDraft({
      audience: faq.audience,
      slug: faq.slug,
      question: faq.question,
      answer: faq.answer,
      sort_order: faq.sort_order,
      is_active: faq.is_active,
    });
  };

  const toggleActive = (faq: Faq) =>
    void run(async () => {
      const updated = await updateFaq(token, faq.id, { is_active: !faq.is_active });
      setFaqs(current => current.map(item => (item.id === updated.id ? updated : item)));
    }, 'Could not update the FAQ.');

  const remove = (faq: Faq) => {
    if (!window.confirm(`Delete "${faq.question}"?`)) return;
    void run(async () => {
      await deleteFaq(token, faq.id);
      setFaqs(current => current.filter(item => item.id !== faq.id));
      if (editingId === faq.id) {
        setEditingId(null);
        setDraft(EMPTY_FAQ);
      }
      setNotice('FAQ deleted.');
    }, 'Could not delete the FAQ.');
  };

  const visible = faqs
    .filter(faq => filter === 'every' || faq.audience === filter)
    .sort((a, b) => a.audience.localeCompare(b.audience) || a.sort_order - b.sort_order);

  return (
    <section className="panel content-panel">
      <div className="panel-heading">
        <div>
          <h2>FAQ & Help</h2>
          <p>Questions shown in the worker and business apps. Inactive FAQs stay hidden.</p>
        </div>
        <select
          className="button button-select"
          onChange={event => setFilter(event.target.value as ContentAudience | 'every')}
          value={filter}
        >
          <option value="every">All audiences</option>
          {AUDIENCES.map(audience => (
            <option key={audience} value={audience}>
              {AUDIENCE_LABELS[audience]}
            </option>
          ))}
        </select>
      </div>

      {error ? <div className="inline-error" role="alert">{error}</div> : null}
      {notice ? <div className="inline-notice" role="status">{notice}</div> : null}

      <form className="content-form" onSubmit={submit}>
        <label>
          Audience
          <select
            onChange={event =>
              setDraft({ ...draft, audience: event.target.value as ContentAudience })
            }
            value={draft.audience}
          >
            {AUDIENCES.map(audience => (
              <option key={audience} value={audience}>
                {AUDIENCE_LABELS[audience]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Order
          <input
            onChange={event => setDraft({ ...draft, sort_order: Number(event.target.value) || 0 })}
            type="number"
            value={draft.sort_order}
          />
        </label>
        <label className="content-form-wide">
          Question
          <input
            maxLength={300}
            minLength={3}
            onChange={event => setDraft({ ...draft, question: event.target.value })}
            required
            value={draft.question}
          />
        </label>
        <label className="content-form-wide">
          Answer
          <textarea
            onChange={event => setDraft({ ...draft, answer: event.target.value })}
            required
            rows={4}
            value={draft.answer}
          />
        </label>
        <label className="content-form-check">
          <input
            checked={draft.is_active}
            onChange={event => setDraft({ ...draft, is_active: event.target.checked })}
            type="checkbox"
          />
          Active
        </label>
        <div className="content-form-actions">
          {editingId ? (
            <button
              className="button button-secondary"
              onClick={() => {
                setEditingId(null);
                setDraft(EMPTY_FAQ);
              }}
              type="button"
            >
              Cancel
            </button>
          ) : null}
          <button className="button button-primary" disabled={busy} type="submit">
            {editingId ? <Pencil size={14} /> : <Plus size={14} />}
            {editingId ? 'Save FAQ' : 'Add FAQ'}
          </button>
        </div>
      </form>

      {loading ? (
        <AppLoader label="Loading FAQs…" />
      ) : visible.length === 0 ? (
        <p className="content-empty">No FAQs yet.</p>
      ) : (
        <ul className="content-list">
          {visible.map(faq => (
            <li className={faq.is_active ? '' : 'content-list-inactive'} key={faq.id}>
              <div>
                <span className="content-tag">{AUDIENCE_LABELS[faq.audience]}</span>
                {!faq.is_active ? <span className="content-tag">Inactive</span> : null}
                <strong>{faq.question}</strong>
                <p>{faq.answer}</p>
              </div>
              <div className="content-list-actions">
                <button
                  className="button button-secondary"
                  disabled={busy}
                  onClick={() => toggleActive(faq)}
                  type="button"
                >
                  {faq.is_active ? 'Hide' : 'Show'}
                </button>
                <button
                  aria-label="Edit FAQ"
                  className="button button-secondary"
                  disabled={busy}
                  onClick={() => startEdit(faq)}
                  type="button"
                >
                  <Pencil size={14} />
                </button>
                <button
                  aria-label="Delete FAQ"
                  className="button button-secondary"
                  disabled={busy}
                  onClick={() => remove(faq)}
                  type="button"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
