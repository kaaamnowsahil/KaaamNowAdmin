export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
    public readonly details?: unknown,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Per-field messages from `details.fields`, when the server sent a field map. */
  get fieldErrors(): Record<string, string> {
    const fields = (this.details as { fields?: unknown } | null | undefined)?.fields;
    return fields && typeof fields === 'object' && !Array.isArray(fields)
      ? (fields as Record<string, string>)
      : {};
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '');

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export async function apiRequest<T>(
  path: string,
  token: string | null = null,
  init: RequestInit = {},
): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError('VITE_API_BASE_URL is not configured.');
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError('Unable to reach the server. Check your connection and try again.');
  }

  const body = await response.json().catch(() => null) as
    | {
        message?: string;
        detail?: string | { message?: string };
        error?: string;
        code?: string;
        details?: unknown;
        request_id?: string;
      }
    | null;
  if (!response.ok) {
    const detail = typeof body?.detail === 'string' ? body.detail : body?.detail?.message;
    throw new ApiError(
      body?.message ?? detail ?? body?.error ?? `Request failed (${response.status}).`,
      response.status,
      body?.code,
      body?.details,
      body?.request_id ?? response.headers.get('x-request-id') ?? undefined,
    );
  }
  return body as T;
}
