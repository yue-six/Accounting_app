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
                    <h3 style="margin:0 0 12px 0;"><i class="fas fa-user-plus"></i> 账号注册</h3>
                    
                    <!-- 用户名注册 -->
                    <div class="input-group" style="margin-bottom:10px;">
                        <label>用户名</label>
                        <input id="reg-username" type="text" placeholder="请输入用户名" maxlength="20" required>
                    </div>
                    
                    <!-- 手机号注册 -->
                    <div class="input-group" style="margin-bottom:10px;">
                        <label>手机号</label>
                        <input id="reg-phone" type="tel" placeholder="请输入11位手机号码" maxlength="11">
                    </div>
                    
                    <!-- 密码设置 -->
                    <div class="input-group" style="margin-bottom:10px;">
                        <label>密码</label>
                        <input id="reg-password" type="password" placeholder="请输入6-20位密码" maxlength="20">
                        <div style="font-size:12px;color:#718096;margin-top:4px;">密码需包含字母和数字</div>
                    </div>
                    
                    <div class="input-group" style="margin-bottom:10px;">
                        <label>确认密码</label>
                        <input id="reg-password2" type="password" placeholder="请再次输入密码" maxlength="20">
                    </div>
                    
                    <!-- 验证码 -->
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
        const usernameEl = document.getElementById('reg-username');
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
                const username = usernameEl.value.trim();
                const phone = phoneEl.value.trim();
                const pass = passEl.value;
                const pass2 = pass2El.value;
                const code = codeEl.value.trim();
                
                // 验证输入
                if (!username) {
                    this.app.showToast('请输入用户名', 'warning');
                    return;
                }
                
                if (!/^1\d{10}$/.test(phone)) { 
                    this.app.showToast('请输入有效的11位手机号', 'warning'); 
                    return; 
                }
                
                if (pass.length < 6) { 
                    this.app.showToast('密码至少6位', 'warning'); 
                    return; 
                }
                
                // 密码强度验证
                if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(pass)) {
                    this.app.showToast('密码需包含字母和数字', 'warning');
                    return;
                }
                
                if (pass !== pass2) { 
                    this.app.showToast('两次输入的密码不一致', 'warning'); 
                    return; 
                }
                
                if (code !== '123456') { 
                    this.app.showToast('验证码错误', 'error'); 
                    return; 
                }

                // 注册用户
                this.registerUser(username, phone, pass);
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

    // 注册用户
    registerUser(username, phone, password) {
        try {
            // 从本地存储获取用户数据
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            // 检查手机号是否已注册
            if (users.find(u => u.phone === phone)) {
                this.app.showToast('该手机号已注册，请直接登录', 'warning');
                if (window.router) window.router.switchToPage('login');
                return;
            }
            
            // 检查用户名是否已存在
            if (users.find(u => u.username === username)) {
                this.app.showToast('该用户名已被使用，请更换', 'warning');
                return;
            }
            
            // 创建新用户
            const newUser = {
                id: Date.now().toString(),
                phone: phone,
                username: username, // 用户名现在是必填项
                nickname: username,
                password: password,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                status: 'active',
                avatar: null,
                preferences: {
                    theme: 'light',
                    currency: 'CNY',
                    language: 'zh-CN'
                }
            };
            
            // 保存用户数据
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            
            // 创建登录会话
            const authUser = {
                provider: 'password',
                nickname: newUser.nickname,
                phone: newUser.phone,
                username: newUser.username,
                token: 'token_' + Date.now(),
                userId: newUser.id,
                preferences: newUser.preferences
            };
            
            localStorage.setItem('auth_user', JSON.stringify(authUser));
            
            // 显示成功消息
            this.app.showToast('注册成功，已自动登录', 'success');
            
            // 跳转到首页
            if (window.router) {
                window.router.switchToPage('home');
            }
            
        } catch (error) {
            console.error('注册失败:', error);
            this.app.showToast('注册失败，请重试', 'error');
        }
    }

    quickSignUp(provider) {
        // 模拟第三方授权注册
        const authUser = {
            provider: provider,
            nickname: provider === 'wechat' ? '微信用户' : '支付宝用户',
            token: 'token_' + Date.now(),
            userId: Date.now().toString()
        };
        
        localStorage.setItem('auth_user', JSON.stringify(authUser));
        this.app.showToast('注册并登录成功', 'success');
        if (window.router) window.router.switchToPage('home');
    }
}
