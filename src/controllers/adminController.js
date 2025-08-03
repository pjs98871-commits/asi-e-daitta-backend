const { Admin, User, Subscription, Contact } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

// 관리자 생성
const createAdmin = async (req, res) => {
  try {
    const {
      userId,
      permissions,
      department,
      position,
      accessLevel,
      notes,
    } = req.body;

    // 사용자가 존재하는지 확인
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // 이미 관리자인지 확인
    const existingAdmin = await Admin.findOne({ where: { userId } });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'User is already an admin',
      });
    }

    // 기본 권한 설정
    const defaultPermissions = {
      users: { read: true, write: false, delete: false },
      subscriptions: { read: true, write: false, delete: false },
      contacts: { read: true, write: true, delete: false },
      admin: { read: false, write: false, delete: false },
    };

    const admin = await Admin.create({
      userId,
      permissions: permissions || defaultPermissions,
      department,
      position,
      accessLevel,
      notes,
      createdBy: req.user.id,
    });

    // 사용자 역할을 admin으로 업데이트
    await user.update({ role: 'admin' });

    logger.info(`New admin created: ${admin.id} for user: ${userId}`);

    const adminWithUser = await Admin.findByPk(admin.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'firstName', 'lastName'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: { admin: adminWithUser },
    });
  } catch (error) {
    logger.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin',
      error: error.message,
    });
  }
};

// 관리자 목록 조회
const getAdmins = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      accessLevel,
      isActive,
      department,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // 필터링
    if (accessLevel) where.accessLevel = accessLevel;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (department) where.department = department;

    const { count, rows } = await Admin.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'lastLoginAt'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName'],
          required: false,
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
    });

    res.json({
      success: true,
      data: {
        admins: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admins',
      error: error.message,
    });
  }
};

// 관리자 상세 조회
const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'lastLoginAt'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName'],
          required: false,
        },
      ],
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    res.json({
      success: true,
      data: { admin },
    });
  } catch (error) {
    logger.error('Get admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin',
      error: error.message,
    });
  }
};

// 관리자 업데이트
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      permissions,
      department,
      position,
      accessLevel,
      isActive,
      notes,
    } = req.body;

    const admin = await Admin.findByPk(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    const updateData = {};
    if (permissions) updateData.permissions = permissions;
    if (department) updateData.department = department;
    if (position) updateData.position = position;
    if (accessLevel) updateData.accessLevel = accessLevel;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (notes) updateData.notes = notes;

    await admin.update(updateData);

    // 액세스 레벨에 따라 사용자 역할 업데이트
    if (accessLevel) {
      const user = await User.findByPk(admin.userId);
      if (user) {
        const role = accessLevel === 'super_admin' ? 'admin' : 'admin';
        await user.update({ role });
      }
    }

    logger.info(`Admin updated: ${admin.id}`);

    const updatedAdmin = await Admin.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'firstName', 'lastName'],
        },
      ],
    });

    res.json({
      success: true,
      message: 'Admin updated successfully',
      data: { admin: updatedAdmin },
    });
  } catch (error) {
    logger.error('Update admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admin',
      error: error.message,
    });
  }
};

// 관리자 권한 업데이트
const updateAdminPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    const admin = await Admin.findByPk(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    await admin.update({ permissions });

    logger.info(`Admin permissions updated: ${admin.id}`);

    res.json({
      success: true,
      message: 'Admin permissions updated successfully',
      data: { admin },
    });
  } catch (error) {
    logger.error('Update admin permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admin permissions',
      error: error.message,
    });
  }
};

// 관리자 삭제
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findByPk(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    // 사용자 역할을 일반 사용자로 변경
    const user = await User.findByPk(admin.userId);
    if (user) {
      await user.update({ role: 'user' });
    }

    await admin.destroy();

    logger.info(`Admin deleted: ${id}`);

    res.json({
      success: true,
      message: 'Admin deleted successfully',
    });
  } catch (error) {
    logger.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete admin',
      error: error.message,
    });
  }
};

// 사용자별 관리자 프로필 조회
const getAdminByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const admin = await Admin.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'firstName', 'lastName'],
        },
      ],
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin profile not found',
      });
    }

    res.json({
      success: true,
      data: { admin },
    });
  } catch (error) {
    logger.error('Get admin by user ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin profile',
      error: error.message,
    });
  }
};

// 대시보드 통계
const getDashboardStats = async (req, res) => {
  try {
    // 사용자 통계
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const newUsersThisMonth = await User.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    // 구독 통계
    const totalSubscriptions = await Subscription.count();
    const activeSubscriptions = await Subscription.count({ where: { status: 'active' } });
    const subscriptionRevenue = await Subscription.sum('price', {
      where: { status: 'active' },
    });

    // 문의사항 통계
    const totalContacts = await Contact.count();
    const newContacts = await Contact.count({ where: { status: 'new' } });
    const resolvedContacts = await Contact.count({ where: { status: 'resolved' } });

    // 관리자 통계
    const totalAdmins = await Admin.count();
    const activeAdmins = await Admin.count({ where: { isActive: true } });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          newThisMonth: newUsersThisMonth,
        },
        subscriptions: {
          total: totalSubscriptions,
          active: activeSubscriptions,
          revenue: subscriptionRevenue || 0,
        },
        contacts: {
          total: totalContacts,
          new: newContacts,
          resolved: resolvedContacts,
          resolutionRate: totalContacts > 0 ? ((resolvedContacts / totalContacts) * 100).toFixed(2) : 0,
        },
        admins: {
          total: totalAdmins,
          active: activeAdmins,
        },
      },
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics',
      error: error.message,
    });
  }
};

// 마지막 접근 시간 업데이트
const updateLastAccess = async (req, res) => {
  try {
    const adminUserId = req.user.id;

    const admin = await Admin.findOne({ where: { userId: adminUserId } });

    if (admin) {
      await admin.update({ lastAccessAt: new Date() });
    }

    res.json({
      success: true,
      message: 'Last access time updated',
    });
  } catch (error) {
    logger.error('Update last access error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update last access time',
      error: error.message,
    });
  }
};

// 사용자 목록 조회 (관리자용)
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      role,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // 검색 조건
    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
      ];
    }

    // 필터링
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (role) where.role = role;

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Admin,
          as: 'adminProfile',
          required: false,
          attributes: ['id', 'accessLevel', 'department', 'position', 'isActive'],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
    });

    res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message,
    });
  }
};

// 사용자 상세 조회 (관리자용)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Admin,
          as: 'adminProfile',
          required: false,
        },
        {
          model: Subscription,
          as: 'subscriptions',
          limit: 5,
          order: [['createdAt', 'DESC']],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error.message,
    });
  }
};

// 사용자 업데이트 (관리자용)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, role, notes } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (role) updateData.role = role;
    if (notes !== undefined) updateData.notes = notes;

    await user.update(updateData);

    logger.info(`User updated by admin: ${user.id}`);

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Admin,
          as: 'adminProfile',
          required: false,
        },
      ],
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message,
    });
  }
};

// 사용자 삭제 (관리자용)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // 관리자인 경우 관리자 프로필도 삭제
    if (user.role === 'admin') {
      await Admin.destroy({ where: { userId: id } });
    }

    // 사용자 관련 데이터 처리 (구독, 문의사항 등)
    await Subscription.destroy({ where: { userId: id } });
    await Contact.update({ userId: null }, { where: { userId: id } });

    await user.destroy();

    logger.info(`User deleted by admin: ${id}`);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
    });
  }
};

module.exports = {
  createAdmin,
  getAdmins,
  getAdminById,
  updateAdmin,
  updateAdminPermissions,
  deleteAdmin,
  getAdminByUserId,
  getDashboardStats,
  updateLastAccess,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};