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

const checkBanned = async (req, res, next) => {
  try {
    const User = require('../models/User');
    // Safety check for body/params existence
    const body = req.body || {};
    const params = req.params || {};
    const queryParams = req.query || {};

    const userId = body.userId || body.user || params.userId || queryParams.userId;

    if (!userId) {
      return next();
    }

    const query = require('mongoose').isValidObjectId(userId)
      ? { _id: userId }
      : { googleId: userId };

    const user = await User.findOne(query);

    if (user && user.isBanned) {
      return res.status(403).json({
        success: false,
        message: user.banReason || 'Your account has been restricted. Please contact support.',
        reason: user.banReason,
        isBanned: true
      });
    }

    next();
  } catch (error) {
    console.error('Error in checkBanned middleware:', error);
    next();
  }
};

module.exports = { authenticateAdmin, authenticateAdminOr404, checkBanned };