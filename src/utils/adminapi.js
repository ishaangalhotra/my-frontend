import axios from 'axios';

const adminApi = axios.create({
  baseURL: '/api/v1/admin',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor to handle errors
adminApi.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default adminApi;
