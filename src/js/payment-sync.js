// 支付平台自动同步管理器
class PaymentSyncManager {
    constructor(app) {
        this.app = app;
        this.syncStatus = {
            wechat: 'disconnected',
            alipay: 'disconnected'
        };
        this.syncInterval = null;
        this.init();
    }

    // 初始化同步管理器
    async init() {
        console.log('支付同步管理器初始化');
        await this.loadAuthStatus();
        this.startAutoSync();
    }

    // 加载授权状态
    async loadAuthStatus() {
        try {
            const response = await fetch('/api/payments/auth-status', {
                headers: {
                    'Authorization': `Bearer ${this.app.getToken()}`
                }
            });
            const data = await response.json();
            if (data.success) {
                this.syncStatus = data.data;
                this.updateUIStatus('wechat', this.syncStatus.wechat);
                this.updateUIStatus('alipay', this.syncStatus.alipay);
            }
        } catch (error) {
            console.error('加载授权状态失败:', error);
        }
    }

    // 开始自动同步
    startAutoSync() {
        // 每30分钟自动同步一次
        this.syncInterval = setInterval(() => {
            this.autoSyncTransactions();
        }, 30 * 60 * 1000);
    }

    // 自动同步所有已连接的支付平台
    async autoSyncTransactions() {
        if (this.syncStatus.wechat === 'connected') {
            await this.syncWechatPay();
        }
        if (this.syncStatus.alipay === 'connected') {
            await this.syncAlipay();
        }
    }

    // 同步微信支付数据
    async syncWechatPay() {
        try {
            console.log('开始同步微信支付数据...');
            const endTime = new Date().toISOString();
            const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 同步最近24小时

            const response = await fetch(`/api/payments/transactions?platform=wechat&startTime=${startTime}&endTime=${endTime}`, {
                headers: {
                    'Authorization': `Bearer ${this.app.getToken()}`
                }
            });
            const data = await response.json();

            if (data.success) {
                const transactions = this.cleanAndClassifyTransactions(data.data, 'wechat');
                await this.saveTransactions(transactions);
                console.log(`微信支付同步完成，新增 ${transactions.length} 条记录`);
                this.app.showToast(`微信支付同步完成，新增 ${transactions.length} 条记录`, 'success');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('微信支付同步失败:', error);
            this.app.showToast('微信支付同步失败', 'error');
        }
    }

    // 同步支付宝数据
    async syncAlipay() {
        try {
            console.log('开始同步支付宝数据...');
            const endTime = new Date().toISOString();
            const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 同步最近24小时

            const response = await fetch(`/api/payments/transactions?platform=alipay&startTime=${startTime}&endTime=${endTime}`, {
                headers: {
                    'Authorization': `Bearer ${this.app.getToken()}`
                }
            });
            const data = await response.json();

            if (data.success) {
                const transactions = this.cleanAndClassifyTransactions(data.data, 'alipay');
                await this.saveTransactions(transactions);
                console.log(`支付宝同步完成，新增 ${transactions.length} 条记录`);
                this.app.showToast(`支付宝同步完成，新增 ${transactions.length} 条记录`, 'success');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('支付宝同步失败:', error);
            this.app.showToast('支付宝同步失败', 'error');
        }
    }

    // 数据清洗和分类
    cleanAndClassifyTransactions(transactions, source) {
        return transactions.map(transaction => {
            // 去重检查
            if (this.isDuplicateTransaction(transaction)) {
                return null;
            }
            
            // 智能分类
            const category = this.autoCategorizeTransaction(transaction);
            
            return {
                amount: transaction.amount,
                type: transaction.type === 'income' ? 'income' : 'expense',
                description: transaction.description,
                merchant: transaction.merchantName,
                category: category.id,
                categoryName: category.name,
                date: new Date(transaction.time),
                paymentMethod: source,
                transactionId: transaction.transactionId,
                status: transaction.status,
                source: source
            };
        }).filter(t => t !== null);
    }

    // 检查交易是否重复
    isDuplicateTransaction(transaction) {
        const existingTransactions = this.app.transactions || [];
        return existingTransactions.some(existing => 
            existing.amount === transaction.amount &&
            existing.merchant === transaction.merchantName &&
            Math.abs(new Date(existing.date).getTime() - new Date(transaction.time).getTime()) < 24 * 60 * 60 * 1000
        );
    }

    // 智能分类交易
    autoCategorizeTransaction(transaction) {
        const description = transaction.description.toLowerCase();
        const merchant = transaction.merchantName.toLowerCase();
        
        // 餐饮相关
        if (description.includes('咖啡') || description.includes('星巴克') || 
            description.includes('午餐') || description.includes('晚餐') ||
            description.includes('外卖') || merchant.includes('餐厅') ||
            merchant.includes('饭店') || merchant.includes('火锅') ||
            merchant.includes('烧烤') || merchant.includes('快餐')) {
            return { id: 'food', name: '餐饮' };
        }
        
        // 交通相关
        if (description.includes('地铁') || description.includes('公交') ||
            description.includes('打车') || description.includes('高铁') ||
            merchant.includes('交通') || merchant.includes('出行')) {
            return { id: 'transport', name: '交通' };
        }
        
        // 购物相关
        if (description.includes('商场') || description.includes('超市') ||
            merchant.includes('淘宝') || merchant.includes('京东') ||
            merchant.includes('商城') || merchant.includes('店')) {
            return { id: 'shopping', name: '购物' };
        }
        
        // 默认分类
        return { id: 'other', name: '其他' };
    }

    // 保存交易记录
    async saveTransactions(transactions) {
        if (!transactions.length) return;
        
        try {
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.app.getToken()}`
                },
                body: JSON.stringify({ transactions })
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message);
            }

            // 更新本地数据
            this.app.transactions = [...(this.app.transactions || []), ...transactions];
            this.app.updateTransactionList();
        } catch (error) {
            console.error('保存交易记录失败:', error);
            throw error;
        }
    }

    // 更新支付平台状态
    updatePaymentStatus(paymentType, status) {
        this.syncStatus[paymentType] = status;
        this.updateUIStatus(paymentType, status);
    }

    // 更新UI显示状态
    updateUIStatus(paymentType, status) {
        const statusElement = document.getElementById(`${paymentType}-status`);
        if (statusElement) {
            statusElement.className = `status-badge ${status}`;
            statusElement.textContent = status === 'connected' ? '已连接' : '未连接';
        }
    }

    // 解除支付平台授权
    async disconnect(platform) {
        try {
            const response = await fetch('/api/payments/revoke-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.app.getToken()}`
                },
                body: JSON.stringify({ platform })
            });

            const data = await response.json();
            if (data.success) {
                this.updatePaymentStatus(platform, 'disconnected');
                this.app.showToast(`已断开${platform === 'wechat' ? '微信支付' : '支付宝'}连接`, 'success');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('断开连接失败:', error);
            this.app.showToast('断开连接失败', 'error');
        }
    }

    // 手动同步
    async manualSync() {
        this.app.showToast('开始手动同步支付数据...', 'info');
        await this.autoSyncTransactions();
    }
}

// 全局支付同步管理器实例
let paymentSyncManager = null;

// 初始化支付同步管理器
function initPaymentSync(app) {
    paymentSyncManager = new PaymentSyncManager(app);
    return paymentSyncManager;
}

// 连接微信支付
function connectWechatPay() {
    if (paymentSyncManager) {
        paymentSyncManager.updatePaymentStatus('wechat', 'connected');
    }
    
    const app = window.accountingApp;
    if (app) {
        app.showPaymentLoginPage('wechat');
    }
}

// 连接支付宝
function connectAlipay() {
    if (paymentSyncManager) {
        paymentSyncManager.updatePaymentStatus('alipay', 'connected');
    }
    
    const app = window.accountingApp;
    if (app) {
        app.showPaymentLoginPage('alipay');
    }
}

// 断开微信支付
function disconnectWechatPay() {
    if (paymentSyncManager) {
        paymentSyncManager.disconnect('wechat');
    }
}

// 断开支付宝
function disconnectAlipay() {
    if (paymentSyncManager) {
        paymentSyncManager.disconnect('alipay');
    }
}

// 手动同步支付数据
function manualSyncPayments() {
    if (paymentSyncManager) {
        paymentSyncManager.manualSync();
    }
}

module.exports = {
    initPaymentSync,
    connectWechatPay,
    connectAlipay,
    disconnectWechatPay,
    disconnectAlipay,
    manualSyncPayments
};