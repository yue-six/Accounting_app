/**
 * QR扫码功能模块
 * 提供二维码扫描功能，支持相机扫描和图片识别
 */

class QRScanner {
    constructor(app) {
        this.app = app;
        this.isScanning = false;
        this.videoElement = null;
        this.canvasElement = null;
        this.context = null;
        this.stream = null;
        this.scanInterval = null;
        
        // 检查浏览器支持情况
        this.supported = this.checkSupport();
    }

    /**
     * 检查浏览器是否支持扫码功能
     */
    checkSupport() {
        return !!(navigator.mediaDevices && 
                 navigator.mediaDevices.getUserMedia && 
                 window.BarcodeDetector);
    }

    /**
     * 获取支持状态
     */
    getSupportStatus() {
        return {
            supported: this.supported,
            status: this.supported ? '支持' : '不支持',
            reason: this.supported ? '' : '浏览器不支持相机或BarcodeDetector API'
        };
    }

    /**
     * 开始扫码
     */
    async startScan() {
        if (!this.supported) {
            throw new Error('浏览器不支持扫码功能');
        }

        if (this.isScanning) {
            return;
        }

        try {
            // 请求相机权限
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // 优先使用后置摄像头
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            // 创建扫码界面
            this.createScannerUI();
            
            // 开始扫描
            this.isScanning = true;
            this.startScanningLoop();
            
            return true;
        } catch (error) {
            console.error('扫码启动失败:', error);
            this.handleError(error);
            return false;
        }
    }

    /**
     * 创建扫码界面
     */
    createScannerUI() {
        const modalContent = `
            <div class="qr-scanner-container">
                <div class="scanner-header">
                    <h3>扫描二维码</h3>
                    <button class="close-btn" onclick="window.currentQRScanner?.stopScan()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="scanner-viewport">
                    <video id="qr-video" autoplay playsinline></video>
                    <div class="scan-frame">
                        <div class="scan-corner top-left"></div>
                        <div class="scan-corner top-right"></div>
                        <div class="scan-corner bottom-left"></div>
                        <div class="scan-corner bottom-right"></div>
                        <div class="scan-line"></div>
                    </div>
                </div>
                <div class="scanner-controls">
                    <button class="btn btn-secondary" onclick="window.currentQRScanner?.toggleCamera()">
                        <i class="fas fa-camera"></i> 切换摄像头
                    </button>
                    <button class="btn btn-primary" onclick="window.currentQRScanner?.uploadImage()">
                        <i class="fas fa-image"></i> 从相册选择
                    </button>
                </div>
                <div class="scanner-instructions">
                    <p>将二维码对准扫描框</p>
                </div>
            </div>
        `;

        this.app.showModal('扫码记账', modalContent);
        
        // 设置视频元素
        setTimeout(() => {
            this.videoElement = document.getElementById('qr-video');
            this.videoElement.srcObject = this.stream;
            
            // 创建画布用于图像处理
            this.canvasElement = document.createElement('canvas');
            this.context = this.canvasElement.getContext('2d');
            
            // 设置全局引用
            window.currentQRScanner = this;
        }, 100);
    }

    /**
     * 开始扫描循环
     */
    startScanningLoop() {
        this.scanInterval = setInterval(async () => {
            if (!this.isScanning || !this.videoElement) return;

            try {
                // 检查视频是否就绪
                if (this.videoElement.readyState === this.videoElement.HAVE_ENOUGH_DATA) {
                    // 设置画布尺寸
                    this.canvasElement.width = this.videoElement.videoWidth;
                    this.canvasElement.height = this.videoElement.videoHeight;
                    
                    // 绘制当前帧
                    this.context.drawImage(this.videoElement, 0, 0, 
                        this.canvasElement.width, this.canvasElement.height);
                    
                    // 检测二维码
                    const barcodeDetector = new BarcodeDetector({
                        formats: ['qr_code']
                    });
                    
                    const barcodes = await barcodeDetector.detect(this.canvasElement);
                    
                    if (barcodes.length > 0) {
                        const qrCode = barcodes[0];
                        this.handleQRCodeDetected(qrCode.rawValue);
                    }
                }
            } catch (error) {
                // 忽略检测过程中的错误
                console.log('检测过程中出现错误:', error);
            }
        }, 500); // 每500ms检测一次
    }

    /**
     * 处理检测到的二维码
     */
    handleQRCodeDetected(qrData) {
        if (!this.isScanning) return;

        // 停止扫描
        this.stopScan();
        
        // 解析二维码数据
        try {
            const expenseData = this.parseQRData(qrData);
            
            if (expenseData) {
                // 显示确认界面
                this.showConfirmation(expenseData);
            } else {
                this.app.showToast('无法识别的二维码格式', 'error');
                // 重新开始扫描
                setTimeout(() => this.startScan(), 2000);
            }
        } catch (error) {
            console.error('二维码解析失败:', error);
            this.app.showToast('二维码解析失败', 'error');
            setTimeout(() => this.startScan(), 2000);
        }
    }

    /**
     * 解析二维码数据
     */
    parseQRData(qrData) {
        try {
            // 尝试解析为JSON
            const data = JSON.parse(qrData);
            
            // 验证必需字段
            if (data.amount && data.category) {
                return {
                    amount: parseFloat(data.amount),
                    category: data.category,
                    description: data.description || '扫码支付',
                    date: data.date || new Date().toISOString().split('T')[0],
                    paymentMethod: data.paymentMethod || '扫码支付',
                    merchant: data.merchant || '未知商家'
                };
            }
        } catch (error) {
            // 如果不是JSON格式，尝试其他格式
            console.log('二维码数据不是JSON格式:', qrData);
        }
        
        return null;
    }

    /**
     * 显示确认界面
     */
    showConfirmation(expenseData) {
        const modalContent = `
            <div class="qr-confirmation">
                <div class="confirmation-header">
                    <i class="fas fa-check-circle success-icon"></i>
                    <h3>扫码成功</h3>
                </div>
                <div class="expense-details">
                    <div class="detail-item">
                        <label>金额:</label>
                        <span class="amount">¥${expenseData.amount.toFixed(2)}</span>
                    </div>
                    <div class="detail-item">
                        <label>分类:</label>
                        <span class="category">${expenseData.category}</span>
                    </div>
                    <div class="detail-item">
                        <label>商家:</label>
                        <span class="merchant">${expenseData.merchant}</span>
                    </div>
                    <div class="detail-item">
                        <label>描述:</label>
                        <span class="description">${expenseData.description}</span>
                    </div>
                </div>
                <div class="confirmation-actions">
                    <button class="btn btn-secondary" onclick="window.currentQRScanner?.rescan()">
                        重新扫描
                    </button>
                    <button class="btn btn-primary" onclick="window.currentQRScanner?.confirmExpense()">
                        确认记账
                    </button>
                </div>
            </div>
        `;

        this.app.showModal('确认记账', modalContent);
        
        // 保存当前数据
        this.currentExpenseData = expenseData;
    }

    /**
     * 确认记账
     */
    async confirmExpense() {
        if (!this.currentExpenseData) return;

        try {
            // 调用应用的记账功能
            await this.app.addExpense(this.currentExpenseData);
            
            this.app.showToast('记账成功', 'success');
            this.app.hideModal();
            
            // 重置数据
            this.currentExpenseData = null;
            
        } catch (error) {
            console.error('记账失败:', error);
            this.app.showToast('记账失败', 'error');
        }
    }

    /**
     * 重新扫描
     */
    rescan() {
        this.app.hideModal();
        this.currentExpenseData = null;
        setTimeout(() => this.startScan(), 500);
    }

    /**
     * 切换摄像头
     */
    async toggleCamera() {
        if (!this.stream) return;

        try {
            // 停止当前流
            this.stream.getTracks().forEach(track => track.stop());
            
            // 获取当前摄像头类型
            const currentTrack = this.stream.getVideoTracks()[0];
            const currentFacingMode = currentTrack.getSettings().facingMode;
            
            // 切换摄像头
            const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
            
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: newFacingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            if (this.videoElement) {
                this.videoElement.srcObject = this.stream;
            }
            
        } catch (error) {
            console.error('摄像头切换失败:', error);
            this.app.showToast('摄像头切换失败', 'error');
        }
    }

    /**
     * 从相册选择图片
     */
    uploadImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                // 停止相机扫描
                this.stopScan();
                
                // 创建图片元素
                const img = new Image();
                img.onload = async () => {
                    // 创建画布
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    // 检测二维码
                    const barcodeDetector = new BarcodeDetector({
                        formats: ['qr_code']
                    });
                    
                    const barcodes = await barcodeDetector.detect(canvas);
                    
                    if (barcodes.length > 0) {
                        const qrCode = barcodes[0];
                        this.handleQRCodeDetected(qrCode.rawValue);
                    } else {
                        this.app.showToast('未检测到二维码', 'error');
                        // 重新开始扫描
                        setTimeout(() => this.startScan(), 2000);
                    }
                };
                
                img.src = URL.createObjectURL(file);
                
            } catch (error) {
                console.error('图片处理失败:', error);
                this.app.showToast('图片处理失败', 'error');
                setTimeout(() => this.startScan(), 2000);
            }
        };
        
        input.click();
    }

    /**
     * 停止扫码
     */
    stopScan() {
        this.isScanning = false;
        
        // 清除定时器
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
        
        // 停止视频流
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        // 清理DOM元素
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
        
        // 移除全局引用
        window.currentQRScanner = null;
        
        // 隐藏模态框
        this.app.hideModal();
    }

    /**
     * 处理错误
     */
    handleError(error) {
        console.error('QR扫码错误:', error);
        
        let errorMessage = '扫码功能不可用';
        
        if (error.name === 'NotAllowedError') {
            errorMessage = '相机权限被拒绝，请在浏览器设置中启用相机权限';
        } else if (error.name === 'NotFoundError') {
            errorMessage = '未找到可用的相机设备';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = '浏览器不支持BarcodeDetector API';
        }
        
        this.app.showToast(errorMessage, 'error');
    }

    /**
     * 生成支付二维码
     */
    generatePaymentQR(expenseData) {
        // 简化版二维码生成（实际项目中应使用专业库）
        const qrData = JSON.stringify({
            type: 'expense',
            amount: expenseData.amount,
            category: expenseData.category,
            description: expenseData.description,
            timestamp: Date.now()
        });
        
        // 返回二维码数据（实际应生成图片）
        return {
            data: qrData,
            text: `扫码记账：¥${expenseData.amount} - ${expenseData.category}`
        };
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QRScanner;
} else {
    window.QRScanner = QRScanner;
}