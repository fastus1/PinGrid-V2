import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      // Actions
      register: async (userData) => {
        set({ loading: true, error: null });
        try {
          const response = await authService.register(userData);
          const { user, token } = response.data;

          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
            error: null
          });

          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.message;
          set({
            error: errorMessage,
            loading: false
          });
          return { success: false, error: errorMessage };
        }
      },

      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          const response = await authService.login(credentials);
          const { user, token } = response.data;

          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
            error: null
          });

          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.message;
          set({
            error: errorMessage,
            loading: false
          });
          return { success: false, error: errorMessage };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        });
      },

      clearError: () => {
        set({ error: null });
      },

      // Utility to get token for API calls
      getToken: () => {
        return get().token;
      }
    }),
    {
      name: 'pingrid-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
