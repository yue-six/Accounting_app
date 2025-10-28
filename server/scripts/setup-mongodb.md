# MongoDB 安装和配置指南

## Windows 系统 MongoDB 安装

### 方法一：使用 MongoDB Community Server

1. **下载 MongoDB Community Server**
   - 访问 [MongoDB 官网](https://www.mongodb.com/try/download/community)
   - 选择 Windows 版本并下载 MSI 安装包

2. **安装步骤**
   - 运行下载的 MSI 文件
   - 选择 "Complete" 完整安装
   - 选择 "Install MongoDB as a Service"
   - 设置数据目录（默认：`C:\data\db`）
   - 设置日志目录（默认：`C:\data\log`）

3. **验证安装**
   ```bash
   # 检查 MongoDB 服务状态
   Get-Service MongoDB
   
   # 启动 MongoDB 服务
   Start-Service MongoDB
   
   # 连接到 MongoDB
   mongosh
   ```

### 方法二：使用 Docker（推荐）

1. **安装 Docker Desktop**
   - 下载并安装 [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)

2. **使用 Docker 运行 MongoDB**
   ```bash
   # 拉取 MongoDB 镜像
   docker pull mongo:latest
   
   # 运行 MongoDB 容器
   docker run -d --name mongodb -p 27017:27017 -v mongodb_data:/data/db mongo:latest
   
   # 检查容器状态
   docker ps
   ```

3. **停止和启动容器**
   ```bash
   # 停止容器
   docker stop mongodb
   
   # 启动容器
   docker start mongodb
   ```

### 方法三：使用 MongoDB Atlas（云服务）

1. **注册 MongoDB Atlas 账户**
   - 访问 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - 创建免费集群

2. **获取连接字符串**
   - 在 Atlas 控制台创建数据库用户
   - 获取连接字符串
   - 修改 `.env` 文件中的 `MONGODB_URI`

3. **更新环境变量**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/accounting_app
   ```

## 快速启动脚本

### Windows PowerShell 脚本
创建 `start-mongodb.ps1`：

```powershell
# 检查 Docker 是否可用
$dockerAvailable = Get-Command docker -ErrorAction SilentlyContinue

if ($dockerAvailable) {
    Write-Host "使用 Docker 启动 MongoDB..." -ForegroundColor Green
    
    # 检查容器是否存在
    $container = docker ps -a --filter "name=mongodb" --format "{{.Names}}"
    
    if ($container -eq "mongodb") {
        Write-Host "启动现有 MongoDB 容器..." -ForegroundColor Yellow
        docker start mongodb
    } else {
        Write-Host "创建新的 MongoDB 容器..." -ForegroundColor Yellow
        docker run -d --name mongodb -p 27017:27017 -v mongodb_data:/data/db mongo:latest
    }
    
    # 等待容器启动
    Start-Sleep -Seconds 5
    docker ps --filter "name=mongodb"
    
} else {
    Write-Host "使用系统服务启动 MongoDB..." -ForegroundColor Green
    
    # 检查 MongoDB 服务
    $service = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
    
    if ($service) {
        if ($service.Status -ne "Running") {
            Write-Host "启动 MongoDB 服务..." -ForegroundColor Yellow
            Start-Service -Name "MongoDB"
        } else {
            Write-Host "MongoDB 服务已在运行" -ForegroundColor Green
        }
    } else {
        Write-Host "未找到 MongoDB 服务，请先安装 MongoDB" -ForegroundColor Red
        Write-Host "参考上面的安装指南" -ForegroundColor Yellow
    }
}

# 测试连接
Write-Host "测试 MongoDB 连接..." -ForegroundColor Cyan
try {
    $result = & "mongosh" "--eval" "db.adminCommand('ping')" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MongoDB 连接成功！" -ForegroundColor Green
    } else {
        Write-Host "❌ MongoDB 连接失败" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 无法测试连接，mongosh 可能未安装" -ForegroundColor Red
}
```

## 项目配置

### 环境变量设置
确保 `server/.env` 文件包含正确的 MongoDB 连接信息：

```env
# 开发环境
MONGODB_URI=mongodb://localhost:27017/accounting_app
MONGODB_TEST_URI=mongodb://localhost:27017/accounting_app_test

# 生产环境（使用 Atlas）
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/accounting_app
```

### 数据库初始化
安装并启动 MongoDB 后，运行：

```bash
cd server
npm run init-db
```

## 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 检查端口占用
   netstat -ano | findstr :27017
   
   # 杀死占用进程
   taskkill /PID <PID> /F
   ```

2. **权限问题**
   - 确保数据目录有写入权限
   - 以管理员身份运行命令

3. **连接拒绝**
   - 检查防火墙设置
   - 确保 MongoDB 服务正在运行

### 测试连接
```bash
# 使用 mongosh 测试
mongosh --eval "db.adminCommand('ping')"

# 使用 Node.js 测试
node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/test')
  .then(() => console.log('连接成功'))
  .catch(err => console.log('连接失败:', err.message));
"
```

## 下一步

1. 选择一种安装方法安装 MongoDB
2. 启动 MongoDB 服务
3. 运行 `npm run init-db` 初始化数据库
4. 启动应用服务器：`npm run dev`

完成以上步骤后，您的记账应用数据库就配置完成了！