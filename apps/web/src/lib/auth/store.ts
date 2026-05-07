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

  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isLoading: true,

  setAuth: (accessToken, user) => set({ accessToken, user, isLoading: false }),
  clearAuth: () => set({ accessToken: null, user: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// Non-hook accessors for use outside React components (interceptors, actions)
export const getStoredToken = () => useAuthStore.getState().accessToken;
export const storeAuth = (token: string, user: AuthUser) =>
  useAuthStore.getState().setAuth(token, user);
export const clearStoredAuth = () => useAuthStore.getState().clearAuth();
