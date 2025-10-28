/**
 * 支付登录管理器
 * 统一管理微信支付和支付宝的登录连接功能
 */
class PaymentLoginManager {
    constructor(app) {
        this.app = app;
        this.initialized = false;
        
        // 支付服务配置
        this.paymentServices = {
            wechat: {
                name: '微信支付',
                service: null,
                callbackFile: 'wechat-callback.html',
                connected: false
            },
            alipay: {
                name: '支付宝',
                service: null,
                callbackFile: 'alipay-callback.html',
                connected: false
            }
        };
        
        this.init();
    }

    /**
     * 初始化支付登录管理器
     */
    init() {
        if (this.initialized) return;
        
        try {
            // 检查并初始化微信OAuth服务
            if (typeof window.WechatOAuthService !== 'undefined') {
                this.paymentServices.wechat.service = new window.WechatOAuthService();
                console.log('微信OAuth服务已加载');
            } else if (typeof window.wechatOAuth !== 'undefined') {
                this.paymentServices.wechat.service = window.wechatOAuth;
                console.log('微信OAuth服务已加载（全局实例）');
            } else {
                console.warn('微信OAuth服务未找到，将使用模拟模式');
                this.paymentServices.wechat.service = this.createMockWechatService();
            }

            // 检查并初始化支付宝OAuth服务
            if (typeof window.AlipayOAuthService !== 'undefined') {
                this.paymentServices.alipay.service = new window.AlipayOAuthService();
                console.log('支付宝OAuth服务已加载');
            } else if (typeof window.alipayOAuth !== 'undefined') {
                this.paymentServices.alipay.service = window.alipayOAuth;
                console.log('支付宝OAuth服务已加载（全局实例）');
            } else {
                console.warn('支付宝OAuth服务未找到，将使用模拟模式');
                this.paymentServices.alipay.service = this.createMockAlipayService();
            }

            // 加载支付连接状态
            this.loadPaymentConnections();
            
            // 检查回调处理
            this.handleOAuthCallback();
            
            this.initialized = true;
            console.log('支付登录管理器初始化完成');
            
        } catch (error) {
            console.error('支付登录管理器初始化失败:', error);
        }
    }

    /**
     * 创建模拟微信服务
     */
    createMockWechatService() {
        return {
            config: {
                appId: 'mock_wechat_app_id',
                authorizeUrl: 'https://open.weixin.qq.com/connect/qrconnect'
            },
            
            generateAuthUrl(redirectUri, state) {
                const params = new URLSearchParams({
                    appid: this.config.appId,
                    redirect_uri: redirectUri,
                    response_type: 'code',
                    scope: 'snsapi_login',
                    state: state || 'mock_wechat_state_' + Date.now()
                });
                return `${this.config.authorizeUrl}?${params.toString()}#wechat_redirect`;
            },
            
            generateState() {
                return 'mock_wechat_state_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            },
            
            saveOAuthState(state, redirectUrl) {
                try {
                    sessionStorage.setItem('wechat_oauth_state', state);
                    sessionStorage.setItem('wechat_oauth_redirect', redirectUrl);
                } catch (e) {
                    console.warn('无法保存微信OAuth状态:', e);
                }
            },
            
            validateState(state) {
                const savedState = sessionStorage.getItem('wechat_oauth_state');
                return state === savedState;
            },
            
            startOAuthLogin(redirectUri) {
                const state = this.generateState();
                const authUrl = this.generateAuthUrl(redirectUri, state);
                this.saveOAuthState(state, window.location.href);
                
                console.log('模拟微信登录URL:', authUrl);
                
                // 模拟登录流程
                setTimeout(() => {
                    this.handleMockWechatLogin();
                }, 1000);
                
                return true;
            },
            
            handleMockWechatLogin() {
                const userData = {
                    provider: 'wechat',
                    nickname: '微信用户',
                    openid: 'mock_wechat_openid_' + Date.now(),
                    loginTime: new Date().toISOString()
                };
                
                localStorage.setItem('auth_user', JSON.stringify(userData));
                
                // 更新支付连接状态
                const paymentConnections = JSON.parse(localStorage.getItem('paymentConnections') || '{}');
                paymentConnections.wechat = {
                    connected: true,
                    connectedAt: new Date().toISOString(),
                    lastSync: new Date().toISOString()
                };
                localStorage.setItem('paymentConnections', JSON.stringify(paymentConnections));
                
                this.app.showToast('微信登录成功！');
                
                // 刷新页面
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        };
    }

    /**
     * 创建模拟支付宝服务
     */
    createMockAlipayService() {
        return {
            config: {
                appId: 'mock_alipay_app_id',
                authorizeUrl: 'https://openauth.alipay.com/oauth2/publicAppAuthorize.htm'
            },
            
            generateAuthUrl(redirectUri, state) {
                const params = new URLSearchParams({
                    app_id: this.config.appId,
                    redirect_uri: redirectUri,
                    response_type: 'code',
                    scope: 'auth_user',
                    state: state || 'mock_alipay_state_' + Date.now()
                });
                return `${this.config.authorizeUrl}?${params.toString()}`;
            },
            
            generateState() {
                return 'mock_alipay_state_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            },
            
            saveOAuthState(state, redirectUrl) {
                try {
                    sessionStorage.setItem('alipay_oauth_state', state);
                    sessionStorage.setItem('alipay_oauth_redirect', redirectUrl);
                } catch (e) {
                    console.warn('无法保存支付宝OAuth状态:', e);
                }
            },
            
            validateState(state) {
                const savedState = sessionStorage.getItem('alipay_oauth_state');
                return state === savedState;
            },
            
            startOAuthLogin(redirectUri) {
                const state = this.generateState();
                const authUrl = this.generateAuthUrl(redirectUri, state);
                this.saveOAuthState(state, window.location.href);
                
                console.log('模拟支付宝登录URL:', authUrl);
                
                // 模拟登录流程
                setTimeout(() => {
                    this.handleMockAlipayLogin();
                }, 1000);
                
                return true;
            },
            
            handleMockAlipayLogin() {
                const userData = {
                    provider: 'alipay',
                    nickname: '支付宝用户',
                    user_id: 'mock_alipay_user_id_' + Date.now(),
                    loginTime: new Date().toISOString()
                };
                
                localStorage.setItem('auth_user', JSON.stringify(userData));
                
                // 更新支付连接状态
                const paymentConnections = JSON.parse(localStorage.getItem('paymentConnections') || '{}');
                paymentConnections.alipay = {
                    connected: true,
                    connectedAt: new Date().toISOString(),
                    lastSync: new Date().toISOString()
                };
                localStorage.setItem('paymentConnections', JSON.stringify(paymentConnections));
                
                this.app.showToast('支付宝登录成功！');
                
                // 刷新页面
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        };
    }

    /**
     * 加载支付连接状态
     */
    loadPaymentConnections() {
        try {
            const paymentConnections = JSON.parse(localStorage.getItem('paymentConnections') || '{}');
            
            if (paymentConnections.wechat) {
                this.paymentServices.wechat.connected = paymentConnections.wechat.connected || false;
            }
            
            if (paymentConnections.alipay) {
                this.paymentServices.alipay.connected = paymentConnections.alipay.connected || false;
            }
            
            console.log('支付连接状态已加载:', paymentConnections);
            
        } catch (error) {
            console.error('加载支付连接状态失败:', error);
        }
    }

    /**
     * 处理OAuth回调
     */
    handleOAuthCallback() {
        // 检查URL参数
        const urlParams = new URLSearchParams(window.location.search);
        
        // 检查微信回调
        const wechatCode = urlParams.get('code');
        const wechatState = urlParams.get('state');
        
        if (wechatCode && wechatState) {
            this.handleWechatCallback(wechatCode, wechatState);
            return;
        }
        
        // 检查支付宝回调
        const alipayAuthCode = urlParams.get('auth_code');
        const alipayState = urlParams.get('state');
        
        if (alipayAuthCode && alipayState) {
            this.handleAlipayCallback(alipayAuthCode, alipayState);
            return;
        }
    }

    /**
     * 处理微信回调
     */
    async handleWechatCallback(code, state) {
        try {
            this.app.showToast('正在处理微信登录...');
            
            // 验证state
            if (!this.paymentServices.wechat.service.validateState(state)) {
                throw new Error('状态参数验证失败');
            }
            
            // 模拟登录成功
            const userData = {
                provider: 'wechat',
                nickname: '微信用户',
                openid: 'wechat_openid_' + Date.now(),
                loginTime: new Date().toISOString()
            };
            
            localStorage.setItem('auth_user', JSON.stringify(userData));
            
            // 更新支付连接状态
            const paymentConnections = JSON.parse(localStorage.getItem('paymentConnections') || '{}');
            paymentConnections.wechat = {
                connected: true,
                connectedAt: new Date().toISOString(),
                lastSync: new Date().toISOString()
            };
            localStorage.setItem('paymentConnections', JSON.stringify(paymentConnections));
            
            this.app.showToast('微信登录成功！');
            
            // 清除URL参数并跳转
            setTimeout(() => {
                window.location.href = this.paymentServices.wechat.service.getSavedRedirectUrl() || 'index.html';
            }, 1000);
            
        } catch (error) {
            console.error('处理微信回调失败:', error);
            this.app.showToast('微信登录失败: ' + error.message);
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    }

    /**
     * 处理支付宝回调
     */
    async handleAlipayCallback(authCode, state) {
        try {
            this.app.showToast('正在处理支付宝登录...');
            
            // 验证state
            if (!this.paymentServices.alipay.service.validateState(state)) {
                throw new Error('状态参数验证失败');
            }
            
            // 模拟登录成功
            const userData = {
                provider: 'alipay',
                nickname: '支付宝用户',
                user_id: 'alipay_user_id_' + Date.now(),
                loginTime: new Date().toISOString()
            };
            
            localStorage.setItem('auth_user', JSON.stringify(userData));
            
            // 更新支付连接状态
            const paymentConnections = JSON.parse(localStorage.getItem('paymentConnections') || '{}');
            paymentConnections.alipay = {
                connected: true,
                connectedAt: new Date().toISOString(),
                lastSync: new Date().toISOString()
            };
            localStorage.setItem('paymentConnections', JSON.stringify(paymentConnections));
            
            this.app.showToast('支付宝登录成功！');
            
            // 清除URL参数并跳转
            setTimeout(() => {
                window.location.href = this.paymentServices.alipay.service.getSavedRedirectUrl() || 'index.html';
            }, 1000);
            
        } catch (error) {
            console.error('处理支付宝回调失败:', error);
            this.app.showToast('支付宝登录失败: ' + error.message);
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    }

    /**
     * 启动微信支付登录
     */
    startWechatLogin() {
        try {
            const redirectUri = window.location.origin + '/wechat-callback.html';
            
            if (this.paymentServices.wechat.service && typeof this.paymentServices.wechat.service.startOAuthLogin === 'function') {
                const success = this.paymentServices.wechat.service.startOAuthLogin(redirectUri);
                
                if (success) {
                    this.app.showToast('正在启动微信登录...');
                } else {
                    this.app.showToast('启动微信登录失败，请重试');
                }
                
            } else {
                throw new Error('微信OAuth服务不可用');
            }
            
        } catch (error) {
            console.error('启动微信登录失败:', error);
            this.app.showToast('启动微信登录失败: ' + error.message);
        }
    }

    /**
     * 启动支付宝登录
     */
    startAlipayLogin() {
        try {
            const redirectUri = window.location.origin + '/alipay-callback.html';
            
            if (this.paymentServices.alipay.service && typeof this.paymentServices.alipay.service.startOAuthLogin === 'function') {
                const success = this.paymentServices.alipay.service.startOAuthLogin(redirectUri);
                
                if (success) {
                    this.app.showToast('正在启动支付宝登录...');
                } else {
                    this.app.showToast('启动支付宝登录失败，请重试');
                }
                
            } else {
                throw new Error('支付宝OAuth服务不可用');
            }
            
        } catch (error) {
            console.error('启动支付宝登录失败:', error);
            this.app.showToast('启动支付宝登录失败: ' + error.message);
        }
    }

    /**
     * 获取支付连接状态
     */
    getPaymentStatus(provider) {
        if (this.paymentServices[provider]) {
            return {
                connected: this.paymentServices[provider].connected,
                name: this.paymentServices[provider].name
            };
        }
        return { connected: false, name: '未知' };
    }

    /**
     * 断开支付连接
     */
    disconnectPayment(provider) {
        try {
            const paymentConnections = JSON.parse(localStorage.getItem('paymentConnections') || '{}');
            
            if (paymentConnections[provider]) {
                paymentConnections[provider].connected = false;
                paymentConnections[provider].disconnectedAt = new Date().toISOString();
                localStorage.setItem('paymentConnections', JSON.stringify(paymentConnections));
                
                this.paymentServices[provider].connected = false;
                
                this.app.showToast(`${this.paymentServices[provider].name}已断开连接`);
                
                // 刷新页面
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                
            } else {
                this.app.showToast(`${this.paymentServices[provider].name}未连接`);
            }
            
        } catch (error) {
            console.error('断开支付连接失败:', error);
            this.app.showToast('操作失败: ' + error.message);
        }
    }
}

// 创建全局实例
if (typeof window !== 'undefined') {
    window.PaymentLoginManager = PaymentLoginManager;
}

export default PaymentLoginManager;