const { Sequelize } = require('sequelize');
const path = require('path');
const config = require('./index');
const logger = require('./logger');

// SQLite 데이터베이스 파일 경로
const dbPath = path.join(__dirname, '../../database/asi-e-daitta.sqlite');

// Sequelize 인스턴스 생성
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: (msg) => logger.debug(msg),
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// 데이터베이스 연결 테스트
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('SQLite database connected successfully');
    
    // 개발 환경에서 테이블 동기화
    if (config.server.environment === 'development') {
      await sequelize.sync({ force: true });
      logger.info('Database tables synchronized with force mode');
    }
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await sequelize.close();
    logger.info('Database connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error closing database connection:', error);
    process.exit(1);
  }
});

module.exports = { sequelize, connectDB };