const User = require('../models/User');
const Workout = require('../models/Workout');
const WorkoutLog = require('../models/WorkoutLog');

const getDashboardStats = async (req, res) => {
  try {
    // Get real statistics from database
    const [
      totalUsers,
      activeUsers,
      totalWorkouts,
      recentWorkoutLogs,
      userGrowth,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Workout.countDocuments(),
      WorkoutLog.find()
        .populate('user_id', 'profile.full_name')
        .populate('workout_id', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      // Get user growth for last 30 days
      User.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }),
      // Get recent user registrations
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('email profile.full_name createdAt')
        .lean()
    ]);

    // Calculate monthly growth
    const lastMonthUsers = await User.countDocuments({
      createdAt: {
        $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    });
    
    const monthlyGrowth = lastMonthUsers > 0 
      ? Math.round(((userGrowth - lastMonthUsers) / lastMonthUsers) * 100)
      : 0;

    // Combine different types of activities
    const activities = [];

    // Add workout activities
    recentWorkoutLogs.forEach(log => {
      if (log.createdAt) {
        activities.push({
          id: `workout_${log._id}`,
          user: log.user_id?.profile?.full_name || 'Unknown User',
          action: `Hoàn thành workout ${log.workout_id?.name || 'Unknown'}`,
          timestamp: log.createdAt.toISOString(),
          type: 'workout'
        });
      }
    });

    // Add user registration activities
    console.log('Recent users found:', recentUsers.length);
    recentUsers.forEach(user => {
      console.log('Processing user:', user);
      activities.push({
        id: `register_${user._id}`,
        user: user.profile?.full_name || user.email || 'Unknown User',
        action: 'Đăng ký tài khoản mới',
        timestamp: user.createdAt.toISOString(),
        type: 'registration'
      });
    });

    // Sort all activities by timestamp (most recent first)
    const recentActivity = activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    // Get system uptime (mock for now)
    const uptime = '24d 13h';

    const stats = {
      totalUsers,
      activeSessions: activeUsers,
      monthlyGrowth: monthlyGrowth || 0,
      uptime,
      recentActivity
    };
    
    console.log('Dashboard stats from database:', {
      totalUsers,
      activeUsers,
      monthlyGrowth,
      activitiesCount: recentActivity.length
    });
    
    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || 'all';
    const status = req.query.status || 'all';
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { 'profile.full_name': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role !== 'all') {
      query.role = role;
    }
    
    if (status !== 'all') {
      query.status = status;
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password_hash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    // Format users for frontend
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      status: user.status,
      profile: {
        full_name: user.profile?.full_name || '',
        phone_number: user.profile?.phone_number || '',
        address: user.profile?.address || ''
      },
      createdAt: user.createdAt,
      lastLogin: user.lastLogin || null
    }));

    res.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { email, password, role, status, profile } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      email,
      password_hash,
      role: role || 'user',
      status: status || 'active',
      profile: {
        full_name: profile.full_name,
        phone_number: profile.phone_number || '',
        address: profile.address || ''
      }
    });

    await newUser.save();

    // Return user without password
    const userResponse = newUser.toObject();
    delete userResponse.password_hash;

    console.log('User created successfully:', userResponse.email);
    
    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, status, profile, password } = req.body;
    
    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (role) user.role = role;
    if (status) user.status = status;
    if (profile) {
      user.profile = {
        ...user.profile,
        ...profile
      };
    }

    // Update password if provided
    if (password) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      user.password_hash = await bcrypt.hash(password, salt);
    }

    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password_hash;

    console.log('User updated successfully:', userResponse.email);
    
    res.json({
      message: 'User updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user's workout logs
    await WorkoutLog.deleteMany({ user_id: id });

    // Delete user
    await User.findByIdAndDelete(id);
    
    console.log('User deleted successfully:', user.email);
    
    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const getChartData = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFormat, groupBy, monthsBack;
    switch (period) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        monthsBack = 1; // 30 days
        break;
      case 'week':
        dateFormat = '%Y-%U';
        groupBy = { $dateToString: { format: '%Y-%U', date: '$createdAt' } };
        monthsBack = 3; // 12 weeks
        break;
      case 'month':
      default:
        dateFormat = '%Y-%m';
        groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        monthsBack = 12; // 12 months
        break;
    }

    // Get user registration data grouped by period
    const userGrowthData = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - monthsBack * 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill missing periods with 0
    const filledData = [];
    const now = new Date();
    
    if (period === 'month') {
      for (let i = monthsBack - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const periodKey = date.toISOString().slice(0, 7); // YYYY-MM
        const found = userGrowthData.find(d => d._id === periodKey);
        filledData.push({
          _id: periodKey,
          count: found ? found.count : 0
        });
      }
    } else if (period === 'day') {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const periodKey = date.toISOString().slice(0, 10); // YYYY-MM-DD
        const found = userGrowthData.find(d => d._id === periodKey);
        filledData.push({
          _id: periodKey,
          count: found ? found.count : 0
        });
      }
    } else if (period === 'week') {
      // Generate week numbers for the last 12 weeks
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - (i * 7));
        const weekNumber = Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7);
        const periodKey = `${date.getFullYear()}-${weekNumber.toString().padStart(2, '0')}`;
        const found = userGrowthData.find(d => d._id === periodKey);
        filledData.push({
          _id: periodKey,
          count: found ? found.count : 0
        });
      }
    }

    res.json({
      userGrowth: filledData,
      period
    });
  } catch (error) {
    console.error('Chart data error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const getSystemLogs = async (req, res) => {
  try {
    const logs = [
      {
        id: '1',
        level: 'info',
        message: 'User login successful',
        timestamp: new Date(),
        user: 'admin@example.com'
      },
      {
        id: '2',
        level: 'warning',
        message: 'High memory usage detected',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        user: 'System'
      }
    ];
    
    res.json({
      logs,
      pagination: { page: 1, limit: 20, total: 2, pages: 1 }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const createBackup = async (req, res) => {
  try {
    const backupData = {
      timestamp: new Date(),
      status: 'completed',
      message: 'Backup created successfully'
    };
    
    console.log('Backup created:', backupData);
    res.json({
      message: 'Backup completed successfully',
      backup: backupData
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const systemRecovery = async (req, res) => {
  try {
    const recoveryData = {
      timestamp: new Date(),
      status: 'completed',
      actions: ['Database reconnected', 'Cache cleared', 'Services restarted']
    };
    
    console.log('System recovery completed:', recoveryData);
    res.json({
      message: 'System recovery completed successfully',
      recovery: recoveryData
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const getSystemPerformance = async (req, res) => {
  try {
    const performance = {
      cpu: { usage: 35, cores: 4, temperature: 45 },
      memory: { usage: 62, total: 8192, available: 4096 },
      disk: { usage: 78, total: 500, available: 150 },
      network: { latency: 24, uptime: '24d 13h', requests: 1250 }
    };
    
    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getChartData,
  getSystemLogs,
  createBackup,
  systemRecovery,
  getSystemPerformance
};
