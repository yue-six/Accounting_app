// 后台管理系统简化版 - 专用于修复页面跳转问题
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
        this.init();
    }

    // 初始化系统
    async init() {
        console.log('后台管理系统初始化中...');
        
        // 加载模拟数据
        await this.loadMockData();
        
        // 设置事件监听器
        this.setupEventListeners();
        
        // 初始化页面
        this.initPage();
        
        console.log('后台管理系统初始化完成');
    }

    // 加载模拟数据
    async loadMockData() {
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
            }
        ];

        // 计算统计数据
        this.calculateStats();
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
        // 侧边栏导航 - 修复页面跳转
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                const page = navItem.getAttribute('data-page');
                if (page) {
                    e.preventDefault(); // 阻止默认行为
                    this.switchPage(page);
                    return false;
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
    }

    // 切换页面 - 修复版
    switchPage(page) {
        console.log('切换到页面:', page);
        
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
            console.log('页面显示成功:', page);
        } else {
            console.error('页面不存在:', page);
        }

        // 设置当前导航项为active
        const activeNav = document.querySelector(`[data-page="${page}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }

        this.currentPage = page;
        
        // 更新页面内容
        this.updatePageContent(page);
    }

    // 更新页面内容
    updatePageContent(page) {
        switch (page) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'users':
                this.updateUsersPage();
                break;
            case 'transactions':
                this.updateTransactionsPage();
                break;
            case 'analytics':
                this.updateAnalyticsPage();
                break;
            case 'settings':
                this.updateSettingsPage();
                break;
        }
    }

    // 更新仪表板
    updateDashboard() {
        // 更新统计数据
        document.getElementById('total-users').textContent = this.data.stats.totalUsers;
        document.getElementById('total-transactions').textContent = this.data.stats.totalTransactions;
        document.getElementById('total-income').textContent = '¥' + this.data.stats.totalIncome.toLocaleString();
        document.getElementById('total-expense').textContent = '¥' + this.data.stats.totalExpense.toLocaleString();
        
        // 显示当前日期
        const currentDate = new Date().toLocaleDateString('zh-CN');
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            dateElement.textContent = currentDate;
        }
    }

    // 更新用户页面
    updateUsersPage() {
        const tbody = document.getElementById('users-tbody');
        if (!tbody) return;

        tbody.innerHTML = this.data.users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td><span class="status-badge ${user.status}">${user.status === 'active' ? '活跃' : '非活跃'}</span></td>
                <td>${user.registerDate}</td>
                <td class="table-actions-cell">
                    <button class="btn-edit">编辑</button>
                    <button class="btn-delete">编辑</button>
                </td>
            </tr>
        `).join('');
    }

    // 更新交易页面
    updateTransactionsPage() {
        const tbody = document.getElementById('transactions-tbody');
        if (!tbody) return;

        tbody.innerHTML = this.data.transactions.map(transaction => `
            <tr>
                <td>${transaction.id}</td>
                <td>${transaction.userId}</td>
                <td><span class="status-badge ${transaction.type}">${transaction.type === 'income' ? '收入' : '支出'}</span></td>
                <td>¥${transaction.amount.toLocaleString()}</td>
                <td>${this.getCategoryName(transaction.category)}</td>
                <td>${transaction.description}</td>
                <td>${transaction.date}</td>
                <td><span class="status-badge ${transaction.status}">${transaction.status === 'completed' ? '已完成' : '进行中'}</span></td>
                <td class="table-actions-cell">
                    <button class="btn-edit">编辑</button>
                    <button class="btn-delete">删除</button>
                </td>
            </tr>
        `).join('');
    }

    // 获取分类名称
    getCategoryName(category) {
        const categoryMap = {
            'food': '餐饮',
            'transport': '交通',
            'shopping': '购物',
            'entertainment': '娱乐',
            'study': '学习',
            'medical': '医疗',
            'salary': '工资',
            'investment': '投资'
        };
        return categoryMap[category] || category;
    }

    // 更新分析页面
    updateAnalyticsPage() {
        // 更新关键指标
        document.getElementById('active-users').textContent = this.data.users.filter(user => user.status === 'active').length;
        document.getElementById('growth-rate').textContent = '15.2%';
        document.getElementById('avg-transaction').textContent = '¥' + (this.data.transactions.reduce((sum, t) => sum + t.amount, 0) / this.data.transactions.length || 0).toLocaleString();
        document.getElementById('retention-rate').textContent = '78.5%';
    }

    // 更新设置页面
    updateSettingsPage() {
        // 设置页面基本功能
        console.log('设置页面已加载');
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
        this.updateDashboard();
    }

    // 显示用户下拉菜单
    toggleUserDropdown() {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown.style.display === 'none') {
            dropdown.style.display = 'block';
        } else {
            dropdown.style.display = 'none';
        }
    }

    // 隐藏用户下拉菜单
    hideUserDropdown() {
        const dropdown = document.getElementById('user-dropdown');
        dropdown.style.display = 'none';
    }

    // 模拟其他功能
    showProfile() {
        alert('个人资料功能');
    }

    showSettings() {
        alert('账户设置功能');
    }

    logout() {
        alert('退出登录功能');
    }

    showAddUserModal() {
        alert('添加用户功能');
    }

    showTransactionFilter() {
        alert('高级筛选功能');
    }

    exportTransactions() {
        alert('导出交易数据功能');
    }
}

// 创建全局实例并暴露到window对象
window.admin = new AdminSystem();

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.admin.init();
    });
} else {
    window.admin.init();
}