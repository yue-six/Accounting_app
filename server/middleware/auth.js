const jwt = require('jsonwebtoken');
const User = require('../models/User');

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 认证中间件
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '访问令牌不存在'
            });
        }
        
        // 验证JWT令牌
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // 查找用户
        User.findById(decoded.userId)
            .then(user => {
                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: '用户不存在'
                    });
                }
                
                if (!user.isActive) {
                    return res.status(401).json({
                        success: false,
                        message: '用户账户已被禁用'
                    });
                }
                
                req.user = {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    profile: user.profile,
                    preferences: user.preferences
                };
                
                next();
            })
            .catch(error => {
                console.error('用户查找失败:', error);
                return res.status(500).json({
                    success: false,
                    message: '服务器内部错误'
                });
            });
            
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: '无效的访问令牌'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: '访问令牌已过期'
            });
        }
        
        console.error('令牌验证失败:', error);
        return res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

// 限流中间件
const rateLimit = (windowMs, maxRequests) => {
    const requests = new Map();
    
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // 清理过期请求
        for (const [key, timestamp] of requests.entries()) {
            if (timestamp < windowStart) {
                requests.delete(key);
            }
        }
        
        // 检查当前IP的请求次数
        const ipRequests = Array.from(requests.entries())
            .filter(([key, timestamp]) => key.startsWith(ip) && timestamp >= windowStart);
        
        if (ipRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: '请求过于频繁，请稍后再试'
            });
        }
        
        // 记录当前请求
        requests.set(`${ip}_${now}`, now);
        next();
    };
};

module.exports = {
    authenticateToken,
    rateLimit
};