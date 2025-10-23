// Supabase配置指南
// 请根据您的Supabase项目设置以下配置

const supabaseConfig = {
    // 替换为您的Supabase项目URL
    url: 'https://your-project-ref.supabase.co',
    
    // 替换为您的anon/public密钥
    anonKey: 'your-anon-key',
    
    // 数据库表结构
    tables: {
        profiles: `
            CREATE TABLE IF NOT EXISTS profiles (
                id UUID REFERENCES auth.users(id) PRIMARY KEY,
                username TEXT UNIQUE,
                full_name TEXT,
                avatar_url TEXT,
                user_mode TEXT DEFAULT 'student',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
            );
        `,
        
        categories: `
            CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                color TEXT,
                icon TEXT,
                user_id UUID REFERENCES auth.users(id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
            );
        `,
        
        transactions: `
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
        `,
        
        budgets: `
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
        `
    },
    
    // RLS（行级安全）策略
    rlsPolicies: {
        profiles: `
            -- 用户可以读取自己的资料
            CREATE POLICY "用户只能查看自己的资料" ON profiles
                FOR SELECT USING (auth.uid() = id);
            
            -- 用户可以更新自己的资料
            CREATE POLICY "用户只能更新自己的资料" ON profiles
                FOR UPDATE USING (auth.uid() = id);
            
            -- 用户可以插入自己的资料
            CREATE POLICY "用户只能插入自己的资料" ON profiles
                FOR INSERT WITH CHECK (auth.uid() = id);
        `,
        
        transactions: `
            -- 用户可以读取自己的交易记录
            CREATE POLICY "用户只能查看自己的交易" ON transactions
                FOR SELECT USING (auth.uid() = user_id);
            
            -- 用户可以插入自己的交易记录
            CREATE POLICY "用户只能插入自己的交易" ON transactions
                FOR INSERT WITH CHECK (auth.uid() = user_id);
            
            -- 用户可以更新自己的交易记录
            CREATE POLICY "用户只能更新自己的交易" ON transactions
                FOR UPDATE USING (auth.uid() = user_id);
            
            -- 用户可以删除自己的交易记录
            CREATE POLICY "用户只能删除自己的交易" ON transactions
                FOR DELETE USING (auth.uid() = user_id);
        `,
        
        budgets: `
            -- 用户可以读取自己的预算
            CREATE POLICY "用户只能查看自己的预算" ON budgets
                FOR SELECT USING (auth.uid() = user_id);
            
            -- 用户可以插入自己的预算
            CREATE POLICY "用户只能插入自己的预算" ON budgets
                FOR INSERT WITH CHECK (auth.uid() = user_id);
            
            -- 用户可以更新自己的预算
            CREATE POLICY "用户只能更新自己的预算" ON budgets
                FOR UPDATE USING (auth.uid() = user_id);
            
            -- 用户可以删除自己的预算
            CREATE POLICY "用户只能删除自己的预算" ON budgets
                FOR DELETE USING (auth.uid() = user_id);
        `,
        
        categories: `
            -- 用户可以读取所有分类（包括系统默认分类）
            CREATE POLICY "用户可以查看所有分类" ON categories
                FOR SELECT USING (true);
            
            -- 用户可以插入自己的自定义分类
            CREATE POLICY "用户只能插入自己的分类" ON categories
                FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
        `
    },
    
    // 默认数据
    defaultData: {
        categories: [
            { id: 'food', name: '餐饮', color: '#ff6b6b', icon: '🍽️', user_id: null },
            { id: 'transport', name: '交通', color: '#4ecdc4', icon: '🚗', user_id: null },
            { id: 'shopping', name: '购物', color: '#45b7d1', icon: '🛍️', user_id: null },
            { id: 'entertainment', name: '娱乐', color: '#96ceb4', icon: '🎮', user_id: null },
            { id: 'study', name: '学习', color: '#feca57', icon: '📚', user_id: null },
            { id: 'salary', name: '工资', color: '#4fd1c5', icon: '💰', user_id: null },
            { id: 'investment', name: '投资', color: '#667eea', icon: '📈', user_id: null },
            { id: 'other', name: '其他', color: '#a0aec0', icon: '📦', user_id: null }
        ]
    }
};

// 配置验证函数
function validateConfig() {
    const errors = [];
    
    if (!supabaseConfig.url || supabaseConfig.url.includes('your-project-ref')) {
        errors.push('请设置正确的Supabase项目URL');
    }
    
    if (!supabaseConfig.anonKey || supabaseConfig.anonKey.includes('your-anon-key')) {
        errors.push('请设置正确的Supabase anon key');
    }
    
    return errors;
}

// 获取配置
function getConfig() {
    const errors = validateConfig();
    if (errors.length > 0) {
        console.warn('Supabase配置不完整:', errors.join(', '));
        return null;
    }
    return supabaseConfig;
}

module.exports = {
    supabaseConfig,
    validateConfig,
    getConfig
};