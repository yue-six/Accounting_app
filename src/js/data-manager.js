/**
 * 数据管理器
 * 统一管理应用中的数据操作和存储
 */

class DataManager {
    constructor(app) {
        this.app = app;
        this.storageKey = 'accounting_app_data';
        this.backupKey = 'accounting_app_backup';
        this.autoSaveInterval = null;
    }

    /**
     * 初始化数据管理器
     */
    async init() {
        // 启动自动保存
        this.startAutoSave();
        
        // 检查数据完整性
        await this.checkDataIntegrity();
        
        console.log('✅ 数据管理器初始化完成');
        return true;
    }

    /**
     * 加载数据
     */
    async loadData() {
        try {
            // 尝试从本地存储加载
            const savedData = localStorage.getItem(this.storageKey);
            
            if (savedData) {
                const data = JSON.parse(savedData);
                
                // 验证数据格式
                if (this.validateData(data)) {
                    return data;
                } else {
                    console.warn('数据格式无效，使用默认数据');
                    return this.getDefaultData();
                }
            }
            
            // 如果没有保存的数据，返回默认数据
            return this.getDefaultData();
            
        } catch (error) {
            console.error('数据加载失败:', error);
            return this.getDefaultData();
        }
    }

    /**
     * 保存数据
     */
    async saveData(data) {
        try {
            // 验证数据
            if (!this.validateData(data)) {
                throw new Error('数据格式无效');
            }

            // 创建备份
            await this.createBackup();
            
            // 保存到本地存储
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            
            // 更新最后保存时间
            data.lastSaved = new Date().toISOString();
            
            console.log('💾 数据保存成功');
            return true;
            
        } catch (error) {
            console.error('数据保存失败:', error);
            
            // 尝试恢复备份
            await this.restoreBackup();
            return false;
        }
    }

    /**
     * 验证数据格式
     */
    validateData(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }

        // 检查必需字段
        const requiredFields = ['transactions', 'categories', 'budgets', 'userMode'];
        for (const field of requiredFields) {
            if (!data.hasOwnProperty(field)) {
                return false;
            }
        }

        // 验证交易记录格式
        if (!Array.isArray(data.transactions)) {
            return false;
        }

        // 验证分类格式
        if (!Array.isArray(data.categories)) {
            return false;
        }

        return true;
    }

    /**
     * 获取默认数据
     */
    getDefaultData() {
        return {
            transactions: [],
            categories: [
                { id: 'food', name: '餐饮', color: '#ff6b6b', icon: '🍽️' },
                { id: 'transport', name: '交通', color: '#4ecdc4', icon: '🚗' },
                { id: 'shopping', name: '购物', color: '#45b7d1', icon: '🛍️' },
                { id: 'entertainment', name: '娱乐', color: '#96ceb4', icon: '🎮' },
                { id: 'study', name: '学习', color: '#feca57', icon: '📚' },
                { id: 'salary', name: '工资', color: '#4fd1c5', icon: '💰' },
                { id: 'investment', name: '投资', color: '#667eea', icon: '📈' },
                { id: 'other', name: '其他', color: '#a0aec0', icon: '📦' }
            ],
            budgets: {},
            userMode: 'student',
            settings: {
                currency: 'CNY',
                language: 'zh-CN',
                theme: 'light',
                autoBackup: true,
                backupInterval: 24 // 小时
            },
            createdAt: new Date().toISOString(),
            lastSaved: new Date().toISOString()
        };
    }

    /**
     * 创建数据备份
     */
    async createBackup() {
        try {
            const currentData = localStorage.getItem(this.storageKey);
            if (currentData) {
                const backupData = {
                    data: JSON.parse(currentData),
                    timestamp: new Date().toISOString(),
                    version: '1.0'
                };
                
                localStorage.setItem(this.backupKey, JSON.stringify(backupData));
                console.log('📦 数据备份创建成功');
            }
        } catch (error) {
            console.error('备份创建失败:', error);
        }
    }

    /**
     * 恢复备份数据
     */
    async restoreBackup() {
        try {
            const backupData = localStorage.getItem(this.backupKey);
            if (backupData) {
                const backup = JSON.parse(backupData);
                
                if (this.validateData(backup.data)) {
                    localStorage.setItem(this.storageKey, JSON.stringify(backup.data));
                    console.log('🔄 数据恢复成功');
                    return true;
                }
            }
        } catch (error) {
            console.error('数据恢复失败:', error);
        }
        return false;
    }

    /**
     * 导出数据
     */
    async exportData() {
        try {
            const data = await this.loadData();
            
            // 导出为 JSON
            const exportJson = {
                ...data,
                exportInfo: {
                    exportedAt: new Date().toISOString(),
                    version: '1.0',
                    recordCount: data.transactions.length
                }
            };

            // 导出为 DOCX（示例逻辑，需根据实际库调整）
            const exportDocx = async () => {
                const { Packer } = require('docx');
                const { Document, Paragraph, TextRun } = require('docx');
                
                const doc = new Document({
                    sections: [{
                        properties: {},
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: '账单数据导出',
                                        bold: true
                                    })
                                ]
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: JSON.stringify(data.transactions, null, 2)
                                    })
                                ]
                            })
                        ]
                    }]
                });
                
                const buffer = await Packer.toBuffer(doc);
                return buffer;
            };

            // 创建下载链接（JSON）
            const jsonStr = JSON.stringify(exportJson, null, 2);
            const jsonBlob = new Blob([jsonStr], { type: 'application/json' });
            
            const jsonLink = document.createElement('a');
            jsonLink.href = URL.createObjectURL(jsonBlob);
            jsonLink.download = `accounting_data_${new Date().toISOString().split('T')[0]}.json`;
            jsonLink.click();
            
            // 创建下载链接（DOCX）
            const docxBuffer = await exportDocx();
            const docxBlob = new Blob([docxBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            
            const docxLink = document.createElement('a');
            docxLink.href = URL.createObjectURL(docxBlob);
            docxLink.download = `accounting_data_${new Date().toISOString().split('T')[0]}.docx`;
            docxLink.click();
            
            // 清理URL
            setTimeout(() => {
                URL.revokeObjectURL(jsonLink.href);
                URL.revokeObjectURL(docxLink.href);
            }, 100);
            
            console.log('📤 数据导出成功');
            return true;
            
        } catch (error) {
            console.error('数据导出失败:', error);
            return false;
        }
    }

    /**
     * 导入数据
     */
    async importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    let importedData;
                    
                    // 尝试解析为 JSON
                    try {
                        importedData = JSON.parse(e.target.result);
                        if (!this.validateData(importedData)) {
                            throw new Error('JSON 格式无效');
                        }
                    } catch (jsonError) {
                        // 尝试解析为微信或支付宝账单格式
                        importedData = this.parseWechatOrAlipayBill(e.target.result);
                    }
                    
                    // 创建备份
                    await this.createBackup();
                    
                    // 保存导入的数据
                    await this.saveData(importedData);
                    
                    console.log('📥 数据导入成功');
                    resolve(true);
                    
                } catch (error) {
                    console.error('数据导入失败:', error);
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    }
    
    /**
     * 解析微信或支付宝账单
     */
    parseWechatOrAlipayBill(csvData) {
        const lines = csvData.split('\n');
        const transactions = [];
        
        // 解析微信账单
        if (lines[0].includes('微信支付账单明细')) {
            for (let i = 1; i < lines.length; i++) {
                const fields = lines[i].split(',');
                if (fields.length >= 10) {
                    transactions.push({
                        id: this.generateId(),
                        amount: parseFloat(fields[5]) || 0,
                        type: fields[4].includes('收入') ? 'income' : 'expense',
                        category: this.detectCategory(fields[7]),
                        date: fields[0],
                        description: fields[7]
                    });
                }
            }
        } 
        // 解析支付宝账单
        else if (lines[0].includes('支付宝交易记录明细')) {
            for (let i = 1; i < lines.length; i++) {
                const fields = lines[i].split(',');
                if (fields.length >= 8) {
                    transactions.push({
                        id: this.generateId(),
                        amount: parseFloat(fields[5]) || 0,
                        type: fields[4].includes('收入') ? 'income' : 'expense',
                        category: this.detectCategory(fields[7]),
                        date: fields[2],
                        description: fields[7]
                    });
                }
            }
        } else {
            throw new Error('不支持的文件格式');
        }
        
        return {
            transactions,
            categories: this.getDefaultData().categories,
            budgets: {},
            userMode: 'student',
            settings: this.getDefaultData().settings
        };
    }
    
    /**
     * 根据描述自动分类
     */
    detectCategory(description) {
        const categories = this.getDefaultData().categories;
        
        if (description.includes('餐饮')) return 'food';
        if (description.includes('交通')) return 'transport';
        if (description.includes('购物')) return 'shopping';
        if (description.includes('娱乐')) return 'entertainment';
        if (description.includes('工资')) return 'salary';
        
        return 'other';
    }
    }

    /**
     * 清除所有数据
     */
    async clearData() {
        try {
            // 创建最终备份
            await this.createBackup();
            
            // 清除本地存储
            localStorage.removeItem(this.storageKey);
            
            console.log('🗑️ 数据清除完成');
            return true;
            
        } catch (error) {
            console.error('数据清除失败:', error);
            return false;
        }
    }

    /**
     * 获取数据统计
     */
    async getDataStats() {
        const data = await this.loadData();
        
        const totalTransactions = data.transactions.length;
        const totalIncome = data.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = data.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const categoryStats = {};
        data.categories.forEach(cat => {
            const amount = data.transactions
                .filter(t => t.category === cat.id && t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            categoryStats[cat.id] = amount;
        });

        return {
            totalTransactions,
            totalIncome,
            totalExpense,
            netBalance: totalIncome - totalExpense,
            categoryStats,
            dataSize: JSON.stringify(data).length,
            lastSaved: data.lastSaved
        };
    }

    /**
     * 检查数据完整性
     */
    async checkDataIntegrity() {
        try {
            const data = await this.loadData();
            
            let issues = [];
            
            // 检查交易记录完整性
            data.transactions.forEach((t, index) => {
                if (!t.id || !t.amount || !t.type || !t.category || !t.date) {
                    issues.push(`交易记录 ${index} 缺少必需字段`);
                }
                
                if (t.amount <= 0) {
                    issues.push(`交易记录 ${index} 金额无效`);
                }
            });
            
            // 检查分类完整性
            const categoryIds = data.categories.map(c => c.id);
            data.transactions.forEach(t => {
                if (!categoryIds.includes(t.category)) {
                    issues.push(`交易记录使用无效分类: ${t.category}`);
                }
            });
            
            if (issues.length > 0) {
                console.warn('数据完整性检查发现问题:', issues);
                
                // 自动修复简单问题
                await this.autoFixDataIssues(data, issues);
            } else {
                console.log('✅ 数据完整性检查通过');
            }
            
            return issues;
            
        } catch (error) {
            console.error('数据完整性检查失败:', error);
            return ['数据完整性检查失败'];
        }
    }

    /**
     * 自动修复数据问题
     */
    async autoFixDataIssues(data, issues) {
        let fixed = false;
        
        // 修复缺失ID的交易记录
        data.transactions.forEach(t => {
            if (!t.id) {
                t.id = this.generateId();
                fixed = true;
            }
        });
        
        // 修复无效分类
        const validCategories = data.categories.map(c => c.id);
        data.transactions.forEach(t => {
            if (!validCategories.includes(t.category)) {
                t.category = 'other';
                fixed = true;
            }
        });
        
        if (fixed) {
            await this.saveData(data);
            console.log('🔧 数据问题已自动修复');
        }
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 启动自动保存
     */
    startAutoSave() {
        // 每5分钟自动保存一次
        this.autoSaveInterval = setInterval(async () => {
            if (this.app && this.app.transactions) {
                const data = {
                    transactions: this.app.transactions,
                    categories: this.app.categories,
                    budgets: this.app.budgets,
                    userMode: this.app.userMode,
                    settings: this.app.settings || {}
                };
                
                await this.saveData(data);
            }
        }, 5 * 60 * 1000); // 5分钟
        
        console.log('⏰ 自动保存已启动');
    }

    /**
     * 停止自动保存
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            console.log('⏹️ 自动保存已停止');
        }
    }

    /**
     * 获取存储使用情况
     */
    getStorageUsage() {
        const data = localStorage.getItem(this.storageKey);
        const size = data ? new Blob([data]).size : 0;
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        return {
            used: size,
            max: maxSize,
            percentage: (size / maxSize) * 100
        };
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
} else {
    window.DataManager = DataManager;
}