import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('ow_customer_token') || null,

  setAuth: (user, token) => {
    localStorage.setItem('ow_customer_token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('ow_customer_token');
    set({ user: null, token: null });
  },
}));

export default useAuthStore;
