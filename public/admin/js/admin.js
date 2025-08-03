/**
 * ASI e DAITTA 관리자 대시보드 JavaScript
 */

// 전역 변수
let authToken = localStorage.getItem('admin_token');
let currentUser = null;
let usersChart = null;
let subscriptionsChart = null;

// API 기본 설정
const API_BASE_URL = 'http://localhost:3003/api/v1';

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
            localStorage.setItem('admin_token', authToken);
            localStorage.setItem('admin_user', JSON.stringify(currentUser));
            
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
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    
    document.getElementById('dashboard').classList.remove('show');
    document.getElementById('loginModal').classList.add('show');
}

function checkAuth() {
    const token = localStorage.getItem('admin_token');
    const user = localStorage.getItem('admin_user');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        return true;
    }
    
    return false;
}

// 대시보드 통계 로드
async function loadDashboardStats() {
    try {
        showLoading();
        
        const response = await apiCall('/admin/dashboard/stats');
        
        if (response.success) {
            const stats = response.data;
            
            // 통계 카드 업데이트
            document.getElementById('totalUsers').textContent = stats.users.total;
            document.getElementById('activeSubscriptions').textContent = stats.subscriptions.active;
            document.getElementById('totalRevenue').textContent = `$${stats.subscriptions.revenue.toFixed(2)}`;
            document.getElementById('newContacts').textContent = stats.contacts.new;
            
            // 변화율 업데이트 (실제 계산 로직은 백엔드에서 구현)
            document.getElementById('usersChange').textContent = `+${stats.users.newThisMonth}`;
            document.getElementById('subscriptionsChange').textContent = '+5%';
            document.getElementById('revenueChange').textContent = '+12%';
            document.getElementById('contactsChange').textContent = `+${stats.contacts.new}`;
            
            // 차트 업데이트
            updateCharts(stats);
            
            // 최근 활동 업데이트
            updateRecentActivity();
        }
    } catch (error) {
        console.error('대시보드 통계 로드 에러:', error);
        showToast('대시보드 통계를 불러오는데 실패했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

// 차트 업데이트
function updateCharts(stats) {
    // 사용자 증가 추이 차트
    if (usersChart) {
        usersChart.destroy();
    }
    
    const usersCtx = document.getElementById('usersChart').getContext('2d');
    usersChart = new Chart(usersCtx, {
        type: 'line',
        data: {
            labels: getLast30Days(),
            datasets: [{
                label: '새 사용자',
                data: generateMockUserData(),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4,
                fill: true,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#e2e8f0',
                    },
                },
                x: {
                    grid: {
                        display: false,
                    },
                },
            },
        },
    });

    // 구독 현황 도넛 차트
    if (subscriptionsChart) {
        subscriptionsChart.destroy();
    }
    
    const subscriptionsCtx = document.getElementById('subscriptionsChart').getContext('2d');
    subscriptionsChart = new Chart(subscriptionsCtx, {
        type: 'doughnut',
        data: {
            labels: ['Active', 'Cancelled', 'Expired'],
            datasets: [{
                data: [
                    stats.subscriptions.active,
                    stats.subscriptions.total - stats.subscriptions.active,
                    0,
                ],
                backgroundColor: [
                    '#10b981',
                    '#ef4444',
                    '#64748b',
                ],
                borderWidth: 0,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                },
            },
        },
    });
}

// 날짜 생성 유틸리티
function getLast30Days() {
    const days = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }));
    }
    return days;
}

// 모의 사용자 데이터 생성
function generateMockUserData() {
    return Array.from({ length: 30 }, () => Math.floor(Math.random() * 10) + 1);
}

// 최근 활동 업데이트
function updateRecentActivity() {
    const activities = [
        {
            icon: 'fas fa-user-plus',
            text: '새 사용자가 가입했습니다.',
            time: '5분 전',
            color: '#2563eb',
        },
        {
            icon: 'fas fa-credit-card',
            text: '새 구독이 시작되었습니다.',
            time: '15분 전',
            color: '#10b981',
        },
        {
            icon: 'fas fa-envelope',
            text: '새 문의사항이 등록되었습니다.',
            time: '1시간 전',
            color: '#06b6d4',
        },
        {
            icon: 'fas fa-user-shield',
            text: '관리자가 로그인했습니다.',
            time: '2시간 전',
            color: '#8b5cf6',
        },
    ];
    
    const activityList = document.getElementById('recentActivity');
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon" style="background-color: ${activity.color}">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <p>${activity.text}</p>
                <span>${activity.time}</span>
            </div>
        </div>
    `).join('');
}

// 사용자 관리
async function loadUsers(page = 1, search = '', filter = '') {
    try {
        showLoading();
        
        const params = new URLSearchParams({
            page,
            limit: 10,
            ...(search && { search }),
            ...(filter && { isActive: filter === 'active' }),
        });
        
        const response = await apiCall(`/admin/users?${params}`);
        
        if (response.success) {
            displayUsersTable(response.data.users);
            displayPagination('users', response.data.pagination);
        }
    } catch (error) {
        console.error('사용자 로드 에러:', error);
        showToast('사용자 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

function displayUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${new Date(user.createdAt).toLocaleDateString('ko-KR')}</td>
            <td>
                <span class="status-badge ${user.isActive ? 'active' : 'inactive'}">
                    ${user.isActive ? '활성' : '비활성'}
                </span>
            </td>
            <td>
                <span class="status-badge ${user.role === 'admin' ? 'active' : 'inactive'}">
                    ${user.role === 'admin' ? '관리자' : '사용자'}
                </span>
            </td>
            <td>
                <button class="action-btn" onclick="viewUser(${user.id})" title="상세보기">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="editUser(${user.id})" title="수정">
                    <i class="fas fa-edit"></i>
                </button>
                ${user.role !== 'admin' ? `
                <button class="action-btn danger" onclick="deleteUser(${user.id})" title="삭제">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

// 구독 관리
async function loadSubscriptions(page = 1, search = '', filter = '') {
    try {
        showLoading();
        
        const params = new URLSearchParams({
            page,
            limit: 10,
            ...(search && { search }),
            ...(filter && { status: filter }),
        });
        
        const response = await apiCall(`/subscriptions?${params}`);
        
        if (response.success) {
            displaySubscriptionsTable(response.data.subscriptions);
            displayPagination('subscriptions', response.data.pagination);
        }
    } catch (error) {
        console.error('구독 로드 에러:', error);
        showToast('구독 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

function displaySubscriptionsTable(subscriptions) {
    const tbody = document.getElementById('subscriptionsTableBody');
    tbody.innerHTML = subscriptions.map(sub => `
        <tr>
            <td>${sub.id}</td>
            <td>${sub.user ? sub.user.username : 'N/A'}</td>
            <td>
                <span class="status-badge ${sub.planType}">
                    ${sub.planType.toUpperCase()}
                </span>
            </td>
            <td>$${sub.price}</td>
            <td>${new Date(sub.startDate).toLocaleDateString('ko-KR')}</td>
            <td>${sub.endDate ? new Date(sub.endDate).toLocaleDateString('ko-KR') : 'N/A'}</td>
            <td>
                <span class="status-badge ${sub.status}">
                    ${getStatusText(sub.status)}
                </span>
            </td>
            <td>
                <button class="action-btn" onclick="viewSubscription(${sub.id})" title="상세보기">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="editSubscription(${sub.id})" title="수정">
                    <i class="fas fa-edit"></i>
                </button>
                ${sub.status === 'active' ? `
                <button class="action-btn danger" onclick="cancelSubscription(${sub.id})" title="취소">
                    <i class="fas fa-ban"></i>
                </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

// 문의사항 관리
async function loadContacts(page = 1, search = '', filter = '') {
    try {
        showLoading();
        
        const params = new URLSearchParams({
            page,
            limit: 10,
            ...(search && { search }),
            ...(filter && { status: filter }),
        });
        
        const response = await apiCall(`/contacts?${params}`);
        
        if (response.success) {
            displayContactsTable(response.data.contacts);
            displayPagination('contacts', response.data.pagination);
        }
    } catch (error) {
        console.error('문의사항 로드 에러:', error);
        showToast('문의사항 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

function displayContactsTable(contacts) {
    const tbody = document.getElementById('contactsTableBody');
    tbody.innerHTML = contacts.map(contact => `
        <tr>
            <td>${contact.id}</td>
            <td>${contact.name}</td>
            <td>${contact.email}</td>
            <td>${contact.subject}</td>
            <td>
                <span class="status-badge ${contact.category}">
                    ${getCategoryText(contact.category)}
                </span>
            </td>
            <td>
                <span class="priority-badge ${contact.priority}">
                    ${getPriorityText(contact.priority)}
                </span>
            </td>
            <td>
                <span class="status-badge ${contact.status}">
                    ${getStatusText(contact.status)}
                </span>
            </td>
            <td>${new Date(contact.createdAt).toLocaleDateString('ko-KR')}</td>
            <td>
                <button class="action-btn" onclick="viewContact(${contact.id})" title="상세보기">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="respondContact(${contact.id})" title="응답">
                    <i class="fas fa-reply"></i>
                </button>
                ${contact.status === 'new' || contact.status === 'in_progress' ? `
                <button class="action-btn" onclick="resolveContact(${contact.id})" title="해결">
                    <i class="fas fa-check"></i>
                </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

// 관리자 관리
async function loadAdmins() {
    try {
        showLoading();
        
        const response = await apiCall('/admin');
        
        if (response.success) {
            displayAdminsTable(response.data.admins);
        }
    } catch (error) {
        console.error('관리자 로드 에러:', error);
        showToast('관리자 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

function displayAdminsTable(admins) {
    const tbody = document.getElementById('adminsTableBody');
    tbody.innerHTML = admins.map(admin => `
        <tr>
            <td>${admin.id}</td>
            <td>${admin.user ? admin.user.username : 'N/A'}</td>
            <td>${admin.department || 'N/A'}</td>
            <td>${admin.position || 'N/A'}</td>
            <td>
                <span class="status-badge ${admin.accessLevel}">
                    ${getAccessLevelText(admin.accessLevel)}
                </span>
            </td>
            <td>
                <span class="status-badge ${admin.isActive ? 'active' : 'inactive'}">
                    ${admin.isActive ? '활성' : '비활성'}
                </span>
            </td>
            <td>${admin.lastAccessAt ? new Date(admin.lastAccessAt).toLocaleDateString('ko-KR') : 'N/A'}</td>
            <td>
                <button class="action-btn" onclick="viewAdmin(${admin.id})" title="상세보기">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="editAdmin(${admin.id})" title="수정">
                    <i class="fas fa-edit"></i>
                </button>
                ${admin.accessLevel !== 'super_admin' ? `
                <button class="action-btn danger" onclick="deleteAdmin(${admin.id})" title="삭제">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

// 페이지네이션 표시
function displayPagination(type, pagination) {
    const container = document.getElementById(`${type}Pagination`);
    
    if (!container || pagination.totalPages <= 1) {
        if (container) container.innerHTML = '';
        return;
    }
    
    const { page, totalPages } = pagination;
    let paginationHTML = '';
    
    // 이전 버튼
    paginationHTML += `
        <button ${page <= 1 ? 'disabled' : ''} onclick="changePage('${type}', ${page - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // 페이지 번호들
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="${i === page ? 'active' : ''}" onclick="changePage('${type}', ${i})">
                ${i}
            </button>
        `;
    }
    
    // 다음 버튼
    paginationHTML += `
        <button ${page >= totalPages ? 'disabled' : ''} onclick="changePage('${type}', ${page + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    container.innerHTML = paginationHTML;
}

// 페이지 변경
function changePage(type, page) {
    const searchInput = document.getElementById(`${type}Search`);
    const filterSelect = document.getElementById(`${type}Filter`);
    
    const search = searchInput ? searchInput.value : '';
    const filter = filterSelect ? filterSelect.value : '';
    
    switch (type) {
        case 'users':
            loadUsers(page, search, filter);
            break;
        case 'subscriptions':
            loadSubscriptions(page, search, filter);
            break;
        case 'contacts':
            loadContacts(page, search, filter);
            break;
    }
}

// 텍스트 변환 유틸리티
function getStatusText(status) {
    const statusMap = {
        active: '활성',
        inactive: '비활성',
        new: '새 문의',
        in_progress: '진행중',
        resolved: '해결됨',
        closed: '종료됨',
        cancelled: '취소됨',
        expired: '만료됨',
    };
    return statusMap[status] || status;
}

function getCategoryText(category) {
    const categoryMap = {
        general: '일반',
        support: '지원',
        sales: '영업',
        technical: '기술',
        billing: '결제',
        feedback: '피드백',
    };
    return categoryMap[category] || category;
}

function getPriorityText(priority) {
    const priorityMap = {
        low: '낮음',
        medium: '보통',
        high: '높음',
        urgent: '긴급',
    };
    return priorityMap[priority] || priority;
}

function getAccessLevelText(level) {
    const levelMap = {
        read_only: '읽기 전용',
        moderator: '모더레이터',
        admin: '관리자',
        super_admin: '슈퍼 관리자',
    };
    return levelMap[level] || level;
}

// 모달 관련 함수
function viewContact(id) {
    // 문의사항 상세 모달 표시
    showToast('문의사항 상세 기능 구현 예정', 'info');
}

function viewSubscription(id) {
    // 구독 상세 모달 표시
    showToast('구독 상세 기능 구현 예정', 'info');
}

function closeContactModal() {
    document.getElementById('contactModal').classList.remove('show');
}

function closeSubscriptionModal() {
    document.getElementById('subscriptionModal').classList.remove('show');
}

// 페이지 네비게이션
function showPage(pageName) {
    // 모든 페이지 숨기기
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 네비게이션 메뉴 업데이트
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // 선택된 페이지 및 메뉴 활성화
    const targetPage = document.getElementById(`page-${pageName}`);
    const targetNav = document.querySelector(`[data-page="${pageName}"]`).parentElement;
    
    if (targetPage) {
        targetPage.classList.add('active');
        targetNav.classList.add('active');
        
        // 페이지 제목 업데이트
        const titles = {
            dashboard: '대시보드',
            users: '사용자 관리',
            subscriptions: '구독 관리',
            contacts: '문의사항 관리',
            admins: '관리자 관리',
        };
        
        const subtitles = {
            dashboard: '시스템 전체 현황을 확인하세요',
            users: '등록된 사용자들을 관리하세요',
            subscriptions: '구독 현황을 관리하세요',
            contacts: '고객 문의사항을 처리하세요',
            admins: '관리자 권한을 관리하세요',
        };
        
        document.getElementById('pageTitle').textContent = titles[pageName];
        document.getElementById('pageSubtitle').textContent = subtitles[pageName];
        
        // 페이지별 데이터 로드
        switch (pageName) {
            case 'dashboard':
                loadDashboardStats();
                break;
            case 'users':
                loadUsers();
                break;
            case 'subscriptions':
                loadSubscriptions();
                break;
            case 'contacts':
                loadContacts();
                break;
            case 'admins':
                loadAdmins();
                break;
        }
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 로그인 폼
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorElement = document.getElementById('loginError');
        
        try {
            showLoading();
            errorElement.classList.remove('show');
            
            const success = await login(email, password);
            
            if (success) {
                // 관리자 권한 확인
                if (currentUser.role !== 'admin') {
                    throw new Error('관리자 권한이 필요합니다.');
                }
                
                document.getElementById('loginModal').classList.remove('show');
                document.getElementById('dashboard').classList.add('show');
                document.getElementById('adminName').textContent = currentUser.firstName || currentUser.username;
                
                // 대시보드 로드
                showPage('dashboard');
                showToast('로그인되었습니다.', 'success');
                
                // 마지막 접근 시간 업데이트
                await apiCall('/admin/access', { method: 'POST' });
            }
        } catch (error) {
            errorElement.textContent = error.message;
            errorElement.classList.add('show');
        } finally {
            hideLoading();
        }
    });
    
    // 로그아웃 버튼
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
        showToast('로그아웃되었습니다.', 'info');
    });
    
    // 사이드바 토글
    document.getElementById('sidebarToggle').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('collapsed');
    });
    
    // 네비게이션 메뉴
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = link.getAttribute('data-page');
            showPage(pageName);
        });
    });
    
    // 검색 입력
    ['users', 'subscriptions', 'contacts'].forEach(type => {
        const searchInput = document.getElementById(`${type}Search`);
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    changePage(type, 1);
                }, 500);
            });
        }
        
        const filterSelect = document.getElementById(`${type}Filter`);
        if (filterSelect) {
            filterSelect.addEventListener('change', () => {
                changePage(type, 1);
            });
        }
    });
}

// 초기화 함수
async function init() {
    setupEventListeners();
    
    if (checkAuth()) {
        try {
            // 사용자 정보 검증
            const userResponse = await apiCall('/auth/profile');
            
            if (userResponse.success && userResponse.data.user.role === 'admin') {
                currentUser = userResponse.data.user;
                document.getElementById('adminName').textContent = currentUser.firstName || currentUser.username;
                
                document.getElementById('dashboard').classList.add('show');
                showPage('dashboard');
            } else {
                logout();
            }
        } catch (error) {
            console.error('사용자 검증 실패:', error);
            logout();
        }
    } else {
        document.getElementById('loginModal').classList.add('show');
    }
    
    hideLoading();
}

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', init);