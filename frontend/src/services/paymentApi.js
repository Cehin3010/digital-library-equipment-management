import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getMyLoans = () => api.get('/my-loans');
export const getMyPenalties = () => api.get('/my-penalties');
export const initiatePayment = (penaltyId, provider) =>
  api.post(`/penalties/${penaltyId}/pay`, { provider });
export const getNotifications = () => api.get('/notifications');
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);