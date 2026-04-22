import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL
});

// Attach user ID automatically
API.interceptors.request.use((config) => {
  const userId = localStorage.getItem("userId");

  if (userId) {
    config.headers["x-user-id"] = userId; // ✅ correct header
  }

  return config;
});

// Generate quiz API
export const generateQuiz = (formData) =>
  API.post("/generate-quiz", formData);
