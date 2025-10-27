const axios = require('axios');
const crypto = require('crypto');
const paymentConfig = require('../config/payment');

class WechatOAuthService {
    constructor() {
        this.config = paymentConfig.wechat;
        this.oauthConfig = {
            authorizeUrl: 'https://open.weixin.qq.com/connect/qrconnect',
            accessTokenUrl: 'https://api.weixin.qq.com/sns/oauth2/access_token',
            userInfoUrl: 'https://api.weixin.qq.com/sns/userinfo'
        };
    }

    /**
     * 生成微信OAuth2授权URL
     * @param {string} redirectUri - 回调地址
     * @param {string} state - 状态参数（可选）
     * @returns {string} 授权URL
     */
    generateAuthUrl(redirectUri, state = '') {
        const params = new URLSearchParams({
            appid: this.config.appId,
            // do not double-encode; URLSearchParams will percent-encode values
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'snsapi_login',
            state: state
        });

        return `${this.oauthConfig.authorizeUrl}?${params.toString()}#wechat_redirect`;
    }

    /**
     * 使用授权码获取access_token
     * @param {string} code - 授权码
     * @returns {Promise<Object>} access_token信息
     */
    async getAccessToken(code) {
        try {
            // 检查是否为演示模式
            if (this.config.appId.startsWith('demo_') || this.config.appId === 'demo_wechat_app_id') {
                return {
                    access_token: 'demo_access_token_' + Date.now(),
                    expires_in: 7200,
                    refresh_token: 'demo_refresh_token_' + Date.now(),
                    openid: 'demo_openid_' + Date.now(),
                    scope: 'snsapi_login',
                    unionid: 'demo_unionid_' + Date.now()
                };
            }

            const response = await axios.get(this.oauthConfig.accessTokenUrl, {
                params: {
                    appid: this.config.appId,
                    secret: this.config.appSecret,
                    code: code,
                    grant_type: 'authorization_code'
                }
            });

            if (response.data.errcode) {
                throw new Error(`获取access_token失败: ${response.data.errmsg}`);
            }

            return response.data;
        } catch (error) {
            console.error('获取微信access_token失败:', error);
            throw error;
        }
    }

    /**
     * 获取用户信息
     * @param {string} accessToken - access_token
     * @param {string} openid - 用户openid
     * @returns {Promise<Object>} 用户信息
     */
    async getUserInfo(accessToken, openid) {
        try {
            // 检查是否为演示模式
            if (this.config.appId.startsWith('demo_') || this.config.appId === 'demo_wechat_app_id') {
                return {
                    openid: openid,
                    nickname: '微信用户',
                    sex: 1,
                    province: '北京',
                    city: '北京',
                    country: '中国',
                    headimgurl: 'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132',
                    privilege: [],
                    unionid: openid.replace('demo_openid_', 'demo_unionid_')
                };
            }

            const response = await axios.get(this.oauthConfig.userInfoUrl, {
                params: {
                    access_token: accessToken,
                    openid: openid,
                    lang: 'zh_CN'
                }
            });

            if (response.data.errcode) {
                throw new Error(`获取用户信息失败: ${response.data.errmsg}`);
            }

            return response.data;
        } catch (error) {
            console.error('获取微信用户信息失败:', error);
            throw error;
        }
    }

    /**
     * 完整的OAuth2登录流程
     * @param {string} code - 授权码
     * @returns {Promise<Object>} 登录结果
     */
    async oauthLogin(code) {
        try {
            // 1. 获取access_token
            const tokenInfo = await this.getAccessToken(code);
            
            // 2. 获取用户信息
            const userInfo = await this.getUserInfo(tokenInfo.access_token, tokenInfo.openid);
            
            // 3. 关联或创建本地用户账号
            const User = require('../models/User');
            const localUser = await User.findOrCreateByWechat(userInfo);
            
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
                        // 微信用户信息
                        wechat_user: {
                            openid: userInfo.openid,
                            unionid: userInfo.unionid,
                            nickname: userInfo.nickname,
                            avatar: userInfo.headimgurl,
                            gender: userInfo.sex,
                            province: userInfo.province,
                            city: userInfo.city,
                            country: userInfo.country
                        }
                    },
                    token: jwtToken,
                    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
                    tokenInfo: {
                        access_token: tokenInfo.access_token,
                        expires_in: tokenInfo.expires_in,
                        refresh_token: tokenInfo.refresh_token,
                        openid: tokenInfo.openid
                    }
                }
            };
        } catch (error) {
            console.error('微信OAuth2登录失败:', error);
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
        const jwt = require('jsonwebtoken');
        return jwt.sign(
            { userId },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
    }

    /**
     * 验证access_token是否有效
     * @param {string} accessToken - access_token
     * @param {string} openid - 用户openid
     * @returns {Promise<boolean>} 是否有效
     */
    async validateAccessToken(accessToken, openid) {
        try {
            const response = await axios.get('https://api.weixin.qq.com/sns/auth', {
                params: {
                    access_token: accessToken,
                    openid: openid
                }
            });

            return response.data.errcode === 0;
        } catch (error) {
            console.error('验证access_token失败:', error);
            return false;
        }
    }

    /**
     * 刷新access_token
     * @param {string} refreshToken - refresh_token
     * @returns {Promise<Object>} 新的token信息
     */
    async refreshAccessToken(refreshToken) {
        try {
            const response = await axios.get('https://api.weixin.qq.com/sns/oauth2/refresh_token', {
                params: {
                    appid: this.config.appId,
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken
                }
            });

            if (response.data.errcode) {
                throw new Error(`刷新access_token失败: ${response.data.errmsg}`);
            }

            return response.data;
        } catch (error) {
            console.error('刷新微信access_token失败:', error);
            throw error;
        }
    }
}

module.exports = new WechatOAuthService();