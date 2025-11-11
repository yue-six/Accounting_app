// 环境变量配置示例
// 复制此文件为 env.js 并填入实际值

const envConfig = {
    // Supabase配置
    supabase: {
        url: 'https://juqdiilsszktanogfqvm.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1cWRpaWxzc3prdGFub2dmcXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTA1MDksImV4cCI6MjA3NjU2NjUwOX0.JX4Vpl1Z7DeVQPuq-cVPyJfLJFgrGismLEfjEUV-p24'
    },
    
    // 应用配置
    app: {
        name: '智能记账应用',
        version: '1.0.0',
        debug: true
    },
    
    // 功能开关
    features: {
        voiceRecognition: true,
        qrScanner: true,
        photoRecognition: true,
        supabaseIntegration: true
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = envConfig;
} else {
    window.envConfig = envConfig;
}