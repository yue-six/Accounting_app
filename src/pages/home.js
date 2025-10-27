// 首页组件
class HomePage {
    constructor(app) {
        this.app = app;
        this.inputManager = null;
    }

    // 渲染页面
    render() {
        return `
            <div class="page active" id="home-page">
                <!-- 本月概览 -->
                <div class="card">
                    <h3><i class="fas fa-chart-line"></i> 本月收支</h3>
                    <div class="stats-grid" id="monthly-stats">
                        <div class="stat-item">
                            <div class="stat-value" id="monthly-income">¥0</div>
                            <div class="stat-label">本月收入</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="today-expense">¥0</div>
                            <div class="stat-label">本日支出</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="monthly-balance">¥0</div>
                            <div class="stat-label">本月结余</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="budget-progress">0%</div>
                            <div class="stat-label">预算进度 <span id="budget-badge" style="display:inline-block; margin-left:6px; font-size:12px; padding:2px 6px; border-radius:10px; background:#edf2f7; color:#718096; vertical-align:middle;"></span></div>
                        </div>
                    </div>
                </div>

                <!-- 快速记账 -->
                <div class="card quick-actions-card">
                    <div class="quick-actions-title">
                        <i class="fas fa-bolt"></i>
                        <h3>快速记账</h3>
                    </div>
                    <p style="color: #718096; font-size: 0.9rem; margin-bottom: 20px;">选择您喜欢的记账方式</p>
                    
                    <div class="quick-actions">
                        <button class="action-btn" id="voice-input-btn">
                            <i class="fas fa-microphone-alt"></i>
                            <span>语音记账</span>
                        </button>
                        <button class="action-btn" id="photo-input-btn">
                            <i class="fas fa-camera-retro"></i>
                            <span>拍照记账</span>
                        </button>
                        <button class="action-btn" id="manual-input-btn">
                            <i class="fas fa-edit"></i>
                            <span>手动输入</span>
                        </button>
                    </div>
                </div>

                <!-- 最新交易 -->
                <div class="card">
                    <h3><i class="fas fa-clock"></i> 最近交易</h3>
                    <div class="transaction-list" id="recent-transactions">
                        ${this.renderRecentTransactions()}
                    </div>
                </div>

                <!-- 支付连接 -->
                <div class="card">
                    <h3><i class="fas fa-credit-card"></i> 支付连接</h3>
                    <div class="payment-connections">
                        <div class="payment-item">
                            <div class="payment-icon wechat">
                                <i class="fab fa-weixin"></i>
                            </div>
                            <div class="payment-info">
                                <div class="payment-name">微信支付</div>
                                <div class="payment-status">
                                    <span class="status-dot" id="wechat-status-dot"></span>
                                    <span class="status-text" id="wechat-status-text">未连接</span>
                                </div>
                            </div>
                            <button class="payment-action-btn" onclick="homePage.connectWechatPay()">管理</button>
                        </div>
                        
                        <div class="payment-item">
                            <div class="payment-icon alipay">
                                <i class="fab fa-alipay"></i>
                            </div>
                            <div class="payment-info">
                                <div class="payment-name">支付宝</div>
                                <div class="payment-status">
                                    <span class="status-dot" id="alipay-status-dot"></span>
                                    <span class="status-text" id="alipay-status-text">未连接</span>
                                </div>
                            </div>
                            <button class="payment-action-btn" onclick="homePage.connectAlipay()">管理</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 渲染最近交易列表
    renderRecentTransactions() {
        // 使用应用中的交易数据
        const recentTransactions = this.app.transactions.slice(0, 5);
        
        if (recentTransactions.length === 0) {
            return '<div style="text-align: center; color: #718096; padding: 20px;">暂无交易记录</div>';
        }

        return recentTransactions.map((transaction, index) => {
            const category = this.app.categories.find(c => c.id === transaction.category);
            const isToday = new Date(transaction.date).toDateString() === new Date().toDateString();
            const displayDate = isToday ? transaction.time : new Date(transaction.date).toLocaleDateString('zh-CN');
            
            return `
                <div class="transaction-item" data-index="${index}">
                    <div class="transaction-info">
                        <div class="transaction-title">${transaction.description}</div>
                        <div class="transaction-detail">${transaction.merchant} · ${category.name} · ${displayDate}</div>
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'}¥${transaction.amount}
                    </div>
                </div>
            `;
        }).join('');
    }

    // 初始化事件
    initEvents() {
        console.log('主页事件初始化开始...');
        
        // 设置全局变量
        homePage = this;

        // 初始化输入管理器
        this.initInputManager();

        // 使用setTimeout确保DOM完全加载后再绑定事件
        setTimeout(() => {
            console.log('开始绑定事件...');
            this.bindQuickActionEvents();
            this.bindTransactionEvents();
            console.log('事件绑定完成');
        }, 200);

        // 加载本月统计数据
        this.loadMonthlyStats();

        // 更新数据库状态显示
        this.updateDatabaseStatus();
        
        // 更新支付连接状态
        this.updatePaymentStatus();
        
        console.log('主页事件初始化完成');
    }
    
    // 绑定快速记账按钮事件
    bindQuickActionEvents() {
        console.log('开始绑定快速记账按钮事件...');
        
        const voiceBtn = document.getElementById('voice-input-btn');
        const qrBtn = document.getElementById('qr-scanner-btn');
        const manualBtn = document.getElementById('manual-input-btn');
        const photoBtn = document.getElementById('photo-input-btn');
        
        console.log('找到的按钮:', { voiceBtn, qrBtn, manualBtn, photoBtn });
        
        if (voiceBtn) {
            voiceBtn.addEventListener('click', (e) => {
                console.log('语音记账按钮被点击');
                e.preventDefault();
                e.stopPropagation();
                this.startVoiceInput();
            });
        } else {
            console.error('语音记账按钮未找到');
        }
        

        
        if (manualBtn) {
            manualBtn.addEventListener('click', (e) => {
                console.log('手动输入按钮被点击');
                e.preventDefault();
                e.stopPropagation();
                this.showManualInput();
            });
        } else {
            console.error('手动输入按钮未找到');
        }
        
        if (photoBtn) {
            photoBtn.addEventListener('click', (e) => {
                console.log('拍照记账按钮被点击');
                e.preventDefault();
                e.stopPropagation();
                this.startPhotoInput();
            });
        } else {
            console.error('拍照记账按钮未找到');
        }
        
        console.log('快速记账按钮事件绑定完成');
    }
    
    // 绑定交易项点击事件
    bindTransactionEvents() {
        const transactionItems = document.querySelectorAll('.transaction-item');
        if (transactionItems.length > 0) {
            transactionItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    const index = parseInt(item.getAttribute('data-index'));
                    console.log('交易项被点击，索引:', index);
                    this.editTransaction(index);
                });
            });
        }
    }
    
    // 更新数据库状态显示
    updateDatabaseStatus() {
        const statusIndicator = document.getElementById('db-status-indicator');
        const dataSource = document.getElementById('data-source');
        const lastUpdate = document.getElementById('last-update');
        
        if (!statusIndicator) return;
        
        // 根据应用状态更新显示
        if (this.app.databaseStatus === 'connected') {
            statusIndicator.innerHTML = `
                <span class="status-dot connected"></span>
                <span class="status-text">已连接</span>
            `;
            dataSource.textContent = this.app.useSupabase ? 'Supabase' : '后端API';
        } else {
            statusIndicator.innerHTML = `
                <span class="status-dot disconnected"></span>
                <span class="status-text">离线模式</span>
            `;
            dataSource.textContent = '本地存储';
        }
        
        lastUpdate.textContent = '刚刚';
    }

    // 更新支付连接状态
    updatePaymentStatus() {
        // 检查用户登录状态
        const userData = localStorage.getItem('auth_user');
        const isLoggedIn = !!userData;
        
        if (isLoggedIn) {
            try {
                const user = JSON.parse(userData);
                const provider = user.provider;
                
                // 根据登录的支付平台更新状态
                if (provider === 'wechat') {
                    this.setPaymentStatus('wechat', 'connected');
                    this.setPaymentStatus('alipay', 'disconnected');
                } else if (provider === 'alipay') {
                    this.setPaymentStatus('wechat', 'disconnected');
                    this.setPaymentStatus('alipay', 'connected');
                } else {
                    // 其他登录方式，都显示为未连接
                    this.setPaymentStatus('wechat', 'disconnected');
                    this.setPaymentStatus('alipay', 'disconnected');
                }
            } catch (error) {
                console.error('解析用户数据失败:', error);
                this.setPaymentStatus('wechat', 'disconnected');
                this.setPaymentStatus('alipay', 'disconnected');
            }
        } else {
            // 未登录状态
            this.setPaymentStatus('wechat', 'disconnected');
            this.setPaymentStatus('alipay', 'disconnected');
        }
    }

    // 设置单个支付平台状态
    setPaymentStatus(paymentType, status) {
        const statusDot = document.getElementById(`${paymentType}-status-dot`);
        const statusText = document.getElementById(`${paymentType}-status-text`);
        
        if (statusDot && statusText) {
            if (status === 'connected') {
                statusDot.className = 'status-dot connected';
                statusText.textContent = '已连接';
                statusDot.style.animation = 'pulse 2s infinite';
            } else {
                statusDot.className = 'status-dot disconnected';
                statusText.textContent = '未连接';
                statusDot.style.animation = 'none';
            }
        }
    }

    // 加载本月统计数据
    async loadMonthlyStats() {
        try {
            // 首先检查后端API是否可用
            const apiAvailable = await this.checkBackendAPI();
            
            if (apiAvailable) {
                // 获取本月日期范围（用于收入）
                const now = new Date();
                const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                
                // 获取今日日期（用于支出）
                const today = new Date().toISOString().split('T')[0];
                
                // 调用后端API获取本月收入统计
                const monthlyResponse = await fetch(`/api/transactions/stats/summary?startDate=${startDate}&endDate=${endDate}`);
                
                // 调用后端API获取今日支出统计
                const todayResponse = await fetch(`/api/transactions/stats/summary?startDate=${today}&endDate=${today}`);
                
                if (monthlyResponse.ok && todayResponse.ok) {
                    const monthlyResult = await monthlyResponse.json();
                    const todayResult = await todayResponse.json();
                    
                    if (monthlyResult.success && todayResult.success) {
                        const monthlyStats = monthlyResult.data.stats;
                        const todayStats = todayResult.data.stats;
                        
                        // 更新页面显示
                        document.getElementById('monthly-income').textContent = `¥${monthlyStats.totalIncome || 0}`;
                        document.getElementById('today-expense').textContent = `¥${todayStats.totalExpense || 0}`;
                        document.getElementById('monthly-balance').textContent = `¥${monthlyStats.netIncome || 0}`;
                        
                        // 计算预算进度（基于当月预算与当月支出）
                        const budgetProgress = this.calculateBudgetProgress();
                        document.getElementById('budget-progress').textContent = `${budgetProgress}%`;
                        this.updateBudgetIndicators(budgetProgress);
                        
                        console.log('✅ 使用后端API数据');
                        return;
                    }
                }
            }
            
            // 如果API不可用或调用失败，使用应用本地数据
            const monthlyStats = this.app.getMonthlyStats();
            const todayStats = this.app.getTodayStats();
            
            document.getElementById('monthly-income').textContent = `¥${monthlyStats.income}`;
            document.getElementById('today-expense').textContent = `¥${todayStats.expense}`;
            document.getElementById('monthly-balance').textContent = `¥${monthlyStats.balance}`;
            const budgetProgress = this.calculateBudgetProgress();
            document.getElementById('budget-progress').textContent = `${budgetProgress}%`;
            this.updateBudgetIndicators(budgetProgress);
            
            console.log('📁 使用本地数据');
            
        } catch (error) {
            console.error('加载本月统计数据错误:', error);
            this.showDefaultStats();
        }
    }
    
    // 检查后端API是否可用
    async checkBackendAPI() {
        try {
            const response = await fetch('/api/health', {
                method: 'GET'
            });
            return response.ok;
        } catch (error) {
            console.log('后端API不可用，使用本地数据');
            return false;
        }
    }
    
    // 计算预算进度（按当月预算与当月支出）
    calculateBudgetProgress() {
        const monthlyBudget = Number(this.app.budgets?.monthly || 0);
        if (!monthlyBudget || monthlyBudget <= 0) return 0;
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const monthlyExpense = this.app.transactions
            .filter(t => t.type === 'expense' && new Date(t.date) >= start && new Date(t.date) < end)
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        return Math.min(100, Math.max(0, Math.round((monthlyExpense / monthlyBudget) * 100)));
    }
    
    // 显示默认统计数据
    showDefaultStats() {
        document.getElementById('monthly-income').textContent = '¥0';
        document.getElementById('today-expense').textContent = '¥0';
        document.getElementById('monthly-balance').textContent = '¥0';
        document.getElementById('budget-progress').textContent = '0%';
        this.updateBudgetIndicators(0);
    }

    // 更新预算显示样式与徽标
    updateBudgetIndicators(percent) {
        const progressEl = document.getElementById('budget-progress');
        const badgeEl = document.getElementById('budget-badge');
        if (!progressEl || !badgeEl) return;

        // 颜色分级：<80% 蓝绿，80-99% 橙，>=100% 红
        if (percent >= 100) {
            progressEl.style.color = '#e53e3e';
            badgeEl.textContent = '超额';
            badgeEl.style.background = '#fed7d7';
            badgeEl.style.color = '#c53030';
        } else if (percent >= 80) {
            progressEl.style.color = '#d69e2e';
            badgeEl.textContent = '预警';
            badgeEl.style.background = '#fefcbf';
            badgeEl.style.color = '#975a16';
        } else {
            progressEl.style.color = '#4fd1c5';
            badgeEl.textContent = '';
            badgeEl.style.background = '#edf2f7';
            badgeEl.style.color = '#718096';
        }
    }
    
    // 更新数据
    updateData() {
        // 更新本月统计
        this.loadMonthlyStats();
        
        // 更新数据库状态
        this.updateDatabaseStatus();
        
        // 更新支付连接状态
        this.updatePaymentStatus();
        
        // 更新交易列表
        const container = document.getElementById('recent-transactions');
        if (container) {
            container.innerHTML = this.renderRecentTransactions();
            
            // 重新绑定交易项事件
            setTimeout(() => {
                this.bindTransactionEvents();
            }, 50);
        }
    }

    // 初始化输入管理器
    initInputManager() {
        if (typeof VoiceRecognition !== 'undefined' && typeof QRScanner !== 'undefined' && typeof PhotoRecognition !== 'undefined') {
            this.inputManager = new InputManager(this.app);
        }
    }

    // 启动语音输入
    startVoiceInput() {
        if (this.inputManager) {
            this.inputManager.startVoiceInput();
        } else {
            this.showVoiceInput();
        }
    }

    // 启动扫码
    startQRScan() {
        if (this.inputManager) {
            this.inputManager.startQRScan();
        } else {
            this.showQRScanner();
        }
    }

    // 启动拍照输入
    startPhotoInput() {
        if (this.inputManager) {
            this.inputManager.startPhotoInput();
        } else {
            this.showPhotoInput();
        }
    }

    // 显示语音输入（兼容模式）
    showVoiceInput() {
        const isVoiceSupported = this.checkVoiceSupport();
        
        this.showModal('语音记账', `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">🎤</div>
                <p>请说出您的记账内容，例如：</p>
                <p style="color: #666; margin: 10px 0;">"今天买咖啡花了30元"</p>
                <p style="color: #666; margin: 10px 0;">"工资收入8000元"</p>
                
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 30px;">
                    <button class="action-btn" onclick="homePage.simulateVoiceInput()">
                        <i class="fas fa-play-circle"></i>
                        模拟语音输入
                    </button>
                    
                    ${isVoiceSupported ? `
                    <button class="action-btn voice-input-btn" onclick="homePage.startRealVoiceInput()">
                        <i class="fas fa-microphone"></i>
                        语音输入
                    </button>
                    ` : `
                    <button class="action-btn disabled" style="opacity: 0.6; cursor: not-allowed;">
                        <i class="fas fa-microphone-slash"></i>
                        语音输入（不支持）
                    </button>
                    `}
                </div>
                
                ${isVoiceSupported ? `
                <div style="margin-top: 15px; font-size: 0.85rem; color: #666;">
                    <i class="fas fa-info-circle"></i>
                    点击"语音输入"按钮后，请允许浏览器访问您的麦克风
                </div>
                ` : ''}
            </div>
        `);
    }

    // 检查语音支持
    checkVoiceSupport() {
        return ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
    }

    // 模拟语音输入
    simulateVoiceInput() {
        const examples = [
            { 
                amount: 30, 
                description: '星巴克咖啡', 
                category: 'food', 
                type: 'expense', 
                merchant: '星巴克',
                date: new Date().toISOString(),
                time: new Date().toISOString()
            },
            { 
                amount: 8000, 
                description: '本月工资收入', 
                category: 'salary', 
                type: 'income', 
                merchant: '公司',
                date: new Date().toISOString(),
                time: new Date().toISOString()
            },
            { 
                amount: 15, 
                description: '午餐便当', 
                category: 'food', 
                type: 'expense', 
                merchant: '快餐店',
                date: new Date().toISOString(),
                time: new Date().toISOString()
            },
            { 
                amount: 25, 
                description: '地铁交通费', 
                category: 'transport', 
                type: 'expense', 
                merchant: '地铁公司',
                date: new Date().toISOString(),
                time: new Date().toISOString()
            },
            { 
                amount: 200, 
                description: '网购衣服', 
                category: 'shopping', 
                type: 'expense', 
                merchant: '淘宝',
                date: new Date().toISOString(),
                time: new Date().toISOString()
            }
        ];
        const example = examples[Math.floor(Math.random() * examples.length)];
        
        this.app.addTransaction(example);
        this.hideModal();
        this.updateData();
        
        // 显示添加成功的提示
        const typeText = example.type === 'income' ? '收入' : '支出';
        this.app.showToast(`已添加${typeText}记录：${example.description} ¥${Math.abs(example.amount)}`, 'success');
    }

    // 开始真实语音输入
    startRealVoiceInput() {
        if (!this.checkVoiceSupport()) {
            this.app.showToast('您的浏览器不支持语音识别功能', 'error');
            return;
        }

        // 创建语音识别实例
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        // 配置识别参数
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'zh-CN';
        recognition.maxAlternatives = 1;

        // 显示语音识别状态
        this.showVoiceListeningState();

        // 设置事件监听
        recognition.onstart = () => {
            console.log('语音识别开始');
            this.app.showToast('正在聆听...', 'info');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('语音识别结果:', transcript);
            this.processRealVoiceInput(transcript);
        };

        recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            this.hideVoiceListeningState();
            
            let errorMessage = '语音识别失败';
            switch (event.error) {
                case 'not-allowed':
                    errorMessage = '请允许浏览器使用麦克风权限';
                    break;
                case 'no-speech':
                    errorMessage = '没有检测到语音输入';
                    break;
                case 'audio-capture':
                    errorMessage = '无法访问麦克风';
                    break;
                case 'network':
                    errorMessage = '网络连接错误';
                    break;
            }
            
            this.app.showToast(errorMessage, 'error');
        };

        recognition.onend = () => {
            console.log('语音识别结束');
            this.hideVoiceListeningState();
        };

        // 开始语音识别
        try {
            recognition.start();
        } catch (error) {
            console.error('启动语音识别失败:', error);
            this.app.showToast('启动语音识别失败', 'error');
            this.hideVoiceListeningState();
        }
    }

    // 处理真实语音输入
    processRealVoiceInput(transcript) {
        // 解析语音内容
        const parsedData = this.parseVoiceInput(transcript);
        
        if (parsedData) {
            // 显示识别结果确认界面
            this.showVoiceRecognitionResult(transcript, parsedData);
        } else {
            this.app.showToast('无法识别语音内容，请重新尝试', 'warning');
        }
    }

    // 解析语音输入
    parseVoiceInput(text) {
        const lowerText = text.toLowerCase();
        
        // 金额匹配模式
        const amountPatterns = [
            /(\d+(?:\.\d{1,2})?)元/g,
            /(\d+(?:\.\d{1,2})?)块钱/g,
            /(\d+(?:\.\d{1,2})?)块/g,
            /花了(\d+(?:\.\d{1,2})?)/g,
            /消费(\d+(?:\.\d{1,2})?)/g,
            /收入(\d+(?:\.\d{1,2})?)/g,
            /收到(\d+(?:\.\d{1,2})?)/g,
            /工资(\d+(?:\.\d{1,2})?)/g
        ];
        
        let amount = null;
        let category = null;
        let description = text;
        let type = 'expense'; // 默认为支出
        
        // 提取金额
        for (const pattern of amountPatterns) {
            const match = pattern.exec(lowerText);
            if (match) {
                amount = parseFloat(match[1]);
                break;
            }
        }
        
        // 如果没有匹配到金额，尝试提取数字
        if (!amount) {
            const numberMatch = lowerText.match(/(\d+(?:\.\d{1,2})?)/);
            if (numberMatch) {
                amount = parseFloat(numberMatch[1]);
            }
        }
        
        // 判断收入还是支出
        if (lowerText.includes('收入') || lowerText.includes('收到') || 
            lowerText.includes('工资') || lowerText.includes('转账') ||
            lowerText.includes('奖金') || lowerText.includes('报酬')) {
            type = 'income';
        }
        
        // 智能分类
        category = this.autoCategorizeVoiceInput(lowerText);
        
        // 验证解析结果
        if (!amount || isNaN(amount)) {
            return null;
        }
        
        // 如果是支出，金额为负数
        if (type === 'expense') {
            amount = -Math.abs(amount);
        }
        
        return {
            amount: amount,
            category: category,
            description: description,
            type: type,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toISOString(),
            source: 'voice_input',
            merchant: '语音识别'
        };
    }

    // 语音输入智能分类
    autoCategorizeVoiceInput(text) {
        const categoryRules = {
            // 餐饮相关
            '吃饭|餐饮|餐厅|饭店|火锅|烧烤|快餐|外卖|咖啡|奶茶|早餐|午餐|晚餐|零食|水果|超市|便当': 'food',
            
            // 交通相关
            '打车|出租车|滴滴|公交|地铁|高铁|飞机|机票|火车|出行|交通|加油|停车|车费': 'transport',
            
            // 购物相关
            '购物|买衣服|网购|淘宝|京东|拼多多|超市|商场|购物中心|日用品|电器|手机|电脑': 'shopping',
            
            // 娱乐相关
            '电影|KTV|游戏|娱乐|旅游|景点|门票|游乐场|演唱会|演出|音乐': 'entertainment',
            
            // 学习相关
            '学习|书籍|课程|培训|教育|学费|教材|文具|学习|考试': 'study',
            
            // 收入相关
            '工资|收入|奖金|兼职|报酬|转账|收款|薪水': 'salary',
            
            // 投资相关
            '股票|基金|理财|投资|收益|证券': 'investment',
            
            // 生活相关
            '水电|煤气|房租|物业|通讯|话费|网络|宽带|医疗|医院|药品|保险': 'other'
        };
        
        for (const [keywords, categoryId] of Object.entries(categoryRules)) {
            const keywordList = keywords.split('|');
            for (const keyword of keywordList) {
                if (text.includes(keyword)) {
                    return categoryId;
                }
            }
        }
        
        return 'other';
    }

    // 显示语音识别结果确认界面
    showVoiceRecognitionResult(originalText, parsedData) {
        const category = this.app.categories.find(cat => cat.id === parsedData.category);
        const categoryName = category ? category.name : '其他';
        const typeText = parsedData.type === 'income' ? '收入' : '支出';
        
        const modalContent = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">🎤</div>
                <h3>语音识别结果</h3>
                
                <div style="background: #f8f9fa; border-radius: 10px; padding: 15px; margin: 15px 0;">
                    <div style="text-align: left; margin-bottom: 10px;">
                        <strong>原始语音:</strong>
                        <p style="color: #666; margin: 5px 0; font-style: italic;">"${originalText}"</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: left;">
                        <div><strong>类型:</strong> <span style="color: ${parsedData.type === 'income' ? '#10b981' : '#ef4444'}">${typeText}</span></div>
                        <div><strong>金额:</strong> <span style="color: #3b82f6; font-weight: bold;">¥${Math.abs(parsedData.amount).toFixed(2)}</span></div>
                        <div><strong>分类:</strong> <span style="color: ${category ? category.color : '#666'}">${categoryName}</span></div>
                        <div><strong>描述:</strong> ${parsedData.description}</div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                    <button class="action-btn success" onclick="homePage.confirmVoiceInput()">
                        <i class="fas fa-check"></i> 确认添加
                    </button>
                    <button class="action-btn secondary" onclick="homePage.cancelVoiceInput()">
                        <i class="fas fa-times"></i> 取消
                    </button>
                    <button class="action-btn outline" onclick="homePage.startRealVoiceInput()">
                        <i class="fas fa-redo"></i> 重新识别
                    </button>
                </div>
            </div>
        `;
        
        // 保存当前解析的数据
        this.currentVoiceData = parsedData;
        
        // 更新模态框内容
        this.updateModalContent(modalContent);
    }

    // 确认语音输入
    confirmVoiceInput() {
        if (this.currentVoiceData) {
            this.app.addTransaction(this.currentVoiceData);
            this.hideModal();
            this.updateData();
            
            const typeText = this.currentVoiceData.type === 'income' ? '收入' : '支出';
            this.app.showToast(`已添加${typeText}记录：${this.currentVoiceData.description} ¥${Math.abs(this.currentVoiceData.amount)}`, 'success');
            
            this.currentVoiceData = null;
        }
    }

    // 取消语音输入
    cancelVoiceInput() {
        this.currentVoiceData = null;
        this.hideModal();
    }

    // 显示语音监听状态
    showVoiceListeningState() {
        const existingIndicator = document.getElementById('voice-listening-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        const indicator = document.createElement('div');
        indicator.id = 'voice-listening-indicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(59, 130, 246, 0.95);
                color: white;
                padding: 30px;
                border-radius: 20px;
                text-align: center;
                z-index: 10002;
                backdrop-filter: blur(10px);
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            ">
                <div style="font-size: 4rem; margin-bottom: 20px; animation: pulse 1.5s infinite;">🎤</div>
                <div style="font-size: 1.2rem; margin-bottom: 10px;">正在聆听...</div>
                <div style="color: #e0f2fe; font-size: 0.9rem;">请说出您的记账内容</div>
                <div style="margin-top: 20px; color: #b3e0ff; font-size: 0.8rem;">
                    例如："早餐花了15元" 或 "收到工资8000元"
                </div>
            </div>
        `;

        document.body.appendChild(indicator);
    }

    // 隐藏语音监听状态
    hideVoiceListeningState() {
        const indicator = document.getElementById('voice-listening-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // 更新模态框内容
    updateModalContent(content) {
        const modalBody = document.querySelector('.modal-content .modal-body');
        if (modalBody) {
            modalBody.innerHTML = content;
        }
    }

    // 显示扫码功能
    showQRScanner() {
        this.showModal('扫码记账', `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">📱</div>
                <p>请扫描商品二维码或条形码</p>
                <button class="action-btn" style="margin-top: 20px;" onclick="homePage.simulateQRScan()">
                    模拟扫码
                </button>
            </div>
        `);
    }

    // 模拟扫码
    simulateQRScan() {
        this.app.addTransaction({
            amount: 25,
            description: '扫码商品',
            category: 'shopping',
            type: 'expense',
            merchant: '扫码识别'
        });
        this.hideModal();
        this.updateData();
    }

    // 显示手动输入
    showManualInput() {
        this.showTransactionModal();
    }

    // 显示拍照输入
    showPhotoInput() {
        const isCameraSupported = this.checkCameraSupport();
        
        this.showModal('拍照记账', `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">📷</div>
                <p>请选择拍照或上传图片进行记账</p>
                
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 30px;">
                    <button class="action-btn" onclick="homePage.simulatePhotoInput()">
                        <i class="fas fa-camera"></i>
                        模拟拍照
                    </button>
                    
                    ${isCameraSupported ? `
                    <button class="action-btn photo-input-btn" onclick="homePage.startRealPhotoInput()">
                        <i class="fas fa-camera-retro"></i>
                        拍照记账
                    </button>
                    ` : `
                    <button class="action-btn disabled" style="opacity: 0.6; cursor: not-allowed;">
                        <i class="fas fa-camera-slash"></i>
                        拍照记账（不支持）
                    </button>
                    `}
                    
                    <button class="action-btn upload-input-btn" onclick="homePage.startImageUpload()">
                        <i class="fas fa-upload"></i>
                        上传图片
                    </button>
                </div>
                
                ${isCameraSupported ? `
                <div style="margin-top: 15px; font-size: 0.85rem; color: #666;">
                    <i class="fas fa-info-circle"></i>
                    点击"拍照记账"按钮后，请允许浏览器访问您的摄像头
                </div>
                ` : ''}
                
                <div style="margin-top: 15px; font-size: 0.85rem; color: #666;">
                    <i class="fas fa-info-circle"></i>
                    支持上传JPG、PNG格式的账单图片
                </div>
            </div>
        `);
    }

    // 模拟拍照输入
    simulatePhotoInput() {
        const examples = [
            { 
                amount: 158, 
                description: '超市购物', 
                category: 'shopping', 
                type: 'expense', 
                merchant: '照片识别',
                date: new Date().toISOString(),
                time: new Date().toISOString()
            },
            { 
                amount: 68, 
                description: '餐厅用餐', 
                category: 'food', 
                type: 'expense', 
                merchant: '照片识别',
                date: new Date().toISOString(),
                time: new Date().toISOString()
            },
            { 
                amount: 35, 
                description: '咖啡消费', 
                category: 'food', 
                type: 'expense', 
                merchant: '照片识别',
                date: new Date().toISOString(),
                time: new Date().toISOString()
            },
            { 
                amount: 120, 
                description: '服装购买', 
                category: 'shopping', 
                type: 'expense', 
                merchant: '照片识别',
                date: new Date().toISOString(),
                time: new Date().toISOString()
            },
            { 
                amount: 25, 
                description: '交通费用', 
                category: 'transport', 
                type: 'expense', 
                merchant: '照片识别',
                date: new Date().toISOString(),
                time: new Date().toISOString()
            }
        ];
        const example = examples[Math.floor(Math.random() * examples.length)];
        
        this.app.addTransaction(example);
        this.hideModal();
        this.updateData();
        
        // 显示添加成功的提示
        this.app.showToast(`已添加支出记录：${example.description} ¥${Math.abs(example.amount)}`, 'success');
    }

    // 检查摄像头支持
    checkCameraSupport() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    // 开始真实拍照输入
    startRealPhotoInput() {
        if (!this.checkCameraSupport()) {
            this.app.showToast('您的设备不支持摄像头功能', 'error');
            return;
        }

        // 显示拍照界面
        this.showCameraInterface();
    }

    // 显示拍照界面
    showCameraInterface() {
        const cameraContainer = document.createElement('div');
        cameraContainer.id = 'photo-camera-container';
        cameraContainer.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: #000;
                z-index: 10002;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            ">
                <!-- 摄像头预览 -->
                <video id="camera-preview" autoplay playsinline style="
                    width: 100%;
                    height: 70%;
                    object-fit: cover;
                    background: #333;
                "></video>

                <!-- 控制区域 -->
                <div style="
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    color: white;
                ">
                    <h3 style="margin-bottom: 10px;">拍照识别</h3>
                    <p style="margin-bottom: 20px; text-align: center;">对准账单或收据拍照</p>
                    
                    <!-- 权限申请提示 -->
                    <div id="camera-permission-prompt" style="
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 10px;
                        padding: 15px;
                        margin-bottom: 20px;
                        text-align: center;
                        display: none;
                    ">
                        <div style="font-size: 2rem; margin-bottom: 10px;">📷</div>
                        <p style="margin-bottom: 10px;">需要摄像头权限</p>
                        <p style="font-size: 0.9rem; color: #ccc;">请允许浏览器访问您的摄像头</p>
                        <button id="request-camera-permission" style="
                            margin-top: 10px;
                            background: #4fd1c5;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            cursor: pointer;
                        ">授权摄像头</button>
                    </div>
                    
                    <div style="display: flex; gap: 15px;">
                        <button id="take-photo" style="
                            padding: 12px 24px;
                            background: #4fd1c5;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-size: 16px;
                            cursor: pointer;
                            display: none;
                        ">拍照</button>
                        
                        <button id="close-camera" style="
                            padding: 12px 24px;
                            background: #f56565;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-size: 16px;
                            cursor: pointer;
                        ">关闭</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(cameraContainer);
        
        // 延迟初始化摄像头，确保DOM完全渲染
        setTimeout(() => {
            this.initCamera();
        }, 100);
        
        // 绑定拍照事件
        document.getElementById('take-photo').addEventListener('click', () => {
            this.capturePhoto();
        });
        
        // 绑定关闭事件
        document.getElementById('close-camera').addEventListener('click', () => {
            this.hideCameraInterface();
        });
        
        // 绑定权限申请事件
        document.getElementById('request-camera-permission').addEventListener('click', () => {
            this.retryCameraPermission();
        });
    }

    // 初始化摄像头
    async initCamera() {
        try {
            // 显示摄像头加载状态
            this.showCameraLoadingState();
            
            // 尝试使用后置摄像头，如果失败则使用前置摄像头
            let mediaStream;
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    } 
                });
            } catch (environmentError) {
                console.log('后置摄像头不可用，尝试前置摄像头:', environmentError);
                mediaStream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode: 'user',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    } 
                });
            }
            
            this.mediaStream = mediaStream;
            
            const video = document.getElementById('camera-preview');
            if (video) {
                video.srcObject = this.mediaStream;
                
                // 等待视频加载完成
                video.onloadedmetadata = () => {
                    this.hideCameraLoadingState();
                    this.showCameraReadyState();
                };
                
                video.onerror = () => {
                    this.hideCameraLoadingState();
                    this.showCameraPermissionPrompt();
                };
            }
            
        } catch (error) {
            console.error('摄像头访问失败:', error);
            this.hideCameraLoadingState();
            this.showCameraPermissionPrompt();
        }
    }

    // 显示摄像头加载状态
    showCameraLoadingState() {
        const prompt = document.getElementById('camera-permission-prompt');
        const takePhotoBtn = document.getElementById('take-photo');
        
        if (prompt) {
            prompt.style.display = 'none';
        }
        if (takePhotoBtn) {
            takePhotoBtn.style.display = 'none';
        }
        
        // 显示加载指示器
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'camera-loading-indicator';
        loadingIndicator.innerHTML = `
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                z-index: 10003;
            ">
                <div style="font-size: 2rem; margin-bottom: 10px;">⏳</div>
                <div>正在初始化摄像头...</div>
            </div>
        `;
        
        const cameraPreview = document.getElementById('camera-preview');
        if (cameraPreview) {
            cameraPreview.appendChild(loadingIndicator);
        }
    }

    // 隐藏摄像头加载状态
    hideCameraLoadingState() {
        const loadingIndicator = document.getElementById('camera-loading-indicator');
        if (loadingIndicator && loadingIndicator.parentNode) {
            loadingIndicator.parentNode.removeChild(loadingIndicator);
        }
    }

    // 显示摄像头就绪状态
    showCameraReadyState() {
        const takePhotoBtn = document.getElementById('take-photo');
        const prompt = document.getElementById('camera-permission-prompt');
        
        if (takePhotoBtn) {
            takePhotoBtn.style.display = 'block';
        }
        if (prompt) {
            prompt.style.display = 'none';
        }
    }

    // 显示摄像头权限申请提示
    showCameraPermissionPrompt() {
        const prompt = document.getElementById('camera-permission-prompt');
        const takePhotoBtn = document.getElementById('take-photo');
        
        if (prompt) {
            prompt.style.display = 'block';
        }
        if (takePhotoBtn) {
            takePhotoBtn.style.display = 'none';
        }
        
        this.app.showToast('需要摄像头权限才能使用拍照功能', 'warning');
    }

    // 重试摄像头权限申请
    async retryCameraPermission() {
        try {
            this.showCameraLoadingState();
            
            // 清除之前的媒体流
            if (this.mediaStream) {
                this.mediaStream.getTracks().forEach(track => track.stop());
            }
            
            // 重新申请权限
            await this.initCamera();
            
        } catch (error) {
            console.error('重试摄像头权限失败:', error);
            this.showCameraPermissionPrompt();
            
            // 提供更详细的错误信息
            let errorMessage = '摄像头权限申请失败';
            if (error.name === 'NotAllowedError') {
                errorMessage = '摄像头权限被拒绝，请在浏览器设置中允许摄像头访问';
            } else if (error.name === 'NotFoundError') {
                errorMessage = '未找到可用的摄像头设备';
            } else if (error.name === 'NotSupportedError') {
                errorMessage = '您的设备不支持摄像头功能';
            }
            
            this.app.showToast(errorMessage, 'error');
        }
    }

    // 拍照
    capturePhoto() {
        const video = document.getElementById('camera-preview');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 处理照片识别
        this.processPhotoRecognition(canvas.toDataURL('image/jpeg'));
    }

    // 处理照片识别
    processPhotoRecognition(imageData) {
        // 显示识别中状态
        this.showPhotoProcessingState();
        
        // 模拟识别过程（实际应用中可调用OCR API）
        setTimeout(() => {
            const recognizedData = this.simulatePhotoRecognitionResult();
            this.showPhotoRecognitionResult(imageData, recognizedData);
        }, 2000);
    }

    // 模拟照片识别结果
    simulatePhotoRecognitionResult() {
        const receiptTypes = [
            {
                type: 'supermarket',
                items: [
                    { name: '牛奶', price: 12.5, quantity: 1 },
                    { name: '面包', price: 8.0, quantity: 2 },
                    { name: '水果', price: 25.0, quantity: 1 }
                ],
                total: 45.5,
                merchant: '超市'
            },
            {
                type: 'restaurant',
                items: [
                    { name: '午餐套餐', price: 35.0, quantity: 1 },
                    { name: '饮料', price: 8.0, quantity: 1 }
                ],
                total: 43.0,
                merchant: '餐厅'
            },
            {
                type: 'coffee',
                items: [
                    { name: '咖啡', price: 28.0, quantity: 1 },
                    { name: '蛋糕', price: 18.0, quantity: 1 }
                ],
                total: 46.0,
                merchant: '咖啡店'
            },
            {
                type: 'clothing',
                items: [
                    { name: 'T恤', price: 59.0, quantity: 1 },
                    { name: '裤子', price: 89.0, quantity: 1 }
                ],
                total: 148.0,
                merchant: '服装店'
            },
            {
                type: 'transport',
                items: [
                    { name: '地铁票', price: 6.0, quantity: 2 },
                    { name: '公交卡充值', price: 50.0, quantity: 1 }
                ],
                total: 62.0,
                merchant: '交通公司'
            }
        ];

        const receipt = receiptTypes[Math.floor(Math.random() * receiptTypes.length)];
        
        return {
            type: 'expense',
            amount: receipt.total,
            description: `${receipt.merchant}消费`,
            category: this.getCategoryByMerchant(receipt.merchant),
            merchant: receipt.merchant,
            items: receipt.items,
            source: 'photo_recognition'
        };
    }

    // 根据商户获取分类
    getCategoryByMerchant(merchant) {
        const categoryMap = {
            '超市': 'shopping',
            '餐厅': 'food',
            '咖啡店': 'food',
            '服装店': 'shopping',
            '交通公司': 'transport',
            '书店': 'study',
            '影院': 'entertainment'
        };

        return categoryMap[merchant] || 'other';
    }

    // 显示照片处理状态
    showPhotoProcessingState() {
        const existingIndicator = document.getElementById('photo-processing-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        const indicator = document.createElement('div');
        indicator.id = 'photo-processing-indicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(59, 130, 246, 0.95);
                color: white;
                padding: 30px;
                border-radius: 20px;
                text-align: center;
                z-index: 10003;
                backdrop-filter: blur(10px);
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            ">
                <div style="font-size: 4rem; margin-bottom: 20px; animation: pulse 1.5s infinite;">🔍</div>
                <div style="font-size: 1.2rem; margin-bottom: 10px;">正在识别照片...</div>
                <div style="color: #e0f2fe; font-size: 0.9rem;">
                    系统正在分析账单内容，请稍候
                </div>
            </div>
        `;

        document.body.appendChild(indicator);
    }

    // 显示照片识别结果
    showPhotoRecognitionResult(imageData, recognizedData) {
        this.hideUploadProcessingState();
        this.hidePhotoProcessingState();
        this.hideCameraInterface();
        
        const category = this.app.categories.find(cat => cat.id === recognizedData.category);
        const categoryName = category ? category.name : '其他';
        
        const modalContent = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">📷</div>
                <h3>照片识别结果</h3>
                
                <div style="background: #f8f9fa; border-radius: 10px; padding: 15px; margin: 15px 0;">
                    <div style="text-align: left; margin-bottom: 10px;">
                        <strong>识别结果:</strong>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: left;">
                        <div><strong>类型:</strong> <span style="color: #ef4444">支出</span></div>
                        <div><strong>金额:</strong> <span style="color: #3b82f6; font-weight: bold;">¥${recognizedData.amount.toFixed(2)}</span></div>
                        <div><strong>分类:</strong> <span style="color: ${category ? category.color : '#666'}">${categoryName}</span></div>
                        <div><strong>商户:</strong> ${recognizedData.merchant}</div>
                        <div><strong>描述:</strong> ${recognizedData.description}</div>
                    </div>
                    
                    ${recognizedData.items ? `
                    <div style="margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
                        <strong>商品明细:</strong>
                        ${recognizedData.items.map(item => 
                            `<div style="font-size: 0.9rem; color: #666;">${item.name} × ${item.quantity} = ¥${(item.price * item.quantity).toFixed(2)}</div>`
                        ).join('')}
                    </div>
                    ` : ''}
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                    <button class="action-btn success" onclick="homePage.confirmPhotoInput()">
                        <i class="fas fa-check"></i> 确认添加
                    </button>
                    <button class="action-btn secondary" onclick="homePage.cancelPhotoInput()">
                        <i class="fas fa-times"></i> 取消
                    </button>
                    <button class="action-btn outline" onclick="homePage.startRealPhotoInput()">
                        <i class="fas fa-redo"></i> 重新拍照
                    </button>
                </div>
            </div>
        `;
        
        // 保存当前解析的数据
        this.currentPhotoData = recognizedData;
        
        // 更新模态框内容
        this.updateModalContent(modalContent);
    }

    // 确认照片输入
    confirmPhotoInput() {
        if (this.currentPhotoData) {
            this.app.addTransaction(this.currentPhotoData);
            this.hideModal();
            this.updateData();
            
            this.app.showToast(`已添加支出记录：${this.currentPhotoData.description} ¥${Math.abs(this.currentPhotoData.amount)}`, 'success');
            
            this.currentPhotoData = null;
        }
    }

    // 取消照片输入
    cancelPhotoInput() {
        this.currentPhotoData = null;
        this.hideModal();
    }

    // 隐藏照片处理状态
    hidePhotoProcessingState() {
        const indicator = document.getElementById('photo-processing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // 隐藏摄像头界面
    hideCameraInterface() {
        const container = document.getElementById('photo-camera-container');
        if (container) {
            container.remove();
        }
        
        // 停止摄像头流
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
    }

    // 开始图片上传
    startImageUpload() {
        // 创建文件输入元素
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/jpeg,image/png,image/jpg';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                this.processImageUpload(file);
            }
            
            // 清理文件输入
            document.body.removeChild(fileInput);
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
    }

    // 处理图片上传
    processImageUpload(file) {
        // 验证文件类型
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            this.app.showToast('请上传JPG或PNG格式的图片', 'error');
            return;
        }
        
        // 验证文件大小（最大5MB）
        if (file.size > 5 * 1024 * 1024) {
            this.app.showToast('图片大小不能超过5MB', 'error');
            return;
        }
        
        // 显示上传处理状态
        this.showUploadProcessingState();
        
        // 读取文件内容
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            
            // 模拟识别过程
            setTimeout(() => {
                const recognizedData = this.simulatePhotoRecognitionResult();
                this.showPhotoRecognitionResult(imageData, recognizedData);
            }, 2000);
        };
        
        reader.onerror = () => {
            this.hideUploadProcessingState();
            this.app.showToast('图片读取失败，请重试', 'error');
        };
        
        reader.readAsDataURL(file);
    }

    // 显示上传处理状态
    showUploadProcessingState() {
        const existingIndicator = document.getElementById('upload-processing-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        const indicator = document.createElement('div');
        indicator.id = 'upload-processing-indicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(59, 130, 246, 0.95);
                color: white;
                padding: 30px;
                border-radius: 20px;
                text-align: center;
                z-index: 10003;
                backdrop-filter: blur(10px);
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            ">
                <div style="font-size: 4rem; margin-bottom: 20px; animation: pulse 1.5s infinite;">📤</div>
                <div style="font-size: 1.2rem; margin-bottom: 10px;">正在处理图片...</div>
                <div style="color: #e0f2fe; font-size: 0.9rem;">
                    系统正在分析上传的账单图片，请稍候
                </div>
            </div>
        `;

        document.body.appendChild(indicator);
    }

    // 隐藏上传处理状态
    hideUploadProcessingState() {
        const indicator = document.getElementById('upload-processing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // 切换平台同步
    togglePlatformSync(platform, element) {
        document.querySelectorAll('.platform-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        element.classList.add('active');
        this.app.showToast(`${platform === 'wechat' ? '微信支付' : '支付宝'}同步已启用`);
    }

    // 编辑交易
    editTransaction(index) {
        const transaction = this.app.transactions[index];
        this.showTransactionModal(transaction, index);
    }

    // 显示交易模态框
    showTransactionModal(transaction = null, index = null) {
        const isEdit = transaction !== null;
        const categoriesOptions = this.app.categories.map(cat => 
            `<option value="${cat.id}" ${transaction?.category === cat.id ? 'selected' : ''}>${cat.icon} ${cat.name}</option>`
        ).join('');

        this.showModal(isEdit ? '编辑交易' : '新增交易', `
            <div style="padding: 20px;">
                <div class="input-group">
                    <label>类型</label>
                    <select id="transaction-type">
                        <option value="income" ${transaction?.type === 'income' ? 'selected' : ''}>收入</option>
                        <option value="expense" ${!transaction || transaction?.type === 'expense' ? 'selected' : ''}>支出</option>
                    </select>
                </div>
                
                <div class="input-group">
                    <label>金额</label>
                    <input type="number" id="transaction-amount" value="${transaction?.amount || ''}" placeholder="输入金额">
                </div>
                
                <div class="input-group">
                    <label>分类</label>
                    <select id="transaction-category">
                        ${categoriesOptions}
                    </select>
                </div>
                
                <div class="input-group">
                    <label>描述</label>
                    <input type="text" id="transaction-description" value="${transaction?.description || ''}" placeholder="交易描述">
                </div>
                
                <div class="input-group">
                    <label>商户</label>
                    <input type="text" id="transaction-merchant" value="${transaction?.merchant || ''}" placeholder="商户名称">
                </div>
                
                <div class="button-group">
                    <button class="btn btn-primary" onclick="homePage.${isEdit ? 'updateTransaction' : 'saveTransaction'}(${index})">
                        ${isEdit ? '更新' : '保存'}
                    </button>
                    ${isEdit ? `<button class="btn btn-danger" onclick="homePage.deleteTransaction(${index})">删除</button>` : ''}
                    <button class="btn btn-secondary" onclick="homePage.hideModal()">取消</button>
                </div>
            </div>
        `);
    }

    // 保存交易
    saveTransaction() {
        const type = document.getElementById('transaction-type').value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const category = document.getElementById('transaction-category').value;
        const description = document.getElementById('transaction-description').value;
        const merchant = document.getElementById('transaction-merchant').value;

        if (!amount || !description) {
            this.app.showToast('请填写完整信息！');
            return;
        }

        this.app.addTransaction({
            type,
            amount,
            category,
            description,
            merchant
        });

        this.hideModal();
        this.updateData();
    }

    // 更新交易
    updateTransaction(index) {
        const type = document.getElementById('transaction-type').value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const category = document.getElementById('transaction-category').value;
        const description = document.getElementById('transaction-description').value;
        const merchant = document.getElementById('transaction-merchant').value;

        if (!amount || !description) {
            this.app.showToast('请填写完整信息！');
            return;
        }

        this.app.editTransaction(index, {
            type,
            amount,
            category,
            description,
            merchant
        });

        this.hideModal();
        this.updateData();
    }

    // 删除交易
    async deleteTransaction(index) {
        // 保存当前打开的模态框引用
        const previousModal = this.currentModal;
        
        return new Promise((resolve) => {
            this.showConfirmModal('确认删除', '确定要删除这条交易记录吗？', async () => {
                try {
                    const success = await this.app.deleteTransaction(index);
                    if (success) {
                        // 先关闭确认对话框
                        this.hideModal();
                        // 恢复之前的模态框引用并关闭它
                        if (previousModal) {
                            this.currentModal = previousModal;
                            this.hideModal();
                        }
                        this.updateData();
                        this.app.showToast('删除成功', 'success');
                        resolve(true);
                    } else {
                        this.app.showToast('删除失败，请重试', 'error');
                        resolve(false);
                    }
                } catch (error) {
                    console.error('删除交易时发生错误:', error);
                    this.app.showToast('删除失败，请重试', 'error');
                    resolve(false);
                }
            });
        });
    }

    // 显示确认对话框
    showConfirmModal(title, message, onConfirm) {
        const content = `
            <div class="confirm-dialog" style="text-align: center; padding: 20px;">
                <p style="margin-bottom: 20px; color: #4a5568;">${message}</p>
                <div class="button-group" style="display: flex; justify-content: center; gap: 10px;">
                    <button id="cancel-btn" 
                            style="padding: 8px 16px; border-radius: 6px; border: 1px solid #e2e8f0; background: #f7fafc; color: #4a5568;">
                        取消
                    </button>
                    <button id="confirm-btn" 
                            style="padding: 8px 16px; border-radius: 6px; border: none; background: #e53e3e; color: white;">
                        确认删除
                    </button>
                </div>
            </div>
        `;
        this.showModal(title, content);

        // 使用事件监听器绑定点击事件
        setTimeout(() => {
            const cancelBtn = document.getElementById('cancel-btn');
            const confirmBtn = document.getElementById('confirm-btn');
            
            // 定义事件处理函数
            const handleCancel = () => {
                if (cancelBtn) cancelBtn.removeEventListener('click', handleCancel);
                this.hideModal();
            };
            
            const handleConfirm = async () => {
                if (confirmBtn) confirmBtn.removeEventListener('click', handleConfirm);
                await onConfirm();
                this.hideModal(); // 确认操作完成后自动关闭弹窗
            };
            
            // 绑定事件
            if (cancelBtn) {
                cancelBtn.addEventListener('click', handleCancel);
            }
            
            if (confirmBtn) {
                confirmBtn.addEventListener('click', handleConfirm);
            }
        }, 0);
    }

    // 显示模态框
    showModal(title, content) {
        // 如果已经有模态框打开，先移除它
        if (this.currentModal) {
            document.body.removeChild(this.currentModal);
        }

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
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        // 为关闭按钮添加事件监听
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideModal());
        }

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

    // 连接微信支付
    connectWechatPay() {
        // 委托给应用实例启动微信OAuth登录（应用层包含更健壮的实现）
        try {
            if (this.app && typeof this.app.startWechatOAuthLogin === 'function') {
                const p = this.app.startWechatOAuthLogin();
                if (p && typeof p.then === 'function') p.catch(err => {
                    console.error('startWechatOAuthLogin rejected:', err);
                    this.app.showToast && this.app.showToast('启动微信登录失败，请重试');
                });
            } else if (window.accountingApp && typeof window.accountingApp.startWechatOAuthLogin === 'function') {
                const p = window.accountingApp.startWechatOAuthLogin();
                if (p && typeof p.then === 'function') p.catch(err => {
                    console.error('window.accountingApp.startWechatOAuthLogin rejected:', err);
                    this.app.showToast && this.app.showToast('启动微信登录失败，请重试');
                });
            } else {
                console.error('无法找到启动微信登录的方法');
                this.app.showToast && this.app.showToast('启动微信登录失败，请重试');
            }
        } catch (e) {
            console.error('connectWechatPay error:', e);
            this.app.showToast && this.app.showToast('启动微信登录失败，请重试');
        }
    }

    // 连接支付宝
    connectAlipay() {
        // 委托给应用实例启动支付宝OAuth登录（应用层包含更健壮的实现）
        try {
            if (this.app && typeof this.app.startAlipayOAuthLogin === 'function') {
                const p = this.app.startAlipayOAuthLogin();
                if (p && typeof p.then === 'function') p.catch(err => {
                    console.error('startAlipayOAuthLogin rejected:', err);
                    this.app.showToast && this.app.showToast('启动支付宝登录失败，请重试');
                });
            } else if (window.accountingApp && typeof window.accountingApp.startAlipayOAuthLogin === 'function') {
                const p = window.accountingApp.startAlipayOAuthLogin();
                if (p && typeof p.then === 'function') p.catch(err => {
                    console.error('window.accountingApp.startAlipayOAuthLogin rejected:', err);
                    this.app.showToast && this.app.showToast('启动支付宝登录失败，请重试');
                });
            } else {
                console.error('无法找到启动支付宝登录的方法');
                this.app.showToast && this.app.showToast('启动支付宝登录失败，请重试');
            }
        } catch (e) {
            console.error('connectAlipay error:', e);
            this.app.showToast && this.app.showToast('启动支付宝登录失败，请重试');
        }
    }

    // 启动微信OAuth登录
    async startWechatOAuthLogin() {
        try {
            // 生成授权URL
            const redirectUri = window.location.origin + '/wechat-callback.html';
            const state = 'wechat_login_' + Date.now();
            const authUrl = this.app.wechatOAuth.generateAuthUrl(redirectUri, state);
            
            // 保存state用于验证
            sessionStorage.setItem('wechat_oauth_state', state);
            
            // 跳转到微信授权页面
            window.location.href = authUrl;
            
        } catch (error) {
            console.error('启动微信登录失败:', error);
            this.app.showToast('启动微信登录失败，请重试');
        }
    }

    // 启动支付宝OAuth登录
    async startAlipayOAuthLogin() {
        try {
            // 生成授权URL
            const redirectUri = window.location.origin + '/alipay-callback.html';
            const state = 'alipay_login_' + Date.now();
            const authUrl = this.app.alipayOAuth.generateAuthUrl(redirectUri, state);
            
            // 保存state用于验证
            sessionStorage.setItem('alipay_oauth_state', state);
            
            // 跳转到支付宝授权页面
            window.location.href = authUrl;
            
        } catch (error) {
            console.error('启动支付宝登录失败:', error);
            this.app.showToast('启动支付宝登录失败，请重试');
        }
    }
}

// 全局变量以便在模态框中使用
let homePage;