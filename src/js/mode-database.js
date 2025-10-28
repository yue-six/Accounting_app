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
                family_name: '我的家庭',
                family_members: [],
                shared_budget: 0,
                monthly_income: 0
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

    // 获取家庭交易记录
    async getFamilyTransactions(familyId) {
        try {
            const { data, error } = await this.supabase
                .from('family_transactions')
                .select('*')
                .eq('family_id', familyId)
                .order('date', { ascending: false });

            if (error) {
                console.error('获取家庭交易记录失败:', error.message);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('获取家庭交易记录时出错:', error);
            return [];
        }
    }

    // 添加家庭交易记录
    async addFamilyTransaction(transaction) {
        try {
            const { error } = await this.supabase
                .from('family_transactions')
                .insert(transaction);

            if (error) {
                console.error('添加家庭交易记录失败:', error.message);
                return false;
            }

            return true;
        } catch (error) {
            console.error('添加家庭交易记录时出错:', error);
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
                min_operating_funds: 10000,
                business_categories: {
                    income: ['项目尾款', '客户定金', '咨询服务费'],
                    cost: ['设备采购', '平台手续费', '交通差旅'],
                    personal: ['房租', '日常餐饮', '个人购物']
                }
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

    // 获取商业交易记录
    async getBusinessTransactions(freelancerId) {
        try {
            const { data, error } = await this.supabase
                .from('business_transactions')
                .select('*')
                .eq('freelancer_id', freelancerId)
                .order('date', { ascending: false });

            if (error) {
                console.error('获取商业交易记录失败:', error.message);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('获取商业交易记录时出错:', error);
            return [];
        }
    }

    // 添加商业交易记录
    async addBusinessTransaction(transaction) {
        try {
            const { error } = await this.supabase
                .from('business_transactions')
                .insert(transaction);

            if (error) {
                console.error('添加商业交易记录失败:', error.message);
                return false;
            }

            return true;
        } catch (error) {
            console.error('添加商业交易记录时出错:', error);
            return false;
        }
    }

    // 获取发票记录
    async getInvoices(freelancerId) {
        try {
            const { data, error } = await this.supabase
                .from('invoices')
                .select('*')
                .eq('freelancer_id', freelancerId)
                .order('date', { ascending: false });

            if (error) {
                console.error('获取发票记录失败:', error.message);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('获取发票记录时出错:', error);
            return [];
        }
    }

    // 添加发票记录
    async addInvoice(invoice) {
        try {
            const { error } = await this.supabase
                .from('invoices')
                .insert(invoice);

            if (error) {
                console.error('添加发票记录失败:', error.message);
                return false;
            }

            return true;
        } catch (error) {
            console.error('添加发票记录时出错:', error);
            return false;
        }
    }

    // 获取税务报告
    async getTaxReports(freelancerId) {
        try {
            const { data, error } = await this.supabase
                .from('tax_reports')
                .select('*')
                .eq('freelancer_id', freelancerId)
                .order('year, quarter', { ascending: false });

            if (error) {
                console.error('获取税务报告失败:', error.message);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('获取税务报告时出错:', error);
            return [];
        }
    }

    // 生成税务报告
    async generateTaxReport(report) {
        try {
            const { error } = await this.supabase
                .from('tax_reports')
                .insert(report);

            if (error) {
                console.error('生成税务报告失败:', error.message);
                return false;
            }

            return true;
        } catch (error) {
            console.error('生成税务报告时出错:', error);
            return false;
        }
    }

    // 获取现金流预警
    async getCashFlowAlerts(freelancerId) {
        try {
            const { data, error } = await this.supabase
                .from('cash_flow_alerts')
                .select('*')
                .eq('freelancer_id', freelancerId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('获取现金流预警失败:', error.message);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('获取现金流预警时出错:', error);
            return [];
        }
    }

    // 添加现金流预警
    async addCashFlowAlert(alert) {
        try {
            const { error } = await this.supabase
                .from('cash_flow_alerts')
                .insert(alert);

            if (error) {
                console.error('添加现金流预警失败:', error.message);
                return false;
            }

            return true;
        } catch (error) {
            console.error('添加现金流预警时出错:', error);
            return false;
        }
    }

    // ========== 通用数据库操作 ==========

    // 获取用户交易记录
    async getUserTransactions() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await this.supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            if (error) {
                console.error('获取用户交易记录失败:', error.message);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('获取用户交易记录时出错:', error);
            return [];
        }
    }

    // 添加用户交易记录
    async addUserTransaction(transaction) {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return false;

            const { error } = await this.supabase
                .from('transactions')
                .insert({
                    ...transaction,
                    user_id: user.id
                });

            if (error) {
                console.error('添加用户交易记录失败:', error.message);
                return false;
            }

            return true;
        } catch (error) {
            console.error('添加用户交易记录时出错:', error);
            return false;
        }
    }

    // 获取分类列表
    async getCategories() {
        try {
            const { data, error } = await this.supabase
                .from('categories')
                .select('*')
                .order('name');

            if (error) {
                console.error('获取分类列表失败:', error.message);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('获取分类列表时出错:', error);
            return [];
        }
    }

    // 检查数据库连接状态
    isConnected() {
        return this.supabase?.isConnected || false;
    }
}

// 创建全局模式数据库实例
const modeDatabase = new ModeDatabase(supabaseClient);

// 导出单例
export default modeDatabase;