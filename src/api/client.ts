export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
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
      }
    | null;
  if (!response.ok) {
    const detail = typeof body?.detail === 'string' ? body.detail : body?.detail?.message;
    throw new ApiError(
      body?.message ?? detail ?? body?.error ?? `Request failed (${response.status}).`,
      response.status,
    );
  }
  return body as T;
}
