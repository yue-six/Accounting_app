const express = require('express');
const { body, validationResult } = require('express-validator');
const PaymentService = require('../services/PaymentService');
const WechatOAuthService = require('../services/WechatOAuthService');
const AlipayOAuthService = require('../services/AlipayOAuthService');
const { authenticateToken, rateLimit } = require('../middleware/auth');

const router = express.Router();

// 支付登录路由不需要认证
router.post('/login', [
    body('platform').isIn(['wechat', 'alipay']).withMessage('不支持的支付平台'),
    body('authCode').notEmpty().withMessage('授权码不能为空')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { platform, authCode } = req.body;

        let result;
        if (platform === 'wechat') {
            result = await PaymentService.wechatLogin(authCode);
        } else {
            result = await PaymentService.alipayLogin(authCode);
        }

        if (result.success) {
            res.json({
                success: true,
                data: {
                    user: result.user,
                    platform,
                    loginTime: new Date().toISOString()
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }

    } catch (error) {
        console.error('支付登录失败:', error);
        res.status(500).json({
            success: false,
            message: '支付登录失败'
        });
    }
});

// 微信OAuth2授权URL生成
router.get('/wechat/auth-url', async (req, res) => {
    try {
        const { redirect_uri, state = '' } = req.query;
        
        if (!redirect_uri) {
            return res.status(400).json({
                success: false,
                message: 'redirect_uri参数不能为空'
            });
        }

        const authUrl = WechatOAuthService.generateAuthUrl(redirect_uri, state);
        
        res.json({
            success: true,
            data: {
                auth_url: authUrl
            }
        });

    } catch (error) {
        console.error('生成微信授权URL失败:', error);
        res.status(500).json({
            success: false,
            message: '生成微信授权URL失败'
        });
    }
});

// 微信OAuth2回调处理
router.post('/wechat/callback', [
    body('code').notEmpty().withMessage('授权码不能为空')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { code } = req.body;
        
        // 使用微信OAuth2服务处理登录
        const result = await WechatOAuthService.oauthLogin(code);
        
        if (result.success) {
            res.json({
                success: true,
                data: {
                    user: result.data.user,
                    tokenInfo: result.data.tokenInfo,
                    loginTime: new Date().toISOString()
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }

    } catch (error) {
        console.error('微信OAuth2回调处理失败:', error);
        res.status(500).json({
            success: false,
            message: '微信OAuth2回调处理失败'
        });
    }
});

// 支付宝OAuth2回调处理
router.post('/alipay/callback', [
    body('auth_code').notEmpty().withMessage('授权码不能为空')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { auth_code } = req.body;
        
        // 使用支付宝OAuth2服务处理登录
        const result = await AlipayOAuthService.oauthLogin(auth_code);
        
        if (result.success) {
            res.json({
                success: true,
                data: {
                    user: result.data.user,
                    token: result.data.token,
                    expiresIn: result.data.expiresIn,
                    tokenInfo: result.data.tokenInfo,
                    loginTime: new Date().toISOString()
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }

    } catch (error) {
        console.error('支付宝OAuth2回调处理失败:', error);
        res.status(500).json({
            success: false,
            message: '支付宝OAuth2回调处理失败'
        });
    }
});

// 支付宝OAuth2回调处理
router.post('/alipay/callback', [
    body('auth_code').notEmpty().withMessage('授权码不能为空')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { auth_code } = req.body;
        
        // 使用支付宝OAuth2服务处理登录
        const result = await AlipayOAuthService.oauthLogin(auth_code);
        
        if (result.success) {
            res.json({
                success: true,
                data: {
                    user: result.data.user,
                    token: result.data.token,
                    expiresIn: result.data.expiresIn,
                    tokenInfo: result.data.tokenInfo,
                    loginTime: new Date().toISOString()
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }

    } catch (error) {
        console.error('支付宝OAuth2回调处理失败:', error);
        res.status(500).json({
            success: false,
            message: '支付宝OAuth2回调处理失败'
        });
    }
});

// 检查支付服务状态
router.get('/status', async (req, res) => {
    try {
        // 检查支付服务配置是否完整
        const config = require('../config/payment');
        const wechatConfigured = !!(config.wechat.appId && config.wechat.appSecret);
        const alipayConfigured = !!(config.alipay.appId && config.alipay.privateKey);

        res.json({
            success: true,
            data: {
                available: wechatConfigured || alipayConfigured,
                wechat: wechatConfigured,
                alipay: alipayConfigured
            }
        });

    } catch (error) {
        console.error('检查支付服务状态失败:', error);
        res.status(500).json({
            success: false,
            message: '检查支付服务状态失败'
        });
    }
});

// 其他路由需要认证
router.use(authenticateToken);

// 获取支付平台交易记录
router.get('/transactions', [
    rateLimit(15 * 60 * 1000, 100) // 15分钟内最多100次请求
], async (req, res) => {
    try {
        const { platform, startTime, endTime } = req.query;

        if (!['wechat', 'alipay'].includes(platform)) {
            return res.status(400).json({
                success: false,
                message: '不支持的支付平台'
            });
        }

        let transactions;
        if (platform === 'wechat') {
            transactions = await PaymentService.fetchWechatTransactions(startTime, endTime);
        } else {
            transactions = await PaymentService.fetchAlipayTransactions(startTime, endTime);
        }

        res.json({
            success: true,
            data: transactions
        });

    } catch (error) {
        console.error('获取交易记录失败:', error);
        res.status(500).json({
            success: false,
            message: '获取交易记录失败'
        });
    }
});

// 微信支付回调通知
router.post('/wechat/notify', async (req, res) => {
    try {
        // 验证签名
        const isValid = PaymentService.verifyWechatNotification(req.body);
        if (!isValid) {
            return res.status(400).send('FAIL');
        }

        // 处理支付结果通知
        await PaymentService.handleWechatNotification(req.body);
        res.send('SUCCESS');

    } catch (error) {
        console.error('处理微信支付通知失败:', error);
        res.status(500).send('FAIL');
    }
});

// 支付宝回调通知
router.post('/alipay/notify', async (req, res) => {
    try {
        // 验证签名
        const isValid = PaymentService.verifyAlipayNotification(req.body);
        if (!isValid) {
            return res.status(400).send('failure');
        }

        // 处理支付结果通知
        await PaymentService.handleAlipayNotification(req.body);
        res.send('success');

    } catch (error) {
        console.error('处理支付宝通知失败:', error);
        res.status(500).send('failure');
    }
});

// 获取支付平台授权状态
router.get('/auth-status', async (req, res) => {
    try {
        const status = {
            wechat: await PaymentService.checkWechatAuthStatus(req.user.id),
            alipay: await PaymentService.checkAlipayAuthStatus(req.user.id)
        };

        res.json({
            success: true,
            data: status
        });

    } catch (error) {
        console.error('获取授权状态失败:', error);
        res.status(500).json({
            success: false,
            message: '获取授权状态失败'
        });
    }
});

// 解除支付平台授权
router.post('/revoke-auth', [
    body('platform').isIn(['wechat', 'alipay']).withMessage('不支持的支付平台')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { platform } = req.body;
        
        if (platform === 'wechat') {
            await PaymentService.revokeWechatAuth(req.user.id);
        } else {
            await PaymentService.revokeAlipayAuth(req.user.id);
        }

        res.json({
            success: true,
            message: '已成功解除授权'
        });

    } catch (error) {
        console.error('解除授权失败:', error);
        res.status(500).json({
            success: false,
            message: '解除授权失败'
        });
    }
});

module.exports = router;