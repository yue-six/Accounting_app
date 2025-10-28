@echo off
chcp 65001 >nul
echo.
echo 🚀 智能记账应用 - 数据库设置脚本
echo ==========================================
echo.

REM 检查 Docker 是否可用
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 检测到 Docker，使用 Docker 启动 MongoDB...
    
    REM 检查容器是否存在
    docker ps -a --filter "name=mongodb" --format "{{.Names}}" >nul 2>&1
    if %errorlevel% equ 0 (
        echo 🔄 启动现有 MongoDB 容器...
        docker start mongodb
    ) else (
        echo 📦 创建新的 MongoDB 容器...
        docker run -d --name mongodb -p 27017:27017 -v mongodb_data:/data/db mongo:latest
    )
    
    REM 等待容器启动
    echo ⏳ 等待 MongoDB 启动...
    timeout /t 5 /nobreak >nul
    
    REM 检查容器状态
    docker ps --filter "name=mongodb" --format "{{.Names}}" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ MongoDB 容器启动成功！
    ) else (
        echo ❌ MongoDB 容器启动失败
        exit /b 1
    )
) else (
    echo 🔍 检查系统 MongoDB 服务...
    
    REM 检查 MongoDB 服务
    sc query MongoDB >nul 2>&1
    if %errorlevel% equ 0 (
        sc query MongoDB | find "RUNNING" >nul
        if %errorlevel% neq 0 (
            echo 🔄 启动 MongoDB 服务...
            net start MongoDB
            if %errorlevel% neq 0 (
                echo ❌ MongoDB 服务启动失败
                exit /b 1
            )
            echo ✅ MongoDB 服务启动成功！
        ) else (
            echo ✅ MongoDB 服务已在运行
        )
    ) else (
        echo ❌ 未找到 MongoDB 服务
        echo.
        echo 📚 安装选项：
        echo 1. 使用 Docker Desktop（推荐）
        echo    下载: https://www.docker.com/products/docker-desktop
        echo 2. 安装 MongoDB Community Server
        echo    下载: https://www.mongodb.com/try/download/community
        echo 3. 使用 MongoDB Atlas（云服务）
        echo    注册: https://www.mongodb.com/cloud/atlas
        echo.
        echo 💡 详细安装指南请查看: server\scripts\setup-mongodb.md
        exit /b 1
    )
)

REM 测试连接
echo.
echo 🔗 测试 MongoDB 连接...

REM 创建测试脚本
echo const mongoose = require('mongoose'); > test-connection.js
echo require('dotenv').config(); >> test-connection.js
echo. >> test-connection.js
echo async function testConnection() { >> test-connection.js
echo     try { >> test-connection.js
echo         await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/accounting_app', { >> test-connection.js
echo             serverSelectionTimeoutMS: 5000 >> test-connection.js
echo         }); >> test-connection.js
echo         console.log('✅ MongoDB 连接测试成功！'); >> test-connection.js
echo         process.exit(0); >> test-connection.js
echo     } catch (error) { >> test-connection.js
echo         console.log('❌ MongoDB 连接测试失败:', error.message); >> test-connection.js
echo         process.exit(1); >> test-connection.js
echo     } >> test-connection.js
echo } >> test-connection.js
echo. >> test-connection.js
echo testConnection(); >> test-connection.js

cd server
node ..\test-connection.js
set TEST_RESULT=%errorlevel%
cd ..
del test-connection.js >nul 2>&1

if %TEST_RESULT% equ 0 (
    echo ✅ MongoDB 连接测试成功！
) else (
    echo ❌ MongoDB 连接测试失败
    exit /b 1
)

REM 初始化数据库
echo.
echo 📊 初始化数据库...
cd server
call npm run init-db
set INIT_RESULT=%errorlevel%
cd ..

if %INIT_RESULT% equ 0 (
    echo.
    echo 🎉 数据库配置完成！
    echo ==========================================
    echo 📊 数据库状态: 正常运行
    echo 🌐 连接地址: mongodb://localhost:27017/accounting_app
    echo 📁 数据库名: accounting_app
    echo.
    echo 🚀 启动应用服务器:
    echo     cd server ^&^& npm run dev
    echo.
    echo 📚 下一步操作:
    echo 1. 启动应用: cd server ^&^& npm run dev
    echo 2. 访问应用: http://localhost:3000
    echo 3. API文档: http://localhost:3000/api
) else (
    echo ❌ 数据库初始化失败
    exit /b 1
)

echo.
pause