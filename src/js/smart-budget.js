// 智能预算管理与提醒系统
class SmartBudgetManager {
    constructor(app) {
        this.app = app;
        this.budgetSettings = {
            monthly: 0,
            categories: {},
            alerts: {
                enabled: true,
                threshold: 80, // 预算使用80%时提醒
                notifyMethods: ['app', 'email', 'wechat']
            },
            autoAdjust: true
        };
        this.budgetHistory = [];
        this.init();
    }

    // 初始化预算管理器
    init() {
        console.log('智能预算管理器初始化');
        this.loadBudgetSettings();
        this.startBudgetMonitoring();
    }

    // 加载预算设置
    loadBudgetSettings() {
        const savedSettings = localStorage.getItem('smartBudgetSettings');
        if (savedSettings) {
            this.budgetSettings = { ...this.budgetSettings, ...JSON.parse(savedSettings) };
        }
        
        const savedHistory = localStorage.getItem('budgetHistory');
        if (savedHistory) {
            this.budgetHistory = JSON.parse(savedHistory);
        }
    }

    // 保存预算设置
    saveBudgetSettings() {
        localStorage.setItem('smartBudgetSettings', JSON.stringify(this.budgetSettings));
        localStorage.setItem('budgetHistory', JSON.stringify(this.budgetHistory));
    }

    // 开始预算监控
    startBudgetMonitoring() {
        // 每5分钟检查一次预算使用情况
        setInterval(() => {
            this.checkBudgetUsage();
        }, 5 * 60 * 1000);
    }

    // 设置月度总预算
    setMonthlyBudget(amount) {
        if (typeof amount !== 'number' || amount < 0) {
            throw new Error('预算金额必须为有效数字');
        }
        
        this.budgetSettings.monthly = Math.round(amount * 100) / 100;
        this.saveBudgetSettings();
        
        // 记录预算变更历史
        this.recordBudgetChange('monthly', amount);
        
        // 自动分配分类预算
        if (this.budgetSettings.autoAdjust) {
            this.autoAllocateCategoryBudgets();
        }
        
        this.app.showToast(`月度预算设置为 ¥${amount}`);
    }

    // 设置分类预算
    setCategoryBudget(categoryId, amount) {
        if (!this.app.categories.find(c => c.id === categoryId)) {
            throw new Error('无效的分类ID');
        }
        
        this.budgetSettings.categories[categoryId] = Math.round(amount * 100) / 100;
        this.saveBudgetSettings();
        
        this.recordBudgetChange(`category_${categoryId}`, amount);
        
        this.app.showToast(`${this.getCategoryName(categoryId)}预算设置为 ¥${amount}`);
    }

    // 自动分配分类预算
    autoAllocateCategoryBudgets() {
        if (this.budgetSettings.monthly <= 0) return;
        
        // 基于历史消费模式分配预算
        const historicalSpending = this.analyzeHistoricalSpending();
        const totalHistorical = Object.values(historicalSpending).reduce((sum, amount) => sum + amount, 0);
        
        if (totalHistorical === 0) {
            // 如果没有历史数据，平均分配
            this.distributeEvenly();
        } else {
            // 基于历史比例分配
            this.distributeByHistoricalRatio(historicalSpending, totalHistorical);
        }
        
        this.saveBudgetSettings();
        this.app.showToast('已自动分配分类预算');
    }

    // 分析历史消费模式
    analyzeHistoricalSpending() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const lastThreeMonths = this.app.transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            const transactionMonth = transactionDate.getMonth();
            const transactionYear = transactionDate.getFullYear();
            
            // 获取最近3个月的数据
            const monthDiff = (currentYear - transactionYear) * 12 + (currentMonth - transactionMonth);
            return monthDiff >= 0 && monthDiff < 3 && transaction.type === 'expense';
        });
        
        const categorySpending = {};
        
        lastThreeMonths.forEach(transaction => {
            const categoryId = transaction.category;
            if (!categorySpending[categoryId]) {
                categorySpending[categoryId] = 0;
            }
            categorySpending[categoryId] += transaction.amount;
        });
        
        return categorySpending;
    }

    // 平均分配预算
    distributeEvenly() {
        const expenseCategories = this.app.categories.filter(c => c.type === 'expense');
        const budgetPerCategory = this.budgetSettings.monthly / expenseCategories.length;
        
        expenseCategories.forEach(category => {
            this.budgetSettings.categories[category.id] = Math.round(budgetPerCategory * 100) / 100;
        });
    }

    // 基于历史比例分配预算
    distributeByHistoricalRatio(historicalSpending, totalHistorical) {
        const expenseCategories = this.app.categories.filter(c => c.type === 'expense');
        
        expenseCategories.forEach(category => {
            const historicalAmount = historicalSpending[category.id] || 0;
            const ratio = historicalAmount / totalHistorical;
            const allocatedBudget = this.budgetSettings.monthly * ratio;
            
            this.budgetSettings.categories[category.id] = Math.round(allocatedBudget * 100) / 100;
        });
    }

    // 检查预算使用情况
    checkBudgetUsage() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyExpenses = this.app.transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate.getMonth() === currentMonth &&
                   transactionDate.getFullYear() === currentYear &&
                   transaction.type === 'expense';
        });
        
        // 检查总预算
        this.checkTotalBudget(monthlyExpenses);
        
        // 检查分类预算
        this.checkCategoryBudgets(monthlyExpenses);
    }

    // 检查总预算使用情况
    checkTotalBudget(monthlyExpenses) {
        if (this.budgetSettings.monthly <= 0) return;
        
        const totalSpent = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);
        const usagePercentage = (totalSpent / this.budgetSettings.monthly) * 100;
        
        if (usagePercentage >= this.budgetSettings.alerts.threshold) {
            this.triggerBudgetAlert('total', usagePercentage, totalSpent);
        }
    }

    // 检查分类预算使用情况
    checkCategoryBudgets(monthlyExpenses) {
        Object.keys(this.budgetSettings.categories).forEach(categoryId => {
            const categoryBudget = this.budgetSettings.categories[categoryId];
            if (categoryBudget <= 0) return;
            
            const categoryExpenses = monthlyExpenses.filter(t => t.category === categoryId);
            const categorySpent = categoryExpenses.reduce((sum, t) => sum + t.amount, 0);
            const usagePercentage = (categorySpent / categoryBudget) * 100;
            
            if (usagePercentage >= this.budgetSettings.alerts.threshold) {
                this.triggerBudgetAlert('category', usagePercentage, categorySpent, categoryId);
            }
        });
    }

    // 触发预算提醒
    triggerBudgetAlert(type, percentage, spent, categoryId = null) {
        const alertKey = categoryId ? `alert_${categoryId}` : 'alert_total';
        const lastAlert = localStorage.getItem(alertKey);
        const now = Date.now();
        
        // 防止频繁提醒（至少间隔1小时）
        if (lastAlert && (now - parseInt(lastAlert)) < 60 * 60 * 1000) {
            return;
        }
        
        let message = '';
        let alertType = 'warning';
        
        if (type === 'total') {
            if (percentage >= 100) {
                message = `⚠️ 月度预算已超支！已花费 ¥${spent.toFixed(2)}，超出预算 ¥${(spent - this.budgetSettings.monthly).toFixed(2)}`;
                alertType = 'error';
            } else {
                message = `🔔 月度预算使用 ${percentage.toFixed(1)}%，已花费 ¥${spent.toFixed(2)}，剩余 ¥${(this.budgetSettings.monthly - spent).toFixed(2)}`;
            }
        } else if (type === 'category') {
            const categoryName = this.getCategoryName(categoryId);
            const categoryBudget = this.budgetSettings.categories[categoryId];
            
            if (percentage >= 100) {
                message = `⚠️ ${categoryName}预算已超支！已花费 ¥${spent.toFixed(2)}，超出预算 ¥${(spent - categoryBudget).toFixed(2)}`;
                alertType = 'error';
            } else {
                message = `🔔 ${categoryName}预算使用 ${percentage.toFixed(1)}%，已花费 ¥${spent.toFixed(2)}，剩余 ¥${(categoryBudget - spent).toFixed(2)}`;
            }
        }
        
        // 显示应用内提醒
        this.app.showToast(message, alertType);
        
        // 记录提醒时间
        localStorage.setItem(alertKey, now.toString());
        
        // 发送其他通知（模拟）
        this.sendAdditionalNotifications(message, alertType);
    }

    // 发送额外通知
    sendAdditionalNotifications(message, alertType) {
        if (this.budgetSettings.alerts.notifyMethods.includes('email')) {
            this.sendEmailNotification(message, alertType);
        }
        
        if (this.budgetSettings.alerts.notifyMethods.includes('wechat')) {
            this.sendWechatNotification(message, alertType);
        }
    }

    // 发送邮件通知（模拟）
    sendEmailNotification(message, alertType) {
        console.log(`[邮件通知] ${message}`);
        // 实际实现需要集成邮件服务
    }

    // 发送微信通知（模拟）
    sendWechatNotification(message, alertType) {
        console.log(`[微信通知] ${message}`);
        // 实际实现需要集成微信服务
    }

    // 获取预算使用情况报告
    getBudgetReport() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyExpenses = this.app.transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate.getMonth() === currentMonth &&
                   transactionDate.getFullYear() === currentYear &&
                   transaction.type === 'expense';
        });
        
        const totalSpent = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);
        const totalBudget = this.budgetSettings.monthly;
        const totalUsage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
        
        // 分类预算使用情况
        const categoryReports = {};
        
        Object.keys(this.budgetSettings.categories).forEach(categoryId => {
            const categoryBudget = this.budgetSettings.categories[categoryId];
            const categoryExpenses = monthlyExpenses.filter(t => t.category === categoryId);
            const categorySpent = categoryExpenses.reduce((sum, t) => sum + t.amount, 0);
            const categoryUsage = categoryBudget > 0 ? (categorySpent / categoryBudget) * 100 : 0;
            
            categoryReports[categoryId] = {
                name: this.getCategoryName(categoryId),
                budget: categoryBudget,
                spent: categorySpent,
                remaining: categoryBudget - categorySpent,
                usage: categoryUsage,
                isOverBudget: categorySpent > categoryBudget
            };
        });
        
        return {
            total: {
                budget: totalBudget,
                spent: totalSpent,
                remaining: totalBudget - totalSpent,
                usage: totalUsage,
                isOverBudget: totalSpent > totalBudget
            },
            categories: categoryReports,
            dailyAverage: {
                spent: totalSpent / new Date().getDate(),
                remainingDaily: (totalBudget - totalSpent) / (this.getDaysRemainingInMonth() || 1)
            },
            recommendations: this.generateBudgetRecommendations(totalSpent, totalBudget)
        };
    }

    // 生成预算调整建议
    generateBudgetRecommendations(spent, budget) {
        const recommendations = [];
        const usage = budget > 0 ? (spent / budget) * 100 : 0;
        const daysRemaining = this.getDaysRemainingInMonth();
        
        if (usage > 100) {
            recommendations.push({
                type: 'over_budget',
                title: '预算超支',
                message: `本月已超支 ¥${(spent - budget).toFixed(2)}，建议减少非必要支出`,
                priority: 'high'
            });
        } else if (usage > 80) {
            recommendations.push({
                type: 'near_limit',
                title: '预算接近上限',
                message: `预算使用 ${usage.toFixed(1)}%，剩余 ${daysRemaining} 天需控制支出`,
                priority: 'medium'
            });
        }
        
        // 基于历史数据的建议
        const historicalComparison = this.compareWithHistoricalData();
        if (historicalComparison.trend === 'increasing' && usage > 60) {
            recommendations.push({
                type: 'trend_warning',
                title: '支出趋势上升',
                message: '本月支出较上月增长，建议关注消费习惯',
                priority: 'medium'
            });
        }
        
        return recommendations;
    }

    // 与历史数据比较
    compareWithHistoricalData() {
        const currentMonth = new Date().getMonth();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const yearAdjust = currentMonth === 0 ? -1 : 0;
        
        const currentMonthSpent = this.getMonthlySpending(currentMonth, new Date().getFullYear());
        const lastMonthSpent = this.getMonthlySpending(lastMonth, new Date().getFullYear() + yearAdjust);
        
        const difference = currentMonthSpent - lastMonthSpent;
        const percentageChange = lastMonthSpent > 0 ? (difference / lastMonthSpent) * 100 : 0;
        
        return {
            trend: difference > 0 ? 'increasing' : difference < 0 ? 'decreasing' : 'stable',
            difference: difference,
            percentageChange: percentageChange
        };
    }

    // 获取指定月份的支出
    getMonthlySpending(month, year) {
        return this.app.transactions
            .filter(t => {
                const date = new Date(t.date);
                return date.getMonth() === month && 
                       date.getFullYear() === year && 
                       t.type === 'expense';
            })
            .reduce((sum, t) => sum + t.amount, 0);
    }

    // 获取本月剩余天数
    getDaysRemainingInMonth() {
        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        return lastDay - now.getDate();
    }

    // 记录预算变更历史
    recordBudgetChange(type, amount) {
        this.budgetHistory.push({
            type: type,
            amount: amount,
            timestamp: new Date().toISOString(),
            userMode: this.app.userMode
        });
        
        // 只保留最近100条记录
        if (this.budgetHistory.length > 100) {
            this.budgetHistory = this.budgetHistory.slice(-100);
        }
        
        this.saveBudgetSettings();
    }

    // 获取分类名称
    getCategoryName(categoryId) {
        const category = this.app.categories.find(c => c.id === categoryId);
        return category ? category.name : '未知分类';
    }

    // 获取预算设置
    getBudgetSettings() {
        return this.budgetSettings;
    }

    // 更新预算设置
    updateBudgetSettings(newSettings) {
        this.budgetSettings = { ...this.budgetSettings, ...newSettings };
        this.saveBudgetSettings();
        this.app.showToast('预算设置已更新');
    }

    // 重置预算
    resetBudget() {
        this.budgetSettings.monthly = 0;
        this.budgetSettings.categories = {};
        this.saveBudgetSettings();
        this.app.showToast('预算已重置');
    }
}

// 全局智能预算管理器
let smartBudgetManager = null;

// 初始化智能预算管理
function initSmartBudget(app) {
    smartBudgetManager = new SmartBudgetManager(app);
    return smartBudgetManager;
}

// 全局函数供HTML调用
function setMonthlyBudget(amount) {
    if (smartBudgetManager) {
        smartBudgetManager.setMonthlyBudget(amount);
    }
}

function setCategoryBudget(categoryId, amount) {
    if (smartBudgetManager) {
        smartBudgetManager.setCategoryBudget(categoryId, amount);
    }
}

function getBudgetReport() {
    if (smartBudgetManager) {
        return smartBudgetManager.getBudgetReport();
    }
    return null;
}

function autoAllocateBudgets() {
    if (smartBudgetManager) {
        smartBudgetManager.autoAllocateCategoryBudgets();
    }
}

function updateBudgetSettings(settings) {
    if (smartBudgetManager) {
        smartBudgetManager.updateBudgetSettings(settings);
    }
}