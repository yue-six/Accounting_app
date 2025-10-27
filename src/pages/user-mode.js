class UserModePage {
    constructor(app) {
        this.app = app;
        this.currentModal = null;
        this.currentMode = this.getCurrentMode();
        this.loadUserModeData();
    }

    // 获取当前用户模式
    getCurrentMode() {
        try {
            const userMode = localStorage.getItem('user_mode') || 'student';
            return userMode;
        } catch (e) {
            console.error('获取用户模式失败:', e);
            return 'student';
        }
    }

    // 加载用户模式数据
    loadUserModeData() {
        try {
            // 加载通用数据
            this.transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            this.categories = JSON.parse(localStorage.getItem('categories') || '[]');
            
            // 根据当前模式加载特定数据
            switch (this.currentMode) {
                case 'student':
                    this.loadStudentData();
                    break;
                case 'family':
                    this.loadFamilyData();
                    break;
                case 'freelancer':
                    this.loadFreelancerData();
                    break;
            }
        } catch (e) {
            console.error('加载用户模式数据失败:', e);
        }
    }

    // 加载学生模式数据
    loadStudentData() {
        this.settings = JSON.parse(localStorage.getItem('student_mode_settings') || '{}');
        this.partTimeJobs = JSON.parse(localStorage.getItem('student_part_time_jobs') || '[]');
        this.examGoals = JSON.parse(localStorage.getItem('student_exam_goals') || '[]');
        this.budgetAllocations = JSON.parse(localStorage.getItem('student_budget_allocations') || '{}');
    }

    // 加载家庭模式数据
    loadFamilyData() {
        this.familySettings = JSON.parse(localStorage.getItem('family_mode_settings') || '{}');
        this.familyMembers = JSON.parse(localStorage.getItem('family_members') || '[]');
        this.familyTransactions = JSON.parse(localStorage.getItem('family_transactions') || '[]');
        this.familyBudgets = JSON.parse(localStorage.getItem('family_budgets') || '{}');
        this.currentUser = JSON.parse(localStorage.getItem('current_family_user') || '{"name": "我", "role": "admin", "id": "default"}');
    }

    // 加载自由职业模式数据
    loadFreelancerData() {
        this.freelancerSettings = JSON.parse(localStorage.getItem('freelancer_mode_settings') || '{}');
        this.projects = JSON.parse(localStorage.getItem('freelancer_projects') || '[]');
        this.invoices = JSON.parse(localStorage.getItem('freelancer_invoices') || '[]');
        this.expenses = JSON.parse(localStorage.getItem('freelancer_expenses') || '[]');
    }

    // 渲染页面
    render() {
        const modeLabels = {
            'student': '学生模式',
            'family': '家庭模式', 
            'freelancer': '自由职业'
        };

        return `
            <div class="page active" id="user-mode-page">
                <div class="page-header">
                    <h2><i class="fas fa-user-cog"></i> ${modeLabels[this.currentMode]}</h2>
                    <p>${this.getModeDescription()}</p>
                    <div class="mode-switcher" style="margin-top: 10px;">
                        <button class="btn btn-outline btn-sm" onclick="userModePage.showModeSelector()">
                            <i class="fas fa-exchange-alt"></i> 切换模式
                        </button>
                    </div>
                </div>

                ${this.renderModeContent()}
            </div>
        `;
    }

    // 获取模式描述
    getModeDescription() {
        const descriptions = {
            'student': '专为学生群体设计的智能财务管理',
            'family': '多人共同管理家庭财务',
            'freelancer': '为自由职业者定制的专业财务管理'
        };
        return descriptions[this.currentMode] || '';
    }

    // 渲染模式特定内容
    renderModeContent() {
        switch (this.currentMode) {
            case 'student':
                return this.renderStudentContent();
            case 'family':
                return this.renderFamilyContent();
            case 'freelancer':
                return this.renderFreelancerContent();
            default:
                return '<div class="card"><p>模式内容加载中...</p></div>';
        }
    }

    // 渲染学生模式内容
    renderStudentContent() {
        return `
            <!-- 生活费智能分配 -->
            <div class="card">
                <h3><i class="fas fa-chart-pie"></i> 生活费智能分配</h3>
                <div class="budget-setup" style="margin-bottom: 20px;">
                    <div class="input-group">
                        <label>每月生活费</label>
                        <input type="number" id="monthly-allowance" value="${this.settings.monthlyAllowance || ''}" placeholder="请输入金额">
                        <button class="btn btn-primary" onclick="userModePage.setupBudgetAllocation()">智能分配</button>
                    </div>
                </div>
                
                <div class="budget-allocation" id="budget-allocation">
                    ${this.renderBudgetAllocation()}
                </div>
            </div>

            <!-- 兼职收入管理 -->
            <div class="card">
                <h3><i class="fas fa-briefcase"></i> 兼职收入管理</h3>
                <div class="part-time-jobs">
                    ${this.renderPartTimeJobs()}
                </div>
                <div class="part-time-actions" style="margin-top: 15px;">
                    <button class="btn btn-primary" onclick="userModePage.showAddPartTimeJob()">
                        <i class="fas fa-plus"></i> 添加兼职收入
                    </button>
                </div>
            </div>

            <!-- 储蓄目标管理 -->
            <div class="card">
                <h3><i class="fas fa-piggy-bank"></i> 储蓄目标管理</h3>
                <div class="savings-goals">
                    ${this.renderSavingsGoals()}
                </div>
                <div class="savings-actions" style="margin-top: 15px;">
                    <button class="btn btn-primary" onclick="userModePage.showAddSavingsGoal()">
                        <i class="fas fa-plus"></i> 添加储蓄目标
                    </button>
                </div>
            </div>

            <!-- 学习支出记录 -->
            <div class="card">
                <h3><i class="fas fa-book"></i> 学习支出记录</h3>
                <div class="study-expenses">
                    ${this.renderStudyExpenses()}
                </div>
                <div class="study-actions" style="margin-top: 15px;">
                    <button class="btn btn-primary" onclick="userModePage.showRecordStudyExpense()">
                        <i class="fas fa-plus"></i> 记录学习支出
                    </button>
                </div>
            </div>
        `;
    }

    // 渲染家庭模式内容
    renderFamilyContent() {
        return `
            <!-- 家庭财务概览 -->
            <div class="card">
                <h3><i class="fas fa-chart-line"></i> 家庭财务概览</h3>
                <div class="family-overview">
                    <div class="overview-stats">
                        <div class="stat-card">
                            <div class="stat-value">¥${this.getFamilyBalance().toFixed(2)}</div>
                            <div class="stat-label">家庭总余额</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">¥${this.getTodayFamilyExpense().toFixed(2)}</div>
                            <div class="stat-label">今日共同支出</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">¥${this.getMonthlyFamilyIncome().toFixed(2)}</div>
                            <div class="stat-label">本月家庭收入</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">¥${this.getMonthlyFamilyExpense().toFixed(2)}</div>
                            <div class="stat-label">本月家庭支出</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 家庭成员管理 -->
            <div class="card">
                <h3><i class="fas fa-users"></i> 家庭成员管理</h3>
                <div class="family-members">
                    <div class="family-members-list" id="family-members-list">
                        ${this.renderFamilyMembers()}
                    </div>
                    
                    <div class="member-actions" style="margin-top: 15px;">
                        ${this.currentUser.role === 'admin' ? `
                            <button class="btn btn-primary" onclick="userModePage.showAddMember()">
                                <i class="fas fa-user-plus"></i> 邀请成员
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // 渲染自由职业模式内容
    renderFreelancerContent() {
        return `
            <!-- 项目收入管理 -->
            <div class="card">
                <h3><i class="fas fa-project-diagram"></i> 项目收入管理</h3>
                <div class="freelancer-projects">
                    ${this.renderFreelancerProjects()}
                </div>
                <div class="project-actions" style="margin-top: 15px;">
                    <button class="btn btn-primary" onclick="userModePage.showAddProject()">
                        <i class="fas fa-plus"></i> 添加项目
                    </button>
                </div>
            </div>

            <!-- 发票管理 -->
            <div class="card">
                <h3><i class="fas fa-file-invoice"></i> 发票管理</h3>
                <div class="freelancer-invoices">
                    ${this.renderFreelancerInvoices()}
                </div>
                <div class="invoice-actions" style="margin-top: 15px;">
                    <button class="btn btn-primary" onclick="userModePage.showAddInvoice()">
                        <i class="fas fa-plus"></i> 创建发票
                    </button>
                </div>
            </div>

            <!-- 业务支出管理 -->
            <div class="card">
                <h3><i class="fas fa-receipt"></i> 业务支出管理</h3>
                <div class="freelancer-expenses">
                    ${this.renderFreelancerExpenses()}
                </div>
                <div class="expense-actions" style="margin-top: 15px;">
                    <button class="btn btn-primary" onclick="userModePage.showAddExpense()">
                        <i class="fas fa-plus"></i> 记录支出
                    </button>
                </div>
            </div>
        `;
    }

    // 显示模式选择器
    showModeSelector() {
        const content = `
            <div style="padding: 20px;">
                <h4 style="margin-bottom: 20px;">选择用户模式</h4>
                <div class="mode-options">
                    <div class="mode-option ${this.currentMode === 'student' ? 'active' : ''}" onclick="userModePage.switchMode('student')">
                        <i class="fas fa-graduation-cap"></i>
                        <div>
                            <strong>学生模式</strong>
                            <p>专为学生群体设计的智能财务管理</p>
                        </div>
                    </div>
                    <div class="mode-option ${this.currentMode === 'family' ? 'active' : ''}" onclick="userModePage.switchMode('family')">
                        <i class="fas fa-home"></i>
                        <div>
                            <strong>家庭模式</strong>
                            <p>多人共同管理家庭财务</p>
                        </div>
                    </div>
                    <div class="mode-option ${this.currentMode === 'freelancer' ? 'active' : ''}" onclick="userModePage.switchMode('freelancer')">
                        <i class="fas fa-briefcase"></i>
                        <div>
                            <strong>自由职业</strong>
                            <p>为自由职业者定制的专业财务管理</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.app.showModal('选择用户模式', content);
    }

    // 切换用户模式
    switchMode(mode) {
        try {
            localStorage.setItem('user_mode', mode);
            this.currentMode = mode;
            this.loadUserModeData();
            
            // 更新页面显示
            const container = document.getElementById('page-container');
            if (container) {
                container.innerHTML = this.render();
                this.initEvents();
            }
            
            // 更新导航栏标签
            this.updateNavLabel();
            
            this.app.hideModal();
            this.app.showToast(`已切换到${this.getModeLabel(mode)}`);
        } catch (e) {
            console.error('切换用户模式失败:', e);
            this.app.showToast('切换模式失败，请重试', 'error');
        }
    }

    // 获取模式标签
    getModeLabel(mode) {
        const labels = {
            'student': '学生模式',
            'family': '家庭模式',
            'freelancer': '自由职业模式'
        };
        return labels[mode] || '用户模式';
    }

    // 更新导航栏标签
    updateNavLabel() {
        const navLabel = document.getElementById('user-mode-label');
        if (navLabel) {
            navLabel.textContent = this.getModeLabel(this.currentMode);
        }
    }

    // 学生模式功能方法
    setupBudgetAllocation() {
        try {
            const allowance = parseFloat(document.getElementById('monthly-allowance').value);
            if (!allowance || allowance <= 0) {
                this.app.showToast('请输入有效的金额', 'warning');
                return;
            }

            // 智能分配预算
            const budgetRatios = {
                food: 30,      // 餐饮
                study: 15,     // 学习用品
                entertainment: 20, // 娱乐社交
                emergency: 10,     // 应急储备
                free: 25       // 自由支配
            };

            const allocations = {};
            for (const [category, ratio] of Object.entries(budgetRatios)) {
                allocations[category] = Math.round(allowance * ratio / 100);
            }

            // 保存设置
            this.settings.monthlyAllowance = allowance;
            this.budgetAllocations = allocations;
            
            localStorage.setItem('student_mode_settings', JSON.stringify(this.settings));
            localStorage.setItem('student_budget_allocations', JSON.stringify(this.budgetAllocations));

            // 更新显示
            this.updateBudgetDisplay();
            this.app.showToast('预算分配完成');
        } catch (e) {
            console.error('智能分配预算失败:', e);
            this.app.showToast('分配失败，请重试', 'error');
        }
    }

    // 其他学生模式方法...
    renderBudgetAllocation() {
        if (!this.budgetAllocations || Object.keys(this.budgetAllocations).length === 0) {
            return '<div class="empty-state">请先设置每月生活费并进行智能分配</div>';
        }

        const total = this.settings.monthlyAllowance || 0;
        const categoryLabels = {
            food: '餐饮',
            study: '学习用品',
            entertainment: '娱乐社交',
            emergency: '应急储备',
            free: '自由支配'
        };

        return Object.entries(this.budgetAllocations)
            .map(([category, amount]) => {
                const percentage = total > 0 ? (amount / total * 100).toFixed(1) : 0;
                return `
                    <div class="budget-item">
                        <div class="budget-category">${categoryLabels[category] || category}</div>
                        <div class="budget-amount">¥${amount.toFixed(2)}</div>
                        <div class="budget-percentage">${percentage}%</div>
                    </div>
                `;
            }).join('');
    }

    showAddPartTimeJob() {
        const content = `
            <div style="padding: 20px;">
                <div class="input-group">
                    <label>工作名称</label>
                    <input type="text" id="job-name" placeholder="例如：家教、兼职销售">
                </div>
                <div class="input-group">
                    <label>时薪/收入</label>
                    <input type="number" id="job-income" placeholder="请输入金额">
                </div>
                <div class="input-group">
                    <label>工作时间</label>
                    <input type="text" id="job-hours" placeholder="例如：每周10小时">
                </div>
                <div class="modal-actions" style="margin-top: 20px;">
                    <button class="btn btn-primary" onclick="userModePage.addPartTimeJob()">添加</button>
                    <button class="btn btn-secondary" onclick="userModePage.app.hideModal()">取消</button>
                </div>
            </div>
        `;
        this.app.showModal('添加兼职收入', content);
    }

    addPartTimeJob() {
        try {
            const name = document.getElementById('job-name').value;
            const income = parseFloat(document.getElementById('job-income').value);
            const hours = document.getElementById('job-hours').value;

            if (!name || !income || !hours) {
                this.app.showToast('请填写完整信息', 'warning');
                return;
            }

            const job = {
                id: Date.now(),
                name,
                income,
                hours,
                createdAt: new Date().toISOString()
            };

            this.partTimeJobs.push(job);
            localStorage.setItem('student_part_time_jobs', JSON.stringify(this.partTimeJobs));

            this.app.hideModal();
            this.app.showToast('兼职收入添加成功');
            this.updatePartTimeJobsDisplay();
        } catch (e) {
            console.error('添加兼职收入失败:', e);
            this.app.showToast('添加失败，请重试', 'error');
        }
    }

    showAddSavingsGoal() {
        const content = `
            <div style="padding: 20px;">
                <div class="input-group">
                    <label>目标名称</label>
                    <input type="text" id="goal-name" placeholder="例如：购买新电脑">
                </div>
                <div class="input-group">
                    <label>目标金额</label>
                    <input type="number" id="goal-amount" placeholder="请输入金额">
                </div>
                <div class="input-group">
                    <label>截止日期</label>
                    <input type="date" id="goal-deadline">
                </div>
                <div class="modal-actions" style="margin-top: 20px;">
                    <button class="btn btn-primary" onclick="userModePage.addSavingsGoal()">添加</button>
                    <button class="btn btn-secondary" onclick="userModePage.app.hideModal()">取消</button>
                </div>
            </div>
        `;
        this.app.showModal('添加储蓄目标', content);
    }

    addSavingsGoal() {
        try {
            const name = document.getElementById('goal-name').value;
            const amount = parseFloat(document.getElementById('goal-amount').value);
            const deadline = document.getElementById('goal-deadline').value;

            if (!name || !amount || !deadline) {
                this.app.showToast('请填写完整信息', 'warning');
                return;
            }

            const goal = {
                id: Date.now(),
                name,
                targetAmount: amount,
                currentAmount: 0,
                deadline,
                createdAt: new Date().toISOString(),
                completed: false
            };

            this.examGoals.push(goal);
            localStorage.setItem('student_exam_goals', JSON.stringify(this.examGoals));

            this.app.hideModal();
            this.app.showToast('储蓄目标添加成功');
            this.updateSavingsGoalsDisplay();
        } catch (e) {
            console.error('添加储蓄目标失败:', e);
            this.app.showToast('添加失败，请重试', 'error');
        }
    }

    showRecordStudyExpense() {
        const content = `
            <div style="padding: 20px;">
                <div class="input-group">
                    <label>支出项目</label>
                    <input type="text" id="expense-item" placeholder="例如：购买教材、报名费">
                </div>
                <div class="input-group">
                    <label>支出金额</label>
                    <input type="number" id="expense-amount" placeholder="请输入金额">
                </div>
                <div class="input-group">
                    <label>支出日期</label>
                    <input type="date" id="expense-date" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="modal-actions" style="margin-top: 20px;">
                    <button class="btn btn-primary" onclick="userModePage.recordStudyExpense()">记录</button>
                    <button class="btn btn-secondary" onclick="userModePage.app.hideModal()">取消</button>
                </div>
            </div>
        `;
        this.app.showModal('记录学习支出', content);
    }

    recordStudyExpense() {
        try {
            const item = document.getElementById('expense-item').value;
            const amount = parseFloat(document.getElementById('expense-amount').value);
            const date = document.getElementById('expense-date').value;

            if (!item || !amount || !date) {
                this.app.showToast('请填写完整信息', 'warning');
                return;
            }

            // 添加到通用交易记录
            const transaction = {
                id: Date.now(),
                type: 'expense',
                category: '学习支出',
                amount,
                description: item,
                date,
                createdAt: new Date().toISOString(),
                mode: 'student'
            };

            this.transactions.push(transaction);
            localStorage.setItem('transactions', JSON.stringify(this.transactions));

            this.app.hideModal();
            this.app.showToast('学习支出记录成功');
            this.updateStudyExpensesDisplay();
        } catch (e) {
            console.error('记录学习支出失败:', e);
            this.app.showToast('记录失败，请重试', 'error');
        }
    }

    // 更新显示方法
    updateBudgetDisplay() {
        const container = document.getElementById('budget-allocation');
        if (container) {
            container.innerHTML = this.renderBudgetAllocation();
        }
    }

    updatePartTimeJobsDisplay() {
        const container = document.querySelector('.part-time-jobs');
        if (container) {
            container.innerHTML = this.renderPartTimeJobs();
        }
    }

    updateSavingsGoalsDisplay() {
        const container = document.querySelector('.savings-goals');
        if (container) {
            container.innerHTML = this.renderSavingsGoals();
        }
    }

    updateStudyExpensesDisplay() {
        const container = document.querySelector('.study-expenses');
        if (container) {
            container.innerHTML = this.renderStudyExpenses();
        }
    }

    // 渲染方法
    renderPartTimeJobs() {
        if (this.partTimeJobs.length === 0) {
            return '<div class="empty-state">暂无兼职收入记录</div>';
        }

        return this.partTimeJobs.map(job => `
            <div class="job-item">
                <div class="job-info">
                    <div class="job-name">${job.name}</div>
                    <div class="job-details">
                        <span>时薪: ¥${job.income.toFixed(2)}</span>
                        <span>工作时间: ${job.hours}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderSavingsGoals() {
        if (this.examGoals.length === 0) {
            return '<div class="empty-state">暂无储蓄目标</div>';
        }

        return this.examGoals.map(goal => `
            <div class="goal-item">
                <div class="goal-info">
                    <div class="goal-name">${goal.name}</div>
                    <div class="goal-progress">
                        <div class="progress-bar">
                            <div class="progress" style="width: ${(goal.currentAmount / goal.targetAmount * 100).toFixed(1)}%"></div>
                        </div>
                        <div class="goal-amount">¥${goal.currentAmount.toFixed(2)} / ¥${goal.targetAmount.toFixed(2)}</div>
                    </div>
                    <div class="goal-deadline">截止: ${goal.deadline}</div>
                </div>
            </div>
        `).join('');
    }

    renderStudyExpenses() {
        const studyExpenses = this.transactions.filter(t => t.mode === 'student' && t.category === '学习支出');
        if (studyExpenses.length === 0) {
            return '<div class="empty-state">暂无学习支出记录</div>';
        }

        return studyExpenses.map(expense => `
            <div class="expense-item">
                <div class="expense-info">
                    <div class="expense-description">${expense.description}</div>
                    <div class="expense-details">
                        <span class="expense-amount">-¥${expense.amount.toFixed(2)}</span>
                        <span class="expense-date">${expense.date}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 家庭模式方法
    getFamilyBalance() {
        const totalIncome = this.familyTransactions
            .filter(t => t.category === '收入')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = this.familyTransactions
            .filter(t => t.category === '支出')
            .reduce((sum, t) => sum + t.amount, 0);
        return totalIncome - totalExpense;
    }

    getTodayFamilyExpense() {
        const today = new Date().toDateString();
        return this.familyTransactions
            .filter(t => t.category === '支出' && new Date(t.date).toDateString() === today)
            .reduce((sum, t) => sum + t.amount, 0);
    }

    getMonthlyFamilyIncome() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return this.familyTransactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.category === '收入' && 
                       tDate.getMonth() === currentMonth && 
                       tDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);
    }

    getMonthlyFamilyExpense() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return this.familyTransactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.category === '支出' && 
                       tDate.getMonth() === currentMonth && 
                       tDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);
    }

    renderFamilyMembers() {
        if (this.familyMembers.length === 0) {
            return '<div class="empty-state">暂无家庭成员</div>';
        }

        return this.familyMembers.map(member => `
            <div class="member-item">
                <div class="member-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="member-details">
                    <div class="member-name">${member.name}</div>
                    <div class="member-role">${this.getRoleText(member.role)}</div>
                    <div class="member-stats">
                        <span>本月支出: ¥${this.getMemberMonthlyExpense(member.id).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getRoleText(role) {
        const roleMap = {
            'admin': '管理员',
            'member': '普通成员',
            'child': '儿童'
        };
        return roleMap[role] || role;
    }

    getMemberMonthlyExpense(memberId) {
        const currentMonth = new Date().getMonth();
        return this.familyTransactions
            .filter(t => t.memberId === memberId && 
                        new Date(t.date).getMonth() === currentMonth)
            .reduce((sum, t) => sum + t.amount, 0);
    }

    showAddMember() {
        const content = `
            <div style="padding: 20px;">
                <div class="input-group">
                    <label>成员姓名</label>
                    <input type="text" id="member-name" placeholder="请输入成员姓名">
                </div>
                <div class="input-group">
                    <label>成员角色</label>
                    <select id="member-role">
                        <option value="member">普通成员</option>
                        <option value="child">儿童</option>
                    </select>
                </div>
                <div class="modal-actions" style="margin-top: 20px;">
                    <button class="btn btn-primary" onclick="userModePage.addFamilyMember()">添加</button>
                    <button class="btn btn-secondary" onclick="userModePage.app.hideModal()">取消</button>
                </div>
            </div>
        `;
        this.app.showModal('添加家庭成员', content);
    }

    addFamilyMember() {
        try {
            const name = document.getElementById('member-name').value;
            const role = document.getElementById('member-role').value;

            if (!name) {
                this.app.showToast('请输入成员姓名', 'warning');
                return;
            }

            const member = {
                id: Date.now().toString(),
                name,
                role,
                joinedAt: new Date().toISOString()
            };

            this.familyMembers.push(member);
            localStorage.setItem('family_members', JSON.stringify(this.familyMembers));

            this.app.hideModal();
            this.app.showToast('家庭成员添加成功');
            this.updateFamilyMembersDisplay();
        } catch (e) {
            console.error('添加家庭成员失败:', e);
            this.app.showToast('添加失败，请重试', 'error');
        }
    }

    updateFamilyMembersDisplay() {
        const container = document.getElementById('family-members-list');
        if (container) {
            container.innerHTML = this.renderFamilyMembers();
        }
    }

    // 自由职业模式方法（简化版）
    renderFreelancerProjects() {
        if (this.projects.length === 0) {
            return '<div class="empty-state">暂无项目记录</div>';
        }

        return this.projects.map(project => `
            <div class="project-item">
                <div class="project-info">
                    <div class="project-name">${project.name}</div>
                    <div class="project-details">
                        <span>预算: ¥${project.budget.toFixed(2)}</span>
                        <span>状态: ${project.status}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderFreelancerInvoices() {
        if (this.invoices.length === 0) {
            return '<div class="empty-state">暂无发票记录</div>';
        }

        return this.invoices.map(invoice => `
            <div class="invoice-item">
                <div class="invoice-info">
                    <div class="invoice-number">${invoice.number}</div>
                    <div class="invoice-details">
                        <span>金额: ¥${invoice.amount.toFixed(2)}</span>
                        <span>状态: ${invoice.status}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderFreelancerExpenses() {
        if (this.expenses.length === 0) {
            return '<div class="empty-state">暂无业务支出记录</div>';
        }

        return this.expenses.map(expense => `
            <div class="expense-item">
                <div class="expense-info">
                    <div class="expense-description">${expense.description}</div>
                    <div class="expense-details">
                        <span class="expense-amount">-¥${expense.amount.toFixed(2)}</span>
                        <span class="expense-date">${expense.date}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 初始化事件（供路由调用）
    initEvents() {
        // 设置全局变量
        window.userModePage = this;
        
        // 加载用户模式数据
        this.loadUserModeData();
        
        // 更新导航栏标签
        this.updateNavLabel();
        
        console.log('用户模式页面事件初始化完成');
    }
}

// 创建全局用户模式页面实例
const userModePage = new UserModePage(window.app || {});