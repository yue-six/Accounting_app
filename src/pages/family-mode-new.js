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

                <!-- 快速记账 -->
                <div class="card">
                    <h3><i class="fas fa-plus-circle"></i> 智能记账</h3>
                    <div class="quick-transaction">
                        <div class="transaction-form">
                            <div class="input-group">
                                <label>金额</label>
                                <input type="number" id="transaction-amount" placeholder="请输入金额">
                            </div>
                            
                            <div class="input-group">
                                <label>分类</label>
                                <select id="transaction-category">
                                    <option value="food">餐饮</option>
                                    <option value="shopping">购物</option>
                                    <option value="transport">交通</option>
                                    <option value="entertainment">娱乐</option>
                                    <option value="other">其他</option>
                                </select>
                            </div>
                            
                            <div class="input-group">
                                <label>消费类型</label>
                                <div class="expense-type-buttons">
                                    <button class="type-btn active" data-type="family">家庭共同</button>
                                    <button class="type-btn" data-type="personal">个人消费</button>
                                </div>
                            </div>
                            
                            <div class="input-group">
                                <label>备注</label>
                                <input type="text" id="transaction-note" placeholder="添加备注（可选）">
                            </div>
                            
                            <div class="transaction-actions">
                                <button class="btn btn-primary" onclick="familyModePage.submitTransaction()">确认记账</button>
                                <button class="btn btn-secondary" onclick="familyModePage.clearTransaction()">清空</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
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

    // 获取家庭余额
    getFamilyBalance() {
        const totalIncome = this.familyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpense = this.familyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        return totalIncome - totalExpense;
    }

    // 获取今日家庭支出
    getTodayFamilyExpense() {
        const today = new Date().toISOString().split('T')[0];
        return this.familyTransactions
            .filter(t => t.type === 'expense' && t.date === today)
            .reduce((sum, t) => sum + t.amount, 0);
    }

    // 获取月度家庭收入
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
            .reduce((sum, t) => sum + t.amount, 0);
    }

    // 获取月度家庭支出
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
            .reduce((sum, t) => sum + t.amount, 0);
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

    // 获取角色文本
    getRoleText(role) {
        const roles = {
            admin: '管理员',
            member: '成员'
        };
        return roles[role] || role;
    }

    // 渲染家庭成员列表
    renderFamilyMembers() {
        if (this.familyMembers.length === 0) {
            return '<div class="empty-state">暂无其他家庭成员</div>';
        }
        
        return this.familyMembers.map(member => `
            <div class="member-item">
                <div class="member-avatar">${member.name.charAt(0)}</div>
                <div class="member-info">
                    <div class="member-name">${member.name}</div>
                    <div class="member-role">${this.getRoleText(member.role)}</div>
                </div>
            </div>
        `).join('');
    }

    // 初始化事件
    initEvents() {
        familyModePage = this;
    }

    // 切换用户
    switchUser() {
        alert('切换用户功能开发中');
    }

    // 显示添加成员
    showAddMember() {
        alert('添加成员功能开发中');
    }

    // 提交交易
    submitTransaction() {
        alert('记账功能开发中');
    }

    // 清空交易
    clearTransaction() {
        document.getElementById('transaction-amount').value = '';
        document.getElementById('transaction-note').value = '';
    }
}

// 全局变量
let familyModePage;