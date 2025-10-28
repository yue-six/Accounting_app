#!/usr/bin/env node

/**
 * 数据库初始化脚本
 * 用于创建默认数据、验证连接等
 */

require('dotenv').config();
const mongoose = require('mongoose');
const database = require('../config/database');
const Category = require('../models/Category');

async function initDatabase() {
  console.log('🚀 开始数据库初始化...\n');

  try {
    // 1. 连接数据库
    console.log('1. 连接数据库...');
    await database.connect();
    
    // 2. 创建索引
    console.log('2. 创建数据库索引...');
    await database.createIndexes();
    
    // 3. 创建默认分类
    console.log('3. 创建默认分类...');
    await createDefaultCategories();
    
    // 4. 验证连接
    console.log('4. 验证数据库连接...');
    const health = await database.healthCheck();
    console.log(`   🔍 健康状态: ${health.status}`);
    console.log(`   📝 消息: ${health.message}`);
    
    // 5. 显示连接状态
    const status = database.getConnectionStatus();
    console.log('\n📊 数据库连接状态:');
    console.log(`   ✅ 连接状态: ${status.isConnected ? '已连接' : '未连接'}`);
    console.log(`   🌐 主机: ${status.host}`);
    console.log(`   📁 数据库: ${status.name}`);
    console.log(`   🔧 就绪状态: ${status.readyState}`);
    console.log(`   📋 模型数量: ${status.models.length}`);
    console.log(`   📝 模型列表: ${status.models.join(', ')}`);
    
    console.log('\n🎉 数据库初始化完成！');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    process.exit(1);
  } finally {
    // 断开连接
    await database.disconnect();
  }
}

/**
 * 创建默认分类
 */
async function createDefaultCategories() {
  try {
    // 检查是否已存在默认分类
    const existingCategories = await Category.find({ isDefault: true });
    
    if (existingCategories.length === 0) {
      console.log('   创建系统默认分类...');
      const defaultCategories = Category.getDefaultCategories();
      
      for (const catData of defaultCategories) {
        const category = new Category({
          ...catData,
          metadata: { createdBy: 'system' }
        });
        await category.save();
        console.log(`   ✅ 创建分类: ${catData.name} (${catData.type})`);
      }
      
      console.log(`   🎯 共创建 ${defaultCategories.length} 个默认分类`);
    } else {
      console.log(`   ⚡ 已存在 ${existingCategories.length} 个默认分类，跳过创建`);
    }
  } catch (error) {
    console.error('   创建默认分类失败:', error.message);
    throw error;
  }
}

/**
 * 数据库重置（谨慎使用）
 */
async function resetDatabase() {
  console.log('⚠️  警告：这将删除所有数据！');
  console.log('请输入 "CONFIRM RESET" 来确认重置:');
  
  // 这里可以添加确认逻辑
  // 在实际生产环境中应该非常谨慎
  
  console.log('重置功能暂未实现，请谨慎操作！');
}

// 命令行参数处理
const command = process.argv[2];

switch (command) {
  case 'reset':
    resetDatabase();
    break;
  case 'status':
    require('../config/database').getConnectionStatus();
    break;
  default:
    initDatabase();
}