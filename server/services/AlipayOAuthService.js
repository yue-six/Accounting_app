const axios = require('axios');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const paymentConfig = require('../config/payment');
const User = require('../models/User');

class AlipayOAuthService {
    constructor() {
        this.config = paymentConfig.alipay;
        this.oauthConfig = {
            authorizeUrl: 'https://openauth.alipay.com/oauth2/publicAppAuthorize.htm',
            accessTokenUrl: 'https://openapi.alipay.com/gateway.do',
            userInfoUrl: 'https://openapi.alipay.com/gateway.do'
        };
    }

    /**
     * 生成支付宝OAuth2授权URL
     * @param {string} redirectUri - 回调地址
     * @param {string} scope - 授权范围（默认：auth_user）
     * @param {string} state - 状态参数（可选）
     * @returns {string} 授权URL
     */
    generateAuthUrl(redirectUri, scope = 'auth_user', state = '') {
        const params = new URLSearchParams({
            app_id: this.config.appId,
            redirect_uri: redirectUri,
            scope: scope,
            state: state
        });

        return `${this.oauthConfig.authorizeUrl}?${params.toString()}`;
    }

    /**
     * 使用授权码获取access_token
     * @param {string} authCode - 授权码
     * @returns {Promise<Object>} access_token信息
     */
    async getAccessToken(authCode) {
        try {
            // 检查是否为演示模式
            if (this.config.appId.startsWith('demo_') || this.config.appId === 'demo_alipay_app_id') {
                return {
                    alipay_system_oauth_token_response: {
                        user_id: 'demo_user_id_' + Date.now(),
                        access_token: 'demo_access_token_' + Date.now(),
                        expires_in: 7200,
                        refresh_token: 'demo_refresh_token_' + Date.now(),
                        re_expires_in: 2592000
                    },
                    sign: 'demo_sign'
                };
            }

            // 构建支付宝API请求参数
            const bizContent = {
                grant_type: 'authorization_code',
                code: authCode
            };

            const response = await this.alipayApiRequest('alipay.system.oauth.token', bizContent);
            
            if (response.error_response) {
                throw new Error(`获取access_token失败: ${response.error_response.msg}`);
            }

            return response;
        } catch (error) {
            console.error('获取支付宝access_token失败:', error);
            throw error;
        }
    }

    /**
     * 获取用户信息
     * @param {string} accessToken - access_token
     * @returns {Promise<Object>} 用户信息
     */
    async getUserInfo(accessToken) {
        try {
            // 检查是否为演示模式
            if (this.config.appId.startsWith('demo_') || this.config.appId === 'demo_alipay_app_id') {
                return {
                    alipay_user_info_share_response: {
                        code: '10000',
                        msg: 'Success',
                        user_id: '208810292579123456781',
                        nick_name: '支付宝用户',
                        avatar: 'https://tfs.alipayobjects.com/images/partner/T1BvFgXb0jXXXXXXXX',
                        province: '北京市',
                        city: '北京市',
                        gender: 'M',
                        is_certified: 'T',
                        is_student_certified: 'F'
                    },
                    sign: 'demo_sign'
                };
            }

            const bizContent = {
                auth_token: accessToken
            };

            const response = await this.alipayApiRequest('alipay.user.info.share', bizContent);
            
            if (response.error_response) {
                throw new Error(`获取用户信息失败: ${response.error_response.msg}`);
            }

            return response;
        } catch (error) {
            console.error('获取支付宝用户信息失败:', error);
            throw error;
        }
    }

    /**
     * 完整的OAuth2登录流程
     * @param {string} authCode - 授权码
     * @returns {Promise<Object>} 登录结果
     */
    async oauthLogin(authCode) {
        try {
            // 1. 获取access_token
            const tokenResponse = await this.getAccessToken(authCode);
            const tokenInfo = tokenResponse.alipay_system_oauth_token_response;
            
            // 2. 获取用户信息
            const userResponse = await this.getUserInfo(tokenInfo.access_token);
            const userInfo = userResponse.alipay_user_info_share_response;
            
            // 3. 关联或创建本地用户账号
            const localUser = await User.findOrCreateByAlipay(userInfo);
            
            // 4. 生成JWT令牌
            const jwtToken = this.generateJWTToken(localUser._id);
            
            // 5. 更新用户最后登录时间
            await localUser.updateLastActive();
            
            // 6. 返回完整的登录信息
            return {
                success: true,
                data: {
                    user: {
                        id: localUser._id,
                        username: localUser.username,
                        email: localUser.email,
                        profile: localUser.profile,
                        preferences: localUser.preferences,
                        statistics: localUser.statistics,
                        // 支付宝用户信息
                        alipay_user: {
                            user_id: userInfo.user_id,
                            nick_name: userInfo.nick_name,
                            avatar: userInfo.avatar,
                            gender: userInfo.gender,
                            province: userInfo.province,
                            city: userInfo.city,
                            is_certified: userInfo.is_certified,
                            is_student_certified: userInfo.is_student_certified
                        }
                    },
                    token: jwtToken,
                    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
                    tokenInfo: {
                        access_token: tokenInfo.access_token,
                        expires_in: tokenInfo.expires_in,
                        refresh_token: tokenInfo.refresh_token,
                        user_id: tokenInfo.user_id
                    }
                }
            };
        } catch (error) {
            console.error('支付宝OAuth2登录失败:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 生成JWT令牌
     * @param {string} userId - 用户ID
     * @returns {string} JWT令牌
     */
    generateJWTToken(userId) {
        return jwt.sign(
            { userId },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
    }

    /**
     * 支付宝API请求通用方法
     * @param {string} method - API方法名
     * @param {Object} bizContent - 业务参数
     * @returns {Promise<Object>} API响应
     */
    async alipayApiRequest(method, bizContent) {
        const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        
        const params = {
            app_id: this.config.appId,
            method: method,
            charset: 'utf-8',
            sign_type: 'RSA2',
            timestamp: timestamp,
            version: '1.0',
            biz_content: JSON.stringify(bizContent)
        };

        // 生成签名
        const sign = this.generateSign(params);
        params.sign = sign;

        const apiUrl = this.config.sandbox ? 
            paymentConfig.apiEndpoints.alipay.sandbox : 
            paymentConfig.apiEndpoints.alipay.production;

        const response = await axios.post(apiUrl, new URLSearchParams(params), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return response.data;
    }

    /**
     * 生成支付宝签名
     * @param {Object} params - 请求参数
     * @returns {string} 签名
     */
    generateSign(params) {
        // 按字典序排序参数
        const sortedParams = Object.keys(params)
            .filter(key => params[key] !== '' && key !== 'sign')
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');

        // 使用私钥签名
        const sign = crypto.createSign('RSA-SHA256');
        sign.update(sortedParams);
        
        // 如果是演示模式，返回演示签名
        if (this.config.appId.startsWith('demo_') || this.config.appId === 'demo_alipay_app_id') {
            return 'demo_sign';
        }

        // 处理私钥格式（确保是PEM格式）
        let privateKey = this.config.privateKey;
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
            privateKey = `-----BEGIN PRIVATE KEY-----
${privateKey}
-----END PRIVATE KEY-----`;
        }

        return sign.sign(privateKey, 'base64');
    }

    /**
     * 验证支付宝签名
     * @param {Object} params - 响应参数
     * @param {string} sign - 签名
     * @returns {boolean} 签名是否有效
     */
    verifySign(params, sign) {
        // 如果是演示模式，直接返回true
        if (this.config.appId.startsWith('demo_') || this.config.appId === 'demo_alipay_app_id') {
            return true;
        }

        const sortedParams = Object.keys(params)
            .filter(key => params[key] !== '' && key !== 'sign' && key !== 'sign_type')
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');

        const verify = crypto.createVerify('RSA-SHA256');
        verify.update(sortedParams);
        
        return verify.verify(this.config.publicKey, sign, 'base64');
    }
}

module.exports = new AlipayOAuthService();