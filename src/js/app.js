// 记账应用核心类
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
        this.currentPage = 'home';
        this.inputManager = null;
        this.supabaseClient = null;
        this.useSupabase = false;
        this.useMemoryDB = false;
        this.databaseStatus = 'checking'; // checking, connected, disconnected
        
        // 新功能模块
        this.paymentSyncManager = null;
        this.advancedAnalytics = null;
        this.smartBudgetManager = null;
        this.voiceInputManager = null;
    }

    // 初始化应用
    async init() {
        // 优先使用Supabase数据库
        await this.initSupabase();
        
        if (this.useSupabase) {
            this.databaseStatus = 'connected';
            console.log('✅ Supabase数据库可用');
        } else {
            // 使用内存数据库
            this.useMemoryDB = true;
            this.databaseStatus = 'disconnected';
            console.log('📁 使用内存数据库（离线模式）');
        }
        
        await this.loadData();
        
        this.initInputManager();
        
        // 初始化完成后，更新页面显示
        if (typeof this.onDataLoaded === 'function') {
            this.onDataLoaded();
        }
    }

    // 初始化Supabase客户端
    async initSupabase() {
        if (typeof supabaseClient !== 'undefined') {
            this.supabaseClient = supabaseClient;
            this.useSupabase = await this.supabaseClient.init();
            if (this.useSupabase) {
                console.log('✅ 使用Supabase数据库');
            } else {
                console.log('📁 使用本地存储数据库');
            }
        }
    }

    // 初始化输入管理器
    initInputManager() {
        if (typeof InputManager !== 'undefined') {
            this.inputManager = new InputManager(this);
        }
    }

    // 加载数据
    async loadData() {
        if (this.useSupabase) {
            // 从Supabase加载数据
            const authStatus = await this.supabaseClient.checkAuth();
            if (authStatus.isAuthenticated) {
                this.transactions = await this.supabaseClient.getTransactions(authStatus.user.id) || [];
                // 可以添加其他数据的加载逻辑
            }
        } else {
            // 从本地存储加载数据
            const savedData = localStorage.getItem('accountingAppData');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.transactions = data.transactions || [];
                this.budgets = data.budgets || {};
                this.userMode = data.userMode || 'student';
            }
        }
    }

    // 保存数据
    async saveData() {
        if (this.useSupabase) {
            // 数据自动通过API保存，这里主要处理本地状态
            console.log('数据已通过Supabase API保存');
        } else {
            // 保存到本地存储
            const data = {
                transactions: this.transactions,
                budgets: this.budgets,
                userMode: this.userMode,
                lastSave: new Date().toISOString()
            };
            localStorage.setItem('accountingAppData', JSON.stringify(data));
        }
    }



    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 添加交易
    async addTransaction(transactionData) {
        const transaction = {
            id: this.generateId(),
            ...transactionData,
            date: new Date().toISOString(),
            time: new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })
        };
        
        try {
            // 首先尝试保存到后端API
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: transaction.type,
                    amount: transaction.amount,
                    categoryId: transaction.category,
                    description: transaction.description,
                    merchant: transaction.merchant,
                    transactionDate: transaction.date
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // 后端保存成功，更新本地数据
                    transaction.id = result.data.transaction.id;
                    this.transactions.unshift(transaction);
                    this.showToast('记账成功！');
                } else {
                    throw new Error(result.message || '保存失败');
                }
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('保存交易到后端失败:', error);
            
            // 后端保存失败，尝试使用Supabase或本地存储
            if (this.useSupabase) {
                // 保存到Supabase
                const savedTransaction = await this.supabaseClient.addTransaction(transaction);
                if (savedTransaction) {
                    transaction.id = savedTransaction.id;
                    this.transactions.unshift(transaction);
                    this.showToast('记账成功！');
                } else {
                    this.showToast('记账失败，请重试', 'error');
                    return null;
                }
            } else {
                // 保存到本地存储
                this.transactions.unshift(transaction);
                await this.saveData();
                this.showToast('记账成功！');
            }
        }
        
        // 触发数据更新事件
        if (typeof this.onTransactionAdded === 'function') {
            this.onTransactionAdded(transaction);
        }
        
        return transaction;
    }

    // 编辑交易
    async editTransaction(index, transactionData) {
        const transaction = this.transactions[index];
        
        try {
            // 首先尝试更新到后端API
            const response = await fetch(`/api/transactions/${transaction.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: transactionData.amount,
                    categoryId: transactionData.category,
                    description: transactionData.description,
                    merchant: transactionData.merchant
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // 后端更新成功，更新本地数据
                    this.transactions[index] = {
                        ...transaction,
                        ...transactionData
                    };
                    this.showToast('更新成功！');
                } else {
                    throw new Error(result.message || '更新失败');
                }
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('更新交易到后端失败:', error);
            
            // 后端更新失败，尝试使用Supabase或本地存储
            if (this.useSupabase) {
                // 更新到Supabase
                const success = await this.supabaseClient.updateTransaction(transaction.id, transactionData);
                if (success) {
                    this.transactions[index] = {
                        ...transaction,
                        ...transactionData
                    };
                    this.showToast('更新成功！');
                } else {
                    this.showToast('更新失败，请重试', 'error');
                    return;
                }
            } else {
                // 更新本地存储
                this.transactions[index] = {
                    ...transaction,
                    ...transactionData
                };
                await this.saveData();
                this.showToast('更新成功！');
            }
        }
    }

    // 获取认证令牌
    getToken() {
        const authUser = localStorage.getItem('auth_user');
        if (!authUser) return null;
        return JSON.parse(authUser).token || null;
    }

    // 删除交易
    async deleteTransaction(index) {
        const transaction = this.transactions[index];
        
        try {
            // 首先尝试从后端API删除
            const token = this.getToken();
            
            if (token) {
                try {
                    const response = await fetch(`/api/transactions/${transaction.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    // 检查是否是网络错误
                    if (!response.ok) {
                        if (response.status === 404) {
                            console.warn('交易记录不存在，执行本地删除');
                        } else if (response.status === 401 || response.status === 403) {
                            console.warn('未登录或登录已过期，执行本地删除');
                        } else {
                            console.warn('服务器错误，执行本地删除:', response.status);
                        }
                        // 网络错误时继续执行本地删除
                    } else {
                        const result = await response.json();
                        
                        if (result.success) {
                            // 后端删除成功，更新本地数据
                            this.transactions.splice(index, 1);
                            await this.saveData();
                            return true;
                        } else {
                            console.warn('后端删除失败，执行本地删除:', result.message);
                        }
                    }
                } catch (networkError) {
                    // 处理网络错误，尝试本地删除
                    console.warn('后端API不可用，执行本地删除:', networkError.message);
                }
            }
            
            // 本地删除逻辑（无论后端是否成功都执行）
            this.transactions.splice(index, 1);
            await this.saveData();
            return true;
            
        } catch (error) {
            console.error('删除交易失败:', error);
            
            // 根据错误类型显示不同的错误信息
            if (error.message === '未登录或登录已过期') {
                this.showToast('请先登录', 'error');
                // 简化处理，不进行页面跳转
            } else {
                this.showToast(error.message || '删除失败，请重试', 'error');
            }
            
            return false;
        }
    }

    // 获取今日统计
    getTodayStats() {
        const today = new Date().toDateString();
        const todayTransactions = this.transactions.filter(t => 
            new Date(t.date).toDateString() === today
        );

        const income = todayTransactions.filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const expense = todayTransactions.filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expense;

        return { income, expense, balance };
    }

    // 从后端API获取今日统计
    async getTodayStatsFromAPI() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await fetch(`/api/transactions/stats/summary?startDate=${today}&endDate=${today}`);
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    return result.data.stats;
                }
            }
        } catch (error) {
            console.error('获取API统计失败:', error);
        }
        
        // 如果API调用失败，返回本地计算的统计
        return this.getTodayStats();
    }

    // 获取本月统计
    getMonthlyStats() {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const monthlyTransactions = this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= start && transactionDate <= end;
        });

        const income = monthlyTransactions.filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const expense = monthlyTransactions.filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expense;

        return { income, expense, balance };
    }

    // 从后端API获取本月统计
    async getMonthlyStatsFromAPI() {
        try {
            const now = new Date();
            const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            
            const response = await fetch(`/api/transactions/stats/summary?startDate=${startDate}&endDate=${endDate}`);
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    return result.data.stats;
                }
            }
        } catch (error) {
            console.error('获取API本月统计失败:', error);
        }
        
        // 如果API调用失败，返回本地计算的统计
        return this.getMonthlyStats();
    }

    // 检查后端API是否可用
    async checkBackendAPI() {
        try {
            const response = await fetch('/api/health', {
                method: 'GET',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            console.log('后端API不可用，使用本地数据:', error.message);
            return false;
        }
    }

    // 获取分类统计
    getCategoryStats() {
        const stats = {};
        this.categories.forEach(category => {
            const amount = this.transactions
                .filter(t => t.category === category.id && t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            stats[category.id] = amount;
        });
        return stats;
    }

    // 设置用户模式
    setUserMode(mode) {
        this.userMode = mode;
        this.saveData();
        this.showToast(`已切换到${mode}`);
    }

    // 显示提示信息
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.textContent = message;
        
        const bgColor = type === 'error' ? '#e53e3e' : 
                       type === 'success' ? '#38a169' : 
                       type === 'warning' ? '#d69e2e' : 'rgba(0,0,0,0.8)';
        
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${bgColor};
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            z-index: 10001;
            font-size: 14px;
            backdrop-filter: blur(10px);
            max-width: 300px;
            text-align: center;
            word-wrap: break-word;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 2000);
    }

    // 获取输入管理器
    getInputManager() {
        return this.inputManager;
    }

    // 启动语音输入
    startVoiceInput() {
        if (this.inputManager) {
            this.inputManager.startVoiceInput();
        } else {
            this.showToast('语音输入功能未初始化', 'warning');
        }
    }

    // 启动扫码
    startQRScan() {
        if (this.inputManager) {
            this.inputManager.startQRScan();
        } else {
            this.showToast('扫码功能未初始化', 'warning');
        }
    }

    // 启动拍照输入
    startPhotoInput() {
        if (this.inputManager) {
            this.inputManager.startPhotoInput();
        } else {
            this.showToast('拍照功能未初始化', 'warning');
        }
    }

    // 启动微信OAuth登录
    startWechatOAuthLogin() {
        // 直接跳转到微信登录页面，不检查协议
        this.showPaymentLoginPage('wechat');
    }

    // 启动支付宝OAuth登录
    startAlipayOAuthLogin() {
        // 直接跳转到支付宝登录页面，不检查协议
        this.showPaymentLoginPage('alipay');
    }

    // 显示微信登录页面
    showWechatLogin() {
        this.showPaymentLoginPage('wechat');
    }

    // 显示支付宝登录页面
    showAlipayLogin() {
        this.showPaymentLoginPage('alipay');
    }

    // 用户登出
    logout() {
        // 清除本地存储的认证信息
        localStorage.removeItem('auth_user');
        localStorage.removeItem('paymentConnections');
        
        // 更新支付状态为未连接
        updatePaymentStatus('wechat', 'disconnected');
        updatePaymentStatus('alipay', 'disconnected');
        
        this.showToast('已成功登出', 'success');
        
        // 刷新页面或重新初始化应用
        if (typeof this.onLogout === 'function') {
            this.onLogout();
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
        localStorage.removeItem('accountingAppData');
        this.transactions = [];
        this.budgets = {};
        this.saveData();
        this.showToast('数据已清除');
    }

    // 显示支付登录页面
    showPaymentLoginPage(paymentType) {
        const pageContainer = document.getElementById('page-container');
        if (!pageContainer) return;

        let title, logo, bgColor, buttonColor, platformName, qrCodeUrl;
        
        if (paymentType === 'wechat') {
            title = '微信支付登录';
            logo = 'fab fa-weixin';
            bgColor = 'linear-gradient(135deg, #07c160, #05a84b)';
            buttonColor = '#07c160';
            platformName = '微信支付';
            qrCodeUrl = 'https://res.wx.qq.com/a/wx_fed/webwx/res/static/img/2KdJN8w.png';
        } else {
            title = '支付宝登录';
            logo = 'fab fa-alipay';
            bgColor = 'linear-gradient(135deg, #1677ff, #0958d9)';
            buttonColor = '#1677ff';
            platformName = '支付宝';
            qrCodeUrl = 'https://gw.alipayobjects.com/mdn/rms_ce4c6f/afts/img/A*XMCgSYx3f50AAAAAAAAAAABkARQnAQ';
        }

        const loginPageHTML = `
            <div class="payment-login-page active" id="payment-login-page">
                <div class="payment-login-header" style="background: ${bgColor};">
                    <button class="back-btn" onclick="window.accountingApp.backToHome()">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2>${title}</h2>
                </div>
                
                <div class="payment-login-content">
                    <div class="payment-logo">
                        <i class="${logo}"></i>
                    </div>
                    
                    <div class="qr-code-section">
                        <h3>扫码登录</h3>
                        <div class="qr-code-container">
                            <div class="qr-code-placeholder">
                                <i class="fas fa-qrcode"></i>
                                <p>请使用${platformName}App扫描二维码</p>
                            </div>
                        </div>
                        <p class="qr-tip">打开${platformName}App，扫描上方二维码完成登录</p>
                    </div>
                    
                    <div class="login-options">
                        <button class="login-option-btn" onclick="window.accountingApp.executePaymentServiceLogin('${paymentType}')">
                            <i class="fas fa-mobile-alt"></i>
                            <span>${platformName}手机登录</span>
                        </button>
                        
                        <button class="login-option-btn" onclick="window.accountingApp.executePaymentServiceLogin('${paymentType}')">
                            <i class="fas fa-user-circle"></i>
                            <span>${platformName}账号登录</span>
                        </button>
                    </div>
                    
                    <div class="agreement-section">
                        <label class="agreement-checkbox">
                            <input type="checkbox" id="agreement-checkbox" checked>
                            <span class="checkmark"></span>
                            我已阅读并同意《${platformName}服务协议》和《隐私政策》
                        </label>
                    </div>
                </div>
            </div>
        `;

        pageContainer.innerHTML = loginPageHTML;
        
        // 隐藏底部导航栏
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            bottomNav.style.display = 'none';
        }
        
        this.currentPage = 'payment-login';
    }

    // 执行支付服务登录 - 使用WechatOAuthService
    async executePaymentServiceLogin(paymentType) {
        this.showToast(`正在连接${paymentType === 'wechat' ? '微信支付' : '支付宝'}...`, 'info');
        
        try {
            // 检查是否支持微信OAuth2登录
            if (paymentType === 'wechat') {
                // 检查微信配置是否可用
                try {
                    // 直接使用微信OAuth2登录，不检查后端状态
                    if (typeof window.WechatOAuthLogin !== 'undefined') {
                        // 微信配置可用，使用OAuth2登录
                        const wechatOAuth = new window.WechatOAuthLogin(this);
                        await wechatOAuth.startOAuthLogin();
                        return;
                    }
                } catch (error) {
                    console.error('检查微信配置失败:', error);
                }
                
                // 微信配置不可用，尝试直接跳转
                try {
                    const redirectUri = window.location.origin + '/wechat-callback.html';
                    const state = 'wechat_login_' + Date.now();
                    const authUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=APPID&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`;
                    
                    // 保存state到sessionStorage用于回调验证
                    try { sessionStorage.setItem('wechat_oauth_state', state); } catch (e) { console.warn('无法写入 sessionStorage.wechat_oauth_state:', e); }
                    
                    window.location.href = authUrl;
                    return;
                } catch (error) {
                    console.error('微信登录跳转失败:', error);
                    this.showToast('微信服务暂不可用，请检查配置', 'error');
                }
                return;
            }
            
            // 对于支付宝或其他支付方式，直接跳转到外部授权页面
            if (paymentType === 'alipay') {
                // 检查支付宝配置是否可用
                try {
                    // 使用支付宝OAuth服务类
                    const redirectUri = window.location.origin + '/alipay-callback.html';
                    
                    if (window.alipayOAuth && typeof window.alipayOAuth.startOAuthLogin === 'function') {
                        // 使用新的OAuth服务类
                        const success = window.alipayOAuth.startOAuthLogin(redirectUri);
                        if (success) {
                            return;
                        }
                    }
                    
                    // 备选方案：直接构建授权URL
                    const state = 'alipay_oauth_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    
                    // 保存state到sessionStorage用于回调验证
                    try { 
                        sessionStorage.setItem('alipay_oauth_state', state); 
                        sessionStorage.setItem('alipay_oauth_redirect', window.location.href);
                        sessionStorage.setItem('alipay_oauth_timestamp', Date.now().toString());
                    } catch (e) { 
                        console.warn('无法写入 sessionStorage:', e);
                        // 使用localStorage作为备选方案
                        try {
                            localStorage.setItem('alipay_oauth_state', state);
                            localStorage.setItem('alipay_oauth_redirect', window.location.href);
                            localStorage.setItem('alipay_oauth_timestamp', Date.now().toString());
                        } catch (e2) {
                            console.error('无法写入 localStorage:', e2);
                        }
                    }
                    
                    // 支付宝配置可用，跳转到授权页面
                    const alipayAuthUrl = `https://openauth.alipay.com/oauth2/publicAppAuthorize.htm?app_id=2021006103604761&scope=auth_user&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
                    
                    console.log('支付宝授权URL:', alipayAuthUrl);
                    window.location.href = alipayAuthUrl;
                    return;
                } catch (error) {
                    console.error('支付宝登录跳转失败:', error);
                    this.showToast('支付宝服务暂不可用，请检查配置', 'error');
                }
                return;
            }
            
            // 其他支付方式提示暂不支持
            this.showToast('该支付方式暂不支持，请使用微信支付', 'warning');
            
        } catch (error) {
            console.error('支付登录失败:', error);
            this.showToast(`${paymentType === 'wechat' ? '微信支付' : '支付宝'}连接失败：${error.message}`, 'error');
            updatePaymentStatus(paymentType, 'disconnected');
        }
    }



    // 返回首页
    backToHome() {
        this.currentPage = 'home';
        
        // 显示底部导航栏
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            bottomNav.style.display = 'flex';
        }
        
        // 重新渲染首页
        if (typeof homePage !== 'undefined' && homePage.render) {
            const pageContainer = document.getElementById('page-container');
            if (pageContainer) {
                pageContainer.innerHTML = homePage.render();
                homePage.initEvents();
            }
        }
    }
}

// 支付连接相关函数
function connectWechatPay() {
    const app = window.accountingApp;
    if (!app) {
        console.error('应用未初始化');
        return;
    }
    
    // 显示微信支付登录页面
    app.showPaymentLoginPage('wechat');
}

function connectAlipay() {
    const app = window.accountingApp;
    if (!app) {
        console.error('应用未初始化');
        return;
    }
    
    // 显示支付宝登录页面
    app.showPaymentLoginPage('alipay');
}

function updatePaymentStatus(paymentType, status) {
    const paymentItems = document.querySelectorAll('.payment-item');
    
    paymentItems.forEach(item => {
        const paymentName = item.querySelector('.payment-name').textContent;
        const statusDot = item.querySelector('.status-dot');
        const statusText = item.querySelector('.status-text');
        
        if ((paymentType === 'wechat' && paymentName === '微信支付') ||
            (paymentType === 'alipay' && paymentName === '支付宝')) {
            
            if (status === 'connected') {
                statusDot.className = 'status-dot connected';
                statusText.textContent = '已连接';
                statusDot.style.animation = 'pulse 2s infinite';
            } else {
                statusDot.className = 'status-dot disconnected';
                statusText.textContent = '未连接';
                statusDot.style.animation = 'none';
            }
        }
    });
}