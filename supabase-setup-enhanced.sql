-- Supabase数据库增强版初始化脚本
-- 支持学生模式、家庭模式、自由职业者模式
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

-- 5. 创建family_members表（家庭成员）
CREATE TABLE IF NOT EXISTS family_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES auth.users(id) NOT NULL,
    member_id UUID REFERENCES auth.users(id) NOT NULL,
    role TEXT DEFAULT 'member',
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(family_id, member_id)
);

-- 6. 创建shared_budgets表（共享预算）
CREATE TABLE IF NOT EXISTS shared_budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES auth.users(id) NOT NULL,
    category TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    period TEXT DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 7. 创建projects表（项目）
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    budget DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 8. 创建invoices表（发票）
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    project_id UUID REFERENCES projects(id),
    client_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'draft',
    issue_date DATE,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 9. 创建payment_connections表（支付连接）
CREATE TABLE IF NOT EXISTS payment_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    platform TEXT NOT NULL, -- 'wechat', 'alipay'
    connected BOOLEAN DEFAULT FALSE,
    connected_at TIMESTAMP WITH TIME ZONE,
    last_sync TIMESTAMP WITH TIME ZONE,
    user_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 10. 创建RPC函数和触发器

-- 自动更新updated_at时间戳的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为profiles表创建触发器
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 为transactions表创建触发器
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. 创建索引以提高查询性能

-- profiles表索引
CREATE INDEX IF NOT EXISTS idx_profiles_user_mode ON profiles(user_mode);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- transactions表索引
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- budgets表索引
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period);

-- family_members表索引
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_member_id ON family_members(member_id);

-- shared_budgets表索引
CREATE INDEX IF NOT EXISTS idx_shared_budgets_family_id ON shared_budgets(family_id);

-- projects表索引
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- invoices表索引
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- payment_connections表索引
CREATE INDEX IF NOT EXISTS idx_payment_connections_user_id ON payment_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_connections_platform ON payment_connections(platform);

-- 12. 设置行级安全策略（RLS）

-- 启用RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_connections ENABLE ROW LEVEL SECURITY;

-- profiles表策略：用户只能访问自己的资料
CREATE POLICY "用户只能访问自己的资料" ON profiles
    FOR ALL USING (auth.uid() = id);

-- categories表策略：用户可以访问所有分类
CREATE POLICY "用户可以访问所有分类" ON categories
    FOR SELECT USING (true);

-- transactions表策略：用户只能访问自己的交易记录
CREATE POLICY "用户只能访问自己的交易记录" ON transactions
    FOR ALL USING (auth.uid() = user_id);

-- budgets表策略：用户只能访问自己的预算
CREATE POLICY "用户只能访问自己的预算" ON budgets
    FOR ALL USING (auth.uid() = user_id);

-- family_members表策略：家庭成员可以访问家庭信息
CREATE POLICY "家庭成员可以访问家庭信息" ON family_members
    FOR ALL USING (
        auth.uid() = family_id OR 
        auth.uid() = member_id OR
        EXISTS (
            SELECT 1 FROM family_members fm 
            WHERE fm.family_id = family_members.family_id 
            AND fm.member_id = auth.uid()
        )
    );

-- shared_budgets表策略：家庭成员可以访问共享预算
CREATE POLICY "家庭成员可以访问共享预算" ON shared_budgets
    FOR ALL USING (
        auth.uid() = family_id OR
        EXISTS (
            SELECT 1 FROM family_members fm 
            WHERE fm.family_id = shared_budgets.family_id 
            AND fm.member_id = auth.uid()
        )
    );

-- projects表策略：用户只能访问自己的项目
CREATE POLICY "用户只能访问自己的项目" ON projects
    FOR ALL USING (auth.uid() = user_id);

-- invoices表策略：用户只能访问自己的发票
CREATE POLICY "用户只能访问自己的发票" ON invoices
    FOR ALL USING (auth.uid() = user_id);

-- payment_connections表策略：用户只能访问自己的支付连接
CREATE POLICY "用户只能访问自己的支付连接" ON payment_connections
    FOR ALL USING (auth.uid() = user_id);

-- 13. 插入默认分类数据
INSERT INTO categories (id, name, color, icon) VALUES
    ('food', '餐饮', '#ff6b6b', '🍽️'),
    ('transport', '交通', '#4ecdc4', '🚗'),
    ('shopping', '购物', '#45b7d1', '🛍️'),
    ('entertainment', '娱乐', '#96ceb4', '🎮'),
    ('study', '学习', '#feca57', '📚'),
    ('salary', '工资', '#4fd1c5', '💰'),
    ('investment', '投资', '#667eea', '📈'),
    ('other', '其他', '#a0aec0', '📦')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    color = EXCLUDED.color,
    icon = EXCLUDED.icon;

-- 14. 创建视图以简化常见查询

-- 月度统计视图
CREATE OR REPLACE VIEW monthly_stats AS
SELECT 
    user_id,
    EXTRACT(YEAR FROM date) as year,
    EXTRACT(MONTH FROM date) as month,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
    COUNT(*) as transaction_count
FROM transactions
GROUP BY user_id, year, month;

-- 分类统计视图
CREATE OR REPLACE VIEW category_stats AS
SELECT 
    t.user_id,
    t.category,
    c.name as category_name,
    c.color as category_color,
    c.icon as category_icon,
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
    SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expense,
    COUNT(*) as transaction_count
FROM transactions t
JOIN categories c ON t.category = c.id
GROUP BY t.user_id, t.category, c.name, c.color, c.icon;

-- 15. 创建存储过程

-- 获取用户月度统计的存储过程
CREATE OR REPLACE FUNCTION get_user_monthly_stats(
    p_user_id UUID,
    p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    p_month INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)
)
RETURNS TABLE(
    total_income DECIMAL(10,2),
    total_expense DECIMAL(10,2),
    net_income DECIMAL(10,2),
    transaction_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as net_income,
        COUNT(*) as transaction_count
    FROM transactions
    WHERE user_id = p_user_id
    AND EXTRACT(YEAR FROM date) = p_year
    AND EXTRACT(MONTH FROM date) = p_month;
END;
$$ LANGUAGE plpgsql;

-- 16. 注释说明
COMMENT ON TABLE profiles IS '用户资料表，存储用户的基本信息和模式设置';
COMMENT ON TABLE categories IS '分类表，存储交易分类信息';
COMMENT ON TABLE transactions IS '交易记录表，存储用户的收入和支出记录';
COMMENT ON TABLE budgets IS '预算表，存储用户的预算设置';
COMMENT ON TABLE family_members IS '家庭成员表，存储家庭模式下的成员关系';
COMMENT ON TABLE shared_budgets IS '共享预算表，存储家庭模式下的共享预算';
COMMENT ON TABLE projects IS '项目表，存储自由职业者模式下的项目信息';
COMMENT ON TABLE invoices IS '发票表，存储自由职业者模式下的发票信息';
COMMENT ON TABLE payment_connections IS '支付连接表，存储用户的支付平台连接状态';

-- 完成脚本执行
SELECT 'Supabase数据库增强版初始化完成！' as completion_message;