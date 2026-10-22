import api from './api.js';

export const eventService = {
  async createEvent(eventData) {
    return api.post('/events', eventData);
  },

  async getEvents() {
    return api.get('/events');
  },

  async getEventById(id) {
    return api.get(`/events/${id}`);
  },

  async deleteEvent(id) {
    return api.delete(`/events/${id}`);
  },

  /* Tasks API */
  async createTask(eventId, taskData) {
    return api.post(`/events/${eventId}/tasks`, taskData);
  },

  async updateTask(eventId, taskId, updates) {
    return api.patch(`/events/${eventId}/tasks/${taskId}`, updates);
  },

  async deleteTask(eventId, taskId) {
    return api.delete(`/events/${eventId}/tasks/${taskId}`);
  },

  /* Vendors API */
  async createVendor(eventId, vendorData) {
    return api.post(`/events/${eventId}/vendors`, vendorData);
  },

  async updateVendor(eventId, vendorId, updates) {
    return api.patch(`/events/${eventId}/vendors/${vendorId}`, updates);
  },

  async deleteVendor(eventId, vendorId) {
    return api.delete(`/events/${eventId}/vendors/${vendorId}`);
  },

  /* Expenses API */
  async createExpense(eventId, expenseData) {
    return api.post(`/events/${eventId}/expenses`, expenseData);
  },

  async updateExpense(eventId, expenseId, updates) {
    return api.patch(`/events/${eventId}/expenses/${expenseId}`, updates);
  },

  async deleteExpense(eventId, expenseId) {
    return api.delete(`/events/${eventId}/expenses/${expenseId}`);
  },

  /* Guests API */
  async createGuest(eventId, guestData) {
    return api.post(`/events/${eventId}/guests`, guestData);
  },

  async updateGuest(eventId, guestId, updates) {
    return api.patch(`/events/${eventId}/guests/${guestId}`, updates);
  },

  async deleteGuest(eventId, guestId) {
    return api.delete(`/events/${eventId}/guests/${guestId}`);
  },

  async importGuests(eventId, guests) {
    return api.post(`/events/${eventId}/guests/import`, { guests });
  },

  /* Schedule / Run Sheet API */
  async createScheduleItem(eventId, itemData) {
    return api.post(`/events/${eventId}/schedule`, itemData);
  },

  async updateScheduleItem(eventId, itemId, updates) {
    return api.patch(`/events/${eventId}/schedule/${itemId}`, updates);
  },

  async deleteScheduleItem(eventId, itemId) {
    return api.delete(`/events/${eventId}/schedule/${itemId}`);
  },

  /* AI Poster Studio API */
  async getPosterSuggestions(eventId) {
    return api.get(`/events/${eventId}/posters/suggestions`);
  },

  async generatePoster(eventId, data) {
    return api.post(`/events/${eventId}/posters/generate`, data);
  },

  async savePoster(eventId, posterData) {
    return api.post(`/events/${eventId}/posters`, posterData);
  },

  async deletePoster(eventId, posterId) {
    return api.delete(`/events/${eventId}/posters/${posterId}`);
  },

  /* AI Inspirations & Creative Themes API */
  async generateIdeas(eventId) {
    return api.post(`/events/${eventId}/generate-ideas`);
  },
};

