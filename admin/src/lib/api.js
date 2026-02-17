import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ow_admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url?.includes("/auth/login");
    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem("ow_admin_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export default api;
