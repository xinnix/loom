import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createPrismaMock } from '../../test/prisma-mock';
import { LlmConfigService } from './llm-config.service';
import { LlmCryptoService } from './llm-crypto.service';

const KEY_B64 = Buffer.alloc(32, 7).toString('base64');
const originalEnv = { ...process.env };

describe('LlmConfigService', () => {
  let prisma: any;
  let service: LlmConfigService;
  let crypto: LlmCryptoService;

  beforeEach(() => {
    process.env.AI_ENCRYPTION_KEY = KEY_B64;
    delete process.env.LLM_API_KEY;
    prisma = createPrismaMock();
    crypto = new LlmCryptoService();
    service = new LlmConfigService(prisma, crypto);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const row = (overrides: Record<string, unknown> = {}) => ({
    configKey: 'deepseek-main',
    name: 'DeepSeek 生产',
    provider: 'openai',
    apiUrl: 'https://api.deepseek.com/v1',
    apiKeyEnc: crypto.encrypt('sk-live-9999'),
    model: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 4096,
    timeoutMs: 60_000,
    maxRetries: 1,
    isActive: true,
    ...overrides,
  });

  it('resolveByRef 按 configKey 解密返回', async () => {
    prisma.llmConfig.findFirst.mockResolvedValue(row());
    const resolved = await service.resolveByRef({ configKey: 'deepseek-main' });
    expect(resolved.apiKey).toBe('sk-live-9999');
    expect(resolved.model).toBe('deepseek-chat');
    expect(resolved.configKey).toBe('deepseek-main');
  });

  it('resolveByRef 未找到抛 AI_CONFIG_NOT_FOUND', async () => {
    prisma.llmConfig.findFirst.mockResolvedValue(null);
    await expect(service.resolveByRef({ configKey: 'ghost' })).rejects.toMatchObject({
      errorCode: 'ERR_6004',
    });
  });

  it('isActive=false 的配置视为不存在', async () => {
    prisma.llmConfig.findFirst.mockResolvedValue(null); // where isActive:true 过滤后无结果
    await expect(service.resolveByRef({ configKey: 'x' })).rejects.toMatchObject({
      errorCode: 'ERR_6004',
    });
  });

  it('resolveDefault 走 isDefault 行', async () => {
    prisma.llmConfig.findFirst.mockResolvedValue(row({ configKey: 'default-one' }));
    const resolved = await service.resolveDefault();
    expect(resolved.configKey).toBe('default-one');
    expect(prisma.llmConfig.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isDefault: true, isActive: true }),
      }),
    );
  });

  it('resolveDefault 无 isDefault 行时回退 env 配置', async () => {
    prisma.llmConfig.findFirst.mockResolvedValue(null);
    process.env.LLM_API_KEY = 'sk-env-fallback';
    process.env.LLM_API_URL = 'https://api.example.com/v1';
    process.env.LLM_MODEL = 'test-model';
    const resolved = await service.resolveDefault();
    expect(resolved.configKey).toBe('env-default');
    expect(resolved.apiKey).toBe('sk-env-fallback');
    expect(resolved.model).toBe('test-model');
  });

  it('resolveDefault 无 isDefault 且无 env 时抛业务错误', async () => {
    prisma.llmConfig.findFirst.mockResolvedValue(null);
    await expect(service.resolveDefault()).rejects.toMatchObject({
      errorCode: 'ERR_6004',
    });
  });
});
