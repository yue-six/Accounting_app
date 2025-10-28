-- Supabase数据库初始化脚本
-- 项目ID: juqdiilsszktanogfqvm
-- 项目URL: https://juqdiilsszktanogfqvm.supabase.co

-- 1. 创建profiles表（用户资料）
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    user_mode TEXT DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. 创建categories表（分类）
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. 创建transactions表（交易记录）
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

-- 4. 创建budgets表（预算）
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

-- 5. 启用行级安全策略（RLS）
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- 6. profiles表策略
CREATE POLICY "用户只能查看自己的资料" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用户只能更新自己的资料" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "用户只能插入自己的资料" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 7. transactions表策略
CREATE POLICY "用户只能查看自己的交易" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能插入自己的交易" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的交易" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的交易" ON transactions
    FOR DELETE USING (auth.uid() = user_id);

-- 8. budgets表策略
CREATE POLICY "用户只能查看自己的预算" ON budgets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能插入自己的预算" ON budgets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的预算" ON budgets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的预算" ON budgets
    FOR DELETE USING (auth.uid() = user_id);

-- 9. categories表策略
CREATE POLICY "用户可以查看所有分类" ON categories
    FOR SELECT USING (true);

CREATE POLICY "用户只能插入自己的分类" ON categories
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 10. 插入默认分类数据
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

-- 11. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- 12. 创建更新时间的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 13. 为需要更新时间的表添加触发器
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();