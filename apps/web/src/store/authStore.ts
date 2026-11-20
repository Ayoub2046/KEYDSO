import { create } from 'zustand';
import { RoleName, UserProfile } from '@keydso/shared-types';

interface AuthState {
  token: string | null;
  user: (UserProfile & { roles: RoleName[]; assigned_faculty_id?: string | null }) | null;
  isAuthenticated: boolean;
  setSession: (token: string, user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('keydso_token'),
  user: localStorage.getItem('keydso_user') ? JSON.parse(localStorage.getItem('keydso_user')!) : null,
  isAuthenticated: !!localStorage.getItem('keydso_token'),

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
