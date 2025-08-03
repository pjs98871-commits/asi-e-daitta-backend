const { validationResult } = require('express-validator');
const logger = require('../config/logger');

// 유효성 검사 결과 처리 미들웨어
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));

    logger.warn('Validation errors:', errorMessages);

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages,
    });
  }

  next();
};

// 요청 크기 제한 미들웨어
const limitRequestSize = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.get('Content-Length');
    
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      const maxSizeNum = parseInt(maxSize.replace('mb', ''));
      
      if (sizeInMB > maxSizeNum) {
        return res.status(413).json({
          success: false,
          message: `Request too large. Maximum size is ${maxSize}`,
        });
      }
    }

    next();
  };
};

// 파일 업로드 유효성 검사
const validateFileUpload = (options = {}) => {
  const {
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
    maxSize = 5 * 1024 * 1024, // 5MB
    required = false,
  } = options;

  return (req, res, next) => {
    if (!req.file && required) {
      return res.status(400).json({
        success: false,
        message: 'File is required',
      });
    }

    if (req.file) {
      // 파일 타입 검사
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        });
      }

      // 파일 크기 검사
      if (req.file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB`,
        });
      }
    }

    next();
  };
};

// SQL 인젝션 방지
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // 기본적인 SQL 인젝션 패턴 제거
        obj[key] = obj[key]
          .replace(/['"`;]/g, '')
          .replace(/(\b(ALTER|CREATE|DELETE|DROP|EXEC|INSERT|SELECT|UNION|UPDATE)\b)/gi, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

// XSS 방지
const preventXSS = (req, res, next) => {
  const escape = (str) => {
    if (typeof str !== 'string') return str;
    
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };

  const sanitizeObject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = escape(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);

  next();
};

module.exports = {
  handleValidationErrors,
  limitRequestSize,
  validateFileUpload,
  sanitizeInput,
  preventXSS,
};