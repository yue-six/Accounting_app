// 分析页面组件
class AnalysisPage {
    constructor(app) {
        this.app = app;
        this.categoryChart = null;
        this.monthlyChart = null;
        // 预算提醒状态，避免重复弹窗
        this.lastBudgetAlertLevel = null; // null | 'warn' | 'over'
    }

    // 渲染页面
    render() {
        const categoryStats = this.app.getCategoryStats();
        
        return `
            <div class="page active" id="analysis-page">
                <!-- 消费分析 -->
                <div class="card">
                    <h3><i class="fas fa-chart-pie"></i> 消费分析</h3>
                    <div class="chart-container">
                        <canvas id="categoryChart"></canvas>
                    </div>
                </div>

                <!-- 月度趋势 -->
                <div class="card">
                    <h3><i class="fas fa-chart-bar"></i> 月度趋势</h3>
                    <div class="chart-container">
                        <canvas id="monthlyChart"></canvas>
                    </div>
                </div>

                <!-- 分类统计 -->
                <div class="card">
                    <h3><i class="fas fa-tags"></i> 分类统计</h3>
                    <div id="category-stats">
                        ${this.renderCategoryStats(categoryStats)}
                    </div>
                </div>

                <!-- 预算管理 -->
                <div class="card">
                    <h3><i class="fas fa-wallet"></i> 预算管理</h3>
                    <div id="budget-management">
                        ${this.renderBudgetManagement()}
                    </div>
                </div>
            </div>
        `;
    }

    // 渲染分类统计
    renderCategoryStats(stats) {
        const categories = this.app.categories.filter(cat => stats[cat.id] > 0);
        
        if (categories.length === 0) {
            return '<div style="text-align: center; color: #718096; padding: 20px;">暂无消费数据</div>';
        }

        return categories.map(category => {
            const amount = stats[category.id];
            const percentage = (amount / Object.values(stats).reduce((a, b) => a + b, 0) * 100).toFixed(1);
            
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.2rem;">${category ? category.icon : '📦'}</span>
                        <span style="font-weight: 500;">${category ? category.name : '未分类'}</span>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600; color: #f56565;">¥${amount}</div>
                        <div style="font-size: 0.8rem; color: #718096;">${percentage}%</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 渲染预算管理
    renderBudgetManagement() {
        const monthlyBudget = Number(this.app.budgets?.monthly || 0);
        // 计算本月支出
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 1);
        const monthlyExpense = this.app.transactions
            .filter(t => t.type === 'expense' && new Date(t.date) >= monthStart && new Date(t.date) < monthEnd)
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const remaining = Math.max(0, monthlyBudget - monthlyExpense);
        const usedPercent = monthlyBudget > 0 ? Math.min(100, Math.round((monthlyExpense / monthlyBudget) * 100)) : 0;
        const barColor = usedPercent >= 100 ? '#e53e3e' : (usedPercent >= 80 ? '#d69e2e' : '#4fd1c5');
        const alertText = usedPercent >= 100 ? '已超出本月预算' : (usedPercent >= 80 ? '预算使用已超过80%' : '');

        return `
            <div style="margin-top: 15px;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">月度总预算</label>
                    <div style="display: flex; gap: 10px;">
                        <input type="number" id="total-budget" placeholder="设置预算金额" value="${monthlyBudget || ''}"
                               style="flex: 1; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <button class="action-btn" onclick="analysisPage.setBudget()" style="padding: 10px 20px;">
                            设置
                        </button>
                    </div>
                </div>
                
                <div style="background: #f7fafc; padding: 15px; border-radius: 8px;">
                    ${alertText ? `<div style=\"background: ${barColor}1A; color: ${barColor}; padding: 8px 10px; border-radius: 6px; margin-bottom: 10px; font-size: 12px;\">${alertText}</div>` : ''}
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>本月已消费</span>
                        <span style="color: #f56565; font-weight: 600;">¥${monthlyExpense.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>剩余预算</span>
                        <span style="color: #4fd1c5; font-weight: 600;">¥${remaining.toFixed(2)}</span>
                    </div>
                    <div style="margin-top: 10px;">
                        <div style="background: #e2e8f0; height: 6px; border-radius: 3px; overflow: hidden;">
                            <div style="background: ${barColor}; height: 100%; width: ${usedPercent}%; transition: width .3s;"></div>
                        </div>
                        <div style="text-align:right; font-size: 12px; color: ${usedPercent>=100 ? '#e53e3e' : (usedPercent>=80 ? '#d69e2e' : '#718096')}; margin-top: 4px;">已用 ${usedPercent}%</div>
                    </div>
                </div>
            </div>
        `;
    }

    // 初始化事件
    initEvents() {
        // 设置全局变量
        analysisPage = this;

        // 预算设置
        document.getElementById('total-budget')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.setBudget();
            }
        });

        // 初始化图表
        this.initCharts();
        // 首次检查预算提醒
        this.checkBudgetAlert();
    }

    // 预算阈值提醒（80%与超额）
    checkBudgetAlert() {
        const monthlyBudget = Number(this.app.budgets?.monthly || 0);
        if (!monthlyBudget) {
            this.lastBudgetAlertLevel = null;
            return;
        }
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const expense = this.app.transactions
            .filter(t => t.type === 'expense' && new Date(t.date) >= start && new Date(t.date) < end)
            .reduce((s, t) => s + Number(t.amount || 0), 0);
        const ratio = expense / monthlyBudget;
        const over = ratio >= 1;
        const warn = ratio >= 0.8 && ratio < 1;

        if (over && this.lastBudgetAlertLevel !== 'over') {
            this.app.showToast('已超出本月预算，请注意控制支出', 'warning');
            this.lastBudgetAlertLevel = 'over';
        } else if (warn && this.lastBudgetAlertLevel !== 'warn') {
            this.app.showToast('本月预算已使用超过80%', 'warning');
            this.lastBudgetAlertLevel = 'warn';
        } else if (!warn && !over) {
            this.lastBudgetAlertLevel = null;
        }
    }

    // 初始化图表
    initCharts() {
        this.createCategoryChart();
        this.createMonthlyChart();
    }

    // 创建分类图表
    createCategoryChart() {
        const ctx = document.getElementById('categoryChart')?.getContext('2d');
        if (!ctx) return;

        const stats = this.app.getCategoryStats();
        const categories = this.app.categories.filter(cat => stats[cat.id] > 0);
        
        if (categories.length === 0) return;

        const data = categories.map(cat => stats[cat.id]);
        const labels = categories.map(cat => cat.name);
        const colors = categories.map(cat => cat.color);

        if (this.categoryChart) {
            this.categoryChart.destroy();
        }

        this.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    // 创建月度图表
    createMonthlyChart() {
        const ctx = document.getElementById('monthlyChart')?.getContext('2d');
        if (!ctx) return;

        // 获取最近6个月的真实数据
        const monthlyData = this.getMonthlyTrendData();
        const months = monthlyData.months;
        const incomeData = monthlyData.income;
        const expenseData = monthlyData.expense;

        if (this.monthlyChart) {
            this.monthlyChart.destroy();
        }

        this.monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: '收入',
                    data: incomeData,
                    borderColor: '#4fd1c5',
                    backgroundColor: 'rgba(79, 209, 197, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: '支出',
                    data: expenseData,
                    borderColor: '#f56565',
                    backgroundColor: 'rgba(245, 101, 101, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                }
            }
        });
    }

    // 获取月度趋势数据
    getMonthlyTrendData() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        // 生成最近6个月的月份标签
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date(currentYear, currentMonth - i, 1);
            months.push(`${date.getMonth() + 1}月`);
        }
        
        // 初始化收入支出数组
        const incomeData = new Array(6).fill(0);
        const expenseData = new Array(6).fill(0);
        
        // 遍历交易数据，按月份统计
        this.app.transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date);
            const transactionMonth = transactionDate.getMonth();
            const transactionYear = transactionDate.getFullYear();
            
            // 计算月份索引（0-5，对应最近6个月）
            const monthDiff = (currentYear - transactionYear) * 12 + (currentMonth - transactionMonth);
            const index = 5 - monthDiff;
            
            // 只处理最近6个月的数据
            if (index >= 0 && index < 6) {
                if (transaction.type === 'income') {
                    incomeData[index] += parseFloat(transaction.amount || 0);
                } else if (transaction.type === 'expense') {
                    expenseData[index] += parseFloat(transaction.amount || 0);
                }
            }
        });
        
        return {
            months: months,
            income: incomeData,
            expense: expenseData
        };
    }

    // 更新数据
    updateData() {
        this.createCategoryChart();
        this.createMonthlyChart();
        
        // 更新分类统计
        const stats = this.app.getCategoryStats();
        const container = document.getElementById('category-stats');
        if (container) {
            container.innerHTML = this.renderCategoryStats(stats);
        }
        
        // 更新预算管理UI
        const budgetContainer = document.getElementById('budget-management');
        if (budgetContainer) {
            budgetContainer.innerHTML = this.renderBudgetManagement();
        }
        
        // 检查预算提醒
        this.checkBudgetAlert();
    }

    // 设置预算
    setBudget() {
        const budgetInput = document.getElementById('total-budget');
        const amount = Number(budgetInput.value);
        
        if (!Number.isFinite(amount) || amount <= 0) {
            this.app.showToast('请输入有效的预算金额');
            return;
        }

        this.app.budgets.monthly = Math.round(amount * 100) / 100;
        this.app.saveData();
        this.app.showToast(`月度预算设置为 ¥${this.app.budgets.monthly}`);
        
        // 刷新预算UI
        const budgetContainer = document.getElementById('budget-management');
        if (budgetContainer) {
            budgetContainer.innerHTML = this.renderBudgetManagement();
        }
        
        // 检查预算提醒
        this.checkBudgetAlert();
    }

    // 导出报表
    exportReport() {
        this.app.showToast('报表导出功能开发中...');
    }
    
    // 检查预算提醒
    checkBudgetAlert() {
        if (!this.app.budgets.monthly) return;
        
        const monthlyStats = this.app.getMonthlyStats();
        const expenseRatio = monthlyStats.expense / this.app.budgets.monthly;
        
        // 避免重复提醒
        let currentAlertLevel = null;
        if (expenseRatio >= 1.0) {
            currentAlertLevel = 'over';
        } else if (expenseRatio >= 0.8) {
            currentAlertLevel = 'warn';
        }
        
        if (currentAlertLevel !== this.lastBudgetAlertLevel) {
            this.lastBudgetAlertLevel = currentAlertLevel;
            
            if (currentAlertLevel === 'over') {
                this.app.showToast('本月预算已超支！请控制支出', 'error');
            } else if (currentAlertLevel === 'warn') {
                this.app.showToast('本月预算即将用完，请注意控制支出', 'warning');
            }
        }
    }
    
    // 获取预算进度百分比
    getBudgetProgress() {
        if (!this.app.budgets.monthly) return 0;
        
        const monthlyStats = this.app.getMonthlyStats();
        const progress = (monthlyStats.expense / this.app.budgets.monthly) * 100;
        return Math.min(progress, 100); // 不超过100%
    }
    
    // 获取预算状态颜色
    getBudgetStatusColor() {
        const progress = this.getBudgetProgress();
        if (progress >= 100) return '#e53e3e'; // 红色 - 超支
        if (progress >= 80) return '#d69e2e'; // 黄色 - 警告
        return '#38a169'; // 绿色 - 正常
    }
}

// 全局变量
let analysisPage;