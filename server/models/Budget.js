const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID不能为空'],
    index: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, '分类ID不能为空'],
    index: true
  },
  amount: {
    type: Number,
    required: [true, '预算金额不能为空'],
    min: [0, '预算金额不能为负数'],
    validate: {
      validator: function(value) {
        return value >= 0;
      },
      message: '预算金额不能为负数'
    }
  },
  period: {
    type: String,
    required: [true, '预算周期不能为空'],
    enum: {
      values: ['daily', 'weekly', 'monthly', 'yearly'],
      message: '预算周期必须是 daily, weekly, monthly 或 yearly'
    }
  },
  startDate: {
    type: Date,
    required: [true, '开始日期不能为空']
  },
  endDate: {
    type: Date,
    required: [true, '结束日期不能为空'],
    validate: {
      validator: function(endDate) {
        return endDate > this.startDate;
      },
      message: '结束日期必须晚于开始日期'
    }
  },
  notifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    threshold: {
      type: Number,
      default: 80,
      min: [0, '阈值不能为负数'],
      max: [100, '阈值不能超过100']
    },
    lastSent: Date
  },
  rollover: {
    enabled: {
      type: Boolean,
      default: false
    },
    maxRollover: {
      type: Number,
      default: 0,
      min: [0, '最大滚存金额不能为负数']
    }
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },
  actualSpent: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    default: function() {
      return this.amount;
    }
  },
  utilizationRate: {
    type: Number,
    default: 0,
    min: [0, '使用率不能为负数'],
    max: [100, '使用率不能超过100']
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
budgetSchema.index({ userId: 1, categoryId: 1 });
budgetSchema.index({ userId: 1, period: 1 });
budgetSchema.index({ userId: 1, status: 1 });
budgetSchema.index({ startDate: 1, endDate: 1 });
budgetSchema.index({ userId: 1, startDate: 1, endDate: 1 });

// 虚拟字段：预算进度
budgetSchema.virtual('progress').get(function() {
  return Math.min(100, (this.actualSpent / this.amount) * 100);
});

// 虚拟字段：是否超预算
budgetSchema.virtual('isOverBudget').get(function() {
  return this.actualSpent > this.amount;
});

// 虚拟字段：剩余天数
budgetSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = Math.max(0, end - now);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// 静态方法：获取用户预算统计
budgetSchema.statics.getUserBudgetStats = async function(userId, date = new Date()) {
  const activeBudgets = await this.find({
    userId: userId,
    status: 'active',
    startDate: { $lte: date },
    endDate: { $gte: date }
  }).populate('categoryId');

  const stats = {
    totalBudget: 0,
    totalSpent: 0,
    remainingBudget: 0,
    budgetCount: activeBudgets.length,
    overBudgetCount: 0,
    nearLimitCount: 0
  };

  activeBudgets.forEach(budget => {
    stats.totalBudget += budget.amount;
    stats.totalSpent += budget.actualSpent;
    stats.remainingBudget += budget.remainingAmount;
    
    if (budget.isOverBudget) {
      stats.overBudgetCount++;
    }
    
    if (budget.progress >= 80 && !budget.isOverBudget) {
      stats.nearLimitCount++;
    }
  });

  stats.utilizationRate = stats.totalBudget > 0 ? 
    (stats.totalSpent / stats.totalBudget) * 100 : 0;

  return stats;
};

// 实例方法：更新实际支出
budgetSchema.methods.updateActualSpent = async function() {
  const Transaction = mongoose.model('Transaction');
  
  const spent = await Transaction.aggregate([
    {
      $match: {
        userId: this.userId,
        categoryId: this.categoryId,
        type: 'expense',
        status: 'active',
        transactionDate: {
          $gte: this.startDate,
          $lte: this.endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  this.actualSpent = spent.length > 0 ? spent[0].total : 0;
  this.remainingAmount = Math.max(0, this.amount - this.actualSpent);
  this.utilizationRate = this.amount > 0 ? 
    Math.min(100, (this.actualSpent / this.amount) * 100) : 0;

  // 检查是否需要发送通知
  if (this.notifications.enabled && 
      this.utilizationRate >= this.notifications.threshold &&
      (!this.notifications.lastSent || 
       new Date() - this.notifications.lastSent > 24 * 60 * 60 * 1000)) {
    
    this.notifications.lastSent = new Date();
    // 这里可以集成通知服务
  }

  return this.save();
};

// 实例方法：检查是否需要续期
budgetSchema.methods.needsRenewal = function() {
  const now = new Date();
  const end = new Date(this.endDate);
  const daysUntilEnd = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  
  return daysUntilEnd <= 3 && this.status === 'active';
};

// 中间件：保存前验证
budgetSchema.pre('save', function(next) {
  if (this.isModified('amount')) {
    this.remainingAmount = this.amount - this.actualSpent;
  }
  next();
});

// 静态方法：创建月度预算
budgetSchema.statics.createMonthlyBudget = async function(userId, categoryId, amount, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  return await this.create({
    userId: userId,
    categoryId: categoryId,
    amount: amount,
    period: 'monthly',
    startDate: startDate,
    endDate: endDate
  });
};

module.exports = mongoose.model('Budget', budgetSchema);