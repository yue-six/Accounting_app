// 登录页面组件
class LoginPage {
    constructor(app) {
        this.app = app;
        this.state = { 
            phone: '', 
            code: '', 
            codeSent: false, 
            countdown: 0, 
            timer: null,
            loginType: 'password' // 默认登录方式：password 或 phone
        };
    }

    render() {
        return `
            <div class="page active" id="login-page" style="padding:16px;">
                <div style="text-align:center;margin:8px 0 16px 0;">
                    <h2 style="margin:4px 0;font-size:1.5rem;font-weight:600;">登录智能记账</h2>
                    <div style="color:#718096;font-size:0.9rem;">请选择登录方式</div>
                </div>

                <!-- 账号密码登录 -->
                <div class="card" style="padding:16px;">
                    <h3 style="margin:0 0 12px 0;"><i class="fas fa-user"></i> 账号密码登录</h3>
                    <div class="input-group" style="margin-bottom:10px;">
                        <label>手机号/账号</label>
                        <input id="username-input" type="text" placeholder="请输入手机号或用户名" maxlength="20">
                    </div>
                    <div class="input-group" style="margin-bottom:10px;">
                        <label>密码</label>
                        <input id="password-input" type="password" placeholder="请输入密码" maxlength="20">
                    </div>
                    <button id="btn-password-login" class="btn btn-primary" style="width:100%;margin-top:12px;">登录</button>
                    
                    <div style="text-align:center;margin-top:12px;">
                        <button id="btn-switch-to-phone" class="btn btn-link" style="color:var(--primary);text-decoration:none;">
                            <i class="fas fa-mobile-alt"></i> 使用手机号验证码登录
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
                    <div class="social-login-icons">
                        <div class="social-login-icon wechat" id="btn-wechat" title="微信登录">
                            <i class="fab fa-weixin"></i>
                        </div>
                        <div class="social-login-icon alipay" id="btn-alipay" title="支付宝登录">
                            <i class="fab fa-alipay"></i>
                        </div>
                    </div>
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
        const passwordLoginBtn = document.getElementById('btn-password-login');
        const usernameInput = document.getElementById('username-input');
        const passwordInput = document.getElementById('password-input');
        const gotoRegister = document.getElementById('go-register');
        const switchToPhoneBtn = document.getElementById('btn-switch-to-phone');

        if (wechatBtn) wechatBtn.addEventListener('click', () => this.simulateLogin('wechat'));
        if (alipayBtn) alipayBtn.addEventListener('click', () => this.simulateLogin('alipay'));
        
        // 账号密码登录
        if (passwordLoginBtn) {
            passwordLoginBtn.addEventListener('click', () => {
                const username = usernameInput.value.trim();
                const password = passwordInput.value;
                
                if (!username) { this.app.showToast('请输入手机号或用户名', 'warning'); return; }
                if (!password) { this.app.showToast('请输入密码', 'warning'); return; }
                
                this.loginWithPassword(username, password);
            });
        }
        
        // 跳转到手机号登录页面
        if (switchToPhoneBtn) {
            switchToPhoneBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.router) window.router.switchToPage('phone-login');
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

    // 账号密码登录
    loginWithPassword(username, password) {
        try {
            // 从本地存储获取用户数据
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            // 查找匹配的用户（支持手机号或用户名登录）
            const user = users.find(u => 
                (u.phone === username || u.username === username) && 
                u.password === password
            );
            
            if (!user) {
                this.app.showToast('账号或密码错误', 'error');
                return;
            }
            
            // 登录成功
            const authUser = {
                provider: 'password',
                nickname: user.nickname || '用户',
                phone: user.phone,
                username: user.username,
                token: 'token_' + Date.now(),
                userId: user.id || Date.now().toString()
            };
            
            localStorage.setItem('auth_user', JSON.stringify(authUser));
            this.app.showToast('登录成功', 'success');
            
            // 跳转到首页
            if (window.router) {
                window.router.switchToPage('home');
            }
            
        } catch (error) {
            console.error('登录失败:', error);
            this.app.showToast('登录失败，请重试', 'error');
        }
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
                    nickname: '手机用户',
                    password: 'auto_generated_' + Math.random().toString(36).substr(2, 8),
                    createdAt: new Date().toISOString()
                };
                
                users.push(newUser);
                localStorage.setItem('users', JSON.stringify(users));
                
                authUser = {
                    provider: 'phone',
                    nickname: newUser.nickname,
                    phone: newUser.phone,
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
            token: 'demo_token_' + Date.now() // 添加模拟的token
        };
        localStorage.setItem('auth_user', JSON.stringify(user));
        this.app.showToast('登录成功', 'success');
        if (window.router) window.router.switchToPage('home');
    }
}
