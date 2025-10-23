// 输入管理器 - 统一管理各种输入方式
class InputManager {
    constructor(app) {
        this.app = app;
        this.voiceRecognition = null;
        this.photoRecognition = null;
        
        this.init();
    }

    // 初始化输入管理器
    init() {
        // 初始化语音识别
        if (typeof VoiceRecognition !== 'undefined') {
            this.voiceRecognition = new VoiceRecognition(this.app);
        }

        // 初始化照片识别
        if (typeof PhotoRecognition !== 'undefined') {
            this.photoRecognition = new PhotoRecognition(this.app);
        }
    }

    // 语音输入
    startVoiceInput() {
        if (this.voiceRecognition) {
            this.voiceRecognition.startListening();
        } else {
            this.app.showToast('语音识别功能不可用');
        }
    }

    // 扫码输入功能已移除

    // 拍照输入
    startPhotoInput() {
        if (this.photoRecognition) {
            this.photoRecognition.takePhotoAndRecognize();
        } else {
            this.app.showToast('拍照识别功能不可用');
        }
    }

    // 手动输入
    showManualInput() {
        this.showInputModal();
    }

    // 显示输入模态框
    showInputModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>手动记账</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <label for="transaction-amount">金额</label>
                        <input type="number" id="transaction-amount" placeholder="输入金额" step="0.01">
                    </div>
                    <div class="input-group">
                        <label for="transaction-category">分类</label>
                        <select id="transaction-category">
                            <option value="food">餐饮</option>
                            <option value="transport">交通</option>
                            <option value="shopping">购物</option>
                            <option value="entertainment">娱乐</option>
                            <option value="study">学习</option>
                            <option value="salary">工资</option>
                            <option value="investment">投资</option>
                            <option value="other">其他</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label for="transaction-description">描述</label>
                        <input type="text" id="transaction-description" placeholder="交易描述">
                    </div>
                    <div class="input-group">
                        <label for="transaction-type">类型</label>
                        <select id="transaction-type">
                            <option value="expense">支出</option>
                            <option value="income">收入</option>
                        </select>
                    </div>
                    <div class="button-group">
                        <button class="btn btn-secondary" id="cancel-input">取消</button>
                        <button class="btn btn-primary" id="save-transaction">保存</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定事件
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#cancel-input').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#save-transaction').addEventListener('click', () => {
            this.saveManualTransaction();
            modal.remove();
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // 保存手动输入的交易
    saveManualTransaction() {
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const category = document.getElementById('transaction-category').value;
        const description = document.getElementById('transaction-description').value;
        const type = document.getElementById('transaction-type').value;
        
        if (!amount || amount <= 0) {
            this.app.showToast('请输入有效的金额');
            return;
        }
        
        const transaction = {
            id: Date.now(),
            amount: amount,
            category: category,
            description: description || '手动记账',
            type: type,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };
        
        this.app.addTransaction(transaction);
        this.app.showToast('记账成功！');
    }
            this.photoRecognition.takePhotoAndRecognize();
        } else {
            this.app.showToast('拍照识别功能不可用');
        }
    }

    // 手动输入
    showManualInput() {
        this.showEnhancedInputModal();
    }

    // 显示增强的输入模态框
    showEnhancedInputModal(transaction = null, index = null) {
        const isEdit = transaction !== null;
        const categoriesOptions = this.app.categories.map(cat => 
            `<option value="${cat.id}" ${transaction?.category === cat.id ? 'selected' : ''}>${cat.icon} ${cat.name}</option>`
        ).join('');

        const modalContent = `
            <div style="padding: 20px;">
                <!-- 快速输入按钮 -->
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px;">
                    <button class="quick-amount-btn" data-amount="5">5元</button>
                    <button class="quick-amount-btn" data-amount="10">10元</button>
                    <button class="quick-amount-btn" data-amount="20">20元</button>
                    <button class="quick-amount-btn" data-amount="50">50元</button>
                    <button class="quick-amount-btn" data-amount="100">100元</button>
                    <button class="quick-amount-btn" data-amount="200">200元</button>
                </div>

                <!-- 输入表单 -->
                <div class="input-group">
                    <label>类型</label>
                    <select id="transaction-type">
                        <option value="income" ${transaction?.type === 'income' ? 'selected' : ''}>收入</option>
                        <option value="expense" ${!transaction || transaction?.type === 'expense' ? 'selected' : ''}>支出</option>
                    </select>
                </div>
                
                <div class="input-group">
                    <label>金额</label>
                    <input type="number" id="transaction-amount" value="${transaction?.amount || ''}" placeholder="输入金额" step="0.01">
                </div>
                
                <div class="input-group">
                    <label>分类</label>
                    <select id="transaction-category">
                        ${categoriesOptions}
                    </select>
                </div>
                
                <div class="input-group">
                    <label>描述</label>
                    <input type="text" id="transaction-description" value="${transaction?.description || ''}" placeholder="交易描述">
                </div>
                
                <div class="input-group">
                    <label>商户</label>
                    <input type="text" id="transaction-merchant" value="${transaction?.merchant || ''}" placeholder="商户名称">
                </div>

                <!-- 日期时间 -->
                <div class="input-group">
                    <label>日期时间</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <input type="date" id="transaction-date" value="${transaction ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}">
                        <input type="time" id="transaction-time" value="${transaction?.time || new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}">
                    </div>
                </div>

                <!-- 标签输入 -->
                <div class="input-group">
                    <label>标签</label>
                    <input type="text" id="transaction-tags" value="${transaction?.tags ? transaction.tags.join(', ') : ''}" placeholder="用逗号分隔标签">
                </div>

                <!-- 备注 -->
                <div class="input-group">
                    <label>备注</label>
                    <textarea id="transaction-notes" placeholder="备注信息" style="height: 60px;">${transaction?.notes || ''}</textarea>
                </div>
                
                <div class="button-group">
                    <button class="btn btn-primary" onclick="inputManager.${isEdit ? 'updateTransaction' : 'saveTransaction'}(${index})">
                        ${isEdit ? '更新' : '保存'}
                    </button>
                    ${isEdit ? `<button class="btn btn-danger" onclick="inputManager.deleteTransaction(${index})">删除</button>` : ''}
                    <button class="btn btn-secondary" onclick="inputManager.hideModal()">取消</button>
                </div>
            </div>
        `;

        this.showModal(isEdit ? '编辑交易' : '新增交易', modalContent);

        // 添加快捷金额按钮事件
        setTimeout(() => {
            document.querySelectorAll('.quick-amount-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const amount = parseFloat(btn.getAttribute('data-amount'));
                    document.getElementById('transaction-amount').value = amount;
                });
            });
        }, 100);
    }

    // 保存交易
    saveTransaction() {
        const type = document.getElementById('transaction-type').value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const category = document.getElementById('transaction-category').value;
        const description = document.getElementById('transaction-description').value;
        const merchant = document.getElementById('transaction-merchant').value;
        const date = document.getElementById('transaction-date').value;
        const time = document.getElementById('transaction-time').value;
        const tags = document.getElementById('transaction-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const notes = document.getElementById('transaction-notes').value;

        if (!amount || !description) {
            this.app.showToast('请填写完整信息！');
            return;
        }

        const transactionData = {
            type,
            amount,
            category,
            description,
            merchant,
            date: new Date(`${date}T${time}`).toISOString(),
            time,
            tags,
            notes,
            source: 'manual'
        };

        this.app.addTransaction(transactionData);
        this.hideModal();
        
        // 更新页面数据
        if (typeof homePage !== 'undefined') {
            homePage.updateData();
        }
    }

    // 更新交易
    updateTransaction(index) {
        const type = document.getElementById('transaction-type').value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const category = document.getElementById('transaction-category').value;
        const description = document.getElementById('transaction-description').value;
        const merchant = document.getElementById('transaction-merchant').value;
        const date = document.getElementById('transaction-date').value;
        const time = document.getElementById('transaction-time').value;
        const tags = document.getElementById('transaction-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const notes = document.getElementById('transaction-notes').value;

        if (!amount || !description) {
            this.app.showToast('请填写完整信息！');
            return;
        }

        const transactionData = {
            type,
            amount,
            category,
            description,
            merchant,
            date: new Date(`${date}T${time}`).toISOString(),
            time,
            tags,
            notes
        };

        this.app.editTransaction(index, transactionData);
        this.hideModal();
        
        // 更新页面数据
        if (typeof homePage !== 'undefined') {
            homePage.updateData();
        }
    }

    // 删除交易
    deleteTransaction(index) {
        if (confirm('确定要删除这条交易记录吗？')) {
            this.app.deleteTransaction(index);
            this.hideModal();
            
            // 更新页面数据
            if (typeof homePage !== 'undefined') {
                homePage.updateData();
            }
        }
    }

    // 显示模态框
    showModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; width: 100%; max-height: 80vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="inputManager.hideModal()">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal();
            }
        });

        document.body.appendChild(modal);
        this.currentModal = modal;
    }

    // 隐藏模态框
    hideModal() {
        if (this.currentModal) {
            document.body.removeChild(this.currentModal);
            this.currentModal = null;
        }
    }

    // 获取功能支持状态
    getSupportStatus() {
        return {
            voice: this.voiceRecognition ? this.voiceRecognition.getSupportStatus() : { supported: false, status: '未加载' },
            qr: this.qrScanner ? this.qrScanner.getSupportStatus() : { supported: false, status: '未加载' },
            photo: this.photoRecognition ? this.photoRecognition.getSupportStatus() : { supported: false, status: '未加载' }
        };
    }
}

// 全局输入管理器实例
let inputManager;