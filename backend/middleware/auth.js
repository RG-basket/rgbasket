const jwt = require('jsonwebtoken');

const authenticateAdmin = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      message: 'Invalid token or unauthorized access.'
    });
  }
};

const authenticateAdminOr404 = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  }
};

module.exports = { authenticateAdmin, authenticateAdminOr404 };