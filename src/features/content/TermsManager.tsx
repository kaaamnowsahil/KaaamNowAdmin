import { Save, Trash2 } from 'lucide-react';
import { type FormEvent, useCallback, useEffect, useState } from 'react';

import { ApiError } from '@/api/client';
import {
  deleteTerms,
  getTerms,
  saveTerms,
  type ContentAudience,
  type Terms,
  type TermsInput,
} from '@/api/content';
import { AppLoader } from '@/components/AppLoader';

import { AUDIENCE_LABELS, AUDIENCES } from './contentAudiences';

type TermsManagerProps = {
  token: string;
  onSessionExpired: () => void;
};

const copy = { title: 'Terms & Conditions', placeholder: '## 1. Introduction\nThese terms…' };

const today = () => new Date().toISOString().slice(0, 10);

const emptyTerms = (title: string): TermsInput => ({
  title,
  body_markdown: '',
  effective_date: today(),
});

export function TermsManager({ token, onSessionExpired }: TermsManagerProps) {
  const [pages, setPages] = useState<Terms[]>([]);
  const [audience, setAudience] = useState<ContentAudience>('all');
  const [draft, setDraft] = useState<TermsInput>(() => emptyTerms(copy.title));
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

  useEffect(() => {
    let active = true;
    getTerms(token)
      .then(result => {
        if (active) setPages(result);
      })
      .catch(cause => {
        if (active) fail(cause, `Could not load ${copy.title}.`);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fail, token]);

  const current = pages.find(page => page.audience === audience) ?? null;

  useEffect(() => {
    setDraft(
      current
        ? {
            title: current.title,
            body_markdown: current.body_markdown,
            effective_date: current.effective_date,
          }
        : emptyTerms(copy.title),
    );
  }, [current]);

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
    void run(async () => {
      const saved = await saveTerms(token, audience, draft);
      setPages(existing => [...existing.filter(page => page.audience !== audience), saved]);
      setNotice(`${copy.title} saved.`);
    }, `Could not save ${copy.title}.`);
  };

  const remove = () => {
    if (!window.confirm(`Delete ${copy.title} for ${AUDIENCE_LABELS[audience]}?`)) return;
    void run(async () => {
      await deleteTerms(token, audience);
      setPages(existing => existing.filter(page => page.audience !== audience));
      setNotice(`${copy.title} deleted.`);
    }, `Could not delete ${copy.title}.`);
  };

  return (
    <section className="panel content-panel">
      <div className="panel-heading">
        <div>
          <h2>{copy.title}</h2>
          <p>
            Markdown body. Start each section with <code>## Heading</code>. Audience-specific terms
            override “Everyone”.
          </p>
        </div>
        <select
          className="button button-select"
          onChange={event => setAudience(event.target.value as ContentAudience)}
          value={audience}
        >
          {AUDIENCES.map(option => (
            <option key={option} value={option}>
              {AUDIENCE_LABELS[option]}
              {pages.some(page => page.audience === option) ? '' : ' (not set)'}
            </option>
          ))}
        </select>
      </div>

      {error ? <div className="inline-error" role="alert">{error}</div> : null}
      {notice ? <div className="inline-notice" role="status">{notice}</div> : null}

      {loading ? (
        <AppLoader label={`Loading ${copy.title}…`} />
      ) : (
        <form className="content-form" onSubmit={submit}>
          <label>
            Title
            <input
              maxLength={200}
              onChange={event => setDraft({ ...draft, title: event.target.value })}
              required
              value={draft.title}
            />
          </label>
          <label>
            Effective date
            <input
              onChange={event => setDraft({ ...draft, effective_date: event.target.value })}
              required
              type="date"
              value={draft.effective_date}
            />
          </label>
          <label className="content-form-wide">
            Body
            <textarea
              onChange={event => setDraft({ ...draft, body_markdown: event.target.value })}
              placeholder={copy.placeholder}
              required
              rows={16}
              value={draft.body_markdown}
            />
          </label>
          <div className="content-form-actions">
            {current ? (
              <button
                className="button button-secondary"
                disabled={busy}
                onClick={remove}
                type="button"
              >
                <Trash2 size={14} />
                Delete
              </button>
            ) : null}
            <button className="button button-primary" disabled={busy} type="submit">
              <Save size={14} />
              Save
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
