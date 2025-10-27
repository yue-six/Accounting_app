// 微信登录弹窗组件
class WechatLoginPage {
    constructor(app, loginType = 'phone') {
        this.app = app;
        this.loginType = loginType; // 'phone' 或 'account'
        this.state = {
            step: 1, // 1: 微信登录页面, 2: 确认信息页面
            userInfo: null
        };
    }

    render() {
        if (this.state.step === 1) {
            return this.renderWechatLogin();
        } else {
            return this.renderConfirmInfo();
        }
    }

    // 渲染微信登录页面
    renderWechatLogin() {
        const loginTitle = this.loginType === 'phone' ? '手机号登录' : '账号密码登录';
        
        return `
            <div class="wechat-login-overlay active">
                <div class="wechat-login-modal">
                    <div class="wechat-login-header">
                        <button class="back-btn" onclick="window.wechatLoginPage.close()">
                            <i class="fas fa-times"></i>
                        </button>
                        <h3>微信登录</h3>
                        <div class="header-placeholder"></div>
                    </div>
                    
                    <div class="wechat-login-content">
                        <div class="wechat-logo">
                            <i class="fab fa-weixin"></i>
                        </div>
                        
                        <div class="login-info">
                            <h4>智能记账申请获得以下权限</h4>
                            <div class="permission-list">
                                <div class="permission-item">
                                    <i class="fas fa-check-circle"></i>
                                    <span>获得你的公开信息（昵称、头像等）</span>
                                </div>
                                <div class="permission-item">
                                    <i class="fas fa-check-circle"></i>
                                    <span>同步微信支付记录</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="qr-code-section">
                            <div class="qr-code">
                                <div class="qr-placeholder">
                                    <i class="fab fa-weixin"></i>
                                    <span>微信扫码登录</span>
                                </div>
                            </div>
                            <p class="qr-tip">请使用微信扫描二维码登录</p>
                        </div>
                        
                        <div class="login-options">
                            <button class="login-option-btn" id="wechat-authorize-btn">
                                <i class="fas fa-external-link-alt"></i>
                                <span>前往微信授权</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="wechat-login-footer">
                        <div class="agreement">
                            <label class="checkbox-container">
                                <input type="checkbox" id="wechat-agreement" checked>
                                <span class="checkmark"></span>
                                同意《微信登录服务协议》和《隐私保护指引》
                            </label>
                        </div>
                        
                        <button class="cancel-btn" onclick="window.wechatLoginPage.close()">
                            取消
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // 渲染确认信息页面
    renderConfirmInfo() {
        const userInfo = this.state.userInfo || {
            nickname: '微信用户',
            avatar: '👤',
            loginType: this.loginType
        };
        
        return `
            <div class="wechat-login-overlay active">
                <div class="wechat-login-modal confirm-modal">
                    <div class="wechat-login-header">
                        <button class="back-btn" onclick="window.wechatLoginPage.backToLogin()">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <h3>确认登录信息</h3>
                        <div class="header-placeholder"></div>
                    </div>
                    
                    <div class="confirm-content">
                        <div class="user-avatar">
                            <div class="avatar-circle">
                                ${userInfo.avatar}
                            </div>
                        </div>
                        
                        <div class="user-info">
                            <h4>${userInfo.nickname}</h4>
                            <p class="login-method">
                                <i class="fas fa-mobile-alt"></i>
                                通过${this.loginType === 'phone' ? '手机号' : '账号密码'}登录
                            </p>
                        </div>
                        
                        <div class="permission-summary">
                            <h5>智能记账将获得以下权限：</h5>
                            <ul>
                                <li>获取你的微信公开信息</li>
                                <li>同步微信支付记录</li>
                                <li>记住登录状态</li>
                            </ul>
                        </div>
                        
                        <div class="action-buttons">
                            <button class="confirm-btn" onclick="window.wechatLoginPage.confirmLogin()">
                                同意并登录
                            </button>
                            <button class="cancel-confirm-btn" onclick="window.wechatLoginPage.close()">
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    initEvents() {
        // 模态框点击外部关闭
        const overlay = document.querySelector('.wechat-login-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close();
                }
            });
        }

        // 绑定前往微信授权按钮
        const authBtn = document.getElementById('wechat-authorize-btn');
        if (authBtn) {
            authBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.authorize();
            });
        }
    }

    // 显示微信登录弹窗
    show() {
        window.wechatLoginPage = this;
        
        // 创建弹窗容器
        const modalContainer = document.createElement('div');
        modalContainer.id = 'wechat-login-container';
        modalContainer.innerHTML = this.render();
        
        document.body.appendChild(modalContainer);
        
        // 添加样式
        this.addStyles();
        
        // 初始化事件
        this.initEvents();
        
        // 动画显示
        setTimeout(() => {
            const modal = document.querySelector('.wechat-login-modal');
            if (modal) {
                modal.style.transform = 'translateY(0)';
                modal.style.opacity = '1';
            }
        }, 10);
    }

    // 关闭弹窗
    close() {
        const modal = document.querySelector('.wechat-login-modal');
        if (modal) {
            modal.style.transform = 'translateY(20px)';
            modal.style.opacity = '0';
        }
        
        setTimeout(() => {
            const container = document.getElementById('wechat-login-container');
            if (container) {
                container.remove();
            }
            window.wechatLoginPage = null;
        }, 300);
    }

    // 点击前往微信授权
    authorize() {
        // 关闭弹窗（如果存在）
        this.close();
        // 委托给全局 app 启动微信OAuth登录
        try {
            if (this.app && typeof this.app.startWechatOAuthLogin === 'function') {
                const p = this.app.startWechatOAuthLogin();
                if (p && typeof p.then === 'function') p.catch(err => {
                    console.error('app.startWechatOAuthLogin rejected:', err);
                    this.app.showToast && this.app.showToast('启动微信登录失败，请重试', 'error');
                });
            } else if (window.accountingApp && typeof window.accountingApp.startWechatOAuthLogin === 'function') {
                const p = window.accountingApp.startWechatOAuthLogin();
                if (p && typeof p.then === 'function') p.catch(err => {
                    console.error('window.accountingApp.startWechatOAuthLogin rejected:', err);
                    this.app.showToast && this.app.showToast('启动微信登录失败，请重试', 'error');
                });
            } else {
                // 退回到手动构建授权URL（保护性处理）
                const redirectUri = window.location.origin + '/wechat-callback.html';
                const state = 'wechat_login_' + Date.now();
                const authUrl = window.accountingApp?.wechatOAuth?.generateAuthUrl
                    ? window.accountingApp.wechatOAuth.generateAuthUrl(redirectUri, state)
                        : `https://open.weixin.qq.com/connect/qrconnect?appid=APPID&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`;
                try { sessionStorage.setItem('wechat_oauth_state', state); } catch (e) { console.warn('无法写入 sessionStorage.wechat_oauth_state:', e); }
                window.location.href = authUrl;
            }
        } catch (e) {
            console.error('启动微信授权失败:', e);
            this.app.showToast && this.app.showToast('启动微信登录失败，请重试', 'error');
        }
    }

    // 返回登录页面
    backToLogin() {
        this.state.step = 1;
        this.updateModal();
    }

    // 确认登录
    confirmLogin() {
        const agreementCheckbox = document.getElementById('wechat-agreement');
        if (!agreementCheckbox || !agreementCheckbox.checked) {
            this.app.showToast('请同意服务协议', 'warning');
            return;
        }

        // 不再进行本地模拟登录，改为引导到微信授权流程
        try {
            if (this.app && typeof this.app.startWechatOAuthLogin === 'function') {
                const p = this.app.startWechatOAuthLogin();
                if (p && typeof p.then === 'function') p.catch(err => {
                    console.error('startWechatOAuthLogin rejected:', err);
                    this.app.showToast && this.app.showToast('启动微信登录失败，请重试', 'error');
                });
            } else if (window.accountingApp && typeof window.accountingApp.startWechatOAuthLogin === 'function') {
                const p = window.accountingApp.startWechatOAuthLogin();
                if (p && typeof p.then === 'function') p.catch(err => {
                    console.error('window.accountingApp.startWechatOAuthLogin rejected:', err);
                    this.app.showToast && this.app.showToast('启动微信登录失败，请重试', 'error');
                });
            } else {
                this.app.showToast('微信登录暂不可用，请稍后重试', 'error');
            }
        } catch (e) {
            console.error('confirmLogin startWechatOAuthLogin error:', e);
            this.app.showToast('启动微信登录失败，请重试', 'error');
        }
    }

    // 更新弹窗内容
    updateModal() {
        const container = document.getElementById('wechat-login-container');
        if (container) {
            container.innerHTML = this.render();
            this.initEvents();
        }
    }

    // 添加样式
    addStyles() {
        if (document.getElementById('wechat-login-styles')) return;
        
        const styles = `
            <style>
                .wechat-login-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    opacity: 0;
                    animation: fadeIn 0.3s ease-out forwards;
                }
                
                .wechat-login-modal {
                    background: white;
                    border-radius: 20px;
                    width: 320px;
                    max-width: 90vw;
                    max-height: 80vh;
                    overflow: hidden;
                    transform: translateY(20px);
                    opacity: 0;
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                }
                
                .wechat-login-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px;
                    border-bottom: 1px solid #f0f0f0;
                }
                
                .back-btn {
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    color: #666;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 50%;
                    transition: background 0.2s;
                }
                
                .back-btn:hover {
                    background: #f5f5f5;
                }
                
                .wechat-login-header h3 {
                    margin: 0;
                    font-size: 1.1rem;
                    font-weight: 600;
                }
                
                .header-placeholder {
                    width: 40px;
                }
                
                .wechat-login-content {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                }
                
                .wechat-logo {
                    text-align: center;
                    margin-bottom: 20px;
                }
                
                .wechat-logo i {
                    font-size: 4rem;
                    color: #09bb07;
                }
                
                .login-info h4 {
                    margin: 0 0 12px 0;
                    font-size: 1rem;
                    color: #333;
                }
                
                .permission-list {
                    margin-bottom: 20px;
                }
                
                .permission-item {
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                    font-size: 0.9rem;
                    color: #666;
                }
                
                .permission-item i {
                    color: #09bb07;
                    margin-right: 8px;
                    font-size: 0.8rem;
                }
                
                .qr-code-section {
                    text-align: center;
                    margin: 20px 0;
                }
                
                .qr-code {
                    width: 120px;
                    height: 120px;
                    background: #f5f5f5;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 12px;
                    border: 1px solid #e0e0e0;
                }
                
                .qr-placeholder {
                    text-align: center;
                    color: #999;
                }
                
                .qr-placeholder i {
                    font-size: 2rem;
                    display: block;
                    margin-bottom: 8px;
                    color: #09bb07;
                }
                
                .qr-tip {
                    font-size: 0.8rem;
                    color: #999;
                    margin: 0;
                }
                
                .login-options {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .login-option-btn {
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    padding: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.9rem;
                }
                
                .login-option-btn:hover {
                    background: #e9ecef;
                }
                
                .login-option-btn i {
                    color: #09bb07;
                }
                
                .wechat-login-footer {
                    padding: 16px;
                    border-top: 1px solid #f0f0f0;
                }
                
                .agreement {
                    margin-bottom: 12px;
                }
                
                .checkbox-container {
                    display: flex;
                    align-items: center;
                    font-size: 0.8rem;
                    color: #666;
                    cursor: pointer;
                }
                
                .checkbox-container input {
                    margin-right: 8px;
                }
                
                .cancel-btn {
                    width: 100%;
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    padding: 12px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    color: #666;
                    transition: all 0.2s;
                }
                
                .cancel-btn:hover {
                    background: #e9ecef;
                }
                
                /* 确认信息页面样式 */
                .confirm-modal {
                    width: 300px;
                }
                
                .confirm-content {
                    text-align: center;
                    padding: 20px;
                }
                
                .user-avatar {
                    margin-bottom: 16px;
                }
                
                .avatar-circle {
                    width: 60px;
                    height: 60px;
                    background: #09bb07;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    color: white;
                    margin: 0 auto;
                }
                
                .user-info h4 {
                    margin: 0 0 8px 0;
                    font-size: 1.1rem;
                    color: #333;
                }
                
                .login-method {
                    font-size: 0.9rem;
                    color: #666;
                    margin: 0;
                }
                
                .login-method i {
                    margin-right: 4px;
                }
                
                .permission-summary {
                    text-align: left;
                    margin: 20px 0;
                    background: #f8f9fa;
                    padding: 12px;
                    border-radius: 8px;
                }
                
                .permission-summary h5 {
                    margin: 0 0 8px 0;
                    font-size: 0.9rem;
                    color: #333;
                }
                
                .permission-summary ul {
                    margin: 0;
                    padding-left: 16px;
                    font-size: 0.8rem;
                    color: #666;
                }
                
                .permission-summary li {
                    margin-bottom: 4px;
                }
                
                .action-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .confirm-btn {
                    background: #09bb07;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    padding: 12px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 600;
                    transition: background 0.2s;
                }
                
                .confirm-btn:hover {
                    background: #08a806;
                }
                
                .cancel-confirm-btn {
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    padding: 12px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    color: #666;
                    transition: all 0.2s;
                }
                
                .cancel-confirm-btn:hover {
                    background: #e9ecef;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// 立即注册到全局作用域
if (typeof window !== 'undefined') {
    window.WechatLoginPage = WechatLoginPage;
    console.log('微信登录组件已注册到全局作用域');
}