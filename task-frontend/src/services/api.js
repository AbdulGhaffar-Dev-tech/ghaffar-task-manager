import axios from 'axios';

// Create the axios instance
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// CRITICAL: This function runs BEFORE every request is sent
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    // Attach the token to the 'Authorization' header
    // The backend 'auth.js' middleware expects this format
    req.headers.Authorization = `Bearer ${token}`;
  }
  
  return req;
}, (error) => {
  return Promise.reject(error);
});

// --- Auth Endpoints ---
export const login = (formData) => API.post('/auth/login', formData);
export const signup = (formData) => API.post('/auth/signup', formData);

// --- Task Endpoints ---
export const getAllTasks = () => API.get('/tasks');
export const createTask = (newTask) => API.post('/tasks', newTask);
export const updateTask = (id, updatedTask) => API.put(`/tasks/${id}`, updatedTask);
export const deleteTask = (id) => API.delete(`/tasks/${id}`);
export const shareTask = (id, email) => API.put(`/tasks/${id}/share`, { emailToShareWith: email });

export default API;