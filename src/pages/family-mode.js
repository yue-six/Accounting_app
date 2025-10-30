class FamilyModePage {
    constructor(app) {
        this.app = app;
        this.currentModal = null;
        this.currentBottomModal = null;
        this.modeDatabase = null;
        this.familySettings = {};
        this.familyMembers = [];
        this.familyTransactions = [];
        this.familyBudgets = {};
        this.currentUser = { name: "我", role: "admin", id: "default", canPersonalExpense: true };
        this.initDatabase();
    }

    // 初始化数据库连接
    async initDatabase() {
        try {
            // 检查是否支持数据库
            if (typeof modeDatabase !== 'undefined') {
                this.modeDatabase = modeDatabase;
                await this.loadFamilyDataFromDatabase();
            } else {
                // 降级到本地存储
                this.loadFamilyDataFromLocalStorage();
            }
        } catch (e) {
            console.error('初始化数据库失败:', e);
            this.loadFamilyDataFromLocalStorage();
        }
    }

    // 从数据库加载家庭模式数据
    async loadFamilyDataFromDatabase() {
        try {
            // 获取家庭模式设置
            this.familySettings = await this.modeDatabase.getFamilyModeSettings() || {};
            
            // 获取家庭成员（从设置中提取）
            this.familyMembers = this.familySettings.family_members || [];
            
            // 获取家庭交易记录
            if (this.familySettings.id) {
                this.familyTransactions = await this.modeDatabase.getFamilyTransactions(this.familySettings.id) || [];
            }
            
            // 获取家庭预算
            this.familyBudgets = this.familySettings.budgets || {};
            
            // 获取当前用户
            this.currentUser = this.familySettings.current_user || { name: "我", role: "admin", id: "default", canPersonalExpense: true };
            
            console.log('✅ 家庭数据已从数据库加载');
        } catch (e) {
            console.error('从数据库加载家庭数据失败:', e);
            this.loadFamilyDataFromLocalStorage();
        }
    }

    // 从本地存储加载家庭模式数据
    loadFamilyDataFromLocalStorage() {
        try {
            this.familySettings = JSON.parse(localStorage.getItem('family_mode_settings') || '{}');
            this.familyMembers = JSON.parse(localStorage.getItem('family_members') || '[]');
            this.familyTransactions = JSON.parse(localStorage.getItem('family_transactions') || '[]');
            this.familyBudgets = JSON.parse(localStorage.getItem('family_budgets') || '{}');
            this.currentUser = JSON.parse(localStorage.getItem('current_family_user') || '{"name": "我", "role": "admin", "id": "default", "canPersonalExpense": true}');
        } catch (e) {
            console.error('加载家庭模式数据失败:', e);
        }
    }

    // 保存家庭数据到数据库
    async saveFamilyDataToDatabase() {
        try {
            if (!this.modeDatabase) return;
            
            // 更新家庭设置
            const settingsToSave = {
                ...this.familySettings,
                family_members: this.familyMembers,
                budgets: this.familyBudgets,
                current_user: this.currentUser,
                updated_at: new Date().toISOString()
            };
            
            await this.modeDatabase.saveFamilyModeSettings(settingsToSave);
            
            // 保存交易记录
            if (this.familySettings.id && this.familyTransactions.length > 0) {
                await this.modeDatabase.saveFamilyTransactions(this.familySettings.id, this.familyTransactions);
            }
            
            console.log('✅ 家庭数据已保存到数据库');
        } catch (e) {
            console.error('保存家庭数据到数据库失败:', e);
            // 降级到本地存储
            this.saveFamilyDataToLocalStorage();
        }
    }

    // 保存家庭数据到本地存储
    saveFamilyDataToLocalStorage() {
        try {
            localStorage.setItem('family_mode_settings', JSON.stringify(this.familySettings));
            localStorage.setItem('family_members', JSON.stringify(this.familyMembers));
            localStorage.setItem('family_transactions', JSON.stringify(this.familyTransactions));
            localStorage.setItem('family_budgets', JSON.stringify(this.familyBudgets));
            localStorage.setItem('current_family_user', JSON.stringify(this.currentUser));
        } catch (e) {
            console.error('保存家庭数据到本地存储失败:', e);
        }
    }

    // 渲染页面
    render() {
        return `
            <div class="page active" id="family-mode-page">
                <div class="page-header">
                    <h2><i class="fas fa-home"></i> 家庭模式</h2>
                    <p>多人共同管理家庭财务</p>
                </div>

                <!-- 家庭概览 -->
                <div class="card">
                    <h3><i class="fas fa-chart-line"></i> 家庭财务概览</h3>
                    <div class="family-overview">
                        <div class="overview-stats">
                            <div class="stat-card">
                                <div class="stat-value">¥${this.getFamilyBalance().toFixed(2)}</div>
                                <div class="stat-label">家庭总余额</div>
                                <div class="stat-trend ${this.getBalanceTrend().direction}">${this.getBalanceTrend().text}</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">¥${this.getTodayFamilyExpense().toFixed(2)}</div>
                                <div class="stat-label">今日共同支出</div>
                                <div class="stat-comparison">昨日: ¥${this.getYesterdayFamilyExpense().toFixed(2)}</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">¥${this.getMonthlyFamilyIncome().toFixed(2)}</div>
                                <div class="stat-label">本月家庭收入</div>
                                <div class="stat-comparison">上月: ¥${this.getLastMonthIncome().toFixed(2)}</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">¥${this.getMonthlyFamilyExpense().toFixed(2)}</div>
                                <div class="stat-label">本月家庭支出</div>
                                <div class="stat-comparison">预算: ¥${this.getMonthlyBudget().toFixed(2)}</div>
                            </div>
                        </div>
                        
                        <!-- 家庭财务健康度 -->
                        <div class="family-health">
                            <h4><i class="fas fa-heartbeat"></i> 家庭财务健康度</h4>
                            <div class="health-indicators">
                                <div class="health-item">
                                    <div class="health-label">储蓄率</div>
                                    <div class="health-bar">
                                        <div class="health-fill ${this.getSavingsRateLevel()}" style="width: ${this.getSavingsRate()}%"></div>
                                    </div>
                                    <div class="health-value">${this.getSavingsRate().toFixed(1)}%</div>
                                </div>
                                <div class="health-item">
                                    <div class="health-label">预算执行</div>
                                    <div class="health-bar">
                                        <div class="health-fill ${this.getBudgetExecutionLevel()}" style="width: ${this.getBudgetExecution()}%"></div>
                                    </div>
                                    <div class="health-value">${this.getBudgetExecution().toFixed(1)}%</div>
                                </div>
                                <div class="health-item">
                                    <div class="health-label">收支平衡</div>
                                    <div class="health-bar">
                                        <div class="health-fill ${this.getBalanceLevel()}" style="width: ${this.getBalanceScore()}%"></div>
                                    </div>
                                    <div class="health-value">${this.getBalanceScore().toFixed(1)}%</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 智能建议 -->
                        <div class="family-suggestions">
                            <h4><i class="fas fa-lightbulb"></i> 智能建议</h4>
                            <div class="suggestion-list">
                                ${this.getFamilyRecommendations().map(rec => `
                                    <div class="suggestion-item ${rec.priority}">
                                        <i class="fas ${rec.icon}"></i>
                                        <span>${rec.message}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 家庭成员管理 -->
                <div class="card">
                    <h3><i class="fas fa-users"></i> 家庭成员管理</h3>
                    
                    <!-- 成员概览 -->
                    <div class="members-overview">
                        <div class="overview-stats">
                            <div class="stat-item">
                                <div class="stat-number">${this.getFamilyMembers().length}</div>
                                <div class="stat-label">家庭成员</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">${this.getActiveMembers()}</div>
                                <div class="stat-label">活跃成员</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">¥${this.getAverageExpensePerMember().toFixed(0)}</div>
                                <div class="stat-label">人均支出</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="current-user">
                        <div class="user-info">
                            <span class="user-name">${this.currentUser.name}</span>
                            <span class="user-role">${this.getRoleText(this.currentUser.role)}</span>
                        </div>
                        <button class="btn btn-secondary btn-sm" onclick="familyModePage.switchUser()">切换用户</button>
                    </div>
                    
                    <!-- 成员列表 -->
                    <div class="family-members">
                        <div class="members-header">
                            <div class="members-tabs">
                                <button class="tab-btn active" onclick="familyModePage.switchMemberTab('all')">全部成员</button>
                                <button class="tab-btn" onclick="familyModePage.switchMemberTab('analysis')">消费分析</button>
                                <button class="tab-btn" onclick="familyModePage.switchMemberTab('permissions')">权限管理</button>
                            </div>
                        </div>
                        
                        <div id="members-tab-all" class="tab-content active">
                            <div class="family-members-list" id="family-members-list">
                                ${this.renderFamilyMembers()}
                            </div>
                        </div>
                        
                        <div id="members-tab-analysis" class="tab-content">
                            <div class="member-analysis">
                                ${this.renderMemberAnalysis()}
                            </div>
                        </div>
                        
                        <div id="members-tab-permissions" class="tab-content">
                            <div class="permission-management">
                                ${this.renderPermissionManagement()}
                            </div>
                        </div>
                        
                        <div class="member-actions">
                            ${this.currentUser.role === 'admin' ? `
                                <button class="btn btn-primary" onclick="familyModePage.showAddMember()">
                                    <i class="fas fa-user-plus"></i> 邀请成员
                                </button>
                                <button class="btn btn-secondary" onclick="familyModePage.showMemberInvite()">
                                    <i class="fas fa-share-alt"></i> 邀请加入
                                </button>
                                <button class="btn btn-outline" onclick="familyModePage.exportMemberData()">
                                    <i class="fas fa-download"></i> 导出数据
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- 快速记账 -->
                <div class="card">
                    <h3><i class="fas fa-plus-circle"></i> 智能记账</h3>
                    <div class="quick-transaction">
                        <div class="transaction-type-tabs">
                            <button class="tab-btn active" data-type="expense" onclick="familyModePage.switchTransactionType('expense')">
                                <i class="fas fa-minus-circle"></i> 支出
                            </button>
                            <button class="tab-btn" data-type="income" onclick="familyModePage.switchTransactionType('income')">
                                <i class="fas fa-plus-circle"></i> 收入
                            </button>
                        </div>
                        
                        <!-- 快捷金额 -->
                        <div class="quick-amounts">
                            <div class="amount-label">常用金额</div>
                            <div class="amount-buttons">
                                <button class="amount-btn" onclick="familyModePage.setQuickAmount(10)">¥10</button>
                                <button class="amount-btn" onclick="familyModePage.setQuickAmount(50)">¥50</button>
                                <button class="amount-btn" onclick="familyModePage.setQuickAmount(100)">¥100</button>
                                <button class="amount-btn" onclick="familyModePage.setQuickAmount(500)">¥500</button>
                            </div>
                        </div>
                        
                        <div class="transaction-form" id="transaction-form">
                            <div class="input-group">
                                <label>金额</label>
                                <div class="amount-input-group">
                                    <input type="number" id="transaction-amount" placeholder="请输入金额" oninput="familyModePage.onAmountChange()">
                                    <button class="voice-btn" onclick="familyModePage.startVoiceInput()">
                                        <i class="fas fa-microphone"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- 消费场景 -->
                            <div class="input-group">
                                <label>消费场景</label>
                                <div class="scenario-tabs">
                                    <button class="scenario-btn active" data-scenario="daily" onclick="familyModePage.switchScenario('daily')">
                                        <i class="fas fa-home"></i> 日常生活
                                    </button>
                                    <button class="scenario-btn" data-scenario="special" onclick="familyModePage.switchScenario('special')">
                                        <i class="fas fa-star"></i> 特殊消费
                                    </button>
                                    <button class="scenario-btn" data-scenario="investment" onclick="familyModePage.switchScenario('investment')">
                                        <i class="fas fa-chart-line"></i> 投资理财
                                    </button>
                                </div>
                            </div>
                            
                            <div class="input-group">
                                <label>分类</label>
                                <div class="category-container">
                                    <select id="transaction-category" onchange="familyModePage.onCategoryChange()">
                                        ${this.renderCategoryOptions('expense')}
                                    </select>
                                    <div class="smart-suggestions" id="category-suggestions">
                                        <!-- 智能分类建议将在这里显示 -->
                                    </div>
                                </div>
                            </div>
                            
                            <div class="input-group">
                                <label>消费类型</label>
                                <div class="expense-type-buttons">
                                    <button class="type-btn active" data-type="family" onclick="familyModePage.selectExpenseType('family')">
                                        <i class="fas fa-users"></i> 家庭共同
                                    </button>
                                    <button class="type-btn" data-type="personal" onclick="familyModePage.selectExpenseType('personal')">
                                        <i class="fas fa-user"></i> 个人消费
                                    </button>
                                </div>
                            </div>
                            
                            <!-- 成员选择（家庭共同时显示） -->
                            <div class="input-group" id="member-selection" style="display: none;">
                                <label>消费成员</label>
                                <div class="member-checkboxes">
                                    <label class="member-checkbox">
                                        <input type="checkbox" name="members" value="${this.currentUser.id}" checked>
                                        <span class="checkmark"></span>
                                        <i class="fas fa-user-circle member-avatar"></i>
                                        <span class="member-name">${this.currentUser.name}</span>
                                    </label>
                                    ${this.familyMembers.map(member => `
                                        <label class="member-checkbox">
                                            <input type="checkbox" name="members" value="${member.id}">
                                            <span class="checkmark"></span>
                                            <i class="fas fa-user-circle member-avatar"></i>
                                            <span class="member-name">${member.name}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div class="input-group">
                                <label>描述</label>
                                <div class="note-input-group">
                                    <input type="text" id="transaction-description" placeholder="请输入描述" oninput="familyModePage.onNoteChange()">
                                    <button class="template-btn" onclick="familyModePage.showNoteTemplates()">
                                        <i class="fas fa-list"></i>
                                    </button>
                                </div>
                                <div class="note-templates" id="note-templates" style="display: none;">
                                    <button class="template-item" onclick="familyModePage.selectNoteTemplate('超市购物')">超市购物</button>
                                    <button class="template-item" onclick="familyModePage.selectNoteTemplate('外出就餐')">外出就餐</button>
                                    <button class="template-item" onclick="familyModePage.selectNoteTemplate('交通费用')">交通费用</button>
                                    <button class="template-item" onclick="familyModePage.selectNoteTemplate('生活用品')">生活用品</button>
                                </div>
                            </div>
                            
                            <!-- 智能提醒 -->
                            <div class="smart-reminder" id="smart-reminder" style="display: none;">
                                <div class="reminder-content">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    <span id="reminder-text"></span>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button class="btn btn-primary btn-block" onclick="familyModePage.addFamilyTransaction()">
                                    <i class="fas fa-check"></i> 记录交易
                                </button>
                                <button class="btn btn-secondary" onclick="familyModePage.saveAsDraft()">
                                    <i class="fas fa-save"></i> 保存草稿
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 消费分析 -->
                <div class="card">
                    <h3><i class="fas fa-chart-pie"></i> 消费分析</h3>
                    <div class="expense-analysis-tabs">
                        <button class="tab-btn active" onclick="familyModePage.showAnalysis('overview')">总览</button>
                        <button class="tab-btn" onclick="familyModePage.showAnalysis('personal')">个人消费</button>
                        <button class="tab-btn" onclick="familyModePage.showAnalysis('family')">家庭开支</button>
                        <button class="tab-btn" onclick="familyModePage.showAnalysis('members')">成员对比</button>
                    </div>
                    
                    <div class="analysis-content" id="analysis-content">
                        ${this.renderAnalysisOverview()}
                    </div>
                </div>

                <!-- 家庭预算 -->
                <div class="card">
                    <h3><i class="fas fa-calculator"></i> 家庭预算</h3>
                    <div class="budget-overview" id="budget-overview">
                        ${this.renderBudgetOverview()}
                    </div>
                    
                    ${this.currentUser.role === 'admin' ? `
                        <button class="btn btn-primary" onclick="familyModePage.showBudgetSettings()">
                            <i class="fas fa-cog"></i> 预算设置
                        </button>
                    ` : ''}
                </div>

                <!-- 家庭财务报告 -->
                <div class="card">
                    <h3><i class="fas fa-file-alt"></i> 家庭财务报告</h3>
                    <div class="report-actions">
                        <button class="btn btn-secondary" onclick="familyModePage.generateMonthlyReport()">
                            <i class="fas fa-calendar-alt"></i> 生成月度报告
                        </button>
                        <button class="btn btn-secondary" onclick="familyModePage.exportFamilyData()">
                            <i class="fas fa-download"></i> 导出数据
                        </button>
                    </div>
                    
                    <div class="recent-reports" id="recent-reports">
                        ${this.renderRecentReports()}
                    </div>
                </div>
            </div>
        `;
    }

    // 渲染家庭成员列表
    renderFamilyMembers() {
        if (this.familyMembers.length === 0) {
            return '<div class="empty-state">暂无其他家庭成员</div>';
        }

        return this.familyMembers.map(member => `
            <div class="member-item">
                <div class="member-info">
                    <div class="member-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="member-details">
                        <div class="member-name">${member.name}</div>
                        <div class="member-role">${this.getRoleText(member.role)}</div>
                    </div>
                </div>
                <div class="member-stats">
                    <div class="stat-item">
                        <span class="stat-value">¥${this.getMemberMonthlyExpense(member.id)}</span>
                        <span class="stat-label">本月支出</span>
                    </div>
                </div>
                ${this.currentUser.role === 'admin' && member.id !== this.currentUser.id ? `
                    <div class="member-actions">
                        <button class="btn btn-sm btn-secondary" onclick="familyModePage.editMember('${member.id}')">编辑</button>
                        <button class="btn btn-sm btn-danger" onclick="familyModePage.removeMember('${member.id}')">移除</button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    // 渲染分类选项
    renderCategoryOptions(type) {
        const categories = {
            expense: [
                '餐饮美食', '交通出行', '购物消费', '生活缴费', '医疗健康',
                '教育培训', '娱乐休闲', '房租房贷', '投资理财', '其他支出'
            ],
            income: [
                '工资收入', '兼职收入', '投资收益', '奖金补贴', '其他收入'
            ]
        };

        return categories[type].map(cat => 
            `<option value="${cat}">${cat}</option>`
        ).join('');
    }

    // 渲染分析概览
    renderAnalysisOverview() {
        const monthlyData = this.getMonthlyAnalysisData();
        
        return `
            <div class="analysis-overview">
                <div class="expense-breakdown">
                    <h4>本月支出构成</h4>
                    <div class="breakdown-chart">
                        <div class="chart-item">
                            <div class="chart-bar">
                                <div class="bar-fill family" style="width: ${monthlyData.familyPercentage}%"></div>
                            </div>
                            <div class="chart-label">
                                <span class="label-text">家庭开支</span>
                                <span class="label-value">¥${monthlyData.familyExpense} (${monthlyData.familyPercentage}%)</span>
                            </div>
                        </div>
                        <div class="chart-item">
                            <div class="chart-bar">
                                <div class="bar-fill personal" style="width: ${monthlyData.personalPercentage}%"></div>
                            </div>
                            <div class="chart-label">
                                <span class="label-text">个人消费</span>
                                <span class="label-value">¥${monthlyData.personalExpense} (${monthlyData.personalPercentage}%)</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="savings-analysis">
                    <h4>储蓄分析</h4>
                    <div class="savings-stats">
                        <div class="savings-item">
                            <span class="savings-label">本月结余</span>
                            <span class="savings-value ${monthlyData.balance >= 0 ? 'positive' : 'negative'}">
                                ¥${monthlyData.balance}
                            </span>
                        </div>
                        <div class="savings-item">
                            <span class="savings-label">储蓄率</span>
                            <span class="savings-value">${monthlyData.savingsRate}%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 渲染预算概览
    renderBudgetOverview() {
        if (Object.keys(this.familyBudgets).length === 0) {
            return '<div class="empty-state">暂未设置家庭预算</div>';
        }

        return Object.entries(this.familyBudgets).map(([category, budget]) => {
            const spent = this.getCategorySpent(category);
            const percentage = budget > 0 ? (spent / budget * 100).toFixed(1) : 0;
            const remaining = budget - spent;
            
            return `
                <div class="budget-item ${spent > budget ? 'over-budget' : ''}">
                    <div class="budget-header">
                        <span class="budget-category">${category}</span>
                        <span class="budget-amount">¥${spent} / ¥${budget}</span>
                    </div>
                    <div class="budget-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                        </div>
                        <span class="progress-text">${percentage}%</span>
                    </div>
                    <div class="budget-status">
                        ${remaining >= 0 ? 
                            `<span class="remaining">剩余 ¥${remaining.toFixed(2)}</span>` : 
                            `<span class="over-spent">超支 ¥${Math.abs(remaining).toFixed(2)}</span>`
                        }
                    </div>
                </div>
            `;
        }).join('');
    }

    // 渲染最近报告
    renderRecentReports() {
        const reports = JSON.parse(localStorage.getItem('family_reports') || '[]');
        
        if (reports.length === 0) {
            return '<div class="empty-state">暂无财务报告</div>';
        }

        return reports.slice(0, 3).map(report => `
            <div class="report-item">
                <div class="report-info">
                    <h4>${report.title}</h4>
                    <p>${report.period}</p>
                </div>
                <div class="report-actions">
                    <button class="btn btn-sm btn-secondary" onclick="familyModePage.viewReport('${report.id}')">查看</button>
                    <button class="btn btn-sm btn-primary" onclick="familyModePage.downloadReport('${report.id}')">下载</button>
                </div>
            </div>
        `).join('');
    }

    // 初始化事件
    initEvents() {
        familyModePage = this;
        this.loadFamilyData();
        this.currentTransactionType = 'expense';
        this.currentExpenseType = 'family';
    }

    // 切换交易类型
    switchTransactionType(type) {
        this.currentTransactionType = type;
        
        // 更新标签页状态
        document.querySelectorAll('.transaction-type-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
        
        // 更新分类选项
        document.getElementById('transaction-category').innerHTML = this.renderCategoryOptions(type);
        
        // 显示/隐藏消费类型选择
        const expenseTypeDiv = document.querySelector('.expense-type-buttons').parentElement;
        expenseTypeDiv.style.display = type === 'expense' ? 'block' : 'none';
    }

    // 选择消费类型
    selectExpenseType(type) {
        if (type === 'personal' && !this.currentUser.canPersonalExpense) {
            this.app.showToast('当前用户无个人消费权限', 'warning');
            return;
        }
        
        this.currentExpenseType = type;
        
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
    }

    // 添加家庭交易记录
    async addFamilyTransaction() {
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const category = document.getElementById('transaction-category').value;
        const description = document.getElementById('transaction-description').value;

        if (!amount || amount <= 0) {
            this.app.showToast('请输入有效金额');
            return;
        }

        const transaction = {
            id: Date.now().toString(),
            type: this.currentTransactionType,
            amount,
            category,
            description,
            expenseType: this.currentTransactionType === 'expense' ? this.currentExpenseType : null,
            memberId: this.currentUser.id,
            memberName: this.currentUser.name,
            date: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
        };

        this.familyTransactions.unshift(transaction);
        
        // 保存到数据库或本地存储
        if (this.modeDatabase) {
            await this.saveFamilyDataToDatabase();
        } else {
            localStorage.setItem('family_transactions', JSON.stringify(this.familyTransactions));
        }

        // 同时添加到主应用的交易记录
        this.app.addTransaction({
            type: this.currentTransactionType,
            amount,
            category,
            description: `[${this.currentExpenseType === 'family' ? '家庭' : '个人'}] ${description}`,
            date: transaction.date
        });

        // 清空表单
        document.getElementById('transaction-amount').value = '';
        document.getElementById('transaction-description').value = '';

        // 更新显示
        this.updateFamilyOverview();
        this.app.showToast('记录已添加');
    }

    // 显示添加成员对话框
    showAddMember() {
        this.showModal('邀请家庭成员', `
            <div style="padding: 20px;">
                <div class="input-group">
                    <label>成员姓名</label>
                    <input type="text" id="member-name" placeholder="请输入姓名">
                </div>
                <div class="input-group">
                    <label>关系</label>
                    <select id="member-relation">
                        <option value="spouse">配偶</option>
                        <option value="child">子女</option>
                        <option value="parent">父母</option>
                        <option value="other">其他</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>权限</label>
                    <select id="member-role">
                        <option value="member">成员（仅记账）</option>
                        <option value="admin">管理员（可编辑预算）</option>
                    </select>
                </div>
                <div class="button-group">
                    <button class="btn btn-primary" onclick="familyModePage.addFamilyMember()">邀请</button>
                    <button class="btn btn-secondary" onclick="familyModePage.hideModal()">取消</button>
                </div>
            </div>
        `);
    }

    // 添加家庭成员
    async addFamilyMember() {
        const name = document.getElementById('member-name').value;
        const relation = document.getElementById('member-relation').value;
        const role = document.getElementById('member-role').value;

        if (!name) {
            this.app.showToast('请输入成员姓名');
            return;
        }

        const member = {
            id: Date.now().toString(),
            name,
            relation,
            role,
            joinedAt: new Date().toISOString()
        };

        this.familyMembers.push(member);
        
        // 保存到数据库或本地存储
        if (this.modeDatabase) {
            await this.saveFamilyDataToDatabase();
        } else {
            localStorage.setItem('family_members', JSON.stringify(this.familyMembers));
        }

        document.getElementById('family-members-list').innerHTML = this.renderFamilyMembers();
        this.hideModal();
        this.app.showToast(`${name}已加入家庭账本`);
    }

    // 切换用户
    switchUser() {
        // 使用getFamilyMembers()方法确保包含管理员用户
        const allUsers = this.getFamilyMembers();
        
        this.showModal('切换用户', `
            <div style="padding: 20px;">
                <div class="user-list">
                    ${allUsers.map(user => `
                        <div class="user-option ${user.id === this.currentUser.id ? 'current' : ''}" 
                             onclick="familyModePage.selectUser('${user.id}')">
                            <div class="user-info">
                                <i class="fas fa-user-circle"></i>
                                <span class="user-name">${user.name}</span>
                                <span class="user-role">${this.getRoleText(user.role)}</span>
                            </div>
                            ${user.id === this.currentUser.id ? '<i class="fas fa-check"></i>' : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="button-group">
                    <button class="btn btn-secondary" onclick="familyModePage.hideModal()">取消</button>
                </div>
            </div>
        `);
    }

    // 选择用户
    async selectUser(userId) {
        // 使用getFamilyMembers()方法确保包含管理员用户
        const allUsers = this.getFamilyMembers();
        const selectedUser = allUsers.find(user => user.id === userId);
        
        if (selectedUser) {
            this.currentUser = selectedUser;
            
            // 保存到数据库或本地存储
            if (this.modeDatabase) {
                await this.saveFamilyDataToDatabase();
            } else {
                localStorage.setItem('current_family_user', JSON.stringify(this.currentUser));
            }
            
            // 重新渲染页面
            document.getElementById('family-mode-page').innerHTML = this.render().replace('<div class="page active" id="family-mode-page">', '').replace('</div>', '');
            this.hideBottomModal();
            this.app.showToast(`已切换到 ${selectedUser.name}`);
        }
    }

    // 显示预算设置
    showBudgetSettings() {
        const categories = ['餐饮美食', '交通出行', '购物消费', '生活缴费', '医疗健康', '教育培训', '娱乐休闲'];
        
        this.showModal('家庭预算设置', `
            <div style="padding: 20px;">
                <div class="budget-settings">
                    ${categories.map(category => `
                        <div class="input-group">
                            <label>${category}</label>
                            <input type="number" id="budget-${category}" 
                                   value="${this.familyBudgets[category] || ''}" 
                                   placeholder="请输入预算金额">
                        </div>
                    `).join('')}
                </div>
                <div class="button-group">
                    <button class="btn btn-primary" onclick="familyModePage.saveBudgetSettings()">保存</button>
                    <button class="btn btn-secondary" onclick="familyModePage.hideModal()">取消</button>
                </div>
            </div>
        `);
    }

    // 保存预算设置
    async saveBudgetSettings() {
        const categories = ['餐饮美食', '交通出行', '购物消费', '生活缴费', '医疗健康', '教育培训', '娱乐休闲'];
        
        categories.forEach(category => {
            const amount = parseFloat(document.getElementById(`budget-${category}`).value) || 0;
            if (amount > 0) {
                this.familyBudgets[category] = amount;
            } else {
                delete this.familyBudgets[category];
            }
        });

        // 保存到数据库或本地存储
        if (this.modeDatabase) {
            await this.saveFamilyDataToDatabase();
        } else {
            localStorage.setItem('family_budgets', JSON.stringify(this.familyBudgets));
        }
        
        document.getElementById('budget-overview').innerHTML = this.renderBudgetOverview();
        
        this.hideModal();
        this.app.showToast('预算设置已保存');
    }

    // 生成月度报告
    generateMonthlyReport() {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        
        const reportData = this.generateReportData(year, month);
        const report = {
            id: Date.now().toString(),
            title: `${year}年${month}月家庭财务报告`,
            period: `${year}-${month.toString().padStart(2, '0')}`,
            data: reportData,
            generatedAt: new Date().toISOString()
        };

        // 保存报告
        const reports = JSON.parse(localStorage.getItem('family_reports') || '[]');
        reports.unshift(report);
        localStorage.setItem('family_reports', JSON.stringify(reports));

        // 显示报告
        this.showReportModal(report);
    }

    // 显示报告模态框
    showReportModal(report) {
        this.showModal(report.title, `
            <div style="padding: 20px; max-height: 500px; overflow-y: auto;">
                <div class="report-content">
                    <h4>收支明细</h4>
                    <div class="report-section">
                        <div class="report-item">
                            <span>总收入：</span>
                            <span class="amount positive">¥${report.data.totalIncome}</span>
                        </div>
                        <div class="report-item">
                            <span>总支出：</span>
                            <span class="amount negative">¥${report.data.totalExpense}</span>
                        </div>
                        <div class="report-item">
                            <span>净结余：</span>
                            <span class="amount ${report.data.balance >= 0 ? 'positive' : 'negative'}">¥${report.data.balance}</span>
                        </div>
                    </div>

                    <h4>支出分类</h4>
                    <div class="report-section">
                        ${Object.entries(report.data.expenseByCategory).map(([category, amount]) => `
                            <div class="report-item">
                                <span>${category}：</span>
                                <span class="amount">¥${amount}</span>
                            </div>
                        `).join('')}
                    </div>

                    <h4>成员支出</h4>
                    <div class="report-section">
                        ${Object.entries(report.data.expenseByMember).map(([member, amount]) => `
                            <div class="report-item">
                                <span>${member}：</span>
                                <span class="amount">¥${amount}</span>
                            </div>
                        `).join('')}
                    </div>

                    <h4>储蓄建议</h4>
                    <div class="report-section">
                        ${report.data.suggestions.map(suggestion => `
                            <div class="suggestion-item">
                                <i class="fas fa-lightbulb"></i>
                                <span>${suggestion}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="button-group">
                    <button class="btn btn-primary" onclick="familyModePage.downloadReport('${report.id}')">下载报告</button>
                    <button class="btn btn-secondary" onclick="familyModePage.hideModal()">关闭</button>
                </div>
            </div>
        `);
    }

    // 辅助方法
    getFamilyBalance() {
        const totalIncome = this.familyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpense = this.familyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        return (totalIncome - totalExpense).toFixed(2);
    }

    getTodayFamilyExpense() {
        const today = new Date().toISOString().split('T')[0];
        return this.familyTransactions
            .filter(t => t.type === 'expense' && t.date === today && t.expenseType === 'family')
            .reduce((sum, t) => sum + t.amount, 0)
            .toFixed(2);
    }

    getMonthlyFamilyIncome() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return this.familyTransactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.type === 'income' && 
                       tDate.getMonth() === currentMonth && 
                       tDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0)
            .toFixed(2);
    }

    getMonthlyFamilyExpense() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return this.familyTransactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.type === 'expense' && 
                       tDate.getMonth() === currentMonth && 
                       tDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0)
            .toFixed(2);
    }

    getMemberMonthlyExpense(memberId) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return this.familyTransactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.type === 'expense' && 
                       t.memberId === memberId &&
                       tDate.getMonth() === currentMonth && 
                       tDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0)
            .toFixed(2);
    }

    getMonthlyAnalysisData() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyTransactions = this.familyTransactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        });

        const totalIncome = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const familyExpense = monthlyTransactions
            .filter(t => t.type === 'expense' && t.expenseType === 'family')
            .reduce((sum, t) => sum + t.amount, 0);

        const personalExpense = monthlyTransactions
            .filter(t => t.type === 'expense' && t.expenseType === 'personal')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = familyExpense + personalExpense;
        const balance = totalIncome - totalExpense;
        const savingsRate = totalIncome > 0 ? (balance / totalIncome * 100).toFixed(1) : 0;

        return {
            familyExpense: familyExpense.toFixed(2),
            personalExpense: personalExpense.toFixed(2),
            familyPercentage: totalExpense > 0 ? (familyExpense / totalExpense * 100).toFixed(1) : 0,
            personalPercentage: totalExpense > 0 ? (personalExpense / totalExpense * 100).toFixed(1) : 0,
            balance: balance.toFixed(2),
            savingsRate
        };
    }

    getCategorySpent(category) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return this.familyTransactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.type === 'expense' && 
                       t.category === category &&
                       tDate.getMonth() === currentMonth && 
                       tDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);
    }

    generateReportData(year, month) {
        const monthlyTransactions = this.familyTransactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getFullYear() === year && tDate.getMonth() === month - 1;
        });

        const totalIncome = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenseByCategory = {};
        const expenseByMember = {};

        monthlyTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
                expenseByMember[t.memberName] = (expenseByMember[t.memberName] || 0) + t.amount;
            });

        const balance = totalIncome - totalExpense;
        const suggestions = this.generateSuggestions(balance, totalIncome, expenseByCategory);

        return {
            totalIncome: totalIncome.toFixed(2),
            totalExpense: totalExpense.toFixed(2),
            balance: balance.toFixed(2),
            expenseByCategory,
            expenseByMember,
            suggestions
        };
    }

    generateSuggestions(balance, income, expenseByCategory) {
        const suggestions = [];
        
        if (balance > 0) {
            suggestions.push(`本月结余 ¥${balance.toFixed(2)}，建议将其中 50% 用于应急储备，30% 用于投资理财。`);
        } else {
            suggestions.push(`本月超支 ¥${Math.abs(balance).toFixed(2)}，建议检查支出结构，控制非必要开支。`);
        }

        // 找出最大支出分类
        const maxCategory = Object.entries(expenseByCategory)
            .sort(([,a], [,b]) => b - a)[0];
        
        if (maxCategory) {
            const percentage = (maxCategory[1] / income * 100).toFixed(1);
            suggestions.push(`${maxCategory[0]}是最大支出项，占收入的 ${percentage}%，建议关注此类支出的合理性。`);
        }

        return suggestions;
    }

    getRoleText(role) {
        const roles = {
            admin: '管理员',
            member: '成员'
        };
        return roles[role] || role;
    }

    updateFamilyOverview() {
        // 更新页面中的概览数据
        const overviewStats = document.querySelector('.overview-stats');
        if (overviewStats) {
            overviewStats.innerHTML = `
                <div class="stat-card">
                    <div class="stat-value">¥${this.getFamilyBalance()}</div>
                    <div class="stat-label">家庭总余额</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">¥${this.getTodayFamilyExpense()}</div>
                    <div class="stat-label">今日共同支出</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">¥${this.getMonthlyFamilyIncome()}</div>
                    <div class="stat-label">本月家庭收入</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">¥${this.getMonthlyFamilyExpense()}</div>
                    <div class="stat-label">本月家庭支出</div>
                </div>
            `;
        }
    }

    // 模态框方法
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
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="familyModePage.hideModal()">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
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

    hideModal() {
        if (this.currentModal) {
            document.body.removeChild(this.currentModal);
            this.currentModal = null;
        }
    }

    // 新增的辅助方法

    // 获取余额趋势
    getBalanceTrend() {
        const currentBalance = this.getFamilyBalance();
        const lastMonthBalance = this.getLastMonthBalance();
        const change = currentBalance - lastMonthBalance;
        
        if (change > 0) {
            return { direction: 'up', text: `↗ +¥${change.toFixed(2)}` };
        } else if (change < 0) {
            return { direction: 'down', text: `↘ -¥${Math.abs(change).toFixed(2)}` };
        } else {
            return { direction: 'stable', text: '→ 持平' };
        }
    }

    // 获取昨日家庭支出
    getYesterdayFamilyExpense() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        return this.familyTransactions
            .filter(t => t.type === 'expense' && t.date === yesterdayStr && t.accountType === 'family')
            .reduce((sum, t) => sum + t.amount, 0);
    }

    // 获取上月收入
    getLastMonthIncome() {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const year = lastMonth.getFullYear();
        const month = lastMonth.getMonth() + 1;
        
        return this.familyTransactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.type === 'income' && 
                       tDate.getFullYear() === year && 
                       tDate.getMonth() + 1 === month;
            })
            .reduce((sum, t) => sum + t.amount, 0);
    }

    // 获取月度预算
    getMonthlyBudget() {
        return Object.values(this.familyBudgets).reduce((sum, budget) => sum + budget, 0);
    }

    // 获取储蓄率
    getSavingsRate() {
        const income = this.getMonthlyFamilyIncome();
        const expense = this.getMonthlyFamilyExpense();
        return income > 0 ? ((income - expense) / income * 100) : 0;
    }

    // 获取储蓄率等级
    getSavingsRateLevel() {
        const rate = this.getSavingsRate();
        if (rate >= 30) return 'excellent';
        if (rate >= 20) return 'good';
        if (rate >= 10) return 'fair';
        return 'poor';
    }

    // 获取预算执行情况
    getBudgetExecution() {
        const budget = this.getMonthlyBudget();
        const expense = this.getMonthlyFamilyExpense();
        return budget > 0 ? (expense / budget * 100) : 0;
    }

    // 获取预算执行等级
    getBudgetExecutionLevel() {
        const execution = this.getBudgetExecution();
        if (execution <= 80) return 'excellent';
        if (execution <= 95) return 'good';
        if (execution <= 110) return 'fair';
        return 'poor';
    }

    // 获取收支平衡分数
    getBalanceScore() {
        const income = this.getMonthlyFamilyIncome();
        const expense = this.getMonthlyFamilyExpense();
        if (income === 0) return 0;
        
        const ratio = expense / income;
        if (ratio <= 0.7) return 100;
        if (ratio <= 0.8) return 80;
        if (ratio <= 0.9) return 60;
        if (ratio <= 1.0) return 40;
        return 20;
    }

    // 获取平衡等级
    getBalanceLevel() {
        const score = this.getBalanceScore();
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'fair';
        return 'poor';
    }

    // 获取家庭建议
    getFamilyRecommendations() {
        const recommendations = [];
        const savingsRate = this.getSavingsRate();
        const budgetExecution = this.getBudgetExecution();
        const balanceScore = this.getBalanceScore();

        if (savingsRate < 10) {
            recommendations.push({
                priority: 'high',
                icon: 'fa-exclamation-triangle',
                message: '储蓄率偏低，建议增加储蓄或减少非必要支出'
            });
        }

        if (budgetExecution > 100) {
            recommendations.push({
                priority: 'high',
                icon: 'fa-chart-line',
                message: '本月预算已超支，请控制支出'
            });
        }

        if (balanceScore < 40) {
            recommendations.push({
                priority: 'medium',
                icon: 'fa-balance-scale',
                message: '收支不平衡，建议优化支出结构'
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                priority: 'low',
                icon: 'fa-thumbs-up',
                message: '家庭财务状况良好，继续保持！'
            });
        }

        return recommendations;
    }

    // 获取家庭成员列表
    getFamilyMembers() {
        const members = this.familyMembers || [];
        // 确保管理员用户始终在成员列表中
        const adminExists = members.some(member => member.role === 'admin');
        if (!adminExists) {
            // 如果没有管理员，添加默认管理员
            return [...members, { name: "我", role: "admin", id: "default" }];
        }
        return members;
    }

    // 获取活跃成员数
    getActiveMembers() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const activeMembers = new Set();
        this.familyTransactions
            .filter(t => new Date(t.date) >= thirtyDaysAgo)
            .forEach(t => activeMembers.add(t.memberId));
            
        return activeMembers.size;
    }

    // 获取人均支出
    getAverageExpensePerMember() {
        const totalExpense = this.getMonthlyFamilyExpense();
        const memberCount = this.getFamilyMembers().length;
        return memberCount > 0 ? totalExpense / memberCount : 0;
    }

    // 获取成员月度支出
    getMemberMonthlyExpense(memberId) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return this.familyTransactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.memberId === memberId && 
                       t.type === 'expense' &&
                       tDate.getMonth() === currentMonth && 
                       tDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);
    }

    // 获取成员交易次数
    getMemberTransactionCount(memberId) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return this.familyTransactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.memberId === memberId &&
                       tDate.getMonth() === currentMonth && 
                       tDate.getFullYear() === currentYear;
            })
            .length;
    }

    // 切换成员标签页
    switchMemberTab(tab) {
        // 移除所有活跃状态
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // 激活选中的标签页
        document.querySelector(`[onclick*="${tab}"]`).classList.add('active');
        document.getElementById(`members-tab-${tab}`).classList.add('active');
    }

    // 渲染成员分析
    renderMemberAnalysis() {
        const members = this.getFamilyMembers();
        const currentMonth = new Date().getMonth() + 1;
        
        return `
            <div class="member-analysis-content">
                <h4>成员消费分析</h4>
                ${members.map(member => {
                    const memberExpense = this.getMemberMonthlyExpense(member.id);
                    const memberTransactions = this.getMemberTransactionCount(member.id);
                    const avgTransaction = memberTransactions > 0 ? memberExpense / memberTransactions : 0;
                    
                    return `
                        <div class="member-analysis-item">
                            <div class="member-info">
                                <img src="${member.avatar}" alt="${member.name}" class="member-avatar">
                                <div class="member-details">
                                    <h5>${member.name}</h5>
                                    <span class="member-role">${member.role}</span>
                                </div>
                            </div>
                            <div class="member-stats">
                                <div class="stat-item">
                                    <div class="stat-value">¥${memberExpense.toFixed(2)}</div>
                                    <div class="stat-label">本月支出</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">${memberTransactions}</div>
                                    <div class="stat-label">交易次数</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">¥${avgTransaction.toFixed(2)}</div>
                                    <div class="stat-label">平均单笔</div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // 渲染权限管理
    renderPermissionManagement() {
        const members = this.getFamilyMembers();
        
        return `
            <div class="permission-management-content">
                <h4>权限管理</h4>
                <div class="permission-list">
                    ${members.map(member => `
                        <div class="permission-item">
                            <div class="member-info">
                                <img src="${member.avatar}" alt="${member.name}" class="member-avatar">
                                <span class="member-name">${member.name}</span>
                            </div>
                            <div class="permission-controls">
                                <select class="role-select" onchange="familyMode.updateMemberRole('${member.id}', this.value)">
                                    <option value="member" ${member.role === 'member' ? 'selected' : ''}>普通成员</option>
                                    <option value="admin" ${member.role === 'admin' ? 'selected' : ''}>管理员</option>
                                </select>
                                <div class="permission-checkboxes">
                                    <label>
                                        <input type="checkbox" ${member.permissions?.canViewBudget ? 'checked' : ''} 
                                               onchange="familyMode.updatePermission('${member.id}', 'canViewBudget', this.checked)">
                                        查看预算
                                    </label>
                                    <label>
                                        <input type="checkbox" ${member.permissions?.canEditBudget ? 'checked' : ''} 
                                               onchange="familyMode.updatePermission('${member.id}', 'canEditBudget', this.checked)">
                                        编辑预算
                                    </label>
                                    <label>
                                        <input type="checkbox" ${member.permissions?.canViewReports ? 'checked' : ''} 
                                               onchange="familyMode.updatePermission('${member.id}', 'canViewReports', this.checked)">
                                        查看报告
                                    </label>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 获取快捷金额
    getQuickAmounts() {
        const recentAmounts = this.getRecentAmounts();
        const defaultAmounts = [10, 20, 50, 100, 200, 500];
        return [...new Set([...recentAmounts, ...defaultAmounts])].slice(0, 6);
    }

    // 获取最近使用的金额
    getRecentAmounts() {
        const recentTransactions = this.familyTransactions
            .slice(-20)
            .map(t => t.amount)
            .filter((amount, index, arr) => arr.indexOf(amount) === index);
        return recentTransactions.slice(0, 3);
    }

    // 根据场景获取分类
    getCategoriesByScenario() {
        const scenario = document.querySelector('.scenario-btn.active')?.dataset.scenario || 'daily';
        
        const categories = {
            daily: [
                { value: 'food', label: '餐饮', icon: 'fa-utensils' },
                { value: 'transport', label: '交通', icon: 'fa-car' },
                { value: 'shopping', label: '购物', icon: 'fa-shopping-cart' },
                { value: 'utilities', label: '生活缴费', icon: 'fa-home' }
            ],
            special: [
                { value: 'entertainment', label: '娱乐', icon: 'fa-gamepad' },
                { value: 'travel', label: '旅游', icon: 'fa-plane' },
                { value: 'gifts', label: '礼品', icon: 'fa-gift' },
                { value: 'healthcare', label: '医疗', icon: 'fa-heartbeat' }
            ],
            investment: [
                { value: 'investment', label: '投资', icon: 'fa-chart-line' },
                { value: 'insurance', label: '保险', icon: 'fa-shield-alt' },
                { value: 'education', label: '教育', icon: 'fa-graduation-cap' },
                { value: 'savings', label: '储蓄', icon: 'fa-piggy-bank' }
            ]
        };
        
        return categories[scenario] || categories.daily;
    }

    // 获取智能分类建议
    getSmartCategorySuggestions() {
        // 基于历史数据和当前时间提供智能建议
        const hour = new Date().getHours();
        const suggestions = [];
        
        if (hour >= 11 && hour <= 14) {
            suggestions.push({ category: 'food', label: '餐饮', icon: 'fa-utensils', confidence: 85 });
        }
        
        if (hour >= 7 && hour <= 9) {
            suggestions.push({ category: 'transport', label: '交通', icon: 'fa-car', confidence: 75 });
        }
        
        return suggestions.slice(0, 3);
    }

    // 获取备注模板
    getNoteTemplates() {
        return ['超市购物', '外出就餐', '交通费用', '生活用品', '娱乐消费', '医疗费用'];
    }

    // 获取成员月度支出（重复方法，已删除）
    // getMemberMonthlyExpense(memberId) {
    //     const currentMonth = new Date().getMonth() + 1;
    //     const currentYear = new Date().getFullYear();
    //     
    //     return this.familyTransactions
    //         .filter(t => {
    //             const tDate = new Date(t.date);
    //             return t.type === 'expense' && 
    //                    t.memberId === memberId &&
    //                    tDate.getFullYear() === currentYear && 
    //                    tDate.getMonth() + 1 === currentMonth;
    //         })
    //         .reduce((sum, t) => sum + t.amount, 0);
    // }

    // 获取成员交易次数（重复方法，已删除）
    // getMemberTransactionCount(memberId) {
    //     const currentMonth = new Date().getMonth() + 1;
    //     const currentYear = new Date().getFullYear();
    //     
    //     return this.familyTransactions
    //         .filter(t => {
    //             const tDate = new Date(t.date);
    //             return t.memberId === memberId &&
    //                    tDate.getFullYear() === currentYear && 
    //                    tDate.getMonth() + 1 === currentMonth;
    //         }).length;
    // }

    // 获取上月余额
    getLastMonthBalance() {
        // 简化实现，实际应该基于历史数据计算
        return this.getFamilyBalance() - (this.getMonthlyFamilyIncome() - this.getMonthlyFamilyExpense());
    }

    // 交互方法
    switchTransactionType(type) {
        document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-type="${type}"]`).classList.add('active');
        this.updateCategoryOptions(type);
    }

    switchScenario(scenario) {
        document.querySelectorAll('.scenario-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-scenario="${scenario}"]`).classList.add('active');
        this.updateCategoryOptions();
    }

    switchAccountType(type) {
        document.querySelectorAll('.account-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-account="${type}"]`).classList.add('active');
        
        const memberSelection = document.getElementById('member-selection');
        if (type === 'family') {
            memberSelection.style.display = 'block';
        } else {
            memberSelection.style.display = 'none';
        }
    }

    setQuickAmount(amount) {
        document.getElementById('transaction-amount').value = amount;
        this.onAmountChange();
    }

    onAmountChange() {
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        if (amount > 1000) {
            this.showSmartReminder('大额消费提醒：请确认消费金额和分类');
        }
    }

    onCategoryChange() {
        // 根据分类提供智能建议
        const category = document.getElementById('transaction-category').value;
        this.updateSmartSuggestions(category);
    }

    onNoteChange() {
        // 实时分析备注内容，提供分类建议
        const note = document.getElementById('transaction-note').value;
        this.analyzeNoteForCategory(note);
    }

    showSmartReminder(message) {
        const reminder = document.getElementById('smart-reminder');
        const reminderText = document.getElementById('reminder-text');
        reminderText.textContent = message;
        reminder.style.display = 'block';
        
        setTimeout(() => {
            reminder.style.display = 'none';
        }, 5000);
    }

    updateCategoryOptions(type = null) {
        const select = document.getElementById('transaction-category');
        const categories = this.getCategoriesByScenario();
        
        select.innerHTML = '<option value="">请选择分类</option>' + 
            categories.map(cat => `<option value="${cat.value}">${cat.label}</option>`).join('');
    }

    updateSmartSuggestions(category) {
        // 更新智能建议显示
        const suggestions = document.getElementById('category-suggestions');
        // 实现智能建议逻辑
    }

    analyzeNoteForCategory(note) {
        // 分析备注内容，自动推荐分类
        const keywords = {
            '餐': 'food',
            '吃': 'food',
            '车': 'transport',
            '地铁': 'transport',
            '购物': 'shopping',
            '买': 'shopping'
        };
        
        for (const [keyword, category] of Object.entries(keywords)) {
            if (note.includes(keyword)) {
                document.getElementById('transaction-category').value = category;
                break;
            }
        }
    }

    startVoiceInput() {
        // 语音输入功能（需要浏览器支持）
        if ('webkitSpeechRecognition' in window) {
            const recognition = new webkitSpeechRecognition();
            recognition.lang = 'zh-CN';
            recognition.onresult = (event) => {
                const result = event.results[0][0].transcript;
                document.getElementById('transaction-amount').value = this.extractAmountFromSpeech(result);
            };
            recognition.start();
        } else {
            alert('您的浏览器不支持语音输入功能');
        }
    }

    extractAmountFromSpeech(text) {
        // 从语音文本中提取金额
        const match = text.match(/(\d+)/);
        return match ? match[1] : '';
    }

    showNoteTemplates() {
        const templates = document.getElementById('note-templates');
        templates.style.display = templates.style.display === 'none' ? 'block' : 'none';
    }

    selectNoteTemplate(template) {
        document.getElementById('transaction-note').value = template;
        document.getElementById('note-templates').style.display = 'none';
    }

    saveAsDraft() {
        const draft = {
            amount: document.getElementById('transaction-amount').value,
            category: document.getElementById('transaction-category').value,
            note: document.getElementById('transaction-note').value,
            type: document.querySelector('.type-btn.active').dataset.type,
            accountType: document.querySelector('.account-btn.active').dataset.account,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('transaction_draft', JSON.stringify(draft));
        this.showSmartReminder('草稿已保存');
    }

    showMemberInvite() {
        const content = `
            <div class="invite-form">
                <h4>邀请家庭成员</h4>
                <div class="form-group">
                    <label>邀请方式</label>
                    <div class="invite-methods">
                        <button class="method-btn active" data-method="qr">二维码</button>
                        <button class="method-btn" data-method="link">邀请链接</button>
                        <button class="method-btn" data-method="phone">手机号</button>
                    </div>
                </div>
                <div class="invite-content">
                    <div class="qr-code">
                        <div class="qr-placeholder">二维码</div>
                        <p>让家庭成员扫描此二维码加入</p>
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="familyMode.sendInvite()">发送邀请</button>
                    <button class="btn btn-secondary" onclick="familyMode.hideModal()">取消</button>
                </div>
            </div>
        `;
        this.showModal('邀请家庭成员', content);
    }

    exportMemberData() {
        const data = {
            members: this.getFamilyMembers(),
            transactions: this.familyTransactions,
            budgets: this.familyBudgets,
            exportTime: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `family_data_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async updateMemberRole(memberId, role) {
        // 更新成员角色
        const member = this.familyMembers.find(m => m.id === memberId);
        if (member) {
            member.role = role;
            
            // 保存到数据库或本地存储
            if (this.modeDatabase) {
                await this.saveFamilyDataToDatabase();
            } else {
                this.saveFamilyDataToLocalStorage();
            }
        }
    }

    async updatePermission(memberId, permission, value) {
        // 更新成员权限
        const member = this.familyMembers.find(m => m.id === memberId);
        if (member) {
            if (!member.permissions) member.permissions = {};
            member.permissions[permission] = value;
            
            // 保存到数据库或本地存储
            if (this.modeDatabase) {
                await this.saveFamilyDataToDatabase();
            } else {
                this.saveFamilyDataToLocalStorage();
            }
        }
    }

    // 移除家庭成员
    async removeMember(memberId) {
        // 确认删除
        if (!confirm('确定要移除该家庭成员吗？此操作不可撤销。')) {
            return;
        }
        
        // 找到要删除的成员
        const memberIndex = this.familyMembers.findIndex(m => m.id === memberId);
        if (memberIndex === -1) {
            this.app.showToast('未找到该成员', 'error');
            return;
        }
        
        const memberName = this.familyMembers[memberIndex].name;
        
        // 从成员列表中移除
        this.familyMembers.splice(memberIndex, 1);
        
        // 保存到数据库或本地存储
        if (this.modeDatabase) {
            await this.saveFamilyDataToDatabase();
        } else {
            this.saveFamilyDataToLocalStorage();
        }
        
        // 更新UI
        document.getElementById('family-members-list').innerHTML = this.renderFamilyMembers();
        this.app.showToast(`${memberName}已从家庭账本中移除`);
    }

    // 编辑家庭成员
    async editMember(memberId) {
        const member = this.familyMembers.find(m => m.id === memberId);
        if (!member) {
            this.app.showToast('未找到该成员', 'error');
            return;
        }
        
        this.showModal('编辑家庭成员', `
            <div style="padding: 20px;">
                <div class="form-group">
                    <label>姓名</label>
                    <input type="text" id="edit-member-name" value="${member.name}" class="form-control">
                </div>
                <div class="form-group">
                    <label>关系</label>
                    <input type="text" id="edit-member-relation" value="${member.relation || ''}" class="form-control" placeholder="如：配偶、子女、父母等">
                </div>
                <div class="form-group">
                    <label>角色</label>
                    <select id="edit-member-role" class="form-control">
                        <option value="member" ${member.role === 'member' ? 'selected' : ''}>普通成员</option>
                        <option value="admin" ${member.role === 'admin' ? 'selected' : ''}>管理员</option>
                    </select>
                </div>
                <div class="button-group">
                    <button class="btn btn-primary" onclick="familyModePage.saveMemberEdit('${memberId}')">保存</button>
                    <button class="btn btn-secondary" onclick="familyModePage.hideModal()">取消</button>
                </div>
            </div>
        `);
    }

    // 保存成员编辑
    async saveMemberEdit(memberId) {
        const name = document.getElementById('edit-member-name').value;
        const relation = document.getElementById('edit-member-relation').value;
        const role = document.getElementById('edit-member-role').value;

        if (!name) {
            this.app.showToast('请输入成员姓名');
            return;
        }

        const member = this.familyMembers.find(m => m.id === memberId);
        if (member) {
            member.name = name;
            member.relation = relation;
            member.role = role;
            
            // 保存到数据库或本地存储
            if (this.modeDatabase) {
                await this.saveFamilyDataToDatabase();
            } else {
                this.saveFamilyDataToLocalStorage();
            }
            
            document.getElementById('family-members-list').innerHTML = this.renderFamilyMembers();
            this.hideModal();
            this.app.showToast('成员信息已更新');
        }
    }
}

// 全局变量
let familyModePage;