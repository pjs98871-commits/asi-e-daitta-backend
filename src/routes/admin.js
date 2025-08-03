const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin, requirePermission } = require('../middlewares/auth');
const { handleValidationErrors } = require('../middlewares/validation');
const {
  createAdminValidator,
  updateAdminValidator,
  adminIdValidator,
  adminQueryValidator,
  updatePermissionsValidator,
  userIdValidator,
} = require('../validators/adminValidator');

// 대시보드 통계 (관리자만)
router.get('/dashboard/stats', authenticateToken, requireAdmin, adminController.getDashboardStats);

// 마지막 접근 시간 업데이트 (관리자만)
router.post('/access', authenticateToken, requireAdmin, adminController.updateLastAccess);

// 사용자 관리 API (관리자만)
router.get('/users', authenticateToken, requireAdmin, adminController.getUsers);
router.get('/users/:id', authenticateToken, requireAdmin, adminController.getUserById);
router.put('/users/:id', authenticateToken, requireAdmin, adminController.updateUser);
router.delete('/users/:id', authenticateToken, requireAdmin, adminController.deleteUser);

// 관리자 생성 (관리자만, admin 권한 필요)
router.post('/', authenticateToken, requireAdmin, requirePermission('admin', 'write'), createAdminValidator, handleValidationErrors, adminController.createAdmin);

// 관리자 목록 조회 (관리자만, admin 권한 필요)
router.get('/', authenticateToken, requireAdmin, requirePermission('admin', 'read'), adminQueryValidator, handleValidationErrors, adminController.getAdmins);

// 관리자 상세 조회 (관리자만, admin 권한 필요)
router.get('/:id', authenticateToken, requireAdmin, requirePermission('admin', 'read'), adminIdValidator, handleValidationErrors, adminController.getAdminById);

// 사용자별 관리자 프로필 조회 (관리자만, admin 권한 필요)
router.get('/user/:userId', authenticateToken, requireAdmin, requirePermission('admin', 'read'), userIdValidator, handleValidationErrors, adminController.getAdminByUserId);

// 관리자 업데이트 (관리자만, admin 권한 필요)
router.put('/:id', authenticateToken, requireAdmin, requirePermission('admin', 'write'), updateAdminValidator, handleValidationErrors, adminController.updateAdmin);

// 관리자 권한 업데이트 (관리자만, admin 권한 필요)
router.put('/:id/permissions', authenticateToken, requireAdmin, requirePermission('admin', 'write'), updatePermissionsValidator, handleValidationErrors, adminController.updateAdminPermissions);

// 관리자 삭제 (관리자만, admin 권한 필요)
router.delete('/:id', authenticateToken, requireAdmin, requirePermission('admin', 'delete'), adminIdValidator, handleValidationErrors, adminController.deleteAdmin);

module.exports = router;