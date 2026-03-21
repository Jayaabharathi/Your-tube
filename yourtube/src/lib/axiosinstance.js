import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || (typeof window !== "undefined" 
    ? `http://${window.location.hostname}:5000` 
    : "http://localhost:5000"),
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            console.warn("🌐 Network Error detected. Check if Backend is running.");
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
