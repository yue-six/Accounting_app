# MongoDB 快速启动脚本
Write-Host "🚀 智能记账应用 - MongoDB 启动脚本" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 检查 Docker 是否可用
$dockerAvailable = Get-Command docker -ErrorAction SilentlyContinue

if ($dockerAvailable) {
    Write-Host "✅ 检测到 Docker，使用 Docker 启动 MongoDB..." -ForegroundColor Green
    
    # 检查容器是否存在
    $container = docker ps -a --filter "name=mongodb" --format "{{.Names}}" 2>$null
    
    if ($container -eq "mongodb") {
        Write-Host "🔄 启动现有 MongoDB 容器..." -ForegroundColor Yellow
        docker start mongodb
    } else {
        Write-Host "📦 创建新的 MongoDB 容器..." -ForegroundColor Yellow
        docker run -d --name mongodb -p 27017:27017 -v mongodb_data:/data/db mongo:latest
    }
    
    # 等待容器启动
    Write-Host "⏳ 等待 MongoDB 启动..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # 检查容器状态
    $running = docker ps --filter "name=mongodb" --format "{{.Names}}" 2>$null
    if ($running -eq "mongodb") {
        Write-Host "✅ MongoDB 容器启动成功！" -ForegroundColor Green
    } else {
        Write-Host "❌ MongoDB 容器启动失败" -ForegroundColor Red
        exit 1
    }
    
} else {
    Write-Host "🔍 检查系统 MongoDB 服务..." -ForegroundColor Yellow
    
    # 检查 MongoDB 服务
    $service = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
    
    if ($service) {
        if ($service.Status -ne "Running") {
            Write-Host "🔄 启动 MongoDB 服务..." -ForegroundColor Yellow
            try {
                Start-Service -Name "MongoDB"
                Write-Host "✅ MongoDB 服务启动成功！" -ForegroundColor Green
            } catch {
                Write-Host "❌ MongoDB 服务启动失败: $($_.Exception.Message)" -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "✅ MongoDB 服务已在运行" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ 未找到 MongoDB 服务" -ForegroundColor Red
        Write-Host ""
        Write-Host "📚 安装选项：" -ForegroundColor Cyan
        Write-Host "1. 使用 Docker Desktop（推荐）" -ForegroundColor White
        Write-Host "   - 下载: https://www.docker.com/products/docker-desktop" -ForegroundColor Gray
        Write-Host "2. 安装 MongoDB Community Server" -ForegroundColor White
        Write-Host "   - 下载: https://www.mongodb.com/try/download/community" -ForegroundColor Gray
        Write-Host "3. 使用 MongoDB Atlas（云服务）" -ForegroundColor White
        Write-Host "   - 注册: https://www.mongodb.com/cloud/atlas" -ForegroundColor Gray
        Write-Host ""
        Write-Host "💡 详细安装指南请查看: server/scripts/setup-mongodb.md" -ForegroundColor Yellow
        exit 1
    }
}

# 测试连接
Write-Host ""
Write-Host "🔗 测试 MongoDB 连接..." -ForegroundColor Cyan

# 简单的连接测试
try {
    # 使用 Node.js 测试连接
    $testScript = @"
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/accounting_app', {
            serverSelectionTimeoutMS: 5000
        });
        console.log('✅ MongoDB 连接测试成功！');
        process.exit(0);
    } catch (error) {
        console.log('❌ MongoDB 连接测试失败:', error.message);
        process.exit(1);
    }
}

testConnection();
"@

    $testScript | Out-File -FilePath "test-connection.js" -Encoding UTF8
    Set-Location server
    node ../test-connection.js
    $testResult = $LASTEXITCODE
    Set-Location ..
    Remove-Item "test-connection.js" -ErrorAction SilentlyContinue
    
    if ($testResult -eq 0) {
        Write-Host "✅ MongoDB 连接测试成功！" -ForegroundColor Green
    } else {
        Write-Host "❌ MongoDB 连接测试失败" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ 连接测试出错: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 初始化数据库
Write-Host ""
Write-Host "📊 初始化数据库..." -ForegroundColor Cyan
cd server
npm run init-db
$initResult = $LASTEXITCODE
cd ..

if ($initResult -eq 0) {
    Write-Host ""
    Write-Host "🎉 数据库配置完成！" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "📊 数据库状态: 正常运行" -ForegroundColor White
    Write-Host "🌐 连接地址: mongodb://localhost:27017/accounting_app" -ForegroundColor White
    Write-Host "📁 数据库名: accounting_app" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 启动应用服务器:" -ForegroundColor Cyan
    Write-Host "   cd server; npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 下一步操作:" -ForegroundColor Cyan
    Write-Host "1. 启动应用: cd server; npm run dev" -ForegroundColor White
    Write-Host "2. 访问应用: http://localhost:3000" -ForegroundColor White
    Write-Host "3. API文档: http://localhost:3000/api" -ForegroundColor White
} else {
    Write-Host "❌ 数据库初始化失败" -ForegroundColor Red
    exit 1
}