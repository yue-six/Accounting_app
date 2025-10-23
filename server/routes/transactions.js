const express = require('express');
const { body, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Budget = require('../models/Budget');
const { authenticateToken, requireOwnership, rateLimit } = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取交易列表
router.get('/', [
  rateLimit(15 * 60 * 1000, 100) // 15分钟内最多100次请求
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      categoryId,
      startDate,
      endDate,
      paymentMethod,
      sortBy = 'transactionDate',
      sortOrder = 'desc'
    } = req.query;

    // 构建查询条件
    const query = { userId: req.user._id, status: 'active' };

    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    // 日期范围查询
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate);
      if (endDate) query.transactionDate.$lte = new Date(endDate);
    }

    // 排序
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // 分页
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const transactions = await Transaction.find(query)
      .populate('categoryId', 'name icon color')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
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

// 获取单个交易详情
router.get('/:id', requireOwnership('transaction'), async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('categoryId', 'name icon color');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: '交易记录不存在'
      });
    }

    res.json({
      success: true,
      data: { transaction }
    });

  } catch (error) {
    console.error('获取交易详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取交易详情失败'
    });
  }
});

// 创建新交易
router.post('/', [
  rateLimit(15 * 60 * 1000, 50), // 15分钟内最多50次创建
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('交易类型必须是 income 或 expense'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('交易金额必须大于0'),
  body('categoryId')
    .isMongoId()
    .withMessage('分类ID格式不正确'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('交易描述不能为空且不超过200个字符'),
  body('transactionDate')
    .isISO8601()
    .withMessage('交易日期格式不正确')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '交易数据验证失败',
        errors: errors.array()
      });
    }

    const {
      type,
      amount,
      categoryId,
      description,
      transactionDate,
      merchant,
      location,
      paymentMethod,
      tags,
      notes,
      isRecurring,
      recurringSettings
    } = req.body;

    // 验证分类是否存在且属于当前用户
    const category = await Category.findOne({
      _id: categoryId,
      $or: [
        { userId: req.user._id },
        { isDefault: true }
      ]
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: '分类不存在或无权访问'
      });
    }

    // 验证分类类型匹配
    if (category.type !== type) {
      return res.status(400).json({
        success: false,
        message: `分类类型不匹配，请选择${type === 'income' ? '收入' : '支出'}分类`
      });
    }

    // 创建交易
    const transaction = new Transaction({
      userId: req.user._id,
      type,
      amount: parseFloat(amount),
      categoryId,
      description: description.trim(),
      transactionDate: new Date(transactionDate),
      merchant: merchant?.trim(),
      location,
      paymentMethod: paymentMethod || 'other',
      tags: Array.isArray(tags) ? tags.map(tag => tag.trim()).filter(tag => tag) : [],
      notes: notes?.trim(),
      isRecurring: Boolean(isRecurring),
      recurringSettings: isRecurring ? recurringSettings : undefined
    });

    await transaction.save();
    await transaction.populate('categoryId', 'name icon color');

    // 更新相关预算的实际支出
    if (type === 'expense') {
      const budgets = await Budget.find({
        userId: req.user._id,
        categoryId: categoryId,
        status: 'active',
        startDate: { $lte: transaction.transactionDate },
        endDate: { $gte: transaction.transactionDate }
      });

      for (const budget of budgets) {
        await budget.updateActualSpent();
      }
    }

    res.status(201).json({
      success: true,
      message: '交易创建成功',
      data: { transaction }
    });

  } catch (error) {
    console.error('创建交易错误:', error);
    res.status(500).json({
      success: false,
      message: '创建交易失败'
    });
  }
});

// 更新交易
router.put('/:id', [
  requireOwnership('transaction'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('交易金额必须大于0'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('交易描述不能为空且不超过200个字符'),
  body('transactionDate')
    .optional()
    .isISO8601()
    .withMessage('交易日期格式不正确')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '交易数据验证失败',
        errors: errors.array()
      });
    }

    const updates = req.body;
    const transaction = req.resource;

    // 如果更新了分类，需要验证新分类
    if (updates.categoryId) {
      const category = await Category.findOne({
        _id: updates.categoryId,
        $or: [
          { userId: req.user._id },
          { isDefault: true }
        ]
      });

      if (!category) {
        return res.status(400).json({
          success: false,
          message: '分类不存在或无权访问'
        });
      }

      // 验证分类类型匹配
      if (category.type !== (updates.type || transaction.type)) {
        return res.status(400).json({
          success: false,
          message: `分类类型不匹配`
        });
      }
    }

    // 更新交易
    Object.keys(updates).forEach(key => {
      if (['amount', 'categoryId', 'description', 'transactionDate', 'merchant', 
           'paymentMethod', 'tags', 'notes'].includes(key)) {
        transaction[key] = updates[key];
      }
    });

    await transaction.save();
    await transaction.populate('categoryId', 'name icon color');

    // 更新相关预算
    if (transaction.type === 'expense') {
      const budgets = await Budget.find({
        userId: req.user._id,
        categoryId: transaction.categoryId,
        status: 'active',
        startDate: { $lte: transaction.transactionDate },
        endDate: { $gte: transaction.transactionDate }
      });

      for (const budget of budgets) {
        await budget.updateActualSpent();
      }
    }

    res.json({
      success: true,
      message: '交易更新成功',
      data: { transaction }
    });

  } catch (error) {
    console.error('更新交易错误:', error);
    res.status(500).json({
      success: false,
      message: '更新交易失败'
    });
  }
});

// 删除交易（软删除）
router.delete('/:id', requireOwnership('transaction'), async (req, res) => {
  try {
    const transaction = req.resource;
    
    // 软删除
    await transaction.softDelete();

    res.json({
      success: true,
      message: '交易删除成功'
    });

  } catch (error) {
    console.error('删除交易错误:', error);
    res.status(500).json({
      success: false,
      message: '删除交易失败'
    });
  }
});

// 批量导入交易
router.post('/batch', [
  rateLimit(15 * 60 * 1000, 10), // 15分钟内最多10次批量导入
  body('transactions')
    .isArray({ min: 1, max: 100 })
    .withMessage('交易数据必须是包含1-100条记录的数组')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '批量导入数据验证失败',
        errors: errors.array()
      });
    }

    const { transactions } = req.body;
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // 批量处理交易
    for (let i = 0; i < transactions.length; i++) {
      try {
        const txData = transactions[i];
        
        // 验证分类
        const category = await Category.findOne({
          _id: txData.categoryId,
          $or: [
            { userId: req.user._id },
            { isDefault: true }
          ]
        });

        if (!category) {
          throw new Error('分类不存在或无权访问');
        }

        if (category.type !== txData.type) {
          throw new Error('分类类型不匹配');
        }

        const transaction = new Transaction({
          userId: req.user._id,
          ...txData,
          transactionDate: new Date(txData.transactionDate)
        });

        await transaction.save();
        results.success++;

      } catch (error) {
        results.failed++;
        results.errors.push({
          index: i,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `批量导入完成，成功: ${results.success}, 失败: ${results.failed}`,
      data: results
    });

  } catch (error) {
    console.error('批量导入交易错误:', error);
    res.status(500).json({
      success: false,
      message: '批量导入交易失败'
    });
  }
});

// 获取交易统计
router.get('/stats/summary', async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    const stats = await Transaction.getUserStats(
      req.user._id,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('获取交易统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取交易统计失败'
    });
  }
});

// 获取分类统计
router.get('/stats/categories', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const categoryStats = await Transaction.getCategoryStats(
      req.user._id,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: { categoryStats }
    });

  } catch (error) {
    console.error('获取分类统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取分类统计失败'
    });
  }
});

module.exports = router;