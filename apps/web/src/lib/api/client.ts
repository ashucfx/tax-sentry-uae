import axios from 'axios';
import { getStoredToken, storeAuth, clearStoredAuth } from '@/lib/auth/store';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30_000,
  withCredentials: true, // send httpOnly refresh token cookie automatically
  headers: { 'Content-Type': 'application/json' },
});

// Deduplicates concurrent refresh calls — only one in-flight at a time
let _refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const res = await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
      const data = (res.data?.data ?? res.data) as Record<string, unknown>;
      storeAuth(data.accessToken as string, data.user as Parameters<typeof storeAuth>[1]);
      return data.accessToken as string;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      // Only clear auth on auth-specific failures; network errors should not sign the user out
      if (!status || status === 401 || status === 403) {
        clearStoredAuth();
      }
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[auth] token refresh failed', status ?? 'network error');
      }
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

// ── Request interceptor ───────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window === 'undefined') return config;

  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor ──────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status;

    if (status === 401 && !error.config?._retry) {
      error.config._retry = true;

      const newToken = await doRefresh();
      if (newToken) {
        error.config.headers = error.config.headers ?? {};
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return api.request(error.config);
      }

      if (typeof window !== 'undefined') {
        window.location.href = '/sign-in';
      }
    }

    if (status === 403) {
      const code = error.response?.data?.code ?? error.response?.data?.message;
      if (typeof code === 'string') {
        if (code === 'EMAIL_NOT_VERIFIED') {
          if (typeof window !== 'undefined') window.location.href = '/verify-email';
        } else if (/subscription|expired|trial/i.test(code)) {
          if (typeof window !== 'undefined') window.location.href = '/billing';
        }
      }
    }

    return Promise.reject(error);
  },
);
