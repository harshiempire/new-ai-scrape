import axios from "axios";

// Base URL for API requests
const API_BASE_URL = "http://localhost:5001";

// Create axios instance
export const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

export default api;
