@echo off
echo 启动记账应用Express服务器...

cd server

if not exist "node_modules" (
    echo 正在安装依赖包...
    npm install
) else (
    echo 依赖包已存在，跳过安装...
)

echo 启动服务器...
npm start

pause