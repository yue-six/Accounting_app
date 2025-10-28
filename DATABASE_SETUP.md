# 数据库设置指南

## 当前状态
应用目前使用本地存储作为数据库，所有数据保存在浏览器的localStorage中。

## 数据库选项

### 1. 本地存储（当前使用）
- **状态**: ✅ 已配置
- **数据位置**: 浏览器localStorage
- **优点**: 无需安装，开箱即用
- **限制**: 数据仅保存在当前浏览器

### 2. MongoDB（推荐用于生产环境）
- **状态**: ⚠️ 需要配置
- **数据位置**: MongoDB数据库
- **优点**: 数据持久化，多设备同步
- **需要**: 安装MongoDB服务

## MongoDB安装指南

### Windows系统

#### 方法1: 使用Docker（推荐）
```bash
# 拉取MongoDB镜像
docker pull mongo:latest

# 运行MongoDB容器
docker run -d --name mongodb -p 27017:27017 -v mongodb_data:/data/db mongo:latest

# 检查容器状态
docker ps -a
```

#### 方法2: 手动安装
1. 访问 [MongoDB官网](https://www.mongodb.com/try/download/community) 下载安装包
2. 运行安装程序，选择"Complete"安装类型
3. 安装完成后，MongoDB服务会自动启动

#### 方法3: 使用Chocolatey（包管理器）
```powershell
# 安装Chocolatey（如果尚未安装）
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 安装MongoDB
choco install mongodb
```

### 验证安装
```bash
# 检查MongoDB服务状态
net start | findstr MongoDB

# 或者使用MongoDB Shell
mongo --version
```

## 切换数据库配置

### 从本地存储切换到MongoDB

1. **启动MongoDB服务**
   ```bash
   # Docker方式
   docker start mongodb
   
   # Windows服务方式
   net start MongoDB
   ```

2. **更新数据库配置**
   修改 `server/config/database.js` 文件，取消注释MongoDB连接代码：

   ```javascript
   const mongoose = require('mongoose');
   
   const connectDB = async () => {
       try {
           const conn = await mongoose.connect('mongodb://localhost:27017/accounting_app', {
               useNewUrlParser: true,
               useUnifiedTopology: true,
           });
           console.log(`✅ MongoDB连接成功: ${conn.connection.host}`);
       } catch (error) {
           console.error('❌ MongoDB连接失败:', error.message);
           process.exit(1);
       }
   };
   
   module.exports = connectDB;
   ```

3. **初始化数据库**
   ```bash
   node server/scripts/init-db.js
   ```

### 从MongoDB切换回本地存储
如果MongoDB服务不可用，应用会自动回退到本地存储模式。

## 数据迁移

### 从本地存储导出数据
```javascript
// 在浏览器控制台中执行
const data = localStorage.getItem('accounting_app_local_transactions');
console.log(JSON.parse(data));
```

### 导入数据到MongoDB
使用MongoDB Compass或命令行工具导入导出的JSON数据。

## 故障排除

### 常见问题

1. **MongoDB连接被拒绝**
   ```
   ❌ MongoDB连接失败: connect ECONNREFUSED 127.0.0.1:27017
   ```
   **解决方案**: 确保MongoDB服务正在运行

2. **端口被占用**
   ```
   Error: listen EADDRINUSE :::27017
   ```
   **解决方案**: 停止占用端口的进程或更改MongoDB端口

3. **权限问题**
   ```
   Error: couldn't connect to server 127.0.0.1:27017
   ```
   **解决方案**: 以管理员身份运行MongoDB服务

### 日志检查
应用会在控制台输出数据库连接状态：
- ✅ MongoDB连接成功: 表示使用MongoDB
- 📁 使用本地存储数据库: 表示使用本地存储

## 生产环境建议

对于生产环境，建议：
1. 使用MongoDB Atlas（云数据库）
2. 配置数据库认证
3. 设置定期备份
4. 监控数据库性能

## 技术支持

如果遇到数据库相关问题，请检查：
1. MongoDB服务状态
2. 网络连接
3. 防火墙设置
4. 应用日志输出