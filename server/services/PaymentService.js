const axios = require('axios');
const crypto = require('crypto');
const paymentConfig = require('../config/payment');
const WechatOAuthService = require('./WechatOAuthService');
const AlipayOAuthService = require('./AlipayOAuthService');

class PaymentService {
    constructor() {
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
        };
    }

    /**
     * 验证支付签名
     * @param {Object} params - 支付参数
     * @param {string} platform - 支付平台
     * @returns {boolean} 签名是否有效
     */
    verifyPaymentSignature(params, platform) {
        try {
            if (platform === 'wechat') {
                return this.verifyWechatSignature(params);
            } else if (platform === 'alipay') {
                return this.verifyAlipaySignature(params);
            }
            return false;
        } catch (error) {
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
    }
}

module.exports = PaymentService;