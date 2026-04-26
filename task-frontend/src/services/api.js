import axios from 'axios';
const API = axios.create({ baseURL: 'http://localhost:5000/api' });
export const getTask = (id) => API.get(`/tasks/${id}`);
export const createTask = (data) => API.post('/tasks', data);
export const updateTask = (id, data) => API.put(`/tasks/${id}`, data);
export const deleteTask = (id) => API.delete(`/tasks/${id}`);
export const getAllTasks = (userId) => API.get(`/tasks/my-tasks/${userId}`);


 

