import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { Wechatpay, Formatter, Aes, Rsa } from 'wechatpay-axios-plugin';

/**
 * 微信支付服务（V3 API - 使用 wechatpay-axios-plugin）
 *
 * 功能：
 * - JSAPI 下单（小程序支付）
 * - 生成小程序支付参数
 * - 处理支付回调通知
 * - 发起退款
 * - 处理退款回调通知
 * - 查询订单状态
 *
 * 配置要求：
 * - WX_PAY_APP_ID: 小程序 AppID
 * - WX_PAY_MCH_ID: 商户号
 * - WX_PAY_API_KEY: API v3 密钥
 * - WX_PAY_SERIAL_NO: 商户 API 证书序列号
 * - WX_PAY_PRIVATE_KEY_PATH: 商户私钥路径
 * - WX_PAY_PUBLIC_KEY_ID: 微信支付公钥 ID（2024年Q3新增，推荐）
 * - WX_PAY_PUBLIC_KEY_PATH: 微信支付公钥路径（推荐）
 * - WX_PAY_NOTIFY_URL: 支付回调通知 URL
 * - WX_PAY_REFUND_NOTIFY_URL: 退款回调通知 URL（可选，默认使用支付回调地址）
 *
 * 注意：
 * - 2024年Q3起，微信支付官方推荐使用「微信支付公钥」替代「平台证书」
 * - 新商户仅需配置 WX_PAY_PUBLIC_KEY_ID 和 WX_PAY_PUBLIC_KEY_PATH
 * - 旧商户可继续使用平台证书模式，但推荐升级到公钥模式
 */
@Injectable()
export class WechatPayService implements OnModuleInit {
  private readonly logger = new Logger(WechatPayService.name);
  private wxpay: Wechatpay | null = null;
  private readonly appId: string;
  private readonly mchId: string;
  private readonly apiKey: string;
  private readonly serialNo: string;
  private readonly privateKeyPath: string;
  private readonly publicKeyId: string; // 微信支付公钥 ID（新）
  private readonly publicKeyPath: string; // 微信支付公钥路径（新）
  private readonly notifyUrl: string; // 支付回调地址
  private readonly refundNotifyUrl: string; // 退款回调地址
  private readonly sandbox: boolean;
  private isConfigured = false;

  constructor(private configService: ConfigService) {
    this.appId = this.configService.get<string>('WX_PAY_APP_ID') || '';
    this.mchId = this.configService.get<string>('WX_PAY_MCH_ID') || '';
    this.apiKey = this.configService.get<string>('WX_PAY_API_KEY') || '';
    this.serialNo = this.configService.get<string>('WX_PAY_SERIAL_NO') || '';
    this.privateKeyPath = this.configService.get<string>('WX_PAY_PRIVATE_KEY_PATH') || '';
    this.publicKeyId = this.configService.get<string>('WX_PAY_PUBLIC_KEY_ID') || ''; // 新增
    this.publicKeyPath = this.configService.get<string>('WX_PAY_PUBLIC_KEY_PATH') || '';
    this.notifyUrl = this.configService.get<string>('WX_PAY_NOTIFY_URL') || '';
    this.refundNotifyUrl =
      this.configService.get<string>('WX_PAY_REFUND_NOTIFY_URL') || this.notifyUrl; // 默认使用支付回调地址
    this.sandbox = this.configService.get<string>('WX_PAY_SANDBOX') === 'true';
  }

  onModuleInit() {
    if (!this.appId || !this.mchId || !this.apiKey || !this.serialNo) {
      this.logger.warn(
        '微信支付配置不完整（缺少 WX_PAY_APP_ID / WX_PAY_MCH_ID / WX_PAY_API_KEY / WX_PAY_SERIAL_NO），支付功能将不可用',
      );
      return;
    }

    const privateKey = this.readPrivateKey();
    if (!privateKey) {
      this.logger.warn(`微信支付商户私钥文件不存在或为空: ${this.privateKeyPath}`);
      return;
    }

    // 微信支付公钥模式（推荐）
    const publicKey = this.readPublicKey();
    const publicKeyId = this.publicKeyId;

    if (publicKey && publicKeyId) {
      // 使用微信支付公钥模式（2024年Q3新增，推荐）
      this.wxpay = new Wechatpay({
        mchid: this.mchId,
        serial: this.serialNo,
        privateKey: privateKey,
        certs: {
          [publicKeyId]: publicKey, // 微信支付公钥
        },
      });

      this.isConfigured = true;
      this.logger.log(
        `微信支付 V3 初始化成功 | 商户号: ${this.mchId} | 沙箱: ${this.sandbox} | 验签模式: 微信支付公钥（推荐）`,
      );
    } else {
      // 未配置微信支付公钥，支付功能不可用
      this.logger.warn(
        `未配置微信支付公钥（WX_PAY_PUBLIC_KEY_ID / WX_PAY_PUBLIC_KEY_PATH），支付功能将不可用`,
      );
      this.logger.warn(`请参考文档配置微信支付公钥: docs/product/prd.md (F5 微信支付)`);
      return;
    }
  }

  /**
   * 读取商户私钥文件
   */
  private readPrivateKey(): Buffer | null {
    try {
      const resolvedPath = path.resolve(this.privateKeyPath);
      if (!fs.existsSync(resolvedPath)) {
        return null;
      }
      return fs.readFileSync(resolvedPath);
    } catch (error) {
      this.logger.error('读取微信支付商户私钥失败', error);
      return null;
    }
  }

  /**
   * 读取微信支付公钥文件
   */
  private readPublicKey(): Buffer | null {
    try {
      if (!this.publicKeyPath) {
        return null;
      }
      const resolvedPath = path.resolve(this.publicKeyPath);
      if (!fs.existsSync(resolvedPath)) {
        return null;
      }
      return fs.readFileSync(resolvedPath);
    } catch (error) {
      this.logger.error('读取微信支付公钥失败', error);
      return null;
    }
  }

  /**
   * 检查支付是否已配置
   */
  private ensureConfigured() {
    if (!this.isConfigured || !this.wxpay) {
      throw new Error('微信支付未配置，请检查环境变量和证书文件');
    }
  }

  /**
   * JSAPI 下单（小程序支付）
   *
   * @returns prepay_id
   */
  async createOrder(params: {
    orderId: string;
    orderNo: string;
    amount: number;
    description: string;
    openid: string;
  }): Promise<string> {
    this.ensureConfigured();

    const { orderId, orderNo, amount, description, openid } = params;

    this.logger.log(
      `创建支付订单: ${orderNo}, 金额: ${amount}元, openid: ${openid.slice(0, 8)}...`,
    );

    try {
      const { data } = await this.wxpay!.v3.pay.transactions.jsapi.post({
        appid: this.appId,
        mchid: this.mchId,
        description,
        out_trade_no: orderNo,
        notify_url: this.notifyUrl,
        amount: {
          total: Math.round(amount * 100), // 微信支付金额单位为分
          currency: 'CNY',
        },
        payer: {
          openid,
        },
        attach: orderId, // 附加数据，回调时原样返回
      });

      const prepayId = (data as any).prepay_id;
      this.logger.log(`预支付订单创建成功: ${prepayId}`);

      return prepayId;
    } catch (error: any) {
      this.logger.error('创建支付订单失败', error.response?.data || error);
      throw new Error(`创建支付订单失败: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * 生成小程序调起支付所需的参数
   *
   * @param prepayId 预支付订单 ID
   * @returns 小程序 wx.requestPayment 所需参数
   */
  getPayParams(prepayId: string): {
    timeStamp: string;
    nonceStr: string;
    package: string;
    signType: string;
    paySign: string;
  } {
    this.ensureConfigured();

    // 使用 SDK 的工具类生成签名
    const appId = this.appId;
    const timeStamp = `${Formatter.timestamp()}`;
    const nonceStr = Formatter.nonce();
    const packageStr = `prepay_id=${prepayId}`;
    const signType = 'RSA';

    // 读取商户私钥用于签名
    // 使用 file:// 协议加载私钥文件
    const privateKey = Rsa.from(
      `file://${path.resolve(this.privateKeyPath)}`,
      Rsa.KEY_TYPE_PRIVATE,
    );

    // 生成签名
    const paySign = Rsa.sign(
      Formatter.joinedByLineFeed(appId, timeStamp, nonceStr, packageStr),
      privateKey,
    );

    return {
      timeStamp,
      nonceStr,
      package: packageStr,
      signType,
      paySign,
    };
  }

  /**
   * 处理支付回调通知
   *
   * @param body 回调请求体（原始 JSON 字符串）
   * @param headers 请求头（包含微信签名信息）
   * @returns 解密后的支付结果
   */
  async handleCallback(
    body: string,
    headers: {
      'wechatpay-timestamp'?: string;
      'wechatpay-nonce'?: string;
      'wechatpay-signature'?: string;
      'wechatpay-serial'?: string;
    },
  ): Promise<{
    success: boolean;
    orderId: string;
    orderNo: string;
    transactionId: string;
    amount: number;
    paidAt: Date;
  }> {
    this.ensureConfigured();

    // SDK 会自动验签，直接解析 JSON
    const notification = JSON.parse(body);
    const { resource } = notification;

    // 解密回调数据（使用 AES-256-GCM）
    const decrypted = Aes.AesGcm.decrypt(
      resource.ciphertext,
      this.apiKey,
      resource.nonce,
      resource.associated_data,
    );

    const payment = JSON.parse(decrypted.toString());

    this.logger.log(
      `支付回调: 订单 ${payment.out_trade_no}, 交易号 ${payment.transaction_id}, 状态 ${payment.trade_state}`,
    );

    if (payment.trade_state !== 'SUCCESS') {
      this.logger.warn(`支付未成功: ${payment.trade_state}`);
      throw new Error(`支付状态非成功: ${payment.trade_state}`);
    }

    return {
      success: true,
      orderId: payment.attach, // 创建订单时传入的 orderId
      orderNo: payment.out_trade_no,
      transactionId: payment.transaction_id,
      amount: payment.amount.total, // 分
      paidAt: new Date(payment.success_time),
    };
  }

  /**
   * 处理退款回调通知
   *
   * @param body 回调请求体（原始 JSON 字符串）
   * @param headers 请求头（包含微信签名信息）
   * @returns 解密后的退款结果
   */
  async handleRefundCallback(
    body: string,
    headers: {
      'wechatpay-timestamp'?: string;
      'wechatpay-nonce'?: string;
      'wechatpay-signature'?: string;
      'wechatpay-serial'?: string;
    },
  ): Promise<{
    orderId: string;
    orderNo: string;
    refundId: string;
    refundNo: string;
    refundStatus: string;
    refundedAt?: Date;
    amount: {
      total: number;
      refund: number;
      payerTotal: number;
      payerRefund: number;
    };
  }> {
    this.ensureConfigured();

    // SDK 会自动验签，直接解析 JSON
    const notification = JSON.parse(body);
    const { resource } = notification;

    this.logger.log(`退款回调通知: 类型 ${notification.event_type}, 摘要 ${notification.summary}`);

    // 解密回调数据（使用 AES-256-GCM）
    const decrypted = Aes.AesGcm.decrypt(
      resource.ciphertext,
      this.apiKey,
      resource.nonce,
      resource.associated_data,
    );

    const refund = JSON.parse(decrypted.toString());

    this.logger.log(
      `退款回调: 订单 ${refund.out_trade_no}, 退款单号 ${refund.out_refund_no}, 微信退款ID ${refund.refund_id}, 状态 ${refund.refund_status}`,
    );

    // 检查退款状态
    if (refund.refund_status !== 'SUCCESS') {
      this.logger.warn(`退款未成功: ${refund.refund_status}`);
      // 对于非成功状态，仍然返回数据，让业务层决定如何处理
    }

    return {
      orderId: refund.out_trade_no, // 订单号（需要业务层查询对应的订单ID）
      orderNo: refund.out_trade_no,
      refundId: refund.refund_id, // 微信退款单号
      refundNo: refund.out_refund_no, // 商户退款单号
      refundStatus: refund.refund_status, // SUCCESS, CLOSED, PROCESSING, ABNORMAL
      refundedAt: refund.success_time ? new Date(refund.success_time) : undefined,
      amount: {
        total: refund.amount.total, // 原订单金额（分）
        refund: refund.amount.refund, // 退款金额（分）
        payerTotal: refund.amount.payer_total, // 用户实际支付金额（分）
        payerRefund: refund.amount.payer_refund, // 用户退款金额（分）
      },
    };
  }

  /**
   * 发起退款
   */
  async refund(params: {
    orderNo: string;
    refundNo: string;
    totalAmount: number;
    refundAmount: number;
    reason?: string;
  }): Promise<string> {
    this.ensureConfigured();

    const { orderNo, refundNo, totalAmount, refundAmount, reason } = params;

    this.logger.log(`发起退款: 订单 ${orderNo}, 退款 ${refundAmount}元, 原因: ${reason}`);

    try {
      const { data } = await this.wxpay!.v3.refund.domestic.refunds.post({
        out_trade_no: orderNo,
        out_refund_no: refundNo,
        amount: {
          refund: Math.round(refundAmount * 100),
          total: Math.round(totalAmount * 100),
          currency: 'CNY',
        },
        reason: reason || '用户申请退款',
        notify_url: this.refundNotifyUrl, // 使用独立的退款回调地址
      });

      this.logger.log(`退款请求成功: 退款单号 ${refundNo}, 退款ID ${(data as any).refund_id}`);
      return (data as any).refund_id;
    } catch (error: any) {
      this.logger.error('退款请求失败', error.response?.data || error);
      throw new Error(`退款请求失败: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * 查询订单支付状态
   */
  async queryOrder(orderNo: string): Promise<{
    status: 'SUCCESS' | 'NOTPAY' | 'CLOSED' | 'USERPAYING' | 'PAYERROR';
    transactionId?: string;
    paidAt?: Date;
  }> {
    this.ensureConfigured();

    this.logger.log(`查询订单支付状态: ${orderNo}`);

    try {
      const { data } = await this.wxpay!.v3.pay.transactions.outTradeNo[orderNo].get({
        params: {
          mchid: this.mchId,
        },
      });

      return {
        status: data.trade_state as any,
        transactionId: data.transaction_id,
        paidAt: data.success_time ? new Date(data.success_time) : undefined,
      };
    } catch (error: any) {
      this.logger.error('查询订单状态失败', error.response?.data || error);
      throw new Error(`查询订单状态失败: ${error.response?.data?.message || error.message}`);
    }
  }
}
