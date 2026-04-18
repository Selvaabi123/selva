import axios from 'axios';

const getCSRFToken = () => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf_token') {
      return value;
    }
  }
  return null;
};

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let cachedCSRFToken = null;

api.interceptors.request.use(config => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase())) {
    let csrfToken = getCSRFToken();
    if (!csrfToken && cachedCSRFToken) {
      csrfToken = cachedCSRFToken;
    }
    if (csrfToken) {
      config.headers['x-csrf-token'] = csrfToken;
    }
  }
  return config;
});

api.interceptors.response.use(
  res => {
    const csrfToken = res.headers['x-csrf-token'];
    if (csrfToken) {
      cachedCSRFToken = csrfToken;
    }
    return res;
  },
  err => Promise.reject(err)
);

api.interceptors.response.use(
  res => res,
  err => {
    return Promise.reject(err);
  }
);

export default api;
