import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:  null,
      token: null,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        set({ user: data.user, token: data.token });
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        return data.user;
      },

      register: async (payload) => {
        const { data } = await api.post('/auth/register', payload);
        set({ user: data.user, token: data.token });
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        return data.user;
      },

      logout: () => {
        set({ user: null, token: null });
        delete api.defaults.headers.common['Authorization'];
      },

      refreshUser: async () => {
        const { data } = await api.get('/auth/me');
        set({ user: data.user });
        return data.user;
      },

      updateUser: (updates) =>
        set((state) => ({ user: { ...state.user, ...updates } })),

      isAdmin:     () => get().user?.role === 'admin',
      isOfficer:   () => ['admin', 'officer'].includes(get().user?.role),
      isSurveyor:  () => get().user?.role === 'surveyor',
    }),
    {
      name: 'spring-revival-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      },
    }
  )
);
