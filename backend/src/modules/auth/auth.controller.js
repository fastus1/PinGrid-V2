const authService = require('./auth.service');

class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Basic validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      const result = await authService.register({
        email,
        password,
        firstName,
        lastName
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Basic validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      const result = await authService.login({ email, password });

      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      // Return 401 for invalid credentials
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }

  /**
   * Get current user info
   * GET /api/auth/me
   */
  async getMe(req, res, next) {
    try {
      // req.user is added by auth middleware
      res.json({
        success: true,
        data: { user: req.user }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(req, res) {
    // For JWT, logout is handled client-side by removing the token
    // We just send a success response
    res.json({
      success: true,
      message: 'Logout successful'
    });
  }
}

module.exports = new AuthController();
