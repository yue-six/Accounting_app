// 本地存储数据库模拟（用于开发环境）
class LocalDatabase {
    constructor() {
        this.isConnected = true; // 本地存储总是可用的
        this.dbName = 'accounting_app_local';
    }

    // 连接数据库
    async connect() {
        console.log('📁 使用本地存储数据库');
        return new Promise((resolve) => {
            setTimeout(() => {
                this.isConnected = true;
                resolve(this);
            }, 100);
        });
    }

    // 断开连接
    async disconnect() {
        this.isConnected = false;
        console.log('📁 本地存储数据库已断开');
    }

    // 保存数据
    async save(collection, data) {
        if (!this.isConnected) {
            throw new Error('数据库未连接');
        }

        const key = `${this.dbName}_${collection}`;
        const existingData = this.load(collection) || [];
        
        // 添加ID和时间戳
        const item = {
            ...data,
            _id: data._id || this.generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        existingData.push(item);
        localStorage.setItem(key, JSON.stringify(existingData));
        
        return item;
    }

    // 加载数据
    async find(collection, query = {}) {
        if (!this.isConnected) {
            throw new Error('数据库未连接');
        }

        const data = this.load(collection) || [];
        
        // 简单的查询过滤
        return data.filter(item => {
            for (let key in query) {
                if (item[key] !== query[key]) {
                    return false;
                }
            }
            return true;
        });
    }

    // 更新数据
    async update(collection, query, updateData) {
        if (!this.isConnected) {
            throw new Error('数据库未连接');
        }

        const data = this.load(collection) || [];
        const updatedData = data.map(item => {
            let match = true;
            for (let key in query) {
                if (item[key] !== query[key]) {
                    match = false;
                    break;
                }
            }
            
            if (match) {
                return {
                    ...item,
                    ...updateData,
                    updatedAt: new Date().toISOString()
                };
            }
            return item;
        });

        const key = `${this.dbName}_${collection}`;
        localStorage.setItem(key, JSON.stringify(updatedData));
        
        return updatedData.filter(item => {
            for (let key in query) {
                if (item[key] !== query[key]) {
                    return false;
                }
            }
            return true;
        });
    }

    // 删除数据
    async delete(collection, query) {
        if (!this.isConnected) {
            throw new Error('数据库未连接');
        }

        const data = this.load(collection) || [];
        const filteredData = data.filter(item => {
            for (let key in query) {
                if (item[key] !== query[key]) {
                    return true;
                }
            }
            return false;
        });

        const key = `${this.dbName}_${collection}`;
        localStorage.setItem(key, JSON.stringify(filteredData));
        
        return { deletedCount: data.length - filteredData.length };
    }

    // 从本地存储加载数据
    load(collection) {
        const key = `${this.dbName}_${collection}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 清空集合
    async clear(collection) {
        const key = `${this.dbName}_${collection}`;
        localStorage.removeItem(key);
        return { cleared: true };
    }

    // 获取集合统计
    async stats(collection) {
        const data = this.load(collection) || [];
        return {
            count: data.length,
            size: JSON.stringify(data).length,
            avgObjectSize: data.length > 0 ? JSON.stringify(data).length / data.length : 0
        };
    }
}

// 导出单例实例
const localDB = new LocalDatabase();

// 模拟Mongoose的模型方法
class LocalModel {
    constructor(collectionName) {
        this.collectionName = collectionName;
    }

    async find(query = {}) {
        return await localDB.find(this.collectionName, query);
    }

    async findOne(query = {}) {
        const results = await localDB.find(this.collectionName, query);
        return results.length > 0 ? results[0] : null;
    }

    async create(data) {
        return await localDB.save(this.collectionName, data);
    }

    async updateOne(query, updateData) {
        const results = await localDB.update(this.collectionName, query, updateData);
        return { modifiedCount: results.length };
    }

    async deleteOne(query) {
        const result = await localDB.delete(this.collectionName, query);
        return { deletedCount: result.deletedCount };
    }

    async countDocuments(query = {}) {
        const results = await localDB.find(this.collectionName, query);
        return results.length;
    }
}

// 导出模型工厂函数
function model(collectionName) {
    return new LocalModel(collectionName);
}

module.exports = {
    localDB,
    model,
    connect: () => localDB.connect(),
    disconnect: () => localDB.disconnect()
};