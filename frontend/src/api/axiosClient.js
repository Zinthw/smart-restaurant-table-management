import axios from "axios";

const apiBaseURL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const axiosClient = axios.create({
  baseURL: apiBaseURL,
  timeout: 10000,
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("⚠️ No token found in localStorage");
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized – token invalid or expired");
      // Clear token và redirect to login
      localStorage.removeItem("admin_token");
      localStorage.removeItem("role");
      localStorage.removeItem("userEmail");
      // Redirect đến login page
      if (window.location.pathname !== "/admin/login") {
        window.location.href = "/admin/login";
      }
    }

    // Cải thiện error message cho user
    const errorMessage =
      error.response?.data?.message || error.message || "An error occurred";
    console.error("API Error:", errorMessage);

    return Promise.reject(error);
  }
);

export default axiosClient;
