import axios from "axios";

const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://server-5gujvqfe0-khanzadasohaibs-projects.vercel.app"
    : "http://localhost:8005"; // Ensure this matches your backend port

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Ensures cookies & credentials are sent
});

// ✅ Attach access token before requests
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle expired tokens and auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        console.log("No refresh token found. Redirecting to login...");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/refresh-token`,
          { refreshToken },
          { withCredentials: true }
        );

        localStorage.setItem("accessToken", data.accessToken);
        error.config.headers["Authorization"] = `Bearer ${data.accessToken}`;

        return api(error.config); // ✅ Retry failed request
      } catch (refreshError) {
        console.error("Refresh token expired. Redirecting to login...");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
