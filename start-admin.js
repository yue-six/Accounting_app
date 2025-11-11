const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// 解析JSON请求体
app.use(express.json());

// 直接读取HTML文件内容
const htmlContent = fs.readFileSync(path.join(__dirname, 'admin', 'index.html'), 'utf8');
const adminHtmlContent = fs.readFileSync(path.join(__dirname, 'admin', 'admin.html'), 'utf8');

// 设置静态文件服务 - 这样所有文件都可以直接访问
app.use(express.static(__dirname));

// 主页面路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'admin.html'));
});

// 为所有静态文件设置正确的MIME类型和缓存控制
app.use((req, res, next) => {
  const ext = path.extname(req.url);
  const mimeTypes = {
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2'
  };
  
  if (mimeTypes[ext]) {
    res.setHeader('Content-Type', mimeTypes[ext]);
  }
  
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// 为静态资源设置缓存控制头
app.use((req, res, next) => {
  // 检查是否为静态资源文件
  const isStaticResource = /\.(js|css|png|jpg|jpeg|gif|svg|woff2)$/.test(req.url);
  
  if (isStaticResource) {
    // 使用Cache-Control替代Expires
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    // 移除可能的Expires头部
    res.removeHeader('Expires');
  }
  
  next();
});

// 为API请求设置CORS头
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(express.static(path.join(__dirname)));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: '后台管理系统正在运行' });
});

// 登录API端点 - 用于演示环境
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  // 验证演示凭据
  if (username === 'admin' && password === 'admin123') {
    // 返回模拟的JWT令牌和过期时间
    return res.json({
      success: true,
      data: {
        token: 'demo_jwt_token_for_admin_access',
        expiresIn: 3600 // 1小时
      },
      message: '登录成功'
    });
  } else {
    // 凭据错误
    return res.json({
      success: false,
      message: '用户名或密码错误'
    });
  }
});

// 登出API端点
app.post('/admin/logout', (req, res) => {
  // 简单返回成功，因为实际的令牌清除在前端处理
  return res.json({
    success: true,
    message: '登出成功'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
🚀 后台管理系统启动成功！
🌐 地址: http://localhost:${PORT}/admin
📊 端口: ${PORT}
🏪 功能: 静态后台管理系统
💡 说明: 这是一个演示版本，MongoDB未连接
  `);
});

console.log('正在启动后台管理系统...');