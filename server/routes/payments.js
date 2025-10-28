const express = require('express');
const { body, validationResult } = require('express-validator');
const PaymentService = require('../services/PaymentService');
const { authenticateToken, rateLimit } = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
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