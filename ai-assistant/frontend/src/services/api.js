import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const conversationService = {
  getAll: (page = 1, limit = 20) => api.get(`/conversations?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/conversations/${id}`),
  create: (data) => api.post('/conversations', data),
  delete: (id) => api.delete(`/conversations/${id}`),
  sendMessage: (data) => api.post('/conversations/message', data),
};

export const documentService = {
  getAll: (page = 1, limit = 20) => api.get(`/documents?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/documents/${id}`),
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  delete: (id) => api.delete(`/documents/${id}`),
};

export const settingsService = {
  getAll: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  getByKey: (key) => api.get(`/settings/${key}`),
};

export const statsService = {
  get: () => api.get('/stats'),
};

export default api;
