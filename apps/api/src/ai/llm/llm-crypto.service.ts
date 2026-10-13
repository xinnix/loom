import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';

/**
 * apiKey 落库加密：AES-256-GCM。
 *
 * 密文格式：`v1:<base64(iv 12B | authTag 16B | ciphertext)>`。
 * 版本前缀为将来轮换密钥预留。密钥来自 env AI_ENCRYPTION_KEY（32 字节，
 * 接受 hex/base64/原始字符串），缺失或长度错误时启动即抛错（fail closed）。
 */
const FORMAT_VERSION = 'v1';
export const AI_ENCRYPTION_KEY_ENV = 'AI_ENCRYPTION_KEY';

@Injectable()
export class LlmCryptoService {
  private readonly key: Buffer;

  constructor() {
    this.key = LlmCryptoService.loadKey();
  }

  /**
   * 静态工厂：供无 Nest DI 的场景（tRPC router 模块级组装）使用。
   * key 来自 env，实例无状态，重复构建开销可忽略。
   */
  static fromEnv(): LlmCryptoService {
    return new LlmCryptoService();
  }

  private static loadKey(): Buffer {
    const raw = process.env[AI_ENCRYPTION_KEY_ENV];
    if (!raw) {
      throw new Error(`${AI_ENCRYPTION_KEY_ENV} 环境变量未配置。生成方式：openssl rand -base64 32`);
    }
    // hex（64 字符）/ base64（44 字符带 padding）/ 原始 32 字节
    let key: Buffer | null = null;
    if (/^[0-9a-fA-F]{64}$/.test(raw)) {
      key = Buffer.from(raw, 'hex');
    } else if (/^[A-Za-z0-9+/]+={0,2}$/.test(raw) && raw.length === 44) {
      const decoded = Buffer.from(raw, 'base64');
      if (decoded.length === 32) key = decoded;
    } else if (Buffer.byteLength(raw, 'utf8') === 32) {
      key = Buffer.from(raw, 'utf8');
    }
    if (!key || key.length !== 32) {
      throw new Error(
        `${AI_ENCRYPTION_KEY_ENV} 必须是 32 字节密钥（hex 64 字符 / base64 / 原始字符串）。生成方式：openssl rand -base64 32`,
      );
    }
    return key;
  }

  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${FORMAT_VERSION}:${Buffer.concat([iv, authTag, ciphertext]).toString('base64')}`;
  }

  decrypt(encrypted: string): string {
    const [version, payload] = encrypted.split(':');
    if (version !== FORMAT_VERSION || !payload) {
      throw new Error(`apiKeyEnc 格式非法：期望 ${FORMAT_VERSION}:<base64>`);
    }
    const buf = Buffer.from(payload, 'base64');
    if (buf.length < 12 + 16 + 1) {
      throw new Error('apiKeyEnc 载荷过短，疑似损坏');
    }
    const iv = buf.subarray(0, 12);
    const authTag = buf.subarray(12, 28);
    const ciphertext = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  }

  /** 展示用掩码："sk-abcdefgh" → "sk-***efgh"（保留前 3 后 4） */
  static mask(plain: string): string {
    if (plain.length <= 8) return '***';
    return `${plain.slice(0, 3)}***${plain.slice(-4)}`;
  }

  /** 供单测注入与启动自检 */
  selfTest(): boolean {
    const probe = randomBytes(16).toString('hex');
    return timingSafeEqual(Buffer.from(this.decrypt(this.encrypt(probe))), Buffer.from(probe));
  }
}
