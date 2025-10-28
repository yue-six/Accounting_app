/**
 * 图表管理器
 * 统一管理应用中的所有图表功能
 */

class ChartManager {
    constructor(app) {
        this.app = app;
        this.charts = new Map();
        this.defaultColors = [
            '#667eea', '#764ba2', '#f093fb', '#f5576c',
            '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
            '#fa709a', '#fee140', '#ffecd2', '#fcb69f'
        ];
    }

    /**
     * 创建支出分类饼图
     */
    createExpensePieChart(canvasId, data) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: this.defaultColors.slice(0, data.labels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
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
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ¥${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * 创建收入支出对比柱状图
     */
    createIncomeExpenseBarChart(canvasId, data) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: '收入',
                        data: data.income,
                        backgroundColor: '#4fd1c5',
                        borderColor: '#4fd1c5',
                        borderWidth: 1
                    },
                    {
                        label: '支出',
                        data: data.expense,
                        backgroundColor: '#f56565',
                        borderColor: '#f56565',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '¥' + value;
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * 创建趋势线图
     */
    createTrendLineChart(canvasId, data) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: '收入趋势',
                        data: data.income,
                        borderColor: '#4fd1c5',
                        backgroundColor: 'rgba(79, 209, 197, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: '支出趋势',
                        data: data.expense,
                        borderColor: '#f56565',
                        backgroundColor: 'rgba(245, 101, 101, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '¥' + value;
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * 创建预算进度图
     */
    createBudgetProgressChart(canvasId, data) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['已使用', '剩余'],
                datasets: [{
                    data: [data.used, data.remaining],
                    backgroundColor: ['#f56565', '#e2e8f0'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                return `${label}: ¥${value}`;
                            }
                        }
                    }
                }
            }
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * 创建分类支出对比图
     */
    createCategoryComparisonChart(canvasId, data) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '支出金额',
                    data: data.values,
                    backgroundColor: this.defaultColors.slice(0, data.labels.length),
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '¥' + value;
                            }
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * 更新图表数据
     */
    updateChart(canvasId, newData) {
        const chart = this.charts.get(canvasId);
        if (chart) {
            chart.data = newData;
            chart.update();
        }
    }

    /**
     * 销毁图表
     */
    destroyChart(canvasId) {
        const chart = this.charts.get(canvasId);
        if (chart) {
            chart.destroy();
            this.charts.delete(canvasId);
        }
    }

    /**
     * 销毁所有图表
     */
    destroyAllCharts() {
        this.charts.forEach((chart, canvasId) => {
            chart.destroy();
        });
        this.charts.clear();
    }

    /**
     * 获取图表数据统计
     */
    getChartDataStats(transactions, period = 'month') {
        const now = new Date();
        let startDate;
        
        switch (period) {
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

        const filteredTransactions = transactions.filter(t => 
            new Date(t.date) >= startDate
        );

        // 按日期分组
        const dateGroups = {};
        filteredTransactions.forEach(t => {
            const date = t.date;
            if (!dateGroups[date]) {
                dateGroups[date] = { income: 0, expense: 0 };
            }
            
            if (t.type === 'income') {
                dateGroups[date].income += t.amount;
            } else {
                dateGroups[date].expense += t.amount;
            }
        });

        // 按分类分组
        const categoryGroups = {};
        filteredTransactions.forEach(t => {
            if (t.type === 'expense') {
                if (!categoryGroups[t.category]) {
                    categoryGroups[t.category] = 0;
                }
                categoryGroups[t.category] += t.amount;
            }
        });

        return {
            dateGroups,
            categoryGroups,
            totalIncome: filteredTransactions.filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0),
            totalExpense: filteredTransactions.filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0)
        };
    }

    /**
     * 生成图表配置数据
     */
    generateChartData(transactions, chartType, period = 'month') {
        const stats = this.getChartDataStats(transactions, period);
        
        switch (chartType) {
            case 'expensePie':
                const categories = this.app.categories || [];
                const categoryLabels = [];
                const categoryValues = [];
                
                categories.forEach(cat => {
                    const amount = stats.categoryGroups[cat.id] || 0;
                    if (amount > 0) {
                        categoryLabels.push(cat.name);
                        categoryValues.push(amount);
                    }
                });
                
                return {
                    labels: categoryLabels,
                    values: categoryValues
                };

            case 'incomeExpenseBar':
                const dates = Object.keys(stats.dateGroups).sort();
                const incomeData = dates.map(date => stats.dateGroups[date].income);
                const expenseData = dates.map(date => stats.dateGroups[date].expense);
                
                return {
                    labels: dates.map(date => {
                        const d = new Date(date);
                        return `${d.getMonth() + 1}/${d.getDate()}`;
                    }),
                    income: incomeData,
                    expense: expenseData
                };

            case 'trendLine':
                const trendDates = Object.keys(stats.dateGroups).sort();
                const trendIncome = trendDates.map(date => stats.dateGroups[date].income);
                const trendExpense = trendDates.map(date => stats.dateGroups[date].expense);
                
                return {
                    labels: trendDates.map(date => {
                        const d = new Date(date);
                        return `${d.getMonth() + 1}/${d.getDate()}`;
                    }),
                    income: trendIncome,
                    expense: trendExpense
                };

            default:
                return null;
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartManager;
} else {
    window.ChartManager = ChartManager;
}