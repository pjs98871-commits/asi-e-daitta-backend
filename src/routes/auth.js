const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');
const { handleValidationErrors } = require('../middlewares/validation');
const {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  changePasswordValidator,
  refreshTokenValidator,
} = require('../validators/authValidator');

// 회원가입
router.post('/register', registerValidator, handleValidationErrors, authController.register);

// 로그인
router.post('/login', loginValidator, handleValidationErrors, authController.login);

// 토큰 새로고침
router.post('/refresh', refreshTokenValidator, handleValidationErrors, authController.refreshToken);

// 로그아웃 (인증 필요)
router.post('/logout', authenticateToken, authController.logout);

// 프로필 조회 (인증 필요)
router.get('/profile', authenticateToken, authController.getProfile);

// 프로필 업데이트 (인증 필요)
router.put('/profile', authenticateToken, updateProfileValidator, handleValidationErrors, authController.updateProfile);

// 비밀번호 변경 (인증 필요)
router.put('/change-password', authenticateToken, changePasswordValidator, handleValidationErrors, authController.changePassword);

module.exports = router;