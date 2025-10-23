# 智能记账应用 - 数据库配置指南

## 数据库设计完成情况

✅ **数据库架构设计已完成**
- 用户模型 (User.js) - 用户管理和认证
- 交易模型 (Transaction.js) - 收入和支出记录
- 分类模型 (Category.js) - 交易分类管理
- 预算模型 (Budget.js) - 预算设置和跟踪

✅ **数据库连接配置已完成**
- MongoDB连接配置 (server/config/database.js)
- 环境变量配置 (server/.env)
- 连接池管理和错误处理
- 健康检查和索引优化

✅ **API路由和业务逻辑已完成**
- 完整的RESTful API设计
- 数据验证和错误处理
- 认证和授权中间件
- 统计分析和报表功能

## 当前状态

❌ **MongoDB服务未运行**
由于网络连接问题，无法通过Docker自动启动MongoDB服务。

## 解决方案

### 方案一：安装本地MongoDB（推荐）

1. **下载 MongoDB Community Server**
   - 访问: https://www.mongodb.com/try/download/community
   - 选择 Windows 版本下载 MSI 安装包

2. **安装步骤**
   - 运行安装程序
   - 选择 "Complete" 完整安装
   - 选择 "Install MongoDB as a Service"
   - 使用默认设置完成安装

3. **启动 MongoDB 服务**
   ```powershell
   # 以管理员身份运行 PowerShell
   Start-Service MongoDB
   ```

4. **验证安装**
   ```powershell
   # 检查服务状态
   Get-Service MongoDB
   
   # 测试连接
   mongosh --eval "db.adminCommand('ping')"
   ```

### 方案二：使用 MongoDB Atlas（云服务）

1. **注册 MongoDB Atlas 账户**
   - 访问: https://www.mongodb.com/cloud/atlas
   - 创建免费集群

2. **获取连接字符串**
   ```env
   # 修改 server/.env 文件
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/accounting_app
   ```

### 方案三：等待网络恢复后使用Docker

当网络连接恢复后，可以运行：
```bash
# 拉取MongoDB镜像
docker pull mongo:latest

# 启动MongoDB容器
docker run -d --name mongodb -p 27017:27017 -v mongodb_data:/data/db mongo:latest
```

## 数据库初始化

一旦MongoDB服务运行，执行以下命令：

```bash
cd server
npm run init-db
```

## 项目文件结构

```
server/
├── config/
│   └── database.js          # 数据库连接配置
├── models/
│   ├── User.js              # 用户模型
│   ├── Transaction.js       # 交易模型
│   ├── Category.js          # 分类模型
│   └── Budget.js            # 预算模型
├── routes/
│   ├── auth.js              # 认证路由
│   ├── transactions.js      # 交易路由
│   ├── categories.js        # 分类路由
│   ├── budgets.js           # 预算路由
│   └── stats.js            # 统计路由
├── scripts/
│   └── init-db.js          # 数据库初始化脚本
└── server.js               # 主服务器文件
```

## 核心数据模型说明

### 1. 用户模型 (User)
- 用户注册和登录
- 个人资料管理
- 偏好设置（货币、语言、主题）
- 用户统计和活动记录

### 2. 交易模型 (Transaction)
- 收入和支出记录
- 分类关联和标签
- 支付方式和位置信息
- 定期交易支持

### 3. 分类模型 (Category)
- 收入和支出分类
- 默认分类和自定义分类
- 图标和颜色配置
- 分类统计和分析

### 4. 预算模型 (Budget)
- 按分类设置预算
- 多种周期支持（日/周/月/年）
- 预算进度跟踪
- 超预算提醒

## API端点文档

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 交易管理
- `GET /api/transactions` - 获取交易列表（支持分页和筛选）
- `POST /api/transactions` - 创建交易
- `PUT /api/transactions/:id` - 更新交易
- `DELETE /api/transactions/:id` - 删除交易（软删除）

### 分类管理
- `GET /api/categories` - 获取分类列表
- `POST /api/categories` - 创建分类
- `PUT /api/categories/:id` - 更新分类
- `DELETE /api/categories/:id` - 删除分类

### 预算管理
- `GET /api/budgets` - 获取预算列表
- `POST /api/budgets` - 创建预算
- `PUT /api/budgets/:id` - 更新预算
- `DELETE /api/budgets/:id` - 删除预算

### 统计分析
- `GET /api/stats/summary` - 获取统计摘要
- `GET /api/stats/categories` - 获取分类统计

## 安全特性

- 🔐 密码加密存储（bcryptjs）
- 🔑 JWT令牌认证
- 🛡️ 请求频率限制
- ✅ 输入数据验证
- 🌐 CORS安全配置

## 性能优化

- 📊 数据库索引优化
- 🔄 连接池管理
- 📦 响应压缩
- 📄 查询分页支持

## 下一步操作

1. **安装MongoDB服务**（选择上述任一方案）
2. **启动MongoDB服务**
3. **初始化数据库**: `cd server && npm run init-db`
4. **启动应用服务器**: `cd server && npm run dev`
5. **访问应用**: http://localhost:3000

## 故障排除

### 常见问题

1. **连接被拒绝**
   - 检查MongoDB服务是否运行
   - 验证端口27017是否被占用

2. **认证失败**
   - 检查连接字符串格式
   - 验证用户名和密码

3. **权限问题**
   - 确保数据目录有写入权限
   - 以管理员身份运行服务

### 技术支持

如果遇到问题，请参考：
- MongoDB官方文档: https://docs.mongodb.com
- 项目文档: README.md
- 安装指南: server/scripts/setup-mongodb.md

---

**数据库设计已完成！** 🎉

您现在拥有一个完整的、生产就绪的记账应用数据库架构。只需要安装并启动MongoDB服务，就可以开始使用应用了。