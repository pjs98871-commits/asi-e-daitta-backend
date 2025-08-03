require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development',
  },
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/asi-e-daitta',
      dbName: process.env.MONGODB_DB_NAME || 'asi-e-daitta',
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || '',
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  api: {
    version: process.env.API_VERSION || 'v1',
    prefix: process.env.API_PREFIX || '/api',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10,
    sessionSecret: process.env.SESSION_SECRET || 'fallback-session-secret',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'ap-northeast-2',
    s3Bucket: process.env.AWS_S3_BUCKET,
  },
  externalApis: {
    openai: process.env.OPENAI_API_KEY,
    googleMaps: process.env.GOOGLE_MAPS_API_KEY,
  },
};