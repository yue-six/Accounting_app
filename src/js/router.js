// 路由管理器
class Router {
    constructor(app) {
        this.app = app;
        this.pages = {
            'home': null,
            'analysis': null,
            'profile': null,
            'login': null,
            'register': null
        };
        this.currentPage = 'home';
    }

    // 初始化路由
    init() {
        this.loadPages();
        this.setupNavigation();
        this.setupSwipeSupport();
        if (!this.isAuthenticated()) {
            this.switchToPage('login');
        } else {
            this.switchToPage('home');
        }
    }

    // 加载页面模块
    loadPages() {
        // 页面模块将在各自的文件中定义
        this.pages.home = HomePage;
        this.pages.analysis = AnalysisPage;
        this.pages.profile = ProfilePage;
        this.pages.login = LoginPage;
        this.pages.register = RegisterPage;
        
        // 用户模式页面（整合版）
        this.pages['user-mode'] = UserModePage;
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
        if (!this.pages[pageName]) {
            console.error(`页面 ${pageName} 未找到`);
            return;
        }

        // 受保护页面拦截（未登录禁止访问除登录/注册外的页面）
        const publicPages = ['login', 'register'];
        if (!publicPages.includes(pageName) && !this.isAuthenticated()) {
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
        
        try {
            // 创建页面实例
            const pageInstance = new this.pages[pageName](this.app);
            
            // 渲染页面
            container.innerHTML = pageInstance.render();
            
            // 初始化页面事件
            if (typeof pageInstance.initEvents === 'function') {
                pageInstance.initEvents();
            }
            
            // 更新页面数据
            if (typeof pageInstance.updateData === 'function') {
                pageInstance.updateData();
            }
        } catch (error) {
            console.error(`渲染页面 ${pageName} 时发生错误:`, error);
            // 显示错误页面而不是弹出错误提示
            container.innerHTML = `
                <div class="page active" style="padding: 20px; text-align: center;">
                    <div style="color: #e53e3e; margin-bottom: 20px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem;"></i>
                    </div>
                    <h3>页面加载失败</h3>
                    <p style="color: #718096; margin: 20px 0;">页面暂时无法访问，请稍后重试</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">刷新页面</button>
                </div>
            `;
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
}