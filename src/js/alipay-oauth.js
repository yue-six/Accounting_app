/**
 * 支付宝OAuth2前端服务类
 * 负责支付宝授权链接的拼接和回调处理
 */
class AlipayOAuthService {
    constructor() {
        this.config = {
            appId: '2021006103604761',
            authorizeUrl: 'https://openauth.alipay.com/oauth2/publicAppAuthorize.htm',
            scope: 'auth_user'
        };
    }

    /**
     * 生成支付宝OAuth2授权URL
     * @param {string} redirectUri - 回调地址
     * @param {string} state - 状态参数（可选）
     * @returns {string} 授权URL
     */
    generateAuthUrl(redirectUri, state = '') {
        if (!redirectUri) {
            throw new Error('回调地址不能为空');
        }

        const params = new URLSearchParams({
            app_id: this.config.appId,
            scope: this.config.scope,
            redirect_uri: redirectUri,
            state: state || this.generateState()
        });

        return `${this.config.authorizeUrl}?${params.toString()}`;
    }

    /**
     * 生成随机的state参数
     * @returns {string} state参数
     */
    generateState() {
        return 'alipay_oauth_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
            sessionStorage.setItem('alipay_oauth_state', state);
            sessionStorage.setItem('alipay_oauth_redirect', redirectUrl);
            sessionStorage.setItem('alipay_oauth_timestamp', timestamp);
        } catch (e) {
            console.warn('无法写入 sessionStorage:', e);
            // 使用localStorage作为备选方案
            try {
                localStorage.setItem('alipay_oauth_state', state);
                localStorage.setItem('alipay_oauth_redirect', redirectUrl);
                localStorage.setItem('alipay_oauth_timestamp', timestamp);
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
        let savedState = sessionStorage.getItem('alipay_oauth_state');
        let savedTimestamp = sessionStorage.getItem('alipay_oauth_timestamp');

        if (!savedState) {
            savedState = localStorage.getItem('alipay_oauth_state');
            savedTimestamp = localStorage.getItem('alipay_oauth_timestamp');
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
        let redirectUrl = sessionStorage.getItem('alipay_oauth_redirect');
        if (!redirectUrl) {
            redirectUrl = localStorage.getItem('alipay_oauth_redirect');
        }
        return redirectUrl || 'index.html';
    }

    /**
     * 清除OAuth2状态信息
     */
    clearOAuthState() {
        try {
            sessionStorage.removeItem('alipay_oauth_state');
            sessionStorage.removeItem('alipay_oauth_redirect');
            sessionStorage.removeItem('alipay_oauth_timestamp');
            
            localStorage.removeItem('alipay_oauth_state');
            localStorage.removeItem('alipay_oauth_redirect');
            localStorage.removeItem('alipay_oauth_timestamp');
        } catch (e) {
            console.warn('清除OAuth状态信息失败:', e);
        }
    }

    /**
     * 启动支付宝OAuth2登录
     * @param {string} redirectUri - 回调地址
     * @returns {boolean} 是否成功启动
     */
    startOAuthLogin(redirectUri) {
        try {
            const state = this.generateState();
            const authUrl = this.generateAuthUrl(redirectUri, state);
            
            // 保存状态信息
            this.saveOAuthState(state, window.location.href);
            
            console.log('支付宝授权URL:', authUrl);
            
            // 跳转到支付宝授权页面
            window.location.href = authUrl;
            return true;
        } catch (error) {
            console.error('启动支付宝OAuth2登录失败:', error);
            return false;
        }
    }

    /**
     * 处理支付宝OAuth2回调
     * @param {string} authCode - 授权码
     * @param {string} state - 状态参数
     * @returns {Promise<Object>} 处理结果
     */
    async handleOAuthCallback(authCode, state) {
        try {
            // 验证state参数
            if (!this.validateState(state)) {
                throw new Error('状态参数验证失败');
            }

            // 调用后端API处理OAuth2回调
            const response = await fetch('http://localhost:3000/api/payments/alipay/callback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ auth_code: authCode })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                // 登录成功，保存用户信息
                const authUser = {
                    provider: 'alipay',
                    ...data.data.user,
                    tokenInfo: data.data.tokenInfo,
                    loginTime: data.data.loginTime
                };
                
                localStorage.setItem('auth_user', JSON.stringify(authUser));
                
                // 保存支付连接状态
                const paymentConnections = JSON.parse(localStorage.getItem('paymentConnections') || '{}');
                paymentConnections.alipay = {
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
                throw new Error(data.message || '支付宝登录失败');
            }
            
        } catch (error) {
            console.error('处理支付宝OAuth2回调失败:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 检查当前页面是否为支付宝OAuth2回调页面
     * @returns {Object|null} 回调参数或null
     */
    checkForOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('auth_code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (authCode && state) {
            return {
                authCode,
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
    window.AlipayOAuthService = AlipayOAuthService;
    window.alipayOAuth = new AlipayOAuthService();
}

export default AlipayOAuthService;