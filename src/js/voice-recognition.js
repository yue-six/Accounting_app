// 语音识别管理器
class VoiceRecognition {
    constructor(app) {
        this.app = app;
        this.recognition = null;
        this.isListening = false;
        this.init();
    }

    // 初始化语音识别
    init() {
        // 检查浏览器支持
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('浏览器不支持语音识别功能');
            return;
        }

        // 创建语音识别实例
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        // 配置识别参数
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'zh-CN';
        this.recognition.maxAlternatives = 1;

        // 设置事件监听
        this.recognition.onstart = () => {
            this.isListening = true;
            this.onListeningStart?.();
            this.app.showToast('正在聆听...', 'info');
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.processVoiceInput(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            this.isListening = false;
            this.onError?.(event.error);
            this.app.showToast('语音识别失败: ' + event.error, 'error');
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.onListeningEnd?.();
        };
    }

    // 开始语音识别
    startListening() {
        if (!this.recognition) {
            this.showUnsupportedMessage();
            return;
        }

        try {
            this.recognition.start();
        } catch (error) {
            console.error('启动语音识别失败:', error);
            this.onError?.('启动失败');
        }
    }

    // 停止语音识别
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    // 处理语音输入
    processVoiceInput(transcript) {
        console.log('语音输入:', transcript);
        
        // 解析语音内容
        const parsedData = this.parseVoiceInput(transcript);
        
        if (parsedData) {
            this.app.showToast('识别成功！正在保存...', 'success');
            this.saveVoiceTransaction(parsedData);
        } else {
            this.app.showToast('无法识别记账内容，请重新尝试', 'error');
        }
    }

    // 保存语音识别的交易
    saveVoiceTransaction(parsedData) {
        const transaction = {
            id: Date.now(),
            amount: parsedData.amount,
            category: parsedData.category,
            description: parsedData.description,
            type: parsedData.type,
            date: new Date().toISOString(),
            timestamp: Date.now(),
            source: 'voice_recognition',
            merchant: parsedData.merchant,
            voiceText: parsedData.originalText
        };
        
        // 保存到数据库
        this.app.addTransaction(transaction);
        
        // 显示确认信息
        const typeText = parsedData.type === 'income' ? '收入' : '支出';
        this.app.showToast(`已记录${typeText} ¥${parsedData.amount}`, 'success');
    }

    // 解析语音输入
    parseVoiceInput(text) {
        // 常见记账语音模式
        const patterns = [
            // 支出模式
            { 
                regex: /(?:今天|刚才|刚刚)?(?:花了|消费了|支付了|买了)?\s*(\d+(?:\.\d{1,2})?)\s*(?:元|块钱)?\s*(?:的)?\s*(.+)/,
                type: 'expense',
                extract: (match) => ({
                    amount: parseFloat(match[1]),
                    description: match[2].trim()
                })
            },
            // 收入模式
            { 
                regex: /(?:收到|收入|赚了)\s*(\d+(?:\.\d{1,2})?)\s*(?:元|块钱)?\s*(?:的)?\s*(.+)/,
                type: 'income',
                extract: (match) => ({
                    amount: parseFloat(match[1]),
                    description: match[2].trim()
                })
            },
            // 简单金额模式
            { 
                regex: /(\d+(?:\.\d{1,2})?)\s*(?:元|块钱)/,
                type: 'expense',
                extract: (match) => ({
                    amount: parseFloat(match[1]),
                    description: '语音记账'
                })
            }
        ];

        // 尝试匹配模式
        for (const pattern of patterns) {
            const match = text.match(pattern.regex);
            if (match) {
                const data = pattern.extract(match);
                return {
                    type: pattern.type,
                    amount: data.amount,
                    description: data.description,
                    category: this.autoDetectCategory(data.description, pattern.type),
                    merchant: '语音识别',
                    source: 'voice'
                };
            }
        }

        return null;
    }

    // 自动分类检测
    autoDetectCategory(description, type) {
        const categoryKeywords = {
            'food': ['早餐', '午餐', '晚餐', '咖啡', '餐厅', '饭店', '外卖', '零食', '水果', '超市'],
            'transport': ['地铁', '公交', '打车', '出租车', '滴滴', '加油', '停车', '车费'],
            'shopping': ['衣服', '鞋子', '电器', '手机', '电脑', '网购', '商场', '百货'],
            'entertainment': ['电影', 'KTV', '游戏', '游乐场', '旅游', '门票'],
            'study': ['书籍', '课程', '学费', '文具', '学习'],
            'salary': ['工资', '薪水', '奖金', '收入', '报酬'],
            'investment': ['股票', '基金', '理财', '投资', '收益']
        };

        description = description.toLowerCase();
        
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => description.includes(keyword.toLowerCase()))) {
                return category;
            }
        }

        return type === 'income' ? 'salary' : 'other';
    }

    // 显示不支持消息
    showUnsupportedMessage() {
        this.app.showToast('您的浏览器不支持语音识别功能');
    }

    // 设置回调函数
    setCallbacks({ onListeningStart, onListeningEnd, onSuccess, onError }) {
        this.onListeningStart = onListeningStart;
        this.onListeningEnd = onListeningEnd;
        this.onSuccess = onSuccess;
        this.onError = onError;
    }

    // 检查支持状态
    isSupported() {
        return !!this.recognition;
    }

    // 获取支持状态
    getSupportStatus() {
        if (this.isSupported()) {
            return {
                supported: true,
                status: '可用',
                message: '语音识别功能已准备就绪'
            };
        } else {
            return {
                supported: false,
                status: '不可用',
                message: '浏览器不支持语音识别'
            };
        }
    }
}

// 语音识别工具函数
const VoiceUtils = {
    // 创建语音识别界面
    createVoiceInterface(app) {
        const voiceRecognition = new VoiceRecognition(app);
        
        voiceRecognition.setCallbacks({
            onListeningStart: () => {
                VoiceUtils.showListeningState();
            },
            onListeningEnd: () => {
                VoiceUtils.hideListeningState();
            },
            onSuccess: (data) => {
                VoiceUtils.showRecognitionResult(data);
                // 自动添加到交易
                app.addTransaction(data);
            },
            onError: (error) => {
                VoiceUtils.showError(error);
            }
        });

        return voiceRecognition;
    },

    // 显示监听状态
    showListeningState() {
        const existingIndicator = document.getElementById('voice-listening-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        const indicator = document.createElement('div');
        indicator.id = 'voice-listening-indicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 30px;
                border-radius: 20px;
                text-align: center;
                z-index: 10002;
                backdrop-filter: blur(10px);
            ">
                <div style="font-size: 4rem; margin-bottom: 20px;">🎤</div>
                <div style="font-size: 1.2rem; margin-bottom: 10px;">正在聆听...</div>
                <div style="color: #ccc; font-size: 0.9rem;">请说出您的记账内容</div>
                <div style="margin-top: 20px; color: #888; font-size: 0.8rem;">
                    例如："早餐花了15元" 或 "收到工资8000元"
                </div>
            </div>
        `;

        document.body.appendChild(indicator);
    },

    // 隐藏监听状态
    hideListeningState() {
        const indicator = document.getElementById('voice-listening-indicator');
        if (indicator) {
            indicator.remove();
        }
    },

    // 显示识别结果
    showRecognitionResult(data) {
        const result = document.createElement('div');
        result.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 20px;
                border-radius: 15px;
                text-align: center;
                z-index: 10002;
                backdrop-filter: blur(10px);
            ">
                <div style="font-size: 3rem; margin-bottom: 15px;">✅</div>
                <div style="font-size: 1.1rem; margin-bottom: 10px;">识别成功！</div>
                <div style="color: #ccc; font-size: 0.9rem;">
                    ${data.type === 'income' ? '收入' : '支出'} ¥${data.amount}<br>
                    ${data.description}
                </div>
            </div>
        `;

        document.body.appendChild(result);

        setTimeout(() => {
            if (result.parentNode) {
                document.body.removeChild(result);
            }
        }, 2000);
    },

    // 显示错误
    showError(error) {
        const errorMsg = document.createElement('div');
        errorMsg.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255,0,0,0.9);
                color: white;
                padding: 20px;
                border-radius: 15px;
                text-align: center;
                z-index: 10002;
                backdrop-filter: blur(10px);
            ">
                <div style="font-size: 3rem; margin-bottom: 15px;">❌</div>
                <div style="font-size: 1.1rem; margin-bottom: 10px;">识别失败</div>
                <div style="color: #ccc; font-size: 0.9rem;">${error}</div>
            </div>
        `;

        document.body.appendChild(errorMsg);

        setTimeout(() => {
            if (errorMsg.parentNode) {
                document.body.removeChild(errorMsg);
            }
        }, 2000);
    }
};