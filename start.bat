@echo off
echo 正在启动智能记账应用...
echo.

REM 检查是否安装了Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未检测到Node.js，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo 启动本地服务器...
node server.js

pause