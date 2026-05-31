import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  orgId: string;
  org: {
    id: string;
    name: string;
    freeZone: string;
    tradeLicenseNo: string;
    subscriptionTier: string;
    subscriptionStatus: string;
    trialEndsAt?: string | null;
    currentPeriodEnd?: string | null;
  } | null;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isLoading: boolean;

  setAuth: (token: string, user: AuthUser, broadcast?: boolean) => void;
  clearAuth: (broadcast?: boolean) => void;
  setLoading: (loading: boolean) => void;
}

const channel = typeof window !== 'undefined' ? new BroadcastChannel('ts-auth-sync') : null;

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isLoading: true,

  setAuth: (accessToken, user, broadcast = true) => {
    set({ accessToken, user, isLoading: false });
    if (broadcast && channel) {
      channel.postMessage({ type: 'SET_AUTH', payload: { accessToken, user } });
    }
  },
  
  clearAuth: (broadcast = true) => {
    set({ accessToken: null, user: null, isLoading: false });
    if (broadcast && channel) {
      channel.postMessage({ type: 'CLEAR_AUTH' });
    }
  },
  
  setLoading: (isLoading) => set({ isLoading }),
}));

if (channel) {
  channel.onmessage = (event) => {
    const { type, payload } = event.data;
    if (type === 'SET_AUTH') {
      useAuthStore.getState().setAuth(payload.accessToken, payload.user, false);
    } else if (type === 'CLEAR_AUTH') {
      useAuthStore.getState().clearAuth(false);
    }
  };
}

// Non-hook accessors for use outside React components (interceptors, actions)
export const getStoredToken = () => useAuthStore.getState().accessToken;
export const storeAuth = (token: string, user: AuthUser) =>
  useAuthStore.getState().setAuth(token, user);
export const clearStoredAuth = () => useAuthStore.getState().clearAuth();
