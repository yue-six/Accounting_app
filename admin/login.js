// 后台管理系统登录功能
const AdminAuth = {
    // 存储登录状态
    isLoggedIn: false,
    // API基础URL
    apiBaseUrl: '../server/routes/admin.js', // 实际应用中应该是完整的API地址
    
    // 初始化
    init() {
        this.checkAuthStatus();
        this.bindEvents();
    },
    
    // 检查登录状态
    checkAuthStatus() {
        const token = localStorage.getItem('adminToken');
        if (token) {
            // 验证令牌是否有效（简单检查，实际应该解码验证）
            this.isLoggedIn = true;
            this.showDashboard();
        } else {
            this.showLoginForm();
        }
    },
    
    // 绑定事件
    bindEvents() {
        // 登录表单提交
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        // 登出按钮
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
        
        // 处理admin.js中的登出按钮
        document.addEventListener('click', (e) => {
            if (e.target.closest('.logout-item')) {
                this.handleLogout();
            }
        });
    },
    
    // 处理登录
    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMsg');
        // 成功消息暂不显示，因为HTML中没有此元素
        const loginBtn = document.querySelector('.btn-login');
        
        // 输入验证
        if (!username || !password) {
            errorMessage.textContent = '请输入用户名和密码';
            errorMessage.style.display = 'block';
            return;
        }
        
        try {
            // 显示加载状态
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登录中...';
            loginBtn.disabled = true;
            errorMessage.style.display = 'none';
            
            // 调用后端登录API
            const response = await fetch('/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // 登录成功
                errorMessage.style.display = 'none';
                
                // 存储JWT令牌
                localStorage.setItem('adminToken', result.data.token);
                localStorage.setItem('adminToken_expires', Date.now() + (result.data.expiresIn * 1000));
                
                console.log('登录成功，令牌已存储:', result.data.token);
                this.isLoggedIn = true;
                
                // 立即跳转到仪表板
                console.log('即将跳转到admin.html');
                setTimeout(() => {
                    console.log('执行跳转');
                    this.showDashboard();
                }, 500);
            } else {
                // 登录失败
                errorMessage.textContent = result.message || '用户名或密码错误';
                errorMessage.style.display = 'block';
                
                // 添加错误动画效果
                errorMessage.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => {
                    errorMessage.style.animation = '';
                }, 500);
            }
        } catch (error) {
            console.error('登录请求失败:', error);
            errorMessage.textContent = '登录失败，请检查网络连接';
            errorMessage.style.display = 'block';
        } finally {
            // 恢复按钮状态
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> 登录系统';
            loginBtn.disabled = false;
        }
    },
    
    // 处理登出
    async handleLogout() {
        try {
            const token = localStorage.getItem('adminToken');
            
            // 调用后端登出API
            await fetch('/admin/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('登出请求失败:', error);
            // 即使API调用失败，也要清除本地令牌
        } finally {
            // 清除本地存储的令牌
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminToken_expires');
            
            this.isLoggedIn = false;
            this.showLoginForm();
            
            // 刷新页面以确保所有组件重置
            window.location.reload();
        }
    },
    
    // 显示登录表单
    showLoginForm() {
        const loginContainer = document.getElementById('loginContainer');
        const adminContainer = document.getElementById('adminContainer');
        
        if (loginContainer) {
            loginContainer.style.display = 'block';
            // 添加淡入动画
            loginContainer.style.opacity = '0';
            setTimeout(() => {
                loginContainer.style.transition = 'opacity 0.3s ease';
                loginContainer.style.opacity = '1';
            }, 10);
        }
        
        if (adminContainer) adminContainer.style.display = 'none';
    },
    
    // 显示仪表板 - 重定向到admin.html页面
    showDashboard() {
        console.log('执行showDashboard方法');
        console.log('当前路径:', window.location.pathname);
        console.log('令牌存在:', !!localStorage.getItem('adminToken'));
        
        // 检查当前页面是否已经是admin.html，如果是，就不再重定向
        if (window.location.pathname.endsWith('admin.html')) {
            console.log('已经在admin.html页面，无需重定向');
            return;
        }
        
        // 确保路径正确
        const adminPath = '/admin/admin.html';
        console.log('准备重定向到:', adminPath);
        window.location.href = adminPath;
    },
    
    // 获取认证令牌
    getAuthToken() {
        return localStorage.getItem('adminToken');
    },
    
    // 检查令牌是否过期
    isTokenExpired() {
        const expiresAt = localStorage.getItem('adminToken_expires');
        return expiresAt ? Date.now() > parseInt(expiresAt) : true;
    },
    
    // 验证令牌并刷新（如果需要）
    async validateAndRefreshToken() {
        if (this.isTokenExpired()) {
            // 令牌过期，清除并返回false
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminToken_expires');
            this.isLoggedIn = false;
            return false;
        }
        return true;
    }
};

// 初始化登录系统
document.addEventListener('DOMContentLoaded', function() {
    // 添加页面加载动画
    const body = document.querySelector('body');
    body.style.opacity = '0';
    body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        AdminAuth.init();
        body.style.opacity = '1';
        
        // 添加输入框自动聚焦
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.focus();
        }
    }, 300);
});

// 添加键盘快捷键支持
document.addEventListener('keydown', function(e) {
    // Ctrl+Enter 快速登录
    if (e.ctrlKey && e.key === 'Enter') {
        const loginBtn = document.querySelector('.btn-login');
        if (loginBtn && !loginBtn.disabled) {
            AdminAuth.handleLogin();
        }
    }
    
    // Enter 键在输入框内直接登录
    if (e.key === 'Enter' && !e.ctrlKey) {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.id === 'username' || activeElement.id === 'password')) {
            AdminAuth.handleLogin();
        }
    }
});

// 添加全局API请求拦截器，自动添加认证头
globalThis.apiRequest = async (endpoint, options = {}) => {
    // 确保令牌有效
    const isValid = await AdminAuth.validateAndRefreshToken();
    if (!isValid) {
        // 令牌无效，跳转到登录
        AdminAuth.showLoginForm();
        throw new Error('认证失败，请重新登录');
    }
    
    // 添加认证头
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${AdminAuth.getAuthToken()}`,
        'Content-Type': 'application/json'
    };
    
    // 发送请求
    const response = await fetch(endpoint, options);
    
    // 检查响应状态
    if (response.status === 401) {
        // 认证失败，清除令牌并跳转到登录
        AdminAuth.handleLogout();
        throw new Error('认证失败，请重新登录');
    }
    
    return response;
};