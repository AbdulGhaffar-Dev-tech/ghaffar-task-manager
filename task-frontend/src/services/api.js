import axios from 'axios';

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api' 
  : 'https://task-manager-production-30e0.up.railway.app/api'; // 👈 Your live Railway URL + /api

const API = axios.create({ 
  baseURL: API_BASE_URL 
});

// 1. Request Interceptor (Attaches the token)
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// 2. Response Interceptor (Handles 401 Unauthorized globally)
API.interceptors.response.use(
  (response) => response, 
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("⚠️ Session expired or invalid token. Logging out...");
      
      // Clean up localStorage completely
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Force reload to the login screen so the user can get a fresh token
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 3. API Functions
export const login = (formData) => API.post('/auth/login', formData);
export const signup = (formData) => API.post('/auth/signup', formData);

export const getAllTasks = () => API.get('/tasks');
export const createTask = (taskData) => API.post('/tasks', taskData);
export const updateTask = (id, updatedFields) => API.put(`/tasks/${id}`, updatedFields);
export const deleteTask = (id) => API.delete(`/tasks/${id}`);
export const shareTask = (id, email) => API.put(`/tasks/${id}/share`, { emailToShareWith: email });

export default API;