import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
// import axios from 'axios';

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
//   withCredentials: true,
//   headers: { 'Content-Type': 'application/json' },
// });

// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (
//       error.response?.status === 401 &&
//       !window.location.pathname.includes('/login')
//     ) {
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;
