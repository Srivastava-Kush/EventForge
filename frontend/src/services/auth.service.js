import api from './api.js';

export const authService = {
  async register({ name, email, password }) {
    return api.post('/auth/register', { name, email, password });
  },

  async login({ email, password }) {
    return api.post('/auth/login', { email, password });
  },

  async logout() {
    return api.post('/auth/logout');
  },

  async getMe() {
    return api.get('/auth/me');
  },
};
