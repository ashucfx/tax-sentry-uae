import axios from 'axios';
import { useAuthStore, type AuthUser } from './store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

// Separate axios instance — never intercepted, avoids circular imports with client.ts
const authAxios = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

function extract(res: { data: Record<string, unknown> }) {
  return (res.data?.data ?? res.data) as Record<string, unknown>;
}

export async function loginAction(email: string, password: string) {
  const res = await authAxios.post('/auth/login', { email, password });
  const data = extract(res);
  useAuthStore.getState().setAuth(data.accessToken as string, data.user as AuthUser);
  return data;
}

export async function signupAction(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
) {
  const res = await authAxios.post('/auth/signup', { email, password, firstName, lastName });
  return extract(res);
}

export async function refreshAction(): Promise<string | null> {
  try {
    const res = await authAxios.post('/auth/refresh');
    const data = extract(res);
    useAuthStore.getState().setAuth(data.accessToken as string, data.user as AuthUser);
    return data.accessToken as string;
  } catch {
    useAuthStore.getState().clearAuth();
    return null;
  }
}

export async function logoutAction() {
  try {
    await authAxios.post('/auth/logout');
  } catch {}
  useAuthStore.getState().clearAuth();
}

export async function logoutAllAction() {
  // Requires access token — caller must ensure token is set in store
  const { accessToken } = useAuthStore.getState();
  try {
    await authAxios.post(
      '/auth/logout-all',
      {},
      { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} },
    );
  } catch {}
  useAuthStore.getState().clearAuth();
}

export async function forgotPasswordAction(email: string) {
  await authAxios.post('/auth/forgot-password', { email });
}

export async function resetPasswordAction(token: string, password: string) {
  await authAxios.post('/auth/reset-password', { token, password });
}

export async function verifyEmailAction(token: string) {
  await authAxios.post('/auth/verify-email', { token });
}

export async function resendVerificationAction() {
  const { accessToken } = useAuthStore.getState();
  await authAxios.post(
    '/auth/resend-verification',
    {},
    { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} },
  );
}

export async function sendOtpAction(identifier: { email?: string; phone?: string }) {
  const res = await authAxios.post('/auth/send-otp', identifier);
  return extract(res) as { channel: 'email' | 'sms' };
}

export async function verifyOtpAction(
  identifier: { email?: string; phone?: string },
  otp: string,
) {
  const res = await authAxios.post('/auth/verify-otp', { ...identifier, otp });
  const data = extract(res);
  useAuthStore.getState().setAuth(data.accessToken as string, data.user as AuthUser);
  return data as { isNewUser: boolean; user: AuthUser };
}

export async function acceptInviteAction(
  token: string,
  password: string,
  firstName?: string,
  lastName?: string,
) {
  const res = await authAxios.post('/auth/accept-invite', { token, password, firstName, lastName });
  const data = extract(res);
  useAuthStore.getState().setAuth(data.accessToken as string, data.user as AuthUser);
  return data;
}
