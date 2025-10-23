// 语音记账功能
class VoiceInputManager {
    constructor(app) {
        this.app = app;
        this.recognition = null;
        this.isListening = false;
        this.isSupported = false;
        this.init();
    }

    // 初始化语音识别
    init() {
        // 检查浏览器是否支持语音识别
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            this.isSupported = true;
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            // 配置语音识别
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'zh-CN';
            
            // 设置事件监听器
            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateUIState('listening');
                this.app.showToast('正在聆听...', 'info');
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.processVoiceInput(transcript);
            };
            
            this.recognition.onerror = (event) => {
                console.error('语音识别错误:', event.error);
                this.isListening = false;
                this.updateUIState('idle');
                
                let errorMessage = '语音识别失败';
                switch (event.error) {
                    case 'not-allowed':
                        errorMessage = '请允许浏览器使用麦克风权限';
                        break;
                    case 'no-speech':
                        errorMessage = '没有检测到语音输入';
                        break;
                    case 'audio-capture':
                        errorMessage = '无法访问麦克风';
                        break;
                }
                
                this.app.showToast(errorMessage, 'error');
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                this.updateUIState('idle');
            };
            
            console.log('语音识别功能已初始化');
        } else {
            console.warn('当前浏览器不支持语音识别功能');
            this.isSupported = false;
        }
    }

    // 开始语音输入
    startListening() {
        if (!this.isSupported) {
            this.app.showToast('当前浏览器不支持语音识别', 'warning');
            return;
        }
        
        if (this.isListening) {
            this.stopListening();
            return;
        }
        
        try {
            this.recognition.start();
        } catch (error) {
            console.error('启动语音识别失败:', error);
            this.app.showToast('启动语音识别失败', 'error');
        }
    }

    // 停止语音输入
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            this.updateUIState('idle');
        }
    }

    // 处理语音输入
    processVoiceInput(transcript) {
        console.log('语音输入:', transcript);
        
        // 解析语音输入
        const parsedData = this.parseVoiceInput(transcript);
        
        if (parsedData) {
            this.showVoiceInputResult(transcript, parsedData);
        } else {
            this.app.showToast('无法识别语音内容，请重试', 'warning');
        }
    }

    // 解析语音输入
    parseVoiceInput(text) {
        // 转换为小写便于匹配
        const lowerText = text.toLowerCase();
        
        // 金额匹配模式
        const amountPatterns = [
            /(\d+(?:\.\d{1,2})?)元/g,
            /(\d+(?:\.\d{1,2})?)块钱/g,
            /(\d+(?:\.\d{1,2})?)块/g,
            /花了(\d+(?:\.\d{1,2})?)/g,
            /消费(\d+(?:\.\d{1,2})?)/g,
            /收入(\d+(?:\.\d{1,2})?)/g
        ];
        
        let amount = null;
        let category = null;
        let description = text;
        let type = 'expense'; // 默认为支出
        
        // 提取金额
        for (const pattern of amountPatterns) {
            const match = pattern.exec(lowerText);
            if (match) {
                amount = parseFloat(match[1]);
                break;
            }
        }
        
        // 如果没有匹配到金额，尝试提取数字
        if (!amount) {
            const numberMatch = lowerText.match(/(\d+(?:\.\d{1,2})?)/);
            if (numberMatch) {
                amount = parseFloat(numberMatch[1]);
            }
        }
        
        // 判断收入还是支出
        if (lowerText.includes('收入') || lowerText.includes('收到') || 
            lowerText.includes('工资') || lowerText.includes('转账')) {
            type = 'income';
        }
        
        // 智能分类
        category = this.autoCategorizeVoiceInput(lowerText);
        
        // 验证解析结果
        if (!amount || isNaN(amount)) {
            return null;
        }
        
        // 如果是支出，金额为负数
        if (type === 'expense') {
            amount = -Math.abs(amount);
        }
        
        return {
            amount: amount,
            category: category,
            description: description,
            type: type,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toISOString(),
            source: 'voice_input'
        };
    }

    // 语音输入智能分类
    autoCategorizeVoiceInput(text) {
        const categoryRules = {
            // 餐饮相关
            '吃饭|餐饮|餐厅|饭店|火锅|烧烤|快餐|外卖|咖啡|奶茶|早餐|午餐|晚餐|零食': 'food',
            
            // 交通相关
            '打车|出租车|滴滴|公交|地铁|高铁|飞机|机票|火车|出行|交通|加油|停车': 'transport',
            
            // 购物相关
            '购物|买衣服|网购|淘宝|京东|拼多多|超市|商场|购物中心|日用品': 'shopping',
            
            // 娱乐相关
            '电影|KTV|游戏|娱乐|旅游|景点|门票|游乐场|演唱会|演出': 'entertainment',
            
            // 学习相关
            '学习|书籍|课程|培训|教育|学费|教材|文具|考试': 'study',
            
            // 收入相关
            '工资|收入|奖金|兼职|报酬|转账|收款': 'salary',
            
            // 投资相关
            '投资|股票|基金|理财|收益': 'investment',
            
            // 生活相关
            '水电|煤气|房租|物业|通讯|话费|网络|宽带|医疗|医院|药品': 'other'
        };
        
        for (const [keywords, categoryId] of Object.entries(categoryRules)) {
            const keywordList = keywords.split('|');
            for (const keyword of keywordList) {
                if (text.includes(keyword)) {
                    return categoryId;
                }
            }
        }
        
        return 'other';
    }

    // 显示语音输入结果确认界面
    showVoiceInputResult(originalText, parsedData) {
        const category = this.app.categories.find(cat => cat.id === parsedData.category);
        const categoryName = category ? category.name : '其他';
        const typeText = parsedData.type === 'income' ? '收入' : '支出';
        
        const modalContent = `
            <div class="voice-result-modal">
                <div class="voice-result-header">
                    <i class="fas fa-microphone"></i>
                    <h3>语音识别结果</h3>
                </div>
                
                <div class="voice-result-content">
                    <div class="voice-original">
                        <label>原始语音:</label>
                        <p>"${originalText}"</p>
                    </div>
                    
                    <div class="voice-parsed">
                        <div class="parsed-item">
                            <span class="label">类型:</span>
                            <span class="value ${parsedData.type}">${typeText}</span>
                        </div>
                        <div class="parsed-item">
                            <span class="label">金额:</span>
                            <span class="value amount">¥${Math.abs(parsedData.amount).toFixed(2)}</span>
                        </div>
                        <div class="parsed-item">
                            <span class="label">分类:</span>
                            <span class="value category" style="color: ${category ? category.color : '#666'}">
                                ${categoryName}
                            </span>
                        </div>
                        <div class="parsed-item">
                            <span class="label">描述:</span>
                            <span class="value description">${parsedData.description}</span>
                        </div>
                    </div>
                </div>
                
                <div class="voice-result-actions">
                    <button class="btn btn-success" onclick="voiceInput.confirmVoiceInput()">
                        <i class="fas fa-check"></i> 确认添加
                    </button>
                    <button class="btn btn-secondary" onclick="voiceInput.cancelVoiceInput()">
                        <i class="fas fa-times"></i> 取消
                    </button>
                    <button class="btn btn-outline" onclick="voiceInput.startListening()">
                        <i class="fas fa-redo"></i> 重新识别
                    </button>
                </div>
            </div>
        `;
        
        // 保存当前解析的数据
        this.currentParsedData = parsedData;
        
        // 显示模态框
        this.showVoiceModal(modalContent);
    }

    // 显示语音模态框
    showVoiceModal(content) {
        // 移除现有的模态框
        const existingModal = document.getElementById('voice-input-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 创建新的模态框
        const modal = document.createElement('div');
        modal.id = 'voice-input-modal';
        modal.className = 'modal-overlay active';
        modal.innerHTML = content;
        
        document.body.appendChild(modal);
        
        // 添加点击外部关闭功能
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.cancelVoiceInput();
            }
        });
    }

    // 确认语音输入
    confirmVoiceInput() {
        if (this.currentParsedData) {
            // 添加到交易记录
            this.app.addTransaction(this.currentParsedData);
            
            // 关闭模态框
            this.hideVoiceModal();
            
            // 显示成功提示
            this.app.showToast('语音记账成功！', 'success');
            
            // 清空当前数据
            this.currentParsedData = null;
        }
    }

    // 取消语音输入
    cancelVoiceInput() {
        this.hideVoiceModal();
        this.currentParsedData = null;
    }

    // 隐藏语音模态框
    hideVoiceModal() {
        const modal = document.getElementById('voice-input-modal');
        if (modal) {
            modal.remove();
        }
    }

    // 更新UI状态
    updateUIState(state) {
        const voiceBtn = document.getElementById('voice-input-btn');
        if (!voiceBtn) return;
        
        voiceBtn.className = 'voice-input-btn';
        
        switch (state) {
            case 'listening':
                voiceBtn.classList.add('listening');
                voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i> 停止';
                break;
            case 'idle':
                voiceBtn.classList.remove('listening');
                voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> 语音记账';
                break;
        }
    }

    // 检查支持状态
    checkSupport() {
        return this.isSupported;
    }
}

// 全局语音输入管理器
let voiceInput = null;

// 初始化语音输入
function initVoiceInput(app) {
    voiceInput = new VoiceInputManager(app);
    return voiceInput;
}

// 全局函数供HTML调用
function startVoiceInput() {
    if (voiceInput) {
        voiceInput.startListening();
    }
}

function confirmVoiceInput() {
    if (voiceInput) {
        voiceInput.confirmVoiceInput();
    }
}

function cancelVoiceInput() {
    if (voiceInput) {
        voiceInput.cancelVoiceInput();
    }
}