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
                    <button id="btn-wechat" class="action-btn" style="width:100%;margin-bottom:12px;background:#09bb07;color:#fff;">
                        <i class="fab fa-weixin"></i> 微信登录
                    </button>
                    <button id="btn-alipay" class="action-btn" style="width:100%;margin-bottom:12px;background:#1677ff;color:#fff;">
                        <i class="fab fa-alipay"></i> 支付宝登录
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
                    <button id="btn-phone-login" class="btn btn-primary" style="width:100%;margin-top:12px;">登录</button>
                </div>

                <div style="text-align:center;color:#4a5568;font-size:12px;margin-top:12px;">
                    没有账号？<a id="go-register" href="#" style="color:var(--primary);text-decoration:none;">去注册</a>
                    <div style="color:#a0aec0;margin-top:6px;">登录即表示同意《用户协议》和《隐私政策》</div>
                </div>
            </div>
        `;
    }

    initEvents() {
        const wechatBtn = document.getElementById('btn-wechat');
        const alipayBtn = document.getElementById('btn-alipay');
        const sendCodeBtn = document.getElementById('btn-send-code');
        const phoneLoginBtn = document.getElementById('btn-phone-login');
        const phoneInput = document.getElementById('phone-input');
        const codeInput = document.getElementById('code-input');
        const gotoRegister = document.getElementById('go-register');

        if (wechatBtn) wechatBtn.addEventListener('click', () => this.simulateLogin('wechat'));
        if (alipayBtn) alipayBtn.addEventListener('click', () => this.simulateLogin('alipay'));
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
        if (phoneLoginBtn) {
            phoneLoginBtn.addEventListener('click', () => {
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

    simulateLogin(provider) {
        const user = { 
            provider, 
            nickname: provider === 'wechat' ? '微信用户' : '支付宝用户', 
            phone: null,
            token: 'demo_token_' + Date.now() // 添加模拟的token
        };
        localStorage.setItem('auth_user', JSON.stringify(user));
        this.app.showToast('登录成功', 'success');
        if (window.router) window.router.switchToPage('home');
    }
}
