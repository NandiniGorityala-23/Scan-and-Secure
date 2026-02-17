import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('ow_admin_token') || null,

  setAuth: (user, token) => {
    localStorage.setItem('ow_admin_token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('ow_admin_token');
    set({ user: null, token: null });
  },
}));

export default useAuthStore;
