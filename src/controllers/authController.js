const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User } = require('../models');
const { generateToken, generateRefreshToken } = require('../middlewares/auth');
const logger = require('../config/logger');

// 회원가입
const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phoneNumber } = req.body;

    // 기존 사용자 확인
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists',
      });
    }

    // 새 사용자 생성
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      emailVerificationToken: crypto.randomBytes(32).toString('hex'),
    });

    // 토큰 생성
    const token = generateToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id });

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toJSON(),
        token,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
};

// 로그인
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 사용자 찾기
    const user = await User.findOne({ where: { email } });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or inactive account',
      });
    }

    // 비밀번호 확인
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // 마지막 로그인 시간 업데이트
    await user.update({ lastLoginAt: new Date() });

    // 토큰 생성
    const token = generateToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id });

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

// 프로필 조회
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { user: user.toJSON() },
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message,
    });
  }
};

// 프로필 업데이트
const updateProfile = async (req, res) => {
  try {
    const { username, email, firstName, lastName, phoneNumber } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // 이메일 또는 사용자명 중복 확인
    if (email !== user.email || username !== user.username) {
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ email }, { username }],
          id: { [Op.ne]: user.id }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email or username already exists',
        });
      }
    }

    // 프로필 업데이트
    await user.update({
      username: username || user.username,
      email: email || user.email,
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      phoneNumber: phoneNumber || user.phoneNumber,
    });

    logger.info(`Profile updated for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: user.toJSON() },
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

// 비밀번호 변경
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // 현재 비밀번호 확인
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // 새 비밀번호로 업데이트
    await user.update({ password: newPassword });

    logger.info(`Password changed for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message,
    });
  }
};

// 토큰 새로고침
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // 리프레시 토큰 검증
    const jwt = require('jsonwebtoken');
    const config = require('../config');
    
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    // 새 토큰 생성
    const newToken = generateToken({ id: user.id, email: user.email });
    const newRefreshToken = generateRefreshToken({ id: user.id });

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }
};

// 로그아웃
const logout = async (req, res) => {
  try {
    // 클라이언트에서 토큰을 삭제하도록 지시
    logger.info(`User logged out: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  logout,
};