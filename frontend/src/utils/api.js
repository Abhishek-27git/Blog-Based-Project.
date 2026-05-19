import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true, // Send and receive cookies automatically
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor to handle token refresh automatically if access token expires
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the backend returns 401 Unauthorized (Access Token expired) and we haven't retried yet
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/login" &&
      originalRequest.url !== "/auth/register" &&
      originalRequest.url !== "/auth/refresh"
    ) {
      originalRequest._retry = true;
      try {
        // Attempt to call the refresh endpoint to obtain new cookies
        await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed/expired — user must log in again
        return Promise.reject(refreshError);
      }
    }

    // Return the formatted error response if available
    if (error.response && error.response.data) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);

export default api;
