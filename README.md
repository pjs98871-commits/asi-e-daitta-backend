# ASI e DAITTA Backend API

완전한 기능을 갖춘 Node.js + Express + SQLite 백엔드 API 서버입니다.

## 🚀 기능

- **인증 시스템**: JWT 기반 인증 및 권한 관리
- **사용자 관리**: 회원가입, 로그인, 프로필 관리
- **구독 관리**: 다양한 구독 플랜 및 결제 관리
- **문의사항 시스템**: 고객 문의 및 지원 티켓 관리
- **관리자 패널**: 관리자 권한 및 대시보드
- **보안**: Helmet, CORS, Rate Limiting, 입력 검증
- **데이터베이스**: SQLite + Sequelize ORM
- **로깅**: Winston 기반 구조화된 로깅
- **API 문서**: 자동 생성되는 API 문서

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env` 파일이 이미 개발용으로 설정되어 있습니다. 운영 환경에서는 보안을 위해 값들을 변경하세요.

### 3. 데이터베이스 초기화
```bash
npm run db:init
```

### 4. 샘플 데이터 생성 (선택사항)
```bash
npm run db:seed
```

### 5. 서버 실행
```bash
# 개발 모드 (nodemon)
npm run dev

# 프로덕션 모드
npm start
```

## 🔗 API 엔드포인트

서버가 실행되면 다음 주소에서 API를 사용할 수 있습니다:

- **기본 URL**: http://localhost:3000
- **API Base**: http://localhost:3000/api/v1
- **Health Check**: http://localhost:3000/health

### 인증 API (`/api/v1/auth`)
- `POST /register` - 회원가입
- `POST /login` - 로그인
- `POST /refresh` - 토큰 갱신
- `POST /logout` - 로그아웃
- `GET /profile` - 프로필 조회
- `PUT /profile` - 프로필 수정
- `PUT /change-password` - 비밀번호 변경

### 구독 API (`/api/v1/subscriptions`)
- `GET /my` - 내 구독 조회
- `POST /` - 구독 생성
- `GET /` - 구독 목록 조회
- `GET /:id` - 구독 상세 조회
- `PUT /:id` - 구독 수정
- `POST /:id/cancel` - 구독 취소
- `POST /:id/renew` - 구독 갱신
- `DELETE /:id` - 구독 삭제 (관리자만)

### 문의사항 API (`/api/v1/contacts`)
- `POST /` - 문의사항 생성
- `GET /` - 문의사항 목록 조회 (관리자만)
- `GET /assigned` - 할당된 문의사항 조회 (관리자만)
- `GET /stats` - 문의사항 통계 (관리자만)
- `GET /:id` - 문의사항 상세 조회 (관리자만)
- `PUT /:id` - 문의사항 수정 (관리자만)
- `POST /:id/respond` - 문의사항 응답 (관리자만)
- `POST /:id/assign` - 문의사항 할당 (관리자만)
- `DELETE /:id` - 문의사항 삭제 (관리자만)

### 관리자 API (`/api/v1/admin`)
- `GET /dashboard/stats` - 대시보드 통계
- `POST /access` - 마지막 접근 시간 업데이트
- `POST /` - 관리자 생성
- `GET /` - 관리자 목록 조회
- `GET /:id` - 관리자 상세 조회
- `GET /user/:userId` - 사용자별 관리자 프로필 조회
- `PUT /:id` - 관리자 정보 수정
- `PUT /:id/permissions` - 관리자 권한 수정
- `DELETE /:id` - 관리자 삭제

## 🔐 기본 계정

### 관리자 계정
- **이메일**: admin@asi-daitta.com
- **비밀번호**: Admin123!

### 모더레이터 계정 (샘플 데이터 생성 시)
- **이메일**: moderator@asi-daitta.com
- **비밀번호**: Mod123!

### 테스트 사용자 계정 (샘플 데이터 생성 시)
- **이메일**: john@example.com / **비밀번호**: User123!
- **이메일**: jane@example.com / **비밀번호**: User123!

## 📊 데이터베이스 스키마

### 사용자 (Users)
- 기본 정보, 인증, 권한 관리
- BCrypt 해싱된 비밀번호
- 이메일 인증 지원

### 구독 (Subscriptions)
- 다양한 구독 플랜 (basic, premium, enterprise)
- 결제 정보 및 자동 갱신
- 구독 상태 관리

### 문의사항 (Contacts)
- 고객 문의 및 지원 티켓
- 카테고리 및 우선순위 분류
- 할당 및 응답 관리

### 관리자 (Admins)
- 세분화된 권한 시스템
- 부서 및 역할 관리
- 접근 레벨 제어

## 🛡️ 보안 기능

- **Helmet**: HTTP 헤더 보안
- **CORS**: Cross-Origin Resource Sharing 설정
- **Rate Limiting**: API 호출 제한
- **Input Validation**: 입력 데이터 검증 및 새니타이징
- **JWT**: 안전한 토큰 기반 인증
- **BCrypt**: 비밀번호 해싱
- **SQL Injection 방지**: Sequelize ORM 사용

## 📝 스크립트

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 서버 실행
npm start

# 테스트 실행
npm test

# 코드 린팅
npm run lint

# 코드 포맷팅
npm run format

# 데이터베이스 초기화
npm run db:init

# 데이터베이스 마이그레이션
npm run db:migrate

# 샘플 데이터 생성
npm run db:seed
```

## 📂 프로젝트 구조

```
asi-e-daitta-backend/
├── src/
│   ├── config/          # 설정 파일들
│   ├── controllers/     # API 컨트롤러
│   ├── middlewares/     # 미들웨어
│   ├── models/          # 데이터 모델
│   ├── routes/          # 라우트 정의
│   ├── services/        # 비즈니스 로직
│   ├── utils/           # 유틸리티 함수
│   └── validators/      # 입력 검증
├── scripts/             # 데이터베이스 스크립트
├── tests/               # 테스트 파일
├── logs/                # 로그 파일
├── database/            # SQLite 데이터베이스
├── docs/                # 문서
└── server.js            # 메인 서버 파일
```

## 🧪 테스트

```bash
# 모든 테스트 실행
npm test

# 테스트 커버리지 확인
npm test -- --coverage
```

## 📈 모니터링

- **로깅**: Winston을 사용한 구조화된 로깅
- **Health Check**: `/health` 엔드포인트에서 서버 상태 확인
- **에러 추적**: 자동 에러 로깅 및 추적

## 🚀 배포

### 환경 변수 설정
운영 환경에서는 다음 환경 변수들을 안전한 값으로 설정하세요:

- `JWT_SECRET`: 강력한 JWT 비밀키
- `JWT_REFRESH_SECRET`: 강력한 리프레시 토큰 비밀키
- `SESSION_SECRET`: 세션 비밀키
- `NODE_ENV`: production
- `CORS_ORIGIN`: 허용할 프론트엔드 도메인

### 프로덕션 실행
```bash
NODE_ENV=production npm start
```

## 📞 지원

문제가 발생하거나 질문이 있으시면 문의사항 API를 통해 연락해주세요.

---

**ASI e DAITTA Backend** - 완전한 기능을 갖춘 현대적인 백엔드 API 솔루션