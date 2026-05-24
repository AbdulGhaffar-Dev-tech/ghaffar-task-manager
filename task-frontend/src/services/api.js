import axios from 'axios';

// ✅ Absolute URL fallback ensures production always talks to the live database, even on shared domains
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://ghaffar-task-manager-production.up.railway.app/api'; 

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
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = (formData) => API.post('/auth/login', formData);
export const signup = (formData) => API.post('/auth/signup', formData);
export const createTask = (taskData) => API.post('/tasks', taskData);
export const updateTask = (id, updatedFields) => API.put(`/tasks/${id}`, updatedFields);
export const getAllTasks = () => API.get('/tasks');
export const deleteTask = (id) => API.delete(`/tasks/${id}`);
export const shareTask = (id, email) => API.put(`/tasks/${id}/share`, { emailToShareWith: email });

// Attachment endpoints
export const uploadAttachments = (taskId, files) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  return API.post(`/tasks/${taskId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const deleteAttachment = (taskId, attachmentId) =>
  API.delete(`/tasks/${taskId}/attachments/${attachmentId}`);

export default API;