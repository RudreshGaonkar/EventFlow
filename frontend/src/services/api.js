import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const is401 = error.response?.status === 401;
    const onLoginPage = window.location.pathname === '/login';
    if (is401 && !onLoginPage) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
