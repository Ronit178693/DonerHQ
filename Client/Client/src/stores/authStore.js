import { create } from 'zustand';
import API from '../api/axios';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  checkAuth: async () => {
    try {
      const res = await API.get('/auth/me');
      set({ user: res.data.user, isAuthenticated: true, loading: false });
    } catch {
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },

  login: async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    set({ user: res.data.user, isAuthenticated: true });
    return res.data;
  },

  register: async (userData) => {
    const res = await API.post('/auth/register', userData);
    set({ user: res.data.user, isAuthenticated: true });
    return res.data;
  },

  logout: async () => {
    await API.post('/auth/logout');
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
}));

export default useAuthStore;
