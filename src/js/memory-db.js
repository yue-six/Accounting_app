// 内存数据库 - 用于演示和离线使用
class MemoryDB {
    constructor() {
        this.transactions = [];
        this.categories = [
            { id: 'food', name: '餐饮', color: '#ff6b6b', icon: '🍽️' },
            { id: 'transport', name: '交通', color: '#4ecdc4', icon: '🚗' },
            { id: 'shopping', name: '购物', color: '#45b7d1', icon: '🛍️' },
            { id: 'entertainment', name: '娱乐', color: '#96ceb4', icon: '🎮' },
            { id: 'study', name: '学习', color: '#feca57', icon: '📚' },
            { id: 'salary', name: '工资', color: '#4fd1c5', icon: '💰' },
            { id: 'investment', name: '投资', color: '#667eea', icon: '📈' },
            { id: 'other', name: '其他', color: '#a0aec0', icon: '📦' }
        ];
        this.budgets = {};
        this.userMode = 'student';
        this.isConnected = true; // 内存数据库始终可用
    }

    // 初始化数据库
    async init() {
        console.log('📁 内存数据库初始化完成');
        return true;
    }

    // 获取交易记录
    async getTransactions() {
        return this.transactions;
    }

    // 添加交易记录
    async addTransaction(transaction) {
        const newTransaction = {
            id: this.generateId(),
            ...transaction,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.transactions.unshift(newTransaction);
        return newTransaction;
    }

    // 更新交易记录
    async updateTransaction(transactionId, updates) {
        const index = this.transactions.findIndex(t => t.id === transactionId);
        if (index !== -1) {
            this.transactions[index] = {
                ...this.transactions[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            return true;
        }
        return false;
    }

    // 删除交易记录
    async deleteTransaction(transactionId) {
        const index = this.transactions.findIndex(t => t.id === transactionId);
        if (index !== -1) {
            this.transactions.splice(index, 1);
            return true;
        }
        return false;
    }

    // 获取今日统计
    async getTodayStats() {
        const today = new Date().toDateString();
        const todayTransactions = this.transactions.filter(t => 
            new Date(t.date).toDateString() === today
        );

        const income = todayTransactions.filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const expense = todayTransactions.filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expense;

        return { income, expense, balance };
    }

    // 获取分类统计
    async getCategoryStats(startDate, endDate) {
        const filteredTransactions = this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return (!startDate || transactionDate >= new Date(startDate)) &&
                   (!endDate || transactionDate <= new Date(endDate));
        });

        const stats = {};
        this.categories.forEach(category => {
            const amount = filteredTransactions
                .filter(t => t.category === category.id && t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            stats[category.id] = amount;
        });
        return stats;
    }

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 导出数据
    exportData() {
        return {
            transactions: this.transactions,
            categories: this.categories,
            budgets: this.budgets,
            userMode: this.userMode,
            exportDate: new Date().toISOString()
        };
    }

    // 导入数据
    importData(data) {
        if (data.transactions) this.transactions = data.transactions;
        if (data.categories) this.categories = data.categories;
        if (data.budgets) this.budgets = data.budgets;
        if (data.userMode) this.userMode = data.userMode;
        return true;
    }

    // 清除数据
    clearData() {
        this.transactions = [];
        this.budgets = {};
        return true;
    }
}

// 创建全局内存数据库实例
const memoryDB = new MemoryDB();

export default memoryDB;