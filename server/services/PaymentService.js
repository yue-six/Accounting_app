const axios = require('axios');
const crypto = require('crypto');
const paymentConfig = require('../config/payment');
const WechatOAuthService = require('./WechatOAuthService');
const AlipayOAuthService = require('./AlipayOAuthService');

class PaymentService {
    constructor() {
<<<<<<< Updated upstream
        this.wechatOAuth = new WechatOAuthService();
        this.alipayOAuth = new AlipayOAuthService();
    }

    /**
     * 处理支付平台登录
     * @param {string} platform - 支付平台（wechat/alipay）
     * @param {string} authCode - 授权码
     * @returns {Promise<Object>} 登录结果
     */
    async handlePaymentLogin(platform, authCode) {
=======
        this.config = paymentConfig;
        this.wechatOAuth = WechatOAuthService;
        this.alipayOAuth = AlipayOAuthService;
    }

    // --- 交易抓取相关（保留原实现） ---
    getApiEndpoint(platform) {
        const env = this.config[platform].sandbox ? 'sandbox' : 'production';
        return this.config.apiEndpoints[platform][env];
    }

    async fetchWechatTransactions(startTime, endTime) {
        // 如果没有配置真实 API，则返回空数组（或 Demo 模拟）
        if (!this.config.wechat || !this.config.wechat.appId) {
            return [];
        }

        const endpoint = this.getApiEndpoint('wechat') + 'pay/orderquery';
        const params = {
            appid: this.config.wechat.appId,
            mch_id: this.config.wechat.mchId,
            begin_time: startTime,
            end_time: endTime,
            nonce_str: this.generateNonceStr(),
        };

        params.sign = this.generateWechatSign(params);

>>>>>>> Stashed changes
        try {
            let userInfo;
            
            if (platform === 'wechat') {
                userInfo = await this.wechatOAuth.oauthLogin(authCode);
            } else if (platform === 'alipay') {
                userInfo = await this.alipayOAuth.oauthLogin(authCode);
            } else {
                throw new Error('不支持的支付平台');
            }

            return {
                success: true,
                user: userInfo.user,
                token: userInfo.token,
                platform: platform
            };
        } catch (error) {
<<<<<<< Updated upstream
            console.error('支付登录处理失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 获取支付平台状态
     * @returns {Object} 支付平台状态
     */
    getPaymentStatus() {
        return {
            wechat: {
                available: !!paymentConfig.wechat.appId && !paymentConfig.wechat.appId.startsWith('demo_'),
                sandbox: paymentConfig.wechat.sandbox
            },
            alipay: {
                available: !!paymentConfig.alipay.appId && !paymentConfig.alipay.appId.startsWith('demo_'),
                sandbox: paymentConfig.alipay.sandbox
            }
=======
            console.error('fetchWechatTransactions error:', error);
            throw new Error('获取微信支付交易记录失败');
        }
    }

    async fetchAlipayTransactions(startTime, endTime) {
        if (!this.config.alipay || !this.config.alipay.appId) {
            return [];
        }

        const endpoint = this.getApiEndpoint('alipay');
        const params = {
            app_id: this.config.alipay.appId,
            method: 'alipay.trade.query',
            charset: 'utf-8',
            sign_type: 'RSA2',
            timestamp: new Date().toISOString(),
            version: '1.0',
            biz_content: JSON.stringify({ start_time: startTime, end_time: endTime })
>>>>>>> Stashed changes
        };
    }

<<<<<<< Updated upstream
    /**
     * 验证支付签名
     * @param {Object} params - 支付参数
     * @param {string} platform - 支付平台
     * @returns {boolean} 签名是否有效
     */
    verifyPaymentSignature(params, platform) {
=======
        params.sign = this.generateAlipaySign(params);

>>>>>>> Stashed changes
        try {
            if (platform === 'wechat') {
                return this.verifyWechatSignature(params);
            } else if (platform === 'alipay') {
                return this.verifyAlipaySignature(params);
            }
            return false;
        } catch (error) {
<<<<<<< Updated upstream
            console.error('支付签名验证失败:', error);
            return false;
        }
    }

    /**
     * 验证微信支付签名
     * @param {Object} params - 支付参数
     * @returns {boolean} 签名是否有效
     */
    verifyWechatSignature(params) {
        // 微信支付签名验证逻辑
        // 这里简化处理，实际项目中需要实现完整的签名验证
        return true;
    }

    /**
     * 验证支付宝支付签名
     * @param {Object} params - 支付参数
     * @returns {boolean} 签名是否有效
     */
    verifyAlipaySignature(params) {
        // 支付宝支付签名验证逻辑
        // 这里简化处理，实际项目中需要实现完整的签名验证
        return true;
    }

    /**
     * 处理支付回调
     * @param {Object} callbackData - 回调数据
     * @param {string} platform - 支付平台
     * @returns {Promise<Object>} 处理结果
     */
    async handlePaymentCallback(callbackData, platform) {
        try {
            // 验证签名
            if (!this.verifyPaymentSignature(callbackData, platform)) {
                throw new Error('支付签名验证失败');
            }

            // 处理支付结果
            const result = {
                success: true,
                platform: platform,
                transactionId: callbackData.transaction_id || callbackData.out_trade_no,
                amount: callbackData.total_fee || callbackData.total_amount,
                status: this.parsePaymentStatus(callbackData, platform)
            };

            return result;
        } catch (error) {
            console.error('支付回调处理失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 解析支付状态
     * @param {Object} data - 支付数据
     * @param {string} platform - 支付平台
     * @returns {string} 支付状态
     */
    parsePaymentStatus(data, platform) {
        if (platform === 'wechat') {
            return data.return_code === 'SUCCESS' && data.result_code === 'SUCCESS' ? 'SUCCESS' : 'FAIL';
        } else if (platform === 'alipay') {
            return data.trade_status === 'TRADE_SUCCESS' ? 'SUCCESS' : 'FAIL';
        }
        return 'UNKNOWN';
=======
            console.error('fetchAlipayTransactions error:', error);
            throw new Error('获取支付宝交易记录失败');
        }
    }

    generateWechatSign(params) {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');

        const stringToSign = sortedParams + '&key=' + (this.config.wechat?.apiKey || '');
        return crypto.createHash('md5').update(stringToSign).digest('hex').toUpperCase();
    }

    generateAlipaySign(params) {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');

        try {
            return crypto.createSign('RSA-SHA256').update(sortedParams).sign(this.config.alipay.privateKey, 'base64');
        } catch (e) {
            console.warn('generateAlipaySign warning:', e.message);
            return '';
        }
    }

    parseWechatTransactions(data) {
        if (!data || !data.transaction_list) return [];
        return data.transaction_list.map(tx => ({
            platform: 'wechat',
            transactionId: tx.transaction_id,
            amount: parseFloat(tx.total_fee) / 100,
            type: tx.trade_type,
            status: tx.trade_state,
            merchantName: tx.merchant_name,
            description: tx.body,
            time: new Date(tx.time_end),
            raw: tx
        }));
    }

    parseAlipayTransactions(data) {
        if (!data || !data.alipay_trade_query_response || !data.alipay_trade_query_response.trade_list) return [];
        return data.alipay_trade_query_response.trade_list.map(tx => ({
            platform: 'alipay',
            transactionId: tx.trade_no,
            amount: parseFloat(tx.total_amount),
            type: tx.trade_type,
            status: tx.trade_status,
            merchantName: tx.merchant_name,
            description: tx.subject,
            time: new Date(tx.gmt_create),
            raw: tx
        }));
    }

    generateNonceStr(length = 32) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        return result;
>>>>>>> Stashed changes
    }

    // --- OAuth / 连接管理 ---
    async handlePaymentLogin(platform, authCode) {
        try {
            if (platform === 'wechat') {
                return await this.wechatOAuth.oauthLogin(authCode);
            } else if (platform === 'alipay') {
                return await this.alipayOAuth.oauthLogin(authCode);
            }
            throw new Error('不支持的支付平台');
        } catch (error) {
            console.error('handlePaymentLogin error:', error);
            return { success: false, message: error.message };
        }
    }

    getPaymentStatus() {
        return {
            wechat: { available: !!this.config.wechat?.appId, sandbox: this.config.wechat?.sandbox },
            alipay: { available: !!this.config.alipay?.appId, sandbox: this.config.alipay?.sandbox }
        };
    }

    // 用于payments路由中检查用户是否已连接（demo实现）
    async checkWechatAuthStatus(userId) {
        // TODO: 这里可以查询数据库中用户关联表，暂返回 disconnected
        return 'disconnected';
    }

    async checkAlipayAuthStatus(userId) {
        return 'disconnected';
    }

    async revokeWechatAuth(userId) {
        // TODO: 从数据库删除关联记录
        return true;
    }

    async revokeAlipayAuth(userId) {
        return true;
    }

    // 支付通知/回调验证 - 简化为总是返回 true（实际需求请实现签名验证）
    verifyWechatNotification(params) { return true; }
    verifyAlipayNotification(params) { return true; }

    async handleWechatNotification(callbackData) {
        // 处理业务，如更新订单状态等（此处为占位）
        return { success: true };
    }

    async handleAlipayNotification(callbackData) {
        return { success: true };
    }
}

module.exports = PaymentService;