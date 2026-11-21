import { create } from 'zustand';
import { RoleName, UserProfile } from '@keydso/shared-types';

/** Decode JWT payload and check if it's expired */
function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // exp is in seconds; Date.now() is ms
    return payload.exp ? payload.exp * 1000 < Date.now() : false;
  } catch {
    return true;
  }
}

const storedToken = localStorage.getItem('keydso_token');
const tokenValid = !isTokenExpired(storedToken);

// If stored token is expired, clear it immediately on page load
if (!tokenValid) {
  localStorage.removeItem('keydso_token');
  localStorage.removeItem('keydso_user');
}

interface AuthState {
  token: string | null;
  user: (UserProfile & { roles: RoleName[]; assigned_faculty_id?: string | null }) | null;
  isAuthenticated: boolean;
  setSession: (token: string, user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: tokenValid ? storedToken : null,
  user: tokenValid && localStorage.getItem('keydso_user') ? JSON.parse(localStorage.getItem('keydso_user')!) : null,
  isAuthenticated: tokenValid && !!storedToken,

  setSession: (token, user) => {
    localStorage.setItem('keydso_token', token);
    localStorage.setItem('keydso_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('keydso_token');
    localStorage.removeItem('keydso_user');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
