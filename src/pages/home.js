// 首页组件
class HomePage {
    constructor(app) {
        this.app = app;
        this.inputManager = null;
    }

    // 渲染页面
    render() {
        // 获取当前用户模式
        const userMode = this.getCurrentUserMode();
        
        return `
            <div class="page active" id="home-page">
                <!-- 本月概览 -->
                <div class="card">
                    <h3><i class="fas fa-chart-line"></i> ${this.getModeTitle('monthlyOverview')}</h3>
                    <div class="stats-grid" id="monthly-stats">
                        <div class="stat-item">
                            <div class="stat-value" id="monthly-income">¥0</div>
                            <div class="stat-label">本月收入</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="today-expense">¥0</div>
                            <div class="stat-label">本日支出</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="monthly-balance">¥0</div>
                            <div class="stat-label">本月结余</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="budget-progress">0%</div>
                            <div class="stat-label">预算进度 <span id="budget-badge" style="display:inline-block; margin-left:6px; font-size:12px; padding:2px 6px; border-radius:10px; background:#edf2f7; color:#718096; vertical-align:middle;"></span></div>
                        </div>
                    </div>
                </div>

                <!-- 快速记账 -->
                <div class="card quick-actions-card">
                    <div class="quick-actions-title">
                        <i class="fas fa-bolt"></i>
                        <h3>快速记账</h3>
                    </div>
                    <p style="color: #718096; font-size: 0.9rem; margin-bottom: 20px;">选择您喜欢的记账方式</p>
                    
                    <div class="quick-actions">
                        <button class="action-btn" id="voice-input-btn">
                            <i class="fas fa-microphone-alt"></i>
                            <span>语音记账</span>
                        </button>
                        <button class="action-btn" id="photo-input-btn">
                            <i class="fas fa-camera-retro"></i>
                            <span>拍照记账</span>
                        </button>
                        <button class="action-btn" id="manual-input-btn">
                            <i class="fas fa-edit"></i>
                            <span>手动输入</span>
                        </button>
                    </div>
                </div>

                <!-- 模式特定内容 -->
                ${this.renderModeSpecificContent(userMode)}

                <!-- 最新交易 -->
                <div class="card">
                    <h3><i class="fas fa-clock"></i> 最近交易</h3>
                    <div class="transaction-list" id="recent-transactions">
                        ${this.renderRecentTransactions()}
                    </div>
                </div>

                <!-- 支付连接 -->
                <div class="card">
                    <h3><i class="fas fa-credit-card"></i> 支付连接</h3>
                    <div class="payment-connections">
                        <div class="payment-item">
                            <div class="payment-icon wechat">
                                <i class="fab fa-weixin"></i>
                            </div>
                            <div class="payment-info">
                                <div class="payment-name">微信支付</div>
                                <div class="payment-status">
                                    <span class="status-dot connected"></span>
                                    <span class="status-text">已连接</span>
                                </div>
                            </div>
                            <button class="payment-action-btn" onclick="connectWechatPay()">管理</button>
                        </div>
                        
                        <div class="payment-item">
                            <div class="payment-icon alipay">
                                <i class="fab fa-alipay"></i>
                            </div>
                            <div class="payment-info">
                                <div class="payment-name">支付宝</div>
                                <div class="payment-status">
                                    <span class="status-dot connected"></span>
                                    <span class="status-text">已连接</span>
                                </div>
                            </div>
                            <button class="payment-action-btn" onclick="connectAlipay()">管理</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 渲染最近交易列表
    renderRecentTransactions() {
        // 使用应用中的交易数据
        const recentTransactions = this.app.transactions.slice(0, 5);
        
        if (recentTransactions.length === 0) {
            return '<div style="text-align: center; color: #718096; padding: 20px;">暂无交易记录</div>';
        }

        return recentTransactions.map((transaction, index) => {
            const category = this.app.categories.find(c => c.id === transaction.category);
            const isToday = new Date(transaction.date).toDateString() === new Date().toDateString();
            const displayDate = isToday ? transaction.time : new Date(transaction.date).toLocaleDateString('zh-CN');
            const categoryName = category ? category.name : '未分类';
            
            return `
                <div class="transaction-item" data-index="${index}">
                    <div class="transaction-info">
                        <div class="transaction-title">${transaction.description}</div>
                        <div class="transaction-detail">${transaction.merchant} · ${categoryName} · ${displayDate}</div>
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'}¥${transaction.amount}
                    </div>
                </div>
            `;
        }).join('');
    }

    // 获取当前用户模式
    getCurrentUserMode() {
        // 从router获取当前模式，如果不存在则使用默认值
        if (window.router && typeof window.router.getCurrentUserMode === 'function') {
            return window.router.getCurrentUserMode();
        }
        // 从app获取当前模式
        if (this.app && this.app.userMode) {
            return this.app.userMode;
        }
        // 默认模式
        return 'student';
    }
    
    // 根据用户模式获取对应标题
    getModeTitle(key) {
        const userMode = this.getCurrentUserMode();
        const titles = {
            'student': {
                'monthlyOverview': '本月收支',
                'modeSpecificTitle': '学习预算追踪'
            },
            'family': {
                'monthlyOverview': '家庭收支',
                'modeSpecificTitle': '家庭财务管理'
            },

        };
        
        return titles[userMode] && titles[userMode][key] ? titles[userMode][key] : titles['student'][key];
    }
    
    // 渲染模式特定的内容
    renderModeSpecificContent(mode) {
        switch(mode) {
            case 'student':
                return `
                    <div class="card mode-specific-content student-mode">
                        <h3><i class="fas fa-graduation-cap"></i> 学习预算追踪</h3>
                        <div class="mode-content">
                            <div class="mode-stats">
                                <div class="mode-stat-item">
                                    <div class="stat-icon"><i class="fas fa-book"></i></div>
                                    <div class="stat-info">
                                        <div class="stat-value" id="study-budget">¥0</div>
                                        <div class="stat-label">学习预算</div>
                                    </div>
                                </div>
                                <div class="mode-stat-item">
                                    <div class="stat-icon"><i class="fas fa-piggy-bank"></i></div>
                                    <div class="stat-info">
                                        <div class="stat-value" id="scholarship-savings">¥0</div>
                                        <div class="stat-label">奖学金储蓄</div>
                                    </div>
                                </div>
                            </div>
                            <p class="mode-tip">设置学习预算，追踪学习支出，合理规划奖学金使用</p>
                        </div>
                    </div>
                `;
            case 'family':
                return `
                    <div class="card mode-specific-content family-mode">
                        <h3><i class="fas fa-home"></i> 家庭财务管理</h3>
                        <div class="mode-content">
                            <div class="mode-stats">
                                <div class="mode-stat-item">
                                    <div class="stat-icon"><i class="fas fa-utensils"></i></div>
                                    <div class="stat-info">
                                        <div class="stat-value" id="family-expense">¥0</div>
                                        <div class="stat-label">家庭支出</div>
                                    </div>
                                </div>
                                <div class="mode-stat-item">
                                    <div class="stat-icon"><i class="fas fa-users"></i></div>
                                    <div class="stat-info">
                                        <div class="stat-value" id="member-count">0</div>
                                        <div class="stat-label">成员数量</div>
                                    </div>
                                </div>
                            </div>
                            <p class="mode-tip">管理家庭共同账户，追踪各项家庭支出，合理规划家庭预算</p>
                        </div>
                    </div>
                `;
            case 'freelancer':
                return `
                    <div class="card mode-specific-content">
                        <h3><i class="fas fa-briefcase"></i> 自由职业财务管理</h3>
                        <div class="mode-content">
                            <div class="mode-stats">
                                <div class="mode-stat-item">
                                    <div class="stat-icon"><i class="fas fa-hand-holding-usd"></i></div>
                                    <div class="stat-info">
                                        <div class="stat-value" id="client-income">¥0</div>
                                        <div class="stat-label">客户收入</div>
                                    </div>
                                </div>
                                <div class="mode-stat-item">
                                    <div class="stat-icon"><i class="fas fa-receipt"></i></div>
                                    <div class="stat-info">
                                        <div class="stat-value" id="tax-savings">¥0</div>
                                        <div class="stat-label">税费储蓄</div>
                                    </div>
                                </div>
                            </div>
                            <p class="mode-tip">追踪项目收入，管理税费，优化自由职业财务管理</p>
                        </div>
                    </div>
                `;
            default:
                return '';
        }
    }
    
    // 初始化事件
    initEvents() {
        console.log('主页事件初始化开始...');
        
        // 设置全局变量
        homePage = this;

        // 初始化输入管理器
        this.initInputManager();

        // 使用setTimeout确保DOM完全加载后再绑定事件
        setTimeout(() => {
            console.log('开始绑定事件...');
            this.bindQuickActionEvents();
            this.bindTransactionEvents();
            // 初始化模式特定事件
            this.initModeSpecificEvents();
            console.log('事件绑定完成');
        }, 200);

        // 加载本月统计数据
        this.loadMonthlyStats();
        // 加载模式特定数据
        this.loadModeSpecificData();

        // 更新数据库状态显示
        this.updateDatabaseStatus();
        
        console.log('主页事件初始化完成');
    }
    
    // 初始化模式特定事件
    initModeSpecificEvents() {
        const userMode = this.getCurrentUserMode();
        
        // 根据不同模式绑定特定事件
        switch(userMode) {
            case 'student':
                // 学生模式特定事件
                break;
            case 'family':
                // 家庭模式特定事件
                break;

        }
    }
    
    // 加载模式特定数据
    loadModeSpecificData() {
        const userMode = this.getCurrentUserMode();
        
        // 根据不同模式加载特定数据
        switch(userMode) {
            case 'student':
                this.loadStudentModeData();
                break;
            case 'family':
                this.loadFamilyModeData();
                break;

        }
    }
    
    // 加载学生模式数据
    loadStudentModeData() {
        // 这里可以从app中获取学习相关数据并更新UI
        // 示例：设置学习预算和奖学金储蓄数据
        setTimeout(() => {
            const studyBudgetEl = document.getElementById('study-budget');
            const scholarshipSavingsEl = document.getElementById('scholarship-savings');
            
            if (studyBudgetEl) studyBudgetEl.textContent = '¥1000';
            if (scholarshipSavingsEl) scholarshipSavingsEl.textContent = '¥5000';
        }, 500);
    }
    
    // 加载家庭模式数据
    loadFamilyModeData() {
        // 这里可以从app中获取家庭相关数据并更新UI
        setTimeout(() => {
            const familyExpenseEl = document.getElementById('family-expense');
            const memberCountEl = document.getElementById('member-count');
            
            if (familyExpenseEl) familyExpenseEl.textContent = '¥8000';
            if (memberCountEl) memberCountEl.textContent = '4';
        }, 500);
    }
    
    // 加载自由职业者模式数据
    loadFreelancerModeData() {
        // 这里可以从app中获取自由职业相关数据并更新UI
        setTimeout(() => {
            const clientIncomeEl = document.getElementById('client-income');
            const taxSavingsEl = document.getElementById('tax-savings');
            
            if (clientIncomeEl) clientIncomeEl.textContent = '¥15000';
            if (taxSavingsEl) taxSavingsEl.textContent = '¥3000';
        }, 500);
    }
    
    // 绑定快速记账按钮事件
    bindQuickActionEvents() {
        console.log('开始绑定快速记账按钮事件...');
        
        const voiceBtn = document.getElementById('voice-input-btn');
        const qrBtn = document.getElementById('qr-scanner-btn');
        const manualBtn = document.getElementById('manual-input-btn');
        const photoBtn = document.getElementById('photo-input-btn');
        
        console.log('找到的按钮:', { voiceBtn, qrBtn, manualBtn, photoBtn });
        
        if (voiceBtn) {
            voiceBtn.addEventListener('click', (e) => {
                console.log('语音记账按钮被点击');
                e.preventDefault();
                e.stopPropagation();
                this.startVoiceInput();
            });
        } else {
            console.error('语音记账按钮未找到');
        }
        

        
        if (manualBtn) {
            manualBtn.addEventListener('click', (e) => {
                console.log('手动输入按钮被点击');
                e.preventDefault();
                e.stopPropagation();
                this.showManualInput();
            });
        } else {
            console.error('手动输入按钮未找到');
        }
        
        if (photoBtn) {
            photoBtn.addEventListener('click', (e) => {
                console.log('拍照记账按钮被点击');
                e.preventDefault();
                e.stopPropagation();
                this.startPhotoInput();
            });
        } else {
            console.error('拍照记账按钮未找到');
        }
        
        console.log('快速记账按钮事件绑定完成');
    }
    
    // 绑定交易项点击事件
    bindTransactionEvents() {
        const transactionItems = document.querySelectorAll('.transaction-item');
        if (transactionItems.length > 0) {
            transactionItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    const index = parseInt(item.getAttribute('data-index'));
                    console.log('交易项被点击，索引:', index);
                    this.editTransaction(index);
                });
            });
        }
    }
    
    // 更新数据库状态显示
    updateDatabaseStatus() {
        const statusIndicator = document.getElementById('db-status-indicator');
        const dataSource = document.getElementById('data-source');
        const lastUpdate = document.getElementById('last-update');
        
        if (!statusIndicator) return;
        
        // 根据应用状态更新显示
        if (this.app.databaseStatus === 'connected') {
            statusIndicator.innerHTML = `
                <span class="status-dot connected"></span>
                <span class="status-text">已连接</span>
            `;
            dataSource.textContent = this.app.useSupabase ? 'Supabase' : '后端API';
        } else {
            statusIndicator.innerHTML = `
                <span class="status-dot disconnected"></span>
                <span class="status-text">离线模式</span>
            `;
            dataSource.textContent = '本地存储';
        }
        
        lastUpdate.textContent = '刚刚';
    }

    // 加载本月统计数据
    async loadMonthlyStats() {
        try {
            // 首先检查后端API是否可用
            const apiAvailable = await this.checkBackendAPI();
            
            if (apiAvailable) {
                // 获取本月日期范围（用于收入）
                const now = new Date();
                const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                
                // 获取今日日期（用于支出）
                const today = new Date().toISOString().split('T')[0];
                
                // 调用后端API获取本月收入统计
                const monthlyResponse = await fetch(`/api/transactions/stats/summary?startDate=${startDate}&endDate=${endDate}`);
                
                // 调用后端API获取今日支出统计
                const todayResponse = await fetch(`/api/transactions/stats/summary?startDate=${today}&endDate=${today}`);
                
                if (monthlyResponse.ok && todayResponse.ok) {
                    const monthlyResult = await monthlyResponse.json();
                    const todayResult = await todayResponse.json();
                    
                    if (monthlyResult.success && todayResult.success) {
                        const monthlyStats = monthlyResult.data.stats;
                        const todayStats = todayResult.data.stats;
                        
                        // 更新页面显示
                        document.getElementById('monthly-income').textContent = `¥${monthlyStats.totalIncome || 0}`;
                        document.getElementById('today-expense').textContent = `¥${todayStats.totalExpense || 0}`;
                        document.getElementById('monthly-balance').textContent = `¥${monthlyStats.netIncome || 0}`;
                        
                        // 计算预算进度（基于当月预算与当月支出）
                        const budgetProgress = this.calculateBudgetProgress();
                        document.getElementById('budget-progress').textContent = `${budgetProgress}%`;
                        this.updateBudgetIndicators(budgetProgress);
                        
                        console.log('✅ 使用后端API数据');
                        return;
                    }
                }
            }
            
            // 如果API不可用或调用失败，使用应用本地数据
            const monthlyStats = this.app.getMonthlyStats();
            const todayStats = this.app.getTodayStats();
            
            document.getElementById('monthly-income').textContent = `¥${monthlyStats.income}`;
            document.getElementById('today-expense').textContent = `¥${todayStats.expense}`;
            document.getElementById('monthly-balance').textContent = `¥${monthlyStats.balance}`;
            const budgetProgress = this.calculateBudgetProgress();
            document.getElementById('budget-progress').textContent = `${budgetProgress}%`;
            this.updateBudgetIndicators(budgetProgress);
            
            console.log('📁 使用本地数据');
            
        } catch (error) {
            console.error('加载本月统计数据错误:', error);
            this.showDefaultStats();
        }
    }
    
    // 检查后端API是否可用
    async checkBackendAPI() {
        try {
            const response = await fetch('/api/health', {
                method: 'GET'
            });
            return response.ok;
        } catch (error) {
            console.log('后端API不可用，使用本地数据');
            return false;
        }
    }
    
    // 计算预算进度（按当月预算与当月支出）
    calculateBudgetProgress() {
        const monthlyBudget = Number(this.app.budgets?.monthly || 0);
        if (!monthlyBudget || monthlyBudget <= 0) return 0;
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const monthlyExpense = this.app.transactions
            .filter(t => t.type === 'expense' && new Date(t.date) >= start && new Date(t.date) < end)
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        return Math.min(100, Math.max(0, Math.round((monthlyExpense / monthlyBudget) * 100)));
    }
    
    // 显示默认统计数据
    showDefaultStats() {
        document.getElementById('monthly-income').textContent = '¥0';
        document.getElementById('today-expense').textContent = '¥0';
        document.getElementById('monthly-balance').textContent = '¥0';
        document.getElementById('budget-progress').textContent = '0%';
        this.updateBudgetIndicators(0);
    }

    // 更新预算显示样式与徽标
    updateBudgetIndicators(percent) {
        const progressEl = document.getElementById('budget-progress');
        const badgeEl = document.getElementById('budget-badge');
        if (!progressEl || !badgeEl) return;

        // 颜色分级：<80% 蓝绿，80-99% 橙，>=100% 红
        if (percent >= 100) {
            progressEl.style.color = '#e53e3e';
            badgeEl.textContent = '超额';
            badgeEl.style.background = '#fed7d7';
            badgeEl.style.color = '#c53030';
        } else if (percent >= 80) {
            progressEl.style.color = '#d69e2e';
            badgeEl.textContent = '预警';
            badgeEl.style.background = '#fefcbf';
            badgeEl.style.color = '#975a16';
        } else {
            progressEl.style.color = '#4fd1c5';
            badgeEl.textContent = '';
            badgeEl.style.background = '#edf2f7';
            badgeEl.style.color = '#718096';
        }
    }
    
    // 更新数据
    updateData() {
        // 更新本月统计
        this.loadMonthlyStats();
        
        // 更新数据库状态
        this.updateDatabaseStatus();
        
        // 更新交易列表
        const container = document.getElementById('recent-transactions');
        if (container) {
            container.innerHTML = this.renderRecentTransactions();
            
            // 重新绑定交易项事件
            setTimeout(() => {
                this.bindTransactionEvents();
            }, 50);
        }
        
        // 更新模式特定内容
        this.updateModeSpecificContent();
    }
    
    // 更新模式特定内容
    updateModeSpecificContent() {
        const userMode = this.getCurrentUserMode();
        const modeContent = document.querySelector('.mode-specific-content');
        
        if (modeContent) {
            // 根据用户模式更新特定内容
            switch(userMode) {
                case 'student':
                    this.updateStudentModeContent();
                    break;
                case 'family':
                    this.updateFamilyModeContent();
                    break;
                case 'freelancer':
                    this.updateFreelancerModeContent();
                    break;
            }
        }
    }
    
    // 更新学生模式特定内容
    updateStudentModeContent() {
        const studyBudget = document.getElementById('study-budget');
        const scholarshipSavings = document.getElementById('scholarship-savings');
        
        if (studyBudget) {
            // 这里可以添加学生模式特定的预算计算逻辑
            studyBudget.textContent = '¥0';
        }
        
        if (scholarshipSavings) {
            // 这里可以添加奖学金储蓄计算逻辑
            scholarshipSavings.textContent = '¥0';
        }
    }
    
    // 更新家庭模式特定内容
    updateFamilyModeContent() {
        // 家庭模式特定内容更新逻辑
        console.log('更新家庭模式内容');
    }
    


    // 初始化输入管理器
    initInputManager() {
        if (typeof VoiceRecognition !== 'undefined' && typeof QRScanner !== 'undefined' && typeof PhotoRecognition !== 'undefined') {
            this.inputManager = new InputManager(this.app);
        }
    }

    // 启动语音输入
    startVoiceInput() {
        if (this.inputManager) {
            this.inputManager.startVoiceInput();
        } else {
            this.showVoiceInput();
        }
    }

    // 启动扫码
    startQRScan() {
        if (this.inputManager) {
            this.inputManager.startQRScan();
        } else {
            this.showQRScanner();
        }
    }

    // 启动拍照输入
    startPhotoInput() {
        if (this.inputManager) {
            this.inputManager.startPhotoInput();
        } else {
            this.showPhotoInput();
        }
    }

    // 显示语音输入（兼容模式）
    showVoiceInput() {
        this.showModal('语音记账', `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">🎤</div>
                <p>请说出您的记账内容，例如：</p>
                <p style="color: #666; margin: 10px 0;">"今天买咖啡花了30元"</p>
                <p style="color: #666; margin: 10px 0;">"工资收入8000元"</p>
                <button class="action-btn" style="margin-top: 20px;" onclick="homePage.simulateVoiceInput()">
                    模拟语音输入
                </button>
            </div>
        `);
    }

    // 模拟语音输入
    simulateVoiceInput() {
        const examples = [
            { amount: 30, description: '咖啡', category: 'food', type: 'expense', merchant: '语音识别' },
            { amount: 8000, description: '工资', category: 'salary', type: 'income', merchant: '语音识别' },
            { amount: 15, description: '午餐', category: 'food', type: 'expense', merchant: '语音识别' }
        ];
        const example = examples[Math.floor(Math.random() * examples.length)];
        
        this.app.addTransaction(example);
        this.hideModal();
        this.updateData();
    }

    // 显示扫码功能
    showQRScanner() {
        this.showModal('扫码记账', `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">📱</div>
                <p>请扫描商品二维码或条形码</p>
                <button class="action-btn" style="margin-top: 20px;" onclick="homePage.simulateQRScan()">
                    模拟扫码
                </button>
            </div>
        `);
    }

    // 模拟扫码
    simulateQRScan() {
        this.app.addTransaction({
            amount: 25,
            description: '扫码商品',
            category: 'shopping',
            type: 'expense',
            merchant: '扫码识别'
        });
        this.hideModal();
        this.updateData();
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
                <button class="action-btn" style="margin-top: 20px;" onclick="homePage.simulatePhotoInput()">
                    模拟拍照
                </button>
            </div>
        `);
    }

    // 模拟拍照输入
    simulatePhotoInput() {
        this.app.addTransaction({
            amount: 158,
            description: '超市购物',
            category: 'shopping',
            type: 'expense',
            merchant: '照片识别'
        });
        this.hideModal();
        this.updateData();
    }

    // 切换平台同步
    togglePlatformSync(platform, element) {
        document.querySelectorAll('.platform-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        element.classList.add('active');
        this.app.showToast(`${platform === 'wechat' ? '微信支付' : '支付宝'}同步已启用`);
    }

    // 编辑交易
    editTransaction(index) {
        const transaction = this.app.transactions[index];
        this.showTransactionModal(transaction, index);
    }

    // 显示交易模态框
    showTransactionModal(transaction = null, index = null) {
        const isEdit = transaction !== null;
        const categoriesOptions = this.app.categories.map(cat => 
            `<option value="${cat.id}" ${transaction?.category === cat.id ? 'selected' : ''}>${cat.icon} ${cat.name}</option>`
        ).join('');

        this.showModal(isEdit ? '编辑交易' : '新增交易', `
            <div style="padding: 20px;">
                <div class="input-group">
                    <label>类型</label>
                    <select id="transaction-type">
                        <option value="income" ${transaction?.type === 'income' ? 'selected' : ''}>收入</option>
                        <option value="expense" ${!transaction || transaction?.type === 'expense' ? 'selected' : ''}>支出</option>
                    </select>
                </div>
                
                <div class="input-group">
                    <label>金额</label>
                    <input type="number" id="transaction-amount" value="${transaction?.amount || ''}" placeholder="输入金额">
                </div>
                
                <div class="input-group">
                    <label>分类</label>
                    <select id="transaction-category">
                        ${categoriesOptions}
                    </select>
                </div>
                
                <div class="input-group">
                    <label>描述</label>
                    <input type="text" id="transaction-description" value="${transaction?.description || ''}" placeholder="交易描述">
                </div>
                
                <div class="input-group">
                    <label>商户</label>
                    <input type="text" id="transaction-merchant" value="${transaction?.merchant || ''}" placeholder="商户名称">
                </div>
                
                <div class="button-group">
                    <button class="btn btn-primary" onclick="homePage.${isEdit ? 'updateTransaction' : 'saveTransaction'}(${index})">
                        ${isEdit ? '更新' : '保存'}
                    </button>
                    ${isEdit ? `<button class="btn btn-danger" onclick="homePage.deleteTransaction(${index})">删除</button>` : ''}
                    <button class="btn btn-secondary" onclick="homePage.hideModal()">取消</button>
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
            this.app.showToast('请填写完整信息！');
            return;
        }

        this.app.addTransaction({
            type,
            amount,
            category,
            description,
            merchant
        });

        this.hideModal();
        this.updateData();
    }

    // 更新交易
    updateTransaction(index) {
        const type = document.getElementById('transaction-type').value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const category = document.getElementById('transaction-category').value;
        const description = document.getElementById('transaction-description').value;
        const merchant = document.getElementById('transaction-merchant').value;

        if (!amount || !description) {
            this.app.showToast('请填写完整信息！');
            return;
        }

        this.app.editTransaction(index, {
            type,
            amount,
            category,
            description,
            merchant
        });

        this.hideModal();
        this.updateData();
    }

    // 删除交易
    deleteTransaction(index) {
        // 保存当前打开的模态框引用
        const previousModal = this.currentModal;
        
        this.showConfirmModal('确认删除', '确定要删除这条交易记录吗？', async () => {
            const success = await this.app.deleteTransaction(index);
            if (success) {
                // 先关闭确认对话框
                this.hideModal();
                // 恢复之前的模态框引用并关闭它
                if (previousModal) {
                    this.currentModal = previousModal;
                    this.hideModal();
                }
                this.updateData();
                this.app.showToast('删除成功', 'success');
            } else {
                this.app.showToast('删除失败，请重试', 'error');
            }
        });
    }

    // 显示确认对话框
    showConfirmModal(title, message, onConfirm) {
        const content = `
            <div class="confirm-dialog" style="text-align: center; padding: 20px;">
                <p style="margin-bottom: 20px; color: #4a5568;">${message}</p>
                <div class="button-group" style="display: flex; justify-content: center; gap: 10px;">
                    <button id="cancel-btn" 
                            style="padding: 8px 16px; border-radius: 6px; border: 1px solid #e2e8f0; background: #f7fafc; color: #4a5568;">
                        取消
                    </button>
                    <button id="confirm-btn" 
                            style="padding: 8px 16px; border-radius: 6px; border: none; background: #e53e3e; color: white;">
                        确认删除
                    </button>
                </div>
            </div>
        `;
        this.showModal(title, content);

        // 使用事件监听器绑定点击事件
        setTimeout(() => {
            const cancelBtn = document.getElementById('cancel-btn');
            const confirmBtn = document.getElementById('confirm-btn');
            
            // 定义事件处理函数
            const handleCancel = () => {
                if (cancelBtn) cancelBtn.removeEventListener('click', handleCancel);
                this.hideModal();
            };
            
            const handleConfirm = async () => {
                if (confirmBtn) confirmBtn.removeEventListener('click', handleConfirm);
                await onConfirm();
                this.hideModal(); // 确认操作完成后自动关闭弹窗
            };
            
            // 绑定事件
            if (cancelBtn) {
                cancelBtn.addEventListener('click', handleCancel);
            }
            
            if (confirmBtn) {
                confirmBtn.addEventListener('click', handleConfirm);
            }
        }, 0);
    }

    // 显示模态框
    showModal(title, content) {
        // 如果已经有模态框打开，先移除它
        if (this.currentModal) {
            document.body.removeChild(this.currentModal);
        }

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
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        // 为关闭按钮添加事件监听
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideModal());
        }

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
}

// 全局变量以便在模态框中使用
let homePage;