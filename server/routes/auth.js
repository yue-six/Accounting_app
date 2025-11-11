const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Category = require('../models/Category');
const { authenticateToken, rateLimit } = require('../middleware/auth');

const router = express.Router();

// 生成JWT令牌
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// 用户注册
router.post('/register', [
  rateLimit(15 * 60 * 1000, 5), // 15分钟内最多5次注册
  body('username')
    .isLength({ min: 2, max: 30 })
    .withMessage('用户名长度必须在2-30个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码至少需要6个字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码必须包含至少一个大写字母、一个小写字母和一个数字')
], async (req, res) => {
  try {
    // 检查验证错误
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '注册信息验证失败',
        errors: errors.array()
      });
    }

    const { username, email, password, profile } = req.body;

    // 检查用户名是否已存在
    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: '邮箱已被注册'
      });
    }

    // 创建新用户
    const user = new User({
      username,
      email,
      password,
      profile: profile || {}
    });

    await user.save();

    // 为用户创建默认分类
    await Category.createDefaultCategoriesForUser(user._id);

    // 生成令牌
    const token = generateToken(user._id);

    // 更新最后活动时间
    await user.updateLastActive();

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profile: user.profile,
          preferences: user.preferences,
          statistics: user.statistics
        },
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    });

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
});

// 用户登录
router.post('/login', [
  rateLimit(15 * 60 * 1000, 10), // 15分钟内最多10次登录尝试
  body('login')
    .notEmpty()
    .withMessage('请输入用户名或邮箱'),
  body('password')
    .notEmpty()
    .withMessage('请输入密码')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '登录信息验证失败',
        errors: errors.array()
      });
    }

    const { login, password } = req.body;

    // 查找用户（支持用户名或邮箱登录）
    const user = await User.findOne({
      $or: [
        { username: login },
        { email: login.toLowerCase() }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用，请联系管理员'
      });
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 生成令牌
    const token = generateToken(user._id);

    // 更新最后活动时间和登录次数
    await user.updateLastActive();

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profile: user.profile,
          preferences: user.preferences,
          statistics: user.statistics
        },
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profile: user.profile,
          preferences: user.preferences,
          statistics: user.statistics,
          lastLogin: user.lastLogin,
          loginCount: user.loginCount
        }
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

// 刷新令牌
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const token = generateToken(req.user._id);
    
    res.json({
      success: true,
      data: {
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    });
  } catch (error) {
    console.error('刷新令牌错误:', error);
    res.status(500).json({
      success: false,
      message: '刷新令牌失败'
    });
  }
});

// 用户登出（客户端删除令牌即可）
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // 在实际应用中，这里可以添加令牌黑名单逻辑
    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({
      success: false,
      message: '登出失败'
    });
  }
});

// 忘记密码 - 发送重置邮件
router.post('/forgot-password', [
  rateLimit(15 * 60 * 1000, 3), // 15分钟内最多3次请求
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '邮箱验证失败',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // 查找用户
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // 出于安全考虑，即使邮箱不存在也返回成功
      return res.json({
        success: true,
        message: '如果邮箱存在，重置链接已发送'
      });
    }

    // 生成重置令牌（实际应用中应该更复杂）
    const resetToken = jwt.sign(
      { userId: user._id, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 这里应该发送邮件
    console.log(`密码重置令牌 for ${email}: ${resetToken}`);

    res.json({
      success: true,
      message: '如果邮箱存在，重置链接已发送'
    });

  } catch (error) {
    console.error('忘记密码错误:', error);
    res.status(500).json({
      success: false,
      message: '发送重置邮件失败'
    });
  }
});

// 重置密码
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('重置令牌不能为空'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('新密码至少需要6个字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码必须包含至少一个大写字母、一个小写字母和一个数字')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '重置信息验证失败',
        errors: errors.array()
      });
    }

    const { token, newPassword } = req.body;

    // 验证重置令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({
        success: false,
        message: '无效的重置令牌'
      });
    }

    // 查找用户
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: '密码重置成功'
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        success: false,
        message: '无效的重置令牌'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: '重置令牌已过期'
      });
    }

    console.error('重置密码错误:', error);
    res.status(500).json({
      success: false,
      message: '密码重置失败'
    });
  }
});

module.exports = router;