# Supabase数据库设置指南

## 概述
本指南将帮助您设置Supabase数据库，使智能记账应用能够使用云端数据库进行数据存储。

## 步骤1：创建Supabase项目

1. **访问Supabase官网**
   - 前往 [https://supabase.com](https://supabase.com)
   - 点击"Start your project"
   - 使用GitHub、GitLab或邮箱注册账号

2. **创建新项目**
   - 点击"New Project"
   - 输入项目名称：`accounting-app`
   - 选择区域（建议选择离您最近的区域）
   - 设置数据库密码
   - 点击"Create new project"

## 步骤2：获取项目配置

项目创建完成后，进入项目设置：

1. **获取项目URL**
   - 进入Settings → API
   - 复制"Project URL"

2. **获取anon/public密钥**
   - 在同一个页面找到"Project API keys"
   - 复制"anon public"密钥

## 步骤3：配置应用

1. **更新Supabase配置**
   打开 `src/js/supabase-client.js` 文件，更新以下配置：

   ```javascript
   class SupabaseClient {
       constructor() {
           // 替换为您的实际配置
           this.supabaseUrl = 'https://your-project-ref.supabase.co';
           this.supabaseKey = 'your-anon-key';
           // ... 其他代码
       }
   }
   ```

2. **或者使用环境变量（推荐）**
   创建 `.env` 文件（用于开发环境）：

   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

   然后在代码中读取：

   ```javascript
   this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
   this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
   ```

## 步骤4：创建数据库表

使用Supabase SQL编辑器创建所需表结构：

1. **打开SQL编辑器**
   - 进入Supabase控制台
   - 点击左侧菜单的"SQL Editor"
   - 点击"New query"

2. **执行以下SQL语句**

```sql
-- 创建profiles表（用户资料）
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    user_mode TEXT DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 创建categories表（分类）
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 创建transactions表（交易记录）
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    merchant TEXT,
    date DATE NOT NULL,
    time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 创建budgets表（预算）
CREATE TABLE IF NOT EXISTS budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    category TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    period TEXT DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
```

## 步骤5：设置行级安全策略（RLS）

执行以下SQL启用RLS并创建策略：

```sql
-- 启用RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- profiles表策略
CREATE POLICY "用户只能查看自己的资料" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用户只能更新自己的资料" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "用户只能插入自己的资料" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- transactions表策略
CREATE POLICY "用户只能查看自己的交易" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能插入自己的交易" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的交易" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的交易" ON transactions
    FOR DELETE USING (auth.uid() = user_id);

-- budgets表策略
CREATE POLICY "用户只能查看自己的预算" ON budgets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能插入自己的预算" ON budgets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的预算" ON budgets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的预算" ON budgets
    FOR DELETE USING (auth.uid() = user_id);

-- categories表策略
CREATE POLICY "用户可以查看所有分类" ON categories
    FOR SELECT USING (true);

CREATE POLICY "用户只能插入自己的分类" ON categories
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
```

## 步骤6：插入默认数据

插入系统默认分类：

```sql
-- 插入默认分类
INSERT INTO categories (id, name, color, icon, user_id) VALUES
('food', '餐饮', '#ff6b6b', '🍽️', NULL),
('transport', '交通', '#4ecdc4', '🚗', NULL),
('shopping', '购物', '#45b7d1', '🛍️', NULL),
('entertainment', '娱乐', '#96ceb4', '🎮', NULL),
('study', '学习', '#feca57', '📚', NULL),
('salary', '工资', '#4fd1c5', '💰', NULL),
('investment', '投资', '#667eea', '📈', NULL),
('other', '其他', '#a0aec0', '📦', NULL)
ON CONFLICT (id) DO NOTHING;
```

## 步骤7：测试连接

1. **启动应用**
   ```bash
   python -m http.server 8000
   ```

2. **检查控制台**
   - 打开浏览器开发者工具
   - 查看控制台输出
   - 应该看到"✅ Supabase连接成功"或"📁 使用本地存储数据库"

## 故障排除

### 常见问题

1. **"Invalid API key"错误**
   - 检查Supabase anon key是否正确
   - 确保密钥没有额外的空格

2. **"Failed to fetch"错误**
   - 检查网络连接
   - 确认Supabase项目URL正确
   - 检查CORS设置

3. **RLS策略错误**
   - 确保已正确设置所有RLS策略
   - 检查表名和列名是否正确

4. **认证错误**
   - 确保用户已登录
   - 检查认证状态

### 调试技巧

1. **检查网络请求**
   - 在开发者工具的Network标签中查看API请求
   - 检查请求头和响应状态

2. **验证配置**
   ```javascript
   // 在浏览器控制台中测试
   console.log('Supabase URL:', supabaseClient.supabaseUrl);
   console.log('Supabase Key:', supabaseClient.supabaseKey);
   ```

3. **测试基础连接**
   ```javascript
   // 测试简单的查询
   const { data, error } = await supabase.from('profiles').select('count').limit(1);
   console.log('连接测试:', error ? error.message : '成功');
   ```

## 生产环境部署

### Vercel部署（推荐）

1. **创建vercel.json**
   ```json
   {
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/static-build"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/index.html"
       }
     ]
   }
   ```

2. **环境变量配置**
   - 在Vercel项目中设置环境变量
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Netlify部署

1. **创建netlify.toml**
   ```toml
   [build]
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **环境变量配置**
   - 在Netlify控制台设置环境变量

## 安全建议

1. **使用环境变量**存储敏感信息
2. **启用双重认证**保护Supabase账号
3. **定期备份**数据库
4. **监控API使用量**
5. **设置使用限制**防止滥用

## 支持与帮助

- [Supabase文档](https://supabase.com/docs)
- [Supabase社区](https://github.com/supabase/supabase/discussions)
- [应用GitHub仓库](https://github.com/your-username/accounting-app)

如有问题，请查看控制台错误信息或联系技术支持。