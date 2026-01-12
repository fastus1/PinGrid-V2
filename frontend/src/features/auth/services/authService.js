import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authService = {
  /**
   * Register a new user
   */
  async register(userData) {
    const response = await axios.post(`${API_URL}/api/auth/register`, userData);
    return response.data;
  },

  /**
   * Login user
   */
  async login(credentials) {
    const response = await axios.post(`${API_URL}/api/auth/login`, credentials);
    return response.data;
  },

  /**
   * Get current user info
   */
  async getMe(token) {
    const response = await axios.get(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  /**
   * Logout (client-side only for JWT)
   */
  logout() {
    // JWT logout is handled client-side by removing token
    return Promise.resolve({ success: true });
  }
};

export default authService;
