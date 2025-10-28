const mongoose = require('mongoose');

class Database {
  constructor() {
    this.isConnected = false;
    this.connection = null;
  }

  /**
   * 连接数据库
   */
  async connect() {
    if (this.isConnected) {
      return this.connection;
    }

    try {
      const mongoUri = process.env.NODE_ENV === 'test' 
        ? process.env.MONGODB_TEST_URI 
        : process.env.MONGODB_URI;

      if (!mongoUri) {
        throw new Error('MongoDB连接URI未配置');
      }

      // 连接选项
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
      };

      this.connection = await mongoose.connect(mongoUri, options);
      this.isConnected = true;

      console.log(`✅ MongoDB连接成功: ${this.connection.connection.host}`);
      console.log(`📊 数据库: ${this.connection.connection.name}`);
      console.log(`🌐 环境: ${process.env.NODE_ENV || 'development'}`);

      // 设置连接事件监听
      this.setupEventListeners();

      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB连接失败:', error.message);
      throw error;
    }
  }

  /**
   * 设置连接事件监听
   */
  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB连接已建立');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB连接错误:', err);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB连接已断开');
      this.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB连接已重新建立');
      this.isConnected = true;
    });
  }

  /**
   * 断开数据库连接
   */
  async disconnect() {
    if (this.isConnected) {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log('🔌 MongoDB连接已关闭');
    }
  }

  /**
   * 检查数据库连接状态
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection?.host,
      name: mongoose.connection?.name,
      models: Object.keys(mongoose.models || {}),
    };
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', message: '数据库未连接' };
      }

      // 执行简单的查询来验证连接
      await mongoose.connection.db.admin().ping();
      return { status: 'healthy', message: '数据库连接正常' };
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  }

  /**
   * 创建索引（用于性能优化）
   */
  async createIndexes() {
    try {
      console.log('📈 正在创建数据库索引...');
      
      // 获取所有模型并创建索引
      const models = Object.values(mongoose.models);
      
      for (const model of models) {
        await model.createIndexes();
        console.log(`✅ ${model.modelName} 索引创建完成`);
      }
      
      console.log('🎉 所有索引创建完成');
    } catch (error) {
      console.error('❌ 索引创建失败:', error);
      throw error;
    }
  }

  /**
   * 数据库初始化（创建默认数据等）
   */
  async initialize() {
    try {
      console.log('🚀 正在初始化数据库...');
      
      // 这里可以添加默认数据的创建逻辑
      // 例如：创建默认分类、系统配置等
      
      console.log('✅ 数据库初始化完成');
    } catch (error) {
      console.error('❌ 数据库初始化失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
const database = new Database();

module.exports = database;