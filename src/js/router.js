// 路由管理器
class Router {
    constructor(app) {
        this.app = app;
        this.pages = {
            'home': null,
            'analysis': null,
            'profile': null,
            'login': null,
            'register': null,
            'phone-login': null,
            'savings-goals': null,
            'student-mode': null,
            'family-mode': null
        };
        this.currentPage = 'home';
        this.userMode = localStorage.getItem('user_mode') || 'student';
    }

    // 初始化路由
    init() {
        this.loadPages();
        this.setupNavigation();
        this.setupSwipeSupport();
        if (!this.isAuthenticated()) {
            this.switchToPage('login');
        } else {
            // 初始化时根据用户模式更新导航栏
            this.updateNavigationForMode();
            this.switchToPage('home');
        }
    }

    // 加载页面模块
    loadPages() {
        // 安全地加载页面模块，检查每个页面类是否存在
        this.pages.home = typeof HomePage !== 'undefined' ? HomePage : null;
        this.pages.analysis = typeof AnalysisPage !== 'undefined' ? AnalysisPage : null;
        this.pages.profile = typeof ProfilePage !== 'undefined' ? ProfilePage : null;
        this.pages.login = typeof LoginPage !== 'undefined' ? LoginPage : null;
        this.pages.register = typeof RegisterPage !== 'undefined' ? RegisterPage : null;
        this.pages['phone-login'] = typeof PhoneLoginPage !== 'undefined' ? PhoneLoginPage : null;
        this.pages['savings-goals'] = typeof SavingsGoalsPage !== 'undefined' ? SavingsGoalsPage : null;
        
        // 用户模式专属页面
        if (typeof StudentModePage !== 'undefined') {
            this.pages['student-mode'] = StudentModePage;
        }
        if (typeof FamilyModePage !== 'undefined') {
            this.pages['family-mode'] = FamilyModePage;
        }
    }

    // 设置导航事件
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.getAttribute('data-page');
                const publicPages = ['login', 'register'];
                if (!publicPages.includes(page) && !this.isAuthenticated()) {
                    if (this.app && typeof this.app.showToast === 'function') {
                        this.app.showToast('请先登录', 'warning');
                    }
                    return; // 阻止切换，保持当前高亮不变
                }
                this.switchToPage(page);
            });
        });
    }

    // 设置滑动支持
    setupSwipeSupport() {
        let startX = 0;
        const pages = ['home', 'analysis', 'profile'];
        let currentIndex = pages.indexOf(this.currentPage);

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        document.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const diffX = startX - endX;

            if (Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    // 向右滑动，下一页
                    currentIndex = Math.min(currentIndex + 1, pages.length - 1);
                } else {
                    // 向左滑动，上一页
                    currentIndex = Math.max(currentIndex - 1, 0);
                }
                this.switchToPage(pages[currentIndex]);
            }
        });
    }

    // 切换到指定页面
    switchToPage(pageName) {
        console.log(`切换到页面: ${pageName}`);
        
        // 检查页面是否存在
        if (!this.pages[pageName] || this.pages[pageName] === null) {
            console.error(`页面 ${pageName} 未找到或未加载`);
            // 如果目标页面不存在，默认跳转到首页
            if (pageName !== 'home' && this.pages['home']) {
                console.log('页面不存在，跳转到首页');
                this.switchToPage('home');
            } else {
                // 如果首页也不存在，显示错误页面
                this.showErrorPage(`页面 "${pageName}" 未找到`);
            }
            return;
        }

        // 受保护页面拦截（未登录禁止访问除登录/注册外的页面）
        const publicPages = ['login', 'register'];
        if (!publicPages.includes(pageName) && !this.isAuthenticated()) {
            console.log('未登录，跳转到登录页');
            this.renderPage('login');
            this.currentPage = 'login';
            // 登录/注册页隐藏底部导航
            const bottomNav = document.querySelector('.bottom-nav');
            if (bottomNav) bottomNav.style.display = 'none';
            this.updateNavigation('home');
            return;
        }

        // 更新导航状态
        this.updateNavigation(pageName);

        // 登录/注册页隐藏底部导航，其它页显示
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            bottomNav.style.display = (pageName === 'login' || pageName === 'register') ? 'none' : 'flex';
        }

        // 渲染页面内容
        this.renderPage(pageName);

        this.currentPage = pageName;
        console.log(`页面切换完成: ${pageName}`);
    }

    // 更新导航状态
    updateNavigation(pageName) {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === pageName) {
                item.classList.add('active');
            }
        });
    }

    // 渲染页面内容
    renderPage(pageName) {
        const container = document.getElementById('page-container');
        
        // 检查页面类是否存在且不为null
        if (!this.pages[pageName]) {
            console.error(`页面组件 ${pageName} 不存在或未加载`);
            if (container) {
                container.innerHTML = `<div class="error-container">
                    <h3>页面加载失败</h3>
                    <p>页面 "${pageName}" 无法加载，请刷新页面重试</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">刷新页面</button>
                </div>`;
            }
            return;
        }
        
        try {
            // 创建页面实例
            const pageInstance = new this.pages[pageName](this.app);
            
            // 渲染页面
            const pageContent = pageInstance.render();
            if (typeof pageContent === 'string') {
                container.innerHTML = pageContent;
            } else {
                throw new Error('页面渲染方法没有返回有效的HTML字符串');
            }
            
            // 初始化页面事件
            if (typeof pageInstance.initEvents === 'function') {
                pageInstance.initEvents();
            }
            
            // 更新页面数据
            if (typeof pageInstance.updateData === 'function') {
                pageInstance.updateData();
            }
        } catch (error) {
            console.error(`渲染页面 ${pageName} 时出错:`, error);
            if (container) {
                container.innerHTML = `<div class="error-container">
                    <h3>页面渲染错误</h3>
                    <p>页面 "${pageName}" 渲染时发生错误：${error.message}</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">刷新页面</button>
                </div>`;
            }
        }
    }

    // 获取当前页面
    getCurrentPage() {
        return this.currentPage;
    }

    // 简单的本地登录态检测
    isAuthenticated() {
        try {
            return !!localStorage.getItem('auth_user');
        } catch (e) {
            return false;
        }
    }

    // 切换用户模式
    switchUserMode(mode) {
        const validModes = ['student', 'family'];
        if (!validModes.includes(mode)) {
            console.error(`无效的用户模式: ${mode}`);
            return;
        }

        this.userMode = mode;
        localStorage.setItem('user_mode', mode);
        
        // 更新应用的用户模式
        if (this.app) {
            this.app.userMode = mode;
            this.app.saveData();
        }

        // 重新加载当前页面以应用新模式
        this.reloadCurrentPageWithMode();
        
        // 更新底部导航栏以反映当前模式
        this.updateNavigationForMode();
        
        if (this.app && typeof this.app.showToast === 'function') {
            const modeNames = {
                'student': '学生模式',
                'family': '家庭模式'
            };
            this.app.showToast(`已切换到${modeNames[mode]}`, 'success');
        }
    }

    // 根据当前用户模式重新加载当前页面
    reloadCurrentPageWithMode() {
        // 保存当前页面
        const currentPage = this.currentPage;
        
        // 重新渲染当前页面，使其内容适应新的用户模式
        if (this.pages[currentPage]) {
            this.renderPage(currentPage);
        }
    }

    // 根据用户模式更新导航栏
    updateNavigationForMode() {
        // 获取底部导航栏
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            // 根据不同模式调整导航栏内容
            const navItems = bottomNav.querySelectorAll('.nav-item');
            
            // 根据模式显示/隐藏不同的导航项
            navItems.forEach(item => {
                const page = item.getAttribute('data-page');
                
                // 基本导航项在所有模式下都保留
                const alwaysVisible = ['home', 'analysis', 'profile'];
                
                if (alwaysVisible.includes(page)) {
                    item.style.display = 'flex';
                } else if (item.classList.contains('mode-nav-item')) {
                    // 模式导航项：只显示当前用户模式对应的项
                    const itemMode = item.getAttribute('data-mode');
                    item.style.display = itemMode === this.userMode ? 'flex' : 'none';
                } else {
                    // 根据用户模式显示特定功能
                    item.style.display = this.shouldShowNavItem(page, this.userMode) ? 'flex' : 'none';
                }
            });
        }
    }

    // 判断是否应该显示特定导航项
    shouldShowNavItem(page, mode) {
        // 根据用户模式定义特定的导航项显示规则
        const modeSpecificNavItems = {
            'student': ['savings-goals'], // 学生模式下显示储蓄目标
            'family': [],  // 家庭模式可以添加特定导航
            'freelancer': []  // 自由职业者模式可以添加特定导航
        };
        
        return modeSpecificNavItems[mode] && modeSpecificNavItems[mode].includes(page);
    }

    // 获取当前用户模式
    getCurrentUserMode() {
        return this.userMode;
    }

    // 检查是否在特定模式下
    isInMode(mode) {
        return this.userMode === mode;
    }
}