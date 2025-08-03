/**
 * ASI e DAITTA 메인 웹사이트 JavaScript
 * 실제 백엔드 API와 연동
 */

// 전역 변수
let authToken = localStorage.getItem('user_token');
let currentUser = null;

// API 기본 설정
const API_BASE_URL = '/api/v1';

// API 호출 헬퍼 함수
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (authToken) {
        defaultOptions.headers.Authorization = `Bearer ${authToken}`;
    }

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, finalOptions);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API 호출 에러:', error);
        throw error;
    }
}

// 로딩 상태 관리
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// 토스트 알림
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 모달 관리
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// 인증 관련 함수
async function login(email, password) {
    try {
        const response = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (response.success) {
            authToken = response.data.token;
            currentUser = response.data.user;
            localStorage.setItem('user_token', authToken);
            localStorage.setItem('user_data', JSON.stringify(currentUser));
            
            updateAuthUI();
            return true;
        }
        
        return false;
    } catch (error) {
        throw error;
    }
}

async function register(userData) {
    try {
        const response = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });

        if (response.success) {
            authToken = response.data.token;
            currentUser = response.data.user;
            localStorage.setItem('user_token', authToken);
            localStorage.setItem('user_data', JSON.stringify(currentUser));
            
            updateAuthUI();
            return true;
        }
        
        return false;
    } catch (error) {
        throw error;
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_data');
    
    updateAuthUI();
    showToast('로그아웃되었습니다.', 'info');
}

function checkAuth() {
    const token = localStorage.getItem('user_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
        authToken = token;
        currentUser = JSON.parse(userData);
        return true;
    }
    
    return false;
}

function updateAuthUI() {
    const navCta = document.querySelector('.nav-cta');
    
    if (currentUser) {
        navCta.innerHTML = `
            <div class="user-menu">
                <span>안녕하세요, ${currentUser.firstName || currentUser.username}님</span>
                <button class="btn-logout" id="btnLogout">로그아웃</button>
            </div>
        `;
        
        // 로그아웃 버튼 이벤트 리스너 추가
        document.getElementById('btnLogout').addEventListener('click', logout);
    } else {
        navCta.innerHTML = `
            <button class="btn-login" id="btnLogin">로그인</button>
            <button class="btn-signup" id="btnSignup">회원가입</button>
        `;
        
        // 모달 버튼 이벤트 리스너 재설정
        setupAuthEventListeners();
    }
}

// 문의사항 제출
async function submitContact(formData) {
    try {
        const response = await apiCall('/contacts', {
            method: 'POST',
            body: JSON.stringify(formData),
        });

        if (response.success) {
            return true;
        }
        
        return false;
    } catch (error) {
        throw error;
    }
}

// 뉴스레터 구독 (구독 시스템으로 처리)
async function subscribeNewsletter(email) {
    try {
        // 뉴스레터 구독을 위한 기본 구독 생성
        const response = await apiCall('/subscriptions', {
            method: 'POST',
            body: JSON.stringify({
                planType: 'basic',
                price: 0,
                currency: 'USD',
                paymentMethod: 'newsletter',
                features: {
                    newsletter: true,
                    type: 'newsletter_only'
                },
                notes: `Newsletter subscription for ${email}`
            }),
        });

        if (response.success) {
            return true;
        }
        
        return false;
    } catch (error) {
        // 인증되지 않은 사용자인 경우 문의사항으로 처리
        if (error.message.includes('token') || error.message.includes('auth')) {
            return await submitContact({
                name: '뉴스레터 구독자',
                email: email,
                subject: '뉴스레터 구독 신청',
                message: '뉴스레터 구독을 신청합니다.',
                category: 'general'
            });
        }
        throw error;
    }
}

// 플랜 구독
async function subscribePlan(planType) {
    if (!currentUser) {
        showModal('loginModal');
        showToast('먼저 로그인해주세요.', 'warning');
        return;
    }

    try {
        showLoading();
        
        const planPrices = {
            basic: 9,
            premium: 29,
            enterprise: 99
        };

        const response = await apiCall('/subscriptions', {
            method: 'POST',
            body: JSON.stringify({
                planType: planType,
                price: planPrices[planType],
                currency: 'USD',
                paymentMethod: 'credit_card',
                isAutoRenewal: true,
                features: getPlanFeatures(planType)
            }),
        });

        if (response.success) {
            showToast(`${planType.toUpperCase()} 플랜 구독이 완료되었습니다!`, 'success');
            
            // 구독 성공 모달 또는 리다이렉트 처리
            setTimeout(() => {
                window.location.href = '/dashboard'; // 대시보드로 이동
            }, 2000);
        }
    } catch (error) {
        console.error('구독 에러:', error);
        showToast(error.message || '구독 처리 중 오류가 발생했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

function getPlanFeatures(planType) {
    const features = {
        basic: {
            maxProjects: 3,
            storage: '5GB',
            support: 'email',
            realTime: false
        },
        premium: {
            maxProjects: 10,
            storage: '50GB',
            support: 'priority',
            realTime: true
        },
        enterprise: {
            maxProjects: 'unlimited',
            storage: 'unlimited',
            support: 'dedicated',
            realTime: true,
            customSolution: true
        }
    };
    
    return features[planType] || features.basic;
}

// 통계 데이터 로드
async function loadStats() {
    try {
        // 공개 통계 API가 없으므로 모의 데이터 사용
        // 실제로는 백엔드에서 공개 통계 엔드포인트를 만들어야 함
        const statsData = {
            users: Math.floor(Math.random() * 5000) + 10000,
            activeUsers: Math.floor(Math.random() * 1000) + 5000
        };
        
        // 사용자 수 업데이트
        const statsUsersElement = document.getElementById('statsUsers');
        if (statsUsersElement) {
            statsUsersElement.textContent = `${(statsData.users / 1000).toFixed(1)}K+`;
        }
        
    } catch (error) {
        console.error('통계 로드 에러:', error);
    }
}

// 네비게이션 관련
function setupNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // 네비게이션 링크 클릭 시 메뉴 닫기
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // 스크롤 시 헤더 스타일 변경
    window.addEventListener('scroll', () => {
        const header = document.getElementById('header');
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        }
    });
}

// Back to top 버튼
function setupBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });
    
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 이벤트 리스너 설정
function setupAuthEventListeners() {
    // 로그인 모달 버튼
    const btnLogin = document.getElementById('btnLogin');
    if (btnLogin) {
        btnLogin.addEventListener('click', () => showModal('loginModal'));
    }
    
    // 회원가입 모달 버튼
    const btnSignup = document.getElementById('btnSignup');
    if (btnSignup) {
        btnSignup.addEventListener('click', () => showModal('signupModal'));
    }
}

function setupEventListeners() {
    // 인증 관련 이벤트 리스너
    setupAuthEventListeners();
    
    // 히어로 섹션 버튼
    document.getElementById('heroGetStarted')?.addEventListener('click', () => {
        if (currentUser) {
            document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' });
        } else {
            showModal('signupModal');
        }
    });
    
    document.getElementById('heroDemo')?.addEventListener('click', () => {
        showToast('데모 기능은 준비 중입니다.', 'info');
    });
    
    // 더 알아보기 버튼
    document.getElementById('learnMore')?.addEventListener('click', () => {
        document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
    });

    // 모달 닫기 버튼들
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-overlay');
            if (modal) {
                hideModal(modal.id);
            }
        });
    });

    // 모달 배경 클릭 시 닫기
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal(modal.id);
            }
        });
    });

    // 로그인/회원가입 모달 전환
    document.getElementById('switchToSignup')?.addEventListener('click', (e) => {
        e.preventDefault();
        hideModal('loginModal');
        showModal('signupModal');
    });

    document.getElementById('switchToLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        hideModal('signupModal');
        showModal('loginModal');
    });

    // 로그인 폼 제출
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorElement = document.getElementById('loginError');
        
        try {
            showLoading();
            errorElement.classList.remove('show');
            
            const success = await login(email, password);
            
            if (success) {
                hideModal('loginModal');
                showToast('로그인되었습니다!', 'success');
                e.target.reset();
            }
        } catch (error) {
            errorElement.textContent = error.message;
            errorElement.classList.add('show');
        } finally {
            hideLoading();
        }
    });

    // 회원가입 폼 제출
    document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = Object.fromEntries(formData);
        const errorElement = document.getElementById('signupError');
        
        // 비밀번호 확인
        if (userData.password !== userData.confirmPassword) {
            errorElement.textContent = '비밀번호가 일치하지 않습니다.';
            errorElement.classList.add('show');
            return;
        }
        
        // confirmPassword 제거
        delete userData.confirmPassword;
        
        try {
            showLoading();
            errorElement.classList.remove('show');
            
            const success = await register(userData);
            
            if (success) {
                hideModal('signupModal');
                showToast('회원가입이 완료되었습니다!', 'success');
                e.target.reset();
            }
        } catch (error) {
            errorElement.textContent = error.message;
            errorElement.classList.add('show');
        } finally {
            hideLoading();
        }
    });

    // 문의사항 폼 제출
    document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const contactData = Object.fromEntries(formData);
        
        try {
            showLoading();
            
            const success = await submitContact(contactData);
            
            if (success) {
                showToast('문의사항이 성공적으로 전송되었습니다!', 'success');
                e.target.reset();
            }
        } catch (error) {
            console.error('문의사항 전송 에러:', error);
            showToast(error.message || '문의사항 전송 중 오류가 발생했습니다.', 'error');
        } finally {
            hideLoading();
        }
    });

    // 뉴스레터 구독 폼 제출
    document.getElementById('newsletterForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('newsletterEmail').value;
        
        try {
            showLoading();
            
            const success = await subscribeNewsletter(email);
            
            if (success) {
                showToast('뉴스레터 구독이 완료되었습니다!', 'success');
                e.target.reset();
            }
        } catch (error) {
            console.error('뉴스레터 구독 에러:', error);
            showToast(error.message || '뉴스레터 구독 중 오류가 발생했습니다.', 'error');
        } finally {
            hideLoading();
        }
    });

    // 가격 플랜 버튼들
    document.querySelectorAll('.btn-plan').forEach(btn => {
        btn.addEventListener('click', () => {
            const planType = btn.getAttribute('data-plan');
            if (planType === 'enterprise') {
                // 엔터프라이즈는 문의하기
                document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
            } else {
                subscribePlan(planType);
            }
        });
    });
}

// 부드러운 스크롤 애니메이션
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// AOS (Animate On Scroll) 초기화
function initAOS() {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            offset: 100
        });
    }
}

// 초기화 함수
async function init() {
    // 로딩 숨기기
    setTimeout(() => {
        hideLoading();
    }, 1000);
    
    // 인증 상태 확인
    if (checkAuth()) {
        updateAuthUI();
    }
    
    // 이벤트 리스너 설정
    setupEventListeners();
    setupNavigation();
    setupBackToTop();
    setupSmoothScroll();
    
    // AOS 초기화
    initAOS();
    
    // 통계 데이터 로드
    await loadStats();
    
    console.log('ASI e DAITTA 웹사이트가 초기화되었습니다.');
}

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', init);

// 페이지 가시성 변경 시 처리
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && currentUser) {
        // 페이지가 다시 보이면 토큰 유효성 검사
        apiCall('/auth/profile').catch(() => {
            // 토큰이 유효하지 않으면 로그아웃
            logout();
        });
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        apiCall,
        login,
        register,
        submitContact,
        subscribeNewsletter
    };
}