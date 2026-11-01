import axios from 'axios';

// Instance Axios chung theo chuẩn TASK1.md
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Tự động đính kèm Sanctum Bearer Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Chuẩn hóa phản hồi JSON
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const res = error.response;
    if (res && res.status === 401) {
      console.warn('API yêu cầu đăng nhập hoặc token đã hết hạn.');
      return Promise.reject({
        ...(res.data || {}),
        success: false,
        status: res.status,
        message: res.data?.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      });
    }
    return Promise.reject({
      ...(res?.data || {}),
      success: false,
      status: res?.status,
      code: error.code,
      message: res?.data?.message || error.message || 'Lỗi kết nối máy chủ',
    });
  }
);

// Xác thực và phiên đăng nhập
export const requestLoginOtp = (email) => apiClient.post('/auth/otp/request', { email });

export const verifyLoginOtp = ({ email, otp }) =>
  apiClient.post('/auth/otp/verify', { email, otp });

export const getCurrentUser = () => apiClient.get('/auth/me');

export const logoutCurrentUser = () => apiClient.post('/auth/logout');

// Quản trị hệ thống
export const getAdminUsers = (params = {}) => apiClient.get('/admin/users', { params });

export const createAdminUser = (data) => apiClient.post('/admin/users', data);

export const updateAdminUser = (id, data) => apiClient.patch(`/admin/users/${id}`, data);

export const getSystemSettings = () => apiClient.get('/admin/settings');

export const updateSystemSettings = (data) => apiClient.put('/admin/settings', data);

export const getAuditLogs = (params = {}) => apiClient.get('/admin/audit-logs', { params });

// ==============================================================================
// Danh mục và kho tài nguyên
// ==============================================================================
export const getCategories = (flat = false) => {
  return apiClient.get(`/categories${flat ? '?flat=true' : ''}`);
};

export const createCategory = (data) => {
  return apiClient.post('/categories', data);
};

export const getResources = (params = {}) => {
  return apiClient.get('/resources', { params });
};

export const getResourceById = (id) => {
  return apiClient.get(`/resources/${id}`);
};

export const createResource = (formData) => {
  return apiClient.post('/resources', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const updateResource = (id, formData) => {
  return apiClient.post(`/resources/${id}?_method=PUT`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteResource = (id) => {
  return apiClient.delete(`/resources/${id}`);
};

export const getResourceSchedule = (id, startDate, endDate) => {
  return apiClient.get(`/resources/${id}/schedule`, {
    params: { start_date: startDate, end_date: endDate },
  });
};

export const holdLoan = (data) => apiClient.post('/loans/hold', data);

export const confirmLoan = (id) => apiClient.post(`/loans/${id}/confirm`);

export const cancelLoan = (id) => apiClient.post(`/loans/${id}/cancel`);

export const getMyLoans = (params = {}) => apiClient.get('/loans/mine', { params });

export const getMyLoan = (id) => apiClient.get(`/loans/${id}`);

export const getRoomBookings = (params = {}) => apiClient.get('/room-bookings', { params });

export const createRoomBooking = (data) => apiClient.post('/room-bookings', data);

export const cancelRoomBooking = (id) => apiClient.post(`/room-bookings/${id}/cancel`);

export const getCirculationLoans = (params = {}) => apiClient.get('/loans', { params });

export const findLoanByQr = (qr_token) => apiClient.post('/loans/scan-qr', { qr_token });

export const approveLoan = (id) => apiClient.post(`/loans/${id}/approve`);

export const rejectLoan = (id, reason) => apiClient.post(`/loans/${id}/reject`, { reason });

export const returnLoan = (id, return_condition) =>
  apiClient.post(`/loans/${id}/return`, { return_condition });

export const getDigitalReadFile = (id) =>
  apiClient.get(`/resources/${id}/read`, { responseType: 'blob' });

// ==============================================================================
// Báo cáo và thống kê
// ==============================================================================
export const getDashboardStats = () => {
  return apiClient.get('/reports/dashboard');
};

export const exportReport = (params = {}) =>
  apiClient.get('/reports/export', { params, responseType: 'blob' });

// Lịch sử, thanh toán và thông báo
export const getMyHistory = (params = {}) => apiClient.get('/my-loans', { params });

export const getMyPenalties = (params = {}) => apiClient.get('/my-penalties', { params });

export const initiatePenaltyPayment = (id, provider) =>
  apiClient.post(`/penalties/${id}/pay`, { provider });
export const simulatePenaltyPayment = (id, provider) =>
  apiClient.post(`/penalties/${id}/pay-demo`, { provider });

export const getPaymentStatus = (txnRef) => apiClient.get(`/payments/${txnRef}/status`);

export const getNotifications = (params = {}) => apiClient.get('/notifications', { params });

export const markNotificationRead = (id) => apiClient.patch(`/notifications/${id}/read`);

export default apiClient;
