const axios = require('axios');
const crypto = require('crypto');
const paymentConfig = require('../config/payment');

class PaymentService {
    constructor() {
        this.config = paymentConfig;
    }

    // 获取支付平台API地址
    getApiEndpoint(platform) {
        const env = this.config[platform].sandbox ? 'sandbox' : 'production';
        return this.config.apiEndpoints[platform][env];
    }

    // 微信支付相关方法
    async fetchWechatTransactions(startTime, endTime) {
        const endpoint = this.getApiEndpoint('wechat') + 'pay/orderquery';
        const params = {
            appid: this.config.wechat.appId,
            mch_id: this.config.wechat.mchId,
            begin_time: startTime,
            end_time: endTime,
            nonce_str: this.generateNonceStr(),
        };

        // 添加签名
        params.sign = this.generateWechatSign(params);

        try {
            const response = await axios.post(endpoint, params);
            return this.parseWechatTransactions(response.data);
        } catch (error) {
            console.error('获取微信支付交易记录失败:', error);
            throw new Error('获取微信支付交易记录失败');
        }
    }

    // 支付宝相关方法
    async fetchAlipayTransactions(startTime, endTime) {
        const endpoint = this.getApiEndpoint('alipay');
        const params = {
            app_id: this.config.alipay.appId,
            method: 'alipay.trade.query',
            charset: 'utf-8',
            sign_type: 'RSA2',
            timestamp: new Date().toISOString(),
            version: '1.0',
            biz_content: JSON.stringify({
                start_time: startTime,
                end_time: endTime
            })
        };

        // 添加签名
        params.sign = this.generateAlipaySign(params);

        try {
            const response = await axios.post(endpoint, params);
            return this.parseAlipayTransactions(response.data);
        } catch (error) {
            console.error('获取支付宝交易记录失败:', error);
            throw new Error('获取支付宝交易记录失败');
        }
    }

    // 生成微信支付签名
    generateWechatSign(params) {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');

        const stringToSign = sortedParams + '&key=' + this.config.wechat.apiKey;
        return crypto.createHash('md5')
            .update(stringToSign)
            .digest('hex')
            .toUpperCase();
    }

    // 生成支付宝签名
    generateAlipaySign(params) {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');

        const sign = crypto.createSign('RSA-SHA256')
            .update(sortedParams)
            .sign(this.config.alipay.privateKey, 'base64');

        return sign;
    }

    // 解析微信支付交易记录
    parseWechatTransactions(data) {
        // 根据微信支付API返回格式解析数据
        return data.transaction_list.map(transaction => ({
            platform: 'wechat',
            transactionId: transaction.transaction_id,
            amount: parseFloat(transaction.total_fee) / 100,
            type: transaction.trade_type,
            status: transaction.trade_state,
            merchantName: transaction.merchant_name,
            description: transaction.body,
            time: new Date(transaction.time_end),
            raw: transaction
        }));
    }

    // 解析支付宝交易记录
    parseAlipayTransactions(data) {
        // 根据支付宝API返回格式解析数据
        return data.alipay_trade_query_response.trade_list.map(transaction => ({
            platform: 'alipay',
            transactionId: transaction.trade_no,
            amount: parseFloat(transaction.total_amount),
            type: transaction.trade_type,
            status: transaction.trade_status,
            merchantName: transaction.merchant_name,
            description: transaction.subject,
            time: new Date(transaction.gmt_create),
            raw: transaction
        }));
    }

    // 生成随机字符串
    generateNonceStr(length = 32) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}

module.exports = new PaymentService();