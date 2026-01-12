const authService = require('../../modules/auth/auth.service');
const User = require('../../modules/auth/auth.model');

/**
 * Middleware to protect routes that require authentication
 */
async function authMiddleware(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Please login.'
      });
    }

    // Extract token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);

    // Verify token
    const decoded = authService.verifyToken(token);

    // Get user from database
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Attach user to request object
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message || 'Invalid token'
    });
  }
}

/**
 * Middleware to check if user is admin
 */
function adminMiddleware(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin privileges required.'
    });
  }
  next();
}

module.exports = authMiddleware;
module.exports.adminMiddleware = adminMiddleware;
