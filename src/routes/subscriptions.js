const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken, requireAdmin, requirePermission } = require('../middlewares/auth');
const { handleValidationErrors } = require('../middlewares/validation');
const {
  createSubscriptionValidator,
  updateSubscriptionValidator,
  subscriptionIdValidator,
  subscriptionQueryValidator,
  cancelSubscriptionValidator,
} = require('../validators/subscriptionValidator');

// 뉴스레터 구독 (인증 불필요)
router.post('/newsletter', subscriptionController.subscribeNewsletter);

// 내 구독 조회 (인증된 사용자만)
router.get('/my', authenticateToken, subscriptionController.getMySubscriptions);

// 구독 생성 (인증된 사용자만)
router.post('/', authenticateToken, createSubscriptionValidator, handleValidationErrors, subscriptionController.createSubscription);

// 구독 목록 조회 (관리자는 모든 구독, 일반 사용자는 자신의 구독만)
router.get('/', authenticateToken, subscriptionQueryValidator, handleValidationErrors, subscriptionController.getSubscriptions);

// 구독 상세 조회
router.get('/:id', authenticateToken, subscriptionIdValidator, handleValidationErrors, subscriptionController.getSubscriptionById);

// 구독 업데이트 (소유자 또는 관리자만)
router.put('/:id', authenticateToken, updateSubscriptionValidator, handleValidationErrors, subscriptionController.updateSubscription);

// 구독 취소 (소유자 또는 관리자만)
router.post('/:id/cancel', authenticateToken, cancelSubscriptionValidator, handleValidationErrors, subscriptionController.cancelSubscription);

// 구독 갱신 (소유자 또는 관리자만)
router.post('/:id/renew', authenticateToken, subscriptionIdValidator, handleValidationErrors, subscriptionController.renewSubscription);

// 구독 삭제 (관리자만)
router.delete('/:id', authenticateToken, requireAdmin, requirePermission('subscriptions', 'delete'), subscriptionIdValidator, handleValidationErrors, subscriptionController.deleteSubscription);

module.exports = router;