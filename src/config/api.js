const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const ENDPOINTS = {
  BASE: API_BASE,
  AUTH: `${API_BASE}/auth`,
  CUSTOMERS: `${API_BASE}/customers`,
  LEADS: `${API_BASE}/leads`,
  DEALS: `${API_BASE}/deals`,
  ORDERS: `${API_BASE}/orders`,
  PRODUCTS: `${API_BASE}/products`,
  INVOICES: `${API_BASE}/invoices`,
  TASKS: `${API_BASE}/tasks`,
  ACTIVITIES: `${API_BASE}/activities`,
  ANALYTICS: `${API_BASE}/analytics`,
  NOTIFICATIONS: `${API_BASE}/notifications`,
  AI_CHAT: `${API_BASE}/ai/chat`,
  DASHBOARD_STATS: `${API_BASE}/dashboard/stats`,
  SETTINGS: `${API_BASE}/settings`,
};

export const getAuthHeaders = (extraHeaders = {}) => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
};

export default API_BASE;
