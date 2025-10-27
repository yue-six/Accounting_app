class StudentModePage {
    constructor(app) {
        this.app = app;
        this.currentModal = null;
        this.budgetRatios = {
            food: 30,      // 餐饮
            study: 15,     // 学习用品
            entertainment: 20, // 娱乐社交
            emergency: 10,     // 应急储备
            free: 25       // 自由支配
        };
        this.loadStudentData();
    }

    // 加载学生模式数据
    loadStudentData() {
        try {
            this.settings = JSON.parse(localStorage.getItem('student_mode_settings') || '{}');
            this.partTimeJobs = JSON.parse(localStorage.getItem('student_part_time_jobs') || '[]');
            this.examGoals = JSON.parse(localStorage.getItem('student_exam_goals') || '[]');
            this.budgetAllocations = JSON.parse(localStorage.getItem('student_budget_allocations') || '{}');
        } catch (e) {
            console.error('加载学生模式数据失败:', e);
        }
    }

    // 渲染页面
    render() {
        return `
            <div class="page active student-mode-page" id="student-mode-page">
                <div class="page-header">
                    <h2><i class="fas fa-graduation-cap"></i> 学生模式</h2>
                    <p>专为学生群体设计的智能财务管理</p>
                </div>

                <!-- 生活费智能分配 -->
                <div class="card">
                    <h3><i class="fas fa-chart-pie"></i> 生活费智能分配</h3>
                    <div class="budget-setup" style="margin-bottom: 20px;">
                        <div class="input-group">
                            <label>每月生活费</label>
                            <input type="number" id="monthly-allowance" value="${this.settings.monthlyAllowance || ''}" placeholder="请输入金额">
                            <button class="btn btn-primary" onclick="studentModePage.setupBudgetAllocation()">智能分配</button>
                        </div>
                    </div>
                    
                    <div class="budget-allocation" id="budget-allocation">
                        ${this.renderBudgetAllocation()}
                    </div>
                </div>

                <!-- 兼职收入管理 -->
                <div class="card">
                    <h3><i class="fas fa-briefcase"></i> 兼职收入管理</h3>
                    <div class="part-time-summary">
                        <div class="summary-stats">
                            <div class="stat-item">
                                <div class="stat-value">¥${this.getMonthlyPartTimeIncome()}</div>
                                <div class="stat-label">本月兼职收入</div>
                            </div>
                        </div>
                    </div>
                    <div class="part-time-actions" style="margin-top: 15px;">
                        <button class="btn btn-primary" onclick="studentModePage.showAddPartTimeJob()">
                            <i class="fas fa-plus"></i> 添加兼职收入
                        </button>
                    </div>
                </div>

                <!-- 考证/学费储蓄计划 -->
                <div class="card">
                    <h3><i class="fas fa-certificate"></i> 考证/学费储蓄计划</h3>
                    
                    <!-- 储蓄概览 -->
                    <div class="savings-overview">
                        <div class="overview-stats">
                            <div class="stat-item">
                                <span class="stat-label">活跃目标</span>
                                <span class="stat-value">${this.getActiveGoalsCount()}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">总储蓄</span>
                                <span class="stat-value">¥${this.getTotalSavings().toFixed(2)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">平均进度</span>
                                <span class="stat-value">${this.getAverageProgress().toFixed(1)}%</span>
                            </div>
                        </div>
                        
                        <!-- 储蓄建议 -->
                        <div class="savings-suggestions">
                            <h4><i class="fas fa-lightbulb"></i> 智能建议</h4>
                            <div class="suggestion-list">
                                ${this.getSavingsRecommendations().map(rec => `
                                    <div class="suggestion-item ${rec.priority}">
                                        <i class="fas ${rec.icon}"></i>
                                        <span>${rec.message}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="savings-actions" style="margin-top: 15px;">
                        <button class="btn btn-primary" onclick="studentModePage.showAddSavingsGoal()">
                            <i class="fas fa-plus"></i> 添加储蓄目标
                        </button>
                    </div>
                </div>

                <!-- 学习用品预算 -->
                <div class="card">
                    <h3><i class="fas fa-book"></i> 学习用品预算</h3>
                    <div class="study-budget">
                        <div class="budget-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${this.getStudyBudgetProgress()}%"></div>
                            </div>
                            <div class="progress-text">
                                <span>已使用: ¥${this.getStudyBudgetUsed()}</span>
                                <span>剩余: ¥${this.getStudyBudgetRemaining()}</span>
                            </div>
                        </div>
                        <button class="btn btn-secondary" onclick="studentModePage.showStudyExpenseModal()">
                            <i class="fas fa-edit"></i> 记录学习支出
                        </button>
                    </div>
                </div>

                <!-- 智能提醒 -->
                <div class="card">
                    <h3><i class="fas fa-bell"></i> 智能提醒</h3>
                    <div class="reminders">
                        ${this.getActiveReminders().map(reminder => `
                            <div class="reminder-item ${reminder.type}">
                                <i class="fas ${reminder.icon}"></i>
                                <div class="reminder-content">
                                    <div class="reminder-title">${reminder.title}</div>
                                    <div class="reminder-desc">${reminder.description}</div>
                                </div>
                                <div class="reminder-time">${reminder.time}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // 智能分配预算
    setupBudgetAllocation() {
        const allowance = parseFloat(document.getElementById('monthly-allowance').value);
        if (!allowance || allowance <= 0) {
            this.app.showToast('请输入有效的每月生活费金额');
            return;
        }

        this.budgetAllocations = {
            food: Math.round(allowance * this.budgetRatios.food / 100),
            study: Math.round(allowance * this.budgetRatios.study / 100),
            entertainment: Math.round(allowance * this.budgetRatios.entertainment / 100),
            emergency: Math.round(allowance * this.budgetRatios.emergency / 100),
            free: Math.round(allowance * this.budgetRatios.free / 100)
        };

        this.saveStudentData();
        this.updateBudgetDisplay();
        this.app.showToast('预算分配完成！');
    }

    // 渲染预算分配
    renderBudgetAllocation() {
        if (Object.keys(this.budgetAllocations).length === 0) {
            return '<p style="color: #666; text-align: center;">请先设置每月生活费并点击智能分配</p>';
        }

        return Object.entries(this.budgetAllocations).map(([category, amount]) => `
            <div class="budget-item">
                <div class="budget-category">${this.getCategoryName(category)}</div>
                <div class="budget-amount">¥${amount}</div>
                <div class="budget-percentage">${this.budgetRatios[category]}%</div>
            </div>
        `).join('');
    }

    // 获取分类名称
    getCategoryName(category) {
        const names = {
            food: '餐饮',
            study: '学习用品',
            entertainment: '娱乐社交',
            emergency: '应急储备',
            free: '自由支配'
        };
        return names[category] || category;
    }

    // 获取本月兼职收入
    getMonthlyPartTimeIncome() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return this.partTimeJobs
            .filter(job => {
                const jobDate = new Date(job.date);
                return jobDate.getMonth() === currentMonth && jobDate.getFullYear() === currentYear;
            })
            .reduce((sum, job) => sum + job.amount, 0);
    }

    // 显示添加兼职收入模态框
    showAddPartTimeJob() {
        this.app.showModal('添加兼职收入', `
            <div style="padding: 20px;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">工作名称</label>
                    <input type="text" id="job-name" placeholder="例如：家教、餐厅服务员" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">收入金额</label>
                    <input type="number" id="job-amount" placeholder="请输入金额" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">工作日期</label>
                    <input type="date" id="job-date" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">工作描述</label>
                    <textarea id="job-description" placeholder="工作内容和经验" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; height: 80px;"></textarea>
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" style="flex: 1;" onclick="studentModePage.savePartTimeJob()">保存</button>
                    <button class="btn btn-secondary" style="flex: 1;" onclick="studentModePage.hideModal()">取消</button>
                </div>
            </div>
        `);
    }

    // 保存兼职收入
    savePartTimeJob() {
        const name = document.getElementById('job-name').value;
        const amount = parseFloat(document.getElementById('job-amount').value);
        const date = document.getElementById('job-date').value;
        const description = document.getElementById('job-description').value;

        if (!name || !amount || !date) {
            this.app.showToast('请填写完整信息');
            return;
        }

        const job = {
            id: Date.now(),
            name,
            amount,
            date,
            description,
            createdAt: new Date().toISOString()
        };

        this.partTimeJobs.push(job);
        this.saveStudentData();
        this.app.hideModal();
        this.app.showToast('兼职收入已保存');
        
        // 重新渲染页面
        this.render();
    }

    // 获取活跃目标数量
    getActiveGoalsCount() {
        return this.examGoals.filter(goal => !goal.completed).length;
    }

    // 获取总储蓄金额
    getTotalSavings() {
        return this.examGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    }

    // 获取平均进度
    getAverageProgress() {
        if (this.examGoals.length === 0) return 0;
        return this.examGoals.reduce((sum, goal) => sum + goal.progress, 0) / this.examGoals.length;
    }

    // 获取储蓄建议
    getSavingsRecommendations() {
        const recommendations = [];
        
        if (this.getActiveGoalsCount() === 0) {
            recommendations.push({
                message: '建议设置一个考证或学费储蓄目标',
                icon: 'fa-bullseye',
                priority: 'high'
            });
        }

        if (this.getMonthlyPartTimeIncome() < 1000) {
            recommendations.push({
                message: '可以考虑增加兼职收入来加快储蓄进度',
                icon: 'fa-briefcase',
                priority: 'medium'
            });
        }

        if (this.getStudyBudgetProgress() > 80) {
            recommendations.push({
                message: '学习用品预算即将用完，请注意控制支出',
                icon: 'fa-exclamation-triangle',
                priority: 'high'
            });
        }

        return recommendations;
    }

    // 显示添加储蓄目标模态框
    showAddSavingsGoal() {
        this.app.showModal('添加储蓄目标', `
            <div style="padding: 20px;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">目标名称</label>
                    <input type="text" id="goal-name" placeholder="例如：英语四级考试费、下学期学费" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">目标金额</label>
                    <input type="number" id="goal-amount" placeholder="请输入金额" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">截止日期</label>
                    <input type="date" id="goal-deadline" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">目标描述</label>
                    <textarea id="goal-description" placeholder="目标的重要性和计划" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; height: 80px;"></textarea>
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" style="flex: 1;" onclick="studentModePage.saveSavingsGoal()">保存</button>
                    <button class="btn btn-secondary" style="flex: 1;" onclick="studentModePage.hideModal()">取消</button>
                </div>
            </div>
        `);
    }

    // 保存储蓄目标
    saveSavingsGoal() {
        const name = document.getElementById('goal-name').value;
        const amount = parseFloat(document.getElementById('goal-amount').value);
        const deadline = document.getElementById('goal-deadline').value;
        const description = document.getElementById('goal-description').value;

        if (!name || !amount || !deadline) {
            this.app.showToast('请填写完整信息');
            return;
        }

        const goal = {
            id: Date.now(),
            name,
            targetAmount: amount,
            currentAmount: 0,
            deadline,
            description,
            completed: false,
            progress: 0,
            createdAt: new Date().toISOString()
        };

        this.examGoals.push(goal);
        this.saveStudentData();
        this.app.hideModal();
        this.app.showToast('储蓄目标已保存');
        
        // 重新渲染页面
        this.render();
    }

    // 获取学习用品预算进度
    getStudyBudgetProgress() {
        const budget = this.budgetAllocations.study || 0;
        if (budget === 0) return 0;
        
        const used = this.getStudyBudgetUsed();
        return Math.min((used / budget) * 100, 100);
    }

    // 获取学习用品预算已使用金额
    getStudyBudgetUsed() {
        // 这里应该从交易记录中统计学习用品支出
        // 暂时返回模拟数据
        return 150;
    }

    // 获取学习用品预算剩余金额
    getStudyBudgetRemaining() {
        const budget = this.budgetAllocations.study || 0;
        const used = this.getStudyBudgetUsed();
        return Math.max(budget - used, 0);
    }

    // 显示学习支出模态框
    showStudyExpenseModal() {
        this.app.showModal('记录学习支出', `
            <div style="padding: 20px;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">支出项目</label>
                    <select id="expense-type" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                        <option value="books">教材书籍</option>
                        <option value="stationery">文具用品</option>
                        <option value="courses">课程培训</option>
                        <option value="exams">考试费用</option>
                        <option value="other">其他</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">支出金额</label>
                    <input type="number" id="expense-amount" placeholder="请输入金额" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">支出日期</label>
                    <input type="date" id="expense-date" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">支出描述</label>
                    <textarea id="expense-description" placeholder="支出详情" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; height: 80px;"></textarea>
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" style="flex: 1;" onclick="studentModePage.saveStudyExpense()">保存</button>
                    <button class="btn btn-secondary" style="flex: 1;" onclick="studentModePage.hideModal()">取消</button>
                </div>
            </div>
        `);
    }

    // 保存学习支出
    saveStudyExpense() {
        const type = document.getElementById('expense-type').value;
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const date = document.getElementById('expense-date').value;
        const description = document.getElementById('expense-description').value;

        if (!amount || !date) {
            this.app.showToast('请填写完整信息');
            return;
        }

        // 这里应该保存到交易记录中
        this.app.showToast('学习支出已记录');
        this.app.hideModal();
    }

    // 获取活跃提醒
    getActiveReminders() {
        const reminders = [];
        
        // 预算提醒
        if (this.getStudyBudgetProgress() > 80) {
            reminders.push({
                title: '学习用品预算提醒',
                description: '学习用品预算即将用完，请注意控制支出',
                type: 'warning',
                icon: 'fa-exclamation-triangle',
                time: '今天'
            });
        }

        // 储蓄目标提醒
        this.examGoals.forEach(goal => {
            if (!goal.completed && goal.progress < 50) {
                const daysLeft = this.getDaysLeft(goal.deadline);
                if (daysLeft < 30) {
                    reminders.push({
                        title: '储蓄目标提醒',
                        description: `"${goal.name}" 还有 ${daysLeft} 天到期，进度 ${goal.progress}%`,
                        type: 'info',
                        icon: 'fa-bullseye',
                        time: `${daysLeft}天后`
                    });
                }
            }
        });

        return reminders;
    }

    // 获取剩余天数
    getDaysLeft(deadline) {
        const today = new Date();
        const targetDate = new Date(deadline);
        const diffTime = targetDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // 保存学生数据
    saveStudentData() {
        try {
            localStorage.setItem('student_mode_settings', JSON.stringify(this.settings));
            localStorage.setItem('student_part_time_jobs', JSON.stringify(this.partTimeJobs));
            localStorage.setItem('student_exam_goals', JSON.stringify(this.examGoals));
            localStorage.setItem('student_budget_allocations', JSON.stringify(this.budgetAllocations));
        } catch (e) {
            console.error('保存学生数据失败:', e);
        }
    }

    // 隐藏模态框
    hideModal() {
        this.app.hideModal();
    }

    // 更新预算显示
    updateBudgetDisplay() {
        const container = document.getElementById('budget-allocation');
        if (container) {
            container.innerHTML = this.renderBudgetAllocation();
        }
    }

    // 初始化事件（供路由调用）
    initEvents() {
        // 设置全局变量
        window.studentModePage = this;
        
        // 加载学生数据
        this.loadStudentData();
        
        console.log('学生模式页面事件初始化完成');
    }
}

// 创建全局学生模式页面实例
const studentModePage = new StudentModePage(window.app || {});