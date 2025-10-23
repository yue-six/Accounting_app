// 高级数据分析与可视化管理器
class AdvancedAnalyticsManager {
    constructor(app) {
        this.app = app;
        this.charts = {};
        this.init();
    }

    // 初始化分析管理器
    init() {
        console.log('高级分析管理器初始化');
        this.loadChartLibraries();
    }

    // 加载图表库
    loadChartLibraries() {
        // 动态加载Chart.js（如果未加载）
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => {
                console.log('Chart.js 加载完成');
                this.initCharts();
            };
            document.head.appendChild(script);
        } else {
            this.initCharts();
        }
    }

    // 初始化图表
    initCharts() {
        console.log('初始化图表系统');
    }

    // 生成多维度报表
    generateMultiDimensionalReport(timeRange = 'month') {
        const transactions = this.getFilteredTransactions(timeRange);
        
        return {
            // 收支概览
            overview: this.generateOverviewReport(transactions, timeRange),
            
            // 分类分析
            categoryAnalysis: this.generateCategoryAnalysis(transactions),
            
            // 来源分析
            sourceAnalysis: this.generateSourceAnalysis(transactions),
            
            // 趋势分析
            trendAnalysis: this.generateTrendAnalysis(timeRange),
            
            // 智能账单
            smartBill: this.generateSmartBill(transactions, timeRange)
        };
    }

    // 获取过滤后的交易数据
    getFilteredTransactions(timeRange) {
        const now = new Date();
        let startDate;
        
        switch (timeRange) {
            case 'day':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        
        return this.app.transactions.filter(transaction => 
            new Date(transaction.date) >= startDate
        );
    }

    // 生成收支概览报告
    generateOverviewReport(transactions, timeRange) {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const balance = income - expense;
        const savingsRate = income > 0 ? (balance / income) * 100 : 0;
        
        // 同比数据（简化版）
        const lastPeriodData = this.getLastPeriodData(timeRange);
        
        return {
            income: Math.round(income * 100) / 100,
            expense: Math.round(expense * 100) / 100,
            balance: Math.round(balance * 100) / 100,
            savingsRate: Math.round(savingsRate * 100) / 100,
            transactionCount: transactions.length,
            avgDailyExpense: Math.round((expense / this.getDaysInRange(timeRange)) * 100) / 100,
            incomeGrowth: this.calculateGrowth(income, lastPeriodData.income),
            expenseGrowth: this.calculateGrowth(expense, lastPeriodData.expense)
        };
    }

    // 生成分类分析报告
    generateCategoryAnalysis(transactions) {
        const expenses = transactions.filter(t => t.type === 'expense');
        const categoryMap = {};
        
        expenses.forEach(transaction => {
            const category = this.app.categories.find(c => c.id === transaction.category) || 
                           { id: 'other', name: '其他' };
            
            if (!categoryMap[category.id]) {
                categoryMap[category.id] = {
                    name: category.name,
                    amount: 0,
                    count: 0,
                    percentage: 0
                };
            }
            
            categoryMap[category.id].amount += transaction.amount;
            categoryMap[category.id].count += 1;
        });
        
        const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
        
        // 计算百分比
        Object.values(categoryMap).forEach(category => {
            category.percentage = totalExpense > 0 ? 
                Math.round((category.amount / totalExpense) * 100) : 0;
        });
        
        // 按金额排序
        const sortedCategories = Object.values(categoryMap)
            .sort((a, b) => b.amount - a.amount);
        
        return {
            categories: sortedCategories,
            totalExpense: Math.round(totalExpense * 100) / 100,
            topCategory: sortedCategories[0] || null
        };
    }

    // 生成来源分析报告
    generateSourceAnalysis(transactions) {
        const sourceMap = {};
        
        transactions.forEach(transaction => {
            const source = transaction.source || 'manual';
            
            if (!sourceMap[source]) {
                sourceMap[source] = {
                    name: this.getSourceDisplayName(source),
                    income: 0,
                    expense: 0,
                    count: 0
                };
            }
            
            if (transaction.type === 'income') {
                sourceMap[source].income += transaction.amount;
            } else {
                sourceMap[source].expense += transaction.amount;
            }
            
            sourceMap[source].count += 1;
        });
        
        return Object.values(sourceMap);
    }

    // 获取来源显示名称
    getSourceDisplayName(source) {
        const sourceNames = {
            'manual': '手动记账',
            'voice': '语音记账',
            'wechat': '微信支付',
            'alipay': '支付宝',
            'photo': '拍照识别',
            'qr': '扫码识别'
        };
        
        return sourceNames[source] || source;
    }

    // 生成趋势分析报告
    generateTrendAnalysis(timeRange) {
        const periods = this.getTimePeriods(timeRange);
        const trendData = [];
        
        periods.forEach(period => {
            const periodTransactions = this.getTransactionsForPeriod(period.start, period.end);
            
            const income = periodTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            
            const expense = periodTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            
            trendData.push({
                period: period.label,
                income: Math.round(income * 100) / 100,
                expense: Math.round(expense * 100) / 100,
                balance: Math.round((income - expense) * 100) / 100
            });
        });
        
        return trendData;
    }

    // 生成智能账单
    generateSmartBill(transactions, timeRange) {
        const overview = this.generateOverviewReport(transactions, timeRange);
        const categoryAnalysis = this.generateCategoryAnalysis(transactions);
        
        // 消费健康度评分
        const healthScore = this.calculateHealthScore(overview, categoryAnalysis);
        
        // 异常支出检测
        const anomalies = this.detectAnomalies(transactions);
        
        // 消费建议
        const recommendations = this.generateRecommendations(overview, categoryAnalysis);
        
        return {
            period: this.getPeriodDisplayName(timeRange),
            overview: overview,
            topCategories: categoryAnalysis.categories.slice(0, 3),
            healthScore: healthScore,
            anomalies: anomalies,
            recommendations: recommendations,
            summary: this.generateBillSummary(overview, healthScore)
        };
    }

    // 计算健康度评分
    calculateHealthScore(overview, categoryAnalysis) {
        let score = 100;
        
        // 储蓄率评分（权重40%）
        const savingsRateScore = Math.min(overview.savingsRate * 2, 40);
        
        // 支出稳定性评分（权重30%）
        const stabilityScore = this.calculateStabilityScore(overview);
        
        // 分类合理性评分（权重30%）
        const categoryScore = this.calculateCategoryScore(categoryAnalysis);
        
        score = savingsRateScore + stabilityScore + categoryScore;
        
        return Math.max(0, Math.min(100, Math.round(score)));
    }

    // 计算稳定性评分
    calculateStabilityScore(overview) {
        // 简化版：基于支出增长率
        const growthRate = Math.abs(overview.expenseGrowth);
        if (growthRate <= 10) return 30;
        if (growthRate <= 20) return 20;
        if (growthRate <= 30) return 10;
        return 0;
    }

    // 计算分类合理性评分
    calculateCategoryScore(categoryAnalysis) {
        // 简化版：检查是否有过度集中的消费
        if (categoryAnalysis.categories.length === 0) return 30;
        
        const topCategoryPercentage = categoryAnalysis.categories[0].percentage;
        if (topCategoryPercentage <= 30) return 30;
        if (topCategoryPercentage <= 50) return 20;
        if (topCategoryPercentage <= 70) return 10;
        return 0;
    }

    // 检测异常支出
    detectAnomalies(transactions) {
        const expenses = transactions.filter(t => t.type === 'expense');
        if (expenses.length === 0) return [];
        
        // 计算平均支出和标准差
        const amounts = expenses.map(t => t.amount);
        const mean = amounts.reduce((a, b) => a + b) / amounts.length;
        const stdDev = Math.sqrt(
            amounts.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / amounts.length
        );
        
        // 检测异常值（超过2倍标准差）
        return expenses.filter(t => t.amount > mean + 2 * stdDev)
            .map(t => ({
                amount: t.amount,
                description: t.description,
                date: t.date,
                deviation: Math.round(((t.amount - mean) / mean) * 100)
            }));
    }

    // 生成消费建议
    generateRecommendations(overview, categoryAnalysis) {
        const recommendations = [];
        
        // 储蓄率建议
        if (overview.savingsRate < 20) {
            recommendations.push({
                type: 'savings',
                title: '提高储蓄率',
                message: `当前储蓄率${overview.savingsRate}%，建议目标达到20%以上`,
                priority: 'high'
            });
        }
        
        // 支出控制建议
        if (overview.avgDailyExpense > 200) {
            recommendations.push({
                type: 'expense',
                title: '控制日常支出',
                message: `日均支出${overview.avgDailyExpense}元，建议关注非必要消费`,
                priority: 'medium'
            });
        }
        
        // 分类优化建议
        if (categoryAnalysis.topCategory && categoryAnalysis.topCategory.percentage > 50) {
            recommendations.push({
                type: 'category',
                title: '分散消费类别',
                message: `${categoryAnalysis.topCategory.name}占比过高，建议均衡消费结构`,
                priority: 'medium'
            });
        }
        
        return recommendations;
    }

    // 生成账单摘要
    generateBillSummary(overview, healthScore) {
        let summary = '';
        
        if (healthScore >= 80) {
            summary = `优秀！您的财务状况非常健康，储蓄率达到${overview.savingsRate}%`;
        } else if (healthScore >= 60) {
            summary = `良好！财务状况基本健康，储蓄率${overview.savingsRate}%`;
        } else if (healthScore >= 40) {
            summary = `一般！建议关注支出结构，储蓄率${overview.savingsRate}%有待提升`;
        } else {
            summary = `需要改善！财务状况有待优化，储蓄率${overview.savingsRate}%较低`;
        }
        
        return summary;
    }

    // 工具函数
    getLastPeriodData(timeRange) {
        // 简化版：返回空数据
        return { income: 0, expense: 0 };
    }

    calculateGrowth(current, previous) {
        if (previous === 0) return 0;
        return Math.round(((current - previous) / previous) * 100);
    }

    getDaysInRange(timeRange) {
        const daysMap = {
            'day': 1,
            'week': 7,
            'month': 30,
            'year': 365
        };
        return daysMap[timeRange] || 30;
    }

    getTimePeriods(timeRange) {
        const periods = [];
        const now = new Date();
        
        switch (timeRange) {
            case 'month':
                for (let i = 5; i >= 0; i--) {
                    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    periods.push({
                        start: new Date(date.getFullYear(), date.getMonth(), 1),
                        end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
                        label: `${date.getFullYear()}年${date.getMonth() + 1}月`
                    });
                }
                break;
            case 'year':
                for (let i = 2; i >= 0; i--) {
                    const year = now.getFullYear() - i;
                    periods.push({
                        start: new Date(year, 0, 1),
                        end: new Date(year, 11, 31),
                        label: `${year}年`
                    });
                }
                break;
            default:
                // 默认返回最近6个月
                for (let i = 5; i >= 0; i--) {
                    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    periods.push({
                        start: new Date(date.getFullYear(), date.getMonth(), 1),
                        end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
                        label: `${date.getFullYear()}年${date.getMonth() + 1}月`
                    });
                }
        }
        
        return periods;
    }

    getTransactionsForPeriod(start, end) {
        return this.app.transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= start && transactionDate <= end;
        });
    }

    getPeriodDisplayName(timeRange) {
        const names = {
            'day': '今日',
            'week': '本周',
            'month': '本月',
            'year': '今年'
        };
        return names[timeRange] || '本月';
    }

    // 渲染图表
    renderCategoryPieChart(canvasId, categoryAnalysis) {
        if (typeof Chart === 'undefined') return;
        
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        const chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categoryAnalysis.categories.map(c => c.name),
                datasets: [{
                    data: categoryAnalysis.categories.map(c => c.amount),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ¥${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        this.charts[canvasId] = chart;
    }

    // 渲染趋势图
    renderTrendLineChart(canvasId, trendData) {
        if (typeof Chart === 'undefined') return;
        
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendData.map(d => d.period),
                datasets: [
                    {
                        label: '收入',
                        data: trendData.map(d => d.income),
                        borderColor: '#36A2EB',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        tension: 0.1
                    },
                    {
                        label: '支出',
                        data: trendData.map(d => d.expense),
                        borderColor: '#FF6384',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        this.charts[canvasId] = chart;
    }
}

// 全局高级分析管理器
let advancedAnalytics = null;

// 初始化高级分析
function initAdvancedAnalytics(app) {
    advancedAnalytics = new AdvancedAnalyticsManager(app);
    return advancedAnalytics;
}

// 全局函数供HTML调用
function generateReport(timeRange) {
    if (advancedAnalytics) {
        return advancedAnalytics.generateMultiDimensionalReport(timeRange);
    }
    return null;
}

function renderCategoryChart(canvasId, categoryAnalysis) {
    if (advancedAnalytics) {
        advancedAnalytics.renderCategoryPieChart(canvasId, categoryAnalysis);
    }
}

function renderTrendChart(canvasId, trendData) {
    if (advancedAnalytics) {
        advancedAnalytics.renderTrendLineChart(canvasId, trendData);
    }
}