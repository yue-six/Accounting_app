// 注册页面组件
class RegisterPage {
    constructor(app) {
        this.app = app;
    }

    render() {
        return `
            <div class="page active" id="register-page" style="padding:16px;">
                <div style="text-align:center;margin:24px 0;">
                    <h2 style="margin:8px 0;">注册智能记账</h2>
                    <div style="color:#718096;font-size:0.9rem;">创建你的账户</div>
                </div>

                <div class="card" style="padding:16px;">
                    <h3 style="margin:0 0 12px 0;"><i class="fas fa-user-plus"></i> 手机号注册</h3>
                    <div class="input-group" style="margin-bottom:10px;">
                        <label>手机号</label>
                        <input id="reg-phone" type="tel" placeholder="请输入11位手机号码" maxlength="11">
                    </div>
                    <div class="input-group" style="margin-bottom:10px;">
                        <label>密码</label>
                        <input id="reg-password" type="password" placeholder="请输入6-20位密码" maxlength="20">
                    </div>
                    <div class="input-group" style="margin-bottom:10px;">
                        <label>确认密码</label>
                        <input id="reg-password2" type="password" placeholder="请再次输入密码" maxlength="20">
                    </div>
                    <div class="input-group" style="display:flex;gap:8px;align-items:center;">
                        <input id="reg-code" type="text" placeholder="短信验证码（默认 123456）" maxlength="6" style="flex:1;">
                        <button id="btn-reg-send-code" class="btn btn-secondary" style="white-space:nowrap;">获取验证码</button>
                    </div>
                    <button id="btn-register" class="btn btn-primary" style="width:100%;margin-top:12px;">注册并登录</button>
                </div>

                <div class="card" style="padding:16px;margin-top:12px;">
                    <div style="display:flex;gap:8px;flex-direction:column;">
                        <button id="btn-reg-wechat" class="action-btn" style="width:100%;background:#09bb07;color:#fff;">
                            <i class="fab fa-weixin"></i> 使用微信快速注册
                        </button>
                        <button id="btn-reg-alipay" class="action-btn" style="width:100%;background:#1677ff;color:#fff;">
                            <i class="fab fa-alipay"></i> 使用支付宝快速注册
                        </button>
                    </div>
                </div>

                <div style="text-align:center;color:#4a5568;font-size:12px;margin-top:12px;">
                    已有账号？<a id="go-login" href="#" style="color:var(--primary);text-decoration:none;">去登录</a>
                </div>
            </div>
        `;
    }

    initEvents() {
        const phoneEl = document.getElementById('reg-phone');
        const passEl = document.getElementById('reg-password');
        const pass2El = document.getElementById('reg-password2');
        const codeEl = document.getElementById('reg-code');
        const sendBtn = document.getElementById('btn-reg-send-code');
        const regBtn = document.getElementById('btn-register');
        const gotoLogin = document.getElementById('go-login');
        const wechatBtn = document.getElementById('btn-reg-wechat');
        const alipayBtn = document.getElementById('btn-reg-alipay');

        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                const phone = phoneEl.value.trim();
                if (!/^1\d{10}$/.test(phone)) {
                    this.app.showToast('请输入有效的11位手机号', 'warning');
                    return;
                }
                this.app.showToast('验证码已发送：123456', 'success');
                this.startCountdown(sendBtn);
            });
        }

        if (regBtn) {
            regBtn.addEventListener('click', () => {
                const phone = phoneEl.value.trim();
                const pass = passEl.value;
                const pass2 = pass2El.value;
                const code = codeEl.value.trim();
                if (!/^1\d{10}$/.test(phone)) { this.app.showToast('手机号不合法', 'warning'); return; }
                if (pass.length < 6) { this.app.showToast('密码至少6位', 'warning'); return; }
                if (pass !== pass2) { this.app.showToast('两次输入的密码不一致', 'warning'); return; }
                if (code !== '123456') { this.app.showToast('验证码错误', 'error'); return; }

                // 本地用户库
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                if (users.find(u => u.phone === phone)) {
                    this.app.showToast('该手机号已注册，请直接登录', 'warning');
                    if (window.router) window.router.switchToPage('login');
                    return;
                }
                users.push({ phone, password: pass, nickname: '手机用户' });
                localStorage.setItem('users', JSON.stringify(users));

                // 自动登录
                localStorage.setItem('auth_user', JSON.stringify({ provider: 'phone', nickname: '手机用户', phone }));
                this.app.showToast('注册成功，已自动登录', 'success');
                if (window.router) window.router.switchToPage('home');
            });
        }

        if (gotoLogin) {
            gotoLogin.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.router) window.router.switchToPage('login');
            });
        }

        if (wechatBtn) {
            wechatBtn.addEventListener('click', () => this.quickSignUp('wechat'));
        }
        if (alipayBtn) {
            alipayBtn.addEventListener('click', () => this.quickSignUp('alipay'));
        }
    }

    updateData() {}

    startCountdown(btn) {
        let left = 60;
        btn.disabled = true;
        const tick = () => {
            btn.textContent = left > 0 ? `${left}s后重发` : '获取验证码';
            if (left === 0) { btn.disabled = false; return; }
            left -= 1;
            setTimeout(tick, 1000);
        };
        tick();
    }

    quickSignUp(provider) {
        // 模拟第三方授权注册
        localStorage.setItem('auth_user', JSON.stringify({ provider, nickname: provider === 'wechat' ? '微信用户' : '支付宝用户' }));
        this.app.showToast('注册并登录成功', 'success');
        if (window.router) window.router.switchToPage('home');
    }
}
