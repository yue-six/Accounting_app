// Supabase客户端配置
class SupabaseClient {
    constructor(app) {
        this.app = app;
        this.supabaseUrl = 'https://juqdiilsszktanogfqvm.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1cWRpaWxzc3prdGFub2dmcXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTA1MDksImV4cCI6MjA3NjU2NjUwOX0.JX4Vpl1Z7DeVQPuq-cVPyJfLJFgrGismLEfjEUV-p24';
        this.supabase = null;
        this.isConnected = false;
        this.userId = null;
    }

    // 初始化Supabase客户端
    async init() {
        try {
            // 检查Supabase是否可用
            if (typeof createClient === 'undefined') {
                console.warn('Supabase客户端库未加载，使用本地存储模式');
                return false;
            }

            // 使用提供的配置
            const url = this.supabaseUrl;
            const key = this.supabaseKey;

            console.log('🔗 尝试连接Supabase数据库...');
            console.log('项目URL:', url);

            // 创建Supabase客户端
            this.supabase = createClient(url, key);
            
            // 设置匿名用户ID
            this.userId = this.generateAnonymousUserId();
            
            // 测试连接 - 使用更简单的方法
            const { error } = await this.supabase.from('transactions').select('*').limit(1);
            
            if (error) {
                console.warn('Supabase连接测试失败，可能是表未创建:', error.message);
                console.log('📋 请执行 supabase-setup.sql 文件中的SQL语句来创建数据库表');
                return false;
            }

            this.isConnected = true;
            console.log('✅ Supabase连接成功');
            return true;
        } catch (error) {
            console.warn('Supabase初始化失败:', error.message);
            return false;
        }
    }

    // 生成匿名用户ID
    generateAnonymousUserId() {
        // 使用本地存储保存匿名用户ID
        let userId = localStorage.getItem('anonymous_user_id');
        if (!userId) {
            userId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('anonymous_user_id', userId);
        }
        return userId;
    }

    // 获取用户信息
    async getUser() {
        if (!this.isConnected) return null;
        
        const { data: { user }, error } = await this.supabase.auth.getUser();
        if (error) {
            console.error('获取用户信息失败:', error.message);
            return null;
        }
        return user;
    }

    // 保存交易到数据库
    async saveTransaction(transactionData) {
        if (!this.isConnected) {
            console.warn('数据库未连接，使用本地存储');
            return false;
        }

        try {
            const transaction = {
                user_id: this.userId,
                type: transactionData.type,
                amount: parseFloat(transactionData.amount),
                category: transactionData.category,
                description: transactionData.description || '',
                merchant: transactionData.merchant || '',
                date: new Date().toISOString().split('T')[0],
                time: new Date().toTimeString().split(' ')[0],
                created_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('transactions')
                .insert([transaction])
                .select();

            if (error) throw error;
            
            console.log('✅ 交易保存成功:', data[0]);
            return data[0];
        } catch (error) {
            console.error('❌ 保存交易失败:', error);
            return false;
        }
    }

    // 获取最近交易记录
    async getRecentTransactions(limit = 10) {
        if (!this.isConnected) {
            console.warn('数据库未连接，返回空数据');
            return [];
        }

        try {
            const { data, error } = await this.supabase
                .from('transactions')
                .select('*')
                .eq('user_id', this.userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            
            console.log(`✅ 获取到 ${data.length} 条最近交易记录`);
            return data;
        } catch (error) {
            console.error('❌ 获取最近交易失败:', error);
            return [];
        }
    }

    // 获取今日统计数据
    async getTodayStats() {
        if (!this.isConnected) {
            console.warn('数据库未连接，返回默认数据');
            return { income: 0, expense: 0, balance: 0 };
        }

        try {
            const today = new Date().toISOString().split('T')[0];
            
            const { data, error } = await this.supabase
                .from('transactions')
                .select('type, amount')
                .eq('user_id', this.userId)
                .eq('date', today);

            if (error) throw error;
            
            const stats = { income: 0, expense: 0, balance: 0 };
            
            data.forEach(transaction => {
                if (transaction.type === 'income') {
                    stats.income += parseFloat(transaction.amount);
                } else {
                    stats.expense += parseFloat(transaction.amount);
                }
            });
            
            stats.balance = stats.income - stats.expense;
            
            console.log('✅ 获取今日统计数据成功:', stats);
            return stats;
        } catch (error) {
            console.error('❌ 获取今日统计数据失败:', error);
            return { income: 0, expense: 0, balance: 0 };
        }
    }

    // 获取交易记录
    async getTransactions(userId) {
        if (!this.isConnected) return [];
        
        const { data, error } = await this.supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('获取交易记录失败:', error.message);
            return [];
        }
        return data;
    }

    // 添加交易记录
    async addTransaction(transaction) {
        if (!this.isConnected) return null;
        
        const user = await this.getUser();
        if (!user) return null;

        const { data, error } = await this.supabase
            .from('transactions')
            .insert([
                {
                    user_id: user.id,
                    type: transaction.type,
                    amount: transaction.amount,
                    category: transaction.category,
                    description: transaction.description,
                    merchant: transaction.merchant,
                    date: transaction.date,
                    time: transaction.time
                }
            ])
            .select();

        if (error) {
            console.error('添加交易失败:', error.message);
            return null;
        }
        return data[0];
    }

    // 更新交易记录
    async updateTransaction(transactionId, updates) {
        if (!this.isConnected) return false;
        
        const { error } = await this.supabase
            .from('transactions')
            .update(updates)
            .eq('id', transactionId);

        if (error) {
            console.error('更新交易失败:', error.message);
            return false;
        }
        return true;
    }

    // 删除交易记录
    async deleteTransaction(transactionId) {
        if (!this.isConnected) return false;
        
        const { error } = await this.supabase
            .from('transactions')
            .delete()
            .eq('id', transactionId);

        if (error) {
            console.error('删除交易失败:', error.message);
            return false;
        }
        return true;
    }

    // 获取分类统计
    async getCategoryStats(userId, startDate, endDate) {
        if (!this.isConnected) return {};
        
        const { data, error } = await this.supabase
            .from('transactions')
            .select('category, amount, type')
            .eq('user_id', userId)
            .gte('date', startDate)
            .lte('date', endDate);

        if (error) {
            console.error('获取分类统计失败:', error.message);
            return {};
        }

        const stats = {};
        data.forEach(transaction => {
            if (transaction.type === 'expense') {
                if (!stats[transaction.category]) {
                    stats[transaction.category] = 0;
                }
                stats[transaction.category] += transaction.amount;
            }
        });
        return stats;
    }

    // 用户注册
    async signUp(email, password, userData) {
        if (!this.isConnected) return null;
        
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: userData
            }
        });

        if (error) {
            console.error('用户注册失败:', error.message);
            return null;
        }
        return data;
    }

    // 用户登录
    async signIn(email, password) {
        if (!this.isConnected) return null;
        
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('用户登录失败:', error.message);
            return null;
        }
        return data;
    }

    // 用户登出
    async signOut() {
        if (!this.isConnected) return false;
        
        const { error } = await this.supabase.auth.signOut();
        if (error) {
            console.error('用户登出失败:', error.message);
            return false;
        }
        return true;
    }

    // 检查认证状态
    async checkAuth() {
        if (!this.isConnected) return { isAuthenticated: false };
        
        const { data: { session }, error } = await this.supabase.auth.getSession();
        
        if (error) {
            console.error('检查认证状态失败:', error.message);
            return { isAuthenticated: false };
        }
        
        return {
            isAuthenticated: !!session,
            user: session?.user || null
        };
    }
}

// 创建全局Supabase客户端实例
const supabaseClient = new SupabaseClient();

// 导出单例
export default supabaseClient;