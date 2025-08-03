const jwt = require('jsonwebtoken');
const { User, Admin } = require('../models');
const config = require('../config');
const logger = require('../config/logger');

// JWT 토큰 생성
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

// 리프레시 토큰 생성
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

// 기본 인증 미들웨어
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive user',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
};

// 관리자 권한 확인 미들웨어
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // 사용자 역할이 관리자인지 확인
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    // Admin 테이블에서 관리자 프로필 조회 (있으면 포함, 없어도 진행)
    let admin = await Admin.findOne({
      where: { userId: req.user.id },
      include: [{ model: User, as: 'user' }],
    });

    // Admin 프로필이 없으면 기본 관리자 프로필 생성
    if (!admin) {
      try {
        admin = await Admin.create({
          userId: req.user.id,
          accessLevel: 'admin',
          department: 'IT',
          position: 'Administrator',
          permissions: {
            users: { read: true, write: true, delete: true },
            subscriptions: { read: true, write: true, delete: false },
            contacts: { read: true, write: true, delete: false },
            admin: { read: true, write: false, delete: false },
          },
          isActive: true,
          createdBy: req.user.id,
        });

        admin = await Admin.findByPk(admin.id, {
          include: [{ model: User, as: 'user' }],
        });
      } catch (error) {
        // If creation fails due to unique constraint, try to find it again
        if (error.name === 'SequelizeUniqueConstraintError') {
          admin = await Admin.findOne({
            where: { userId: req.user.id },
            include: [{ model: User, as: 'user' }],
          });
        } else {
          throw error;
        }
      }
    }

    req.admin = admin;
    next();
  } catch (error) {
    logger.error('Admin authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization error',
    });
  }
};

// 권한 확인 미들웨어
const requirePermission = (resource, action) => {
  return (req, res, next) => {
    try {
      if (!req.admin) {
        return res.status(403).json({
          success: false,
          message: 'Admin access required',
        });
      }

      const permissions = req.admin.permissions;
      
      // 권한이 정의되어 있지 않거나 허용되지 않은 경우
      if (!permissions || !permissions[resource] || !permissions[resource][action]) {
        // 슈퍼 관리자이거나 기본 관리자 권한인 경우 허용
        if (req.admin.accessLevel === 'super_admin' || req.user.role === 'admin') {
          return next();
        }
        
        return res.status(403).json({
          success: false,
          message: `Permission denied: ${resource}.${action}`,
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
      });
    }
  };
};

// 역할 확인 미들웨어
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient role permissions',
      });
    }

    next();
  };
};

// 선택적 인증 미들웨어
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findByPk(decoded.id);
      
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // 선택적 인증이므로 에러 무시하고 계속 진행
    next();
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  authenticateToken,
  requireAdmin,
  requirePermission,
  requireRole,
  optionalAuth,
};