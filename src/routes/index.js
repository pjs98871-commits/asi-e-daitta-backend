const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const subscriptionRoutes = require('./subscriptions');
const contactRoutes = require('./contacts');
const adminRoutes = require('./admin');

// API 정보 엔드포인트
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ASI e DAITTA Backend API',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      auth: '/api/v1/auth',
      subscriptions: '/api/v1/subscriptions',
      contacts: '/api/v1/contacts',
      admin: '/api/v1/admin',
    },
    documentation: '/api-docs',
  });
});

// 라우트 등록
router.use('/auth', authRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/contacts', contactRoutes);
router.use('/admin', adminRoutes);

module.exports = router;