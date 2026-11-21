import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
}

const getInitialCollapsed = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('km_sidebar_collapsed') === 'true';
};

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: getInitialCollapsed(),
  mobileSidebarOpen: false,
  toggleSidebar: () =>
    set((state) => {
      const next = !state.sidebarCollapsed;
      localStorage.setItem('km_sidebar_collapsed', String(next));
      return { sidebarCollapsed: next };
    }),
  setSidebarCollapsed: (collapsed: boolean) => {
    localStorage.setItem('km_sidebar_collapsed', String(collapsed));
    set({ sidebarCollapsed: collapsed });
  },
  toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
}));
