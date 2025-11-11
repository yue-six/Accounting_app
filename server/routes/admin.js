const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 管理员认证中间件
const adminAuth = (req, res, next) => {
    try {
        // 从请求头获取Authorization令牌
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: '未提供认证令牌'
            });
        }
        
        // 提取并验证JWT令牌
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        
        // 检查是否为管理员
        if (!decoded.isAdmin) {
            return res.status(403).json({
                success: false,
                message: '权限不足，需要管理员权限'
            });
        }
        
        // 将管理员信息附加到请求对象
        req.admin = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: '认证令牌已过期'
            });
        }
        return res.status(401).json({
            success: false,
            message: '认证令牌无效'
        });
    }
};

// 管理员登录路由
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 验证输入
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '请提供用户名和密码'
            });
        }
        
        // 这里应该从数据库获取管理员信息
        // 暂时使用硬编码的管理员凭据（实际应用中应该存储在数据库中并使用bcrypt加密密码）
        const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
        const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || 
            '$2a$10$eP48t2QJZg3rWVYrBfWf2O5jH3X6vWjQ6VZ6vWjQ6VZ6vWjQ6VZ6vWjQ'; // 对应密码 'admin123'
        
        // 验证用户名和密码
        if (username !== ADMIN_USERNAME) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }
        
        // 验证密码（实际应用中应该使用bcrypt.compare）
        const isMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }
        
        // 生成JWT令牌
        const token = jwt.sign(
            {
                username: ADMIN_USERNAME,
                isAdmin: true
            },
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            {
                expiresIn: '24h' // 令牌有效期24小时
            }
        );
        
        res.json({
            success: true,
            message: '登录成功',
            data: {
                token,
                expiresIn: 86400 // 24小时的秒数
            }
        });
    } catch (error) {
        console.error('管理员登录错误:', error);
        res.status(500).json({
            success: false,
            message: '登录失败，请稍后再试'
        });
    }
});

// 管理员登出路由
router.post('/logout', adminAuth, (req, res) => {
    // 在实际应用中，可以将令牌添加到黑名单
    // 这里简单返回成功信息
    res.json({
        success: true,
        message: '登出成功'
    });
});

// 获取系统概览统计
router.get('/dashboard', adminAuth, async (req, res) => {
    try {
        // 获取用户统计
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        
        // 获取交易统计
        const totalTransactions = await Transaction.countDocuments();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTransactions = await Transaction.countDocuments({
            createdAt: { $gte: today }
        });
        
        // 获取收入支出统计
        const incomeResult = await Transaction.aggregate([
            { $match: { type: 'income' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        const expenseResult = await Transaction.aggregate([
            { $match: { type: 'expense' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        const totalIncome = incomeResult.length > 0 ? incomeResult[0].total : 0;
        const totalExpense = expenseResult.length > 0 ? expenseResult[0].total : 0;
        
        res.json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    activeUsers,
                    totalTransactions,
                    todayTransactions,
                    totalIncome,
                    totalExpense
                },
                charts: {
                    // 月度趋势数据
                    monthlyTrend: await getMonthlyTrendData(),
                    // 分类分布数据
                    categoryDistribution: await getCategoryDistributionData()
                }
            }
        });
        
    } catch (error) {
        console.error('获取系统概览错误:', error);
        res.status(500).json({
            success: false,
            message: '获取系统数据失败'
        });
    }
});

// 获取用户列表
router.get('/users', adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = '' } = req.query;
        
        // 构建查询条件
        const query = {};
        
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (status) {
            query.isActive = status === 'active';
        }
        
        // 分页查询
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const users = await User.find(query)
            .select('-password') // 不返回密码
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await User.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit)),
                    total
                }
            }
        });
        
    } catch (error) {
        console.error('获取用户列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取用户列表失败'
        });
    }
});

// 获取用户详情
router.get('/users/:id', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        // 获取用户的交易统计
        const transactionStats = await Transaction.aggregate([
            { $match: { userId: user._id } },
            { 
                $group: { 
                    _id: '$type',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);
        
        res.json({
            success: true,
            data: {
                user,
                stats: transactionStats
            }
        });
        
    } catch (error) {
        console.error('获取用户详情错误:', error);
        res.status(500).json({
            success: false,
            message: '获取用户详情失败'
        });
    }
});

// 更新用户状态
router.patch('/users/:id/status', adminAuth, async (req, res) => {
    try {
        const { isActive } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        res.json({
            success: true,
            message: `用户状态已${isActive ? '激活' : '停用'}`,
            data: user
        });
        
    } catch (error) {
        console.error('更新用户状态错误:', error);
        res.status(500).json({
            success: false,
            message: '更新用户状态失败'
        });
    }
});

// 获取交易列表
router.get('/transactions', adminAuth, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search = '', 
            type = '', 
            category = '',
            startDate = '',
            endDate = ''
        } = req.query;
        
        // 构建查询条件
        const query = {};
        
        if (search) {
            query.description = { $regex: search, $options: 'i' };
        }
        
        if (type) {
            query.type = type;
        }
        
        if (category) {
            query.category = category;
        }
        
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        // 分页查询
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const transactions = await Transaction.find(query)
            .populate('userId', 'username email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Transaction.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                transactions,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit)),
                    total
                }
            }
        });
        
    } catch (error) {
        console.error('获取交易列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取交易列表失败'
        });
    }
});

// 获取交易详情
router.get('/transactions/:id', adminAuth, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id)
            .populate('userId', 'username email');
        
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: '交易记录不存在'
            });
        }
        
        res.json({
            success: true,
            data: transaction
        });
        
    } catch (error) {
        console.error('获取交易详情错误:', error);
        res.status(500).json({
            success: false,
            message: '获取交易详情失败'
        });
    }
});

// 删除交易记录
router.delete('/transactions/:id', adminAuth, async (req, res) => {
    try {
        const transaction = await Transaction.findByIdAndDelete(req.params.id);
        
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: '交易记录不存在'
            });
        }
        
        res.json({
            success: true,
            message: '交易记录删除成功'
        });
        
    } catch (error) {
        console.error('删除交易记录错误:', error);
        res.status(500).json({
            success: false,
            message: '删除交易记录失败'
        });
    }
});

// 获取系统分析数据
router.get('/analytics', adminAuth, async (req, res) => {
    try {
        const { period = 'month' } = req.query; // month, week, year
        
        const analyticsData = {
            userGrowth: await getUserGrowthData(period),
            transactionTrend: await getTransactionTrendData(period),
            categoryAnalysis: await getCategoryAnalysisData(),
            revenueAnalysis: await getRevenueAnalysisData(period)
        };
        
        res.json({
            success: true,
            data: analyticsData
        });
        
    } catch (error) {
        console.error('获取分析数据错误:', error);
        res.status(500).json({
            success: false,
            message: '获取分析数据失败'
        });
    }
});

// 获取最近活动
router.get('/activities', adminAuth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        // 获取最新的用户注册
        const recentUsers = await User.find()
            .select('username email createdAt')
            .sort({ createdAt: -1 })
            .limit(limit);
        
        // 获取最新的交易记录
        const recentTransactions = await Transaction.find()
            .populate('userId', 'username')
            .select('type amount description createdAt')
            .sort({ createdAt: -1 })
            .limit(limit);
        
        const activities = [
            ...recentUsers.map(user => ({
                type: 'user',
                message: `新用户 ${user.username} 注册成功`,
                timestamp: user.createdAt,
                user: { username: user.username, email: user.email }
            })),
            ...recentTransactions.map(transaction => ({
                type: 'transaction',
                message: `用户 ${transaction.userId.username} 完成了一笔 ${transaction.type === 'income' ? '收入' : '支出'}交易`,
                timestamp: transaction.createdAt,
                amount: transaction.amount,
                description: transaction.description
            }))
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
         .slice(0, limit);
        
        res.json({
            success: true,
            data: activities
        });
        
    } catch (error) {
        console.error('获取活动记录错误:', error);
        res.status(500).json({
            success: false,
            message: '获取活动记录失败'
        });
    }
});

// 辅助函数：获取月度趋势数据
async function getMonthlyTrendData() {
    const months = [];
    const incomeData = [];
    const expenseData = [];
    
    // 获取最近6个月的数据
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        // 收入统计
        const incomeResult = await Transaction.aggregate([
            { 
                $match: { 
                    type: 'income',
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        // 支出统计
        const expenseResult = await Transaction.aggregate([
            { 
                $match: { 
                    type: 'expense',
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        months.push(`${year}年${month}月`);
        incomeData.push(incomeResult.length > 0 ? incomeResult[0].total : 0);
        expenseData.push(expenseResult.length > 0 ? expenseResult[0].total : 0);
    }
    
    return { months, incomeData, expenseData };
}

// 辅助函数：获取分类分布数据
async function getCategoryDistributionData() {
    const categories = ['food', 'transport', 'shopping', 'entertainment', 'study', 'medical', 'salary', 'investment', 'other'];
    const categoryNames = {
        food: '餐饮',
        transport: '交通',
        shopping: '购物',
        entertainment: '娱乐',
        study: '学习',
        medical: '医疗',
        salary: '工资',
        investment: '投资',
        other: '其他'
    };
    
    const result = await Transaction.aggregate([
        { $match: { type: 'expense' } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);
    
    const distribution = categories.map(category => {
        const found = result.find(item => item._id === category);
        return {
            category: categoryNames[category] || category,
            value: found ? found.total : 0
        };
    }).filter(item => item.value > 0);
    
    return distribution;
}

// 辅助函数：获取用户增长数据
async function getUserGrowthData(period) {
    // 简化实现，返回模拟数据
    return Array.from({length: 12}, (_, i) => ({
        month: `${i + 1}月`,
        count: Math.floor(Math.random() * 100) + 50
    }));
}

// 辅助函数：获取交易趋势数据
async function getTransactionTrendData(period) {
    // 简化实现，返回模拟数据
    return Array.from({length: 12}, (_, i) => ({
        month: `${i + 1}月`,
        income: Math.floor(Math.random() * 10000) + 5000,
        expense: Math.floor(Math.random() * 8000) + 3000
    }));
}

// 辅助函数：获取分类分析数据
async function getCategoryAnalysisData() {
    // 简化实现，返回模拟数据
    return [
        { category: '餐饮', percentage: 25, amount: 25000 },
        { category: '交通', percentage: 15, amount: 15000 },
        { category: '购物', percentage: 20, amount: 20000 },
        { category: '娱乐', percentage: 10, amount: 10000 },
        { category: '学习', percentage: 8, amount: 8000 },
        { category: '医疗', percentage: 5, amount: 5000 },
        { category: '其他', percentage: 17, amount: 17000 }
    ];
}

// 辅助函数：获取收入分析数据
async function getRevenueAnalysisData(period) {
    // 简化实现，返回模拟数据
    return {
        totalRevenue: 150000,
        totalExpense: 120000,
        netIncome: 30000,
        growthRate: 8.5
    };
}

module.exports = router;