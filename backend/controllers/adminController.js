const jwt = require('jsonwebtoken');

const adminLogin = async (req, res) => {
  try {
    const { adminId, password } = req.body;

    // Validate credentials against environment variables
    if (adminId !== process.env.ADMIN_ID || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ 
        message: 'Invalid admin credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        adminId: adminId, 
        role: 'admin' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Admin login successful',
      token,
      admin: {
        id: adminId,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      message: 'Internal server error during admin login' 
    });
  }
};

const getAdminDashboard = async (req, res) => {
  try {
    // This is a protected route that only authenticated admins can access
    // You can add any admin-specific data here
    const adminData = {
      message: 'Welcome to Admin Dashboard',
      adminId: req.admin.adminId,
      role: req.admin.role,
      dashboardStats: {
        totalUsers: 150, // You can fetch actual data from your database
        activeSessions: 45,
        serverStatus: 'Running'
      },
      timestamp: new Date().toISOString()
    };

    res.status(200).json(adminData);
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ 
      message: 'Error fetching admin dashboard data' 
    });
  }
};

module.exports = {
  adminLogin,
  getAdminDashboard
};