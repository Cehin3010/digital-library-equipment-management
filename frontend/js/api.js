/**
 * Module giao tiếp REST API sử dụng Async/Await, Destructuring và Xử lý lỗi thân thiện.
 * Tuân thủ Mục 2.3 (JavaScript) và Mục 6 (Error Handling) trong Quy ước Viết mã.
 */

const API_BASE_URL = '/api';

/**
 * Tải thông tin chi tiết của một tài liệu hoặc sách theo ID.
 * Sử dụng Async/Await và Destructuring đúng theo chuẩn Quy ước Coding.
 *
 * @param {number} bookId ID của tài liệu cần tải
 * @returns {Promise<Object|null>}
 */
export const fetchBookDetails = async (bookId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/books/${bookId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const { title, author, isAvailable, deweyCode } = await response.json();
    return { title, author, isAvailable, deweyCode };
  } catch (error) {
    // Ghi log chi tiết cho Developer nhưng không làm gián đoạn trải nghiệm người dùng
    console.warn('[API Fallback] Sử dụng kho dữ liệu cục bộ do máy chủ API không phản hồi:', error.message);
    return null;
  }
};

/**
 * Gửi yêu cầu POST/GET tới Backend API với cơ chế bắt lỗi an toàn.
 *
 * @param {string} endpoint Đường dẫn API
 * @param {Object} options Cấu hình method, body, actorUserId
 * @returns {Promise<Object>}
 */
export const requestBackendApi = async (endpoint, options = {}) => {
  const { method = 'GET', payload = null, actorUserId = 1 } = options;

  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Actor-User-Id': String(actorUserId),
    };

    const fetchOptions = {
      method,
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
    const data = await response.json();
    return data;
  } catch (error) {
    console.info('[Offline/Local Mode] Đang xử lý nghiệp vụ trực tiếp trên Store:', endpoint);
    return { offlineFallback: true, error };
  }
};

