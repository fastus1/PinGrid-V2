import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Log API URL for debugging
console.log('🔧 API URL configured:', API_URL);

const authService = {
  /**
   * Register a new user
   */
  async register(userData) {
    console.log('📤 Registering user to:', `${API_URL}/api/auth/register`);
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, userData);
      console.log('✅ Registration response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Registration error:', error);
      console.error('Error response:', error.response);
      throw error;
    }
  },

  /**
   * Login user
   */
  async login(credentials) {
    console.log('📤 Logging in to:', `${API_URL}/api/auth/login`);
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, credentials);
      console.log('✅ Login response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('Error response:', error.response);
      throw error;
    }
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
