// 后台管理系统 JavaScript 模块
class AdminSystem {
    constructor() {
        this.data = {
            users: [],
            transactions: [],
            stats: {
                totalUsers: 0,
                totalTransactions: 0,
                totalIncome: 0,
                totalExpense: 0
            }
        };
        this.currentPage = 'dashboard';
        this.settings = this.getDefaultSettings();
        this.languageDictionary = this.getLanguageDictionary();
        this.modals = {};
        this.isAuthenticated = false;
    }

    // 初始化系统
    async initializeApp() {
        console.log('后台管理系统初始化中...');
        
        // 简化的令牌验证逻辑，确保演示环境能正常工作
        const token = localStorage.getItem('adminToken');
        console.log('检查令牌:', token);
        
        if (token) {
            this.isAuthenticated = true;
            console.log('认证成功，令牌有效');
        } else {
            console.warn('未找到有效令牌');
            // 演示模式下，不强制登出，允许用户进入但显示提示
            this.isAuthenticated = false;
            console.log('演示模式：允许进入管理界面');
        }
        
        // 确保setupEventListeners正确绑定导航事件
        setTimeout(() => {
            this.setupEventListeners();
        }, 100);
        
        try {
            // 尝试加载模拟数据
            console.log('尝试加载模拟数据');
            await this.loadMockData();
        } catch (error) {
            console.error('加载模拟数据失败:', error);
        }
        
        // 初始化页面
        this.initPage();
        
        console.log('后台管理系统初始化完成');
    }
    
    // 暴露给外部调用的初始化方法
    init() {
        console.log('调用外部init方法，初始化后台管理系统...');
        this.initializeApp();
    }
    
    // 验证令牌是否有效
    async validateToken() {
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                console.log('未找到令牌');
                return false;
            }
            
            console.log('找到令牌:', token);
            
            // 对于演示环境，接受模拟令牌
            if (token === 'demo_jwt_token_for_admin_access') {
                console.log('接受模拟令牌');
                return true;
            }
            
            try {
                // 解析JWT令牌检查过期时间
                const tokenParts = token.split('.');
                if (tokenParts.length !== 3) {
                    console.log('令牌格式不正确');
                    return false;
                }
                
                const payload = JSON.parse(atob(tokenParts[1]));
                const now = Math.floor(Date.now() / 1000);
                
                if (payload.exp && payload.exp < now) {
                    console.log('令牌已过期');
                    return false;
                }
            } catch (e) {
                console.log('解析令牌出错:', e);
                // 解析错误时，尝试向服务器验证
            }
            
            // 可选：向服务器验证令牌
            try {
                const response = await fetch('/api/admin/validate-token', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('服务器验证结果:', response.ok);
                return response.ok;
            } catch (e) {
                console.log('服务器验证失败，使用本地验证:', e);
                // 网络错误时，如果令牌不是模拟令牌，返回false
                return false;
            }
        } catch (e) {
            console.log('验证令牌时出错:', e);
            return false;
        }
    }
    
    // 登出方法
    logout(force = false) {
        console.log('用户登出');
        // 清除本地存储的令牌和用户信息
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        
        // 重定向到登录页面
        window.location.href = '/admin/login.html';
    }
    
    // 通用API请求方法
    async apiRequest(endpoint, options = {}) {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            throw new Error('未授权，请重新登录');
        }

        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            ...options
        };

        try {
            const response = await fetch(endpoint, defaultOptions);
            
            if (!response.ok) {
                if (response.status === 401) {
                    // 未授权，自动登出
                    this.logout(true);
                    throw new Error('登录已过期，请重新登录');
                }
                
                // 尝试解析错误响应
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { message: '服务器错误' };
                }
                
                throw new Error(errorData.message || `请求失败: ${response.status}`);
            }
            
            // 如果响应为空，则返回空对象
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return { success: true };
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    }

    // 加载模拟数据
    async loadMockData() {
        console.log('加载模拟数据...');
        // 模拟用户数据
        this.data.users = [
            {
                id: 'user001',
                username: '张三',
                email: 'zhangsan@example.com',
                status: 'active',
                registerDate: '2024-01-15',
                lastLogin: '2024-12-01',
                transactionCount: 25
            },
            {
                id: 'user002',
                username: '李四',
                email: 'lisi@example.com',
                status: 'active',
                registerDate: '2024-02-20',
                lastLogin: '2024-12-01',
                transactionCount: 18
            },
            {
                id: 'user003',
                username: '王五',
                email: 'wangwu@example.com',
                status: 'inactive',
                registerDate: '2024-03-10',
                lastLogin: '2024-11-15',
                transactionCount: 12
            }
        ];

        // 模拟交易数据
        this.data.transactions = [
            {
                id: 'tx001',
                userId: 'user001',
                type: 'income',
                amount: 5000,
                category: 'salary',
                description: '12月工资',
                date: '2024-12-01',
                status: 'completed'
            },
            {
                id: 'tx002',
                userId: 'user001',
                type: 'expense',
                amount: 200,
                category: 'food',
                description: '午餐消费',
                date: '2024-12-01',
                status: 'completed'
            },
            {
                id: 'tx003',
                userId: 'user002',
                type: 'income',
                amount: 8000,
                category: 'salary',
                description: '12月工资',
                date: '2024-12-01',
                status: 'completed'
            },
            {
                id: 'tx004',
                userId: 'user002',
                type: 'expense',
                amount: 350,
                category: 'shopping',
                description: '日常购物',
                date: '2024-12-01',
                status: 'completed'
            }
        ];

        // 计算统计数据
        this.calculateStats();
    }
    
    // 从后端API加载数据
    async loadDataFromAPI() {
        console.log('从后端API加载数据...');
        
        // 获取令牌
        const token = localStorage.getItem('adminToken');
        if (!token) {
            throw new Error('未授权，请重新登录');
        }
        
        // 设置API请求头
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        try {
            // 获取系统概览数据
            const overviewResponse = await fetch('/api/admin/overview', {
                method: 'GET',
                headers: headers
            });
            
            if (!overviewResponse.ok) {
                if (overviewResponse.status === 401) {
                    this.logout(true);
                    throw new Error('登录已过期，请重新登录');
                }
                throw new Error('获取概览数据失败');
            }
            
            const overviewData = await overviewResponse.json();
            this.data.stats = overviewData.stats;
            
            // 获取用户列表
            const usersResponse = await fetch('/api/admin/users', {
                method: 'GET',
                headers: headers
            });
            
            if (!usersResponse.ok) {
                if (usersResponse.status === 401) {
                    this.logout(true);
                    throw new Error('登录已过期，请重新登录');
                }
                throw new Error('获取用户数据失败');
            }
            
            this.data.users = await usersResponse.json();
            
            // 获取交易列表
            const transactionsResponse = await fetch('/api/admin/transactions', {
                method: 'GET',
                headers: headers
            });
            
            if (!transactionsResponse.ok) {
                if (transactionsResponse.status === 401) {
                    this.logout(true);
                    throw new Error('登录已过期，请重新登录');
                }
                throw new Error('获取交易数据失败');
            }
            
            this.data.transactions = await transactionsResponse.json();
            
            console.log('数据加载成功');
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }

    // 计算统计数据
    calculateStats() {
        this.data.stats.totalUsers = this.data.users.length;
        this.data.stats.totalTransactions = this.data.transactions.length;
        this.data.stats.totalIncome = this.data.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        this.data.stats.totalExpense = this.data.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
    }

    // 设置事件监听器
    setupEventListeners() {
        // 保存this引用
        const adminInstance = this;
        
        // 侧边栏导航
        document.addEventListener('click', function(e) {
            if (e.target.closest('.nav-item')) {
                const navItem = e.target.closest('.nav-item');
                const page = navItem.getAttribute('data-page');
                if (page) {
                    console.log('导航到页面:', page);
                    adminInstance.switchPage(page);
                }
            }
        });

        // 用户菜单
        document.addEventListener('click', (e) => {
            if (e.target.closest('#user-menu')) {
                this.toggleUserDropdown();
            }
        });

        // 点击外部关闭用户菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#user-menu') && !e.target.closest('#user-dropdown')) {
                this.hideUserDropdown();
            }
        });

        // 筛选功能
        document.addEventListener('input', (e) => {
            if (e.target.id === 'user-search' || e.target.id === 'transaction-search') {
                this.applyFilters();
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.id === 'user-status-filter' || 
                e.target.id === 'transaction-type-filter' ||
                e.target.id === 'transaction-category-filter') {
                this.applyFilters();
            }
        });

        // 页面特定事件监听器
        this.setupPageSpecificEventListeners();
    }

    // 设置页面特定事件监听器
    setupPageSpecificEventListeners() {
        // 数据分析页面事件监听器
        this.setupAnalyticsEventListeners();
        
        // 系统设置页面事件监听器
        this.setupSettingsEventListeners();
    }

    // 初始化页面
    initPage() {
        // 显示当前日期
        const currentDate = new Date().toLocaleDateString('zh-CN');
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            dateElement.textContent = currentDate;
        }

        // 更新统计数据
        this.updateStats();

        // 渲染用户表格
        this.renderUsersTable();

        // 渲染交易表格
        this.renderTransactionsTable();

        // 显示活动列表
        this.renderActivityList();
    }

    // 切换页面
    switchPage(page) {
        // 移除所有页面的active类
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        // 移除所有导航项的active类
        document.querySelectorAll('.nav-item').forEach(nav => {
            nav.classList.remove('active');
        });

        // 显示目标页面
        const targetPage = document.getElementById(page);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // 设置当前导航项为active
        const activeNav = document.querySelector(`[data-page="${page}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }

        this.currentPage = page;

        // 页面特定初始化
        this.initPageSpecific(page);
    }

    // 页面特定初始化
    initPageSpecific(page) {
        switch (page) {
            case 'dashboard':
                this.initDashboard();
                break;
            case 'users':
                this.initUsersPage();
                break;
            case 'transactions':
                this.initTransactionsPage();
                break;
            case 'analytics':
                this.initAnalyticsPage();
                break;
            case 'settings':
                this.initSettingsPage();
                break;
        }
    }

    // 初始化仪表板
    initDashboard() {
        this.updateStats();
        this.renderActivityList();
    }

    // 初始化用户页面
    initUsersPage() {
        this.renderUsersTable();
    }

    // 初始化交易页面
    initTransactionsPage() {
        this.renderTransactionsTable();
        this.updateTransactionStats();
    }

    // 初始化数据分析页面
    initAnalyticsPage() {
        this.loadAnalyticsData();
        this.renderAnalyticsCharts();
        this.generateAnalyticsReport();
    }

    // 初始化系统设置页面
    initSettingsPage() {
        this.loadSettings();
        this.setupTabNavigation();
    }

    // 渲染统计数据
    updateStats() {
        const totalUsersEl = document.getElementById('total-users');
        const totalTransactionsEl = document.getElementById('total-transactions');
        const totalIncomeEl = document.getElementById('total-income');
        const totalExpenseEl = document.getElementById('total-expense');
        
        if (totalUsersEl) totalUsersEl.textContent = this.data.stats.totalUsers;
        if (totalTransactionsEl) totalTransactionsEl.textContent = this.data.stats.totalTransactions;
        if (totalIncomeEl) totalIncomeEl.textContent = '¥' + this.data.stats.totalIncome.toLocaleString();
        if (totalExpenseEl) totalExpenseEl.textContent = '¥' + this.data.stats.totalExpense.toLocaleString();
    }

    // 渲染用户表格
    renderUsersTable() {
        const tbody = document.getElementById('users-tbody');
        if (!tbody) return;

        // 添加表格加载状态
        tbody.innerHTML = '<tr><td colspan="6" class="loading-cell"><div class="loading-spinner"></div><span>加载中...</span></td></tr>';
        
        // 异步渲染表格数据
        setTimeout(() => {
            tbody.innerHTML = this.data.users.map(user => `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td><span class="status-badge ${user.status}">${user.status === 'active' ? '活跃' : '非活跃'}</span></td>
                    <td>${user.registerDate || user.createdAt}</td>
                    <td>${user.lastLogin || '-'}</td>
                    <td class="table-actions-cell">
                        <button class="btn-edit" onclick="admin.editUser('${user.id}')">编辑</button>
                        <button class="btn-delete" onclick="admin.deleteUser('${user.id}')">删除</button>
                    </td>
                </tr>
            `).join('');
        }, 100); // 短暂延迟以显示加载效果
    }

    // 渲染交易表格
    renderTransactionsTable() {
        const tbody = document.getElementById('transactions-tbody');
        if (!tbody) return;

        // 添加表格加载状态
        tbody.innerHTML = '<tr><td colspan="9" class="loading-cell"><div class="loading-spinner"></div><span>加载中...</span></td></tr>';
        
        // 异步渲染表格数据
        setTimeout(() => {
            tbody.innerHTML = this.data.transactions.map(transaction => `
                <tr>
                    <td>${transaction.id}</td>
                    <td>${transaction.userId}</td>
                    <td><span class="status-badge ${transaction.type}">${transaction.type === 'income' ? '收入' : '支出'}</span></td>
                    <td>¥${transaction.amount.toLocaleString()}</td>
                    <td>${this.getCategoryName(transaction.category)}</td>
                    <td>${transaction.description}</td>
                    <td>${transaction.date || transaction.createdAt}</td>
                    <td><span class="status-badge ${transaction.status}">${transaction.status === 'completed' ? '已完成' : '进行中'}</span></td>
                    <td class="table-actions-cell">
                        <button class="btn-edit" onclick="admin.editTransaction('${transaction.id}')">编辑</button>
                        <button class="btn-delete" onclick="admin.deleteTransaction('${transaction.id}')">删除</button>
                    </td>
                </tr>
            `).join('');
        }, 100); // 短暂延迟以显示加载效果
    }

    // 渲染活动列表
    renderActivityList() {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;

        // 准备活动数据
        const activities = [
            { type: 'login', user: '管理员', time: '10分钟前' },
            { type: 'update', user: '张三', target: '交易记录', time: '30分钟前' },
            { type: 'create', user: '李四', target: '新用户', time: '1小时前' },
            { type: 'delete', user: '管理员', target: '过期数据', time: '2小时前' },
            { type: 'update', user: '王五', target: '个人设置', time: '3小时前' }
        ];

        activityList.innerHTML = activities.map(activity => `
            <li class="activity-item">
                <div class="activity-icon activity-${activity.type}"></div>
                <div class="activity-content">
                    <p class="activity-text">
                        <strong>${activity.user}</strong>
                        ${activity.type === 'login' ? '登录了系统' : 
                         activity.type === 'update' ? `更新了${activity.target}` :
                         activity.type === 'create' ? `创建了${activity.target}` :
                         `删除了${activity.target}`}
                    </p>
                    <p class="activity-time">${activity.time}</p>
                </div>
            </li>
        `).join('');
    }

    // 更新交易统计
    updateTransactionStats() {
        const incomeChart = document.getElementById('income-chart');
        const expenseChart = document.getElementById('expense-chart');
        if (incomeChart || expenseChart) {
            // 这里可以使用Chart.js绘制图表
            console.log('更新交易统计图表');
        }
    }

    // 加载分析数据
    loadAnalyticsData() {
        console.log('加载分析数据');
        // 这里应该加载更详细的数据进行分析
    }

    // 渲染分析图表
    renderAnalyticsCharts() {
        const chartContainer = document.getElementById('analytics-charts');
        if (!chartContainer) return;

        chartContainer.innerHTML = `
            <div class="chart-row">
                <div class="chart-box">
                    <h3>收入支出对比</h3>
                    <div class="chart-placeholder" id="income-expense-chart">
                        <div class="chart-loading">加载中...</div>
                    </div>
                </div>
                <div class="chart-box">
                    <h3>用户增长趋势</h3>
                    <div class="chart-placeholder" id="user-growth-chart">
                        <div class="chart-loading">加载中...</div>
                    </div>
                </div>
            </div>
            <div class="chart-row">
                <div class="chart-box">
                    <h3>支出分类占比</h3>
                    <div class="chart-placeholder" id="expense-category-chart">
                        <div class="chart-loading">加载中...</div>
                    </div>
                </div>
                <div class="chart-box">
                    <h3>交易频率分析</h3>
                    <div class="chart-placeholder" id="transaction-frequency-chart">
                        <div class="chart-loading">加载中...</div>
                    </div>
                </div>
            </div>
        `;

        // 模拟图表加载完成
        setTimeout(() => {
            document.querySelectorAll('.chart-loading').forEach(el => {
                el.textContent = '图表已加载';
            });
        }, 1000);
    }

    // 生成分析报告
    generateAnalyticsReport() {
        const reportContainer = document.getElementById('analytics-report');
        if (!reportContainer) return;

        reportContainer.innerHTML = `
            <div class="report-header">
                <h2>系统分析报告</h2>
                <p class="report-date">生成时间: ${new Date().toLocaleString('zh-CN')}</p>
            </div>
            <div class="report-summary">
                <h3>概览</h3>
                <ul>
                    <li>总用户数: <strong>${this.data.stats.totalUsers}</strong></li>
                    <li>总交易数: <strong>${this.data.stats.totalTransactions}</strong></li>
                    <li>总收入: <strong>¥${this.data.stats.totalIncome.toLocaleString()}</strong></li>
                    <li>总支出: <strong>¥${this.data.stats.totalExpense.toLocaleString()}</strong></li>
                </ul>
            </div>
            <div class="report-insights">
                <h3>关键洞察</h3>
                <ol>
                    <li>系统运行正常，交易记录完整</li>
                    <li>建议关注用户活跃度，有部分非活跃用户</li>
                    <li>交易数据显示收入大于支出，财务状况良好</li>
                </ol>
            </div>
        `;
    }

    // 获取分类名称
    getCategoryName(categoryKey) {
        const categoryMap = {
            'salary': '工资',
            'bonus': '奖金',
            'investment': '投资收益',
            'food': '餐饮',
            'shopping': '购物',
            'transport': '交通',
            'entertainment': '娱乐',
            'utilities': '水电费',
            'rent': '房租',
            'other': '其他'
        };
        return categoryMap[categoryKey] || categoryKey;
    }

    // 设置标签导航
    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // 移除所有按钮的活动状态
                tabButtons.forEach(btn => btn.classList.remove('active'));
                // 添加当前按钮的活动状态
                button.classList.add('active');
                // 显示对应内容
                const tabId = button.getAttribute('data-tab');
                this.showTabContent(tabId);
            });
        });
    }

    // 显示标签内容
    showTabContent(tabId) {
        const tabContents = document.querySelectorAll('.settings-tab');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        const targetContent = document.getElementById(tabId);
        if (targetContent) {
            targetContent.classList.add('active');
        }
    }

    // 加载设置
    loadSettings() {
        // 加载系统设置
        const settingsForm = document.getElementById('system-settings-form');
        if (settingsForm) {
            // 填充表单字段
            settingsForm.elements.systemName.value = this.settings.systemName || '财务管理系统';
            settingsForm.elements.theme.value = this.settings.theme || 'light';
            settingsForm.elements.language.value = this.settings.language || 'zh-CN';
        }
    }

    // 设置分析事件监听器
    setupAnalyticsEventListeners() {
        // 分析页面特定事件
        document.addEventListener('change', (e) => {
            if (e.target.id === 'analytics-period' || e.target.id === 'analytics-group-by') {
                this.updateAnalyticsView();
            }
        });
    }

    // 更新分析视图
    updateAnalyticsView() {
        console.log('更新分析视图');
        this.renderAnalyticsCharts();
        this.generateAnalyticsReport();
    }

    // 设置设置事件监听器
    setupSettingsEventListeners() {
        const saveBtn = document.getElementById('save-settings-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }
    }

    // 保存设置
    saveSettings() {
        const settingsForm = document.getElementById('system-settings-form');
        if (!settingsForm) return;

        const newSettings = {
            systemName: settingsForm.elements.systemName.value,
            theme: settingsForm.elements.theme.value,
            language: settingsForm.elements.language.value
        };

        // 保存到localStorage
        localStorage.setItem('systemSettings', JSON.stringify(newSettings));
        this.settings = newSettings;

        // 应用主题
        this.applyTheme(newSettings.theme);
        
        // 显示成功提示
        this.showToast('设置已保存', 'success');
    }

    // 应用主题
    applyTheme(theme) {
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${theme}`);
    }

    // 显示提示
    showToast(message, type = 'info') {
        // 检查是否已存在toast，存在则移除
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }

        // 创建新的toast
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.textContent = message;

        // 添加到body
        document.body.appendChild(toast);

        // 设置toast样式（如果需要）
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 4px;
            background-color: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : type === 'warning' ? '#FF9800' : '#2196F3'};
            color: white;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;

        // 自动消失
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    // 切换用户下拉菜单
    toggleUserDropdown() {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('active');
        }
    }

    // 隐藏用户下拉菜单
    hideUserDropdown() {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    }
    
    // 显示管理员个人资料
    showProfile() {
        console.log('显示管理员个人资料');
        this.hideUserDropdown();
        
        // 创建并显示个人资料模态框
        this.createProfileModal();
        this.modals.profileModal.show();
        
        // 更新个人资料信息
        this.updateProfileInfo();
    }
    
    // 显示账户设置
    showSettings() {
        console.log('显示账户设置');
        this.hideUserDropdown();
        
        // 创建并显示账户设置模态框
        this.createAccountSettingsModal();
        this.modals.accountSettingsModal.show();
        
        // 加载当前设置
        this.loadAccountSettings();
    }
    
    // 创建个人资料模态框
    createProfileModal() {
        if (this.modals.profileModal) {
            return; // 模态框已存在
        }
        
        // 创建模态框HTML
        const modalHTML = `
        <div class="modal fade" id="profileModal" tabindex="-1" role="dialog">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">个人资料</h5>
                        <button type="button" class="close" onclick="admin.closeProfileModal()" aria-label="关闭">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="profile-container">
                            <div class="profile-avatar">
                                <img src="/admin/admin-avatar.png" alt="管理员头像" id="profile-avatar">
                                <button class="avatar-upload-btn" onclick="admin.handleAvatarUpload()">
                                    <i class="fas fa-camera"></i>
                                </button>
                                <input type="file" id="avatar-input" accept="image/*" style="display: none;">
                            </div>
                            <div class="profile-info">
                                <div class="form-group">
                                    <label for="profile-name">用户名</label>
                                    <input type="text" id="profile-name" value="管理员" disabled>
                                </div>
                                <div class="form-group">
                                    <label for="profile-email">电子邮箱</label>
                                    <input type="email" id="profile-email" value="admin@accounting.com" disabled>
                                </div>
                                <div class="form-group">
                                    <label for="profile-role">角色</label>
                                    <input type="text" id="profile-role" value="系统管理员" disabled>
                                </div>
                                <div class="form-group">
                                    <label for="profile-access-level">访问级别</label>
                                    <input type="text" id="profile-access-level" value="全部权限" disabled>
                                </div>
                                <div class="form-group">
                                    <label for="profile-last-login">上次登录时间</label>
                                    <input type="text" id="profile-last-login" value="" disabled>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="admin.closeProfileModal()">关闭</button>
                    </div>
                </div>
            </div>
        </div>`;
        
        // 添加到页面
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);
        
        // 存储模态框引用
        this.modals.profileModal = document.getElementById('profileModal');
        // 添加show方法
        this.modals.profileModal.show = function() {
            this.style.display = 'flex';
            document.body.classList.add('modal-open');
        };
    }
    
    // 创建账户设置模态框
    createAccountSettingsModal() {
        if (this.modals.accountSettingsModal) {
            return; // 模态框已存在
        }
        
        // 创建模态框HTML
        const modalHTML = `
        <div class="modal fade" id="accountSettingsModal" tabindex="-1" role="dialog">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">账户设置</h5>
                        <button type="button" class="close" onclick="admin.closeAccountSettingsModal()" aria-label="关闭">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="settings-container">
                            <div class="form-group">
                                <label for="change-password">更改密码</label>
                                <button class="btn btn-primary" onclick="admin.showChangePasswordForm()">修改密码</button>
                            </div>
                            <div class="form-group">
                                <label for="notification-settings">通知设置</label>
                                <div class="notification-options">
                                    <label class="checkbox-option">
                                        <input type="checkbox" id="notify-new-user" checked>
                                        <span>新用户注册通知</span>
                                    </label>
                                    <label class="checkbox-option">
                                        <input type="checkbox" id="notify-transaction" checked>
                                        <span>大额交易通知</span>
                                    </label>
                                    <label class="checkbox-option">
                                        <input type="checkbox" id="notify-system" checked>
                                        <span>系统更新通知</span>
                                    </label>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="language-setting">界面语言</label>
                                <select id="language-setting">
                                    <option value="zh-CN" selected>简体中文</option>
                                    <option value="en-US">English (US)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="theme-setting">主题设置</label>
                                <div class="theme-options">
                                    <label class="radio-option">
                                        <input type="radio" name="theme" value="light" checked>
                                        <span>浅色主题</span>
                                    </label>
                                    <label class="radio-option">
                                        <input type="radio" name="theme" value="dark">
                                        <span>深色主题</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="admin.closeAccountSettingsModal()">取消</button>
                        <button type="button" class="btn btn-primary" onclick="admin.saveAccountSettings()">保存设置</button>
                    </div>
                </div>
            </div>
        </div>`;
        
        // 添加到页面
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);
        
        // 存储模态框引用
        this.modals.accountSettingsModal = document.getElementById('accountSettingsModal');
        // 添加show方法
        this.modals.accountSettingsModal.show = function() {
            this.style.display = 'flex';
            document.body.classList.add('modal-open');
        };
    }
    
    // 更新个人资料信息
    updateProfileInfo() {
        // 获取上次登录时间
        const lastLogin = localStorage.getItem('adminLastLogin') || '首次登录';
        document.getElementById('profile-last-login').value = lastLogin;
        
        // 更新当前登录时间
        const currentTime = new Date().toLocaleString('zh-CN');
        localStorage.setItem('adminLastLogin', currentTime);
    }
    
    // 处理头像上传
    handleAvatarUpload() {
        document.getElementById('avatar-input').click();
        
        // 添加文件选择事件
        document.getElementById('avatar-input').onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                // 简单的图片预览
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById('profile-avatar').src = e.target.result;
                    this.showToast('头像预览已更新', 'success');
                };
                reader.readAsDataURL(file);
                
                // 在实际应用中，这里应该上传图片到服务器
                console.log('头像文件选择:', file.name);
            }
        };
    }
    
    // 显示修改密码表单
    showChangePasswordForm() {
        // 创建修改密码模态框
        const passwordModalHTML = `
        <div class="modal fade" id="changePasswordModal" tabindex="-1" role="dialog">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">修改密码</h5>
                        <button type="button" class="close" onclick="admin.closeChangePasswordModal()" aria-label="关闭">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="current-password">当前密码</label>
                            <input type="password" id="current-password" placeholder="请输入当前密码">
                        </div>
                        <div class="form-group">
                            <label for="new-password">新密码</label>
                            <input type="password" id="new-password" placeholder="请输入新密码" minlength="6">
                        </div>
                        <div class="form-group">
                            <label for="confirm-password">确认新密码</label>
                            <input type="password" id="confirm-password" placeholder="请再次输入新密码">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="admin.closeChangePasswordModal()">取消</button>
                        <button type="button" class="btn btn-primary" onclick="admin.changePassword()">确认修改</button>
                    </div>
                </div>
            </div>
        </div>`;
        
        // 添加到页面
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = passwordModalHTML;
        document.body.appendChild(modalContainer.firstElementChild);
        
        // 显示模态框
        this.modals.changePasswordModal = document.getElementById('changePasswordModal');
        this.modals.changePasswordModal.show = function() {
            this.style.display = 'block';
            document.body.classList.add('modal-open');
        };
        this.modals.changePasswordModal.show();
    }
    
    // 修改密码
    changePassword() {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // 简单验证
        if (!currentPassword) {
            this.showToast('请输入当前密码', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            this.showToast('新密码长度至少为6位', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showToast('两次输入的新密码不一致', 'error');
            return;
        }
        
        // 在实际应用中，这里应该调用API进行密码修改
        console.log('修改密码请求已发送');
        
        // 模拟成功
        this.showToast('密码修改成功', 'success');
        this.closeChangePasswordModal();
    }
    
    // 加载账户设置
    loadAccountSettings() {
        // 从本地存储加载设置
        const savedSettings = localStorage.getItem('adminAccountSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                
                // 设置通知选项
                if (settings.notifications) {
                    document.getElementById('notify-new-user').checked = settings.notifications.newUser !== false;
                    document.getElementById('notify-transaction').checked = settings.notifications.transaction !== false;
                    document.getElementById('notify-system').checked = settings.notifications.system !== false;
                }
                
                // 设置语言
                if (settings.language) {
                    document.getElementById('language-setting').value = settings.language;
                }
                
                // 设置主题
                if (settings.theme) {
                    const themeOption = document.querySelector(`input[name="theme"][value="${settings.theme}"]`);
                    if (themeOption) {
                        themeOption.checked = true;
                    }
                }
            } catch (e) {
                console.error('加载设置失败:', e);
            }
        }
    }
    
    // 保存账户设置
    saveAccountSettings() {
        const settings = {
            notifications: {
                newUser: document.getElementById('notify-new-user').checked,
                transaction: document.getElementById('notify-transaction').checked,
                system: document.getElementById('notify-system').checked
            },
            language: document.getElementById('language-setting').value,
            theme: document.querySelector('input[name="theme"]:checked').value
        };
        
        // 保存到本地存储
        localStorage.setItem('adminAccountSettings', JSON.stringify(settings));
        
        // 应用主题设置
        this.applyTheme(settings.theme);
        
        // 显示成功消息
        this.showToast('设置保存成功', 'success');
        
        // 关闭模态框
        this.closeAccountSettingsModal();
    }
    
    // 关闭个人资料模态框
    closeProfileModal() {
        if (this.modals.profileModal) {
            this.modals.profileModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    }
    
    // 关闭账户设置模态框
    closeAccountSettingsModal() {
        if (this.modals.accountSettingsModal) {
            this.modals.accountSettingsModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    }
    
    // 关闭修改密码模态框
    closeChangePasswordModal() {
        if (this.modals.changePasswordModal) {
            this.modals.changePasswordModal.style.display = 'none';
            document.body.classList.remove('modal-open');
            // 移除模态框元素
            document.body.removeChild(this.modals.changePasswordModal);
            delete this.modals.changePasswordModal;
        }
    }

    // 获取默认设置
    getDefaultSettings() {
        // 尝试从localStorage获取设置，如果没有则使用默认值
        const storedSettings = localStorage.getItem('systemSettings');
        if (storedSettings) {
            try {
                return JSON.parse(storedSettings);
            } catch {
                console.error('解析存储的设置失败，使用默认设置');
            }
        }

        // 默认设置
        return {
            systemName: '财务管理系统',
            theme: 'light',
            language: 'zh-CN',
            pageSize: 10,
            autoRefresh: true,
            refreshInterval: 300000 // 5分钟
        };
    }

    // 获取语言字典
    getLanguageDictionary() {
        return {
            'zh-CN': {
                'dashboard': '仪表盘',
                'users': '用户管理',
                'transactions': '交易记录',
                'analytics': '数据分析',
                'settings': '系统设置',
                'logout': '登出',
                'totalUsers': '总用户数',
                'totalTransactions': '总交易数',
                'totalIncome': '总收入',
                'totalExpense': '总支出',
                'recentActivities': '最近活动',
                'search': '搜索',
                'status': '状态',
                'type': '类型',
                'amount': '金额',
                'category': '分类',
                'description': '描述',
                'date': '日期',
                'actions': '操作',
                'edit': '编辑',
                'delete': '删除',
                'addUser': '添加用户',
                'addTransaction': '添加交易',
                'save': '保存',
                'cancel': '取消',
                'success': '成功',
                'error': '错误',
                'warning': '警告',
                'info': '信息',
                'loading': '加载中...',
                'noData': '暂无数据',
                'confirmDelete': '确定要删除吗？',
                'confirmLogout': '确定要登出吗？',
                'changesSaved': '更改已保存',
                'operationFailed': '操作失败',
                'active': '活跃',
                'inactive': '非活跃',
                'income': '收入',
                'expense': '支出',
                'completed': '已完成',
                'pending': '进行中'
            },
            'en-US': {
                'dashboard': 'Dashboard',
                'users': 'Users',
                'transactions': 'Transactions',
                'analytics': 'Analytics',
                'settings': 'Settings',
                'logout': 'Logout',
                'totalUsers': 'Total Users',
                'totalTransactions': 'Total Transactions',
                'totalIncome': 'Total Income',
                'totalExpense': 'Total Expense',
                'recentActivities': 'Recent Activities',
                'search': 'Search',
                'status': 'Status',
                'type': 'Type',
                'amount': 'Amount',
                'category': 'Category',
                'description': 'Description',
                'date': 'Date',
                'actions': 'Actions',
                'edit': 'Edit',
                'delete': 'Delete',
                'addUser': 'Add User',
                'addTransaction': 'Add Transaction',
                'save': 'Save',
                'cancel': 'Cancel',
                'success': 'Success',
                'error': 'Error',
                'warning': 'Warning',
                'info': 'Info',
                'loading': 'Loading...',
                'noData': 'No data',
                'confirmDelete': 'Are you sure you want to delete?',
                'confirmLogout': 'Are you sure you want to logout?',
                'changesSaved': 'Changes saved',
                'operationFailed': 'Operation failed',
                'active': 'Active',
                'inactive': 'Inactive',
                'income': 'Income',
                'expense': 'Expense',
                'completed': 'Completed',
                'pending': 'Pending'
            }
        };
    }

    // 应用过滤器
    applyFilters() {
        // 根据当前页面应用相应的过滤器
        switch (this.currentPage) {
            case 'users':
                this.filterUsers();
                break;
            case 'transactions':
                this.filterTransactions();
                break;
        }
    }

    // 过滤用户列表
    filterUsers() {
        const searchTerm = document.getElementById('user-search')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('user-status-filter')?.value || 'all';

        const filteredUsers = this.data.users.filter(user => {
            // 搜索过滤
            const matchesSearch = 
                user.username.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm) ||
                user.id.toLowerCase().includes(searchTerm);
            
            // 状态过滤
            const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });

        // 更新表格
        const tbody = document.getElementById('users-tbody');
        if (tbody) {
            tbody.innerHTML = filteredUsers.map(user => `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td><span class="status-badge ${user.status}">${user.status === 'active' ? '活跃' : '非活跃'}</span></td>
                    <td>${user.registerDate || user.createdAt}</td>
                    <td>${user.lastLogin || '-'}</td>
                    <td class="table-actions-cell">
                        <button class="btn-edit" onclick="admin.editUser('${user.id}')">编辑</button>
                        <button class="btn-delete" onclick="admin.deleteUser('${user.id}')">删除</button>
                    </td>
                </tr>
            `).join('');
        }
    }

    // 过滤交易列表
    filterTransactions() {
        const searchTerm = document.getElementById('transaction-search')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('transaction-type-filter')?.value || 'all';
        const categoryFilter = document.getElementById('transaction-category-filter')?.value || 'all';

        const filteredTransactions = this.data.transactions.filter(transaction => {
            // 搜索过滤
            const matchesSearch = 
                transaction.description.toLowerCase().includes(searchTerm) ||
                transaction.id.toLowerCase().includes(searchTerm) ||
                transaction.userId.toLowerCase().includes(searchTerm);
            
            // 类型过滤
            const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
            
            // 分类过滤
            const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;
            
            return matchesSearch && matchesType && matchesCategory;
        });

        // 更新表格
        const tbody = document.getElementById('transactions-tbody');
        if (tbody) {
            tbody.innerHTML = filteredTransactions.map(transaction => `
                <tr>
                    <td>${transaction.id}</td>
                    <td>${transaction.userId}</td>
                    <td><span class="status-badge ${transaction.type}">${transaction.type === 'income' ? '收入' : '支出'}</span></td>
                    <td>¥${transaction.amount.toLocaleString()}</td>
                    <td>${this.getCategoryName(transaction.category)}</td>
                    <td>${transaction.description}</td>
                    <td>${transaction.date || transaction.createdAt}</td>
                    <td><span class="status-badge ${transaction.status}">${transaction.status === 'completed' ? '已完成' : '进行中'}</span></td>
                    <td class="table-actions-cell">
                        <button class="btn-edit" onclick="admin.editTransaction('${transaction.id}')">编辑</button>
                        <button class="btn-delete" onclick="admin.deleteTransaction('${transaction.id}')">删除</button>
                    </td>
                </tr>
            `).join('');
        }
    }

    // 编辑用户
    editUser(userId) {
        console.log('编辑用户:', userId);
        // 实现编辑用户的逻辑
        this.showToast(`编辑用户 ${userId}`, 'info');
    }

    // 删除用户
    deleteUser(userId) {
        if (confirm(`确定要删除用户 ${userId} 吗？`)) {
            console.log('删除用户:', userId);
            // 实现删除用户的逻辑
            this.showToast(`用户 ${userId} 已删除`, 'success');
        }
    }

    // 编辑交易
    editTransaction(transactionId) {
        console.log('编辑交易:', transactionId);
        // 实现编辑交易的逻辑
        this.showToast(`编辑交易 ${transactionId}`, 'info');
    }

    // 删除交易
    deleteTransaction(transactionId) {
        if (confirm(`确定要删除交易 ${transactionId} 吗？`)) {
            console.log('删除交易:', transactionId);
            // 实现删除交易的逻辑
            this.showToast(`交易 ${transactionId} 已删除`, 'success');
        }
    }

    // 初始化全局实例
    static getInstance() {
        if (!AdminSystem.instance) {
            AdminSystem.instance = new AdminSystem();
        }
        return AdminSystem.instance;
    }
}

// 创建全局实例并暴露到window对象
const admin = AdminSystem.getInstance();
window.admin = admin;

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        admin.initializeApp();
    });
} else {
    // 如果DOM已经加载完成，直接初始化
    admin.initializeApp();
}