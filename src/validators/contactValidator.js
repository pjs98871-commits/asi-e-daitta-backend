const { body, param, query } = require('express-validator');

const createContactValidator = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\u00C0-\u017F]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('phoneNumber')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('company')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Company name must be between 1 and 100 characters'),
  
  body('subject')
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  
  body('message')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Message must be between 10 and 5000 characters'),
  
  body('category')
    .isIn(['general', 'support', 'sales', 'technical', 'billing', 'feedback'])
    .withMessage('Category must be general, support, sales, technical, billing, or feedback'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
];

const updateContactValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Contact ID must be a positive integer'),
  
  body('status')
    .optional()
    .isIn(['new', 'in_progress', 'resolved', 'closed'])
    .withMessage('Status must be new, in_progress, resolved, or closed'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  
  body('assignedTo')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Assigned to must be a valid user ID'),
  
  body('responseMessage')
    .optional()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Response message must be between 1 and 5000 characters'),
];

const contactIdValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Contact ID must be a positive integer'),
];

const contactQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('category')
    .optional()
    .isIn(['general', 'support', 'sales', 'technical', 'billing', 'feedback'])
    .withMessage('Category must be general, support, sales, technical, billing, or feedback'),
  
  query('status')
    .optional()
    .isIn(['new', 'in_progress', 'resolved', 'closed'])
    .withMessage('Status must be new, in_progress, resolved, or closed'),
  
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'priority', 'status'])
    .withMessage('Sort by must be createdAt, updatedAt, priority, or status'),
  
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be ASC or DESC'),
  
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
];

const respondToContactValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Contact ID must be a positive integer'),
  
  body('responseMessage')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Response message must be between 1 and 5000 characters'),
  
  body('status')
    .optional()
    .isIn(['in_progress', 'resolved'])
    .withMessage('Status must be in_progress or resolved'),
];

const assignContactValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Contact ID must be a positive integer'),
  
  body('assignedTo')
    .isInt({ min: 1 })
    .withMessage('Assigned to must be a valid user ID'),
];

module.exports = {
  createContactValidator,
  updateContactValidator,
  contactIdValidator,
  contactQueryValidator,
  respondToContactValidator,
  assignContactValidator,
};