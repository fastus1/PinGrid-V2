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

          // Check if response has the expected structure
          if (!response || !response.data) {
            throw new Error('Invalid response from server. Please check your API configuration.');
          }

          const { user, token } = response.data;

          if (!user || !token) {
            throw new Error('Server response missing user or token data');
          }

          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
            error: null
          });

          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
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

          // Check if response has the expected structure
          if (!response || !response.data) {
            throw new Error('Invalid response from server. Please check your API configuration.');
          }

          const { user, token } = response.data;

          if (!user || !token) {
            throw new Error('Server response missing user or token data');
          }

          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
            error: null
          });

          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.message || 'Login failed';
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
