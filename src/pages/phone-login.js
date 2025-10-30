// 手机号登录页面组件
class PhoneLoginPage {
    constructor(app) {
        this.app = app;
        this.state = { 
            phone: '', 
            code: '', 
            codeSent: false, 
            countdown: 0, 
            timer: null
        };
    }

    render() {
        return `
            <div class="page active" id="phone-login-page" style="padding:16px;">
                <div style="text-align:center;margin:24px 0;">
                    <h2 style="margin:8px 0;">手机号登录</h2>
                    <div style="color:#718096;font-size:0.9rem;">使用手机号验证码登录</div>
                </div>

                <!-- 手机号登录 -->
                <div class="card" style="padding:16px;">
                    <h3 style="margin:0 0 12px 0;"><i class="fas fa-mobile-alt"></i> 手机号验证码登录</h3>
                    <div class="input-group" style="margin-bottom:10px;">
                        <label>手机号</label>
                        <input id="phone-input" type="tel" placeholder="请输入11位手机号码" maxlength="11">
                    </div>
                    <div class="input-group" style="display:flex;gap:8px;align-items:center;">
                        <input id="code-input" type="text" placeholder="验证码（默认 123456）" maxlength="6" style="flex:1;">
                        <button id="btn-send-code" class="btn btn-secondary" style="white-space:nowrap;">获取验证码</button>
                    </div>
                    <button id="btn-phone-login" class="btn btn-primary" style="width:100%;margin-top:12px;">登录</button>
                    
                    <div style="text-align:center;margin-top:12px;">
                        <button id="btn-switch-to-password" class="btn btn-link" style="color:var(--primary);text-decoration:none;">
                            <i class="fas fa-user"></i> 使用账号密码登录
                        </button>
                    </div>
                </div>

                <div style="text-align:center;color:#4a5568;font-size:12px;margin-top:12px;">
                    没有账号？<a id="go-register" href="#" style="color:var(--primary);text-decoration:none;">去注册</a>
                </div>

                <!-- 第三方登录 -->
                <div class="card" style="padding:16px;margin-top:12px;">
                    <div style="text-align:center;margin-bottom:12px;color:#718096;font-size:0.9rem;">
                        其他登录方式
                    </div>
                    <button id="btn-wechat" class="action-btn" style="width:100%;margin-bottom:8px;background:#09bb07;color:#fff;">
                        <i class="fab fa-weixin"></i> 微信登录
                    </button>
                    <button id="btn-alipay" class="action-btn" style="width:100%;background:#1677ff;color:#fff;">
                        <i class="fab fa-alipay"></i> 支付宝登录
                    </button>
                </div>

                <div style="color:#a0aec0;font-size:12px;margin-top:12px;text-align:center;">
                    登录即表示同意《用户协议》和《隐私政策》
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
        const switchToPasswordBtn = document.getElementById('btn-switch-to-password');

        if (wechatBtn) wechatBtn.addEventListener('click', () => this.simulateLogin('wechat'));
        if (alipayBtn) alipayBtn.addEventListener('click', () => this.simulateLogin('alipay'));
        
        // 发送验证码
        if (sendCodeBtn) {
            sendCodeBtn.addEventListener('click', () => {
                const phone = phoneInput.value.trim();
                if (!/^1\d{10}$/.test(phone)) { 
                    this.app.showToast('请输入有效的11位手机号', 'warning'); 
                    return; 
                }
                this.state.phone = phone;
                this.state.codeSent = true;
                this.app.showToast('验证码已发送：123456', 'success');
                this.startCountdown(sendCodeBtn);
            });
        }
        
        // 手机号验证码登录
        if (phoneLoginBtn) {
            phoneLoginBtn.addEventListener('click', () => {
                const phone = phoneInput.value.trim();
                const code = codeInput.value.trim();
                if (!/^1\d{10}$/.test(phone)) { 
                    this.app.showToast('请输入有效的11位手机号', 'warning'); 
                    return; 
                }
                if (!code) { 
                    this.app.showToast('请输入验证码', 'warning'); 
                    return; 
                }
                if (code !== '123456') { 
                    this.app.showToast('验证码错误', 'error'); 
                    return; 
                }
                
                this.loginWithPhone(phone, code);
            });
        }
        
        // 跳转到账号密码登录页面
        if (switchToPasswordBtn) {
            switchToPasswordBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.router) window.router.switchToPage('login');
            });
        }
        
        if (gotoRegister) {
            gotoRegister.addEventListener('click', (e) => { 
                e.preventDefault(); 
                if (window.router) window.router.switchToPage('register'); 
            });
        }
    }

    updateData() {}

    startCountdown(btn) {
        let left = 60; 
        btn.disabled = true;
        const update = () => { 
            btn.textContent = left > 0 ? `${left}s后重发` : '获取验证码'; 
            if (left === 0) { 
                btn.disabled = false; 
                return; 
            } 
            left -= 1; 
            this.state.timer = setTimeout(update, 1000); 
        };
        update();
    }

    // 手机号验证码登录
    loginWithPhone(phone, code) {
        try {
            // 验证码验证（默认验证码为123456）
            if (code !== '123456') {
                this.app.showToast('验证码错误', 'error');
                return;
            }
            
            // 从本地存储获取用户数据
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            // 查找手机号对应的用户
            const user = users.find(u => u.phone === phone);
            
            let authUser;
            if (user) {
                // 已有账号，直接登录
                authUser = {
                    provider: 'phone',
                    nickname: user.nickname || '手机用户',
                    phone: user.phone,
                    username: user.username,
                    token: 'token_' + Date.now(),
                    userId: user.id || Date.now().toString()
                };
            } else {
                // 新用户，自动注册并登录
                const newUser = {
                    id: Date.now().toString(),
                    phone: phone,
                    username: phone, // 使用手机号作为用户名
                    nickname: '手机用户',
                    password: 'auto_generated_' + Math.random().toString(36).substr(2, 8),
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                    status: 'active',
                    preferences: {
                        theme: 'light',
                        currency: 'CNY',
                        language: 'zh-CN'
                    }
                };
                
                users.push(newUser);
                localStorage.setItem('users', JSON.stringify(users));
                
                authUser = {
                    provider: 'phone',
                    nickname: newUser.nickname,
                    phone: newUser.phone,
                    username: newUser.username,
                    token: 'token_' + Date.now(),
                    userId: newUser.id
                };
            }
            
            localStorage.setItem('auth_user', JSON.stringify(authUser));
            this.app.showToast('登录成功', 'success');
            
            // 跳转到首页
            if (window.router) {
                window.router.switchToPage('home');
            }
            
        } catch (error) {
            console.error('手机号登录失败:', error);
            this.app.showToast('登录失败，请重试', 'error');
        }
    }

    simulateLogin(provider) {
        const user = { 
            provider, 
            nickname: provider === 'wechat' ? '微信用户' : '支付宝用户', 
            phone: null,
            token: 'demo_token_' + Date.now()
        };
        localStorage.setItem('auth_user', JSON.stringify(user));
        this.app.showToast('登录成功', 'success');
        if (window.router) window.router.switchToPage('home');
    }
}