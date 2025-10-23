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
        
        this.init();
    }

    // 初始化应用
    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateUI();
        this.setupMockData();
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

    // 页面切换功能
    switchPage(pageId) {
        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // 显示目标页面
        document.getElementById(pageId).classList.add('active');
        
        // 更新导航栏状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // 设置当前导航项为激活状态
        const navItems = document.querySelectorAll('.nav-item');
        if (pageId === 'home-page') navItems[0].classList.add('active');
        else if (pageId === 'analysis-page') navItems[1].classList.add('active');
        else if (pageId === 'profile-page') navItems[2].classList.add('active');
        
        // 如果是分析页面，初始化图表
        if (pageId === 'analysis-page') {
            setTimeout(() => this.updateCharts(), 100);
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
}

// 初始化应用
const app = new AccountingApp();