// 应用初始化脚本
document.addEventListener('DOMContentLoaded', function() {
    // 创建应用实例
    const app = new AccountingApp();
    
    // 初始化应用
    app.init();
    
    // 设置全局变量
    window.accountingApp = app;
    
    // 初始化页面路由
    if (typeof Router !== 'undefined') {
        const router = new Router(app);
        window.router = router;
        router.init();
    }
    
    // 初始化输入管理器
    if (typeof InputManager !== 'undefined') {
        app.initInputManager();
    }
    
    console.log('记账应用初始化完成');
});

// 错误处理
window.addEventListener('error', function(e) {
    console.error('应用错误:', e.error);
    
    if (window.accountingApp) {
        window.accountingApp.showToast('应用发生错误，请刷新页面', 'error');
    }
});

// 页面卸载前保存数据
window.addEventListener('beforeunload', function() {
    if (window.accountingApp) {
        window.accountingApp.saveData();
    }
});

// 在线/离线状态检测
window.addEventListener('online', function() {
    if (window.accountingApp) {
        window.accountingApp.showToast('网络连接已恢复', 'success');
    }
});

window.addEventListener('offline', function() {
    if (window.accountingApp) {
        window.accountingApp.showToast('网络连接已断开', 'warning');
    }
});