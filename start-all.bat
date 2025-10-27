@echo off
echo 启动记账应用完整服务...

REM 检查是否安装了Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo 错误：未检测到Node.js，请先安装Node.js
    pause
    exit /b 1
)

REM 启动Express API服务器（端口3000）
echo 启动Express API服务器（端口3000）...
start "API Server" cmd /k "cd server && npm start"

REM 等待API服务器启动
timeout /t 3 /nobreak >nul

REM 启动静态文件服务器（端口8080）
echo 启动静态文件服务器（端口8080）...
start "Static Server" cmd /k "node server.js"

echo.
echo 服务启动完成！
echo API服务器：http://localhost:3000
echo 静态文件服务器：http://localhost:8080
echo.
echo 请访问 http://localhost:8080 使用应用
echo.
pause