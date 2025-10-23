const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '用户名不能为空'],
    unique: true,
    trim: true,
    minlength: [2, '用户名至少2个字符'],
    maxlength: [30, '用户名不能超过30个字符']
  },
  email: {
    type: String,
    required: [true, '邮箱不能为空'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: '请输入有效的邮箱地址'
    }
  },
  password: {
    type: String,
    required: [true, '密码不能为空'],
    minlength: [6, '密码至少6个字符'],
    select: false
  },
  profile: {
    fullName: {
      type: String,
      trim: true,
      maxlength: [50, '姓名不能超过50个字符']
    },
    avatar: String,
    phone: {
      type: String,
      validate: {
        validator: function(phone) {
          return /^1[3-9]\d{9}$/.test(phone);
        },
        message: '请输入有效的手机号码'
      }
    },
    birthDate: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    }
  },
  preferences: {
    currency: {
      type: String,
      default: 'CNY',
      enum: ['CNY', 'USD', 'EUR', 'JPY']
    },
    language: {
      type: String,
      default: 'zh-CN',
      enum: ['zh-CN', 'en-US']
    },
    theme: {
      type: String,
      default: 'light',
      enum: ['light', 'dark', 'auto']
    },
    notification: {
      budgetAlert: { type: Boolean, default: true },
      largeTransaction: { type: Boolean, default: true },
      monthlyReport: { type: Boolean, default: true },
      savingsGoalAlert: { type: Boolean, default: true }
    },
    userMode: {
      type: String,
      default: 'student',
      enum: ['student', 'family', 'freelancer']
    },
    modeSettings: {
      student: {
        allowance: { type: Number, default: 0 },
        partTimeIncome: { type: Boolean, default: false },
        educationSavings: {
          enabled: { type: Boolean, default: false },
          target: { type: Number, default: 0 },
          deadline: Date
        }
      },
      family: {
        sharedAccount: { type: Boolean, default: false },
        members: [{
          name: String,
          relation: String,
          sharePercentage: Number
        }],
        expenseCategories: {
          personal: [String],
          household: [String]
        }
      },
      freelancer: {
        businessCategories: [String],
        taxRate: { type: Number, default: 0 },
        autoCategorizeBusiness: { type: Boolean, default: true }
      }
    }
  },
  savingsGoals: [{
    name: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    deadline: { type: Date, required: true },
    autoDeduct: {
      enabled: { type: Boolean, default: false },
      percentage: { type: Number, min: 0, max: 100 },
      sourceCategories: [String]
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'failed'],
      default: 'active'
    },
    createdAt: { type: Date, default: Date.now },
    completedAt: Date
  }
  },
  statistics: {
    totalIncome: { type: Number, default: 0 },
    totalExpense: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// 索引
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'statistics.lastActive': -1 });

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 密码验证方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 更新最后活动时间
userSchema.methods.updateLastActive = function() {
  this.statistics.lastActive = new Date();
  this.loginCount += 1;
  return this.save();
};

// 虚拟字段：净收入
userSchema.virtual('netIncome').get(function() {
  return this.statistics.totalIncome - this.statistics.totalExpense;
});

// 静态方法：根据邮箱查找用户
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// 静态方法：根据用户名查找用户
userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: new RegExp('^' + username + '$', 'i') });
};

module.exports = mongoose.model('User', userSchema);