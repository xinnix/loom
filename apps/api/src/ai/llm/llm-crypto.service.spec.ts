import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { LlmCryptoService } from './llm-crypto.service';

const KEY_B64 = Buffer.alloc(32, 7).toString('base64');
const originalKey = process.env.AI_ENCRYPTION_KEY;

describe('LlmCryptoService', () => {
  beforeEach(() => {
    process.env.AI_ENCRYPTION_KEY = KEY_B64;
  });

  afterAll(() => {
    if (originalKey === undefined) delete process.env.AI_ENCRYPTION_KEY;
    else process.env.AI_ENCRYPTION_KEY = originalKey;
  });

  it('roundtrip：加解密还原明文', () => {
    const svc = new LlmCryptoService();
    const plain = 'sk-test-key-abc123';
    const encrypted = svc.encrypt(plain);
    expect(encrypted).toMatch(/^v1:[A-Za-z0-9+/]+=*$/);
    expect(svc.decrypt(encrypted)).toBe(plain);
  });

  it('同明文两次加密产生不同密文（随机 iv）', () => {
    const svc = new LlmCryptoService();
    expect(svc.encrypt('same')).not.toBe(svc.encrypt('same'));
  });

  it('篡改密文解密失败', () => {
    const svc = new LlmCryptoService();
    const encrypted = svc.encrypt('secret');
    const [, payload] = encrypted.split(':');
    const buf = Buffer.from(payload, 'base64');
    buf[buf.length - 1] ^= 0xff;
    const tampered = `v1:${buf.toString('base64')}`;
    expect(() => svc.decrypt(tampered)).toThrow();
  });

  it('错误格式密文抛出明确错误', () => {
    const svc = new LlmCryptoService();
    expect(() => svc.decrypt('no-version-prefix')).toThrow(/格式非法/);
    expect(() => svc.decrypt('v1:xxxx')).toThrow(/载荷过短/);
  });

  it('AI_ENCRYPTION_KEY 缺失时实例化抛错（fail closed）', () => {
    delete process.env.AI_ENCRYPTION_KEY;
    expect(() => new LlmCryptoService()).toThrow(/AI_ENCRYPTION_KEY 环境变量未配置/);
  });

  it('错误长度密钥实例化抛错', () => {
    process.env.AI_ENCRYPTION_KEY = 'short';
    expect(() => new LlmCryptoService()).toThrow(/32 字节/);
  });

  it('支持 hex 64 字符密钥', () => {
    process.env.AI_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString('hex');
    const svc = new LlmCryptoService();
    expect(svc.decrypt(svc.encrypt('x'))).toBe('x');
  });

  it('mask 保留前 3 后 4', () => {
    expect(LlmCryptoService.mask('sk-abcdefghijkl')).toBe('sk-***ijkl');
    expect(LlmCryptoService.mask('short')).toBe('***');
  });
});
