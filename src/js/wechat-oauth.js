/**
 * 微信OAuth2前端服务类
 * 负责微信授权链接的拼接和回调处理
 */
class WechatOAuthService {
    constructor() {
        this.config = {
            appId: 'demo_wechat_app_id', // 演示用AppID
            authorizeUrl: 'https://open.weixin.qq.com/connect/qrconnect',
            scope: 'snsapi_login'
        };
    }

    /**
     * 生成微信OAuth2授权URL
     * @param {string} redirectUri - 回调地址
     * @param {string} state - 状态参数（可选）
     * @returns {string} 授权URL
     */
    generateAuthUrl(redirectUri, state = '') {
        if (!redirectUri) {
            throw new Error('回调地址不能为空');
        }

        const params = new URLSearchParams({
            appid: this.config.appId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: this.config.scope,
            state: state || this.generateState()
        });

        return `${this.config.authorizeUrl}?${params.toString()}#wechat_redirect`;
    }

    /**
     * 生成随机的state参数
     * @returns {string} state参数
     */
    generateState() {
        return 'wechat_oauth_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 保存OAuth2状态信息
     * @param {string} state - state参数
     * @param {string} redirectUrl - 重定向URL
     */
    saveOAuthState(state, redirectUrl) {
        const timestamp = Date.now().toString();
        
        try {
            // 优先使用sessionStorage
            sessionStorage.setItem('wechat_oauth_state', state);
            sessionStorage.setItem('wechat_oauth_redirect', redirectUrl);
            sessionStorage.setItem('wechat_oauth_timestamp', timestamp);
        } catch (e) {
            console.warn('无法写入 sessionStorage:', e);
            // 使用localStorage作为备选方案
            try {
                localStorage.setItem('wechat_oauth_state', state);
                localStorage.setItem('wechat_oauth_redirect', redirectUrl);
                localStorage.setItem('wechat_oauth_timestamp', timestamp);
            } catch (e2) {
                console.error('无法写入 localStorage:', e2);
                throw new Error('无法保存OAuth状态信息');
            }
        }
    }

    /**
     * 验证state参数
     * @param {string} state - 从URL获取的state参数
     * @returns {boolean} 验证是否通过
     */
    validateState(state) {
        if (!state) {
            return false;
        }

        // 从sessionStorage或localStorage获取保存的state
        let savedState = sessionStorage.getItem('wechat_oauth_state');
        let savedTimestamp = sessionStorage.getItem('wechat_oauth_timestamp');

        if (!savedState) {
            savedState = localStorage.getItem('wechat_oauth_state');
            savedTimestamp = localStorage.getItem('wechat_oauth_timestamp');
        }

        if (!savedState) {
            console.error('未找到保存的state参数');
            return false;
        }

        // 验证state是否匹配
        if (state !== savedState) {
            console.error('state参数不匹配:', { received: state, saved: savedState });
            return false;
        }

        // 验证时间戳（10分钟内有效）
        if (savedTimestamp) {
            const timestamp = parseInt(savedTimestamp);
            const now = Date.now();
            if (now - timestamp > 10 * 60 * 1000) { // 10分钟
                console.error('state参数已过期');
                return false;
            }
        }

        return true;
    }

    /**
     * 获取保存的重定向URL
     * @returns {string} 重定向URL
     */
    getSavedRedirectUrl() {
        let redirectUrl = sessionStorage.getItem('wechat_oauth_redirect');
        if (!redirectUrl) {
            redirectUrl = localStorage.getItem('wechat_oauth_redirect');
        }
        return redirectUrl || 'index.html';
    }

    /**
     * 清除OAuth2状态信息
     */
    clearOAuthState() {
        try {
            sessionStorage.removeItem('wechat_oauth_state');
            sessionStorage.removeItem('wechat_oauth_redirect');
            sessionStorage.removeItem('wechat_oauth_timestamp');
            
            localStorage.removeItem('wechat_oauth_state');
            localStorage.removeItem('wechat_oauth_redirect');
            localStorage.removeItem('wechat_oauth_timestamp');
        } catch (e) {
            console.warn('清除OAuth状态信息失败:', e);
        }
    }

    /**
     * 启动微信OAuth2登录
     * @param {string} redirectUri - 回调地址
     * @returns {boolean} 是否成功启动
     */
    startOAuthLogin(redirectUri) {
        try {
            const state = this.generateState();
            const authUrl = this.generateAuthUrl(redirectUri, state);
            
            // 保存状态信息
            this.saveOAuthState(state, window.location.href);
            
            console.log('微信授权URL:', authUrl);
            
            // 跳转到微信授权页面
            window.location.href = authUrl;
            return true;
        } catch (error) {
            console.error('启动微信OAuth2登录失败:', error);
            return false;
        }
    }

    /**
     * 处理微信OAuth2回调
     * @param {string} code - 授权码
     * @param {string} state - 状态参数
     * @returns {Promise<Object>} 处理结果
     */
    async handleOAuthCallback(code, state) {
        try {
            // 验证state参数
            if (!this.validateState(state)) {
                throw new Error('状态参数验证失败');
            }

            // 调用后端API处理OAuth2回调
            const response = await fetch('http://localhost:3000/api/payments/wechat/callback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                // 登录成功，保存用户信息
                const authUser = {
                    provider: 'wechat',
                    ...data.data.user,
                    tokenInfo: data.data.tokenInfo,
                    loginTime: data.data.loginTime
                };
                
                localStorage.setItem('auth_user', JSON.stringify(authUser));
                
                // 保存支付连接状态
                const paymentConnections = JSON.parse(localStorage.getItem('paymentConnections') || '{}');
                paymentConnections.wechat = {
                    connected: true,
                    connectedAt: new Date().toISOString(),
                    lastSync: new Date().toISOString(),
                    userInfo: data.data.user
                };
                localStorage.setItem('paymentConnections', JSON.stringify(paymentConnections));
                
                // 清除OAuth状态信息
                this.clearOAuthState();
                
                return {
                    success: true,
                    data: data.data
                };
            } else {
                throw new Error(data.message || '微信登录失败');
            }
            
        } catch (error) {
            console.error('处理微信OAuth2回调失败:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 检查当前页面是否为微信OAuth2回调页面
     * @returns {Object|null} 回调参数或null
     */
    checkForOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (code && state) {
            return {
                code,
                state,
                error,
                errorDescription
            };
        }

        return null;
    }
}

// 创建全局实例
if (typeof window !== 'undefined') {
    window.WechatOAuthService = WechatOAuthService;
    window.wechatOAuth = new WechatOAuthService();
}

export default WechatOAuthService;