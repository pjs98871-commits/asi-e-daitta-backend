const { body, param, query } = require('express-validator');

const createSubscriptionValidator = [
  body('planType')
    .isIn(['basic', 'premium', 'enterprise'])
    .withMessage('Plan type must be basic, premium, or enterprise'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('currency')
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-character code')
    .isAlpha()
    .withMessage('Currency must contain only letters'),
  
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  
  body('renewalDate')
    .optional()
    .isISO8601()
    .withMessage('Renewal date must be a valid date'),
  
  body('paymentMethod')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Payment method must be between 1 and 50 characters'),
  
  body('paymentId')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Payment ID must be between 1 and 255 characters'),
  
  body('isAutoRenewal')
    .optional()
    .isBoolean()
    .withMessage('Auto renewal must be a boolean value'),
  
  body('features')
    .optional()
    .isObject()
    .withMessage('Features must be an object'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
];

const updateSubscriptionValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Subscription ID must be a positive integer'),
  
  body('planType')
    .optional()
    .isIn(['basic', 'premium', 'enterprise'])
    .withMessage('Plan type must be basic, premium, or enterprise'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'cancelled', 'expired', 'suspended'])
    .withMessage('Status must be active, inactive, cancelled, expired, or suspended'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-character code')
    .isAlpha()
    .withMessage('Currency must contain only letters'),
  
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  
  body('renewalDate')
    .optional()
    .isISO8601()
    .withMessage('Renewal date must be a valid date'),
  
  body('paymentMethod')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Payment method must be between 1 and 50 characters'),
  
  body('paymentId')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Payment ID must be between 1 and 255 characters'),
  
  body('isAutoRenewal')
    .optional()
    .isBoolean()
    .withMessage('Auto renewal must be a boolean value'),
  
  body('features')
    .optional()
    .isObject()
    .withMessage('Features must be an object'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
];

const subscriptionIdValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Subscription ID must be a positive integer'),
];

const subscriptionQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('planType')
    .optional()
    .isIn(['basic', 'premium', 'enterprise'])
    .withMessage('Plan type must be basic, premium, or enterprise'),
  
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'cancelled', 'expired', 'suspended'])
    .withMessage('Status must be active, inactive, cancelled, expired, or suspended'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'startDate', 'endDate', 'price'])
    .withMessage('Sort by must be createdAt, updatedAt, startDate, endDate, or price'),
  
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be ASC or DESC'),
];

const cancelSubscriptionValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Subscription ID must be a positive integer'),
  
  body('reason')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('Reason must be between 1 and 500 characters'),
];

module.exports = {
  createSubscriptionValidator,
  updateSubscriptionValidator,
  subscriptionIdValidator,
  subscriptionQueryValidator,
  cancelSubscriptionValidator,
};