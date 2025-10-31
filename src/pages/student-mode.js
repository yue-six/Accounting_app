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
                    <div class="part-time-list" id="part-time-list">
                        ${this.renderPartTimeJobs()}
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
                    
                    <div class="exam-goals-list" id="exam-goals-list">
                        ${this.renderExamGoals()}
                    </div>
                    
                    <div class="goal-templates" style="margin: 15px 0;">
                        <h4>常用目标模板</h4>
                        <div class="template-buttons">
                            <button class="btn btn-secondary" onclick="studentModePage.addGoalFromTemplate('四六级考试', 50)">四六级考试 ¥50</button>
                            <button class="btn btn-secondary" onclick="studentModePage.addGoalFromTemplate('考研报名', 200)">考研报名 ¥200</button>
                            <button class="btn btn-secondary" onclick="studentModePage.addGoalFromTemplate('雅思考试', 2170)">雅思考试 ¥2170</button>
                            <button class="btn btn-secondary" onclick="studentModePage.addGoalFromTemplate('驾照考试', 3000)">驾照考试 ¥3000</button>
                            <button class="btn btn-secondary" onclick="studentModePage.addGoalFromTemplate('计算机二级', 137)">计算机二级 ¥137</button>
                            <button class="btn btn-secondary" onclick="studentModePage.addGoalFromTemplate('教师资格证', 70)">教师资格证 ¥70</button>
                        </div>
                    </div>
                    
                    <div class="goal-actions">
                        <button class="btn btn-primary" onclick="studentModePage.showAddExamGoal()">
                            <i class="fas fa-plus"></i> 自定义储蓄目标
                        </button>
                        <button class="btn btn-info" onclick="studentModePage.showSavingsAnalysis()">
                            <i class="fas fa-chart-pie"></i> 储蓄分析
                        </button>
                        <button class="btn btn-success" onclick="studentModePage.showAutoSaveSettings()">
                            <i class="fas fa-cog"></i> 自动储蓄
                        </button>
                    </div>
                </div>


            </div>
        `;
    }

    // 渲染预算分配
    renderBudgetAllocation() {
        if (!this.settings.monthlyAllowance) {
            return '<div class="empty-state">请先设置每月生活费金额</div>';
        }

        const totalAmount = parseFloat(this.settings.monthlyAllowance);
        const allocations = this.budgetAllocations;
        
        return `
            <div class="allocation-summary">
                <div class="summary-item">
                    <span>本月生活费</span>
                    <span class="amount">¥${totalAmount}</span>
                </div>
                <div class="summary-item">
                    <span>已使用</span>
                    <span class="amount spent">¥${this.getTotalSpent().toFixed(2)}</span>
                </div>
                <div class="summary-item">
                    <span>剩余</span>
                    <span class="amount remaining">¥${(totalAmount - this.getTotalSpent()).toFixed(2)}</span>
                </div>
            </div>
            
            <div class="allocation-chart">
                ${Object.entries(this.budgetRatios).map(([key, ratio], index) => {
                    const amount = (totalAmount * ratio / 100).toFixed(2);
                    const spent = this.getSpentAmount(key);
                    const remaining = amount - spent;
                    const percentage = spent > 0 ? (spent / amount * 100).toFixed(1) : 0;
                    const warningLevel = this.getBudgetWarningLevel(percentage);
                    
                    return `
                        <div class="allocation-item budget-item ${spent > amount ? 'over-budget' : ''} ${warningLevel}" style="animation-delay: ${index * 0.1}s">
                            <div class="allocation-header">
                                <span class="category-name">${this.getCategoryName(key)}</span>
                                <span class="amount">¥${spent} / ¥${amount}</span>
                                ${this.getBudgetWarningIcon(percentage)}
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                            </div>
                            <div class="allocation-details">
                                <span>预算比例: ${ratio}%</span>
                                <span class="${remaining >= 0 ? 'remaining' : 'over-spent'}">
                                    ${remaining >= 0 ? `剩余 ¥${remaining.toFixed(2)}` : `超支 ¥${Math.abs(remaining).toFixed(2)}`}
                                </span>
                            </div>
                            ${this.getBudgetWarningMessage(key, percentage, remaining)}
                        </div>`;
                }).join('')}
            </div>
            <div class="allocation-actions">
                <button class="btn btn-secondary" onclick="studentModePage.customizeBudgetRatios()">自定义比例</button>
                <button class="btn btn-primary" onclick="studentModePage.saveBudgetAllocation()">保存分配</button>
            </div>
        `;
    }

    // 渲染兼职工作列表
    renderPartTimeJobs() {
        if (this.partTimeJobs.length === 0) {
            return '<div class="empty-state">暂无兼职记录</div>';
        }

        return this.partTimeJobs.map((job, index) => `
            <div class="part-time-item" style="animation-delay: ${index * 0.15}s">
                <div class="job-info">
                    <h4>${job.source}</h4>
                    <p>${job.description || '无描述'}</p>
                </div>
                <div class="job-details">
                    <div class="amount">¥${job.amount}</div>
                    <div class="date">${new Date(job.date).toLocaleDateString()}</div>
                    <div class="status ${job.status}">${this.getJobStatusText(job.status)}</div>
                </div>
                <div class="job-actions">
                    <button class="btn btn-sm btn-danger" onclick="studentModePage.deletePartTimeJob('${job.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // 渲染考证目标
    renderExamGoals() {
        if (this.examGoals.length === 0) {
            return '<div class="empty-state">暂无储蓄目标，点击上方模板快速创建</div>';
        }

        return this.examGoals.map((goal, index) => {
            const progress = (goal.currentAmount / goal.amount * 100).toFixed(1);
            const deadline = new Date(goal.deadline);
            const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
            const weeklyNeed = this.calculateWeeklyNeed(goal);
            const isCompleted = goal.currentAmount >= goal.amount;
            const isUrgent = daysLeft <= 7 && daysLeft > 0;
            const isOverdue = daysLeft <= 0;
            const savingsVelocity = this.getSavingsVelocity(goal);
            const motivationMessage = this.getMotivationMessage(goal, progress, daysLeft);
            
            return `
                <div class="exam-goal-item ${isCompleted ? 'completed' : ''} ${isUrgent ? 'urgent' : ''} ${isOverdue ? 'overdue' : ''}" style="animation-delay: ${index * 0.15}s">
                    <div class="goal-header">
                        <div class="goal-title">
                            <h4>
                                ${isCompleted ? '🎉 ' : ''}${goal.name}
                                ${goal.autoSave ? '<i class="fas fa-robot auto-save-icon" title="自动储蓄"></i>' : ''}
                            </h4>
                            <div class="goal-status">
                                ${isCompleted ? '<span class="status-badge completed">已完成</span>' : 
                                  isOverdue ? '<span class="status-badge overdue">已逾期</span>' :
                                  isUrgent ? '<span class="status-badge urgent">紧急</span>' : 
                                  '<span class="status-badge active">进行中</span>'}
                            </div>
                        </div>
                        <span class="goal-amount">¥${goal.currentAmount} / ¥${goal.amount}</span>
                    </div>
                    
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill ${isCompleted ? 'completed' : isUrgent ? 'urgent' : ''}" 
                                 style="width: ${Math.min(progress, 100)}%"></div>
                        </div>
                        <div class="progress-labels">
                            <span class="progress-text">${progress}%</span>
                            <span class="remaining-amount">还需 ¥${Math.max(0, goal.amount - goal.currentAmount).toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div class="goal-details">
                        <div class="detail-row">
                            <div class="detail-item">
                                <i class="fas fa-calendar-alt"></i>
                                <span>截止: ${deadline.toLocaleDateString()}</span>
                                <span class="${daysLeft > 0 ? (daysLeft <= 7 ? 'urgent' : 'days-left') : 'overdue'}">
                                    ${daysLeft > 0 ? `${daysLeft}天` : '已逾期'}
                                </span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-piggy-bank"></i>
                                <span>每周需存: ¥${weeklyNeed}</span>
                                <span class="velocity ${savingsVelocity.status}">
                                    ${savingsVelocity.icon} ${savingsVelocity.text}
                                </span>
                            </div>
                        </div>
                        
                        ${!isCompleted ? `
                            <div class="motivation-message ${motivationMessage.type}">
                                <i class="fas ${motivationMessage.icon}"></i>
                                <span>${motivationMessage.text}</span>
                            </div>
                        ` : `
                            <div class="completion-celebration">
                                <i class="fas fa-trophy"></i>
                                <span>恭喜完成储蓄目标！继续保持良好的储蓄习惯！</span>
                            </div>
                        `}
                    </div>
                    
                    <div class="goal-actions">
                        ${!isCompleted ? `
                            <button class="btn btn-sm btn-primary" onclick="studentModePage.addToGoal('${goal.id}')">
                                <i class="fas fa-plus"></i> 存钱
                            </button>
                            <button class="btn btn-sm btn-success" onclick="studentModePage.quickSave('${goal.id}')">
                                <i class="fas fa-bolt"></i> 快存¥${Math.min(50, Math.ceil(weeklyNeed))}
                            </button>
                        ` : `
                            <button class="btn btn-sm btn-success" disabled>
                                <i class="fas fa-check"></i> 已完成
                            </button>
                        `}
                        <button class="btn btn-sm btn-secondary" onclick="studentModePage.editGoal('${goal.id}')">
                            <i class="fas fa-edit"></i> 编辑
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="studentModePage.deleteGoal('${goal.id}')">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 渲染消费分析
    renderExpenseAnalysis() {
        const monthlyExpenses = this.getMonthlyExpensesByCategory();
        const totalExpense = Object.values(monthlyExpenses).reduce((sum, amount) => sum + amount, 0);
        
        if (totalExpense === 0) {
            return '<div class="empty-state">暂无消费数据</div>';
        }

        return `
            <div class="analysis-summary">
                <div class="total-expense">本月总支出: ¥${totalExpense.toFixed(2)}</div>
            </div>
            <div class="category-breakdown">
                ${Object.entries(monthlyExpenses).map(([category, amount]) => {
                    const percentage = (amount / totalExpense * 100).toFixed(1);
                    return `
                        <div class="category-item">
                            <div class="category-info">
                                <span class="category-name">${category}</span>
                                <span class="category-amount">¥${amount.toFixed(2)} (${percentage}%)</span>
                            </div>
                            <div class="category-bar">
                                <div class="bar-fill" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // 初始化事件
    initEvents() {
        studentModePage = this;
        this.loadStudentData();
        this.setupAnimationEvents();
        this.setupDataSyncEvents();
        setTimeout(() => this.animatePage(), 100);
    }

    // 设置数据同步事件
    setupDataSyncEvents() {
        // 监听学生模式数据更新事件
        window.addEventListener('studentModeDataUpdated', () => {
            this.refreshDisplay();
        });
        
        // 监听存储变化事件（用于跨标签页同步）
        window.addEventListener('storage', (event) => {
            if (event.key === 'student_part_time_jobs') {
                this.refreshDisplay();
            }
        });
    }

    // 刷新显示
    refreshDisplay() {
        // 重新加载数据
        this.loadStudentData();
        
        // 刷新兼职收入管理板块
        const partTimeSection = document.querySelector('.student-mode-page .part-time-summary');
        if (partTimeSection) {
            partTimeSection.innerHTML = `
                <div class="summary-stats">
                    <div class="stat-item">
                        <div class="stat-value">¥${this.getMonthlyPartTimeIncome()}</div>
                        <div class="stat-label">本月兼职收入</div>
                    </div>
                </div>
            `;
        }
        
        // 刷新兼职记录列表
        const partTimeList = document.getElementById('part-time-list');
        if (partTimeList) {
            partTimeList.innerHTML = this.renderPartTimeJobs();
        }
        
        console.log('学生模式页面数据已刷新');
    }

    // 页面动画效果
    animatePage() {
        const cards = document.querySelectorAll('.student-mode-page .card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50);
            }, index * 150);
        });
        
        // 为进度条添加动画
        setTimeout(() => this.animateProgressBars(), 600);
    }

    // 进度条动画
    animateProgressBars() {
        const progressFills = document.querySelectorAll('.progress-fill');
        progressFills.forEach(fill => {
            const targetWidth = fill.style.width;
            fill.style.width = '0';
            fill.style.transition = 'width 1s ease-out';
            
            setTimeout(() => {
                fill.style.width = targetWidth;
            }, 100);
        });
    }

    // 设置动画事件
    setupAnimationEvents() {
        // 为所有按钮添加涟漪效果
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple');
                
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
        
        // 为列表项添加悬停效果
        const listItems = ['.part-time-item', '.exam-goal-item', '.category-item'];
        listItems.forEach(selector => {
            document.querySelectorAll(selector).forEach(item => {
                item.addEventListener('mouseenter', () => {
                    item.style.transform = 'translateX(5px)';
                    item.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    item.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
                });
                
                item.addEventListener('mouseleave', () => {
                    item.style.transform = 'translateX(0)';
                    item.style.boxShadow = 'none';
                });
            });
        });
    }

    // 设置预算分配
    setupBudgetAllocation() {
        const monthlyAllowance = document.getElementById('monthly-allowance').value;
        if (!monthlyAllowance || monthlyAllowance <= 0) {
            this.app.showToast('请输入有效的生活费金额');
            return;
        }

        this.settings.monthlyAllowance = monthlyAllowance;
        localStorage.setItem('student_mode_settings', JSON.stringify(this.settings));
        
        document.getElementById('budget-allocation').innerHTML = this.renderBudgetAllocation();
        this.app.showToast('预算分配已更新');
    }

    // 自定义预算比例
    customizeBudgetRatios() {
        this.showMobileModal('自定义预算比例', `
            <div style="padding: 0;">
                <div class="ratio-inputs">
                    ${Object.entries(this.budgetRatios).map(([key, ratio]) => `
                        <div class="input-group" style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #333;">${this.getCategoryName(key)}</label>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input type="number" id="ratio-${key}" value="${ratio}" min="0" max="100" 
                                       style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;">
                                <span style="color: #666;">%</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="total-check" id="total-check" style="margin: 20px 0; padding: 10px; border-radius: 8px; text-align: center; font-weight: 500;"></div>
                <div class="button-group" style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" onclick="studentModePage.saveCustomRatios()" 
                            style="flex: 1; padding: 12px; background: #007AFF; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 500;">保存</button>
                    <button class="btn btn-secondary" onclick="studentModePage.hideMobileModal()" 
                            style="flex: 1; padding: 12px; background: #f5f5f5; color: #666; border: none; border-radius: 8px; font-size: 16px;">取消</button>
                </div>
            </div>
        `);

        // 实时计算总比例
        setTimeout(() => {
            Object.keys(this.budgetRatios).forEach(key => {
                const input = document.getElementById(`ratio-${key}`);
                if (input) {
                    input.addEventListener('input', this.updateTotalRatio.bind(this));
                }
            });
            this.updateTotalRatio();
        }, 100);
    }

    // 更新总比例显示
    updateTotalRatio() {
        let total = 0;
        Object.keys(this.budgetRatios).forEach(key => {
            const value = parseFloat(document.getElementById(`ratio-${key}`).value) || 0;
            total += value;
        });
        
        const totalCheck = document.getElementById('total-check');
        totalCheck.innerHTML = `总比例: ${total}% ${total === 100 ? '✓' : total > 100 ? '(超出100%)' : '(不足100%)'}`;
        totalCheck.className = total === 100 ? 'total-valid' : 'total-invalid';
    }

    // 保存自定义比例
    saveCustomRatios() {
        let total = 0;
        const newRatios = {};
        
        Object.keys(this.budgetRatios).forEach(key => {
            const value = parseFloat(document.getElementById(`ratio-${key}`).value) || 0;
            newRatios[key] = value;
            total += value;
        });

        if (total !== 100) {
            this.app.showToast('比例总和必须等于100%');
            return;
        }

        this.budgetRatios = newRatios;
        localStorage.setItem('student_budget_ratios', JSON.stringify(this.budgetRatios));
        
        document.getElementById('budget-allocation').innerHTML = this.renderBudgetAllocation();
        this.hideMobileModal();
        this.app.showToast('预算比例已保存');
    }

    // 显示添加兼职工作对话框
    showAddPartTimeJob() {
        this.showMobileModal('添加兼职记录', `
            <div style="padding: 0;">
                <div class="input-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #333;">收入来源</label>
                    <select id="job-source" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; background: white;">
                        <option value="家教">家教</option>
                        <option value="实习">实习</option>
                        <option value="线上兼职">线上兼职</option>
                        <option value="服务员">服务员</option>
                        <option value="快递员">快递员</option>
                        <option value="其他">其他</option>
                    </select>
                </div>
                <div class="input-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #333;">工作描述</label>
                    <input type="text" id="job-description" placeholder="如：小学数学家教、设计兼职等" 
                           style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;">
                </div>
                <div class="input-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #333;">税后金额</label>
                    <input type="number" id="job-amount" placeholder="请输入金额" 
                           style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;">
                </div>
                <div class="input-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #333;">到账时间</label>
                    <input type="date" id="job-date" value="${new Date().toISOString().split('T')[0]}" 
                           style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;">
                </div>
                <div class="input-group" style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #333;">状态</label>
                    <select id="job-status" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; background: white;">
                        <option value="completed">已到账</option>
                        <option value="pending">待到账</option>
                        <option value="processing">处理中</option>
                    </select>
                </div>
                <div class="button-group" style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" onclick="studentModePage.savePartTimeJob()" 
                            style="flex: 1; padding: 12px; background: #007AFF; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 500;">保存</button>
                    <button class="btn btn-secondary" onclick="studentModePage.hideMobileModal()" 
                            style="flex: 1; padding: 12px; background: #f5f5f5; color: #666; border: none; border-radius: 8px; font-size: 16px;">取消</button>
                </div>
            </div>
        `);
    }

    // 保存预算分配
    saveBudgetAllocation() {
        if (!this.settings.monthlyAllowance) {
            this.app.showToast('请先设置每月生活费金额');
            return;
        }

        // 保存当前的预算分配设置
        const budgetAllocation = {
            monthlyAllowance: this.settings.monthlyAllowance,
            budgetRatios: this.budgetRatios,
            lastUpdated: new Date().toISOString(),
            allocations: {}
        };

        // 计算每个分类的预算金额
        Object.keys(this.budgetRatios).forEach(key => {
            const ratio = this.budgetRatios[key];
            const amount = (parseFloat(this.settings.monthlyAllowance) * ratio / 100).toFixed(2);
            budgetAllocation.allocations[key] = {
                category: this.getCategoryName(key),
                ratio: ratio,
                budgetAmount: amount,
                spentAmount: this.getSpentAmount(key),
                remainingAmount: (amount - this.getSpentAmount(key)).toFixed(2)
            };
        });

        this.budgetAllocations = budgetAllocation;
        localStorage.setItem('student_budget_allocations', JSON.stringify(this.budgetAllocations));
        
        this.app.showToast('预算分配已保存');
        
        // 刷新预算分配显示
        document.getElementById('budget-allocation').innerHTML = this.renderBudgetAllocation();
    }

    // 保存兼职工作
    async savePartTimeJob() {
        const source = document.getElementById('job-source').value;
        const description = document.getElementById('job-description').value;
        const amount = parseFloat(document.getElementById('job-amount').value);
        const date = document.getElementById('job-date').value;
        const status = document.getElementById('job-status').value;

        if (!amount || amount <= 0) {
            this.app.showToast('请输入有效金额');
            return;
        }

        const job = {
            id: Date.now().toString(),
            source,
            description,
            amount,
            date,
            status,
            createdAt: new Date().toISOString()
        };

        this.partTimeJobs.unshift(job);
        localStorage.setItem('student_part_time_jobs', JSON.stringify(this.partTimeJobs));

        // 如果是已到账的收入，自动添加到收入记录
        if (status === 'completed') {
            // 添加到应用交易记录
            this.app.addTransaction({
                type: 'income',
                amount,
                category: '兼职收入',
                description: `${source} - ${description}`,
                date
            });

            // 同步到数据库
            try {
                if (typeof modeDatabase !== 'undefined' && modeDatabase) {
                    await modeDatabase.addUserTransaction({
                        type: 'income',
                        amount: amount,
                        category: '兼职收入',
                        description: `${source} - ${description}`,
                        date: date,
                        source: 'student_mode',
                        created_at: new Date().toISOString()
                    });
                    console.log('兼职收入已同步到数据库');
                }
            } catch (error) {
                console.error('同步兼职收入到数据库失败:', error);
            }
        }

        // 更新兼职记录列表
        document.getElementById('part-time-list').innerHTML = this.renderPartTimeJobs();
        
        // 刷新兼职收入统计显示
        this.refreshPartTimeDisplay();
        
        this.hideMobileModal();
        this.app.showToast('兼职记录已添加');
    }

    // 从模板添加目标
    addGoalFromTemplate(name, amount) {
        const deadline = new Date();
        deadline.setMonth(deadline.getMonth() + 2); // 默认2个月后

        const goal = {
            id: Date.now().toString(),
            name,
            amount,
            currentAmount: 0,
            deadline: deadline.toISOString().split('T')[0],
            autoSave: false,
            createdAt: new Date().toISOString()
        };

        this.examGoals.push(goal);
        localStorage.setItem('student_exam_goals', JSON.stringify(this.examGoals));
        
        document.getElementById('exam-goals-list').innerHTML = this.renderExamGoals();
        this.app.showToast(`${name}目标已添加`);
    }

    // 显示添加考证目标对话框
    showAddExamGoal() {
        this.showMobileModal('自定义储蓄目标', `
            <div style="padding: 0;">
                <div class="input-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #333;">目标名称</label>
                    <input type="text" id="goal-name" placeholder="如：托福考试、学费储蓄等" 
                           style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;">
                </div>
                <div class="input-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #333;">目标金额</label>
                    <input type="number" id="goal-amount" placeholder="请输入金额" 
                           style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;">
                </div>
                <div class="input-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #333;">截止日期</label>
                    <input type="date" id="goal-deadline" 
                           style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;">
                </div>
                <div class="input-group" style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 10px; font-weight: 500; color: #333;">自动储蓄</label>
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <span style="color: #666;">从生活费中自动划扣</span>
                        <label class="switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
                            <input type="checkbox" id="goal-auto-save" 
                                   style="opacity: 0; width: 0; height: 0;">
                            <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px;"></span>
                            <span class="slider:before" style="position: absolute; content: ''; height: 16px; width: 16px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%;"></span>
                        </label>
                    </div>
                </div>
                <div class="button-group" style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" onclick="studentModePage.saveExamGoal()" 
                            style="flex: 1; padding: 12px; background: #007AFF; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 500;">保存</button>
                    <button class="btn btn-secondary" onclick="studentModePage.hideMobileModal()" 
                            style="flex: 1; padding: 12px; background: #f5f5f5; color: #666; border: none; border-radius: 8px; font-size: 16px;">取消</button>
                </div>
            </div>
        `);
        
        // 添加开关样式
        setTimeout(() => {
            const checkbox = document.getElementById('goal-auto-save');
            const slider = checkbox.nextElementSibling;
            
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    slider.style.backgroundColor = '#007AFF';
                } else {
                    slider.style.backgroundColor = '#ccc';
                }
            });
        }, 100);
    }

    // 保存考证目标
    saveExamGoal() {
        const name = document.getElementById('goal-name').value;
        const amount = parseFloat(document.getElementById('goal-amount').value);
        const deadline = document.getElementById('goal-deadline').value;
        const autoSave = document.getElementById('goal-auto-save').checked;

        if (!name || !amount || !deadline) {
            this.app.showToast('请填写完整信息');
            return;
        }

        const goal = {
            id: Date.now().toString(),
            name,
            amount,
            currentAmount: 0,
            deadline,
            autoSave,
            createdAt: new Date().toISOString()
        };

        this.examGoals.push(goal);
        localStorage.setItem('student_exam_goals', JSON.stringify(this.examGoals));
        
        document.getElementById('exam-goals-list').innerHTML = this.renderExamGoals();
        this.hideMobileModal();
        this.app.showToast('储蓄目标已添加');
    }

    // 向目标添加金额
    addToGoal(goalId) {
        const goal = this.examGoals.find(g => g.id === goalId);
        if (!goal) return;

        const remaining = goal.amount - goal.currentAmount;
        this.showMobileModal('存钱到目标', `
            <div style="padding: 0;">
                <div class="goal-info" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <h4 style="margin: 0 0 10px 0; font-size: 16px; color: #333;">${goal.name}</h4>
                    <p style="margin: 5px 0; color: #666; font-size: 14px;">目标金额: ¥${goal.amount}</p>
                    <p style="margin: 5px 0; color: #666; font-size: 14px;">已存金额: ¥${goal.currentAmount}</p>
                    <p style="margin: 5px 0; color: #007AFF; font-size: 14px; font-weight: 500;">还需: ¥${remaining.toFixed(2)}</p>
                </div>
                <div class="input-group" style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #333;">存入金额</label>
                    <input type="number" id="add-amount" placeholder="请输入金额" max="${remaining}" 
                           style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;">
                </div>
                <div class="button-group" style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" onclick="studentModePage.confirmAddToGoal('${goalId}')" 
                            style="flex: 1; padding: 12px; background: #007AFF; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 500;">确认存入</button>
                    <button class="btn btn-secondary" onclick="studentModePage.hideMobileModal()" 
                            style="flex: 1; padding: 12px; background: #f5f5f5; color: #666; border: none; border-radius: 8px; font-size: 16px;">取消</button>
                </div>
            </div>
        `);
    }

    // 确认向目标添加金额
    confirmAddToGoal(goalId) {
        const amount = parseFloat(document.getElementById('add-amount').value);
        if (!amount || amount <= 0) {
            this.app.showToast('请输入有效金额');
            return;
        }

        const goal = this.examGoals.find(g => g.id === goalId);
        if (!goal) return;

        goal.currentAmount = Math.min(goal.currentAmount + amount, goal.amount);
        localStorage.setItem('student_exam_goals', JSON.stringify(this.examGoals));

        // 添加支出记录
        this.app.addTransaction({
            type: 'expense',
            amount,
            category: '储蓄',
            description: `${goal.name} - 储蓄`,
            date: new Date().toISOString().split('T')[0]
        });

        document.getElementById('exam-goals-list').innerHTML = this.renderExamGoals();
        this.hideMobileModal();
        
        if (goal.currentAmount >= goal.amount) {
            this.app.showToast(`🎉 恭喜！${goal.name}目标已完成！`);
        } else {
            this.app.showToast('储蓄已添加');
        }
    }

    // 辅助方法
    getCategoryName(key) {
        const names = {
            food: '餐饮',
            study: '学习用品',
            entertainment: '娱乐社交',
            emergency: '应急储备',
            free: '自由支配'
        };
        return names[key] || key;
    }

    getJobStatusText(status) {
        const texts = {
            completed: '已到账',
            pending: '待到账',
            processing: '处理中'
        };
        return texts[status] || status;
    }

    getMonthlyPartTimeIncome() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return this.partTimeJobs
            .filter(job => {
                const jobDate = new Date(job.date);
                return jobDate.getMonth() === currentMonth && 
                       jobDate.getFullYear() === currentYear &&
                       job.status === 'completed';
            })
            .reduce((sum, job) => sum + job.amount, 0)
            .toFixed(2);
    }

    getIncomeRatio() {
        const partTimeIncome = parseFloat(this.getMonthlyPartTimeIncome());
        const allowance = parseFloat(this.settings.monthlyAllowance || 0);
        const totalIncome = partTimeIncome + allowance;
        
        return totalIncome > 0 ? (partTimeIncome / totalIncome * 100).toFixed(1) : 0;
    }

    // 获取平均时薪
    getAverageHourlyRate() {
        const completedJobs = this.partTimeJobs.filter(job => job.status === 'completed' && job.hours);
        if (completedJobs.length === 0) return '0';
        
        const totalAmount = completedJobs.reduce((sum, job) => sum + job.amount, 0);
        const totalHours = completedJobs.reduce((sum, job) => sum + (job.hours || 0), 0);
        
        return totalHours > 0 ? (totalAmount / totalHours).toFixed(2) : '0';
    }

    // 获取目标完成度
    getGoalCompletion() {
        const goal = parseFloat(this.settings.partTimeGoal || 0);
        const current = parseFloat(this.getMonthlyPartTimeIncome());
        
        return goal > 0 ? Math.min((current / goal * 100), 100).toFixed(1) : 0;
    }

    // 获取预计月收入
    getProjectedIncome() {
        const currentDay = new Date().getDate();
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const currentIncome = parseFloat(this.getMonthlyPartTimeIncome());
        
        if (currentDay === 0) return '0';
        
        const dailyAverage = currentIncome / currentDay;
        return (dailyAverage * daysInMonth).toFixed(2);
    }

    // 设置兼职目标
    setPartTimeGoal() {
        this.showModal('设置兼职收入目标', `
            <div style="padding: 20px;">
                <div class="input-group">
                    <label>月度兼职收入目标</label>
                    <input type="number" id="part-time-goal" value="${this.settings.partTimeGoal || ''}" placeholder="请输入目标金额">
                </div>
                
                <div class="goal-suggestions">
                    <h4>建议目标</h4>
                    <div class="suggestion-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="document.getElementById('part-time-goal').value = 500">¥500 (轻松目标)</button>
                        <button class="btn btn-sm btn-secondary" onclick="document.getElementById('part-time-goal').value = 1000">¥1000 (适中目标)</button>
                        <button class="btn btn-sm btn-secondary" onclick="document.getElementById('part-time-goal').value = 1500">¥1500 (挑战目标)</button>
                    </div>
                </div>
                
                <div class="button-group">
                    <button class="btn btn-primary" onclick="studentModePage.savePartTimeGoal()">保存目标</button>
                    <button class="btn btn-secondary" onclick="studentModePage.hideModal()">取消</button>
                </div>
            </div>
        `);
    }

    // 保存兼职目标
    savePartTimeGoal() {
        const goal = document.getElementById('part-time-goal').value;
        if (!goal || goal <= 0) {
            this.app.showToast('请输入有效的目标金额');
            return;
        }

        this.settings.partTimeGoal = parseFloat(goal);
        localStorage.setItem('student_mode_settings', JSON.stringify(this.settings));
        
        this.hideModal();
        this.app.showToast('兼职收入目标已设置');
        
        // 刷新页面显示
        document.getElementById('student-mode-page').innerHTML = this.render().replace('<div class="page active" id="student-mode-page">', '').replace('</div>', '');
    }

    // 显示收入分析
    showIncomeAnalysis() {
        const monthlyIncome = parseFloat(this.getMonthlyPartTimeIncome());
        const allowance = parseFloat(this.settings.monthlyAllowance || 0);
        const totalIncome = monthlyIncome + allowance;
        
        // 按兼职类型分析
        const jobsByType = {};
        this.partTimeJobs.forEach(job => {
            if (job.status === 'completed') {
                jobsByType[job.type] = (jobsByType[job.type] || 0) + job.amount;
            }
        });

        this.showModal('兼职收入分析', `
            <div style="padding: 20px;">
                <div class="analysis-overview">
                    <h4>收入概览</h4>
                    <div class="overview-grid">
                        <div class="overview-item">
                            <span>总收入</span>
                            <span>¥${totalIncome.toFixed(2)}</span>
                        </div>
                        <div class="overview-item">
                            <span>兼职收入</span>
                            <span>¥${monthlyIncome}</span>
                        </div>
                        <div class="overview-item">
                            <span>生活费</span>
                            <span>¥${allowance}</span>
                        </div>
                        <div class="overview-item">
                            <span>自给率</span>
                            <span>${this.getIncomeRatio()}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="type-analysis">
                    <h4>兼职类型分析</h4>
                    <div class="type-breakdown">
                        ${Object.entries(jobsByType).map(([type, amount]) => {
                            const percentage = (amount / monthlyIncome * 100).toFixed(1);
                            return `
                                <div class="type-item">
                                    <span class="type-name">${type}</span>
                                    <span class="type-amount">¥${amount.toFixed(2)} (${percentage}%)</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <div class="recommendations">
                    <h4>优化建议</h4>
                    <ul class="recommendation-list">
                        ${this.getIncomeRecommendations().map(rec => `<li><i class="fas fa-lightbulb"></i> ${rec}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="button-group">
                    <button class="btn btn-primary" onclick="studentModePage.hideModal()">关闭</button>
                </div>
            </div>
        `);
    }

    // 获取收入优化建议
    getIncomeRecommendations() {
        const recommendations = [];
        const incomeRatio = parseFloat(this.getIncomeRatio());
        const averageRate = parseFloat(this.getAverageHourlyRate());
        const goalCompletion = parseFloat(this.getGoalCompletion());

        if (incomeRatio < 20) {
            recommendations.push('兼职收入占比较低，可考虑增加兼职时间或寻找更高薪的兼职');
        } else if (incomeRatio > 60) {
            recommendations.push('兼职收入占比较高，注意平衡学习和工作时间');
        }

        if (averageRate < 15) {
            recommendations.push('平均时薪偏低，建议寻找技能要求更高的兼职工作');
        } else if (averageRate > 30) {
            recommendations.push('时薪水平不错，可以考虑增加工作时间或承接更多项目');
        }

        if (goalCompletion < 50) {
            recommendations.push('距离月度目标还有差距，建议增加兼职频率或提高工作效率');
        } else if (goalCompletion >= 100) {
            recommendations.push('已完成月度目标，可以考虑设置更高的挑战目标');
        }

        if (recommendations.length === 0) {
            recommendations.push('收入状况良好，继续保持当前的兼职节奏');
        }

        return recommendations;
    }

    calculateWeeklyNeed(goal) {
        const remaining = goal.amount - goal.currentAmount;
        const deadline = new Date(goal.deadline);
        const weeksLeft = Math.max(1, Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24 * 7)));
        return (remaining / weeksLeft).toFixed(2);
    }

    getSpentAmount(category) {
        // 从交易记录中获取当月该分类的支出
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        // 分类映射关系
        const categoryMap = {
            food: ['餐饮', '外卖', '零食', '早餐', '午餐', '晚餐'],
            study: ['学习用品', '教材', '文具', '书籍', '考试报名费', '培训费'],
            entertainment: ['娱乐', '电影', '游戏', '社交', '聚会', '旅行'],
            emergency: ['医疗', '药品', '急救'],
            free: ['其他', '杂项']
        };
        
        // 如果应用实例存在并且有交易记录
        if (this.app && this.app.transactions && Array.isArray(this.app.transactions)) {
            return this.app.transactions
                .filter(transaction => {
                    // 确保交易有必要的字段
                    if (!transaction || !transaction.date || !transaction.type || !transaction.category) {
                        return false;
                    }
                    
                    const transactionDate = new Date(transaction.date);
                    // 筛选本月支出
                    return transaction.type === 'expense' &&
                           transactionDate.getMonth() === currentMonth &&
                           transactionDate.getFullYear() === currentYear &&
                           (categoryMap[category]?.includes(transaction.category) ||
                           transaction.category === this.getCategoryName(category));
                })
                .reduce((sum, transaction) => sum + (parseFloat(transaction.amount) || 0), 0);
        }
        
        // 如果无法获取实际数据，返回0
        return 0;
    }

    // 获取总支出
    getTotalSpent() {
        return Object.keys(this.budgetRatios).reduce((total, key) => {
            return total + this.getSpentAmount(key);
        }, 0);
    }
    
    // 编辑目标
    editGoal(goalId) {
        const goal = this.examGoals.find(g => g.id === goalId);
        if (!goal) return;

        this.showMobileModal('编辑储蓄目标', `
            <div style="padding: 0;">
                <div class="input-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #333;">目标名称</label>
                    <input type="text" id="edit-goal-name" value="${goal.name}" placeholder="如：托福考试、学费储蓄等" 
                           style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;">
                </div>
                <div class="input-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #333;">目标金额</label>
                    <input type="number" id="edit-goal-amount" value="${goal.amount}" placeholder="请输入金额" 
                           style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;">
                </div>
                <div class="input-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #333;">当前已存</label>
                    <input type="number" id="edit-goal-current" value="${goal.currentAmount}" placeholder="请输入当前金额" disabled
                           style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; background: #f5f5f5; color: #999;">
                </div>
                <div class="input-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #333;">截止日期</label>
                    <input type="date" id="edit-goal-deadline" value="${goal.deadline}" 
                           style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;">
                </div>
                <div class="input-group" style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 10px; font-weight: 500; color: #333;">自动储蓄</label>
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <span style="color: #666;">从生活费中自动划扣</span>
                        <label class="switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
                            <input type="checkbox" id="edit-goal-auto-save" ${goal.autoSave ? 'checked' : ''} 
                                   style="opacity: 0; width: 0; height: 0;">
                            <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px;"></span>
                            <span class="slider:before" style="position: absolute; content: ''; height: 16px; width: 16px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%;"></span>
                        </label>
                    </div>
                </div>
                <div class="button-group" style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" onclick="studentModePage.saveEditGoal('${goalId}')" 
                            style="flex: 1; padding: 12px; background: #007AFF; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 500;">保存</button>
                    <button class="btn btn-secondary" onclick="studentModePage.hideMobileModal()" 
                            style="flex: 1; padding: 12px; background: #f5f5f5; color: #666; border: none; border-radius: 8px; font-size: 16px;">取消</button>
                </div>
            </div>
        `);
        
        // 添加开关样式
        setTimeout(() => {
            const checkbox = document.getElementById('edit-goal-auto-save');
            const slider = checkbox.nextElementSibling;
            
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    slider.style.backgroundColor = '#007AFF';
                } else {
                    slider.style.backgroundColor = '#ccc';
                }
            });
            
            // 初始化开关状态
            if (checkbox.checked) {
                slider.style.backgroundColor = '#007AFF';
            }
        }, 100);
    }
    
    // 保存编辑后的目标
    saveEditGoal(goalId) {
        const name = document.getElementById('edit-goal-name').value;
        const amount = parseFloat(document.getElementById('edit-goal-amount').value);
        const deadline = document.getElementById('edit-goal-deadline').value;
        const autoSave = document.getElementById('edit-goal-auto-save').checked;

        if (!name || !amount || !deadline) {
            this.app.showToast('请填写完整信息');
            return;
        }

        const goal = this.examGoals.find(g => g.id === goalId);
        if (!goal) return;

        // 更新目标信息
        goal.name = name;
        goal.amount = amount;
        // 确保已存金额不超过目标金额
        goal.currentAmount = Math.min(goal.currentAmount, amount);
        goal.deadline = deadline;
        goal.autoSave = autoSave;

        localStorage.setItem('student_exam_goals', JSON.stringify(this.examGoals));
        document.getElementById('exam-goals-list').innerHTML = this.renderExamGoals();
        this.hideMobileModal();
        this.app.showToast('储蓄目标已更新');
    }

    // 获取预算警告级别
    getBudgetWarningLevel(percentage) {
        if (percentage >= 100) return 'danger';
        if (percentage >= 80) return 'warning';
        if (percentage >= 60) return 'caution';
        return 'normal';
    }

    // 获取预算警告图标
    getBudgetWarningIcon(percentage) {
        if (percentage >= 100) return '<i class="fas fa-exclamation-triangle" style="color: #e53e3e;"></i>';
        if (percentage >= 80) return '<i class="fas fa-exclamation-circle" style="color: #dd6b20;"></i>';
        if (percentage >= 60) return '<i class="fas fa-info-circle" style="color: #3182ce;"></i>';
        return '';
    }

    // 获取预算警告消息
    getBudgetWarningMessage(category, percentage, remaining) {
        const categoryName = this.getCategoryName(category);
        
        if (percentage >= 100) {
            return `<div class="warning-message danger">
                <i class="fas fa-exclamation-triangle"></i>
                ${categoryName}预算已超支！建议减少此类消费或调整预算分配。
            </div>`;
        }
        
        if (percentage >= 80) {
            return `<div class="warning-message warning">
                <i class="fas fa-exclamation-circle"></i>
                ${categoryName}预算已用${percentage}%，剩余¥${remaining.toFixed(2)}，请注意控制支出。
            </div>`;
        }
        
        if (percentage >= 60) {
            return `<div class="warning-message caution">
                <i class="fas fa-info-circle"></i>
                ${categoryName}预算已用${percentage}%，建议合理安排后续支出。
            </div>`;
        }
        
        return '';
    }



    getMonthlyExpensesByCategory() {
        // 从交易记录中获取当月各分类支出
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const expensesByCategory = {};
        
        // 如果应用实例存在并且有交易记录
        if (this.app && this.app.transactions && Array.isArray(this.app.transactions)) {
            this.app.transactions
                .filter(transaction => {
                    // 确保交易有必要的字段
                    if (!transaction || !transaction.date || !transaction.type || !transaction.category) {
                        return false;
                    }
                    
                    const transactionDate = new Date(transaction.date);
                    // 筛选本月支出
                    return transaction.type === 'expense' &&
                           transactionDate.getMonth() === currentMonth &&
                           transactionDate.getFullYear() === currentYear;
                })
                .forEach(transaction => {
                    const category = transaction.category;
                    const amount = parseFloat(transaction.amount) || 0;
                    
                    if (!expensesByCategory[category]) {
                        expensesByCategory[category] = 0;
                    }
                    expensesByCategory[category] += amount;
                });
        }
        
        return expensesByCategory;
    }

    // 手机模式弹窗系统 - 与账户设置弹窗保持一致
    showMobileModal(title, content, options = {}) {
        const {
            showCloseButton = true
        } = options;
        
        // 清理之前的弹窗
        this.hideMobileModal();
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    ${showCloseButton ? `
                        <button class="modal-close" onclick="studentModePage.hideMobileModal()">×</button>
                    ` : ''}
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideMobileModal();
            }
        });

        document.body.appendChild(modal);
        this.currentMobileModal = modal;
    }

    // 隐藏手机模式弹窗
    hideMobileModal() {
        if (this.currentMobileModal) {
            document.body.removeChild(this.currentMobileModal);
            this.currentMobileModal = null;
        }
    }

    // 模态框方法（保持兼容性）
    showModal(title, content) {
        this.showMobileModal(title, content);
    }

    hideModal() {
        if (this.currentModal) {
            document.body.removeChild(this.currentModal);
            this.currentModal = null;
        }
    }

    // 显示手机风格的确认弹窗
    showMobileConfirmDialog(title, message, onConfirm) {
        const modal = document.createElement('div');
        modal.className = 'mobile-confirm-dialog';
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
            <div class="mobile-dialog-content" style="
                background: white;
                border-radius: 12px;
                width: 280px;
                max-width: 90vw;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                overflow: hidden;
                animation: slideUp 0.3s ease-out;
            ">
                <div class="dialog-header" style="
                    padding: 20px 20px 10px;
                    text-align: center;
                    border-bottom: 1px solid #f0f0f0;
                ">
                    <h3 style="margin: 0; font-size: 16px; color: #333; font-weight: 600;">${title}</h3>
                </div>
                <div class="dialog-body" style="
                    padding: 20px;
                    text-align: center;
                    color: #666;
                    font-size: 14px;
                    line-height: 1.5;
                ">
                    ${message}
                </div>
                <div class="dialog-actions" style="
                    display: flex;
                    border-top: 1px solid #f0f0f0;
                ">
                    <button class="dialog-btn cancel-btn" style="
                        flex: 1;
                        padding: 15px;
                        border: none;
                        background: transparent;
                        color: #666;
                        font-size: 16px;
                        cursor: pointer;
                        border-right: 1px solid #f0f0f0;
                        transition: background 0.2s;
                    " onclick="studentModePage.hideMobileConfirmDialog()">取消</button>
                    <button class="dialog-btn confirm-btn" style="
                        flex: 1;
                        padding: 15px;
                        border: none;
                        background: transparent;
                        color: #007AFF;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: background 0.2s;
                    " onclick="studentModePage.executeMobileConfirm()">删除</button>
                </div>
            </div>
        `;

        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(50px) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            .dialog-btn:hover {
                background: #f8f9fa !important;
            }
            .confirm-btn:hover {
                background: #fff5f5 !important;
            }
        `;
        document.head.appendChild(style);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideMobileConfirmDialog();
            }
        });

        document.body.appendChild(modal);
        this.currentMobileConfirm = {
            modal: modal,
            onConfirm: onConfirm,
            style: style
        };
    }

    // 隐藏手机确认弹窗
    hideMobileConfirmDialog() {
        if (this.currentMobileConfirm) {
            const { modal, style } = this.currentMobileConfirm;
            if (modal && modal.parentNode) {
                document.body.removeChild(modal);
            }
            if (style && style.parentNode) {
                document.head.removeChild(style);
            }
            this.currentMobileConfirm = null;
        }
    }

    // 执行确认操作
    executeMobileConfirm() {
        if (this.currentMobileConfirm && this.currentMobileConfirm.onConfirm) {
            this.currentMobileConfirm.onConfirm();
        }
        this.hideMobileConfirmDialog();
    }

    // 删除方法
    deletePartTimeJob(jobId) {
        const job = this.partTimeJobs.find(job => job.id === jobId);
        if (!job) return;
        
        // 显示手机风格的确认弹窗
        this.showMobileConfirmDialog('删除确认', '确定要删除这条兼职记录吗？', () => {
            this.confirmDeletePartTimeJob(jobId, job);
        });
    }

    // 确认删除兼职记录
    async confirmDeletePartTimeJob(jobId, job) {
        this.partTimeJobs = this.partTimeJobs.filter(job => job.id !== jobId);
        localStorage.setItem('student_part_time_jobs', JSON.stringify(this.partTimeJobs));
        
        // 同步删除对应的交易记录（如果是已到账的收入）
        if (job.status === 'completed') {
            await this.syncDeleteTransaction(job);
        }
        
        // 立即刷新显示
        this.refreshPartTimeDisplay();
        this.app.showToast('兼职记录已删除');
    }

    // 刷新兼职收入显示
    refreshPartTimeDisplay() {
        // 刷新兼职收入统计
        const partTimeSummary = document.querySelector('.part-time-summary');
        if (partTimeSummary) {
            partTimeSummary.innerHTML = `
                <div class="summary-stats">
                    <div class="stat-item">
                        <div class="stat-value">¥${this.getMonthlyPartTimeIncome()}</div>
                        <div class="stat-label">本月兼职收入</div>
                    </div>
                </div>
            `;
        }
        
        // 刷新兼职记录列表
        const partTimeList = document.getElementById('part-time-list');
        if (partTimeList) {
            partTimeList.innerHTML = this.renderPartTimeJobs();
        }
    }

    // 同步删除对应的交易记录
    async syncDeleteTransaction(job) {
        try {
            // 获取交易记录
            const transactions = this.app.transactions || [];
            
            // 查找精确匹配的交易记录
            const transactionIndex = transactions.findIndex(transaction => {
                // 构建兼职记录对应的交易描述格式
                const expectedDescription = `${job.source} - ${job.description || '兼职收入'}`;
                
                return transaction.type === 'income' && 
                       transaction.category === '兼职收入' &&
                       transaction.amount === job.amount &&
                       new Date(transaction.date).toDateString() === new Date(job.date).toDateString() &&
                       transaction.description === expectedDescription;
            });
            
            if (transactionIndex !== -1) {
                // 删除对应的交易记录
                this.app.deleteTransaction(transactionIndex);
                console.log('已同步删除对应的交易记录');
            }
            
            // 同步删除数据库中的对应交易记录
            try {
                if (typeof modeDatabase !== 'undefined' && modeDatabase) {
                    // 获取数据库中的交易记录
                    const dbTransactions = await modeDatabase.getUserTransactions();
                    
                    // 查找匹配的数据库记录
                    const dbTransaction = dbTransactions.find(transaction => {
                        const expectedDescription = `${job.source} - ${job.description || '兼职收入'}`;
                        
                        return transaction.type === 'income' && 
                               transaction.category === '兼职收入' &&
                               transaction.amount === job.amount &&
                               new Date(transaction.date).toDateString() === new Date(job.date).toDateString() &&
                               transaction.description === expectedDescription;
                    });
                    
                    if (dbTransaction) {
                        // 这里需要实现数据库删除逻辑
                        // 由于modeDatabase没有提供删除方法，我们暂时记录日志
                        console.log('需要删除数据库中的兼职收入记录:', dbTransaction);
                        // TODO: 实现数据库删除功能
                    }
                }
            } catch (dbError) {
                console.error('同步删除数据库记录失败:', dbError);
            }
        } catch (error) {
            console.error('同步删除交易记录失败:', error);
        }
    }

    deleteGoal(goalId) {
        // 查找要删除的目标
        const goal = this.examGoals.find(g => g.id === goalId);
        if (!goal) return;
        
        // 显示手机风格的确认弹窗
        this.showMobileConfirmDialog('删除确认', '确定要删除这个储蓄目标吗？', () => {
            this.confirmDeleteGoal(goalId);
        });
    }
    
    // 确认删除储蓄目标
    confirmDeleteGoal(goalId) {
        this.examGoals = this.examGoals.filter(goal => goal.id !== goalId);
        localStorage.setItem('student_exam_goals', JSON.stringify(this.examGoals));
        
        document.getElementById('exam-goals-list').innerHTML = this.renderExamGoals();
        this.app.showToast('储蓄目标已删除');
    }

    // 储蓄计划相关辅助方法
    getActiveGoalsCount() {
        return this.examGoals.filter(goal => goal.currentAmount < goal.amount).length;
    }

    getTotalSavings() {
        return this.examGoals.reduce((total, goal) => total + goal.currentAmount, 0);
    }

    getAverageProgress() {
        if (this.examGoals.length === 0) return 0;
        const totalProgress = this.examGoals.reduce((sum, goal) => {
            return sum + (goal.currentAmount / goal.amount * 100);
        }, 0);
        return totalProgress / this.examGoals.length;
    }

    getSavingsRecommendations() {
        const recommendations = [];
        const activeGoals = this.examGoals.filter(goal => goal.currentAmount < goal.amount);
        
        if (activeGoals.length === 0) {
            recommendations.push({
                icon: 'fa-star',
                message: '太棒了！所有储蓄目标都已完成，考虑设置新的目标吧！',
                priority: 'success'
            });
            return recommendations;
        }

        // 检查紧急目标
        const urgentGoals = activeGoals.filter(goal => {
            const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
            return daysLeft <= 7 && daysLeft > 0;
        });

        if (urgentGoals.length > 0) {
            recommendations.push({
                icon: 'fa-exclamation-triangle',
                message: `有${urgentGoals.length}个目标即将到期，建议优先储蓄`,
                priority: 'urgent'
            });
        }

        // 检查储蓄进度
        const slowGoals = activeGoals.filter(goal => {
            const progress = goal.currentAmount / goal.amount * 100;
            const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
            const daysTotal = Math.ceil((new Date(goal.deadline) - new Date(goal.createdAt)) / (1000 * 60 * 60 * 24));
            const expectedProgress = ((daysTotal - daysLeft) / daysTotal) * 100;
            return progress < expectedProgress * 0.8;
        });

        if (slowGoals.length > 0) {
            recommendations.push({
                icon: 'fa-chart-line',
                message: `${slowGoals.length}个目标进度偏慢，建议增加储蓄频率`,
                priority: 'warning'
            });
        }

        // 自动储蓄建议
        const nonAutoGoals = activeGoals.filter(goal => !goal.autoSave);
        if (nonAutoGoals.length > 0) {
            recommendations.push({
                icon: 'fa-robot',
                message: '开启自动储蓄可以帮助你更好地完成目标',
                priority: 'info'
            });
        }

        // 默认建议
        if (recommendations.length === 0) {
            recommendations.push({
                icon: 'fa-thumbs-up',
                message: '储蓄进度良好，继续保持！',
                priority: 'success'
            });
        }

        return recommendations;
    }

    getSavingsVelocity(goal) {
        const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        const remaining = goal.amount - goal.currentAmount;
        const dailyNeed = remaining / Math.max(daysLeft, 1);
        
        // 计算最近7天的储蓄速度
        const recentSavings = this.getRecentSavingsRate(goal);
        
        if (recentSavings >= dailyNeed * 1.2) {
            return { status: 'fast', icon: '🚀', text: '进度超前' };
        } else if (recentSavings >= dailyNeed * 0.8) {
            return { status: 'normal', icon: '✅', text: '进度正常' };
        } else {
            return { status: 'slow', icon: '⚠️', text: '需要加速' };
        }
    }

    getRecentSavingsRate(goal) {
        // 简化计算，实际应该基于交易记录
        const daysSinceCreated = Math.ceil((new Date() - new Date(goal.createdAt)) / (1000 * 60 * 60 * 24));
        return goal.currentAmount / Math.max(daysSinceCreated, 1);
    }

    getMotivationMessage(goal, progress, daysLeft) {
        if (progress >= 90) {
            return {
                type: 'success',
                icon: 'fa-trophy',
                text: '马上就要完成了！最后冲刺！'
            };
        } else if (progress >= 75) {
            return {
                type: 'success',
                icon: 'fa-star',
                text: '进度很棒！继续保持这个节奏！'
            };
        } else if (daysLeft <= 7) {
            return {
                type: 'urgent',
                icon: 'fa-clock',
                text: '时间紧迫，建议加大储蓄力度！'
            };
        } else if (progress >= 50) {
            return {
                type: 'normal',
                icon: 'fa-chart-line',
                text: '进度过半，继续努力！'
            };
        } else {
            return {
                type: 'info',
                icon: 'fa-lightbulb',
                text: '每天存一点，积少成多！'
            };
        }
    }

    // 快速储蓄功能
    quickSave(goalId) {
        const goal = this.examGoals.find(g => g.id === goalId);
        if (!goal) return;

        const weeklyNeed = this.calculateWeeklyNeed(goal);
        const quickAmount = Math.min(50, Math.ceil(weeklyNeed));
        const remaining = goal.amount - goal.currentAmount;
        const actualAmount = Math.min(quickAmount, remaining);

        goal.currentAmount += actualAmount;
        localStorage.setItem('student_exam_goals', JSON.stringify(this.examGoals));

        // 添加支出记录
        this.app.addTransaction({
            type: 'expense',
            amount: actualAmount,
            category: '储蓄',
            description: `${goal.name} - 快速储蓄`,
            date: new Date().toISOString().split('T')[0]
        });

        document.getElementById('exam-goals-list').innerHTML = this.renderExamGoals();
        
        if (goal.currentAmount >= goal.amount) {
            this.app.showToast(`🎉 恭喜！${goal.name}目标已完成！`);
        } else {
            this.app.showToast(`已存入¥${actualAmount}到${goal.name}`);
        }
    }

    // 储蓄分析
    showSavingsAnalysis() {
        const totalSavings = this.getTotalSavings();
        const activeGoals = this.examGoals.filter(goal => goal.currentAmount < goal.amount);
        const completedGoals = this.examGoals.filter(goal => goal.currentAmount >= goal.amount);
        
        this.showMobileModal('储蓄分析报告', `
            <div style="padding: 0;">
                <div class="analysis-overview" style="margin-bottom: 20px;">
                    <h4 style="margin: 0 0 15px 0; font-size: 16px; color: #333;">储蓄概览</h4>
                    <div class="stats-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div class="stat-card" style="padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center;">
                            <div class="stat-number" style="font-size: 18px; font-weight: 600; color: #007AFF;">¥${totalSavings.toFixed(2)}</div>
                            <div class="stat-label" style="font-size: 12px; color: #666; margin-top: 5px;">总储蓄金额</div>
                        </div>
                        <div class="stat-card" style="padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center;">
                            <div class="stat-number" style="font-size: 18px; font-weight: 600; color: #007AFF;">${this.examGoals.length}</div>
                            <div class="stat-label" style="font-size: 12px; color: #666; margin-top: 5px;">储蓄目标数</div>
                        </div>
                        <div class="stat-card" style="padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center;">
                            <div class="stat-number" style="font-size: 18px; font-weight: 600; color: #007AFF;">${completedGoals.length}</div>
                            <div class="stat-label" style="font-size: 12px; color: #666; margin-top: 5px;">已完成目标</div>
                        </div>
                        <div class="stat-card" style="padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center;">
                            <div class="stat-number" style="font-size: 18px; font-weight: 600; color: #007AFF;">${this.getAverageProgress().toFixed(1)}%</div>
                            <div class="stat-label" style="font-size: 12px; color: #666; margin-top: 5px;">平均进度</div>
                        </div>
                    </div>
                </div>
                
                <div class="goals-breakdown">
                    <h4 style="margin: 0 0 15px 0; font-size: 16px; color: #333;">目标分析</h4>
                    ${this.examGoals.map(goal => {
                        const progress = (goal.currentAmount / goal.amount * 100).toFixed(1);
                        const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                        return `
                            <div class="goal-analysis-item" style="margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                                <div class="goal-name" style="font-weight: 500; margin-bottom: 8px; color: #333;">${goal.name}</div>
                                <div class="goal-progress" style="margin-bottom: 8px;">
                                    <div class="progress-bar" style="height: 6px; background: #e9ecef; border-radius: 3px; overflow: hidden;">
                                        <div class="progress-fill" style="height: 100%; background: #007AFF; width: ${progress}%;"></div>
                                    </div>
                                    <span style="font-size: 12px; color: #666; margin-top: 5px; display: block;">${progress}% (¥${goal.currentAmount}/¥${goal.amount})</span>
                                </div>
                                <div class="goal-status" style="font-size: 12px; font-weight: 500;">
                                    ${goal.currentAmount >= goal.amount ? '✅ 已完成' : 
                                      daysLeft <= 0 ? '⚠️ 已逾期' :
                                      daysLeft <= 7 ? '🔥 紧急' : '📅 进行中'}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="button-group" style="margin-top: 20px;">
                    <button class="btn btn-secondary" onclick="studentModePage.hideMobileModal()" 
                            style="width: 100%; padding: 12px; background: #f5f5f5; color: #666; border: none; border-radius: 8px; font-size: 16px;">关闭</button>
                </div>
            </div>
        `);
    }

    // 自动储蓄设置
    showAutoSaveSettings() {
        this.showMobileModal('自动储蓄设置', `
            <div style="padding: 0;">
                <div class="auto-save-info" style="margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0; font-size: 16px; color: #333;">自动储蓄功能</h4>
                    <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.5;">开启后，系统会根据你的储蓄目标自动从生活费中划扣相应金额。</p>
                </div>
                
                <div class="goals-auto-save" style="margin-bottom: 20px;">
                    <h5 style="margin: 0 0 15px 0; font-size: 14px; color: #333;">储蓄目标设置</h5>
                    ${this.examGoals.map(goal => {
                        const weeklyNeed = this.calculateWeeklyNeed(goal);
                        return `
                            <div class="auto-save-item" style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px;">
                                <div class="goal-info">
                                    <h6 style="margin: 0 0 5px 0; font-size: 14px; color: #333;">${goal.name}</h6>
                                    <p style="margin: 0; font-size: 12px; color: #666;">建议每周存入: ¥${weeklyNeed}</p>
                                </div>
                                <label class="switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
                                    <input type="checkbox" ${goal.autoSave ? 'checked' : ''} 
                                           onchange="studentModePage.toggleAutoSave('${goal.id}', this.checked)"
                                           style="opacity: 0; width: 0; height: 0;">
                                    <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px;"></span>
                                    <span class="slider:before" style="position: absolute; content: ''; height: 16px; width: 16px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%;"></span>
                                </label>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="auto-save-schedule" style="margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">自动储蓄时间</h4>
                    <select id="auto-save-day" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; background: white;">
                        <option value="1">每周一</option>
                        <option value="5">每周五</option>
                        <option value="0">每周日</option>
                    </select>
                </div>
                
                <div class="button-group" style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" onclick="studentModePage.saveAutoSaveSettings()" 
                            style="flex: 1; padding: 12px; background: #007AFF; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 500;">保存设置</button>
                    <button class="btn btn-secondary" onclick="studentModePage.hideMobileModal()" 
                            style="flex: 1; padding: 12px; background: #f5f5f5; color: #666; border: none; border-radius: 8px; font-size: 16px;">取消</button>
                </div>
            </div>
        `);
        
        // 添加开关样式
        setTimeout(() => {
            const checkboxes = document.querySelectorAll('.auto-save-item input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                const slider = checkbox.nextElementSibling;
                
                checkbox.addEventListener('change', function() {
                    if (this.checked) {
                        slider.style.backgroundColor = '#007AFF';
                    } else {
                        slider.style.backgroundColor = '#ccc';
                    }
                });
                
                // 初始化开关状态
                if (checkbox.checked) {
                    slider.style.backgroundColor = '#007AFF';
                }
            });
        }, 100);
    }

    toggleAutoSave(goalId, enabled) {
        const goal = this.examGoals.find(g => g.id === goalId);
        if (goal) {
            goal.autoSave = enabled;
            localStorage.setItem('student_exam_goals', JSON.stringify(this.examGoals));
        }
    }

    saveAutoSaveSettings() {
        localStorage.setItem('student_exam_goals', JSON.stringify(this.examGoals));
        this.hideMobileModal();
        this.app.showToast('自动储蓄设置已保存');
    }
}

// 全局变量
let studentModePage;