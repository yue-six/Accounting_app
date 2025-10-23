const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '分类名称不能为空'],
    trim: true,
    maxlength: [30, '分类名称不能超过30个字符']
  },
  type: {
    type: String,
    required: [true, '分类类型不能为空'],
    enum: {
      values: ['income', 'expense'],
      message: '分类类型必须是 income 或 expense'
    }
  },
  icon: {
    type: String,
    required: [true, '分类图标不能为空'],
    default: '💰'
  },
  color: {
    type: String,
    required: [true, '分类颜色不能为空'],
    default: '#667eea',
    validate: {
      validator: function(color) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
      },
      message: '颜色必须是有效的十六进制颜色值'
    }
  },
  description: {
    type: String,
    maxlength: [100, '分类描述不能超过100个字符']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    createdBy: {
      type: String,
      enum: ['system', 'user'],
      default: 'user'
    },
    systemCategoryId: String
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// 索引
categorySchema.index({ userId: 1, type: 1 });
categorySchema.index({ userId: 1, isDefault: 1 });
categorySchema.index({ userId: 1, isActive: 1 });
categorySchema.index({ isDefault: 1, type: 1 });

// 虚拟字段：子分类
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory'
});

// 静态方法：获取默认分类
categorySchema.statics.getDefaultCategories = function(type = null) {
  const defaultCategories = [
    // 收入分类
    { name: '工资收入', type: 'income', icon: '💼', color: '#4CAF50', isDefault: true },
    { name: '投资收入', type: 'income', icon: '📈', color: '#2196F3', isDefault: true },
    { name: '兼职收入', type: 'income', icon: '💻', color: '#FF9800', isDefault: true },
    { name: '奖金收入', type: 'income', icon: '🎁', color: '#E91E63', isDefault: true },
    { name: '其他收入', type: 'income', icon: '💰', color: '#9C27B0', isDefault: true },
    
    // 支出分类
    { name: '餐饮美食', type: 'expense', icon: '🍔', color: '#FF5722', isDefault: true },
    { name: '交通出行', type: 'expense', icon: '🚗', color: '#607D8B', isDefault: true },
    { name: '购物消费', type: 'expense', icon: '🛍️', color: '#FFC107', isDefault: true },
    { name: '住房房租', type: 'expense', icon: '🏠', color: '#795548', isDefault: true },
    { name: '娱乐休闲', type: 'expense', icon: '🎮', color: '#3F51B5', isDefault: true },
    { name: '医疗健康', type: 'expense', icon: '🏥', color: '#F44336', isDefault: true },
    { name: '教育培训', type: 'expense', icon: '📚', color: '#009688', isDefault: true },
    { name: '通讯网络', type: 'expense', icon: '📱', color: '#673AB7', isDefault: true },
    { name: '水电煤气', type: 'expense', icon: '💡', color: '#00BCD4', isDefault: true },
    { name: '其他支出', type: 'expense', icon: '💸', color: '#757575', isDefault: true }
  ];

  if (type) {
    return defaultCategories.filter(cat => cat.type === type);
  }
  
  return defaultCategories;
};

// 静态方法：为用户创建默认分类
categorySchema.statics.createDefaultCategoriesForUser = async function(userId) {
  const defaultCategories = this.getDefaultCategories();
  const categoriesToCreate = defaultCategories.map(cat => ({
    ...cat,
    userId: userId,
    metadata: { createdBy: 'system' }
  }));

  return await this.insertMany(categoriesToCreate);
};

// 实例方法：检查是否可删除
categorySchema.methods.canDelete = async function() {
  if (this.isDefault) {
    return false; // 默认分类不能删除
  }

  const Transaction = mongoose.model('Transaction');
  const transactionCount = await Transaction.countDocuments({
    categoryId: this._id,
    status: 'active'
  });

  return transactionCount === 0;
};

// 中间件：删除前检查
categorySchema.pre('deleteOne', { document: true }, async function(next) {
  if (!await this.canDelete()) {
    const error = new Error('该分类下存在交易记录，无法删除');
    error.status = 400;
    return next(error);
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);