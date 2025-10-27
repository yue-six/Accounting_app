// 模式数据库服务 - 支持学生模式、家庭模式、自由职业者模式
class ModeDatabase {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }

    // 获取当前用户模式
    async getCurrentUserMode() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return 'student';

            const { data, error } = await this.supabase
                .from('profiles')
                .select('user_mode')
                .eq('id', user.id)
                .single();

            if (error) {
                console.warn('获取用户模式失败，使用默认模式:', error.message);
                return 'student';
            }

            return data?.user_mode || 'student';
        } catch (error) {
            console.error('获取用户模式时出错:', error);
            return 'student';
        }
    }

    // 设置用户模式
    async setUserMode(mode) {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return false;

            const { error } = await this.supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    user_mode: mode,
                    updated_at: new Date().toISOString()
                });

            if (error) {
                console.error('设置用户模式失败:', error.message);
                return false;
            }

            return true;
        } catch (error) {
            console.error('设置用户模式时出错:', error);
            return false;
        }
    }

    // ========== 学生模式数据库操作 ==========

    // 获取学生模式设置
    async getStudentModeSettings() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await this.supabase
                .from('student_mode_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.warn('获取学生模式设置失败:', error.message);
            }

            return data || {
                monthly_allowance: 0,
                part_time_job_income: 0,
                study_expenses_budget: 0,
                living_expenses_budget: 0,
                savings_goal: 0
            };
        } catch (error) {
            console.error('获取学生模式设置时出错:', error);
            return null;
        }
    }

    // 保存学生模式设置
    async saveStudentModeSettings(settings) {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return false;

            const { error } = await this.supabase
                .from('student_mode_settings')
                .upsert({
                    user_id: user.id,
                    ...settings,
                    updated_at: new Date().toISOString()
                });

            if (error) {
                console.error('保存学生模式设置失败:', error.message);
                return false;
            }

            return true;
        } catch (error) {
            console.error('保存学生模式设置时出错:', error);
            return false;
        }
    }

    // 获取学生模式交易记录
    async getStudentModeTransactions() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await this.supabase
                .from('student_mode_transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('获取学生模式交易记录失败:', error.message);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('获取学生模式交易记录时出错:', error);
            return [];
        }
    }

    // 添加学生模式交易记录
    async addStudentModeTransaction(transaction) {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return false;

            const { error } = await this.supabase
                .from('student_mode_transactions')
                .insert({
                    user_id: user.id,
                    ...transaction,
                    created_at: new Date().toISOString()
                });

            if (error) {
                console.error('添加学生模式交易记录失败:', error.message);
                return false;
            }

            return true;
        } catch (error) {
            console.error('添加学生模式交易记录时出错:', error);
            return false;
        }
    }

    // ========== 家庭模式数据库操作 ==========

    // 获取家庭模式设置
    async getFamilyModeSettings() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await this.supabase
                .from('family_mode_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.warn('获取家庭模式设置失败:', error.message);
            }

            return data || {
                family_members: [],
                shared_budget: 0,
                monthly_income: 0,
                savings_goal: 0
            };
        } catch (error) {
            console.error('获取家庭模式设置时出错:', error);
            return null;
        }
    }

    // 保存家庭模式设置
    async saveFamilyModeSettings(settings) {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return false;

            const { error } = await this.supabase
                .from('family_mode_settings')
                .upsert({
                    user_id: user.id,
                    ...settings,
                    updated_at: new Date().toISOString()
                });

            if (error) {
                console.error('保存家庭模式设置失败:', error.message);
                return false;
            }

            return true;
        } catch (error) {
            console.error('保存家庭模式设置时出错:', error);
            return false;
        }
    }

    // 获取家庭模式交易记录
    async getFamilyModeTransactions() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await this.supabase
                .from('family_mode_transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('获取家庭模式交易记录失败:', error.message);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('获取家庭模式交易记录时出错:', error);
            return [];
        }
    }

    // 添加家庭模式交易记录
    async addFamilyModeTransaction(transaction) {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return false;

            const { error } = await this.supabase
                .from('family_mode_transactions')
                .insert({
                    user_id: user.id,
                    ...transaction,
                    created_at: new Date().toISOString()
                });

            if (error) {
                console.error('添加家庭模式交易记录失败:', error.message);
                return false;
            }

            return true;
        } catch (error) {
            console.error('添加家庭模式交易记录时出错:', error);
            return false;
        }
    }

    // ========== 自由职业者模式数据库操作 ==========

    // 获取自由职业者模式设置
    async getFreelancerModeSettings() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await this.supabase
                .from('freelancer_mode_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.warn('获取自由职业者模式设置失败:', error.message);
            }

            return data || {
                business_name: '',
                tax_id: '',
                business_type: '',
                monthly_revenue: 0,
                operating_costs: 0,
                tax_rate: 0.2
            };
        } catch (error) {
            console.error('获取自由职业者模式设置时出错:', error);
            return null;
        }
    }

    // 保存自由职业者模式设置
    async saveFreelancerModeSettings(settings) {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return false;

            const { error } = await this.supabase
                .from('freelancer_mode_settings')
                .upsert({
                    user_id: user.id,
                    ...settings,
                    updated_at: new Date().toISOString()
                });

            if (error) {
                console.error('保存自由职业者模式设置失败:', error.message);
                return false;
            }

            return true;
        } catch (error) {
            console.error('保存自由职业者模式设置时出错:', error);
            return false;
        }
    }

    // 获取自由职业者模式交易记录
    async getFreelancerModeTransactions() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await this.supabase
                .from('freelancer_mode_transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('获取自由职业者模式交易记录失败:', error.message);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('获取自由职业者模式交易记录时出错:', error);
            return [];
        }
    }

    // 添加自由职业者模式交易记录
    async addFreelancerModeTransaction(transaction) {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return false;

            const { error } = await this.supabase
                .from('freelancer_mode_transactions')
                .insert({
                    user_id: user.id,
                    ...transaction,
                    created_at: new Date().toISOString()
                });

            if (error) {
                console.error('添加自由职业者模式交易记录失败:', error.message);
                return false;
            }

            return true;
        } catch (error) {
            console.error('添加自由职业者模式交易记录时出错:', error);
            return false;
        }
    }

    // ========== 通用数据库操作 ==========

    // 获取用户统计信息
    async getUserStatistics() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return null;

            const mode = await this.getCurrentUserMode();
            
            let statistics = {
                total_income: 0,
                total_expense: 0,
                balance: 0,
                monthly_budget: 0,
                savings_goal: 0
            };

            // 根据模式获取相应的统计数据
            switch (mode) {
                case 'student':
                    const studentSettings = await this.getStudentModeSettings();
                    const studentTransactions = await this.getStudentModeTransactions();
                    
                    statistics.total_income = studentTransactions
                        .filter(t => t.type === 'income')
                        .reduce((sum, t) => sum + t.amount, 0);
                    
                    statistics.total_expense = studentTransactions
                        .filter(t => t.type === 'expense')
                        .reduce((sum, t) => sum + t.amount, 0);
                    
                    statistics.balance = statistics.total_income - statistics.total_expense;
                    statistics.monthly_budget = studentSettings?.monthly_allowance || 0;
                    statistics.savings_goal = studentSettings?.savings_goal || 0;
                    break;

                case 'family':
                    const familySettings = await this.getFamilyModeSettings();
                    const familyTransactions = await this.getFamilyModeTransactions();
                    
                    statistics.total_income = familyTransactions
                        .filter(t => t.type === 'income')
                        .reduce((sum, t) => sum + t.amount, 0);
                    
                    statistics.total_expense = familyTransactions
                        .filter(t => t.type === 'expense')
                        .reduce((sum, t) => sum + t.amount, 0);
                    
                    statistics.balance = statistics.total_income - statistics.total_expense;
                    statistics.monthly_budget = familySettings?.shared_budget || 0;
                    statistics.savings_goal = familySettings?.savings_goal || 0;
                    break;

                case 'freelancer':
                    const freelancerSettings = await this.getFreelancerModeSettings();
                    const freelancerTransactions = await this.getFreelancerModeTransactions();
                    
                    statistics.total_income = freelancerTransactions
                        .filter(t => t.type === 'income')
                        .reduce((sum, t) => sum + t.amount, 0);
                    
                    statistics.total_expense = freelancerTransactions
                        .filter(t => t.type === 'expense')
                        .reduce((sum, t) => sum + t.amount, 0);
                    
                    statistics.balance = statistics.total_income - statistics.total_expense;
                    statistics.monthly_budget = freelancerSettings?.monthly_revenue || 0;
                    statistics.savings_goal = 0; // 自由职业者模式不设储蓄目标
                    break;
            }

            return statistics;
        } catch (error) {
            console.error('获取用户统计信息时出错:', error);
            return null;
        }
    }

    // 导出用户数据
    async exportUserData() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return null;

            const mode = await this.getCurrentUserMode();
            
            const exportData = {
                user_info: {
                    id: user.id,
                    email: user.email,
                    current_mode: mode,
                    export_date: new Date().toISOString()
                },
                settings: {},
                transactions: []
            };

            // 根据模式导出相应的数据
            switch (mode) {
                case 'student':
                    exportData.settings.student = await this.getStudentModeSettings();
                    exportData.transactions = await this.getStudentModeTransactions();
                    break;

                case 'family':
                    exportData.settings.family = await this.getFamilyModeSettings();
                    exportData.transactions = await this.getFamilyModeTransactions();
                    break;

                case 'freelancer':
                    exportData.settings.freelancer = await this.getFreelancerModeSettings();
                    exportData.transactions = await this.getFreelancerModeTransactions();
                    break;
            }

            return exportData;
        } catch (error) {
            console.error('导出用户数据时出错:', error);
            return null;
        }
    }

    // 导入用户数据
    async importUserData(importData) {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return false;

            const { settings, transactions } = importData;

            // 根据模式导入相应的数据
            if (settings.student) {
                await this.saveStudentModeSettings(settings.student);
                
                for (const transaction of transactions) {
                    await this.addStudentModeTransaction(transaction);
                }
            } else if (settings.family) {
                await this.saveFamilyModeSettings(settings.family);
                
                for (const transaction of transactions) {
                    await this.addFamilyModeTransaction(transaction);
                }
            } else if (settings.freelancer) {
                await this.saveFreelancerModeSettings(settings.freelancer);
                
                for (const transaction of transactions) {
                    await this.addFreelancerModeTransaction(transaction);
                }
            }

            return true;
        } catch (error) {
            console.error('导入用户数据时出错:', error);
            return false;
        }
    }
}

// 导出单例
export default ModeDatabase;