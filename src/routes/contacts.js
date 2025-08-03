const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticateToken, requireAdmin, requirePermission, optionalAuth } = require('../middlewares/auth');
const { handleValidationErrors } = require('../middlewares/validation');
const {
  createContactValidator,
  updateContactValidator,
  contactIdValidator,
  contactQueryValidator,
  respondToContactValidator,
  assignContactValidator,
} = require('../validators/contactValidator');

// 문의사항 생성 (인증 선택사항)
router.post('/', optionalAuth, createContactValidator, handleValidationErrors, contactController.createContact);

// 문의사항 목록 조회 (관리자만)
router.get('/', authenticateToken, requireAdmin, requirePermission('contacts', 'read'), contactQueryValidator, handleValidationErrors, contactController.getContacts);

// 내가 할당받은 문의사항 조회 (관리자만)
router.get('/assigned', authenticateToken, requireAdmin, contactController.getMyAssignedContacts);

// 문의사항 통계 (관리자만)
router.get('/stats', authenticateToken, requireAdmin, requirePermission('contacts', 'read'), contactController.getContactStats);

// 문의사항 상세 조회 (관리자만)
router.get('/:id', authenticateToken, requireAdmin, requirePermission('contacts', 'read'), contactIdValidator, handleValidationErrors, contactController.getContactById);

// 문의사항 업데이트 (관리자만)
router.put('/:id', authenticateToken, requireAdmin, requirePermission('contacts', 'write'), updateContactValidator, handleValidationErrors, contactController.updateContact);

// 문의사항에 응답 (관리자만)
router.post('/:id/respond', authenticateToken, requireAdmin, requirePermission('contacts', 'write'), respondToContactValidator, handleValidationErrors, contactController.respondToContact);

// 문의사항 할당 (관리자만)
router.post('/:id/assign', authenticateToken, requireAdmin, requirePermission('contacts', 'write'), assignContactValidator, handleValidationErrors, contactController.assignContact);

// 문의사항 삭제 (관리자만)
router.delete('/:id', authenticateToken, requireAdmin, requirePermission('contacts', 'delete'), contactIdValidator, handleValidationErrors, contactController.deleteContact);

module.exports = router;