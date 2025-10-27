class FamilyModePage {
    constructor(app) {
        this.app = app;
        this.currentModal = null;
        this.loadFamilyData();
    }

    // 加载家庭模式数据
    loadFamilyData() {
        try {
            this.familySettings = JSON.parse(localStorage.getItem('family_mode_settings') || '{}');
            this.familyMembers = JSON.parse(localStorage.getItem('family_members') || '[]');
            this.familyTransactions = JSON.parse(localStorage.getItem('family_transactions') || '[]');
            this.familyBudgets = JSON.parse(localStorage.getItem('family_budgets') || '{}');
            this.currentUser = JSON.parse(localStorage.getItem('current_family_user') || '{"name": "我", "role": "admin", "id": "default"}');
        } catch (e) {
            console.error('加载家庭模式数据失败:', e);
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
                        <div class="family-members-list" id="family-members-list">
                            ${this.renderFamilyMembers()}
                        </div>
                        
                        <div class="member-actions">
                            ${this.currentUser.role === 'admin' ? `
                                <button class="btn btn-primary" onclick="familyModePage.showAddMember()">
                                    <i class="fas fa-user-plus"></i> 邀请成员
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- 家庭预算管理 -->
                <div class="card">
                    <h3><i class="fas fa-wallet"></i> 家庭预算管理</h3>
                    <div class="budget-overview">
                        ${this.renderBudgetOverview()}
                    </div>
                </div>

                <!-- 家庭记账 -->
                <div class="card">
                    <h3><i class="fas fa-plus-circle"></i> 家庭记账</h3>
                    <div class="family-transaction-form">
                        ${this.renderTransactionForm()}
                    </div>
                </div>

                <!-- 家庭账单 -->
                <div class="card">
                    <h3><i class="fas fa-receipt"></i> 家庭账单</h3>
                    <div class="family-bills" id="family-bills">
                        ${this.renderFamilyBills()}
                    </div>
                </div>

                <!-- 家庭报表 -->
                <div class="card">
                    <h3><i class="fas fa-chart-bar"></i> 家庭报表</h3>
                    <div class="family-reports">
                        ${this.renderFamilyReports()}
                    </div>
                </div>
            </div>
        `;
    }

    // 渲染家庭成员列表
    renderFamilyMembers() {
        if (this.familyMembers.length === 0) {
            return '<div class="empty-state">暂无家庭成员</div>';
        }

        return this.familyMembers.map(member => `
            <div class="member-item">
                <div class="member-info">
                    <div class="member-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="member-details">
                        <div class="member-name">${member.name}</div>
                        <div class="member-role">${this.getRoleText(member.role)}</div>
                        <div class="member-stats">
                            <span>本月支出: ¥${this.getMemberMonthlyExpense(member.id).toFixed(2)}</span>
                            <span>预算使用: ${this.getMemberBudgetUsage(member.id)}%</span>
                        </div>
                    </div>
                </div>
                <div class="member-actions">
                    ${this.currentUser.role === 'admin' ? `
                        <button class="btn btn-sm btn-secondary" onclick="familyModePage.editMember('${member.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="familyModePage.removeMember('${member.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // 渲染预算概览
    renderBudgetOverview() {
        const totalBudget = this.getTotalBudget();
        const usedBudget = this.getUsedBudget();
        const budgetUsage = totalBudget > 0 ? (usedBudget / totalBudget * 100).toFixed(1) : 0;

        return `
            <div class="budget-stats">
                <div class="budget-item">
                    <div class="budget-label">总预算</div>
                    <div class="budget-value">¥${totalBudget.toFixed(2)}</div>
                </div>
                <div class="budget-item">
                    <div class="budget-label">已使用</div>
                    <div class="budget-value">¥${usedBudget.toFixed(2)}</div>
                </div>
                <div class="budget-item">
                    <div class="budget-label">使用率</div>
                    <div class="budget-value ${budgetUsage > 80 ? 'warning' : ''}">${budgetUsage}%</div>
                </div>
            </div>
            <div class="budget-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(budgetUsage, 100)}%"></div>
                </div>
            </div>
            <div class="budget-actions">
                <button class="btn btn-primary" onclick="familyModePage.setBudget()">设置预算</button>
                <button class="btn btn-secondary" onclick="familyModePage.viewBudgetDetails()">查看详情</button>
            </div>
        `;
    }

    // 渲染交易表单
    renderTransactionForm() {
        return `
            <div class="transaction-form">
                <div class="input-group">
                    <label>金额</label>
                    <input type="number" id="family-amount" placeholder="请输入金额">
                </div>
                
                <div class="input-group">
                    <label>分类</label>
                    <select id="family-category">
                        <option value="食品">食品</option>
                        <option value="住房">住房</option>
                        <option value="交通">交通</option>
                        <option value="教育">教育</option>
                        <option value="医疗">医疗</option>
                        <option value="娱乐">娱乐</option>
                        <option value="其他">其他</option>
                    </select>
                </div>
                
                <div class="input-group">
                    <label>描述</label>
                    <input type="text" id="family-description" placeholder="请输入描述">
                </div>
                
                <div class="input-group">
                    <label>支付人</label>
                    <select id="family-payer">
                        ${this.familyMembers.map(member => 
                            `<option value="${member.id}" ${member.id === this.currentUser.id ? 'selected' : ''}>${member.name}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="input-group">
                    <label>分摊方式</label>
                    <select id="family-split-type">
                        <option value="equal">平均分摊</option>
                        <option value="custom">自定义分摊</option>
                        <option value="single">个人承担</option>
                    </select>
                </div>
                
                <button class="btn btn-primary btn-block" onclick="familyModePage.addFamilyTransaction()">
                    <i class="fas fa-save"></i> 记录家庭支出
                </button>
            </div>
        `;
    }

    // 渲染家庭账单
    renderFamilyBills() {
        if (this.familyTransactions.length === 0) {
            return '<div class="empty-state">暂无家庭账单</div>';
        }

        return this.familyTransactions.slice(0, 10).map(transaction => `
            <div class="bill-item">
                <div class="bill-info">
                    <div class="bill-category">${transaction.category}</div>
                    <div class="bill-amount">¥${transaction.amount.toFixed(2)}</div>
                </div>
                <div class="bill-details">
                    <span>支付人: ${this.getMemberName(transaction.payer)}</span>
                    <span>日期: ${new Date(transaction.date).toLocaleDateString()}</span>
                </div>
                <div class="bill-description">${transaction.description}</div>
            </div>
        `).join('');
    }

    // 渲染家庭报表
    renderFamilyReports() {
        return `
            <div class="report-tabs">
                <button class="tab-btn active" onclick="familyModePage.showReport('expense')">支出分析</button>
                <button class="tab-btn" onclick="familyModePage.showReport('income')">收入分析</button>
                <button class="tab-btn" onclick="familyModePage.showReport('member')">成员分析</button>
            </div>
            
            <div class="report-content" id="family-report-content">
                ${this.renderExpenseReport()}
            </div>
        `;
    }

    // 渲染支出报表
    renderExpenseReport() {
        const expenseByCategory = this.getExpenseByCategory();
        
        return `
            <div class="expense-report">
                <h4>本月支出分类</h4>
                <div class="expense-chart">
                    ${Object.entries(expenseByCategory).map(([category, amount]) => {
                        const percentage = (amount / this.getMonthlyFamilyExpense() * 100).toFixed(1);
                        return `
                            <div class="chart-item">
                                <div class="chart-bar" style="width: ${percentage}%"></div>
                                <div class="chart-label">${category}</div>
                                <div class="chart-value">¥${amount.toFixed(2)} (${percentage}%)</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // 初始化事件
    initEvents() {
        familyModePage = this;
        this.loadFamilyData();
    }

    // 添加家庭交易
    addFamilyTransaction() {
        const amount = parseFloat(document.getElementById('family-amount').value);
        const category = document.getElementById('family-category').value;
        const description = document.getElementById('family-description').value;
        const payer = document.getElementById('family-payer').value;
        const splitType = document.getElementById('family-split-type').value;

        if (!amount || amount <= 0) {
            this.app.showToast('请输入有效金额');
            return;
        }

        const transaction = {
            id: Date.now().toString(),
            amount,
            category,
            description,
            payer,
            splitType,
            date: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        this.familyTransactions.unshift(transaction);
        localStorage.setItem('family_transactions', JSON.stringify(this.familyTransactions));

        // 清空表单
        document.getElementById('family-amount').value = '';
        document.getElementById('family-description').value = '';

        // 更新显示
        this.updateFamilyOverview();
        this.app.showToast('家庭支出已记录');
    }

    // 显示添加成员对话框
    showAddMember() {
        this.showModal('添加家庭成员', `
            <div style="padding: 20px;">
                <div class="input-group">
                    <label>成员姓名</label>
                    <input type="text" id="member-name" placeholder="请输入姓名">
                </div>
                <div class="input-group">
                    <label>成员角色</label>
                    <select id="member-role">
                        <option value="admin">管理员</option>
                        <option value="member">普通成员</option>
                        <option value="child">儿童</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>初始预算</label>
                    <input type="number" id="member-budget" placeholder="请输入预算金额">
                </div>
                <div class="button-group">
                    <button class="btn btn-primary" onclick="familyModePage.addMember()">添加</button>
                    <button class="btn btn-secondary" onclick="familyModePage.hideModal()">取消</button>
                </div>
            </div>
        `);
    }

    // 添加成员
    addMember() {
        const name = document.getElementById('member-name').value;
        const role = document.getElementById('member-role').value;
        const budget = parseFloat(document.getElementById('member-budget').value) || 0;

        if (!name) {
            this.app.showToast('请输入成员姓名');
            return;
        }

        const member = {
            id: Date.now().toString(),
            name,
            role,
            budget,
            createdAt: new Date().toISOString()
        };

        this.familyMembers.push(member);
        localStorage.setItem('family_members', JSON.stringify(this.familyMembers));

        document.getElementById('family-members-list').innerHTML = this.renderFamilyMembers();
        this.hideModal();
        this.app.showToast('成员已添加');
    }

    // 切换用户
    switchUser() {
        this.showModal('切换用户', `
            <div style="padding: 20px;">
                <div class="user-list">
                    ${this.familyMembers.map(member => `
                        <div class="user-item ${member.id === this.currentUser.id ? 'active' : ''}" onclick="familyModePage.selectUser('${member.id}')">
                            <div class="user-avatar">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="user-info">
                                <div class="user-name">${member.name}</div>
                                <div class="user-role">${this.getRoleText(member.role)}</div>
                            </div>
                            ${member.id === this.currentUser.id ? '<i class="fas fa-check"></i>' : ''}
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
    selectUser(userId) {
        const member = this.familyMembers.find(m => m.id === userId);
        if (member) {
            this.currentUser = member;
            localStorage.setItem('current_family_user', JSON.stringify(member));
            this.hideModal();
            this.app.showToast(`已切换到 ${member.name}`);
        }
    }

    // 设置预算
    setBudget() {
        this.showModal('设置家庭预算', `
            <div style="padding: 20px;">
                <div class="input-group">
                    <label>总预算金额</label>
                    <input type="number" id="total-budget" value="${this.getTotalBudget()}" placeholder="请输入预算金额">
                </div>
                <div class="budget-distribution">
                    <h4>成员预算分配</h4>
                    ${this.familyMembers.map(member => `
                        <div class="input-group">
                            <label>${member.name}</label>
                            <input type="number" id="budget-${member.id}" value="${member.budget || 0}" placeholder="预算金额">
                        </div>
                    `).join('')}
                </div>
                <div class="button-group">
                    <button class="btn btn-primary" onclick="familyModePage.saveBudget()">保存</button>
                    <button class="btn btn-secondary" onclick="familyModePage.hideModal()">取消</button>
                </div>
            </div>
        `);
    }

    // 保存预算
    saveBudget() {
        const totalBudget = parseFloat(document.getElementById('total-budget').value) || 0;
        
        // 更新成员预算
        this.familyMembers.forEach(member => {
            const budgetInput = document.getElementById(`budget-${member.id}`);
            if (budgetInput) {
                member.budget = parseFloat(budgetInput.value) || 0;
            }
        });

        this.familyBudgets.total = totalBudget;
        this.familyBudgets.members = this.familyMembers.reduce((acc, member) => {
            acc[member.id] = member.budget;
            return acc;
        }, {});

        localStorage.setItem('family_budgets', JSON.stringify(this.familyBudgets));
        localStorage.setItem('family_members', JSON.stringify(this.familyMembers));

        this.hideModal();
        this.app.showToast('预算已更新');
    }

    // 辅助方法
    getFamilyBalance() {
        const totalIncome = this.familyTransactions
            .filter(t => t.category === '收入')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpense = this.familyTransactions
            .filter(t => t.category !== '收入')
            .reduce((sum, t) => sum + t.amount, 0);
        
        return totalIncome - totalExpense;
    }

    getTodayFamilyExpense() {
        const today = new Date().toDateString();
        return this.familyTransactions
            .filter(t => {
                const tDate = new Date(t.date).toDateString();
                return tDate === today && t.category !== '收入';
            })
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
                return t.category !== '收入' && 
                       tDate.getMonth() === currentMonth && 
                       tDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);
    }

    getFamilyMembers() {
        return this.familyMembers;
    }

    getActiveMembers() {
        const currentMonth = new Date().getMonth();
        const activeMembers = new Set();
        
        this.familyTransactions
            .filter(t => {
                const tDate = new Date(t.date);
                return tDate.getMonth() === currentMonth;
            })
            .forEach(t => {
                activeMembers.add(t.payer);
            });
        
        return activeMembers.size;
    }

    getAverageExpensePerMember() {
        const monthlyExpense = this.getMonthlyFamilyExpense();
        const memberCount = this.familyMembers.length;
        return memberCount > 0 ? monthlyExpense / memberCount : 0;
    }

    getMemberMonthlyExpense(memberId) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return this.familyTransactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.payer === memberId && 
                       t.category !== '收入' && 
                       tDate.getMonth() === currentMonth && 
                       tDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);
    }

    getMemberBudgetUsage(memberId) {
        const expense = this.getMemberMonthlyExpense(memberId);
        const member = this.familyMembers.find(m => m.id === memberId);
        const budget = member ? member.budget : 0;
        
        return budget > 0 ? Math.min((expense / budget * 100), 100).toFixed(1) : 0;
    }

    getTotalBudget() {
        return this.familyBudgets.total || 0;
    }

    getUsedBudget() {
        return this.getMonthlyFamilyExpense();
    }

    getMemberName(memberId) {
        const member = this.familyMembers.find(m => m.id === memberId);
        return member ? member.name : '未知';
    }

    getRoleText(role) {
        const roleMap = {
            'admin': '管理员',
            'member': '普通成员',
            'child': '儿童'
        };
        return roleMap[role] || role;
    }

    getExpenseByCategory() {
        const currentMonth = new Date().getMonth();
        const expenseByCategory = {};
        
        this.familyTransactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.category !== '收入' && 
                       tDate.getMonth() === currentMonth;
            })
            .forEach(t => {
                expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
            });
        
        return expenseByCategory;
    }

    // 模态框相关方法
    showModal(title, content) {
        this.currentModal = { title, content };
        this.app.showModal(title, content);
    }

    hideModal() {
        this.app.hideModal();
        this.currentModal = null;
    }

    updateFamilyOverview() {
        // 更新家庭概览显示
        const familyPage = document.getElementById('family-mode-page');
        if (familyPage) {
            familyPage.innerHTML = this.render();
        }
    }

    // 初始化事件（供路由调用）
    initEvents() {
        // 设置全局变量
        window.familyModePage = this;
        
        // 加载家庭数据
        this.loadFamilyData();
        
        console.log('家庭模式页面事件初始化完成');
    }
}