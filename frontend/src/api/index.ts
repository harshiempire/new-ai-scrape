import axios, { AxiosError, type AxiosResponse } from "axios";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Base URL for API requests
const API_BASE_URL = "http://localhost:5001/api";

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    if (response.data?.success && response.data?.data !== undefined) {
      response.data = response.data.data as ApiResponse;
    }
    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    const apiError = error.response?.data?.error;
    if (apiError) {
      return Promise.reject(
        new ApiError(apiError.message, apiError.code, apiError.details),
      );
    }
    return Promise.reject(error);
  },
);

export default api;
