const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT验证中间件
const authenticateToken = async (req, res, next) => {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 查找用户
    const user = await User.findById(decoded.userId).select('-password');
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

    // 将用户信息添加到请求对象
    req.user = user;
    next();
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

    console.error('认证中间件错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器认证错误'
    });
  }
};

// 可选认证中间件（不强制要求认证）
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (user && user.isActive) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // 忽略认证错误，继续处理请求
    next();
  }
};

// 管理员权限检查中间件
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }
  next();
};

// 用户权限检查（只能操作自己的数据）
const requireOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      // 管理员可以访问所有数据
      if (req.user.role === 'admin') {
        return next();
      }

      let resource;
      switch (resourceType) {
        case 'user':
          if (req.params.userId && req.params.userId !== req.user._id.toString()) {
            return res.status(403).json({
              success: false,
              message: '只能访问自己的用户数据'
            });
          }
          break;

        case 'transaction':
          resource = await Transaction.findById(req.params.id);
          if (!resource) {
            return res.status(404).json({
              success: false,
              message: '交易记录不存在'
            });
          }
          if (resource.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
              success: false,
              message: '只能访问自己的交易记录'
            });
          }
          break;

        case 'category':
          resource = await Category.findById(req.params.id);
          if (!resource) {
            return res.status(404).json({
              success: false,
              message: '分类不存在'
            });
          }
          if (resource.userId && resource.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
              success: false,
              message: '只能访问自己的分类'
            });
          }
          break;

        case 'budget':
          resource = await Budget.findById(req.params.id);
          if (!resource) {
            return res.status(404).json({
              success: false,
              message: '预算不存在'
            });
          }
          if (resource.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
              success: false,
              message: '只能访问自己的预算'
            });
          }
          break;

        default:
          return res.status(400).json({
            success: false,
            message: '无效的资源类型'
          });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('权限检查错误:', error);
      res.status(500).json({
        success: false,
        message: '权限检查失败'
      });
    }
  };
};

// 速率限制中间件（简单实现）
const rateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const clientIP = req.ip || req.connection.remoteAddress;
    const windowStart = now - windowMs;

    // 清理过期记录
    for (const [ip, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
      if (validTimestamps.length === 0) {
        requests.delete(ip);
      } else {
        requests.set(ip, validTimestamps);
      }
    }

    // 检查当前IP的请求次数
    const clientRequests = requests.get(clientIP) || [];
    if (clientRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: '请求过于频繁，请稍后再试',
        retryAfter: Math.ceil((clientRequests[0] + windowMs - now) / 1000)
      });
    }

    // 记录当前请求
    clientRequests.push(now);
    requests.set(clientIP, clientRequests);

    // 添加速率限制头信息
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': maxRequests - clientRequests.length,
      'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
    });

    next();
  };
};

// 验证中间件
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: '请求数据验证失败',
        errors: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuthenticate,
  requireAdmin,
  requireOwnership,
  rateLimit,
  validateRequest
};