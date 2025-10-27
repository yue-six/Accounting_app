# 数据库设置指南

## 概述
本应用支持三种用户模式：学生模式、家庭模式、自由职业者模式。每种模式都有专门的数据库表结构来支持其独特功能。

## 数据库初始化步骤

### 1. 执行数据库脚本

使用以下任一方法执行数据库初始化脚本：

#### 方法一：使用Supabase SQL编辑器
1. 登录到您的Supabase项目控制台
2. 进入 "SQL Editor" 页面
3. 复制 `supabase-setup-enhanced.sql` 文件中的全部内容
4. 粘贴到SQL编辑器中并执行

#### 方法二：使用命令行工具
```bash
# 安装Supabase CLI
npm install -g supabase

# 登录到您的Supabase账户
supabase login

# 连接到您的项目
supabase link --project-ref juqdiilsszktanogfqvm

# 执行SQL脚本
supabase db push
```

### 2. 验证数据库设置

执行完成后，检查以下表是否成功创建：

- ✅ `profiles` - 用户资料表
- ✅ `categories` - 分类表
- ✅ `transactions` - 交易记录表
- ✅ `budgets` - 预算表
- ✅ `student_mode_settings` - 学生模式设置表
- ✅ `family_mode_settings` - 家庭模式设置表
- ✅ `family_transactions` - 家庭交易记录表
- ✅ `freelancer_mode_settings` - 自由职业者模式设置表
- ✅ `business_transactions` - 商业交易记录表
- ✅ `invoices` - 发票管理表
- ✅ `tax_reports` - 税务报告表
- ✅ `cash_flow_alerts` - 现金流预警表

## 数据库表结构说明

### 核心表结构

#### 1. profiles表（用户资料）
- `id` - 用户ID（关联auth.users）
- `username` - 用户名
- `full_name` - 全名
- `avatar_url` - 头像URL
- `user_mode` - 用户模式（student/family/freelancer）

#### 2. categories表（分类）
- `id` - 分类ID
- `name` - 分类名称
- `color` - 分类颜色
- `icon` - 分类图标
- `user_id` - 用户ID（null表示系统默认分类）

#### 3. transactions表（交易记录）
- `id` - 交易ID
- `user_id` - 用户ID
- `type` - 交易类型（income/expense）
- `amount` - 金额
- `category` - 分类
- `description` - 描述
- `date` - 日期

### 学生模式专用表

#### student_mode_settings表
- `monthly_allowance` - 月度生活费
- `part_time_job_income` - 兼职收入
- `study_expenses_budget` - 学习支出预算
- `living_expenses_budget` - 生活支出预算
- `savings_goal` - 储蓄目标

### 家庭模式专用表

#### family_mode_settings表
- `family_name` - 家庭名称
- `family_members` - 家庭成员列表（JSON格式）
- `shared_budget` - 共享预算
- `monthly_income` - 月度收入

#### family_transactions表
- `family_id` - 家庭ID
- `member_id` - 成员ID
- `type` - 交易类型
- `amount` - 金额
- `category` - 分类

### 自由职业者模式专用表

#### freelancer_mode_settings表
- `business_name` - 业务名称
- `tax_id` - 税号
- `min_operating_funds` - 最低运营资金
- `business_categories` - 业务分类（JSON格式）

#### business_transactions表
- `freelancer_id` - 自由职业者ID
- `transaction_type` - 交易类型（business_income/business_cost/personal_expense）
- `invoice_number` - 发票号码
- `is_tax_deductible` - 是否可抵扣

#### invoices表
- `invoice_number` - 发票号码
- `title` - 发票标题
- `amount` - 金额
- `date` - 日期
- `is_tax_deductible` - 是否可抵扣

#### tax_reports表
- `quarter` - 季度
- `year` - 年份
- `total_income` - 总收入
- `total_cost` - 总成本
- `net_profit` - 净利润
- `deductible_cost` - 可抵扣成本

#### cash_flow_alerts表
- `alert_type` - 预警类型
- `message` - 预警消息
- `is_active` - 是否活跃

## 安全策略

所有表都启用了行级安全策略（RLS），确保：
- 用户只能访问自己的数据
- 数据隔离和隐私保护
- 安全的数据库操作

## 性能优化

数据库已创建以下索引来优化查询性能：
- 交易记录的用户ID和日期索引
- 家庭交易的日期索引
- 商业交易的日期索引
- 发票和税务报告的相关索引

## 故障排除

### 常见问题

1. **表不存在错误**
   - 确保已执行完整的SQL脚本
   - 检查表名拼写是否正确

2. **权限错误**
   - 确保RLS策略已正确设置
   - 检查用户认证状态

3. **连接错误**
   - 验证Supabase项目URL和密钥
   - 检查网络连接

### 测试数据库连接

应用启动时会自动测试数据库连接。如果连接失败，应用将回退到本地存储模式。

## 数据迁移

如果从旧版本迁移数据：

1. 备份现有数据
2. 执行新的数据库脚本
3. 使用数据迁移工具导入数据
4. 验证数据完整性

## 技术支持

如有数据库相关问题，请参考：
- Supabase官方文档
- 应用内置的错误日志
- 开发者技术支持

---

**注意**：在生产环境部署前，请务必备份数据并测试所有功能。