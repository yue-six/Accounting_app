class SavingsGoalsPage {
    constructor() {
        this.savingsGoals = [];
        this.savingsSettings = {
            autoDeduction: false,
            deductionDay: 1,
            reminderEnabled: true,
            achievementNotifications: true
        };
        this.goalTemplates = this.initializeTemplates();
        this.loadSavingsData();
    }

    // 初始化场景化模板
    initializeTemplates() {
        return {
            emergency: {
                name: '应急基金',
                description: '建立3-6个月生活费的应急储备',
                icon: 'shield-alt',
                color: '#e74c3c',
                suggestedAmount: 30000,
                duration: 12,
                tips: [
                    '应急基金应存放在流动性好的账户中',
                    '建议金额为3-6个月的生活开支',
                    '优先级最高，应首先建立'
                ]
            },
            house: {
                name: '购房基金',
                description: '为购买房产积累首付资金',
                icon: 'home',
                color: '#3498db',
                suggestedAmount: 200000,
                duration: 36,
                tips: [
                    '首付比例通常为房价的20-30%',
                    '还需考虑装修、税费等额外支出',
                    '可考虑定期存款或理财产品'
                ]
            },
            car: {
                name: '购车基金',
                description: '为购买汽车准备资金',
                icon: 'car',
                color: '#9b59b6',
                suggestedAmount: 100000,
                duration: 24,
                tips: [
                    '除车价外还需考虑保险、上牌等费用',
                    '建议选择保值率较高的车型',
                    '可考虑新车或二手车的不同需求'
                ]
            },
            education: {
                name: '教育基金',
                description: '为子女教育或自我提升储备资金',
                icon: 'graduation-cap',
                color: '#f39c12',
                suggestedAmount: 50000,
                duration: 60,
                tips: [
                    '教育投资回报率通常很高',
                    '可考虑教育保险或基金定投',
                    '越早开始越能发挥复利效应'
                ]
            },
            travel: {
                name: '旅行基金',
                description: '为梦想旅行积累资金',
                icon: 'plane',
                color: '#1abc9c',
                suggestedAmount: 20000,
                duration: 12,
                tips: [
                    '提前规划可以获得更好的价格',
                    '可关注航空公司和酒店的促销活动',
                    '建议购买旅行保险'
                ]
            },
            retirement: {
                name: '养老基金',
                description: '为退休后的生活质量做准备',
                icon: 'user-clock',
                color: '#34495e',
                suggestedAmount: 500000,
                duration: 240,
                tips: [
                    '越早开始养老储蓄越轻松',
                    '可考虑养老保险和基金定投',
                    '建议占收入的10-15%'
                ]
            },
            wedding: {
                name: '婚礼基金',
                description: '为人生重要时刻准备充足资金',
                icon: 'heart',
                color: '#e91e63',
                suggestedAmount: 80000,
                duration: 18,
                tips: [
                    '婚礼预算通常会超出预期',
                    '建议预留20%的缓冲资金',
                    '可考虑分期付款的服务商'
                ]
            },
            business: {
                name: '创业基金',
                description: '为创业梦想积累启动资金',
                icon: 'rocket',
                color: '#ff6b6b',
                suggestedAmount: 150000,
                duration: 30,
                tips: [
                    '创业资金需求通常较大',
                    '建议准备6-12个月的运营资金',
                    '可考虑寻找投资伙伴'
                ]
            }
        };
    }

    // 加载储蓄数据
    loadSavingsData() {
        const savedGoals = localStorage.getItem('savings_goals');
        const savedSettings = localStorage.getItem('savings_settings');
        
        if (savedGoals) {
            this.savingsGoals = JSON.parse(savedGoals);
        }
        
        if (savedSettings) {
            this.savingsSettings = { ...this.savingsSettings, ...JSON.parse(savedSettings) };
        }
    }

    // 保存储蓄数据
    saveSavingsData() {
        localStorage.setItem('savings_goals', JSON.stringify(this.savingsGoals));
        localStorage.setItem('savings_settings', JSON.stringify(this.savingsSettings));
    }

    // 渲染页面
    render() {
        return `
            <div class="savings-goals-page">
                <div class="page-header">
                    <h2><i class="fas fa-piggy-bank"></i> 储蓄目标</h2>
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="savingsGoalsPage.showCreateGoal()">
                            <i class="fas fa-plus"></i> 新建目标
                        </button>
                        <button class="btn btn-secondary" onclick="savingsGoalsPage.showSettings()">
                            <i class="fas fa-cog"></i> 设置
                        </button>
                    </div>
                </div>

                <!-- 储蓄概览 -->
                <div class="savings-overview">
                    <div class="overview-cards">
                        <div class="overview-card">
                            <div class="card-icon">
                                <i class="fas fa-target"></i>
                            </div>
                            <div class="card-content">
                                <div class="card-title">活跃目标</div>
                                <div class="card-value">${this.getActiveGoalsCount()}</div>
                                <div class="card-subtitle">个目标进行中</div>
                            </div>
                        </div>
                        <div class="overview-card">
                            <div class="card-icon">
                                <i class="fas fa-coins"></i>
                            </div>
                            <div class="card-content">
                                <div class="card-title">总储蓄金额</div>
                                <div class="card-value">¥${this.getTotalSavings().toLocaleString()}</div>
                                <div class="card-subtitle">已储蓄金额</div>
                            </div>
                        </div>
                        <div class="overview-card">
                            <div class="card-icon">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div class="card-content">
                                <div class="card-title">平均进度</div>
                                <div class="card-value">${this.getAverageProgress().toFixed(1)}%</div>
                                <div class="card-subtitle">目标完成度</div>
                            </div>
                        </div>
                        <div class="overview-card">
                            <div class="card-icon">
                                <i class="fas fa-trophy"></i>
                            </div>
                            <div class="card-content">
                                <div class="card-title">已完成</div>
                                <div class="card-value">${this.getCompletedGoalsCount()}</div>
                                <div class="card-subtitle">个目标达成</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 智能建议 -->
                <div class="smart-suggestions">
                    <h3><i class="fas fa-lightbulb"></i> 智能建议</h3>
                    <div class="suggestions-container">
                        ${this.renderSmartSuggestions()}
                    </div>
                </div>

                <!-- 储蓄目标列表 -->
                <div class="goals-section">
                    <div class="section-header">
                        <h3><i class="fas fa-list"></i> 我的储蓄目标</h3>
                        <div class="filter-tabs">
                            <button class="tab-btn active" onclick="savingsGoalsPage.filterGoals('all')">全部</button>
                            <button class="tab-btn" onclick="savingsGoalsPage.filterGoals('active')">进行中</button>
                            <button class="tab-btn" onclick="savingsGoalsPage.filterGoals('completed')">已完成</button>
                            <button class="tab-btn" onclick="savingsGoalsPage.filterGoals('paused')">已暂停</button>
                        </div>
                    </div>
                    <div class="goals-list" id="goals-list">
                        ${this.renderGoalsList()}
                    </div>
                </div>

                <!-- 成就系统 -->
                <div class="achievements-section">
                    <h3><i class="fas fa-medal"></i> 储蓄成就</h3>
                    <div class="achievements-grid">
                        ${this.renderAchievements()}
                    </div>
                </div>
            </div>
        `;
    }

    // 渲染智能建议
    renderSmartSuggestions() {
        const suggestions = this.getSmartSuggestions();
        
        if (suggestions.length === 0) {
            return '<div class="no-suggestions">暂无建议，您的储蓄计划很棒！</div>';
        }
        
        return suggestions.map(suggestion => `
            <div class="suggestion-card ${suggestion.type}">
                <div class="suggestion-icon">
                    <i class="fas fa-${suggestion.icon}"></i>
                </div>
                <div class="suggestion-content">
                    <div class="suggestion-title">${suggestion.title}</div>
                    <div class="suggestion-desc">${suggestion.description}</div>
                    ${suggestion.action ? `
                        <button class="suggestion-action" onclick="${suggestion.action}">
                            ${suggestion.actionText}
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // 渲染目标列表
    renderGoalsList() {
        if (this.savingsGoals.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-piggy-bank"></i>
                    <h4>还没有储蓄目标</h4>
                    <p>创建您的第一个储蓄目标，开始理财之旅</p>
                    <button class="btn btn-primary" onclick="savingsGoalsPage.showCreateGoal()">
                        创建目标
                    </button>
                </div>
            `;
        }
        
        return this.savingsGoals.map(goal => this.renderGoalCard(goal)).join('');
    }

    // 渲染单个目标卡片
    renderGoalCard(goal) {
        const progress = this.calculateProgress(goal);
        const remainingDays = this.getRemainingDays(goal);
        const monthlyTarget = this.getMonthlyTarget(goal);
        
        return `
            <div class="goal-card ${goal.status}" data-goal-id="${goal.id}">
                <div class="goal-header">
                    <div class="goal-icon" style="background-color: ${goal.color}">
                        <i class="fas fa-${goal.icon}"></i>
                    </div>
                    <div class="goal-info">
                        <h4 class="goal-name">${goal.name}</h4>
                        <p class="goal-description">${goal.description}</p>
                    </div>
                    <div class="goal-actions">
                        <button class="action-btn" onclick="savingsGoalsPage.addSavings('${goal.id}')" title="存钱">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="action-btn" onclick="savingsGoalsPage.editGoal('${goal.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn" onclick="savingsGoalsPage.showGoalDetails('${goal.id}')" title="详情">
                            <i class="fas fa-chart-bar"></i>
                        </button>
                    </div>
                </div>
                
                <div class="goal-progress">
                    <div class="progress-info">
                        <span class="current-amount">¥${goal.currentAmount.toLocaleString()}</span>
                        <span class="target-amount">/ ¥${goal.targetAmount.toLocaleString()}</span>
                        <span class="progress-percentage">${progress.toFixed(1)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                </div>
                
                <div class="goal-stats">
                    <div class="stat-item">
                        <span class="stat-label">剩余天数</span>
                        <span class="stat-value">${remainingDays}天</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">月度目标</span>
                        <span class="stat-value">¥${monthlyTarget.toLocaleString()}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">状态</span>
                        <span class="stat-value status-${goal.status}">${this.getStatusText(goal.status)}</span>
                    </div>
                </div>
                
                ${goal.autoDeduction ? `
                    <div class="auto-deduction-info">
                        <i class="fas fa-robot"></i>
                        <span>智能划扣：每月${goal.deductionDay}日自动存入¥${goal.monthlyAmount.toLocaleString()}</span>
                    </div>
                ` : ''}
                
                ${this.renderGoalMilestones(goal)}
            </div>
        `;
    }

    // 渲染目标里程碑
    renderGoalMilestones(goal) {
        const milestones = this.calculateMilestones(goal);
        
        return `
            <div class="goal-milestones">
                <div class="milestones-header">
                    <span>进度里程碑</span>
                </div>
                <div class="milestones-list">
                    ${milestones.map(milestone => `
                        <div class="milestone ${milestone.achieved ? 'achieved' : ''}">
                            <div class="milestone-icon">
                                <i class="fas fa-${milestone.achieved ? 'check-circle' : 'circle'}"></i>
                            </div>
                            <div class="milestone-info">
                                <span class="milestone-percentage">${milestone.percentage}%</span>
                                <span class="milestone-amount">¥${milestone.amount.toLocaleString()}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 渲染成就系统
    renderAchievements() {
        const achievements = this.getAchievements();
        
        return achievements.map(achievement => `
            <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">
                    <i class="fas fa-${achievement.icon}"></i>
                </div>
                <div class="achievement-info">
                    <h4 class="achievement-name">${achievement.name}</h4>
                    <p class="achievement-desc">${achievement.description}</p>
                    <div class="achievement-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${achievement.progress}%"></div>
                        </div>
                        <span class="progress-text">${achievement.current}/${achievement.target}</span>
                    </div>
                </div>
                ${achievement.unlocked ? `
                    <div class="achievement-badge">
                        <i class="fas fa-trophy"></i>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    // 显示创建目标对话框
    showCreateGoal() {
        const modal = this.showModal('创建储蓄目标', `
            <div class="create-goal-form">
                <!-- 模板选择 -->
                <div class="template-section">
                    <h4>选择目标模板</h4>
                    <div class="template-grid">
                        ${Object.entries(this.goalTemplates).map(([key, template]) => `
                            <div class="template-card" onclick="savingsGoalsPage.selectTemplate('${key}')">
                                <div class="template-icon" style="background-color: ${template.color}">
                                    <i class="fas fa-${template.icon}"></i>
                                </div>
                                <div class="template-info">
                                    <h5>${template.name}</h5>
                                    <p>${template.description}</p>
                                    <span class="suggested-amount">建议金额: ¥${template.suggestedAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        `).join('')}
                        <div class="template-card custom" onclick="savingsGoalsPage.selectTemplate('custom')">
                            <div class="template-icon">
                                <i class="fas fa-plus"></i>
                            </div>
                            <div class="template-info">
                                <h5>自定义目标</h5>
                                <p>创建个性化的储蓄目标</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 目标详情表单 -->
                <div class="goal-form" id="goal-form" style="display: none;">
                    <div class="form-group">
                        <label>目标名称</label>
                        <input type="text" id="goal-name" placeholder="输入目标名称">
                    </div>
                    
                    <div class="form-group">
                        <label>目标描述</label>
                        <textarea id="goal-description" placeholder="描述您的储蓄目标"></textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>目标金额 (¥)</label>
                            <input type="number" id="goal-amount" placeholder="0">
                        </div>
                        <div class="form-group">
                            <label>目标期限 (月)</label>
                            <input type="number" id="goal-duration" placeholder="12">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>起始金额 (¥)</label>
                            <input type="number" id="goal-initial" placeholder="0" value="0">
                        </div>
                        <div class="form-group">
                            <label>优先级</label>
                            <select id="goal-priority">
                                <option value="high">高</option>
                                <option value="medium" selected>中</option>
                                <option value="low">低</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- 智能划扣设置 -->
                    <div class="auto-deduction-section">
                        <div class="section-header">
                            <label class="checkbox-label">
                                <input type="checkbox" id="auto-deduction">
                                <span class="checkmark"></span>
                                启用智能划扣
                            </label>
                        </div>
                        <div class="deduction-settings" id="deduction-settings" style="display: none;">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>每月划扣金额 (¥)</label>
                                    <input type="number" id="monthly-amount" placeholder="0">
                                </div>
                                <div class="form-group">
                                    <label>划扣日期</label>
                                    <select id="deduction-day">
                                        ${Array.from({length: 28}, (_, i) => `
                                            <option value="${i + 1}" ${i === 0 ? 'selected' : ''}>${i + 1}日</option>
                                        `).join('')}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button class="btn btn-secondary" onclick="savingsGoalsPage.hideModal()">取消</button>
                        <button class="btn btn-primary" onclick="savingsGoalsPage.createGoal()">创建目标</button>
                    </div>
                </div>
            </div>
        `);
        
        // 绑定智能划扣切换事件
        document.getElementById('auto-deduction').addEventListener('change', (e) => {
            const settings = document.getElementById('deduction-settings');
            settings.style.display = e.target.checked ? 'block' : 'none';
            
            if (e.target.checked) {
                this.calculateMonthlyAmount();
            }
        });
        
        // 绑定金额和期限变化事件
        document.getElementById('goal-amount').addEventListener('input', () => this.calculateMonthlyAmount());
        document.getElementById('goal-duration').addEventListener('input', () => this.calculateMonthlyAmount());
    }

    // 选择模板
    selectTemplate(templateKey) {
        // 移除之前的选中状态
        document.querySelectorAll('.template-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // 添加选中状态
        event.target.closest('.template-card').classList.add('selected');
        
        // 显示表单
        document.getElementById('goal-form').style.display = 'block';
        
        if (templateKey !== 'custom') {
            const template = this.goalTemplates[templateKey];
            document.getElementById('goal-name').value = template.name;
            document.getElementById('goal-description').value = template.description;
            document.getElementById('goal-amount').value = template.suggestedAmount;
            document.getElementById('goal-duration').value = template.duration;
            
            this.selectedTemplate = template;
        } else {
            // 清空表单
            document.getElementById('goal-name').value = '';
            document.getElementById('goal-description').value = '';
            document.getElementById('goal-amount').value = '';
            document.getElementById('goal-duration').value = '';
            
            this.selectedTemplate = null;
        }
        
        this.calculateMonthlyAmount();
    }

    // 计算月度金额
    calculateMonthlyAmount() {
        const amount = parseFloat(document.getElementById('goal-amount')?.value || 0);
        const duration = parseFloat(document.getElementById('goal-duration')?.value || 1);
        const initial = parseFloat(document.getElementById('goal-initial')?.value || 0);
        
        const monthlyAmount = Math.ceil((amount - initial) / duration);
        
        const monthlyInput = document.getElementById('monthly-amount');
        if (monthlyInput) {
            monthlyInput.value = monthlyAmount;
        }
    }

    // 创建目标
    createGoal() {
        const name = document.getElementById('goal-name').value.trim();
        const description = document.getElementById('goal-description').value.trim();
        const targetAmount = parseFloat(document.getElementById('goal-amount').value);
        const duration = parseInt(document.getElementById('goal-duration').value);
        const initialAmount = parseFloat(document.getElementById('goal-initial').value || 0);
        const priority = document.getElementById('goal-priority').value;
        const autoDeduction = document.getElementById('auto-deduction').checked;
        
        if (!name || !targetAmount || !duration) {
            alert('请填写完整的目标信息');
            return;
        }
        
        const goal = {
            id: Date.now().toString(),
            name,
            description,
            targetAmount,
            currentAmount: initialAmount,
            duration,
            priority,
            status: 'active',
            createdAt: new Date().toISOString(),
            targetDate: new Date(Date.now() + duration * 30 * 24 * 60 * 60 * 1000).toISOString(),
            autoDeduction,
            icon: this.selectedTemplate?.icon || 'piggy-bank',
            color: this.selectedTemplate?.color || '#3498db',
            transactions: initialAmount > 0 ? [{
                id: Date.now().toString(),
                amount: initialAmount,
                date: new Date().toISOString(),
                type: 'deposit',
                description: '初始金额'
            }] : []
        };
        
        if (autoDeduction) {
            goal.monthlyAmount = parseFloat(document.getElementById('monthly-amount').value);
            goal.deductionDay = parseInt(document.getElementById('deduction-day').value);
        }
        
        this.savingsGoals.push(goal);
        this.saveSavingsData();
        this.hideModal();
        this.refreshPage();
        
        // 显示成功消息
        this.showSuccessMessage(`储蓄目标"${name}"创建成功！`);
        
        // 如果启用了智能划扣，设置提醒
        if (autoDeduction) {
            this.setupAutoDeductionReminder(goal);
        }
    }

    // 获取活跃目标数量
    getActiveGoalsCount() {
        return this.savingsGoals.filter(goal => goal.status === 'active').length;
    }

    // 获取总储蓄金额
    getTotalSavings() {
        return this.savingsGoals.reduce((total, goal) => total + goal.currentAmount, 0);
    }

    // 获取平均进度
    getAverageProgress() {
        if (this.savingsGoals.length === 0) return 0;
        
        const totalProgress = this.savingsGoals.reduce((sum, goal) => {
            return sum + this.calculateProgress(goal);
        }, 0);
        
        return totalProgress / this.savingsGoals.length;
    }

    // 获取已完成目标数量
    getCompletedGoalsCount() {
        return this.savingsGoals.filter(goal => goal.status === 'completed').length;
    }

    // 计算进度
    calculateProgress(goal) {
        return (goal.currentAmount / goal.targetAmount) * 100;
    }

    // 获取剩余天数
    getRemainingDays(goal) {
        const targetDate = new Date(goal.targetDate);
        const today = new Date();
        const diffTime = targetDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    }

    // 获取月度目标
    getMonthlyTarget(goal) {
        const remaining = goal.targetAmount - goal.currentAmount;
        const remainingMonths = Math.max(1, this.getRemainingDays(goal) / 30);
        return Math.ceil(remaining / remainingMonths);
    }

    // 获取状态文本
    getStatusText(status) {
        const statusMap = {
            active: '进行中',
            completed: '已完成',
            paused: '已暂停',
            overdue: '已逾期'
        };
        return statusMap[status] || status;
    }

    // 计算里程碑
    calculateMilestones(goal) {
        const milestones = [25, 50, 75, 100];
        return milestones.map(percentage => ({
            percentage,
            amount: (goal.targetAmount * percentage) / 100,
            achieved: this.calculateProgress(goal) >= percentage
        }));
    }

    // 获取智能建议
    getSmartSuggestions() {
        const suggestions = [];
        
        // 检查是否有目标
        if (this.savingsGoals.length === 0) {
            suggestions.push({
                type: 'info',
                icon: 'lightbulb',
                title: '开始您的储蓄之旅',
                description: '创建第一个储蓄目标，让理财变得更有目标性',
                action: 'savingsGoalsPage.showCreateGoal()',
                actionText: '创建目标'
            });
        }
        
        // 检查应急基金
        const hasEmergencyFund = this.savingsGoals.some(goal => 
            goal.name.includes('应急') || goal.name.includes('紧急')
        );
        
        if (!hasEmergencyFund) {
            suggestions.push({
                type: 'warning',
                icon: 'shield-alt',
                title: '建议建立应急基金',
                description: '应急基金是理财的基础，建议优先建立3-6个月生活费的应急储备',
                action: 'savingsGoalsPage.createEmergencyFund()',
                actionText: '创建应急基金'
            });
        }
        
        // 检查进度缓慢的目标
        const slowGoals = this.savingsGoals.filter(goal => {
            const progress = this.calculateProgress(goal);
            const timeProgress = this.getTimeProgress(goal);
            return goal.status === 'active' && progress < timeProgress - 20;
        });
        
        if (slowGoals.length > 0) {
            suggestions.push({
                type: 'warning',
                icon: 'clock',
                title: '部分目标进度缓慢',
                description: `有${slowGoals.length}个目标的进度落后于预期，建议调整储蓄计划`,
                action: 'savingsGoalsPage.showSlowGoals()',
                actionText: '查看详情'
            });
        }
        
        // 检查自动划扣建议
        const manualGoals = this.savingsGoals.filter(goal => 
            goal.status === 'active' && !goal.autoDeduction
        );
        
        if (manualGoals.length > 0) {
            suggestions.push({
                type: 'info',
                icon: 'robot',
                title: '启用智能划扣',
                description: '自动划扣可以帮助您更好地坚持储蓄计划，提高目标达成率',
                action: 'savingsGoalsPage.suggestAutoDeduction()',
                actionText: '了解更多'
            });
        }
        
        return suggestions;
    }

    // 获取时间进度
    getTimeProgress(goal) {
        const createdDate = new Date(goal.createdAt);
        const targetDate = new Date(goal.targetDate);
        const today = new Date();
        
        const totalTime = targetDate - createdDate;
        const elapsedTime = today - createdDate;
        
        return Math.min(100, (elapsedTime / totalTime) * 100);
    }

    // 获取成就
    getAchievements() {
        const achievements = [
            {
                id: 'first_goal',
                name: '初出茅庐',
                description: '创建第一个储蓄目标',
                icon: 'seedling',
                target: 1,
                current: this.savingsGoals.length,
                unlocked: this.savingsGoals.length >= 1
            },
            {
                id: 'first_milestone',
                name: '小有成就',
                description: '完成第一个25%里程碑',
                icon: 'flag',
                target: 1,
                current: this.getMilestonesAchieved(25),
                unlocked: this.getMilestonesAchieved(25) >= 1
            },
            {
                id: 'halfway_hero',
                name: '半程英雄',
                description: '完成第一个50%里程碑',
                icon: 'medal',
                target: 1,
                current: this.getMilestonesAchieved(50),
                unlocked: this.getMilestonesAchieved(50) >= 1
            },
            {
                id: 'goal_master',
                name: '目标达人',
                description: '同时拥有5个活跃目标',
                icon: 'star',
                target: 5,
                current: this.getActiveGoalsCount(),
                unlocked: this.getActiveGoalsCount() >= 5
            },
            {
                id: 'first_completion',
                name: '梦想成真',
                description: '完成第一个储蓄目标',
                icon: 'trophy',
                target: 1,
                current: this.getCompletedGoalsCount(),
                unlocked: this.getCompletedGoalsCount() >= 1
            },
            {
                id: 'savings_champion',
                name: '储蓄冠军',
                description: '累计储蓄金额达到10万元',
                icon: 'crown',
                target: 100000,
                current: this.getTotalSavings(),
                unlocked: this.getTotalSavings() >= 100000
            }
        ];
        
        return achievements.map(achievement => ({
            ...achievement,
            progress: Math.min(100, (achievement.current / achievement.target) * 100)
        }));
    }

    // 获取已达成的里程碑数量
    getMilestonesAchieved(percentage) {
        return this.savingsGoals.reduce((count, goal) => {
            const progress = this.calculateProgress(goal);
            return count + (progress >= percentage ? 1 : 0);
        }, 0);
    }

    // 显示模态框
    showModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="savingsGoalsPage.hideModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.currentModal = modal;
        
        // 点击外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal();
            }
        });
        
        return modal;
    }

    // 隐藏模态框
    hideModal() {
        if (this.currentModal) {
            this.currentModal.remove();
            this.currentModal = null;
        }
    }

    // 显示成功消息
    showSuccessMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'success-message';
        messageDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // 刷新页面
    refreshPage() {
        const r = window.router;
        if (r && typeof r.renderPage === 'function') {
            r.renderPage('savings-goals');
        } else {
            const container = document.getElementById('page-container') || document.getElementById('main-content');
            if (container) container.innerHTML = this.render();
        }
    }

    // 初始化事件（供路由调用）
    initEvents() {
        window.savingsGoalsPage = this;
    }

    // 更新数据（供路由调用）
    updateData() {
        try {
            const today = new Date();
            const ymKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
            (this.savingsGoals || []).forEach(goal => {
                if (!goal || goal.status !== 'active') return;
                if (!goal.autoDeduction || !goal.monthlyAmount || !goal.deductionDay) return;
                const already = localStorage.getItem(`deduct_${goal.id}_${ymKey}`) === '1';
                if (today.getDate() === parseInt(goal.deductionDay) && !already) {
                    goal.currentAmount = (goal.currentAmount || 0) + parseFloat(goal.monthlyAmount);
                    goal.transactions = goal.transactions || [];
                    goal.transactions.push({ id: `${Date.now()}`, amount: parseFloat(goal.monthlyAmount), date: new Date().toISOString(), type: 'auto-deduction', description: '智能划扣' });
                    localStorage.setItem(`deduct_${goal.id}_${ymKey}`, '1');
                }
            });
            if (typeof this.saveSavingsData === 'function') this.saveSavingsData();
            const list = document.getElementById('goals-list');
            if (list && typeof this.renderGoalsList === 'function') list.innerHTML = this.renderGoalsList();
        } catch (e) {}
    }
}

// 全局实例由路由在 initEvents 中设置为 window.savingsGoalsPage