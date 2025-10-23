// 支付平台API配置
const paymentConfig = {
    wechat: {
        appId: process.env.WECHAT_APP_ID,
        appSecret: process.env.WECHAT_APP_SECRET,
        mchId: process.env.WECHAT_MCH_ID,
        apiKey: process.env.WECHAT_API_KEY,
        notifyUrl: process.env.WECHAT_NOTIFY_URL || 'http://localhost:3000/api/payments/wechat/notify',
        tradeType: 'JSAPI',
        sandbox: process.env.NODE_ENV !== 'production'
    },
    alipay: {
        appId: process.env.ALIPAY_APP_ID,
        privateKey: process.env.ALIPAY_PRIVATE_KEY,
        publicKey: process.env.ALIPAY_PUBLIC_KEY,
        sandbox: process.env.NODE_ENV !== 'production',
        notifyUrl: process.env.ALIPAY_NOTIFY_URL || 'http://localhost:3000/api/payments/alipay/notify',
        encryptKey: process.env.ALIPAY_ENCRYPT_KEY
    },
    // 支付平台API接口地址
    apiEndpoints: {
        wechat: {
            sandbox: 'https://api.mch.weixin.qq.com/sandboxnew/',
            production: 'https://api.mch.weixin.qq.com/'
        },
        alipay: {
            sandbox: 'https://openapi.alipaydev.com/gateway.do',
            production: 'https://openapi.alipay.com/gateway.do'
        }
    }
};

module.exports = paymentConfig;