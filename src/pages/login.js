// 登录页面组件
class LoginPage {
    constructor(app) {
        this.app = app;
        this.state = { phone: '', code: '', codeSent: false, countdown: 0, timer: null };
    }

    render() {
        return `
            <div class="page active" id="login-page" style="padding:16px;">
                <div style="text-align:center;margin:24px 0;">
                    <h2 style="margin:8px 0;">登录智能记账</h2>
                    <div style="color:#718096;font-size:0.9rem;">请选择登录方式</div>
                </div>

                <div class="card" style="padding:16px;">
                    <button id="btn-wechat-phone" class="action-btn" style="width:100%;margin-bottom:12px;background:#667eea;color:#fff;">
                        <i class="fas fa-mobile-alt"></i> 手机号登录
                    </button>
                    <button id="btn-wechat-account" class="action-btn" style="width:100%;margin-bottom:12px;background:#4fd1c5;color:#fff;">
                        <i class="fas fa-user-circle"></i> 账号密码登录
                    </button>
                </div>

                <div class="card" style="padding:16px;margin-top:12px;">
                    <h3 style="margin:0 0 12px 0;"><i class="fas fa-mobile-alt"></i> 手机号登录</h3>
                    <div class="input-group" style="margin-bottom:10px;">
                        <label>手机号</label>
                        <input id="phone-input" type="tel" placeholder="请输入11位手机号码" maxlength="11">
                    </div>
                    <div class="input-group" style="display:flex;gap:8px;align-items:center;">
                        <input id="code-input" type="text" placeholder="验证码（默认 123456）" maxlength="6" style="flex:1;">
                        <button id="btn-send-code" class="btn btn-secondary" style="white-space:nowrap;">获取验证码</button>
                    </div>
                    <button id="btn-direct-phone-login" class="btn btn-primary" style="width:100%;margin-top:12px;">登录</button>
                </div>

                <div style="text-align:center;color:#4a5568;font-size:12px;margin-top:12px;">
                    没有账号？<a id="go-register" href="#" style="color:var(--primary);text-decoration:none;">去注册</a>
                    <div style="color:#a0aec0;margin-top:6px;">登录即表示同意《用户协议》和《隐私政策》</div>
                </div>
            </div>
        `;
    }

    initEvents() {
        const wechatPhoneBtn = document.getElementById('btn-wechat-phone');
        const wechatAccountBtn = document.getElementById('btn-wechat-account');
        const sendCodeBtn = document.getElementById('btn-send-code');
        const directPhoneLoginBtn = document.getElementById('btn-direct-phone-login');
        const phoneInput = document.getElementById('phone-input');
        const codeInput = document.getElementById('code-input');
        const gotoRegister = document.getElementById('go-register');

        if (wechatPhoneBtn) wechatPhoneBtn.addEventListener('click', () => this.showWechatLogin('phone'));
        if (wechatAccountBtn) wechatAccountBtn.addEventListener('click', () => this.showWechatLogin('account'));
        if (sendCodeBtn) {
            sendCodeBtn.addEventListener('click', () => {
                const phone = phoneInput.value.trim();
                if (!/^1\d{10}$/.test(phone)) { this.app.showToast('请输入有效的11位手机号', 'warning'); return; }
                this.state.phone = phone;
                this.state.codeSent = true;
                this.app.showToast('验证码已发送：123456', 'success');
                this.startCountdown(sendCodeBtn);
            });
        }
        if (directPhoneLoginBtn) {
            directPhoneLoginBtn.addEventListener('click', async () => {
                const phone = phoneInput.value.trim();
                const code = codeInput.value.trim();
                if (!/^1\d{10}$/.test(phone)) { this.app.showToast('请输入有效的11位手机号', 'warning'); return; }
                if (!code) { this.app.showToast('请输入验证码', 'warning'); return; }
                if (code !== '123456') { this.app.showToast('验证码错误', 'error'); return; }
                const user = { 
                    provider: 'phone', 
                    nickname: '手机用户', 
                    phone,
                    token: 'demo_token_' + Date.now() // 添加模拟的token
                };
                localStorage.setItem('auth_user', JSON.stringify(user));
                this.app.showToast('登录成功', 'success');
                
                // 登录成功后，自动尝试连接支付服务
                await this.executePaymentServiceAfterLogin();
                
                if (window.router) window.router.switchToPage('home');
            });
        }
        if (gotoRegister) {
            gotoRegister.addEventListener('click', (e) => { e.preventDefault(); if (window.router) window.router.switchToPage('register'); });
        }
    }

    updateData() {}

    startCountdown(btn) {
        let left = 60; btn.disabled = true;
        const update = () => { btn.textContent = left > 0 ? `${left}s后重发` : '获取验证码'; if (left === 0) { btn.disabled = false; return; } left -= 1; this.state.timer = setTimeout(update, 1000); };
        update();
    }

    showWechatLogin(loginType) {
        this.app.showToast('正在启动微信OAuth2登录...', 'info');
        // 统一委托给应用层启动微信登录，应用层实现包含更健壮的容错
        try {
            if (this.app && typeof this.app.startWechatOAuthLogin === 'function') {
                const p = this.app.startWechatOAuthLogin();
                if (p && typeof p.then === 'function') p.catch(err => {
                    console.error('startWechatOAuthLogin rejected:', err);
                    this.app.showToast && this.app.showToast('启动微信登录失败，请重试', 'error');
                });
                return;
            } else if (window.accountingApp && typeof window.accountingApp.startWechatOAuthLogin === 'function') {
                const p = window.accountingApp.startWechatOAuthLogin();
                if (p && typeof p.then === 'function') p.catch(err => {
                    console.error('window.accountingApp.startWechatOAuthLogin rejected:', err);
                    this.app.showToast && this.app.showToast('启动微信登录失败，请重试', 'error');
                });
                return;
            }

            // 无可用的 OAuth 启动实现，提示用户并中止
            console.error('无法找到启动微信登录的方法');
            this.app.showToast('微信登录暂不可用，请稍后重试', 'error');
            return;
        } catch (e) {
            console.error('showWechatLogin error:', e);
            this.app.showToast('微信登录启动失败，请稍后重试', 'error');
        }
    }

    // 启动微信OAuth2登录
    startWechatOAuthLogin() {
        // 委托给应用层的实现
        try {
            if (this.app && typeof this.app.startWechatOAuthLogin === 'function') {
                this.app.startWechatOAuthLogin();
            } else if (window.accountingApp && typeof window.accountingApp.startWechatOAuthLogin === 'function') {
                window.accountingApp.startWechatOAuthLogin();
            } else {
                throw new Error('无法找到应用层的 startWechatOAuthLogin 方法');
            }
        } catch (error) {
            console.error('启动微信OAuth2登录失败:', error);
            this.app.showToast('微信登录启动失败，请稍后重试', 'error');
        }
    }

    // 登录成功后执行支付服务
    async executePaymentServiceAfterLogin() {
        try {
            // 检查支付服务是否可用
            const response = await fetch('http://localhost:3000/api/payments/status');
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data.available) {
                    this.app.showToast('支付服务已就绪', 'info');
                    
                    // 自动连接微信支付（可根据需要修改为其他支付方式）
                    if (window.accountingApp) {
                        await window.accountingApp.executePaymentServiceLogin('wechat');
                    }
                } else {
                    console.log('支付服务配置不完整，跳过自动连接');
                }
            }
        } catch (error) {
            console.log('支付服务暂不可用，继续正常登录流程:', error.message);
        }
    }
}
