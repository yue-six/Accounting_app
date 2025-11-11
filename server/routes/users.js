const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, rateLimit } = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取用户信息
router.get('/profile', async (req, res) => {
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
          loginCount: user.loginCount,
          createdAt: user.createdAt
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

// 更新用户信息
router.put('/profile', [
  body('profile.fullName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('姓名不能超过50个字符'),
  body('profile.phone')
    .optional()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的手机号码'),
  body('profile.birthDate')
    .optional()
    .isISO8601()
    .withMessage('生日日期格式不正确'),
  body('profile.gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('性别必须是 male, female 或 other')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '用户信息验证失败',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.user._id);
    
    // 更新基本信息
    if (req.body.profile) {
      user.profile = { ...user.profile, ...req.body.profile };
    }

    await user.save();

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profile: user.profile,
          preferences: user.preferences,
          statistics: user.statistics
        }
      }
    });

  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '更新用户信息失败'
    });
  }
});

// 更新用户偏好设置
router.put('/preferences', [
  body('currency')
    .optional()
    .isIn(['CNY', 'USD', 'EUR', 'JPY'])
    .withMessage('货币类型不正确'),
  body('language')
    .optional()
    .isIn(['zh-CN', 'en-US'])
    .withMessage('语言设置不正确'),
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('主题设置不正确'),
  body('userMode')
    .optional()
    .isIn(['student', 'family', 'freelancer'])
    .withMessage('用户模式不正确')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '偏好设置验证失败',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.user._id);
    
    // 更新偏好设置
    if (req.body) {
      user.preferences = { ...user.preferences, ...req.body };
    }

    await user.save();

    res.json({
      success: true,
      message: '偏好设置更新成功',
      data: {
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('更新偏好设置错误:', error);
    res.status(500).json({
      success: false,
      message: '更新偏好设置失败'
    });
  }
});

// 更改密码
router.put('/change-password', [
  body('currentPassword')
    .notEmpty()
    .withMessage('当前密码不能为空'),
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
        message: '密码数据验证失败',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    // 验证当前密码
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: '当前密码不正确'
      });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: '密码修改成功'
    });

  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败'
    });
  }
});

// 导出用户数据
router.get('/export-data', async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    // 获取用户所有数据
    const Transaction = require('../models/Transaction');
    const Category = require('../models/Category');
    const Budget = require('../models/Budget');

    const [transactions, categories, budgets, user] = await Promise.all([
      Transaction.find({ userId: req.user._id, status: 'active' })
        .populate('categoryId', 'name icon color'),
      Category.find({
        $or: [
          { userId: req.user._id },
          { isDefault: true }
        ],
        isActive: true
      }),
      Budget.find({ userId: req.user._id }).populate('categoryId', 'name icon color'),
      User.findById(req.user._id).select('-password')
    ]);

    const exportData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        format: format,
        dataVersion: '1.0'
      },
      user: {
        profile: user.profile,
        preferences: user.preferences,
        statistics: user.statistics
      },
      categories,
      transactions,
      budgets
    };

    if (format === 'csv') {
      // 这里可以实现CSV格式导出
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=accounting-data.csv');
      // 返回JSON格式，实际应用中应该转换为CSV
      return res.json(exportData);
    }

    // 默认返回JSON格式
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=accounting-data.json');
    res.json(exportData);

  } catch (error) {
    console.error('导出数据错误:', error);
    res.status(500).json({
      success: false,
      message: '导出数据失败'
    });
  }
});

// 删除用户账户
router.delete('/account', [
  body('confirmPassword')
    .notEmpty()
    .withMessage('请输入密码确认删除操作')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '确认信息验证失败',
        errors: errors.array()
      });
    }

    const { confirmPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    // 验证密码
    const isPasswordValid = await user.comparePassword(confirmPassword);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: '密码不正确，删除操作取消'
      });
    }

    // 软删除用户账户（实际应用中可能需要更复杂的逻辑）
    user.isActive = false;
    await user.save();

    // 这里可以添加删除用户相关数据的逻辑
    // 例如：标记交易为已删除、清理敏感信息等

    res.json({
      success: true,
      message: '账户删除成功'
    });

  } catch (error) {
    console.error('删除账户错误:', error);
    res.status(500).json({
      success: false,
      message: '删除账户失败'
    });
  }
});

module.exports = router;