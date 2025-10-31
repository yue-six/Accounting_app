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
        const mode = this.getCurrentUserMode();
        if (!mode) return;

        try {
            switch(mode) {
                case 'student':
                    this.studentSettings = JSON.parse(localStorage.getItem('student_mode_settings') || '{}');
                    break;
                case 'family':
                    this.familySettings = JSON.parse(localStorage.getItem('family_mode_settings') || '{}');
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
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 15px;">
                        <div class="mode-btn ${this.getCurrentUserMode() === 'student' ? 'active' : ''}" onclick="profilePage.setUserMode('student')">
                            <div>学生模式</div>
                            <small style="font-size: 0.8em; color: #718096;">生活费分配 · 兼职收入</small>
                        </div>
                        <div class="mode-btn ${this.getCurrentUserMode() === 'family' ? 'active' : ''}" onclick="profilePage.setUserMode('family')">
                            <div>家庭模式</div>
                            <small style="font-size: 0.8em; color: #718096;">多人共享 · 家庭开支</small>
                        </div>

                    </div>
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


            </div>
        `;
    }

    // 初始化事件
    initEvents() {
        // 设置全局变量
        profilePage = this;

        // 用户模式切换
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.querySelector('div')?.textContent.trim() || e.target.textContent.trim();
                this.setUserMode(mode);
            });
        });

        // 加载用户模式设置
        this.loadModeSettings();


    }

    // 更新数据
    updateData() {
        // 同步登录用户信息到头像区
        try {
            const user = JSON.parse(localStorage.getItem('auth_user') || 'null');
            const nameEl = document.getElementById('profile-nickname');
            const contactEl = document.getElementById('profile-contact');
            if (nameEl) nameEl.textContent = user?.nickname || '未登录';
            if (contactEl) contactEl.textContent = user?.phone || (user?.provider ? `第三方：${user.provider}` : '--');
        } catch (e) {}

        // 更新用户模式按钮状态
        document.querySelectorAll('.mode-btn').forEach(btn => {
            const mode = btn.querySelector('div')?.textContent.trim() || btn.textContent.trim();
            btn.classList.toggle('active', mode === this.app.userMode);
        });

        // 加载并显示当前模式的设置
        this.loadModeSettings();
    }

    // 获取当前用户模式
    getCurrentUserMode() {
        return localStorage.getItem('userMode') || 'student';
    }

    // 设置用户模式
    setUserMode(mode) {
        // 保存到本地存储
        localStorage.setItem('userMode', mode);
        
        // 更新UI
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 激活当前选中的模式按钮
        const activeBtn = document.querySelector(`.mode-btn[onclick*="${mode}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        this.updateData();
    }



    // 获取模式显示名称
    getModeDisplayName(mode) {
        const modeNames = {
            'student': '学生模式',
            'family': '家庭模式'
        };
        return modeNames[mode] || '未知模式';
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
        this.showModal('导出数据', `
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px;">数据导出</h4>
                    <p style="color: #718096; font-size: 0.9rem;">将您的记账数据导出为JSON文件，方便备份和迁移。</p>
                </div>
                <div class="button-group">
                    <button class="btn btn-primary" onclick="profilePage.confirmExportData()">确认导出</button>
                    <button class="btn btn-secondary" onclick="profilePage.hideModal()">取消</button>
                </div>
            </div>
        `);
    }

    // 确认导出数据
    confirmExportData() {
        this.app.exportData();
        this.hideModal();
    }

    // 导入数据
    importData() {
        this.showModal('导入数据', `
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px;">数据导入</h4>
                    <p style="color: #718096; font-size: 0.9rem;">从JSON文件导入记账数据，恢复您的备份。</p>
                </div>
                <div class="button-group">
                    <button class="btn btn-primary" onclick="profilePage.selectImportFile()">选择文件</button>
                    <button class="btn btn-secondary" onclick="profilePage.hideModal()">取消</button>
                </div>
            </div>
        `);
    }

    // 选择导入文件
    selectImportFile() {
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
                        this.hideModal();
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
        this.showModal('清除数据', `
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px;">清除确认</h4>
                    <p style="color: #718096; font-size: 0.9rem;">确定要清除所有数据吗？此操作不可撤销！</p>
                </div>
                <div class="button-group">
                    <button class="btn btn-warning" onclick="profilePage.confirmClearData()">确认清除</button>
                    <button class="btn btn-secondary" onclick="profilePage.hideModal()">取消</button>
                </div>
            </div>
        `);
    }

    // 确认清除数据
    confirmClearData() {
        this.app.clearData();
        this.updateData();
        this.hideModal();
    }

    // 显示设置
    async showSettings() {
        try {
            // 获取当前登录用户信息
            const user = await this.getCurrentUserInfo();
            
            this.showModal('账户设置', `
                <div style="padding: 20px;">
                    <div class="input-group">
                        <label>用户名</label>
                        <input type="text" id="profile-username" value="${user?.username || user?.nickname || ''}" placeholder="请输入用户名">
                    </div>
                    <div class="input-group">
                        <label>手机号</label>
                        <input type="tel" id="profile-phone" value="${user?.phone || ''}" placeholder="请输入手机号">
                    </div>
                    <div class="button-group">
                        <button class="btn btn-primary" onclick="profilePage.saveSettings()">保存</button>
                        <button class="btn btn-secondary" onclick="profilePage.hideModal()">取消</button>
                    </div>
                </div>
            `);
        } catch (error) {
            console.error('获取用户信息失败:', error);
            // 降级到本地存储
            this.showSettingsFallback();
        }
    }

    // 降级显示设置（使用本地存储）
    showSettingsFallback() {
        const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
        
        this.showModal('账户设置', `
            <div style="padding: 20px;">
                <div class="input-group">
                    <label>用户名</label>
                    <input type="text" id="profile-username" value="${user?.nickname || user?.username || ''}" placeholder="请输入用户名">
                </div>
                <div class="input-group">
                    <label>手机号</label>
                    <input type="tel" id="profile-phone" value="${user?.phone || ''}" placeholder="请输入手机号">
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

    // 保存设置
    async saveSettings() {
        try {
            // 获取表单数据
            const username = document.getElementById('profile-username')?.value || '';
            const phone = document.getElementById('profile-phone')?.value || '';
            
            // 验证数据
            if (!username.trim()) {
                this.app.showToast('请输入用户名', 'error');
                return;
            }
            
            // 更新用户信息到数据库
            const success = await this.updateUserProfile({
                username: username.trim(),
                phone: phone.trim()
            });
            
            if (success) {
                this.app.showToast('账户设置已保存');
                this.hideModal();
                // 更新页面显示
                this.updateData();
            } else {
                this.app.showToast('保存失败，请重试', 'error');
            }
        } catch (error) {
            console.error('保存设置失败:', error);
            this.app.showToast('保存失败，请重试', 'error');
        }
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
    async saveFamilySettings() {
        const familyBudget = document.getElementById('family-budget').value;
        const familyMembers = [];
        
        document.querySelectorAll('.member-item').forEach(item => {
            const name = item.querySelector('input').value;
            const role = item.querySelector('select').value;
            if (name) {
                familyMembers.push({ 
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    name, 
                    role,
                    joinedAt: new Date().toISOString()
                });
            }
        });

        // 保存到数据库或本地存储
        const settings = {
            familyBudget,
            familyMembers,
            updated_at: new Date().toISOString()
        };
        
        // 检查是否支持数据库
        if (typeof modeDatabase !== 'undefined' && modeDatabase) {
            try {
                await modeDatabase.saveFamilyModeSettings(settings);
            } catch (e) {
                console.error('保存到数据库失败:', e);
                // 降级到本地存储
                localStorage.setItem('family_mode_settings', JSON.stringify(settings));
            }
        } else {
            localStorage.setItem('family_mode_settings', JSON.stringify(settings));
        }

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

    // 显示模态框（手机模式）
    showModal(title, content) {
        // 如果已有弹窗，先关闭
        if (this.currentModal) {
            this.hideModal();
        }
        
        const modal = document.createElement('div');
        modal.className = 'mobile-modal-overlay';
        
        modal.innerHTML = `
            <div class="mobile-modal-container">
                <div class="mobile-modal-header">
                    <h3>${title}</h3>
                    <button class="mobile-modal-close" onclick="profilePage.hideModal()">×</button>
                </div>
                <div class="mobile-modal-body">
                    ${content}
                </div>
            </div>
        `;

        // 点击遮罩层关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal();
            }
        });

        // 将弹窗添加到手机模拟器的app-container中
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.appendChild(modal);
        } else {
            // 如果找不到app-container，则添加到phone-frame中
            const phoneFrame = document.querySelector('.phone-frame');
            if (phoneFrame) {
                phoneFrame.appendChild(modal);
            } else {
                // 如果都找不到，则添加到body中作为降级处理
                document.body.appendChild(modal);
            }
        }
        
        this.currentModal = modal;
        
        // 阻止页面滚动
        document.body.style.overflow = 'hidden';
    }

    // 隐藏模态框（手机模式）
    hideModal() {
        if (this.currentModal) {
            // 添加关闭动画
            this.currentModal.classList.add('closing');
            
            // 恢复页面滚动
            document.body.style.overflow = '';
            
            // 延迟移除元素，让动画完成
            setTimeout(() => {
                if (this.currentModal && this.currentModal.parentNode) {
                    this.currentModal.parentNode.removeChild(this.currentModal);
                }
                this.currentModal = null;
            }, 300);
        }
    }

    // 设置用户模式
    setUserMode(mode) {
        // 验证模式有效性
        const validModes = ['student', 'family'];
        if (!validModes.includes(mode)) {
            console.error('无效的用户模式:', mode);
            return;
        }

        try {
            // 调用router的switchUserMode方法来切换用户模式
            if (window.router && typeof window.router.switchUserMode === 'function') {
                window.router.switchUserMode(mode);
                
                // 更新按钮的激活状态
                this.updateModeButtons(mode);
            } else {
                // 降级处理：如果router不存在，则直接设置应用的用户模式
                if (this.app && typeof this.app.setUserMode === 'function') {
                    this.app.setUserMode(mode);
                    this.updateModeButtons(mode);
                    
                    // 如果是直接设置的，手动重新渲染页面以应用新模式
                    if (window.router && typeof window.router.reloadCurrentPageWithMode === 'function') {
                        window.router.reloadCurrentPageWithMode();
                    }
                }
            }
        } catch (error) {
            console.error('切换用户模式时出错:', error);
            // 显示错误提示
            if (this.app && typeof this.app.showToast === 'function') {
                this.app.showToast('模式切换失败，请重试', 'error');
            }
        }
    }
    
    // 更新模式按钮的激活状态
    updateModeButtons(selectedMode) {
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(button => {
            button.classList.remove('active');
            // 通过按钮内容判断对应的模式
            const buttonText = button.textContent.toLowerCase();
            if ((selectedMode === 'student' && buttonText.includes('学生')) ||
                (selectedMode === 'family' && buttonText.includes('家庭'))) {
                button.classList.add('active');
            }
        });
    }
    
    // 获取当前用户模式
    getCurrentUserMode() {
        return this.app.userMode || localStorage.getItem('user_mode') || 'student';
    }
    
    // 退出登录
    logout() {
        this.showModal('退出登录', `
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px;">确认退出</h4>
                    <p style="color: #718096; font-size: 0.9rem;">确定要退出当前登录吗？您将需要重新登录。</p>
                </div>
                <div class="button-group">
                    <button class="btn btn-warning" onclick="profilePage.confirmLogout()">确认退出</button>
                    <button class="btn btn-secondary" onclick="profilePage.hideModal()">取消</button>
                </div>
            </div>
        `);
    }

    // 确认退出登录
    confirmLogout() {
        try {
            localStorage.removeItem('auth_user');
        } catch (e) {}
        this.app.showToast('已退出登录', 'success');
        if (window.router) window.router.switchToPage('login');
        this.hideModal();
    }

    // 获取当前用户信息（从数据库）
    async getCurrentUserInfo() {
        try {
            // 首先检查本地存储的认证信息
            const authUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
            
            // 如果有token，尝试从API获取最新用户信息
            if (authUser.token) {
                const response = await fetch('/api/auth/me', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${authUser.token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        return result.data.user;
                    }
                }
            }
            
            // 降级到本地存储信息
            return authUser;
        } catch (error) {
            console.error('获取用户信息失败:', error);
            // 返回本地存储信息作为降级方案
            return JSON.parse(localStorage.getItem('auth_user') || '{}');
        }
    }

    // 更新用户信息到数据库
    async updateUserProfile(profileData) {
        try {
            const authUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
            
            if (!authUser.token) {
                // 如果没有token，使用本地存储
                this.updateLocalUserProfile(profileData);
                return true;
            }
            
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authUser.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    profile: profileData
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // 更新本地存储的用户信息
                    this.updateLocalUserProfile(profileData);
                    return true;
                }
            }
            
            // API调用失败，使用本地存储
            this.updateLocalUserProfile(profileData);
            return true;
        } catch (error) {
            console.error('更新用户信息失败:', error);
            // 降级到本地存储
            this.updateLocalUserProfile(profileData);
            return true;
        }
    }

    // 更新本地存储的用户信息
    updateLocalUserProfile(profileData) {
        try {
            const authUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
            
            // 更新用户信息
            const updatedUser = {
                ...authUser,
                ...profileData,
                nickname: profileData.username || authUser.nickname,
                updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        } catch (error) {
            console.error('更新本地用户信息失败:', error);
        }
    }

    // 验证邮箱格式
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// 全局变量
let profilePage;