import api from './api.js';

export const chatService = {
  async sendMessage(message, eventId = null) {
    return api.post('/chat', { message, eventId });
  },

  async getHistory() {
    return api.get('/chat/history');
  },
};
