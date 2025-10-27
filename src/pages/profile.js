// 我的页面组件
class ProfilePage {
    constructor(app) {
        this.app = app;
        this.currentModal = null;

        // 加载用户模式设置
        this.loadModeSettings();
    }

    // 加载用户模式设置
    loadModeSettings() {
        const mode = this.app.userMode;
        if (!mode) return;

        try {
            switch(mode) {
                case '学生模式':
                    this.studentSettings = JSON.parse(localStorage.getItem('student_mode_settings') || '{}');
                    break;
                case '家庭模式':
                    this.familySettings = JSON.parse(localStorage.getItem('family_mode_settings') || '{}');
                    break;
                case '自由职业':
                    this.freelancerSettings = JSON.parse(localStorage.getItem('freelancer_mode_settings') || '{}');
                    break;
            }
        } catch (e) {
            console.error('加载用户模式设置失败:', e);
        }
    }

    // 渲染页面
    render() {
        return `
            <div class="page active" id="profile-page">
                <!-- 个人信息 -->
                <div class="profile-header">
                    <div class="profile-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="profile-name" id="profile-nickname">未登录</div>
                    <div class="profile-email" id="profile-contact">--</div>
                    
                    <!-- 登录按钮 -->
                    <div id="user-info" style="margin-top: 15px;">
                        <button id="wechat-login-btn" class="btn btn-primary" style="width: 100%; background: #09bb07; margin-bottom: 8px;">
                            <i class="fab fa-weixin" style="margin-right: 8px;"></i>
                            微信登录
                        </button>
                        <button id="alipay-login-btn" class="btn btn-primary" style="width: 100%; background: #1677ff; margin-bottom: 8px;">
                            <i class="fab fa-alipay" style="margin-right: 8px;"></i>
                            支付宝登录
                        </button>
                        <button id="logout-btn" class="btn btn-secondary" style="width: 100%; display: none;">
                            <i class="fas fa-sign-out-alt" style="margin-right: 8px;"></i>
                            退出登录
                        </button>
                    </div>
                </div>

                <!-- 功能菜单 -->
                <div class="card">
                    <ul class="menu-list">
                        <li class="menu-item" onclick="profilePage.showSettings()">
                            <div class="menu-icon">
                                <i class="fas fa-cog"></i>
                            </div>
                            <div class="menu-content">
                                <div class="menu-title">账户设置</div>
                                <div class="menu-desc">修改个人信息和安全设置</div>
                            </div>
                            <div class="menu-arrow">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </li>
                        <li class="menu-item" onclick="profilePage.showPrivacy()">
                            <div class="menu-icon">
                                <i class="fas fa-shield-alt"></i>
                            </div>
                            <div class="menu-content">
                                <div class="menu-title">隐私与安全</div>
                                <div class="menu-desc">数据加密和隐私保护</div>
                            </div>
                            <div class="menu-arrow">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </li>
                        <li class="menu-item" onclick="profilePage.showBackup()">
                            <div class="menu-icon">
                                <i class="fas fa-cloud-upload-alt"></i>
                            </div>
                            <div class="menu-content">
                                <div class="menu-title">数据备份</div>
                                <div class="menu-desc">自动备份和恢复数据</div>
                            </div>
                            <div class="menu-arrow">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </li>
                        <li class="menu-item" onclick="profilePage.showNotifications()">
                            <div class="menu-icon">
                                <i class="fas fa-bell"></i>
                            </div>
                            <div class="menu-content">
                                <div class="menu-title">消息通知</div>
                                <div class="menu-desc">预算提醒和交易通知</div>
                            </div>
                            <div class="menu-arrow">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </li>
                        <li class="menu-item" onclick="profilePage.showHelp()">
                            <div class="menu-icon">
                                <i class="fas fa-question-circle"></i>
                            </div>
                            <div class="menu-content">
                                <div class="menu-title">帮助与反馈</div>
                                <div class="menu-desc">使用指南和问题反馈</div>
                            </div>
                            <div class="menu-arrow">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </li>
                        <li class="menu-item" onclick="profilePage.logout()">
                            <div class="menu-icon">
                                <i class="fas fa-sign-out-alt"></i>
                            </div>
                            <div class="menu-content">
                                <div class="menu-title">退出登录</div>
                                <div class="menu-desc">清除登录状态并返回登录页</div>
                            </div>
                            <div class="menu-arrow">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </li>
                    </ul>
                </div>

                <!-- 用户模式 -->
                <div class="card">
                    <h3><i class="fas fa-user-tag"></i> 用户模式</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                        <div class="mode-btn ${this.app.userMode === '学生模式' ? 'active' : ''}" onclick="profilePage.setUserMode('学生模式')">
                            <div>学生模式</div>
                            <small style="font-size: 0.8em; color: #718096;">生活费分配 · 兼职收入</small>
                        </div>
                        <div class="mode-btn ${this.app.userMode === '家庭模式' ? 'active' : ''}" onclick="profilePage.setUserMode('家庭模式')">
                            <div>家庭模式</div>
                            <small style="font-size: 0.8em; color: #718096;">多人共享 · 家庭开支</small>
                        </div>
                        <div class="mode-btn ${this.app.userMode === '自由职业' ? 'active' : ''}" onclick="profilePage.setUserMode('自由职业')">
                            <div>自由职业</div>
                            <small style="font-size: 0.8em; color: #718096;">经营收支 · 税务申报</small>
                        </div>
                    </div>
                </div>

                <!-- 目标储蓄 -->
                <div class="card">
                    <h3><i class="fas fa-piggy-bank"></i> 目标储蓄</h3>
                    <div class="savings-summary" id="savings-summary" style="margin-bottom: 15px; padding: 10px; background: #e6fffa; border-radius: 8px;">
                        <!-- 储蓄建议将通过 JavaScript 动态生成 -->
                    </div>
                    <div class="savings-goals" id="savings-goals-list">
                        <!-- 储蓄目标列表将通过 JavaScript 动态生成 -->
                    </div>
                    <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="profilePage.showAddSavingsGoal()">
                        <i class="fas fa-plus"></i> 添加储蓄目标
                    </button>
                </div>

                <!-- 数据管理 -->
                <div class="card">
                    <h3><i class="fas fa-database"></i> 数据管理</h3>
                    <div class="quick-actions">
                        <button class="action-btn" onclick="profilePage.exportData()">
                            <i class="fas fa-file-export"></i> 导出数据
                        </button>
                        <button class="action-btn" onclick="profilePage.importData()">
                            <i class="fas fa-file-import"></i> 导入数据
                        </button>
                        <button class="action-btn" onclick="profilePage.clearData()">
                            <i class="fas fa-trash"></i> 清除数据
                        </button>
                        <button class="action-btn" onclick="profilePage.showStatistics()">
                            <i class="fas fa-chart-bar"></i> 数据统计
                        </button>
                    </div>
                </div>

                <!-- 应用信息 -->
                <div class="card">
                    <h3><i class="fas fa-info-circle"></i> 应用信息</h3>
                    <div style="color: #718096; font-size: 0.9rem; line-height: 1.5;">
                        <p><strong>版本:</strong> 1.0.0</p>
                        <p><strong>数据统计:</strong></p>
                        <p>交易记录: <span id="transaction-count">${this.app.transactions.length}</span> 条</p>
                        <p>最后更新: <span id="last-update">${new Date().toLocaleTimeString('zh-CN')}</span></p>
                        <p>用户模式: <span id="user-mode">${this.app.userMode}</span></p>
                    </div>
                </div>
            </div>
        `;
    }

    // 初始化事件
    initEvents() {
        // 设置全局变量
        profilePage = this;

        // 绑定登录按钮事件
        this.bindLoginEvents();

        // 用户模式切换
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.querySelector('div')?.textContent.trim() || e.target.textContent.trim();
                this.setUserMode(mode);
            });
        });

        // 初始化储蓄目标列表
        this.updateSavingsGoalsList();

        // 加载用户模式设置
        this.loadModeSettings();

        // 更新用户模式显示
        const userModeEl = document.getElementById('user-mode');
        if (userModeEl) {
            userModeEl.textContent = this.app.userMode || '未设置';
        }
    }

    // 绑定登录相关事件
    bindLoginEvents() {
        // 微信登录按钮
        const wechatLoginBtn = document.getElementById('wechat-login-btn');
        if (wechatLoginBtn) {
            wechatLoginBtn.addEventListener('click', () => {
                this.app.showWechatLogin();
            });
        }

        // 支付宝登录按钮
        const alipayLoginBtn = document.getElementById('alipay-login-btn');
        if (alipayLoginBtn) {
            alipayLoginBtn.addEventListener('click', () => {
                this.app.showAlipayLogin();
            });
        }

        // 登出按钮
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.app.logout();
            });
        }
    }

    // 更新数据
    updateData() {
        // 更新应用信息
        const transactionCount = document.getElementById('transaction-count');
        const lastUpdate = document.getElementById('last-update');
        const userMode = document.getElementById('user-mode');
        if (transactionCount) transactionCount.textContent = this.app.transactions.length;
        if (lastUpdate) lastUpdate.textContent = new Date().toLocaleTimeString('zh-CN');
        if (userMode) userMode.textContent = this.app.userMode;

        // 同步登录用户信息到头像区（避免再次调用 app.updateUserInfo() 导致递归）
        try {
            const user = this.app.getCurrentUser();
            const nameEl = document.getElementById('profile-nickname');
            const contactEl = document.getElementById('profile-contact');
            if (nameEl) nameEl.textContent = user?.nickname || '未登录';
            if (contactEl) contactEl.textContent = user?.phone || (user?.provider ? `第三方：${user.provider}` : '--');
        } catch (e) {
            console.error('更新个人页头像区信息失败:', e);
        }

        // 更新储蓄目标列表
        this.updateSavingsGoalsList();

        // 更新用户模式按钮状态
        document.querySelectorAll('.mode-btn').forEach(btn => {
            const mode = btn.querySelector('div')?.textContent.trim() || btn.textContent.trim();
            btn.classList.toggle('active', mode === this.app.userMode);
        });

        // 加载并显示当前模式的设置
        this.loadModeSettings();

        // 计算并显示每日/每月储蓄建议
        this.updateSavingsSuggestions();
    }

    // 设置用户模式
    setUserMode(mode) {
        this.app.setUserMode(mode);
        
        // 更新UI
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.querySelector('div').textContent.trim() === mode) {
                btn.classList.add('active');
            }
        });

        // 根据不同模式显示特定功能
        switch(mode) {
            case '学生模式':
                this.showStudentModeSettings();
                break;
            case '家庭模式':
                this.showFamilyModeSettings();
                break;
            case '自由职业':
                this.showFreelancerModeSettings();
                break;
        }
        
        this.updateData();
    }

    // 显示学生模式设置
    showStudentModeSettings() {
        this.showModal('学生模式设置', `
            <div style="padding: 20px;">
                <div class="input-group">
                    <label>每月生活费</label>
                    <input type="number" id="monthly-allowance" placeholder="请输入金额">
                </div>
                <div class="input-group">
                    <label>兼职收入目标</label>
                    <input type="number" id="part-time-goal" placeholder="请输入金额">
                </div>
                <div class="input-group">
                    <label>学费储蓄计划</label>
                    <input type="number" id="tuition-savings" placeholder="请输入目标金额">
                </div>
                <div class="button-group">
                    <button class="btn btn-primary" onclick="profilePage.saveStudentSettings()">保存</button>
                    <button class="btn btn-secondary" onclick="profilePage.hideModal()">取消</button>
                </div>
            </div>
        `);
    }

    // 显示家庭模式设置
    showFamilyModeSettings() {
        this.showModal('家庭模式设置', `
            <div style="padding: 20px;">
                <div class="input-group">
                    <label>家庭成员</label>
                    <div id="family-members">
                        <div class="member-item">
                            <input type="text" placeholder="成员姓名">
                            <select>
                                <option>家长</option>
                                <option>配偶</option>
                                <option>子女</option>
                            </select>
                        </div>
                    </div>
                    <button class="btn btn-secondary" onclick="profilePage.addFamilyMember()" style="margin-top: 10px;">
                        <i class="fas fa-plus"></i> 添加成员
                    </button>
                </div>
                <div class="input-group">
                    <label>月度家庭预算</label>
                    <input type="number" id="family-budget" placeholder="请输入金额">
                </div>
                <div class="button-group">
                    <button class="btn btn-primary" onclick="profilePage.saveFamilySettings()">保存</button>
                    <button class="btn btn-secondary" onclick="profilePage.hideModal()">取消</button>
                </div>
            </div>
        `);
    }

    // 显示自由职业者模式设置
    showFreelancerModeSettings() {
        this.showModal('自由职业者模式设置', `
            <div style="padding: 20px;">
                <div class="input-group">
                    <label>经营类型</label>
                    <select id="business-type">
                        <option>个人工作室</option>
                        <option>网络自媒体</option>
                        <option>咨询顾问</option>
                        <option>其他</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>月度收入目标</label>
                    <input type="number" id="income-target" placeholder="请输入金额">
                </div>
                <div class="input-group">
                    <label>税率设置</label>
                    <input type="number" id="tax-rate" placeholder="请输入税率" max="100" min="0">
                </div>
                <div class="button-group">
                    <button class="btn btn-primary" onclick="profilePage.saveFreelancerSettings()">保存</button>
                    <button class="btn btn-secondary" onclick="profilePage.hideModal()">取消</button>
                </div>
            </div>
        `);
    }

    // 导出数据
    exportData() {
        this.app.exportData();
    }

    // 导入数据
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        this.app.transactions = data.transactions || [];
                        this.app.budgets = data.budgets || {};
                        this.app.userMode = data.userMode || '学生模式';
                        this.app.saveData();
                        this.updateData();
                        this.app.showToast('数据导入成功！');
                    } catch (error) {
                        this.app.showToast('导入失败：文件格式错误');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    // 清除数据
    clearData() {
        if (confirm('确定要清除所有数据吗？此操作不可撤销！')) {
            this.app.clearData();
            this.updateData();
        }
    }

    // 显示设置
    showSettings() {
        this.showModal('账户设置', `
            <div style="padding: 20px;">
                <div class="input-group">
                    <label>用户名</label>
                    <input type="text" value="张三" placeholder="请输入用户名">
                </div>
                <div class="input-group">
                    <label>邮箱</label>
                    <input type="email" value="zhangsan@example.com" placeholder="请输入邮箱">
                </div>
                <div class="input-group">
                    <label>手机号</label>
                    <input type="tel" value="138****8888" placeholder="请输入手机号">
                </div>
                <div class="button-group">
                    <button class="btn btn-primary" onclick="profilePage.saveSettings()">保存</button>
                    <button class="btn btn-secondary" onclick="profilePage.hideModal()">取消</button>
                </div>
            </div>
        `);
    }

    // 显示隐私设置
    showPrivacy() {
        this.showModal('隐私与安全', `
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px;">数据保护</h4>
                    <p style="color: #718096; font-size: 0.9rem;">您的数据在本地加密存储，确保隐私安全。</p>
                </div>
                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px;">权限管理</h4>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span>位置权限</span>
                        <label class="switch">
                            <input type="checkbox" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>通知权限</span>
                        <label class="switch">
                            <input type="checkbox" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                <div class="button-group">
                    <button class="btn btn-primary" onclick="profilePage.savePrivacySettings()">保存设置</button>
                    <button class="btn btn-secondary" onclick="profilePage.hideModal()">关闭</button>
                </div>
            </div>
        `);
    }

    // 显示备份设置
    showBackup() {
        this.showModal('数据备份', `
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px;">自动备份</h4>
                    <p style="color: #718096; font-size: 0.9rem;">设置自动备份频率，确保数据安全。</p>
                </div>
                <div class="input-group">
                    <label>备份频率</label>
                    <select>
                        <option>每天</option>
                        <option>每周</option>
                        <option>每月</option>
                        <option selected>手动备份</option>
                    </select>
                </div>
                <div style="margin-top: 20px;">
                    <button class="btn btn-primary" style="width: 100%;" onclick="profilePage.performBackup()">
                        <i class="fas fa-cloud-upload-alt"></i> 立即备份
                    </button>
                </div>
                <div class="button-group" style="margin-top: 20px;">
                    <button class="btn btn-secondary" onclick="profilePage.hideModal()">关闭</button>
                </div>
            </div>
        `);
    }

    // 显示通知设置
    showNotifications() {
        this.showModal('消息通知', `
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px;">通知设置</h4>
                    <p style="color: #718096; font-size: 0.9rem;">管理应用通知偏好。</p>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span>预算提醒</span>
                    <label class="switch">
                        <input type="checkbox" checked>
                        <span class="slider"></span>
                    </label>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span>大额交易提醒</span>
                    <label class="switch">
                        <input type="checkbox" checked>
                        <span class="slider"></span>
                    </label>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>月度报告</span>
                    <label class="switch">
                        <input type="checkbox">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="button-group" style="margin-top: 20px;">
                    <button class="btn btn-primary" onclick="profilePage.saveNotificationSettings()">保存</button>
                    <button class="btn btn-secondary" onclick="profilePage.hideModal()">取消</button>
                </div>
            </div>
        `);
    }

    // 显示帮助
    showHelp() {
        this.showModal('帮助与反馈', `
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px;">使用指南</h4>
                    <p style="color: #718096; font-size: 0.9rem; margin-bottom: 10px;">• 使用语音、扫码、手动等方式记账</p>
                    <p style="color: #718096; font-size: 0.9rem; margin-bottom: 10px;">• 在分析页面查看消费趋势</p>
                    <p style="color: #718096; font-size: 0.9rem;">• 定期备份数据以防丢失</p>
                </div>
                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px;">问题反馈</h4>
                    <textarea placeholder="请输入您的问题或建议..." style="width: 100%; height: 80px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;"></textarea>
                </div>
                <div class="button-group">
                    <button class="btn btn-primary" onclick="profilePage.submitFeedback()">提交反馈</button>
                    <button class="btn btn-secondary" onclick="profilePage.hideModal()">关闭</button>
                </div>
            </div>
        `);
    }

    // 显示数据统计
    showStatistics() {
        const stats = this.app.getTodayStats();
        const categoryStats = this.app.getCategoryStats();
        const totalExpense = Object.values(categoryStats).reduce((a, b) => a + b, 0);
        
        this.showModal('数据统计', `
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px;">今日统计</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div style="text-align: center; padding: 10px; background: #f7fafc; border-radius: 8px;">
                            <div style="font-size: 1.2rem; color: #4fd1c5; font-weight: 600;">¥${stats.income}</div>
                            <div style="font-size: 0.8rem; color: #718096;">收入</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: #f7fafc; border-radius: 8px;">
                            <div style="font-size: 1.2rem; color: #f56565; font-weight: 600;">¥${stats.expense}</div>
                            <div style="font-size: 0.8rem; color: #718096;">支出</div>
                        </div>
                    </div>
                </div>
                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px;">分类统计</h4>
                    <div style="font-size: 0.9rem; color: #718096;">
                        <p>总消费: ¥${totalExpense}</p>
                        <p>交易数量: ${this.app.transactions.length} 笔</p>
                    </div>
                </div>
                <div class="button-group">
                    <button class="btn btn-secondary" onclick="profilePage.hideModal()">关闭</button>
                </div>
            </div>
        `);
    }

    // 保存设置（示例方法）
    saveSettings() {
        this.app.showToast('设置已保存');
        this.hideModal();
    }

    // 保存学生模式设置
    saveStudentSettings() {
        const monthlyAllowance = document.getElementById('monthly-allowance').value;
        const partTimeGoal = document.getElementById('part-time-goal').value;
        const tuitionSavings = document.getElementById('tuition-savings').value;

        // 保存到本地存储
        const settings = {
            monthlyAllowance,
            partTimeGoal,
            tuitionSavings
        };
        localStorage.setItem('student_mode_settings', JSON.stringify(settings));

        this.app.showToast('学生模式设置已保存');
        this.hideModal();
        this.updateData();
    }

    // 保存家庭模式设置
    saveFamilySettings() {
        const familyBudget = document.getElementById('family-budget').value;
        const familyMembers = [];
        
        document.querySelectorAll('.member-item').forEach(item => {
            const name = item.querySelector('input').value;
            const role = item.querySelector('select').value;
            if (name) {
                familyMembers.push({ name, role });
            }
        });

        // 保存到本地存储
        const settings = {
            familyBudget,
            familyMembers
        };
        localStorage.setItem('family_mode_settings', JSON.stringify(settings));

        this.app.showToast('家庭模式设置已保存');
        this.hideModal();
        this.updateData();
    }

    // 保存自由职业者模式设置
    saveFreelancerSettings() {
        const businessType = document.getElementById('business-type').value;
        const incomeTarget = document.getElementById('income-target').value;
        const taxRate = document.getElementById('tax-rate').value;

        // 保存到本地存储
        const settings = {
            businessType,
            incomeTarget,
            taxRate
        };
        localStorage.setItem('freelancer_mode_settings', JSON.stringify(settings));

        this.app.showToast('自由职业者模式设置已保存');
        this.hideModal();
        this.updateData();
    }

    // 添加家庭成员
    addFamilyMember() {
        const membersContainer = document.getElementById('family-members');
        const memberItem = document.createElement('div');
        memberItem.className = 'member-item';
        memberItem.innerHTML = `
            <input type="text" placeholder="成员姓名">
            <select>
                <option>家长</option>
                <option>配偶</option>
                <option>子女</option>
            </select>
            <button class="btn btn-danger" onclick="this.parentElement.remove()" style="margin-left: 10px;">
                <i class="fas fa-times"></i>
            </button>
        `;
        membersContainer.appendChild(memberItem);
    }

    // 显示添加储蓄目标对话框
    showAddSavingsGoal() {
        this.showModal('添加储蓄目标', `
            <div style="padding: 20px;">
                <div class="input-group">
                    <label>目标名称</label>
                    <input type="text" id="goal-name" placeholder="如：旅游基金、购房首付">
                </div>
                <div class="input-group">
                    <label>目标金额</label>
                    <input type="number" id="goal-amount" placeholder="请输入金额">
                </div>
                <div class="input-group">
                    <label>截止日期</label>
                    <input type="date" id="goal-deadline">
                </div>
                <div class="input-group">
                    <label>自动储蓄</label>
                    <div style="display: flex; align-items: center;">
                        <label class="switch" style="margin-right: 10px;">
                            <input type="checkbox" id="auto-save">
                            <span class="slider"></span>
                        </label>
                        <span>从收入中自动划转</span>
                    </div>
                </div>
                <div class="input-group">
                    <label>储蓄比例</label>
                    <input type="number" id="save-ratio" placeholder="收入储蓄比例" max="100" min="0">
                </div>
                <div class="button-group">
                    <button class="btn btn-primary" onclick="profilePage.saveSavingsGoal()">保存</button>
                    <button class="btn btn-secondary" onclick="profilePage.hideModal()">取消</button>
                </div>
            </div>
        `);
    }

    // 保存储蓄目标
    saveSavingsGoal() {
        const name = document.getElementById('goal-name').value;
        const amount = document.getElementById('goal-amount').value;
        const deadline = document.getElementById('goal-deadline').value;
        const autoSave = document.getElementById('auto-save').checked;
        const saveRatio = document.getElementById('save-ratio').value;

        if (!name || !amount || !deadline) {
            this.app.showToast('请填写完整信息');
            return;
        }

        // 获取现有目标
        let goals = JSON.parse(localStorage.getItem('savings_goals') || '[]');
        
        // 添加新目标
        goals.push({
            id: Date.now(),
            name,
            amount: parseFloat(amount),
            deadline,
            autoSave,
            saveRatio: parseFloat(saveRatio),
            currentAmount: 0,
            createdAt: new Date().toISOString()
        });

        // 保存到本地存储
        localStorage.setItem('savings_goals', JSON.stringify(goals));

        this.app.showToast('储蓄目标已添加');
        this.hideModal();
        this.updateSavingsGoalsList();
    }

    // 更新储蓄目标列表
    updateSavingsGoalsList() {
        const container = document.getElementById('savings-goals-list');
        if (!container) return;

        const goals = JSON.parse(localStorage.getItem('savings_goals') || '[]');
        
        container.innerHTML = goals.map(goal => {
            const progress = (goal.currentAmount / goal.amount) * 100;
            const deadline = new Date(goal.deadline);
            const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
            
            return `
                <div class="savings-goal-item" style="margin-bottom: 15px; padding: 15px; background: #f7fafc; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h4 style="margin: 0;">${goal.name}</h4>
                        <button class="btn btn-danger" onclick="profilePage.deleteSavingsGoal(${goal.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <div class="progress" style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                            <div class="progress-bar" style="width: ${progress}%; background: #4fd1c5; height: 100%;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 0.9em; color: #718096;">
                            <span>¥${goal.currentAmount} / ¥${goal.amount}</span>
                            <span>${Math.round(progress)}%</span>
                        </div>
                    </div>
                    <div style="font-size: 0.9em; color: #718096;">
                        <div>截止日期: ${new Date(goal.deadline).toLocaleDateString()}</div>
                        <div>剩余天数: ${daysLeft}天</div>
                        ${goal.autoSave ? `<div>自动储蓄: ${goal.saveRatio}%</div>` : ''}
                    </div>
                </div>
            `;
        }).join('') || '<div style="text-align: center; color: #718096;">暂无储蓄目标</div>';
    }

    // 删除储蓄目标
    deleteSavingsGoal(goalId) {
        if (!confirm('确定要删除这个储蓄目标吗？')) return;

        let goals = JSON.parse(localStorage.getItem('savings_goals') || '[]');
        goals = goals.filter(goal => goal.id !== goalId);
        localStorage.setItem('savings_goals', JSON.stringify(goals));

        this.app.showToast('储蓄目标已删除');
        this.updateSavingsGoalsList();
        this.updateSavingsSuggestions();
    }

    // 更新储蓄建议
    updateSavingsSuggestions() {
        const summaryContainer = document.getElementById('savings-summary');
        if (!summaryContainer) return;

        const goals = JSON.parse(localStorage.getItem('savings_goals') || '[]');
        if (goals.length === 0) {
            summaryContainer.innerHTML = `
                <div style="text-align: center; color: #718096;">
                    <i class="fas fa-lightbulb" style="color: #4fd1c5;"></i> 
                    添加一个储蓄目标，开启你的理财计划
                </div>
            `;
            return;
        }

        // 计算总目标金额和当前总储蓄
        const totalGoal = goals.reduce((sum, goal) => sum + goal.amount, 0);
        const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);

        // 计算所有目标的每月所需储蓄
        let monthlyTotal = 0;
        goals.forEach(goal => {
            const deadline = new Date(goal.deadline);
            const monthsLeft = Math.max(1, Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24 * 30)));
            const remainingAmount = goal.amount - goal.currentAmount;
            monthlyTotal += remainingAmount / monthsLeft;
        });

        // 获取月收入（从用户模式设置中）
        let monthlyIncome = 0;
        switch(this.app.userMode) {
            case '学生模式':
                const studentSettings = JSON.parse(localStorage.getItem('student_mode_settings') || '{}');
                monthlyIncome = parseFloat(studentSettings.monthlyAllowance || 0) + parseFloat(studentSettings.partTimeGoal || 0);
                break;
            case '家庭模式':
                const familySettings = JSON.parse(localStorage.getItem('family_mode_settings') || '{}');
                monthlyIncome = parseFloat(familySettings.familyBudget || 0);
                break;
            case '自由职业':
                const freelancerSettings = JSON.parse(localStorage.getItem('freelancer_mode_settings') || '{}');
                monthlyIncome = parseFloat(freelancerSettings.incomeTarget || 0);
                break;
        }

        // 计算建议的储蓄比例
        const suggestedSavingRatio = monthlyIncome > 0 ? (monthlyTotal / monthlyIncome * 100).toFixed(1) : 0;

        summaryContainer.innerHTML = `
            <div style="margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>总目标金额</span>
                    <span>¥${totalGoal.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>已储蓄金额</span>
                    <span>¥${totalSaved.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>建议月储蓄</span>
                    <span>¥${monthlyTotal.toFixed(2)}</span>
                </div>
                ${monthlyIncome > 0 ? `
                <div style="display: flex; justify-content: space-between;">
                    <span>建议储蓄比例</span>
                    <span>${suggestedSavingRatio}%</span>
                </div>` : ''}
            </div>
            <div style="font-size: 0.9em; color: #718096; text-align: center;">
                <i class="fas fa-info-circle"></i> 
                建议每日储蓄 ¥${(monthlyTotal / 30).toFixed(2)}
            </div>
        `;
    }

    // 保存隐私设置（示例方法）
    savePrivacySettings() {
        this.app.showToast('隐私设置已保存');
        this.hideModal();
    }

    // 执行备份（示例方法）
    performBackup() {
        this.app.showToast('数据备份完成');
        this.hideModal();
    }

    // 保存通知设置（示例方法）
    saveNotificationSettings() {
        this.app.showToast('通知设置已保存');
        this.hideModal();
    }

    // 提交反馈（示例方法）
    submitFeedback() {
        this.app.showToast('感谢您的反馈！');
        this.hideModal();
    }

    // 显示模态框
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
                    <button class="modal-close" onclick="profilePage.hideModal()">×</button>
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

    // 隐藏模态框
    hideModal() {
        if (this.currentModal) {
            document.body.removeChild(this.currentModal);
            this.currentModal = null;
        }
    }

    // 退出登录
    logout() {
        // 调用app.js中的logout方法
        this.app.logout();
        this.updateData();
    }
}

// 全局变量
let profilePage;