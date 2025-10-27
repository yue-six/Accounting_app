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
            
            // 设置默认的智能分类预设
            if (!this.freelancerSettings.categories) {
                this.freelancerSettings.categories = {
                    income: ['项目尾款', '客户定金', '咨询服务费', '设计服务费', '技术开发费'],
                    cost: ['设备采购', '平台手续费', '交通差旅', '软件订阅', '办公用品', '广告推广'],
                    personal: ['房租', '日常餐饮', '个人购物', '娱乐消费', '医疗费用']
                };
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
                                <div class="stat-value">¥${this.getCurrentBalance().toFixed(2)}</div>
                                <div class="stat-label">当前可用资金</div>
                                <div class="stat-trend ${this.getBalanceTrend() > 0 ? 'positive' : 'negative'}">
                                    <i class="fas fa-arrow-${this.getBalanceTrend() > 0 ? 'up' : 'down'}"></i>
                                    ${Math.abs(this.getBalanceTrend()).toFixed(1)}%
                                </div>
                                ${this.getCurrentBalance() < this.freelancerSettings.minOperatingFunds ? 
                                    '<div class="stat-warning"><i class="fas fa-exclamation-triangle"></i> 低于安全线</div>' : ''}
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">¥${this.getMonthlyBusinessIncome().toFixed(2)}</div>
                                <div class="stat-label">本月经营收入</div>
                                <div class="stat-comparison">
                                    vs 上月: ${this.getIncomeComparison() > 0 ? '+' : ''}${this.getIncomeComparison().toFixed(1)}%
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">¥${this.getMonthlyBusinessCost().toFixed(2)}</div>
                                <div class="stat-label">本月经营成本</div>
                                <div class="stat-comparison">
                                    vs 上月: ${this.getCostComparison() > 0 ? '+' : ''}${this.getCostComparison().toFixed(1)}%
                                </div>
                            </div>
                            <div class="stat-card ${this.getMonthlyProfit() < 0 ? 'negative' : 'positive'}">
                                <div class="stat-value">¥${this.getMonthlyProfit().toFixed(2)}</div>
                                <div class="stat-label">本月经营利润</div>
                                <div class="stat-comparison">
                                    利润率: ${this.getProfitMargin().toFixed(1)}%
                                </div>
                            </div>
                        </div>
                        
                        <!-- 现金流预警 -->
                        <div class="cash-flow-alert">
                            <h4><i class="fas fa-bell"></i> 现金流预警</h4>
                            <div class="alert-content">
                                <p>当前可维持运营天数: <strong>${this.calculateOperatingDays()}</strong> 天</p>
                                ${this.getCurrentBalance() < this.freelancerSettings.minOperatingFunds ? 
                                    `<p class="warning-text"><i class="fas fa-exclamation-triangle"></i> ${this.getCashFlowWarning()}</p>` : 
                                    '<p class="safe-text"><i class="fas fa-check-circle"></i> 现金流状况良好</p>'
                                }
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 智能记账 -->
                <div class="card">
                    <h3><i class="fas fa-plus-circle"></i> 智能记账</h3>
                    
                    <!-- 收支智能分类 -->
                    <div class="smart-classification">
                        <h4><i class="fas fa-tags"></i> 收支智能分类</h4>
                        <div class="category-tabs">
                            <button class="tab-btn active" onclick="freelancerModePage.switchCategoryType('income')">经营收入</button>
                            <button class="tab-btn" onclick="freelancerModePage.switchCategoryType('cost')">经营成本</button>
                            <button class="tab-btn" onclick="freelancerModePage.switchCategoryType('personal')">个人消费</button>
                        </div>
                        
                        <div class="category-grid" id="category-grid">
                            ${this.renderCategoryGrid('income')}
                        </div>
                    </div>
                    
                    <!-- 快速记账表单 -->
                    <div class="quick-transaction-form">
                        <div class="input-group">
                            <label>金额</label>
                            <input type="number" id="transaction-amount" placeholder="请输入金额">
                        </div>
                        
                        <div class="input-group">
                            <label>分类</label>
                            <select id="transaction-category">
                                <option value="">请选择分类</option>
                                ${this.renderCategoryOptions()}
                            </select>
                        </div>
                        
                        <div class="input-group">
                            <label>备注</label>
                            <input type="text" id="transaction-note" placeholder="添加备注（可选）">
                        </div>
                        
                        <div class="input-group">
                            <label>发票照片</label>
                            <input type="file" id="invoice-photo" accept="image/*" onchange="freelancerModePage.handleInvoiceUpload()">
                        </div>
                        
                        <div class="transaction-actions">
                            <button class="btn btn-primary" onclick="freelancerModePage.submitTransaction()">确认记账</button>
                            <button class="btn btn-secondary" onclick="freelancerModePage.clearTransaction()">清空</button>
                        </div>
                    </div>
                </div>

                <!-- 税务申报辅助 -->
                <div class="card">
                    <h3><i class="fas fa-calculator"></i> 税务申报辅助</h3>
                    
                    <!-- 季度利润表 -->
                    <div class="tax-section">
                        <h4><i class="fas fa-file-alt"></i> 季度利润表</h4>
                        <div class="profit-statement">
                            <div class="statement-item">
                                <span>季度总收入</span>
                                <span>¥${this.getQuarterlyIncome().toFixed(2)}</span>
                            </div>
                            <div class="statement-item">
                                <span>季度总成本</span>
                                <span>¥${this.getQuarterlyCost().toFixed(2)}</span>
                            </div>
                            <div class="statement-item total">
                                <span>季度经营利润</span>
                                <span>¥${this.getQuarterlyProfit().toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 可抵扣成本清单 -->
                    <div class="tax-section">
                        <h4><i class="fas fa-list"></i> 可抵扣成本清单</h4>
                        <div class="deduction-list">
                            ${this.renderDeductionList()}
                        </div>
                    </div>
                    
                    <!-- 导出功能 -->
                    <div class="tax-actions">
                        <button class="btn btn-primary" onclick="freelancerModePage.generateProfitStatement()">
                            <i class="fas fa-file-pdf"></i> 生成利润表(PDF)
                        </button>
                        <button class="btn btn-secondary" onclick="freelancerModePage.generateDeductionList()">
                            <i class="fas fa-file-csv"></i> 生成抵扣清单(CSV)
                        </button>
                        <button class="btn btn-secondary" onclick="freelancerModePage.exportTaxData()">
                            <i class="fas fa-download"></i> 导出报税数据
                        </button>
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
            </div>
        `;
    }

    // 获取当前余额
    getCurrentBalance() {
        const totalIncome = this.businessTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpense = this.businessTransactions
            .filter(t => t.type === 'cost' || t.type === 'personal')
            .reduce((sum, t) => sum + t.amount, 0);
        
        return totalIncome - totalExpense;
    }

    // 获取月度经营收入
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
            .reduce((sum, t) => sum + t.amount, 0);
    }

    // 获取月度经营成本
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
            .reduce((sum, t) => sum + t.amount, 0);
    }

    // 获取月度经营利润
    getMonthlyProfit() {
        return this.getMonthlyBusinessIncome() - this.getMonthlyBusinessCost();
    }

    // 获取利润率
    getProfitMargin() {
        const income = this.getMonthlyBusinessIncome();
        return income > 0 ? (this.getMonthlyProfit() / income) * 100 : 0;
    }

    // 获取余额趋势
    getBalanceTrend() {
        // 简化实现，实际应该基于历史数据计算
        return 5.2; // 示例数据
    }

    // 获取收入比较
    getIncomeComparison() {
        // 简化实现
        return 12.5; // 示例数据
    }

    // 获取成本比较
    getCostComparison() {
        // 简化实现
        return -3.2; // 示例数据
    }

    // 计算可维持运营天数
    calculateOperatingDays() {
        const dailyCost = this.getAverageDailyCost();
        const currentBalance = this.getCurrentBalance();
        return dailyCost > 0 ? Math.floor(currentBalance / dailyCost) : 0;
    }

    // 获取平均日成本
    getAverageDailyCost() {
        const monthlyCost = this.getMonthlyBusinessCost();
        return monthlyCost / 30; // 简化计算
    }

    // 获取现金流预警信息
    getCashFlowWarning() {
        const days = this.calculateOperatingDays();
        if (days < 30) {
            return `当前可用资金仅够维持 ${days} 天运营，建议优先收回应收账款`;
        } else if (days < 60) {
            return `当前可用资金可维持 ${days} 天运营，建议关注现金流状况`;
        }
        return '';
    }

    // 渲染分类网格
    renderCategoryGrid(type) {
        const categories = this.freelancerSettings.categories[type] || [];
        return categories.map(category => `
            <div class="category-item" onclick="freelancerModePage.selectCategory('${category}')">
                <i class="fas fa-tag"></i>
                <span>${category}</span>
            </div>
        `).join('');
    }

    // 渲染分类选项
    renderCategoryOptions() {
        let options = '';
        
        // 经营收入分类
        options += '<optgroup label="经营收入">';
        this.freelancerSettings.categories.income.forEach(cat => {
            options += `<option value="income-${cat}">${cat}</option>`;
        });
        options += '</optgroup>';
        
        // 经营成本分类
        options += '<optgroup label="经营成本">';
        this.freelancerSettings.categories.cost.forEach(cat => {
            options += `<option value="cost-${cat}">${cat}</option>`;
        });
        options += '</optgroup>';
        
        // 个人消费分类
        options += '<optgroup label="个人消费">';
        this.freelancerSettings.categories.personal.forEach(cat => {
            options += `<option value="personal-${cat}">${cat}</option>`;
        });
        options += '</optgroup>';
        
        return options;
    }

    // 获取季度收入
    getQuarterlyIncome() {
        const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
        const currentYear = new Date().getFullYear();
        
        return this.businessTransactions
            .filter(t => {
                const tDate = new Date(t.date);
                const quarter = Math.floor(tDate.getMonth() / 3) + 1;
                return t.type === 'income' && 
                       tDate.getFullYear() === currentYear && 
                       quarter === currentQuarter;
            })
            .reduce((sum, t) => sum + t.amount, 0);
    }

    // 获取季度成本
    getQuarterlyCost() {
        const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
        const currentYear = new Date().getFullYear();
        
        return this.businessTransactions
            .filter(t => {
                const tDate = new Date(t.date);
                const quarter = Math.floor(tDate.getMonth() / 3) + 1;
                return (t.type === 'cost' || t.type === 'personal') && 
                       tDate.getFullYear() === currentYear && 
                       quarter === currentQuarter;
            })
            .reduce((sum, t) => sum + t.amount, 0);
    }

    // 获取季度利润
    getQuarterlyProfit() {
        return this.getQuarterlyIncome() - this.getQuarterlyCost();
    }

    // 渲染可抵扣成本清单
    renderDeductionList() {
        const deductibleCosts = this.businessTransactions
            .filter(t => t.type === 'cost' && t.deductible !== false);
        
        if (deductibleCosts.length === 0) {
            return '<div class="empty-state">暂无可抵扣成本记录</div>';
        }
        
        return deductibleCosts.map(cost => `
            <div class="deduction-item">
                <div class="deduction-info">
                    <span class="deduction-category">${cost.category || '经营成本'}</span>
                    <span class="deduction-amount">¥${cost.amount.toFixed(2)}</span>
                </div>
                <div class="deduction-date">${cost.date}</div>
                ${cost.invoice ? `<div class="deduction-invoice">发票: ${cost.invoice}</div>` : ''}
            </div>
        `).join('');
    }

    // 渲染发票列表
    renderInvoiceList() {
        if (this.invoices.length === 0) {
            return '<div class="empty-state">暂无发票记录</div>';
        }
        
        return this.invoices.map(invoice => `
            <div class="invoice-item">
                <div class="invoice-header">
                    <span class="invoice-title">${invoice.title}</span>
                    <span class="invoice-amount">¥${invoice.amount.toFixed(2)}</span>
                </div>
                <div class="invoice-details">
                    <span>发票号: ${invoice.number}</span>
                    <span>日期: ${invoice.date}</span>
                    ${invoice.deductible ? '<span class="deductible-tag">可抵扣</span>' : ''}
                </div>
                ${invoice.photo ? `<div class="invoice-photo">已上传照片</div>` : ''}
            </div>
        `).join('');
    }

    // 切换分类类型
    switchCategoryType(type) {
        document.querySelectorAll('.category-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        const grid = document.getElementById('category-grid');
        if (grid) {
            grid.innerHTML = this.renderCategoryGrid(type);
        }
    }

    // 选择分类
    selectCategory(category) {
        document.getElementById('transaction-category').value = category;
        this.app.showToast(`已选择分类: ${category}`);
    }

    // 处理发票上传
    handleInvoiceUpload() {
        const fileInput = document.getElementById('invoice-photo');
        if (fileInput.files.length > 0) {
            this.app.showToast('发票照片已上传，开始识别...');
            // 这里可以添加发票识别逻辑
        }
    }

    // 提交交易
    submitTransaction() {
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const category = document.getElementById('transaction-category').value;
        const note = document.getElementById('transaction-note').value;
        
        if (!amount || !category) {
            this.app.showToast('请填写金额和分类');
            return;
        }
        
        const [type, categoryName] = category.split('-');
        
        const transaction = {
            id: Date.now().toString(),
            type: type,
            category: categoryName,
            amount: amount,
            note: note,
            date: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
        };
        
        // 处理发票照片
        const fileInput = document.getElementById('invoice-photo');
        if (fileInput.files.length > 0) {
            transaction.invoice = fileInput.files[0].name;
        }
        
        this.businessTransactions.unshift(transaction);
        this.saveFreelancerData();
        
        this.app.showToast('记账成功！');
        this.clearTransaction();
        
        // 检查现金流预警
        this.checkCashFlowAlert();
    }

    // 清空交易表单
    clearTransaction() {
        document.getElementById('transaction-amount').value = '';
        document.getElementById('transaction-category').value = '';
        document.getElementById('transaction-note').value = '';
        document.getElementById('invoice-photo').value = '';
    }

    // 检查现金流预警
    checkCashFlowAlert() {
        const currentBalance = this.getCurrentBalance();
        const minFunds = this.freelancerSettings.minOperatingFunds;
        
        if (currentBalance < minFunds) {
            const operatingDays = this.calculateOperatingDays();
            const alertMessage = `当前可用资金仅够维持 ${operatingDays} 天运营，建议优先收回应收账款`;
            
            // 避免重复添加相同的预警
            const lastAlert = this.cashFlowAlerts[0];
            if (!lastAlert || lastAlert.message !== alertMessage) {
                const alert = {
                    id: Date.now().toString(),
                    level: operatingDays < 30 ? 'danger' : 'warning',
                    message: alertMessage,
                    createdAt: new Date().toISOString()
                };
                
                this.cashFlowAlerts.unshift(alert);
                this.saveFreelancerData();
                
                this.app.showToast(alertMessage, 'warning');
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
                    <input type="text" id="invoice-number" placeholder="请输入发票号码">
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
                        <input type="checkbox" id="invoice-deductible" checked> 可抵扣
                    </label>
                </div>
                <div class="input-group">
                    <label>发票照片</label>
                    <input type="file" id="invoice-photo" accept="image/*">
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
        const number = document.getElementById('invoice-number').value;
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
        const photoFile = document.getElementById('invoice-photo').files[0];
        if (photoFile) {
            invoice.photo = photoFile.name;
        }

        this.invoices.unshift(invoice);
        this.saveFreelancerData();
        
        this.hideModal();
        this.app.showToast('发票保存成功！');
        
        // 刷新发票列表
        const invoiceList = document.getElementById('invoice-list');
        if (invoiceList) {
            invoiceList.innerHTML = this.renderInvoiceList();
        }
    }

    // 扫描发票
    scanInvoice() {
        this.app.showToast('发票扫描功能开发中');
    }

    // 生成利润表
    generateProfitStatement() {
        const profitData = {
            quarterlyIncome: this.getQuarterlyIncome(),
            quarterlyCost: this.getQuarterlyCost(),
            quarterlyProfit: this.getQuarterlyProfit(),
            date: new Date().toLocaleDateString()
        };
        
        // 模拟生成PDF
        const blob = new Blob([JSON.stringify(profitData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `利润表_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.app.showToast('利润表已生成并下载');
    }

    // 生成抵扣清单
    generateDeductionList() {
        const deductibleCosts = this.businessTransactions
            .filter(t => t.type === 'cost' && t.deductible !== false);
        
        const csvData = deductibleCosts.map(cost => 
            `${cost.date},${cost.category || '经营成本'},${cost.amount},${cost.invoice || '无'}`
        ).join('\n');
        
        const blob = new Blob(['日期,分类,金额,发票\n' + csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `抵扣清单_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.app.showToast('抵扣清单已生成并下载');
    }

    // 导出报税数据
    exportTaxData() {
        const taxData = {
            businessTransactions: this.businessTransactions,
            invoices: this.invoices,
            taxReports: this.taxReports,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(taxData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `报税数据_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.app.showToast('报税数据已导出');
    }

    // 保存自由职业者数据
    saveFreelancerData() {
        try {
            localStorage.setItem('business_transactions', JSON.stringify(this.businessTransactions));
            localStorage.setItem('freelancer_invoices', JSON.stringify(this.invoices));
            localStorage.setItem('tax_reports', JSON.stringify(this.taxReports));
            localStorage.setItem('cash_flow_alerts', JSON.stringify(this.cashFlowAlerts));
            localStorage.setItem('freelancer_mode_settings', JSON.stringify(this.freelancerSettings));
        } catch (e) {
            console.error('保存自由职业者数据失败:', e);
        }
    }

    // 显示模态框
    showModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="freelancerModePage.hideModal()">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
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

    // 初始化事件
    initEvents() {
        freelancerModePage = this;
    }
}

// 全局变量
let freelancerModePage;