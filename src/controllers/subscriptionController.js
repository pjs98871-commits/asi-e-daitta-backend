const { Subscription, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

// 뉴스레터 구독 (인증 불필요)
const subscribeNewsletter = async (req, res) => {
  try {
    const { email, subscriptionType = 'newsletter' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // 이메일 유효성 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // 기존 구독 확인
    const existingSubscription = await Subscription.findOne({
      where: {
        email,
        planType: subscriptionType,
        status: 'active',
      },
    });

    if (existingSubscription) {
      return res.status(200).json({
        success: true,
        message: 'Already subscribed to newsletter',
        data: { subscription: existingSubscription },
      });
    }

    // 새 구독 생성 (사용자 없이)
    const subscription = await Subscription.create({
      email,
      planType: subscriptionType,
      price: 0,
      currency: 'USD',
      status: 'active',
      startDate: new Date(),
    });

    logger.info(`Newsletter subscription created for: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Newsletter subscription successful',
      data: { subscription },
    });
  } catch (error) {
    logger.error('Newsletter subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe to newsletter',
      error: error.message,
    });
  }
};

// 구독 생성
const createSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      planType,
      price,
      currency,
      endDate,
      renewalDate,
      paymentMethod,
      paymentId,
      isAutoRenewal,
      features,
      notes,
    } = req.body;

    // 기존 활성 구독 확인
    const existingSubscription = await Subscription.findOne({
      where: {
        userId,
        status: 'active',
      },
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'User already has an active subscription',
      });
    }

    // 새 구독 생성
    const subscription = await Subscription.create({
      userId,
      planType,
      price,
      currency,
      endDate,
      renewalDate,
      paymentMethod,
      paymentId,
      isAutoRenewal,
      features,
      notes,
    });

    logger.info(`New subscription created: ${subscription.id} for user: ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: { subscription },
    });
  } catch (error) {
    logger.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      error: error.message,
    });
  }
};

// 구독 목록 조회
const getSubscriptions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      planType,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // 필터링
    if (planType) where.planType = planType;
    if (status) where.status = status;

    // 일반 사용자는 자신의 구독만 조회
    if (req.user.role === 'user') {
      where.userId = req.user.id;
    }

    const { count, rows } = await Subscription.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'firstName', 'lastName'],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
    });

    res.json({
      success: true,
      data: {
        subscriptions: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscriptions',
      error: error.message,
    });
  }
};

// 구독 상세 조회
const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const where = { id };

    // 일반 사용자는 자신의 구독만 조회
    if (req.user.role === 'user') {
      where.userId = req.user.id;
    }

    const subscription = await Subscription.findOne({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'firstName', 'lastName'],
        },
      ],
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    res.json({
      success: true,
      data: { subscription },
    });
  } catch (error) {
    logger.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription',
      error: error.message,
    });
  }
};

// 구독 업데이트
const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const where = { id };

    // 일반 사용자는 자신의 구독만 수정
    if (req.user.role === 'user') {
      where.userId = req.user.id;
      // 일반 사용자는 특정 필드만 수정 가능
      const allowedFields = ['isAutoRenewal', 'notes'];
      const filteredData = {};
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      }
      updateData = filteredData;
    }

    const subscription = await Subscription.findOne({ where });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    await subscription.update(updateData);

    logger.info(`Subscription updated: ${subscription.id}`);

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: { subscription },
    });
  } catch (error) {
    logger.error('Update subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription',
      error: error.message,
    });
  }
};

// 구독 취소
const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const where = { id };

    // 일반 사용자는 자신의 구독만 취소
    if (req.user.role === 'user') {
      where.userId = req.user.id;
    }

    const subscription = await Subscription.findOne({ where });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    if (subscription.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is already cancelled',
      });
    }

    await subscription.update({
      status: 'cancelled',
      notes: reason ? `${subscription.notes || ''}\nCancellation reason: ${reason}` : subscription.notes,
    });

    logger.info(`Subscription cancelled: ${subscription.id}`);

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: { subscription },
    });
  } catch (error) {
    logger.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error.message,
    });
  }
};

// 구독 삭제 (관리자만)
const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findByPk(id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    await subscription.destroy();

    logger.info(`Subscription deleted: ${id}`);

    res.json({
      success: true,
      message: 'Subscription deleted successfully',
    });
  } catch (error) {
    logger.error('Delete subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete subscription',
      error: error.message,
    });
  }
};

// 내 구독 조회 (현재 사용자)
const getMySubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscriptions = await Subscription.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: { subscriptions },
    });
  } catch (error) {
    logger.error('Get my subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscriptions',
      error: error.message,
    });
  }
};

// 구독 갱신
const renewSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { endDate, renewalDate, price, paymentId } = req.body;
    const where = { id };

    // 일반 사용자는 자신의 구독만 갱신
    if (req.user.role === 'user') {
      where.userId = req.user.id;
    }

    const subscription = await Subscription.findOne({ where });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    const updateData = {
      status: 'active',
      endDate: endDate || subscription.endDate,
      renewalDate: renewalDate || subscription.renewalDate,
    };

    if (price) updateData.price = price;
    if (paymentId) updateData.paymentId = paymentId;

    await subscription.update(updateData);

    logger.info(`Subscription renewed: ${subscription.id}`);

    res.json({
      success: true,
      message: 'Subscription renewed successfully',
      data: { subscription },
    });
  } catch (error) {
    logger.error('Renew subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to renew subscription',
      error: error.message,
    });
  }
};

module.exports = {
  subscribeNewsletter,
  createSubscription,
  getSubscriptions,
  getSubscriptionById,
  updateSubscription,
  cancelSubscription,
  deleteSubscription,
  getMySubscriptions,
  renewSubscription,
};