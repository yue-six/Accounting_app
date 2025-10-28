const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID不能为空'],
    index: true
  },
  type: {
    type: String,
    required: [true, '交易类型不能为空'],
    enum: {
      values: ['income', 'expense'],
      message: '交易类型必须是 income 或 expense'
    }
  },
  amount: {
    type: Number,
    required: [true, '交易金额不能为空'],
    min: [0.01, '交易金额必须大于0'],
    validate: {
      validator: function(value) {
        return value > 0;
      },
      message: '交易金额必须大于0'
    }
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, '分类ID不能为空'],
    index: true
  },
  description: {
    type: String,
    required: [true, '交易描述不能为空'],
    trim: true,
    maxlength: [200, '交易描述不能超过200个字符']
  },
  merchant: {
    type: String,
    trim: true,
    maxlength: [100, '商户名称不能超过100个字符']
  },
  transactionDate: {
    type: Date,
    required: [true, '交易日期不能为空'],
    validate: {
      validator: function(date) {
        return date <= new Date();
      },
      message: '交易日期不能是未来日期'
    }
  },
  location: {
    address: String,
    latitude: Number,
    longitude: Number
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'wechat', 'alipay', 'bank_transfer', 'other'],
    default: 'other'
  },
  receipt: {
    imageUrl: String,
    ocrData: Object
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, '标签不能超过20个字符']
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringSettings: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    endDate: Date,
    nextOccurrence: Date
  },
  notes: {
    type: String,
    maxlength: [500, '备注不能超过500个字符']
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'audio']
    },
    url: String,
    filename: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'deleted', 'archived'],
    default: 'active'
  },
  deletedAt: {
    type: Date,
    default: null
  },
  syncSource: {
    platform: {
      type: String,
      enum: ['manual', 'wechat', 'alipay', 'bank']
    },
    externalId: String,
    syncDate: Date
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

// 复合索引
transactionSchema.index({ userId: 1, transactionDate: -1 });
transactionSchema.index({ userId: 1, categoryId: 1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, amount: -1 });
transactionSchema.index({ transactionDate: 1 });

// 虚拟字段：格式化日期
transactionSchema.virtual('formattedDate').get(function() {
  return this.transactionDate.toISOString().split('T')[0];
});

// 虚拟字段：格式化金额
transactionSchema.virtual('formattedAmount').get(function() {
  return this.type === 'income' ? this.amount : -this.amount;
});

// 静态方法：获取用户交易统计
transactionSchema.statics.getUserStats = async function(userId, startDate, endDate) {
  const matchStage = {
    userId: new mongoose.Types.ObjectId(userId),
    status: 'active'
  };

  if (startDate || endDate) {
    matchStage.transactionDate = {};
    if (startDate) matchStage.transactionDate.$gte = new Date(startDate);
    if (endDate) matchStage.transactionDate.$lte = new Date(endDate);
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    }
  ]);

  const result = {
    totalIncome: 0,
    totalExpense: 0,
    netIncome: 0,
    transactionCount: 0
  };

  stats.forEach(stat => {
    if (stat._id === 'income') {
      result.totalIncome = stat.totalAmount;
    } else if (stat._id === 'expense') {
      result.totalExpense = stat.totalAmount;
    }
    result.transactionCount += stat.count;
  });

  result.netIncome = result.totalIncome - result.totalExpense;

  return result;
};

// 静态方法：获取分类统计
transactionSchema.statics.getCategoryStats = async function(userId, startDate, endDate) {
  const matchStage = {
    userId: new mongoose.Types.ObjectId(userId),
    status: 'active',
    type: 'expense'
  };

  if (startDate || endDate) {
    matchStage.transactionDate = {};
    if (startDate) matchStage.transactionDate.$gte = new Date(startDate);
    if (endDate) matchStage.transactionDate.$lte = new Date(endDate);
  }

  return await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$categoryId',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category'
      }
    },
    { $unwind: '$category' },
    {
      $project: {
        categoryId: '$_id',
        categoryName: '$category.name',
        categoryIcon: '$category.icon',
        categoryColor: '$category.color',
        totalAmount: 1,
        count: 1,
        averageAmount: 1,
        percentage: {
          $multiply: [
            { $divide: ['$totalAmount', { $sum: '$totalAmount' }] },
            100
          ]
        }
      }
    }
  ]);
};

// 实例方法：软删除
transactionSchema.methods.softDelete = async function() {
  this.status = 'deleted';
  this.deletedAt = new Date();
  
  // 如果是支出类型，更新相关预算
  if (this.type === 'expense') {
    const Budget = mongoose.model('Budget');
    const budgets = await Budget.find({
      userId: this.userId,
      categoryId: this.categoryId,
      status: 'active',
      startDate: { $lte: this.transactionDate },
      endDate: { $gte: this.transactionDate }
    });

    for (const budget of budgets) {
      await budget.updateActualSpent();
    }
  }

  return this.save();
};

// 中间件：更新用户统计
transactionSchema.post('save', async function(doc) {
  if (doc.status === 'active') {
    const User = mongoose.model('User');
    const stats = await mongoose.model('Transaction').getUserStats(doc.userId);
    
    await User.findByIdAndUpdate(doc.userId, {
      'statistics.totalIncome': stats.totalIncome,
      'statistics.totalExpense': stats.totalExpense,
      'statistics.transactionCount': stats.transactionCount
    });
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);