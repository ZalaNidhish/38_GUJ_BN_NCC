import axios from "axios";

// Base URL for all API calls (proxied to backend via package.json proxy)
const api = axios.create({
  baseURL: "/api",
});

// Automatically attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ncc_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 (unauthorized) globally - log the user out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("ncc_token");
      localStorage.removeItem("ncc_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
