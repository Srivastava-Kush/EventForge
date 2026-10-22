import api from './api.js';

export const chatService = {
  async sendMessage(message) {
    return api.post('/chat', { message });
  },

  async getHistory() {
    return api.get('/chat/history');
  },
};
