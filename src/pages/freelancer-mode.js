class FreelancerModePage {
    constructor(app) {
        this.app = app;
        this.currentModal = null;
        this.loadFreelancerData();
    }

    // 加载自由职业者模式数据
    loadFreelancerData() {
        try {
            this.freelancerSettings = JSON.parse(localStorage.getItem('freelancer_mode_settings') || '{}');
            this.businessTransactions = JSON.parse(localStorage.getItem('business_transactions') || '[]');
            this.invoices = JSON.parse(localStorage.getItem('freelancer_invoices') || '[]');
            this.taxReports = JSON.parse(localStorage.getItem('tax_reports') || '[]');
            this.cashFlowAlerts = JSON.parse(localStorage.getItem('cash_flow_alerts') || '[]');
            
            // 设置默认的最低运营资金阈值
            if (!this.freelancerSettings.minOperatingFunds) {
                this.freelancerSettings.minOperatingFunds = 10000; // 默认1万元
            }
        } catch (e) {
            console.error('加载自由职业者模式数据失败:', e);
        }
    }

    // 渲染页面
    render() {
        return `
            <div class="page active" id="freelancer-mode-page">
                <div class="page-header">
                    <h2><i class="fas fa-briefcase"></i> 自由职业者模式</h2>
                    <p>专业的收支管理与税务申报助手</p>
                </div>

                <!-- 现金流概览 -->
                <div class="card">
                    <h3><i class="fas fa-chart-line"></i> 现金流概览</h3>
                    <div class="cash-flow-overview">
                        <div class="overview-stats">
                            <div class="stat-card ${this.getCurrentBalance() < this.freelancerSettings.minOperatingFunds ? 'warning' : ''}">
                                <div class="stat-value">¥${this.getCurrentBalance()}</div>
                                <div class="stat-label">当前可用资金</div>
                                <div class="stat-trend ${this.getBalanceTrend() > 0 ? 'positive' : 'negative'}">
                                    <i class="fas fa-arrow-${this.getBalanceTrend() > 0 ? 'up' : 'down'}"></i>
                                    ${Math.abs(this.getBalanceTrend()).toFixed(1)}%
                                </div>
                                ${this.getCurrentBalance() < this.freelancerSettings.minOperatingFunds ? 
                                    '<div class="stat-warning"><i class="fas fa-exclamation-triangle"></i> 低于安全线</div>' : ''}
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">¥${this.getMonthlyBusinessIncome()}</div>
                                <div class="stat-label">本月经营收入</div>
                                <div class="stat-comparison">
                                    vs 上月: ${this.getIncomeComparison() > 0 ? '+' : ''}${this.getIncomeComparison().toFixed(1)}%
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">¥${this.getMonthlyBusinessCost()}</div>
                                <div class="stat-label">本月经营成本</div>
                                <div class="stat-comparison">
                                    vs 上月: ${this.getCostComparison() > 0 ? '+' : ''}${this.getCostComparison().toFixed(1)}%
                                </div>
                            </div>
                            <div class="stat-card ${this.getMonthlyProfit() < 0 ? 'negative' : 'positive'}">
                                <div class="stat-value">¥${this.getMonthlyProfit()}</div>
                                <div class="stat-label">本月经营利润</div>
                                <div class="stat-comparison">
                                    利润率: ${this.getProfitMargin().toFixed(1)}%
                                </div>
                            </div>
                        </div>
                        
                        <!-- 财务健康度指标 -->
                        <div class="financial-health">
                            <h4><i class="fas fa-heartbeat"></i> 财务健康度</h4>
                            <div class="health-indicators">
                                <div class="health-item">
                                    <div class="health-label">现金流稳定性</div>
                                    <div class="health-bar">
                                        <div class="health-progress" style="width: ${this.getCashFlowStability()}%"></div>
                                    </div>
                                    <div class="health-score">${this.getCashFlowStability()}分</div>
                                </div>
                                <div class="health-item">
                                    <div class="health-label">收入多样性</div>
                                    <div class="health-bar">
                                        <div class="health-progress" style="width: ${this.getIncomeDiversity()}%"></div>
                                    </div>
                                    <div class="health-score">${this.getIncomeDiversity()}分</div>
                                </div>
                                <div class="health-item">
                                    <div class="health-label">成本控制</div>
                                    <div class="health-bar">
                                        <div class="health-progress" style="width: ${this.getCostControl()}%"></div>
                                    </div>
                                    <div class="health-score">${this.getCostControl()}分</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="cash-flow-chart">
                            <h4>现金流趋势</h4>
                            <div class="chart-placeholder">
                                ${this.renderCashFlowChart()}
                            </div>
                        </div>
                        
                        <!-- 智能建议 -->
                        <div class="smart-suggestions">
                            <h4><i class="fas fa-lightbulb"></i> 智能建议</h4>
                            <div class="suggestions-list">
                                ${this.getFinancialSuggestions().map(suggestion => `
                                    <div class="suggestion-item ${suggestion.type}">
                                        <i class="fas fa-${suggestion.icon}"></i>
                                        <span>${suggestion.text}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 现金流预警设置 -->
                <div class="card">
                    <h3><i class="fas fa-bell"></i> 现金流预警</h3>
                    <div class="alert-settings">
                        <div class="input-group">
                            <label>最低运营资金阈值</label>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input type="number" id="min-operating-funds" 
                                       value="${this.freelancerSettings.minOperatingFunds}" 
                                       placeholder="请输入金额">
                                <button class="btn btn-primary" onclick="freelancerModePage.updateOperatingFunds()">更新</button>
                            </div>
                        </div>
                        <div class="alert-info">
                            <p>当前可维持运营天数: <strong>${this.calculateOperatingDays()}</strong> 天</p>
                            ${this.getCurrentBalance() < this.freelancerSettings.minOperatingFunds ? 
                                '<p class="warning-text"><i class="fas fa-exclamation-triangle"></i> 建议优先收回应收账款或寻找新项目</p>' : 
                                '<p class="safe-text"><i class="fas fa-check-circle"></i> 现金流状况良好</p>'
                            }
                        </div>
                    </div>
                    
                    <div class="recent-alerts" id="recent-alerts">
                        ${this.renderRecentAlerts()}
                    </div>
                </div>

                <!-- 智能记账 -->
                <div class="card">
                    <h3><i class="fas fa-plus-circle"></i> 智能记账</h3>
                    
                    <!-- 快速记账区域 -->
                    <div class="quick-transaction-area">
                        <h4><i class="fas fa-zap"></i> 快速记账</h4>
                        <div class="quick-amounts">
                            ${this.getQuickAmounts().map(amount => `
                                <button class="quick-amount-btn" onclick="freelancerModePage.setQuickAmount(${amount})">
                                    ¥${amount}
                                </button>
                            `).join('')}
                        </div>
                        <div class="quick-categories">
                            <div class="category-group">
                                <span class="category-label">常用收入:</span>
                                ${this.getFrequentCategories('income').map(cat => `
                                    <button class="category-btn income" onclick="freelancerModePage.quickRecord('income', '${cat}')">
                                        ${cat}
                                    </button>
                                `).join('')}
                            </div>
                            <div class="category-group">
                                <span class="category-label">常用成本:</span>
                                ${this.getFrequentCategories('cost').map(cat => `
                                    <button class="category-btn cost" onclick="freelancerModePage.quickRecord('cost', '${cat}')">
                                        ${cat}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="business-transaction-form">
                        <div class="transaction-type-tabs">
                            <button class="tab-btn active" data-type="income" onclick="freelancerModePage.switchTransactionType('income')">经营收入</button>
                            <button class="tab-btn" data-type="cost" onclick="freelancerModePage.switchTransactionType('cost')">经营成本</button>
                            <button class="tab-btn" data-type="personal" onclick="freelancerModePage.switchTransactionType('personal')">个人消费</button>
                        </div>
                        
                        <!-- 智能分类建议 -->
                        <div class="smart-classification" id="smart-classification" style="display: none;">
                            <h4><i class="fas fa-brain"></i> 智能分类建议</h4>
                            <div class="classification-suggestions" id="classification-suggestions"></div>
                        </div>
                        
                        <div class="transaction-form" id="business-transaction-form">
                            ${this.renderTransactionForm('income')}
                        </div>
                        
                        <!-- 税务智能提醒 -->
                        <div class="tax-reminder" id="tax-reminder" style="display: none;">
                            <div class="reminder-content">
                                <i class="fas fa-info-circle"></i>
                                <span id="tax-reminder-text"></span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 发票管理 -->
                <div class="card">
                    <h3><i class="fas fa-file-invoice"></i> 发票管理</h3>
                    <div class="invoice-actions">
                        <button class="btn btn-primary" onclick="freelancerModePage.showAddInvoice()">
                            <i class="fas fa-plus"></i> 添加发票
                        </button>
                        <button class="btn btn-secondary" onclick="freelancerModePage.scanInvoice()">
                            <i class="fas fa-camera"></i> 扫描发票
                        </button>
                    </div>
                    
                    <div class="invoice-list" id="invoice-list">
                        ${this.renderInvoiceList()}
                    </div>
                </div>

                <!-- 税务申报助手 -->
                <div class="card">
                    <h3><i class="fas fa-calculator"></i> 税务申报助手</h3>
                    
                    <!-- 税务概览 -->
                    <div class="tax-overview">
                        <div class="tax-stats">
                            <div class="tax-item">
                                <span class="tax-label">本季度经营利润</span>
                                <span class="tax-value">¥${this.getQuarterlyProfit()}</span>
                                <div class="tax-trend ${this.getProfitTrend() > 0 ? 'up' : 'down'}">
                                    <i class="fas fa-arrow-${this.getProfitTrend() > 0 ? 'up' : 'down'}"></i>
                                    ${Math.abs(this.getProfitTrend()).toFixed(1)}%
                                </div>
                            </div>
                            <div class="tax-item">
                                <span class="tax-label">可抵扣成本</span>
                                <span class="tax-value">¥${this.getDeductibleCosts()}</span>
                                <div class="tax-detail">
                                    抵扣率: ${this.getDeductionRate().toFixed(1)}%
                                </div>
                            </div>
                            <div class="tax-item">
                                <span class="tax-label">预估应纳税额</span>
                                <span class="tax-value">¥${this.getEstimatedTax()}</span>
                                <div class="tax-detail">
                                    有效税率: ${this.getEffectiveTaxRate().toFixed(1)}%
                                </div>
                            </div>
                            <div class="tax-item">
                                <span class="tax-label">税务优化空间</span>
                                <span class="tax-value">¥${this.getTaxOptimizationPotential()}</span>
                                <div class="tax-detail">
                                    可节省: ${this.getTaxSavingsPotential().toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 税务健康度 -->
                    <div class="tax-health">
                        <h4><i class="fas fa-shield-alt"></i> 税务健康度</h4>
                        <div class="health-metrics">
                            <div class="metric-item">
                                <div class="metric-label">发票完整性</div>
                                <div class="metric-bar">
                                    <div class="metric-progress" style="width: ${this.getInvoiceCompleteness()}%"></div>
                                </div>
                                <div class="metric-score">${this.getInvoiceCompleteness()}%</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-label">抵扣凭证</div>
                                <div class="metric-bar">
                                    <div class="metric-progress" style="width: ${this.getDeductionDocuments()}%"></div>
                                </div>
                                <div class="metric-score">${this.getDeductionDocuments()}%</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-label">合规风险</div>
                                <div class="metric-bar risk">
                                    <div class="metric-progress" style="width: ${100 - this.getComplianceRisk()}%"></div>
                                </div>
                                <div class="metric-score">${this.getComplianceRisk()}%</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 智能税务建议 -->
                    <div class="tax-suggestions">
                        <h4><i class="fas fa-lightbulb"></i> 智能税务建议</h4>
                        <div class="suggestions-grid">
                            ${this.getTaxSuggestions().map(suggestion => `
                                <div class="suggestion-card ${suggestion.priority}">
                                    <div class="suggestion-header">
                                        <i class="fas fa-${suggestion.icon}"></i>
                                        <span class="suggestion-title">${suggestion.title}</span>
                                    </div>
                                    <div class="suggestion-content">${suggestion.content}</div>
                                    <div class="suggestion-impact">预计节省: ¥${suggestion.savings}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- 申报提醒 -->
                    <div class="tax-reminders">
                        <h4><i class="fas fa-calendar-alt"></i> 申报提醒</h4>
                        <div class="reminders-list">
                            ${this.getTaxReminders().map(reminder => `
                                <div class="reminder-item ${reminder.urgency}">
                                    <div class="reminder-date">${reminder.date}</div>
                                    <div class="reminder-content">
                                        <div class="reminder-title">${reminder.title}</div>
                                        <div class="reminder-desc">${reminder.description}</div>
                                    </div>
                                    <div class="reminder-actions">
                                        <button class="btn btn-sm btn-primary" onclick="freelancerModePage.handleTaxReminder('${reminder.id}')">
                                            处理
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="tax-actions">
                        <button class="btn btn-primary" onclick="freelancerModePage.generateTaxReport()">
                            <i class="fas fa-file-alt"></i> 生成利润表
                        </button>
                        <button class="btn btn-secondary" onclick="freelancerModePage.generateDeductionList()">
                            <i class="fas fa-list"></i> 生成抵扣清单
                        </button>
                        <button class="btn btn-secondary" onclick="freelancerModePage.showTaxOptimization()">
                            <i class="fas fa-chart-pie"></i> 税务优化分析
                        </button>
                        <button class="btn btn-secondary" onclick="freelancerModePage.exportTaxData()">
                            <i class="fas fa-download"></i> 导出报税数据
                        </button>
                    </div>
                </div>

                <!-- 项目收支分析 -->
                <div class="card">
                    <h3><i class="fas fa-project-diagram"></i> 项目收支分析</h3>
                    <div class="project-analysis" id="project-analysis">
                        ${this.renderProjectAnalysis()}
                    </div>
                </div>

                <!-- 财务报表 -->
                <div class="card">
                    <h3><i class="fas fa-chart-bar"></i> 财务报表</h3>
                    <div class="report-tabs">
                        <button class="tab-btn active" onclick="freelancerModePage.showReport('profit')">利润表</button>
                        <button class="tab-btn" onclick="freelancerModePage.showReport('cashflow')">现金流量表</button>
                        <button class="tab-btn" onclick="freelancerModePage.showReport('analysis')">经营分析</button>
                    </div>
                    
                    <div class="report-content" id="report-content">
                        ${this.renderProfitReport()}
                    </div>
                </div>
            </div>
        `;
    }

    // 渲染交易表单
    renderTransactionForm(type) {
        const categories = {
            income: [
                '项目尾款', '客户定金', '咨询费用', '设计费用', '开发费用', 
                '培训收入', '版权收入', '其他收入'
            ],
            cost: [
                '设备采购', '软件订阅', '平台手续费', '交通差旅', '办公用品',
                '网络通讯', '培训学习', '营销推广', '其他成本'
            ],
            personal: [
                '房租房贷', '餐饮美食', '交通出行', '生活用品', '医疗健康',
                '娱乐休闲', '服装购物', '其他消费'
            ]
        };

        return `
            <div class="form-content">
                <div class="input-group">
                    <label>金额</label>
                    <input type="number" id="transaction-amount" placeholder="请输入金额">
                </div>
                
                <div class="input-group">
                    <label>分类</label>
                    <select id="transaction-category">
                        ${categories[type].map(cat => 
                            `<option value="${cat}">${cat}</option>`
                        ).join('')}
                    </select>
                </div>
                
                ${type !== 'personal' ? `
                    <div class="input-group">
                        <label>项目名称</label>
                        <input type="text" id="project-name" placeholder="请输入项目名称">
                    </div>
                ` : ''}
                
                <div class="input-group">
                    <label>描述</label>
                    <input type="text" id="transaction-description" placeholder="请输入描述">
                </div>
                
                ${type === 'cost' ? `
                    <div class="input-group">
                        <label>发票信息</label>
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="invoice-number" placeholder="发票号码">
                            <label class="checkbox-label">
                                <input type="checkbox" id="tax-deductible"> 可抵扣
                            </label>
                        </div>
                    </div>
                    
                    <div class="input-group">
                        <label>发票照片</label>
                        <div class="invoice-upload">
                            <input type="file" id="invoice-photo" accept="image/*" onchange="freelancerModePage.previewInvoice(this)">
                            <div class="upload-preview" id="upload-preview"></div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="input-group">
                    <label>日期</label>
                    <input type="date" id="transaction-date" value="${new Date().toISOString().split('T')[0]}">
                </div>
                
                <button class="btn btn-primary btn-block" onclick="freelancerModePage.addBusinessTransaction()">
                    <i class="fas fa-save"></i> 记录
                </button>
            </div>
        `;
    }

    // 渲染发票列表
    renderInvoiceList() {
        if (this.invoices.length === 0) {
            return '<div class="empty-state">暂无发票记录</div>';
        }

        return this.invoices.map(invoice => `
            <div class="invoice-item">
                <div class="invoice-info">
                    <div class="invoice-header">
                        <h4>${invoice.title}</h4>
                        <span class="invoice-amount">¥${invoice.amount}</span>
                    </div>
                    <div class="invoice-details">
                        <span>发票号: ${invoice.number}</span>
                        <span>日期: ${new Date(invoice.date).toLocaleDateString()}</span>
                        <span class="deductible-tag ${invoice.deductible ? 'yes' : 'no'}">
                            ${invoice.deductible ? '可抵扣' : '不可抵扣'}
                        </span>
                    </div>
                </div>
                <div class="invoice-actions">
                    ${invoice.photo ? `
                        <button class="btn btn-sm btn-secondary" onclick="freelancerModePage.viewInvoicePhoto('${invoice.id}')">
                            <i class="fas fa-image"></i>
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-primary" onclick="freelancerModePage.editInvoice('${invoice.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="freelancerModePage.deleteInvoice('${invoice.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // 渲染现金流图表
    renderCashFlowChart() {
        const last6Months = this.getLast6MonthsCashFlow();
        
        return `
            <div class="simple-chart">
                ${last6Months.map((month, index) => `
                    <div class="chart-bar">
                        <div class="bar-container">
                            <div class="bar-positive" style="height: ${Math.max(0, month.profit) / 1000 * 50}px"></div>
                            <div class="bar-negative" style="height: ${Math.max(0, -month.profit) / 1000 * 50}px"></div>
                        </div>
                        <div class="bar-label">${month.month}</div>
                        <div class="bar-value">¥${month.profit}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 渲染最近预警
    renderRecentAlerts() {
        if (this.cashFlowAlerts.length === 0) {
            return '<div class="empty-state">暂无预警记录</div>';
        }

        return this.cashFlowAlerts.slice(0, 3).map(alert => `
            <div class="alert-item ${alert.level}">
                <div class="alert-icon">
                    <i class="fas ${alert.level === 'danger' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-message">${alert.message}</div>
                    <div class="alert-time">${new Date(alert.createdAt).toLocaleString()}</div>
                </div>
            </div>
        `).join('');
    }

    // 渲染项目分析
    renderProjectAnalysis() {
        const projects = this.getProjectSummary();
        
        if (projects.length === 0) {
            return '<div class="empty-state">暂无项目数据</div>';
        }

        return projects.map(project => `
            <div class="project-item">
                <div class="project-header">
                    <h4>${project.name}</h4>
                    <span class="project-profit ${project.profit >= 0 ? 'positive' : 'negative'}">
                        ¥${project.profit}
                    </span>
                </div>
                <div class="project-details">
                    <div class="detail-item">
                        <span>收入: ¥${project.income}</span>
                        <span>成本: ¥${project.cost}</span>
                    </div>
                    <div class="detail-item">
                        <span>利润率: ${project.profitRate}%</span>
                        <span>交易数: ${project.transactionCount}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 渲染利润报表
    renderProfitReport() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyData = this.getMonthlyProfitData(currentYear, currentMonth);
        
        return `
            <div class="profit-report">
                <h4>${currentYear}年${currentMonth + 1}月利润表</h4>
                <div class="report-table">
                    <div class="report-row">
                        <span class="row-label">经营收入</span>
                        <span class="row-value positive">¥${monthlyData.income}</span>
                    </div>
                    <div class="report-row">
                        <span class="row-label">经营成本</span>
                        <span class="row-value negative">¥${monthlyData.cost}</span>
                    </div>
                    <div class="report-row total">
                        <span class="row-label">经营利润</span>
                        <span class="row-value ${monthlyData.profit >= 0 ? 'positive' : 'negative'}">¥${monthlyData.profit}</span>
                    </div>
                    <div class="report-row">
                        <span class="row-label">利润率</span>
                        <span class="row-value">${monthlyData.profitRate}%</span>
                    </div>
                </div>
                
                <div class="cost-breakdown">
                    <h5>成本构成</h5>
                    ${Object.entries(monthlyData.costBreakdown).map(([category, amount]) => `
                        <div class="breakdown-item">
                            <span>${category}</span>
                            <span>¥${amount}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 初始化事件
    initEvents() {
        freelancerModePage = this;
        this.loadFreelancerData();
        this.currentTransactionType = 'income';
        this.checkCashFlowAlert();
    }

    // 切换交易类型
    switchTransactionType(type) {
        this.currentTransactionType = type;
        
        // 更新标签页状态
        document.querySelectorAll('.transaction-type-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
        
        // 更新表单内容
        document.getElementById('business-transaction-form').innerHTML = this.renderTransactionForm(type);
    }

    // 添加业务交易
    addBusinessTransaction() {
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const category = document.getElementById('transaction-category').value;
        const description = document.getElementById('transaction-description').value;
        const date = document.getElementById('transaction-date').value;

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
            date,
            createdAt: new Date().toISOString()
        };

        // 添加项目信息（如果有）
        const projectNameEl = document.getElementById('project-name');
        if (projectNameEl) {
            transaction.projectName = projectNameEl.value || '未分类项目';
        }

        // 添加发票信息（如果是成本）
        if (this.currentTransactionType === 'cost') {
            const invoiceNumber = document.getElementById('invoice-number').value;
            const taxDeductible = document.getElementById('tax-deductible').checked;
            
            transaction.invoiceNumber = invoiceNumber;
            transaction.taxDeductible = taxDeductible;
            
            // 处理发票照片
            const invoicePhoto = document.getElementById('invoice-photo').files[0];
            if (invoicePhoto) {
                // 这里应该上传照片到服务器，暂时存储文件名
                transaction.invoicePhoto = invoicePhoto.name;
            }
        }

        this.businessTransactions.unshift(transaction);
        localStorage.setItem('business_transactions', JSON.stringify(this.businessTransactions));

        // 同时添加到主应用的交易记录
        this.app.addTransaction({
            type: this.currentTransactionType === 'income' ? 'income' : 'expense',
            amount,
            category: `[${this.getTypeText(this.currentTransactionType)}] ${category}`,
            description,
            date
        });

        // 清空表单
        document.getElementById('transaction-amount').value = '';
        document.getElementById('transaction-description').value = '';
        if (projectNameEl) projectNameEl.value = '';

        // 更新显示
        this.updateOverviewStats();
        this.checkCashFlowAlert();
        this.app.showToast('记录已添加');
    }

    // 更新运营资金阈值
    updateOperatingFunds() {
        const minFunds = parseFloat(document.getElementById('min-operating-funds').value);
        
        if (!minFunds || minFunds <= 0) {
            this.app.showToast('请输入有效金额');
            return;
        }

        this.freelancerSettings.minOperatingFunds = minFunds;
        localStorage.setItem('freelancer_mode_settings', JSON.stringify(this.freelancerSettings));
        
        this.checkCashFlowAlert();
        this.updateOverviewStats();
        this.app.showToast('运营资金阈值已更新');
    }

    // 检查现金流预警
    checkCashFlowAlert() {
        const currentBalance = this.getCurrentBalance();
        const minFunds = this.freelancerSettings.minOperatingFunds;
        
        if (currentBalance < minFunds) {
            const operatingDays = this.calculateOperatingDays();
            const alert = {
                id: Date.now().toString(),
                level: operatingDays < 30 ? 'danger' : 'warning',
                message: `当前可用资金 ¥${currentBalance}，低于安全线 ¥${minFunds}，预计可维持 ${operatingDays} 天运营`,
                createdAt: new Date().toISOString()
            };
            
            // 避免重复添加相同的预警
            const lastAlert = this.cashFlowAlerts[0];
            if (!lastAlert || lastAlert.message !== alert.message) {
                this.cashFlowAlerts.unshift(alert);
                localStorage.setItem('cash_flow_alerts', JSON.stringify(this.cashFlowAlerts));
                
                // 更新预警显示
                const alertsContainer = document.getElementById('recent-alerts');
                if (alertsContainer) {
                    alertsContainer.innerHTML = this.renderRecentAlerts();
                }
            }
        }
    }

    // 显示添加发票对话框
    showAddInvoice() {
        this.showModal('添加发票', `
            <div style="padding: 20px;">
                <div class="input-group">
                    <label>发票标题</label>
                    <input type="text" id="invoice-title" placeholder="请输入发票标题">
                </div>
                <div class="input-group">
                    <label>发票号码</label>
                    <input type="text" id="invoice-number-modal" placeholder="请输入发票号码">
                </div>
                <div class="input-group">
                    <label>金额</label>
                    <input type="number" id="invoice-amount" placeholder="请输入金额">
                </div>
                <div class="input-group">
                    <label>日期</label>
                    <input type="date" id="invoice-date" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="input-group">
                    <label>
                        <input type="checkbox" id="invoice-deductible"> 可抵扣
                    </label>
                </div>
                <div class="input-group">
                    <label>发票照片</label>
                    <input type="file" id="invoice-photo-modal" accept="image/*">
                </div>
                <div class="button-group">
                    <button class="btn btn-primary" onclick="freelancerModePage.saveInvoice()">保存</button>
                    <button class="btn btn-secondary" onclick="freelancerModePage.hideModal()">取消</button>
                </div>
            </div>
        `);
    }

    // 保存发票
    saveInvoice() {
        const title = document.getElementById('invoice-title').value;
        const number = document.getElementById('invoice-number-modal').value;
        const amount = parseFloat(document.getElementById('invoice-amount').value);
        const date = document.getElementById('invoice-date').value;
        const deductible = document.getElementById('invoice-deductible').checked;

        if (!title || !number || !amount) {
            this.app.showToast('请填写完整信息');
            return;
        }

        const invoice = {
            id: Date.now().toString(),
            title,
            number,
            amount,
            date,
            deductible,
            createdAt: new Date().toISOString()
        };

        // 处理照片
        const photoFile = document.getElementById('invoice-photo-modal').files[0];
        if (photoFile) {
            invoice.photo = photoFile.name; // 实际应用中应该上传到服务器
        }

        this.invoices.unshift(invoice);
        localStorage.setItem('freelancer_invoices', JSON.stringify(this.invoices));

        document.getElementById('invoice-list').innerHTML = this.renderInvoiceList();
        this.hideModal();
        this.app.showToast('发票已保存');
    }

    // 生成税务报告
    generateTaxReport() {
        const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
        const currentYear = new Date().getFullYear();
        
        const reportData = this.generateQuarterlyReportData(currentYear, currentQuarter);
        
        this.showModal(`${currentYear}年第${currentQuarter}季度利润表`, `
            <div style="padding: 20px; max-height: 500px; overflow-y: auto;">
                <div class="tax-report">
                    <div class="report-section">
                        <h4>收入明细</h4>
                        ${Object.entries(reportData.incomeByCategory).map(([category, amount]) => `
                            <div class="report-item">
                                <span>${category}</span>
                                <span class="amount positive">¥${amount}</span>
                            </div>
                        `).join('')}
                        <div class="report-total">
                            <span>总收入</span>
                            <span class="amount positive">¥${reportData.totalIncome}</span>
                        </div>
                    </div>
                    
                    <div class="report-section">
                        <h4>成本明细</h4>
                        ${Object.entries(reportData.costByCategory).map(([category, amount]) => `
                            <div class="report-item">
                                <span>${category}</span>
                                <span class="amount negative">¥${amount}</span>
                            </div>
                        `).join('')}
                        <div class="report-total">
                            <span>总成本</span>
                            <span class="amount negative">¥${reportData.totalCost}</span>
                        </div>
                    </div>
                    
                    <div class="report-section">
                        <div class="report-summary">
                            <div class="summary-item">
                                <span>经营利润</span>
                                <span class="amount ${reportData.profit >= 0 ? 'positive' : 'negative'}">¥${reportData.profit}</span>
                            </div>
                            <div class="summary-item">
                                <span>预估税额</span>
                                <span class="amount">¥${reportData.estimatedTax}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="button-group">
                    <button class="btn btn-primary" onclick="freelancerModePage.exportTaxReport('${currentYear}-Q${currentQuarter}')">导出PDF</button>
                    <button class="btn btn-secondary" onclick="freelancerModePage.hideModal()">关闭</button>
                </div>
            </div>
        `);
    }

    // 生成抵扣清单
    generateDeductionList() {
        const deductibleItems = this.getDeductibleItems();
        
        this.showModal('可抵扣成本清单', `
            <div style="padding: 20px; max-height: 500px; overflow-y: auto;">
                <div class="deduction-list">
                    <div class="list-header">
                        <span>项目</span>
                        <span>金额</span>
                        <span>发票号</span>
                        <span>日期</span>
                    </div>
                    ${deductibleItems.map(item => `
                        <div class="list-item">
                            <span>${item.description}</span>
                            <span>¥${item.amount}</span>
                            <span>${item.invoiceNumber || '-'}</span>
                            <span>${new Date(item.date).toLocaleDateString()}</span>
                        </div>
                    `).join('')}
                    <div class="list-total">
                        <span>总计可抵扣</span>
                        <span>¥${deductibleItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="button-group">
                    <button class="btn btn-primary" onclick="freelancerModePage.exportDeductionList()">导出Excel</button>
                    <button class="btn btn-secondary" onclick="freelancerModePage.hideModal()">关闭</button>
                </div>
            </div>
        `);
    }

    // 辅助方法
    getCurrentBalance() {
        const totalIncome = this.businessTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpense = this.businessTransactions
            .filter(t => t.type === 'cost' || t.type === 'personal')
            .reduce((sum, t) => sum + t.amount, 0);
        
        return (totalIncome - totalExpense).toFixed(2);
    }

    getMonthlyBusinessIncome() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return this.businessTransactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.type === 'income' && 
                       tDate.getMonth() === currentMonth && 
                       tDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0)
            .toFixed(2);
    }

    getMonthlyBusinessCost() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return this.businessTransactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.type === 'cost' && 
                       tDate.getMonth() === currentMonth && 
                       tDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0)
            .toFixed(2);
    }

    getMonthlyProfit() {
        const income = parseFloat(this.getMonthlyBusinessIncome());
        const cost = parseFloat(this.getMonthlyBusinessCost());
        return (income - cost).toFixed(2);
    }

    calculateOperatingDays() {
        const currentBalance = parseFloat(this.getCurrentBalance());
        const avgDailyCost = this.getAverageDailyCost();
        
        return avgDailyCost > 0 ? Math.floor(currentBalance / avgDailyCost) : 999;
    }

    getAverageDailyCost() {
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        
        const recentCosts = this.businessTransactions
            .filter(t => {
                const tDate = new Date(t.date);
                return (t.type === 'cost' || t.type === 'personal') && tDate >= last30Days;
            })
            .reduce((sum, t) => sum + t.amount, 0);
        
        return recentCosts / 30;
    }

    getQuarterlyProfit() {
        const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
        const currentYear = new Date().getFullYear();
        
        const quarterStart = new Date(currentYear, (currentQuarter - 1) * 3, 1);
        const quarterEnd = new Date(currentYear, currentQuarter * 3, 0);
        
        const quarterlyTransactions = this.businessTransactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= quarterStart && tDate <= quarterEnd;
        });
        
        const income = quarterlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const cost = quarterlyTransactions
            .filter(t => t.type === 'cost')
            .reduce((sum, t) => sum + t.amount, 0);
        
        return (income - cost).toFixed(2);
    }

    getDeductibleCosts() {
        const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
        const currentYear = new Date().getFullYear();
        
        const quarterStart = new Date(currentYear, (currentQuarter - 1) * 3, 1);
        const quarterEnd = new Date(currentYear, currentQuarter * 3, 0);
        
        return this.businessTransactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.type === 'cost' && 
                       t.taxDeductible && 
                       tDate >= quarterStart && 
                       tDate <= quarterEnd;
            })
            .reduce((sum, t) => sum + t.amount, 0)
            .toFixed(2);
    }

    getEstimatedTax() {
        const profit = parseFloat(this.getQuarterlyProfit());
        // 简化的税率计算，实际应根据具体税法
        const taxRate = profit > 0 ? 0.2 : 0; // 假设20%税率
        return (profit * taxRate).toFixed(2);
    }

    getLast6MonthsCashFlow() {
        const months = [];
        const currentDate = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthTransactions = this.businessTransactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate.getMonth() === date.getMonth() && 
                       tDate.getFullYear() === date.getFullYear();
            });
            
            const income = monthTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            
            const cost = monthTransactions
                .filter(t => t.type === 'cost')
                .reduce((sum, t) => sum + t.amount, 0);
            
            months.push({
                month: `${date.getMonth() + 1}月`,
                profit: (income - cost).toFixed(0)
            });
        }
        
        return months;
    }

    getProjectSummary() {
        const projects = {};
        
        this.businessTransactions.forEach(t => {
            const projectName = t.projectName || '未分类项目';
            if (!projects[projectName]) {
                projects[projectName] = {
                    name: projectName,
                    income: 0,
                    cost: 0,
                    transactionCount: 0
                };
            }
            
            if (t.type === 'income') {
                projects[projectName].income += t.amount;
            } else if (t.type === 'cost') {
                projects[projectName].cost += t.amount;
            }
            
            projects[projectName].transactionCount++;
        });
        
        return Object.values(projects).map(project => ({
            ...project,
            profit: (project.income - project.cost).toFixed(2),
            profitRate: project.income > 0 ? ((project.income - project.cost) / project.income * 100).toFixed(1) : 0
        }));
    }

    getMonthlyProfitData(year, month) {
        const monthlyTransactions = this.businessTransactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getFullYear() === year && tDate.getMonth() === month;
        });

        const income = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const cost = monthlyTransactions
            .filter(t => t.type === 'cost')
            .reduce((sum, t) => sum + t.amount, 0);

        const profit = income - cost;
        const profitRate = income > 0 ? (profit / income * 100).toFixed(1) : 0;

        // 成本构成
        const costBreakdown = {};
        monthlyTransactions
            .filter(t => t.type === 'cost')
            .forEach(t => {
                costBreakdown[t.category] = (costBreakdown[t.category] || 0) + t.amount;
            });

        return {
            income: income.toFixed(2),
            cost: cost.toFixed(2),
            profit: profit.toFixed(2),
            profitRate,
            costBreakdown
        };
    }

    generateQuarterlyReportData(year, quarter) {
        const quarterStart = new Date(year, (quarter - 1) * 3, 1);
        const quarterEnd = new Date(year, quarter * 3, 0);
        
        const quarterlyTransactions = this.businessTransactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= quarterStart && tDate <= quarterEnd;
        });

        const incomeByCategory = {};
        const costByCategory = {};

        quarterlyTransactions.forEach(t => {
            if (t.type === 'income') {
                incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
            } else if (t.type === 'cost') {
                costByCategory[t.category] = (costByCategory[t.category] || 0) + t.amount;
            }
        });

        const totalIncome = Object.values(incomeByCategory).reduce((sum, amount) => sum + amount, 0);
        const totalCost = Object.values(costByCategory).reduce((sum, amount) => sum + amount, 0);
        const profit = totalIncome - totalCost;
        const estimatedTax = profit > 0 ? profit * 0.2 : 0; // 简化税率计算

        return {
            incomeByCategory,
            costByCategory,
            totalIncome: totalIncome.toFixed(2),
            totalCost: totalCost.toFixed(2),
            profit: profit.toFixed(2),
            estimatedTax: estimatedTax.toFixed(2)
        };
    }

    getDeductibleItems() {
        return this.businessTransactions
            .filter(t => t.type === 'cost' && t.taxDeductible)
            .map(t => ({
                description: t.description,
                amount: t.amount,
                invoiceNumber: t.invoiceNumber,
                date: t.date
            }));
    }

    getTypeText(type) {
        const types = {
            income: '经营收入',
            cost: '经营成本',
            personal: '个人消费'
        };
        return types[type] || type;
    }

    updateOverviewStats() {
        // 更新页面中的概览统计
        const overviewStats = document.querySelector('.overview-stats');
        if (overviewStats) {
            overviewStats.innerHTML = `
                <div class="stat-card ${this.getCurrentBalance() < this.freelancerSettings.minOperatingFunds ? 'warning' : ''}">
                    <div class="stat-value">¥${this.getCurrentBalance()}</div>
                    <div class="stat-label">当前可用资金</div>
                    ${this.getCurrentBalance() < this.freelancerSettings.minOperatingFunds ? 
                        '<div class="stat-warning"><i class="fas fa-exclamation-triangle"></i> 低于安全线</div>' : ''}
                </div>
                <div class="stat-card">
                    <div class="stat-value">¥${this.getMonthlyBusinessIncome()}</div>
                    <div class="stat-label">本月经营收入</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">¥${this.getMonthlyBusinessCost()}</div>
                    <div class="stat-label">本月经营成本</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">¥${this.getMonthlyProfit()}</div>
                    <div class="stat-label">本月经营利润</div>
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
                    <button class="modal-close" onclick="freelancerModePage.hideModal()">×</button>
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

    // ==================== 新增的辅助方法 ====================

    // 获取余额趋势
    getBalanceTrend() {
        const currentBalance = this.getCurrentBalance();
        const lastMonthBalance = this.getLastMonthBalance();
        if (lastMonthBalance === 0) return 0;
        return ((currentBalance - lastMonthBalance) / lastMonthBalance) * 100;
    }

    // 获取上月余额
    getLastMonthBalance() {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        const lastMonthTransactions = this.businessTransactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === lastMonth.getMonth() && 
                   tDate.getFullYear() === lastMonth.getFullYear();
        });
        
        const income = lastMonthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const cost = lastMonthTransactions
            .filter(t => t.type === 'cost' || t.type === 'personal')
            .reduce((sum, t) => sum + t.amount, 0);
        
        return income - cost;
    }

    // 获取收入对比
    getIncomeComparison() {
        const currentIncome = this.getMonthlyBusinessIncome();
        const lastMonthIncome = this.getLastMonthIncome();
        if (lastMonthIncome === 0) return 0;
        return ((currentIncome - lastMonthIncome) / lastMonthIncome) * 100;
    }

    // 获取上月收入
    getLastMonthIncome() {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        return this.businessTransactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.type === 'income' && 
                       tDate.getMonth() === lastMonth.getMonth() && 
                       tDate.getFullYear() === lastMonth.getFullYear();
            })
            .reduce((sum, t) => sum + t.amount, 0);
    }

    // 获取成本对比
    getCostComparison() {
        const currentCost = this.getMonthlyBusinessCost();
        const lastMonthCost = this.getLastMonthCost();
        if (lastMonthCost === 0) return 0;
        return ((currentCost - lastMonthCost) / lastMonthCost) * 100;
    }

    // 获取上月成本
    getLastMonthCost() {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        return this.businessTransactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.type === 'cost' && 
                       tDate.getMonth() === lastMonth.getMonth() && 
                       tDate.getFullYear() === lastMonth.getFullYear();
            })
            .reduce((sum, t) => sum + t.amount, 0);
    }

    // 获取利润率
    getProfitMargin() {
        const income = this.getMonthlyBusinessIncome();
        if (income === 0) return 0;
        return (this.getMonthlyProfit() / income) * 100;
    }

    // 获取现金流稳定性评分
    getCashFlowStability() {
        const months = this.getLast6MonthsCashFlow();
        if (months.length < 3) return 50;
        
        const profits = months.map(m => parseFloat(m.profit));
        const avgProfit = profits.reduce((sum, p) => sum + p, 0) / profits.length;
        const variance = profits.reduce((sum, p) => sum + Math.pow(p - avgProfit, 2), 0) / profits.length;
        const stability = Math.max(0, 100 - (Math.sqrt(variance) / Math.abs(avgProfit)) * 100);
        
        return Math.min(100, Math.max(0, stability)).toFixed(0);
    }

    // 获取收入多样性评分
    getIncomeDiversity() {
        const categories = {};
        this.businessTransactions
            .filter(t => t.type === 'income')
            .forEach(t => {
                categories[t.category] = (categories[t.category] || 0) + t.amount;
            });
        
        const categoryCount = Object.keys(categories).length;
        const totalIncome = Object.values(categories).reduce((sum, amount) => sum + amount, 0);
        
        if (categoryCount <= 1) return 20;
        if (categoryCount === 2) return 50;
        if (categoryCount === 3) return 70;
        return Math.min(100, 70 + (categoryCount - 3) * 10);
    }

    // 获取成本控制评分
    getCostControl() {
        const profitMargin = this.getProfitMargin();
        if (profitMargin >= 30) return 100;
        if (profitMargin >= 20) return 80;
        if (profitMargin >= 10) return 60;
        if (profitMargin >= 0) return 40;
        return 20;
    }

    // 获取财务建议
    getFinancialSuggestions() {
        const suggestions = [];
        const balance = this.getCurrentBalance();
        const minFunds = this.freelancerSettings.minOperatingFunds;
        const profitMargin = this.getProfitMargin();
        const stability = this.getCashFlowStability();

        if (balance < minFunds) {
            suggestions.push({
                type: 'warning',
                icon: 'exclamation-triangle',
                text: '现金流低于安全线，建议优先收回应收账款或寻找新项目'
            });
        }

        if (profitMargin < 10) {
            suggestions.push({
                type: 'info',
                icon: 'chart-line',
                text: '利润率偏低，建议优化成本结构或提高服务价格'
            });
        }

        if (stability < 60) {
            suggestions.push({
                type: 'info',
                icon: 'balance-scale',
                text: '收入波动较大，建议寻找更稳定的长期合作项目'
            });
        }

        if (suggestions.length === 0) {
            suggestions.push({
                type: 'success',
                icon: 'check-circle',
                text: '财务状况良好，建议继续保持并考虑扩大业务规模'
            });
        }

        return suggestions;
    }

    // 获取快速金额选项
    getQuickAmounts() {
        const recentAmounts = this.businessTransactions
            .slice(-20)
            .map(t => t.amount)
            .filter((amount, index, arr) => arr.indexOf(amount) === index)
            .sort((a, b) => b - a)
            .slice(0, 4);
        
        const defaultAmounts = [100, 500, 1000, 5000];
        return [...new Set([...recentAmounts, ...defaultAmounts])].slice(0, 6);
    }

    // 获取常用分类
    getFrequentCategories(type) {
        const categories = {};
        this.businessTransactions
            .filter(t => t.type === type)
            .forEach(t => {
                categories[t.category] = (categories[t.category] || 0) + 1;
            });
        
        return Object.entries(categories)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([category]) => category);
    }

    // 设置快速金额
    setQuickAmount(amount) {
        const amountInput = document.getElementById('transaction-amount');
        if (amountInput) {
            amountInput.value = amount;
            this.onAmountChange();
        }
    }

    // 快速记录
    quickRecord(type, category) {
        this.switchTransactionType(type);
        setTimeout(() => {
            const categorySelect = document.getElementById('transaction-category');
            if (categorySelect) {
                categorySelect.value = category;
                this.onCategoryChange();
            }
        }, 100);
    }

    // 金额变化处理
    onAmountChange() {
        const amount = parseFloat(document.getElementById('transaction-amount')?.value || 0);
        const description = document.getElementById('transaction-description')?.value || '';
        
        if (amount > 0 && description) {
            this.showSmartClassification(description, amount);
        }
        
        this.showTaxReminder(amount);
    }

    // 分类变化处理
    onCategoryChange() {
        const category = document.getElementById('transaction-category')?.value;
        const amount = parseFloat(document.getElementById('transaction-amount')?.value || 0);
        
        if (category && amount > 0) {
            this.showTaxReminder(amount, category);
        }
    }

    // 显示智能分类建议
    showSmartClassification(description, amount) {
        const suggestions = this.getClassificationSuggestions(description, amount);
        const container = document.getElementById('smart-classification');
        const suggestionsDiv = document.getElementById('classification-suggestions');
        
        if (suggestions.length > 0) {
            suggestionsDiv.innerHTML = suggestions.map(s => `
                <div class="suggestion-item" onclick="freelancerModePage.applySuggestion('${s.category}', '${s.type}')">
                    <div class="suggestion-text">${s.text}</div>
                    <div class="suggestion-confidence">置信度: ${s.confidence}%</div>
                </div>
            `).join('');
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }

    // 获取分类建议
    getClassificationSuggestions(description, amount) {
        const suggestions = [];
        const desc = description.toLowerCase();
        
        // 基于关键词的智能分类
        const keywords = {
            income: {
                '项目': ['项目尾款', '项目收入'],
                '设计': ['设计费用'],
                '开发': ['开发费用'],
                '咨询': ['咨询费用'],
                '培训': ['培训收入']
            },
            cost: {
                '设备': ['设备采购'],
                '软件': ['软件订阅'],
                '交通': ['交通差旅'],
                '办公': ['办公用品'],
                '网络': ['网络通讯'],
                '学习': ['培训学习'],
                '推广': ['营销推广']
            }
        };
        
        for (const [type, typeKeywords] of Object.entries(keywords)) {
            for (const [keyword, categories] of Object.entries(typeKeywords)) {
                if (desc.includes(keyword)) {
                    categories.forEach(category => {
                        suggestions.push({
                            type,
                            category,
                            text: `建议分类为: ${category}`,
                            confidence: 85
                        });
                    });
                }
            }
        }
        
        return suggestions.slice(0, 3);
    }

    // 应用建议
    applySuggestion(category, type) {
        this.switchTransactionType(type);
        setTimeout(() => {
            const categorySelect = document.getElementById('transaction-category');
            if (categorySelect) {
                categorySelect.value = category;
            }
        }, 100);
        
        document.getElementById('smart-classification').style.display = 'none';
    }

    // 显示税务提醒
    showTaxReminder(amount, category = '') {
        const reminderDiv = document.getElementById('tax-reminder');
        const reminderText = document.getElementById('tax-reminder-text');
        
        let reminder = '';
        
        if (amount > 10000) {
            reminder = '大额交易提醒：请确保保留相关发票和凭证';
        } else if (category && category.includes('设备')) {
            reminder = '设备采购提醒：可作为固定资产折旧抵扣';
        } else if (category && category.includes('培训')) {
            reminder = '培训费用提醒：可作为职业发展成本抵扣';
        }
        
        if (reminder) {
            reminderText.textContent = reminder;
            reminderDiv.style.display = 'block';
        } else {
            reminderDiv.style.display = 'none';
        }
    }

    // 获取利润趋势
    getProfitTrend() {
        const currentProfit = parseFloat(this.getQuarterlyProfit());
        const lastQuarterProfit = this.getLastQuarterProfit();
        if (lastQuarterProfit === 0) return 0;
        return ((currentProfit - lastQuarterProfit) / lastQuarterProfit) * 100;
    }

    // 获取上季度利润
    getLastQuarterProfit() {
        const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
        const currentYear = new Date().getFullYear();
        
        let lastQuarter = currentQuarter - 1;
        let year = currentYear;
        if (lastQuarter === 0) {
            lastQuarter = 4;
            year = currentYear - 1;
        }
        
        const quarterStart = new Date(year, (lastQuarter - 1) * 3, 1);
        const quarterEnd = new Date(year, lastQuarter * 3, 0);
        
        const quarterlyTransactions = this.businessTransactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= quarterStart && tDate <= quarterEnd;
        });
        
        const income = quarterlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const cost = quarterlyTransactions
            .filter(t => t.type === 'cost')
            .reduce((sum, t) => sum + t.amount, 0);
        
        return income - cost;
    }

    // 获取抵扣率
    getDeductionRate() {
        const totalCost = this.businessTransactions
            .filter(t => t.type === 'cost')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const deductibleCost = parseFloat(this.getDeductibleCosts());
        
        if (totalCost === 0) return 0;
        return (deductibleCost / totalCost) * 100;
    }

    // 获取有效税率
    getEffectiveTaxRate() {
        const profit = parseFloat(this.getQuarterlyProfit());
        const tax = parseFloat(this.getEstimatedTax());
        
        if (profit === 0) return 0;
        return (tax / profit) * 100;
    }

    // 获取税务优化潜力
    getTaxOptimizationPotential() {
        const totalCost = this.businessTransactions
            .filter(t => t.type === 'cost')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const deductibleCost = parseFloat(this.getDeductibleCosts());
        const potentialDeduction = totalCost - deductibleCost;
        
        return (potentialDeduction * 0.2).toFixed(2); // 假设20%税率
    }

    // 获取税务节省潜力
    getTaxSavingsPotential() {
        const currentTax = parseFloat(this.getEstimatedTax());
        const potential = parseFloat(this.getTaxOptimizationPotential());
        
        if (currentTax === 0) return 0;
        return (potential / currentTax) * 100;
    }

    // 获取发票完整性
    getInvoiceCompleteness() {
        const costTransactions = this.businessTransactions.filter(t => t.type === 'cost');
        const invoicedTransactions = costTransactions.filter(t => t.invoiceNumber);
        
        if (costTransactions.length === 0) return 100;
        return Math.round((invoicedTransactions.length / costTransactions.length) * 100);
    }

    // 获取抵扣凭证完整性
    getDeductionDocuments() {
        const deductibleTransactions = this.businessTransactions.filter(t => t.type === 'cost' && t.taxDeductible);
        const documentedTransactions = deductibleTransactions.filter(t => t.invoiceNumber && t.invoicePhoto);
        
        if (deductibleTransactions.length === 0) return 100;
        return Math.round((documentedTransactions.length / deductibleTransactions.length) * 100);
    }

    // 获取合规风险
    getComplianceRisk() {
        let risk = 0;
        
        // 发票完整性风险
        const invoiceCompleteness = this.getInvoiceCompleteness();
        if (invoiceCompleteness < 80) risk += 30;
        else if (invoiceCompleteness < 90) risk += 15;
        
        // 大额交易风险
        const largeTransactions = this.businessTransactions.filter(t => t.amount > 10000 && !t.invoiceNumber);
        if (largeTransactions.length > 0) risk += 25;
        
        // 抵扣凭证风险
        const deductionDocs = this.getDeductionDocuments();
        if (deductionDocs < 70) risk += 20;
        else if (deductionDocs < 85) risk += 10;
        
        return Math.min(100, risk);
    }

    // 获取税务建议
    getTaxSuggestions() {
        const suggestions = [];
        
        const invoiceCompleteness = this.getInvoiceCompleteness();
        if (invoiceCompleteness < 90) {
            suggestions.push({
                priority: 'high',
                icon: 'file-invoice',
                title: '完善发票管理',
                content: '建议为所有成本支出获取正规发票，提高抵扣完整性',
                savings: (this.getMonthlyBusinessCost() * 0.2 * (100 - invoiceCompleteness) / 100).toFixed(0)
            });
        }
        
        const deductionRate = this.getDeductionRate();
        if (deductionRate < 60) {
            suggestions.push({
                priority: 'medium',
                icon: 'percentage',
                title: '增加可抵扣项目',
                content: '考虑将更多业务相关支出标记为可抵扣，如培训、设备等',
                savings: (this.getMonthlyBusinessCost() * 0.2 * 0.3).toFixed(0)
            });
        }
        
        const profitMargin = this.getProfitMargin();
        if (profitMargin > 50) {
            suggestions.push({
                priority: 'low',
                icon: 'chart-pie',
                title: '考虑税务筹划',
                content: '利润率较高，建议咨询税务专家进行合理的税务筹划',
                savings: (parseFloat(this.getEstimatedTax()) * 0.15).toFixed(0)
            });
        }
        
        return suggestions;
    }

    // 获取税务提醒
    getTaxReminders() {
        const reminders = [];
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        
        // 季度申报提醒
        if ([1, 4, 7, 10].includes(currentMonth)) {
            reminders.push({
                id: 'quarterly_tax',
                date: `${currentMonth + 1}月15日`,
                title: '季度税务申报',
                description: '请准备上季度的利润表和税务申报材料',
                urgency: 'high'
            });
        }
        
        // 月度发票整理提醒
        if (currentDate.getDate() <= 5) {
            reminders.push({
                id: 'monthly_invoice',
                date: `${currentMonth}月5日`,
                title: '月度发票整理',
                description: '整理上月的所有发票和收据，确保记录完整',
                urgency: 'medium'
            });
        }
        
        // 年度汇算清缴提醒
        if (currentMonth >= 3 && currentMonth <= 6) {
            reminders.push({
                id: 'annual_settlement',
                date: '6月30日',
                title: '年度汇算清缴',
                description: '准备上年度的年度汇算清缴申报',
                urgency: 'high'
            });
        }
        
        return reminders;
    }

    // 处理税务提醒
    handleTaxReminder(reminderId) {
        switch (reminderId) {
            case 'quarterly_tax':
                this.generateTaxReport();
                break;
            case 'monthly_invoice':
                this.showInvoiceManagement();
                break;
            case 'annual_settlement':
                this.showAnnualReport();
                break;
        }
    }

    // 显示税务优化分析
    showTaxOptimization() {
        const modal = this.showModal('税务优化分析', `
            <div class="tax-optimization-analysis">
                <div class="optimization-summary">
                    <h4>优化概览</h4>
                    <div class="summary-stats">
                        <div class="stat-item">
                            <span class="stat-label">当前税负</span>
                            <span class="stat-value">¥${this.getEstimatedTax()}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">优化潜力</span>
                            <span class="stat-value">¥${this.getTaxOptimizationPotential()}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">节省比例</span>
                            <span class="stat-value">${this.getTaxSavingsPotential().toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="optimization-details">
                    <h4>详细分析</h4>
                    <div class="detail-items">
                        <div class="detail-item">
                            <div class="item-title">发票管理优化</div>
                            <div class="item-desc">完善发票收集，提高抵扣比例</div>
                            <div class="item-impact">预计节省: ¥${(this.getMonthlyBusinessCost() * 0.05).toFixed(0)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="item-title">成本分类优化</div>
                            <div class="item-desc">合理分类业务成本，最大化抵扣</div>
                            <div class="item-impact">预计节省: ¥${(this.getMonthlyBusinessCost() * 0.03).toFixed(0)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="item-title">时间规划优化</div>
                            <div class="item-desc">合理安排收入确认时间</div>
                            <div class="item-impact">预计节省: ¥${(parseFloat(this.getEstimatedTax()) * 0.1).toFixed(0)}</div>
                        </div>
                    </div>
                </div>
                
                <div class="optimization-actions">
                    <button class="btn btn-primary" onclick="freelancerModePage.applyOptimization()">
                        应用优化建议
                    </button>
                    <button class="btn btn-secondary" onclick="freelancerModePage.exportOptimizationReport()">
                        导出优化报告
                    </button>
                </div>
            </div>
        `);
    }

    // 应用优化建议
    applyOptimization() {
        // 更新设置以应用优化建议
        this.freelancerSettings.autoTaxOptimization = true;
        this.freelancerSettings.invoiceReminder = true;
        this.freelancerSettings.deductionSuggestion = true;
        
        localStorage.setItem('freelancer_mode_settings', JSON.stringify(this.freelancerSettings));
        
        this.hideModal();
        this.showSuccessMessage('优化设置已应用，系统将自动提供税务优化建议');
    }

    // 导出优化报告
    exportOptimizationReport() {
        const report = {
            date: new Date().toISOString(),
            currentTax: this.getEstimatedTax(),
            optimizationPotential: this.getTaxOptimizationPotential(),
            savingsPotential: this.getTaxSavingsPotential(),
            suggestions: this.getTaxSuggestions(),
            invoiceCompleteness: this.getInvoiceCompleteness(),
            deductionRate: this.getDeductionRate(),
            complianceRisk: this.getComplianceRisk()
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `税务优化报告_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
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
}

// 全局变量
let freelancerModePage;