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