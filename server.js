const express = require('express');
const cors = require('cors');
const app = express();

// 포트 설정 (Railway 환경변수 사용)
const PORT = process.env.PORT || 3000;

// CORS 설정
app.use(cors());
app.use(express.json());

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ 
    message: 'ASI e DAITTA Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 헬스 체크
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
