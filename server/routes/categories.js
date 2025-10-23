const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { authenticateToken, rateLimit } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// 获取分类列表
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const query = {
      $or: [
        { userId: req.user._id },
        { isDefault: true }
      ],
      isActive: true
    };

    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }

    const categories = await Category.find(query).sort({ sortOrder: 1, name: 1 });

    res.json({
      success: true,
      data: { categories }
    });

  } catch (error) {
    console.error('获取分类列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取分类列表失败'
    });
  }
});

// 创建分类
router.post('/', [
  body('name').trim().isLength({ min: 1, max: 30 }).withMessage('分类名称不能为空且不超过30个字符'),
  body('type').isIn(['income', 'expense']).withMessage('分类类型必须是 income 或 expense'),
  body('icon').optional().trim(),
  body('color').optional().isHexColor().withMessage('颜色必须是有效的十六进制颜色值')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '分类数据验证失败',
        errors: errors.array()
      });
    }

    const category = new Category({
      ...req.body,
      userId: req.user._id
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: '分类创建成功',
      data: { category }
    });

  } catch (error) {
    console.error('创建分类错误:', error);
    res.status(500).json({
      success: false,
      message: '创建分类失败'
    });
  }
});

// 更新分类
router.put('/:id', async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      });
    }

    Object.assign(category, req.body);
    await category.save();

    res.json({
      success: true,
      message: '分类更新成功',
      data: { category }
    });

  } catch (error) {
    console.error('更新分类错误:', error);
    res.status(500).json({
      success: false,
      message: '更新分类失败'
    });
  }
});

// 删除分类
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      });
    }

    if (!await category.canDelete()) {
      return res.status(400).json({
        success: false,
        message: '该分类下存在交易记录，无法删除'
      });
    }

    await Category.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: '分类删除成功'
    });

  } catch (error) {
    console.error('删除分类错误:', error);
    res.status(500).json({
      success: false,
      message: '删除分类失败'
    });
  }
});

module.exports = router;