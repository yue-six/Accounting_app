// 支付平台API配置
const paymentConfig = {
    wechat: {
        appId: process.env.WECHAT_APP_ID || 'wx1234567890abcdef',
        appSecret: process.env.WECHAT_APP_SECRET || 'demo_wechat_app_secret',
        mchId: process.env.WECHAT_MCH_ID || 'demo_wechat_mch_id',
        apiKey: process.env.WECHAT_API_KEY || 'demo_wechat_api_key',
        notifyUrl: process.env.WECHAT_NOTIFY_URL || 'http://localhost:3000/api/payments/wechat/notify',
        tradeType: 'JSAPI',
        sandbox: process.env.NODE_ENV !== 'production'
    },
    alipay: {
        appId: process.env.ALIPAY_APP_ID || '2021006103604761',
        privateKey: process.env.ALIPAY_PRIVATE_KEY || 'MIIEwAIBADANBgkqhkiG9w0BAQEFAASCBKowggSmAgEAAoIBAQDnw+Frt8+BC5MapM4Fj6ayXRf6rm34XxK3mbMztE3YaYy6Q+pLeLPr0m80MEhL1JiwSA+AMlve3ewtATr2za2vs6ZgUXefCaUnZsVDTs0DaD02iBVhtOIaOc+bmKUEZsdTcHv+DffXZwlXfyl+UQECxyzejjq1i3nEVn+F6m48eghxFyipN6vzM6uSi5m4oxM4k/zMzYA8+gOkt2+ABvPAYr6a85ym6WDFIx2d9CAWoyewMX/UOfboGr4fD+uz3vJZbceUDW65q+33y33LvF0ARea4CkyEbxcuj7t5DGilwvPHvVVhZgxWGY4UZre9JAhzDrxXB+nDOT25AwO7CEhpAgMBAAECggEBANoMJhbL9kO4egvFJbeBsRl6EEdeuEPGXruxtTFd3ydOFoJfxxx+UPf7IXh+PGZre8PN6Bd6SYjiTYMB91GfrFrzsAJKYzqTPnhVbh2nE6ay+XRGj6c/IMH/xdzjvczoTXupBl69EYHshJN3JbibyVGtxf8U3RNUR5l6r7t0FYZ6luCchdoYQMkSysvK60igdBStdhrxQQxkVFM13BN2vCN4EB7qjDbp54qHcSTjaeermVIpD6teKgnLMXHcebwrou3fsT2DkPm1x88JCj64IYU6sjt6UEDaUKhXDtqfEdl6e1TG0+9VAf61Y0XWdAVJLmrCt0VkZIj2kWe+yzlqNCECgYEA+bMYiDK8InMaoN3OdNBfguHH2/8IDni+dKtvh9kcZLbEgCRhEZbAl+uQjQLSgOkqK5IhrWr6N07Z/RZM7+H1CPsOVhyIKvqtmFRpgbBrEvQovEt2qG6iea230YTxVh+GpDd17vTtq5jOZmFAm3TwlXqWN2puXIxw0ISEz9iEmpUCgYEA7Zzwfd/odq/Fp6evtDvkrk2S3IT3MWNanstmtxgC9yiwvQj1ZWYlOGb7vBeLwBCTwr0aryBO+u4SZY3uX4FYCG956U2mK7v53nlrdmYXom2Vd1NWyHOFz2gmHWF30PrJjmbsyypkda7Wz0RNOOgUJQ49I1ySEfQ7Kv0a96fu1YUCgYEAx/eJeelHiT8s4A9Bu4L0OlieOaxvw0cnHz/7vYs9ldpYW1bG9dMIwaFAzeyor9wKjYIlvj+hypE3OduWGbWXCm4j+Qo4clL2mrtfEyE5XqBxzvmQOSsAqvlX8E7LBvGQXgqcQ5WakIV7JbpUhyqLUOovSonNgAhogFTgF6OJ7lECgYEAs1eF6OvsMFDA1abqJhYipzCjzU+Kp7s+taX+E+nKqzQKGdO+LFdpdmW8UR5Qe5nHfO9wSYgQNLMmLYJvzaP5hvxkvqO97TqHANUSOB4cbptZeePsF4WiFIaeZgSgA5qWMKYcycdoZa6eMXhy9KWuNr3FhYAkO+rkEbFR/mTBDmUCgYEAhTfKMdA7ZxkdwE3vg2PDKeFh4kTYx5N9rU9/L5OyZ1sByLaWefsRTNSIWCbT2WBB1rlTzI3t0bcLWt680luGKTinnPUi1NG3qbnOVDxWXjqToE1B7JR7Zk9YPJEE6JSJaHwaPoR2J0BQrgf/x/xlLVVjxr4TMh0yrGArPVQQQdg=',
        publicKey: process.env.ALIPAY_PUBLIC_KEY || 'demo_alipay_public_key',
        sandbox: process.env.NODE_ENV !== 'production',
        notifyUrl: process.env.ALIPAY_NOTIFY_URL || 'http://localhost:3000/api/payments/alipay/notify',
        encryptKey: process.env.ALIPAY_ENCRYPT_KEY || 'demo_alipay_encrypt_key'
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