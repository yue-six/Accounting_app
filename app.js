// 支付宝OAuth服务类
class AlipayOAuthService {
    constructor() {
        this.config = {
            appId: '2021000116691234',
            privateKey: '',
            publicKey: ''
        };
        this.oauthConfig = {
            authorizeUrl: 'https://openauth.alipay.com/oauth2/publicAppAuthorize.htm',
            accessTokenUrl: 'https://openapi.alipay.com/gateway.do',
            userInfoUrl: 'https://openapi.alipay.com/gateway.do'
        };
    }

    /**
     * 生成支付宝OAuth2授权URL
     * @param {string} redirectUri - 回调地址
     * @param {string} state - 状态参数（可选）
     * @returns {string} 授权URL
     */
    generateAuthUrl(redirectUri, state = '') {
        const params = new URLSearchParams({
            app_id: this.config.appId,
            // do not double-encode: URLSearchParams will encode values
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'auth_user',
            state: state
        });

        return `${this.oauthConfig.authorizeUrl}?${params.toString()}`;
    }

    /**
     * 使用授权码获取access_token
     * @param {string} code - 授权码
     * @returns {Promise<Object>} access_token信息
     */
    async getAccessToken(code) {
        try {
            // 检查是否为演示模式
            if (this.config.appId.startsWith('demo_') || this.config.appId === 'demo_alipay_app_id') {
                return {
                    access_token: 'demo_alipay_access_token_' + Date.now(),
                    expires_in: 7200,
                    refresh_token: 'demo_alipay_refresh_token_' + Date.now(),
                    user_id: 'demo_user_id_' + Date.now(),
                    scope: 'auth_user'
                };
            }

            // 实际环境中调用支付宝API
            const response = await fetch(this.oauthConfig.accessTokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    app_id: this.config.appId,
                    method: 'alipay.system.oauth.token',
                    format: 'JSON',
                    charset: 'utf-8',
                    sign_type: 'RSA2',
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    grant_type: 'authorization_code',
                    code: code
                })
            });

            const data = await response.json();
            if (data.error_response) {
                throw new Error(`获取access_token失败: ${data.error_response.msg}`);
            }

            return data.alipay_system_oauth_token_response;
        } catch (error) {
            console.error('获取支付宝access_token失败:', error);
            throw error;
        }
    }

    /**
     * 获取用户信息
     * @param {string} accessToken - access_token
     * @returns {Promise<Object>} 用户信息
     */
    async getUserInfo(accessToken) {
        try {
            // 检查是否为演示模式
            if (this.config.appId.startsWith('demo_') || this.config.appId === 'demo_alipay_app_id') {
                return {
                    user_id: 'demo_user_id_' + Date.now(),
                    nick_name: '支付宝用户',
                    avatar: 'https://tfs.alipayobjects.com/images/partner/T1BxhpXm0jXXXXXXXX',
                    gender: 'M',
                    province: '北京',
                    city: '北京',
                    country: '中国'
                };
            }

            // 实际环境中调用支付宝API
            const response = await fetch(this.oauthConfig.userInfoUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    app_id: this.config.appId,
                    method: 'alipay.user.info.share',
                    format: 'JSON',
                    charset: 'utf-8',
                    sign_type: 'RSA2',
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    auth_token: accessToken
                })
            });

            const data = await response.json();
            if (data.error_response) {
                throw new Error(`获取用户信息失败: ${data.error_response.msg}`);
            }

            return data.alipay_user_info_share_response;
        } catch (error) {
            console.error('获取支付宝用户信息失败:', error);
            throw error;
        }
    }

    /**
     * 完整的OAuth2登录流程
     * @param {string} code - 授权码
     * @returns {Promise<Object>} 登录结果
     */
    async oauthLogin(code) {
        try {
            // 1. 获取access_token
            const tokenInfo = await this.getAccessToken(code);
            
            // 2. 获取用户信息
            const userInfo = await this.getUserInfo(tokenInfo.access_token);
            
            // 3. 返回完整的登录信息
            return {
                success: true,
                data: {
                    user: {
                        user_id: userInfo.user_id,
                        nickname: userInfo.nick_name,
                        avatar: userInfo.avatar,
                        gender: userInfo.gender,
                        province: userInfo.province,
                        city: userInfo.city,
                        country: userInfo.country
                    },
                    tokenInfo: {
                        access_token: tokenInfo.access_token,
                        expires_in: tokenInfo.expires_in,
                        refresh_token: tokenInfo.refresh_token,
                        scope: tokenInfo.scope
                    }
                }
            };
        } catch (error) {
            console.error('支付宝OAuth2登录失败:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
}

// 微信OAuth服务类
class WechatOAuthService {
    constructor() {
        this.config = {
            appId: 'demo_wechat_app_id',
            appSecret: 'demo_wechat_app_secret'
        };
        this.oauthConfig = {
            authorizeUrl: 'https://open.weixin.qq.com/connect/qrconnect',
            accessTokenUrl: 'https://api.weixin.qq.com/sns/oauth2/access_token',
            userInfoUrl: 'https://api.weixin.qq.com/sns/userinfo'
        };
    }

    /**
     * 生成微信OAuth2授权URL
     * @param {string} redirectUri - 回调地址
     * @param {string} state - 状态参数（可选）
     * @returns {string} 授权URL
     */
    generateAuthUrl(redirectUri, state = '') {
        const params = new URLSearchParams({
            appid: this.config.appId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'snsapi_login',
            state: state
        });

        return `${this.oauthConfig.authorizeUrl}?${params.toString()}#wechat_redirect`;
    }

    /**
     * 使用授权码获取access_token
     * @param {string} code - 授权码
     * @returns {Promise<Object>} access_token信息
     */
    async getAccessToken(code) {
        try {
            // 检查是否为演示模式
            if (this.config.appId.startsWith('demo_') || this.config.appId === 'demo_wechat_app_id') {
                return {
                    access_token: 'demo_access_token_' + Date.now(),
                    expires_in: 7200,
                    refresh_token: 'demo_refresh_token_' + Date.now(),
                    openid: 'demo_openid_' + Date.now(),
                    scope: 'snsapi_login',
                    unionid: 'demo_unionid_' + Date.now()
                };
            }

            // 实际环境中调用微信API
            const response = await fetch(this.oauthConfig.accessTokenUrl, {
                method: 'GET',
                params: {
                    appid: this.config.appId,
                    secret: this.config.appSecret,
                    code: code,
                    grant_type: 'authorization_code'
                }
            });

            const data = await response.json();
            if (data.errcode) {
                throw new Error(`获取access_token失败: ${data.errmsg}`);
            }

            return data;
        } catch (error) {
            console.error('获取微信access_token失败:', error);
            throw error;
        }
    }

    /**
     * 获取用户信息
     * @param {string} accessToken - access_token
     * @param {string} openid - 用户openid
     * @returns {Promise<Object>} 用户信息
     */
    async getUserInfo(accessToken, openid) {
        try {
            // 检查是否为演示模式
            if (this.config.appId.startsWith('demo_') || this.config.appId === 'demo_wechat_app_id') {
                return {
                    openid: openid,
                    nickname: '微信用户',
                    sex: 1,
                    province: '北京',
                    city: '北京',
                    country: '中国',
                    headimgurl: 'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132',
                    privilege: [],
                    unionid: openid.replace('demo_openid_', 'demo_unionid_')
                };
            }

            // 实际环境中调用微信API
            const response = await fetch(this.oauthConfig.userInfoUrl, {
                method: 'GET',
                params: {
                    access_token: accessToken,
                    openid: openid,
                    lang: 'zh_CN'
                }
            });

            const data = await response.json();
            if (data.errcode) {
                throw new Error(`获取用户信息失败: ${data.errmsg}`);
            }

            return data;
        } catch (error) {
            console.error('获取微信用户信息失败:', error);
            throw error;
        }
    }

    /**
     * 完整的OAuth2登录流程
     * @param {string} code - 授权码
     * @returns {Promise<Object>} 登录结果
     */
    async oauthLogin(code) {
        try {
            // 1. 获取access_token
            const tokenInfo = await this.getAccessToken(code);
            
            // 2. 获取用户信息
            const userInfo = await this.getUserInfo(tokenInfo.access_token, tokenInfo.openid);
            
            // 3. 返回完整的登录信息
            return {
                success: true,
                data: {
                    user: {
                        openid: userInfo.openid,
                        unionid: userInfo.unionid,
                        nickname: userInfo.nickname,
                        avatar: userInfo.headimgurl,
                        gender: userInfo.sex,
                        province: userInfo.province,
                        city: userInfo.city,
                        country: userInfo.country
                    },
                    tokenInfo: {
                        access_token: tokenInfo.access_token,
                        expires_in: tokenInfo.expires_in,
                        refresh_token: tokenInfo.refresh_token,
                        scope: tokenInfo.scope
                    }
                }
            };
        } catch (error) {
            console.error('微信OAuth2登录失败:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 验证access_token是否有效
     * @param {string} accessToken - access_token
     * @param {string} openid - 用户openid
     * @returns {Promise<boolean>} 是否有效
     */
    async validateAccessToken(accessToken, openid) {
        try {
            const response = await fetch('https://api.weixin.qq.com/sns/auth', {
                method: 'GET',
                params: {
                    access_token: accessToken,
                    openid: openid
                }
            });

            const data = await response.json();
            return data.errcode === 0;
        } catch (error) {
            console.error('验证access_token失败:', error);
            return false;
        }
    }

    /**
     * 刷新access_token
     * @param {string} refreshToken - refresh_token
     * @returns {Promise<Object>} 新的token信息
     */
    async refreshAccessToken(refreshToken) {
        try {
            const response = await fetch('https://api.weixin.qq.com/sns/oauth2/refresh_token', {
                method: 'GET',
                params: {
                    appid: this.config.appId,
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken
                }
            });

            const data = await response.json();
            if (data.errcode) {
                throw new Error(`刷新access_token失败: ${data.errmsg}`);
            }

            return data;
        } catch (error) {
            console.error('刷新微信access_token失败:', error);
            throw error;
        }
    }
}

// 记账应用核心功能实现
class AccountingApp {
    constructor() {
        this.transactions = [];
        this.categories = [
            { id: 'food', name: '餐饮', color: '#ff6b6b', icon: '🍽️' },
            { id: 'transport', name: '交通', color: '#4ecdc4', icon: '🚗' },
            { id: 'shopping', name: '购物', color: '#45b7d1', icon: '🛍️' },
            { id: 'entertainment', name: '娱乐', color: '#96ceb4', icon: '🎮' },
            { id: 'study', name: '学习', color: '#feca57', icon: '📚' },
            { id: 'salary', name: '工资', color: '#4fd1c5', icon: '💰' },
            { id: 'investment', name: '投资', color: '#667eea', icon: '📈' },
            { id: 'other', name: '其他', color: '#a0aec0', icon: '📦' }
        ];
        this.budgets = {};
        this.userMode = 'student';
        
        // OAuth服务
        this.wechatOAuth = new WechatOAuthService();
        this.alipayOAuth = new AlipayOAuthService();
        
        // 用户状态管理
        this.currentUser = null;
        this.isLoggedIn = false;
        
        this.init();
    }

    // 初始化应用
    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateUI();
        this.setupMockData();
        
        // 初始化用户状态
        this.updateUserInfo();
        this.checkLoginStatus();
    }

    // 加载本地数据
    loadData() {
        const savedData = localStorage.getItem('accountingAppData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.transactions = data.transactions || [];
            this.budgets = data.budgets || {};
            this.userMode = data.userMode || 'student';
        }
        
        // 加载用户登录状态
        const userData = localStorage.getItem('auth_user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.isLoggedIn = true;
        }
    }

    // 保存数据到本地存储
    saveData() {
        const data = {
            transactions: this.transactions,
            budgets: this.budgets,
            userMode: this.userMode,
            lastSave: new Date().toISOString()
        };
        localStorage.setItem('accountingAppData', JSON.stringify(data));
    }

    // 设置事件监听器
    setupEventListeners() {
        // 快速记账按钮
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.closest('.action-btn').querySelector('i').className;
                if (action.includes('microphone')) this.showVoiceInput();
                else if (action.includes('qrcode')) this.showQRScanner();
                else if (action.includes('edit')) this.showManualInput();
                else if (action.includes('camera')) this.showPhotoInput();
            });
        });

        // 交易项点击事件
        document.addEventListener('click', (e) => {
            if (e.target.closest('.transaction-item')) {
                const index = Array.from(document.querySelectorAll('.transaction-item')).indexOf(e.target.closest('.transaction-item'));
                this.editTransaction(index);
            }
        });

        // 用户模式切换
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setUserMode(e.target.textContent.trim());
            });
        });

        // 平台同步切换
        document.querySelectorAll('.platform-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
                e.target.closest('.platform-btn').classList.add('active');
                this.showToast('同步设置已更新');
            });
        });

        // 微信登录按钮
        const wechatLoginBtn = document.getElementById('wechat-login-btn');
        if (wechatLoginBtn) {
            wechatLoginBtn.addEventListener('click', () => {
                this.showWechatLogin();
            });
        }

        // 支付宝登录按钮
        const alipayLoginBtn = document.getElementById('alipay-login-btn');
        if (alipayLoginBtn) {
            alipayLoginBtn.addEventListener('click', () => {
                this.showAlipayLogin();
            });
        }

        // 用户登出按钮
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // 触摸滑动支持
        this.setupSwipeSupport();
    }

    // 设置滑动支持
    setupSwipeSupport() {
        let startX = 0;
        let currentPage = 0;
        const pages = ['home-page', 'analysis-page', 'profile-page'];

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        document.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const diffX = startX - endX;

            if (Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    currentPage = Math.min(currentPage + 1, pages.length - 1);
                } else {
                    currentPage = Math.max(currentPage - 1, 0);
                }
                this.switchPage(pages[currentPage]);
            }
        });
    }

    // 页面切换功能（已由路由系统接管，保留兼容性）
    switchPage(pageId) {
        // 将页面ID转换为路由名称
        let routeName = pageId;
        if (pageId === 'home-page') routeName = 'home';
        else if (pageId === 'analysis-page') routeName = 'analysis';
        else if (pageId === 'profile-page') routeName = 'profile';
        
        // 使用路由系统切换页面
        if (window.router && typeof window.router.switchToPage === 'function') {
            window.router.switchToPage(routeName);
        } else {
            console.warn('路由系统未初始化，使用兼容模式');
            // 兼容模式：简单的页面切换
            try {
                document.querySelectorAll('.page').forEach(page => {
                    page.classList.remove('active');
                });
                
                const targetPage = document.getElementById(pageId);
                if (targetPage) {
                    targetPage.classList.add('active');
                }
            } catch (error) {
                console.error('页面切换失败:', error);
            }
        }
    }

    // 设置模拟数据（演示用）
    setupMockData() {
        if (this.transactions.length === 0) {
            const mockTransactions = [
                {
                    id: this.generateId(),
                    type: 'expense',
                    amount: 28,
                    category: 'food',
                    description: '早餐',
                    merchant: '麦当劳',
                    date: new Date().toISOString(),
                    time: '08:30'
                },
                {
                    id: this.generateId(),
                    type: 'income',
                    amount: 8000,
                    category: 'salary',
                    description: '工资收入',
                    merchant: '公司转账',
                    date: new Date(Date.now() - 86400000).toISOString(),
                    time: '09:00'
                },
                {
                    id: this.generateId(),
                    type: 'expense',
                    amount: 6,
                    category: 'transport',
                    description: '地铁交通',
                    merchant: '北京地铁',
                    date: new Date().toISOString(),
                    time: '18:15'
                }
            ];
            this.transactions = mockTransactions;
            this.saveData();
        }
    }

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 添加交易
    addTransaction(transactionData) {
        const transaction = {
            id: this.generateId(),
            ...transactionData,
            date: new Date().toISOString(),
            time: new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })
        };
        
        this.transactions.unshift(transaction);
        this.saveData();
        this.updateUI();
        
        // 显示成功提示
        this.showToast('记账成功！');
    }

    // 编辑交易
    editTransaction(index) {
        const transaction = this.transactions[index];
        this.showTransactionModal(transaction, index);
    }

    // 删除交易
    deleteTransaction(index) {
        if (confirm('确定要删除这条交易记录吗？')) {
            this.transactions.splice(index, 1);
            this.saveData();
            this.updateUI();
            this.showToast('删除成功！');
        }
    }

    // 更新UI
    updateUI() {
        this.updateTodayStats();
        this.updateTransactionList();
        this.updateCharts();
        this.updateBudgets();
        this.updateAppInfo();
    }

    // 更新今日统计
    updateTodayStats() {
        const today = new Date().toDateString();
        const todayTransactions = this.transactions.filter(t => 
            new Date(t.date).toDateString() === today
        );

        const income = todayTransactions.filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const expense = todayTransactions.filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expense;

        document.querySelectorAll('.stat-value')[0].textContent = `¥${income}`;
        document.querySelectorAll('.stat-value')[1].textContent = `¥${expense}`;
        document.querySelectorAll('.stat-value')[2].textContent = `¥${balance}`;
        
        // 预算进度（演示数据）
        document.querySelectorAll('.stat-value')[3].textContent = '78%';
    }

    // 更新交易列表
    updateTransactionList() {
        const container = document.querySelector('.transaction-list');
        if (!container) return;

        const recentTransactions = this.transactions.slice(0, 10);
        
        container.innerHTML = recentTransactions.map((transaction, index) => {
            const category = this.categories.find(c => c.id === transaction.category);
            const isToday = new Date(transaction.date).toDateString() === new Date().toDateString();
            const displayDate = isToday ? transaction.time : new Date(transaction.date).toLocaleDateString('zh-CN');
            
            return `
                <div class="transaction-item" data-index="${index}">
                    <div class="transaction-info">
                        <div class="transaction-title">${transaction.description}</div>
                        <div class="transaction-detail">${transaction.merchant} · ${category.name} · ${displayDate}</div>
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'}¥${transaction.amount}
                    </div>
                </div>
            `;
        }).join('');
    }

    // 更新图表
    updateCharts() {
        this.updateCategoryChart();
        this.updateMonthlyChart();
    }

    // 更新分类图表
    updateCategoryChart() {
        const ctx = document.getElementById('categoryChart')?.getContext('2d');
        if (!ctx) return;

        const categoryData = this.categories.map(category => {
            const amount = this.transactions
                .filter(t => t.category === category.id && t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            return amount;
        });

        if (window.categoryChart) {
            window.categoryChart.destroy();
        }

        window.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: this.categories.map(c => c.name),
                datasets: [{
                    data: categoryData,
                    backgroundColor: this.categories.map(c => c.color),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    // 更新月度图表
    updateMonthlyChart() {
        const ctx = document.getElementById('monthlyChart')?.getContext('2d');
        if (!ctx) return;

        // 模拟6个月的数据
        const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
        const incomeData = [8000, 8500, 9200, 7800, 9500, 10000];
        const expenseData = [6500, 7200, 6800, 7500, 8200, 7800];

        if (window.monthlyChart) {
            window.monthlyChart.destroy();
        }

        window.monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: '收入',
                    data: incomeData,
                    borderColor: '#4fd1c5',
                    backgroundColor: 'rgba(79, 209, 197, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: '支出',
                    data: expenseData,
                    borderColor: '#f56565',
                    backgroundColor: 'rgba(245, 101, 101, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                }
            }
        });
    }

    // 更新预算
    updateBudgets() {
        // 预算功能实现
    }

    // 更新应用信息
    updateAppInfo() {
        const transactionCount = document.getElementById('transaction-count');
        const lastUpdate = document.getElementById('last-update');
        
        if (transactionCount) {
            transactionCount.textContent = this.transactions.length;
        }
        
        if (lastUpdate) {
            const now = new Date();
            lastUpdate.textContent = now.toLocaleTimeString('zh-CN');
        }
    }

    // 导出数据
    exportData() {
        const data = {
            transactions: this.transactions,
            budgets: this.budgets,
            userMode: this.userMode,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `记账数据_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('数据导出成功！');
    }

    // 清除数据
    clearData() {
        if (confirm('确定要清除所有数据吗？此操作不可撤销！')) {
            localStorage.removeItem('accountingAppData');
            this.transactions = [];
            this.budgets = {};
            this.saveData();
            this.updateUI();
            this.showToast('数据已清除');
        }
    }

    // 导入数据
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        this.transactions = data.transactions || [];
                        this.budgets = data.budgets || {};
                        this.userMode = data.userMode || 'student';
                        this.saveData();
                        this.updateUI();
                        this.showToast('数据导入成功！');
                    } catch (error) {
                        this.showToast('导入失败：文件格式错误');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    // 设置用户模式
    setUserMode(mode) {
        this.userMode = mode;
        this.saveData();
        
        // 更新UI显示
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.trim() === mode) {
                btn.classList.add('active');
            }
        });
        
        this.showToast(`已切换到${mode}`);
    }

    // 显示语音输入
    showVoiceInput() {
        this.showModal('语音记账', `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">🎤</div>
                <p>请说出您的记账内容，例如：</p>
                <p style="color: #666; margin: 10px 0;">"今天买咖啡花了30元"</p>
                <p style="color: #666; margin: 10px 0;">"工资收入8000元"</p>
                <button class="action-btn" style="margin-top: 20px;" onclick="app.simulateVoiceInput()">
                    模拟语音输入
                </button>
            </div>
        `);
    }

    // 模拟语音输入
    simulateVoiceInput() {
        const examples = [
            { amount: 30, description: '咖啡', category: 'food', type: 'expense' },
            { amount: 8000, description: '工资', category: 'salary', type: 'income' },
            { amount: 15, description: '午餐', category: 'food', type: 'expense' }
        ];
        const example = examples[Math.floor(Math.random() * examples.length)];
        
        this.addTransaction(example);
        this.hideModal();
        this.showToast('语音识别成功！');
    }

    // 显示扫码功能
    showQRScanner() {
        this.showModal('扫码记账', `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">📱</div>
                <p>请扫描商品二维码或条形码</p>
                <button class="action-btn" style="margin-top: 20px;" onclick="app.simulateQRScan()">
                    模拟扫码
                </button>
            </div>
        `);
    }

    // 模拟扫码
    simulateQRScan() {
        this.addTransaction({
            amount: 25,
            description: '扫码商品',
            category: 'shopping',
            type: 'expense',
            merchant: '扫码识别'
        });
        this.hideModal();
        this.showToast('扫码成功！');
    }

    // 显示手动输入
    showManualInput() {
        this.showTransactionModal();
    }

    // 显示拍照输入
    showPhotoInput() {
        this.showModal('拍照记账', `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">📷</div>
                <p>请拍摄小票或账单照片</p>
                <button class="action-btn" style="margin-top: 20px;" onclick="app.simulatePhotoInput()">
                    模拟拍照
                </button>
            </div>
        `);
    }

    // 模拟拍照输入
    simulatePhotoInput() {
        this.addTransaction({
            amount: 158,
            description: '超市购物',
            category: 'shopping',
            type: 'expense',
            merchant: '照片识别'
        });
        this.hideModal();
        this.showToast('照片识别成功！');
    }

    // 显示交易模态框
    showTransactionModal(transaction = null, index = null) {
        const isEdit = transaction !== null;
        const categoriesOptions = this.categories.map(cat => 
            `<option value="${cat.id}" ${transaction?.category === cat.id ? 'selected' : ''}>${cat.icon} ${cat.name}</option>`
        ).join('');

        this.showModal(isEdit ? '编辑交易' : '新增交易', `
            <div style="padding: 20px;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">类型</label>
                    <select id="transaction-type" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                        <option value="income" ${transaction?.type === 'income' ? 'selected' : ''}>收入</option>
                        <option value="expense" ${!transaction || transaction?.type === 'expense' ? 'selected' : ''}>支出</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">金额</label>
                    <input type="number" id="transaction-amount" value="${transaction?.amount || ''}" 
                           placeholder="输入金额" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">分类</label>
                    <select id="transaction-category" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                        ${categoriesOptions}
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">描述</label>
                    <input type="text" id="transaction-description" value="${transaction?.description || ''}" 
                           placeholder="交易描述" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">商户</label>
                    <input type="text" id="transaction-merchant" value="${transaction?.merchant || ''}" 
                           placeholder="商户名称" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button class="action-btn" style="flex: 1;" onclick="app.${isEdit ? 'updateTransaction' : 'saveTransaction'}(${index})">
                        ${isEdit ? '更新' : '保存'}
                    </button>
                    ${isEdit ? `<button class="action-btn" style="flex: 1; background: #f56565;" onclick="app.deleteTransaction(${index})">删除</button>` : ''}
                    <button class="action-btn" style="flex: 1; background: #718096;" onclick="app.hideModal()">取消</button>
                </div>
            </div>
        `);
    }

    // 保存交易
    saveTransaction() {
        const type = document.getElementById('transaction-type').value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const category = document.getElementById('transaction-category').value;
        const description = document.getElementById('transaction-description').value;
        const merchant = document.getElementById('transaction-merchant').value;

        if (!amount || !description) {
            this.showToast('请填写完整信息！');
            return;
        }

        this.addTransaction({
            type,
            amount,
            category,
            description,
            merchant
        });

        this.hideModal();
    }

    // 更新交易
    updateTransaction(index) {
        const type = document.getElementById('transaction-type').value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const category = document.getElementById('transaction-category').value;
        const description = document.getElementById('transaction-description').value;
        const merchant = document.getElementById('transaction-merchant').value;

        if (!amount || !description) {
            this.showToast('请填写完整信息！');
            return;
        }

        this.transactions[index] = {
            ...this.transactions[index],
            type,
            amount,
            category,
            description,
            merchant
        };

        this.saveData();
        this.updateUI();
        this.hideModal();
        this.showToast('更新成功！');
    }

    // 显示模态框
    showModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;

        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                border-radius: 20px;
                padding: 0;
                max-width: 400px;
                width: 100%;
                max-height: 80vh;
                overflow: auto;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            ">
                <div style="padding: 20px; border-bottom: 1px solid #eee;">
                    <h3 style="margin: 0; color: #2d3748;">${title}</h3>
                </div>
                ${content}
            </div>
        `;

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal();
            }
        });

        document.body.appendChild(modal);
        this.currentModal = modal;
    }

    // 隐藏模态框
    hideModal() {
        if (this.currentModal) {
            document.body.removeChild(this.currentModal);
            this.currentModal = null;
        }
    }

    // 显示提示信息
    showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            z-index: 10001;
            font-size: 14px;
            backdrop-filter: blur(10px);
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 2000);
    }

    // 显示微信登录弹窗
    showWechatLogin() {
        // 直接启动微信OAuth登录，不显示弹窗
        this.startWechatOAuthLogin();
    }

    // 启动微信OAuth登录
    async startWechatOAuthLogin() {
        this.showToast('正在启动微信登录...');
        
        try {
            // 生成授权URL（更加容错）
            const redirectUri = window.location.origin + '/wechat-callback.html';
            const state = 'wechat_login_' + Date.now();

            let authUrl = null;
            try {
                authUrl = this.wechatOAuth.generateAuthUrl(redirectUri, state);
            } catch (e) {
                console.warn('generateAuthUrl threw, will fallback to manual build:', e);
            }

            // 备用构建：如果 generateAuthUrl 未返回合法字符串，则手动构建
            if (!authUrl || typeof authUrl !== 'string') {
                try {
                    const params = new URLSearchParams({
                        appid: this.wechatOAuth.config.appId || this.wechatOAuth.config.appId,
                        redirect_uri: redirectUri,
                        response_type: 'code',
                        scope: 'snsapi_login',
                        state: state
                    });
                    authUrl = `${this.wechatOAuth.oauthConfig.authorizeUrl}?${params.toString()}#wechat_redirect`;
                } catch (e) {
                    console.error('手动构建微信授权URL失败:', e);
                    throw e;
                }
            }

            // 保存state用于验证（容错处理）
            try { sessionStorage.setItem('wechat_oauth_state', state); } catch (e) { console.warn('无法写入 sessionStorage.wechat_oauth_state:', e); }

            // 跳转到微信授权页面
            window.location.href = authUrl;
            
        } catch (error) {
            console.error('启动微信登录失败:', error);
            this.showToast('启动微信登录失败，请重试');
        }
    }

    // 处理微信OAuth回调
    async handleWechatOAuthCallback(code, state) {
        try {
            // 验证state参数
            const savedState = sessionStorage.getItem('wechat_oauth_state');
            if (state !== savedState) {
                throw new Error('状态参数验证失败');
            }
            
            this.showToast('正在验证登录信息...', 'info');
            
            // 调用微信OAuth登录
            const result = await this.wechatOAuth.oauthLogin(code);
            
            if (result.success) {
                // 保存用户信息
                this.currentUser = {
                    provider: 'wechat',
                    ...result.data.user,
                    tokenInfo: result.data.tokenInfo,
                    loginTime: new Date().toISOString()
                };
                
                this.isLoggedIn = true;
                
                // 保存到本地存储
                localStorage.setItem('auth_user', JSON.stringify(this.currentUser));
                
                this.showToast('登录成功！', 'success');
                
                // 更新UI显示用户信息
                this.updateUserInfo();
                
                // 清除state
                sessionStorage.removeItem('wechat_oauth_state');
                
                // 跳转到首页
                setTimeout(() => {
                    if (window.router) {
                        window.router.switchToPage('home');
                    }
                }, 1000);
                
            } else {
                this.showToast('登录失败：' + result.message, 'error');
            }
            
        } catch (error) {
            console.error('微信OAuth回调处理失败:', error);
            this.showToast('登录失败，请重试', 'error');
        }
    }

    // 显示支付宝登录弹窗
    showAlipayLogin() {
        // 直接启动支付宝OAuth登录，不显示弹窗
        this.startAlipayOAuthLogin();
    }

    // 启动支付宝OAuth登录
    async startAlipayOAuthLogin() {
        this.showToast('正在启动支付宝登录...');
        
        try {
            // 生成授权URL（容错）
            const redirectUri = window.location.origin + '/alipay-callback.html';
            const state = 'alipay_login_' + Date.now();

            let authUrl = null;
            try {
                authUrl = this.alipayOAuth.generateAuthUrl(redirectUri, state);
            } catch (e) {
                console.warn('Alipay generateAuthUrl threw, fallback to manual build:', e);
            }

            if (!authUrl || typeof authUrl !== 'string') {
                try {
                    const params = new URLSearchParams({
                        app_id: this.alipayOAuth.config.appId,
                        redirect_uri: redirectUri,
                        response_type: 'code',
                        scope: 'auth_user',
                        state: state
                    });
                    authUrl = `${this.alipayOAuth.oauthConfig.authorizeUrl}?${params.toString()}`;
                } catch (e) {
                    console.error('手动构建支付宝授权URL失败:', e);
                    throw e;
                }
            }

            try { sessionStorage.setItem('alipay_oauth_state', state); } catch (e) { console.warn('无法写入 sessionStorage.alipay_oauth_state:', e); }

            window.location.href = authUrl;
            
        } catch (error) {
            console.error('启动支付宝登录失败:', error);
            this.showToast('启动支付宝登录失败，请重试');
        }
    }

    // 处理支付宝OAuth回调
    async handleAlipayOAuthCallback(code, state) {
        try {
            // 验证state参数
            const savedState = sessionStorage.getItem('alipay_oauth_state');
            if (state !== savedState) {
                throw new Error('状态参数验证失败');
            }
            
            this.showToast('正在验证登录信息...', 'info');
            
            // 调用支付宝OAuth登录
            const result = await this.alipayOAuth.oauthLogin(code);
            
            if (result.success) {
                // 保存用户信息
                this.currentUser = {
                    provider: 'alipay',
                    ...result.data.user,
                    tokenInfo: result.data.tokenInfo,
                    loginTime: new Date().toISOString()
                };
                
                this.isLoggedIn = true;
                
                // 保存到本地存储
                localStorage.setItem('auth_user', JSON.stringify(this.currentUser));
                
                this.showToast('登录成功！', 'success');
                
                // 更新UI显示用户信息
                this.updateUserInfo();
                
                // 清除state
                sessionStorage.removeItem('alipay_oauth_state');
                
                // 跳转到首页
                setTimeout(() => {
                    if (window.router) {
                        window.router.switchToPage('home');
                    }
                }, 1000);
                
            } else {
                this.showToast('登录失败：' + result.message, 'error');
            }
            
        } catch (error) {
            console.error('支付宝OAuth回调处理失败:', error);
            this.showToast('登录失败，请重试', 'error');
        }
    }

    // 用户登出
    logout() {
        if (confirm('确定要退出登录吗？')) {
            this.currentUser = null;
            this.isLoggedIn = false;
            
            // 清除本地存储
            localStorage.removeItem('auth_user');
            
            this.showToast('已退出登录');
            this.updateUserInfo();
        }
    }

    // 更新用户信息显示
    updateUserInfo() {
        const userInfoElement = document.getElementById('user-info');
        const wechatLoginBtn = document.getElementById('wechat-login-btn');
        const alipayLoginBtn = document.getElementById('alipay-login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (this.isLoggedIn && this.currentUser) {
            // 显示用户信息
            if (userInfoElement) {
                const providerColor = this.currentUser.provider === 'wechat' ? '#09bb07' : '#1677ff';
                const providerName = this.currentUser.provider === 'wechat' ? '微信' : '支付宝';
                const providerIcon = this.currentUser.provider === 'wechat' ? 'fab fa-weixin' : 'fab fa-alipay';
                
                userInfoElement.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 32px; height: 32px; background: ${providerColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.8rem;">
                            ${this.currentUser.nickname ? this.currentUser.nickname.charAt(0) : providerName.charAt(0)}
                        </div>
                        <div>
                            <div style="font-size: 0.9rem; font-weight: 600;">${this.currentUser.nickname || providerName + '用户'}</div>
                            <div style="font-size: 0.7rem; color: #666;">
                                <i class="${providerIcon}" style="margin-right: 4px;"></i>
                                ${providerName}登录
                            </div>
                        </div>
                    </div>
                `;
            }
            
            // 隐藏登录按钮，显示登出按钮
            if (wechatLoginBtn) wechatLoginBtn.style.display = 'none';
            if (alipayLoginBtn) alipayLoginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            
        } else {
            // 显示登录按钮
            if (userInfoElement) {
                userInfoElement.innerHTML = `
                    <div style="text-align: center; color: #666;">
                        <i class="fas fa-user" style="font-size: 1.5rem; margin-bottom: 8px; display: block;"></i>
                        <div style="font-size: 0.9rem;">未登录</div>
                    </div>
                `;
            }
            
            // 显示登录按钮，隐藏登出按钮
            if (wechatLoginBtn) wechatLoginBtn.style.display = 'block';
            if (alipayLoginBtn) alipayLoginBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
        
        // 更新首页支付连接状态
        this.updatePaymentConnectionStatus();
    }

    // 更新支付连接状态
    updatePaymentConnectionStatus() {
        // 如果首页存在，更新支付连接状态
        if (window.homePage && typeof window.homePage.updatePaymentStatus === 'function') {
            try {
                window.homePage.updatePaymentStatus();
            } catch (error) {
                console.error('更新支付连接状态失败:', error);
            }
        }
        
        // 同时更新我的页面的用户信息显示
        if (window.profilePage && typeof window.profilePage.updateData === 'function') {
            try {
                window.profilePage.updateData();
            } catch (error) {
                console.error('更新我的页面用户信息失败:', error);
            }
        }
    }

    // 检查用户登录状态
    checkLoginStatus() {
        if (this.isLoggedIn && this.currentUser) {
            // 检查token是否过期（简单检查）
            const loginTime = new Date(this.currentUser.loginTime);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
            
            // 如果超过24小时，提示重新登录
            if (hoursDiff > 24) {
                this.showToast('登录已过期，请重新登录', 'warning');
                this.logout();
            }
        }
    }

    // 获取当前用户信息
    getCurrentUser() {
        return this.currentUser;
    }

    // 检查是否已登录
    isUserLoggedIn() {
        return this.isLoggedIn;
    }
}

// 初始化应用
const app = new AccountingApp();