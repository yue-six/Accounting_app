// 照片识别管理器
class PhotoRecognition {
    constructor(app) {
        this.app = app;
        this.isProcessing = false;
    }

    // 拍照识别
    async takePhotoAndRecognize() {
        if (!this.isCameraSupported()) {
            this.showUnsupportedMessage();
            return;
        }

        this.showCameraInterface();
        
        // 尝试访问摄像头
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            
            const video = document.getElementById('camera-preview');
            if (video) {
                video.srcObject = this.mediaStream;
            }
        } catch (error) {
            console.error('摄像头访问失败:', error);
            this.app.showToast('无法访问摄像头', 'error');
            this.hideCameraInterface();
        }
    }

    // 检查摄像头支持
    isCameraSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    // 显示摄像头界面
    showCameraInterface() {
        const cameraContainer = document.createElement('div');
        cameraContainer.id = 'photo-camera-container';
        cameraContainer.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: #000;
                z-index: 10002;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            ">
                <!-- 摄像头预览 -->
                <video id="camera-preview" autoplay playsinline style="
                    width: 100%;
                    height: 70%;
                    object-fit: cover;
                "></video>

                <!-- 控制区域 -->
                <div style="
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    color: white;
                ">
                    <h3 style="margin-bottom: 10px;">拍照识别</h3>
                    <p style="margin-bottom: 20px; text-align: center;">对准账单或收据拍照</p>
                    
                    <div style="display: flex; gap: 15px;">
                        <button id="take-photo" style="
                            padding: 12px 24px;
                            background: #4fd1c5;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-size: 16px;
                            cursor: pointer;
                        ">拍照</button>
                        
                        <button id="close-camera" style="
                            padding: 12px 24px;
                            background: #f56565;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-size: 16px;
                            cursor: pointer;
                        ">关闭</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(cameraContainer);
        
        // 绑定拍照事件
        document.getElementById('take-photo').addEventListener('click', () => {
            this.capturePhoto();
        });
        
        // 绑定关闭事件
        document.getElementById('close-camera').addEventListener('click', () => {
            this.hideCameraInterface();
        });
    }
    
    // 拍照
    capturePhoto() {
        const video = document.getElementById('camera-preview');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 这里可以添加图像识别逻辑
        // 暂时模拟识别结果
        this.processPhotoRecognition(canvas.toDataURL('image/jpeg'));
    }
    
    // 处理照片识别
    processPhotoRecognition(imageData) {
        // 模拟识别结果
        const mockResult = {
            amount: 28.5,
            category: 'food',
            description: '早餐消费',
            type: 'expense'
        };
        
        this.app.showToast('识别成功！正在创建交易...', 'success');
        
        // 创建交易
        const transaction = {
            id: Date.now(),
            amount: mockResult.amount,
            category: mockResult.category,
            description: mockResult.description,
            type: mockResult.type,
            date: new Date().toISOString(),
            timestamp: Date.now(),
            source: 'photo_recognition'
        };
        
        this.app.addTransaction(transaction);
        this.hideCameraInterface();
    }
    
    // 隐藏摄像头界面
    hideCameraInterface() {
        const container = document.getElementById('photo-camera-container');
        if (container) {
            container.remove();
        }
        
        // 停止摄像头流
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
    }
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    width: 100%;
                ">
                    <!-- 拍照按钮 -->
                    <button id="capture-btn" style="
                        width: 70px;
                        height: 70px;
                        border-radius: 50%;
                        background: #4fd1c5;
                        border: 4px solid white;
                        cursor: pointer;
                        margin-bottom: 20px;
                    "></button>

                    <!-- 提示信息 -->
                    <div style="color: white; text-align: center;">
                        <div style="font-size: 1.1rem; margin-bottom: 10px;">拍摄小票或账单</div>
                        <div style="color: #ccc; font-size: 0.9rem;">
                            确保照片清晰，光线充足
                        </div>
                    </div>

                    <!-- 模拟拍照按钮 -->
                    <button id="simulate-photo" style="
                        margin-top: 20px;
                        background: rgba(255,255,255,0.2);
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 20px;
                        font-size: 0.9rem;
                        cursor: pointer;
                        backdrop-filter: blur(10px);
                    ">模拟拍照</button>
                </div>

                <!-- 关闭按钮 -->
                <button id="close-camera" style="
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    font-size: 1.2rem;
                    cursor: pointer;
                    backdrop-filter: blur(10px);
                ">×</button>
            </div>
        `;

        document.body.appendChild(cameraContainer);

        // 初始化摄像头
        this.initCamera();

        // 添加事件监听
        document.getElementById('close-camera').addEventListener('click', () => {
            this.closeCamera();
        });

        document.getElementById('capture-btn').addEventListener('click', () => {
            this.capturePhoto();
        });

        document.getElementById('simulate-photo').addEventListener('click', () => {
            this.simulatePhotoRecognition();
        });
    }

    // 初始化摄像头
    async initCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment' // 优先使用后置摄像头
                }
            });

            const video = document.getElementById('camera-preview');
            video.srcObject = stream;

        } catch (error) {
            console.error('摄像头初始化失败:', error);
            this.showCameraError();
        }
    }

    // 拍照
    capturePhoto() {
        const video = document.getElementById('camera-preview');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 获取照片数据
        const imageData = canvas.toDataURL('image/jpeg');
        
        // 处理照片识别
        this.processPhoto(imageData);
    }

    // 处理照片识别
    async processPhoto(imageData) {
        this.isProcessing = true;
        this.showProcessingIndicator();

        try {
            // 模拟照片识别处理
            // 在实际应用中，这里可以调用OCR API或机器学习模型
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const recognizedData = this.simulatePhotoRecognitionResult();
            this.onRecognitionSuccess?.(recognizedData);

        } catch (error) {
            console.error('照片识别失败:', error);
            this.onRecognitionError?.(error.message);
        } finally {
            this.isProcessing = false;
            this.hideProcessingIndicator();
            this.closeCamera();
        }
    }

    // 模拟照片识别结果
    simulatePhotoRecognitionResult() {
        const receiptTypes = [
            {
                type: 'supermarket',
                items: [
                    { name: '牛奶', price: 12.5, quantity: 1 },
                    { name: '面包', price: 8.0, quantity: 2 },
                    { name: '水果', price: 25.0, quantity: 1 }
                ],
                total: 45.5,
                merchant: '超市'
            },
            {
                type: 'restaurant',
                items: [
                    { name: '午餐套餐', price: 35.0, quantity: 1 },
                    { name: '饮料', price: 8.0, quantity: 1 }
                ],
                total: 43.0,
                merchant: '餐厅'
            },
            {
                type: 'coffee',
                items: [
                    { name: '咖啡', price: 28.0, quantity: 1 },
                    { name: '蛋糕', price: 18.0, quantity: 1 }
                ],
                total: 46.0,
                merchant: '咖啡店'
            }
        ];

        const receipt = receiptTypes[Math.floor(Math.random() * receiptTypes.length)];
        
        return {
            type: 'expense',
            amount: receipt.total,
            description: `${receipt.merchant}消费`,
            category: this.getCategoryByMerchant(receipt.merchant),
            merchant: receipt.merchant,
            items: receipt.items,
            source: 'photo'
        };
    }

    // 根据商户获取分类
    getCategoryByMerchant(merchant) {
        const categoryMap = {
            '超市': 'shopping',
            '餐厅': 'food',
            '咖啡店': 'food',
            '服装店': 'shopping',
            '书店': 'study',
            '影院': 'entertainment'
        };

        return categoryMap[merchant] || 'other';
    }

    // 模拟拍照识别
    simulatePhotoRecognition() {
        const recognizedData = this.simulatePhotoRecognitionResult();
        this.onRecognitionSuccess?.(recognizedData);
        this.closeCamera();
    }

    // 关闭摄像头
    closeCamera() {
        // 停止摄像头流
        const video = document.getElementById('camera-preview');
        if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }

        // 移除界面
        const container = document.getElementById('photo-camera-container');
        if (container) {
            document.body.removeChild(container);
        }
    }

    // 显示处理指示器
    showProcessingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'photo-processing-indicator';
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
                z-index: 10003;
                backdrop-filter: blur(10px);
            ">
                <div style="font-size: 3rem; margin-bottom: 20px;">🔍</div>
                <div style="font-size: 1.1rem; margin-bottom: 10px;">正在识别照片...</div>
                <div style="color: #ccc; font-size: 0.9rem;">
                    请稍候，系统正在分析账单内容
                </div>
            </div>
        `;

        document.body.appendChild(indicator);
    }

    // 隐藏处理指示器
    hideProcessingIndicator() {
        const indicator = document.getElementById('photo-processing-indicator');
        if (indicator) {
            document.body.removeChild(indicator);
        }
    }

    // 显示不支持消息
    showUnsupportedMessage() {
        this.app.showToast('您的设备不支持摄像头功能');
    }

    // 显示摄像头错误
    showCameraError() {
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
                z-index: 10003;
                backdrop-filter: blur(10px);
            ">
                <div style="font-size: 3rem; margin-bottom: 15px;">❌</div>
                <div style="font-size: 1.1rem; margin-bottom: 10px;">摄像头访问失败</div>
                <div style="color: #ccc; font-size: 0.9rem;">
                    请检查摄像头权限设置
                </div>
            </div>
        `;

        document.body.appendChild(errorMsg);

        setTimeout(() => {
            if (errorMsg.parentNode) {
                document.body.removeChild(errorMsg);
            }
        }, 3000);
    }

    // 设置回调函数
    setCallbacks({ onRecognitionSuccess, onRecognitionError }) {
        this.onRecognitionSuccess = onRecognitionSuccess;
        this.onRecognitionError = onRecognitionError;
    }

    // 检查支持状态
    getSupportStatus() {
        const supported = this.isCameraSupported();
        return {
            supported,
            status: supported ? '可用' : '不可用',
            message: supported ? '拍照识别功能已准备就绪' : '设备不支持摄像头访问'
        };
    }
}

// 照片识别工具函数
const PhotoRecognitionUtils = {
    // 创建照片识别实例
    createPhotoRecognition(app) {
        const photoRecognition = new PhotoRecognition(app);
        
        photoRecognition.setCallbacks({
            onRecognitionSuccess: (data) => {
                // 自动添加到交易
                app.addTransaction(data);
                PhotoRecognitionUtils.showRecognitionSuccess(data);
            },
            onRecognitionError: (error) => {
                PhotoRecognitionUtils.showRecognitionError(error);
            }
        });

        return photoRecognition;
    },

    // 显示识别成功
    showRecognitionSuccess(data) {
        const successMsg = document.createElement('div');
        successMsg.innerHTML = `
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
                    ${data.merchant}消费<br>
                    总计: ¥${data.amount}
                </div>
            </div>
        `;

        document.body.appendChild(successMsg);

        setTimeout(() => {
            if (successMsg.parentNode) {
                document.body.removeChild(successMsg);
            }
        }, 2000);
    },

    // 显示识别错误
    showRecognitionError(error) {
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