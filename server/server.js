require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const transactionRoutes = require('./routes/transactions');
const categoriesRoutes = require('./routes/categories');
const budgetRoutes = require('./routes/budgets');
const statsRoutes = require('./routes/stats');

const app = express();

// 安全中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 压缩中间件
app.use(compression());

// 日志中间件
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/stats', statsRoutes);

// API信息端点
app.get('/api', (req, res) => {
  res.json({
    name: process.env.APP_NAME || 'Accounting App API',
    version: process.env.APP_VERSION || '1.0.0',
    description: '智能记账应用后端API',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      transactions: '/api/transactions',
      categories: '/api/categories',
      budgets: '/api/budgets',
      stats: '/api/stats'
    },
    documentation: '/api/docs'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `路由 ${req.originalUrl} 不存在`,
    timestamp: new Date().toISOString()
  });
});

// 全局错误处理中间件
app.use((error, req, res, next) => {
  console.error('全局错误:', error);

  // Mongoose验证错误
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: errors
    });
  }

  // Mongoose重复键错误
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} 已存在`
    });
  }

  // JWT错误
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '无效的令牌'
    });
  }

  // JWT过期错误
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '令牌已过期'
    });
  }

  // 默认错误响应
  const statusCode = error.status || error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 数据库连接
const database = require('./config/database');

const connectDB = async () => {
  try {
    await database.connect();
    
    // 优雅关闭
    process.on('SIGINT', async () => {
      await database.disconnect();
      console.log('MongoDB连接已关闭');
      process.exit(0);
    });

  } catch (error) {
    console.error('MongoDB连接失败:', error);
    process.exit(1);
  }
};

// 启动服务器
const startServer = async () => {
  try {
    // 连接数据库
    await connectDB();

    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      console.log(`
🚀 服务器启动成功!
📍 环境: ${process.env.NODE_ENV || 'development'}
🌐 地址: http://localhost:${PORT}
📊 API文档: http://localhost:${PORT}/api
❤️  健康检查: http://localhost:${PORT}/health
      `);
    });

    // 优雅关闭
    const gracefulShutdown = (signal) => {
      console.log(`\n收到 ${signal} 信号，正在关闭服务器...`);
      server.close(() => {
        console.log('HTTP服务器已关闭');
        mongoose.connection.close(false, () => {
          console.log('MongoDB连接已关闭');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // 未处理异常捕获
    process.on('unhandledRejection', (err) => {
      console.error('未处理的Promise拒绝:', err);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

    process.on('uncaughtException', (err) => {
      console.error('未捕获的异常:', err);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

// 如果是直接运行此文件，则启动服务器
if (require.main === module) {
  startServer();
}

module.exports = app;