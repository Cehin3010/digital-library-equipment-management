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
      // Hết hạn phiên đăng nhập
      console.warn('Phiên đăng nhập đã hết hạn.');
    }
    return Promise.reject(res?.data || { success: false, message: error.message || 'Lỗi kết nối máy chủ' });
  }
);

// ==============================================================================
// 1. Phân hệ Danh mục & Kho Tài nguyên (F-01, F-02 - Nguyễn Anh Khoa phụ trách)
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

export const getDigitalReadUrl = (id) => {
  const token = localStorage.getItem('token');
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  return `${baseUrl}/resources/${id}/read${token ? `?token=${encodeURIComponent(token)}` : ''}`;
};

// ==============================================================================
// 2. Phân hệ Báo cáo & Thống kê (F-09, F-10 - Nguyễn Anh Khoa phụ trách)
// ==============================================================================
export const getDashboardStats = () => {
  return apiClient.get('/reports/dashboard');
};

export const exportReport = (params = {}) => {
  const token = localStorage.getItem('token');
  const query = new URLSearchParams(params).toString();
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  
  // Tải trực tiếp file bằng thẻ tải trình duyệt
  window.open(`${baseUrl}/reports/export?${query}&token=${token || ''}`, '_blank');
};

export default apiClient;

