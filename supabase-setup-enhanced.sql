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

-- 5. 创建学生模式专用表
CREATE TABLE IF NOT EXISTS student_mode_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    monthly_allowance DECIMAL(10,2) DEFAULT 0,
    part_time_job_income DECIMAL(10,2) DEFAULT 0,
    study_expenses_budget DECIMAL(10,2) DEFAULT 0,
    living_expenses_budget DECIMAL(10,2) DEFAULT 0,
    savings_goal DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 6. 创建家庭模式专用表
CREATE TABLE IF NOT EXISTS family_mode_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    family_name TEXT NOT NULL,
    family_members JSONB DEFAULT '[]',
    shared_budget DECIMAL(10,2) DEFAULT 0,
    monthly_income DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 7. 创建家庭交易记录表
CREATE TABLE IF NOT EXISTS family_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES family_mode_settings(id) NOT NULL,
    member_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 8. 创建自由职业者模式专用表
CREATE TABLE IF NOT EXISTS freelancer_mode_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    business_name TEXT,
    tax_id TEXT,
    min_operating_funds DECIMAL(10,2) DEFAULT 10000,
    business_categories JSONB DEFAULT '{"income": [], "cost": [], "personal": []}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 9. 创建自由职业者交易记录表
CREATE TABLE IF NOT EXISTS business_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    freelancer_id UUID REFERENCES freelancer_mode_settings(id) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('business_income', 'business_cost', 'personal_expense')),
    amount DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    invoice_number TEXT,
    invoice_amount DECIMAL(10,2),
    invoice_date DATE,
    is_tax_deductible BOOLEAN DEFAULT false,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 10. 创建发票管理表
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    freelancer_id UUID REFERENCES freelancer_mode_settings(id) NOT NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    is_tax_deductible BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 11. 创建税务报告表
CREATE TABLE IF NOT EXISTS tax_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    freelancer_id UUID REFERENCES freelancer_mode_settings(id) NOT NULL,
    quarter TEXT NOT NULL,
    year INTEGER NOT NULL,
    total_income DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) DEFAULT 0,
    net_profit DECIMAL(10,2) DEFAULT 0,
    deductible_cost DECIMAL(10,2) DEFAULT 0,
    report_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 12. 创建现金流预警表
CREATE TABLE IF NOT EXISTS cash_flow_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    freelancer_id UUID REFERENCES freelancer_mode_settings(id) NOT NULL,
    alert_type TEXT NOT NULL,
    message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 13. 启用行级安全策略（RLS）
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_mode_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_mode_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_mode_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_alerts ENABLE ROW LEVEL SECURITY;

-- 14. profiles表策略
CREATE POLICY "用户只能查看自己的资料" ON profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "用户只能更新自己的资料" ON profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "用户只能插入自己的资料" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 15. transactions表策略
CREATE POLICY "用户只能查看自己的交易" ON transactions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户只能插入自己的交易" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户只能更新自己的交易" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户只能删除自己的交易" ON transactions
    FOR DELETE USING (auth.uid() = user_id);

-- 16. budgets表策略
CREATE POLICY "用户只能查看自己的预算" ON budgets
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户只能插入自己的预算" ON budgets
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户只能更新自己的预算" ON budgets
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户只能删除自己的预算" ON budgets
    FOR DELETE USING (auth.uid() = user_id);

-- 17. categories表策略
CREATE POLICY "用户可以查看所有分类" ON categories
    FOR SELECT USING (true);
CREATE POLICY "用户只能插入自己的分类" ON categories
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 18. 学生模式策略
CREATE POLICY "用户只能查看自己的学生设置" ON student_mode_settings
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户只能更新自己的学生设置" ON student_mode_settings
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户只能插入自己的学生设置" ON student_mode_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 19. 家庭模式策略
CREATE POLICY "用户只能查看自己的家庭设置" ON family_mode_settings
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户只能更新自己的家庭设置" ON family_mode_settings
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户只能插入自己的家庭设置" ON family_mode_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 20. 家庭交易策略
CREATE POLICY "用户只能查看自己的家庭交易" ON family_transactions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM family_mode_settings 
        WHERE family_mode_settings.id = family_transactions.family_id 
        AND family_mode_settings.user_id = auth.uid()
    ));
CREATE POLICY "用户只能插入自己的家庭交易" ON family_transactions
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM family_mode_settings 
        WHERE family_mode_settings.id = family_transactions.family_id 
        AND family_mode_settings.user_id = auth.uid()
    ));

-- 21. 自由职业者模式策略
CREATE POLICY "用户只能查看自己的自由职业设置" ON freelancer_mode_settings
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户只能更新自己的自由职业设置" ON freelancer_mode_settings
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户只能插入自己的自由职业设置" ON freelancer_mode_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 22. 商业交易策略
CREATE POLICY "用户只能查看自己的商业交易" ON business_transactions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM freelancer_mode_settings 
        WHERE freelancer_mode_settings.id = business_transactions.freelancer_id 
        AND freelancer_mode_settings.user_id = auth.uid()
    ));
CREATE POLICY "用户只能插入自己的商业交易" ON business_transactions
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM freelancer_mode_settings 
        WHERE freelancer_mode_settings.id = business_transactions.freelancer_id 
        AND freelancer_mode_settings.user_id = auth.uid()
    ));

-- 23. 发票管理策略
CREATE POLICY "用户只能查看自己的发票" ON invoices
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM freelancer_mode_settings 
        WHERE freelancer_mode_settings.id = invoices.freelancer_id 
        AND freelancer_mode_settings.user_id = auth.uid()
    ));
CREATE POLICY "用户只能插入自己的发票" ON invoices
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM freelancer_mode_settings 
        WHERE freelancer_mode_settings.id = invoices.freelancer_id 
        AND freelancer_mode_settings.user_id = auth.uid()
    ));

-- 24. 税务报告策略
CREATE POLICY "用户只能查看自己的税务报告" ON tax_reports
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM freelancer_mode_settings 
        WHERE freelancer_mode_settings.id = tax_reports.freelancer_id 
        AND freelancer_mode_settings.user_id = auth.uid()
    ));
CREATE POLICY "用户只能插入自己的税务报告" ON tax_reports
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM freelancer_mode_settings 
        WHERE freelancer_mode_settings.id = tax_reports.freelancer_id 
        AND freelancer_mode_settings.user_id = auth.uid()
    ));

-- 25. 现金流预警策略
CREATE POLICY "用户只能查看自己的现金流预警" ON cash_flow_alerts
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM freelancer_mode_settings 
        WHERE freelancer_mode_settings.id = cash_flow_alerts.freelancer_id 
        AND freelancer_mode_settings.user_id = auth.uid()
    ));
CREATE POLICY "用户只能插入自己的现金流预警" ON cash_flow_alerts
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM freelancer_mode_settings 
        WHERE freelancer_mode_settings.id = cash_flow_alerts.freelancer_id 
        AND freelancer_mode_settings.user_id = auth.uid()
    ));

-- 26. 插入默认分类数据
INSERT INTO categories (id, name, color, icon, user_id) VALUES
('food', '餐饮', '#ff6b6b', '🍽️', NULL),
('transport', '交通', '#4ecdc4', '🚗', NULL),
('shopping', '购物', '#45b7d1', '🛍️', NULL),
('entertainment', '娱乐', '#96ceb4', '🎮', NULL),
('study', '学习', '#feca57', '📚', NULL),
('salary', '工资', '#4fd1c5', '💰', NULL),
('investment', '投资', '#667eea', '📈', NULL),
('other', '其他', '#a0aec0', '📦', NULL),
-- 自由职业者模式专用分类
('business_income', '经营收入', '#48bb78', '💼', NULL),
('business_cost', '经营成本', '#ed8936', '⚙️', NULL),
('personal_expense', '个人消费', '#9f7aea', '👤', NULL)
ON CONFLICT (id) DO NOTHING;

-- 27. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_family_transactions_family_id ON family_transactions(family_id);
CREATE INDEX IF NOT EXISTS idx_family_transactions_date ON family_transactions(date);
CREATE INDEX IF NOT EXISTS idx_business_transactions_freelancer_id ON business_transactions(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_business_transactions_date ON business_transactions(date);
CREATE INDEX IF NOT EXISTS idx_invoices_freelancer_id ON invoices(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_tax_reports_freelancer_id ON tax_reports(freelancer_id);

-- 28. 创建更新时间的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 29. 为需要更新时间的表添加触发器
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_mode_settings_updated_at BEFORE UPDATE ON student_mode_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_family_mode_settings_updated_at BEFORE UPDATE ON family_mode_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_freelancer_mode_settings_updated_at BEFORE UPDATE ON freelancer_mode_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 30. 创建视图方便查询
CREATE OR REPLACE VIEW user_monthly_summary AS
SELECT 
    user_id,
    EXTRACT(YEAR FROM date) as year,
    EXTRACT(MONTH FROM date) as month,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
FROM transactions
GROUP BY user_id, year, month;

CREATE OR REPLACE VIEW freelancer_quarterly_profit AS
SELECT 
    fms.user_id,
    tr.quarter,
    tr.year,
    tr.total_income,
    tr.total_cost,
    tr.net_profit
FROM tax_reports tr
JOIN freelancer_mode_settings fms ON tr.freelancer_id = fms.id;

-- 完成提示
SELECT '数据库初始化完成！支持学生模式、家庭模式、自由职业者模式。' as message;