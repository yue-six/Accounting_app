// 微信OAuth2登录组件 - 按照微信开放平台标准流程
class WechatOAuthLogin {
    constructor(app) {
        this.app = app;
        this.oauthConfig = {
            authUrl: 'https://warm-halva-bafc60.netlify.app/api/payments/wechat/auth-url',
            callbackUrl: 'https://warm-halva-bafc60.netlify.app/api/payments/wechat/callback'
        };
    }

    /**
     * 启动微信OAuth2登录流程
     */
    async startOAuthLogin() {
        try {
            this.app.showToast('正在启动微信登录...', 'info');
            
            // 生成回调URL和state参数
            const redirectUri = window.location.origin + '/wechat-callback.html';
            const state = this.generateState();
            
            // 保存state到sessionStorage用于回调验证
            sessionStorage.setItem('wechat_oauth_state', state);
            sessionStorage.setItem('wechat_oauth_redirect', window.location.href);
            
            // 直接构建微信授权URL，不依赖后端服务
            const authUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=APPID&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`;
            
            // 跳转到微信授权页面
            window.location.href = authUrl;
            
        } catch (error) {
            console.error('启动微信OAuth2登录失败:', error);
            // 不再降级到模拟登录，直接向用户报告并停止流程
            this.app.showToast('启动微信登录失败，请稍后重试', 'error');
        }
    }

    /**
     * 处理微信OAuth2回调
     * @param {string} code - 授权码
     * @param {string} state - 状态参数
     */
    async handleOAuthCallback(code, state) {
        try {
            this.app.showToast('正在验证登录信息...', 'info');
            
            // 验证state参数
            const savedState = sessionStorage.getItem('wechat_oauth_state');
            if (state !== savedState) {
                throw new Error('状态参数验证失败');
            }
            
            // 调用后端处理回调
            const response = await fetch(this.oauthConfig.callbackUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code })
            });
            
            const data = await response.json();
            
            if (data.success) {
                await this.handleLoginSuccess(data.data);
            } else {
                throw new Error(data.message || '登录验证失败');
            }
            
        } catch (error) {
            console.error('微信OAuth2回调处理失败:', error);
            this.app.showToast('微信登录失败，请重试', 'error');
        }
    }

    /**
     * 处理登录成功
     * @param {Object} loginData - 登录数据
     */
    async handleLoginSuccess(loginData) {
        const { user, tokenInfo } = loginData;
        
        // 保存用户信息到localStorage
        const authUser = {
            provider: 'wechat',
            openid: user.openid,
            unionid: user.unionid,
            nickname: user.nickname,
            avatar: user.avatar,
            gender: user.gender,
            province: user.province,
            city: user.city,
            country: user.country,
            tokenInfo: tokenInfo,
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('auth_user', JSON.stringify(authUser));
        
        // 保存支付连接状态
        const paymentConnections = JSON.parse(localStorage.getItem('paymentConnections') || '{}');
        paymentConnections.wechat = {
            connected: true,
            connectedAt: new Date().toISOString(),
            lastSync: new Date().toISOString(),
            userInfo: user
        };
        localStorage.setItem('paymentConnections', JSON.stringify(paymentConnections));
        
        this.app.showToast('微信登录成功！', 'success');
        
        // 更新支付状态
        if (typeof updatePaymentStatus === 'function') {
            updatePaymentStatus('wechat', 'connected');
        }
        
        // 跳转到首页或原页面
        const redirectUrl = sessionStorage.getItem('wechat_oauth_redirect') || 'home';
        this.redirectAfterLogin(redirectUrl);
        
        // 清理sessionStorage
        sessionStorage.removeItem('wechat_oauth_state');
        sessionStorage.removeItem('wechat_oauth_redirect');
    }
    // 不再提供模拟登录作为降级方案，真实环境需要后端支持

    /**
     * 生成随机的state参数
     */
    generateState() {
        return 'wechat_oauth_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 登录后跳转
     * @param {string} url - 跳转URL
     */
    redirectAfterLogin(url) {
        if (url === 'home' && window.router) {
            window.router.switchToPage('home');
        } else if (url.startsWith(window.location.origin)) {
            window.location.href = url;
        } else {
            // 默认跳转到首页
            if (window.router) {
                window.router.switchToPage('home');
            }
        }
    }

    /**
     * 检查URL中的OAuth2回调参数
     */
    checkUrlForOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (code && state) {
            // 当前页面是OAuth2回调页面
            this.handleOAuthCallback(code, state);
            return true;
        }
        
        return false;
    }

    /**
     * 创建微信登录按钮
     */
    createLoginButton(container, options = {}) {
        const button = document.createElement('button');
        button.className = options.className || 'wechat-oauth-btn';
        button.innerHTML = `
            <i class="fab fa-weixin"></i>
            <span>${options.text || '微信登录'}</span>
        `;
        
        button.addEventListener('click', () => {
            this.startOAuthLogin();
        });
        
        if (container) {
            container.appendChild(button);
        }
        
        return button;
    }
}

// 全局注册
if (typeof window !== 'undefined') {
    window.WechatOAuthLogin = WechatOAuthLogin;
}

export default WechatOAuthLogin;