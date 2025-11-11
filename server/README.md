# 智能记账应用后端API

完整的Node.js后端API，为记账应用提供数据管理和业务逻辑支持。

## 功能特性

### 核心功能
- **用户认证系统** - JWT令牌认证，安全的密码加密
- **交易管理** - 完整的CRUD操作，支持批量导入
- **分类管理** - 收入和支出分类，支持自定义分类
- **预算管理** - 灵活的预算设置和跟踪
- **数据统计** - 多维度数据分析，月度报告生成
- **数据导出** - 支持JSON格式数据导出

### 技术特性
- **安全可靠** - Helmet安全头，CORS配置，输入验证
- **性能优化** - 数据压缩，数据库索引，聚合查询
- **错误处理** - 全局错误处理，友好的错误信息
- **开发友好** - 详细的日志记录，健康检查端点

## 快速开始

### 环境要求
- Node.js 14+
- MongoDB 4.4+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd accounting-app/server
```

2. **安装依赖**
```bash
npm install
```

3. **环境配置**
复制 `.env.example` 为 `.env` 并修改配置：
```bash
cp .env .env.local
```

4. **启动MongoDB**
确保MongoDB服务正在运行

5. **启动应用**
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 环境变量配置

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/accounting_app
MONGODB_TEST_URI=mongodb://localhost:27017/accounting_app_test

# JWT配置
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=7d

# 安全配置
BCRYPT_ROUNDS=12
```

## API文档

### 认证端点

#### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Password123"
}
```

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "login": "testuser",  // 支持用户名或邮箱
  "password": "Password123"
}
```

#### 获取当前用户信息
```http
GET /api/auth/me
Authorization: Bearer <jwt-token>
```

### 交易管理

#### 获取交易列表
```http
GET /api/transactions?page=1&limit=20&type=expense&startDate=2024-01-01
Authorization: Bearer <jwt-token>
```

#### 创建交易
```http
POST /api/transactions
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "type": "expense",
  "amount": 100.50,
  "categoryId": "category_id_here",
  "description": "午餐消费",
  "transactionDate": "2024-01-15T12:00:00Z"
}
```

### 分类管理

#### 获取分类列表
```http
GET /api/categories?type=expense
Authorization: Bearer <jwt-token>
```

#### 创建分类
```http
POST /api/categories
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "交通出行",
  "type": "expense",
  "icon": "🚗",
  "color": "#607D8B"
}
```

### 预算管理

#### 获取预算列表
```http
GET /api/budgets?status=active&period=monthly
Authorization: Bearer <jwt-token>
```

#### 创建预算
```http
POST /api/budgets
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "categoryId": "category_id_here",
  "amount": 1000,
  "period": "monthly",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

### 数据统计

#### 获取总体统计
```http
GET /api/stats/overview?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <jwt-token>
```

#### 获取月度报告
```http
GET /api/stats/monthly-report?year=2024&month=1
Authorization: Bearer <jwt-token>
```

### 用户管理

#### 更新用户信息
```http
PUT /api/users/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "profile": {
    "fullName": "张三",
    "phone": "13800138000"
  }
}
```

#### 导出用户数据
```http
GET /api/users/export-data?format=json
Authorization: Bearer <jwt-token>
```

## 数据库设计

### 用户表 (users)
- 用户基本信息
- 偏好设置
- 统计信息

### 交易表 (transactions)
- 交易记录
- 分类关联
- 支付方式
- 时间戳

### 分类表 (categories)
- 收入和支出分类
- 图标和颜色
- 默认分类标记

### 预算表 (budgets)
- 预算设置
- 执行跟踪
- 通知配置

## 开发指南

### 项目结构
```
server/
├── models/           # 数据模型
├── routes/           # API路由
├── middleware/       # 中间件
├── config/           # 配置文件
├── server.js         # 主服务器文件
└── package.json      # 依赖配置
```

### 添加新功能

1. **创建数据模型**
在 `models/` 目录下创建新的Schema

2. **添加路由**
在 `routes/` 目录下创建新的路由文件

3. **注册路由**
在 `server.js` 中导入并注册新路由

### 测试
```bash
# 运行测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage
```

## 部署指南

### 生产环境部署

1. **环境准备**
```bash
# 设置生产环境变量
export NODE_ENV=production
export MONGODB_URI=mongodb://production-db:27017/accounting_app
export JWT_SECRET=your_production_secret_key
```

2. **安装生产依赖**
```bash
npm install --production
```

3. **使用进程管理器**
```bash
# 使用PM2
npm install -g pm2
pm2 start server.js --name accounting-api
```

### Docker部署

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 安全考虑

- 使用HTTPS传输
- 定期更换JWT密钥
- 实施速率限制
- 输入验证和清理
- 数据库连接安全

## 故障排除

### 常见问题

1. **MongoDB连接失败**
   - 检查MongoDB服务状态
   - 验证连接字符串格式
   - 检查网络连接

2. **JWT验证失败**
   - 检查JWT_SECRET配置
   - 验证令牌格式和过期时间

3. **CORS错误**
   - 检查前端域名配置
   - 验证CORS中间件设置

### 日志查看
```bash
# 查看应用日志
tail -f logs/app.log

# 查看错误日志
tail -f logs/error.log
```

## 技术支持

如有问题请提交Issue或联系开发团队。

## 许可证

MIT License