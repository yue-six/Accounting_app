class FamilyModePage {
    constructor(app) {
        this.app = app;
        this.currentModal = null;
        this.modeDatabase = null;
        this.familySettings = {};
        this.familyMembers = [];
        this.familyTransactions = [];
        this.familyBudgets = {};
        this.currentUser = { name: "我", role: "admin", id: "default" };
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
        } catch (error) {
            console.error('初始化数据库失败:', error);
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
            this.familyBudgets = this.familySettings.shared_budget ? { monthly: this.familySettings.shared_budget } : {};
            
            console.log('✅ 从数据库加载家庭数据成功');
        } catch (error) {
            console.error('从数据库加载家庭数据失败:', error);
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
            this.currentUser = JSON.parse(localStorage.getItem('current_family_user') || '{"name": "我", "role": "admin", "id": "default"}');
            console.log('📁 从本地存储加载家庭数据');
        } catch (e) {
            console.error('加载家庭模式数据失败:', e);
        }
    }

    // 设置消费类型
    setExpenseType(type) {
        const buttons = document.querySelectorAll('.type-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === type) {
                btn.classList.add('active');
            }
        });
        this.currentExpenseType = type;
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
                            <div class="stat-card balance-card" onclick="familyModePage.editBalance()">
                                <div class="stat-value">¥${this.getFamilyBalance().toFixed(2)}</div>
                                <div class="stat-label">
                                    家庭总余额 
                                    <i class="fas fa-edit edit-icon" title="点击编辑"></i>
                                </div>
                                ${this.familySettings.manual_balance !== undefined ? 
                                    '<div class="balance-note">手动设置</div>' : 
                                    '<div class="balance-note">自动计算</div>'
                                }
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
                                    <button class="type-btn active" data-type="family" onclick="familyModePage.setExpenseType('family')">
                                        <i class="fas fa-home"></i> 家庭共同
                                    </button>
                                    <button class="type-btn" data-type="personal" onclick="familyModePage.setExpenseType('personal')">
                                        <i class="fas fa-user"></i> 个人消费
                                    </button>
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

    // 获取家庭余额（基于每月剩余金额累计）
    getFamilyBalance() {
        try {
            // 首先检查是否有手动设置的余额
            if (this.familySettings.manual_balance !== undefined) {
                return this.familySettings.manual_balance;
            }
            
            // 如果没有手动设置，则计算累计余额
            const monthlyBalances = this.calculateMonthlyBalances();
            return monthlyBalances.reduce((sum, balance) => sum + balance, 0);
        } catch (error) {
            console.error('计算家庭余额失败:', error);
            return 0;
        }
    }

    // 计算每月余额
    calculateMonthlyBalances() {
        const monthlyBalances = [];
        const transactionsByMonth = this.groupTransactionsByMonth();
        
        // 按月份排序（从早到晚）
        const sortedMonths = Object.keys(transactionsByMonth).sort();
        
        let cumulativeBalance = 0;
        
        for (const month of sortedMonths) {
            const monthTransactions = transactionsByMonth[month];
            const monthIncome = monthTransactions
                .filter(t => t.transaction_type === 'income')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
            
            const monthExpense = monthTransactions
                .filter(t => t.transaction_type === 'expense')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
            
            const monthBalance = monthIncome - monthExpense;
            cumulativeBalance += monthBalance;
            monthlyBalances.push(monthBalance);
        }
        
        return monthlyBalances;
    }

    // 按月份分组交易记录
    groupTransactionsByMonth() {
        const grouped = {};
        
        this.familyTransactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!grouped[monthKey]) {
                grouped[monthKey] = [];
            }
            grouped[monthKey].push(transaction);
        });
        
        return grouped;
    }

    // 设置手动余额
    async setManualBalance(balance) {
        try {
            this.familySettings.manual_balance = parseFloat(balance);
            this.familySettings.balance_updated_at = new Date().toISOString();
            
            await this.saveFamilyData();
            this.updateFamilyOverview();
            
            this.app.showToast('余额已更新', 'success');
        } catch (error) {
            console.error('设置手动余额失败:', error);
            this.app.showToast('更新余额失败', 'error');
        }
    }

    // 编辑余额
    editBalance() {
        if (this.currentUser.role !== 'admin') {
            this.app.showToast('只有管理员可以编辑余额', 'warning');
            return;
        }
        
        const currentBalance = this.getFamilyBalance();
        const isManual = this.familySettings.manual_balance !== undefined;
        
        const modalContent = `

                <div class="form-group">
                    <label>当前余额：¥${currentBalance.toFixed(2)}</label>
                    <input type="number" id="edit-balance-input" class="form-control" 
                           value="${currentBalance}" step="1" min="0" 
                           placeholder="请输入新的余额">
                </div>
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="use-auto-calc" ${!isManual ? 'checked' : ''}>
                        使用自动计算（基于每月剩余金额累计）
                    </label>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="familyModePage.closeModal()">取消</button>
                    <button class="btn btn-primary" onclick="familyModePage.confirmBalanceEdit()">确认</button>
                </div>

        `;
        
        this.showModal('编辑余额', modalContent);
    }

    // 确认余额编辑
    async confirmBalanceEdit() {
        try {
            const balanceInput = document.getElementById('edit-balance-input');
            const useAutoCalc = document.getElementById('use-auto-calc').checked;
            
            if (!balanceInput.value) {
                this.app.showToast('请输入余额', 'warning');
                return;
            }
            
            if (useAutoCalc) {
                // 使用自动计算，删除手动设置
                delete this.familySettings.manual_balance;
                delete this.familySettings.balance_updated_at;
            } else {
                // 使用手动设置
                const newBalance = parseFloat(balanceInput.value);
                if (isNaN(newBalance) || newBalance < 0) {
                    this.app.showToast('请输入有效的余额', 'warning');
                    return;
                }
                
                await this.setManualBalance(newBalance);
            }
            
            await this.saveFamilyData();
            this.closeModal();
            this.updateFamilyOverview();
            
        } catch (error) {
            console.error('确认余额编辑失败:', error);
            this.app.showToast('编辑失败', 'error');
        }
    }

    // 获取今日家庭支出
    getTodayFamilyExpense() {
        try {
            const today = new Date().toISOString().split('T')[0];
            return this.familyTransactions
                .filter(t => t.transaction_type === 'expense' && t.date === today)
                .reduce((sum, t) => sum + (t.amount || 0), 0);
        } catch (error) {
            console.error('计算今日家庭支出失败:', error);
            return 0;
        }
    }

    // 获取月度家庭收入
    getMonthlyFamilyIncome() {
        try {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            return this.familyTransactions
                .filter(t => {
                    const tDate = new Date(t.date);
                    return t.transaction_type === 'income' && 
                           tDate.getMonth() === currentMonth && 
                           tDate.getFullYear() === currentYear;
                })
                .reduce((sum, t) => sum + (t.amount || 0), 0);
        } catch (error) {
            console.error('计算月度家庭收入失败:', error);
            return 0;
        }
    }

    // 获取月度家庭支出
    getMonthlyFamilyExpense() {
        try {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            return this.familyTransactions
                .filter(t => {
                    const tDate = new Date(t.date);
                    return t.transaction_type === 'expense' &&
                           tDate.getMonth() === currentMonth && 
                           tDate.getFullYear() === currentYear;
                })
                .reduce((sum, t) => sum + (t.amount || 0), 0);
        } catch (error) {
            console.error('计算月度家庭支出失败:', error);
            return 0;
        }
    }

    // 获取活跃成员数
    getActiveMembers() {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const activeMembers = new Set();
            this.familyTransactions
                .filter(t => new Date(t.date) >= thirtyDaysAgo)
                .forEach(t => activeMembers.add(t.member_id || t.memberId));
                
            return activeMembers.size;
        } catch (error) {
            console.error('计算活跃成员数失败:', error);
            return 0;
        }
    }

    // 获取人均支出
    getAverageExpensePerMember() {
        try {
            const totalExpense = this.getMonthlyFamilyExpense();
            const memberCount = this.getFamilyMembers().length;
            return memberCount > 0 ? totalExpense / memberCount : 0;
        } catch (error) {
            console.error('计算人均支出失败:', error);
            return 0;
        }
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
                    <button class="modal-close" onclick="familyModePage.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        document.body.appendChild(modal);
        this.currentModal = modal;
    }

    // 移动端模态框方法
    showMobileModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'mobile-modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: flex-end;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;

        modal.innerHTML = `
            <div class="mobile-modal-container" style="
                background: white;
                border-radius: 20px 20px 0 0;
                width: 100%;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                animation: slideUp 0.3s ease;
            ">
                <div class="mobile-modal-header" style="
                    padding: 20px 20px 10px;
                    border-bottom: 1px solid rgba(0,0,0,0.1);
                    position: sticky;
                    top: 0;
                    background: white;
                    z-index: 10;
                ">
                    <h3 style="margin: 0; font-size: 1.2rem; font-weight: 600;">${title}</h3>
                    <button class="mobile-modal-close" onclick="familyModePage.closeModal()" style="
                        position: absolute;
                        right: 20px;
                        top: 20px;
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        color: #666;
                        cursor: pointer;
                    ">×</button>
                </div>
                <div class="mobile-modal-body" style="padding: 15px;">
                    ${content}
                </div>
            </div>
        `;

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        document.body.appendChild(modal);
        this.currentModal = modal;
    }

    closeModal() {
        if (this.currentModal) {
            document.body.removeChild(this.currentModal);
            this.currentModal = null;
        }
    }

    // 初始化事件
    async initEvents() {
        familyModePage = this;
        
        // 确保数据已加载
        if (!this.familyTransactions.length) {
            await this.loadFamilyDataFromDatabase();
        }
        
        // 更新页面显示
        this.updateFamilyOverview();
        
        console.log('家庭模式页面事件初始化完成');
    }
    
    // 更新家庭概览显示
    updateFamilyOverview() {
        // 更新统计卡片数据
        const balanceEl = document.querySelector('.family-overview .stat-card:nth-child(1) .stat-value');
        const todayExpenseEl = document.querySelector('.family-overview .stat-card:nth-child(2) .stat-value');
        const monthlyIncomeEl = document.querySelector('.family-overview .stat-card:nth-child(3) .stat-value');
        const monthlyExpenseEl = document.querySelector('.family-overview .stat-card:nth-child(4) .stat-value');
        
        if (balanceEl) balanceEl.textContent = `¥${this.getFamilyBalance().toFixed(2)}`;
        if (todayExpenseEl) todayExpenseEl.textContent = `¥${this.getTodayFamilyExpense().toFixed(2)}`;
        if (monthlyIncomeEl) monthlyIncomeEl.textContent = `¥${this.getMonthlyFamilyIncome().toFixed(2)}`;
        if (monthlyExpenseEl) monthlyExpenseEl.textContent = `¥${this.getMonthlyFamilyExpense().toFixed(2)}`;
        
        // 更新成员统计
        const memberCountEl = document.querySelector('.members-overview .stat-item:nth-child(1) .stat-number');
        const activeMembersEl = document.querySelector('.members-overview .stat-item:nth-child(2) .stat-number');
        const avgExpenseEl = document.querySelector('.members-overview .stat-item:nth-child(3) .stat-number');
        
        if (memberCountEl) memberCountEl.textContent = this.getFamilyMembers().length;
        if (activeMembersEl) activeMembersEl.textContent = this.getActiveMembers();
        if (avgExpenseEl) avgExpenseEl.textContent = `¥${this.getAverageExpensePerMember().toFixed(0)}`;
    }

    // 切换用户
    switchUser() {
        const members = this.getFamilyMembers();
        if (members.length === 0) {
            this.app.showToast('暂无其他家庭成员可切换', 'warning');
            return;
        }

        const modalContent = `
            <div class="mobile-modal-content">
                <h3>切换家庭成员</h3>
                <div class="user-switch-list">
                    ${members.map(member => `
                        <div class="user-switch-item ${this.currentUser.id === member.id ? 'active' : ''}">
                            <div class="user-item-main" onclick="familyModePage.selectUser('${member.id}')">
                                <div class="user-avatar">${member.name.charAt(0)}</div>
                                <div class="user-info">
                                    <div class="user-name">${member.name}</div>
                                    <div class="user-role">${this.getRoleText(member.role)}</div>
                                </div>
                                ${this.currentUser.id === member.id ? 
                                    '<div class="current-indicator"><i class="fas fa-check"></i> 当前用户</div>' : 
                                    '<div class="switch-btn">切换</div>'
                                }
                            </div>
                            ${this.currentUser.role === 'admin' && member.id !== 'default' && this.currentUser.id !== member.id ? 
                                `<div class="delete-btn" onclick="event.stopPropagation(); familyModePage.deleteMember('${member.id}')">
                                    <i class="fas fa-trash-alt"></i> 删除
                                </div>` : ''
                            }
                        </div>
                    `).join('')}
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="familyModePage.closeModal()">取消</button>
                </div>
            </div>
        `;
        
        // 调整弹窗样式，确保从手机框架底部弹出
        const modal = document.createElement('div');
        modal.className = 'mobile-modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: flex-end;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
            width: 100%;
            max-width: 375px;
            margin: 0 auto;
            box-sizing: border-box;
            height: 100%;
        `;

        modal.innerHTML = `
            <div class="mobile-modal-container" style="
                background: white;
                border-radius: 20px 20px 0 0;
                width: 100%;
                max-height: 70vh;
                overflow-y: auto;
                animation: slideUp 0.3s ease-out;
                box-shadow: 0 -4px 16px rgba(0,0,0,0.15);
                box-sizing: border-box;
                transform-origin: bottom center;
                position: absolute;
                bottom: 60px;
                left: 0;
                right: 0;
                z-index: 10001;
            ">
                <div class="mobile-modal-header" style="
                    padding: 15px 15px 10px;
                    border-bottom: 1px solid rgba(0,0,0,0.1);
                    position: sticky;
                    top: 0;
                    background: white;
                    z-index: 10;
                ">
                    <h3 style="margin: 0; font-size: 1.1rem; font-weight: 600;">切换用户</h3>
                    <button class="mobile-modal-close" onclick="familyModePage.closeModal()" style="
                        position: absolute;
                        right: 15px;
                        top: 15px;
                        background: none;
                        border: none;
                        font-size: 1.3rem;
                        color: #666;
                        cursor: pointer;
                        padding: 5px;
                    ">×</button>
                </div>
                <div class="mobile-modal-body" style="padding: 20px;">
                    ${modalContent}
                </div>
            </div>
        `;

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        document.body.appendChild(modal);
        this.currentModal = modal;
    }

    // 选择用户
    async selectUser(userId) {
        if (this.currentUser.id === userId) {
            this.closeModal();
            return;
        }

        // 从包含管理员的成员列表中查找用户
        const members = this.getFamilyMembers();
        const member = members.find(m => m.id === userId);
        
        if (!member) {
            this.app.showToast('用户不存在', 'error');
            return;
        }

        this.currentUser = { ...member };
        
        // 保存当前用户信息
        if (this.modeDatabase) {
            await this.modeDatabase.saveFamilyModeSettings({
                ...this.familySettings,
                current_user_id: userId
            });
        } else {
            localStorage.setItem('current_family_user', JSON.stringify(this.currentUser));
        }

        this.closeModal();
        this.updateFamilyOverview();
        this.app.showToast(`已切换到 ${member.name}`, 'success');
    }
    
    // 删除成员
    async deleteMember(memberId) {
        if (this.currentUser.role !== 'admin') {
            this.app.showToast('只有管理员可以删除成员', 'warning');
            return;
        }
        
        // 不能删除默认管理员
        if (memberId === 'default') {
            this.app.showToast('不能删除默认管理员', 'warning');
            return;
        }
        
        // 找到要删除的成员
        const memberIndex = this.familyMembers.findIndex(m => m.id === memberId);
        if (memberIndex === -1) {
            this.app.showToast('成员不存在', 'error');
            return;
        }
        
        const memberName = this.familyMembers[memberIndex].name;
        
        // 使用手机模式弹窗确认删除
        this.showDeleteConfirmationModal(memberId, memberName);
    }
    
    // 显示删除确认弹窗（手机模式）
    showDeleteConfirmationModal(memberId, memberName) {
        // 先关闭当前的切换用户弹窗
        this.closeModal();
        
        const modalContent = `
            <div class="delete-confirm-content">
                <div class="warning-icon"><i class="fas fa-exclamation-triangle"></i></div>
                <h4>确认删除</h4>
                <p>确定要删除成员「${memberName}」吗？</p>
                <p class="delete-note">此操作不可撤销。</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="familyModePage.closeModal()">取消</button>
                    <button class="btn btn-danger" onclick="familyModePage.confirmDelete('${memberId}')">删除</button>
                </div>
            </div>
        `;
        
        // 创建手机模式的确认弹窗
        const modal = document.createElement('div');
        modal.className = 'mobile-modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: flex-end;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
            width: 100%;
            max-width: 375px;
            margin: 0 auto;
            box-sizing: border-box;
            height: 100%;
        `;

        modal.innerHTML = `
            <div class="mobile-modal-container" style="
                background: white;
                border-radius: 20px 20px 0 0;
                width: 100%;
                max-width: 320px;
                position: absolute;
                bottom: 60px;
                left: 0;
                right: 0;
                margin: 0 auto;
                z-index: 10001;
                animation: slideUp 0.3s ease-out;
                transform-origin: bottom center;
                box-shadow: 0 4px 15px rgba(0,0,0,0.15);
            ">
                <div class="mobile-modal-body" style="padding: 20px;">
                    ${modalContent}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.currentModal = modal;
    }
    
    // 确认删除成员
    async confirmDelete(memberId) {
        try {
            // 找到要删除的成员
            const memberIndex = this.familyMembers.findIndex(m => m.id === memberId);
            if (memberIndex === -1) {
                this.app.showToast('成员不存在', 'error');
                this.closeModal();
                return;
            }
            
            const memberName = this.familyMembers[memberIndex].name;
            
            // 从成员列表中移除
            this.familyMembers.splice(memberIndex, 1);
            
            // 保存数据
            await this.saveFamilyData();
            
            // 先显示成功提示
            this.app.showToast(`已删除成员「${memberName}」`, 'success');
            
            // 关闭确认弹窗
            this.closeModal();
            
            // 更新页面显示，使用更安全的方式更新而不是直接render
            this.updateFamilyOverview();
            
        } catch (error) {
            console.error('删除成员失败:', error);
            // 即使出错也要关闭弹窗
            this.closeModal();
            this.app.showToast('删除成员失败，请重试', 'error');
        }
    }

    // 显示添加成员
    showAddMember() {
        const inviteContent = `
            <div class="invite-container">
                <h3>邀请家庭成员</h3>
                <div class="invite-form">
                    <div class="form-group">
                        <label>成员姓名</label>
                        <input type="text" id="member-name" class="form-control" 
                               placeholder="请输入成员姓名" maxlength="20">
                    </div>
                    <div class="form-group">
                        <label>成员角色</label>
                        <select id="member-role" class="form-control">
                            <option value="member">普通成员</option>
                            <option value="admin">管理员</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>邀请方式</label>
                        <div class="invite-methods">
                            <div class="invite-method active" data-method="link">
                                <i class="fas fa-link"></i>
                                <span>分享链接</span>
                            </div>
                            <div class="invite-method" data-method="qr">
                                <i class="fas fa-qrcode"></i>
                                <span>二维码</span>
                            </div>
                        </div>
                    </div>
                    <div class="invite-link-section">
                        <div class="invite-link">
                            <input type="text" id="invite-link" class="form-control" 
                                   value="https://accounting.app/family/join?code=INVITE123" readonly>
                            <button class="btn btn-sm" onclick="familyModePage.copyInviteLink()">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                        <div class="invite-actions">
                            <button class="btn btn-secondary" onclick="familyModePage.shareLink()">
                                <i class="fas fa-share"></i> 分享
                            </button>
                            <button class="btn btn-primary" onclick="familyModePage.generateNewLink()">
                                <i class="fas fa-sync"></i> 刷新
                            </button>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="familyModePage.closeInvite()">取消</button>
                    <button class="btn btn-primary" onclick="familyModePage.confirmAddMember()">确认邀请</button>
                </div>
            </div>
        `;
        
        // 直接显示弹窗内容
        const inviteContainer = document.createElement('div');
        inviteContainer.className = 'invite-container';
        inviteContainer.innerHTML = inviteContent;
        
        // 添加到页面
        document.getElementById('family-members-list').appendChild(inviteContainer);
        
        // 初始化邀请方式切换
        setTimeout(() => {
            this.initInviteMethods();
        }, 100);
    }
    
    closeInvite() {
        const inviteContainer = document.querySelector('.invite-container');
        if (inviteContainer) {
            inviteContainer.remove();
        }
    }

    // 初始化邀请方式
    initInviteMethods() {
        const methods = document.querySelectorAll('.invite-method');
        methods.forEach(method => {
            method.addEventListener('click', () => {
                methods.forEach(m => m.classList.remove('active'));
                method.classList.add('active');
                
                const methodType = method.dataset.method;
                this.switchInviteMethod(methodType);
            });
        });
    }

    // 切换邀请方式
    switchInviteMethod(method) {
        const linkSection = document.querySelector('.invite-link-section');
        const qrSection = document.querySelector('.invite-qr-section');
        
        if (method === 'link') {
            if (linkSection) linkSection.style.display = 'block';
            if (qrSection) qrSection.style.display = 'none';
        } else if (method === 'qr') {
            if (linkSection) linkSection.style.display = 'none';
            if (qrSection) qrSection.style.display = 'block';
            this.generateQRCode();
        }
    }

    // 生成邀请链接
    generateInviteLink() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `https://accounting.app/family/join?code=INVITE_${timestamp}_${random}`;
    }

    // 复制邀请链接
    copyInviteLink() {
        const linkInput = document.getElementById('invite-link');
        if (linkInput) {
            linkInput.select();
            document.execCommand('copy');
            this.app.showToast('链接已复制到剪贴板', 'success');
        }
    }

    // 分享链接
    shareLink() {
        if (navigator.share) {
            navigator.share({
                title: '加入我的家庭记账',
                text: '快来加入我的家庭记账，一起管理家庭财务吧！',
                url: document.getElementById('invite-link').value
            });
        } else {
            this.copyInviteLink();
        }
    }

    // 生成新链接
    generateNewLink() {
        const newLink = this.generateInviteLink();
        const linkInput = document.getElementById('invite-link');
        if (linkInput) {
            linkInput.value = newLink;
            this.app.showToast('已生成新的邀请链接', 'success');
        }
    }

    // 生成二维码
    generateQRCode() {
        const qrSection = document.querySelector('.invite-qr-section');
        if (!qrSection) {
            const modalBody = document.querySelector('.mobile-modal-content .invite-form');
            if (modalBody) {
                modalBody.insertAdjacentHTML('beforeend', `
                    <div class="invite-qr-section" style="display: none;">
                        <div class="qr-code-container">
                            <div class="qr-code-placeholder">
                                <i class="fas fa-qrcode"></i>
                                <p>扫描二维码加入家庭</p>
                            </div>
                        </div>
                        <div class="qr-actions">
                            <button class="btn btn-primary" onclick="familyModePage.downloadQRCode()">
                                <i class="fas fa-download"></i> 保存二维码
                            </button>
                        </div>
                    </div>
                `);
            }
        }
    }

    // 下载二维码
    downloadQRCode() {
        this.app.showToast('二维码保存功能开发中', 'info');
    }

    // 确认添加成员
    async confirmAddMember() {
        const nameInput = document.getElementById('member-name');
        const roleSelect = document.getElementById('member-role');
        
        if (!nameInput || !roleSelect) {
            this.app.showToast('表单加载失败，请重试', 'error');
            return;
        }

        const name = nameInput.value.trim();
        const role = roleSelect.value;

        if (!name) {
            this.app.showToast('请输入成员姓名', 'warning');
            return;
        }

        if (name.length > 20) {
            this.app.showToast('姓名不能超过20个字符', 'warning');
            return;
        }

        // 检查是否已存在同名成员
        const existingMember = this.familyMembers.find(m => m.name === name);
        if (existingMember) {
            this.app.showToast('该成员已存在', 'warning');
            return;
        }

        // 创建新成员
        const newMember = {
            id: 'member_' + Date.now(),
            name: name,
            role: role,
            created_at: new Date().toISOString(),
            status: 'invited'
        };

        // 添加到成员列表
        this.familyMembers.push(newMember);

        // 保存数据
        await this.saveFamilyData();

        this.closeModal();
        this.updateFamilyOverview();
        
        this.app.showToast(`已邀请 ${name} 加入家庭`, 'success');
    }

    // 提交交易
    async submitTransaction() {
        try {
            const amount = parseFloat(document.getElementById('transaction-amount').value);
            const category = document.getElementById('transaction-category').value;
            const note = document.getElementById('transaction-note').value;
            const expenseType = document.querySelector('.expense-type-buttons .type-btn.active').dataset.type;
            
            if (!amount || amount <= 0) {
                this.app.showToast('请输入有效金额', 'warning');
                return;
            }
            
            const transaction = {
                amount: amount,
                category: category,
                description: note || '家庭支出',
                transaction_type: 'expense',
                expense_type: expenseType,
                date: new Date().toISOString().split('T')[0],
                member_id: this.currentUser.id,
                member_name: this.currentUser.name
            };
            
            if (this.modeDatabase) {
                // 保存到数据库
                const success = await this.modeDatabase.addFamilyTransaction({
                    ...transaction,
                    family_id: this.familySettings.id || 'default_family'
                });
                
                if (success) {
                    this.familyTransactions.unshift(transaction);
                }
            } else {
                // 保存到本地存储
                this.familyTransactions.unshift(transaction);
            }
            
            // 保存数据
            await this.saveFamilyData();
            
            // 更新显示
            this.updateFamilyOverview();
            this.clearTransaction();
            
            this.app.showToast('记账成功', 'success');
            
        } catch (error) {
            console.error('提交交易失败:', error);
            this.app.showToast('记账失败，请重试', 'error');
        }
    }

    // 清空交易
    clearTransaction() {
        document.getElementById('transaction-amount').value = '';
        document.getElementById('transaction-note').value = '';
    }

    // 保存家庭数据
    async saveFamilyData() {
        try {
            if (this.modeDatabase) {
                // 保存到数据库
                await this.saveFamilyDataToDatabase();
            } else {
                // 保存到本地存储
                this.saveFamilyDataToLocalStorage();
            }
        } catch (error) {
            console.error('保存家庭数据失败:', error);
            // 降级到本地存储
            this.saveFamilyDataToLocalStorage();
        }
    }

    // 保存家庭数据到数据库
    async saveFamilyDataToDatabase() {
        try {
            // 更新家庭模式设置
            const settingsToSave = {
                ...this.familySettings,
                family_members: this.familyMembers,
                shared_budget: this.familyBudgets.monthly || 0,
                updated_at: new Date().toISOString()
            };
            
            await this.modeDatabase.saveFamilyModeSettings(settingsToSave);
            
            console.log('✅ 家庭数据已保存到数据库');
        } catch (error) {
            console.error('保存家庭数据到数据库失败:', error);
            throw error;
        }
    }

    // 保存家庭数据到本地存储
    saveFamilyDataToLocalStorage() {
        try {
            localStorage.setItem('family_members', JSON.stringify(this.familyMembers));
            localStorage.setItem('family_transactions', JSON.stringify(this.familyTransactions));
            localStorage.setItem('family_budgets', JSON.stringify(this.familyBudgets));
            localStorage.setItem('family_mode_settings', JSON.stringify(this.familySettings));
            console.log('📁 家庭数据已保存到本地存储');
        } catch (e) {
            console.error('保存家庭数据到本地存储失败:', e);
        }
    }
}

// 全局变量
let familyModePage;