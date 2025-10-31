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

                <!-- 储蓄目标概览 -->
                <div class="card">
                    <h3><i class="fas fa-piggy-bank"></i> 储蓄目标</h3>
                    <div class="savings-overview" id="savings-overview">
                        ${this.renderSavingsOverview()}
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

    // 渲染储蓄目标概览
    renderSavingsOverview() {
        // 只显示学生模式下的考证/学费储蓄计划
        const userMode = this.getCurrentUserMode();
        
        if (userMode !== 'student') {
            return `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 3rem; color: #cbd5e0; margin-bottom: 10px;">
                        <i class="fas fa-graduation-cap"></i>
                    </div>
                    <p style="color: #718096; margin-bottom: 15px;">储蓄目标功能仅对学生模式开放</p>
                    <p style="color: #a0aec0; font-size: 0.9rem;">切换到学生模式可查看考证/学费储蓄计划</p>
                </div>
            `;
        }

        // 加载学生模式下的考证目标数据
        const examGoals = this.loadStudentExamGoals();
        
        if (examGoals.length === 0) {
            return `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 3rem; color: #cbd5e0; margin-bottom: 10px;">
                        <i class="fas fa-certificate"></i>
                    </div>
                    <p style="color: #718096; margin-bottom: 15px;">还没有考证/学费储蓄目标</p>
                    <p style="color: #a0aec0; font-size: 0.9rem; margin-bottom: 15px;">在学生模式中创建储蓄目标</p>
                </div>
            `;
        }

        // 显示前3个活跃目标
        const activeGoals = examGoals.filter(goal => !this.isGoalCompleted(goal)).slice(0, 3);
        
        return `
            <div class="savings-overview-content">
                <div class="savings-stats">
                    <div class="savings-stat">
                        <div class="stat-value">${activeGoals.length}</div>
                        <div class="stat-label">活跃目标</div>
                    </div>
                    <div class="savings-stat">
                        <div class="stat-value">¥${this.getTotalStudentSavings(examGoals).toLocaleString()}</div>
                        <div class="stat-label">总储蓄</div>
                    </div>
                    <div class="savings-stat">
                        <div class="stat-value">${this.getAverageStudentProgress(examGoals).toFixed(1)}%</div>
                        <div class="stat-label">平均进度</div>
                    </div>
                </div>
                
                <div class="goals-preview">
                    ${activeGoals.map(goal => this.renderStudentGoalPreview(goal)).join('')}
                </div>
                
                <div class="savings-actions">
                    <button class="action-btn" onclick="homePage.navigateToStudentMode()">
                        查看全部目标
                    </button>
                </div>
            </div>
        `;
    }

    // 渲染学生模式单个目标预览
    renderStudentGoalPreview(goal) {
        const progress = (goal.currentAmount / goal.amount * 100).toFixed(1);
        const deadline = new Date(goal.deadline);
        const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
        
        return `
            <div class="goal-preview student-goal" onclick="homePage.navigateToStudentMode()">
                <div class="goal-header">
                    <div class="goal-icon" style="background-color: #667eea">
                        <i class="fas fa-certificate"></i>
                    </div>
                    <div class="goal-info">
                        <div class="goal-name">${goal.name}</div>
                        <div class="goal-details">
                            <span class="goal-amount">¥${goal.currentAmount.toLocaleString()} / ¥${goal.amount.toLocaleString()}</span>
                            <span class="goal-deadline">${daysLeft > 0 ? `剩余${daysLeft}天` : '已到期'}</span>
                        </div>
                    </div>
                </div>
                <div class="goal-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                    <div class="progress-text">${progress}%</div>
                </div>
            </div>
        `;
    }

    // 加载学生模式下的考证目标数据
    loadStudentExamGoals() {
        try {
            const savedGoals = localStorage.getItem('student_exam_goals');
            if (savedGoals) {
                return JSON.parse(savedGoals);
            }
        } catch (error) {
            console.error('加载学生模式储蓄目标数据失败:', error);
        }
        return [];
    }

    // 检查目标是否已完成
    isGoalCompleted(goal) {
        return goal.currentAmount >= goal.amount;
    }

    // 获取学生模式总储蓄金额
    getTotalStudentSavings(goals) {
        return goals.reduce((total, goal) => total + goal.currentAmount, 0);
    }

    // 获取学生模式平均进度
    getAverageStudentProgress(goals) {
        if (goals.length === 0) return 0;
        const totalProgress = goals.reduce((sum, goal) => sum + (goal.currentAmount / goal.amount * 100), 0);
        return totalProgress / goals.length;
    }

    // 删除不再使用的旧函数

    // 导航到学生模式页面
    navigateToStudentMode() {
        if (window.router && typeof window.router.navigate === 'function') {
            window.router.navigate('student-mode');
        } else {
            console.warn('路由功能不可用');
        }
    }

    // 导航到储蓄目标页面（保留兼容性）
    navigateToSavingsGoals() {
        this.navigateToStudentMode();
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


        };
        
        return titles[userMode] && titles[userMode][key] ? titles[userMode][key] : titles['student'][key];
    }
    
    // 渲染模式特定的内容
    renderModeSpecificContent(mode) {
        switch(mode) {
            case 'student':
                return ''; // 删除学习预算追踪功能

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


        }
    }
    
    // 加载学生模式数据
    loadStudentModeData() {
        // 学习预算追踪功能已删除
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
                // 获取本月日期范围
                const now = new Date();
                const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                
                // 获取今日日期
                const today = new Date().toISOString().split('T')[0];
                
                // 调用后端API获取本月完整统计（包含收入和支出）
                const monthlyResponse = await fetch(`/api/transactions/stats/summary?startDate=${startDate}&endDate=${endDate}`);
                
                // 调用后端API获取今日支出统计
                const todayResponse = await fetch(`/api/transactions/stats/summary?startDate=${today}&endDate=${today}`);
                
                if (monthlyResponse.ok && todayResponse.ok) {
                    const monthlyResult = await monthlyResponse.json();
                    const todayResult = await todayResponse.json();
                    
                    if (monthlyResult.success && todayResult.success) {
                        const monthlyStats = monthlyResult.data.stats;
                        const todayStats = todayResult.data.stats;
                        
                        // 注意：学生模式的兼职收入已经通过交易记录包含在API返回的数据中
                        // 不需要再次添加，否则会导致重复计算
                        const totalIncome = monthlyStats.totalIncome || 0;
                        const totalExpense = monthlyStats.totalExpense || 0;
                        const totalBalance = totalIncome - totalExpense;
                        
                        // 更新页面显示
                        document.getElementById('monthly-income').textContent = `¥${totalIncome}`;
                        document.getElementById('today-expense').textContent = `¥${todayStats.totalExpense || 0}`;
                        document.getElementById('monthly-balance').textContent = `¥${totalBalance}`;
                        
                        // 计算预算进度（基于当月预算与当月支出）
                        const budgetProgress = this.calculateBudgetProgress();
                        document.getElementById('budget-progress').textContent = `${budgetProgress}%`;
                        this.updateBudgetIndicators(budgetProgress);
                        
                        console.log('✅ 使用后端API数据（兼职收入已包含在交易记录中）');
                        console.log(`本月收入: ¥${totalIncome}, 本月支出: ¥${totalExpense}, 本月结余: ¥${totalBalance}`);
                        return;
                    }
                }
            }
            
            // 如果API不可用或调用失败，使用应用本地数据
            const monthlyStats = this.app.getMonthlyStats();
            const todayStats = this.app.getTodayStats();
            
            // 注意：学生模式的兼职收入已经通过交易记录包含在本地数据中
            // 不需要再次添加，否则会导致重复计算
            const totalIncome = monthlyStats.income;
            const totalExpense = monthlyStats.expense;
            const totalBalance = totalIncome - totalExpense;
            
            document.getElementById('monthly-income').textContent = `¥${totalIncome}`;
            document.getElementById('today-expense').textContent = `¥${todayStats.expense}`;
            document.getElementById('monthly-balance').textContent = `¥${totalBalance}`;
            const budgetProgress = this.calculateBudgetProgress();
            document.getElementById('budget-progress').textContent = `${budgetProgress}%`;
            this.updateBudgetIndicators(budgetProgress);
            
            console.log('📁 使用本地数据（兼职收入已包含在交易记录中）');
            console.log(`本月收入: ¥${totalIncome}, 本月支出: ¥${totalExpense}, 本月结余: ¥${totalBalance}`);
            
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
    
    // 获取学生模式的兼职收入
    getStudentPartTimeIncome() {
        try {
            const partTimeJobs = JSON.parse(localStorage.getItem('student_part_time_jobs') || '[]');
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            let totalIncome = 0;
            partTimeJobs.forEach(job => {
                if (job.status === 'completed') {
                    const jobDate = new Date(job.date);
                    if (jobDate.getMonth() === currentMonth && jobDate.getFullYear() === currentYear) {
                        totalIncome += job.amount;
                    }
                }
            });
            
            return totalIncome;
        } catch (error) {
            console.error('获取学生模式兼职收入失败:', error);
            return 0;
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
        
        // 更新储蓄目标概览
        this.updateSavingsOverview();
    }

    // 更新储蓄目标概览
    updateSavingsOverview() {
        const container = document.getElementById('savings-overview');
        if (container) {
            container.innerHTML = this.renderSavingsOverview();
        }
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

                case 'freelancer':
                    this.updateFreelancerModeContent();
                    break;
            }
        }
    }
    
    // 更新学生模式特定内容
    updateStudentModeContent() {
        // 学习预算追踪功能已删除
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



    // 显示语音输入（兼容模式）
    showVoiceInput() {
        const isVoiceSupported = this.checkVoiceSupport();
        
        this.showModal('语音记账', `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">🎤</div>
                <p>请说出您的记账内容，例如：</p>
                <p style="color: #666; margin: 10px 0;">"今天买咖啡花了30元"</p>
                <p style="color: #666; margin: 10px 0;">"工资收入8000元"</p>
                
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 30px;">
                    <button class="action-btn" onclick="homePage.simulateVoiceInput()">
                        <i class="fas fa-play-circle"></i>
                        模拟语音输入
                    </button>
                    
                    ${isVoiceSupported ? `
                    <button class="action-btn voice-input-btn" onclick="homePage.startRealVoiceInput()">
                        <i class="fas fa-microphone"></i>
                        语音输入
                    </button>
                    ` : `
                    <button class="action-btn disabled" style="opacity: 0.6; cursor: not-allowed;">
                        <i class="fas fa-microphone-slash"></i>
                        语音输入（不支持）
                    </button>
                    `}
                </div>
                
                ${isVoiceSupported ? `
                <div style="margin-top: 15px; font-size: 0.85rem; color: #666;">
                    <i class="fas fa-info-circle"></i>
                    点击"语音输入"按钮后，请允许浏览器访问您的麦克风
                </div>
                ` : ''}
            </div>
        `);
    }

    // 检查语音支持
    checkVoiceSupport() {
        return ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
    }

    // 模拟语音输入
    simulateVoiceInput() {
        const examples = [
            { 
                amount: 30, 
                description: '星巴克咖啡', 
                category: 'food', 
                type: 'expense', 
                merchant: '星巴克',
                date: new Date().toISOString(),
                time: new Date().toISOString()
            },
            { 
                amount: 8000, 
                description: '本月工资收入', 
                category: 'salary', 
                type: 'income', 
                merchant: '公司',
                date: new Date().toISOString(),
                time: new Date().toISOString()
            },
            { 
                amount: 15, 
                description: '午餐便当', 
                category: 'food', 
                type: 'expense', 
                merchant: '快餐店',
                date: new Date().toISOString(),
                time: new Date().toISOString()
            },
            { 
                amount: 25, 
                description: '地铁交通费', 
                category: 'transport', 
                type: 'expense', 
                merchant: '地铁公司',
                date: new Date().toISOString(),
                time: new Date().toISOString()
            },
            { 
                amount: 200, 
                description: '网购衣服', 
                category: 'shopping', 
                type: 'expense', 
                merchant: '淘宝',
                date: new Date().toISOString(),
                time: new Date().toISOString()
            }
        ];
        const example = examples[Math.floor(Math.random() * examples.length)];
        
        this.app.addTransaction(example);
        this.hideModal();
        this.updateData();
        
        // 显示添加成功的提示
        const typeText = example.type === 'income' ? '收入' : '支出';
        this.app.showToast(`已添加${typeText}记录：${example.description} ¥${Math.abs(example.amount)}`, 'success');
    }

    // 开始真实语音输入
    startRealVoiceInput() {
        if (!this.checkVoiceSupport()) {
            this.app.showToast('您的浏览器不支持语音识别功能', 'error');
            return;
        }

        // 创建语音识别实例
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        // 配置识别参数
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'zh-CN';
        recognition.maxAlternatives = 1;

        // 显示语音识别状态
        this.showVoiceListeningState();

        // 设置事件监听
        recognition.onstart = () => {
            console.log('语音识别开始');
            this.app.showToast('正在聆听...', 'info');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('语音识别结果:', transcript);
            this.processRealVoiceInput(transcript);
        };

        recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            this.hideVoiceListeningState();
            
            let errorMessage = '语音识别失败';
            switch (event.error) {
                case 'not-allowed':
                    errorMessage = '请允许浏览器使用麦克风权限';
                    break;
                case 'no-speech':
                    errorMessage = '没有检测到语音输入';
                    break;
                case 'audio-capture':
                    errorMessage = '无法访问麦克风';
                    break;
                case 'network':
                    errorMessage = '网络连接错误';
                    break;
            }
            
            this.app.showToast(errorMessage, 'error');
        };

        recognition.onend = () => {
            console.log('语音识别结束');
            this.hideVoiceListeningState();
        };

        // 开始语音识别
        try {
            recognition.start();
        } catch (error) {
            console.error('启动语音识别失败:', error);
            this.app.showToast('启动语音识别失败', 'error');
            this.hideVoiceListeningState();
        }
    }

    // 处理真实语音输入
    processRealVoiceInput(transcript) {
        // 解析语音内容
        const parsedData = this.parseVoiceInput(transcript);
        
        if (parsedData) {
            // 显示识别结果确认界面
            this.showVoiceRecognitionResult(transcript, parsedData);
        } else {
            this.app.showToast('无法识别语音内容，请重新尝试', 'warning');
        }
    }

    // 解析语音输入
    parseVoiceInput(text) {
        const lowerText = text.toLowerCase();
        
        // 金额匹配模式
        const amountPatterns = [
            /(\d+(?:\.\d{1,2})?)元/g,
            /(\d+(?:\.\d{1,2})?)块钱/g,
            /(\d+(?:\.\d{1,2})?)块/g,
            /花了(\d+(?:\.\d{1,2})?)/g,
            /消费(\d+(?:\.\d{1,2})?)/g,
            /收入(\d+(?:\.\d{1,2})?)/g,
            /收到(\d+(?:\.\d{1,2})?)/g,
            /工资(\d+(?:\.\d{1,2})?)/g
        ];
        
        let amount = null;
        let category = null;
        let description = text;
        let type = 'expense'; // 默认为支出
        
        // 提取金额
        for (const pattern of amountPatterns) {
            const match = pattern.exec(lowerText);
            if (match) {
                amount = parseFloat(match[1]);
                break;
            }
        }
        
        // 如果没有匹配到金额，尝试提取数字
        if (!amount) {
            const numberMatch = lowerText.match(/(\d+(?:\.\d{1,2})?)/);
            if (numberMatch) {
                amount = parseFloat(numberMatch[1]);
            }
        }
        
        // 判断收入还是支出
        if (lowerText.includes('收入') || lowerText.includes('收到') || 
            lowerText.includes('工资') || lowerText.includes('转账') ||
            lowerText.includes('奖金') || lowerText.includes('报酬')) {
            type = 'income';
        }
        
        // 智能分类
        category = this.autoCategorizeVoiceInput(lowerText);
        
        // 验证解析结果
        if (!amount || isNaN(amount)) {
            return null;
        }
        
        // 如果是支出，金额为负数
        if (type === 'expense') {
            amount = -Math.abs(amount);
        }
        
        return {
            amount: amount,
            category: category,
            description: description,
            type: type,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toISOString(),
            source: 'voice_input',
            merchant: '语音识别'
        };
    }

    // 语音输入智能分类
    autoCategorizeVoiceInput(text) {
        const categoryRules = {
            // 餐饮相关
            '吃饭|餐饮|餐厅|饭店|火锅|烧烤|快餐|外卖|咖啡|奶茶|早餐|午餐|晚餐|零食|水果|超市|便当': 'food',
            
            // 交通相关
            '打车|出租车|滴滴|公交|地铁|高铁|飞机|机票|火车|出行|交通|加油|停车|车费': 'transport',
            
            // 购物相关
            '购物|买衣服|网购|淘宝|京东|拼多多|超市|商场|购物中心|日用品|电器|手机|电脑': 'shopping',
            
            // 娱乐相关
            '电影|KTV|游戏|娱乐|旅游|景点|门票|游乐场|演唱会|演出|音乐': 'entertainment',
            
            // 学习相关
            '学习|书籍|课程|培训|教育|学费|教材|文具|学习|考试': 'study',
            
            // 收入相关
            '工资|收入|奖金|兼职|报酬|转账|收款|薪水': 'salary',
            
            // 投资相关
            '股票|基金|理财|投资|收益|证券': 'investment',
            
            // 生活相关
            '水电|煤气|房租|物业|通讯|话费|网络|宽带|医疗|医院|药品|保险': 'other'
        };
        
        for (const [keywords, categoryId] of Object.entries(categoryRules)) {
            const keywordList = keywords.split('|');
            for (const keyword of keywordList) {
                if (text.includes(keyword)) {
                    return categoryId;
                }
            }
        }
        
        return 'other';
    }

    // 显示语音识别结果确认界面
    showVoiceRecognitionResult(originalText, parsedData) {
        const category = this.app.categories.find(cat => cat.id === parsedData.category);
        const categoryName = category ? category.name : '其他';
        const typeText = parsedData.type === 'income' ? '收入' : '支出';
        
        const modalContent = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">🎤</div>
                <h3>语音识别结果</h3>
                
                <div style="background: #f8f9fa; border-radius: 10px; padding: 15px; margin: 15px 0;">
                    <div style="text-align: left; margin-bottom: 10px;">
                        <strong>原始语音:</strong>
                        <p style="color: #666; margin: 5px 0; font-style: italic;">"${originalText}"</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: left;">
                        <div><strong>类型:</strong> <span style="color: ${parsedData.type === 'income' ? '#10b981' : '#ef4444'}">${typeText}</span></div>
                        <div><strong>金额:</strong> <span style="color: #3b82f6; font-weight: bold;">¥${Math.abs(parsedData.amount).toFixed(2)}</span></div>
                        <div><strong>分类:</strong> <span style="color: ${category ? category.color : '#666'}">${categoryName}</span></div>
                        <div><strong>描述:</strong> ${parsedData.description}</div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                    <button class="action-btn success" onclick="homePage.confirmVoiceInput()">
                        <i class="fas fa-check"></i> 确认添加
                    </button>
                    <button class="action-btn secondary" onclick="homePage.cancelVoiceInput()">
                        <i class="fas fa-times"></i> 取消
                    </button>
                    <button class="action-btn outline" onclick="homePage.startRealVoiceInput()">
                        <i class="fas fa-redo"></i> 重新识别
                    </button>
                </div>
            </div>
        `;
        
        // 保存当前解析的数据
        this.currentVoiceData = parsedData;
        
        // 更新模态框内容
        this.updateModalContent(modalContent);
    }

    // 确认语音输入
    confirmVoiceInput() {
        if (this.currentVoiceData) {
            this.app.addTransaction(this.currentVoiceData);
            this.hideModal();
            this.updateData();
            
            const typeText = this.currentVoiceData.type === 'income' ? '收入' : '支出';
            this.app.showToast(`已添加${typeText}记录：${this.currentVoiceData.description} ¥${Math.abs(this.currentVoiceData.amount)}`, 'success');
            
            this.currentVoiceData = null;
        }
    }

    // 取消语音输入
    cancelVoiceInput() {
        this.currentVoiceData = null;
        this.hideModal();
    }

    // 显示语音监听状态
    showVoiceListeningState() {
        const existingIndicator = document.getElementById('voice-listening-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        const indicator = document.createElement('div');
        indicator.id = 'voice-listening-indicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(59, 130, 246, 0.95);
                color: white;
                padding: 30px;
                border-radius: 20px;
                text-align: center;
                z-index: 10002;
                backdrop-filter: blur(10px);
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            ">
                <div style="font-size: 4rem; margin-bottom: 20px; animation: pulse 1.5s infinite;">🎤</div>
                <div style="font-size: 1.2rem; margin-bottom: 10px;">正在聆听...</div>
                <div style="color: #e0f2fe; font-size: 0.9rem;">请说出您的记账内容</div>
                <div style="margin-top: 20px; color: #b3e0ff; font-size: 0.8rem;">
                    例如："早餐花了15元" 或 "收到工资8000元"
                </div>
            </div>
        `;

        document.body.appendChild(indicator);
    }

    // 隐藏语音监听状态
    hideVoiceListeningState() {
        const indicator = document.getElementById('voice-listening-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // 更新模态框内容
    updateModalContent(content) {
        const modalBody = document.querySelector('.modal-content .modal-body');
        if (modalBody) {
            modalBody.innerHTML = content;
        }
    }

    // 显示拍照输入
    showPhotoInput() {
        this.showModal('拍照记账', `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">📷</div>
                <h3>拍照识别账单</h3>
                <p style="color: #666; margin: 15px 0;">拍摄小票、账单或二维码，系统将自动识别并记录</p>
                
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 30px;">
                    <button class="action-btn" onclick="homePage.simulatePhotoInput()">
                        <i class="fas fa-camera"></i>
                        模拟拍照
                    </button>
                    
                    <button class="action-btn photo-input-btn" onclick="homePage.startRealPhotoInput()">
                        <i class="fas fa-camera-retro"></i>
                        拍照识别
                    </button>
                </div>
                
                <div style="margin-top: 15px; font-size: 0.85rem; color: #666;">
                    <i class="fas fa-info-circle"></i>
                    点击"拍照识别"按钮后，请允许浏览器访问您的摄像头
                </div>
            </div>
        `);
    }

    // 模拟拍照输入
    simulatePhotoInput() {
        const examples = [
            { 
                amount: 45, 
                description: '超市购物', 
                category: 'shopping', 
                type: 'expense', 
                merchant: '沃尔玛',
                date: new Date().toISOString(),
                time: new Date().toISOString()
            },
            { 
                amount: 68, 
                description: '餐厅晚餐', 
                category: 'food', 
                type: 'expense', 
                merchant: '海底捞',
                date: new Date().toISOString(),
                time: new Date().toISOString()
            },
            { 
                amount: 25, 
                description: '打车费用', 
                category: 'transport', 
                type: 'expense', 
                merchant: '滴滴出行',
                date: new Date().toISOString(),
                time: new Date().toISOString()
            }
        ];
        const example = examples[Math.floor(Math.random() * examples.length)];
        
        this.app.addTransaction(example);
        this.hideModal();
        this.updateData();
        
        // 显示添加成功的提示
        this.app.showToast(`已添加支出记录：${example.description} ¥${Math.abs(example.amount)}`, 'success');
    }

    // 开始真实拍照输入
    startRealPhotoInput() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.app.showToast('您的浏览器不支持摄像头功能', 'error');
            return;
        }

        // 显示拍照界面
        this.showCameraInterface();
    }

    // 显示拍照界面
    showCameraInterface() {
        const modalContent = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">📷</div>
                <h3>拍照识别账单</h3>
                
                <div id="camera-container" style="margin: 20px 0;">
                    <video id="camera-preview" style="width: 100%; max-width: 400px; border-radius: 10px; background: #f0f0f0;"></video>
                    <canvas id="camera-canvas" style="display: none;"></canvas>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                    <button class="action-btn" id="capture-btn">
                        <i class="fas fa-camera"></i>
                        拍照
                    </button>
                    <button class="action-btn secondary" id="cancel-camera-btn">
                        <i class="fas fa-times"></i>
                        取消
                    </button>
                </div>
                
                <div style="margin-top: 15px; font-size: 0.85rem; color: #666;">
                    <i class="fas fa-lightbulb"></i>
                    请确保账单清晰可见，光线充足
                </div>
            </div>
        `;
        
        this.showModal('拍照识别', modalContent);
        
        // 延迟启动摄像头
        setTimeout(() => {
            this.startCamera();
        }, 100);
    }

    // 启动摄像头
    async startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            
            const video = document.getElementById('camera-preview');
            if (video) {
                video.srcObject = stream;
                video.play();
                
                // 绑定拍照按钮事件
                const captureBtn = document.getElementById('capture-btn');
                const cancelBtn = document.getElementById('cancel-camera-btn');
                
                if (captureBtn) {
                    captureBtn.onclick = () => this.capturePhoto(stream);
                }
                
                if (cancelBtn) {
                    cancelBtn.onclick = () => {
                        stream.getTracks().forEach(track => track.stop());
                        this.hideModal();
                    };
                }
            }
        } catch (error) {
            console.error('启动摄像头失败:', error);
            this.app.showToast('无法访问摄像头，请检查权限设置', 'error');
        }
    }

    // 拍照
    capturePhoto(stream) {
        const video = document.getElementById('camera-preview');
        const canvas = document.getElementById('camera-canvas');
        
        if (video && canvas) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // 停止摄像头
            stream.getTracks().forEach(track => track.stop());
            
            // 显示处理中状态
            this.showPhotoProcessing(canvas.toDataURL('image/jpeg'));
        }
    }

    // 显示照片处理界面
    showPhotoProcessing(imageData) {
        const modalContent = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">🔍</div>
                <h3>正在识别账单...</h3>
                
                <div style="margin: 20px 0;">
                    <img src="${imageData}" style="max-width: 200px; border-radius: 10px;" alt="拍摄的照片">
                </div>
                
                <div style="color: #666; margin: 15px 0;">
                    <i class="fas fa-spinner fa-spin"></i>
                    正在分析图片内容，请稍候...
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                    <button class="action-btn secondary" onclick="homePage.simulatePhotoRecognition()">
                        <i class="fas fa-magic"></i>
                        模拟识别
                    </button>
                    <button class="action-btn outline" onclick="homePage.showCameraInterface()">
                        <i class="fas fa-redo"></i>
                        重新拍摄
                    </button>
                </div>
            </div>
        `;
        
        this.updateModalContent(modalContent);
    }

    // 模拟照片识别
    simulatePhotoRecognition() {
        const examples = [
            { 
                amount: 128, 
                description: '超市购物小票', 
                category: 'shopping', 
                type: 'expense', 
                merchant: '永辉超市',
                date: new Date().toISOString(),
                time: new Date().toISOString()
            },
            { 
                amount: 89, 
                description: '餐厅消费账单', 
                category: 'food', 
                type: 'expense', 
                merchant: '肯德基',
                date: new Date().toISOString(),
                time: new Date().toISOString()
            },
            { 
                amount: 35, 
                description: '加油站收据', 
                category: 'transport', 
                type: 'expense', 
                merchant: '中石化',
                date: new Date().toISOString(),
                time: new Date().toISOString()
            }
        ];
        const example = examples[Math.floor(Math.random() * examples.length)];
        
        this.app.addTransaction(example);
        this.hideModal();
        this.updateData();
        
        // 显示添加成功的提示
        this.app.showToast(`已识别并添加支出记录：${example.description} ¥${Math.abs(example.amount)}`, 'success');
    }

    // 更新支付连接状态显示
    updatePaymentStatus() {
        // 检查用户登录状态
        const userData = localStorage.getItem('auth_user');
        const isLoggedIn = !!userData;
        
        if (isLoggedIn) {
            try {
                const user = JSON.parse(userData);
                const provider = user.provider;
                
                // 根据登录的支付平台更新状态
                if (provider === 'wechat') {
                    this.setPaymentStatus('wechat', 'connected');
                    this.setPaymentStatus('alipay', 'disconnected');
                } else if (provider === 'alipay') {
                    this.setPaymentStatus('wechat', 'disconnected');
                    this.setPaymentStatus('alipay', 'connected');
                } else {
                    // 其他登录方式，都显示为未连接
                    this.setPaymentStatus('wechat', 'disconnected');
                    this.setPaymentStatus('alipay', 'disconnected');
                }
            } catch (error) {
                console.error('解析用户数据失败:', error);
                this.setPaymentStatus('wechat', 'disconnected');
                this.setPaymentStatus('alipay', 'disconnected');
            }
        } else {
            // 未登录状态
            this.setPaymentStatus('wechat', 'disconnected');
            this.setPaymentStatus('alipay', 'disconnected');
        }
    }

    // 设置单个支付平台状态
    setPaymentStatus(paymentType, status) {
        const statusDot = document.getElementById(`${paymentType}-status-dot`);
        const statusText = document.getElementById(`${paymentType}-status-text`);
        
        if (statusDot && statusText) {
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
    }
}

// 全局变量以便在模态框中使用
let homePage;