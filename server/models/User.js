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
<<<<<<< Updated upstream
    completedAt: Date
  },

=======
      completedAt: Date
    }
    ],
>>>>>>> Stashed changes
  statistics: {
    totalIncome: { type: Number, default: 0 },
    totalExpense: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now }
  },
  // 第三方登录关联
  thirdPartyAuth: {
    alipay: {
      userId: {
        type: String,
        unique: true,
        sparse: true
      },
      nickName: String,
      avatar: String,
      gender: String,
      province: String,
      city: String,
      isCertified: Boolean,
      isStudentCertified: Boolean,
      connectedAt: {
        type: Date,
        default: Date.now
      },
      lastSync: Date
    },
    wechat: {
      openId: {
        type: String,
        unique: true,
        sparse: true
      },
      unionId: String,
      nickName: String,
      avatar: String,
      gender: Number,
      province: String,
      city: String,
      country: String,
      connectedAt: {
        type: Date,
        default: Date.now
      },
      lastSync: Date
    }
  },
  
  isActive, {
    type: Boolean,
    default: true
  },
  lastLogin,Date,
  loginCount,{
    type: Number,
    default: 0
  }
, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
;

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

// 静态方法：根据支付宝用户ID查找或创建用户
userSchema.statics.findOrCreateByAlipay = async function(alipayUserInfo) {
  try {
    // 首先尝试查找已关联的用户
    let user = await this.findOne({ 
      'thirdPartyAuth.alipay.userId': alipayUserInfo.user_id 
    });
    
    if (user) {
      // 更新支付宝用户信息
      user.thirdPartyAuth.alipay.nickName = alipayUserInfo.nick_name;
      user.thirdPartyAuth.alipay.avatar = alipayUserInfo.avatar;
      user.thirdPartyAuth.alipay.gender = alipayUserInfo.gender;
      user.thirdPartyAuth.alipay.province = alipayUserInfo.province;
      user.thirdPartyAuth.alipay.city = alipayUserInfo.city;
      user.thirdPartyAuth.alipay.isCertified = alipayUserInfo.is_certified === 'T';
      user.thirdPartyAuth.alipay.isStudentCertified = alipayUserInfo.is_student_certified === 'T';
      user.thirdPartyAuth.alipay.lastSync = new Date();
      
      await user.save();
      return user;
    }
    
    // 创建新用户（使用支付宝信息）
    const username = `alipay_${alipayUserInfo.user_id.substring(0, 8)}`;
    const email = `${username}@alipay.local`;
    
    // 生成随机密码
    const randomPassword = crypto.randomBytes(16).toString('hex');
    
    user = new this({
      username,
      email,
      password: randomPassword, // 密码会被bcrypt加密
      profile: {
        fullName: alipayUserInfo.nick_name,
        avatar: alipayUserInfo.avatar,
        gender: alipayUserInfo.gender === 'M' ? 'male' : 
                alipayUserInfo.gender === 'F' ? 'female' : 'other'
      },
      thirdPartyAuth: {
        alipay: {
          userId: alipayUserInfo.user_id,
          nickName: alipayUserInfo.nick_name,
          avatar: alipayUserInfo.avatar,
          gender: alipayUserInfo.gender,
          province: alipayUserInfo.province,
          city: alipayUserInfo.city,
          isCertified: alipayUserInfo.is_certified === 'T',
          isStudentCertified: alipayUserInfo.is_student_certified === 'T',
          connectedAt: new Date(),
          lastSync: new Date()
        }
      }
    });
    
    await user.save();
    return user;
    
  } catch (error) {
    console.error('支付宝用户关联失败:', error);
    throw error;
  }
};

// 静态方法：根据支付宝用户ID查找用户
userSchema.statics.findByAlipayUserId = function(alipayUserId) {
  return this.findOne({ 'thirdPartyAuth.alipay.userId': alipayUserId });
};

// 根据支付宝用户信息查找或创建用户
userSchema.statics.findOrCreateByAlipay = async function(alipayUserInfo) {
  try {
    // 查找已存在的支付宝用户
    let user = await this.findOne({ 
      'alipay.user_id': alipayUserInfo.user_id 
    });
    
    if (user) {
      return user;
    }
    
    // 创建新用户
    const username = `alipay_${alipayUserInfo.user_id.substring(0, 8)}`;
    const email = `${username}@alipay.com`;
    
    user = new this({
      username,
      email,
      password: 'alipay_' + Date.now(), // 随机密码
      profile: {
        nickname: alipayUserInfo.nick_name || '支付宝用户',
        avatar: alipayUserInfo.avatar || '',
        gender: alipayUserInfo.gender || '未知',
        province: alipayUserInfo.province || '',
        city: alipayUserInfo.city || ''
      },
      alipay: {
        user_id: alipayUserInfo.user_id,
        nick_name: alipayUserInfo.nick_name,
        avatar: alipayUserInfo.avatar,
        gender: alipayUserInfo.gender,
        province: alipayUserInfo.province,
        city: alipayUserInfo.city,
        is_certified: alipayUserInfo.is_certified,
        is_student_certified: alipayUserInfo.is_student_certified
      }
    });
    
    await user.save();
    return user;
    
  } catch (error) {
    console.error('创建支付宝用户失败:', error);
    throw error;
  }
};

// 根据微信用户信息查找或创建用户
userSchema.statics.findOrCreateByWechat = async function(wechatUserInfo) {
  try {
    // 查找已存在的微信用户
    let user = await this.findOne({ 
      'wechat.openid': wechatUserInfo.openid 
    });
    
    if (user) {
      return user;
    }
    
    // 创建新用户
    const username = `wechat_${wechatUserInfo.openid.substring(0, 8)}`;
    const email = `${username}@wechat.com`;
    
    user = new this({
      username,
      email,
      password: 'wechat_' + Date.now(), // 随机密码
      profile: {
        nickname: wechatUserInfo.nickname || '微信用户',
        avatar: wechatUserInfo.headimgurl || '',
        gender: wechatUserInfo.sex === 1 ? '男' : wechatUserInfo.sex === 2 ? '女' : '未知',
        province: wechatUserInfo.province || '',
        city: wechatUserInfo.city || '',
        country: wechatUserInfo.country || ''
      },
      wechat: {
        openid: wechatUserInfo.openid,
        unionid: wechatUserInfo.unionid,
        nickname: wechatUserInfo.nickname,
        avatar: wechatUserInfo.headimgurl,
        gender: wechatUserInfo.sex,
        province: wechatUserInfo.province,
        city: wechatUserInfo.city,
        country: wechatUserInfo.country
      }
    });
    
    await user.save();
    return user;
    
  } catch (error) {
    console.error('创建微信用户失败:', error);
    throw error;
  }
};

module.exports = mongoose.model('User', userSchema);