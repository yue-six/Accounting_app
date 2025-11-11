const express = require('express');
const { body, validationResult } = require('express-validator');
const Budget = require('../models/Budget');
const Category = require('../models/Category');
const { authenticateToken, rateLimit } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// 获取预算列表
router.get('/', async (req, res) => {
  try {
    const { status, period } = req.query;
    const query = { userId: req.user._id };

    if (status) query.status = status;
    if (period) query.period = period;

    const budgets = await Budget.find(query)
      .populate('categoryId', 'name icon color')
      .sort({ startDate: -1 });

    res.json({
      success: true,
      data: { budgets }
    });

  } catch (error) {
    console.error('获取预算列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取预算列表失败'
    });
  }
});

// 创建预算
router.post('/', [
  body('categoryId').isMongoId().withMessage('分类ID格式不正确'),
  body('amount').isFloat({ min: 0 }).withMessage('预算金额不能为负数'),
  body('period').isIn(['daily', 'weekly', 'monthly', 'yearly']).withMessage('预算周期不正确'),
  body('startDate').isISO8601().withMessage('开始日期格式不正确'),
  body('endDate').isISO8601().withMessage('结束日期格式不正确')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '预算数据验证失败',
        errors: errors.array()
      });
    }

    // 验证分类是否存在且是支出分类
    const category = await Category.findOne({
      _id: req.body.categoryId,
      type: 'expense',
      $or: [
        { userId: req.user._id },
        { isDefault: true }
      ]
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: '分类不存在或不是支出分类'
      });
    }

    const budget = new Budget({
      ...req.body,
      userId: req.user._id
    });

    await budget.save();
    await budget.populate('categoryId', 'name icon color');

    res.status(201).json({
      success: true,
      message: '预算创建成功',
      data: { budget }
    });

  } catch (error) {
    console.error('创建预算错误:', error);
    res.status(500).json({
      success: false,
      message: '创建预算失败'
    });
  }
});

// 更新预算
router.put('/:id', async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: '预算不存在'
      });
    }

    Object.assign(budget, req.body);
    await budget.save();
    await budget.populate('categoryId', 'name icon color');

    res.json({
      success: true,
      message: '预算更新成功',
      data: { budget }
    });

  } catch (error) {
    console.error('更新预算错误:', error);
    res.status(500).json({
      success: false,
      message: '更新预算失败'
    });
  }
});

// 删除预算
router.delete('/:id', async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: '预算不存在'
      });
    }

    await Budget.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: '预算删除成功'
    });

  } catch (error) {
    console.error('删除预算错误:', error);
    res.status(500).json({
      success: false,
      message: '删除预算失败'
    });
  }
});

// 获取预算统计
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await Budget.getUserBudgetStats(req.user._id);

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('获取预算统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取预算统计失败'
    });
  }
});

module.exports = router;