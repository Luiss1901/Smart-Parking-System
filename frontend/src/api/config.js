// Always use relative path so requests go through the load balancer / api gateway
export const API_URL = "http://localhost:8080";

// Helper to add token to headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};
