import { API_URL, getAuthHeaders } from './config';
import { showToast } from '../components/Toast';

export const apiFetch = async (endpoint, options = {}) => {
  try {
    const url = `${API_URL}${endpoint}`;
    const defaultHeaders = getAuthHeaders();
    
    // Merge headers
    const headers = { ...defaultHeaders, ...(options.headers || {}) };
    
    const res = await fetch(url, { ...options, headers });
    
    // Check content type
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("API Error: Response is not JSON", await res.text());
      const errMsg = "Không kết nối được máy chủ, vui lòng thử lại (Lỗi mạng hoặc sai cổng)";
      showToast(errMsg, 'error');
      throw new Error(errMsg);
    }

    const data = await res.json();

    if (!res.ok || data.success === false) {
      const errMsg = data.message || "Lỗi không xác định từ máy chủ";
      showToast(errMsg, 'error');
      throw new Error(errMsg);
    }

    // Return the actual data payload if it follows the { success, data, message } pattern
    return data.data !== undefined ? data.data : data;

  } catch (err) {
    if (!err.message.includes("Không kết nối được máy chủ") && !err.message.includes("Lỗi không xác định")) {
       // If it's a network error (failed to fetch)
       if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
          showToast("Không kết nối được máy chủ, vui lòng thử lại", 'error');
       }
    }
    throw err;
  }
};
