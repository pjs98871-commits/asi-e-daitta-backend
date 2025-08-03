const { body, param, query } = require('express-validator');

const createAdminValidator = [
  body('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  
  body('permissions')
    .optional()
    .isObject()
    .withMessage('Permissions must be an object'),
  
  body('department')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Department must be between 1 and 50 characters'),
  
  body('position')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Position must be between 1 and 50 characters'),
  
  body('accessLevel')
    .isIn(['read_only', 'moderator', 'admin', 'super_admin'])
    .withMessage('Access level must be read_only, moderator, admin, or super_admin'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
];

const updateAdminValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Admin ID must be a positive integer'),
  
  body('permissions')
    .optional()
    .isObject()
    .withMessage('Permissions must be an object'),
  
  body('department')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Department must be between 1 and 50 characters'),
  
  body('position')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Position must be between 1 and 50 characters'),
  
  body('accessLevel')
    .optional()
    .isIn(['read_only', 'moderator', 'admin', 'super_admin'])
    .withMessage('Access level must be read_only, moderator, admin, or super_admin'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Active status must be a boolean value'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
];

const adminIdValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Admin ID must be a positive integer'),
];

const adminQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('accessLevel')
    .optional()
    .isIn(['read_only', 'moderator', 'admin', 'super_admin'])
    .withMessage('Access level must be read_only, moderator, admin, or super_admin'),
  
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('Active status must be a boolean value'),
  
  query('department')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Department must be between 1 and 50 characters'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'accessLevel', 'lastAccessAt'])
    .withMessage('Sort by must be createdAt, updatedAt, accessLevel, or lastAccessAt'),
  
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be ASC or DESC'),
];

const updatePermissionsValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Admin ID must be a positive integer'),
  
  body('permissions')
    .isObject()
    .withMessage('Permissions must be an object')
    .custom((value) => {
      const validResources = ['users', 'subscriptions', 'contacts', 'admin'];
      const validActions = ['read', 'write', 'delete'];
      
      for (const resource in value) {
        if (!validResources.includes(resource)) {
          throw new Error(`Invalid resource: ${resource}`);
        }
        
        if (!value[resource] || typeof value[resource] !== 'object') {
          throw new Error(`Permissions for ${resource} must be an object`);
        }
        
        for (const action in value[resource]) {
          if (!validActions.includes(action)) {
            throw new Error(`Invalid action: ${action} for resource: ${resource}`);
          }
          
          if (typeof value[resource][action] !== 'boolean') {
            throw new Error(`Permission ${resource}.${action} must be a boolean`);
          }
        }
      }
      
      return true;
    }),
];

const userIdValidator = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
];

module.exports = {
  createAdminValidator,
  updateAdminValidator,
  adminIdValidator,
  adminQueryValidator,
  updatePermissionsValidator,
  userIdValidator,
};