/**
 * src/stores/uiStore.ts
 * Oracle Document sections consumed: 7, 9, 10, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import type { ApiError } from '@/types/api';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  correlationId?: string;
}

export interface UiState {
  toasts: ToastItem[];
  modals: Record<string, boolean>;
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  commandPaletteOpen: boolean;
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  openModal: (key: string) => void;
  closeModal: (key: string) => void;
  toggleSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  pushErrorToast: (error: ApiError) => string;
}

const uiStateCreator: StateCreator<UiState> = (set) => ({
  toasts: [],
  modals: {},
  sidebarCollapsed: false,
  mobileNavOpen: false,
  commandPaletteOpen: false,
  addToast: (toast: Omit<ToastItem, 'id'>) => {
    const id = createToastId();
    set((state: UiState) => ({
      toasts: [...state.toasts, {
        ...toast,
        id,
        duration: toast.duration ?? defaultDurationByVariant[toast.variant as keyof typeof defaultDurationByVariant],
      }],
    }));
    return id;
  },
  removeToast: (id: string) => set((state: UiState) => ({
    toasts: state.toasts.filter((toast: ToastItem) => toast.id !== id),
  })),
  openModal: (key: string) => set((state: UiState) => ({
    modals: { ...state.modals, [key]: true },
  })),
  closeModal: (key: string) => set((state: UiState) => ({
    modals: { ...state.modals, [key]: false },
  })),
  toggleSidebar: () => set((state: UiState) => ({
    sidebarCollapsed: !state.sidebarCollapsed,
  })),
  setMobileNavOpen: (mobileNavOpen: boolean) => set({
    mobileNavOpen,
  }),
  toggleMobileNav: () => set((state: UiState) => ({
    mobileNavOpen: !state.mobileNavOpen,
  })),
  setCommandPaletteOpen: (open: boolean) => set({
    commandPaletteOpen: open,
  }),
  toggleCommandPalette: () => set((state: UiState) => ({
    commandPaletteOpen: !state.commandPaletteOpen,
  })),
  pushErrorToast: (error: ApiError) => {
    const id = createToastId();
    set((state: UiState) => ({
      toasts: [...state.toasts, {
        id,
        title: error.status === 500 ? 'Server error' : 'Request failed',
        message: error.message,
        variant: 'error',
        correlationId: error.correlationId,
        duration: defaultDurationByVariant.error,
      }],
    }));
    return id;
  },
});

const defaultDurationByVariant: Record<ToastItem['variant'], number> = {
  success: 3500,
  info: 4500,
  warning: 5500,
  error: 7000,
};

const createToastId = () => `toast_${Math.random().toString(36).slice(2, 10)}`;

export const uiStore = create<UiState>()(uiStateCreator);
